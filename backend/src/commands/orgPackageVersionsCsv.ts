/// <reference path="../types/yarnpkg-lockfile.d.ts" />
import path from 'node:path';
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { Octokit } from '@octokit/rest';
import { parse as parseYarnLock } from '@yarnpkg/lockfile';

function isOctokitNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status: unknown }).status === 404
  );
}

type CsvRow = {
  repoUrl: string;
  lockfilePath: string;
  packageName: string;
  version: string;
};

/** lockfile 上のパッケージ名 → CSV の表示名（主要パッケージのみ出力） */
const TARGET_PACKAGES = new Map<string, string>([
  ['node', 'Node.js'],
  ['@types/node', 'Node.js'],
  ['php', 'PHP'],
  ['typescript', 'TypeScript'],
  ['react', 'React'],
  ['next', 'Next.js'],
  ['vue', 'Vue.js'],
  ['nuxt', 'Nuxt.js'],
  ['nuxt3', 'Nuxt.js'],
  ['react-native', 'React Native'],
  ['expo', 'Expo SDK'],
  ['vuetify', 'Vuetify'],
  ['element-plus', 'element-plus'],
  ['laravel/framework', 'Laravel'],
  ['express', 'Express'],
  ['@nestjs/core', 'NestJS'],
  ['@nestjs/common', 'NestJS'],
  ['vite', 'Vite'],
  ['webpack', 'webpack'],
  ['axios', 'axios'],
]);

type Repo = {
  name: string;
  htmlUrl: string;
};

/** yarn.lock 等で同一 package@version が複数ブロックに現れるため、CSV 前に重複除去 */
function dedupeCsvRows(rows: CsvRow[]): CsvRow[] {
  const seen = new Set<string>();
  const out: CsvRow[] = [];
  for (const r of rows) {
    const key = `${r.repoUrl}\0${r.lockfilePath}\0${r.packageName}\0${r.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

async function main() {
  const org = process.argv[2];
  const targetRepoName = process.argv[3];

  if (!org) {
    console.error('❌ Usage: yarn org:package-versions <org> [repo]');
    console.error(
      '   default branch のツリーを列挙し、ディレクトリ単位で lock → manifest の優先で解析（TARGET_PACKAGES のみ CSV、clone なし）。'
    );
    process.exit(1);
  }

  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GITHUB_API_KEY?.trim() || undefined;
  if (!token) {
    console.warn('⚠️ GITHUB_TOKEN / GITHUB_API_KEY not set; public repos only (lower API rate limits, private repos may fail).');
  }

  const octokit = new Octokit(token ? { auth: token } : {});

  let repos: Repo[];
  if (targetRepoName) {
    try {
      repos = [await getRepo(octokit, org, targetRepoName)];
    } catch (error) {
      if (isOctokitNotFound(error)) {
        console.error(`❌ Repository not found: ${org}/${targetRepoName}`);
        console.error('   URL を確認してください。非公開の場合は .env に GITHUB_API_KEY（または GITHUB_TOKEN）を設定してください。');
        process.exitCode = 1;
        return;
      }
      throw error;
    }
  } else {
    repos = await listOrgRepos(octokit, org);
  }

  if (repos.length === 0) {
    console.log('No repositories found.');
    return;
  }

  console.log('🌐 GitHub API のみ（clone なし）');
  console.log(`🔍 target repos: ${repos.length}`);

  const rows: CsvRow[] = [];

  for (const repo of repos) {
    console.log(`\n=== ${repo.name} ===`);

    try {
      const parsed = await collectRowsFromRepoViaApi(octokit, org, repo.name, repo.htmlUrl);
      if (parsed.length === 0) {
        console.log('  - lockfile / package.json / composer.json から依存を取得できませんでした');
      } else {
        rows.push(...parsed);
      }
    } catch (error) {
      console.error(`  ❌ failed: ${repo.name}`);
      console.error(error);
    }
  }

  const outputPath = path.resolve(process.cwd(), `package-versions-${org}${targetRepoName ? `-${targetRepoName}` : ''}.csv`);

  const rowsDeduped = dedupeCsvRows(rows);

  const rowsFiltered = rowsDeduped
    .filter((r) => TARGET_PACKAGES.has(r.packageName))
    .map((r) => ({
      ...r,
      packageName: TARGET_PACKAGES.get(r.packageName)!,
    }));

  if (rowsDeduped.length > 0 && rowsFiltered.length === 0) {
    console.warn('⚠️ 依存は取得できましたが、TARGET_PACKAGES に該当するパッケージがありませんでした。');
  }

  await writeCsv(outputPath, rowsFiltered);

  console.log(`\n✅ CSV written: ${outputPath}`);
  console.log(`📄 rows (主要パッケージのみ): ${rowsFiltered.length}`);
}

async function listOrgRepos(octokit: Octokit, org: string): Promise<Repo[]> {
  const repos = await octokit.paginate(octokit.repos.listForOrg, {
    org,
    per_page: 100, // eslint-disable-line @typescript-eslint/naming-convention
    type: 'all',
  });

  return repos.map((repo) => ({
    name: repo.name,
    htmlUrl: repo.html_url,
  }));
}

async function getRepo(octokit: Octokit, org: string, repo: string): Promise<Repo> {
  const res = await octokit.repos.get({
    owner: org,
    repo,
  });

  return {
    name: res.data.name,
    htmlUrl: res.data.html_url,
  };
}

/**
 * 依存取得（1 リポジトリ・default branch）
 *
 * 1. 再帰 git/trees で blob を列挙し、次の 5 種類に該当するパスだけ拾う:
 *    package-lock.json / yarn.lock / composer.lock / package.json / composer.json
 * 2. パスを「ディレクトリ」にグループ化（例: apps/web/package.json → キー apps/web）
 * 3. 各ディレクトリで **npm 系** と **PHP 系**は独立してソースを 1 つ選ぶ:
 *    - npm: package-lock.json → あればそれ。なければ yarn.lock → なければ package.json
 *    - PHP: composer.lock → なければ composer.json
 * 4. 選んだファイルだけ Blob 取得してパース
 */
async function collectRowsFromRepoViaApi(
  octokit: Octokit,
  owner: string,
  repoName: string,
  htmlUrl: string
): Promise<CsvRow[]> {
  const entries = await fetchDefaultBranchTreeEntries(octokit, owner, repoName);
  if (!entries) {
    return [];
  }

  const byDir = groupManifestFilesByDirectory(entries);
  const rows: CsvRow[] = [];

  const dirKeys = [...byDir.keys()].sort((a, b) => a.localeCompare(b));

  for (const dirKey of dirKeys) {
    const bucket = byDir.get(dirKey)!;
    const dirLabel = dirKey === '' ? '.' : dirKey;

    const npmSource = pickNpmSource(bucket);
    if (npmSource) {
      const { entry, kind } = npmSource;
      console.log(`  - [${dirLabel}] npm (${kind}): ${entry.path}`);
      try {
        const raw = await getBlobUtf8(octokit, owner, repoName, entry.sha!);
        if (kind === 'package-lock.json') {
          rows.push(...parsePackageLockString(raw, htmlUrl, entry.path!));
        } else if (kind === 'yarn.lock') {
          rows.push(...parseYarnLockString(raw, htmlUrl, entry.path!));
        } else {
          rows.push(...parsePackageJsonString(raw, htmlUrl, entry.path!));
        }
      } catch (error) {
        console.warn(`  ⚠️ skip ${entry.path}:`, error instanceof Error ? error.message : error);
      }
    }

    const phpSource = pickPhpSource(bucket);
    if (phpSource) {
      const { entry, kind } = phpSource;
      console.log(`  - [${dirLabel}] php (${kind}): ${entry.path}`);
      try {
        const raw = await getBlobUtf8(octokit, owner, repoName, entry.sha!);
        if (kind === 'composer.lock') {
          rows.push(...parseComposerLockString(raw, htmlUrl, entry.path!));
        } else {
          rows.push(...parseComposerJsonString(raw, htmlUrl, entry.path!));
        }
      } catch (error) {
        console.warn(`  ⚠️ skip ${entry.path}:`, error instanceof Error ? error.message : error);
      }
    }
  }

  return rows;
}

type TreeEntry = NonNullable<Awaited<ReturnType<Octokit['git']['getTree']>>['data']['tree']>[number];

type ManifestBasename =
  | 'package-lock.json'
  | 'yarn.lock'
  | 'composer.lock'
  | 'package.json'
  | 'composer.json';

type DirManifestBucket = Partial<Record<ManifestBasename, TreeEntry>>;

function isUnderIgnoredVendorPath(filePath: string): boolean {
  return filePath.includes('node_modules/') || filePath.includes('vendor/');
}

/** ツリー上の該当ファイルをディレクトリごとにまとめる（ルートはキー ''） */
function groupManifestFilesByDirectory(entries: TreeEntry[]): Map<string, DirManifestBucket> {
  const names = new Set<ManifestBasename>([
    'package-lock.json',
    'yarn.lock',
    'composer.lock',
    'package.json',
    'composer.json',
  ]);

  const map = new Map<string, DirManifestBucket>();

  for (const e of entries) {
    if (e.type !== 'blob' || !e.path || !e.sha || isUnderIgnoredVendorPath(e.path)) continue;

    const posixPath = e.path.replace(/\\/g, '/');
    const base = path.posix.basename(posixPath) as ManifestBasename;
    if (!names.has(base)) continue;

    const dirKey = posixDirKey(posixPath);
    if (!map.has(dirKey)) {
      map.set(dirKey, {});
    }
    const bucket = map.get(dirKey)!;
    bucket[base] = e;
  }

  return map;
}

function posixDirKey(filePath: string): string {
  const d = path.posix.dirname(filePath);
  return d === '.' ? '' : d;
}

function pickNpmSource(bucket: DirManifestBucket): { entry: TreeEntry; kind: ManifestBasename } | null {
  if (bucket['package-lock.json']) {
    return { entry: bucket['package-lock.json'], kind: 'package-lock.json' };
  }
  if (bucket['yarn.lock']) {
    return { entry: bucket['yarn.lock'], kind: 'yarn.lock' };
  }
  if (bucket['package.json']) {
    return { entry: bucket['package.json'], kind: 'package.json' };
  }
  return null;
}

function pickPhpSource(bucket: DirManifestBucket): { entry: TreeEntry; kind: ManifestBasename } | null {
  if (bucket['composer.lock']) {
    return { entry: bucket['composer.lock'], kind: 'composer.lock' };
  }
  if (bucket['composer.json']) {
    return { entry: bucket['composer.json'], kind: 'composer.json' };
  }
  return null;
}

async function fetchDefaultBranchTreeEntries(
  octokit: Octokit,
  owner: string,
  repoName: string
): Promise<TreeEntry[] | null> {
  const { data: repoMeta } = await octokit.repos.get({ owner, repo: repoName });
  const defaultBranch = repoMeta.default_branch;
  if (!defaultBranch) {
    console.log('  - no default branch');
    return null;
  }

  let commitSha: string;
  try {
    const ref = await octokit.git.getRef({
      owner,
      repo: repoName,
      ref: `heads/${defaultBranch}`,
    });
    commitSha = ref.data.object.sha;
  } catch (error) {
    if (isOctokitNotFound(error)) {
      console.log('  - no branch ref (empty repo?)');
      return null;
    }
    throw error;
  }

  const commit = await octokit.git.getCommit({
    owner,
    repo: repoName,
    commit_sha: commitSha, // eslint-disable-line @typescript-eslint/naming-convention
  });
  const treeSha = commit.data.tree.sha;

  const tree = await octokit.git.getTree({
    owner,
    repo: repoName,
    tree_sha: treeSha, // eslint-disable-line @typescript-eslint/naming-convention
    recursive: '1',
  });

  if (tree.data.truncated) {
    console.warn('  ⚠️ git tree truncated; some files may be missing');
  }

  return tree.data.tree ?? [];
}

async function getBlobUtf8(octokit: Octokit, owner: string, repoName: string, fileSha: string): Promise<string> {
  const blob = await octokit.git.getBlob({
    owner,
    repo: repoName,
    file_sha: fileSha, // eslint-disable-line @typescript-eslint/naming-convention
  });
  return Buffer.from(blob.data.content, 'base64').toString('utf8');
}

function parsePackageJsonString(raw: string, repoUrl: string, relPath: string): CsvRow[] {
  const json = JSON.parse(raw) as Record<string, unknown>;
  const rows: CsvRow[] = [];

  const engines = json.engines;
  if (engines && typeof engines === 'object') {
    const nodeRange = (engines as { node?: string }).node;
    if (typeof nodeRange === 'string' && nodeRange) {
      rows.push({
        repoUrl,
        lockfilePath: relPath,
        packageName: 'node',
        version: nodeRange,
      });
    }
  }

  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'] as const) {
    const block = json[key];
    if (!block || typeof block !== 'object') continue;
    for (const [packageName, ver] of Object.entries(block as Record<string, unknown>)) {
      if (typeof ver !== 'string' || !ver) continue;
      rows.push({
        repoUrl,
        lockfilePath: relPath,
        packageName,
        version: ver,
      });
    }
  }

  return rows;
}

function parseComposerJsonString(raw: string, repoUrl: string, relPath: string): CsvRow[] {
  const json = JSON.parse(raw) as Record<string, unknown>;
  const rows: CsvRow[] = [];

  const platform = json.platform;
  if (platform && typeof platform === 'object') {
    const phpConstraint = (platform as Record<string, unknown>)['php'];
    if (typeof phpConstraint === 'string' && phpConstraint) {
      rows.push({
        repoUrl,
        lockfilePath: relPath,
        packageName: 'php',
        version: phpConstraint,
      });
    }
  }

  for (const key of ['require', 'require-dev'] as const) {
    const block = json[key];
    if (!block || typeof block !== 'object') continue;
    for (const [packageName, ver] of Object.entries(block as Record<string, unknown>)) {
      if (typeof ver !== 'string' || !ver) continue;
      rows.push({
        repoUrl,
        lockfilePath: relPath,
        packageName,
        version: ver,
      });
    }
  }

  return rows;
}

function parsePackageLockString(raw: string, repoUrl: string, relLockfilePath: string): CsvRow[] {
  const json = JSON.parse(raw) as Record<string, unknown>;

  const rows: CsvRow[] = [];

  if (json.packages && typeof json.packages === 'object') {
    const pkgs = json.packages as Record<string, unknown>;
    const rootPkg = pkgs[''];
    if (rootPkg && typeof rootPkg === 'object') {
      const engines = (rootPkg as { engines?: { node?: string } }).engines;
      const nodeRange = engines?.node;
      if (typeof nodeRange === 'string' && nodeRange) {
        rows.push({
          repoUrl,
          lockfilePath: relLockfilePath,
          packageName: 'node',
          version: nodeRange,
        });
      }
    }

    for (const [pkgPath, pkgInfo] of Object.entries(pkgs)) {
      if (!pkgPath || !pkgPath.startsWith('node_modules/')) continue;
      if (!pkgInfo || typeof pkgInfo !== 'object') continue;

      const packageName = pkgPath.replace(/^node_modules\//, '');
      const version = typeof (pkgInfo as { version?: string }).version === 'string' ? (pkgInfo as { version: string }).version : '';

      if (!packageName || !version) continue;

      rows.push({
        repoUrl,
        lockfilePath: relLockfilePath,
        packageName,
        version,
      });
    }

    return rows;
  }

  if (json.dependencies && typeof json.dependencies === 'object') {
    collectPackageLockV1Deps(json.dependencies as Record<string, unknown>, rows, repoUrl, relLockfilePath);
  }

  return rows;
}

function collectPackageLockV1Deps(
  dependencies: Record<string, unknown>,
  rows: CsvRow[],
  repoUrl: string,
  relLockfilePath: string
) {
  for (const [packageName, info] of Object.entries(dependencies)) {
    const rec = info as { version?: string; dependencies?: Record<string, unknown> } | undefined;
    const version = typeof rec?.version === 'string' ? rec.version : '';

    if (packageName && version) {
      rows.push({
        repoUrl,
        lockfilePath: relLockfilePath,
        packageName,
        version,
      });
    }

    if (rec?.dependencies && typeof rec.dependencies === 'object') {
      collectPackageLockV1Deps(rec.dependencies as Record<string, unknown>, rows, repoUrl, relLockfilePath);
    }
  }
}

function parseComposerLockString(raw: string, repoUrl: string, relLockfilePath: string): CsvRow[] {
  const json = JSON.parse(raw) as Record<string, unknown>;
  const rows: CsvRow[] = [];

  for (const platformKey of ['platform', 'platform-dev'] as const) {
    const plat = json[platformKey];
    if (!plat || typeof plat !== 'object') continue;
    const phpConstraint = (plat as Record<string, unknown>)['php'];
    if (typeof phpConstraint === 'string' && phpConstraint) {
      rows.push({
        repoUrl,
        lockfilePath: relLockfilePath,
        packageName: 'php',
        version: phpConstraint,
      });
    }
  }

  for (const key of ['packages', 'packages-dev'] as const) {
    const arr = json[key];
    if (!Array.isArray(arr)) continue;

    for (const pkg of arr) {
      if (!pkg || typeof pkg !== 'object') continue;
      const rec = pkg as { name?: string; version?: string };
      const packageName = typeof rec.name === 'string' ? rec.name : '';
      const version = typeof rec.version === 'string' ? rec.version : '';
      if (!packageName || !version) continue;

      rows.push({
        repoUrl,
        lockfilePath: relLockfilePath,
        packageName,
        version,
      });
    }
  }

  return rows;
}

function parseYarnLockString(raw: string, repoUrl: string, relLockfilePath: string): CsvRow[] {
  const parsed = parseYarnLock(raw);

  if (parsed.type !== 'success' || !parsed.object) {
    throw new Error(`Failed to parse yarn.lock: ${relLockfilePath}`);
  }

  const rows: CsvRow[] = [];

  for (const [selector, info] of Object.entries(parsed.object as Record<string, { version?: string }>)) {
    const version = typeof info?.version === 'string' ? info.version : '';
    if (!version) continue;

    const packageNames = extractPackageNamesFromYarnSelector(selector);

    for (const packageName of packageNames) {
      rows.push({
        repoUrl,
        lockfilePath: relLockfilePath,
        packageName,
        version,
      });
    }
  }

  return rows;
}

function extractPackageNamesFromYarnSelector(selector: string): string[] {
  const selectors = selector.split(',').map((s) => s.trim());
  const names = new Set<string>();

  for (const item of selectors) {
    const packageName = extractPackageNameFromSingleYarnSelector(item);
    if (packageName) {
      names.add(packageName);
    }
  }

  return [...names];
}

function extractPackageNameFromSingleYarnSelector(selector: string): string | null {
  const unquoted = selector.replace(/^"|"$/g, '');

  if (unquoted.startsWith('@')) {
    const secondAt = unquoted.indexOf('@', 1);
    if (secondAt <= 1) return null;
    return unquoted.slice(0, secondAt);
  }

  const firstAt = unquoted.indexOf('@');
  if (firstAt <= 0) return null;

  return unquoted.slice(0, firstAt);
}

async function writeCsv(outputPath: string, rows: CsvRow[]) {
  const header = ['repourl', 'lockfile-path', 'package名', 'version'];

  const lines = [header.join(',')];

  for (const row of rows) {
    lines.push([csvEscape(row.repoUrl), csvEscape(row.lockfilePath), csvEscape(row.packageName), csvEscape(row.version)].join(','));
  }

  await fs.promises.writeFile(outputPath, lines.join('\n'), 'utf8');
}

function csvEscape(value: string): string {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

main().catch((error) => {
  console.error('❌ Unexpected error');
  console.error(error);
  process.exit(1);
});

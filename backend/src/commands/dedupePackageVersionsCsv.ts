import fs from 'node:fs';

/**
 * package-versions CSV（repourl, lockfile-path, package名, version）の重複行を削除する。
 * orgPackageVersionsCsv の dedupeCsvRows と同じキー（4 列）で判定。
 *
 * Usage: yarn dedupe:package-versions-csv <path-to.csv>
 */
function parseFourColumnLine(line: string): [string, string, string, string] | null {
  if (!line.startsWith('"') || !line.endsWith('"')) {
    return null;
  }
  const inner = line.slice(1, -1);
  const parts = inner.split('","');
  if (parts.length !== 4) {
    return null;
  }
  return parts.map((p) => p.replace(/""/g, '"')) as [string, string, string, string];
}

function dedupeCsvContent(content: string): { out: string; removed: number; kept: number } {
  const lines = content.split(/\r?\n/);
  const header = lines[0];
  if (!header) {
    throw new Error('empty file');
  }

  const seen = new Set<string>();
  const body: string[] = [];
  let removed = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      continue;
    }

    const parsed = parseFourColumnLine(line);
    if (!parsed) {
      body.push(line);
      continue;
    }

    const [repoUrl, lockfilePath, pkg, ver] = parsed;
    const key = `${repoUrl}\0${lockfilePath}\0${pkg}\0${ver}`;
    if (seen.has(key)) {
      removed++;
      continue;
    }
    seen.add(key);
    body.push(line);
  }

  const out = [header, ...body].join('\n') + (body.length > 0 || header ? '\n' : '');
  return { out, removed, kept: body.length };
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('❌ Usage: yarn dedupe:package-versions-csv <path-to.csv>');
    process.exit(1);
  }

  const content = await fs.promises.readFile(csvPath, 'utf8');
  const { out, removed, kept } = dedupeCsvContent(content);
  await fs.promises.writeFile(csvPath, out, 'utf8');

  console.log(`✅ ${csvPath}`);
  console.log(`   データ行: ${kept}（重複削除 ${removed} 行）`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

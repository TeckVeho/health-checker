import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 指定された GitHub リポジトリをローカルに clone または pull する
 * GITHUB_WORKSPACE に直接 clone される（サブディレクトリは作られない）
 *
 * @param owner GitHub アカウント名
 * @param repo リポジトリ名
 * @returns clone/pull されたローカルパス
 */
export async function cloneRepo(owner: string, repo: string): Promise<string> {
  const workspace = process.env.GITHUB_WORKSPACE;
  if (!workspace) {
    throw new Error('GITHUB_WORKSPACE is required');
  }

  const targetPath = workspace; // サブディレクトリは作らない
  const gitUrl = `https://github.com/${owner}/${repo}.git`;

  try {
    await fs.access(path.join(targetPath, '.git'));

    const configPath = path.join(targetPath, '.git', 'config');
    const configText = await fs.readFile(configPath, 'utf-8');

    if (configText.includes(gitUrl)) {
      console.log(`🔄 Repository exists and matches. Pulling: ${targetPath}`);
      await execAsync(`git -C "${targetPath}" pull`);
      return targetPath;
    } else {
      console.log(`🗑 Removing mismatched repository at: ${targetPath}`);
      await fs.rm(targetPath, { recursive: true, force: true });
    }
  } catch {
    // .git が存在しない or 読み取り不可 → clone へ
  }

  await fs.mkdir(targetPath, { recursive: true });
  console.log(`📥 Cloning ${gitUrl} to ${targetPath}`);
  await execAsync(`git clone ${gitUrl} "${targetPath}"`);
  console.log(`✅ Cloned to: ${targetPath}`);

  return targetPath;
}

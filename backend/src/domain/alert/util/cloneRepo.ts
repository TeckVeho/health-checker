import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 指定された GitHub リポジトリをローカルに clone または pull する
 * GITHUB_LOCAL_WORKSPACE 配下に owner/repo のディレクトリ構造で保存
 *
 * @param owner GitHub アカウント名
 * @param repo リポジトリ名
 * @returns clone/pull されたローカルパス
 */
export async function cloneRepo(owner: string, repo: string): Promise<string> {
  const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
  if (!workspace) {
    throw new Error('GITHUB_LOCAL_WORKSPACE is required');
  }

  // owner/repo のディレクトリ構造を作成
  const targetPath = path.join(workspace, owner, repo);
  const gitUrl = `https://github.com/${owner}/${repo}.git`;

  try {
    // .gitディレクトリの存在確認
    await fs.access(path.join(targetPath, '.git'));

    // 既存のリポジトリの設定を確認
    const configPath = path.join(targetPath, '.git', 'config');
    const configText = await fs.readFile(configPath, 'utf-8');

    if (configText.includes(gitUrl)) {
      // 同じリポジトリなら fetch して pull を実行
      console.log(`🔄 Repository exists and matches. Fetching and pulling: ${targetPath}`);
      try {
        // まずリモートの最新情報を取得
        await execAsync(`git -C "${targetPath}" fetch --all`);
        await execAsync(`git -C "${targetPath}" pull`);
      } catch (pullError) {
        console.warn(`⚠️ Pull failed, attempting to reset and pull: ${pullError}`);
        // pull が失敗した場合、変更を破棄して再度 fetch & pull
        await execAsync(`git -C "${targetPath}" reset --hard`);
        await execAsync(`git -C "${targetPath}" clean -fd`);
        await execAsync(`git -C "${targetPath}" fetch --all`);
        await execAsync(`git -C "${targetPath}" pull`);
      }
      return targetPath;
    } else {
      // 異なるリポジトリの場合は削除
      console.log(`🗑 Removing mismatched repository at: ${targetPath}`);
      await fs.rm(targetPath, { recursive: true, force: true });
    }
  } catch {
    // .git が存在しない場合の処理
    console.log(`📝 No existing repository found at: ${targetPath}`);
  }

  // ディレクトリが存在する場合（.gitがない場合）は削除
  try {
    await fs.access(targetPath);
    console.log(`🗑 Removing existing non-git directory at: ${targetPath}`);
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch {
    // ディレクトリが存在しない場合は何もしない
  }

  // 親ディレクトリを作成
  await fs.mkdir(path.dirname(targetPath), { recursive: true });

  console.log(`📥 Cloning ${gitUrl} to ${targetPath}`);

  // git clone を実行
  try {
    await execAsync(`git clone ${gitUrl} "${targetPath}"`);
    console.log(`✅ Successfully cloned to: ${targetPath}`);
  } catch (cloneError) {
    console.error(`❌ Failed to clone repository: ${cloneError}`);
    throw new Error(`Failed to clone ${owner}/${repo}: ${cloneError}`);
  }

  return targetPath;
}

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * 指定された GitHub リポジトリをローカルに clone または pull する
 * GITHUB_LOCAL_WORKSPACE 直下にリポジトリを配置
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

  // workspace直下にリポジトリを配置
  const targetPath = workspace;
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
      // 異なるリポジトリの場合は警告してスキップ
      console.warn(`⚠️ Different repository found at: ${targetPath}. Expected ${gitUrl}`);
      throw new Error(`Workspace contains different repository. Expected ${owner}/${repo} but found different repo.`);
    }
  } catch {
    // .git が存在しない場合、新規クローンが必要
    console.log(`📝 No Git repository found. Initializing fresh clone...`);

    // ワークスペースディレクトリ内容をクリア（gitのない場合のみ）
    try {
      const files = await fs.readdir(targetPath);
      for (const file of files) {
        const filePath = path.join(targetPath, file);
        await fs.rm(filePath, { recursive: true, force: true });
      }
      console.log(`🧹 Cleared workspace directory: ${targetPath}`);
    } catch {
      // ディレクトリが存在しない場合は作成
      await fs.mkdir(targetPath, { recursive: true });
    }

    console.log(`📥 Cloning ${gitUrl} to ${targetPath}`);

    // git clone を実行（. を使ってディレクトリ内にクローン）
    try {
      await execAsync(`git clone ${gitUrl} .`, { cwd: targetPath });
      console.log(`✅ Successfully cloned to: ${targetPath}`);
    } catch (cloneError) {
      console.error(`❌ Failed to clone repository: ${cloneError}`);
      throw new Error(`Failed to clone ${owner}/${repo}: ${cloneError}`);
    }
  }

  return targetPath;
}

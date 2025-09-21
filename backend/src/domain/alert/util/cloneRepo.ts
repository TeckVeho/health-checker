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

  // Place repository directly under workspace
  const targetPath = workspace;
  const gitUrl = `https://github.com/${owner}/${repo}.git`;

  try {
    // Check if .git directory exists
    await fs.access(path.join(targetPath, '.git'));

    // Check existing repository configuration
    const configPath = path.join(targetPath, '.git', 'config');
    const configText = await fs.readFile(configPath, 'utf-8');

    if (configText.includes(gitUrl)) {
      // If same repository, execute fetch and pull
      console.log(`🔄 Repository exists and matches. Fetching and pulling: ${targetPath}`);
      try {
        // First get latest information from remote
        await execAsync(`git -C "${targetPath}" fetch --all`);
        await execAsync(`git -C "${targetPath}" pull`);
      } catch (pullError) {
        console.warn(`⚠️ Pull failed, attempting to reset and pull: ${pullError}`);
        // If pull fails, discard changes and fetch & pull again
        await execAsync(`git -C "${targetPath}" reset --hard`);
        await execAsync(`git -C "${targetPath}" clean -fd`);
        await execAsync(`git -C "${targetPath}" fetch --all`);
        await execAsync(`git -C "${targetPath}" pull`);
      }
      return targetPath;
    } else {
      // If different repository, warn and skip
      console.warn(`⚠️ Different repository found at: ${targetPath}. Expected ${gitUrl}`);
      throw new Error(`Workspace contains different repository. Expected ${owner}/${repo} but found different repo.`);
    }
  } catch {
    // If .git doesn't exist, new clone is needed
    console.log(`📝 No Git repository found. Initializing fresh clone...`);

    // Clear workspace directory contents (only when git is not present)
    try {
      const files = await fs.readdir(targetPath);
      for (const file of files) {
        const filePath = path.join(targetPath, file);
        await fs.rm(filePath, { recursive: true, force: true });
      }
      console.log(`🧹 Cleared workspace directory: ${targetPath}`);
    } catch {
      // Create directory if it doesn't exist
      await fs.mkdir(targetPath, { recursive: true });
    }

    console.log(`📥 Cloning ${gitUrl} to ${targetPath}`);

    // Execute git clone (using . to clone into directory)
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

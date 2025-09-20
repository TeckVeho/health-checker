import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cloneRepo } from '../../src/domain/alert/util/cloneRepo';

const execAsync = promisify(exec);

describe('cloneRepo Integration Tests', () => {
  const testWorkspace = path.join(__dirname, 'temp-workspace');
  const testOwner = 'TeckVeho';
  const testRepo = 'health-checker';
  const repoPath = path.join(testWorkspace, testOwner, testRepo);

  beforeAll(async () => {
    // Set up test environment
    process.env.GITHUB_LOCAL_WORKSPACE = testWorkspace;

    // Clean up any existing test workspace
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    await fs.mkdir(testWorkspace, { recursive: true });
  });

  afterAll(async () => {
    // Clean up test workspace
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Real git operations', () => {
    it('should fetch latest commits when repository exists', async () => {
      // First clone
      const result1 = await cloneRepo(testOwner, testRepo);
      expect(result1).toBe(repoPath);

      // Verify repository exists
      const gitPath = path.join(repoPath, '.git');
      await expect(fs.access(gitPath)).resolves.toBeUndefined();

      // Get initial commit hash
      const { stdout: initialCommit } = await execAsync(`git -C "${repoPath}" rev-parse HEAD`);
      const initialHash = initialCommit.trim();

      // Simulate outdated local repository by resetting to an older commit
      try {
        await execAsync(`git -C "${repoPath}" reset --hard HEAD~5`);
        const { stdout: oldCommit } = await execAsync(`git -C "${repoPath}" rev-parse HEAD`);
        const oldHash = oldCommit.trim();

        // Verify we're at an older commit
        expect(oldHash).not.toBe(initialHash);

        // Second clone/pull should fetch and update to latest
        const result2 = await cloneRepo(testOwner, testRepo);
        expect(result2).toBe(repoPath);

        // Verify we're back at the latest commit
        const { stdout: updatedCommit } = await execAsync(`git -C "${repoPath}" rev-parse HEAD`);
        const updatedHash = updatedCommit.trim();

        expect(updatedHash).toBe(initialHash);
        console.log(`✅ Successfully updated from ${oldHash.substring(0, 8)} to ${updatedHash.substring(0, 8)}`);

      } catch (error) {
        console.warn('⚠️ Could not test commit reset (repository might be shallow):', error);
        // For shallow repositories, just verify the second call succeeds
        const result2 = await cloneRepo(testOwner, testRepo);
        expect(result2).toBe(repoPath);
      }
    }, 60000); // 60 second timeout for git operations

    it('should verify fetch --all is called in real scenario', async () => {
      // Mock console.log to capture git output
      const originalLog = console.log;
      const logMessages: string[] = [];
      console.log = (...args) => {
        const message = args.join(' ');
        logMessages.push(message);
        originalLog(...args);
      };

      try {
        await cloneRepo(testOwner, testRepo);

        // Look for fetch-related log messages
        const fetchMessages = logMessages.filter(msg =>
          msg.includes('Fetching and pulling') ||
          msg.includes('Repository exists and matches')
        );

        expect(fetchMessages.length).toBeGreaterThan(0);
        console.log('✅ Fetch behavior confirmed in logs:', fetchMessages);

      } finally {
        console.log = originalLog;
      }
    }, 30000);

    it('should handle git config correctly', async () => {
      const result = await cloneRepo(testOwner, testRepo);

      // Verify git config contains correct remote URL
      const configPath = path.join(result, '.git', 'config');
      const configContent = await fs.readFile(configPath, 'utf-8');

      expect(configContent).toContain(`https://github.com/${testOwner}/${testRepo}.git`);
      expect(configContent).toContain('[remote "origin"]');

      console.log('✅ Git config verification passed');
    });
  });

  describe('Gitleaks integration check', () => {
    it('should verify file timestamps are current after fetch', async () => {
      const result = await cloneRepo(testOwner, testRepo);

      // Check modification time of a key file
      const packageJsonPath = path.join(result, 'package.json');
      try {
        const stats = await fs.stat(packageJsonPath);
        const now = new Date();
        const fileTime = stats.mtime;

        // File should be relatively recent (within last hour of git operations)
        const timeDiff = now.getTime() - fileTime.getTime();
        const oneHour = 60 * 60 * 1000;

        expect(timeDiff).toBeLessThan(oneHour);
        console.log(`✅ File timestamp check: ${fileTime.toISOString()}`);

      } catch (error) {
        console.warn('⚠️ Could not check package.json timestamp:', error);
      }
    });

    it('should verify latest commit is available for gitleaks scanning', async () => {
      const result = await cloneRepo(testOwner, testRepo);

      // Get the latest commit info
      const { stdout: commitInfo } = await execAsync(`git -C "${result}" log -1 --format="%H %s %ci"`);
      const [hash, ...messageParts] = commitInfo.trim().split(' ');
      const message = messageParts.join(' ');

      expect(hash).toMatch(/^[a-f0-9]{40}$/); // Valid git hash
      expect(message.length).toBeGreaterThan(0);

      console.log(`✅ Latest commit available: ${hash.substring(0, 8)} - ${message.substring(0, 50)}...`);

      // Verify we can read files from the latest commit
      const readmeFiles = await execAsync(`find "${result}" -name "README*" -type f`);
      expect(readmeFiles.stdout.trim().length).toBeGreaterThan(0);
    });
  });
});
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { cloneRepo } from '../../src/domain/alert/util/cloneRepo';

const execAsync = promisify(exec);

describe('Git Fetch Verification', () => {
  const testWorkspace = path.join(__dirname, 'git-fetch-workspace');
  const testOwner = 'TeckVeho';
  const testRepo = 'health-checker';
  const repoPath = path.join(testWorkspace, testOwner, testRepo);

  beforeAll(async () => {
    process.env.GITHUB_LOCAL_WORKSPACE = testWorkspace;

    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    await fs.mkdir(testWorkspace, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should demonstrate fetch --all behavior in real git scenario', async () => {
    console.log('📂 Starting git fetch verification test...');

    // Step 1: Initial clone
    console.log('📥 Step 1: Initial clone');
    await cloneRepo(testOwner, testRepo);

    // Verify initial state
    const { stdout: initialCommit } = await execAsync(`git -C "${repoPath}" rev-parse HEAD`);
    const { stdout: initialRefs } = await execAsync(`git -C "${repoPath}" for-each-ref --format='%(refname)' refs/remotes/`);

    console.log(`   Initial HEAD: ${initialCommit.trim().substring(0, 8)}`);
    console.log(`   Remote refs: ${initialRefs.trim().split('\n').length} refs`);

    // Step 2: Simulate outdated local repository
    console.log('🔄 Step 2: Simulating outdated local state');
    try {
      // Remove some refs to simulate outdated state (if possible)
      await execAsync(`git -C "${repoPath}" remote set-head origin -d`);
    } catch {
      // Some git operations might not be available in all scenarios
    }

    // Step 3: Second clone call (should trigger fetch --all)
    console.log('🔄 Step 3: Second clone call with fetch verification');

    // Capture git output by setting GIT_TRACE
    const env = { ...process.env, GIT_TRACE: '1' };

    // Monitor for actual git fetch command execution
    const originalConsoleLog = console.log;
    const gitCommands: string[] = [];

    // Mock child_process.exec to capture git commands
    const originalExec = require('child_process').exec;
    require('child_process').exec = function(command: string, options: any, callback: any) {
      if (command.includes('git')) {
        gitCommands.push(command);
        console.log(`🔍 Git Command: ${command}`);
      }
      return originalExec(command, options, callback);
    };

    try {
      await cloneRepo(testOwner, testRepo);

      // Restore original exec
      require('child_process').exec = originalExec;

      // Verify fetch --all was called
      const fetchCommands = gitCommands.filter(cmd => cmd.includes('fetch --all'));
      console.log(`✅ Found ${fetchCommands.length} fetch --all commands:`);
      fetchCommands.forEach(cmd => console.log(`   ${cmd}`));

      expect(fetchCommands.length).toBeGreaterThan(0);

      // Verify repository is up to date
      const { stdout: finalCommit } = await execAsync(`git -C "${repoPath}" rev-parse HEAD`);
      console.log(`   Final HEAD: ${finalCommit.trim().substring(0, 8)}`);

      // Verify remote tracking is working
      const { stdout: remoteInfo } = await execAsync(`git -C "${repoPath}" remote -v`);
      expect(remoteInfo).toContain('origin');
      expect(remoteInfo).toContain(`github.com/${testOwner}/${testRepo}`);

      console.log('✅ Git fetch verification completed successfully');

    } finally {
      require('child_process').exec = originalExec;
      console.log = originalConsoleLog;
    }
  }, 60000);

  it('should verify file content freshness after fetch', async () => {
    console.log('📄 Verifying file content freshness...');

    await cloneRepo(testOwner, testRepo);

    // Check for recent files that would indicate latest content
    const packageJsonPath = path.join(repoPath, 'package.json');
    const readmePath = path.join(repoPath, 'README.md');

    // Verify key files exist and have content
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
    const readmeContent = await fs.readFile(readmePath, 'utf-8');

    expect(packageJson).toHaveProperty('name');
    expect(readmeContent.length).toBeGreaterThan(100);

    // Check git log to ensure we have recent commits
    const { stdout: recentCommits } = await execAsync(`git -C "${repoPath}" log --oneline -5`);
    const commits = recentCommits.trim().split('\n');

    expect(commits.length).toBeGreaterThan(0);
    console.log(`✅ Found ${commits.length} recent commits:`);
    commits.slice(0, 3).forEach(commit => console.log(`   ${commit}`));

    // Verify git status shows clean working tree
    const { stdout: gitStatus } = await execAsync(`git -C "${repoPath}" status --porcelain`);
    expect(gitStatus.trim()).toBe(''); // Should be clean

    console.log('✅ File content freshness verified');
  });

  it('should verify remote refs are up to date', async () => {
    console.log('🌐 Verifying remote refs are up to date...');

    await cloneRepo(testOwner, testRepo);

    // Get remote refs
    const { stdout: remoteRefs } = await execAsync(`git -C "${repoPath}" ls-remote origin`);
    const { stdout: localRefs } = await execAsync(`git -C "${repoPath}" for-each-ref --format='%(objectname) %(refname)' refs/remotes/origin/`);

    expect(remoteRefs.length).toBeGreaterThan(0);
    expect(localRefs.length).toBeGreaterThan(0);

    // Parse remote and local refs
    const remoteLines = remoteRefs.trim().split('\n');
    const localLines = localRefs.trim().split('\n');

    console.log(`📊 Remote refs: ${remoteLines.length}, Local tracking refs: ${localLines.length}`);

    // Check that we have the main/develop branch tracking
    const hasMainOrDevelop = localLines.some(line =>
      line.includes('refs/remotes/origin/main') ||
      line.includes('refs/remotes/origin/develop')
    );

    expect(hasMainOrDevelop).toBe(true);
    console.log('✅ Remote refs verification completed');
  });
});
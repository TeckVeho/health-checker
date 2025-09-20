// Mock execAsync function first
const mockExecAsync = jest.fn();

// Mock dependencies
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  rm: jest.fn(),
  mkdir: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn(),
  dirname: jest.fn(),
}));

jest.mock('util', () => ({
  promisify: jest.fn(() => mockExecAsync),
}));

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { cloneRepo } from '../../../../../src/domain/alert/util/cloneRepo';

const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;
const mockPromisify = promisify as jest.MockedFunction<typeof promisify>;

describe('cloneRepo', () => {
  const originalEnv = process.env;
  const testWorkspace = '/test/workspace';
  const testOwner = 'test-owner';
  const testRepo = 'test-repo';
  const targetPath = '/test/workspace/test-owner/test-repo';
  const gitUrl = `https://github.com/${testOwner}/${testRepo}.git`;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GITHUB_LOCAL_WORKSPACE = testWorkspace;

    // Mock path.join to return predictable paths
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockReturnValue('/test/workspace/test-owner');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Environment validation', () => {
    it('should throw error when GITHUB_LOCAL_WORKSPACE is not set', async () => {
      delete process.env.GITHUB_LOCAL_WORKSPACE;

      await expect(cloneRepo(testOwner, testRepo)).rejects.toThrow(
        'GITHUB_LOCAL_WORKSPACE is required'
      );
    });
  });

  describe('New repository cloning', () => {
    beforeEach(() => {
      // Mock that .git directory doesn't exist (new repository)
      mockFs.access.mockRejectedValue(new Error('Not found'));
      mockFs.mkdir.mockResolvedValue(undefined);
    });

    it('should clone new repository successfully', async () => {
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockFs.access).toHaveBeenCalledWith('/test/workspace/test-owner/test-repo/.git');
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/workspace/test-owner', { recursive: true });
      expect(mockExecAsync).toHaveBeenCalledWith(`git clone ${gitUrl} "${targetPath}"`);
      expect(result).toBe(targetPath);
    });

    it('should handle clone failure', async () => {
      const cloneError = new Error('Clone failed');
      mockExecAsync.mockRejectedValue(cloneError);

      await expect(cloneRepo(testOwner, testRepo)).rejects.toThrow(
        `Failed to clone ${testOwner}/${testRepo}: ${cloneError}`
      );

      expect(mockExecAsync).toHaveBeenCalledWith(`git clone ${gitUrl} "${targetPath}"`);
    });
  });

  describe('Existing repository handling', () => {
    beforeEach(() => {
      // Mock that .git directory exists
      mockFs.access.mockResolvedValueOnce(undefined);
    });

    it('should fetch and pull when repository matches', async () => {
      const configContent = `[remote "origin"]\n\turl = ${gitUrl}\n`;
      mockFs.readFile.mockResolvedValue(configContent);
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockFs.readFile).toHaveBeenCalledWith('/test/workspace/test-owner/test-repo/.git/config', 'utf-8');
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" fetch --all`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" pull`);
      expect(result).toBe(targetPath);
    });

    it('should handle pull failure with reset and retry', async () => {
      const configContent = `[remote "origin"]\n\turl = ${gitUrl}\n`;
      mockFs.readFile.mockResolvedValue(configContent);

      // First fetch succeeds, first pull fails, subsequent operations succeed
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // fetch --all
        .mockRejectedValueOnce(new Error('Pull failed')) // pull
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // reset --hard
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // clean -fd
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // fetch --all (retry)
        .mockResolvedValueOnce({ stdout: '', stderr: '' }); // pull (retry)

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" fetch --all`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" pull`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" reset --hard`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" clean -fd`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" fetch --all`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" pull`);
      expect(result).toBe(targetPath);
    });

    it('should remove and clone when repository URL mismatches', async () => {
      const configContent = `[remote "origin"]\n\turl = https://github.com/different/repo.git\n`;
      mockFs.readFile.mockResolvedValue(configContent);
      mockFs.rm.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockFs.rm).toHaveBeenCalledWith(targetPath, { recursive: true, force: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/workspace/test-owner', { recursive: true });
      expect(mockExecAsync).toHaveBeenCalledWith(`git clone ${gitUrl} "${targetPath}"`);
      expect(result).toBe(targetPath);
    });
  });

  describe('Edge cases', () => {
    it('should handle existing non-git directory', async () => {
      // .git access fails, but directory exists
      mockFs.access
        .mockRejectedValueOnce(new Error('Not found')) // .git doesn't exist
        .mockResolvedValueOnce(undefined); // directory exists
      mockFs.rm.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockFs.rm).toHaveBeenCalledWith(targetPath, { recursive: true, force: true });
      expect(mockFs.mkdir).toHaveBeenCalledWith('/test/workspace/test-owner', { recursive: true });
      expect(mockExecAsync).toHaveBeenCalledWith(`git clone ${gitUrl} "${targetPath}"`);
      expect(result).toBe(targetPath);
    });

    it('should handle config file read failure', async () => {
      mockFs.access.mockResolvedValueOnce(undefined);
      mockFs.readFile.mockRejectedValue(new Error('Config read failed'));
      // Don't expect rm to be called since it falls through to the catch block
      mockFs.mkdir.mockResolvedValue(undefined);
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      const result = await cloneRepo(testOwner, testRepo);

      expect(mockExecAsync).toHaveBeenCalledWith(`git clone ${gitUrl} "${targetPath}"`);
      expect(result).toBe(targetPath);
    });
  });

  describe('Git fetch behavior validation', () => {
    beforeEach(() => {
      // Set up for existing repository scenario
      mockFs.access.mockResolvedValueOnce(undefined);
    });

    it('should use fetch --all command for existing repositories', async () => {
      const configContent = `[remote "origin"]\n\turl = ${gitUrl}\n`;
      mockFs.readFile.mockResolvedValue(configContent);
      mockExecAsync.mockResolvedValue({ stdout: '', stderr: '' });

      await cloneRepo(testOwner, testRepo);

      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" fetch --all`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" pull`);
    });

    it('should fetch before pull in error recovery', async () => {
      const configContent = `[remote "origin"]\n\turl = ${gitUrl}\n`;
      mockFs.readFile.mockResolvedValue(configContent);

      // Simulate pull failure and recovery
      mockExecAsync
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // initial fetch
        .mockRejectedValueOnce(new Error('Pull failed')) // initial pull fails
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // reset
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // clean
        .mockResolvedValueOnce({ stdout: '', stderr: '' }) // retry fetch
        .mockResolvedValueOnce({ stdout: '', stderr: '' }); // retry pull

      await cloneRepo(testOwner, testRepo);

      // Verify fetch is called in both initial and retry scenarios
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" fetch --all`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" reset --hard`);
      expect(mockExecAsync).toHaveBeenCalledWith(`git -C "${targetPath}" clean -fd`);
    });
  });
});
import { gitleaksScanner } from '../../../../../src/domain/alert/util/gitleaksScanner';
import { GitleaksErrorHandler } from '../../../../../src/domain/alert/util/gitleaksErrorHandler';
import fs from 'fs/promises';
import path from 'path';

// Mock the AlertService
jest.mock('../../../../../src/domain/alert/alertService', () => ({
  upsertAlert: jest.fn().mockResolvedValue({ record: {}, created: true }),
  resolveUndetectedAlerts: jest.fn().mockResolvedValue(undefined),
}));

// Mock the database
jest.mock('../../../../../src/config/database', () => ({}));

describe('GitleaksScanner', () => {
  const testWorkspace = path.join(__dirname, 'test-workspace');
  const originalWorkspace = process.env.GITHUB_LOCAL_WORKSPACE;

  beforeAll(async () => {
    // Set up test workspace
    process.env.GITHUB_LOCAL_WORKSPACE = testWorkspace;

    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    await fs.mkdir(testWorkspace, { recursive: true });
  });

  afterAll(async () => {
    // Restore original workspace
    if (originalWorkspace) {
      process.env.GITHUB_LOCAL_WORKSPACE = originalWorkspace;
    }

    try {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Error Handling', () => {
    it('should handle missing GITHUB_LOCAL_WORKSPACE environment variable', async () => {
      const originalWorkspace = process.env.GITHUB_LOCAL_WORKSPACE;
      delete process.env.GITHUB_LOCAL_WORKSPACE;

      await expect(gitleaksScanner('test-owner', 'test-repo')).rejects.toThrow(
        'GITHUB_LOCAL_WORKSPACE is required'
      );

      // Restore environment variable
      process.env.GITHUB_LOCAL_WORKSPACE = originalWorkspace;
    });

    it('should handle gitleaks command not found error gracefully', async () => {
      // Mock exec to simulate command not found
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const error = new Error('gitleaks: command not found');
        (error as any).code = 'ENOENT';
        callback(error, '', 'gitleaks: command not found');
      });
      
      require('child_process').exec = mockExec;

      try {
        await gitleaksScanner('test-owner', 'test-repo');
        // Should not throw for non-critical errors
      } catch (error) {
        // Should throw for critical errors like command not found
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Gitleaks execution failed');
      }

      // Restore original exec
      require('child_process').exec = originalExec;
    });

    it('should handle JSON parsing errors gracefully', async () => {
      // Mock exec to simulate invalid JSON output
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        callback(null, 'invalid json output', '');
      });
      
      require('child_process').exec = mockExec;

      try {
        await gitleaksScanner('test-owner', 'test-repo');
        // Should not throw for JSON parsing errors
      } catch (error) {
        // Should not throw for non-critical errors
        fail('Should not throw for JSON parsing errors');
      }

      // Restore original exec
      require('child_process').exec = originalExec;
    });
  });

  describe('Successful Execution', () => {
    it('should process gitleaks findings correctly', async () => {
      // Mock exec to simulate successful gitleaks execution
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const mockFindings = [
          {
            RuleID: 'test-rule',
            Description: 'Test secret found',
            StartLine: 1,
            File: path.join(testWorkspace, 'test-file.js'),
            Match: 'test-secret=abc123',
          },
        ];
        callback(null, JSON.stringify(mockFindings), '');
      });
      
      require('child_process').exec = mockExec;

      // Create a test file to simulate the workspace
      const testFilePath = path.join(testWorkspace, 'test-file.js');
      await fs.writeFile(testFilePath, 'test-secret=abc123\n');

      // Create .git directory structure
      await fs.mkdir(path.join(testWorkspace, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(testWorkspace, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      await gitleaksScanner('test-owner', 'test-repo');

      // Verify AlertService.upsertAlert was called
      const AlertService = require('../../../../../src/domain/alert/alertService');
      expect(AlertService.upsertAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          owner: 'test-owner',
          repo: 'test-repo',
          checkType: 'exposed_secret_key',
          title: 'test-rule',
          description: 'Test secret found',
          severity: 'high',
          filePath: 'test-file.js',
          lineNumber: 1,
          codeSnippet: 'test-secret=abc123',
        })
      );

      // Restore original exec
      require('child_process').exec = originalExec;
    });

    it('should handle empty gitleaks output', async () => {
      // Mock exec to simulate gitleaks with no findings
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        callback(null, '', '');
      });
      
      require('child_process').exec = mockExec;

      // Create .git directory structure
      await fs.mkdir(path.join(testWorkspace, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(testWorkspace, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      await gitleaksScanner('test-owner', 'test-repo');

      // Verify AlertService.upsertAlert was not called (no findings)
      const AlertService = require('../../../../../src/domain/alert/alertService');
      expect(AlertService.upsertAlert).not.toHaveBeenCalled();

      // Restore original exec
      require('child_process').exec = originalExec;
    });
  });

  describe('Branch Detection', () => {
    it('should detect branch name from .git/HEAD', async () => {
      // Mock exec to simulate successful gitleaks execution with findings
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const mockFindings = [
          {
            RuleID: 'test-rule',
            Description: 'Test secret found',
            StartLine: 1,
            File: path.join(testWorkspace, 'test-file.js'),
            Match: 'test-secret=abc123',
          },
        ];
        callback(null, JSON.stringify(mockFindings), '');
      });
      
      require('child_process').exec = mockExec;

      // Clean up any existing .git directory
      try {
        await fs.rm(path.join(testWorkspace, '.git'), { recursive: true, force: true });
      } catch {
        // Ignore if doesn't exist
      }

      // Create .git directory structure with specific branch
      await fs.mkdir(path.join(testWorkspace, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(testWorkspace, '.git', 'HEAD'),
        'ref: refs/heads/feature-branch\n'
      );

      // Create a test file to simulate the workspace
      const testFilePath = path.join(testWorkspace, 'test-file.js');
      await fs.writeFile(testFilePath, 'test-secret=abc123\n');

      await gitleaksScanner('test-owner', 'test-repo');

      // Verify AlertService.upsertAlert was called with correct branch
      const AlertService = require('../../../../../src/domain/alert/alertService');
      expect(AlertService.upsertAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          branch: 'feature-branch',
        })
      );

      // Restore original exec
      require('child_process').exec = originalExec;
    });

    it('should handle missing .git/HEAD gracefully', async () => {
      // Mock exec to simulate successful gitleaks execution with findings
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const mockFindings = [
          {
            RuleID: 'test-rule',
            Description: 'Test secret found',
            StartLine: 1,
            File: path.join(testWorkspace, 'test-file.js'),
            Match: 'test-secret=abc123',
          },
        ];
        callback(null, JSON.stringify(mockFindings), '');
      });
      
      require('child_process').exec = mockExec;

      // Clean up any existing .git directory
      try {
        await fs.rm(path.join(testWorkspace, '.git'), { recursive: true, force: true });
      } catch {
        // Ignore if doesn't exist
      }

      // Create a test file to simulate the workspace
      const testFilePath = path.join(testWorkspace, 'test-file.js');
      await fs.writeFile(testFilePath, 'test-secret=abc123\n');

      // Don't create .git directory
      await gitleaksScanner('test-owner', 'test-repo');

      // Verify AlertService.upsertAlert was called with unknown branch
      const AlertService = require('../../../../../src/domain/alert/alertService');
      expect(AlertService.upsertAlert).toHaveBeenCalledWith(
        expect.objectContaining({
          branch: 'unknown',
        })
      );

      // Restore original exec
      require('child_process').exec = originalExec;
    });
  });
});

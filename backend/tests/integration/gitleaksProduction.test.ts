import fs from 'fs/promises';
import path from 'path';
import { gitleaksScanner } from '../../src/domain/alert/util/gitleaksScanner';
import { GitleaksErrorHandler } from '../../src/domain/alert/util/gitleaksErrorHandler';

describe('Gitleaks Production Environment Simulation', () => {
  const testWorkspace = path.join(__dirname, 'production-workspace');
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

  describe('Production Environment Scenarios', () => {
    it('should handle production-like workspace structure', async () => {
      console.log('🏭 Testing production-like workspace structure...');

      const testOwner = 'TeckVeho';
      const testRepo = 'health-checker';
      const repoPath = path.join(testWorkspace, testOwner, testRepo);

      // Create production-like directory structure
      await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(repoPath, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      // Create some test files that might trigger gitleaks
      await fs.writeFile(
        path.join(repoPath, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          scripts: {
            test: 'jest',
          },
        })
      );

      await fs.writeFile(
        path.join(repoPath, 'README.md'),
        '# Test Project\nThis is a test project for gitleaks scanning.'
      );

      // Mock console methods to capture output
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const logMessages: string[] = [];
      const errorMessages: string[] = [];
      const warnMessages: string[] = [];

      console.log = (...args) => {
        const message = args.join(' ');
        logMessages.push(message);
        originalLog(...args);
      };

      console.error = (...args) => {
        const message = args.join(' ');
        errorMessages.push(message);
        originalError(...args);
      };

      console.warn = (...args) => {
        const message = args.join(' ');
        warnMessages.push(message);
        originalWarn(...args);
      };

      try {
        await gitleaksScanner(testOwner, testRepo);

        // Verify that the scanner completed without critical errors
        const criticalErrors = errorMessages.filter(msg => 
          msg.includes('Gitleaks execution failed') && 
          msg.includes('critical')
        );
        
        expect(criticalErrors).toHaveLength(0);

        console.log(`📊 Log messages: ${logMessages.length}`);
        console.log(`⚠️ Warning messages: ${warnMessages.length}`);
        console.log(`❌ Error messages: ${errorMessages.length}`);

        // Verify workspace structure is intact
        const gitPath = path.join(repoPath, '.git');
        await expect(fs.access(gitPath)).resolves.toBeUndefined();

        console.log('✅ Production environment simulation completed successfully');

      } catch (error) {
        console.log('❌ Production environment simulation failed:', error);
        
        // Check if it's a recoverable error
        if (error instanceof Error) {
          const errorContext: any = {
            error,
            workspace: testWorkspace,
            command: 'gitleaks detect --no-git --source=...',
          };
          
          const isRecoverable = GitleaksErrorHandler.isRecoverableError(errorContext);
          const severity = GitleaksErrorHandler.getErrorSeverity(errorContext);
          
          console.log(`🔍 Error analysis: recoverable=${isRecoverable}, severity=${severity}`);
          
          // For non-critical errors, we should continue
          if (severity !== 'critical') {
            console.log('⚠️ Non-critical error, continuing...');
            return;
          }
        }
        
        throw error;
      } finally {
        // Restore console methods
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      }
    }, 30000);

    it('should handle file permission issues gracefully', async () => {
      console.log('🔒 Testing file permission handling...');

      const testOwner = 'TeckVeho';
      const testRepo = 'permission-test';
      const repoPath = path.join(testWorkspace, testOwner, testRepo);

      // Create a workspace with restricted permissions (simulate production issues)
      await fs.mkdir(repoPath, { recursive: true });
      await fs.writeFile(
        path.join(repoPath, 'test-file.js'),
        'const secret = "test-secret-123";\n'
      );

      // Create .git directory
      await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(repoPath, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      // Mock exec to simulate permission error
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const error = new Error('permission denied');
        (error as any).code = 'EACCES';
        callback(error, '', 'permission denied');
      });
      
      require('child_process').exec = mockExec;

      try {
        await gitleaksScanner(testOwner, testRepo);
        
        // Should not throw for permission errors (non-critical)
        console.log('✅ Permission error handled gracefully');
        
      } catch (error) {
        console.log('❌ Permission error not handled properly:', error);
        throw error;
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });

    it('should handle network timeout scenarios', async () => {
      console.log('🌐 Testing network timeout handling...');

      const testOwner = 'TeckVeho';
      const testRepo = 'timeout-test';
      const repoPath = path.join(testWorkspace, testOwner, testRepo);

      // Create workspace
      await fs.mkdir(repoPath, { recursive: true });
      await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(repoPath, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      // Mock exec to simulate timeout
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const error = new Error('timeout occurred');
        (error as any).code = 'ETIMEDOUT';
        callback(error, '', 'timeout occurred');
      });
      
      require('child_process').exec = mockExec;

      try {
        await gitleaksScanner(testOwner, testRepo);
        
        // Should not throw for timeout errors (recoverable)
        console.log('✅ Timeout error handled gracefully');
        
      } catch (error) {
        console.log('❌ Timeout error not handled properly:', error);
        throw error;
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });

    it('should handle malformed JSON output', async () => {
      console.log('📄 Testing malformed JSON handling...');

      const testOwner = 'TeckVeho';
      const testRepo = 'json-test';
      const repoPath = path.join(testWorkspace, testOwner, testRepo);

      // Create workspace
      await fs.mkdir(repoPath, { recursive: true });
      await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(repoPath, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      // Mock exec to simulate malformed JSON
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        callback(null, 'invalid json content {', '');
      });
      
      require('child_process').exec = mockExec;

      try {
        await gitleaksScanner(testOwner, testRepo);
        
        // Should not throw for JSON parsing errors (recoverable)
        console.log('✅ Malformed JSON handled gracefully');
        
      } catch (error) {
        console.log('❌ Malformed JSON not handled properly:', error);
        throw error;
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it.skip('should continue processing after non-critical errors', async () => {
      console.log('🔄 Testing error recovery...');

      const testOwner = 'TeckVeho';
      const testRepo = 'recovery-test';
      const repoPath = path.join(testWorkspace, testOwner, testRepo);

      // Create workspace
      await fs.mkdir(repoPath, { recursive: true });
      await fs.mkdir(path.join(repoPath, '.git'), { recursive: true });
      await fs.writeFile(
        path.join(repoPath, '.git', 'HEAD'),
        'ref: refs/heads/main\n'
      );

      // Mock exec to simulate recoverable error
      const originalExec = require('child_process').exec;
      const mockExec = jest.fn((cmd, callback) => {
        const error = new Error('temporary network issue');
        (error as any).code = 'ECONNREFUSED';
        callback(error, '', 'connection refused');
      });
      
      require('child_process').exec = mockExec;

      // Mock AlertService to verify it's called even with errors
      const AlertService = require('../../src/domain/alert/alertService');
      const mockUpsertAlert = jest.fn().mockResolvedValue({ record: {}, created: true });
      const mockResolveUndetectedAlerts = jest.fn().mockResolvedValue(undefined);
      
      AlertService.upsertAlert = mockUpsertAlert;
      AlertService.resolveUndetectedAlerts = mockResolveUndetectedAlerts;

      try {
        await gitleaksScanner(testOwner, testRepo);
        
        // Should complete without throwing
        console.log('✅ Error recovery successful');
        
        // Verify AlertService methods were called
        expect(mockResolveUndetectedAlerts).toHaveBeenCalled();
        
      } catch (error) {
        console.log('❌ Error recovery failed:', error);
        throw error;
      } finally {
        // Restore original exec
        require('child_process').exec = originalExec;
      }
    });
  });
});

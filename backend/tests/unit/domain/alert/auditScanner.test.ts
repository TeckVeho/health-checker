// Mock Sequelize and Model first
jest.mock('sequelize', () => {
  // Mock Alert record with required methods
  const mockRecord = {
    update: jest.fn().mockResolvedValue({}),
    getDataValue: jest.fn((key: string) => `mock-${key}`),
  };
  
  return {
    Model: class MockModel {
      static init = jest.fn()
      static findOrCreate = jest.fn().mockResolvedValue([mockRecord, true])
      static findAll = jest.fn().mockResolvedValue([])
      update = jest.fn().mockResolvedValue({})
      getDataValue = jest.fn((key: string) => `mock-${key}`)
    },
    DataTypes: {
      BIGINT: 'BIGINT',
      STRING: jest.fn(),
      TEXT: 'TEXT',
      INTEGER: 'INTEGER',
      DATE: 'DATE',
      BOOLEAN: 'BOOLEAN',
      NOW: 'NOW',
    },
    Op: {},
    QueryTypes: {},
  };
});

// Mock database config
jest.mock('../../../../src/config/database', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
    close: jest.fn(),
    define: jest.fn(),
    sync: jest.fn(),
    transaction: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  readdir: jest.fn(),
  access: jest.fn(),
  rm: jest.fn(),
}));

// Import after mocks
import { auditScanner } from '../../../../src/domain/alert/util/auditScanner';
import fs from 'fs/promises';
import { exec } from 'child_process';
import path from 'path';

// Mock environment variable
process.env.GITHUB_LOCAL_WORKSPACE = '/tmp/test-workspace';

describe('auditScanner', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockExec = exec as jest.MockedFunction<typeof exec>;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GITHUB_LOCAL_WORKSPACE = '/tmp/test-workspace';
    
    // Reset Alert model mocks for each test
    const { Model } = require('sequelize');
    Model.findOrCreate.mockResolvedValue([
      { 
        update: jest.fn().mockResolvedValue({}),
        getDataValue: jest.fn((key: string) => `mock-${key}`)
      }, 
      true
    ]);
    Model.findAll.mockResolvedValue([]);
  });

  it('should be defined as a function', () => {
    expect(auditScanner).toBeDefined();
    expect(typeof auditScanner).toBe('function');
  });

  it('should throw error when GITHUB_LOCAL_WORKSPACE is not set', async () => {
    delete process.env.GITHUB_LOCAL_WORKSPACE;

    await expect(auditScanner('test-owner', 'test-repo')).rejects.toThrow('GITHUB_LOCAL_WORKSPACE is required');

    // Restore environment
    process.env.GITHUB_LOCAL_WORKSPACE = '/tmp/test-workspace';
  });

  it('should handle branch name detection from .git/HEAD', async () => {
    // Mock .git/HEAD content
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      return Promise.reject(new Error('File not found'));
    });

    // Mock empty directory (no package.json files)
    mockFs.readdir.mockResolvedValue([]);

    await auditScanner('test-owner', 'test-repo');

    expect(mockFs.readFile).toHaveBeenCalledWith(
      path.join('/tmp/test-workspace', '.git', 'HEAD'),
      'utf-8'
    );
  });

  it('should handle missing .git/HEAD gracefully', async () => {
    // Mock .git/HEAD read failure
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.reject(new Error('File not found'));
      }
      return Promise.resolve('');
    });

    // Mock empty directory
    mockFs.readdir.mockResolvedValue([]);

    await auditScanner('test-owner', 'test-repo');

    // Should not throw error, just warn
    expect(mockFs.readdir).toHaveBeenCalled();
  });

  it('should find package.json files recursively', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      return Promise.resolve('');
    });

    // Mock directory structure with package.json
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
          { name: 'src', isDirectory: () => true },
          { name: 'node_modules', isDirectory: () => true }, // Should be skipped
        ] as any);
      }
      if (dirPath.includes('src')) {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    // Mock yarn.lock exists for first package.json, package-lock.json for second
    mockFs.access.mockImplementation((filePath: any) => {
      if (filePath.includes('yarn.lock') && filePath.includes('/tmp/test-workspace/yarn.lock')) {
        return Promise.resolve();
      }
      if (filePath.includes('package-lock.json') && filePath.includes('src')) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

    // Mock successful audit commands
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(null, '', '');
      }, 0);
      
      return mockChild as any;
    });

    // Mock temp file operations
    mockFs.rm.mockResolvedValue();

    await auditScanner('test-owner', 'test-repo');

    expect(mockFs.readdir).toHaveBeenCalled();
    expect(mockFs.access).toHaveBeenCalled();
  });

  it('should handle yarn audit with vulnerabilities', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      if (filePath.includes('audit-result-')) {
        // Mock yarn audit output with vulnerability
        const yarnAuditOutput = `{"type":"auditAdvisory","data":{"advisory":{"module_name":"test-package","severity":"high","title":"Test vulnerability","url":"https://example.com","vulnerable_versions":">=1.0.0"}}}`;
        return Promise.resolve(yarnAuditOutput);
      }
      return Promise.resolve('');
    });

    // Mock single package.json with yarn.lock
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    // Mock yarn.lock exists
    mockFs.access.mockImplementation((filePath: any) => {
      if (filePath.includes('yarn.lock')) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

    // Mock yarn audit command
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(null, '', '');
      }, 0);
      
      return mockChild as any;
    });

    mockFs.rm.mockResolvedValue();

    await auditScanner('test-owner', 'test-repo');

    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('yarn audit --json'),
      expect.any(Function)
    );
  });

  it('should handle npm audit with vulnerabilities', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      if (filePath.includes('audit-result-')) {
        // Mock npm audit output with vulnerability
        const npmAuditOutput = `{"type":"auditAdvisory","data":{"advisory":{"module_name":"test-package","severity":"critical","title":"Critical vulnerability","url":"https://example.com","vulnerable_versions":"<2.0.0"}}}`;
        return Promise.resolve(npmAuditOutput);
      }
      return Promise.resolve('');
    });

    // Mock single package.json without yarn.lock (npm project)
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    // Mock no yarn.lock, but package-lock.json exists
    mockFs.access.mockImplementation((filePath: any) => {
      if (filePath.includes('package-lock.json')) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });

    // Mock npm audit command
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(null, '', '');
      }, 0);
      
      return mockChild as any;
    });

    mockFs.rm.mockResolvedValue();

    await auditScanner('test-owner', 'test-repo');

    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining('npm audit --json'),
      expect.any(Function)
    );
  });

  it('should skip low/medium severity vulnerabilities', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      if (filePath.includes('audit-result-')) {
        // Mock audit output with low severity (should be filtered out)
        const auditOutput = `{"type":"auditAdvisory","data":{"advisory":{"module_name":"test-package","severity":"low","title":"Low severity","url":"https://example.com"}}}`;
        return Promise.resolve(auditOutput);
      }
      return Promise.resolve('');
    });

    // Mock single package.json
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    mockFs.access.mockResolvedValue(); // yarn.lock exists

    // Mock audit command
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(null, '', '');
      }, 0);
      
      return mockChild as any;
    });

    mockFs.rm.mockResolvedValue();

    await auditScanner('test-owner', 'test-repo');

    // Should complete without creating alerts for low severity
    expect(mockFs.readdir).toHaveBeenCalled();
  });

  it('should handle audit command errors gracefully', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      return Promise.resolve('');
    });

    // Mock single package.json
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    mockFs.access.mockResolvedValue();

    // Mock audit command failure
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(new Error('Audit failed'), '', 'Audit error');
      }, 0);
      
      return mockChild as any;
    });

    mockFs.rm.mockResolvedValue();

    // Should not throw, just log warning
    await expect(auditScanner('test-owner', 'test-repo')).resolves.not.toThrow();
  });

  it('should skip excluded directories', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      return Promise.resolve('');
    });

    // Mock directory structure with excluded dirs
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'node_modules', isDirectory: () => true },
          { name: '.git', isDirectory: () => true },
          { name: '.next', isDirectory: () => true },
          { name: 'dist', isDirectory: () => true },
          { name: 'build', isDirectory: () => true },
          { name: 'src', isDirectory: () => true }, // Should be processed
        ] as any);
      }
      if (dirPath.includes('src')) {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await auditScanner('test-owner', 'test-repo');

    // Should have called readdir on root and src, but not on excluded dirs
    expect(mockFs.readdir).toHaveBeenCalledWith('/tmp/test-workspace', { withFileTypes: true });
    expect(mockFs.readdir).toHaveBeenCalledWith(path.join('/tmp/test-workspace', 'src'), { withFileTypes: true });
    
    // Should NOT have been called on excluded directories
    expect(mockFs.readdir).not.toHaveBeenCalledWith(path.join('/tmp/test-workspace', 'node_modules'), { withFileTypes: true });
    expect(mockFs.readdir).not.toHaveBeenCalledWith(path.join('/tmp/test-workspace', '.git'), { withFileTypes: true });
  });

  it('should resolve old alerts that are no longer detected', async () => {
    // Mock .git/HEAD
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/main\n');
      }
      return Promise.resolve('');
    });

    // Mock empty directory (no vulnerabilities found)
    mockFs.readdir.mockResolvedValue([]);

    // Mock existing alerts that should be resolved
    const { Model } = require('sequelize');
    const mockOldAlert = {
      update: jest.fn().mockResolvedValue({}),
      getDataValue: jest.fn((key: string) => {
        const values: Record<string, any> = {
          owner: 'test-owner',
          repo: 'test-repo', 
          branch: 'main',
          checkType: 'package_vulnerability',
          title: 'old-vulnerability',
          filePath: 'package.json',
          lineNumber: 1,
          codeSnippet: '"old-package": "1.0.0"'
        };
        return values[key] || `mock-${key}`;
      }),
    };

    Model.findAll.mockResolvedValue([mockOldAlert]);

    await auditScanner('test-owner', 'test-repo');

    // Should have called update to resolve the old alert
    expect(mockOldAlert.update).toHaveBeenCalledWith({
      systemResolved: true,
      systemResolvedReason: expect.stringContaining('Automatically resolved: not detected'),
    });
  });

  it('should create alerts for high severity vulnerabilities', async () => {
    // Mock .git/HEAD to return feature-branch consistently
    mockFs.readFile.mockReset();
    mockFs.readdir.mockReset();
    mockFs.access.mockReset();
    
    mockFs.readFile.mockImplementation((filePath: any) => {
      if (filePath.includes('.git/HEAD')) {
        return Promise.resolve('ref: refs/heads/feature-branch\n');
      }
      if (filePath.includes('audit-result-')) {
        // Mock yarn audit output with high severity vulnerability
        const auditOutput = `{"type":"auditAdvisory","data":{"advisory":{"module_name":"vulnerable-package","severity":"high","title":"High severity vulnerability","url":"https://example.com/advisory","vulnerable_versions":"<2.0.0"}}}`;
        return Promise.resolve(auditOutput);
      }
      return Promise.resolve('');
    });

    // Mock single package.json
    mockFs.readdir.mockImplementation((dirPath: any) => {
      if (dirPath === '/tmp/test-workspace') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false },
        ] as any);
      }
      return Promise.resolve([]);
    });

    mockFs.access.mockResolvedValue(); // yarn.lock exists
    mockFs.rm.mockResolvedValue();

    // Mock audit command
    mockExec.mockImplementation((cmd: string, callback: any) => {
      const mockChild = {
        stdout: { setEncoding: jest.fn() },
        stderr: { setEncoding: jest.fn() },
      };
      
      setTimeout(() => {
        callback(null, '', '');
      }, 0);
      
      return mockChild as any;
    });

    const { Model } = require('sequelize');
    const mockNewAlert = {
      update: jest.fn().mockResolvedValue({}),
      getDataValue: jest.fn(),
    };
    Model.findOrCreate.mockResolvedValue([mockNewAlert, true]);
    Model.findAll.mockResolvedValue([]);

    await auditScanner('test-owner', 'test-repo');

    // Should have called findOrCreate to create alert for the vulnerability
    expect(Model.findOrCreate).toHaveBeenCalledWith({
      where: expect.objectContaining({
        owner: 'test-owner',
        repo: 'test-repo',
        branch: 'feature-branch', // Branch detection returns the mocked branch name
        checkType: 'package_vulnerability',
        title: 'High severity vulnerability',
        filePath: 'package.json',
        lineNumber: 1,
        codeSnippet: '"vulnerable-package": "<2.0.0"',
      }),
      defaults: expect.objectContaining({
        description: 'Vulnerability in vulnerable-package. See: https://example.com/advisory',
        severity: 'high',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      }),
    });
  });
}); 
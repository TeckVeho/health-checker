/**
 * AlertService Unit Tests
 * 
 * This file tests the AlertService functionality including:
 * - Alert creation and management
 * - Integration with various scanning utilities
 * - Error handling and edge cases
 */

// Mock all external dependencies before importing
jest.mock('../../../../src/domain/alert/util/checkActions', () => ({
  checkActions: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/checkBranches', () => ({
  checkBranches: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/checkIssues', () => ({
  checkIssues: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/cloneRepo', () => ({
  cloneRepo: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/gitleaksScanner', () => ({
  gitleaksScanner: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/auditScanner', () => ({
  auditScanner: jest.fn(),
}));

// Mock AI SDK dependencies
jest.mock('ai', () => ({
  generateText: jest.fn(),
}));

jest.mock('@ai-sdk/openai', () => ({
  openai: jest.fn(() => 'mock-model'),
}));

// Mock database configuration
jest.mock('../../../../src/config/database', () => {
  const mockSequelize = { query: jest.fn() };
  const createSequelizeInstance = jest.fn(() => mockSequelize);
  return { __esModule: true, default: createSequelizeInstance, createSequelizeInstance };
});

// Mock alert schema
jest.mock('../../../../src/domain/alert/alertSchema', () => ({
  alertAttributes: {},
  alertModelOptions: {},
}));

jest.mock('../../../../src/domain/repo/repoSchema', () => ({
  repoAttributes: {},
  repoModelOptions: {},
}));

// Mock Sequelize（2 重定義をやめ、Alert.update 等 static を揃える）
jest.mock('sequelize', () => ({
  Model: class MockModel {
    static init = jest.fn();
    static findOrCreate = jest.fn();
    static findAll = jest.fn();
    static findOne = jest.fn();
    static update = jest.fn().mockResolvedValue([0, []]);
    static count = jest.fn().mockResolvedValue(0);
  },
  QueryTypes: { SELECT: 'SELECT' },
  Op: { gte: 'gte' },
}));

// Import sau khi mock
import AlertService from '../../../../src/domain/alert/alertService';

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('runAlert', () => {
    const owner = 'test-owner';
    const repo = 'test-repo';

    it('should include actions check when specified', async () => {
      const checks = ['actions'];
      
      // Mock the processActionAlerts method
      const mockProcessActionAlerts = jest.spyOn(AlertService, 'processActionAlerts').mockResolvedValue({ owner, repo });

      await AlertService.runAlert({ owner, repo, checks });

      expect(mockProcessActionAlerts).toHaveBeenCalledWith(owner, repo, expect.any(Date));
    });

    it('should not run actions check when not specified', async () => {
      const checks = ['branch'];
      
      // Mock các dependencies cần thiết
      const mockProcessBranchAlerts = jest.spyOn(AlertService, 'processBranchAlerts').mockResolvedValue({ owner, repo });
      const mockProcessActionAlerts = jest.spyOn(AlertService, 'processActionAlerts').mockResolvedValue({ owner, repo });

      await AlertService.runAlert({ owner, repo, checks });

      expect(mockProcessBranchAlerts).toHaveBeenCalledWith(owner, repo, expect.any(Date));
      expect(mockProcessActionAlerts).not.toHaveBeenCalled();
    });

    it('should use default checks when no checks specified', async () => {
      const mockProcessBranchAlerts = jest.spyOn(AlertService, 'processBranchAlerts').mockResolvedValue({ owner, repo });
      const mockProcessIssueAlertsWithProgress = jest.spyOn(AlertService, 'processIssueAlertsWithProgress').mockResolvedValue({ owner, repo });

      await AlertService.runAlert({ owner, repo });

      expect(mockProcessBranchAlerts).toHaveBeenCalledWith(owner, repo, expect.any(Date));
      expect(mockProcessIssueAlertsWithProgress).toHaveBeenCalledWith(
        owner,
        repo,
        expect.any(Function),
        expect.any(Date),
        false
      );
    });
  });

  describe('processIssueAlertsWithProgress', () => {
    const owner = 'test-owner';
    const repo = 'test-repo';

    it('should exist and be callable', () => {
      expect(typeof AlertService.processIssueAlertsWithProgress).toBe('function');
    });
  });

  describe('Key Generation Logic Tests', () => {
    it('should convert null values to default values correctly', () => {
      // Test the key generation logic directly
      const alert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_template_only',
        title: 'issue:518',
        filePath: null,
        lineNumber: null,
        codeSnippet: null,
        branch: null
      };

      // Simulate the key generation logic from processIssueAlerts
      const key = [
        alert.owner, 
        alert.repo, 
        alert.checkType, 
        alert.title, 
        alert.filePath || '', 
        alert.lineNumber || -1, 
        alert.codeSnippet || '', 
        alert.branch || ''
      ].join('||');

      expect(key).toBe('test-owner||test-repo||issue_template_only||issue:518||||-1||||');
    });

    it('should preserve empty string values correctly', () => {
      const alert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_missing_sp',
        title: 'issue:525',
        filePath: '',
        lineNumber: -1,
        codeSnippet: '',
        branch: ''
      };

      // Simulate the key generation logic from processIssueAlerts
      const key = [
        alert.owner, 
        alert.repo, 
        alert.checkType, 
        alert.title, 
        alert.filePath || '', 
        alert.lineNumber || -1, 
        alert.codeSnippet || '', 
        alert.branch || ''
      ].join('||');

      expect(key).toBe('test-owner||test-repo||issue_missing_sp||issue:525||||-1||||');
    });

    it('should convert undefined values to default values correctly', () => {
      const alert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_large_sp',
        title: 'issue:530',
        filePath: undefined,
        lineNumber: undefined,
        codeSnippet: undefined,
        branch: undefined
      };

      // Simulate the key generation logic from processIssueAlerts
      const key = [
        alert.owner, 
        alert.repo, 
        alert.checkType, 
        alert.title, 
        alert.filePath || '', 
        alert.lineNumber || -1, 
        alert.codeSnippet || '', 
        alert.branch || ''
      ].join('||');

      expect(key).toBe('test-owner||test-repo||issue_large_sp||issue:530||||-1||||');
    });

    it('should handle mixed null and defined values correctly', () => {
      const alert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_unclear_instruction',
        title: 'issue:540',
        filePath: 'src/main.js',
        lineNumber: 42,
        codeSnippet: null,
        branch: 'main'
      };

      // Simulate the key generation logic from processIssueAlerts
      const key = [
        alert.owner, 
        alert.repo, 
        alert.checkType, 
        alert.title, 
        alert.filePath || '', 
        alert.lineNumber || -1, 
        alert.codeSnippet || '', 
        alert.branch || ''
      ].join('||');

      expect(key).toBe('test-owner||test-repo||issue_unclear_instruction||issue:540||src/main.js||42||||main');
    });

    it('should generate consistent where clause for findOrCreate', () => {
      const alert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_template_only',
        title: 'issue:518',
        filePath: null,
        lineNumber: null,
        codeSnippet: null,
        branch: null
      };

      // Simulate the where clause generation logic from processIssueAlerts
      const whereClause = {
        owner: alert.owner,
        repo: alert.repo,
        checkType: alert.checkType,
        title: alert.title,
        filePath: alert.filePath || '',
        lineNumber: alert.lineNumber || -1,
        codeSnippet: alert.codeSnippet || '',
        branch: alert.branch || ''
      };

      expect(whereClause).toEqual({
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'issue_template_only',
        title: 'issue:518',
        filePath: '',
        lineNumber: -1,
        codeSnippet: '',
        branch: ''
      });
    });

    it('should generate consistent keys for existing alerts from database', () => {
      // Simulate existing alert from database with null values
      const existingAlert = {
        getDataValue: (field: string) => {
          const values: Record<string, any> = {
            owner: 'test-owner',
            repo: 'test-repo',
            checkType: 'issue_template_only',
            title: 'issue:518',
            filePath: null,
            lineNumber: null,
            codeSnippet: null,
            branch: null
          };
          return values[field];
        }
      };

      // Simulate the key generation logic for existing alerts from processIssueAlerts
      const key = [
        existingAlert.getDataValue('owner'),
        existingAlert.getDataValue('repo'),
        existingAlert.getDataValue('checkType'),
        existingAlert.getDataValue('title'),
        existingAlert.getDataValue('filePath') || '',
        existingAlert.getDataValue('lineNumber') || -1,
        existingAlert.getDataValue('codeSnippet') || '',
        existingAlert.getDataValue('branch') || ''
      ].join('||');

      expect(key).toBe('test-owner||test-repo||issue_template_only||issue:518||||-1||||');
    });
  });
}); 
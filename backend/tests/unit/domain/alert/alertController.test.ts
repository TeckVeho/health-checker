import { Request, Response, NextFunction } from 'express';
import AlertController from '../../../../src/domain/alert/alertController';
import AlertService from '../../../../src/domain/alert/alertService';
import getMessage from '../../../../src/utils/message';

// Mock database configuration to prevent connection attempts
jest.mock('../../../../src/config/database', () => {
  const mockSequelize = {
    sync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    authenticate: jest.fn().mockResolvedValue(undefined),
  };
  const createSequelizeInstance = jest.fn(() => mockSequelize);
  return { __esModule: true, default: createSequelizeInstance, createSequelizeInstance };
});

// Mock dependencies
jest.mock('../../../../src/domain/alert/alertService');
jest.mock('../../../../src/utils/message');

// Mock ESM modules that cause issues
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        get: jest.fn(),
        listBranches: jest.fn(),
        getBranchProtection: jest.fn(),
      },
      issues: {
        listForRepo: jest.fn(),
      },
    },
  })),
}));

jest.mock('@octokit/core', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

// Mock checkBranches utility to avoid GITHUB_API_KEY requirement
jest.mock('../../../../src/domain/alert/util/checkBranches', () => ({
  checkBranches: jest.fn().mockResolvedValue({
    owner: 'test-owner',
    repo: 'test-repo',
    alerts: []
  })
}));

const mockAlertService = AlertService as jest.Mocked<typeof AlertService>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('AlertController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    mockGetMessage.mockReturnValue('Mock message');
  });

  describe('getSummary', () => {
    it('should successfully get severity summary from repository list', async () => {
      const repoList = [
        { owner: 'test-owner', repo: 'test-repo' },
        { owner: 'test-owner2', repo: 'test-repo2' }
      ];
      
      const expectedSummary = {
        'test-owner/test-repo': { high: 2, medium: 1 },
        'test-owner2/test-repo2': { low: 1 }
      };

      mockRequest.body = repoList;
      mockAlertService.getSeveritySummary.mockResolvedValue(expectedSummary);

      await AlertController.getSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSeveritySummary).toHaveBeenCalledWith(repoList);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedSummary);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error for invalid repository list', async () => {
      const invalidRepoList = [
        { owner: '', repo: 'test-repo' }, // empty owner
        { owner: 'test-owner', repo: '' }  // empty repo
      ];

      mockRequest.body = invalidRepoList;

      await AlertController.getSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSeveritySummary).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle AlertService error', async () => {
      const repoList = [{ owner: 'test-owner', repo: 'test-repo' }];
      const serviceError = new Error('Service error');

      mockRequest.body = repoList;
      mockAlertService.getSeveritySummary.mockRejectedValue(serviceError);

      await AlertController.getSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSeveritySummary).toHaveBeenCalledWith(repoList);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('getCheckTypeSummary', () => {
    it('should successfully get check type summary', async () => {
      const repoList = [
        { owner: 'test-owner', repo: 'test-repo' }
      ];
      
      const expectedSummary = {
        'test-owner/test-repo': { 
          'branch_name_violation': 3,
          'branch_protect_rule_violation': 1 
        }
      };

      mockRequest.body = repoList;
      mockAlertService.getSummary.mockResolvedValue(expectedSummary);

      await AlertController.getCheckTypeSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSummary).toHaveBeenCalledWith(repoList);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedSummary);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error for invalid repository list', async () => {
      const invalidRepoList = [
        { owner: 'test-owner' } // missing repo
      ];

      mockRequest.body = invalidRepoList;

      await AlertController.getCheckTypeSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSummary).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle AlertService error', async () => {
      const repoList = [{ owner: 'test-owner', repo: 'test-repo' }];
      const serviceError = new Error('Service error');

      mockRequest.body = repoList;
      mockAlertService.getSummary.mockRejectedValue(serviceError);

      await AlertController.getCheckTypeSummary(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getSummary).toHaveBeenCalledWith(repoList);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('checkStoredRepos', () => {
    it('should successfully check stored repositories', async () => {
      const owner = 'test-owner';
      const expectedResults = [
        { owner: 'test-owner', repo: 'repo1', status: 'success' },
        { owner: 'test-owner', repo: 'repo2', status: 'success' }
      ];

      mockRequest.params = { owner };
      mockAlertService.checkStoredRepos.mockResolvedValue(expectedResults);
      mockGetMessage.mockReturnValue('Check completed successfully.');

      await AlertController.checkStoredRepos(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.checkStoredRepos).toHaveBeenCalledWith(owner);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Check completed successfully.',
        results: expectedResults,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when owner parameter is missing', async () => {
      mockRequest.params = {};

      await AlertController.checkStoredRepos(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.checkStoredRepos).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Missing required field: owner' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle AlertService error', async () => {
      const owner = 'test-owner';
      const serviceError = new Error('Service error');

      mockRequest.params = { owner };
      mockAlertService.checkStoredRepos.mockRejectedValue(serviceError);

      await AlertController.checkStoredRepos(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.checkStoredRepos).toHaveBeenCalledWith(owner);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('runManualAlert', () => {
    it('should successfully run manual alert for specific repository', async () => {
      const owner = 'test-owner';
      const repo = 'test-repo';
      const checks = ['branch_name_violation', 'branch_protect_rule_violation'];
      const expectedResult = {
        owner,
        repo,
        checks,
        status: 'success',
        alertsFound: 5
      };

      mockRequest.params = { owner, repo };
      mockRequest.body = { checks };
      mockAlertService.runAlert.mockResolvedValue(expectedResult);
      mockGetMessage.mockReturnValue('Check completed successfully.');

      await AlertController.runManualAlert(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.runAlert).toHaveBeenCalledWith({
        owner,
        repo,
        checks,
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Check completed successfully.',
        result: expectedResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default checks when checks parameter is not provided', async () => {
      const owner = 'test-owner';
      const repo = 'test-repo';
      const expectedResult = {
        owner,
        repo,
        checks: [],
        status: 'success'
      };

      mockRequest.params = { owner, repo };
      mockRequest.body = {};
      mockAlertService.runAlert.mockResolvedValue(expectedResult);
      mockGetMessage.mockReturnValue('Check completed successfully.');

      await AlertController.runManualAlert(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.runAlert).toHaveBeenCalledWith({
        owner,
        repo,
        checks: [],
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Check completed successfully.',
        result: expectedResult,
      });
    });

    it('should handle AlertService error', async () => {
      const owner = 'test-owner';
      const repo = 'test-repo';
      const checks = ['branch_name_violation'];
      const serviceError = new Error('Service error');

      mockRequest.params = { owner, repo };
      mockRequest.body = { checks };
      mockAlertService.runAlert.mockRejectedValue(serviceError);

      await AlertController.runManualAlert(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.runAlert).toHaveBeenCalledWith({
        owner,
        repo,
        checks,
      });
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('listRepoAlerts', () => {
    it('should successfully get repository alerts list', async () => {
      const owner = 'test-owner';
      const repo = 'test-repo';
      const expectedAlerts = [
        {
          id: 1,
          owner,
          repo,
          checkType: 'branch_name_violation',
          title: 'Invalid branch name',
          severity: 'high',
          createdAt: new Date()
        },
        {
          id: 2,
          owner,
          repo,
          checkType: 'branch_protect_rule_violation',
          title: 'Missing branch protection',
          severity: 'medium',
          createdAt: new Date()
        }
      ] as any; // Mock Alert model objects

      mockRequest.params = { owner, repo };
      mockAlertService.getAlertsByRepo.mockResolvedValue(expectedAlerts);
      mockGetMessage.mockReturnValue('Fetch completed successfully.');

      await AlertController.listRepoAlerts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getAlertsByRepo).toHaveBeenCalledWith(owner, repo);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Fetch completed successfully.',
        alerts: expectedAlerts,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when owner parameter is missing', async () => {
      const repo = 'test-repo';

      mockRequest.params = { repo };

      await AlertController.listRepoAlerts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getAlertsByRepo).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Missing required fields: owner and repo' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return error when repo parameter is missing', async () => {
      const owner = 'test-owner';

      mockRequest.params = { owner };

      await AlertController.listRepoAlerts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getAlertsByRepo).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Missing required fields: owner and repo' 
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle AlertService error', async () => {
      const owner = 'test-owner';
      const repo = 'test-repo';
      const serviceError = new Error('Service error');

      mockRequest.params = { owner, repo };
      mockAlertService.getAlertsByRepo.mockRejectedValue(serviceError);

      await AlertController.listRepoAlerts(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockAlertService.getAlertsByRepo).toHaveBeenCalledWith(owner, repo);
      expect(mockResponse.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
}); 
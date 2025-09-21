/**
 * Recheck Controller のユニットテスト
 */

import { Request, Response, NextFunction } from 'express';
import { ReCheckController } from '../../../../src/domain/recheck/recheckController';
import { ReCheckService } from '../../../../src/domain/recheck/recheckService';
import getMessage from '../../../../src/utils/message';
import { createExpressMocks } from '../../../helpers/testHelpers';

// モック化
jest.mock('../../../../src/domain/recheck/recheckService');
jest.mock('../../../../src/utils/message');

const mockReCheckService = ReCheckService as jest.Mocked<typeof ReCheckService>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('ReCheckController', () => {
  let mockReq: Request;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    const mocks = createExpressMocks();
    mockReq = mocks.req;
    mockRes = mocks.res;
    mockNext = mocks.next;

    // デフォルトのモック設定
    mockGetMessage.mockImplementation((key: string, ...params: string[]) => {
      const messages: { [key: string]: string } = {
        'SUCCESS.GLOBAL_RECHECK_STARTED': `Global recheck started for ${params.join(', ')}`,
        'SUCCESS.RECHECK_STARTED': `Recheck started for ${params.join(', ')}`,
        'SUCCESS.SETTINGS_UPDATED': `Settings updated for ${params.join(', ')}`,
      };
      return messages[key] || key;
    });
  });

  describe('executeGlobalRecheck', () => {
    it('should successfully start global recheck', async () => {
      // Arrange
      const requestBody = { checks: ['security', 'performance'] };
      mockReq.body = requestBody;

      const mockExecution = {
        executionId: 'exec-123',
        startedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockReCheckService.startGlobalRecheck.mockResolvedValue(mockExecution);

      // Act
      await ReCheckController.executeGlobalRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.startGlobalRecheck).toHaveBeenCalledWith(['security', 'performance']);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Global recheck started for all repositories',
        result: {
          owner: 'global',
          repo: 'global',
          executionId: 'exec-123',
          startedAt: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 300,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle empty checks array', async () => {
      // Arrange
      mockReq.body = {};

      const mockExecution = {
        executionId: 'exec-456',
        startedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockReCheckService.startGlobalRecheck.mockResolvedValue(mockExecution);

      // Act
      await ReCheckController.executeGlobalRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.startGlobalRecheck).toHaveBeenCalledWith([]);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Global recheck started for all repositories',
        result: {
          owner: 'global',
          repo: 'global',
          executionId: 'exec-456',
          startedAt: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 300,
        },
      });
    });

    it('should handle rate limit error', async () => {
      // Arrange
      mockReq.body = { checks: ['security'] };
      const rateLimitError = new Error('Rate limit exceeded. Retry after 60 seconds');
      mockReCheckService.startGlobalRecheck.mockRejectedValue(rateLimitError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeGlobalRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[ReCheckController] Error executing global recheck:', rateLimitError);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Rate limit exceeded',
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Retry after 60 seconds',
          retryAfter: 60,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle concurrent execution limit error', async () => {
      // Arrange
      mockReq.body = { checks: ['security'] };
      const concurrentError = new Error('Maximum concurrent executions reached');
      mockReCheckService.startGlobalRecheck.mockRejectedValue(concurrentError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeGlobalRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[ReCheckController] Error executing global recheck:', concurrentError);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Concurrent execution limit reached',
        error: {
          code: 'CONCURRENT_LIMIT_EXCEEDED',
          message: 'Maximum concurrent executions reached',
        },
      });
      expect(mockNext).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle other errors', async () => {
      // Arrange
      mockReq.body = { checks: ['security'] };
      const otherError = new Error('Some other error');
      mockReCheckService.startGlobalRecheck.mockRejectedValue(otherError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeGlobalRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[ReCheckController] Error executing global recheck:', otherError);
      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('executeRecheck', () => {
    it('should successfully start recheck for specific repository', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['security', 'performance'] };

      const mockExecution = {
        executionId: 'exec-789',
        startedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockReCheckService.startRecheck.mockResolvedValue(mockExecution);

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.startRecheck).toHaveBeenCalledWith('test-owner', 'test-repo', ['security', 'performance']);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Recheck started for test-owner/test-repo',
        result: {
          owner: 'test-owner',
          repo: 'test-repo',
          executionId: 'exec-789',
          startedAt: '2024-01-01T00:00:00.000Z',
          estimatedDuration: 60,
        },
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle rate limit error', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['security'] };
      const rateLimitError = new Error('Rate limit exceeded. Retry after 120 seconds');
      mockReCheckService.startRecheck.mockRejectedValue(rateLimitError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[ReCheckController] Error executing recheck for test-owner/test-repo:', rateLimitError);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Rate limit exceeded',
        error: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Retry after 120 seconds',
          retryAfter: 120,
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle concurrent execution limit error', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['security'] };
      const concurrentError = new Error('Maximum concurrent executions reached');
      mockReCheckService.startRecheck.mockRejectedValue(concurrentError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Concurrent execution limit reached',
        error: {
          code: 'CONCURRENT_LIMIT_EXCEEDED',
          message: 'Maximum concurrent executions reached',
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle recheck disabled error', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['security'] };
      const disabledError = new Error('ReCheck is disabled for this repository');
      mockReCheckService.startRecheck.mockRejectedValue(disabledError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'ReCheck is disabled for this repository',
        error: {
          code: 'RECHECK_DISABLED',
          message: 'ReCheck is disabled for this repository',
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle invalid check types error', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['invalid'] };
      const invalidError = new Error('No valid check types specified');
      mockReCheckService.startRecheck.mockRejectedValue(invalidError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid check types specified',
        error: {
          code: 'INVALID_CHECK_TYPES',
          message: 'No valid check types specified',
        },
      });

      consoleSpy.mockRestore();
    });

    it('should handle environment error', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { checks: ['security'] };
      const envError = new Error('GITHUB_LOCAL_WORKSPACE is required');
      mockReCheckService.startRecheck.mockRejectedValue(envError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.executeRecheck(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'Environment configuration error',
        error: {
          code: 'ENVIRONMENT_ERROR',
          message: 'GITHUB_LOCAL_WORKSPACE is required',
        },
      });

      consoleSpy.mockRestore();
    });
  });

  describe('getRecheckStatus', () => {
    it('should successfully get recheck status', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };

      const mockStatus = {
        isRunning: false,
        lastExecution: {
          id: 'exec-123',
          startedAt: new Date('2024-01-01T00:00:00Z'),
          completedAt: new Date('2024-01-01T00:05:00Z'),
          status: 'completed',
        },
      };

      mockReCheckService.getRecheckStatus.mockResolvedValue(mockStatus);

      // Act
      await ReCheckController.getRecheckStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.getRecheckStatus).toHaveBeenCalledWith('test-owner', 'test-repo');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockStatus);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      const serviceError = new Error('Service error');
      mockReCheckService.getRecheckStatus.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await ReCheckController.getRecheckStatus(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('[ReCheckController] Error getting recheck status for test-owner/test-repo:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getExecutionHistory', () => {
    it('should successfully get execution history with default pagination', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.query = {};

      const mockHistory = {
        rows: [
          { id: 'exec-1', startedAt: new Date('2024-01-01T00:00:00Z') },
          { id: 'exec-2', startedAt: new Date('2024-01-02T00:00:00Z') },
        ],
        count: 2,
      };

      mockReCheckService.getExecutionHistory.mockResolvedValue(mockHistory);

      // Act
      await ReCheckController.getExecutionHistory(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.getExecutionHistory).toHaveBeenCalledWith('test-owner', 'test-repo', 10, 0);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory.rows,
        pagination: {
          total: 2,
          limit: 10,
          offset: 0,
        },
      });
    });

    it('should handle custom pagination parameters', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.query = { limit: '5', offset: '10' };

      const mockHistory = {
        rows: [{ id: 'exec-1', startedAt: new Date('2024-01-01T00:00:00Z') }],
        count: 1,
      };

      mockReCheckService.getExecutionHistory.mockResolvedValue(mockHistory);

      // Act
      await ReCheckController.getExecutionHistory(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.getExecutionHistory).toHaveBeenCalledWith('test-owner', 'test-repo', 5, 10);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory.rows,
        pagination: {
          total: 1,
          limit: 5,
          offset: 10,
        },
      });
    });
  });

  describe('getRepoStats', () => {
    it('should successfully get repository stats', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };

      const mockStats = {
        totalExecutions: 10,
        successfulExecutions: 8,
        failedExecutions: 2,
        averageDuration: 120,
        lastExecution: new Date('2024-01-01T00:00:00Z'),
      };

      mockReCheckService.getRepoStats.mockResolvedValue(mockStats);

      // Act
      await ReCheckController.getRepoStats(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.getRepoStats).toHaveBeenCalledWith('test-owner', 'test-repo');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });
  });

  describe('getSettings', () => {
    it('should successfully get repository settings', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };

      const mockSettings = {
        enabled: true,
        rateLimitMinutes: 5,
        maxConcurrentExecutions: 2,
        timeoutMinutes: 10,
      };

      mockReCheckService.getSettings.mockResolvedValue(mockSettings);

      // Act
      await ReCheckController.getSettings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.getSettings).toHaveBeenCalledWith('test-owner', 'test-repo');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSettings,
      });
    });
  });

  describe('updateSettings', () => {
    it('should successfully update valid settings', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = {
        rateLimitMinutes: 10,
        maxConcurrentExecutions: 3,
        timeoutMinutes: 15,
      };

      const mockUpdatedSettings = {
        enabled: true,
        rateLimitMinutes: 10,
        maxConcurrentExecutions: 3,
        timeoutMinutes: 15,
      };

      mockReCheckService.updateSettings.mockResolvedValue(mockUpdatedSettings);

      // Act
      await ReCheckController.updateSettings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.updateSettings).toHaveBeenCalledWith('test-owner', 'test-repo', mockReq.body);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Settings updated for test-owner/test-repo',
        data: mockUpdatedSettings,
      });
    });

    it('should reject invalid rate limit', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { rateLimitMinutes: 0 };

      // Act
      await ReCheckController.updateSettings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.updateSettings).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_RATE_LIMIT',
          message: 'Rate limit must be between 1 and 60 minutes',
        },
      });
    });

    it('should reject invalid concurrent limit', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { maxConcurrentExecutions: 10 };

      // Act
      await ReCheckController.updateSettings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.updateSettings).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_CONCURRENT_LIMIT',
          message: 'Max concurrent executions must be between 1 and 5',
        },
      });
    });

    it('should reject invalid timeout', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner', repo: 'test-repo' };
      mockReq.body = { timeoutMinutes: 60 };

      // Act
      await ReCheckController.updateSettings(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.updateSettings).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_TIMEOUT',
          message: 'Timeout must be between 1 and 30 minutes',
        },
      });
    });
  });

  describe('handleTimeouts', () => {
    it('should successfully handle timeouts', async () => {
      // Arrange
      mockReCheckService.handleTimeouts.mockResolvedValue(5);

      // Act
      await ReCheckController.handleTimeouts(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.handleTimeouts).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Processed 5 timeout executions',
        data: { timeoutCount: 5 },
      });
    });
  });

  describe('cleanupOldRecords', () => {
    it('should successfully cleanup with default retention', async () => {
      // Arrange
      mockReq.body = {};
      mockReCheckService.cleanupOldRecords.mockResolvedValue(10);

      // Act
      await ReCheckController.cleanupOldRecords(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.cleanupOldRecords).toHaveBeenCalledWith(30);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cleaned up 10 old records',
        data: { deletedCount: 10, retentionDays: 30 },
      });
    });

    it('should successfully cleanup with custom retention', async () => {
      // Arrange
      mockReq.body = { retentionDays: 7 };
      mockReCheckService.cleanupOldRecords.mockResolvedValue(5);

      // Act
      await ReCheckController.cleanupOldRecords(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReCheckService.cleanupOldRecords).toHaveBeenCalledWith(7);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Cleaned up 5 old records',
        data: { deletedCount: 5, retentionDays: 7 },
      });
    });
  });
});

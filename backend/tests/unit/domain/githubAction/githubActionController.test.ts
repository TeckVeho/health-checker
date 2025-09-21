/**
 * GitHubAction Controller のユニットテスト
 */

import { Request, Response, NextFunction } from 'express';
import GithubActionController from '../../../../src/domain/githubAction/githubActionController';
import GithubActionService from '../../../../src/domain/githubAction/githubActionService';
import getMessage from '../../../../src/utils/message';
import { createExpressMocks } from '../../../helpers/testHelpers';

// モック化
jest.mock('../../../../src/domain/githubAction/githubActionService');
jest.mock('../../../../src/utils/message');

const mockGithubActionService = GithubActionService as jest.Mocked<typeof GithubActionService>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('GithubActionController', () => {
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
        'ERROR.MISSING_PARAMS': `Missing parameters: ${params.join(', ')}`,
        'SUCCESS.REVIEW_SUCCESS': `${params[0]} review completed successfully`,
      };
      return messages[key] || key;
    });
  });

  describe('reviewPullRequest', () => {
    it('should successfully review a pull request', async () => {
      // Arrange
      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123,
      };
      mockReq.body = requestBody;

      const mockReviewResult = {
        approved: true,
        comments: ['Looks good!'],
        suggestions: [],
      };

      mockGithubActionService.reviewPullRequest.mockResolvedValue(mockReviewResult);

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        123
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'pull request review completed successfully',
        reviewResult: mockReviewResult,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when owner is missing', async () => {
      // Arrange
      mockReq.body = {
        repo: 'test-repo',
        pullNumber: 123,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when repo is missing', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        pullNumber: 123,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when pullNumber is missing', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        repo: 'test-repo',
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when pullNumber is null', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: null,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when pullNumber is undefined', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: undefined,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 error when pullNumber is 0', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 0,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors and call next middleware', async () => {
      // Arrange
      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: 123,
      };
      mockReq.body = requestBody;

      const serviceError = new Error('GitHub API error');
      mockGithubActionService.reviewPullRequest.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        123
      );
      expect(consoleSpy).toHaveBeenCalledWith('Error reviewing pull request:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle empty request body', async () => {
      // Arrange
      mockReq.body = {};

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle string pullNumber and convert to number', async () => {
      // Arrange
      const requestBody = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: '123', // 文字列として送信
      };
      mockReq.body = requestBody;

      const mockReviewResult = {
        approved: true,
        comments: ['Looks good!'],
        suggestions: [],
      };

      mockGithubActionService.reviewPullRequest.mockResolvedValue(mockReviewResult);

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        '123'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'pull request review completed successfully',
        reviewResult: mockReviewResult,
      });
    });

    it('should handle negative pullNumber', async () => {
      // Arrange
      mockReq.body = {
        owner: 'test-owner',
        repo: 'test-repo',
        pullNumber: -1,
      };

      const mockReviewResult = {
        approved: false,
        comments: ['Invalid PR number'],
        suggestions: [],
      };

      mockGithubActionService.reviewPullRequest.mockResolvedValue(mockReviewResult);

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).toHaveBeenCalledWith(
        'test-owner',
        'test-repo',
        -1
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'pull request review completed successfully',
        reviewResult: mockReviewResult,
      });
    });

    it('should handle empty string values', async () => {
      // Arrange
      mockReq.body = {
        owner: '',
        repo: 'test-repo',
        pullNumber: 123,
      };

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing parameters: owner, repo, id',
      });
    });

    it('should handle whitespace-only string values', async () => {
      // Arrange
      mockReq.body = {
        owner: '   ',
        repo: 'test-repo',
        pullNumber: 123,
      };

      const mockReviewResult = {
        approved: false,
        comments: ['Invalid owner'],
        suggestions: [],
      };

      mockGithubActionService.reviewPullRequest.mockResolvedValue(mockReviewResult);

      // Act
      await GithubActionController.reviewPullRequest(mockReq, mockRes, mockNext);

      // Assert
      expect(mockGithubActionService.reviewPullRequest).toHaveBeenCalledWith(
        '   ',
        'test-repo',
        123
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'pull request review completed successfully',
        reviewResult: mockReviewResult,
      });
    });
  });
});

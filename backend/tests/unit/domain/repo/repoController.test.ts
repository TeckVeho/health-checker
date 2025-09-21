/**
 * Repo Controller のユニットテスト
 */

import { Request, Response, NextFunction } from 'express';
import RepoController from '../../../../src/domain/repo/repoController';
import RepoService from '../../../../src/domain/repo/repoService';
import getMessage from '../../../../src/utils/message';
import { createExpressMocks } from '../../../helpers/testHelpers';

// モック化
jest.mock('../../../../src/domain/repo/repoService');
jest.mock('../../../../src/utils/message');

const mockRepoService = RepoService as jest.Mocked<typeof RepoService>;
const mockGetMessage = getMessage as jest.MockedFunction<typeof getMessage>;

describe('RepoController', () => {
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
        'ERROR.NOT_FOUND': `${params[0]} not found`,
        'ERROR.NAME_TAKEN': `Name '${params[0]}' is already taken`,
        'SUCCESS.CREATE_SUCCESS': `${params[0]} created successfully`,
        'SUCCESS.UPDATE_SUCCESS': `${params[0]} updated successfully`,
        'SUCCESS.DELETE_SUCCESS': `${params[0]} deleted successfully`,
      };
      return messages[key] || key;
    });
  });

  describe('getAllRepos', () => {
    it('should return all repositories with default pagination', async () => {
      // Arrange
      mockReq.query = {};

      const mockResult = {
        repositories: [
          { id: 1, name: 'repo1', owner: 'owner1' },
          { id: 2, name: 'repo2', owner: 'owner2' },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        },
      };

      mockRepoService.getAllRepos.mockResolvedValue(mockResult as any);

      // Act
      await RepoController.getAllRepos(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.getAllRepos).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sort: 'createdAt',
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return repositories with custom pagination', async () => {
      // Arrange
      mockReq.query = {
        page: '2',
        limit: '5',
        sort: 'name',
      };

      const mockResult = {
        repositories: [{ id: 1, name: 'repo1', owner: 'owner1' }],
        pagination: {
          page: 2,
          limit: 5,
          total: 6,
          totalPages: 2,
        },
      };

      mockRepoService.getAllRepos.mockResolvedValue(mockResult as any);

      // Act
      await RepoController.getAllRepos(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.getAllRepos).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        sort: 'name',
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle service errors', async () => {
      // Arrange
      mockReq.query = {};
      const serviceError = new Error('Database connection failed');
      mockRepoService.getAllRepos.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.getAllRepos(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching repositories:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getRepoById', () => {
    it('should return repository when found', async () => {
      // Arrange
      mockReq.params = { id: '1' };

      const mockRepo = {
        id: 1,
        name: 'test-repo',
        owner: 'test-owner',
        description: 'Test repository',
        topics: ['test'],
        isPrivate: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockRepoService.getRepoById.mockResolvedValue(mockRepo as any);

      // Act
      await RepoController.getRepoById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.getRepoById).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(mockRepo);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when repository not found', async () => {
      // Arrange
      mockReq.params = { id: '999' };

      mockRepoService.getRepoById.mockResolvedValue(null);

      // Act
      await RepoController.getRepoById(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.getRepoById).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'repository not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const serviceError = new Error('Database error');
      mockRepoService.getRepoById.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.getRepoById(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching repository:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('createRepo', () => {
    it('should create repository successfully', async () => {
      // Arrange
      const requestBody = {
        name: 'new-repo',
        owner: 'test-owner',
        description: 'New repository',
        topics: ['test'],
        isPrivate: false,
      };
      mockReq.body = requestBody;

      mockRepoService.createRepo.mockResolvedValue(1);

      // Act
      await RepoController.createRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.createRepo).toHaveBeenCalledWith({
        name: 'new-repo',
        owner: 'test-owner',
        description: 'New repository',
        topics: ['test'],
        isPrivate: false,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        name: 'new-repo',
        owner: 'test-owner',
        description: 'New repository',
        topics: ['test'],
        isPrivate: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        message: 'repository created successfully',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle name taken error', async () => {
      // Arrange
      const requestBody = {
        name: 'existing-repo',
        owner: 'test-owner',
        description: 'Repository',
        topics: [],
        isPrivate: false,
      };
      mockReq.body = requestBody;

      const nameTakenError = new Error('Name \'existing-repo\' is already taken');
      mockRepoService.createRepo.mockRejectedValue(nameTakenError);

      // Act
      await RepoController.createRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Name \'existing-repo\' is already taken' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle other errors', async () => {
      // Arrange
      const requestBody = {
        name: 'new-repo',
        owner: 'test-owner',
        description: 'Repository',
        topics: [],
        isPrivate: false,
      };
      mockReq.body = requestBody;

      const otherError = new Error('Database connection failed');
      mockRepoService.createRepo.mockRejectedValue(otherError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.createRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error creating repository:', otherError);
      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('updateRepo', () => {
    it('should update repository successfully', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const requestBody = {
        name: 'updated-repo',
        description: 'Updated description',
        topics: ['updated'],
      };
      mockReq.body = requestBody;

      const mockUpdatedRepo = {
        id: 1,
        name: 'updated-repo',
        owner: 'test-owner',
        description: 'Updated description',
        topics: ['updated'],
        isPrivate: false,
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      };

      mockRepoService.updateRepo.mockResolvedValue(true);
      mockRepoService.getRepoById.mockResolvedValue(mockUpdatedRepo as any);

      // Act
      await RepoController.updateRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.updateRepo).toHaveBeenCalledWith(1, requestBody);
      expect(mockRepoService.getRepoById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'repository updated successfully',
        repository: mockUpdatedRepo,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when repository not found for update', async () => {
      // Arrange
      mockReq.params = { id: '999' };
      const requestBody = { name: 'updated-repo' };
      mockReq.body = requestBody;

      mockRepoService.updateRepo.mockResolvedValue(false);

      // Act
      await RepoController.updateRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.updateRepo).toHaveBeenCalledWith(999, requestBody);
      expect(mockRepoService.getRepoById).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'repository not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle name taken error during update', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const requestBody = { name: 'existing-repo' };
      mockReq.body = requestBody;

      const nameTakenError = new Error('Name \'existing-repo\' is already taken');
      mockRepoService.updateRepo.mockRejectedValue(nameTakenError);

      // Act
      await RepoController.updateRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Name \'existing-repo\' is already taken' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle other errors during update', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const requestBody = { name: 'updated-repo' };
      mockReq.body = requestBody;

      const otherError = new Error('Database error');
      mockRepoService.updateRepo.mockRejectedValue(otherError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.updateRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error updating repository:', otherError);
      expect(mockNext).toHaveBeenCalledWith(otherError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('deleteRepo', () => {
    it('should delete repository successfully', async () => {
      // Arrange
      mockReq.params = { id: '1' };

      mockRepoService.deleteRepo.mockResolvedValue(true);

      // Act
      await RepoController.deleteRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.deleteRepo).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'repository deleted successfully' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when repository not found for deletion', async () => {
      // Arrange
      mockReq.params = { id: '999' };

      mockRepoService.deleteRepo.mockResolvedValue(false);

      // Act
      await RepoController.deleteRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.deleteRepo).toHaveBeenCalledWith(999);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'repository not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors during deletion', async () => {
      // Arrange
      mockReq.params = { id: '1' };
      const serviceError = new Error('Database error');
      mockRepoService.deleteRepo.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.deleteRepo(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error deleting repository:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('syncRepos', () => {
    it('should sync repositories from GitHub', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner' };

      const mockSavedRepos = [
        { id: 1, name: 'repo1', owner: 'test-owner' },
        { id: 2, name: 'repo2', owner: 'test-owner' },
      ];

      mockRepoService.syncReposFromGithub.mockResolvedValue(mockSavedRepos);

      // Act
      await RepoController.syncRepos(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRepoService.syncReposFromGithub).toHaveBeenCalledWith('test-owner');
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'SUCCESS.SYNC_SUCCESS',
        count: 2,
        repositories: mockSavedRepos,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      // Arrange
      mockReq.params = { owner: 'test-owner' };
      const serviceError = new Error('GitHub API error');
      mockRepoService.syncReposFromGithub.mockRejectedValue(serviceError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Act
      await RepoController.syncRepos(mockReq, mockRes, mockNext);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Error syncing GitHub repos:', serviceError);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

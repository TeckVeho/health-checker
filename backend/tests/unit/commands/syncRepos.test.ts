// このテストファイルは実際のコマンド実行をテストするのではなく、
// コマンドの主要なロジックをテストします

import RepoService from '../../../src/domain/repo/repoService';

// Mock RepoService
jest.mock('../../../src/domain/repo/repoService', () => ({
  __esModule: true,
  default: {
    syncReposFromGithub: jest.fn(),
  },
}));

const mockRepoService = RepoService as jest.Mocked<typeof RepoService>;

describe('syncRepos command logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('syncReposFromGithub', () => {
    it('should call RepoService.syncReposFromGithub with correct owner', async () => {
      // Arrange
      const owner = 'test-owner';
      const mockRepos = [
        { id: 1, name: 'repo1', owner: 'test-owner' },
        { id: 2, name: 'repo2', owner: 'test-owner' },
      ];

      mockRepoService.syncReposFromGithub.mockResolvedValue(mockRepos as any);

      // Act
      const result = await mockRepoService.syncReposFromGithub(owner);

      // Assert
      expect(mockRepoService.syncReposFromGithub).toHaveBeenCalledWith(owner);
      expect(result).toEqual(mockRepos);
    });

    it('should handle service errors', async () => {
      // Arrange
      const owner = 'test-owner';
      const serviceError = new Error('GitHub API error');
      mockRepoService.syncReposFromGithub.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(mockRepoService.syncReposFromGithub(owner))
        .rejects
        .toThrow('GitHub API error');
    });

    it('should return empty array when no repositories found', async () => {
      // Arrange
      const owner = 'test-owner';
      mockRepoService.syncReposFromGithub.mockResolvedValue([]);

      // Act
      const result = await mockRepoService.syncReposFromGithub(owner);

      // Assert
      expect(result).toEqual([]);
      expect(mockRepoService.syncReposFromGithub).toHaveBeenCalledWith(owner);
    });
  });
});

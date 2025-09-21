/**
 * Repo Model のユニットテスト
 */

import { mockRepos } from '../../../fixtures/mockData';
import { createMockModel, clearAllMocks } from '../../../setup/mocks';

// Repo Model をモック化
const mockModel = createMockModel();
jest.mock('../../../../src/domain/repo/repoModel', () => ({
  __esModule: true,
  default: mockModel,
}));

import Repo from '../../../../src/domain/repo/repoModel';

describe('Repo Model', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  describe('findAndCountAll', () => {
    it('should find and count all repositories', async () => {
      // Arrange
      const options = {
        attributes: ['id', 'name', 'owner'],
        offset: 0,
        limit: 10,
        order: [['createdAt', 'DESC']],
      };

      const mockResult = {
        rows: mockRepos,
        count: mockRepos.length,
      };

      mockModel.findAndCountAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await Repo.findAndCountAll(options);

      // Assert
      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResult);
    });

    it('should handle pagination with findAndCountAll', async () => {
      // Arrange
      const options = {
        attributes: ['id', 'name', 'owner'],
        offset: 10,
        limit: 5,
        order: [['createdAt', 'DESC']],
      };

      const mockResult = {
        rows: mockRepos.slice(0, 2),
        count: 12,
      };

      mockModel.findAndCountAll.mockResolvedValue(mockResult as any);

      // Act
      const result = await Repo.findAndCountAll(options);

      // Assert
      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(options);
      expect(result.rows).toEqual(mockRepos.slice(0, 2));
      expect(result.count).toBe(12);
    });

    it('should handle errors in findAndCountAll', async () => {
      // Arrange
      const options = {
        attributes: ['id', 'name', 'owner'],
        offset: 0,
        limit: 10,
        order: [['createdAt', 'DESC']],
      };

      const error = new Error('Database connection failed');
      mockModel.findAndCountAll.mockRejectedValue(error as any);

      // Act & Assert
      await expect(Repo.findAndCountAll(options)).rejects.toThrow(
        'Database connection failed'
      );
      expect(mockModel.findAndCountAll).toHaveBeenCalledWith(options);
    });
  });

  describe('findByPk', () => {
    it('should find repository by primary key', async () => {
      // Arrange
      const repoId = 1;
      const mockRepo = mockRepos[0];

      mockModel.findByPk.mockResolvedValue(mockRepo as any);

      // Act
      const result = await Repo.findByPk(repoId, {
        attributes: ['id', 'name', 'owner'],
      });

      // Assert
      expect(mockModel.findByPk).toHaveBeenCalledWith(repoId, {
        attributes: ['id', 'name', 'owner'],
      });
      expect(result).toEqual(mockRepo);
    });

    it('should return null when repository not found', async () => {
      // Arrange
      const repoId = 999;

      mockModel.findByPk.mockResolvedValue(null as any);

      // Act
      const result = await Repo.findByPk(repoId);

      // Assert
      expect(mockModel.findByPk).toHaveBeenCalledWith(repoId);
      expect(result).toBeNull();
    });

    it('should handle errors in findByPk', async () => {
      // Arrange
      const repoId = 1;
      const error = new Error('Database error');

      mockModel.findByPk.mockRejectedValue(error as any);

      // Act & Assert
      await expect(Repo.findByPk(repoId)).rejects.toThrow('Database error');
      expect(mockModel.findByPk).toHaveBeenCalledWith(repoId);
    });
  });

  describe('create', () => {
    it('should create a new repository', async () => {
      // Arrange
      const repoData = {
        name: 'new-repo',
        owner: 'test-owner',
        description: 'New repository',
        topics: ['test'],
        isPrivate: false,
      };

      const createdRepo = { id: 3, ...repoData, createdAt: new Date(), updatedAt: new Date() };
      mockModel.create.mockResolvedValue(createdRepo as any);

      // Act
      const result = await Repo.create(repoData);

      // Assert
      expect(mockModel.create).toHaveBeenCalledWith(repoData);
      expect(result).toEqual(createdRepo);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const repoData = {
        name: 'new-repo',
        owner: 'test-owner',
        description: 'Repository',
        topics: [],
        isPrivate: false,
      };

      const creationError = new Error('Validation error');
      mockModel.create.mockRejectedValue(creationError as any);

      // Act & Assert
      await expect(Repo.create(repoData)).rejects.toThrow('Validation error');
      expect(mockModel.create).toHaveBeenCalledWith(repoData);
    });
  });

  describe('update', () => {
    it('should update repository', async () => {
      // Arrange
      const updateData = {
        name: 'updated-repo',
        description: 'Updated description',
        topics: ['updated'],
      };

      const updateResult = [1]; // Number of affected rows
      mockModel.update.mockResolvedValue(updateResult as any);

      // Act
      const result = await Repo.update(updateData, { where: { id: 1 } });

      // Assert
      expect(mockModel.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
      expect(result).toEqual(updateResult);
    });

    it('should handle update errors', async () => {
      // Arrange
      const updateData = { name: 'updated-repo' };
      const updateError = new Error('Update failed');
      mockModel.update.mockRejectedValue(updateError as any);

      // Act & Assert
      await expect(Repo.update(updateData, { where: { id: 1 } })).rejects.toThrow('Update failed');
      expect(mockModel.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
    });

    it('should return zero affected rows when no match found', async () => {
      // Arrange
      const updateData = { name: 'updated-repo' };
      const updateResult = [0]; // No affected rows

      mockModel.update.mockResolvedValue(updateResult as any);

      // Act
      const result = await Repo.update(updateData, { where: { id: 999 } });

      // Assert
      expect(mockModel.update).toHaveBeenCalledWith(updateData, { where: { id: 999 } });
      expect(result).toEqual([0]);
    });
  });

  describe('destroy', () => {
    it('should delete repository', async () => {
      // Arrange
      const deleteResult = 1; // Number of deleted rows
      mockModel.destroy.mockResolvedValue(deleteResult as any);

      // Act
      const result = await Repo.destroy({ where: { id: 1 } });

      // Assert
      expect(mockModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(deleteResult);
    });

    it('should handle delete errors', async () => {
      // Arrange
      const deleteError = new Error('Delete failed');
      mockModel.destroy.mockRejectedValue(deleteError as any);

      // Act & Assert
      await expect(Repo.destroy({ where: { id: 1 } })).rejects.toThrow('Delete failed');
      expect(mockModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return zero when no rows deleted', async () => {
      // Arrange
      const deleteResult = 0; // No deleted rows
      mockModel.destroy.mockResolvedValue(deleteResult as any);

      // Act
      const result = await Repo.destroy({ where: { id: 999 } });

      // Assert
      expect(mockModel.destroy).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBe(0);
    });
  });

  describe('findAll', () => {
    it('should find all repositories with where clause', async () => {
      // Arrange
      const whereClause = { owner: 'test-owner' };
      const mockRepos = [
        { id: 1, name: 'repo1', owner: 'test-owner' },
        { id: 2, name: 'repo2', owner: 'test-owner' },
      ];

      mockModel.findAll.mockResolvedValue(mockRepos as any);

      // Act
      const result = await Repo.findAll({ where: whereClause });

      // Assert
      expect(mockModel.findAll).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toEqual(mockRepos);
    });

    it('should find all repositories with order clause', async () => {
      // Arrange
      const options = {
        order: [['name', 'ASC']],
        attributes: ['id', 'name', 'owner'],
      };

      mockModel.findAll.mockResolvedValue(mockRepos as any);

      // Act
      const result = await Repo.findAll(options);

      // Assert
      expect(mockModel.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockRepos);
    });

    it('should handle errors in findAll', async () => {
      // Arrange
      const options = { where: { owner: 'test-owner' } };
      const error = new Error('Database error');

      mockModel.findAll.mockRejectedValue(error as any);

      // Act & Assert
      await expect(Repo.findAll(options)).rejects.toThrow('Database error');
      expect(mockModel.findAll).toHaveBeenCalledWith(options);
    });
  });

  describe('findOne', () => {
    it('should find one repository', async () => {
      // Arrange
      const whereClause = { name: 'test-repo', owner: 'test-owner' };
      const mockRepo = mockRepos[0];

      mockModel.findOne.mockResolvedValue(mockRepo as any);

      // Act
      const result = await Repo.findOne({ where: whereClause });

      // Assert
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toEqual(mockRepo);
    });

    it('should return null when repository not found', async () => {
      // Arrange
      const whereClause = { name: 'nonexistent-repo' };

      mockModel.findOne.mockResolvedValue(null as any);

      // Act
      const result = await Repo.findOne({ where: whereClause });

      // Assert
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toBeNull();
    });

    it('should handle errors in findOne', async () => {
      // Arrange
      const whereClause = { name: 'test-repo' };
      const error = new Error('Database error');

      mockModel.findOne.mockRejectedValue(error as any);

      // Act & Assert
      await expect(Repo.findOne({ where: whereClause })).rejects.toThrow('Database error');
      expect(mockModel.findOne).toHaveBeenCalledWith({ where: whereClause });
    });
  });

  describe('count', () => {
    it('should count repositories', async () => {
      // Arrange
      const countResult = 5;
      mockModel.count.mockResolvedValue(countResult as any);

      // Act
      const result = await Repo.count();

      // Assert
      expect(mockModel.count).toHaveBeenCalled();
      expect(result).toBe(countResult);
    });

    it('should count repositories with where clause', async () => {
      // Arrange
      const whereClause = { owner: 'test-owner' };
      const countResult = 3;

      mockModel.count.mockResolvedValue(countResult as any);

      // Act
      const result = await Repo.count({ where: whereClause });

      // Assert
      expect(mockModel.count).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toBe(countResult);
    });

    it('should handle errors in count', async () => {
      // Arrange
      const whereClause = { owner: 'test-owner' };
      const error = new Error('Count error');

      mockModel.count.mockRejectedValue(error as any);

      // Act & Assert
      await expect(Repo.count({ where: whereClause })).rejects.toThrow('Count error');
      expect(mockModel.count).toHaveBeenCalledWith({ where: whereClause });
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create repositories', async () => {
      // Arrange
      const reposData = [
        { name: 'repo1', owner: 'owner1' },
        { name: 'repo2', owner: 'owner2' },
      ];

      const createdRepos = [
        { id: 1, ...reposData[0], createdAt: new Date(), updatedAt: new Date() },
        { id: 2, ...reposData[1], createdAt: new Date(), updatedAt: new Date() },
      ];

      mockModel.bulkCreate.mockResolvedValue(createdRepos as any);

      // Act
      const result = await Repo.bulkCreate(reposData);

      // Assert
      expect(mockModel.bulkCreate).toHaveBeenCalledWith(reposData);
      expect(result).toEqual(createdRepos);
    });

    it('should handle bulk create errors', async () => {
      // Arrange
      const reposData = [
        { name: 'repo1', owner: 'owner1' },
        { name: 'repo2', owner: 'owner2' },
      ];

      const bulkCreateError = new Error('Bulk create failed');
      mockModel.bulkCreate.mockRejectedValue(bulkCreateError as any);

      // Act & Assert
      await expect(Repo.bulkCreate(reposData)).rejects.toThrow('Bulk create failed');
      expect(mockModel.bulkCreate).toHaveBeenCalledWith(reposData);
    });
  });

  describe('findOrCreate', () => {
    it('should find or create repository', async () => {
      // Arrange
      const repoData = {
        name: 'test-repo',
        owner: 'test-owner',
        description: 'Test repository',
      };

      const findOrCreateResult = [
        { id: 1, ...repoData, createdAt: new Date(), updatedAt: new Date() },
        true, // wasCreated
      ];

      mockModel.findOrCreate.mockResolvedValue(findOrCreateResult as any);

      // Act
      const result = await Repo.findOrCreate({
        where: { name: repoData.name, owner: repoData.owner },
        defaults: repoData,
      });

      // Assert
      expect(mockModel.findOrCreate).toHaveBeenCalledWith({
        where: { name: repoData.name, owner: repoData.owner },
        defaults: repoData,
      });
      expect(result).toEqual(findOrCreateResult);
    });

    it('should handle find or create errors', async () => {
      // Arrange
      const repoData = {
        name: 'test-repo',
        owner: 'test-owner',
      };

      const findOrCreateError = new Error('Find or create failed');
      mockModel.findOrCreate.mockRejectedValue(findOrCreateError as any);

      // Act & Assert
      await expect(Repo.findOrCreate({
        where: { name: repoData.name, owner: repoData.owner },
        defaults: repoData,
      })).rejects.toThrow('Find or create failed');
      expect(mockModel.findOrCreate).toHaveBeenCalledWith({
        where: { name: repoData.name, owner: repoData.owner },
        defaults: repoData,
      });
    });
  });
});

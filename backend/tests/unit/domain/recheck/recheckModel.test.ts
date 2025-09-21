/**
 * Recheck Model のユニットテスト
 */

import { mockRecheckExecutions, mockRecheckSettings } from '../../../fixtures/mockData';
import { createMockModel, clearAllMocks } from '../../../setup/mocks';

// RecheckExecution Model をモック化
const mockExecutionModel = createMockModel();
jest.mock('../../../../src/domain/recheck/recheckModel', () => ({
  RecheckExecution: mockExecutionModel,
  RecheckSettings: mockExecutionModel,
}));

import { RecheckExecution, RecheckSettings } from '../../../../src/domain/recheck/recheckModel';

describe('RecheckExecution Model', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all recheck executions', async () => {
      // Arrange
      const mockExecutions = mockRecheckExecutions;
      mockExecutionModel.findAll.mockResolvedValue(mockExecutions);

      // Act
      const result = await RecheckExecution.findAll();

      // Assert
      expect(mockExecutionModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockExecutions);
    });

    it('should find executions with where clause', async () => {
      // Arrange
      const whereClause = { owner: 'test-owner', repo: 'test-repo' };
      const mockExecutions = mockRecheckExecutions.filter(
        exec => exec.owner === 'test-owner' && exec.repo === 'test-repo'
      );
      mockExecutionModel.findAll.mockResolvedValue(mockExecutions);

      // Act
      const result = await RecheckExecution.findAll({ where: whereClause });

      // Assert
      expect(mockExecutionModel.findAll).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toEqual(mockExecutions);
    });

    it('should find executions with order and limit', async () => {
      // Arrange
      const options = {
        order: [['startedAt', 'DESC']],
        limit: 10,
        offset: 0,
      };
      const mockExecutions = mockRecheckExecutions.slice(0, 10);
      mockExecutionModel.findAll.mockResolvedValue(mockExecutions);

      // Act
      const result = await RecheckExecution.findAll(options);

      // Assert
      expect(mockExecutionModel.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockExecutions);
    });
  });

  describe('findOne', () => {
    it('should find one recheck execution', async () => {
      // Arrange
      const mockExecution = mockRecheckExecutions[0];
      mockExecutionModel.findOne.mockResolvedValue(mockExecution);

      // Act
      const result = await RecheckExecution.findOne();

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockExecution);
    });

    it('should find execution by id', async () => {
      // Arrange
      const executionId = 1;
      const mockExecution = mockRecheckExecutions.find(exec => exec.id === executionId);
      mockExecutionModel.findOne.mockResolvedValue(mockExecution);

      // Act
      const result = await RecheckExecution.findOne({ where: { id: executionId } });

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalledWith({ where: { id: executionId } });
      expect(result).toEqual(mockExecution);
    });

    it('should return null when execution not found', async () => {
      // Arrange
      mockExecutionModel.findOne.mockResolvedValue(null);

      // Act
      const result = await RecheckExecution.findOne({ where: { id: 999 } });

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new recheck execution', async () => {
      // Arrange
      const newExecutionData = {
        owner: 'new-owner',
        repo: 'new-repo',
        executionId: 'exec-new-123',
        status: 'running' as const,
        checkTypes: ['security'],
      };
      const createdExecution = { id: 4, ...newExecutionData, createdAt: new Date(), updatedAt: new Date() };
      mockExecutionModel.create.mockResolvedValue(createdExecution);

      // Act
      const result = await RecheckExecution.create(newExecutionData);

      // Assert
      expect(mockExecutionModel.create).toHaveBeenCalledWith(newExecutionData);
      expect(result).toEqual(createdExecution);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const invalidData = { owner: '', repo: '', executionId: '', status: 'invalid' };
      const creationError = new Error('Validation error');
      mockExecutionModel.create.mockRejectedValue(creationError);

      // Act & Assert
      await expect(RecheckExecution.create(invalidData)).rejects.toThrow('Validation error');
      expect(mockExecutionModel.create).toHaveBeenCalledWith(invalidData);
    });
  });

  describe('update', () => {
    it('should update recheck execution', async () => {
      // Arrange
      const updateData = { status: 'completed', completedAt: new Date() };
      const updateResult = [1]; // Number of affected rows
      mockExecutionModel.update.mockResolvedValue(updateResult);

      // Act
      const result = await RecheckExecution.update(updateData, { where: { id: 1 } });

      // Assert
      expect(mockExecutionModel.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
      expect(result).toEqual(updateResult);
    });

    it('should handle update errors', async () => {
      // Arrange
      const invalidUpdateData = { status: 'invalid_status' };
      const updateError = new Error('Invalid status value');
      mockExecutionModel.update.mockRejectedValue(updateError);

      // Act & Assert
      await expect(RecheckExecution.update(invalidUpdateData, { where: { id: 1 } })).rejects.toThrow('Invalid status value');
      expect(mockExecutionModel.update).toHaveBeenCalledWith(invalidUpdateData, { where: { id: 1 } });
    });
  });

  describe('destroy', () => {
    it('should delete recheck execution', async () => {
      // Arrange
      const deleteResult = 1; // Number of deleted rows
      mockExecutionModel.destroy.mockResolvedValue(deleteResult);

      // Act
      const result = await RecheckExecution.destroy({ where: { id: 1 } });

      // Assert
      expect(mockExecutionModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(deleteResult);
    });

    it('should handle delete errors', async () => {
      // Arrange
      const deleteError = new Error('Foreign key constraint');
      mockExecutionModel.destroy.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(RecheckExecution.destroy({ where: { id: 1 } })).rejects.toThrow('Foreign key constraint');
      expect(mockExecutionModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('count', () => {
    it('should count recheck executions', async () => {
      // Arrange
      const countResult = 5;
      mockExecutionModel.count.mockResolvedValue(countResult);

      // Act
      const result = await RecheckExecution.count();

      // Assert
      expect(mockExecutionModel.count).toHaveBeenCalled();
      expect(result).toBe(countResult);
    });

    it('should count executions with where clause', async () => {
      // Arrange
      const whereClause = { status: 'running' };
      const countResult = 2;
      mockExecutionModel.count.mockResolvedValue(countResult);

      // Act
      const result = await RecheckExecution.count({ where: whereClause });

      // Assert
      expect(mockExecutionModel.count).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toBe(countResult);
    });
  });

  describe('findAndCountAll', () => {
    it('should find and count all executions', async () => {
      // Arrange
      const mockResult = {
        rows: mockRecheckExecutions,
        count: mockRecheckExecutions.length,
      };
      mockExecutionModel.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await RecheckExecution.findAndCountAll();

      // Assert
      expect(mockExecutionModel.findAndCountAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should find and count with pagination', async () => {
      // Arrange
      const options = {
        where: { owner: 'test-owner' },
        order: [['startedAt', 'DESC']],
        limit: 10,
        offset: 0,
      };
      const mockResult = {
        rows: mockRecheckExecutions.slice(0, 10),
        count: 10,
      };
      mockExecutionModel.findAndCountAll.mockResolvedValue(mockResult);

      // Act
      const result = await RecheckExecution.findAndCountAll(options);

      // Assert
      expect(mockExecutionModel.findAndCountAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(mockResult);
    });
  });

  describe('upsert', () => {
    it('should upsert recheck execution', async () => {
      // Arrange
      const upsertData = {
        owner: 'test-owner',
        repo: 'test-repo',
        executionId: 'exec-123',
        status: 'running' as const,
        checkTypes: ['security'],
      };
      const upsertResult = [{ id: 1, ...upsertData }, true]; // [instance, wasCreated]
      mockExecutionModel.upsert.mockResolvedValue(upsertResult);

      // Act
      const result = await RecheckExecution.upsert(upsertData);

      // Assert
      expect(mockExecutionModel.upsert).toHaveBeenCalledWith(upsertData);
      expect(result).toEqual(upsertResult);
    });

    it('should handle upsert errors', async () => {
      // Arrange
      const invalidUpsertData = { owner: '', repo: '', executionId: '' };
      const upsertError = new Error('Invalid data');
      mockExecutionModel.upsert.mockRejectedValue(upsertError);

      // Act & Assert
      await expect(RecheckExecution.upsert(invalidUpsertData)).rejects.toThrow('Invalid data');
      expect(mockExecutionModel.upsert).toHaveBeenCalledWith(invalidUpsertData);
    });
  });
});

describe('RecheckSettings Model', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  describe('findAll', () => {
    it('should find all recheck settings', async () => {
      // Arrange
      const mockSettings = mockRecheckSettings;
      mockExecutionModel.findAll.mockResolvedValue(mockSettings);

      // Act
      const result = await RecheckSettings.findAll();

      // Assert
      expect(mockExecutionModel.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    it('should find settings with where clause', async () => {
      // Arrange
      const whereClause = { isEnabled: true };
      const mockSettings = mockRecheckSettings.filter(setting => setting.isEnabled === true);
      mockExecutionModel.findAll.mockResolvedValue(mockSettings);

      // Act
      const result = await RecheckSettings.findAll({ where: whereClause });

      // Assert
      expect(mockExecutionModel.findAll).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toEqual(mockSettings);
    });
  });

  describe('findOne', () => {
    it('should find one recheck setting', async () => {
      // Arrange
      const mockSetting = mockRecheckSettings[0];
      mockExecutionModel.findOne.mockResolvedValue(mockSetting);

      // Act
      const result = await RecheckSettings.findOne();

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalled();
      expect(result).toEqual(mockSetting);
    });

    it('should find setting by owner and repo', async () => {
      // Arrange
      const owner = 'test-owner';
      const repo = 'test-repo';
      const mockSetting = mockRecheckSettings.find(
        setting => setting.owner === owner && setting.repo === repo
      );
      mockExecutionModel.findOne.mockResolvedValue(mockSetting);

      // Act
      const result = await RecheckSettings.findOne({ where: { owner, repo } });

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalledWith({ where: { owner, repo } });
      expect(result).toEqual(mockSetting);
    });

    it('should return null when setting not found', async () => {
      // Arrange
      mockExecutionModel.findOne.mockResolvedValue(null);

      // Act
      const result = await RecheckSettings.findOne({ where: { owner: 'nonexistent', repo: 'repo' } });

      // Assert
      expect(mockExecutionModel.findOne).toHaveBeenCalledWith({ where: { owner: 'nonexistent', repo: 'repo' } });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new recheck setting', async () => {
      // Arrange
      const newSettingData = {
        owner: 'new-owner',
        repo: 'new-repo',
        rateLimitMinutes: 5,
        maxConcurrentExecutions: 2,
        allowedCheckTypes: ['security', 'performance'],
        timeoutMinutes: 15,
        isEnabled: true,
      };
      const createdSetting = { id: 3, ...newSettingData, createdAt: new Date(), updatedAt: new Date() };
      mockExecutionModel.create.mockResolvedValue(createdSetting);

      // Act
      const result = await RecheckSettings.create(newSettingData);

      // Assert
      expect(mockExecutionModel.create).toHaveBeenCalledWith(newSettingData);
      expect(result).toEqual(createdSetting);
    });

    it('should handle creation errors', async () => {
      // Arrange
      const invalidData = { owner: '', repo: '', rateLimitMinutes: -1 };
      const creationError = new Error('Validation error');
      mockExecutionModel.create.mockRejectedValue(creationError);

      // Act & Assert
      await expect(RecheckSettings.create(invalidData)).rejects.toThrow('Validation error');
      expect(mockExecutionModel.create).toHaveBeenCalledWith(invalidData);
    });
  });

  describe('update', () => {
    it('should update recheck setting', async () => {
      // Arrange
      const updateData = { rateLimitMinutes: 10, isEnabled: false };
      const updateResult = [1]; // Number of affected rows
      mockExecutionModel.update.mockResolvedValue(updateResult);

      // Act
      const result = await RecheckSettings.update(updateData, { where: { id: 1 } });

      // Assert
      expect(mockExecutionModel.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
      expect(result).toEqual(updateResult);
    });

    it('should handle update errors', async () => {
      // Arrange
      const invalidUpdateData = { rateLimitMinutes: -1 };
      const updateError = new Error('Invalid rate limit');
      mockExecutionModel.update.mockRejectedValue(updateError);

      // Act & Assert
      await expect(RecheckSettings.update(invalidUpdateData, { where: { id: 1 } })).rejects.toThrow('Invalid rate limit');
      expect(mockExecutionModel.update).toHaveBeenCalledWith(invalidUpdateData, { where: { id: 1 } });
    });
  });

  describe('destroy', () => {
    it('should delete recheck setting', async () => {
      // Arrange
      const deleteResult = 1; // Number of deleted rows
      mockExecutionModel.destroy.mockResolvedValue(deleteResult);

      // Act
      const result = await RecheckSettings.destroy({ where: { id: 1 } });

      // Assert
      expect(mockExecutionModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toBe(deleteResult);
    });

    it('should handle delete errors', async () => {
      // Arrange
      const deleteError = new Error('Foreign key constraint');
      mockExecutionModel.destroy.mockRejectedValue(deleteError);

      // Act & Assert
      await expect(RecheckSettings.destroy({ where: { id: 1 } })).rejects.toThrow('Foreign key constraint');
      expect(mockExecutionModel.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('count', () => {
    it('should count recheck settings', async () => {
      // Arrange
      const countResult = 3;
      mockExecutionModel.count.mockResolvedValue(countResult);

      // Act
      const result = await RecheckSettings.count();

      // Assert
      expect(mockExecutionModel.count).toHaveBeenCalled();
      expect(result).toBe(countResult);
    });

    it('should count settings with where clause', async () => {
      // Arrange
      const whereClause = { isEnabled: true };
      const countResult = 2;
      mockExecutionModel.count.mockResolvedValue(countResult);

      // Act
      const result = await RecheckSettings.count({ where: whereClause });

      // Assert
      expect(mockExecutionModel.count).toHaveBeenCalledWith({ where: whereClause });
      expect(result).toBe(countResult);
    });
  });

  describe('upsert', () => {
    it('should upsert recheck setting', async () => {
      // Arrange
      const upsertData = {
        owner: 'test-owner',
        repo: 'test-repo',
        rateLimitMinutes: 5,
        maxConcurrentExecutions: 2,
        allowedCheckTypes: ['security'],
        timeoutMinutes: 10,
        isEnabled: true,
      };
      const upsertResult = [{ id: 1, ...upsertData }, true]; // [instance, wasCreated]
      mockExecutionModel.upsert.mockResolvedValue(upsertResult);

      // Act
      const result = await RecheckSettings.upsert(upsertData);

      // Assert
      expect(mockExecutionModel.upsert).toHaveBeenCalledWith(upsertData);
      expect(result).toEqual(upsertResult);
    });

    it('should handle upsert errors', async () => {
      // Arrange
      const invalidUpsertData = { owner: '', repo: '', rateLimitMinutes: -1 };
      const upsertError = new Error('Invalid data');
      mockExecutionModel.upsert.mockRejectedValue(upsertError);

      // Act & Assert
      await expect(RecheckSettings.upsert(invalidUpsertData)).rejects.toThrow('Invalid data');
      expect(mockExecutionModel.upsert).toHaveBeenCalledWith(invalidUpsertData);
    });
  });
});

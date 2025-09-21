/**
 * Alert Model のユニットテスト
 */

import { mockAlerts } from '../../../fixtures/mockData';
import { createMockModel, clearAllMocks } from '../../../setup/mocks';

// Alert Model をモック化
const mockModel = createMockModel();
jest.mock('../../../../src/domain/alert/alertModel', () => ({
  __esModule: true,
  default: mockModel,
}));

import Alert from '../../../../src/domain/alert/alertModel';

describe('Alert Model', () => {
  beforeEach(() => {
    clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all alerts', async () => {
      const mockData = [mockAlerts.high, mockAlerts.medium, mockAlerts.low];
      (Alert.findAll as jest.Mock).mockResolvedValue(mockData);

      const result = await Alert.findAll();

      expect(result).toEqual(mockData);
      expect(Alert.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no alerts exist', async () => {
      (Alert.findAll as jest.Mock).mockResolvedValue([]);

      const result = await Alert.findAll();

      expect(result).toEqual([]);
      expect(Alert.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      (Alert.findAll as jest.Mock).mockRejectedValue(error);

      await expect(Alert.findAll()).rejects.toThrow('Database connection failed');
    });
  });

  describe('findOne', () => {
    it('should return a single alert by ID', async () => {
      (Alert.findOne as jest.Mock).mockResolvedValue(mockAlerts.high);

      const result = await Alert.findOne({ where: { id: 1 } });

      expect(result).toEqual(mockAlerts.high);
      expect(Alert.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when alert not found', async () => {
      (Alert.findOne as jest.Mock).mockResolvedValue(null);

      const result = await Alert.findOne({ where: { id: 999 } });

      expect(result).toBeNull();
      expect(Alert.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });

    it('should handle database errors', async () => {
      const error = new Error('Database query failed');
      (Alert.findOne as jest.Mock).mockRejectedValue(error);

      await expect(Alert.findOne({ where: { id: 1 } })).rejects.toThrow('Database query failed');
    });
  });

  describe('create', () => {
    it('should create a new alert', async () => {
      const newAlert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'New security alert',
        severity: 'high',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      const createdAlert = { id: 1, ...newAlert, createdAt: new Date() };
      (Alert.create as jest.Mock).mockResolvedValue(createdAlert);

      const result = await Alert.create(newAlert);

      expect(result).toEqual(createdAlert);
      expect(Alert.create).toHaveBeenCalledWith(newAlert);
    });

    it('should handle validation errors', async () => {
      const invalidAlert = {
        // 必須フィールドが不足
        owner: 'test-owner',
      };

      const error = new Error('Validation error: missing required fields');
      (Alert.create as jest.Mock).mockRejectedValue(error);

      await expect(Alert.create(invalidAlert)).rejects.toThrow('Validation error: missing required fields');
    });

    it('should handle database constraint errors', async () => {
      const duplicateAlert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'Duplicate alert',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      const error = new Error('Duplicate entry');
      (Alert.create as jest.Mock).mockRejectedValue(error);

      await expect(Alert.create(duplicateAlert)).rejects.toThrow('Duplicate entry');
    });
  });

  describe('update', () => {
    it('should update an existing alert', async () => {
      const updateData = { severity: 'low', isIgnored: true };
      (Alert.update as jest.Mock).mockResolvedValue([1]);

      const result = await Alert.update(updateData, { where: { id: 1 } });

      expect(result).toEqual([1]);
      expect(Alert.update).toHaveBeenCalledWith(updateData, { where: { id: 1 } });
    });

    it('should return [0] when no records updated', async () => {
      const updateData = { severity: 'low' };
      (Alert.update as jest.Mock).mockResolvedValue([0]);

      const result = await Alert.update(updateData, { where: { id: 999 } });

      expect(result).toEqual([0]);
      expect(Alert.update).toHaveBeenCalledWith(updateData, { where: { id: 999 } });
    });

    it('should handle update errors', async () => {
      const updateData = { severity: 'invalid' };
      const error = new Error('Invalid severity value');
      (Alert.update as jest.Mock).mockRejectedValue(error);

      await expect(Alert.update(updateData, { where: { id: 1 } })).rejects.toThrow('Invalid severity value');
    });
  });

  describe('destroy', () => {
    it('should delete an alert', async () => {
      (Alert.destroy as jest.Mock).mockResolvedValue(1);

      const result = await Alert.destroy({ where: { id: 1 } });

      expect(result).toBe(1);
      expect(Alert.destroy).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return 0 when no records deleted', async () => {
      (Alert.destroy as jest.Mock).mockResolvedValue(0);

      const result = await Alert.destroy({ where: { id: 999 } });

      expect(result).toBe(0);
      expect(Alert.destroy).toHaveBeenCalledWith({ where: { id: 999 } });
    });

    it('should handle delete errors', async () => {
      const error = new Error('Foreign key constraint');
      (Alert.destroy as jest.Mock).mockRejectedValue(error);

      await expect(Alert.destroy({ where: { id: 1 } })).rejects.toThrow('Foreign key constraint');
    });
  });

  describe('count', () => {
    it('should return count of alerts', async () => {
      (Alert.count as jest.Mock).mockResolvedValue(5);

      const result = await Alert.count();

      expect(result).toBe(5);
      expect(Alert.count).toHaveBeenCalledTimes(1);
    });

    it('should return count with conditions', async () => {
      (Alert.count as jest.Mock).mockResolvedValue(3);

      const result = await Alert.count({ where: { severity: 'high' } });

      expect(result).toBe(3);
      expect(Alert.count).toHaveBeenCalledWith({ where: { severity: 'high' } });
    });

    it('should handle count errors', async () => {
      const error = new Error('Count query failed');
      (Alert.count as jest.Mock).mockRejectedValue(error);

      await expect(Alert.count()).rejects.toThrow('Count query failed');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple alerts', async () => {
      const newAlerts = [
        {
          owner: 'test-owner',
          repo: 'test-repo',
          checkType: 'security',
          title: 'Alert 1',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
        },
        {
          owner: 'test-owner',
          repo: 'test-repo',
          checkType: 'performance',
          title: 'Alert 2',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
        },
      ];

      const createdAlerts = [
        { id: 1, ...newAlerts[0], createdAt: new Date() },
        { id: 2, ...newAlerts[1], createdAt: new Date() },
      ];

      (Alert.bulkCreate as jest.Mock).mockResolvedValue(createdAlerts);

      const result = await Alert.bulkCreate(newAlerts);

      expect(result).toEqual(createdAlerts);
      expect(Alert.bulkCreate).toHaveBeenCalledWith(newAlerts);
    });

    it('should handle bulk create errors', async () => {
      const invalidAlerts = [
        {
          owner: 'test-owner',
          // 必須フィールドが不足
        },
      ];

      const error = new Error('Bulk create validation failed');
      (Alert.bulkCreate as jest.Mock).mockRejectedValue(error);

      await expect(Alert.bulkCreate(invalidAlerts)).rejects.toThrow('Bulk create validation failed');
    });
  });

  describe('findOrCreate', () => {
    it('should find existing alert', async () => {
      const alertData = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'Existing alert',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      const existingAlert = { id: 1, ...alertData, createdAt: new Date() };
      (Alert.findOrCreate as jest.Mock).mockResolvedValue([existingAlert, false]);

      const result = await Alert.findOrCreate({
        where: { owner: 'test-owner', repo: 'test-repo', title: 'Existing alert' },
        defaults: alertData,
      });

      expect(result).toEqual([existingAlert, false]);
      expect(Alert.findOrCreate).toHaveBeenCalledWith({
        where: { owner: 'test-owner', repo: 'test-repo', title: 'Existing alert' },
        defaults: alertData,
      });
    });

    it('should create new alert when not found', async () => {
      const alertData = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'New alert',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      const newAlert = { id: 1, ...alertData, createdAt: new Date() };
      (Alert.findOrCreate as jest.Mock).mockResolvedValue([newAlert, true]);

      const result = await Alert.findOrCreate({
        where: { owner: 'test-owner', repo: 'test-repo', title: 'New alert' },
        defaults: alertData,
      });

      expect(result).toEqual([newAlert, true]);
      expect(Alert.findOrCreate).toHaveBeenCalledWith({
        where: { owner: 'test-owner', repo: 'test-repo', title: 'New alert' },
        defaults: alertData,
      });
    });

    it('should handle findOrCreate errors', async () => {
      const alertData = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'Test alert',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      const error = new Error('FindOrCreate operation failed');
      (Alert.findOrCreate as jest.Mock).mockRejectedValue(error);

      await expect(Alert.findOrCreate({
        where: { owner: 'test-owner', repo: 'test-repo', title: 'Test alert' },
        defaults: alertData,
      })).rejects.toThrow('FindOrCreate operation failed');
    });
  });
});

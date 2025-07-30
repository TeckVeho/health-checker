// Mock tất cả dependencies trước khi import
jest.mock('../../../../src/domain/alert/util/checkActions', () => ({
  checkActions: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/checkBranches', () => ({
  checkBranches: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/cloneRepo', () => ({
  cloneRepo: jest.fn(),
}));

jest.mock('../../../../src/domain/alert/util/gitleaksScanner', () => ({
  gitleaksScanner: jest.fn(),
}));

jest.mock('../../../../src/config/database', () => ({
  __esModule: true,
  default: {
    query: jest.fn(),
  },
}));

jest.mock('../../../../src/domain/alert/alertSchema', () => ({
  alertAttributes: {},
  alertModelOptions: {},
}));

jest.mock('../../../../src/domain/repo/repoSchema', () => ({
  repoAttributes: {},
  repoModelOptions: {},
}));

jest.mock('sequelize', () => ({
  Model: class {
    static init = jest.fn();
    static findOrCreate = jest.fn();
    static findAll = jest.fn();
    static findOne = jest.fn();
  },
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

      expect(mockProcessActionAlerts).toHaveBeenCalledWith(owner, repo);
    });

    it('should not run actions check when not specified', async () => {
      const checks = ['branch'];
      
      // Mock các dependencies cần thiết
      const mockProcessBranchAlerts = jest.spyOn(AlertService, 'processBranchAlerts').mockResolvedValue({ owner, repo });
      const mockProcessActionAlerts = jest.spyOn(AlertService, 'processActionAlerts').mockResolvedValue({ owner, repo });

      await AlertService.runAlert({ owner, repo, checks });

      expect(mockProcessBranchAlerts).toHaveBeenCalledWith(owner, repo);
      expect(mockProcessActionAlerts).not.toHaveBeenCalled();
    });

    it('should use default checks when no checks specified', async () => {
      const mockProcessBranchAlerts = jest.spyOn(AlertService, 'processBranchAlerts').mockResolvedValue({ owner, repo });

      await AlertService.runAlert({ owner, repo });

      expect(mockProcessBranchAlerts).toHaveBeenCalledWith(owner, repo);
    });
  });
}); 
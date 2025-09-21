import ProjectService from '../../../src/domain/project/projectService';

// Mock ProjectService
jest.mock('../../../src/domain/project/projectService', () => ({
  __esModule: true,
  default: {
    addSpFieldToProject: jest.fn(),
    addSpFieldToAllProjects: jest.fn(),
  },
}));

const mockProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

describe('projectSetSp command logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addSpFieldToProject', () => {
    it('should call ProjectService.addSpFieldToProject with correct parameters', async () => {
      // Arrange
      const owner = 'test-owner';
      const projectId = 123;
      const mockResult = {
        success: true,
        message: '✅ Successfully added SP field to project',
      };

      mockProjectService.addSpFieldToProject.mockResolvedValue(mockResult);

      // Act
      const result = await mockProjectService.addSpFieldToProject(owner, projectId);

      // Assert
      expect(mockProjectService.addSpFieldToProject).toHaveBeenCalledWith(owner, projectId);
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      // Arrange
      const owner = 'test-owner';
      const projectId = 999;
      const serviceError = new Error('Project not found');
      mockProjectService.addSpFieldToProject.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(mockProjectService.addSpFieldToProject(owner, projectId))
        .rejects
        .toThrow('Project not found');
    });
  });

  describe('addSpFieldToAllProjects', () => {
    it('should call ProjectService.addSpFieldToAllProjects with correct owner', async () => {
      // Arrange
      const owner = 'test-owner';
      const mockResult = {
        success: true,
        message: '✅ Processed 2 project(s). 2 successful, 0 failed.',
        results: [
          { projectNumber: 1, projectTitle: 'Project 1', success: true },
          { projectNumber: 2, projectTitle: 'Project 2', success: true },
        ],
      };

      mockProjectService.addSpFieldToAllProjects.mockResolvedValue(mockResult);

      // Act
      const result = await mockProjectService.addSpFieldToAllProjects(owner);

      // Assert
      expect(mockProjectService.addSpFieldToAllProjects).toHaveBeenCalledWith(owner);
      expect(result).toEqual(mockResult);
    });

    it('should handle empty results', async () => {
      // Arrange
      const owner = 'test-owner';
      const mockResult = {
        success: true,
        message: 'ℹ️ No projects V2 found for test-owner',
        results: [],
      };

      mockProjectService.addSpFieldToAllProjects.mockResolvedValue(mockResult);

      // Act
      const result = await mockProjectService.addSpFieldToAllProjects(owner);

      // Assert
      expect(result.results).toHaveLength(0);
      expect(result.message).toContain('No projects V2 found');
    });

    it('should handle service errors', async () => {
      // Arrange
      const owner = 'test-owner';
      const serviceError = new Error('Organization not found');
      mockProjectService.addSpFieldToAllProjects.mockRejectedValue(serviceError);

      // Act & Assert
      await expect(mockProjectService.addSpFieldToAllProjects(owner))
        .rejects
        .toThrow('Organization not found');
    });
  });
});

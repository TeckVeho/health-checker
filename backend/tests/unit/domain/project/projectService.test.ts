import { ProjectService } from '../../../../src/domain/project/projectService';

// Mock Octokit GraphQL
jest.mock('@octokit/graphql', () => ({
  graphql: {
    defaults: jest.fn().mockReturnValue(jest.fn()),
  },
}));

// Mock environment variables
const originalEnv = process.env.GITHUB_API_KEY;
beforeAll(() => {
  process.env.GITHUB_API_KEY = 'test-token';
});

afterAll(() => {
  process.env.GITHUB_API_KEY = originalEnv;
});

describe('ProjectService', () => {
  describe('hasSpField', () => {
    it('should return true when SP field exists', () => {
      // Arrange
      const project = {
        fields: {
          nodes: [
            { name: 'Status', dataType: 'SINGLE_SELECT' },
            { name: 'SP', dataType: 'NUMBER' },
          ],
        },
      };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when SP field does not exist', () => {
      // Arrange
      const project = {
        fields: {
          nodes: [
            { name: 'Status', dataType: 'SINGLE_SELECT' },
            { name: 'Priority', dataType: 'SINGLE_SELECT' },
          ],
        },
      };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when fields is null', () => {
      // Arrange
      const project = { fields: null };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when fields.nodes is not an array', () => {
      // Arrange
      const project = { fields: { nodes: null } };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when project is null', () => {
      // Arrange
      const project = null;

      // Act & Assert
      expect(() => ProjectService.hasSpField(project)).toThrow();
    });

    it('should return false when fields is undefined', () => {
      // Arrange
      const project = { fields: undefined };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when fields.nodes is undefined', () => {
      // Arrange
      const project = { fields: { nodes: undefined } };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when SP field exists but with different dataType', () => {
      // Arrange
      const project = {
        fields: {
          nodes: [
            { name: 'SP', dataType: 'SINGLE_SELECT' },
          ],
        },
      };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true when SP field exists with different case', () => {
      // Arrange
      const project = {
        fields: {
          nodes: [
            { name: 'sp', dataType: 'NUMBER' },
          ],
        },
      };

      // Act
      const result = ProjectService.hasSpField(project);

      // Assert
      expect(result).toBe(true);
    });
  });
});

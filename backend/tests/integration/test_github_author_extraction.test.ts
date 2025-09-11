import { Octokit } from '@octokit/rest';
import { extractAuthorFromIssue } from '../../src/domain/alert/util/checkIssues/authorExtractor';

// Mock Octokit
jest.mock('@octokit/rest');

describe('GitHub Author Extraction Integration', () => {
  let mockedOctokit: jest.Mocked<Octokit>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedOctokit = new Octokit() as jest.Mocked<Octokit>;
  });

  describe('extractAuthorFromIssue', () => {
    it('should extract author information from GitHub issue response', async () => {
      const mockIssueResponse = {
        data: {
          number: 88,
          title: 'Test issue',
          user: {
            login: 'john-doe',
            id: 12345,
            type: 'User',
            avatar_url: 'https://github.com/avatars/john-doe'
          },
          state: 'open',
          body: 'Test issue body'
        }
      };

      mockedOctokit.rest.issues.get.mockResolvedValue(mockIssueResponse as any);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        88
      );

      expect(result).toEqual({
        author: 'john-doe',
        authorDisplayName: null // GitHub API doesn't always return display name in issues
      });

      expect(mockedOctokit.rest.issues.get).toHaveBeenCalledWith({
        owner: 'TeckVeho',
        repo: 'health-checker',
        issue_number: 88
      });
    });

    it('should handle bot accounts correctly', async () => {
      const mockBotIssueResponse = {
        data: {
          number: 89,
          user: {
            login: 'dependabot[bot]',
            id: 49699333,
            type: 'Bot'
          }
        }
      };

      mockedOctokit.rest.issues.get.mockResolvedValue(mockBotIssueResponse as any);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        89
      );

      expect(result).toEqual({
        author: 'dependabot[bot]',
        authorDisplayName: null
      });
    });

    it('should handle deleted users gracefully', async () => {
      const mockDeletedUserResponse = {
        data: {
          number: 90,
          user: null // Deleted user case
        }
      };

      mockedOctokit.rest.issues.get.mockResolvedValue(mockDeletedUserResponse as any);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        90
      );

      expect(result).toEqual({
        author: null,
        authorDisplayName: null
      });
    });

    it('should handle API rate limiting', async () => {
      const rateLimitError = new Error('API rate limit exceeded');
      (rateLimitError as any).status = 403;

      mockedOctokit.rest.issues.get.mockRejectedValue(rateLimitError);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        91
      );

      // Should return null when API fails
      expect(result).toEqual({
        author: null,
        authorDisplayName: null
      });
    });

    it('should handle non-existent issues', async () => {
      const notFoundError = new Error('Not Found');
      (notFoundError as any).status = 404;

      mockedOctokit.rest.issues.get.mockRejectedValue(notFoundError);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        999
      );

      expect(result).toEqual({
        author: null,
        authorDisplayName: null
      });
    });

    it('should extract display name when available', async () => {
      const mockIssueWithName = {
        data: {
          number: 92,
          user: {
            login: 'jane-smith',
            name: 'Jane Smith',
            type: 'User'
          }
        }
      };

      mockedOctokit.rest.issues.get.mockResolvedValue(mockIssueWithName as any);

      const result = await extractAuthorFromIssue(
        mockedOctokit,
        'TeckVeho',
        'health-checker',
        92
      );

      expect(result).toEqual({
        author: 'jane-smith',
        authorDisplayName: 'Jane Smith'
      });
    });
  });

  describe('batch author extraction', () => {
    it('should handle multiple issues efficiently', async () => {
      const mockIssues = [
        { number: 1, user: { login: 'user1', name: 'User One' } },
        { number: 2, user: { login: 'user2', name: 'User Two' } },
        { number: 3, user: { login: 'user3', name: 'User Three' } }
      ];

      mockIssues.forEach((issue, index) => {
        mockedOctokit.rest.issues.get.mockResolvedValueOnce({
          data: issue
        } as any);
      });

      const issueNumbers = [1, 2, 3];
      const results = await Promise.all(
        issueNumbers.map(num => 
          extractAuthorFromIssue(mockedOctokit, 'TeckVeho', 'health-checker', num)
        )
      );

      expect(results).toEqual([
        { author: 'user1', authorDisplayName: 'User One' },
        { author: 'user2', authorDisplayName: 'User Two' },
        { author: 'user3', authorDisplayName: 'User Three' }
      ]);

      expect(mockedOctokit.rest.issues.get).toHaveBeenCalledTimes(3);
    });
  });
});
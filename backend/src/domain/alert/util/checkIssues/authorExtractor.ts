import { Octokit } from '@octokit/rest';
import { GitHubIssue } from './types';

export interface AuthorInfo {
  author: string | null;
  authorDisplayName: string | null;
}

/**
 * Extract author information directly from GitHub issue object
 */
export function extractAuthorInfo(issue: GitHubIssue): AuthorInfo {
  if (!issue.user) {
    return {
      author: null,
      authorDisplayName: null
    };
  }

  return {
    author: issue.user.login,
    authorDisplayName: issue.user.login // Use login as display name since name is not available in basic API response
  };
}

/**
 * Extract author information from a GitHub issue
 */
export async function extractAuthorFromIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<AuthorInfo> {
  try {
    const response = await octokit.rest.issues.get({
      owner,
      repo,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      issue_number: issueNumber
    });

    const issue = response.data;
    
    // Handle deleted user case
    if (!issue.user) {
      return {
        author: null,
        authorDisplayName: null
      };
    }

    return {
      author: issue.user.login,
      authorDisplayName: issue.user.name || null
    };
  } catch (error: any) {
    // Log error but don't throw - return null for missing data
    console.warn(`Failed to fetch author for issue ${owner}/${repo}#${issueNumber}:`, error.message);
    
    return {
      author: null,
      authorDisplayName: null
    };
  }
}

/**
 * Extract authors from multiple issues in batch
 */
export async function extractAuthorsFromIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumbers: number[]
): Promise<Map<number, AuthorInfo>> {
  const results = new Map<number, AuthorInfo>();
  
  // Process in batches to avoid rate limiting
  const batchSize = 10;
  
  for (let i = 0; i < issueNumbers.length; i += batchSize) {
    const batch = issueNumbers.slice(i, i + batchSize);
    
    const promises = batch.map(async (issueNumber) => {
      const authorInfo = await extractAuthorFromIssue(octokit, owner, repo, issueNumber);
      return { issueNumber, authorInfo };
    });
    
    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(({ issueNumber, authorInfo }) => {
      results.set(issueNumber, authorInfo);
    });
    
    // Small delay between batches to be respectful of API limits
    if (i + batchSize < issueNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

/**
 * Parse issue URL to extract issue number
 */
export function parseIssueNumber(issueUrl: string): number | null {
  try {
    const url = new URL(issueUrl);
    const pathParts = url.pathname.split('/');
    const issueIndex = pathParts.findIndex(part => part === 'issues');
    
    if (issueIndex !== -1 && pathParts[issueIndex + 1]) {
      const issueNumber = parseInt(pathParts[issueIndex + 1], 10);
      return isNaN(issueNumber) ? null : issueNumber;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a username appears to be a bot
 */
export function isBotAccount(username: string): boolean {
  return username.includes('[bot]') || 
         username === 'dependabot' ||
         username.endsWith('-bot') ||
         username.startsWith('github-');
}
/**
 * GitHub URL utility functions
 * Provides shared functionality for generating GitHub URLs across the application
 */

// Configuration constants
const DEFAULT_BRANCH = 'develop'

/**
 * Interface for GitHub URL parameters
 */
export interface GitHubUrlParams {
  owner: string
  repo: string
  filePath?: string
  lineNumber?: number
  branch?: string
}

/**
 * Validates GitHub URL parameters
 * @param params - The parameters to validate
 * @returns true if valid, false otherwise
 */
export function validateGitHubUrlParams(params: Partial<GitHubUrlParams>): boolean {
  const { owner, repo, filePath, lineNumber } = params
  
  // Owner and repo are required
  if (!owner || !repo) {
    console.warn('GitHub URL validation failed: owner and repo are required')
    return false
  }
  
  // If filePath is provided, lineNumber must also be provided and valid
  if (filePath && (!lineNumber || lineNumber < 1)) {
    console.warn('GitHub URL validation failed: lineNumber must be provided and >= 1 when filePath is provided')
    return false
  }
  
  return true
}

/**
 * Generates a GitHub repository URL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns GitHub repository URL
 */
export function getRepositoryUrl(owner: string, repo: string): string {
  if (!validateGitHubUrlParams({ owner, repo })) {
    return '#'
  }
  
  return `https://github.com/${owner}/${repo}`
}

/**
 * Generates a GitHub file URL with optional line number
 * @param params - GitHub URL parameters
 * @returns GitHub file URL or '#' if invalid
 */
export function getFileUrl(params: GitHubUrlParams): string {
  const { owner, repo, filePath, lineNumber, branch } = params
  
  // Basic validation
  if (!validateGitHubUrlParams({ owner, repo, filePath, lineNumber })) {
    return '#'
  }
  
  const safeBranch = branch || DEFAULT_BRANCH
  
  return `https://github.com/${owner}/${repo}/blob/${safeBranch}/${filePath}#L${lineNumber}`
}

/**
 * Generates a GitHub file URL with separate parameters (for backward compatibility)
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param filePath - File path within the repository
 * @param lineNumber - Line number in the file
 * @param branch - Branch name (optional, defaults to 'develop')
 * @returns GitHub file URL or '#' if invalid
 */
export function getFileUrlLegacy(
  owner: string, 
  repo: string, 
  filePath: string, 
  lineNumber: number, 
  branch?: string
): string {
  return getFileUrl({ owner, repo, filePath, lineNumber, branch })
}

/**
 * Generates a GitHub branch URL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @returns GitHub branch URL
 */
export function getBranchUrl(owner: string, repo: string, branch: string): string {
  if (!validateGitHubUrlParams({ owner, repo })) {
    return '#'
  }
  
  return `https://github.com/${owner}/${repo}/tree/${branch}`
}

/**
 * Generates a GitHub commit URL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param commitHash - Commit hash
 * @returns GitHub commit URL
 */
export function getCommitUrl(owner: string, repo: string, commitHash: string): string {
  if (!validateGitHubUrlParams({ owner, repo }) || !commitHash) {
    return '#'
  }
  
  return `https://github.com/${owner}/${repo}/commit/${commitHash}`
}

/**
 * Generates a GitHub pull request URL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns GitHub pull request URL
 */
export function getPullRequestUrl(owner: string, repo: string, prNumber: number): string {
  if (!validateGitHubUrlParams({ owner, repo }) || !prNumber || prNumber < 1) {
    return '#'
  }
  
  return `https://github.com/${owner}/${repo}/pull/${prNumber}`
}

/**
 * Generates a GitHub issue URL
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns GitHub issue URL
 */
export function getIssueUrl(owner: string, repo: string, issueNumber: number): string {
  if (!validateGitHubUrlParams({ owner, repo }) || !issueNumber || issueNumber < 1) {
    return '#'
  }
  
  return `https://github.com/${owner}/${repo}/issues/${issueNumber}`
}

/**
 * Processes text and converts issue numbers (e.g., "#123") to clickable links
 * @param text - The text to process
 * @param owner - Repository owner
 * @param repo - Repository name
 * @returns HTML string with issue numbers converted to links
 */
export function processIssueNumbers(text: string, owner: string, repo: string): string {
  if (!text || !owner || !repo) {
    return text || ''
  }
  
  // Regular expression to match issue numbers like #123, #456, etc.
  const issueNumberRegex = /#(\d+)/g
  
  return text.replace(issueNumberRegex, (match, issueNumber) => {
    const issueUrl = getIssueUrl(owner, repo, parseInt(issueNumber))
    return `<a href="${issueUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200">${match}</a>`
  })
} 
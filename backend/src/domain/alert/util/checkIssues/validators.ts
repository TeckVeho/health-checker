/**
 * Business rule validation logic for issues
 */
import { IssueAlertCandidate, GitHubIssue, ProjectItemFieldValue, LLMAnalysisResult } from './types';
import { extractStoryPoints, extractEndDate } from './parsers';
import { extractAuthorInfo } from './authorExtractor';

/**
 * Create an alert candidate with common fields
 */
function createAlert(
  issue: GitHubIssue,
  owner: string,
  repo: string,
  checkType: string,
  description: string,
  severity: 'low' | 'middle' | 'high'
): IssueAlertCandidate {
  const authorInfo = extractAuthorInfo(issue);
  
  return {
    owner,
    repo,
    checkType,
    title: `issue:${issue.number}`,
    description,
    severity,
    author: authorInfo.author,
    filePath: '',
    lineNumber: -1,
    codeSnippet: '',
    branch: '',
    issueUrl: issue.html_url,
  };
}

/**
 * Validate issue assignment
 */
export function validateAssignment(
  issue: GitHubIssue,
  owner: string,
  repo: string
): IssueAlertCandidate | null {
  if (!issue.assignee) {
    return createAlert(
      issue,
      owner,
      repo,
      'issue_unassigned',
      `Issue #${issue.number} is not assigned to anyone.`,
      'low'
    );
  }
  return null;
}

/**
 * Validate story points (missing and large)
 */
export function validateStoryPoints(
  issue: GitHubIssue,
  owner: string,
  repo: string,
  projectValues: ProjectItemFieldValue
): IssueAlertCandidate[] {
  const alerts: IssueAlertCandidate[] = [];
  
  // Get story points from project (priority) or body (fallback)
  const bodyStoryPoints = extractStoryPoints(issue.body || '');
  const storyPoints = projectValues.sp !== undefined ? projectValues.sp : bodyStoryPoints;
  
  // Debug logging for SP values
  if (projectValues.sp !== undefined) {
    console.log(`    SP from project: ${projectValues.sp}`);
  } else if (bodyStoryPoints !== null) {
    console.log(`    SP from body: ${bodyStoryPoints}`);
  } else {
    console.log(`    SP not found`);
  }

  // Check for missing story points
  if (storyPoints === null) {
    alerts.push(createAlert(
      issue,
      owner,
      repo,
      'issue_missing_sp',
      `Issue #${issue.number} has no Story Point assigned.`,
      'low'
    ));
  } else if (storyPoints > 8) {
    // SP greater than 8 (possibly overestimated)
    alerts.push(createAlert(
      issue,
      owner,
      repo,
      'issue_large_sp',
      `Issue #${issue.number} has Story Point ${storyPoints} which is greater than 8 (possibly overestimated).`,
      'low'
    ));
  }

  return alerts;
}

/**
 * Validate end dates (missing and expired)
 */
export function validateEndDates(
  issue: GitHubIssue,
  owner: string,
  repo: string,
  projectValues: ProjectItemFieldValue
): IssueAlertCandidate[] {
  const alerts: IssueAlertCandidate[] = [];
  
  // Get end date from project (priority) or body (fallback)
  const bodyEndDate = extractEndDate(issue.body || '');
  const endDate = projectValues.endDate !== undefined ? projectValues.endDate : bodyEndDate;

  // Check for missing end date
  if (endDate === null) {
    alerts.push(createAlert(
      issue,
      owner,
      repo,
      'issue_missing_end_date',
      `Issue #${issue.number} has no End Date assigned.`,
      'low'
    ));
  }

  return alerts;
}

/**
 * Validate project membership
 */
export function validateProjectMembership(
  issue: GitHubIssue,
  owner: string,
  repo: string,
  isInProject: boolean
): IssueAlertCandidate | null {
  if (!isInProject) {
    return createAlert(
      issue,
      owner,
      repo,
      'issue_not_in_project',
      `Issue #${issue.number} is not linked to any GitHub Project.`,
      'middle'
    );
  }
  return null;
}

/**
 * Validate content quality (template-only and unclear instructions)
 */
export function validateContentQuality(
  issue: GitHubIssue,
  owner: string,
  repo: string,
  templateDetection: LLMAnalysisResult,
  clarityDetection: LLMAnalysisResult
): IssueAlertCandidate[] {
  const alerts: IssueAlertCandidate[] = [];

  // Check for template-only content
  if (templateDetection.result) {
    alerts.push(createAlert(
      issue,
      owner,
      repo,
      'issue_template_only',
      `Issue #${issue.number} appears to contain only template content. ${templateDetection.reason}`,
      'high'
    ));
  }

  // Check for unclear instructions
  if (clarityDetection.result) {
    alerts.push(createAlert(
      issue,
      owner,
      repo,
      'issue_unclear_instruction',
      `Issue #${issue.number} lacks clear, actionable instructions. ${clarityDetection.reason}`,
      'middle'
    ));
  }

  return alerts;
}
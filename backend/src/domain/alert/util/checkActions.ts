/**
 * GitHub Actions Workflow Scanner
 * 
 * This scanner checks for missing workflow files in repositories and registers them as alerts.
 * It supports both PR review workflow and release-labeling workflow checks.
 * 
 * Features:
 * - Checks for .github/workflows/pr-review.yml or .yaml files (legacy)
 * - Checks for .github/workflows/release-labeling.yml or .yaml files (new)
 * - Accepts both .yml and .yaml extensions as valid workflow files
 * - Registers findings as alerts with checkType "pr_review_workflow_missing" or "release_labeling_workflow_missing"
 * - Handles alert deduplication and automatic resolution
 * 
 * Integration:
 * - Called from AlertService.runAlert() when 'actions' check is included
 * - Requires cloned repository in GITHUB_LOCAL_WORKSPACE
 * - Works alongside existing scanners (gitleaks, branch checks, audit)
 * 
 * @example
 * // Use via AlertService
 * await AlertService.runAlert({ 
 *   owner: 'myorg', 
 *   repo: 'myrepo', 
 *   checks: ['clone', 'actions'] 
 * });
 * 
 * // Or call directly (after cloneRepo)
 * await checkActions('myorg', 'myrepo');
 */

import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';
import { format } from 'date-fns';
import AlertService from '../alertService';
import { Model } from 'sequelize';
import sequelize from '../../../config/database';
import { alertAttributes, alertModelOptions } from '../alertSchema';

// Only check for GITHUB_API_KEY in non-test environments
const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken && process.env.NODE_ENV !== 'test') {
  throw new Error('GITHUB_API_KEY is required');
}

const octokit = new Octokit({ auth: githubToken || 'dummy-token' });

// Define Alert model directly from schema
class Alert extends Model {}
Alert.init(alertAttributes, {
  sequelize,
  ...alertModelOptions,
});

export interface AlertCandidate {
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description: string;
  severity: string;
  filePath: string;
  lineNumber: number;
  codeSnippet: string;
  branch: string;
}

export interface CheckActionsResult {
  owner: string;
  repo: string;
  alerts: AlertCandidate[];
}

interface WorkflowFile {
  path: string;
  exists: boolean;
  extension: '.yml' | '.yaml';
}

export async function checkActions(owner: string, repo: string): Promise<CheckActionsResult> {
  const alerts: AlertCandidate[] = [];
  const filePath = '.github/workflows/pr-review.yml';
  const lineNumber = -1;
  const codeSnippet = '';

  let defaultBranch = 'main';
  try {
    const repoInfo = await octokit.repos.get({ owner, repo });
    defaultBranch = repoInfo.data.default_branch;
  } catch (err) {
    console.error(`❌ Failed to fetch default branch for ${owner}/${repo}:`, err);
  }

  // Check if PR review workflow file exists (legacy check)
  const prWorkflowFiles = [
    '.github/workflows/pr-review.yml',
    '.github/workflows/pr-review.yaml'
  ];

  let prWorkflowExists = false;
  for (const workflowFile of prWorkflowFiles) {
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: workflowFile,
        ref: defaultBranch
      });
      prWorkflowExists = true;
      console.log(`✅ Found workflow file: ${workflowFile} in ${owner}/${repo}`);
      break;
    } catch (err: any) {
      if (err.status !== 404) {
        console.error(`❌ Error checking workflow file ${workflowFile} for ${owner}/${repo}:`, err);
      }
    }
  }

  if (!prWorkflowExists) {
    const checkType = 'pr_review_workflow_missing';
    const title = 'missing: .github/workflows/pr-review.yml';
    const description = 'Missing pr-review.yml: https://github.com/TeckVeho/health-checker/blob/develop/.github/workflows/pr-review.yml';
    const severity = 'low';
    const branch = defaultBranch;

    console.log(`🚨 Detected: ${checkType}:${title} in ${owner}/${repo}`);

    alerts.push({
      owner,
      repo,
      checkType,
      title,
      description,
      severity,
      filePath,
      lineNumber,
      codeSnippet,
      branch,
    });
  }

  // Check for release-labeling workflow files (new check)
  const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
  if (workspace) {
    // Get current branch name from .git/HEAD
    const headPath = path.join(workspace, '.git', 'HEAD');
    let branch = 'unknown';
    try {
      const headContent = await fs.readFile(headPath, 'utf-8');
      if (headContent) {
        const match = headContent.match(/^ref: refs\/heads\/(.+)\s*$/);
        if (match) branch = match[1];
      }
    } catch (err) {
      console.warn(`⚠️ Failed to read .git/HEAD for branch name:`, err);
    }

    // Check for release-labeling workflow files
    const releaseWorkflowFiles = await checkReleaseLabelingWorkflows(workspace);
    console.log(`🔍 Found ${releaseWorkflowFiles.length} release-labeling workflow files to check`);

    // Check if any release-labeling workflow file exists
    const hasReleaseWorkflow = releaseWorkflowFiles.some(file => file.exists);
    
    if (!hasReleaseWorkflow) {
      // No release-labeling workflow file exists - create alert
      const issue = {
        owner,
        repo,
        branch,
        checkType: 'release_labeling_workflow_missing',
        title: 'missing: .github/workflows/release-labeling.yml',
        description: `Missing release-labeling.yml: https://github.com/${owner}/${repo}/.github/workflows/release-labeling.yml`,
        severity: 'low',
        filePath: '.github/workflows/release-labeling.yml',
        lineNumber: -1,
        codeSnippet: '',
      };

      // Use AlertService.upsertAlert for consistent duplicate handling
      const { record, created } = await AlertService.upsertAlert(issue);
      
      if (created) {
        console.log(`🆕 Created new action alert: ${issue.checkType} - ${issue.title}`);
      } else {
        console.log(`🔄 Updated existing action alert: ${issue.checkType} - ${issue.title} (detectCount: ${record.detectCount})`);
      }

      alerts.push(issue);
    }

    // Resolve old release-labeling alerts that are no longer detected (workflow files now exist)
    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        branch,
        checkType: 'release_labeling_workflow_missing',
        systemResolved: false,
      },
    });

    const timestamp = format(new Date(), 'yyyyMMddHHmmss');
    const detectedKeys = new Set<string>();
    
    // Build detected keys from current alerts
    for (const alert of alerts) {
      if (alert.checkType === 'release_labeling_workflow_missing') {
        const key = [
          alert.owner,
          alert.repo,
          alert.branch,
          alert.checkType,
          alert.title,
          alert.filePath || null,
          alert.lineNumber === -1 ? null : (alert.lineNumber || null),
          alert.codeSnippet || null
        ].join('||');
        detectedKeys.add(key);
      }
    }

    for (const row of existing) {
      const key = [
        row.getDataValue('owner'),
        row.getDataValue('repo'),
        row.getDataValue('branch'),
        row.getDataValue('checkType'),
        row.getDataValue('title'),
        row.getDataValue('filePath') || null,
        row.getDataValue('lineNumber') === -1 ? null : (row.getDataValue('lineNumber') || null),
        row.getDataValue('codeSnippet') || null
      ].join('||');

      if (!detectedKeys.has(key)) {
        await row.update({
          systemResolved: true,
          systemResolvedReason: `${timestamp}:Automatically resolved: workflow file now exists`,
        });
      }
    }
  }

  console.log(`🧾 Found ${alerts.length} action alerts for ${owner}/${repo}`);

  return { owner, repo, alerts };
}

async function checkReleaseLabelingWorkflows(rootDir: string): Promise<WorkflowFile[]> {
  const workflowFiles: WorkflowFile[] = [];
  
  // Define possible workflow file paths
  const possiblePaths = [
    path.join(rootDir, '.github', 'workflows', 'release-labeling.yml'),
    path.join(rootDir, '.github', 'workflows', 'release-labeling.yaml'),
  ];

  // Check each possible path
  for (const filePath of possiblePaths) {
    try {
      await fs.access(filePath);
      // File exists
      workflowFiles.push({
        path: filePath,
        exists: true,
        extension: path.extname(filePath) as '.yml' | '.yaml',
      });
      console.log(`✅ Found existing workflow file: ${path.relative(rootDir, filePath)}`);
    } catch {
      // File doesn't exist
      workflowFiles.push({
        path: filePath,
        exists: false,
        extension: path.extname(filePath) as '.yml' | '.yaml',
      });
      console.log(`❌ Missing workflow file: ${path.relative(rootDir, filePath)}`);
    }
  }

  return workflowFiles;
} 
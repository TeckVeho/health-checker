import { Octokit } from '@octokit/rest';

// Only check for GITHUB_API_KEY in non-test environments
const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken && process.env.NODE_ENV !== 'test') {
  throw new Error('GITHUB_API_KEY is required');
}

const octokit = new Octokit({ auth: githubToken || 'dummy-token' });

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

  // Check if PR review workflow file exists
  const workflowFiles = [
    '.github/workflows/pr-review.yml',
    '.github/workflows/pr-review.yaml'
  ];

  let workflowExists = false;
  for (const workflowFile of workflowFiles) {
    try {
      await octokit.repos.getContent({
        owner,
        repo,
        path: workflowFile,
        ref: defaultBranch
      });
      workflowExists = true;
      console.log(`✅ Found workflow file: ${workflowFile} in ${owner}/${repo}`);
      break;
    } catch (err: any) {
      if (err.status !== 404) {
        console.error(`❌ Error checking workflow file ${workflowFile} for ${owner}/${repo}:`, err);
      }
    }
  }

  if (!workflowExists) {
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

  console.log(`🧾 Found ${alerts.length} action alerts for ${owner}/${repo}`);

  return { owner, repo, alerts };
} 
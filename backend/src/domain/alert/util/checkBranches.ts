import { Octokit } from '@octokit/rest';
import { format } from 'date-fns';
import Alert from '../alertModel';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({ auth: githubToken });

const BRANCHES = ['develop', 'staging', 'production'];

export async function checkBranches(owner: string, repo: string): Promise<{ owner: string; repo: string }> {
  const timestamp = new Date();
  const filePath = '';
  const lineNumber = -1;
  const codeSnippet = '';
  const detectedKeySet = new Set<string>();

  for (const branch of BRANCHES) {
    let exists = false;
    try {
      await octokit.repos.getBranch({ owner, repo, branch });
      exists = true;
    } catch (err: any) {// eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.status !== 404) {
        console.error(`❌ Error checking branch ${owner}/${repo}@${branch}:`, err);
      }
    }

    if (!exists) {
      const checkType = 'branch_exists';
      const title = `branch:${branch}`;
      const description = `Branch '${branch}' does not exist.`;
      const key = [owner, repo, checkType, title, filePath, lineNumber, codeSnippet].join('||');
      detectedKeySet.add(key);

      await Alert.findOrCreate({
        where: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
        },
        defaults: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          description,
          severity: 'middle',
          detectCount: 1,
          lastDetectedAt: timestamp,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
          createdAt: timestamp,
        },
      }).then(async ([record, created]) => {
        if (!created) {
          await record.update({
            detectCount: record.detectCount + 1,
            lastDetectedAt: timestamp,
            systemResolved: false,
            systemResolvedReason: undefined,
          });
        }
      });
      continue;
    }

    let protectedBranch = true;
    try {
      await octokit.repos.getBranchProtection({ owner, repo, branch });
    } catch (err: any) {// eslint-disable-line @typescript-eslint/no-explicit-any
      if (err.status === 404) {
        protectedBranch = false;
      } else {
        console.error(`❌ Error checking protection ${owner}/${repo}@${branch}:`, err);
      }
    }

    if (!protectedBranch) {
      const checkType = 'branch_protection';
      const title = `branch-unprotected:${branch}`;
      const description = `Branch '${branch}' exists but is not protected.`;
      const key = [owner, repo, checkType, title, filePath, lineNumber, codeSnippet].join('||');
      detectedKeySet.add(key);

      await Alert.findOrCreate({
        where: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
        },
        defaults: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          description,
          severity: 'middle',
          detectCount: 1,
          lastDetectedAt: timestamp,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
          createdAt: timestamp,
        },
      }).then(async ([record, created]) => {
        if (!created) {
          await record.update({
            detectCount: record.detectCount + 1,
            lastDetectedAt: timestamp,
            systemResolved: false,
            systemResolvedReason: undefined,
          });
        }
      });
    }
  }

  const existing = await Alert.findAll({
    where: {
      owner,
      repo,
      checkType: ['branch_exists', 'branch_protection'],
      systemResolved: false,
    },
  });

  const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');

  for (const row of existing) {
    const key = [row.getDataValue('owner'), row.getDataValue('repo'), row.getDataValue('checkType'), row.getDataValue('title'), row.getDataValue('filePath') ?? '', row.getDataValue('lineNumber') ?? -1, row.getDataValue('codeSnippet') ?? ''].join('||');

    if (!detectedKeySet.has(key)) {
      await row.update({
        systemResolved: true,
        systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected`,
      });
    }
  }

  return { owner, repo };
}

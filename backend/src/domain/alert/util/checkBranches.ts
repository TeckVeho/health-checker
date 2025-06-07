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

  let defaultBranch = 'main';
  try {
    const repoInfo = await octokit.repos.get({ owner, repo });
    defaultBranch = repoInfo.data.default_branch;
  } catch (err) {
    console.error(`❌ Failed to fetch default branch for ${owner}/${repo}:`, err);
  }

  // ▼ default_branch_violation を記録（developでないなら high）
  if (defaultBranch !== 'develop') {
    const checkType = 'default_branch_violation';
    const title = `default-branch:${defaultBranch}`;
    const description = `Default branch is '${defaultBranch}', but expected 'develop'.`;
    const branch = defaultBranch;
    const key = [owner, repo, checkType, title, filePath, lineNumber, codeSnippet, branch].join('||');

    await Alert.findOrCreate({
      where: {
        owner,
        repo,
        checkType,
        title,
        filePath,
        lineNumber,
        codeSnippet,
        branch,
      },
      defaults: {
        owner,
        repo,
        checkType,
        title,
        filePath,
        lineNumber,
        codeSnippet,
        branch,
        description,
        severity: 'high',
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

    detectedKeySet.add(key);
  }

  for (const branch of BRANCHES) {
    const severity = branch === 'develop' ? 'high' : 'middle';

    let exists = false;
    try {
      await octokit.repos.getBranch({ owner, repo, branch });
      exists = true;
    } catch (err: any) {
      if (err.status !== 404) {
        console.error(`❌ Error checking branch ${owner}/${repo}@${branch}:`, err);
      }
    }

    if (!exists) {
      const checkType = 'branch_name_violation';
      const title = `branch:${branch}`;
      const description = `Branch '${branch}' does not exist.`;
      const key = [owner, repo, checkType, title, filePath, lineNumber, codeSnippet, branch].join('||');

      await Alert.findOrCreate({
        where: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          branch,
        },
        defaults: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          description,
          severity,
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

      detectedKeySet.add(key);
      continue;
    }

    let protectedBranch = true;
    try {
      await octokit.repos.getBranchProtection({ owner, repo, branch });
    } catch (err: any) {
      if (err.status === 404) {
        protectedBranch = false;
      } else {
        console.error(`❌ Error checking protection ${owner}/${repo}@${branch}:`, err);
      }
    }

    if (!protectedBranch) {
      const checkType = 'branch_protect_rule_violation';
      const title = `branch-unprotected:${branch}`;
      const description = `Branch '${branch}' exists but is not protected.`;
      const key = [owner, repo, checkType, title, filePath, lineNumber, codeSnippet, branch].join('||');

      await Alert.findOrCreate({
        where: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          branch,
        },
        defaults: {
          owner,
          repo,
          checkType,
          title,
          filePath,
          lineNumber,
          codeSnippet,
          branch,
          description,
          severity,
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

      detectedKeySet.add(key);
    }
  }

  // ▼ 古い未検出のアラートを自動解決
  const existing = await Alert.findAll({
    where: {
      owner,
      repo,
      checkType: ['branch_name_violation', 'branch_protect_rule_violation', 'default_branch_violation'],
      systemResolved: false,
    },
  });

  const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');

  for (const row of existing) {
    const key = [row.getDataValue('owner'), row.getDataValue('repo'), row.getDataValue('checkType'), row.getDataValue('title'), row.getDataValue('filePath') ?? '', row.getDataValue('lineNumber') ?? -1, row.getDataValue('codeSnippet') ?? '', row.getDataValue('branch') ?? ''].join('||');

    if (!detectedKeySet.has(key)) {
      await row.update({
        systemResolved: true,
        systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected`,
      });
    }
  }

  return { owner, repo };
}

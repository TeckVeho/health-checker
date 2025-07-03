import { Octokit } from '@octokit/rest';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({ auth: githubToken });

const BRANCHES = ['develop', 'staging', 'production'];

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

export interface CheckBranchesResult {
  owner: string;
  repo: string;
  alerts: AlertCandidate[];
}

export async function checkBranches(owner: string, repo: string): Promise<CheckBranchesResult> {
  const alerts: AlertCandidate[] = [];
  const filePath = '';
  const lineNumber = -1;
  const codeSnippet = '';

  let defaultBranch = 'main';
  try {
    const repoInfo = await octokit.repos.get({ owner, repo });
    defaultBranch = repoInfo.data.default_branch;
  } catch (err) {
    console.error(`❌ Failed to fetch default branch for ${owner}/${repo}:`, err);
  }

  if (defaultBranch !== 'develop') {
    const checkType = 'default_branch_violation';
    const title = `default-branch:${defaultBranch}`;
    const description = `Default branch is '${defaultBranch}', but expected 'develop'.`;
    const branch = defaultBranch;

    alerts.push({
      owner,
      repo,
      checkType,
      title,
      description,
      severity: 'high',
      filePath,
      lineNumber,
      codeSnippet,
      branch,
    });
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
      console.log(`🚨 Detected: ${checkType}:${title}`);

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
      continue;
    }

    let protectedBranch = false;

    try {
      await octokit.repos.getBranchProtection({ owner, repo, branch });
      protectedBranch = true;
    } catch (err: any) {
      if (err.status !== 404) {
        console.error(`❌ Error checking classic protection ${owner}/${repo}@${branch}:`, err);
      }
    }

    if (!protectedBranch) {
      try {
        const rulesetsRes = await octokit.request('GET /repos/{owner}/{repo}/rulesets', {
          owner,
          repo,
        });
        console.log(`📦 Fetched ${rulesetsRes.data.length} rulesets for ${owner}/${repo}`);
        for (const ruleset of rulesetsRes.data) {
          console.log(`🔍 Checking ruleset: ${ruleset.name || 'unnamed'} (enforcement=${ruleset.enforcement})`);
          if (ruleset.enforcement !== 'active') continue;
          const { data: fullRuleset } = await octokit.request('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
            owner,
            repo,
            ruleset_id: ruleset.id, // eslint-disable-line @typescript-eslint/naming-convention
          });

          const includes = fullRuleset.conditions?.ref_name?.include ?? [];
          const patterns = (fullRuleset.conditions?.ref_name as any)?.patterns ?? [];

          console.log(`📂 Target branches (include): ${includes.join(', ') || '(none)'}`);
          console.log(`📂 Target branches (patterns): ${patterns.join(', ') || '(none)'}`);

          const matches =
            includes.some((pattern: string) => {
              const clean = pattern.replace(/^refs\/heads\//, '');
              return clean === branch || clean === '*';
            }) ||
            patterns.some((pattern: string) => {
              const clean = pattern.replace(/^refs\/heads\//, '');
              const regex = new RegExp('^' + clean.replace(/\*/g, '.*') + '$');
              return regex.test(branch);
            });

          if (matches) {
            console.log(`✅ Ruleset applies to branch: ${branch}`);
            protectedBranch = true;
            break;
          }
        }
      } catch (rulesetErr) {
        console.error(`❌ Error checking rulesets for ${owner}/${repo}:`, rulesetErr);
      }
    }

    if (!protectedBranch) {
      const checkType = 'branch_protect_rule_violation';
      const title = `branch-unprotected:${branch}`;
      const description = `Branch '${branch}' exists but is not protected.`;
      console.log(`🚨 Detected: ${checkType}:${title}`);

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
  }

  console.log(`🧾 Found ${alerts.length} alerts for ${owner}/${repo}`);

  return { owner, repo, alerts };
}

import { Octokit } from '@octokit/rest';
import type { RestEndpointMethodTypes } from '@octokit/rest';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

// Octokit 初期化
const octokit = new Octokit({ auth: githubToken });

/**
 * Issueの型定義
 */
type Issue = RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][number];

/**
 * 指定リポジトリの open issue をすべて取得し、各 issue を checkIssue に渡す
 * @param owner - リポジトリ所有者（例: 'octocat'）
 * @param repo - リポジトリ名（例: 'hello-world'）
 */
export async function checkIssues(owner: string, repo: string): Promise<void> {
  const issues: Issue[] = await octokit.paginate(octokit.issues.listForRepo, {
    owner,
    repo,
    state: 'open',
    per_page: 100, //eslint-disable-line @typescript-eslint/naming-convention
  });

  for (const issue of issues) {
    // pull request でない issue のみ処理
    if (!issue.pull_request) {
      await checkIssue(issue, owner, repo);
    }
  }
}

/**
 * 個別の issue を AI で評価し、必要に応じてアラート登録
 * @param issue - チェック対象の GitHub Issue
 * @param owner - リポジトリ所有者
 * @param repo - リポジトリ名
 */
export async function checkIssue(issue: Issue, owner: string, repo: string): Promise<void> {
    if (!issue.user) {
      console.warn(`⚠️ Issue #${issue.number} has no user info, skipping alert.`);
      return;
    }
  const body = issue.body || '';
  const title = issue.title || '';
  console.log(`--------------`);
  console.log(`Title: ${issue.title} User: ${issue.user.login}`);
  if (body.trim().length <= 10) {
    console.log('❗ Body too short (<=10 chars), skipping LLM check.');
    if (!issue.user) {
      console.warn(`⚠️ Issue #${issue.number} has no user info, skipping alert.`);
      return;
    }
    registIssueAlert(owner, repo, issue.user.login, issue.number, 'Issue body too short', 'Provide more details about the issue.');
    return;
  }

  const prompt = `
Evaluate how well the issue communicates:
1. Purpose — why it exists or what it aims to achieve  
2. Details — context, expected behavior, steps, etc.
Score from 0 to 10:
- 0 = Excellent (clear purpose and details)
- 1–3 = Minor issues
- 4–6 = Somewhat unclear or lacking
- 7–9 = Major gaps
- 10 = Very poor (empty or meaningless)
Respond ONLY in this JSON format:
{
  "rank": 0-10,
  "title": "Short summary of writing quality",
  "description": "(about 8-12 words)"   
}
---
Issue Title: ${title}
Issue Body:
${body}
---
`;

  const result = await generateText({
    model: openai('gpt-4o-mini'),
    prompt,
  });

  const output = result.text.trim();

  if (output === 'noproblem') {
    console.log('no problem');
    return;
  }

  try {
    const parsed = JSON.parse(output);
    

    if (typeof parsed.rank === 'number' && parsed.rank >= 5) {

      registIssueAlert(owner, repo, issue.user.login, issue.number, parsed.title, parsed.description);
    } else {
      console.log('🟢 Rank is low, no alert needed.');
    }
  } catch (err) {
    console.warn('⚠️ Failed to parse AI response:', output);
    console.log(err);
  }
}

/**
 * アラート登録用関数（仮実装: ログ出力のみ）
 * @param owner - リポジトリ所有者
 * @param repo - リポジトリ名
 * @param creator - issue 作成ユーザーのログイン名
 * @param issueNumber - issue 番号
 * @param title - 評価されたタイトル
 * @param description - 評価された内容
 */
export function registIssueAlert(owner: string, repo: string, creator: string, issueNumber: number, title: string, description: string): void {
  console.log(`🔔 registIssueAlert called`);
  console.log(`  rankTitle   : ${title}`);
  console.log(`  description : ${description}`);
}

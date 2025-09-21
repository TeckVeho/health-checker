import { GitHubUtility, PullRequestReview } from './util/github';
import { PRCheck } from './util/PRCheck';

export class GithubActionService {
  static async reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<PullRequestReview> {
    console.log(`[INFO] Starting review for PR: ${owner}/${repo}#${prNumber}`);

    const checklist: string[] = [];
    const pr = await GitHubUtility.getPullRequest(owner, repo, prNumber);
    const files = await GitHubUtility.listFiles(owner, repo, prNumber);
    const diffs = files
      .filter((f) => f.patch)
      .map((f) => `--- ${f.filename}\n${f.patch}`)
      .join('\n\n');
    const prBody = pr.body ?? '';

    const pushCheck = (condition: boolean, label: string, customIcon?: string) => {
      const icon = customIcon ?? (condition ? '✅' : '❌');
      checklist.push(`${icon} ${label}`);
    };

    // [Check]  Linked issue
    const issueNumber = await GitHubUtility.getLinkedIssueNumber(owner, repo, prNumber);
    pushCheck(!!issueNumber, 'Issue is linked');

    // [Check]  PR body includes meaningful content
    const hasBody = PRCheck.hasMeaningfulBody(prBody);
    pushCheck(hasBody, 'PR body includes meaningful content');

    if (!hasBody) {
      pushCheck(false, 'AI review skipped due to insufficient PR body');
    } else if (prBody.length + diffs.length > 150 * 1000) {
      console.log(`[DEBUG] Total patch size: ${diffs.length} chars`);
      pushCheck(false, 'Body size + Diff size is acceptable for AI review', '❓');
    } else {
      const { type, prBodyResult, prBodyReason, diffResult, diffReason } = await PRCheck.runUnifiedLLMReview(pr, diffs);

      // [Check] Test evidence (only for code type)
      if (type === 'code') {
        pushCheck(PRCheck.hasTestEvidence(prBody), 'Test evidence is included');
      }

      // [Check] PR body clarity
      pushCheck(prBodyResult, `[AI] PR body review: ${prBodyReason}`);

      // [Check] Diff AI review
      pushCheck(diffResult, `[AI] Changed file review: ${diffReason}`);
    }

    const allPass = checklist.every((line) => line.startsWith('✅'));
    const review: PullRequestReview = {
      decision: allPass ? 'approve' : 'comment',
      reason: checklist.join('\n'),
    };

    await GitHubUtility.submitReview(owner, repo, prNumber, review);
    return review;
  }
}

export default GithubActionService;

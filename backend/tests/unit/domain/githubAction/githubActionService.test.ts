import { GithubActionService } from '../../../../src/domain/githubAction/githubActionService';
import { GitHubUtility } from '../../../../src/domain/githubAction/util/github';
import { PRCheck } from '../../../../src/domain/githubAction/util/PRCheck';

// GitHubUtilityのモック
jest.mock('../../../../src/domain/githubAction/util/github');
const mockGitHubUtility = GitHubUtility as jest.Mocked<typeof GitHubUtility>;

// PRCheckのモック
jest.mock('../../../../src/domain/githubAction/util/PRCheck');
const mockPRCheck = PRCheck as jest.Mocked<typeof PRCheck>;

describe('GithubActionService', () => {
  const owner = 'test-owner';
  const repo = 'test-repo';
  const prNumber = 123;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reviewPullRequest', () => {
    const mockPR = {
      title: 'Test PR',
      body: 'Test PR body with meaningful content',
      number: prNumber,
    };

    const mockFiles = [
      {
        filename: 'test.ts',
        patch: '@@ -1,3 +1,3 @@\n-old line\n+new line',
      },
    ];

    beforeEach(() => {
      mockGitHubUtility.getPullRequest.mockResolvedValue(mockPR);
      mockGitHubUtility.listFiles.mockResolvedValue(mockFiles);
      mockGitHubUtility.getLinkedIssueNumber.mockResolvedValue(456);
      mockGitHubUtility.submitReview.mockResolvedValue();
    });

    describe('AI Review ログチェックが削除されていることの確認', () => {
      it('codeタイプのPRでAI Review ログチェックが実行されない', async () => {
        // PRCheckのモック設定
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.hasTestEvidence.mockReturnValue(true);
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'code',
          prBodyResult: true,
          prBodyReason: 'Clear description',
          diffResult: true,
          diffReason: 'Consistent changes',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        // hasAILogUrlメソッドが削除されていることを確認
        expect(mockPRCheck.hasAILogUrl).toBeUndefined();
        
        // 結果の検証
        expect(result.decision).toBe('approve');
        expect(result.reason).toContain('✅ Issue is linked');
        expect(result.reason).toContain('✅ PR body includes meaningful content');
        expect(result.reason).toContain('✅ Test evidence is included');
        expect(result.reason).toContain('✅ [AI] PR body review: Clear description');
        expect(result.reason).toContain('✅ [AI] Changed file review: Consistent changes');
        
        // AI Review ログチェックの結果が含まれていないことを確認
        expect(result.reason).not.toContain('AI execution log URL is included');
      });

      it('documentタイプのPRでTest evidenceチェックもAI Review ログチェックも実行されない', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'document',
          prBodyResult: true,
          prBodyReason: 'Good documentation',
          diffResult: true,
          diffReason: 'Appropriate changes',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        // hasTestEvidenceが呼び出されていないことを確認
        expect(mockPRCheck.hasTestEvidence).not.toHaveBeenCalled();
        // hasAILogUrlメソッドが削除されていることを確認
        expect(mockPRCheck.hasAILogUrl).toBeUndefined();
        
        // Test evidenceとAI Review ログの結果が含まれていないことを確認
        expect(result.reason).not.toContain('Test evidence is included');
        expect(result.reason).not.toContain('AI execution log URL is included');
      });
    });

    describe('Test evidenceチェックの改善確認', () => {
      it('改善されたTest evidenceチェックが正常に動作する', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.hasTestEvidence.mockReturnValue(true); // 改善されたロジックでtrueを返す
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'code',
          prBodyResult: true,
          prBodyReason: 'Clear description',
          diffResult: true,
          diffReason: 'Good changes',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(mockPRCheck.hasTestEvidence).toHaveBeenCalledWith('Test PR body with meaningful content');
        expect(result.reason).toContain('✅ Test evidence is included');
      });

      it('Test evidenceが見つからない場合は適切にFailする', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.hasTestEvidence.mockReturnValue(false);
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'code',
          prBodyResult: true,
          prBodyReason: 'Clear description',
          diffResult: true,
          diffReason: 'Good changes',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(result.decision).toBe('comment');
        expect(result.reason).toContain('❌ Test evidence is included');
      });
    });

    describe('全体的なレビューフロー', () => {
      it('すべてのチェックがパスする場合はapproveを返す', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.hasTestEvidence.mockReturnValue(true);
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'code',
          prBodyResult: true,
          prBodyReason: 'Excellent description',
          diffResult: true,
          diffReason: 'Perfect implementation',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(result.decision).toBe('approve');
        expect(mockGitHubUtility.submitReview).toHaveBeenCalledWith(owner, repo, prNumber, result);
      });

      it('いずれかのチェックが失敗する場合はcommentを返す', async () => {
        mockGitHubUtility.getLinkedIssueNumber.mockResolvedValue(null); // Issue linkが失敗
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.hasTestEvidence.mockReturnValue(true);
        mockPRCheck.runUnifiedLLMReview.mockResolvedValue({
          type: 'code',
          prBodyResult: true,
          prBodyReason: 'Good description',
          diffResult: true,
          diffReason: 'Good changes',
        });

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(result.decision).toBe('comment');
        expect(result.reason).toContain('❌ Issue is linked');
      });

      it('PR bodyが不十分な場合はAIレビューをスキップする', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(false);

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(mockPRCheck.runUnifiedLLMReview).not.toHaveBeenCalled();
        expect(result.reason).toContain('❌ AI review skipped due to insufficient PR body');
      });

      it('PR body + diffサイズが大きすぎる場合は適切に処理する', async () => {
        const largePR = {
          ...mockPR,
          body: 'a'.repeat(100000), // 大きなPR body
        };
        const largeDiff = [
          {
            filename: 'large.ts',
            patch: 'b'.repeat(100000), // 大きなdiff
          },
        ];

        mockGitHubUtility.getPullRequest.mockResolvedValue(largePR);
        mockGitHubUtility.listFiles.mockResolvedValue(largeDiff);
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);

        const result = await GithubActionService.reviewPullRequest(owner, repo, prNumber);

        expect(mockPRCheck.runUnifiedLLMReview).not.toHaveBeenCalled();
        expect(result.reason).toContain('❓ Body size + Diff size is acceptable for AI review');
      });
    });

    describe('エラーハンドリング', () => {
      it('GitHubUtilityでエラーが発生した場合も適切に処理する', async () => {
        mockGitHubUtility.getPullRequest.mockRejectedValue(new Error('GitHub API Error'));

        await expect(GithubActionService.reviewPullRequest(owner, repo, prNumber)).rejects.toThrow('GitHub API Error');
      });

      it('LLMレビューでエラーが発生した場合も適切に処理する', async () => {
        mockPRCheck.hasMeaningfulBody.mockReturnValue(true);
        mockPRCheck.runUnifiedLLMReview.mockRejectedValue(new Error('LLM Error'));

        await expect(GithubActionService.reviewPullRequest(owner, repo, prNumber)).rejects.toThrow('LLM Error');
      });
    });
  });
});

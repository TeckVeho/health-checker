import { PRCheck } from '../../../../../src/domain/githubAction/util/PRCheck';

describe('PRCheck', () => {
  describe('hasTestEvidence', () => {
    describe('既存のテスト証拠パターン', () => {
      it('yarn test コマンドを検出する', () => {
        const body = 'テストを実行しました: yarn test';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('npm test コマンドを検出する', () => {
        const body = 'テストを実行: npm test';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('php artisan test コマンドを検出する', () => {
        const body = 'Laravel テスト: php artisan test';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('yarn コマンド（test以外）を検出する', () => {
        const body = 'パッケージをインストール: yarn install';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('スクリーンショット画像を検出する', () => {
        const body = '結果のスクリーンショット: ![test](screenshot.png)';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('GitHub画像URLを検出する', () => {
        const body = 'テスト結果: https://github.com/user-attachments/assets/abc123def456';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('GitHub Actions実行ログを検出する', () => {
        const body = 'CI結果: https://github.com/owner/repo/runs/123456789';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });
    });

    describe('新規追加: パフォーマンステスト関連パターン', () => {
      it('Performance Test キーワードを検出する', () => {
        const body = 'Performance Test: Cache vs GitHub API';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('Performance Benchmark キーワードを検出する', () => {
        const body = 'Performance Benchmark results are available';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('Performance Comparison キーワードを検出する', () => {
        const body = 'Performance Comparison shows improvement';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('ミリ秒単位のベンチマーク結果を検出する', () => {
        const body = 'Cache retrieval: 0.594ms';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('マイクロ秒単位のベンチマーク結果を検出する', () => {
        const body = 'Response time: 150μs';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('ナノ秒単位のベンチマーク結果を検出する', () => {
        const body = 'Processing time: 500ns';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('秒単位のベンチマーク結果を検出する', () => {
        const body = 'GitHub API retrieval: 612.994 seconds';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('速度改善指標を検出する', () => {
        const body = 'Speed Improvement: ~1000x faster';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('複数桁の速度改善を検出する', () => {
        const body = 'Performance improved: 50x faster than before';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });
    });

    describe('新規追加: Evidence セクション関連パターン', () => {
      it('Evidence セクションヘッダーを検出する', () => {
        const body = `
## Evidence

### Performance Benchmarks
テスト結果がここに記載されています。
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('Test Results セクションヘッダーを検出する', () => {
        const body = `
## Test Results

すべてのテストが通りました。
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('Testing セクションヘッダーを検出する', () => {
        const body = `
## Testing

テスト手順と結果
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('Tests セクションヘッダーを検出する', () => {
        const body = `
## Tests

- ユニットテスト: 通過
- 統合テスト: 通過
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('スペースありのEvidence セクションを検出する', () => {
        const body = `
##   Evidence   

テスト証拠がここにあります。
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });
    });

    describe('複合パターンのテスト', () => {
      it('issue #126で言及されたパフォーマンステスト結果を検出する', () => {
        const body = `
## Evidence

### Performance Benchmarks

\`\`\`
Performance Test: Cache vs GitHub API
Using cached issue data from: docs/issues/124/issue.md
Cache retrieval: 0.594ms
GitHub API retrieval: 612.994ms
Both methods successful
\`\`\`

**Speed Improvement: ~1000x faster**
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('複数の新規パターンが含まれる場合を検出する', () => {
        const body = `
## Test Results

Performance Benchmark shows 50x faster execution.
Response time improved from 1000ms to 20ms.
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });
    });

    describe('否定的なテストケース', () => {
      it('テスト証拠が含まれていない場合はfalseを返す', () => {
        const body = 'これは単純な説明文です。テスト関連の情報は含まれていません。';
        expect(PRCheck.hasTestEvidence(body)).toBe(false);
      });

      it('空文字列の場合はfalseを返す', () => {
        const body = '';
        expect(PRCheck.hasTestEvidence(body)).toBe(false);
      });

      it('関連しないキーワードのみの場合はfalseを返す', () => {
        const body = 'この変更により機能が改善されました。';
        expect(PRCheck.hasTestEvidence(body)).toBe(false);
      });

      it('数値のみでベンチマーク単位がない場合はfalseを返す', () => {
        const body = '処理時間: 0.594';
        expect(PRCheck.hasTestEvidence(body)).toBe(false);
      });
    });

    describe('エッジケース', () => {
      it('大文字小文字を区別しない', () => {
        const body = 'PERFORMANCE TEST: results';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('部分的なマッチでも検出する', () => {
        const body = 'パフォーマンステストの結果、Performance Testが成功しました';
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });

      it('複数行にわたるテキストでも検出する', () => {
        const body = `
        最初の行
        Performance Test: 
        結果が良好でした
        `;
        expect(PRCheck.hasTestEvidence(body)).toBe(true);
      });
    });
  });

  describe('hasMeaningfulBody', () => {
    it('意味のあるコンテンツがある場合はtrueを返す', () => {
      const body = 'この変更により、パフォーマンスが向上しました。テストも追加しています。';
      expect(PRCheck.hasMeaningfulBody(body)).toBe(true);
    });

    it('空のボディの場合はfalseを返す', () => {
      const body = '';
      expect(PRCheck.hasMeaningfulBody(body)).toBe(false);
    });

    it('テンプレートのみの場合はfalseを返す', () => {
      const body = 'rewrite the summary of the tasks performed for this issue and its goal';
      expect(PRCheck.hasMeaningfulBody(body)).toBe(false);
    });

    it('短すぎるコンテンツの場合はfalseを返す', () => {
      const body = 'fix';
      expect(PRCheck.hasMeaningfulBody(body)).toBe(false);
    });
  });

  describe('isBodyEmpty', () => {
    it('空文字列の場合はtrueを返す', () => {
      expect(PRCheck.isBodyEmpty('')).toBe(true);
    });

    it('nullの場合はtrueを返す', () => {
      expect(PRCheck.isBodyEmpty(null as any)).toBe(true);
    });

    it('undefinedの場合はtrueを返す', () => {
      expect(PRCheck.isBodyEmpty(undefined as any)).toBe(true);
    });

    it('空白のみの場合はtrueを返す', () => {
      expect(PRCheck.isBodyEmpty('   \n\t  ')).toBe(true);
    });

    it('内容がある場合はfalseを返す', () => {
      expect(PRCheck.isBodyEmpty('内容があります')).toBe(false);
    });
  });

  describe('isTemplateOnly', () => {
    it('テンプレートフレーズが含まれている場合はtrueを返す', () => {
      const body = 'rewrite the summary of the tasks performed for this issue and its goal';
      expect(PRCheck.isTemplateOnly(body)).toBe(true);
    });

    it('複数のテンプレートフレーズのいずれかが含まれている場合はtrueを返す', () => {
      const body = 'provide the logs of dodoai during the development process';
      expect(PRCheck.isTemplateOnly(body)).toBe(true);
    });

    it('テンプレートフレーズが含まれていない場合はfalseを返す', () => {
      const body = 'この変更により機能が改善されました';
      expect(PRCheck.isTemplateOnly(body)).toBe(false);
    });

    it('大文字小文字を区別しない', () => {
      const body = 'REWRITE THE SUMMARY OF THE TASKS PERFORMED FOR THIS ISSUE AND ITS GOAL';
      expect(PRCheck.isTemplateOnly(body)).toBe(true);
    });
  });

  describe('hasSubstantialContent', () => {
    it('十分な長さのコンテンツがある場合はtrueを返す', () => {
      const body = 'この変更により、システムのパフォーマンスが大幅に向上しました。';
      expect(PRCheck.hasSubstantialContent(body)).toBe(true);
    });

    it('短すぎるコンテンツの場合はfalseを返す', () => {
      const body = 'fix';
      expect(PRCheck.hasSubstantialContent(body)).toBe(false);
    });

    it('ちょうど30文字の場合はtrueを返す', () => {
      const body = '1234567890123456789012345678901'; // 31文字
      expect(PRCheck.hasSubstantialContent(body)).toBe(true);
    });

    it('29文字の場合はfalseを返す', () => {
      const body = '12345678901234567890123456789'; // 29文字
      expect(PRCheck.hasSubstantialContent(body)).toBe(false);
    });
  });

  describe('hasAIReviewComment', () => {
    it('@dodo-aiが含まれるコメントを検出する', () => {
      const comments = ['通常のコメント', '@dodo-ai レビューをお願いします'];
      expect(PRCheck.hasAIReviewComment(comments)).toBe(true);
    });

    it('AI review resultが含まれるコメントを検出する', () => {
      const comments = ['AI review result: 承認されました'];
      expect(PRCheck.hasAIReviewComment(comments)).toBe(true);
    });

    it('該当するコメントがない場合はfalseを返す', () => {
      const comments = ['通常のコメント', '別の通常のコメント'];
      expect(PRCheck.hasAIReviewComment(comments)).toBe(false);
    });

    it('空の配列の場合はfalseを返す', () => {
      const comments: string[] = [];
      expect(PRCheck.hasAIReviewComment(comments)).toBe(false);
    });
  });

  describe('hasExpectedPrompt', () => {
    it('期待されるプロンプトパターンを検出する', () => {
      const comments = ['Please review the following TypeScript code based on the criteria below'];
      expect(PRCheck.hasExpectedPrompt(comments)).toBe(true);
    });

    it('期待されるプロンプトがない場合はfalseを返す', () => {
      const comments = ['通常のコメント'];
      expect(PRCheck.hasExpectedPrompt(comments)).toBe(false);
    });

    it('空の配列の場合はfalseを返す', () => {
      const comments: string[] = [];
      expect(PRCheck.hasExpectedPrompt(comments)).toBe(false);
    });
  });
});

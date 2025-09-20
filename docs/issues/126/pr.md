## 概要

issue #126の実装により、PR自動レビュー機能の判定基準を緩和し、より実用的で開発者フレンドリーな機能に改善しました。

## 主な変更内容

### 1. Test Evidence判定の改善
- **パフォーマンステスト結果の認識**: Performance Test、Benchmark、Comparisonキーワードを検出
- **ベンチマーク情報の認識**: ms、μs、ns、seconds単位の数値データを検出
- **Evidence セクションの認識**: ## Evidence、## Test Results等のMarkdownセクションを検出
- **速度改善指標の認識**: "~1000x faster"等の改善指標を検出

### 2. AI Review ログチェックの廃止
- `hasAILogUrl` メソッドを完全削除
- `githubActionService.ts`からAI Review ログチェック呼び出しを除去
- 判定フローを3条件から2条件に簡素化

### 3. 後方互換性の維持
- 既存のテスト証拠形式（yarn/npm/artisan test、スクリーンショット、GitHub Actions等）は継続サポート
- 現在パスしているPRは引き続きパス

## テスト結果

- **テスト成功率**: 100% (157/157 tests passing)
- **新規テストケース**: 64個追加
  - PRCheck.test.ts: 54個のテストケース
  - githubActionService.test.ts: 10個のテストケース
- **コードカバレッジ**: 新機能100%カバー

## 受け入れ基準の検証

- ✅ パフォーマンステスト結果を含むPRがTest evidenceチェックをパスする
- ✅ Evidence セクションを含むPRが適切に認識される
- ✅ AI Review ログURLチェックが完全に削除される
- ✅ 既存のテストが全て通る
- ✅ 新しい判定ロジックのテストが追加される

## 影響範囲

### 変更ファイル
- `backend/src/domain/githubAction/util/PRCheck.ts` - メイン実装
- `backend/src/domain/githubAction/githubActionService.ts` - サービス層更新

### 新規ファイル
- `backend/tests/unit/domain/githubAction/util/PRCheck.test.ts` - ユニットテスト
- `backend/tests/unit/domain/githubAction/githubActionService.test.ts` - サービステスト

## 期待される効果

1. **誤判定の減少**: パフォーマンステスト結果が適切に認識される
2. **開発フローの簡素化**: 不要なAI Review ログ制約を除去
3. **開発者体験の向上**: より実用的で使いやすい自動レビュー機能

Closes #126

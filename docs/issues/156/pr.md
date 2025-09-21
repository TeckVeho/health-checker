# feat: PRコマンド改善 - Evidenceセクション追加とpr.md保存機能

## 概要

PRコマンドにEvidenceセクションを追加し、テスト結果を含むPR bodyを作成・保存する機能を実装しました。

## 実装内容

### 主要な変更点
- **Evidenceセクションの追加**: PR bodyにテスト結果と実行詳細を含むセクションを追加
- **テスト結果統合**: `docs/issues/{issue_number}/evidence/test-results.json`からの自動読み込み
- **pr.md保存機能**: commit前にPR bodyを`docs/issues/{issue_number}/pr.md`に保存
- **詳細なテスト情報**: テスト実行コマンド、結果、カバレッジ情報の表示
- **失敗テストの詳細**: 失敗したテストの詳細情報とエラーメッセージの表示

### 技術的改善
- PRコマンドのワークフローを4ステップに拡張
- テスト結果の自動解析とフォーマット機能
- Evidenceセクションのテンプレート実装
- エラーハンドリングの強化

## Evidence

### Test Execution Summary
- **Backend Tests**: 395 tests passed, 0 tests failed (2.068s)
- **Frontend Tests**: 200 tests passed, 0 tests failed (1.77s)
- **Total Execution Time**: 3.838s
- **Overall Status**: PASSED

### Test Results Details

**Backend Test Results:**
- Test Suites: 25
- Tests: 395
- Passed: 395
- Failed: 0
- Status: PASSED
- Duration: 2.068s

**Frontend Test Results:**
- Test Files: 16
- Tests: 200
- Passed: 200
- Failed: 0
- Status: PASSED
- Duration: 1.77s

### Failed Tests (if any)
No failed tests detected.

### Coverage Information

**Backend Coverage:**
- Statements: 50.64%
- Branches: 37.32%
- Functions: 35.95%
- Lines: 50.92%

## 受け入れ基準の確認

- [x] PR bodyにEvidenceセクションが追加される
- [x] テスト結果が適切にフォーマットされて表示される
- [x] 失敗したテストの詳細が表示される（該当なし）
- [x] pr.mdファイルがcommit前に保存される
- [x] 既存の機能に影響しない

## 関連ファイル

- `.cursor/commands/pr.md` - 改善されたPRコマンド
- `docs/issues/156/evidence/test-results.json` - テスト結果データ
- `docs/issues/156/pr.md` - 生成されたPR body（このファイル）

## テスト実行コマンド

```bash
# バックエンドテスト
cd backend && yarn test:unit

# フロントエンドテスト  
cd frontend && yarn test
```

Closes #156

# Issue #122: Fix Test Error

## 基本情報

- **Issue番号**: #122
- **タイトル**: Fix Test Error
- **状態**: OPEN
- **作成日**: 2025-09-20T03:44:03Z
- **更新日**: 2025-09-20T03:44:03Z
- **URL**: https://github.com/TeckVeho/health-checker/issues/122
- **ラベル**: なし
- **アサイニー**: なし

## 問題の概要

現在のテスト実行時に複数のエラーが発生し、テストスイートが正常に動作しない状態です。

## 発生しているエラー

### 1. SyntaxError - auditScanner.ts (Line 78)
```
console.warn(`⚠️ Failed to read .git/HEAD for branch name:`, err);
                                                                ^
SyntaxError: Unexpected token ')'
```

**場所**: `src/domain/alert/util/auditScanner.ts:78`
**原因**: `console.warn`文で余分な括弧が存在

### 2. ESモジュールインポートエラー - Contract Tests
```
SyntaxError: Cannot use import statement outside a module
import { Octokit as Core } from "@octokit/core";
^^^^^^
```

**影響を受けるテスト**:
- `tests/contract/test_alerts_by_specific_author.test.ts`
- `tests/contract/test_alerts_by_author.test.ts`  
- `tests/contract/test_backfill_authors.test.ts`

**原因**: `@octokit/rest`パッケージのESモジュール設定とJest設定の不整合

## 現在のテスト結果

- ✅ Unit Tests: 84 passed
- ❌ Contract Tests: 3 failed (ESモジュールエラー)
- ❌ Syntax Error: 1件

```
Test Suites: 4 failed, 6 passed, 10 total
Tests: 84 passed, 84 total
```

## 修正が必要な項目

### 高優先度
1. **auditScanner.ts Line 78の構文エラー修正**
   - 余分な括弧を削除
   - 該当行: `console.warn(\`⚠️ Failed to read .git/HEAD for branch name:\`, err);`

### 中優先度  
2. **Jest ESモジュール設定の修正**
   - `@octokit/rest`パッケージのESモジュール対応
   - `transformIgnorePatterns`の設定追加
   - Contract テストの実行環境修正

## 期待される結果

- すべてのテストスイートが正常に実行される
- Contract テストが ESモジュールエラーなしで動作する
- 構文エラーが解消される

## 技術的詳細

**環境**:
- Node.js + TypeScript
- Jest with ts-jest
- @octokit/rest package

**現在のJest設定**:
```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "useESM": true,
  "extensionsToTreatAsEsm": [".ts"]
}
```

## 実装ステータス

### タスクチェックリスト
- [ ] auditScanner.ts Line 78の構文エラー修正
- [ ] Jest ESモジュール設定の確認と修正
- [ ] @octokit/rest パッケージ設定の調整
- [ ] Contract テストの実行環境修正
- [ ] 全テストスイートの正常実行確認

### 進捗状況
- **開始日**: 未開始
- **完了予定日**: 未定
- **現在の状況**: 課題特定完了、実装待ち

### 関連ファイル
- `src/domain/alert/util/auditScanner.ts` (構文エラー修正対象)
- `jest.config.ts` (ESモジュール設定)
- `tests/contract/test_alerts_by_specific_author.test.ts`
- `tests/contract/test_alerts_by_author.test.ts`
- `tests/contract/test_backfill_authors.test.ts`

## 備考

このissueはテストスイートの安定性に直接影響する重要な修正項目です。特に構文エラーは高優先度で対応する必要があります。

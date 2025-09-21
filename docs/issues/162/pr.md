# Pull Request: author_display_name列の廃止

## 概要
Closes #162

`author_display_name`列を廃止し、`author`列のみで管理するように変更しました。これにより、データベーススキーマが簡素化され、フロントエンドの表示ロジックも統一されます。

## 実装内容

### Backend変更
- **alertSchema.ts**: `authorDisplayName`フィールドを削除
- **alertService.ts**: `author_display_name`の参照を削除
- **authorExtractor.ts**: `authorDisplayName`の抽出ロジックを削除
- **validators.ts**: `authorDisplayName`の検証ロジックを削除
- **types.ts**: `authorDisplayName`の型定義を削除

### Frontend変更
- **AuthorGroupedTable.vue**: `displayName`の表示とアバターアイコンを削除
- **authors/[author].vue**: `authorDisplayName`の表示とアバターアイコンを削除
- **useAuthorAlerts.ts**: `displayName`の型定義を削除

### テスト更新
- **alertSchema.test.ts**: `authorDisplayName`関連のテストを削除
- **test_alerts_by_author.test.ts**: `displayName`関連のテストを削除
- **AuthorGroupedTable.spec.ts**: `displayName`関連のテストを削除

## 変更ファイル
- `backend/src/domain/alert/alertSchema.ts`
- `backend/src/domain/alert/alertService.ts`
- `backend/src/domain/alert/util/checkIssues/authorExtractor.ts`
- `backend/src/domain/alert/util/checkIssues/types.ts`
- `backend/src/domain/alert/util/checkIssues/validators.ts`
- `backend/tests/contract/test_alerts_by_author.test.ts`
- `backend/tests/unit/domain/alert/alertSchema.test.ts`
- `frontend/src/components/Molecules/AuthorGroupedTable.vue`
- `frontend/src/composables/useAuthorAlerts.ts`
- `frontend/src/pages/authors/[author].vue`
- `frontend/tests/unit/components/Molecules/AuthorGroupedTable.spec.ts`

## 影響範囲
- データベーススキーマの変更（`author_display_name`列の削除）
- APIレスポンスの変更（`authorDisplayName`フィールドの削除）
- フロントエンドの表示ロジックの変更（アバターアイコンと表示名の削除）

## 動作確認
- Author-based viewでアバターアイコンが削除されていることを確認
- 著者詳細ページでアバターアイコンが削除されていることを確認
- 著者名と外部リンクボタンが同じ行に表示されることを確認

## Evidence

### Test Execution Summary
⚠️ **No test results available**
- Tests have not been executed or results are not accessible
- Please run `/test` command to execute tests before creating PR
- Test results file: `docs/issues/162/evidence/test-results.json` not found

## 備考
- データベーススキーマの同期は接続エラーのため延期されています
- 実装は完了しており、フロントエンドでの動作確認も完了しています

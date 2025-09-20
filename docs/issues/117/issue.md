# Issue #117: Disable check "Expired End Date"

## 基本情報

- **Issue番号**: #117
- **タイトル**: Disable check "Expired End Date"
- **状態**: OPEN
- **作成日**: 2025-09-19T03:03:17Z
- **更新日**: 2025-09-20T01:23:16Z
- **URL**: https://github.com/TeckVeho/health-checker/issues/117
- **担当者**: 未割り当て
- **ラベル**: なし

## 概要

Health CheckerシステムのIssueチェック機能において、「Expired End Date」チェック（`issue_expired_end_date`）を完全に無効化する。

## 問題

現在、システムはIssueの終了日が過去の日付になっている場合に`issue_expired_end_date`アラートを自動生成している。このチェック機能が運用上不要になったため、コードから完全に削除する必要がある。

## 具体的な変更内容

### 1. バックエンド - validators.ts の修正
**ファイル**: `backend/src/domain/alert/util/checkIssues/validators.ts`

**変更箇所**: 133-142行目の期限切れチェックロジックを削除
```typescript
// 削除対象コード (133-142行目)
} else if (endDate < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
  // End Date expired (before yesterday)
  alerts.push(createAlert(
    issue,
    owner,
    repo,
    'issue_expired_end_date',
    `Issue #${issue.number} has expired End Date: ${endDate.toISOString().split('T')[0]}.`,
    'middle'
  ));
}
```

### 2. バックエンド - alertService.ts の修正
**ファイル**: `backend/src/domain/alert/alertService.ts`

**変更箇所1**: 293行目のcheckType配列から`issue_expired_end_date`を削除
```typescript
// 修正前
checkType: ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_expired_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction'],

// 修正後
checkType: ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction'],
```

**変更箇所2**: 572行目のCOUNT集計から`expired_end_date_count`を削除
```sql
-- 削除対象
COUNT(CASE WHEN check_type = 'issue_expired_end_date' THEN 1 END) as expired_end_date_count,
```

**変更箇所3**: 624行目の`expiredEndDate`プロパティを削除
```typescript
// 削除対象
expiredEndDate: parseInt(row.expired_end_date_count),
```

### 3. フロントエンド - types.ts の修正
**ファイル**: `frontend/src/types/alerts.ts`

**変更箇所**: 31行目の`issue_expired_end_date`エントリを削除
```typescript
// 削除対象
issue_expired_end_date: 'Issue Expired End Date',
```

### 4. フロントエンド - constants.ts の修正
**ファイル**: `frontend/src/constants/table.ts`

**変更箇所**: 30行目から`issue_expired_end_date`を削除
```typescript
// 修正前の配列から削除
'issue_expired_end_date',
```

### 5. フロントエンド - Author詳細ページの修正
**ファイル**: `frontend/src/pages/authors/[author].vue`

**変更箇所1**: 233行目の'Overdue'ラベル削除
```typescript
// 削除対象
'issue_expired_end_date': 'Overdue',
```

**変更箇所2**: 247行目のスタイル定義削除
```typescript
// 削除対象
'issue_expired_end_date': 'bg-red-100 text-red-800',
```

### 6. フロントエンド - AuthorGroupedTable.vue の修正
**ファイル**: `frontend/src/components/Molecules/AuthorGroupedTable.vue`

**変更箇所**: 108-113行目の「Overdue」カラム全体を削除
```vue
<!-- 削除対象 -->
<!-- Expired End Date Column -->
<Column field="issueTypeCounts.expiredEndDate" header="Overdue" :sortable="true" class="text-center min-w-16">
  <template #body="{ data: row }">
    <Badge 
      :value="row.issueTypeCounts.expiredEndDate || 0" 
      :severity="row.issueTypeCounts.expiredEndDate > 0 ? 'danger' : 'secondary'"
    />
  </template>
</Column>
```

### 7. フロントエンド - useAuthorAlerts.ts の修正
**ファイル**: `frontend/src/composables/useAuthorAlerts.ts`

**変更箇所**: 17行目の`expiredEndDate`プロパティを削除
```typescript
// 削除対象
expiredEndDate: number;
```

### 8. テストファイルの修正
**ファイル**: `backend/tests/unit/domain/alert/checkIssues.test.ts`

**削除対象テストケース**:
- 176-212行目: `'should detect expired end date'`テスト
- 1064-1095行目: `'should handle issues with expired end date in body'`テスト内の期限切れ関連アサーション

**ファイル**: `frontend/tests/unit/composables/useCheckTypeAlerts.spec.ts`
- 30行目と158行目の`issue_expired_end_date`参照を削除

## データベースクリーンアップ（オプション）

既存の`issue_expired_end_date`アラートを解決状態にするSQLクエリ:
```sql
UPDATE alerts 
SET system_resolved = true, 
    system_resolved_reason = 'Feature disabled - Expired End Date check removed'
WHERE check_type = 'issue_expired_end_date' 
AND system_resolved = false;
```

## 受け入れ基準

- [ ] 新しい`issue_expired_end_date`アラートが生成されない
- [ ] フロントエンドから「Overdue」カラムが完全に削除されている
- [ ] 全てのテストが通過する
- [ ] TypeScriptコンパイルエラーが発生しない
- [ ] 既存の他のチェック機能に影響がない

## 影響範囲

- バックエンド: 3ファイル
- フロントエンド: 5ファイル  
- テスト: 2ファイル
- データベース: 既存アラートの解決（オプション）

## 実装ステータス

- [ ] 仕様書作成
- [ ] 実装計画作成
- [ ] 実装開始
- [ ] テスト実行
- [ ] プルリクエスト作成
- [ ] レビュー完了
- [ ] マージ完了

## 備考

この変更により、システムから`issue_expired_end_date`チェック機能が完全に削除され、関連するUI表示も全て除去されます。

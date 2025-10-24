# Issue #174: Show PR alert check type-based-view / Author based-view - 実装計画

## 目的
check type-based-view / Author based-view で、PR bodyチェックのアラートのカウントが表示されていない問題を解決し、適切に表示されるようにする。

## 現状分析
- **バックエンド (`backend/src/domain/alert/alertService.ts`)**:
  - `getAlertsByAuthor` メソッドが `check_type LIKE 'issue_%'` の条件でフィルタリングしているため、`pull_request_format_violation` タイプのPRアラートが含まれていない。
  - `getSummary` (check type-based viewで使用) は `check_type` でグループ化しているため、`pull_request_format_violation` 自体は集計対象に含まれるが、フロントエンドでの表示方法に依存する。
- **フロントエンド (`frontend/src/components/Molecules/AuthorGroupedTable.vue`)**:
  - `issueTypeCounts` オブジェクトに `prFormatViolation` に対応するプロパティがなく、カラムも定義されていないため、表示されない。
- **フロントエンド (`frontend/src/composables/useCheckTypeAlerts.ts`)**:
  - `CHECK_TYPE_MAPPING` に `pull_request_format_violation` が `test_performance` カテゴリとして既に含まれているため、Check Type-based viewでの集計ロジック自体は問題ない。表示は `RepoTable` のカラム定義に依存する。
- **フロントエンド (`frontend/src/constants/table.ts`)**:
  - `CHECK_TYPE_MAPPING` で `pull_request_format_violation` が `test_performance` カテゴリにマッピングされている。
  - `CHECK_TYPE_COLUMNS` に `Test/Performance` カテゴリの表示定義がある。

## 修正計画

### 1. バックエンド修正 (`backend/src/domain/alert/alertService.ts`)
- `getAlertsByAuthor` メソッドのSQLクエリを修正し、`check_type LIKE 'issue_%'` に加えて `check_type = 'pull_request_format_violation'` も含めるようにする。
- SQLクエリの `SELECT` 句に `COUNT(CASE WHEN check_type = 'pull_request_format_violation' THEN 1 END) as pr_format_violation_count` を追加する。
- 結果のマッピング (`dataResults.map`) に `prFormatViolation: parseInt(row.pr_format_violation_count)` を追加する。
- `getAlertsBySpecificAuthor` メソッドも同様に `checkType` フィルタリングを修正し、`pull_request_format_violation` を含める。

### 2. フロントエンド修正

#### 2.1. Author-based View (`frontend/src/components/Molecules/AuthorGroupedTable.vue`)
- `AuthorGroupedTable.vue` に `PR Format` という新しいカラムを追加し、`issueTypeCounts.prFormatViolation` の値を表示する。
- `frontend/src/composables/useAuthorAlerts.ts` の `AuthorAggregation` インターフェースに `prFormatViolation: number;` を追加する。

#### 2.2. Check Type-based View (`frontend/src/components/Molecules/RepoTable.vue` および関連ファイル)
- `frontend/src/constants/table.ts` の `CHECK_TYPE_MAPPING` に `pull_request_format_violation` が `test_performance` カテゴリとして既に定義されているため、追加の修正は不要。
- `RepoTable.vue` は `CHECK_TYPE_COLUMNS` を使用して動的にカラムを生成するため、`Test/Performance` カテゴリの合計に `pull_request_format_violation` が含まれるようになる。

### 3. テストと検証
- バックエンドの単体テストを実行し、`getAlertsByAuthor` が `pull_request_format_violation` を正しく集計していることを確認する。
- フロントエンドの単体テストを実行し、`AuthorGroupedTable` が新しいカラムを正しく表示していることを確認する。
- 開発環境でアプリケーションを起動し、手動で以下の動作を確認する:
  - Author-based ViewでPR bodyチェックのアラートカウントが表示されること。
  - Check Type-based ViewでTest/PerformanceカテゴリのカウントにPR bodyチェックのアラートが含まれていること。

## 開発ログ (`docs/issues/174/dev.md`)
- 開発の進捗、決定事項、遭遇した問題とその解決策を記録する。

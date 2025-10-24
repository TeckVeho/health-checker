# Issue #174 実装計画: Show PR alert check type-based-view / Author based-view

## 問題の分析

### 現在の状況
- PR bodyチェックのアラートタイプ `pull_request_format_violation` は既に定義済み
- `CHECK_TYPE_MAPPING` の `test_performance` カテゴリに含まれている
- しかし、check type-based-viewとAuthor based-viewで表示されていない

### 原因の特定
1. **Check Type-based View**: `useCheckTypeAlerts` composableで `pull_request_format_violation` が正しく集計されていない可能性
2. **Author-based View**: `AuthorGroupedTable` コンポーネントで `pull_request_format_violation` のカウントが表示されていない

## 実装計画

### Phase 1: 現状確認と問題特定
1. **バックエンドAPI確認**
   - `/api/alerts/summary/by-check-type` エンドポイントで `pull_request_format_violation` が正しく返されているか確認
   - `/api/alerts/by-author` エンドポイントで `pull_request_format_violation` が含まれているか確認

2. **フロントエンド実装確認**
   - `useCheckTypeAlerts` で `pull_request_format_violation` の集計ロジックを確認
   - `AuthorGroupedTable` で `pull_request_format_violation` の表示ロジックを確認

### Phase 2: バックエンド修正（必要に応じて）
1. **API エンドポイント修正**
   - `pull_request_format_violation` が正しく集計されるように修正
   - テストデータで動作確認

### Phase 3: フロントエンド修正
1. **Check Type-based View修正**
   - `useCheckTypeAlerts` composableの修正
   - `CHECK_TYPE_MAPPING` の確認と修正
   - テーブル表示の確認

2. **Author-based View修正**
   - `AuthorGroupedTable` コンポーネントの修正
   - `pull_request_format_violation` カラムの追加
   - データ集計ロジックの修正

### Phase 4: テストと検証
1. **単体テスト**
   - 修正したコンポーネントのテスト
   - composableのテスト

2. **統合テスト**
   - 実際のデータでの動作確認
   - 両方のビューで `pull_request_format_violation` が表示されることを確認

## 技術的詳細

### 修正対象ファイル
1. **フロントエンド**
   - `frontend/src/constants/table.ts` - CHECK_TYPE_MAPPINGの確認
   - `frontend/src/composables/useCheckTypeAlerts.ts` - 集計ロジックの修正
   - `frontend/src/components/Molecules/AuthorGroupedTable.vue` - 表示ロジックの修正

2. **バックエンド（必要に応じて）**
   - API エンドポイントの修正

### 実装アプローチ
- **TDD (Test-Driven Development)**: 既存のテストを確認し、必要に応じて新しいテストを追加
- **段階的実装**: まず現状確認から始め、問題を特定してから修正を実装

## 期待される結果
- check type-based-view で `pull_request_format_violation` のカウントが表示される
- Author based-view で `pull_request_format_violation` のカウントが表示される
- 既存の機能に影響を与えない

## リスクと対策
- **リスク**: 既存の集計ロジックに影響を与える可能性
- **対策**: 段階的な実装と十分なテストで影響を最小限に抑制

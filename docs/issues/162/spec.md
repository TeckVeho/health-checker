# Issue #162: author_display_name列の廃止 - 仕様書

## 概要
author_display_name列を廃止し、author列のみで管理するように変更する。これにより、データの重複を排除し、システムの簡素化を図る。

## 背景
現在のシステムでは、author列（GitHubのユーザー名）とauthor_display_name列（表示用の名前）の2つの列で著者情報を管理している。しかし、実際の運用ではauthor列のみで十分であり、author_display_name列は不要な複雑さを生んでいる。

## 機能要件

### 1. データベーススキーマの変更
- `alertSchema.ts`から`authorDisplayName`フィールドを削除
- 既存のデータは保持するが、新規データでは記録しない
- `yarn db:migrate`でスキーマを同期

### 2. Backend APIの変更
- `alertService.ts`から`author_display_name`の参照を削除
- APIレスポンスから`authorDisplayName`フィールドを削除
- 関連するユーティリティファイルの更新

### 3. Frontend表示の変更
- `AuthorGroupedTable.vue`から`displayName`の表示を削除
- `authors/[author].vue`から`authorDisplayName`の表示を削除
- 著者情報は`author`列のみで表示

## 非機能要件

### 1. パフォーマンス
- データベースクエリの最適化（不要な列の削除）
- APIレスポンスサイズの削減

### 2. 互換性
- 既存のAPIクライアントへの影響を最小限に抑制
- 段階的な移行を可能にする

### 3. データ整合性
- 既存データの保持
- 新規データの一貫性確保

## 影響範囲

### 1. データベース
- `alerts`テーブルのスキーマ変更
- 既存データの保持（削除は行わない）

### 2. Backend
- `alertSchema.ts`: スキーマ定義の変更
- `alertService.ts`: サービス層の変更
- `alertModel.ts`: モデル定義の変更
- 関連するユーティリティファイルの変更

### 3. Frontend
- `AuthorGroupedTable.vue`: テーブル表示の変更
- `authors/[author].vue`: 著者詳細ページの変更
- `useAuthorAlerts.ts`: コンポーザブルの変更

### 4. テスト
- 既存テストの更新
- 新しいテストケースの追加

### 5. データベーススキーマの同期
- `yarn db:migrate`でスキーマを同期
- 既存データの保持確認

## 技術的詳細

### 1. データベーススキーマの変更
このプロジェクトでは、従来のSequelizeマイグレーションファイルではなく、domainごとのschemaファイルを直接使用してデータベース構造を管理しています。

**変更方法**:
- `alertSchema.ts`から`authorDisplayName`フィールドを削除
- `yarn db:migrate`コマンドでスキーマを同期
- Sequelizeの`sync({ alter: true })`で既存テーブルを更新

### 2. スキーマ変更
```typescript
// 削除するフィールド
authorDisplayName?: string; // AlertAttributesから削除
authorDisplayName: {        // alertAttributesから削除
  type: DataTypes.STRING(255),
  allowNull: true,
  field: 'author_display_name',
},
```

### 3. APIレスポンス変更
```typescript
// 削除するフィールド
{
  author: string;
  // authorDisplayName: string; // 削除
  // displayName: string;       // 削除
}
```

## 実装順序

1. **Backendスキーマの変更** (`alertSchema.ts`から`authorDisplayName`を削除)
2. **Backendサービスの変更** (APIレスポンスから`authorDisplayName`を削除)
3. **Frontendコンポーネントの変更** (表示から`displayName`を削除)
4. **データベーススキーマの同期** (`yarn db:migrate`でスキーマを更新)
5. **テストの更新**
6. **動作確認**

## リスクと対策

### 1. データ損失のリスク
- **対策**: 既存データは保持し、削除は行わない

### 2. API互換性のリスク
- **対策**: 段階的な移行と適切なバージョニング

### 3. フロントエンド表示の不整合
- **対策**: 十分なテストと段階的なデプロイ

## 成功基準

1. `author_display_name`列がデータベースから削除される
2. 新規アラートで`author_display_name`が記録されない
3. フロントエンドで`author_display_name`が表示されない
4. 既存の機能が正常に動作する
5. パフォーマンスが向上する

## 関連ファイル

### Backend
- `backend/src/domain/alert/alertSchema.ts`
- `backend/src/domain/alert/alertService.ts`
- `backend/src/domain/alert/alertModel.ts`
- `backend/src/domain/alert/util/checkIssues/authorExtractor.ts`
- `backend/src/domain/alert/util/checkIssues/validators.ts`
- `backend/src/domain/alert/util/checkIssues/types.ts`

### Frontend
- `frontend/src/components/Molecules/AuthorGroupedTable.vue`
- `frontend/src/pages/authors/[author].vue`
- `frontend/src/composables/useAuthorAlerts.ts`

### テスト
- `backend/tests/unit/domain/alert/alertSchema.test.ts`
- `backend/tests/contract/test_alerts_by_author.test.ts`
- `frontend/tests/unit/components/Molecules/AuthorGroupedTable.spec.ts`

### データベース同期
- `backend/src/database/migrate-all.ts` (既存ファイルを使用)

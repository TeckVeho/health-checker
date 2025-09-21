# Issue #162: author_display_name列の廃止 - 実装計画

## 機能要件マッピング

### 主要機能要件
1. **データベーススキーマの簡素化**: `author_display_name`列の削除
2. **APIレスポンスの最適化**: 不要なフィールドの削除
3. **フロントエンド表示の簡素化**: 著者情報の統一表示
4. **データ整合性の確保**: 既存データの保持と新規データの一貫性

### 非機能要件
1. **パフォーマンス向上**: データベースクエリとAPIレスポンスの最適化
2. **互換性維持**: 既存機能への影響を最小限に抑制
3. **段階的移行**: 安全なデプロイメント

## ディレクトリ構造とファイル一覧

```
backend/
├── src/
│   └── domain/
│       └── alert/
│           ├── alertSchema.ts          # スキーマ定義の変更
│           ├── alertService.ts         # サービス層の変更
│           ├── alertModel.ts           # モデル定義の変更
│           └── util/
│               └── checkIssues/
│                   ├── authorExtractor.ts  # 著者抽出ロジックの変更
│                   ├── validators.ts       # バリデーションの変更
│                   └── types.ts            # 型定義の変更
├── database/
│   └── migrate-all.ts  # 既存ファイルを使用
└── tests/
    ├── unit/domain/alert/
    │   ├── alertSchema.test.ts         # テストの更新
    │   └── alertService.test.ts        # テストの更新
    └── contract/
        └── test_alerts_by_author.test.ts  # テストの更新

frontend/
├── src/
│   ├── components/
│   │   └── Molecules/
│   │       └── AuthorGroupedTable.vue  # 表示ロジックの変更
│   ├── pages/
│   │   └── authors/
│   │       └── [author].vue            # 著者詳細ページの変更
│   └── composables/
│       └── useAuthorAlerts.ts          # コンポーザブルの変更
└── tests/
    └── unit/
        └── components/
            └── Molecules/
                └── AuthorGroupedTable.spec.ts  # テストの更新
```

## アーキテクチャ設計

### 1. データフロー
```
GitHub API → Backend Service → Database (alerts table)
                ↓
           API Response (author only)
                ↓
           Frontend Components (author display)
```

### 2. 変更の影響範囲
- **データ層**: データベーススキーマの変更
- **サービス層**: APIレスポンスの変更
- **プレゼンテーション層**: フロントエンド表示の変更

### 3. 段階的移行戦略
1. **Phase 1**: データベースマイグレーション
2. **Phase 2**: Backend APIの変更
3. **Phase 3**: Frontend表示の変更
4. **Phase 4**: テストと検証

## データモデル

### 変更前
```typescript
interface AlertAttributes {
  id?: number;
  owner: string;
  repo: string;
  author?: string;
  authorDisplayName?: string;  // 削除対象
  // ... その他のフィールド
}
```

### 変更後
```typescript
interface AlertAttributes {
  id?: number;
  owner: string;
  repo: string;
  author?: string;
  // authorDisplayName フィールドを削除
  // ... その他のフィールド
}
```

### データベーススキーマ変更
このプロジェクトでは、従来のSequelizeマイグレーションファイルではなく、domainごとのschemaファイルを直接使用してデータベース構造を管理しています。

**変更方法**:
- `alertSchema.ts`から`authorDisplayName`フィールドを削除
- `yarn db:migrate`コマンドでスキーマを同期
- Sequelizeの`sync({ alter: true })`で既存テーブルを更新

## 実装タスク

### Task 1: Backendスキーマの変更
**目的**: `alertSchema.ts`から`authorDisplayName`フィールドを削除する

**詳細**:
- `AlertAttributes`インターフェースから`authorDisplayName`を削除
- `alertAttributes`から`authorDisplayName`の定義を削除
- 関連するテストの更新

**ファイル**:
- `backend/src/domain/alert/alertSchema.ts`
- `backend/tests/unit/domain/alert/alertSchema.test.ts`

**実装内容**:
- `authorDisplayName?: string;` の削除
- `authorDisplayName` フィールド定義の削除
- テストケースの更新

### Task 2: Backendサービスの変更
**目的**: `alertService.ts`から`author_display_name`の参照を削除

**詳細**:
- データベースクエリから`author_display_name`の参照を削除
- APIレスポンスから`authorDisplayName`フィールドを削除
- 関連するユーティリティファイルの更新

**ファイル**:
- `backend/src/domain/alert/alertService.ts`
- `backend/src/domain/alert/util/checkIssues/authorExtractor.ts`
- `backend/src/domain/alert/util/checkIssues/validators.ts`
- `backend/src/domain/alert/util/checkIssues/types.ts`

**実装内容**:
- SQLクエリから`author_display_name`の参照を削除
- レスポンスオブジェクトから`authorDisplayName`を削除
- 型定義の更新

### Task 3: Frontendコンポーネントの変更
**目的**: フロントエンドから`displayName`の表示を削除

**詳細**:
- `AuthorGroupedTable.vue`から`displayName`の表示を削除
- `authors/[author].vue`から`authorDisplayName`の表示を削除
- 関連するコンポーザブルの更新

**ファイル**:
- `frontend/src/components/Molecules/AuthorGroupedTable.vue`
- `frontend/src/pages/authors/[author].vue`
- `frontend/src/composables/useAuthorAlerts.ts`

**実装内容**:
- テンプレートから`displayName`の表示を削除
- スクリプトから`authorDisplayName`の参照を削除
- 型定義の更新

### Task 4: データベーススキーマの同期
**目的**: 変更されたスキーマをデータベースに反映する

**詳細**:
- `yarn db:migrate`コマンドでスキーマを同期
- 既存データの保持確認
- データベース構造の検証

**ファイル**:
- `backend/src/database/migrate-all.ts` (既存ファイルを使用)

**実装内容**:
- `yarn db:migrate`の実行
- データベース構造の確認
- 既存データの保持確認

### Task 5: テストの更新
**目的**: 変更に伴うテストの更新

**詳細**:
- 既存テストの更新
- 新しいテストケースの追加
- 統合テストの実行

**ファイル**:
- `backend/tests/unit/domain/alert/alertSchema.test.ts`
- `backend/tests/contract/test_alerts_by_author.test.ts`
- `frontend/tests/unit/components/Molecules/AuthorGroupedTable.spec.ts`

**実装内容**:
- `authorDisplayName`関連のテストケースを削除
- 新しい動作のテストケースを追加
- 統合テストの実行と検証

### Task 6: 動作確認と検証
**目的**: 変更後の動作確認

**詳細**:
- データベースマイグレーションの実行
- Backend APIの動作確認
- Frontend表示の確認
- 既存機能の回帰テスト

**実装内容**:
- ローカル環境での動作確認
- テストスイートの実行
- 手動テストの実施

## 実装順序

1. **Task 1**: Backendスキーマの変更
2. **Task 2**: Backendサービスの変更
3. **Task 3**: Frontendコンポーネントの変更
4. **Task 4**: データベーススキーマの同期
5. **Task 5**: テストの更新
6. **Task 6**: 動作確認と検証

## リスク管理

### 高リスク
- **データベーススキーマの変更**: 既存データへの影響
  - **対策**: 既存データは保持し、段階的な移行

### 中リスク
- **API互換性**: 既存クライアントへの影響
  - **対策**: 適切なバージョニングとドキュメント更新

### 低リスク
- **フロントエンド表示**: UIの変更
  - **対策**: 十分なテストと段階的なデプロイ

## 成功基準

1. ✅ `author_display_name`列がデータベースから削除される
2. ✅ 新規アラートで`author_display_name`が記録されない
3. ✅ フロントエンドで`author_display_name`が表示されない
4. ✅ 既存の機能が正常に動作する
5. ✅ パフォーマンスが向上する
6. ✅ すべてのテストが通る

## 見積もり

- **総工数**: 4-6時間
- **Task 1**: 1時間（Backendスキーマ）
- **Task 2**: 1-2時間（Backendサービス）
- **Task 3**: 1時間（Frontend）
- **Task 4**: 30分（データベーススキーマの同期）
- **Task 5**: 1時間（テスト）
- **Task 6**: 1時間（検証）

## 依存関係

- Backendスキーマの変更が他のタスクの前提条件
- Backendサービスの変更がFrontendの変更の前提条件
- データベーススキーマの同期はBackendの変更完了後
- テストの更新は実装完了後の検証フェーズ

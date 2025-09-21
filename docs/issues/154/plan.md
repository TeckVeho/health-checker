# 実装計画: Issue #154 - OpenAPI YAMLファイル作成

## 概要
domainごとにOpenAPI YAMLファイルを分けて作成し、包括的なAPI仕様書を整備する。

## 実装タスク

### 1. 既存ファイル分析
- [x] `docs/openapi/recheck-api.yaml`の構造分析
- [x] 各domainのコントローラー実装確認
- [x] エンドポイント一覧の整理

### 2. Repo API (repo-api.yaml)
**対象エンドポイント**: `/api/repos`

#### 2.1 エンドポイント定義
- `GET /` - リポジトリ一覧取得
  - クエリパラメータ: `page`, `limit`, `sort`
  - レスポンス: ページネーション付きリポジトリ一覧
- `GET /:id` - リポジトリ詳細取得
  - パスパラメータ: `id`
  - レスポンス: リポジトリ詳細情報
- `POST /sync/:owner` - リポジトリ同期
  - パスパラメータ: `owner`
  - レスポンス: 同期結果と作成されたリポジトリ一覧

#### 2.2 スキーマ定義
- `Repository`: リポジトリ情報スキーマ
- `RepositoryList`: ページネーション付きリポジトリ一覧
- `SyncResult`: 同期結果スキーマ
- `ErrorResponse`: エラーレスポンススキーマ

### 3. Alert API (alert-api.yaml)
**対象エンドポイント**: `/api/alerts`

#### 3.1 エンドポイント定義
- `GET /by-author` - 作者別アラート取得
- `GET /authors/:author` - 特定作者のアラート取得
- `POST /backfill-authors` - 作者情報のバックフィル
- `POST /check/:owner` - 保存済みリポジトリのチェック
- `POST /check/:owner/:repo` - 手動アラート実行
- `POST /summary` - アラートサマリー取得
- `POST /summary-by-checktype` - チェックタイプ別サマリー取得
- `GET /:owner/:repo` - リポジトリ別アラート一覧

#### 3.2 スキーマ定義
- `Alert`: アラート情報スキーマ
- `AlertSummary`: アラートサマリースキーマ
- `CheckTypeSummary`: チェックタイプ別サマリー
- `RepoList`: リポジトリリストスキーマ（Zodスキーマベース）
- `CheckResult`: チェック実行結果スキーマ

### 4. GitHub Action API (github-action-api.yaml)
**対象エンドポイント**: `/api/github-action`

#### 4.1 エンドポイント定義
- `POST /prreview` - PRレビュー実行
  - リクエストボディ: `{ owner, repo, pullNumber }`
  - レスポンス: レビュー結果

#### 4.2 スキーマ定義
- `PullRequestReviewRequest`: PRレビューリクエストスキーマ
- `PullRequestReviewResult`: レビュー結果スキーマ

### 5. 共通要素の設計

#### 5.1 基本情報
- OpenAPI 3.0.3仕様準拠
- サーバー情報（開発・本番環境）
- 認証情報（現在は未実装）
- レート制限情報

#### 5.2 共通スキーマ
- `ErrorResponse`: 統一エラーレスポンス
- `Pagination`: ページネーション情報
- `SuccessResponse`: 成功レスポンス基本形

#### 5.3 共通パラメータ
- `Owner`: GitHubオーナー名
- `Repo`: リポジトリ名
- `Page`: ページ番号
- `Limit`: 取得件数

## 実装順序

### Phase 1: 基盤準備
1. 既存`recheck-api.yaml`の構造分析
2. 共通スキーマ・パラメータの設計
3. テンプレートファイルの作成

### Phase 2: Repo API
1. `docs/openapi/repo-api.yaml`の作成
2. エンドポイント定義とスキーマ実装
3. バリデーションとテスト

### Phase 3: Alert API
1. `docs/openapi/alert-api.yaml`の作成
2. 複雑なスキーマ（Zodベース）の実装
3. バリデーションとテスト

### Phase 4: GitHub Action API
1. `docs/openapi/github-action-api.yaml`の作成
2. シンプルなAPIの実装
3. バリデーションとテスト

### Phase 5: 統合・検証
1. 全ファイルの整合性確認
2. OpenAPI仕様書の検証
3. ドキュメント生成テスト

## 品質基準

### 必須要件
- [x] OpenAPI 3.0.3仕様準拠
- [x] 既存`recheck-api.yaml`との整合性
- [x] 各domainの全エンドポイント網羅
- [x] リクエスト/レスポンススキーマ完全定義

### 品質チェック項目
- [x] スキーマの一貫性
- [x] エラーレスポンスの統一性
- [x] パラメータの適切な定義
- [x] サンプルデータの充実
- [x] 日本語コメントの適切性

## リスク・課題

### 技術的課題
1. **複雑なスキーマ**: Alert APIのZodスキーマをOpenAPIに変換
2. **既存コードとの整合性**: 実装と仕様書の乖離防止
3. **バリデーション**: OpenAPI仕様書の妥当性検証

### 対応策
1. 既存コントローラーの詳細分析
2. 段階的な実装とテスト
3. OpenAPIツールによる自動検証

## 見積もり
- **Phase 1**: 1時間（基盤準備）
- **Phase 2**: 2時間（Repo API）
- **Phase 3**: 3時間（Alert API - 複雑）
- **Phase 4**: 1時間（GitHub Action API）
- **Phase 5**: 2時間（統合・検証）

**合計**: 9時間

## 成果物
1. `docs/openapi/repo-api.yaml`
2. `docs/openapi/alert-api.yaml`
3. `docs/openapi/github-action-api.yaml`
4. 統合検証レポート

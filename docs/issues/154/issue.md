# Issue #154: 不足したOpenAPI YAMLファイルの作成 - domainごとのファイル分け

**URL**: https://github.com/TeckVeho/health-checker/issues/154  
**状態**: Open  
**作成日**: 2025-09-21T02:13:04Z  
**更新日**: 2025-09-21T02:13:04Z  

## 概要
現在、docs/openapiディレクトリにはrecheck-api.yamlのみが存在し、他のdomainのOpenAPI仕様書が不足しています。domainごとにファイルを分けて、包括的なAPI仕様書を作成する必要があります。

## 現状
- 存在するOpenAPIファイル: recheck-api.yamlのみ
- 不足しているdomain:
  - repo (Repository management)
  - alert (Alert management) 
  - githubAction (GitHub Actions integration)

## 要件
1. domainごとのファイル分け
   - docs/openapi/repo-api.yaml
   - docs/openapi/alert-api.yaml
   - docs/openapi/github-action-api.yaml

2. 各ファイルに含める内容
   - 各domainの全エンドポイントの定義
   - リクエスト/レスポンススキーマ
   - エラーレスポンス定義
   - 認証認可情報
   - レート制限情報

3. 対象エンドポイント

   Repo API (/api/repos)
   - GET / - リポジトリ一覧取得
   - GET /:id - リポジトリ詳細取得
   - POST /sync/:owner - リポジトリ同期

   Alert API (/api/alerts)
   - GET /by-author - 作者別アラート取得
   - GET /authors/:author - 特定作者のアラート取得
   - POST /backfill-authors - 作者情報のバックフィル
   - POST /check/:owner - 保存済みリポジトリのチェック
   - POST /check/:owner/:repo - 手動アラート実行
   - POST /summary - アラートサマリー取得
   - POST /summary-by-checktype - チェックタイプ別サマリー取得
   - GET /:owner/:repo - リポジトリ別アラート一覧

   GitHub Action API (/api/github-action)
   - POST /prreview - PRレビュー実行

## 期待される成果物
- 4つのOpenAPI YAMLファイル（recheck-api.yaml + 3つの新規ファイル）
- 各ファイルは独立して使用可能
- 一貫性のあるスキーマ設計
- 既存のrecheck-api.yamlとの整合性確保

## 参考情報
- 既存のrecheck-api.yamlの構造を参考にする
- 各domainのコントローラー実装を基にエンドポイントを定義する
- OpenAPI 3.0.3仕様に準拠する


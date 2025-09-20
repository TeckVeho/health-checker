# Issue #136: Add ReCheck button for repository page - Specification

## Overview

リポジトリページにReCheckボタンを追加し、ユーザーが手動でヘルスチェックを再実行できる機能を実装する。既存の自動ヘルスチェック機能を活用しつつ、ユーザビリティを向上させる手動実行機能を提供する。

## Purpose

現在のヘルスチェッカーは定期的な自動チェックのみを提供しているが、以下の状況でリアルタイムなチェックが必要となる：

- 問題修正後の即座の結果確認
- 新規リポジトリ追加後の即座のチェック実行
- システム動作確認
- デバッグ・トラブルシューティング

この機能により、ユーザーは能動的にリポジトリの健康状態を確認できるようになる。

## Functional Requirements

### FR-1: ReCheckボタンの配置
- **要件**: リポジトリページ（`/[owner]/[repo]`）にReCheckボタンを配置する
- **配置場所**: ページタイトル（RepoAlertTitle）の近くの視覚的に分かりやすい位置
- **デザイン**: 既存のUIコンポーネントと一貫性のあるボタンデザイン
- **レスポンシブ**: モバイル・タブレット・デスクトップで適切に表示

### FR-2: 手動ヘルスチェック実行
- **要件**: ボタンクリック時に該当リポジトリのヘルスチェックを実行する
- **実装**: 既存の`AlertService.runAlert()`メソッドを活用
- **チェック種類**: デフォルトで全チェック種類（`['branch', 'clone', 'gitleaks', 'issue']`）を実行
- **非同期処理**: バックグラウンドで実行し、UIをブロックしない

### FR-3: レート制限機能
- **要件**: 前回のチェックから3分以内の再チェックを禁止
- **実装方法**: DBまたはメモリキャッシュでリポジトリごとの最終実行時刻を管理
- **ユーザーフィードバック**: 制限時間と残り時間をフロントエンドに表示
- **エラーハンドリング**: レート制限時は適切なエラーメッセージを返却

### FR-4: 実行状態管理
- **要件**: チェック実行中の状態を適切に管理・表示
- **ローディング状態**: ボタンを無効化し、ローディングインジケーターを表示
- **状態の永続化**: 複数タブ・ユーザー間で状態を共有
- **タイムアウト**: 長時間実行される場合のタイムアウト処理

### FR-5: 結果表示とフィードバック
- **要件**: チェック完了後、結果を即座に画面に反映
- **成功時**: 成功メッセージと更新されたアラート一覧を表示
- **失敗時**: エラーメッセージと推奨アクションを表示
- **自動更新**: チェック完了後、アラートデータを自動再読み込み

### FR-6: エラーハンドリング
- **要件**: 各種エラー状況に対する適切な処理
- **ネットワークエラー**: 接続失敗時の再試行機能
- **APIエラー**: サーバーエラー時の詳細メッセージ表示
- **認証エラー**: 権限不足時の適切なメッセージ
- **タイムアウト**: 処理時間超過時の処理

## Specification

### Features

#### 1. ReCheckボタンコンポーネント
- **コンポーネント名**: `ReCheckButton.vue`
- **プロパティ**:
  - `owner: string` - リポジトリオーナー
  - `repo: string` - リポジトリ名
  - `disabled?: boolean` - ボタン無効化状態
- **イベント**:
  - `@recheck-started` - チェック開始時
  - `@recheck-completed` - チェック完了時
  - `@recheck-error` - エラー発生時

#### 2. バックエンドAPI拡張
- **エンドポイント**: `POST /api/repos/:owner/:repo/recheck`
- **既存エンドポイント活用**: 既存の`POST /check/:owner/:repo`を基盤として拡張
- **レスポンス**: 実行結果とステータス情報
- **レート制限**: リポジトリごとの実行間隔制御

#### 3. 状態管理機能
- **実行状態キャッシュ**: Redis または in-memory cache
- **状態の種類**:
  - `idle` - 待機中
  - `running` - 実行中
  - `completed` - 完了
  - `error` - エラー
- **TTL**: 実行状態は30分でタイムアウト

### System Requirements

#### Required External Tools
- **既存システム**: 既存のヘルスチェック機能（AlertService）
- **GitHub API**: リポジトリアクセス用
- **データベース**: PostgreSQL（アラートデータ保存）
- **キャッシュ**: レート制限用（Redis推奨、メモリキャッシュも可）

#### Operating Environment
- **フロントエンド**: Vue.js 3 + Nuxt.js + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: PostgreSQL
- **テスト**: Jest（バックエンド）+ Vitest（フロントエンド）

#### Quality Requirements
- **パフォーマンス**: ボタンクリックから応答まで500ms以内
- **可用性**: 99%以上の稼働率
- **スケーラビリティ**: 同時実行制限により負荷制御
- **セキュリティ**: 認証済みユーザーのみアクセス可能
- **ユーザビリティ**: 直感的な操作とフィードバック

## API Specifications

### POST /api/repos/:owner/:repo/recheck

**リクエスト**:
```typescript
interface RecheckRequest {
  checks?: string[]; // オプション: チェック種類指定
}
```

**レスポンス**:
```typescript
interface RecheckResponse {
  success: boolean;
  message: string;
  result?: {
    owner: string;
    repo: string;
    executionId: string;
    startedAt: string;
    estimatedDuration: number; // 秒
  };
  error?: {
    code: string;
    message: string;
    retryAfter?: number; // レート制限時の待機秒数
  };
}
```

**エラーコード**:
- `RATE_LIMITED` - レート制限エラー
- `REPO_NOT_FOUND` - リポジトリが見つからない
- `EXECUTION_ERROR` - 実行エラー
- `TIMEOUT` - タイムアウト

### GET /api/repos/:owner/:repo/recheck/status

チェック実行状態の確認用エンドポイント

**レスポンス**:
```typescript
interface RecheckStatusResponse {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastExecutedAt?: string;
  nextAvailableAt?: string; // レート制限解除時刻
  currentExecution?: {
    executionId: string;
    startedAt: string;
    progress: number; // 0-100
  };
}
```

## UI/UX Specifications

### ボタンデザイン
- **ベースコンポーネント**: 既存の`HealthButton`を拡張
- **アイコン**: リフレッシュ/再実行を表すアイコン（例：`pi-refresh`）
- **カラー**: プライマリーカラー（青系）
- **サイズ**: 中サイズ（既存ボタンと統一）

### 状態別表示
1. **通常状態**:
   - テキスト: "ReCheck"
   - アイコン: `pi-refresh`
   - 色: プライマリー

2. **実行中状態**:
   - テキスト: "Checking..."
   - アイコン: `pi-spin pi-spinner`（回転アニメーション）
   - 色: セカンダリー
   - 無効化: `disabled="true"`

3. **レート制限状態**:
   - テキスト: "Available in 2m 30s"
   - アイコン: `pi-clock`
   - 色: 警告色
   - 無効化: `disabled="true"`

4. **エラー状態**:
   - テキスト: "Retry"
   - アイコン: `pi-exclamation-triangle`
   - 色: エラー色

### レイアウト配置
```vue
<template>
  <div class="repo-header">
    <RepoAlertTitle :owner="owner" :repo="repo" />
    <ReCheckButton 
      :owner="owner" 
      :repo="repo" 
      @recheck-completed="handleRecheckCompleted"
      class="ml-4"
    />
  </div>
</template>
```

## Success Criteria

### Functional Criteria
- [ ] ReCheckボタンがリポジトリページに適切に表示される
- [ ] ボタンクリック時にヘルスチェックが正常に実行される
- [ ] 3分間のレート制限が正常に動作する
- [ ] 実行中は適切なローディング表示がされる
- [ ] チェック完了後、結果が即座に画面に反映される
- [ ] エラー時に適切なエラーメッセージが表示される
- [ ] 既存の自動チェック機能に影響を与えない

### Non-Functional Criteria
- [ ] ボタンクリックから応答まで500ms以内
- [ ] レスポンシブデザインで各デバイスに対応
- [ ] アクセシビリティ要件（ARIA属性、キーボード操作）を満たす
- [ ] 単体テストカバレッジ80%以上
- [ ] 統合テストで主要シナリオをカバー
- [ ] エラー処理の網羅的なテスト

## Technical Implementation Notes

### データベース拡張
レート制限管理用のテーブル追加が必要な場合：
```sql
CREATE TABLE recheck_executions (
  id SERIAL PRIMARY KEY,
  owner VARCHAR(255) NOT NULL,
  repo VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'completed',
  execution_id VARCHAR(255),
  UNIQUE(owner, repo, executed_at)
);

CREATE INDEX idx_recheck_executions_owner_repo ON recheck_executions(owner, repo);
CREATE INDEX idx_recheck_executions_executed_at ON recheck_executions(executed_at);
```

### キャッシュストラテジー
- **レート制限**: `recheck:rate:{owner}:{repo}` (TTL: 180秒)
- **実行状態**: `recheck:status:{owner}:{repo}` (TTL: 1800秒)

### エラー監視
- **ログ出力**: 全てのReCheck実行をログに記録
- **メトリクス**: 実行回数、成功率、平均実行時間を監視
- **アラート**: 異常な失敗率やパフォーマンス低下を検知

## References

- 既存AlertService実装: `backend/src/domain/alert/alertService.ts`
- 既存AlertController: `backend/src/domain/alert/alertController.ts`
- リポジトリページ: `frontend/src/pages/[...slug].vue`
- GitHub Health Checker API仕様
- PrimeVue UI コンポーネントライブラリ

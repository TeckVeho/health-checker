# Issue #144: 本番環境でGITHUB_LOCAL_WORKSPACE環境変数が読み込まれない - Implementation Plan

## Functional Requirements Mapping

### 主要機能要件
1. **環境変数読み込みの修正**: 本番環境でGITHUB_LOCAL_WORKSPACEが正しく読み込まれること
2. **ReCheck機能の復旧**: 環境変数が正しく読み込まれた後、ReCheck機能が正常に動作すること
3. **環境変数検証の改善**: より詳細な診断情報とフォールバック機能の提供

### 非機能要件
- **可用性**: 本番環境でのサービス継続性を維持
- **診断性**: 環境変数の問題を迅速に特定できるログとエラーメッセージ
- **回復性**: 環境変数が設定されていない場合の適切なフォールバック処理

## Directory Structure and File List

```
backend/
├── src/
│   ├── config/
│   │   ├── index.ts                 # 環境変数設定の統合管理
│   │   └── environment.ts           # 新しい環境変数設定ファイル
│   ├── middlewares/
│   │   └── environmentCheck.ts      # 既存の環境変数検証ミドルウェア
│   ├── utils/
│   │   └── environmentUtils.ts      # 既存の環境変数検証ユーティリティ
│   └── index.ts                     # アプリケーション起動時の環境変数初期化
├── ecosystem.config.cjs             # PM2設定ファイル（修正対象）
└── .env                            # 環境変数ファイル（本番環境で確認必要）

docs/issues/144/
├── issue.md                        # 既存
└── plan.md                         # このファイル
```

## Architecture Design

### 環境変数読み込みの階層構造
```
1. PM2起動時
   └── ecosystem.config.cjs (dotenv.config())
   
2. アプリケーション起動時
   └── src/index.ts (追加の環境変数初期化)
   
3. ミドルウェア層
   └── environmentCheck.ts (ReCheckエンドポイントでの検証)
   
4. ユーティリティ層
   └── environmentUtils.ts (詳細な検証とフォールバック)
```

### 問題の根本原因分析
1. **PM2設定の問題**: dotenv.config()が実行されているが、パスの解決が不適切
2. **アプリケーション起動順序**: 環境変数の読み込みタイミングが不適切
3. **本番環境の設定**: .envファイルの存在確認と内容確認が必要

## Data Model

### 環境変数設定モデル
```typescript
interface EnvironmentConfig {
  // 必須環境変数
  GITHUB_API_KEY: string;
  GITHUB_LOCAL_WORKSPACE: string;
  DB_HOST: string;
  DB_USER: string;
  DB_NAME: string;
  DB_PASSWORD: string;
  
  // オプション環境変数
  NODE_ENV?: string;
  PORT?: string;
  TZ?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
}

interface EnvironmentValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  fallbackPaths: string[];
  details: {
    [key: string]: {
      exists: boolean;
      value?: string;
      isValid: boolean;
      error?: string;
    };
  };
}
```

## Implementation Tasks

### Task 1.1: 本番環境の現状調査
**目的**: 本番環境での環境変数設定状況を詳細に調査する

**実装内容**:
- 本番環境での.envファイルの存在確認
- PM2プロセスの環境変数状態確認
- dotenv.config()の実行パス確認
- ファイル権限とディレクトリ構造の確認

**検証項目**:
- .envファイルの内容と配置場所
- PM2プロセスでの環境変数読み込み状況
- GITHUB_LOCAL_WORKSPACEディレクトリの存在と権限
- ログファイルでの環境変数読み込みエラーの確認

### Task 1.2: PM2設定の修正
**目的**: PM2設定でのdotenv.config()の実行を確実にする

**実装内容**:
- ecosystem.config.cjsでのdotenv.config()のパス指定を明示的に設定
- 環境変数読み込みのエラーハンドリング追加
- PM2起動時の環境変数確認ログ追加

**修正対象ファイル**:
- `backend/ecosystem.config.cjs`

**検証項目**:
- PM2起動時の環境変数読み込み確認
- エラーログの出力確認
- 本番環境での動作確認

### Task 1.3: アプリケーション起動時の環境変数初期化強化
**目的**: アプリケーション起動時に環境変数の読み込みを確実にする

**実装内容**:
- src/index.tsでの環境変数初期化処理追加
- 環境変数読み込み失敗時の詳細なエラーログ出力
- フォールバック処理の実装

**修正対象ファイル**:
- `backend/src/index.ts`
- `backend/src/config/environment.ts` (新規作成)

**検証項目**:
- アプリケーション起動時の環境変数読み込み確認
- エラーハンドリングの動作確認
- フォールバック処理の動作確認

### Task 2.1: 環境変数検証システムの改善
**目的**: より詳細な診断情報とフォールバック機能を提供する

**実装内容**:
- environmentUtils.tsでの詳細な診断情報追加
- フォールバックワークスペースの自動作成機能強化
- 環境変数検証結果の詳細ログ出力

**修正対象ファイル**:
- `backend/src/utils/environmentUtils.ts`
- `backend/src/middlewares/environmentCheck.ts`

**検証項目**:
- 詳細な診断情報の出力確認
- フォールバック処理の動作確認
- エラーメッセージの改善確認

### Task 2.2: ReCheck機能の動作確認
**目的**: 環境変数修正後のReCheck機能の正常動作を確認する

**実装内容**:
- ReCheckエンドポイントでの環境変数検証
- GITHUB_LOCAL_WORKSPACEの使用箇所での動作確認
- エラー処理の改善

**修正対象ファイル**:
- `backend/src/domain/recheck/recheckController.ts`

**検証項目**:
- ReCheck機能の正常動作確認
- 環境変数エラー時の適切なエラーメッセージ表示
- ワークスペースディレクトリでのGit操作確認

### Task 2.3: 本番環境での動作確認とテスト
**目的**: 本番環境での修正内容の動作確認とテスト実行

**実装内容**:
- 本番環境でのPM2再起動
- 環境変数読み込み状況の確認
- ReCheck機能の動作テスト
- ログファイルでの動作確認

**検証項目**:
- 本番環境での環境変数読み込み確認
- ReCheck機能の正常動作確認
- エラーログの確認
- パフォーマンスへの影響確認

## 実装順序と依存関係

1. **Task 1.1** → **Task 1.2** → **Task 1.3**: 環境変数読み込みの修正
2. **Task 2.1**: 環境変数検証システムの改善（並行実行可能）
3. **Task 2.2** → **Task 2.3**: ReCheck機能の動作確認と本番環境テスト

## リスク評価と対策

### 高リスク項目
- **本番環境でのサービス停止**: PM2再起動時の一時的なサービス停止
- **環境変数の設定ミス**: 本番環境での設定変更による影響

### 対策
- メンテナンス時間での実施
- 設定変更前のバックアップ作成
- 段階的な修正とテスト実施
- ロールバック手順の準備

## 成功基準

1. 本番環境でGITHUB_LOCAL_WORKSPACE環境変数が正しく読み込まれること
2. ReCheck機能が正常に動作すること
3. 環境変数エラー時の適切なエラーメッセージが表示されること
4. 本番環境でのサービスが継続的に動作すること

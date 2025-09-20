# Issue #142: 本番環境でReCheckボタンがGITHUB_LOCAL_WORKSPACEエラーで失敗する - Implementation Plan

## Functional Requirements Mapping

### 主要機能要件
1. **環境変数検証機能**: 本番環境でGITHUB_LOCAL_WORKSPACE環境変数が適切に設定されていることを確認
2. **フォールバック機能**: 環境変数が未設定の場合の代替処理パス
3. **エラーハンドリング強化**: より詳細なエラーメッセージとログ出力
4. **設定検証機能**: デプロイ時の環境変数設定確認

### 非機能要件
1. **可用性**: 本番環境でのReCheck機能の安定動作
2. **保守性**: 環境変数設定の一元管理
3. **監視性**: エラー発生時の詳細ログ出力

## Directory Structure and File List

```
backend/src/
├── config/
│   ├── environment.ts          # 環境変数検証と設定管理
│   └── index.ts               # 設定の統合管理
├── domain/
│   ├── alert/
│   │   └── util/
│   │       ├── cloneRepo.ts   # 環境変数検証強化
│   │       ├── auditScanner.ts # 環境変数検証強化
│   │       └── checkActions.ts # 環境変数検証強化
│   └── recheck/
│       ├── recheckService.ts  # エラーハンドリング強化
│       └── recheckController.ts # エラーレスポンス改善
├── middlewares/
│   └── environmentCheck.ts    # 環境変数検証ミドルウェア
└── utils/
    └── environmentUtils.ts    # 環境変数ユーティリティ

.cursor/workspace/142/
├── verification/
│   ├── test-scripts/
│   │   ├── test-env-validation.js
│   │   └── test-fallback-behavior.js
│   ├── data-files/
│   │   ├── env-config-test.json
│   │   └── production-env-analysis.json
│   └── debug-output/
│       ├── env-validation-logs.txt
│       └── error-scenario-tests.txt
└── final-reports/
    └── environment-fix-validation.md
```

## Architecture Design

### 環境変数管理アーキテクチャ
```
┌─────────────────────────────────────────────────────────────┐
│                    Environment Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Environment Validation Service                             │
│  ├── GITHUB_LOCAL_WORKSPACE validation                     │
│  ├── Fallback path resolution                              │
│  └── Configuration validation                              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  ReCheck Service                                            │
│  ├── Environment check before execution                    │
│  ├── Graceful degradation on env issues                    │
│  └── Enhanced error reporting                              │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Clone Repository Service                                   │
│  ├── Environment-aware cloning                             │
│  ├── Fallback workspace handling                           │
│  └── Error context preservation                            │
└─────────────────────────────────────────────────────────────┘
```

### エラーハンドリングフロー
```
ReCheck Request
       │
       ▼
Environment Validation
       │
   ┌───┴───┐
   │ Valid │ ──► Continue Processing
   └───┬───┘
       │
   ┌───▼───┐
   │Invalid│ ──► Fallback Path ──► Continue with Warning
   └───┬───┘
       │
   ┌───▼───┐
   │Critical│ ──► Return Error with Details
   └───────┘
```

## Data Model

### 環境変数設定スキーマ
```typescript
interface EnvironmentConfig {
  GITHUB_LOCAL_WORKSPACE: string;
  GITHUB_API_KEY: string;
  NODE_ENV: 'development' | 'production' | 'test';
  // その他の必須環境変数
}

interface EnvironmentValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  fallbackPaths: string[];
}
```

### エラー情報拡張
```typescript
interface RecheckErrorDetails {
  errorCode: 'ENV_MISSING' | 'ENV_INVALID' | 'FALLBACK_FAILED';
  environment: string;
  missingVariables: string[];
  suggestedActions: string[];
  fallbackUsed: boolean;
}
```

## Implementation Tasks

### Task 1.1: 環境変数検証システムの実装
**目的**: 本番環境での環境変数設定を検証し、問題を早期発見する

**実装内容**:
- `backend/src/config/environment.ts` の作成
- 環境変数の必須チェック機能
- 設定値の妥当性検証
- 本番環境固有の設定検証

**検証項目**:
- GITHUB_LOCAL_WORKSPACEの存在と有効性
- ディレクトリの書き込み権限確認
- その他必須環境変数の存在確認

### Task 1.2: フォールバック機能の実装
**目的**: 環境変数が未設定の場合の代替処理パスを提供

**実装内容**:
- `backend/src/utils/environmentUtils.ts` の作成
- 動的なワークスペースパス生成
- 一時ディレクトリの自動作成
- フォールバック処理のログ記録

**フォールバック戦略**:
- システム一時ディレクトリの使用
- プロセス固有のワークスペース作成
- 既存ディレクトリの再利用

### Task 1.3: エラーハンドリングの強化
**目的**: より詳細なエラー情報とユーザーフレンドリーなメッセージを提供

**実装内容**:
- `backend/src/middlewares/environmentCheck.ts` の作成
- ReCheckServiceのエラーハンドリング改善
- エラーコードの体系化
- デバッグ情報の充実

**エラーレスポンス改善**:
- 具体的な解決方法の提示
- 環境設定の確認手順
- 管理者向けの詳細ログ

### Task 2.1: 既存サービスの環境変数対応強化
**目的**: cloneRepo、auditScanner、checkActionsでの環境変数処理を改善

**実装内容**:
- `cloneRepo.ts` の環境変数検証強化
- `auditScanner.ts` のフォールバック処理追加
- `checkActions.ts` の環境変数依存度軽減
- 各サービスのエラーメッセージ改善

**改善点**:
- 環境変数未設定時の適切なエラーメッセージ
- フォールバック処理の統合
- ログ出力の詳細化

### Task 2.2: 本番環境設定の検証と修正
**目的**: 本番環境での環境変数設定を確認し、必要に応じて修正

**実装内容**:
- 本番環境での環境変数設定確認
- PM2設定での環境変数定義
- デプロイスクリプトの環境変数設定追加
- 設定検証スクリプトの作成

**設定項目**:
- GITHUB_LOCAL_WORKSPACEの本番環境パス
- ディレクトリの作成と権限設定
- 環境変数の永続化

### Task 2.3: テストと検証の実装
**目的**: 修正内容の動作確認と回帰テストの実行

**実装内容**:
- 環境変数検証のユニットテスト
- フォールバック機能の統合テスト
- 本番環境シミュレーションテスト
- エラーシナリオのテスト

**テストケース**:
- 環境変数未設定時の動作
- フォールバック処理の動作
- エラーメッセージの適切性
- 本番環境での動作確認

### Task 3.1: 監視とログ機能の強化
**目的**: 本番環境での問題を早期発見し、迅速な対応を可能にする

**実装内容**:
- 環境変数検証のログ出力強化
- エラー発生時のアラート機能
- 設定変更の監視機能
- パフォーマンス監視の追加

**監視項目**:
- 環境変数の設定状況
- フォールバック処理の使用頻度
- エラー発生パターン
- レスポンス時間の変化

### Task 3.2: ドキュメントと運用ガイドの更新
**目的**: 本番環境での設定と運用に関する情報を整備

**実装内容**:
- 本番環境設定ガイドの作成
- トラブルシューティングガイドの更新
- 環境変数設定のベストプラクティス
- デプロイ手順の更新

**ドキュメント内容**:
- 環境変数の設定方法
- トラブルシューティング手順
- 設定変更時の注意事項
- 監視とアラートの設定方法

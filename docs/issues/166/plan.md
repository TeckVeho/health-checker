# Issue #166: 本番環境 gitleaksでのalertチェックに不具合 - Implementation Plan

## Functional Requirements Mapping

### 主要機能要件
1. **gitleaks標準出力からの直接読み取り**: ファイル作成を回避し、gitleaksコマンドの標準出力から直接JSON結果を取得すること
2. **JSON解析の堅牢性**: 標準出力からのJSON解析が確実に行われ、パースエラーに対応すること
3. **エラーハンドリングの強化**: コマンド実行失敗時の適切なエラーメッセージとフォールバック処理
4. **ファイルシステム依存の排除**: 一時ファイル作成に依存しない実装

### 非機能要件
1. **本番環境対応**: EC2環境での動作保証（ファイルシステム権限問題の回避）
2. **セキュリティ**: 一時ファイル作成を排除することでセキュリティリスクを軽減
3. **ログ出力**: デバッグに必要な詳細なログ情報
4. **後方互換性**: 既存のgitleaks機能への影響なし
5. **パフォーマンス**: ファイルI/Oを排除することで処理速度の向上

## Directory Structure and File List

```
backend/src/domain/alert/util/
├── gitleaksScanner.ts          # メインのgitleaksスキャナー（修正対象）
└── gitleaksErrorHandler.ts     # 新規: エラーハンドリングユーティリティ

backend/tests/unit/domain/alert/util/
├── gitleaksScanner.test.ts     # 既存テスト（更新）
└── gitleaksErrorHandler.test.ts # 新規: エラーハンドリングテスト

backend/tests/integration/
├── gitleaksWithFetch.test.ts   # 既存テスト（更新）
└── gitleaksProduction.test.ts  # 新規: 本番環境シミュレーションテスト
```

## Architecture Design

### 現在のアーキテクチャの問題点
1. **ファイルシステム依存**: 一時ファイルの作成と削除に依存し、権限問題が発生
2. **エラーハンドリング不足**: ファイル作成失敗時の詳細な原因特定が困難
3. **本番環境考慮不足**: ディレクトリ権限やファイルシステム制約への対応が不十分

### 改善後のアーキテクチャ
```
gitleaksScanner
├── GitleaksErrorHandler
│   ├── handleCommandError()
│   ├── handleJsonParseError()
│   └── provideFallbackSolution()
└── runGitleaks (refactored)
    ├── コマンド実行（標準出力使用）
    ├── JSON解析
    └── 結果処理
```

## Data Model

### 新規インターフェース定義

```typescript
interface GitleaksErrorContext {
  error: Error;
  workspace: string;
  command: string;
  stdout?: string;
  stderr?: string;
}

interface GitleaksExecutionResult {
  success: boolean;
  findings: any[];
  error?: GitleaksErrorContext;
  executionTime: number;
}
```

## Implementation Tasks

### Task 1: gitleaksScannerの標準出力対応リファクタリング
**目的**: ファイル出力から標準出力読み取り方式に変更し、ファイルシステム依存を排除

**詳細**:
- `runGitleaks`関数の修正
- `--report-path=-`オプションの使用
- 標準出力からのJSON解析
- ファイルI/O操作の削除
- エラーハンドリングの改善

**実装ファイル**:
- `backend/src/domain/alert/util/gitleaksScanner.ts`

**検証項目**:
- 標準出力からのJSON解析の正確性
- コマンド実行エラーの適切な処理
- 既存機能の動作確認

### Task 2: エラーハンドリングユーティリティの作成
**目的**: gitleaks実行時のエラーを詳細に分析し、適切な対処法を提供する機能の実装

**詳細**:
- `GitleaksErrorHandler`クラスの作成
- コマンド実行エラーの分析
- JSON解析エラーの処理
- フォールバック処理の提供
- デバッグ情報の収集

**実装ファイル**:
- `backend/src/domain/alert/util/gitleaksErrorHandler.ts`

**検証項目**:
- 各種エラーパターンの網羅
- 本番環境でのエラー情報収集
- ユーザーフレンドリーなエラーメッセージ

### Task 3: テストスイートの拡充
**目的**: 新機能とエラーパターンの包括的なテストカバレッジの実現

**詳細**:
- エラーハンドリングのテスト
- 本番環境シミュレーションテスト
- 統合テストの更新
- 標準出力読み取りのテスト

**実装ファイル**:
- `backend/tests/unit/domain/alert/util/gitleaksErrorHandler.test.ts`
- `backend/tests/integration/gitleaksProduction.test.ts`
- `backend/tests/unit/domain/alert/util/gitleaksScanner.test.ts`

**検証項目**:
- 全エラーパターンのテスト
- 本番環境条件でのテスト
- 既存テストの動作確認

### Task 4: ログ出力とモニタリングの改善
**目的**: 本番環境での問題診断を容易にするためのログ機能の強化

**詳細**:
- 詳細なデバッグログの追加
- エラー発生時のコンテキスト情報収集
- パフォーマンスメトリクスの記録
- アラート機能との連携

**実装ファイル**:
- `backend/src/domain/alert/util/gitleaksScanner.ts`
- `backend/src/domain/alert/util/gitleaksErrorHandler.ts`

**検証項目**:
- ログレベルの適切な設定
- 機密情報の適切なマスキング
- パフォーマンスへの影響最小化

## 実装順序と依存関係

1. **Task 1**: gitleaksScannerの標準出力対応リファクタリング（基盤となる機能）
2. **Task 2**: エラーハンドリングユーティリティ（Task 1に依存）
3. **Task 3**: テストスイート（Task 1, 2に依存）
4. **Task 4**: ログ出力改善（Task 1, 2に依存）

## リスク評価と対策

### 高リスク
- **本番環境での動作確認**: 実際のEC2環境でのテストが必要
- **既存機能への影響**: gitleaks機能の既存動作への影響

### 中リスク
- **JSON解析エラー**: 標準出力からのJSON解析失敗
- **テストカバレッジ**: 本番環境特有のエラーパターンの網羅

### 対策
- 段階的な実装とテスト
- 既存テストの継続実行
- 本番環境での段階的デプロイ
- ロールバック計画の準備

## 成功基準

1. **機能要件**: 本番環境でgitleaksが標準出力から正常に結果を取得する
2. **エラーハンドリング**: コマンド実行失敗時に適切なエラーメッセージが表示される
3. **後方互換性**: 既存のgitleaks機能が正常に動作する
4. **テストカバレッジ**: 新機能のテストカバレッジが90%以上
5. **パフォーマンス**: ファイルI/Oを排除することで処理速度が向上する
6. **セキュリティ**: 一時ファイル作成を排除することでセキュリティリスクが軽減される

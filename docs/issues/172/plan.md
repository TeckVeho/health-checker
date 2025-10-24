# Issue #172: Add PR Check feature - Implementation Plan

## Functional Requirements Mapping

### 1.1 pr_unclear_changes - 変更内容が不明確
- **重要度**: Middle
- **説明**: PRで何を変更したかが明確に記載されていない
- **検出条件**: 変更内容の説明が曖昧、具体的な実装詳細が不足
- **実装方法**: 既存のPRCheck.hasMeaningfulBody()とLLM分析を活用

### 1.2 pr_missing_evidence - 証拠が不足
- **重要度**: Middle
- **説明**: スクリーンショット、テストログ、動作確認結果などの証拠が含まれていない
- **検出条件**: 変更を証明する材料が不足
- **実装方法**: 既存のPRCheck.hasTestEvidence()を拡張

## Directory Structure and File List

```
backend/src/domain/alert/util/
├── checkPullRequests.ts          # 新規作成: PRチェック機能のメイン実装
├── checkPullRequests/
│   ├── index.ts                  # 新規作成: メインオーケストレーター
│   ├── types.ts                  # 新規作成: 型定義
│   ├── github.ts                 # 新規作成: GitHub API操作
│   ├── validators.ts             # 新規作成: PR検証ロジック
│   └── llm.ts                    # 新規作成: LLM分析機能
```

## Architecture Design

### 1. 全体アーキテクチャ
- 既存の`checkIssues`、`checkActions`、`checkBranches`と同様のパターンを採用
- `alertService.ts`の`processActionAlerts`に新しいPRチェック機能を統合
- GitHub APIを使用してPRデータを取得し、LLM分析で品質チェックを実行

### 2. データフロー
```
GitHub API → PR取得 → バリデーション → LLM分析 → アラート生成 → データベース保存
```

### 3. 既存システムとの統合
- `alertService.ts`の`processActionAlerts`メソッドに新しいPRチェック機能を追加
- 既存の`PRCheck`クラスの機能を再利用
- 既存のアラート保存・更新ロジックを活用

## Data Model

### 1. 新しいアラートタイプ
```typescript
// checkType: 'pr_unclear_changes'
{
  owner: string,
  repo: string,
  checkType: 'pr_unclear_changes',
  title: 'pr:${prNumber}',
  description: 'PRの変更内容が不明確です',
  severity: 'middle',
  author: string,
  filePath: '',
  lineNumber: -1,
  codeSnippet: '',
  branch: string,
  issueUrl: string
}

// checkType: 'pr_missing_evidence'
{
  owner: string,
  repo: string,
  checkType: 'pr_missing_evidence',
  title: 'pr:${prNumber}',
  description: 'PRに証拠が不足しています',
  severity: 'middle',
  author: string,
  filePath: '',
  lineNumber: -1,
  codeSnippet: '',
  branch: string,
  issueUrl: string
}
```

### 2. 既存データベーススキーマの活用
- 既存の`AlertAttributes`インターフェースをそのまま使用
- 新しい`checkType`値のみ追加

## Implementation Tasks

### Task 1: 基本構造の作成
**目的**: PRチェック機能の基本ファイル構造を作成
**ファイル**: 
- `backend/src/domain/alert/util/checkPullRequests.ts`
- `backend/src/domain/alert/util/checkPullRequests/index.ts`
- `backend/src/domain/alert/util/checkPullRequests/types.ts`

**実装内容**:
- 既存の`checkIssues`パターンを参考にした基本構造
- TypeScript型定義の作成
- メインオーケストレーター関数の骨格

### Task 2: GitHub API操作の実装
**目的**: GitHub APIを使用してPRデータを取得する機能を実装
**ファイル**: `backend/src/domain/alert/util/checkPullRequests/github.ts`

**実装内容**:
- 既存の`GitHubUtility`クラスを参考にしたPR取得機能
- オープンなPRの一覧取得
- PR詳細情報の取得（タイトル、本文、作成者等）

### Task 3: バリデーションロジックの実装
**目的**: PRの品質をチェックするバリデーション機能を実装
**ファイル**: `backend/src/domain/alert/util/checkPullRequests/validators.ts`

**実装内容**:
- `pr_unclear_changes`の検出ロジック
- `pr_missing_evidence`の検出ロジック
- 既存の`PRCheck`クラスの機能を活用

### Task 4: LLM分析機能の実装
**目的**: PRの内容をLLMで分析して品質を評価する機能を実装
**ファイル**: `backend/src/domain/alert/util/checkPullRequests/llm.ts`

**実装内容**:
- 既存の`PRCheck.runUnifiedLLMReview`を参考にしたLLM分析
- 変更内容の明確性を評価するプロンプト
- 証拠の存在を評価するプロンプト

### Task 5: アラートサービスの統合
**目的**: 新しいPRチェック機能を既存のアラートサービスに統合
**ファイル**: `backend/src/domain/alert/alertService.ts`

**実装内容**:
- `processActionAlerts`メソッドに新しいPRチェック機能を追加
- 既存のアラート保存・更新ロジックとの統合
- エラーハンドリングの追加

### Task 6: テストの実装
**目的**: 新機能のテストを実装
**ファイル**: 
- `backend/tests/unit/domain/alert/util/checkPullRequests.test.ts`
- `backend/tests/integration/checkPullRequests.integration.test.ts`

**実装内容**:
- ユニットテストの実装
- 統合テストの実装
- モックデータの作成

### Task 7: コマンドラインインターフェースの追加
**目的**: 新しいPRチェック機能をコマンドラインから実行できるようにする
**ファイル**: `backend/src/commands/alertRunner.ts`

**実装内容**:
- `alertRunner.ts`に新しい`pr`チェックタイプを追加
- コマンドライン引数の処理

### Task 8: ドキュメントの更新
**目的**: 新機能のドキュメントを更新
**ファイル**: 
- `docs/openapi/` (API仕様書)
- README.md

**実装内容**:
- API仕様書の更新
- 使用方法のドキュメント更新

## 技術的な考慮事項

### 1. 既存システムとの互換性
- 既存のアラートシステムとの完全な互換性を維持
- 既存の`PRCheck`クラスの機能を最大限活用
- 既存のデータベーススキーマを変更せずに実装

### 2. パフォーマンス
- GitHub APIのレート制限を考慮した実装
- バッチ処理での効率的なPR取得
- 既存のプログレスコールバック機能の活用

### 3. エラーハンドリング
- GitHub APIエラーの適切な処理
- LLM分析失敗時のフォールバック処理
- ログ出力の充実

### 4. テスト戦略
- 既存のテストパターンに従った実装
- モックデータを使用したユニットテスト
- 実際のGitHub APIを使用した統合テスト

## 実装順序

1. **Task 1**: 基本構造の作成
2. **Task 2**: GitHub API操作の実装
3. **Task 3**: バリデーションロジックの実装
4. **Task 4**: LLM分析機能の実装
5. **Task 5**: アラートサービスの統合
6. **Task 6**: テストの実装
7. **Task 7**: コマンドラインインターフェースの追加
8. **Task 8**: ドキュメントの更新

## 成功基準

- 新しいアラートタイプ`pr_unclear_changes`と`pr_missing_evidence`が正常に動作する
- 既存のアラートシステムとの完全な互換性が維持される
- 適切なテストカバレッジが確保される
- ドキュメントが適切に更新される
- パフォーマンス要件を満たす

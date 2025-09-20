# Issue #138: ReCheck時に既に登録されているalertが重複登録される不具合の修正 - Implementation Plan

## Functional Requirements Mapping

### 機能要件の分析
1. **重複登録防止**: ReCheck実行時に既存のalertが重複して登録されない
2. **既存alert更新**: 既存のalertの情報（detectCount、lastDetectedAt等）が適切に更新される
3. **データ整合性**: データベースレベルでの整合性が保たれる
4. **パフォーマンス**: 重複チェック処理がパフォーマンスに大きな影響を与えない

### 根本原因の特定
**`findOrCreate`の`where`条件と`defaults`の値が一致していない**

- `where`条件: `filePath: alert.filePath || ''` (空文字列)
- `defaults`: `filePath: alert.filePath || null` (null)

この不一致により、既存レコードが見つからず、常に新規作成（`created = true`）されてしまう。

### 現在の問題点
- AlertServiceの`findOrCreate`処理で`where`条件と`defaults`の値が不一致
- 各check処理（checkIssues, checkActions, checkBranches等）で同様の問題が発生
- データベースのNULL値と空文字列の扱いが統一されていない

## Directory Structure and File List

### バックエンド修正対象ファイル
```
backend/src/domain/alert/
├── alertService.ts                    # メイン修正対象：重複チェックロジック改善
├── alertSchema.ts                     # ユニーク制約の確認・追加
└── util/
    ├── checkIssues.ts                 # Issue check処理の重複防止
    ├── checkActions.ts                # Action check処理の重複防止
    ├── checkBranches.ts               # Branch check処理の重複防止
    ├── auditScanner.ts                # Audit check処理の重複防止
    └── gitleaksScanner.ts             # Gitleaks check処理の重複防止

backend/src/domain/recheck/
├── recheckService.ts                  # ReCheck実行フローの確認
└── recheckController.ts               # API エンドポイントの確認

backend/src/database/
└── migrations/                        # 必要に応じてマイグレーション追加
```

### フロントエンド修正対象ファイル
```
frontend/src/composables/
└── useRecheck.ts                      # フロントエンドでの重複実行防止

frontend/src/utils/
└── api.ts                             # API呼び出しの重複防止
```

### テストファイル
```
backend/tests/
├── unit/domain/alert/
│   ├── alertService.test.ts           # 重複登録防止テスト
│   └── alertUtil.test.ts              # 各check処理のテスト
└── integration/
    └── recheck.test.ts                # ReCheck統合テスト

frontend/tests/
└── unit/composables/
    └── useRecheck.test.ts             # useRecheck composableのテスト
```

## Architecture Design

### 重複防止アーキテクチャ
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │   Database      │
│                 │    │                  │    │                 │
│ useRecheck      │───▶│ ReCheckService   │───▶│ RecheckExec     │
│ - Rate limiting │    │ - Rate limiting  │    │ - Unique keys   │
│ - State mgmt    │    │ - Duplicate chk  │    │ - Constraints   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   AlertService   │
                       │ - findOrCreate   │
                       │ - Duplicate key  │
                       │ - Update logic   │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Alert Table    │
                       │ - Unique index   │
                       │ - Composite key  │
                       └──────────────────┘
```

### 重複チェックフロー
1. **データ正規化**: NULL値と空文字列の統一処理
2. **findOrCreate条件**: `where`条件と`defaults`の値の一致
3. **アプリケーションレベル**: 論理的重複チェックと既存レコード更新
4. **データベースレベル**: 適切なユニーク制約による物理的重複防止

## Data Model

### Alert テーブルの現状確認
```sql
-- 既存のユニーク制約の確認
SHOW INDEX FROM alerts WHERE Key_name = 'unique_health_issue';

-- 重複データの確認クエリ
SELECT 
  owner, repo, check_type, title, file_path, line_number, code_snippet, branch,
  COUNT(*) as duplicate_count
FROM alerts 
WHERE system_resolved = false
GROUP BY owner, repo, check_type, title, file_path, line_number, code_snippet, branch
HAVING COUNT(*) > 1;
```

### RecheckExecution テーブル（既存）
- レート制限管理
- 実行状態管理
- 重複実行防止

### 修正後のキー生成ロジック
```typescript
interface AlertKey {
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  filePath: string | null;
  lineNumber: number | null;
  codeSnippet: string | null;
  branch: string | null;
}

function normalizeAlertFields(alert: AlertCandidate): AlertKey {
  return {
    owner: alert.owner,
    repo: alert.repo,
    checkType: alert.checkType,
    title: alert.title,
    filePath: alert.filePath || null,  // 空文字列ではなくnull
    lineNumber: alert.lineNumber || null,  // -1ではなくnull
    codeSnippet: alert.codeSnippet || null,  // 空文字列ではなくnull
    branch: alert.branch || null  // 空文字列ではなくnull
  };
}
```

## Implementation Tasks

### Task 1.1: AlertServiceのfindOrCreate条件修正
**目的**: `findOrCreate`の`where`条件と`defaults`の値を一致させる

**実装内容**:
- `AlertService.processIssueAlertsWithProgress`の修正
- `where`条件と`defaults`でのNULL値と空文字列の扱いを統一
- 一貫した値の設定ロジックの実装

**技術詳細**:
```typescript
// 修正前（問題のあるコード）
await Alert.findOrCreate({
  where: { 
    filePath: alert.filePath || '',  // 空文字列
    lineNumber: alert.lineNumber || -1,
    codeSnippet: alert.codeSnippet || '',
    branch: alert.branch || ''
  },
  defaults: {
    filePath: alert.filePath || null,  // null
    lineNumber: alert.lineNumber || null,
    codeSnippet: alert.codeSnippet || null,
    branch: alert.branch || null
  }
});

// 修正後（統一されたコード）
const normalizeValue = (value: any) => value || null;

await Alert.findOrCreate({
  where: { 
    filePath: normalizeValue(alert.filePath),
    lineNumber: normalizeValue(alert.lineNumber),
    codeSnippet: normalizeValue(alert.codeSnippet),
    branch: normalizeValue(alert.branch)
  },
  defaults: {
    filePath: normalizeValue(alert.filePath),
    lineNumber: normalizeValue(alert.lineNumber),
    codeSnippet: normalizeValue(alert.codeSnippet),
    branch: normalizeValue(alert.branch)
  }
});
```

**受け入れ基準**:
- [ ] `findOrCreate`で既存レコードが適切に見つかる
- [ ] 重複登録が発生しない
- [ ] 既存レコードの更新が正常に動作する

### Task 1.2: 各Check処理のfindOrCreate条件修正
**目的**: 全てのcheck処理で`findOrCreate`の条件を統一修正

**実装内容**:
- `checkActions.ts`: Action check処理の修正
- `checkBranches.ts`: Branch check処理の修正
- `auditScanner.ts`: Audit check処理の修正
- `gitleaksScanner.ts`: Gitleaks check処理の修正

**技術詳細**:
各ファイルで同様の問題を修正：
```typescript
// 統一されたヘルパー関数
const normalizeAlertFields = (alert: AlertCandidate) => ({
  owner: alert.owner,
  repo: alert.repo,
  checkType: alert.checkType,
  title: alert.title,
  filePath: alert.filePath || null,
  lineNumber: alert.lineNumber || null,
  codeSnippet: alert.codeSnippet || null,
  branch: alert.branch || null
});

// 修正後のfindOrCreate
const keyFields = normalizeAlertFields(alert);
const [record, created] = await Alert.findOrCreate({
  where: keyFields,
  defaults: {
    ...keyFields,
    description: alert.description,
    severity: alert.severity,
    detectCount: 1,
    lastDetectedAt: new Date(),
    isIgnored: false,
    manualResolved: false,
    systemResolved: false,
    createdAt: new Date(),
  },
});

if (!created) {
  await record.update({
    detectCount: (record as any).detectCount + 1,
    lastDetectedAt: new Date(),
    systemResolved: false,
    systemResolvedReason: undefined,
  });
}
```

**受け入れ基準**:
- [ ] 全てのcheck処理で重複登録が防止される
- [ ] 既存レコードの更新が適切に行われる
- [ ] `where`条件と`defaults`の値が一致する
- [ ] コードの一貫性が保たれる

### Task 1.3: 共通ヘルパー関数の作成
**目的**: 重複チェックロジックの共通化とメンテナンス性向上

**実装内容**:
- `AlertService`に共通の重複チェック関数を追加
- 値の正規化ロジックの統一
- エラーハンドリングの統一

**技術詳細**:
```typescript
// AlertService.ts に追加
class AlertService {
  /**
   * Alert フィールドの正規化
   */
  private static normalizeAlertFields(alert: AlertCandidate) {
    return {
      owner: alert.owner,
      repo: alert.repo,
      checkType: alert.checkType,
      title: alert.title,
      filePath: alert.filePath || null,
      lineNumber: alert.lineNumber || null,
      codeSnippet: alert.codeSnippet || null,
      branch: alert.branch || null
    };
  }

  /**
   * Alert の重複チェック付き登録・更新
   */
  static async upsertAlert(alert: AlertCandidate): Promise<{ record: Alert; created: boolean }> {
    const keyFields = this.normalizeAlertFields(alert);
    const timestamp = new Date();
    
    const [record, created] = await Alert.findOrCreate({
      where: keyFields,
      defaults: {
        ...keyFields,
        description: alert.description,
        severity: alert.severity,
        author: alert.author || null,
        authorDisplayName: alert.authorDisplayName || null,
        detectCount: 1,
        lastDetectedAt: timestamp,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
        createdAt: timestamp,
      },
    });

    if (!created) {
      await record.update({
        detectCount: (record as any).detectCount + 1,
        lastDetectedAt: timestamp,
        systemResolved: false,
        systemResolvedReason: undefined,
      });
    }

    return { record, created };
  }
}
```

**受け入れ基準**:
- [ ] 共通ヘルパー関数が作成される
- [ ] 全てのcheck処理で共通関数を使用する
- [ ] コードの重複が大幅に削減される
- [ ] メンテナンス性が向上する

### Task 2.1: テストケースの作成
**目的**: 重複登録防止機能のテストカバレッジを確保

**実装内容**:
- `AlertService.upsertAlert`の単体テスト
- 各check処理の重複防止テスト
- エッジケースのテスト（NULL値、空文字列等）
- 統合テストの作成

**技術詳細**:
```typescript
// テスト例
describe('AlertService.upsertAlert', () => {
  it('should find existing alert and update detectCount', async () => {
    // 既存のalertを作成
    const existingAlert = await Alert.create({
      owner: 'test-owner',
      repo: 'test-repo',
      checkType: 'test-check',
      title: 'Test Alert',
      filePath: null, // 重要なポイント
      lineNumber: null,
      codeSnippet: null,
      branch: null
    });

    // 同じalertでupsertAlertを実行
    const alertCandidate = {
      owner: 'test-owner',
      repo: 'test-repo',
      checkType: 'test-check',
      title: 'Test Alert',
      filePath: null, // 同じ値
      lineNumber: null,
      codeSnippet: null,
      branch: null,
      description: 'Updated description',
      severity: 'high'
    };

    const result = await AlertService.upsertAlert(alertCandidate);
    
    expect(result.created).toBe(false);
    expect(result.record.detectCount).toBe(2);
    expect(result.record.lastDetectedAt).toBeDefined();
  });

  it('should create new alert when no existing alert found', async () => {
    const alertCandidate = {
      owner: 'test-owner',
      repo: 'test-repo',
      checkType: 'test-check',
      title: 'New Alert',
      filePath: null,
      lineNumber: null,
      codeSnippet: null,
      branch: null,
      description: 'New alert description',
      severity: 'medium'
    };

    const result = await AlertService.upsertAlert(alertCandidate);
    
    expect(result.created).toBe(true);
    expect(result.record.detectCount).toBe(1);
  });
});
```

**受け入れ基準**:
- [ ] 重複登録防止機能が適切にテストされる
- [ ] エッジケースが網羅される
- [ ] テストカバレッジが90%以上
- [ ] 統合テストが正常に動作する

### Task 2.2: 既存データのクリーンアップ
**目的**: 既存の重複データをクリーンアップ

**実装内容**:
- 既存の重複alertの検出スクリプト作成
- 重複データのマージまたは削除
- データ整合性の確認
- クリーンアップスクリプトの実行

**技術詳細**:
```sql
-- 重複データの検出クエリ
SELECT 
  owner, repo, check_type, title, file_path, line_number, code_snippet, branch,
  COUNT(*) as duplicate_count,
  MIN(id) as keep_id,
  GROUP_CONCAT(id ORDER BY created_at) as all_ids
FROM alerts 
WHERE system_resolved = false
GROUP BY owner, repo, check_type, title, file_path, line_number, code_snippet, branch
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

**受け入れ基準**:
- [ ] 既存の重複データが適切に検出される
- [ ] 重複データが適切に処理される
- [ ] データの整合性が保たれる
- [ ] クリーンアップ処理がロールバック可能

### Task 2.3: ドキュメントの更新
**目的**: 修正内容のドキュメント化

**実装内容**:
- 修正内容の技術文書作成
- API仕様書の更新
- トラブルシューティングガイドの作成
- 変更履歴の記録

**受け入れ基準**:
- [ ] 全ての変更がドキュメント化される
- [ ] 技術的な詳細が記録される
- [ ] 運用ガイドが完成している


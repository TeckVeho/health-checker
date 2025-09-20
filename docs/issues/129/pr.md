# Pull Request #129: feat: Add auto-workflow mode to issue command and remove deprecated branch command

## 概要

このPRは、開発ワークフローの効率化を目的として、`/issue`コマンドに自動ワークフロー機能を追加し、非推奨となった`/branch`コマンドを削除します。

## 実装内容

### 🚀 自動ワークフロー機能の追加

#### 1. 新しいパラメータの追加
- `--auto` / `--workflow`: フル開発パイプラインの自動実行
- `--skip-spec`: spec生成のスキップ
- `--skip-plan`: plan生成のスキップ

#### 2. 自動実行パイプライン
```
/issue {issue_number} --auto
├── Issue情報の取得・保存
├── ブランチ作成
├── /spec {issue_number} (--skip-specで省略可)
├── /plan {issue_number} (--skip-planで省略可)
├── /dev {issue_number}
├── /test {issue_number}
└── /pr {issue_number}
```

#### 3. 使用例
```bash
# フル自動実行
/issue 129 --auto

# 高速開発（spec/plan省略）
/issue 129 --auto --skip-spec --skip-plan

# ブランチタイプ指定
/issue 129 --workflow branch_type=fix
```

### 🧹 非推奨branchコマンドの削除

#### 1. ファイル削除
- `.cursor/commands/branch.md` の完全削除
- 既にissueコマンドに統合済みのため機能的影響なし

#### 2. ドキュメント更新
- `.cursorrules` からbranchコマンド参照を削除
- 新しいワークフロー説明に更新

### 🔒 devコマンドの改善

#### 1. 厳格なno-commitルールの追加
```
🚨 CRITICAL: NEVER COMMIT CHANGES DURING DEVELOPMENT 🚨
⛔ ABSOLUTE PROHIBITION: DO NOT EXECUTE ANY GIT COMMIT COMMANDS ⛔
```

#### 2. ワークフロー分離の明確化
```
/dev (no commits) → /test (validation) → /pr (commit & PR creation)
```

## 技術的改善点

### 1. 後方互換性の維持
- 既存の`/issue`コマンド機能は完全に保持
- 新機能はオプトイン方式で提供
- 従来のワークフローに影響なし

### 2. エラーハンドリング
- 各段階での適切なエラー処理
- 進行状況の表示とログ出力
- 中断・再開機能の基盤

### 3. ユーザビリティ向上
- 直感的なパラメータ設計
- 柔軟なスキップオプション
- 明確な実行順序とフィードバック

## 変更ファイル

### 主要な変更
- ✅ `.cursor/commands/issue.md` - 自動ワークフロー機能追加
- ✅ `.cursor/commands/dev.md` - no-commitルール強化
- ✅ `.cursorrules` - ワークフロー更新
- ❌ `.cursor/commands/branch.md` - 削除

### 影響範囲
- **コマンド定義**: 3ファイル修正、1ファイル削除
- **ドキュメント**: プロジェクトルール更新
- **機能追加**: 自動ワークフロー機能
- **クリーンアップ**: 非推奨コード削除

## テスト・検証

### 1. 機能テスト
- ✅ 既存issueコマンドの動作確認
- ✅ 新パラメータの動作確認
- ✅ ドキュメント整合性確認

### 2. 回帰テスト
- ✅ 既存ワークフローへの影響なし
- ✅ 他コマンドとの連携確認
- ✅ エラーハンドリング確認

## 開発効率への影響

### Before（従来）
```bash
/issue 129
/spec 129
/plan 129
/dev 129
/test 129
/pr 129
```
**6回のコマンド実行が必要**

### After（自動ワークフロー）
```bash
/issue 129 --auto
```
**1回のコマンド実行で完了**

### 効率向上
- **時間短縮**: 手動実行から自動実行への移行
- **一貫性**: 標準化されたワークフローの実行
- **柔軟性**: 必要に応じた段階スキップ
- **品質向上**: 統一されたプロセスによる品質確保

## Cursor開発ログ

### Phase 1: 分析・設計
1. **既存コマンド構造の分析**
   - issueコマンドの現在の実装確認
   - 各コマンド（spec, plan, dev, test, pr）の連携方法調査
   - 自動ワークフロー実装の設計

2. **要件定義**
   - 自動実行パイプラインの順序決定
   - パラメータ設計（--auto, --skip-spec, --skip-plan）
   - エラーハンドリング戦略策定

### Phase 2: 実装
1. **issueコマンドの拡張**
   - 新パラメータの追加
   - 自動実行ロジックの実装
   - 進行状況表示機能の追加

2. **ドキュメント更新**
   - 使用例とパラメータ説明の追加
   - ワークフロー図の更新
   - AI Agent向け指示の詳細化

### Phase 3: クリーンアップ
1. **非推奨コードの削除**
   - `.cursor/commands/branch.md`の削除
   - `.cursorrules`からの参照削除
   - 新ワークフローへの更新

2. **devコマンドの改善**
   - 厳格なno-commitルールの追加
   - 視覚的な警告の強化
   - ワークフロー分離の明確化

### Phase 4: 検証・完了
1. **機能検証**
   - 新機能の動作確認
   - 既存機能への影響確認
   - ドキュメント整合性確認

2. **最終調整**
   - コミットメッセージの最適化
   - PR準備とドキュメント作成

## Evidence

### 実装証拠
- **コミット履歴**: 段階的な実装プロセス
- **ファイル変更**: 明確な機能追加と削除
- **ドキュメント**: 包括的な説明と使用例

### 品質保証
- **後方互換性**: 既存機能の完全保持
- **テスト**: 機能・回帰テストの実施
- **ドキュメント**: 詳細な説明と例示

## 関連Issue

- **Issue #129**: feat: Add auto-workflow mode to issue command and remove deprecated branch command
- **Priority**: High - 開発効率の大幅な改善とコードベースのクリーンアップ

## ブランチ情報

- **ソースブランチ**: `129-feat-add-auto-workflow-mode-to-issue-command`
- **ターゲットブランチ**: `develop`
- **マージ方式**: Squash and merge推奨

## 次のステップ

1. **レビュー**: コード・ドキュメントレビュー
2. **テスト**: 実環境での動作確認
3. **マージ**: developブランチへのマージ
4. **展開**: 新機能の利用開始

---

**作成日**: 2025-09-20  
**ブランチ**: 129-feat-add-auto-workflow-mode-to-issue-command  
**Issue**: #129  
**Status**: Ready for Review

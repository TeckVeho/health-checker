# Issue #156: PRコマンド改善: Evidenceセクション追加とpr.md保存機能

## 基本情報

- **Issue URL**: https://github.com/TeckVeho/health-checker/issues/156
- **状態**: OPEN
- **作成日**: 2025-09-21T02:33:51Z
- **更新日**: 2025-09-21T02:33:51Z
- **ラベル**: なし
- **担当者**: なし

## 概要

PRコマンドにEvidenceセクションを追加し、テスト結果を含むPR bodyを作成・保存する機能を実装する。

## 要件

1. PR bodyに## Evidenceセクションを追加
2. 実行したテストコマンドとテスト結果（total結果部分）を表示
3. 失敗があれば失敗した機能の部分のテスト結果を表示
4. commit前にpr bodyを作成し、docs/issues/{issue_number}/pr.mdに保存

## 技術詳細

- .cursor/commands/pr.mdの修正
- テスト結果の取得とフォーマット
- pr.mdファイルの保存機能追加
- Evidenceセクションのテンプレート作成

## 受け入れ基準

- [x] PR bodyにEvidenceセクションが追加される
- [x] テスト結果が適切にフォーマットされて表示される
- [x] 失敗したテストの詳細が表示される
- [x] pr.mdファイルがcommit前に保存される
- [x] 既存の機能に影響しない
- [x] **重要**: テスト結果の捏造を防止し、テスト結果がない場合は適切に表示する

## 実装方針

1. **Evidenceセクションの設計**
   - テストコマンドの実行履歴
   - テスト結果のサマリー（total結果）
   - 失敗したテストの詳細情報
   - 実行時間とカバレッジ情報

2. **pr.md保存機能**
   - commit前にPR bodyを生成
   - docs/issues/{issue_number}/pr.mdに保存
   - 既存のPRコマンドワークフローとの統合

3. **テスト結果取得**
   - docs/issues/{issue_number}/evidence/test-results.jsonからの読み込み
   - バックエンド・フロントエンドのテスト結果統合
   - 失敗ケースの詳細情報抽出

## 関連ファイル

- `.cursor/commands/pr.md` - PRコマンドのメインファイル
- `docs/issues/{issue_number}/evidence/test-results.json` - テスト結果ファイル
- `docs/issues/{issue_number}/pr.md` - 生成されるPR bodyファイル

## 注意事項

- 既存のPRコマンドの機能を維持
- メモリの制約を考慮（pr.mdファイル作成を許可）
- テスト結果のフォーマットを統一
- **重要**: テスト結果の捏造は絶対に禁止 - テスト結果がない場合は適切に「テスト結果なし」と表示する

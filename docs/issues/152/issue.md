# Issue #152: バックエンドユニットテストの作成とカバレッジレート向上

## 基本情報
- **Issue番号**: 152
- **タイトル**: バックエンドユニットテストの作成とカバレッジレート向上
- **状態**: OPEN
- **作成日**: 2025-09-21T00:37:07Z
- **URL**: https://github.com/TeckVeho/health-checker/issues/152
- **ブランチ**: issue/152-backend-unit-test-coverage

## 概要
バックエンドのユニットテストを充実させ、コードカバレッジレートを向上させる。

## 現在の状況
- 全体のステートメントカバレッジ: 18.32%
- ブランチカバレッジ: 4.51%
- 関数カバレッジ: 5.79%
- 行カバレッジ: 18.75%

## 対象
- モックを使用したユニットテストの作成
- DBに接続しないテスト設計
- カバレッジレートの向上

## 優先度
- カバレッジが低い領域から優先的に実施
  - src/domain/alert (8.57%)
  - src/domain/alert/util/checkIssues (13.57%)
  - src/domain/githubAction (24%)
  - src/domain/recheck (15.77%)
  - src/domain/repo (16.66%)

## 受け入れ基準
- ユニットテストがモックを使用してDBに接続しないこと
- 全体的なカバレッジレートが向上すること
- 既存のテストが壊れないこと

## 作業内容
- [ ] 現在のテスト状況の詳細分析
- [ ] テスト作成対象の特定
- [ ] モック設定の整備
- [ ] ユニットテストの実装
- [ ] カバレッジレートの確認と改善

## 技術要件
- Jest テストフレームワーク
- TypeScript
- モックライブラリの活用
- DB接続なしのテスト設計

## 関連ファイル
- `backend/jest.config.ts`
- `backend/tests/unit/`
- `backend/src/domain/`
- `backend/coverage/`

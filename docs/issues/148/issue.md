# Issue #148: ReCheck時にProgress行とPhaseProgress行を表示しないようにする

## 概要
UIの改修
ReCheck実行時に表示されるProgress行とPhaseProgress行を削除して、UIをより簡潔にする。

## 現在の問題
- ReCheck実行時に以下のような行が表示される：
  - Progress: 行
  - PhaseProgress: 行
- これらの行は冗長で、UI上余計な縦幅が増えて見づらくなっている

## 期待される動作
- ReCheck実行時にProgress行とPhaseProgress行を表示しない
- その他の重要な情報は引き続き表示する

## Issue詳細
- **Issue番号**: #148
- **タイトル**: ReCheck時にProgress行とPhaseProgress行を表示しないようにする
- **ステータス**: OPEN
- **作成日時**: 2025-09-20T13:12:46Z
- **更新日時**: 2025-09-20T14:05:54Z
- **ブランチ名**: issue/148-remove-progress-lines

## 実装メモ
- ReCheck実行時の進捗表示ロジックを確認
- Progress行とPhaseProgress行の出力を削除
- 重要な情報は引き続き表示されることを確認
# Issue #142: 本番環境でReCheckボタンがGITHUB_LOCAL_WORKSPACEエラーで失敗する

## 基本情報
- **Issue番号:** 142
- **タイトル:** 本番環境でReCheckボタンがGITHUB_LOCAL_WORKSPACEエラーで失敗する
- **状態:** OPEN
- **作成日時:** 2025-09-20T11:20:44Z
- **更新日時:** 2025-09-20T11:20:44Z
- **担当者:** なし

## ラベル
- `bug` - Something isn't working
- `high priority` - 高優先度
- `production` - 本番環境関連

## 問題の概要
本番環境（EC2 Amazon Linux 2023）でのみ、ReCheckボタンを押すと以下のエラーが発生し、recheck_executionsに記録されてリチェックができない状態になっています。

## エラー内容
- エラーメッセージ: `GITHUB_LOCAL_WORKSPACE is required`
- 発生環境: 本番環境（EC2 Amazon Linux 2023）のみ
- 影響: ReCheckボタンが機能しない

## 期待される動作
- 本番環境でもReCheckボタンが正常に動作すること
- 環境変数GITHUB_LOCAL_WORKSPACEが適切に設定されていること

## 調査が必要な項目
1. 本番環境での環境変数設定状況
2. GITHUB_LOCAL_WORKSPACEの設定値
3. ローカル環境との設定差異
4. ReCheck処理での環境変数参照方法

## 優先度
高 - 本番環境での主要機能が動作しないため

## 関連ファイル
- ReCheck処理の実装箇所
- 環境変数設定ファイル
- 本番環境のデプロイ設定

## 作業ブランチ
- `issue/142-github-local-workspace-error`

# Issue #166: 本番環境 gitleaksでのalertチェックに不具合

## 基本情報
- **Issue番号:** #166
- **タイトル:** 本番環境 gitleaksでのalertチェックに不具合
- **状態:** OPEN
- **作成日時:** 2025-09-22T06:36:35Z
- **更新日時:** 2025-09-22T06:36:35Z
- **担当者:** なし
- **ラベル:** bug, high priority, in-prod, production

## 問題の概要
本番環境でgitleaksによるアラートチェックでエラーが発生している。

## エラー内容
```
ENOENT: no such file or directory, open '/home/ec2-user/tmp/github/gitleaks-result-3cf87826-1580-49cc-a340-055fce2dd2a9.json'
```

## 環境
- 本番環境（EC2）
- gitleaksチェック機能

## 期待される動作
gitleaksの結果ファイルが正常に作成され、アラートチェックが実行されること

## 実際の動作
gitleaksの結果ファイルが見つからず、ファイル読み込みエラーが発生している

## 影響範囲
- 本番環境でのアラートチェック機能
- セキュリティチェックの実行

## 優先度
High - セキュリティチェック機能の不具合のため

## ラベル
- bug
- production
- in-prod
- high priority

## 関連ファイル
- gitleaks関連のコード
- アラートチェック機能
- ファイルパス生成ロジック

## 調査が必要な項目
1. gitleaksの結果ファイルが作成されるタイミング
2. ファイルパスの生成ロジック
3. ファイル作成の権限やディレクトリの存在確認
4. 本番環境でのgitleaks実行プロセス

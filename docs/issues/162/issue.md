# Issue #162: author_display_name列の廃止

## 基本情報
- **Issue番号**: #162
- **タイトル**: author_display_name列の廃止
- **状態**: OPEN
- **作成日**: 2025-09-21T10:31:47Z
- **更新日**: 2025-09-21T10:31:47Z
- **URL**: https://github.com/TeckVeho/health-checker/issues/162
- **担当者**: なし
- **ラベル**: なし

## 概要
author_display_name列を廃止し、author列のみで管理するように変更する。

## 変更内容
- backend: author_display_name列を廃止し、記録しないようにする
- frontend: author_display_nameの表示を削除する
- frontend: author_display_nameのアイコンを削除する

## 影響範囲
- データベーススキーマの変更
- APIレスポンスの変更
- フロントエンドの表示ロジックの変更

## 実装タスク
- [ ] backend: alertSchema.tsからauthorDisplayNameを削除
- [ ] backend: alertService.tsからauthor_display_nameの参照を削除
- [ ] frontend: AuthorGroupedTable.vueからdisplayNameの表示を削除
- [ ] frontend: authors/[author].vueからauthorDisplayNameの表示を削除
- [ ] データベースマイグレーションの作成

## ブランチ情報
- **ブランチ名**: issue/162-author-display-name-removal
- **作成日時**: 2025-01-21

# Issue #133: fix deploy error

## 基本情報

- **Issue番号**: #133
- **タイトル**: fix deploy error
- **状態**: OPEN
- **作成者**: KidoVeho
- **作成日**: 2025/9/20
- **更新日**: 2025/9/20
- **ラベル**: なし
- **アサイニー**: なし
- **マイルストーン**: なし

## 説明

TypeScriptのコンパイルエラーによるデプロイエラーが発生しています：

```
[1/4] Resolving packages...
success Already up-to-date.
Done in 0.46s.
yarn run v1.22.22
$ tsc
tests/unit/domain/githubAction/githubActionService.test.ts(59,28): error TS2339: Property 'hasAILogUrl' does not exist on type 'Mocked<typeof PRCheck>'.
tests/unit/domain/githubAction/githubActionService.test.ts(88,28): error TS2339: Property 'hasAILogUrl' does not exist on type 'Mocked<typeof PRCheck>'.
error Command failed with exit code 2.
info Visit https://yarnpkg.com/en/docs/cli/run for documentation about this command.
Error: Process completed with exit code 2.
```

## 問題の詳細

- `githubActionService.test.ts`の59行目と88行目で`hasAILogUrl`プロパティが存在しないエラー
- `PRCheck`のモック型に`hasAILogUrl`プロパティが定義されていない
- TypeScriptコンパイルが失敗し、デプロイが中断される

## 作業ブランチ

```
133-fix-deploy-error
```

## 関連ファイル

- 仕様書: [spec.md](./spec.md)
- 実装計画: [plan.md](./plan.md)
- プルリクエスト: [pr.md](./pr.md)

## 影響範囲

- バックエンドのテストファイル
- デプロイプロセス
- CI/CDパイプライン

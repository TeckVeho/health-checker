# Cursor Custom Commands

このディレクトリには、Health Checkerプロジェクト用のカスタムCursorコマンドが含まれています。

## 利用可能なコマンド

### `/issue "概要"`

指定された概要に基づいて、GitHub issueのタイトル、本文、ストーリーポイント（SP）の案を自動生成します。

### `/issue regist "概要"`

指定された概要に基づいて、GitHub issueの案を生成し、自動的にGitHubに登録します。

### `/issue get "issue番号またはURL"`

指定されたGitHub issueの詳細情報を取得します。issue番号（例：123）または完全なURL（例：https://github.com/owner/repo/issues/123）を指定できます。

#### 使用方法

1. **Cursor内での使用**:
   - Cursorのコマンドパレット（Ctrl+Shift+P）を開く
   - `/issue "概要"`、`/issue regist "概要"`、または `/issue get "issue番号またはURL"` と入力
   - 概要やissue番号を引用符で囲んで入力

2. **コマンドラインでの使用**:
   ```bash
   # Issue案の生成のみ
   node .cursor/issue-generator.js "Add user authentication to the login flow"
   
   # Issue案の生成とGitHub登録
   node .cursor/issue-regist.js "Add user authentication to the login flow"
   
   # Issue情報の取得
   gh issue view 123
   gh issue view https://github.com/owner/repo/issues/123
   
   # Windows PowerShell
   .\issue-regist.ps1 "Add user authentication to the login flow"
   ```

#### `/issue get`で取得される内容

- **タイトル**: issueのタイトル
- **ステータス**: open/closed
- **ラベル**: 付与されているラベル一覧
- **アサイン状況**: 担当者情報
- **作成日・更新日**: 日時情報
- **本文**: issueの詳細説明
- **コメント**: コメント履歴
- **リンク**: GitHub上のissue URL

#### `/issue`と`/issue regist`で生成される内容

- **タイトル**: Conventional Commits形式に従ったタイトル
- **本文**: 以下のセクションを含む構造化された本文
  - Problem（問題の説明）
  - Proposed Solution（提案された解決策）
  - Acceptance Criteria（受け入れ基準）
  - Technical Considerations（技術的考慮事項）
  - Testing Requirements（テスト要件）
- **ストーリーポイント**: 1-13の範囲で推定値と理由
- **ラベル**: 適切なGitHubラベルの提案

#### 例

**入力**: `"Add user authentication to the login flow"`

**出力**:
```
Title: feat: Add user authentication to the login flow

Body:
## Problem
Add user authentication to the login flow
This issue addresses the need to improve the Health Checker system's functionality and user experience.

## Proposed Solution
Based on the requirements, we should:
- Analyze the current implementation
- Design the optimal solution approach
- Implement the changes following project conventions
- Ensure proper testing and documentation

## Acceptance Criteria
- [ ] Implementation follows project coding standards
- [ ] All existing tests pass
- [ ] New functionality is properly tested
- [ ] Documentation is updated if necessary
- [ ] Code review is completed
- [ ] No breaking changes introduced

## Technical Considerations
Tech Stack: Node.js, TypeScript, Nuxt.js, PostgreSQL, Jest

Key Areas to Consider:
- Database schema changes (if applicable)
- API endpoint modifications
- Frontend component updates
- Error handling and validation
- Performance implications
- Security considerations

## Testing Requirements
- [ ] Unit tests for new functionality
- [ ] Integration tests for API endpoints
- [ ] Frontend component tests
- [ ] End-to-end testing scenarios
- [ ] Manual testing checklist
- [ ] Performance testing (if applicable)

Story Points: 8 - Complex implementation with architectural considerations
Suggested Labels: enhancement
```

## ファイル構成

- `commands.json`: Cursor用のコマンド定義ファイル
- `issue-generator.js`: issue生成のメインロジック
- `issue-regist.js`: issue生成とGitHub登録のスクリプト
- `issue-regist.ps1`: Windows PowerShell用のissue登録スクリプト
- `issue-create.sh`: Linux/macOS用のシェルスクリプト（レガシー）
- `issue-create.ps1`: Windows PowerShell用のスクリプト（レガシー）
- `README.md`: このファイル

## カスタマイズ

`issue-generator.js`を編集することで、以下のカスタマイズが可能です：

- プロジェクト固有のテンプレート
- ストーリーポイントの推定ロジック
- ラベルの提案ルール
- 技術スタックの情報
- 受け入れ基準のテンプレート

## 要件

- Node.js（スクリプト実行用）
- Cursor IDE（コマンド使用用）

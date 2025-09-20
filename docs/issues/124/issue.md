# Issue #124: Optimize command performance by reusing cached issue data instead of repeated GitHub API calls

## 📋 Issue情報

- **Issue番号**: #124
- **タイトル**: Optimize command performance by reusing cached issue data instead of repeated GitHub API calls
- **状態**: OPEN
- **作成日時**: 2025-09-20T04:27:50Z
- **更新日時**: 2025-09-20T04:27:50Z
- **URL**: https://github.com/TeckVeho/health-checker/issues/124
- **担当者**: 未割り当て
- **ラベル**: なし

## 📝 Issue詳細

### 問題の概要

現在の各コマンド（`/spec`, `/plan`, `/dev`, `/test`, `/pr`）では、`gh issue view {issue_number}`を毎回実行してGitHub APIからissue情報を取得しています。しかし、`/issue`コマンドで既にissue情報を取得し、`docs/issues/{issue_number}/issue.md`に保存済みです。

### 現在の非効率な動作

#### 重複するGitHub API呼び出し
```bash
# /issue コマンド
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url

# /spec コマンド  
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url

# /plan コマンド
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url

# /dev コマンド
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url

# /test コマンド
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url

# /pr コマンド
gh issue view 122 --json title,body,labels,assignees,state,createdAt,updatedAt,url
```

#### パフォーマンスへの影響
- **API呼び出し回数**: 6回（本来は1回で十分）
- **レスポンス時間**: 各コマンドで1-2秒の遅延
- **レート制限**: 不要なAPI使用量
- **ネットワーク依存**: オフライン時の動作不安定

### 提案する解決策

#### 1. キャッシュされたIssueデータの活用
`/issue`コマンドで作成された`docs/issues/{issue_number}/issue.md`ファイルから情報を抽出

#### 2. フォールバック機能
- 第一選択: ローカルファイルから情報取得
- フォールバック: ファイルが存在しない場合のみGitHub API呼び出し

#### 3. 実装方針
```typescript
// 疑似コード
function getIssueData(issueNumber: number): IssueData {
  const localFile = `docs/issues/${issueNumber}/issue.md`;
  
  if (fileExists(localFile)) {
    return parseIssueFromMarkdown(localFile);
  } else {
    // フォールバック: GitHub API呼び出し
    return fetchFromGitHubAPI(issueNumber);
  }
}
```

### 期待される効果

#### パフォーマンス向上
- **API呼び出し削減**: 6回 → 1回（83%削減）
- **実行速度向上**: 各コマンドで1-2秒短縮
- **オフライン対応**: ネットワーク不要での動作

#### 開発体験向上
- **高速なコマンド実行**: レスポンシブな開発フロー
- **安定性向上**: ネットワーク状況に依存しない動作
- **API制限回避**: レート制限への配慮

#### システム効率性
- **リソース使用量削減**: 不要なネットワーク通信削減
- **キャッシュ活用**: 既存データの有効活用
- **一貫性保証**: 同一issue情報の使用

### 実装対象コマンド

1. **`/spec`コマンド** - 仕様書生成時のissue情報取得
2. **`/plan`コマンド** - 実装計画作成時のissue情報取得  
3. **`/dev`コマンド** - 開発実行時のissue情報取得
4. **`/test`コマンド** - テスト実行時のissue情報取得
5. **`/pr`コマンド** - PR作成時のissue情報取得

### 技術的詳細

#### 現在の実装
```bash
gh issue view {issue_number} --json title,body,labels,assignees,state,createdAt,updatedAt,url
```

#### 提案する実装
```typescript
// 1. ローカルファイル確認
const issueFile = `docs/issues/${issueNumber}/issue.md`;

// 2. ファイル存在確認
if (fs.existsSync(issueFile)) {
  // 3. Markdownファイルから情報抽出
  const issueData = parseIssueMarkdown(issueFile);
  return issueData;
} else {
  // 4. フォールバック: GitHub API
  const result = await execSync(`gh issue view ${issueNumber} --json title,body,labels,assignees,state,createdAt,updatedAt,url`);
  return JSON.parse(result);
}
```

#### ファイル構造の活用
```
docs/issues/{issue_number}/
├── issue.md          # ← このファイルから情報を抽出
├── spec.md
├── plan.md
├── pr.md
└── evidence/
```

### 受け入れ基準

#### 機能要件
- [ ] 各コマンドでローカルissue.mdファイルから情報を取得
- [ ] ファイルが存在しない場合のフォールバック機能
- [ ] 既存の動作との互換性維持

#### 非機能要件
- [ ] コマンド実行時間の短縮（1-2秒改善）
- [ ] GitHub API呼び出し回数の削減（83%削減）
- [ ] オフライン環境での動作保証

#### テスト要件
- [ ] ローカルファイル存在時の正常動作
- [ ] ローカルファイル不存在時のフォールバック動作
- [ ] 既存コマンドとの互換性テスト

### 優先度

**HIGH** - 開発効率とシステムパフォーマンスに直接影響

### 関連Issue

- 各コマンドのパフォーマンス改善
- GitHub API使用量最適化
- オフライン開発環境対応

## 🎯 実装ステータス

### 実装チェックリスト

- [ ] **要件分析完了**
  - [ ] 現在のコマンド動作の詳細調査
  - [ ] パフォーマンス測定とボトルネック特定
  - [ ] キャッシュ戦略の設計

- [ ] **設計完了**
  - [ ] issue.mdファイルパーサーの設計
  - [ ] フォールバック機能の設計
  - [ ] 各コマンドの修正方針決定

- [ ] **実装完了**
  - [ ] issue.mdパーサー実装
  - [ ] `/spec`コマンドの最適化
  - [ ] `/plan`コマンドの最適化
  - [ ] `/dev`コマンドの最適化
  - [ ] `/test`コマンドの最適化
  - [ ] `/pr`コマンドの最適化

- [ ] **テスト完了**
  - [ ] 単体テスト実装
  - [ ] 統合テスト実装
  - [ ] パフォーマンステスト実行
  - [ ] 既存機能の回帰テスト

- [ ] **ドキュメント更新**
  - [ ] コマンド仕様書更新
  - [ ] 開発者ガイド更新
  - [ ] パフォーマンス改善結果の文書化

### 進捗状況

- **全体進捗**: 0% (0/5 コマンド完了)
- **現在のフェーズ**: 要件分析
- **次のアクション**: 現在のコマンド実装の詳細調査

### 完了条件

1. **機能的完了**
   - 全5コマンドでローカルキャッシュ活用
   - フォールバック機能の正常動作
   - 既存機能との完全互換性

2. **非機能的完了**
   - コマンド実行時間1-2秒短縮達成
   - GitHub API呼び出し83%削減達成
   - オフライン環境での動作確認

3. **品質保証完了**
   - 全テストケースの合格
   - コードレビュー完了
   - ドキュメント更新完了

---

**作成日**: 2025-09-20  
**最終更新**: 2025-09-20  
**ステータス**: 🔄 進行中

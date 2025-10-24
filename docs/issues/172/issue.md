# Issue #172: Add PR Check feature

## Basic Information
- **Issue Number**: 172
- **Title**: Add PR Check feature
- **State**: OPEN
- **Created**: 2025-10-24T01:44:35Z
- **Updated**: 2025-10-24T01:44:35Z
- **Labels**: None
- **Assignees**: None

## Description

### Purpose (Goal)
Pull Requestのbodyチェック機能を追加して、変更内容の明確性とEvidence（証拠）の存在を検証します。

### Specification (Spec)

#### 1. 新しいアラートタイプ

**1.1 pr_unclear_changes - 変更内容が不明確**
- 重要度: Middle
- 説明: PRで何を変更したかが明確に記載されていない
- 検出条件: 変更内容の説明が曖昧、具体的な実装詳細が不足

**1.2 pr_missing_evidence - 証拠が不足**
- 重要度: Middle
- 説明: スクリーンショット、テストログ、動作確認結果などの証拠が含まれていない
- 検出条件: 変更を証明する材料が不足

## Implementation Notes
このissueでは、Pull Requestのbodyをチェックして以下の2つのアラートタイプを検出する機能を実装する必要があります：

1. **pr_unclear_changes**: PRの説明が不明確な場合に発火
2. **pr_missing_evidence**: PRに証拠（スクリーンショット、テストログ等）が不足している場合に発火

両方とも重要度はMiddleと設定されています。

## Related Files
- `backend/src/domain/alert/` - アラート関連のドメインロジック
- `backend/src/domain/githubAction/` - GitHubアクション関連の処理
- `backend/tests/` - テストファイル

## Branch
- **Current Branch**: 172-feat-pr-check-feature

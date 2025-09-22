# Issue #168: Alerts の表示方法変更 - Active/Resolved タブ切り替えとページング処理

## Overview
Alertsページの表示方法を改善し、Active AlertsとResolved Alertsをタブで切り替えられるようにし、Resolved Alertsにページング処理を追加する機能を実装する。これにより、ユーザーは大量のResolved Alertsを効率的に閲覧でき、Active Alertsに集中できるようになる。

## Purpose
- **ユーザビリティの向上**: Active AlertsとResolved Alertsを明確に分離し、ユーザーが重要な情報に集中できるようにする
- **パフォーマンスの最適化**: Resolved Alertsにページング機能を追加することで、大量のデータを効率的に表示する
- **一貫性の確保**: 既存のタブコンポーネントを再利用することで、アプリケーション全体のUI一貫性を保つ
- **スケーラビリティの向上**: 将来的にAlertsが増加しても、適切な表示とナビゲーションを提供する

## Functional Requirements

### 1. タブ切り替え機能
- **Active Alertsタブ**: 現在のActive Alertsを表示
- **Resolved Alertsタブ**: 解決済みのAlertsを表示
- **タブ状態の永続化**: ページリロード後も選択されたタブを維持
- **タブ切り替え時の状態保持**: 各タブのソート状態やフィルター状態を個別に管理

### 2. ページング機能
- **Resolved Alerts専用**: Active Alertsにはページングを適用しない（通常は少数のため）
- **ページサイズ**: デフォルト50件で固定
- **ページネーション情報**: 現在のページ、総ページ数、総件数の表示
- **ナビゲーション**: 前へ/次へボタン、ページ番号直接選択
- **URL同期**: ページ状態をURLクエリパラメータで管理

### 3. 既存機能の保持
- **ReCheck機能**: 既存のReCheckボタンとステータス表示を維持
- **ソート機能**: 各タブ内でのソート機能を保持
- **フィルター機能**: 既存のフィルター機能を各タブで利用可能
- **レスポンシブデザイン**: モバイル・タブレット対応を維持

## Specification

### Features

#### タブコンポーネント統合
- **コンポーネント**: 既存のTabs/TabList/TabPanelコンポーネントを再利用
- **状態管理**: `useTabState` composableを拡張してAlerts専用の状態管理を追加
- **デザイン**: 一覧ページ（index.vue）と同じタブデザインを適用

#### ページング実装
- **コンポーネント**: PrimeVueのPaginatorコンポーネントを使用
- **状態管理**: `useAlerts` composableにページング機能を追加
- **API対応**: バックエンドAPIのページングパラメータに対応

#### データ管理
- **Active Alerts**: 既存の`visibleAlerts`をそのまま使用
- **Resolved Alerts**: 既存の`resolvedAlerts`にページング機能を追加
- **状態分離**: 各タブのデータと状態を独立して管理

### System Requirements

#### Required External Tools
- **PrimeVue**: Tabs, TabList, TabPanel, Paginatorコンポーネント
- **Vue 3**: Composition API、ref、computed、watch
- **Nuxt.js**: SSR対応、ルーティング、状態管理
- **TypeScript**: 型安全性の確保

#### Operating Environment
- **フロントエンド**: Nuxt.js 3.x
- **ブラウザ**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **レスポンシブ**: モバイル（320px+）、タブレット（768px+）、デスクトップ（1024px+）

#### Quality Requirements
- **パフォーマンス**: ページング切り替えは200ms以内
- **アクセシビリティ**: WCAG 2.1 AA準拠
- **ブラウザ互換性**: 主要ブラウザでの動作保証
- **レスポンシブ**: 全デバイスサイズでの適切な表示

## Success Criteria

### Functional Criteria
- [ ] Active AlertsとResolved Alertsがタブで切り替え可能
- [ ] 一覧ページと同じタブコンポーネントを使用
- [ ] Resolved Alertsにページング機能が実装されている
- [ ] タブ状態がページリロード後も保持される
- [ ] 各タブのソート・フィルター状態が独立して管理される
- [ ] URLクエリパラメータでページ状態が管理される
- [ ] 既存のReCheck機能が正常に動作する

### Non-Functional Criteria
- [ ] モバイル・タブレット・デスクトップで適切に表示される
- [ ] 既存の機能に影響がない
- [ ] アクセシビリティガイドラインに準拠
- [ ] コードの可読性と保守性が確保されている
- [ ] 適切なエラーハンドリングが実装されている

## References

### 関連ファイル
- **フロントエンド**:
  - `frontend/src/pages/[...slug].vue` - 現在のAlertsページ
  - `frontend/src/pages/index.vue` - タブコンポーネントの使用例
  - `frontend/src/components/Molecules/AlertTable.vue` - Alerts表示テーブル
  - `frontend/src/components/Molecules/AuthorGroupedTable.vue` - ページング実装例
  - `frontend/src/composables/useTabState.ts` - タブ状態管理
  - `frontend/src/composables/useAlerts.ts` - Alertsデータ管理

### 技術仕様
- **タブコンポーネント**: PrimeVue Tabs/TabList/TabPanel
- **ページング**: PrimeVue Paginator
- **状態管理**: Vue 3 Composition API
- **ルーティング**: Nuxt.js Router
- **型定義**: TypeScript interfaces

### 設計パターン
- **Composable Pattern**: 状態管理とロジックの分離
- **Component Composition**: 既存コンポーネントの再利用
- **State Persistence**: localStorage + URL同期
- **Responsive Design**: モバイルファーストアプローチ

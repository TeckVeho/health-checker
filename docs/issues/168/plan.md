# Issue #168: Alerts の表示方法変更 - Active/Resolved タブ切り替えとページング処理 - Implementation Plan

## Functional Requirements Mapping

### 1. タブ切り替え機能
- **要件**: Active AlertsとResolved Alertsをタブで切り替え
- **実装**: 既存のTabs/TabList/TabPanelコンポーネントを再利用
- **状態管理**: `useTabState` composableを拡張してAlerts専用の状態管理を追加
- **永続化**: localStorage + URLクエリパラメータでタブ状態を保持

### 2. ページング機能
- **要件**: Resolved Alertsにページング処理を追加
- **実装**: PrimeVueのPaginatorコンポーネントを使用
- **API対応**: 既存のバックエンドAPIはページング対応済み（`/api/alerts/by-author`）
- **ページサイズ**: デフォルト50件で固定

### 3. 既存機能の保持
- **ReCheck機能**: 既存のReCheckボタンとステータス表示を維持
- **ソート機能**: 各タブ内でのソート機能を保持
- **フィルター機能**: 既存のフィルター機能を各タブで利用可能
- **レスポンシブデザイン**: モバイル・タブレット対応を維持

## Directory Structure and File List

### 新規作成ファイル
```
frontend/src/
├── composables/
│   └── useAlertsTabs.ts          # Alerts専用タブ状態管理
├── components/
│   └── Molecules/
│       └── AlertsTabContent.vue  # タブコンテンツコンポーネント
└── types/
    └── alerts.ts                 # 型定義の拡張（既存ファイルを更新）
```

### 更新ファイル
```
frontend/src/
├── pages/
│   └── [...slug].vue             # Alertsページのメイン実装
├── composables/
│   ├── useAlerts.ts              # ページング機能の追加
│   └── useTabState.ts            # Alerts専用タブ状態の追加
└── components/
    └── Molecules/
        └── AlertTable.vue        # ページング対応の更新
```

### バックエンド（変更なし）
```
backend/src/domain/alert/
├── alertController.ts            # 既存のページング対応APIを活用
├── alertService.ts               # 既存のページング実装を活用
└── alertRouter.ts                # 既存のルート定義を活用
```

## Architecture Design

### コンポーネント階層
```
[...slug].vue (Alerts Page)
├── Tabs (PrimeVue)
│   ├── TabList
│   │   ├── Tab (Active Alerts)
│   │   └── Tab (Resolved Alerts)
│   └── TabPanels
│       ├── TabPanel (Active Alerts)
│       │   └── AlertTable (既存)
│       └── TabPanel (Resolved Alerts)
│           ├── AlertTable (ページング対応)
│           └── Paginator (PrimeVue)
```

### 状態管理設計
```
useAlertsTabs (新規)
├── activeTab: 'active' | 'resolved'
├── tabState: { active: {...}, resolved: {...} }
└── methods: setActiveTab, getTabState, setTabState

useAlerts (拡張)
├── 既存の状態管理
├── pagination: { currentPage, totalPages, totalItems }
└── methods: fetchResolvedAlerts, goToPage, setPageSize
```

### データフロー
1. **初期化**: ページロード時にタブ状態を復元
2. **タブ切り替え**: タブ変更時に該当するデータを取得
3. **ページング**: Resolved Alertsタブでページ変更時にAPI呼び出し
4. **状態同期**: URLクエリパラメータとlocalStorageで状態を同期

## Data Model

### タブ状態管理
```typescript
interface AlertsTabState {
  activeTab: 'active' | 'resolved';
  tabStates: {
    active: {
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: Record<string, any>;
    };
    resolved: {
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
      filters?: Record<string, any>;
      currentPage: number;
      pageSize: number;
    };
  };
}
```

### ページング情報
```typescript
interface PaginationInfo {
  current: number;
  total: number;
  items: number;
  from: number;
  to: number;
  pageSize: number;
}
```

### API レスポンス（既存）
```typescript
interface AlertsResponse {
  data: Alert[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## Implementation Tasks

### Task 1: タブ状態管理の実装
**目的**: Alerts専用のタブ状態管理composableを作成

**実装内容**:
- `useAlertsTabs.ts` composableの作成
- タブ状態の永続化（localStorage + URL同期）
- 各タブの独立した状態管理
- タブ切り替え時の状態保持

**ファイル**:
- `frontend/src/composables/useAlertsTabs.ts` (新規)

**依存関係**: なし

### Task 2: useAlerts composableの拡張
**目的**: ページング機能をuseAlertsに追加

**実装内容**:
- Resolved Alerts用のページング状態管理
- ページング対応のAPI呼び出し
- ページング情報の計算
- ページ変更時のデータ取得

**ファイル**:
- `frontend/src/composables/useAlerts.ts` (更新)

**依存関係**: Task 1

### Task 3: AlertsTabContentコンポーネントの作成
**目的**: タブコンテンツを管理するコンポーネントを作成

**実装内容**:
- Active AlertsとResolved Alertsの表示切り替え
- Resolved Alerts用のページングUI
- 各タブの独立した状態管理
- レスポンシブデザインの対応

**ファイル**:
- `frontend/src/components/Molecules/AlertsTabContent.vue` (新規)

**依存関係**: Task 1, Task 2

### Task 4: AlertTableコンポーネントの更新
**目的**: ページング対応のAlertTableを実装

**実装内容**:
- ページングプロパティの追加
- Paginatorコンポーネントの統合
- ページング情報の表示
- 既存機能の保持

**ファイル**:
- `frontend/src/components/Molecules/AlertTable.vue` (更新)

**依存関係**: Task 2

### Task 5: メインページの更新
**目的**: [...slug].vueページにタブ機能を統合

**実装内容**:
- Tabs/TabList/TabPanelコンポーネントの統合
- AlertsTabContentコンポーネントの使用
- 既存のReCheck機能の保持
- レスポンシブデザインの対応

**ファイル**:
- `frontend/src/pages/[...slug].vue` (更新)

**依存関係**: Task 3, Task 4

### Task 6: 型定義の更新
**目的**: 新しい機能に対応する型定義を追加

**実装内容**:
- AlertsTabState型の定義
- PaginationInfo型の定義
- 既存のAlert型の拡張
- コンポーネントプロパティの型定義

**ファイル**:
- `frontend/src/types/alerts.ts` (更新)

**依存関係**: Task 1, Task 2

### Task 7: テストの実装
**目的**: 新機能のテストケースを作成

**実装内容**:
- useAlertsTabs composableのテスト
- AlertsTabContentコンポーネントのテスト
- ページング機能のテスト
- 既存機能の回帰テスト

**ファイル**:
- `frontend/tests/unit/composables/useAlertsTabs.spec.ts` (新規)
- `frontend/tests/unit/components/AlertsTabContent.spec.ts` (新規)
- 既存テストファイルの更新

**依存関係**: Task 1-6

### Task 8: 統合テストとデバッグ
**目的**: 全体の統合テストとデバッグ

**実装内容**:
- タブ切り替えの動作確認
- ページング機能の動作確認
- 既存機能への影響確認
- レスポンシブデザインの確認
- パフォーマンステスト

**ファイル**: 全ファイル

**依存関係**: Task 1-7

## Implementation Order

1. **Task 1**: タブ状態管理の実装
2. **Task 2**: useAlerts composableの拡張
3. **Task 6**: 型定義の更新
4. **Task 4**: AlertTableコンポーネントの更新
5. **Task 3**: AlertsTabContentコンポーネントの作成
6. **Task 5**: メインページの更新
7. **Task 7**: テストの実装
8. **Task 8**: 統合テストとデバッグ

## Risk Assessment

### 高リスク
- **既存機能への影響**: ReCheck機能やソート機能への影響を最小限に抑える必要がある
- **パフォーマンス**: 大量のResolved Alertsでのページング性能

### 中リスク
- **状態管理の複雑化**: タブ状態とページング状態の適切な管理
- **レスポンシブデザイン**: モバイルでのタブとページングの表示

### 低リスク
- **既存コンポーネントの再利用**: 既存のTabsコンポーネントの活用
- **API対応**: 既存のページング対応APIの活用

## Success Metrics

### 機能要件
- [ ] Active AlertsとResolved Alertsがタブで切り替え可能
- [ ] 一覧ページと同じタブコンポーネントを使用
- [ ] Resolved Alertsにページング機能が実装されている
- [ ] タブ状態がページリロード後も保持される
- [ ] 各タブのソート・フィルター状態が独立して管理される
- [ ] URLクエリパラメータでページ状態が管理される
- [ ] 既存のReCheck機能が正常に動作する

### 非機能要件
- [ ] モバイル・タブレット・デスクトップで適切に表示される
- [ ] 既存の機能に影響がない
- [ ] アクセシビリティガイドラインに準拠
- [ ] コードの可読性と保守性が確保されている
- [ ] 適切なエラーハンドリングが実装されている

## Dependencies

### 外部依存
- **PrimeVue**: Tabs, TabList, TabPanel, Paginatorコンポーネント
- **Vue 3**: Composition API, ref, computed, watch
- **Nuxt.js**: SSR対応, ルーティング, 状態管理

### 内部依存
- **既存のuseAlerts composable**: データ取得と状態管理
- **既存のuseTabState composable**: タブ状態管理の基盤
- **既存のAlertTableコンポーネント**: テーブル表示の基盤
- **既存のバックエンドAPI**: ページング対応済みのAPI

## Timeline Estimation

- **Task 1-2**: 2-3時間（状態管理の実装）
- **Task 3-4**: 3-4時間（コンポーネントの実装）
- **Task 5**: 2-3時間（メインページの統合）
- **Task 6**: 1時間（型定義の更新）
- **Task 7**: 2-3時間（テストの実装）
- **Task 8**: 2-3時間（統合テストとデバッグ）

**総見積もり時間**: 12-17時間

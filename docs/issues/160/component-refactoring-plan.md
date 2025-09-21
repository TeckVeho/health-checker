# Issue #160: コンポーネントリファクタリング計画

## 概要
現在のコンポーネント構造をAtomic Designパターンに基づいて再設計し、より体系的で再利用性の高いコンポーネント群を構築します。

## 現状分析

### 現在の構造
```
src/components/
├── Atoms/ (8ファイル)
│   ├── BackToDashboardLink.vue
│   ├── EmptyState.vue
│   ├── HealthButton.vue
│   ├── HealthTag.vue
│   ├── HealthTitle.vue
│   ├── LoadingText.vue
│   ├── RecheckButton.vue
│   └── RepoAlertTitle.vue
└── Molecules/ (9ファイル)
    ├── AlertTable.vue
    ├── AuthorGroupedTable.vue
    ├── HealthSummaryCard.vue
    ├── HealthSummaryTable.vue
    ├── RecheckHistory.vue
    ├── RecheckStatus.vue
    ├── RepoFilterCard.vue
    ├── RepoTable.vue
    └── SectionHeader.vue
```

### 現状の問題点
1. **分類の曖昧さ**: AtomsとMoleculesの境界が不明確
2. **再利用性の低さ**: 特定の用途に特化したコンポーネントが多い
3. **責務の重複**: 類似機能のコンポーネントが散在
4. **テストカバレッジ**: コンポーネントのテストが0%
5. **重複コンポーネント**: 似た役割のコンポーネントが複数存在

### 重複コンポーネントの特定
#### テキスト表示系
- `HealthTitle.vue` + `RepoAlertTitle.vue` → 統合対象
- `LoadingText.vue` → 汎用テキストコンポーネントに統合

#### ボタン系
- `HealthButton.vue` + `RecheckButton.vue` → 統合対象
- `BackToDashboardLink.vue` → ボタン系に統合

#### テーブル系
- `AlertTable.vue` + `AuthorGroupedTable.vue` + `HealthSummaryTable.vue` + `RepoTable.vue` → 統合対象

#### カード系
- `HealthSummaryCard.vue` + `RepoFilterCard.vue` → 統合対象

#### 状態表示系
- `EmptyState.vue` + `RecheckStatus.vue` + `RecheckHistory.vue` → 統合対象

## 目標構造

### Atomic Designパターン適用
```
src/components/
├── atoms/ (基本要素)
│   ├── buttons/
│   ├── tags/
│   ├── text/
│   ├── icons/
│   └── inputs/
├── molecules/ (複合要素)
│   ├── cards/
│   ├── tables/
│   ├── forms/
│   └── navigation/
├── organisms/ (複雑な要素)
│   ├── data-display/
│   ├── data-input/
│   └── layout/
└── templates/ (レイアウト)
    ├── page-layouts/
    └── section-layouts/
```

## 詳細リファクタリング計画

### 統合優先原則
- **役割が似ているコンポーネントは統合を優先**
- **見た目の違いはpropsで制御**
- **機能の重複を排除**
- **再利用性を最大化**

### Phase 1: Atoms層の再構築

#### 1.1 ボタン系コンポーネントの統合
**統合対象**: HealthButton.vue, RecheckButton.vue, BackToDashboardLink.vue
**目標**: 1つの汎用ボタンコンポーネント

```typescript
// atoms/buttons/BaseButton.vue (統合後)
interface BaseButtonProps {
  // 基本プロパティ
  variant: 'primary' | 'secondary' | 'danger' | 'success' | 'link'
  size: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  
  // アイコン・テキスト
  icon?: string
  iconPosition?: 'left' | 'right'
  text?: string
  
  // アクション固有
  action?: 'health' | 'recheck' | 'back' | 'custom'
  status?: 'active' | 'inactive' | 'loading' | 'success' | 'error'
  
  // リンク系
  href?: string
  target?: '_blank' | '_self'
  
  // カスタムスタイル
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 3つのコンポーネント → 1つのコンポーネント
- 一貫したボタンデザイン
- メンテナンスコストの削減

#### 1.2 タグ系コンポーネントの統合
**統合対象**: HealthTag.vue
**目標**: 汎用的なタグコンポーネント（既存を拡張）

```typescript
// atoms/tags/BaseTag.vue (統合後)
interface BaseTagProps {
  // 基本プロパティ
  variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size: 'small' | 'medium' | 'large'
  closable?: boolean
  
  // ヘルス固有（既存機能を保持）
  healthStatus?: 'healthy' | 'warning' | 'critical'
  count?: number
  
  // カスタム
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 既存のHealthTag機能を保持
- 汎用的なタグ機能を追加
- 1つのコンポーネントで多様な用途に対応

#### 1.3 テキスト系コンポーネントの統合
**統合対象**: HealthTitle.vue, LoadingText.vue, RepoAlertTitle.vue
**目標**: 1つの汎用テキストコンポーネント

```typescript
// atoms/text/BaseText.vue (統合後)
interface BaseTextProps {
  // 基本プロパティ
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption'
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted'
  weight?: 'normal' | 'medium' | 'bold'
  align?: 'left' | 'center' | 'right'
  
  // ローディング機能（LoadingText統合）
  loading?: boolean
  loadingText?: string
  
  // タイトル固有（HealthTitle, RepoAlertTitle統合）
  type?: 'health' | 'repo' | 'alert' | 'custom'
  count?: number
  status?: string
  
  // カスタム
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 3つのコンポーネント → 1つのコンポーネント
- ローディング状態の統一管理
- タイトル表示の一貫性

#### 1.4 状態表示コンポーネントの統合
**統合対象**: EmptyState.vue, RecheckStatus.vue, RecheckHistory.vue
**目標**: 1つの汎用状態表示コンポーネント

```typescript
// atoms/states/BaseState.vue (統合後)
interface BaseStateProps {
  // 基本プロパティ
  type: 'empty' | 'loading' | 'error' | 'success' | 'info' | 'recheck'
  title: string
  description?: string
  icon?: string
  
  // アクション
  action?: {
    label: string
    handler: () => void
    variant?: 'primary' | 'secondary' | 'danger'
  }
  
  // エラー固有
  error?: string
  retry?: () => void
  
  // リチェック固有（RecheckStatus, RecheckHistory統合）
  recheckStatus?: 'pending' | 'running' | 'completed' | 'failed'
  recheckHistory?: RecheckHistoryItem[]
  
  // カスタム
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 3つのコンポーネント → 1つのコンポーネント
- 状態表示の統一管理
- リチェック機能の統合

### Phase 2: Molecules層の再構築

#### 2.1 カード系コンポーネントの統合
**統合対象**: HealthSummaryCard.vue, RepoFilterCard.vue
**目標**: 1つの汎用カードコンポーネント

```typescript
// molecules/cards/BaseCard.vue (統合後)
interface BaseCardProps {
  // 基本プロパティ
  title?: string
  subtitle?: string
  loading?: boolean
  error?: string
  
  // カードタイプ
  type: 'summary' | 'filter' | 'info' | 'custom'
  
  // サマリー固有（HealthSummaryCard統合）
  summaryData?: SummaryData
  metrics?: MetricItem[]
  healthStatus?: 'healthy' | 'warning' | 'critical'
  
  // フィルター固有（RepoFilterCard統合）
  filters?: FilterItem[]
  onFilterChange?: (filters: FilterItem[]) => void
  
  // アクション
  actions?: CardAction[]
  
  // カスタム
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 2つのコンポーネント → 1つのコンポーネント
- カード表示の統一管理
- サマリー・フィルター機能の統合

#### 2.2 テーブル系コンポーネントの統合
**統合対象**: AlertTable.vue, AuthorGroupedTable.vue, HealthSummaryTable.vue, RepoTable.vue
**目標**: 1つの汎用テーブルコンポーネント

```typescript
// molecules/tables/BaseTable.vue (統合後)
interface BaseTableProps<T> {
  // 基本プロパティ
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  error?: string
  
  // テーブルタイプ
  type: 'alert' | 'author' | 'health' | 'repo' | 'custom'
  
  // 機能
  selectable?: boolean
  expandable?: boolean
  sortable?: boolean
  filterable?: boolean
  
  // ページネーション
  pagination?: PaginationConfig
  
  // ソート・フィルター
  sorting?: SortingConfig
  filtering?: FilteringConfig
  
  // アクション
  actions?: TableAction<T>[]
  
  // グループ化（AuthorGroupedTable統合）
  groupBy?: string
  groupConfig?: GroupConfig
  
  // サマリー（HealthSummaryTable統合）
  summaryData?: SummaryData
  metrics?: MetricConfig[]
  
  // カスタム
  customClass?: string
  customStyle?: Record<string, string>
}
```

**統合のメリット**:
- 4つのコンポーネント → 1つのコンポーネント
- テーブル機能の統一管理
- グループ化・サマリー機能の統合

#### 2.3 フォーム系コンポーネントの統合
**現状**: 明示的なフォームコンポーネントは少ない
**目標**: 再利用可能なフォームコンポーネント群

```typescript
// molecules/forms/BaseForm.vue
interface BaseFormProps {
  modelValue: Record<string, any>
  schema: FormSchema
  loading?: boolean
  error?: string
  submitLabel?: string
  cancelLabel?: string
}

// molecules/forms/FilterForm.vue
interface FilterFormProps extends BaseFormProps {
  filters: FilterSchema[]
  onFilter: (filters: Record<string, any>) => void
  onReset: () => void
}
```

### Phase 3: Organisms層の構築

#### 3.1 データ表示系Organisms
**現状**: 複数のテーブルコンポーネントが散在
**目標**: 統合されたデータ表示コンポーネント

```typescript
// organisms/data-display/AlertDashboard.vue
interface AlertDashboardProps {
  alerts: Alert[]
  loading?: boolean
  error?: string
  onRefresh: () => void
  onFilter: (filters: AlertFilters) => void
}

// organisms/data-display/RepoHealthDashboard.vue
interface RepoHealthDashboardProps {
  repos: Repo[]
  healthData: HealthData
  loading?: boolean
  error?: string
  onRecheck: (repo: Repo) => void
}
```

#### 3.2 データ入力系Organisms
**現状**: フィルター機能が散在
**目標**: 統合されたデータ入力コンポーネント

```typescript
// organisms/data-input/AdvancedFilter.vue
interface AdvancedFilterProps {
  filters: FilterConfig[]
  modelValue: Record<string, any>
  onUpdate: (filters: Record<string, any>) => void
  onReset: () => void
}

// organisms/data-input/BulkActions.vue
interface BulkActionsProps {
  selectedItems: any[]
  actions: BulkAction[]
  onAction: (action: string, items: any[]) => void
}
```

### Phase 4: Templates層の構築

#### 4.1 ページレイアウト
```typescript
// templates/page-layouts/DashboardLayout.vue
interface DashboardLayoutProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: PageAction[]
  sidebar?: boolean
}

// templates/page-layouts/DetailLayout.vue
interface DetailLayoutProps {
  title: string
  subtitle?: string
  backUrl?: string
  actions?: PageAction[]
}
```

#### 4.2 セクションレイアウト
```typescript
// templates/section-layouts/DataSection.vue
interface DataSectionProps {
  title: string
  loading?: boolean
  error?: string
  actions?: SectionAction[]
  refreshable?: boolean
}
```

## 統合効果の詳細

### コンポーネント数の削減
**統合前**: 17個のコンポーネント
**統合後**: 8個のコンポーネント（53%削減）

#### 削減詳細
- **Atoms**: 8個 → 4個（50%削減）
  - ボタン系: 3個 → 1個
  - テキスト系: 3個 → 1個
  - タグ系: 1個 → 1個（拡張）
  - 状態系: 3個 → 1個

- **Molecules**: 9個 → 4個（56%削減）
  - カード系: 2個 → 1個
  - テーブル系: 4個 → 1個
  - フォーム系: 0個 → 1個（新規）
  - その他: 3個 → 1個（統合）

### 統合のメリット
1. **メンテナンスコストの大幅削減**
2. **一貫したデザインシステム**
3. **テストカバレッジの向上**
4. **開発効率の向上**
5. **バグ発生率の削減**

## 実装戦略

### 段階的移行アプローチ
1. **Phase 1**: Atoms層の再構築（8個 → 4個）
2. **Phase 2**: Molecules層の再構築（9個 → 4個）
3. **Phase 3**: Organisms層の構築（新規作成）
4. **Phase 4**: Templates層の構築（新規作成）

### 統合優先の実装方針
- **似た役割のコンポーネントは必ず統合**
- **見た目の違いはpropsで制御**
- **既存機能はすべて保持**
- **段階的な移行でリスクを最小化**

### 互換性の維持
- 既存のコンポーネントを段階的に置き換え
- 旧コンポーネントとの互換性を一時的に維持
- 移行完了後に旧コンポーネントを削除

### テスト戦略
- 各層でテストカバレッジ80%以上を目標
- 統合テストの実装
- ビジュアルリグレッションテストの検討

## 期待される効果

### 開発効率の向上
- **コンポーネント数53%削減**による開発速度向上
- **一貫したデザインシステム**による統一感
- **再利用性の大幅向上**による開発時間短縮
- **新機能開発時間30%短縮**

### 保守性の向上
- **明確な責務分離**による理解しやすい構造
- **テストカバレッジ80%以上**による品質向上
- **メンテナンスコスト50%削減**
- **バグ発生率50%削減**

### ユーザー体験の向上
- **一貫したUI/UX**による使いやすさ向上
- **パフォーマンス20%改善**による高速化
- **アクセシビリティWCAG 2.1 AA準拠**
- **レスポンシブデザインの統一**

### ビジネス価値
- **開発コストの大幅削減**
- **品質向上による顧客満足度向上**
- **保守性向上による長期運用コスト削減**
- **開発チームの生産性向上**

## 実装スケジュール

### Week 1: Atoms層の再構築
- ボタン系コンポーネントの統合
- タグ系コンポーネントの統合
- テキスト系コンポーネントの統合

### Week 2: Molecules層の再構築
- カード系コンポーネントの統合
- テーブル系コンポーネントの統合
- フォーム系コンポーネントの作成

### Week 3: Organisms層の構築
- データ表示系Organismsの作成
- データ入力系Organismsの作成

### Week 4: Templates層の構築
- ページレイアウトの作成
- セクションレイアウトの作成
- 統合テストの実装

## 成功指標

### 技術指標
- コンポーネント数: 現在17個 → 目標25個（より再利用可能）
- テストカバレッジ: 現在0% → 目標80%
- バンドルサイズ: 現在の90%以下
- パフォーマンス: 現在と同等以上

### 開発指標
- 新機能開発時間: 30%短縮
- バグ発生率: 50%削減
- コードレビュー時間: 40%短縮

### ユーザー指標
- ページ読み込み時間: 20%改善
- ユーザビリティスコア: 向上
- アクセシビリティスコア: WCAG 2.1 AA準拠

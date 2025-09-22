# Issue #164: 本番環境でリロード時にローカルAPIエンドポイントにアクセスしてしまう問題 - Implementation Plan

## Functional Requirements Mapping

### 現在の問題
- **初回アクセス時**: 正常に本番用APIにアクセス
- **リロード時**: ローカルテスト用API（`http://localhost:23000`）にアクセスしてしまう

### 期待される動作
- リロード時も初回アクセス時と同様に、本番用APIにアクセスする必要がある
- 環境変数`API_BASE_URL`が正しく設定されている場合、その値を使用する
- 環境変数が設定されていない場合のみ、デフォルト値（`http://localhost:23000`）を使用する

## Directory Structure and File List

```
frontend/
├── src/
│   ├── composables/
│   │   ├── useApiConfig.ts          # API設定の管理
│   │   ├── useSharedState.ts        # 共有状態管理（API初期化）
│   │   └── useApi.ts                # API呼び出しラッパー
│   ├── utils/
│   │   └── api.ts                   # APIクライアント実装
│   └── pages/
│       └── [...slug].vue            # repo詳細ページ
├── nuxt.config.ts                   # Nuxt設定（runtimeConfig）
└── ecosystem.config.cjs             # PM2設定
```

## Architecture Design

### 現在のアーキテクチャの問題点

1. **API設定の初期化タイミング**
   - `useSharedState.ts`でAPIサービスが初期化される
   - リロード時に`useApiConfig`の`apiBaseUrl`が正しく取得されない可能性

2. **環境変数の取得方法**
   - `nuxt.config.ts`で`process.env.API_BASE_URL`を使用
   - クライアントサイドでは`useRuntimeConfig()`を使用
   - リロード時に環境変数が正しく反映されない

3. **デフォルト値の設定**
   - 複数箇所で`http://localhost:23000`がハードコードされている
   - 環境変数が未設定の場合のフォールバック処理

### 修正後のアーキテクチャ

1. **統一されたAPI設定管理**
   - `useApiConfig`で一元管理
   - 環境変数の取得を確実にする

2. **適切な初期化タイミング**
   - アプリケーション起動時に確実にAPI設定を初期化
   - リロード時も同じ初期化処理を実行

3. **環境変数の確実な取得**
   - サーバーサイドとクライアントサイドで一貫した環境変数取得
   - 本番環境での環境変数設定の確認

## Data Model

### API設定の状態管理

```typescript
interface ApiConfig {
  apiBaseUrl: string;
  apiTimeout?: number;
}

interface RuntimeConfig {
  public: {
    apiBaseUrl: string;
    apiTimeout?: number;
  };
}
```

### 環境変数の優先順位

1. `process.env.API_BASE_URL` (サーバーサイド)
2. `process.env.NUXT_PUBLIC_API_BASE_URL` (クライアントサイド)
3. デフォルト値: `http://localhost:23000`

## Implementation Tasks

### Task 1: 環境変数の設定確認と修正

**目的**: 本番環境での環境変数設定を確認し、必要に応じて修正する

**詳細**:
- 本番環境の`API_BASE_URL`環境変数が正しく設定されているか確認
- `ecosystem.config.cjs`での環境変数設定を確認
- 必要に応じて環境変数の設定を修正

**関連ファイル**:
- `frontend/ecosystem.config.cjs`
- 本番環境の環境変数設定

**検証方法**:
- 本番環境で`process.env.API_BASE_URL`の値を確認
- ブラウザの開発者ツールでネットワークリクエストを確認

### Task 2: useApiConfigの修正

**目的**: 環境変数の取得を確実にし、デフォルト値の設定を改善する

**詳細**:
- `useApiConfig.ts`での環境変数取得ロジックを修正
- サーバーサイドとクライアントサイドでの一貫した動作を確保
- デバッグ用のログ出力を追加

**修正内容**:
```typescript
// 修正前
const apiBaseUrl = computed(() => {
  if (!config.public || config.public.apiBaseUrl === undefined) {
    return 'http://localhost:23000';
  }
  return config.public.apiBaseUrl || 'http://localhost:23000';
});

// 修正後
const apiBaseUrl = computed(() => {
  // デバッグ用ログ
  console.log('API Config Debug:', {
    config: config.public,
    apiBaseUrl: config.public?.apiBaseUrl,
    env: process.env.API_BASE_URL
  });
  
  // 環境変数を優先的に使用
  const envUrl = process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // ランタイム設定を使用
  if (config.public?.apiBaseUrl) {
    return config.public.apiBaseUrl;
  }
  
  // デフォルト値（開発環境のみ）
  return 'http://localhost:23000';
});
```

**関連ファイル**:
- `frontend/src/composables/useApiConfig.ts`

### Task 3: API初期化の改善

**目的**: リロード時も確実にAPI設定が初期化されるようにする

**詳細**:
- `useSharedState.ts`でのAPI初期化処理を改善
- 初期化タイミングの最適化
- エラーハンドリングの追加

**修正内容**:
```typescript
// 修正前
apiService.init(apiBaseUrl.value);

// 修正後
// 確実に初期化を実行
const initializeApi = () => {
  try {
    const url = apiBaseUrl.value;
    console.log('Initializing API with URL:', url);
    apiService.init(url);
  } catch (error) {
    console.error('Failed to initialize API:', error);
  }
};

// 即座に初期化
initializeApi();
```

**関連ファイル**:
- `frontend/src/composables/useSharedState.ts`

### Task 4: nuxt.config.tsの修正

**目的**: 環境変数の取得を確実にする

**詳細**:
- `nuxt.config.ts`での環境変数設定を改善
- 本番環境での環境変数取得を確実にする

**修正内容**:
```typescript
// 修正前
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.API_BASE_URL || "http://localhost:23000",
  },
},

// 修正後
runtimeConfig: {
  public: {
    apiBaseUrl: process.env.API_BASE_URL || process.env.NUXT_PUBLIC_API_BASE_URL || "http://localhost:23000",
  },
},
```

**関連ファイル**:
- `frontend/nuxt.config.ts`

### Task 5: テストの追加

**目的**: 修正内容の動作を確認するテストを追加

**詳細**:
- `useApiConfig`のテストケースを追加
- 環境変数の取得テスト
- リロード時の動作テスト

**テストケース**:
1. 環境変数が設定されている場合の動作
2. 環境変数が未設定の場合の動作
3. リロード時のAPI設定の確認

**関連ファイル**:
- `frontend/tests/unit/composables/useApiConfig.spec.ts`

### Task 6: 本番環境での検証

**目的**: 修正内容が本番環境で正しく動作することを確認

**詳細**:
- 本番環境でのデプロイ
- リロード時の動作確認
- ネットワークリクエストの確認

**検証項目**:
1. 初回アクセス時のAPIエンドポイント
2. リロード時のAPIエンドポイント
3. エラーログの確認

## 実装順序

1. **Task 1**: 環境変数の設定確認と修正
2. **Task 2**: useApiConfigの修正
3. **Task 3**: API初期化の改善
4. **Task 4**: nuxt.config.tsの修正
5. **Task 5**: テストの追加
6. **Task 6**: 本番環境での検証

## リスクと対策

### リスク
1. **環境変数の設定ミス**: 本番環境で環境変数が正しく設定されていない
2. **キャッシュの問題**: ブラウザキャッシュが原因で修正が反映されない
3. **タイミングの問題**: 初期化のタイミングが適切でない

### 対策
1. **環境変数の確認**: デプロイ前に環境変数の設定を確認
2. **キャッシュクリア**: 必要に応じてブラウザキャッシュをクリア
3. **ログ出力**: デバッグ用のログを追加して問題を特定

## 成功基準

1. **初回アクセス時**: 本番用APIエンドポイントにアクセス
2. **リロード時**: 本番用APIエンドポイントにアクセス
3. **エラーログ**: ローカルAPIへのアクセスエラーが発生しない
4. **テスト**: 全てのテストケースがパスする

# Issue #136: Add ReCheck button for repository page - Implementation Plan

## Functional Requirements Mapping

### FR-1: ReCheckボタンの配置
- **対応実装**: フロントエンドコンポーネント `ReCheckButton.vue` の作成
- **統合ポイント**: `frontend/src/pages/[...slug].vue` のレイアウト更新

### FR-2: 手動ヘルスチェック実行
- **対応実装**: バックエンドAPI `/api/repos/:owner/:repo/recheck` の追加
- **統合ポイント**: 既存の `AlertService.runAlert()` メソッドの活用

### FR-3: レート制限機能
- **対応実装**: メモリキャッシュベースのレート制限サービス
- **統合ポイント**: `RateLimitService` クラスの新規作成

### FR-4: 実行状態管理
- **対応実装**: フロントエンド状態管理とリアルタイム更新
- **統合ポイント**: `useRecheck` composable の作成

### FR-5: 結果表示とフィードバック
- **対応実装**: トースト通知とアラートデータの自動更新
- **統合ポイント**: 既存の `useAlerts` composable との連携

### FR-6: エラーハンドリング
- **対応実装**: 包括的エラーハンドリングとユーザーフィードバック
- **統合ポイント**: 既存の `useApi` と `useCustomToast` の活用

## Directory Structure and File List

### Backend Files
```
backend/src/
├── domain/recheck/                 # 新規: ReCheckドメイン
│   ├── recheckController.ts        # 新規: ReCheck APIコントローラー
│   ├── recheckRouter.ts            # 新規: ReCheck ルーター
│   ├── recheckService.ts           # 新規: ReCheck ビジネスロジック
│   ├── recheckModel.ts             # 新規: ReCheck Sequelizeモデル
│   └── recheckSchema.ts            # 新規: ReCheck スキーマ定義
├── database/
│   └── migrate-all.ts              # 既存: ReCheckスキーマ追加
└── router.ts                       # 既存: ReCheckルーター統合
```

### Frontend Files
```
frontend/src/
├── components/Atoms/
│   └── ReCheckButton.vue           # 新規: ReCheckボタンコンポーネント
├── composables/
│   └── useRecheck.ts               # 新規: ReCheck機能管理
├── types/
│   └── recheck.ts                  # 新規: ReCheck関連型定義
├── pages/
│   └── [...slug].vue               # 既存: ReCheckボタン統合
└── utils/
    └── api.ts                      # 既存: ReCheck APIメソッド追加
```

### Test Files
```
backend/tests/
├── unit/domain/recheck/
│   ├── recheckController.test.ts   # 新規: ReCheckコントローラーテスト
│   ├── recheckService.test.ts      # 新規: ReCheckサービステスト
│   └── recheckModel.test.ts        # 新規: ReCheckモデルテスト
└── integration/
    └── recheck.test.ts             # 新規: ReCheck統合テスト

frontend/tests/
├── unit/components/
│   └── ReCheckButton.test.ts       # 新規: ボタンコンポーネントテスト
└── unit/composables/
    └── useRecheck.test.ts          # 新規: composable テスト
```

## Architecture Design

### システム全体アーキテクチャ
```
[Frontend: Vue/Nuxt]
       ↕ HTTP API
[Backend: Node.js/Express]
├── domain/recheck (新規ドメイン)
├── domain/alert (既存ドメイン連携)
       ↕ Database
[MySQL: ReCheck + Alert Data]
```

### コンポーネント間の相互作用
1. **UI Layer**: `ReCheckButton.vue` → `useRecheck` composable
2. **API Layer**: `useRecheck` → API Service → ReCheckController
3. **Business Layer**: ReCheckController → ReCheckService → AlertService
4. **Data Layer**: ReCheckService → MySQL Database

### データフロー
```
1. User clicks ReCheck button
2. Frontend validates rate limit status
3. API call to POST /api/recheck/:owner/:repo
4. ReCheckController checks rate limit (DB query)
5. ReCheckService creates execution record
6. Execute health check (AlertService.runAlert)
7. ReCheckService updates execution status
8. Return execution result
9. Frontend updates UI state
10. Auto-refresh alerts data
11. Display success/error feedback
```

## Data Model

### ReCheck Execution State (MySQL Database)
```typescript
interface RecheckExecutionAttributes {
  id?: number;
  owner: string;
  repo: string;
  executionId: string;
  status: 'running' | 'completed' | 'error' | 'timeout';
  checkTypes: string[];
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  result?: any;
  errorMessage?: string;
  errorCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### ReCheck Settings (MySQL Database)
```typescript
interface RecheckSettingsAttributes {
  id?: number;
  owner: string;
  repo: string;
  rateLimitMinutes: number;
  maxConcurrentExecutions: number;
  allowedCheckTypes: string[];
  timeoutMinutes: number;
  isEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### API Request/Response Types
```typescript
// Request
interface RecheckRequest {
  checks?: string[]; // Optional: specific check types
}

// Response
interface RecheckResponse {
  success: boolean;
  message: string;
  result?: {
    owner: string;
    repo: string;
    executionId: string;
    startedAt: string;
    estimatedDuration: number;
  };
  error?: {
    code: 'RATE_LIMITED' | 'REPO_NOT_FOUND' | 'EXECUTION_ERROR' | 'TIMEOUT';
    message: string;
    retryAfter?: number;
  };
}

// Status Response
interface RecheckStatusResponse {
  status: 'idle' | 'running' | 'completed' | 'error';
  lastExecutedAt?: string;
  nextAvailableAt?: string;
  currentExecution?: {
    executionId: string;
    startedAt: string;
    progress: number;
  };
}
```

## Implementation Tasks

### Task 1.1: ReCheck Domain Setup
**目的**: ReCheck機能の新しいドメインを構築する

**詳細実装**:
1. **ReCheckスキーマ定義** (`backend/src/domain/recheck/recheckSchema.ts`):
   ```typescript
   // alertSchema.tsと同様のパターンで実装
   export interface RecheckExecutionAttributes { ... }
   export interface RecheckSettingsAttributes { ... }
   export const recheckExecutionAttributes = { ... }
   export const recheckSettingsAttributes = { ... }
   export const recheckExecutionModelOptions = { ... }
   export const recheckSettingsModelOptions = { ... }
   ```

2. **ReCheckモデル** (`backend/src/domain/recheck/recheckModel.ts`):
   ```typescript
   import { Model } from 'sequelize';
   import sequelize from '../../config/database';
   import { recheckExecutionAttributes, recheckExecutionModelOptions } from './recheckSchema';
   
   class RecheckExecution extends Model {}
   RecheckExecution.init(recheckExecutionAttributes, {
     sequelize,
     ...recheckExecutionModelOptions,
   });
   ```

3. **データベース統合** (`backend/src/database/migrate-all.ts`):
   - ReCheckスキーマをmigrate-all.tsに追加
   - 既存のRepo/Alertと同様のパターンで統合

**受け入れ条件**:
- [ ] ReCheckスキーマが正しく定義される
- [ ] migrate-all.tsでテーブルが作成される
- [ ] 既存のドメインパターンと一貫性がある

**推定工数**: 4時間

### Task 1.2: ReCheck API Implementation
**目的**: ReCheck専用のAPIコントローラーとルーターを実装する

**詳細実装**:
1. **ReCheckController** (`backend/src/domain/recheck/recheckController.ts`):
   ```typescript
   import { Request, Response, NextFunction } from 'express';
   import { ReCheckService } from './recheckService';
   
   export class ReCheckController {
     static async executeRecheck(req: Request, res: Response, next: NextFunction) {
       const { owner, repo } = req.params;
       const { checks = [] } = req.body;
       
       try {
         const execution = await ReCheckService.startRecheck(owner, repo, checks);
         
         res.status(200).json({
           success: true,
           message: 'Health check started successfully',
           result: {
             owner,
             repo,
             executionId: execution.executionId,
             startedAt: execution.startedAt.toISOString(),
             estimatedDuration: 60
           }
         });
       } catch (error) {
         if (error.message.includes('Rate limit exceeded')) {
           return res.status(429).json({
             success: false,
             error: {
               code: 'RATE_LIMITED',
               message: error.message
             }
           });
         }
         next(error);
       }
     }
     
     static async getRecheckStatus(req: Request, res: Response, next: NextFunction) {
       const { owner, repo } = req.params;
       
       try {
         const status = await ReCheckService.getRecheckStatus(owner, repo);
         res.status(200).json(status);
       } catch (error) {
         next(error);
       }
     }
   }
   ```

2. **ReCheckRouter** (`backend/src/domain/recheck/recheckRouter.ts`):
   ```typescript
   import Router from 'express-promise-router';
   import { ReCheckController } from './recheckController';
   
   const router = Router();
   
   router.post('/:owner/:repo', ReCheckController.executeRecheck);
   router.get('/:owner/:repo/status', ReCheckController.getRecheckStatus);
   
   export default router;
   ```

3. **メインルーター統合** (`backend/src/router.ts`):
   ```typescript
   import recheckRouter from './domain/recheck/recheckRouter';
   
   router.use('/recheck', recheckRouter);
   ```

**受け入れ条件**:
- [ ] POST /api/recheck/:owner/:repo が正常に動作する
- [ ] GET /api/recheck/:owner/:repo/status が状態を返す
- [ ] ReCheckドメインが独立して動作する
- [ ] エラーハンドリングが適切に実装される

**推定工数**: 6時間

### Task 1.3: ReCheck Service Implementation
**目的**: ReCheckのビジネスロジックを実装する

**詳細実装**:
1. **ReCheckService** (`backend/src/domain/recheck/recheckService.ts`):
   ```typescript
   import { RecheckExecution, RecheckSettings } from './recheckModel';
   import { AlertService } from '../alert/alertService';
   
   export class ReCheckService {
     static async checkRateLimit(owner: string, repo: string): Promise<RateLimitResult> {
       // データベースベースのレート制限チェック
     }
     
     static async startRecheck(owner: string, repo: string, checks: string[]) {
       // ReCheck実行開始
       // 1. レート制限チェック
       // 2. 実行レコード作成
       // 3. バックグラウンドでAlertService.runAlert実行
     }
     
     static async getRecheckStatus(owner: string, repo: string) {
       // 実行状態取得
     }
   }
   ```

2. **ReCheckモデルの統合** (`backend/src/domain/recheck/recheckModel.ts`):
   - スキーマからモデルクラス生成
   - ビジネスロジック用の静的メソッド追加

**受け入れ条件**:
- [ ] データベースベースのレート制限が正常に動作する
- [ ] バックグラウンド実行が適切に管理される
- [ ] 既存のAlertServiceとの統合が正常に動作する

**推定工数**: 4時間

### Task 2.1: Frontend ReCheckButton Component
**目的**: ReCheckボタンのUIコンポーネントを実装する

**詳細実装**:
1. **ReCheckButton.vue** (`frontend/src/components/Atoms/ReCheckButton.vue`):
   ```vue
   <template>
     <HealthButton
       :label="buttonLabel"
       :icon="buttonIcon"
       :disabled="isDisabled"
       :loading="isLoading"
       :severity="buttonSeverity"
       @click="handleRecheck"
       class="recheck-button"
       :aria-label="ariaLabel"
     />
   </template>
   
   <script setup lang="ts">
   interface Props {
     owner: string;
     repo: string;
     disabled?: boolean;
   }
   
   interface Emits {
     recheckStarted: [executionId: string];
     recheckCompleted: [result: RecheckResult];
     recheckError: [error: RecheckError];
   }
   
   const props = defineProps<Props>();
   const emit = defineEmits<Emits>();
   
   // useRecheck composable integration
   const { 
     status, 
     isLoading, 
     remainingTime, 
     executeRecheck, 
     error 
   } = useRecheck(props.owner, props.repo);
   
   // Computed properties for button state
   const buttonLabel = computed(() => {
     if (isLoading.value) return 'Checking...';
     if (remainingTime.value > 0) return `Available in ${formatTime(remainingTime.value)}`;
     if (error.value) return 'Retry';
     return 'ReCheck';
   });
   
   const buttonIcon = computed(() => {
     if (isLoading.value) return 'pi pi-spin pi-spinner';
     if (remainingTime.value > 0) return 'pi pi-clock';
     if (error.value) return 'pi pi-exclamation-triangle';
     return 'pi pi-refresh';
   });
   
   const buttonSeverity = computed(() => {
     if (error.value) return 'danger';
     if (remainingTime.value > 0) return 'warning';
     if (isLoading.value) return 'secondary';
     return 'primary';
   });
   
   const isDisabled = computed(() => {
     return props.disabled || isLoading.value || remainingTime.value > 0;
   });
   
   const handleRecheck = async () => {
     try {
       const result = await executeRecheck();
       emit('recheckCompleted', result);
     } catch (err) {
       emit('recheckError', err);
     }
   };
   </script>
   ```

**受け入れ条件**:
- [ ] ボタンが4つの状態（通常、実行中、レート制限、エラー）を正しく表示する
- [ ] アクセシビリティ要件（ARIA属性）を満たす
- [ ] レスポンシブデザインで動作する
- [ ] 既存のHealthButtonと一貫性がある

**推定工数**: 6時間

### Task 2.2: Frontend useRecheck Composable
**目的**: ReCheck機能の状態管理とAPI連携を実装する

**詳細実装**:
1. **useRecheck.ts** (`frontend/src/composables/useRecheck.ts`):
   ```typescript
   export function useRecheck(owner: string, repo: string) {
     const { callApi } = useApi();
     const toast = useCustomToast();
     
     // State
     const status = ref<RecheckStatus>('idle');
     const isLoading = ref(false);
     const remainingTime = ref(0);
     const error = ref<string | null>(null);
     const lastExecutedAt = ref<Date | null>(null);
     
     // Timer for remaining time countdown
     let countdownTimer: NodeJS.Timeout | null = null;
     
     // Check current status
     const checkStatus = async (): Promise<void> => {
       try {
         const response = await callApi(
           () => apiService.getRecheckStatus(owner, repo),
           { showLoading: false }
         );
         
         if (response) {
           status.value = response.status;
           if (response.lastExecutedAt) {
             lastExecutedAt.value = new Date(response.lastExecutedAt);
           }
           if (response.nextAvailableAt) {
             updateRemainingTime(new Date(response.nextAvailableAt));
           }
         }
       } catch (err) {
         console.error('Failed to check recheck status:', err);
       }
     };
     
     // Execute recheck
     const executeRecheck = async (): Promise<RecheckResult> => {
       if (isLoading.value || remainingTime.value > 0) {
         throw new Error('Recheck not available');
       }
       
       try {
         isLoading.value = true;
         error.value = null;
         status.value = 'running';
         
         const response = await callApi(
           () => apiService.executeRecheck(owner, repo),
           { showLoading: false }
         );
         
         if (response?.success) {
           toast.success('ReCheck Started', 'Health check is running in the background');
           lastExecutedAt.value = new Date();
           startRateLimitCountdown();
           
           return response.result;
         } else {
           throw new Error(response?.error?.message || 'Recheck failed');
         }
       } catch (err) {
         const errorMessage = getErrorMessage(err);
         error.value = errorMessage;
         status.value = 'error';
         toast.error('ReCheck Failed', errorMessage);
         throw err;
       } finally {
         isLoading.value = false;
       }
     };
     
     // Start countdown timer for rate limit
     const startRateLimitCountdown = () => {
       remainingTime.value = 180; // 3 minutes in seconds
       
       countdownTimer = setInterval(() => {
         remainingTime.value--;
         if (remainingTime.value <= 0) {
           clearInterval(countdownTimer!);
           countdownTimer = null;
           status.value = 'idle';
         }
       }, 1000);
     };
     
     // Format remaining time
     const formatRemainingTime = computed(() => {
       const minutes = Math.floor(remainingTime.value / 60);
       const seconds = remainingTime.value % 60;
       return `${minutes}m ${seconds}s`;
     });
     
     // Initialize status check
     onMounted(() => {
       checkStatus();
     });
     
     // Cleanup timer
     onUnmounted(() => {
       if (countdownTimer) {
         clearInterval(countdownTimer);
       }
     });
     
     return {
       status: readonly(status),
       isLoading: readonly(isLoading),
       remainingTime: readonly(remainingTime),
       error: readonly(error),
       lastExecutedAt: readonly(lastExecutedAt),
       formatRemainingTime,
       executeRecheck,
       checkStatus
     };
   }
   ```

**受け入れ条件**:
- [ ] レート制限のカウントダウンが正常に動作する
- [ ] API呼び出しエラーが適切にハンドリングされる
- [ ] 状態管理がリアクティブに動作する
- [ ] メモリリークが発生しない

**推定工数**: 8時間

### Task 2.3: Frontend API Service Integration
**目的**: APIサービスにReCheck関連メソッドを追加する

**詳細実装**:
1. **api.ts の拡張** (`frontend/src/utils/api.ts`):
   ```typescript
   export class ApiService {
     // 既存メソッド...
     
     // ReCheck execution
     async executeRecheck(owner: string, repo: string, checks?: string[]): Promise<RecheckResponse> {
       return this.fetchData<RecheckResponse>(`/api/recheck/${owner}/${repo}`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({ checks }),
       });
     }
     
     // ReCheck status
     async getRecheckStatus(owner: string, repo: string): Promise<RecheckStatusResponse> {
       return this.fetchData<RecheckStatusResponse>(`/api/recheck/${owner}/${repo}/status`);
     }
   }
   ```

2. **型定義の追加** (`frontend/src/types/recheck.ts`):
   ```typescript
   export type RecheckStatus = 'idle' | 'running' | 'completed' | 'error';
   
   export interface RecheckRequest {
     checks?: string[];
   }
   
   export interface RecheckResponse {
     success: boolean;
     message: string;
     result?: {
       owner: string;
       repo: string;
       executionId: string;
       startedAt: string;
       estimatedDuration: number;
     };
     error?: {
       code: string;
       message: string;
       retryAfter?: number;
     };
   }
   
   export interface RecheckStatusResponse {
     status: RecheckStatus;
     lastExecutedAt?: string;
     nextAvailableAt?: string;
     currentExecution?: {
       executionId: string;
       startedAt: string;
       progress: number;
     };
   }
   ```

**受け入れ条件**:
- [ ] APIメソッドが正常にリクエストを送信する
- [ ] TypeScript型チェックが通る
- [ ] エラーレスポンスが適切に処理される

**推定工数**: 3時間

### Task 3.1: Frontend Page Integration
**目的**: ReCheckボタンをリポジトリページに統合する

**詳細実装**:
1. **[...slug].vue の更新** (`frontend/src/pages/[...slug].vue`):
   ```vue
   <template>
     <div class="p-6 space-y-8">
       <HealthTitle title="GitHub Health Checker" />
       <BackToDashboardLink />
       
       <!-- Repository Header with ReCheck Button -->
       <div class="flex items-center justify-between mb-4">
         <RepoAlertTitle :owner="owner" :repo="repo" />
         <ReCheckButton 
           :owner="owner" 
           :repo="repo"
           @recheck-completed="handleRecheckCompleted"
           @recheck-error="handleRecheckError"
           class="ml-4"
         />
       </div>
       
       <!-- 既存のアラート表示コンテンツ -->
       <LoadingText v-if="loading" text="Loading alerts..." />
       <!-- ... 他のコンテンツ ... -->
     </div>
   </template>
   
   <script setup>
   // 既存のimport...
   import ReCheckButton from '~/components/Atoms/ReCheckButton.vue'
   
   // 既存のロジック...
   
   // ReCheck completion handler
   const handleRecheckCompleted = async (result) => {
     console.log('ReCheck completed:', result);
     toast.success('ReCheck Completed', 'Health check finished successfully');
     
     // Auto-refresh alerts after a short delay
     setTimeout(async () => {
       try {
         await fetchAlerts();
         toast.info('Data Updated', 'Alert data has been refreshed');
       } catch (err) {
         console.error('Failed to refresh alerts:', err);
       }
     }, 2000);
   };
   
   // ReCheck error handler
   const handleRecheckError = (error) => {
     console.error('ReCheck error:', error);
     // Error handling is already done in the component
   };
   </script>
   ```

**受け入れ条件**:
- [ ] ReCheckボタンが適切な位置に表示される
- [ ] チェック完了後にアラートデータが自動更新される
- [ ] レスポンシブレイアウトが保たれる
- [ ] 既存機能に影響を与えない

**推定工数**: 3時間

### Task 3.2: Frontend Component Testing
**目的**: フロントエンドコンポーネントのテストを実装する

**詳細実装**:
1. **ReCheckButton のテスト** (`frontend/tests/unit/components/ReCheckButton.test.ts`):
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest'
   import { mount } from '@vue/test-utils'
   import ReCheckButton from '@/components/Atoms/ReCheckButton.vue'
   import { useRecheck } from '@/composables/useRecheck'
   
   // Mock composable
   vi.mock('@/composables/useRecheck')
   
   describe('ReCheckButton', () => {
     let mockUseRecheck: any;
     
     beforeEach(() => {
       mockUseRecheck = {
         status: ref('idle'),
         isLoading: ref(false),
         remainingTime: ref(0),
         error: ref(null),
         executeRecheck: vi.fn()
       };
       vi.mocked(useRecheck).mockReturnValue(mockUseRecheck);
     });
     
     it('renders with correct initial state', () => {
       const wrapper = mount(ReCheckButton, {
         props: { owner: 'test', repo: 'repo' }
       });
       
       expect(wrapper.text()).toContain('ReCheck');
       expect(wrapper.find('button').attributes('disabled')).toBeUndefined();
     });
     
     it('shows loading state correctly', async () => {
       mockUseRecheck.isLoading.value = true;
       
       const wrapper = mount(ReCheckButton, {
         props: { owner: 'test', repo: 'repo' }
       });
       
       expect(wrapper.text()).toContain('Checking...');
       expect(wrapper.find('button').attributes('disabled')).toBeDefined();
     });
     
     it('shows rate limit state correctly', async () => {
       mockUseRecheck.remainingTime.value = 120;
       
       const wrapper = mount(ReCheckButton, {
         props: { owner: 'test', repo: 'repo' }
       });
       
       expect(wrapper.text()).toContain('Available in');
       expect(wrapper.find('button').attributes('disabled')).toBeDefined();
     });
     
     it('emits events correctly', async () => {
       const mockResult = { executionId: '123' };
       mockUseRecheck.executeRecheck.mockResolvedValue(mockResult);
       
       const wrapper = mount(ReCheckButton, {
         props: { owner: 'test', repo: 'repo' }
       });
       
       await wrapper.find('button').trigger('click');
       
       expect(mockUseRecheck.executeRecheck).toHaveBeenCalled();
       expect(wrapper.emitted('recheckCompleted')).toBeTruthy();
       expect(wrapper.emitted('recheckCompleted')[0]).toEqual([mockResult]);
     });
   });
   ```

2. **useRecheck composable のテスト** (`frontend/tests/unit/composables/useRecheck.test.ts`):
   - 状態管理のテスト
   - API呼び出しのテスト
   - カウントダウンタイマーのテスト
   - エラーハンドリングのテスト

**受け入れ条件**:
- [ ] 全てのテストが成功する
- [ ] 主要な状態遷移がテストされている
- [ ] エラーケースがカバーされている
- [ ] モック処理が適切に実装されている

**推定工数**: 6時間

### Task 3.3: Backend Testing
**目的**: ReCheckドメインのテストを実装する

**詳細実装**:
1. **Unit Tests** (`backend/tests/unit/domain/recheck/`):
   ```typescript
   // recheckController.test.ts
   // recheckService.test.ts  
   // recheckModel.test.ts
   ```

2. **Integration Tests** (`backend/tests/integration/recheck.test.ts`):
   - ReCheck API エンドポイントのテスト
   - データベース統合テスト
   - AlertServiceとの連携テスト

**受け入れ条件**:
- [ ] ReCheckドメインの単体テストが実装されている
- [ ] 統合テストで主要シナリオがカバーされている
- [ ] テストカバレッジが80%以上

**推定工数**: 8時間

## Implementation Priority and Dependencies

### Phase 1: Backend Foundation (Priority: High)
- Task 1.1: ReCheck Domain Setup
- Task 1.2: ReCheck API Implementation
- Task 1.3: ReCheck Service Implementation

**Dependencies**: なし  
**推定期間**: 2日

### Phase 2: Frontend Implementation (Priority: High)
- Task 2.1: Frontend ReCheckButton Component
- Task 2.2: Frontend useRecheck Composable
- Task 2.3: Frontend API Service Integration

**Dependencies**: Phase 1完了  
**推定期間**: 3日

### Phase 3: Integration and Testing (Priority: Medium)
- Task 3.1: Frontend Page Integration
- Task 3.2: Frontend Component Testing
- Task 3.3: Backend Testing

**Dependencies**: Phase 1, 2完了  
**推定期間**: 2日

## Total Estimated Development Time

- **Backend**: 14時間 (1.75日)
- **Frontend**: 17時間 (2.1日) 
- **Integration & Testing**: 17時間 (2.1日)
- **Total**: 48時間 (6日)

## Risk Assessment and Mitigation

### High Risk
1. **レート制限の実装複雑性**
   - **リスク**: メモリキャッシュの管理とTTL実装
   - **対策**: シンプルなMap-based実装から開始、必要に応じてRedis移行

2. **既存システムへの影響**
   - **リスク**: AlertServiceの変更が既存機能に影響
   - **対策**: 既存メソッドは変更せず、新しいラッパーメソッドで対応

### Medium Risk
1. **フロントエンドの状態管理**
   - **リスク**: 複数タブでの状態同期
   - **対策**: 初期実装では単一タブ対応、将来的にBroadcastChannel使用

2. **パフォーマンス要件**
   - **リスク**: 500ms以内の応答時間
   - **対策**: 非同期実行とキャッシュ戦略で最適化

### Low Risk
1. **UI/UXの一貫性**
   - **リスク**: 既存デザインとの不整合
   - **対策**: 既存のHealthButtonコンポーネント活用

## Success Metrics

### Functional Metrics
- [ ] ReCheck機能の正常動作率: 99%以上
- [ ] レート制限の正確性: 100%
- [ ] API応答時間: 平均500ms以内
- [ ] エラーハンドリング網羅率: 95%以上

### Quality Metrics
- [ ] 単体テストカバレッジ: 80%以上
- [ ] 統合テストカバレッジ: 70%以上
- [ ] TypeScriptコンパイルエラー: 0件
- [ ] ESLintエラー: 0件

### User Experience Metrics
- [ ] ボタンクリックから視覚フィードバックまで: 100ms以内
- [ ] レスポンシブデザイン対応: 全デバイス
- [ ] アクセシビリティスコア: 90%以上
- [ ] ユーザビリティテスト合格率: 95%以上

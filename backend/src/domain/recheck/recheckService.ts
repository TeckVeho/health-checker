import { v4 as uuidv4 } from 'uuid';
import { RecheckExecution, RecheckSettings, RateLimitResult } from './recheckModel';
import AlertService from '../alert/alertService';
import { EnvironmentValidator, EnvironmentValidationResult } from '../../utils/environmentUtils';

// Response interfaces
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
  status: 'idle' | 'running' | 'completed' | 'error';
  lastExecutedAt?: string;
  nextAvailableAt?: string;
  currentExecution?: {
    executionId: string;
    startedAt: string;
    progress: number;
    durationSeconds?: number;
    currentPhase?: string;
    totalPhases?: number;
    phaseProgress?: number;
    phaseDetails?: {
      phase: string;
      progress: number;
      totalItems?: number;
      processedItems?: number;
    };
  };
}

export class ReCheckService {
  
  /**
   * グローバルReCheck実行（全リポジトリ）
   */
  static async startGlobalRecheck(checks: string[] = ['branch', 'clone', 'gitleaks', 'issue']): Promise<{ executionId: string; startedAt: Date }> {
    const executionId = uuidv4();
    const startedAt = new Date();
    
    console.log(`[ReCheckService] Starting global recheck: ${executionId}`);
    
    // バックグラウンドで実行
    setImmediate(async () => {
      try {
        await this.executeGlobalRecheck(executionId, checks);
      } catch (error) {
        console.error(`[ReCheckService] Global recheck failed: ${executionId}`, error);
      }
    });
    
    return { executionId, startedAt };
  }
  
  /**
   * グローバルReCheckの実際の実行処理
   */
  private static async executeGlobalRecheck(executionId: string, checks: string[]): Promise<void> {
    try {
      // 全リポジトリを取得
      const repos = await this.getAllRepositories();
      
      console.log(`[ReCheckService] Global recheck started for ${repos.length} repositories`);
      
      // 各リポジトリに対してReCheckを実行
      for (const repo of repos) {
        try {
          console.log(`[ReCheckService] Processing ${repo.owner}/${repo.name}`);
          await AlertService.runAlert({
            owner: repo.owner,
            repo: repo.name,
            checks: checks
          });
        } catch (error) {
          console.error(`[ReCheckService] Failed to process ${repo.owner}/${repo.name}:`, error);
          // 個別のリポジトリエラーは続行
        }
      }
      
      console.log(`[ReCheckService] Global recheck completed: ${executionId}`);
      
    } catch (error) {
      console.error(`[ReCheckService] Global recheck execution failed: ${executionId}`, error);
      throw error;
    }
  }
  
  /**
   * 全リポジトリを取得
   */
  private static async getAllRepositories(): Promise<{ owner: string; name: string }[]> {
    // ここでリポジトリ一覧を取得する実装を追加
    // 現在は仮実装
    return [
      { owner: 'TeckVeho', name: 'health-checker' },
      // 他のリポジトリも追加
    ];
  }
  
  /**
   * レート制限チェック（終了時間から3分後に再実行可能）
   */
  static async checkRateLimit(owner: string, repo: string): Promise<RateLimitResult> {
    // リポジトリ設定を取得
    const settings = await RecheckSettings.getSettingsForRepo(owner, repo);
    
    if (!settings.isEnabled) {
      return {
        allowed: false,
        retryAfter: -1, // 無効化されている場合
      };
    }

    return await RecheckExecution.checkRateLimit(owner, repo, settings.rateLimitMinutes);
  }

  /**
   * ReCheck実行開始
   */
  static async startRecheck(
    owner: string, 
    repo: string, 
    checks: string[] = ['branch', 'clone', 'gitleaks', 'issue']
  ): Promise<RecheckExecution> {
    
    // 環境変数検証
    console.log(`[ReCheck] Validating environment for ${owner}/${repo}`);
    const envValidation = await EnvironmentValidator.validateEnvironment();
    EnvironmentValidator.logValidationResult(envValidation);
    
    if (!envValidation.isValid) {
      const errorMessage = this.buildEnvironmentErrorMessage(envValidation);
      throw new Error(errorMessage);
    }
    
    // レート制限チェック
    const rateLimitResult = await this.checkRateLimit(owner, repo);
    if (!rateLimitResult.allowed) {
      if (rateLimitResult.retryAfter === -1) {
        throw new Error('ReCheck is disabled for this repository');
      }
      throw new Error(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds.`);
    }

    // リポジトリ設定を取得
    const settings = await RecheckSettings.getSettingsForRepo(owner, repo);

    // 実行中のチェックがあるかチェック
    const runningExecutions = await RecheckExecution.findRunningByRepo(owner, repo);
    if (runningExecutions.length >= settings.maxConcurrentExecutions) {
      throw new Error('Maximum concurrent executions reached for this repository.');
    }

    // チェック種類の検証
    const allowedChecks = checks.filter(check => settings.allowedCheckTypes.includes(check));
    if (allowedChecks.length === 0) {
      throw new Error('No valid check types specified.');
    }

    // 新しい実行レコード作成
    const executionId = `recheck_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    const execution = await RecheckExecution.create({
      owner,
      repo,
      executionId,
      status: 'running',
      checkTypes: allowedChecks,
      startedAt: new Date(),
    });

    console.log(`[ReCheck] Started execution ${executionId} for ${owner}/${repo}`);

    // バックグラウンドでヘルスチェック実行
    this.executeHealthCheckBackground(execution, settings.timeoutMinutes);

    return execution;
  }

  /**
   * バックグラウンドでのヘルスチェック実行
   */
  private static async executeHealthCheckBackground(
    execution: RecheckExecution, 
    timeoutMinutes: number
  ): Promise<void> {
    const startTime = Date.now();
    
    // タイムアウト設定
    const timeoutId = setTimeout(async () => {
      try {
        const currentExecution = await RecheckExecution.findByPk(execution.id);
        if (currentExecution && currentExecution.status === 'running') {
          await currentExecution.markError(
            `Execution timed out after ${timeoutMinutes} minutes`,
            'TIMEOUT'
          );
          console.log(`[ReCheck] Execution ${execution.executionId} timed out`);
        }
      } catch (error) {
        console.error(`[ReCheck] Error handling timeout for ${execution.executionId}:`, error);
      }
    }, timeoutMinutes * 60 * 1000);

    try {
      console.log(`[ReCheck] Executing health check for ${execution.owner}/${execution.repo} (${execution.executionId})`);
      
      // 実行前の環境変数再検証（フォールバック処理）
      const envValidation = await EnvironmentValidator.validateEnvironment();
      if (!envValidation.isValid && !process.env.GITHUB_LOCAL_WORKSPACE) {
        console.warn(`[ReCheck] GITHUB_LOCAL_WORKSPACE not set, attempting to create fallback workspace`);
        try {
          const fallbackPath = await EnvironmentValidator.createFallbackWorkspace();
          process.env.GITHUB_LOCAL_WORKSPACE = fallbackPath;
          console.log(`[ReCheck] Using fallback workspace: ${fallbackPath}`);
        } catch (fallbackError) {
          console.error(`[ReCheck] Failed to create fallback workspace:`, fallbackError);
          throw new Error(`Environment setup failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
        }
      }
      
      // 既存のAlertService.runAlertを使用（進捗管理付き）
      const result = await AlertService.runAlert({
        owner: execution.owner,
        repo: execution.repo,
        checks: execution.checkTypes,
        onProgress: async (progress) => {
          console.log(`[ReCheck] onProgress called for ${execution.owner}/${execution.repo}:`, JSON.stringify(progress, null, 2));
          try {
            // 進捗情報をデータベースに保存
            await execution.update({
              result: {
                currentPhase: progress.currentPhase,
                totalPhases: progress.totalPhases,
                phaseProgress: progress.phaseProgress,
                phaseDetails: progress.phaseDetails
              }
            });
            console.log(`[ReCheck] ✅ Progress saved to DB for ${execution.owner}/${execution.repo}: ${progress.currentPhase} (${progress.phaseDetails?.processedItems || 0}/${progress.phaseDetails?.totalItems || 0})`);
          } catch (error) {
            console.error(`[ReCheck] ❌ Failed to save progress to DB for ${execution.owner}/${execution.repo}:`, error);
          }
        }
      });

      // タイムアウトをクリア
      clearTimeout(timeoutId);

      // 成功時の更新
      await execution.markCompleted(result);

      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      console.log(`[ReCheck] Completed health check for ${execution.owner}/${execution.repo} in ${durationSeconds}s`);
      
    } catch (error) {
      // タイムアウトをクリア
      clearTimeout(timeoutId);
      
      const endTime = Date.now();
      const durationSeconds = Math.round((endTime - startTime) / 1000);
      
      console.error(`[ReCheck] Failed health check for ${execution.owner}/${execution.repo}:`, error);
      
      // エラー時の更新
      await execution.markError(
        error instanceof Error ? error.message : String(error),
        'EXECUTION_ERROR'
      );
    }
  }

  /**
   * ReCheck状態取得
   */
  static async getRecheckStatus(owner: string, repo: string): Promise<RecheckStatusResponse> {
    // 最新の実行レコード取得
    const latestExecution = await RecheckExecution.findLatestByRepo(owner, repo);
    
    if (!latestExecution) {
      return { status: 'idle' };
    }

    // 実行中の場合
    if (latestExecution.status === 'running') {
      const now = Date.now();
      const startTime = latestExecution.startedAt.getTime();
      const elapsedSeconds = Math.round((now - startTime) / 1000);
      
      // データベースから進捗情報を取得
      const result = latestExecution.result as any || {};
      const currentPhase = result.currentPhase || 'Initializing...';
      const totalPhases = result.totalPhases || 1;
      const phaseProgress = result.phaseProgress || 0;
      const phaseDetails = result.phaseDetails || {};
      
      // 全体の進捗計算（issue checkフェーズが70%を占める）
      let overallProgress = 0;
      const currentPhaseName = result.currentPhase || 'Initializing...';
      const phaseProgressValue = result.phaseProgress || 0;
      
      if (currentPhaseName.toLowerCase().includes('issue')) {
        // Issue checkフェーズ: 30% + (フェーズ進捗 * 70%)
        overallProgress = Math.min(Math.round(30 + (phaseProgressValue * 0.7)), 95);
      } else if (currentPhaseName.toLowerCase().includes('branch')) {
        // Branch checkフェーズ: フェーズ進捗 * 15%
        overallProgress = Math.min(Math.round(phaseProgressValue * 0.15), 15);
      } else if (currentPhaseName.toLowerCase().includes('clone')) {
        // Clone checkフェーズ: 15% + (フェーズ進捗 * 10%)
        overallProgress = Math.min(Math.round(15 + (phaseProgressValue * 0.1)), 25);
      } else if (currentPhaseName.toLowerCase().includes('gitleaks')) {
        // Gitleaks checkフェーズ: 25% + (フェーズ進捗 * 5%)
        overallProgress = Math.min(Math.round(25 + (phaseProgressValue * 0.05)), 30);
      } else {
        // その他のフェーズ: 従来の計算
        overallProgress = Math.min(Math.round((phaseProgressValue / totalPhases) * 100), 95);
      }
      
      return {
        status: 'running',
        lastExecutedAt: latestExecution.startedAt.toISOString(),
        currentExecution: {
          executionId: latestExecution.executionId,
          startedAt: latestExecution.startedAt.toISOString(),
          progress: overallProgress,
          durationSeconds: elapsedSeconds,
          currentPhase,
          totalPhases,
          phaseProgress,
          phaseDetails,
        },
      };
    }

    // レート制限情報の計算
    const rateLimitResult = await this.checkRateLimit(owner, repo);
    
    return {
      status: latestExecution.status === 'completed' ? 'completed' : 'error',
      lastExecutedAt: latestExecution.startedAt.toISOString(),
      nextAvailableAt: rateLimitResult.nextAvailableAt?.toISOString(),
    };
  }

  /**
   * 実行履歴取得
   */
  static async getExecutionHistory(
    owner: string, 
    repo: string, 
    limit: number = 10,
    offset: number = 0
  ): Promise<{ rows: RecheckExecution[]; count: number }> {
    return await RecheckExecution.getExecutionHistory(owner, repo, { limit, offset });
  }

  /**
   * リポジトリ統計取得
   */
  static async getRepoStats(owner: string, repo: string): Promise<{
    totalExecutions: number;
    successRate: number;
    averageDuration: number;
    lastExecutedAt?: Date;
  }> {
    const [stats] = await RecheckExecution.sequelize!.query(`
      SELECT 
        COUNT(*) as totalExecutions,
        AVG(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) * 100 as successRate,
        AVG(duration_seconds) as averageDuration,
        MAX(started_at) as lastExecutedAt
      FROM recheck_executions 
      WHERE owner = :owner AND repo = :repo
    `, {
      replacements: { owner, repo },
      type: 'SELECT',
    }) as any[];

    return {
      totalExecutions: parseInt(stats.totalExecutions) || 0,
      successRate: parseFloat(stats.successRate) || 0,
      averageDuration: parseFloat(stats.averageDuration) || 0,
      lastExecutedAt: stats.lastExecutedAt ? new Date(stats.lastExecutedAt) : undefined,
    };
  }

  /**
   * タイムアウト処理（定期実行用）
   */
  static async handleTimeouts(): Promise<number> {
    return await RecheckExecution.handleTimeouts(10); // 10分でタイムアウト
  }

  /**
   * 古い履歴のクリーンアップ（定期実行用）
   */
  static async cleanupOldRecords(retentionDays: number = 30): Promise<number> {
    return await RecheckExecution.cleanupOldRecords(retentionDays);
  }

  /**
   * リポジトリ設定の取得
   */
  static async getSettings(owner: string, repo: string): Promise<import('./recheckSchema').RecheckSettingsAttributes> {
    return await RecheckSettings.getSettingsForRepo(owner, repo);
  }

  /**
   * リポジトリ設定の更新
   */
  static async updateSettings(
    owner: string, 
    repo: string, 
    settings: Partial<import('./recheckSchema').RecheckSettingsAttributes>
  ): Promise<RecheckSettings> {
    return await RecheckSettings.upsertSettings(owner, repo, settings);
  }

  /**
   * 環境変数エラーメッセージの構築
   */
  private static buildEnvironmentErrorMessage(validation: EnvironmentValidationResult): string {
    let message = 'Environment validation failed:\n';
    
    if (validation.missingVars.length > 0) {
      message += `Missing required variables: ${validation.missingVars.join(', ')}\n`;
    }
    
    if (validation.warnings.length > 0) {
      message += `Warnings:\n${validation.warnings.map(w => `  - ${w}`).join('\n')}\n`;
    }
    
    if (validation.fallbackPaths.length > 0) {
      message += `Suggested fallback paths:\n${validation.fallbackPaths.map(p => `  - ${p}`).join('\n')}\n`;
    }
    
    message += '\nPlease check your environment configuration and try again.';
    
    return message;
  }
}

// 型定義のエクスポート
export type { RateLimitResult } from './recheckModel';
export type { RecheckExecutionAttributes, RecheckSettingsAttributes } from './recheckSchema';

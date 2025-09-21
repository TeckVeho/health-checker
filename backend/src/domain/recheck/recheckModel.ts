import { Model, Op } from 'sequelize';
import sequelize from '../../config/database';
import {
  RecheckExecutionAttributes,
  RecheckExecutionCreationAttributes,
  RecheckSettingsAttributes,
  RecheckSettingsCreationAttributes,
  recheckExecutionAttributes,
  recheckExecutionModelOptions,
  recheckSettingsAttributes,
  recheckSettingsModelOptions,
} from './recheckSchema';

// Rate limit result interface
export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  lastExecutedAt?: Date;
  nextAvailableAt?: Date;
}

// RecheckExecution Model
export class RecheckExecution extends Model<RecheckExecutionAttributes, RecheckExecutionCreationAttributes>
  implements RecheckExecutionAttributes {
  
  public id!: number;
  public owner!: string;
  public repo!: string;
  public executionId!: string;
  public status!: 'running' | 'completed' | 'error' | 'timeout';
  public checkTypes!: string[];
  public startedAt!: Date;
  public completedAt?: Date;
  public durationSeconds?: number;
  public result?: any;
  public errorMessage?: string;
  public errorCode?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * リポジトリの最新実行レコード取得
   */
  static async findLatestByRepo(owner: string, repo: string): Promise<RecheckExecution | null> {
    return await RecheckExecution.findOne({
      where: { owner, repo },
      order: [['startedAt', 'DESC']],
    });
  }

  /**
   * リポジトリの実行中タスク取得
   */
  static async findRunningByRepo(owner: string, repo: string): Promise<RecheckExecution[]> {
    return await RecheckExecution.findAll({
      where: { 
        owner, 
        repo, 
        status: 'running' 
      },
      order: [['startedAt', 'DESC']],
    });
  }

  /**
   * レート制限チェック（終了時間から3分後に再実行可能）
   */
  static async checkRateLimit(
    owner: string, 
    repo: string, 
    rateLimitMinutes: number = 3
  ): Promise<RateLimitResult> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - rateLimitMinutes);

    // Get recent completed execution (based on end time)
    const recentExecution = await RecheckExecution.findOne({
      where: {
        owner,
        repo,
        completedAt: {
          [Op.gte]: cutoffTime
        },
        status: {
          [Op.in]: ['completed', 'error']
        }
      },
      order: [['completedAt', 'DESC']],
      attributes: ['id', 'startedAt', 'completedAt', 'status'],
    });

    if (!recentExecution || !recentExecution.completedAt) {
      return { allowed: true };
    }

    // Calculate 3 minutes after end time
    const nextAvailable = new Date(recentExecution.completedAt);
    nextAvailable.setMinutes(nextAvailable.getMinutes() + rateLimitMinutes);
    
    const now = new Date();
    if (now >= nextAvailable) {
      return { allowed: true };
    }

    const retryAfter = Math.ceil((nextAvailable.getTime() - now.getTime()) / 1000);
    
    return {
      allowed: false,
      retryAfter,
      lastExecutedAt: recentExecution.completedAt, // Return end time
      nextAvailableAt: nextAvailable,
    };
  }

  /**
   * 実行履歴取得（ページネーション対応）
   */
  static async getExecutionHistory(
    owner: string,
    repo: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string[];
    } = {}
  ): Promise<{ rows: RecheckExecution[]; count: number }> {
    const { limit = 10, offset = 0, status } = options;
    
    const whereClause: any = { owner, repo };
    if (status && status.length > 0) {
      whereClause.status = { [Op.in]: status };
    }

    return await RecheckExecution.findAndCountAll({
      where: whereClause,
      order: [['startedAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id', 'executionId', 'status', 'checkTypes',
        'startedAt', 'completedAt', 'durationSeconds',
        'errorMessage', 'errorCode'
      ],
    });
  }

  /**
   * タイムアウト処理
   */
  static async handleTimeouts(timeoutMinutes: number = 10): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    const [updatedCount] = await RecheckExecution.update(
      {
        status: 'timeout',
        completedAt: new Date(),
        errorMessage: `Execution timed out after ${timeoutMinutes} minutes`,
        errorCode: 'TIMEOUT',
      },
      {
        where: {
          status: 'running',
          startedAt: {
            [Op.lt]: cutoffTime
          }
        }
      }
    );

    if (updatedCount > 0) {
      console.log(`[ReCheck] Marked ${updatedCount} executions as timed out`);
    }

    return updatedCount;
  }

  /**
   * 古い履歴のクリーンアップ
   */
  static async cleanupOldRecords(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deletedCount = await RecheckExecution.destroy({
      where: {
        startedAt: {
          [Op.lt]: cutoffDate
        },
        status: {
          [Op.in]: ['completed', 'error', 'timeout']
        }
      }
    });

    if (deletedCount > 0) {
      console.log(`[ReCheck] Cleaned up ${deletedCount} old execution records`);
    }

    return deletedCount;
  }

  /**
   * 実行完了の更新
   */
  async markCompleted(result?: any): Promise<void> {
    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - this.startedAt.getTime()) / 1000);

    await this.update({
      status: 'completed',
      completedAt: now,
      durationSeconds,
      result,
    });
  }

  /**
   * エラー状態の更新
   */
  async markError(errorMessage: string, errorCode: string = 'EXECUTION_ERROR'): Promise<void> {
    const now = new Date();
    const durationSeconds = Math.round((now.getTime() - this.startedAt.getTime()) / 1000);

    await this.update({
      status: 'error',
      completedAt: now,
      durationSeconds,
      errorMessage,
      errorCode,
    });
  }
}

// RecheckSettings Model
export class RecheckSettings extends Model<RecheckSettingsAttributes, RecheckSettingsCreationAttributes>
  implements RecheckSettingsAttributes {
  
  public id!: number;
  public owner!: string;
  public repo!: string;
  public rateLimitMinutes!: number;
  public maxConcurrentExecutions!: number;
  public allowedCheckTypes!: string[];
  public timeoutMinutes!: number;
  public isEnabled!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  /**
   * リポジトリの設定取得（デフォルト値付き）
   */
  static async getSettingsForRepo(owner: string, repo: string): Promise<RecheckSettingsAttributes> {
    const settings = await RecheckSettings.findOne({
      where: { owner, repo },
    });

    if (settings) {
      return settings.toJSON();
    }

    // Return default settings
    return {
      owner,
      repo,
      rateLimitMinutes: 3,
      maxConcurrentExecutions: 1,
      allowedCheckTypes: ['branch', 'clone', 'gitleaks', 'issue'],
      timeoutMinutes: 10,
      isEnabled: true,
    };
  }

  /**
   * リポジトリ設定の作成または更新
   */
  static async upsertSettings(
    owner: string, 
    repo: string, 
    settings: Partial<RecheckSettingsAttributes>
  ): Promise<RecheckSettings> {
    const [instance, created] = await RecheckSettings.findOrCreate({
      where: { owner, repo },
      defaults: {
        owner,
        repo,
        rateLimitMinutes: settings.rateLimitMinutes || 3,
        maxConcurrentExecutions: settings.maxConcurrentExecutions || 1,
        allowedCheckTypes: settings.allowedCheckTypes || ['branch', 'clone', 'gitleaks', 'issue'],
        timeoutMinutes: settings.timeoutMinutes || 10,
        isEnabled: settings.isEnabled !== undefined ? settings.isEnabled : true,
      },
    });

    if (!created) {
      // Update existing record
      await instance.update({
        ...settings,
        updatedAt: new Date(),
      });
    }

    return instance;
  }
}

// Initialize models
RecheckExecution.init(recheckExecutionAttributes, {
  sequelize,
  ...recheckExecutionModelOptions,
});

RecheckSettings.init(recheckSettingsAttributes, {
  sequelize,
  ...recheckSettingsModelOptions,
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export default { RecheckExecution, RecheckSettings };

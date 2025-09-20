import { Request, Response, NextFunction } from 'express';
import { ReCheckService, RecheckResponse, RecheckStatusResponse } from './recheckService';
import getMessage from '../../utils/message';

export class ReCheckController {
  
  /**
   * POST /api/recheck/:owner/:repo
   * ReCheck実行
   */
  static async executeRecheck(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { owner, repo } = req.params;
    const { checks = [] } = req.body;

    try {
      console.log(`[ReCheckController] Starting recheck for ${owner}/${repo}`, { checks });
      
      const execution = await ReCheckService.startRecheck(owner, repo, checks);
      
      const response: RecheckResponse = {
        success: true,
        message: getMessage('SUCCESS.RECHECK_STARTED', `${owner}/${repo}`),
        result: {
          owner,
          repo,
          executionId: execution.executionId,
          startedAt: execution.startedAt.toISOString(),
          estimatedDuration: 60, // 推定1分
        },
      };

      res.status(200).json(response);
      
    } catch (error) {
      console.error(`[ReCheckController] Error executing recheck for ${owner}/${repo}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // レート制限エラー
      if (errorMessage.includes('Rate limit exceeded')) {
        const retryAfterMatch = errorMessage.match(/Retry after (\d+) seconds/);
        const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1]) : undefined;
        
        const response: RecheckResponse = {
          success: false,
          message: 'Rate limit exceeded',
          error: {
            code: 'RATE_LIMITED',
            message: errorMessage,
            retryAfter,
          },
        };
        
        return res.status(429).json(response);
      }
      
      // 同時実行制限エラー
      if (errorMessage.includes('Maximum concurrent executions')) {
        const response: RecheckResponse = {
          success: false,
          message: 'Concurrent execution limit reached',
          error: {
            code: 'CONCURRENT_LIMIT_EXCEEDED',
            message: errorMessage,
          },
        };
        
        return res.status(409).json(response);
      }
      
      // 無効化エラー
      if (errorMessage.includes('ReCheck is disabled')) {
        const response: RecheckResponse = {
          success: false,
          message: 'ReCheck is disabled for this repository',
          error: {
            code: 'RECHECK_DISABLED',
            message: errorMessage,
          },
        };
        
        return res.status(403).json(response);
      }
      
      // バリデーションエラー
      if (errorMessage.includes('No valid check types')) {
        const response: RecheckResponse = {
          success: false,
          message: 'Invalid check types specified',
          error: {
            code: 'INVALID_CHECK_TYPES',
            message: errorMessage,
          },
        };
        
        return res.status(400).json(response);
      }
      
      // その他のエラー
      next(error);
    }
  }

  /**
   * GET /api/recheck/:owner/:repo/status
   * ReCheck状態取得
   */
  static async getRecheckStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { owner, repo } = req.params;

    try {
      console.log(`[ReCheckController] Getting recheck status for ${owner}/${repo}`);
      
      const status = await ReCheckService.getRecheckStatus(owner, repo);
      
      res.status(200).json(status);
      
    } catch (error) {
      console.error(`[ReCheckController] Error getting recheck status for ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/recheck/:owner/:repo/history
   * ReCheck実行履歴取得
   */
  static async getExecutionHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { owner, repo } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    try {
      console.log(`[ReCheckController] Getting execution history for ${owner}/${repo}`);
      
      const history = await ReCheckService.getExecutionHistory(
        owner, 
        repo, 
        parseInt(String(limit)), 
        parseInt(String(offset))
      );
      
      res.status(200).json({
        success: true,
        data: history.rows,
        pagination: {
          total: history.count,
          limit: parseInt(String(limit)),
          offset: parseInt(String(offset)),
        },
      });
      
    } catch (error) {
      console.error(`[ReCheckController] Error getting execution history for ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/recheck/:owner/:repo/stats
   * リポジトリ統計取得
   */
  static async getRepoStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { owner, repo } = req.params;

    try {
      console.log(`[ReCheckController] Getting stats for ${owner}/${repo}`);
      
      const stats = await ReCheckService.getRepoStats(owner, repo);
      
      res.status(200).json({
        success: true,
        data: stats,
      });
      
    } catch (error) {
      console.error(`[ReCheckController] Error getting stats for ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * GET /api/recheck/:owner/:repo/settings
   * リポジトリ設定取得
   */
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { owner, repo } = req.params;

    try {
      console.log(`[ReCheckController] Getting settings for ${owner}/${repo}`);
      
      const settings = await ReCheckService.getSettings(owner, repo);
      
      res.status(200).json({
        success: true,
        data: settings,
      });
      
    } catch (error) {
      console.error(`[ReCheckController] Error getting settings for ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * PUT /api/recheck/:owner/:repo/settings
   * リポジトリ設定更新
   */
  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    const { owner, repo } = req.params;
    const settings = req.body;

    try {
      console.log(`[ReCheckController] Updating settings for ${owner}/${repo}`, settings);
      
      // バリデーション
      if (settings.rateLimitMinutes !== undefined && (settings.rateLimitMinutes < 1 || settings.rateLimitMinutes > 60)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_RATE_LIMIT',
            message: 'Rate limit must be between 1 and 60 minutes',
          },
        });
      }
      
      if (settings.maxConcurrentExecutions !== undefined && (settings.maxConcurrentExecutions < 1 || settings.maxConcurrentExecutions > 5)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CONCURRENT_LIMIT',
            message: 'Max concurrent executions must be between 1 and 5',
          },
        });
      }
      
      if (settings.timeoutMinutes !== undefined && (settings.timeoutMinutes < 1 || settings.timeoutMinutes > 30)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TIMEOUT',
            message: 'Timeout must be between 1 and 30 minutes',
          },
        });
      }
      
      const updatedSettings = await ReCheckService.updateSettings(owner, repo, settings);
      
      res.status(200).json({
        success: true,
        message: getMessage('SUCCESS.SETTINGS_UPDATED', `${owner}/${repo}`),
        data: updatedSettings,
      });
      
    } catch (error) {
      console.error(`[ReCheckController] Error updating settings for ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * POST /api/recheck/maintenance/timeout
   * タイムアウト処理（メンテナンス用）
   */
  static async handleTimeouts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log('[ReCheckController] Running timeout maintenance');
      
      const timeoutCount = await ReCheckService.handleTimeouts();
      
      res.status(200).json({
        success: true,
        message: `Processed ${timeoutCount} timeout executions`,
        data: { timeoutCount },
      });
      
    } catch (error) {
      console.error('[ReCheckController] Error handling timeouts:', error);
      next(error);
    }
  }

  /**
   * POST /api/recheck/maintenance/cleanup
   * 古い履歴のクリーンアップ（メンテナンス用）
   */
  static async cleanupOldRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { retentionDays = 30 } = req.body;

    try {
      console.log(`[ReCheckController] Running cleanup maintenance (${retentionDays} days retention)`);
      
      const deletedCount = await ReCheckService.cleanupOldRecords(parseInt(String(retentionDays)));
      
      res.status(200).json({
        success: true,
        message: `Cleaned up ${deletedCount} old records`,
        data: { deletedCount, retentionDays },
      });
      
    } catch (error) {
      console.error('[ReCheckController] Error cleaning up old records:', error);
      next(error);
    }
  }
}

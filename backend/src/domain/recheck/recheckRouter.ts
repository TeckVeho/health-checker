import Router from 'express-promise-router';
import { ReCheckController } from './recheckController';

const router = Router();

// Global ReCheck実行エンドポイント
router.post('/global', ReCheckController.executeGlobalRecheck);

// ReCheck実行エンドポイント
router.post('/:owner/:repo', ReCheckController.executeRecheck);

// ReCheck状態取得エンドポイント
router.get('/:owner/:repo/status', ReCheckController.getRecheckStatus);

// ReCheck実行履歴取得エンドポイント
router.get('/:owner/:repo/history', ReCheckController.getExecutionHistory);

// リポジトリ統計取得エンドポイント
router.get('/:owner/:repo/stats', ReCheckController.getRepoStats);

// リポジトリ設定取得エンドポイント
router.get('/:owner/:repo/settings', ReCheckController.getSettings);

// リポジトリ設定更新エンドポイント
router.put('/:owner/:repo/settings', ReCheckController.updateSettings);

// メンテナンス用エンドポイント
router.post('/maintenance/timeout', ReCheckController.handleTimeouts);
router.post('/maintenance/cleanup', ReCheckController.cleanupOldRecords);

export default router;

import Router from 'express-promise-router';
import { ReCheckController } from './recheckController';

const router = Router();

// Global ReCheck execution endpoint
router.post('/global', ReCheckController.executeGlobalRecheck);

// ReCheck execution endpoint
router.post('/:owner/:repo', ReCheckController.executeRecheck);

// ReCheck status retrieval endpoint
router.get('/:owner/:repo/status', ReCheckController.getRecheckStatus);

// ReCheck execution history retrieval endpoint
router.get('/:owner/:repo/history', ReCheckController.getExecutionHistory);

// Repository statistics retrieval endpoint
router.get('/:owner/:repo/stats', ReCheckController.getRepoStats);

// Repository settings retrieval endpoint
router.get('/:owner/:repo/settings', ReCheckController.getSettings);

// Repository settings update endpoint
router.put('/:owner/:repo/settings', ReCheckController.updateSettings);

// Maintenance endpoints
router.post('/maintenance/timeout', ReCheckController.handleTimeouts);
router.post('/maintenance/cleanup', ReCheckController.cleanupOldRecords);

export default router;

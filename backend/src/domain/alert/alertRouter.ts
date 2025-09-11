import Router from 'express-promise-router';
import AlertController from './alertController';

const router = Router();

// Author-based routes
router.get('/by-author', AlertController.getAlertsByAuthor);
router.get('/authors/:author', AlertController.getAlertsBySpecificAuthor);
router.post('/backfill-authors', AlertController.backfillAuthors);

// Existing routes
router.post('/check/:owner', AlertController.checkStoredRepos);
router.post('/check/:owner/:repo', AlertController.runManualAlert);
router.post('/summary', AlertController.getSummary);
router.post('/summary-by-checktype', AlertController.getCheckTypeSummary);
router.get('/:owner/:repo', AlertController.listRepoAlerts);

export default router;

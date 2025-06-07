import Router from 'express-promise-router';
import AlertController from './alertController';

const router = Router();


router.post('/check/:owner', AlertController.checkStoredRepos);
router.post('/check/:owner/:repo', AlertController.runManualAlert);
router.post('/summary', AlertController.getSummary);
router.get('/:owner/:repo', AlertController.listRepoAlerts);

export default router;

import { Router } from 'express';
import repoRouter from './domain/repo/repoRouter';
import alertRouter from './domain/alert/alertRouter';
import githubActionRouter from './domain/githubAction/githubActionRouter';
import recheckRouter from './domain/recheck/recheckRouter';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});
router.use('/repos', repoRouter);
router.use('/alerts', alertRouter);
router.use('/github-action', githubActionRouter);
router.use('/recheck', recheckRouter);
export default router;

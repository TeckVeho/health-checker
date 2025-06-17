import { Router } from 'express';
import repoRouter from './domain/repo/repoRouter';
import alertRouter from './domain/alert/alertRouter';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});
router.use('/repos', repoRouter);
router.use('/alerts', alertRouter);

export default router;

// src/routes/index.ts

import { Router } from 'express';
import repoRouter from './domain/repo/repoRouter';
import alertRouter from './domain/alert/alertRouter';
const router = Router();

router.use('/repos', repoRouter);
router.use('/alerts', alertRouter);
export default router;

import Router from 'express-promise-router';
import GithubActionController from './githubActionController';

const router = Router();

// PRレビューのエントリポイント（GitHub Actionsからキックされる）
router.post('/prreview', GithubActionController.reviewPullRequest);

export default router;

import Router from 'express-promise-router';
import GithubActionController from './githubActionController';

const router = Router();

// PR review entry point (triggered from GitHub Actions)
router.post('/prreview', GithubActionController.reviewPullRequest);

export default router;

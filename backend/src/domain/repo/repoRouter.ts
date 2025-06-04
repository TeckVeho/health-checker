import Router from 'express-promise-router';
import RepoController from './repoController';

const router = Router();

router.get('/', RepoController.getAllRepos);
router.get('/:id', RepoController.getRepoById);
//router.post('/', RepoController.createRepo);
//router.put('/:id', RepoController.updateRepo);
//router.delete('/:id', RepoController.deleteRepo);

router.post('/sync/:owner', RepoController.syncRepos);

export default router;

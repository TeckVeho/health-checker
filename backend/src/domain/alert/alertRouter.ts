import Router from 'express-promise-router';
import AlertController from './alertController';

const router = Router();


// ② DB保存済みの複数リポジトリのヘルスチェック（条件付き）
router.post('/check/:owner', AlertController.checkStoredReposSummary);

// ③ 特定リポジトリのヘルスチェック
router.post('/check/:owner/:repo', AlertController.runManualAlert);

router.post('/summary', AlertController.getSummary);


export default router;

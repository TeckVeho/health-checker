import { Request, Response, NextFunction } from 'express';
import AlertService from './alertService';
import getMessage from '../../utils/message';
import { z } from 'zod';




const RepoListSchema = z.array(
  z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
  })
);



class AlertController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const repoList = RepoListSchema.parse(req.body);
      const summary = await AlertService.getSeveritySummary(repoList);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching health summary:', error);
      next(error);
    }
  }

  static async getCheckTypeSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const repoList = RepoListSchema.parse(req.body);
      const summary = await AlertService.getSummary(repoList);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching check type summary:', error);
      next(error);
    }
  }

  /**
   * POST /check/repos
   * 指定オーナーの保存済みリポジトリに対して一括ヘルスチェックを実行
   */
  static async checkStoredRepos(req: Request, res: Response, next: NextFunction) {
    const owner = req.params.owner;

    if (!owner) {
      return res.status(400).json({ message: 'Missing required field: owner' });
    }

    try {
      const results = await AlertService.checkStoredRepos(owner);
      res.status(200).json({
        message: getMessage('SUCCESS.CHECK_SUCCESS', 'repositories'),
        results,
      });
    } catch (error) {
      console.error('Error checking stored repos:', error);
      next(error);
    }
  }

  /**
   * POST /check/:owner/:repo
   * 特定のリポジトリに対して指定された種類のヘルスチェックを実行
   */
  static async runManualAlert(req: Request, res: Response, next: NextFunction) {
    const { owner, repo } = req.params;
    const { checks = [] } = req.body;

    try {
      const result = await AlertService.runAlert({
        owner,
        repo,
        checks,
      });

      res.status(200).json({
        message: getMessage('SUCCESS.CHECK_SUCCESS', `${owner}/${repo}`),
        result,
      });
    } catch (error) {
      console.error(`Error checking ${owner}/${repo}:`, error);
      next(error);
    }
  }

  /**
   * GET /:owner/:repo
   * 指定されたリポジトリのアラート一覧を取得
   */
  static async listRepoAlerts(req: Request, res: Response, next: NextFunction) {
    const { owner, repo } = req.params;

    if (!owner || !repo) {
      return res.status(400).json({ message: 'Missing required fields: owner and repo' });
    }

    try {
      const alerts = await AlertService.getAlertsByRepo(owner, repo);
      res.status(200).json({
        message: getMessage('SUCCESS.FETCH_SUCCESS', `${owner}/${repo}`),
        alerts,
      });
    } catch (error) {
      console.error(`Error fetching alerts for ${owner}/${repo}:`, error);
      next(error);
    }
  }
}

export default AlertController;

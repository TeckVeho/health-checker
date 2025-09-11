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

  /**
   * GET /by-author
   * Get alerts grouped by issue author
   */
  static async getAlertsByAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        owner,
        repo,
        sortBy = 'totalAlerts',
        sortOrder = 'desc',
        page = '1',
        limit = '50'
      } = req.query;

      // Validate parameters
      const validSortBy = ['totalAlerts', 'author', 'lastActivity'];
      if (sortBy && !validSortBy.includes(sortBy as string)) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: `Invalid sortBy field. Must be one of: ${validSortBy.join(', ')}`
        });
      }

      const validSortOrder = ['asc', 'desc'];
      if (sortOrder && !validSortOrder.includes(sortOrder as string)) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: 'Invalid sortOrder. Must be asc or desc'
        });
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: 'Page must be a positive integer'
        });
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: 'Limit must be between 1 and 100'
        });
      }

      const result = await AlertService.getAlertsByAuthor({
        owner: owner as string,
        repo: repo as string,
        sortBy: sortBy as 'totalAlerts' | 'author' | 'lastActivity',
        sortOrder: sortOrder as 'asc' | 'desc',
        page: pageNum,
        limit: limitNum
      });

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching alerts by author:', error);
      next(error);
    }
  }

  /**
   * GET /authors/:author
   * Get alerts for a specific author
   */
  static async getAlertsBySpecificAuthor(req: Request, res: Response, next: NextFunction) {
    try {
      const { author } = req.params;
      const { severity, checkType } = req.query;

      if (!author) {
        return res.status(400).json({
          error: 'MISSING_PARAMETER',
          message: 'Author parameter is required'
        });
      }

      // Validate severity if provided
      const validSeverities = ['high', 'middle', 'low'];
      if (severity && !validSeverities.includes(severity as string)) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
        });
      }

      // Validate checkType if provided
      const validCheckTypes = ['Issue', 'Branch', 'Security', 'Test', 'Performance', 'Action'];
      if (checkType && !validCheckTypes.includes(checkType as string)) {
        return res.status(400).json({
          error: 'INVALID_PARAMETER',
          message: `Invalid checkType. Must be one of: ${validCheckTypes.join(', ')}`
        });
      }

      const result = await AlertService.getAlertsBySpecificAuthor(author, {
        severity: severity as string,
        checkType: checkType as string
      });

      if (result.issues.length === 0 && author !== 'Unknown Author') {
        return res.status(404).json({
          error: 'AUTHOR_NOT_FOUND',
          message: `Author '${author}' not found or has no alerts`
        });
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error fetching alerts for specific author:', error);
      next(error);
    }
  }

  /**
   * POST /backfill-authors
   * Backfill author data for existing alerts
   */
  static async backfillAuthors(req: Request, res: Response, next: NextFunction) {
    try {
      const { owner, repo, batchSize } = req.body;

      // Validate batchSize if provided
      if (batchSize !== undefined) {
        const batchNum = parseInt(batchSize, 10);
        if (isNaN(batchNum) || batchNum < 1 || batchNum > 100) {
          return res.status(400).json({
            error: 'INVALID_PARAMETER',
            message: 'Batch size must be between 1 and 100'
          });
        }
      }

      const result = await AlertService.backfillAuthors({
        owner,
        repo,
        batchSize: batchSize ? parseInt(batchSize, 10) : undefined
      });

      res.status(202).json(result);
    } catch (error) {
      console.error('Error starting author backfill:', error);
      res.status(500).json({
        error: 'BACKFILL_ERROR',
        message: 'Failed to start author backfill job'
      });
    }
  }
}

export default AlertController;

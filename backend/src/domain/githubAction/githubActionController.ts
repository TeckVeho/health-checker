import { Request, Response, NextFunction } from 'express';
import GithubActionService from './githubActionService';
import getMessage from '../../utils/message';

class GithubActionController {
  /**
   * POST /prreview
   * Handles a pull request review request triggered by GitHub Actions.
   * Expected body: { owner: string, repo: string, pull_number: number }
   */
  static async reviewPullRequest(req: Request, res: Response, next: NextFunction) {
    const { owner, repo, pullNumber } = req.body;

    try {
      if (!owner || !repo || !pullNumber) {
        return res.status(400).json({
          error: getMessage('ERROR.MISSING_PARAMS', 'owner, repo, id'),
        });
      }

      const result = await GithubActionService.reviewPullRequest(owner, repo, pullNumber);

      res.status(200).json({
        message: getMessage('SUCCESS.REVIEW_SUCCESS', 'pull request'),
        reviewResult: result,
      });
    } catch (error) {
      console.error('Error reviewing pull request:', error);
      next(error);
    }
  }
}

export default GithubActionController;

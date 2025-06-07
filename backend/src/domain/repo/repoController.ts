// src/features/repo/repoController.ts

import { Request, Response, NextFunction } from 'express';
import RepoService from './repoService';
import getMessage from '../../utils/message';

class RepoController {
  static async getAllRepos(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const sort = (req.query.sort as string) || 'createdAt';

      const result = await RepoService.getAllRepos({ page, limit, sort });
      res.json(result);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      next(error);
    }
  }
  static async getRepoById(req: Request, res: Response, next: NextFunction) {
    try {
      const repo = await RepoService.getRepoById(parseInt(req.params.id, 10));
      if (!repo) {
        return res.status(404).json({ error: getMessage('ERROR.NOT_FOUND', 'repository') });
      }
      res.json(repo);
    } catch (error) {
      console.error('Error fetching repository:', error);
      next(error);
    }
  }

  static async createRepo(req: Request, res: Response, next: NextFunction) {
    const { name, owner, description, topics, isPrivate } = req.body;

    try {
      const repoId = await RepoService.createRepo({
        name,
        owner,
        description,
        topics,
        isPrivate,
      });
      res.status(201).json({
        id: repoId,
        name,
        owner,
        description,
        topics,
        isPrivate,
        createdAt: new Date(),
        updatedAt: new Date(),
        message: getMessage('SUCCESS.CREATE_SUCCESS', 'repository'),
      });
    } catch (error) {
      if (error instanceof Error && error.message === getMessage('ERROR.NAME_TAKEN', name)) {
        return res.status(400).json({ error: getMessage('ERROR.NAME_TAKEN', name) });
      }
      console.error('Error creating repository:', error);
      next(error);
    }
  }

  static async updateRepo(req: Request, res: Response, next: NextFunction) {
    const updates = req.body;

    try {
      const updated = await RepoService.updateRepo(parseInt(req.params.id, 10), updates);
      if (!updated) {
        return res.status(404).json({ error: getMessage('ERROR.NOT_FOUND', 'repository') });
      }

      const updatedRepo = await RepoService.getRepoById(parseInt(req.params.id, 10));
      res.status(200).json({
        message: getMessage('SUCCESS.UPDATE_SUCCESS', 'repository'),
        repository: updatedRepo,
      });
    } catch (error) {
      if (error instanceof Error && error.message === getMessage('ERROR.NAME_TAKEN', updates.name)) {
        return res.status(400).json({ error: getMessage('ERROR.NAME_TAKEN', updates.name) });
      }
      console.error('Error updating repository:', error);
      next(error);
    }
  }

  static async deleteRepo(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await RepoService.deleteRepo(parseInt(req.params.id, 10));
      if (!deleted) {
        return res.status(404).json({ error: getMessage('ERROR.NOT_FOUND', 'repository') });
      }
      res.status(204).json({ message: getMessage('SUCCESS.DELETE_SUCCESS', 'repository') });
    } catch (error) {
      console.error('Error deleting repository:', error);
      next(error);
    }
  }

  /**
   * POST /sync/:owner
   * GitHubのリポジトリを取得しDBに保存
   */
  static async syncRepos(req: Request, res: Response, next: NextFunction) {
    const { owner } = req.params;

    try {
      const savedRepos = await RepoService.syncReposFromGithub(owner);

      res.status(201).json({
        message: getMessage('SUCCESS.SYNC_SUCCESS', 'repositories'),
        count: savedRepos.length,
        repositories: savedRepos,
      });
    } catch (error) {
      console.error('Error syncing GitHub repos:', error);
      next(error);
    }
  }
}

export default RepoController;

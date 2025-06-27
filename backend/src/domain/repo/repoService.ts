// src/features/repo/repoService.ts

import Repo from './repoModel';
import {Op, UniqueConstraintError} from 'sequelize';
import getMessage from '../../utils/message';
import { Octokit } from '@octokit/rest';
import { InferAttributes } from 'sequelize';
import { graphql } from '@octokit/graphql';
import CommonUtils from '../../utils/CommonUtils'


const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');
const octokit = new Octokit({
  auth: githubToken,
  request: {
    headers: { accept: 'application/vnd.github+json' },
  },
});
type RepoData = InferAttributes<Repo>;
type RepoQueryParams = {
  page: number;
  limit: number;
  sort: string;
};

class RepoService {
  private static readonly repoAttributes = ['id', 'name', 'owner', 'description', 'topics', 'isPrivate', 'lastCommitAt', 'lastIssueCreatedAt', 'lastPrCreatedAt', 'pushedAt', 'lastActivityAt', 'createdAt', 'updatedAt'];

  static async getAllRepos({ page, limit, sort }: RepoQueryParams): Promise<{
    data: Repo[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;
    const isSortByActivity = sort === 'last_activity_at';

    const { rows: data, count: total } = await Repo.findAndCountAll({
      attributes: this.repoAttributes,
      offset,
      limit,
      order: isSortByActivity ? [['lastActivityAt', 'DESC']] : [[sort, 'DESC']],
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getRepoById(id: number): Promise<Repo | null> {
    return Repo.findByPk(id, {
      attributes: this.repoAttributes,
    });
  }

  static async createRepo(repoData: { name: string; owner: string; description?: string; topics?: string[]; isPrivate?: boolean,sp?:number }): Promise<number> {
    try {
      const repo = await Repo.create(repoData);
      return repo.id!;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new Error(getMessage('ERROR.NAME_TAKEN', repoData.name));
      }
      throw error;
    }
  }

  static async updateRepo(
    id: number,
    repoData: Partial<{
      name: string;
      owner: string;
      description?: string;
      topics?: string[];
      isPrivate?: boolean;
    }>
  ): Promise<boolean> {
    try {
      const [affectedRows] = await Repo.update(repoData, {
        where: { id },
      });
      return affectedRows > 0;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new Error(getMessage('ERROR.NAME_TAKEN', repoData.name!));
      }
      throw error;
    }
  }

  static async deleteRepo(id: number): Promise<boolean> {
    const deletedRows = await Repo.destroy({
      where: { id },
    });
    if (deletedRows === 0) {
      throw new Error(getMessage('ERROR.NOT_FOUND', 'repository'));
    }
    return true;
  }

  static async isNameUnique(name: string, idToExclude?: number): Promise<boolean> {
    const repo = await Repo.findOne({
      where: { name },
    });
    if (repo && repo.id !== idToExclude) {
      return false;
    }
    return true;
  }
  static async syncReposFromGithub(owner: string): Promise<RepoData[]> {
    const insertedRepos: RepoData[] = [];

    const repos = await octokit.paginate(octokit.repos.listForOrg, {
      org: owner,
      per_page: 100, // eslint-disable-line @typescript-eslint/naming-convention
      type: 'all',
    });

    for (const repo of repos) {
      console.log(`Sync ${repo.owner.login}/${repo.name}`);
      try {
        const { data: fullRepo } = await octokit.repos.get({
          owner: repo.owner.login,
          repo: repo.name,
        });

        const topics = fullRepo.topics || [];
        const pushedAt = fullRepo.pushed_at ? new Date(fullRepo.pushed_at) : null;

        let lastCommitAt: Date | null = null;
        try {
          const commits = await octokit.repos.listCommits({
            owner: repo.owner.login,
            repo: repo.name,
            per_page: 1, // eslint-disable-line @typescript-eslint/naming-convention
          });
          lastCommitAt = commits.data?.[0]?.commit?.committer?.date ? new Date(commits.data[0].commit.committer.date) : null;
        } catch (err) {
          console.warn(`⚠️ Failed to fetch commits for ${repo.name}`, err);
        }

        let lastIssueCreatedAt: Date | null = null;
        try {
          const issues = await octokit.issues.listForRepo({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'all',
            per_page: 5, // eslint-disable-line @typescript-eslint/naming-convention
            sort: 'created',
            direction: 'desc',
          });
          const firstNonPR = issues.data.find((issue) => !issue.pull_request);
          lastIssueCreatedAt = firstNonPR?.created_at ? new Date(firstNonPR.created_at) : null;
        } catch (err) {
          console.warn(`⚠️ Failed to fetch issues for ${repo.name}`, err);
        }

        let lastPrCreatedAt: Date | null = null;
        try {
          const pulls = await octokit.pulls.list({
            owner: repo.owner.login,
            repo: repo.name,
            state: 'all',
            per_page: 1, // eslint-disable-line @typescript-eslint/naming-convention
            sort: 'created',
            direction: 'desc',
          });
          lastPrCreatedAt = pulls.data?.[0]?.created_at ? new Date(pulls.data[0].created_at) : null;
        } catch (err) {
          console.warn(`⚠️ Failed to fetch PRs for ${repo.name}`, err);
        }

        // Compute latest activity
        const lastActivityAt = [lastCommitAt, lastIssueCreatedAt, lastPrCreatedAt, pushedAt].filter((d): d is Date => d instanceof Date).sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

        const existing = await Repo.findOne({
          where: {
            owner: fullRepo.owner.login,
            name: fullRepo.name,
          },
        });

        if (existing) {
          await existing.update({
            description: fullRepo.description ?? '',
            topics,
            isPrivate: fullRepo.private,
            lastCommitAt,
            lastIssueCreatedAt,
            lastPrCreatedAt,
            pushedAt,
            lastActivityAt,
          });
          insertedRepos.push(existing.toJSON() as RepoData);
        } else {
          const created = await Repo.create({
            name: fullRepo.name,
            owner: fullRepo.owner.login,
            description: fullRepo.description ?? '',
            topics,
            isPrivate: fullRepo.private,
            lastCommitAt,
            lastIssueCreatedAt,
            lastPrCreatedAt,
            pushedAt,
            lastActivityAt,
          });
          insertedRepos.push(created.toJSON() as RepoData);
        }
      } catch (err) {
        console.error(`❌ Failed to process repo: ${repo.name}`, err);
      }
    }
    return insertedRepos;
  }
}

export default RepoService;

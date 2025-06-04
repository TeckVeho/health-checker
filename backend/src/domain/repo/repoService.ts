// src/features/repo/repoService.ts

import Repo from './repoModel';
import { UniqueConstraintError, QueryTypes } from 'sequelize';
import sequelize from '@config/database';
import getMessage from '@utils/message';
import { Octokit } from '@octokit/rest';
import { InferAttributes } from 'sequelize';

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
      order: isSortByActivity
        ? [['lastActivityAt', 'DESC']]
        : [[sort, 'DESC']],
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

  static async getHealthSummary(repoList: { owner: string; repo: string }[]): Promise<Record<string, Record<string, number>>> {
    if (repoList.length === 0) return {};

    const conditions = repoList.map(({ owner, repo }) => `('${owner}', '${repo}')`).join(', ');

    const results = await sequelize.query<{
      owner: string;
      repo: string;
      checkType: string;
      count: number;
    }>(
      `
      SELECT
        owner,
        repo,
        check_type AS "checkType",
        COUNT(*) AS count
      FROM alerts
      WHERE (owner, repo) IN (${conditions}) and is_ignored = false
      GROUP BY owner, repo, check_type
      `,
      { type: QueryTypes.SELECT }
    );

    const summary: Record<string, Record<string, number>> = {};

    for (const row of results) {
      const key = `${row.owner}/${row.repo}`;
      if (!summary[key]) summary[key] = {};
      summary[key][row.checkType] = Number(row.count);
    }

    return summary;
  }

  static async getRepoById(id: number): Promise<Repo | null> {
    return Repo.findByPk(id, {
      attributes: this.repoAttributes,
    });
  }

  static async createRepo(repoData: { name: string; owner: string; description?: string; topics?: string[]; isPrivate?: boolean }): Promise<number> {
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

        const [record] = await Repo.upsert({
          name: fullRepo.name,
          owner: fullRepo.owner.login,
          description: fullRepo.description ?? '',
          topics,
          isPrivate: fullRepo.private,
          lastCommitAt,
          lastIssueCreatedAt,
          lastPrCreatedAt,
          pushedAt,
        });

        insertedRepos.push(record.toJSON() as RepoData);
      } catch (err) {
        console.error(`❌ Failed to process repo: ${repo.name}`, err);
      }
    }

    return insertedRepos;
  }
}

export default RepoService;

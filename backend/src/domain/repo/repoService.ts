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
  static async syncReposFromGithubWithProjectId(params: {
    owner: string;
    projectId?: number; // projectNumber (not project_id)
  }) {
    const { owner, projectId: projectNumber } = params;
    const graphqlWithAuth = graphql.defaults({
      headers: { authorization: `token ${githubToken}` },
    });

    const insertedRepos: RepoData[] = [];
    if (projectNumber){
      return await this.syncReposFromGithubFollowProjectNumber(owner,projectNumber,graphqlWithAuth,insertedRepos);
    }else {
      return await this.syncReposFromGithubFollowAllProjectNumber(owner,graphqlWithAuth,insertedRepos);
    }

  }
  private static  async syncReposFromGithubFollowProjectNumber(  owner: string, projectNumber: number, graphqlWithAuth: any, insertedRepos: RepoData[]){
    const queryGraphql = CommonUtils.getGraphQLQuery('project_number');
    const result = await graphqlWithAuth(queryGraphql, {
      org: owner,
      number: projectNumber,
    }) as {
      organization: {
        projectV2: {
          items: {
            nodes: any[];
          };
        };
      };
    };
    const items = result.organization.projectV2.items?.nodes ?? [];
    if (items.length === 0) {
      console.warn(`⚠️ No items found in project ${projectNumber} of ${owner}`);
      return insertedRepos;
    }
    const lastContent = items.find(i => i.content?.__typename === 'Issue')?.content?.repository;
    const existingRepo = await Repo.findOne({
      where: {
        name: lastContent.name,
        owner: lastContent.owner.login,
      },
    });
    const repoData = {
      name: lastContent.name,
      owner: lastContent.owner.login,
      description: lastContent.description ?? '',
      topics: lastContent.repositoryTopics?.nodes?.map((n: { topic?: { name?: string } }) => n.topic?.name).filter(Boolean) ?? [],
      isPrivate: lastContent.isPrivate,
      sp: projectNumber,
    };

    if (existingRepo) {
      await this.updateRepo(existingRepo.id, repoData);
    } else {
      await this.createRepo(repoData);
    }

    return insertedRepos;
  }
  private static async syncReposFromGithubFollowAllProjectNumber(
      owner: string,
      graphqlWithAuth: any,
      insertedRepos: RepoData[],
  ) {
    const query = CommonUtils.getGraphQLQuery('all_project_number');
    let projectNodes: any[] = [];

    try {
      const allProjectsRes = await graphqlWithAuth(query, { org: owner });
      projectNodes = allProjectsRes.organization.projectsV2.nodes;
    } catch (err) {
      console.warn(`❌ Failed to fetch all projects for ${owner}:`, err);
      return insertedRepos;
    }

    const result: {
      projectNumber: number;
      projectTitle: string;
      repositoryName: string;
    }[] = [];

    for (const project of projectNodes) {
      if (!project.id) continue;

      let allItems: any[] = [];
      try {
        allItems = await this.fetchAllItemsForProject(project.id, graphqlWithAuth);
      } catch (err) {
        console.warn(`❌ Failed to fetch items for project ${project.number}:`, err);
        continue;
      }

      const issueItems = this.extractIssueItems(allItems);
      const repoMap = this.buildRepoMapFromIssues(issueItems, owner);

      try {
        await this.saveLastIssueRepo(issueItems, project.number);
      } catch (err) {
        console.warn(`❌ Failed to save last issue repo in project ${project.number}:`, err);
      }

      for (const [repoName, repoInfo] of repoMap.entries()) {
        result.push({
          projectNumber: project.number,
          projectTitle: project.title,
          repositoryName: repoName,
        });

        try {
          await this.saveOrUpdateRepo({
            ...repoInfo,
            sp: project.number,
          });
        } catch (err) {
          console.warn(`❌ Failed to saveOrUpdate repo ${repoName} in project ${project.number}:`, err);
        }
      }
    }

    return insertedRepos;
  }

  private static async fetchAllItemsForProject(
      projectId: string,
      graphqlWithAuth: any
  ): Promise<any[]> {
    const query = CommonUtils.getGraphQLQuery('pagination_project_number');
    let allItems: any[] = [];
    let afterCursor: string | null = null;
    let hasNextPage = true;

    try {
      while (hasNextPage) {
        const response: any = await graphqlWithAuth(query, {
          projectId,
          after: afterCursor,
        });

        const items = response?.node?.items?.nodes || [];
        allItems.push(...items);

        hasNextPage = response.node.items.pageInfo.hasNextPage;
        afterCursor = response.node.items.pageInfo.endCursor;
      }
    } catch (err) {
      console.warn(`❌ Error in fetchAllItemsForProject(${projectId}):`, err);
      throw err; // propagate để hàm gọi có thể xử lý
    }

    return allItems;
  }

  private static extractIssueItems(allItems: any[]): any[] {
    return allItems.filter(
        item =>
            item.content?.__typename === 'Issue' &&
            item.content.repository?.name
    );
  }

  private static buildRepoMapFromIssues(issueItems: any[], defaultOwner: string): Map<string, any> {
    const repoMap = new Map<string, any>();

    for (const item of issueItems) {
      const repo = item.content.repository;
      if (!repo?.name) continue;

      const repoKey = repo.name;
      if (!repoMap.has(repoKey)) {
        repoMap.set(repoKey, {
          name: repo.name,
          owner: repo.owner?.login ?? defaultOwner,
          description: repo.description ?? '',
          topics:
              repo.repositoryTopics?.nodes
                  ?.map((n: { topic?: { name?: string } }) => n.topic?.name)
                  .filter(Boolean) ?? [],
          isPrivate: repo.isPrivate ?? false,
        });
      }
    }

    return repoMap;
  }

  private static async saveLastIssueRepo(issueItems: any[], projectNumber: number) {
    const lastRepo = issueItems.at(-1)?.content?.repository;
    if (!lastRepo?.name || !lastRepo.owner?.login) return;

    const repoData = {
      name: lastRepo.name,
      owner: lastRepo.owner.login,
      description: lastRepo.description ?? '',
      topics: lastRepo.repositoryTopics?.nodes
          ?.map((n: { topic?: { name?: string } }) => n.topic?.name)
          .filter(Boolean) ?? [],
      isPrivate: lastRepo.isPrivate,
      sp: projectNumber,
    };

    try {
      await this.saveOrUpdateRepo(repoData as any);
    } catch (err) {
      console.warn(`❌ Failed in saveLastIssueRepo (project ${projectNumber}, repo ${repoData.name}):`, err);
      throw err;
    }
  }

  private static async saveOrUpdateRepo(repoData: RepoData & { sp: number }) {
    try {
      const existingRepo = await Repo.findOne({
        where: {
          name: repoData.name,
          owner: repoData.owner,
        },
      });

      if (existingRepo) {
        await this.updateRepo(existingRepo.id, repoData);
      } else {
        await this.createRepo(repoData);
      }
    } catch (err) {
      console.warn(`❌ Failed in saveOrUpdateRepo (repo: ${repoData.name}):`, err);
      throw err;
    }
  }

}

export default RepoService;

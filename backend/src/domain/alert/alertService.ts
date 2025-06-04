
import Repo from '../repo/repoModel';
import { cloneRepo } from './util/cloneRepo';
import { gitleaksScanner } from './util/gitleaksScanner';
import { checkBranches } from './util/checkBranches';
import sequelize from '@config/database';
import { QueryTypes } from 'sequelize';

type ManualCheckOptions = {
  owner: string;
  repo: string;
  checks: string[];
};

class AlertService {
  static async getSummary(repoList: { owner: string; repo: string }[]): Promise<Record<string, Record<string, number>>> {
    if (repoList.length === 0) return {};

    const replacements: string[] = [];
    const conditionClauses = repoList
      .map(({ owner, repo }) => {
        replacements.push(owner, repo);
        return `(?, ?)`;
      })
      .join(', ');

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
      WHERE (owner, repo) IN (${conditionClauses}) AND is_ignored = false
      GROUP BY owner, repo, check_type
      `,
      {
        type: QueryTypes.SELECT,
        replacements,
      }
    );

    const summary: Record<string, Record<string, number>> = {};
    for (const row of results) {
      const key = `${row.owner}/${row.repo}`;
      if (!summary[key]) summary[key] = {};
      summary[key][row.checkType] = Number(row.count);
    }

    return summary;
  }

  static async checkStoredRepos(owner: string): Promise<Record<string, unknown>[]> {
    const repos = await Repo.findAll({ where: { owner } });

    const results: Record<string, unknown>[] = [];

    for (const repo of repos) {
      try {
        await cloneRepo(repo.owner, repo.name);
        const gitleaksResult = await gitleaksScanner(repo.owner, repo.name);

        results.push({
          repo: repo.name,
          status: 'scanned',
          gitleaksResult,
        });
      } catch (err) {
        console.error(`❌ Failed to process ${repo.name}`, err);
        results.push({
          repo: repo.name,
          status: 'error',
          error: (err as Error).message,
        });
      }
    }

    return results;
  }

  static async runAlert(options: ManualCheckOptions): Promise<Record<string, unknown>> {
    const { owner, repo } = options;
    await checkBranches(owner, repo);
    //await cloneRepo(owner, repo);
    //await gitleaksScanner(owner, repo);
    return {
      status: 'cloned',
    };
  }
}

export default AlertService;

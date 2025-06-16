
import Repo from '../repo/repoModel';
import { cloneRepo } from './util/cloneRepo';
import { gitleaksScanner } from './util/gitleaksScanner';
import { checkBranches } from './util/checkBranches';
import sequelize from '../../config/database';
import { QueryTypes, Op } from 'sequelize';
import Alert from './alertModel';
import { subDays } from 'date-fns'; 

type ManualCheckOptions = {
  owner: string;
  repo: string;
  checks: string[];
};

class AlertService {
  static async getAlertsByRepo(owner: string, repo: string) {
    const alerts = await Alert.findAll({
      where: {
        owner,
        repo,
      },
      order: [['createdAt', 'DESC']],
    });

    return alerts;
  }
  static async getSeveritySummary(repoList: { owner: string; repo: string }[]): Promise<Record<string, Record<string, number>>> {
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
      severity: string;
      count: number;
    }>(
      `
      SELECT
        owner,
        repo,
        severity,
        COUNT(*) AS count
      FROM alerts
      WHERE (owner, repo) IN (${conditionClauses}) AND is_ignored = false
      GROUP BY owner, repo, severity
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
      summary[key][row.severity] = Number(row.count);
    }

    return summary;
  }

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

  static async checkStoredRepos(owner: string, activeWithinDays?: number): Promise<Record<string, unknown>[]> {
    const whereClause: any = { owner };
    activeWithinDays = 14;
    if (activeWithinDays !== undefined) {
      const cutoffDate = subDays(new Date(), activeWithinDays);
      whereClause.last_activity_at = { [Op.gte]: cutoffDate };
    }

    const repos = await Repo.findAll({ where: whereClause });

    const results: Record<string, unknown>[] = [];

    for (const repo of repos) {
      try {
        await cloneRepo(repo.owner, repo.name);
        await checkBranches(repo.owner, repo.name);
        await cloneRepo(repo.owner, repo.name);
        await gitleaksScanner(repo.owner, repo.name);

        results.push({
          repo: repo.name,
          status: 'scanned',
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
    const { owner, repo, checks } = options;

    const results: Record<string, unknown> = {};

    if (!checks || checks.includes('branch')) {
      await checkBranches(owner, repo);
      results.branch = 'checked';
    }

    if (!checks || checks.includes('clone')) {
      await cloneRepo(owner, repo);
      results.clone = 'done';
    }

    if (!checks || checks.includes('gitleaks')) {
      await gitleaksScanner(owner, repo);
      results.gitleaks = 'done';
    }

    return results;
  }
}

export default AlertService;

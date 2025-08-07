import { Model } from 'sequelize';
import sequelize from '../../config/database';
import { repoAttributes, repoModelOptions } from '../repo/repoSchema';
import { alertAttributes, alertModelOptions } from './alertSchema';
import { cloneRepo } from './util/cloneRepo';
import { gitleaksScanner } from './util/gitleaksScanner';
import { auditScanner } from './util/auditScanner';
import { checkBranches, type AlertCandidate } from './util/checkBranches';
import { checkIssues, type IssueAlertCandidate } from './util/checkIssues';
import { checkActions } from './util/checkActions';
import { QueryTypes, Op } from 'sequelize';
import { subDays, format } from 'date-fns';

// Define Repo model directly from schema
class Repo extends Model {}
Repo.init(repoAttributes, {
  sequelize,
  ...repoModelOptions,
});

// Define Alert model directly from schema
class Alert extends Model {}
Alert.init(alertAttributes, {
  sequelize,
  ...alertModelOptions,
});

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
      WHERE (owner, repo) IN (${conditionClauses}) AND is_ignored = false AND system_resolved = false
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
      WHERE (owner, repo) IN (${conditionClauses}) AND is_ignored = false AND system_resolved = false
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
  static async processBranchAlerts(owner: string, repo: string): Promise<{ owner: string; repo: string }> {
    const timestamp = new Date();
    const result = await checkBranches(owner, repo);
    const detectedKeySet = new Set<string>();

    // Process new alerts
    for (const alert of result.alerts) {
      const key = [alert.owner, alert.repo, alert.checkType, alert.title, alert.filePath, alert.lineNumber, alert.codeSnippet, alert.branch].join('||');
      detectedKeySet.add(key);

      await Alert.findOrCreate({
        where: { 
          owner: alert.owner, 
          repo: alert.repo, 
          checkType: alert.checkType, 
          title: alert.title, 
          filePath: alert.filePath, 
          lineNumber: alert.lineNumber, 
          codeSnippet: alert.codeSnippet, 
          branch: alert.branch 
        },
        defaults: {
          owner: alert.owner,
          repo: alert.repo,
          checkType: alert.checkType,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          filePath: alert.filePath,
          lineNumber: alert.lineNumber,
          codeSnippet: alert.codeSnippet,
          branch: alert.branch,
          detectCount: 1,
          lastDetectedAt: timestamp,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
          createdAt: timestamp,
        },
      }).then(async ([record, created]) => {
        if (!created) {
          await record.update({
            detectCount: (record as any).detectCount + 1,
            lastDetectedAt: timestamp,
            systemResolved: false,
            systemResolvedReason: undefined,
          });
        }
      });
    }

    // Resolve old alerts that are no longer detected
    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        checkType: ['branch_name_violation', 'branch_protect_rule_violation', 'default_branch_violation'],
        systemResolved: false,
      },
    });

    const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');

    for (const row of existing) {
      const key = [
        row.getDataValue('owner'), 
        row.getDataValue('repo'), 
        row.getDataValue('checkType'), 
        row.getDataValue('title'), 
        row.getDataValue('filePath') ?? '', 
        row.getDataValue('lineNumber') ?? -1, 
        row.getDataValue('codeSnippet') ?? '', 
        row.getDataValue('branch') ?? ''
      ].join('||');

      if (!detectedKeySet.has(key)) {
        console.log(`🛠 Resolving: ${key}`);
        await row.update({
          systemResolved: true,
          systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected`,
        });
      } else {
        console.log(`✅ Still active: ${key}`);
      }
    }

    return { owner, repo };
  }

  static async processIssueAlerts(owner: string, repo: string): Promise<{ owner: string; repo: string }> {
    const timestamp = new Date();
    const result = await checkIssues(owner, repo);
    const detectedKeySet = new Set<string>();

    // Process new alerts
    for (const alert of result.alerts) {
      const key = [alert.owner, alert.repo, alert.checkType, alert.title, alert.filePath || '', alert.lineNumber || -1, alert.codeSnippet || '', alert.branch || ''].join('||');
      detectedKeySet.add(key);

      await Alert.findOrCreate({
        where: { 
          owner: alert.owner, 
          repo: alert.repo, 
          checkType: alert.checkType, 
          title: alert.title, 
          filePath: alert.filePath || '', 
          lineNumber: alert.lineNumber || -1, 
          codeSnippet: alert.codeSnippet || '', 
          branch: alert.branch || ''
        },
        defaults: {
          owner: alert.owner,
          repo: alert.repo,
          checkType: alert.checkType,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          filePath: alert.filePath,
          lineNumber: alert.lineNumber,
          codeSnippet: alert.codeSnippet,
          branch: alert.branch,
          issueUrl: alert.issueUrl,
          detectCount: 1,
          lastDetectedAt: timestamp,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
          createdAt: timestamp,
        },
      }).then(async ([record, created]) => {
        if (!created) {
          await record.update({
            detectCount: (record as any).detectCount + 1,
            lastDetectedAt: timestamp,
            systemResolved: false,
            systemResolvedReason: undefined,
          });
        }
      });
    }

    // Resolve old alerts that are no longer detected
    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        checkType: ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_expired_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction'],
        systemResolved: false,
      },
    });

    const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');

    for (const row of existing) {
      const key = [
        row.getDataValue('owner'), 
        row.getDataValue('repo'), 
        row.getDataValue('checkType'), 
        row.getDataValue('title'), 
        row.getDataValue('filePath') || '', 
        row.getDataValue('lineNumber') || -1, 
        row.getDataValue('codeSnippet') || '', 
        row.getDataValue('branch') || ''
      ].join('||');

      if (!detectedKeySet.has(key)) {
        console.log(`🛠 Resolving: ${key}`);
        await row.update({
          systemResolved: true,
          systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected`,
        });
      } else {
        console.log(`✅ Still active: ${key}`);
      }
    }

    return { owner, repo };
  }

  static async processActionAlerts(owner: string, repo: string): Promise<{ owner: string; repo: string }> {
    const timestamp = new Date();
    const result = await checkActions(owner, repo);
    const detectedKeySet = new Set<string>();

    // Process new alerts
    for (const alert of result.alerts) {
      const key = [alert.owner, alert.repo, alert.checkType, alert.title, alert.filePath, alert.lineNumber, alert.codeSnippet, alert.branch].join('||');
      detectedKeySet.add(key);

      await Alert.findOrCreate({
        where: { 
          owner: alert.owner, 
          repo: alert.repo, 
          checkType: alert.checkType, 
          title: alert.title, 
          filePath: alert.filePath, 
          lineNumber: alert.lineNumber, 
          codeSnippet: alert.codeSnippet, 
          branch: alert.branch 
        },
        defaults: {
          owner: alert.owner,
          repo: alert.repo,
          checkType: alert.checkType,
          title: alert.title,
          description: alert.description,
          severity: alert.severity,
          filePath: alert.filePath,
          lineNumber: alert.lineNumber,
          codeSnippet: alert.codeSnippet,
          branch: alert.branch,
          detectCount: 1,
          lastDetectedAt: timestamp,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false,
          createdAt: timestamp,
        },
      }).then(async ([record, created]) => {
        if (!created) {
          await record.update({
            detectCount: (record as any).detectCount + 1,
            lastDetectedAt: timestamp,
            systemResolved: false,
            systemResolvedReason: undefined,
          });
        }
      });
    }

    // Resolve old alerts that are no longer detected
    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        checkType: ['pr_review_workflow_missing', 'release_labeling_workflow_missing'],
        systemResolved: false,
      },
    });

    const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');

    for (const row of existing) {
      const key = [
        row.getDataValue('owner'), 
        row.getDataValue('repo'), 
        row.getDataValue('checkType'), 
        row.getDataValue('title'), 
        row.getDataValue('filePath') ?? '', 
        row.getDataValue('lineNumber') ?? -1, 
        row.getDataValue('codeSnippet') ?? '', 
        row.getDataValue('branch') ?? ''
      ].join('||');

      if (!detectedKeySet.has(key)) {
        console.log(`🛠 Resolving: ${key}`);
        await row.update({
          systemResolved: true,
          systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected`,
        });
      } else {
        console.log(`✅ Still active: ${key}`);
      }
    }

    return { owner, repo };
  }

  static async runAlert(options: { owner: string; repo: string; checks?: string[] }): Promise<Record<string, unknown>> {
    const { owner, repo, checks } = options;
    const effectiveChecks = checks ?? ['branch', 'clone', 'gitleaks', 'issue'];
    const results: Record<string, unknown> = {};

    if (effectiveChecks.includes('clone')) {
      await cloneRepo(owner, repo);
      results.clone = 'done';
    }

    if (effectiveChecks.includes('branch')) {
      await this.processBranchAlerts(owner, repo);
      results.branch = 'checked';
    }

    if (effectiveChecks.includes('issue')) {
      await this.processIssueAlerts(owner, repo);
      results.issue = 'checked';
    }

    if (effectiveChecks.includes('actions')) {
      await this.processActionAlerts(owner, repo);
      results.actions = 'checked';
    }

    if (effectiveChecks.includes('gitleaks')) {
      if (!effectiveChecks.includes('clone')) {
        await cloneRepo(owner, repo); // ensure gitleaks has source
      }
      await gitleaksScanner(owner, repo);
      results.gitleaks = 'done';
    }

    if (effectiveChecks.includes('audit')) {
      if (!effectiveChecks.includes('clone')) {
        await cloneRepo(owner, repo); // ensure audit has source
      }
      await auditScanner(owner, repo);
      results.audit = 'done';
    }

    return results;
  }

  static async checkStoredRepos(owner: string, checks?: string[]): Promise<Record<string, unknown>[]> {
    const whereClause: any = { owner };
    const activeWithinDays = 14;
    const cutoffDate = subDays(new Date(), activeWithinDays);
    whereClause.last_activity_at = { [Op.gte]: cutoffDate };

    const repos = await Repo.findAll({ where: whereClause });
    const results: Record<string, unknown>[] = [];

    for (const repo of repos) {
      try {
        const result = await this.runAlert({ owner: (repo as any).owner, repo: (repo as any).name, checks });
        results.push({ repo: (repo as any).name, ...result });
      } catch (err) {
        console.error(`❌ Failed to process ${(repo as any).name}`, err);
        results.push({
          repo: (repo as any).name,
          status: 'error',
          error: (err as Error).message,
        });
      }
    }

    return results;
  }
}

export default AlertService;

import { Model } from 'sequelize';
import createSequelizeInstance from '../../config/database';
import { repoAttributes, repoModelOptions } from '../repo/repoSchema';
import { alertAttributes, alertModelOptions } from './alertSchema';
import { cloneRepo } from './util/cloneRepo';
import { gitleaksScanner } from './util/gitleaksScanner';
import { auditScanner } from './util/auditScanner';
import { checkBranches, type AlertCandidate } from './util/checkBranches';
import { checkIssues, type IssueAlertCandidate } from './util/checkIssues';
import { checkActions } from './util/checkActions';
import { checkPullRequests } from './util/checkPullRequests';
import { QueryTypes, Op } from 'sequelize';
import { subDays, format } from 'date-fns';
import { Octokit } from '@octokit/rest';

// Get Sequelize instance
const sequelize = createSequelizeInstance();

// GitHub API client
const githubToken = process.env.GITHUB_API_KEY;
const octokit = new Octokit({ auth: githubToken });

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
  /**
   * Check if a repository has the 'no-repocheck' topic
   */
  private static async hasNoRepocheckTopic(owner: string, repo: string): Promise<boolean> {
    try {
      const response = await octokit.rest.repos.getAllTopics({
        owner,
        repo,
      });
      return response.data.names.includes('no-repocheck');
    } catch (error) {
      console.warn(`⚠️ Failed to fetch topics for ${owner}/${repo}:`, (error as Error).message);
      return false; // If we can't fetch topics, proceed with checks
    }
  }

  /**
   * Normalize Alert fields (unified handling of NULL values and empty strings)
   */
  private static normalizeAlertFields(alert: AlertCandidate | IssueAlertCandidate) {
    return {
      owner: alert.owner,
      repo: alert.repo,
      checkType: alert.checkType,
      title: alert.title,
      filePath: alert.filePath || null,
      lineNumber: alert.lineNumber === -1 ? null : (alert.lineNumber || null),
      codeSnippet: alert.codeSnippet || null,
      branch: alert.branch || null
    };
  }

  /**
   * Register/update Alert with duplicate checking
   */
  static async upsertAlert(alert: AlertCandidate | IssueAlertCandidate): Promise<{ record: Alert; created: boolean }> {
    const keyFields = this.normalizeAlertFields(alert);
    const timestamp = new Date();
    
    const [record, created] = await Alert.findOrCreate({
      where: keyFields,
      defaults: {
        ...keyFields,
        description: alert.description,
        severity: alert.severity,
        author: 'author' in alert ? alert.author || null : null,
        detectCount: 1,
        lastDetectedAt: timestamp,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
        createdAt: timestamp,
      },
    });

    if (!created) {
      await record.update({
        detectCount: (record as any).detectCount + 1,
        lastDetectedAt: timestamp,
        systemResolved: false,
        systemResolvedReason: undefined,
      });
    }

    return { record, created };
  }

  /**
   * Automatically resolve alerts that were not detected during ReCheck
   * @param owner Repository owner
   * @param repo Repository name
   * @param detectedKeys Set of alert keys detected this time
   * @param checkTypes Array of target checkTypes
   * @param processStartTime Process start time (alerts with lastDetectedAt before this time are resolution targets)
   */
  static async resolveUndetectedAlerts(
    owner: string, 
    repo: string, 
    detectedKeys: Set<string>, 
    checkTypes: string[],
    processStartTime?: Date
  ): Promise<void> {
    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        checkType: checkTypes,
        systemResolved: false,
      },
    });

    const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');
    let resolvedCount = 0;

    if (existing && existing.length > 0) {
      for (const row of existing) {
        // Use normalized keys in resolution process (same logic as new creation)
        const key = [
          row.getDataValue('owner'), 
          row.getDataValue('repo'), 
          row.getDataValue('checkType'), 
          row.getDataValue('title'), 
          row.getDataValue('filePath') || null, 
          row.getDataValue('lineNumber') === -1 ? null : (row.getDataValue('lineNumber') || null), 
          row.getDataValue('codeSnippet') || null, 
          row.getDataValue('branch') || null
        ].join('||');

        const lastDetectedAt = row.getDataValue('lastDetectedAt');
        const shouldResolve = !detectedKeys.has(key) && 
          (!processStartTime || !lastDetectedAt || lastDetectedAt < processStartTime);
        
        if (shouldResolve) {
          const author = row.getDataValue('author');
          const authorInfo = author ? ` (by @${author})` : '';
          const checkType = row.getDataValue('checkType');
          const title = row.getDataValue('title');
          console.log(`🛠 Resolving: ${checkType} - ${title}${authorInfo}`);
          
          await row.update({
            systemResolved: true,
            systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected in ReCheck`,
          });
          resolvedCount++;
        }
      }
    }

    if (resolvedCount > 0) {
      console.log(`✅ Resolved ${resolvedCount} alerts that were not detected in ReCheck`);
    }
  }

  /**
   * Comprehensively resolve all unresolved alerts after ReCheck completion
   * Final check to ensure no alerts are missed after individual resolution processing for each check type
   * @param owner Repository owner
   * @param repo Repository name
   * @param processStartTime Process start time (alerts with lastDetectedAt before this time are resolution targets)
   */
  static async resolveAllUndetectedAlerts(owner: string, repo: string, processStartTime: Date): Promise<void> {
    // Target all checkTypes
    const allCheckTypes = [
      'branch_name_violation', 
      'branch_protect_rule_violation', 
      'default_branch_violation',
      'issue_unassigned',
      'issue_missing_sp', 
      'issue_large_sp', 
      'issue_missing_end_date', 
      'issue_not_in_project', 
      'issue_template_only', 
      'issue_unclear_instruction',
      'pr_review_workflow_missing', 
      'release_labeling_workflow_missing',
      'exposed_secret_key',
      'package_vulnerability'
    ];

    const existing = await Alert.findAll({
      where: {
        owner,
        repo,
        checkType: allCheckTypes,
        systemResolved: false,
      },
    });

    const resolveTimestamp = format(new Date(), 'yyyyMMddHHmmss');
    let resolvedCount = 0;

    if (existing && existing.length > 0) {
      for (const row of existing) {
        const lastDetectedAt = row.getDataValue('lastDetectedAt');
        
        // Only target alerts with lastDetectedAt before process start time
        // This ensures only alerts not detected in this ReCheck are targeted for resolution
        if (!lastDetectedAt || lastDetectedAt < processStartTime) {
          const author = row.getDataValue('author');
          const authorInfo = author ? ` (by @${author})` : '';
          const checkType = row.getDataValue('checkType');
          const title = row.getDataValue('title');
          console.log(`🛠 Final resolution: ${checkType} - ${title}${authorInfo}`);
          
          await row.update({
            systemResolved: true,
            systemResolvedReason: `${resolveTimestamp}:Automatically resolved: not detected in recent ReCheck`,
          });
          resolvedCount++;
        }
      }
    }

    if (resolvedCount > 0) {
      console.log(`✅ Final resolution: ${resolvedCount} alerts resolved as not detected in recent ReCheck`);
    } else {
      console.log(`✅ All alerts are up-to-date or recently detected`);
    }
  }
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
  static async processBranchAlerts(owner: string, repo: string, processStartTime?: Date): Promise<{ owner: string; repo: string }> {
    const result = await checkBranches(owner, repo);
    const detectedKeySet = new Set<string>();

    // Process new alerts
    for (const alert of result.alerts) {
      const normalizedFields = this.normalizeAlertFields(alert);
      const key = [normalizedFields.owner, normalizedFields.repo, normalizedFields.checkType, normalizedFields.title, normalizedFields.filePath || '', normalizedFields.lineNumber || -1, normalizedFields.codeSnippet || '', normalizedFields.branch || ''].join('||');
      detectedKeySet.add(key);

      // Use the new upsertAlert method for consistent duplicate handling
      const { record, created } = await this.upsertAlert(alert);
      
      if (created) {
        console.log(`🆕 Created new branch alert: ${alert.checkType} - ${alert.title}`);
      } else {
        console.log(`🔄 Updated existing branch alert: ${alert.checkType} - ${alert.title} (detectCount: ${(record as any).detectCount})`);
      }
    }

    // Resolve old alerts that are no longer detected
    await this.resolveUndetectedAlerts(
      owner, 
      repo, 
      detectedKeySet, 
      ['branch_name_violation', 'branch_protect_rule_violation', 'default_branch_violation'],
      processStartTime
    );

    return { owner, repo };
  }

  static async processIssueAlerts(
    owner: string,
    repo: string,
    processStartTime?: Date,
    isScheduledRun = false
  ): Promise<{ owner: string; repo: string }> {
    const result = await checkIssues(owner, repo, undefined, { isScheduledRun });
    const detectedKeySet = new Set<string>();

    // Process new alerts
    for (const alert of result.alerts) {
      const normalizedFields = this.normalizeAlertFields(alert);
      const key = [normalizedFields.owner, normalizedFields.repo, normalizedFields.checkType, normalizedFields.title, normalizedFields.filePath || '', normalizedFields.lineNumber || -1, normalizedFields.codeSnippet || '', normalizedFields.branch || ''].join('||');
      detectedKeySet.add(key);

      // Use the new upsertAlert method for consistent duplicate handling
      const { record, created } = await this.upsertAlert(alert);
      
      if (created) {
        console.log(`🆕 Created new issue alert: ${alert.checkType} - ${alert.title}`);
      } else {
        console.log(`🔄 Updated existing issue alert: ${alert.checkType} - ${alert.title} (detectCount: ${(record as any).detectCount})`);
      }
    }

    // Resolve old alerts that are no longer detected
    await this.resolveUndetectedAlerts(
      owner, 
      repo, 
      detectedKeySet, 
      ['issue_missing_sp', 'issue_large_sp', 'issue_missing_end_date', 'issue_not_in_project', 'issue_template_only', 'issue_unclear_instruction'],
      processStartTime
    );

    return { owner, repo };
  }

  static async processIssueAlertsWithProgress(
    owner: string,
    repo: string,
    onProgress?: (processed: number, total: number) => void,
    processStartTime?: Date,
    isScheduledRun = false
  ): Promise<{ owner: string; repo: string }> {

    // Call checkIssues with progress callback for issue analysis phase
    const result = await checkIssues(
      owner,
      repo,
      (progress, total) => {
        console.log(`[AlertService] checkIssues progress: ${progress}/${total}`);
        if (onProgress) {
          console.log(`[AlertService] Calling onProgress from checkIssues: ${progress}/${total}`);
          onProgress(progress, total);
        }
      },
      { isScheduledRun }
    );

    const detectedKeySet = new Set<string>();
    const total = result.alerts?.length || 0;
    let processed = 0;

    console.log(`[AlertService] processIssueAlertsWithProgress: Found ${total} issues to process`);

    // Send initial progress (0/total)
    if (onProgress) {
      console.log(`[AlertService] Calling initial onProgress: ${processed}/${total}`);
      onProgress(processed, total);
    }

    // Process new alerts with progress tracking
    const alerts = result.alerts || [];
    for (const alert of alerts) {
      const normalizedFields = this.normalizeAlertFields(alert);
      const key = [normalizedFields.owner, normalizedFields.repo, normalizedFields.checkType, normalizedFields.title, normalizedFields.filePath || '', normalizedFields.lineNumber || -1, normalizedFields.codeSnippet || '', normalizedFields.branch || ''].join('||');
      detectedKeySet.add(key);

      // Use the new upsertAlert method for consistent duplicate handling
      const { record, created } = await this.upsertAlert(alert);

      if (created) {
        console.log(`🆕 Created new alert: ${alert.checkType} - ${alert.title}`);
      } else {
        console.log(`🔄 Updated existing alert: ${alert.checkType} - ${alert.title} (detectCount: ${(record as any).detectCount})`);
      }

      processed++;
      if (onProgress) {
        console.log(`[AlertService] Calling onProgress: ${processed}/${total}`);
        onProgress(processed, total);
      }
    }

    // Send final progress to ensure completion is reported
    if (onProgress && processed === total) {
      onProgress(total, total);
    }

    // Resolve old alerts that are no longer detected
    await this.resolveUndetectedAlerts(
      owner,
      repo,
      detectedKeySet,
      [
        'issue_missing_sp',
        'issue_large_sp',
        'issue_missing_end_date',
        'issue_not_in_project',
        'issue_template_only',
        'issue_unclear_instruction',
      ],
      processStartTime
    );

    return { owner, repo };
  }

  static async processActionAlerts(owner: string, repo: string, processStartTime?: Date): Promise<{ owner: string; repo: string }> {
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
    await this.resolveUndetectedAlerts(
      owner, 
      repo, 
      detectedKeySet, 
      ['pr_review_workflow_missing', 'release_labeling_workflow_missing'],
      processStartTime
    );

    return { owner, repo };
  }

  static async processPullRequestAlerts(
    owner: string,
    repo: string,
    processStartTime?: Date,
    isScheduledRun = false
  ): Promise<{ owner: string; repo: string }> {
    const timestamp = new Date();
    const result = await checkPullRequests(owner, repo, undefined, { isScheduledRun });
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
          author: alert.author,
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

    // Resolve old alerts that are no longer detected (scheduled runのみ pr_issue_not_linked を解消対象に含める)
    const prQualityCheckTypes: string[] = [
      'pr_unclear_changes',
      'pr_missing_evidence',
      'dependabot_open_pr',
    ];
    if (isScheduledRun) {
      prQualityCheckTypes.push('pr_issue_not_linked');
    }
    await Alert.update(
      {
        systemResolved: true,
        systemResolvedReason: 'PR quality issue resolved',
        lastDetectedAt: timestamp,
      },
      {
        where: {
          owner,
          repo,
          checkType: prQualityCheckTypes,
          systemResolved: false,
          lastDetectedAt: processStartTime ? { [Op.lt]: processStartTime } : { [Op.lt]: timestamp },
        },
      }
    );

    return { owner, repo };
  }

  static async runAlert(
    options: { 
      owner: string; 
      repo: string; 
      checks?: string[];
      /** 定期チェック（cron 等）のとき true。PR↔issue 紐づきチェックはこのときのみ実行 */
      isScheduledRun?: boolean;
      onProgress?: (progress: {
        currentPhase: string;
        totalPhases: number;
        phaseProgress: number;
        phaseDetails?: {
          phase: string;
          progress: number;
          totalItems?: number;
          processedItems?: number;
        };
      }) => void;
    }
  ): Promise<Record<string, unknown>> {
    const { owner, repo, checks, onProgress, isScheduledRun = false } = options;
    const effectiveChecks = checks ?? ['branch', 'clone', 'gitleaks', 'issue', 'pr'];
    const results: Record<string, unknown> = {};
    const totalPhases = effectiveChecks.length;
    let currentPhaseIndex = 0;
    
    // 処理開始時刻を記録（この時刻より前のlastDetectedAtを持つalertは解決対象）
    const processStartTime = new Date();

    // 進捗コールバック関数
    const updateProgress = (phase: string, phaseProgress: number, phaseDetails?: any) => {
      console.log(`[AlertService] updateProgress called: ${phase}, phaseProgress: ${phaseProgress}, phaseDetails:`, phaseDetails);
      if (onProgress) {
        const progressData = {
          currentPhase: phase,
          totalPhases,
          phaseProgress: Math.round((currentPhaseIndex / totalPhases) * 100),
          phaseDetails: {
            phase,
            progress: phaseProgress,
            ...phaseDetails
          }
        };
        console.log(`[AlertService] Calling onProgress with:`, JSON.stringify(progressData, null, 2));
        onProgress(progressData);
      } else {
        console.log(`[AlertService] onProgress is null/undefined - no callback to call`);
      }
    };

    if (effectiveChecks.includes('clone')) {
      updateProgress('Repository Cloning', 0);
      await cloneRepo(owner, repo);
      updateProgress('Repository Cloning', 100);
      results.clone = 'done';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('branch')) {
      updateProgress('Branch Analysis', 0);
      await this.processBranchAlerts(owner, repo, processStartTime);
      updateProgress('Branch Analysis', 100);
      results.branch = 'checked';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('issue')) {
      updateProgress('Issue Analysis', 0);
      // issue処理で件数ベースの進捗を実装
      await this.processIssueAlertsWithProgress(owner, repo, (progress, total) => {
        console.log(`[AlertService] processIssueAlertsWithProgress callback called: ${progress}/${total}`);
        updateProgress('Issue Analysis', Math.round((progress / total) * 100), {
          processedItems: progress,
          totalItems: total
        });
      }, processStartTime, isScheduledRun);
      updateProgress('Issue Analysis', 100);
      results.issue = 'checked';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('actions')) {
      updateProgress('GitHub Actions Analysis', 0);
      await this.processActionAlerts(owner, repo, processStartTime);
      updateProgress('GitHub Actions Analysis', 100);
      results.actions = 'checked';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('pr')) {
      updateProgress('Pull Request Analysis', 0);
      await this.processPullRequestAlerts(owner, repo, processStartTime, isScheduledRun);
      updateProgress('Pull Request Analysis', 100);
      results.pr = 'checked';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('gitleaks')) {
      updateProgress('Security Scan (Gitleaks)', 0);
      // Always fetch latest code before gitleaks scan to ensure up-to-date security checks
      await cloneRepo(owner, repo);
      await gitleaksScanner(owner, repo, processStartTime);
      updateProgress('Security Scan (Gitleaks)', 100);
      results.gitleaks = 'done';
      currentPhaseIndex++;
    }

    if (effectiveChecks.includes('audit')) {
      updateProgress('Security Audit', 0);
      // Always fetch latest code before audit scan to ensure up-to-date security checks
      await cloneRepo(owner, repo);
      await auditScanner(owner, repo, processStartTime);
      updateProgress('Security Audit', 100);
      results.audit = 'done';
      currentPhaseIndex++;
    }

    // ReCheck完了後、検出されなかったalertを統合的に解決
    if (effectiveChecks.length > 1) { // 複数のcheckが実行された場合のみ
      updateProgress('Resolving Undetected Alerts', 0);
      await this.resolveAllUndetectedAlerts(owner, repo, processStartTime);
      updateProgress('Resolving Undetected Alerts', 100);
      results.resolution = 'completed';
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
      const repoName = (repo as any).name;
      const repoOwner = (repo as any).owner;
      
      try {
        // Check if repository has 'no-repocheck' topic
        const hasSkipTopic = await this.hasNoRepocheckTopic(repoOwner, repoName);
        
        if (hasSkipTopic) {
          console.log(`⏭️ Skipping ${repoOwner}/${repoName}: 'no-repocheck' topic found`);
          results.push({ 
            repo: repoName, 
            status: 'skipped',
            reason: 'no-repocheck topic present'
          });
          continue;
        }

        const result = await this.runAlert({
          owner: repoOwner,
          repo: repoName,
          checks,
          isScheduledRun: true,
        });
        results.push({ repo: repoName, ...result });
      } catch (err) {
        console.error(`❌ Failed to process ${repoName}`, err);
        results.push({
          repo: repoName,
          status: 'error',
          error: (err as Error).message,
        });
      }
    }

    return results;
  }

  /**
   * Get alerts aggregated by author
   */
  static async getAlertsByAuthor(params: {
    owner?: string;
    repo?: string;
    sortBy?: 'totalAlerts' | 'author' | 'lastActivity';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) {
    const {
      owner,
      repo,
      sortBy = 'totalAlerts',
      sortOrder = 'desc',
      page = 1,
      limit = 50
    } = params;

    const offset = (page - 1) * limit;
    
    // Build where conditions - Show Issue type alerts and PR format violations for author grouping
    const whereConditions: string[] = ['is_ignored = false', 'system_resolved = false'];
    const replacements: (string | number)[] = [];

    // Filter for Issue type alerts and PR format violations (author-related issues and PR checks)
    whereConditions.push(
      '(check_type LIKE ? OR check_type = ? OR check_type = ? OR check_type = ? OR check_type = ?)'
    );
    replacements.push(
      'issue_%',
      'pull_request_format_violation',
      'pr_missing_evidence',
      'pr_unclear_changes',
      'pr_issue_not_linked'
    );

    if (owner) {
      whereConditions.push('owner = ?');
      replacements.push(owner);
    }

    if (repo) {
      whereConditions.push('repo = ?');
      replacements.push(repo);
    }

    const whereClause = whereConditions.join(' AND ');
    
    // Build order clause
    const sortMapping = {
      totalAlerts: 'total_alerts',
      author: 'COALESCE(author, \'Unknown Author\')',
      lastActivity: 'last_activity_date'
    };
    
    const orderClause = `ORDER BY ${sortMapping[sortBy]} ${sortOrder.toUpperCase()}`;

    // Main query for aggregated data
    const dataQuery = `
      SELECT 
        COALESCE(author, 'Unknown Author') as author,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity_count,
        COUNT(CASE WHEN severity = 'middle' THEN 1 END) as middle_severity_count,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_severity_count,
        COUNT(CASE WHEN check_type = 'issue_missing_sp' THEN 1 END) as missing_sp_count,
        COUNT(CASE WHEN check_type = 'issue_large_sp' THEN 1 END) as large_sp_count,
        COUNT(CASE WHEN check_type = 'issue_missing_end_date' THEN 1 END) as missing_end_date_count,
        COUNT(CASE WHEN check_type = 'issue_not_in_project' THEN 1 END) as not_in_project_count,
        COUNT(CASE WHEN check_type = 'issue_template_only' THEN 1 END) as template_only_count,
        COUNT(CASE WHEN check_type = 'issue_unclear_instruction' THEN 1 END) as unclear_instruction_count,
        COUNT(CASE WHEN check_type = 'issue_unassigned' THEN 1 END) as unassigned_count,
        COUNT(CASE WHEN check_type = 'pull_request_format_violation' THEN 1 END) as pr_format_violation_count,
        COUNT(CASE WHEN check_type = 'pr_missing_evidence' THEN 1 END) as pr_missing_evidence_count,
        COUNT(CASE WHEN check_type = 'pr_unclear_changes' THEN 1 END) as pr_unclear_changes_count,
        COUNT(CASE WHEN check_type = 'pr_issue_not_linked' THEN 1 END) as pr_issue_not_linked_count,
        GROUP_CONCAT(DISTINCT owner || '/' || repo) as repositories,
        MAX(last_detected_at) as last_activity_date
      FROM alerts 
      WHERE ${whereClause}
      GROUP BY COALESCE(author, 'Unknown Author')
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    replacements.push(limit, offset);

    // Count query for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT COALESCE(author, 'Unknown Author')) as total
      FROM alerts 
      WHERE ${whereClause}
    `;

    // Execute queries
    const [dataResults, countResults] = await Promise.all([
      sequelize.query(dataQuery, {
        type: QueryTypes.SELECT,
        replacements: replacements
      }),
      sequelize.query(countQuery, {
        type: QueryTypes.SELECT,
        replacements: replacements.slice(0, -2) // Remove limit/offset for count
      })
    ]);

    const total = (countResults[0] as any).total;
    const totalPages = Math.ceil(total / limit);

    // Format results
    const data = (dataResults as any[]).map(row => ({
      author: row.author,
      displayName: row.display_name,
      totalAlerts: parseInt(row.total_alerts),
      severityCounts: {
        high: parseInt(row.high_severity_count),
        middle: parseInt(row.middle_severity_count),
        low: parseInt(row.low_severity_count)
      },
      issueTypeCounts: {
        missingSp: parseInt(row.missing_sp_count),
        largeSp: parseInt(row.large_sp_count),
        missingEndDate: parseInt(row.missing_end_date_count),
        notInProject: parseInt(row.not_in_project_count),
        templateOnly: parseInt(row.template_only_count),
        unclearInstruction: parseInt(row.unclear_instruction_count),
        unassigned: parseInt(row.unassigned_count),
        prFormatViolation: parseInt(row.pr_format_violation_count),
        prMissingEvidence: parseInt(row.pr_missing_evidence_count),
        prUnclearChanges: parseInt(row.pr_unclear_changes_count),
        prIssueNotLinked: parseInt(row.pr_issue_not_linked_count)
      },
      repositories: row.repositories ? row.repositories.split(',') : [],
      lastActivityDate: row.last_activity_date
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get alerts for a specific author
   */
  static async getAlertsBySpecificAuthor(
    author: string,
    filters: {
      severity?: string;
      checkType?: string;
    } = {}
  ) {
    const whereConditions: any = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      is_ignored: false,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      system_resolved: false,
      checkType: {
        [Op.or]: [
          { [Op.like]: 'issue_%' },  // Issue-type alerts
          'pull_request_format_violation',  // PR format violations
          'pr_missing_evidence',  // PR missing evidence
          'pr_unclear_changes',  // PR unclear changes
          'pr_issue_not_linked'  // PR not linked to an issue
        ]
      }
    };

    // Handle "Unknown Author" case
    if (author === 'Unknown Author') {
      whereConditions.author = null;
    } else {
      whereConditions.author = author;
    }

    if (filters.severity) {
      whereConditions.severity = filters.severity;
    }

    if (filters.checkType) {
      whereConditions.checkType = filters.checkType;
    }

    const alerts = await Alert.findAll({
      where: whereConditions,
      order: [['lastDetectedAt', 'DESC']]
    });

    return {
      author: author,
      issues: alerts.map(alert => ({
        id: (alert as any).id,
        owner: (alert as any).owner,
        repo: (alert as any).repo,
        checkType: (alert as any).checkType,
        title: (alert as any).title,
        description: (alert as any).description,
        severity: (alert as any).severity,
        issueUrl: (alert as any).issueUrl,
        filePath: (alert as any).filePath,
        lineNumber: (alert as any).lineNumber,
        branch: (alert as any).branch,
        detectCount: (alert as any).detectCount,
        lastDetectedAt: (alert as any).lastDetectedAt || (alert as any).createdAt,
        createdAt: (alert as any).createdAt
      }))
    };
  }

  /**
   * Backfill author data for existing alerts
   */
  static async backfillAuthors(params: {
    owner?: string;
    repo?: string;
    batchSize?: number;
  } = {}): Promise<{ jobId: string; status: string; message: string; estimatedAlerts?: number }> {
    const { owner, repo, batchSize = 50 } = params;
    
    // Generate unique job ID
    const jobId = `backfill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Build where conditions
    const whereConditions: any = {
      author: null,  // Only process alerts without author data
      issueUrl: { [Op.not]: null }  // Only alerts with issue URLs
    };

    if (owner) whereConditions.owner = owner;
    if (repo) whereConditions.repo = repo;

    try {
      // Get count of alerts to process
      const alertCount = await Alert.count({ where: whereConditions });
      
      if (alertCount === 0) {
        return {
          jobId,
          status: 'completed',
          message: 'No alerts found that need author data',
          estimatedAlerts: 0
        };
      }

      // Start background processing (in real implementation, this would use a job queue)
      // For now, we'll process synchronously in smaller batches
      this.processAuthorBackfill(whereConditions, batchSize, jobId);

      return {
        jobId,
        status: 'started',
        message: 'Backfill job started successfully',
        estimatedAlerts: alertCount
      };
    } catch (error) {
      console.error('Failed to start backfill job:', error);
      return {
        jobId,
        status: 'failed',
        message: 'Failed to start backfill job'
      };
    }
  }

  /**
   * Process author backfill (would typically be a background job)
   */
  private static async processAuthorBackfill(
    whereConditions: any, 
    batchSize: number, 
    jobId: string
  ): Promise<void> {
    try {
      console.log(`Starting author backfill job ${jobId}`);
      
      const alerts = await Alert.findAll({
        where: whereConditions,
        limit: batchSize,
        order: [['createdAt', 'ASC']]
      });

      let processed = 0;
      
      for (const alert of alerts) {
        try {
          const alertData = alert as any;
          
          if (alertData.issueUrl) {
            // Parse issue number from URL (simplified - would use the authorExtractor utility)
            const issueMatch = alertData.issueUrl.match(/\/issues\/(\d+)/);
            if (issueMatch) {
              const issueNumber = parseInt(issueMatch[1], 10);
              
              // In real implementation, would fetch from GitHub API
              // For now, we'll set a placeholder
              await alert.update({
                author: `backfilled-user-${issueNumber}`
              });
              
              processed++;
            }
          }
        } catch (error) {
          console.warn(`Failed to backfill author for alert ${(alert as any).id}:`, error);
        }
      }

      console.log(`Completed author backfill job ${jobId}. Processed ${processed} alerts.`);
    } catch (error) {
      console.error(`Author backfill job ${jobId} failed:`, error);
    }
  }
}

export default AlertService;

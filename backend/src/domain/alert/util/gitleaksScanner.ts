import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
// import { format } from 'date-fns';
import { Model } from 'sequelize';
import createSequelizeInstance from '../../../config/database';
import { alertAttributes, alertModelOptions } from '../alertSchema';
import AlertService from '../alertService';
import { GitleaksErrorHandler, GitleaksExecutionResult } from './gitleaksErrorHandler';

// Get Sequelize instance
const sequelize = createSequelizeInstance();

// Define Alert model directly from schema
class Alert extends Model {}
Alert.init(alertAttributes, {
  sequelize,
  ...alertModelOptions,
});

export async function gitleaksScanner(owner: string, repo: string, processStartTime?: Date): Promise<void> {
  const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
  if (!workspace) {
    throw new Error('GITHUB_LOCAL_WORKSPACE is required');
  }

  // Get current branch name from .git/HEAD
  const headPath = path.join(workspace, '.git', 'HEAD');
  let branch = 'unknown';
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const match = headContent.match(/^ref: refs\/heads\/(.+)\s*$/);
    if (match) branch = match[1];
  } catch (err) {
    console.warn(`⚠️ Failed to read .git/HEAD for branch name:`, err);
  }

  const executionResult = await runGitleaks(workspace);
  
  // Handle execution errors
  if (!executionResult.success) {
    const errorMessage = GitleaksErrorHandler.provideFallbackSolution(executionResult.error!);
    console.error('❌ Gitleaks execution failed:', errorMessage);
    console.error(GitleaksErrorHandler.formatErrorForLogging(executionResult.error!));
    
    // For critical errors, throw to stop processing
    const severity = GitleaksErrorHandler.getErrorSeverity(executionResult.error!);
    if (severity === 'critical') {
      throw new Error(`Gitleaks execution failed: ${errorMessage}`);
    }
    
    // For non-critical errors, continue with empty findings
    console.warn('⚠️ Continuing with empty findings due to gitleaks error');
  }

  const findings = executionResult.findings;
  // const timestamp = format(new Date(), 'yyyyMMddHHmmss');

  const issues = await Promise.all(
    findings.map(async (item: any) => {
      const absFile = item.File ?? '';
      const lineNumber = item.StartLine ?? 0;
      let matchedLine = '';

      if (absFile && lineNumber > 0) {
        try {
          const content = await fs.readFile(absFile, 'utf-8');
          const lines = content.split(/\r?\n/);
          matchedLine = (lines[lineNumber - 1] ?? '').trim();
        } catch {
          // Ignore read failures
        }
      }

      const relativePath = absFile ? path.relative(workspace, absFile).split(path.sep).join('/') : '';

      return {
        owner,
        repo,
        branch,
        checkType: 'exposed_secret_key',
        title: item.RuleID ?? 'Unknown rule',
        description: item.Description ?? '',
        severity: 'high',
        filePath: relativePath,
        lineNumber,
        codeSnippet: matchedLine,
      };
    })
  );

  const detectedKeys = new Set<string>();

  for (const issue of issues) {
    // Use AlertService.upsertAlert for consistent duplicate handling
    const { record, created } = await AlertService.upsertAlert(issue);
    
    if (created) {
      console.log(`🆕 Created new gitleaks alert: ${issue.checkType} - ${issue.title}`);
    } else {
      console.log(`🔄 Updated existing gitleaks alert: ${issue.checkType} - ${issue.title} (detectCount: ${(record as any).detectCount})`);
    }

    const key = [issue.owner, issue.repo, issue.checkType, issue.title, issue.filePath || null, issue.lineNumber === -1 ? null : (issue.lineNumber || null), issue.codeSnippet || null, issue.branch || null].join('||');
    detectedKeys.add(key);
  }

  // Always call resolveUndetectedAlerts, even when there are errors (with empty findings)
  await AlertService.resolveUndetectedAlerts(
    owner, 
    repo, 
    detectedKeys, 
    ['exposed_secret_key'],
    processStartTime
  );
}

async function runGitleaks(workspace: string): Promise<GitleaksExecutionResult> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Use stdout instead of file output to avoid file system issues
    const cmd = `gitleaks detect --no-git --source=${workspace} --report-format=json --report-path=- --redact=0`;

    const child = exec(cmd, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;
      
      if (stderr) console.error('Gitleaks stderr:', stderr);
      
      // gitleaks returns exit code 1 when leaks are found, which is normal
      if (error && error.code !== 1) {
        const errorContext = GitleaksErrorHandler.handleCommandError(error, {
          workspace,
          command: cmd,
          stderr,
          executionTime,
        });
        
        resolve({
          success: false,
          findings: [],
          error: errorContext,
          executionTime,
        });
        return;
      }

      try {
        // Parse JSON from stdout
        const findings = stdout.trim() ? JSON.parse(stdout) : [];
        
        resolve({
          success: true,
          findings,
          executionTime,
        });
      } catch (err) {
        const parseError = err instanceof Error ? err : new Error('Unknown JSON parse error');
        const errorContext = GitleaksErrorHandler.handleJsonParseError(parseError, {
          workspace,
          command: cmd,
          stdout,
          executionTime,
        });
        
        resolve({
          success: false,
          findings: [],
          error: errorContext,
          executionTime,
        });
      }
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
  });
}

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import { Model } from 'sequelize';
import sequelize from '../../../config/database';
import { alertAttributes, alertModelOptions } from '../alertSchema';
import AlertService from '../alertService';

// Define Alert model directly from schema
class Alert extends Model {}
Alert.init(alertAttributes, {
  sequelize,
  ...alertModelOptions,
});

export async function gitleaksScanner(owner: string, repo: string): Promise<void> {
  const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
  if (!workspace) {
    throw new Error('GITHUB_LOCAL_WORKSPACE is required');
  }

  // ▼ 現在のブランチ名を .git/HEAD から取得
  const headPath = path.join(workspace, '.git', 'HEAD');
  let branch = 'unknown';
  try {
    const headContent = await fs.readFile(headPath, 'utf-8');
    const match = headContent.match(/^ref: refs\/heads\/(.+)\s*$/);
    if (match) branch = match[1];
  } catch (err) {
    console.warn(`⚠️ Failed to read .git/HEAD for branch name:`, err);
  }

  const findings = await runGitleaks(workspace);
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');

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
          // 読み込み失敗は無視
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
      console.log(`🔄 Updated existing gitleaks alert: ${issue.checkType} - ${issue.title} (detectCount: ${record.detectCount})`);
    }

    const key = [issue.owner, issue.repo, issue.checkType, issue.title, issue.filePath || null, issue.lineNumber === -1 ? null : (issue.lineNumber || null), issue.codeSnippet || null, issue.branch || null].join('||');
    detectedKeys.add(key);
  }

  const existing = await Alert.findAll({
    where: {
      owner,
      repo,
      branch,
      checkType: 'exposed_secret_key',
      systemResolved: false,
    },
  });

  for (const row of existing) {
    const key = [row.getDataValue('owner'), row.getDataValue('repo'), row.getDataValue('branch'), row.getDataValue('checkType'), row.getDataValue('title'), row.getDataValue('filePath') || null, row.getDataValue('lineNumber') === -1 ? null : (row.getDataValue('lineNumber') || null), row.getDataValue('codeSnippet') || null].join('||');

    if (!detectedKeys.has(key)) {
      await row.update({
        systemResolved: true,
        systemResolvedReason: `${timestamp}:Automatically resolved: not detected`,
      });
    }
  }
}

async function runGitleaks(workspace: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const tmpPath = path.join(workspace, `gitleaks-result-${randomUUID()}.json`);
    const cmd = `gitleaks detect --no-git --source=${workspace} --report-format=json --report-path=${tmpPath} --redact=0`;

    const child = exec(cmd, async (error, _stdout, stderr) => {
      if (stderr) console.error('Gitleaks stderr:', stderr);
      if (error && error.code !== 1) {
        reject(error);
        return;
      }

      try {
        const raw = await fs.readFile(tmpPath, 'utf-8');
        const findings = raw.trim() ? JSON.parse(raw) : [];
        await fs.rm(tmpPath);
        resolve(findings);
      } catch (err) {
        reject(err);
      }
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
  });
}

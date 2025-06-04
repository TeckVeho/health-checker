import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import Alert from '../alertModel';

export async function gitleaksScanner(owner: string, repo: string): Promise<void> {
  const workspace = process.env.GITHUB_WORKSPACE;
  if (!workspace) {
    throw new Error('GITHUB_WORKSPACE is required');
  }

  const findings = await runGitleaks(workspace);
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');

  const issues = await Promise.all(
    findings.map(async (item: any) => {// eslint-disable-line @typescript-eslint/no-explicit-any
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
        checkType: 'gitleaks',
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
    const keyFields = {
      owner: issue.owner,
      repo: issue.repo,
      checkType: issue.checkType,
      title: issue.title,
      filePath: issue.filePath,
      lineNumber: issue.lineNumber,
      codeSnippet: issue.codeSnippet,
    };

    const [record, created] = await Alert.findOrCreate({
      where: keyFields,
      defaults: {
        ...keyFields,
        description: issue.description,
        severity: issue.severity,
        detectCount: 1,
        lastDetectedAt: new Date(),
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
        createdAt: new Date(),
      },
    });

    if (!created) {
      await record.update({
        detectCount: record.detectCount + 1,
        lastDetectedAt: new Date(),
        systemResolved: false,
        systemResolvedReason: undefined,
      });
    }

    const key = Object.values(keyFields).join('||');
    detectedKeys.add(key);
  }

  const existing = await Alert.findAll({
    where: {
      owner,
      repo,
      checkType: 'gitleaks',
      systemResolved: false,
    },
  });

  for (const row of existing) {
    const key = [row.getDataValue('owner'), row.getDataValue('repo'), row.getDataValue('checkType'), row.getDataValue('title'), row.getDataValue('filePath'), row.getDataValue('lineNumber'), row.getDataValue('codeSnippet')].join('||');

    if (!detectedKeys.has(key)) {
      await row.update({
        systemResolved: true,
        systemResolvedReason: `${timestamp}:Automatically resolved: not detected`,
      });
    }
  }
}

async function runGitleaks(workspace: string): Promise<any[]> {// eslint-disable-line @typescript-eslint/no-explicit-any
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

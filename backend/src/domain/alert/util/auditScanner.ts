/**
 * Package Vulnerability Scanner
 * 
 * This scanner analyzes package.json files in a cloned repository to detect vulnerable dependencies
 * and registers them as alerts. It works similarly to the existing gitleaksScanner.
 * 
 * Features:
 * - Recursively searches for all package.json files in the repository
 * - Automatically detects package manager (yarn vs npm) based on lock files
 * - Runs yarn audit or npm audit accordingly
 * - Parses audit output and extracts high/critical severity vulnerabilities
 * - Registers findings as alerts with checkType "package_vulnerability"
 * - Handles alert deduplication and automatic resolution
 * 
 * Integration:
 * - Called from AlertService.runAlert() when 'audit' check is included
 * - Requires cloned repository in GITHUB_LOCAL_WORKSPACE
 * - Works alongside existing scanners (gitleaks, branch checks)
 * 
 * @example
 * // Use via AlertService
 * await AlertService.runAlert({ 
 *   owner: 'myorg', 
 *   repo: 'myrepo', 
 *   checks: ['clone', 'audit'] 
 * });
 * 
 * // Or call directly (after cloneRepo)
 * await auditScanner('myorg', 'myrepo');
 */

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

interface AuditFinding {
  name: string;
  severity: string;
  title: string;
  url?: string;
  range?: string;
  via?: string[];
  fixAvailable?: boolean;
}

interface PackageContext {
  packageJsonPath: string;
  packageManagerType: 'npm' | 'yarn';
  lockFilePath: string;
}

export async function auditScanner(owner: string, repo: string, processStartTime?: Date): Promise<void> {
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

  // Find all package.json files and their context
  const packageContexts = await findPackageContexts(workspace);
  console.log(`📦 Found ${packageContexts.length} package.json files to audit`);

  const allFindings: (AuditFinding & { context: PackageContext })[] = [];

  // Process each package.json
  for (const context of packageContexts) {
    try {
      console.log(`🔍 Auditing ${context.packageJsonPath} using ${context.packageManagerType}`);
      const findings = await runAudit(context);
      allFindings.push(...findings.map(f => ({ ...f, context })));
    } catch (err) {
      console.warn(`⚠️ Failed to audit ${context.packageJsonPath}:`, err);
    }
  }

  console.log(`🚨 Found ${allFindings.length} high+ severity vulnerabilities`);

  const timestamp = format(new Date(), 'yyyyMMddHHmmss');
  const detectedKeys = new Set<string>();

  // Process findings into alerts
  for (const finding of allFindings) {
    const relativePath = path.relative(workspace, finding.context.packageJsonPath).split(path.sep).join('/');
    
    const issue = {
      owner,
      repo,
      branch,
      checkType: 'package_vulnerability',
      title: finding.title || `${finding.name} vulnerability`,
      description: finding.url ? `Vulnerability in ${finding.name}. See: ${finding.url}` : `Vulnerability in ${finding.name}`,
      severity: finding.severity,
      filePath: relativePath,
      lineNumber: 1, // package.json vulnerabilities don't have specific line numbers
      codeSnippet: `"${finding.name}": "${finding.range || 'unknown'}"`,
    };

    // Use AlertService.upsertAlert for consistent duplicate handling
    const { record, created } = await AlertService.upsertAlert(issue);
    
    if (created) {
      console.log(`🆕 Created new audit alert: ${issue.checkType} - ${issue.title}`);
    } else {
      console.log(`🔄 Updated existing audit alert: ${issue.checkType} - ${issue.title} (detectCount: ${(record as any).detectCount})`);
    }

    const key = [issue.owner, issue.repo, issue.checkType, issue.title, issue.filePath || null, issue.lineNumber === -1 ? null : (issue.lineNumber || null), issue.codeSnippet || null, issue.branch || null].join('||');
    detectedKeys.add(key);
  }

  // Use AlertService.resolveUndetectedAlerts for consistent resolution logic
  await AlertService.resolveUndetectedAlerts(
    owner, 
    repo, 
    detectedKeys, 
    ['package_vulnerability'],
    processStartTime
  );
}

async function findPackageContexts(rootDir: string): Promise<PackageContext[]> {
  const contexts: PackageContext[] = [];

  async function searchRecursively(dir: string): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules and other common directories that shouldn't be audited
          if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') {
            continue;
          }
          await searchRecursively(fullPath);
        } else if (entry.name === 'package.json') {
          // Found a package.json, determine package manager type
          const packageDir = dir;
          const yarnLockPath = path.join(packageDir, 'yarn.lock');
          const packageLockPath = path.join(packageDir, 'package-lock.json');
          
          let packageManagerType: 'npm' | 'yarn' = 'npm';
          let lockFilePath = packageLockPath;
          
          try {
            await fs.access(yarnLockPath);
            packageManagerType = 'yarn';
            lockFilePath = yarnLockPath;
          } catch {
            // yarn.lock doesn't exist, check for package-lock.json
            try {
              await fs.access(packageLockPath);
              packageManagerType = 'npm';
              lockFilePath = packageLockPath;
            } catch {
              // No lock file found, still try with npm
              packageManagerType = 'npm';
              lockFilePath = packageLockPath;
            }
          }
          
          contexts.push({
            packageJsonPath: fullPath,
            packageManagerType,
            lockFilePath,
          });
        }
      }
    } catch (err) {
      console.warn(`⚠️ Failed to read directory ${dir}:`, err);
    }
  }

  await searchRecursively(rootDir);
  return contexts;
}

async function runAudit(context: PackageContext): Promise<AuditFinding[]> {
  const packageDir = path.dirname(context.packageJsonPath);
  
  return new Promise((resolve, reject) => {
    const tmpPath = path.join(packageDir, `audit-result-${randomUUID()}.json`);
    
    // Determine audit command based on package manager
    let cmd: string;
    if (context.packageManagerType === 'yarn') {
      cmd = `cd "${packageDir}" && yarn audit --json > "${tmpPath}" 2>/dev/null || true`;
    } else {
      cmd = `cd "${packageDir}" && npm audit --json > "${tmpPath}" 2>/dev/null || true`;
    }

    const child = exec(cmd, async (error, _stdout, stderr) => {
      if (stderr) console.error('Audit stderr:', stderr);
      
      try {
        let findings: AuditFinding[] = [];
        
        try {
          const raw = await fs.readFile(tmpPath, 'utf-8');
          if (raw.trim()) {
            if (context.packageManagerType === 'yarn') {
              findings = parseYarnAuditOutput(raw);
            } else {
              findings = parseNpmAuditOutput(raw);
            }
          }
        } catch (readErr) {
          console.warn(`⚠️ Failed to read audit output:`, readErr);
        }
        
        // Clean up temp file
        try {
          await fs.rm(tmpPath);
        } catch {
          // Ignore cleanup errors
        }
        
        // Filter for high+ severity
        const highSeverityFindings = findings.filter(f => 
          f.severity === 'high' || f.severity === 'critical'
        );
        
        resolve(highSeverityFindings);
      } catch (err) {
        reject(err);
      }
    });

    child.stdout?.setEncoding('utf8');
    child.stderr?.setEncoding('utf8');
  });
}

function parseNpmAuditOutput(output: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  
  try {
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'auditAdvisory' && data.data) {
          const advisory = data.data.advisory;
          findings.push({
            name: advisory.module_name || 'unknown',
            severity: advisory.severity || 'unknown',
            title: advisory.title || 'Vulnerability detected',
            url: advisory.url,
            range: advisory.vulnerable_versions,
            fixAvailable: data.data.resolution?.path ? true : false,
          });
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    console.warn('Failed to parse npm audit output:', err);
  }
  
  return findings;
}

function parseYarnAuditOutput(output: string): AuditFinding[] {
  const findings: AuditFinding[] = [];
  
  try {
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const data = JSON.parse(line);
        
        if (data.type === 'auditAdvisory' && data.data && data.data.advisory) {
          const advisory = data.data.advisory;
          findings.push({
            name: advisory.module_name || 'unknown',
            severity: advisory.severity || 'unknown',
            title: advisory.title || 'Vulnerability detected',
            url: advisory.url,
            range: advisory.vulnerable_versions,
            via: advisory.findings?.[0]?.paths || [],
          });
        }
      } catch {
        // Skip invalid JSON lines
      }
    }
  } catch (err) {
    console.warn('Failed to parse yarn audit output:', err);
  }
  
  return findings;
} 
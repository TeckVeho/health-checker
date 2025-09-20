import fs from 'fs/promises';
import path from 'path';

/**
 * 環境変数検証結果のインターフェース
 */
export interface EnvironmentValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
  fallbackPaths: string[];
  details: {
    [key: string]: {
      exists: boolean;
      value?: string;
      isValid: boolean;
      error?: string;
    };
  };
}

/**
 * 環境変数検証クラス
 */
export class EnvironmentValidator {
  private static readonly REQUIRED_VARS = [
    'GITHUB_API_KEY',
    'GITHUB_LOCAL_WORKSPACE',
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
    'DB_PASSWORD'
  ];

  private static readonly OPTIONAL_VARS = [
    'NODE_ENV',
    'PORT',
    'TZ',
    'OPENAI_API_KEY',
    'OPENAI_MODEL'
  ];

  /**
   * 環境変数の包括的な検証を実行
   */
  static async validateEnvironment(): Promise<EnvironmentValidationResult> {
    const result: EnvironmentValidationResult = {
      isValid: true,
      missingVars: [],
      warnings: [],
      fallbackPaths: [],
      details: {}
    };

    // 必須環境変数の検証
    for (const varName of this.REQUIRED_VARS) {
      const value = process.env[varName];
      const validation = await this.validateVariable(varName, value, true);
      result.details[varName] = validation;

      if (!validation.exists) {
        result.missingVars.push(varName);
        result.isValid = false;
      } else if (!validation.isValid) {
        result.warnings.push(`${varName}: ${validation.error}`);
        result.isValid = false;
      }
    }

    // オプション環境変数の検証
    for (const varName of this.OPTIONAL_VARS) {
      const value = process.env[varName];
      const validation = await this.validateVariable(varName, value, false);
      result.details[varName] = validation;

      if (validation.exists && !validation.isValid) {
        result.warnings.push(`${varName}: ${validation.error}`);
      }
    }

    // GITHUB_LOCAL_WORKSPACEの特別な検証
    if (process.env.GITHUB_LOCAL_WORKSPACE) {
      const workspaceValidation = await this.validateWorkspacePath(process.env.GITHUB_LOCAL_WORKSPACE);
      if (!workspaceValidation.isValid) {
        result.warnings.push(`GITHUB_LOCAL_WORKSPACE: ${workspaceValidation.error}`);
        result.fallbackPaths = await this.generateFallbackPaths();
      }
    }

    return result;
  }

  /**
   * 個別の環境変数を検証
   */
  private static async validateVariable(
    varName: string, 
    value: string | undefined, 
    required: boolean
  ): Promise<{ exists: boolean; value?: string; isValid: boolean; error?: string }> {
    if (!value) {
      return {
        exists: false,
        isValid: !required,
        error: required ? 'Required environment variable is missing' : undefined
      };
    }

    // 値の妥当性チェック
    switch (varName) {
      case 'GITHUB_API_KEY':
        if (!value.startsWith('ghp_') && !value.startsWith('gho_') && !value.startsWith('ghu_')) {
          return {
            exists: true,
            value: value.substring(0, 8) + '...',
            isValid: false,
            error: 'Invalid GitHub API key format'
          };
        }
        break;

      case 'GITHUB_LOCAL_WORKSPACE':
        const workspaceValidation = await this.validateWorkspacePath(value);
        return {
          exists: true,
          value,
          isValid: workspaceValidation.isValid,
          error: workspaceValidation.error
        };

      case 'DB_HOST':
        if (!value || value.trim() === '') {
          return {
            exists: true,
            value,
            isValid: false,
            error: 'Database host cannot be empty'
          };
        }
        break;

      case 'NODE_ENV':
        if (!['development', 'production', 'test'].includes(value)) {
          return {
            exists: true,
            value,
            isValid: false,
            error: 'NODE_ENV must be development, production, or test'
          };
        }
        break;
    }

    return {
      exists: true,
      value: varName.includes('PASSWORD') || varName.includes('KEY') ? value.substring(0, 8) + '...' : value,
      isValid: true
    };
  }

  /**
   * ワークスペースパスの検証
   */
  private static async validateWorkspacePath(workspacePath: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // パスの存在確認
      await fs.access(workspacePath);
      
      // ディレクトリかどうか確認
      const stats = await fs.stat(workspacePath);
      if (!stats.isDirectory()) {
        return {
          isValid: false,
          error: 'Path exists but is not a directory'
        };
      }

      // 書き込み権限の確認
      try {
        await fs.access(workspacePath, fs.constants.W_OK);
      } catch {
        return {
          isValid: false,
          error: 'Directory exists but is not writable'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Directory does not exist or is not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * フォールバックパスの生成
   */
  private static async generateFallbackPaths(): Promise<string[]> {
    const fallbackPaths: string[] = [];
    
    // システム一時ディレクトリ
    const tmpDir = process.env.TMPDIR || process.env.TMP || '/tmp';
    fallbackPaths.push(path.join(tmpDir, 'github-workspace'));
    
    // プロジェクトルートの一時ディレクトリ
    const projectRoot = process.cwd();
    fallbackPaths.push(path.join(projectRoot, 'tmp', 'github-workspace'));
    
    // ホームディレクトリの一時ディレクトリ
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    if (homeDir) {
      fallbackPaths.push(path.join(homeDir, 'tmp', 'github-workspace'));
    }

    return fallbackPaths;
  }

  /**
   * フォールバックパスの作成
   */
  static async createFallbackWorkspace(): Promise<string> {
    const fallbackPaths = await this.generateFallbackPaths();
    
    for (const fallbackPath of fallbackPaths) {
      try {
        await fs.mkdir(fallbackPath, { recursive: true });
        console.log(`✅ Created fallback workspace: ${fallbackPath}`);
        return fallbackPath;
      } catch (error) {
        console.warn(`⚠️ Failed to create fallback workspace at ${fallbackPath}:`, error);
        continue;
      }
    }
    
    throw new Error('Failed to create any fallback workspace directory');
  }

  /**
   * 環境変数検証のログ出力
   */
  static logValidationResult(result: EnvironmentValidationResult): void {
    console.log('🔍 Environment Validation Results:');
    console.log(`   Valid: ${result.isValid ? '✅' : '❌'}`);
    
    if (result.missingVars.length > 0) {
      console.log(`   Missing Variables: ${result.missingVars.join(', ')}`);
    }
    
    if (result.warnings.length > 0) {
      console.log('   Warnings:');
      result.warnings.forEach(warning => console.log(`     - ${warning}`));
    }
    
    if (result.fallbackPaths.length > 0) {
      console.log('   Fallback Paths:');
      result.fallbackPaths.forEach(path => console.log(`     - ${path}`));
    }
  }
}

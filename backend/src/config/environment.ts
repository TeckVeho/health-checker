import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

/**
 * 環境変数の初期化と検証
 */
export class EnvironmentConfig {
  private static initialized = false;

  /**
   * 環境変数を初期化
   */
  static initialize(): void {
    if (this.initialized) {
      return;
    }

    console.log('[EnvironmentConfig] Initializing environment variables...');

    // アプリケーションのルートディレクトリを取得
    const appRoot = process.cwd();
    console.log(`[EnvironmentConfig] Application root: ${appRoot}`);

    // .envファイルのパスを決定
    const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
    const envPath = path.resolve(appRoot, envFile);

    console.log(`[EnvironmentConfig] Looking for .env file at: ${envPath}`);

    // .envファイルの存在確認
    try {
      fs.accessSync(envPath, fs.constants.F_OK);
      console.log(`[EnvironmentConfig] .env file found at: ${envPath}`);
    } catch (error) {
      console.error(`[EnvironmentConfig] .env file not found at: ${envPath}`);
      console.error(`[EnvironmentConfig] Error:`, error);
      return;
    }

    // dotenv.config()を実行
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.error(`[EnvironmentConfig] Error loading .env file:`, result.error);
    } else {
      console.log(`[EnvironmentConfig] Environment loaded successfully from: ${envPath}`);
    }

    // 重要な環境変数の確認
    this.validateCriticalVariables();

    this.initialized = true;
  }

  /**
   * 重要な環境変数の検証
   */
  private static validateCriticalVariables(): void {
    const criticalVars = [
      'GITHUB_API_KEY',
      'GITHUB_LOCAL_WORKSPACE',
      'DB_HOST',
      'DB_USER',
      'DB_NAME',
      'DB_PASSWORD'
    ];

    console.log('[EnvironmentConfig] Validating critical environment variables:');
    
    for (const varName of criticalVars) {
      const value = process.env[varName];
      if (value) {
        // 機密情報は一部のみ表示
        const displayValue = varName.includes('PASSWORD') || varName.includes('KEY') 
          ? `${value.substring(0, 8)}...` 
          : value;
        console.log(`[EnvironmentConfig] ✅ ${varName}: ${displayValue}`);
      } else {
        console.error(`[EnvironmentConfig] ❌ ${varName}: NOT SET`);
      }
    }

    // GITHUB_LOCAL_WORKSPACEの特別な検証
    const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
    if (workspace) {
      try {
        fs.accessSync(workspace, fs.constants.F_OK | fs.constants.W_OK);
        console.log(`[EnvironmentConfig] ✅ GITHUB_LOCAL_WORKSPACE directory accessible: ${workspace}`);
      } catch (error) {
        console.error(`[EnvironmentConfig] ❌ GITHUB_LOCAL_WORKSPACE directory not accessible: ${workspace}`);
        console.error(`[EnvironmentConfig] Error:`, error);
      }
    }
  }

  /**
   * 環境変数の状態を取得
   */
  static getStatus(): {
    initialized: boolean;
    githubWorkspace: string | undefined;
    githubApiKey: string | undefined;
    dbHost: string | undefined;
  } {
    return {
      initialized: this.initialized,
      githubWorkspace: process.env.GITHUB_LOCAL_WORKSPACE,
      githubApiKey: process.env.GITHUB_API_KEY,
      dbHost: process.env.DB_HOST
    };
  }
}

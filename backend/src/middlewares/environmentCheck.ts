import { Request, Response, NextFunction } from 'express';
import { EnvironmentValidator, EnvironmentValidationResult } from '../utils/environmentUtils';

/**
 * 環境変数検証ミドルウェア
 * ReCheck関連のエンドポイントで環境変数の状態を確認
 */
export const environmentCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ReCheck関連のエンドポイントのみで実行
  if (!req.path.includes('/recheck')) {
    return next();
  }

  try {
    console.log(`[EnvironmentCheck] Validating environment for ${req.method} ${req.path}`);
    
    const validation = await EnvironmentValidator.validateEnvironment();
    
    // 詳細な検証結果をログ出力
    EnvironmentValidator.logValidationResult(validation);
    
    // 環境変数が無効な場合の処理
    if (!validation.isValid) {
      console.error(`[EnvironmentCheck] Environment validation failed`);
      
      // 警告のみで続行（フォールバック処理に委ねる）
      if (validation.warnings.length > 0) {
        console.warn(`[EnvironmentCheck] Environment warnings:`, validation.warnings);
      }
      
      // 致命的なエラーの場合は早期リターン
      if (validation.missingVars.length > 0) {
        const missingVars = validation.missingVars.join(', ');
        console.error(`[EnvironmentCheck] Missing critical environment variables: ${missingVars}`);
        
        res.status(500).json({
          success: false,
          message: 'Environment configuration error',
          error: {
            code: 'ENVIRONMENT_ERROR',
            message: `Environment validation failed:\nMissing required variables: ${missingVars}\n\nPlease check your environment configuration and try again.`,
            details: {
              missingVariables: validation.missingVars,
              warnings: validation.warnings,
              fallbackPaths: validation.fallbackPaths,
              environmentDetails: validation.details
            }
          }
        });
        return;
      }
    }
    
    // 環境変数の状態をリクエストオブジェクトに追加
    req.environmentStatus = {
      isValid: validation.isValid,
      warnings: validation.warnings,
      fallbackPaths: validation.fallbackPaths
    };
    
    next();
  } catch (error) {
    console.error(`[EnvironmentCheck] Error during environment validation:`, error);
    
    // 環境変数検証でエラーが発生した場合も続行（フォールバック処理に委ねる）
    req.environmentStatus = {
      isValid: false,
      warnings: [`Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      fallbackPaths: []
    };
    
    next();
  }
};

// 型定義の拡張
declare global {
  namespace Express {
    interface Request {
      environmentStatus?: {
        isValid: boolean;
        warnings: string[];
        fallbackPaths: string[];
      };
    }
  }
}

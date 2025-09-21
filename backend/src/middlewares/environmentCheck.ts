import { Request, Response, NextFunction } from 'express';
import { EnvironmentValidator } from '../utils/environmentUtils';

/**
 * Environment variable validation middleware
 * Check environment variable status for ReCheck-related endpoints
 */
export const environmentCheck = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Only execute for ReCheck-related endpoints
  if (!req.path.includes('/recheck')) {
    return next();
  }

  try {
    console.log(`[EnvironmentCheck] Validating environment for ${req.method} ${req.path}`);
    
    const validation = await EnvironmentValidator.validateEnvironment();
    
    // Log detailed validation results
    EnvironmentValidator.logValidationResult(validation);
    
    // Handle invalid environment variables
    if (!validation.isValid) {
      console.error(`[EnvironmentCheck] Environment validation failed`);
      
      // Continue with warnings only (delegate to fallback processing)
      if (validation.warnings.length > 0) {
        console.warn(`[EnvironmentCheck] Environment warnings:`, validation.warnings);
      }
      
      // Early return for fatal errors
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
    
    // Add environment variable status to request object
    req.environmentStatus = {
      isValid: validation.isValid,
      warnings: validation.warnings,
      fallbackPaths: validation.fallbackPaths
    };
    
    next();
  } catch (error) {
    console.error(`[EnvironmentCheck] Error during environment validation:`, error);
    
    // Continue even if environment variable validation fails (delegate to fallback processing)
    req.environmentStatus = {
      isValid: false,
      warnings: [`Environment validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      fallbackPaths: []
    };
    
    next();
  }
};

// Type definition extension
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

/**
 * Gitleaks Error Handler Utility
 * 
 * Provides comprehensive error handling for gitleaks command execution
 * and JSON parsing operations.
 */

export interface GitleaksErrorContext {
  error: Error;
  workspace: string;
  command: string;
  stdout?: string;
  stderr?: string;
  executionTime?: number;
}

export interface GitleaksExecutionResult {
  success: boolean;
  findings: any[];
  error?: GitleaksErrorContext;
  executionTime: number;
}

export class GitleaksErrorHandler {
  /**
   * Handle command execution errors
   */
  static handleCommandError(
    error: Error,
    context: {
      workspace: string;
      command: string;
      stderr?: string;
      executionTime?: number;
    }
  ): GitleaksErrorContext {
    const errorContext: GitleaksErrorContext = {
      error,
      workspace: context.workspace,
      command: context.command,
      stderr: context.stderr,
      executionTime: context.executionTime,
    };

    // Log detailed error information
    console.error('🚨 Gitleaks command execution failed:');
    console.error(`   Command: ${context.command}`);
    console.error(`   Workspace: ${context.workspace}`);
    console.error(`   Error: ${error.message}`);
    if (context.stderr) {
      console.error(`   Stderr: ${context.stderr}`);
    }
    if (context.executionTime) {
      console.error(`   Execution time: ${context.executionTime}ms`);
    }

    return errorContext;
  }

  /**
   * Handle JSON parsing errors
   */
  static handleJsonParseError(
    error: Error,
    context: {
      workspace: string;
      command: string;
      stdout?: string;
      executionTime?: number;
    }
  ): GitleaksErrorContext {
    const errorContext: GitleaksErrorContext = {
      error,
      workspace: context.workspace,
      command: context.command,
      stdout: context.stdout,
      executionTime: context.executionTime,
    };

    // Log detailed error information
    console.error('🚨 Gitleaks JSON parsing failed:');
    console.error(`   Command: ${context.command}`);
    console.error(`   Workspace: ${context.workspace}`);
    console.error(`   Parse error: ${error.message}`);
    if (context.stdout) {
      console.error(`   Raw stdout (first 500 chars): ${context.stdout.substring(0, 500)}`);
    }
    if (context.executionTime) {
      console.error(`   Execution time: ${context.executionTime}ms`);
    }

    return errorContext;
  }

  /**
   * Provide fallback solution based on error type
   */
  static provideFallbackSolution(errorContext: GitleaksErrorContext): string {
    const { error, command, workspace } = errorContext;

    // Check if it's a command not found error
    if (error.message.includes('gitleaks') && error.message.includes('not found')) {
      return `Gitleaks command not found. Please ensure gitleaks is installed and available in PATH. Command: ${command}`;
    }

    // Check if it's a permission error
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      return `Permission denied accessing workspace: ${workspace}. Please check directory permissions.`;
    }

    // Check if it's a JSON parsing error
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return `Failed to parse gitleaks output as JSON. The command may have produced unexpected output. Command: ${command}`;
    }

    // Check if it's a workspace access error
    if (error.message.includes('ENOENT') && error.message.includes(workspace)) {
      return `Workspace directory not found: ${workspace}. Please verify GITHUB_LOCAL_WORKSPACE environment variable.`;
    }

    // Generic fallback
    return `Gitleaks execution failed with error: ${error.message}. Command: ${command}`;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverableError(errorContext: GitleaksErrorContext): boolean {
    const { error } = errorContext;

    // Command not found - not recoverable
    if (error.message.includes('gitleaks') && error.message.includes('not found')) {
      return false;
    }

    // Permission errors - not recoverable without system changes
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      return false;
    }

    // Workspace not found - not recoverable without configuration changes
    if (error.message.includes('ENOENT') && error.message.includes('workspace')) {
      return false;
    }

    // JSON parsing errors - potentially recoverable with retry
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return true;
    }

    // Network or temporary errors - potentially recoverable
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return true;
    }

    // Default to not recoverable for unknown errors
    return false;
  }

  /**
   * Get error severity level
   */
  static getErrorSeverity(errorContext: GitleaksErrorContext): 'low' | 'medium' | 'high' | 'critical' {
    const { error } = errorContext;

    // Critical: Command not found or workspace issues
    if (error.message.includes('gitleaks') && error.message.includes('not found')) {
      return 'critical';
    }
    if (error.message.includes('ENOENT') && error.message.includes('workspace')) {
      return 'critical';
    }

    // High: Permission errors
    if (error.message.includes('permission') || error.message.includes('EACCES')) {
      return 'high';
    }

    // Medium: JSON parsing errors
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      return 'medium';
    }

    // Low: Network or temporary errors
    if (error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
      return 'low';
    }

    // Default to medium for unknown errors
    return 'medium';
  }

  /**
   * Format error for logging
   */
  static formatErrorForLogging(errorContext: GitleaksErrorContext): string {
    const { error, command, workspace, executionTime } = errorContext;
    const severity = this.getErrorSeverity(errorContext);
    const isRecoverable = this.isRecoverableError(errorContext);

    return `[GitleaksError] ${severity.toUpperCase()} - ${isRecoverable ? 'RECOVERABLE' : 'NON-RECOVERABLE'}
  Command: ${command}
  Workspace: ${workspace}
  Error: ${error.message}
  Execution time: ${executionTime || 'unknown'}ms
  Timestamp: ${new Date().toISOString()}`;
  }
}

import { GitleaksErrorHandler, GitleaksErrorContext } from '../../../../../src/domain/alert/util/gitleaksErrorHandler';

describe('GitleaksErrorHandler', () => {
  describe('handleCommandError', () => {
    it('should create error context for command execution errors', () => {
      const error = new Error('Command failed');
      const context = {
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
        stderr: 'Error: command not found',
        executionTime: 1000,
      };

      const result = GitleaksErrorHandler.handleCommandError(error, context);

      expect(result).toEqual({
        error,
        workspace: context.workspace,
        command: context.command,
        stderr: context.stderr,
        executionTime: context.executionTime,
      });
    });

    it('should handle missing optional fields', () => {
      const error = new Error('Command failed');
      const context = {
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.handleCommandError(error, context);

      expect(result).toEqual({
        error,
        workspace: context.workspace,
        command: context.command,
        stderr: undefined,
        executionTime: undefined,
      });
    });
  });

  describe('handleJsonParseError', () => {
    it('should create error context for JSON parsing errors', () => {
      const error = new Error('Unexpected token in JSON');
      const context = {
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
        stdout: 'invalid json content',
        executionTime: 500,
      };

      const result = GitleaksErrorHandler.handleJsonParseError(error, context);

      expect(result).toEqual({
        error,
        workspace: context.workspace,
        command: context.command,
        stdout: context.stdout,
        executionTime: context.executionTime,
      });
    });
  });

  describe('provideFallbackSolution', () => {
    it('should provide solution for command not found error', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('gitleaks: command not found'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.provideFallbackSolution(errorContext);

      expect(result).toContain('Gitleaks command not found');
      expect(result).toContain('gitleaks detect --test');
    });

    it('should provide solution for permission error', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('permission denied'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.provideFallbackSolution(errorContext);

      expect(result).toContain('Permission denied');
      expect(result).toContain('/test/workspace');
    });

    it('should provide solution for JSON parsing error', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unexpected token in JSON'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.provideFallbackSolution(errorContext);

      expect(result).toContain('Failed to parse gitleaks output as JSON');
      expect(result).toContain('gitleaks detect --test');
    });

    it('should provide solution for workspace not found error', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('ENOENT: no such file or directory, open \'/test/workspace\''),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.provideFallbackSolution(errorContext);

      expect(result).toContain('Workspace directory not found');
      expect(result).toContain('/test/workspace');
      expect(result).toContain('GITHUB_LOCAL_WORKSPACE');
    });

    it('should provide generic solution for unknown errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unknown error occurred'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.provideFallbackSolution(errorContext);

      expect(result).toContain('Gitleaks execution failed with error');
      expect(result).toContain('Unknown error occurred');
      expect(result).toContain('gitleaks detect --test');
    });
  });

  describe('isRecoverableError', () => {
    it('should return false for command not found errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('gitleaks: command not found'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(false);
    });

    it('should return false for permission errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('permission denied'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(false);
    });

    it('should return false for workspace not found errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('ENOENT: no such file or directory, open \'/test/workspace\''),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(false);
    });

    it('should return true for JSON parsing errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unexpected token in JSON'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(true);
    });

    it('should return true for timeout errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('timeout occurred'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(true);
    });

    it('should return true for connection errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('ECONNREFUSED'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(true);
    });

    it('should return false for unknown errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unknown error'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.isRecoverableError(errorContext);

      expect(result).toBe(false);
    });
  });

  describe('getErrorSeverity', () => {
    it('should return critical for command not found errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('gitleaks: command not found'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('critical');
    });

    it('should return critical for workspace not found errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('ENOENT: no such file or directory, open \'/test/workspace\''),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('critical');
    });

    it('should return high for permission errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('permission denied'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('high');
    });

    it('should return medium for JSON parsing errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unexpected token in JSON'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('medium');
    });

    it('should return low for timeout errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('timeout occurred'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('low');
    });

    it('should return medium for unknown errors', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Unknown error'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.getErrorSeverity(errorContext);

      expect(result).toBe('medium');
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format error for logging with all fields', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Test error'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
        executionTime: 1000,
      };

      const result = GitleaksErrorHandler.formatErrorForLogging(errorContext);

      expect(result).toContain('[GitleaksError]');
      expect(result).toContain('MEDIUM');
      expect(result).toContain('NON-RECOVERABLE');
      expect(result).toContain('gitleaks detect --test');
      expect(result).toContain('/test/workspace');
      expect(result).toContain('Test error');
      expect(result).toContain('1000ms');
      expect(result).toContain('Timestamp:');
    });

    it('should handle missing execution time', () => {
      const errorContext: GitleaksErrorContext = {
        error: new Error('Test error'),
        workspace: '/test/workspace',
        command: 'gitleaks detect --test',
      };

      const result = GitleaksErrorHandler.formatErrorForLogging(errorContext);

      expect(result).toContain('Execution time: unknown');
    });
  });
});

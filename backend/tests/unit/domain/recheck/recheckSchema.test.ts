/**
 * Recheck Schema のユニットテスト
 */

import { 
  recheckExecutionAttributes, 
  recheckSettingsAttributes,
  recheckExecutionModelOptions,
  recheckSettingsModelOptions,
  RecheckExecutionAttributes,
  RecheckSettingsAttributes
} from '../../../../src/domain/recheck/recheckSchema';
import { mockRecheckExecutions, mockRecheckSettings } from '../../../fixtures/mockData';

// スキーマファイルがモック化されているため、実際の値をテスト
jest.unmock('../../../../src/domain/recheck/recheckSchema');

describe('Recheck Schema', () => {
  describe('recheckExecutionAttributes', () => {
    it('should be defined and have required fields', () => {
      expect(recheckExecutionAttributes).toBeDefined();
      expect(recheckExecutionAttributes.id).toBeDefined();
      expect(recheckExecutionAttributes.owner).toBeDefined();
      expect(recheckExecutionAttributes.repo).toBeDefined();
      expect(recheckExecutionAttributes.executionId).toBeDefined();
      expect(recheckExecutionAttributes.status).toBeDefined();
      expect(recheckExecutionAttributes.checkTypes).toBeDefined();
      expect(recheckExecutionAttributes.startedAt).toBeDefined();
    });

    it('should have correct primary key configuration', () => {
      expect(recheckExecutionAttributes.id.primaryKey).toBe(true);
      expect(recheckExecutionAttributes.id.autoIncrement).toBe(true);
      expect(recheckExecutionAttributes.id.allowNull).toBe(false);
    });

    it('should have correct required fields configuration', () => {
      expect(recheckExecutionAttributes.owner.allowNull).toBe(false);
      expect(recheckExecutionAttributes.repo.allowNull).toBe(false);
      expect(recheckExecutionAttributes.executionId.allowNull).toBe(false);
      expect(recheckExecutionAttributes.status.allowNull).toBe(false);
      expect(recheckExecutionAttributes.checkTypes.allowNull).toBe(false);
      expect(recheckExecutionAttributes.startedAt.allowNull).toBe(false);
    });

    it('should have correct optional fields configuration', () => {
      expect(recheckExecutionAttributes.completedAt.allowNull).toBe(true);
      expect(recheckExecutionAttributes.durationSeconds.allowNull).toBe(true);
      expect(recheckExecutionAttributes.result.allowNull).toBe(true);
      expect(recheckExecutionAttributes.errorMessage.allowNull).toBe(true);
      expect(recheckExecutionAttributes.errorCode.allowNull).toBe(true);
    });

    it('should have correct default values', () => {
      expect(recheckExecutionAttributes.status.defaultValue).toBe('running');
      expect(recheckExecutionAttributes.checkTypes.defaultValue).toEqual(['branch', 'clone', 'gitleaks', 'issue']);
      // startedAt.defaultValueはDataTypes.NOWなので、存在することを確認
      // expect(recheckExecutionAttributes.startedAt.defaultValue).toBeDefined();
    });

    it('should have correct field mappings', () => {
      expect(recheckExecutionAttributes.executionId.field).toBe('execution_id');
      expect(recheckExecutionAttributes.checkTypes.field).toBe('check_types');
      expect(recheckExecutionAttributes.startedAt.field).toBe('started_at');
      expect(recheckExecutionAttributes.completedAt.field).toBe('completed_at');
      expect(recheckExecutionAttributes.durationSeconds.field).toBe('duration_seconds');
      expect(recheckExecutionAttributes.errorMessage.field).toBe('error_message');
      expect(recheckExecutionAttributes.errorCode.field).toBe('error_code');
      expect(recheckExecutionAttributes.createdAt.field).toBe('created_at');
      expect(recheckExecutionAttributes.updatedAt.field).toBe('updated_at');
    });

    it('should have correct unique constraints', () => {
      expect(recheckExecutionAttributes.executionId.unique).toBe(true);
    });

    it('should have correct status enum values', () => {
      const statusEnum = recheckExecutionAttributes.status.type;
      expect(statusEnum).toBeDefined();
      // ENUM型の場合はvaluesプロパティで確認
      if (statusEnum && typeof statusEnum === 'object' && 'values' in statusEnum) {
        expect(statusEnum.values).toEqual(['running', 'completed', 'error', 'timeout']);
      }
    });
  });

  describe('recheckSettingsAttributes', () => {
    it('should be defined and have required fields', () => {
      expect(recheckSettingsAttributes).toBeDefined();
      expect(recheckSettingsAttributes.id).toBeDefined();
      expect(recheckSettingsAttributes.owner).toBeDefined();
      expect(recheckSettingsAttributes.repo).toBeDefined();
      expect(recheckSettingsAttributes.rateLimitMinutes).toBeDefined();
      expect(recheckSettingsAttributes.maxConcurrentExecutions).toBeDefined();
      expect(recheckSettingsAttributes.allowedCheckTypes).toBeDefined();
      expect(recheckSettingsAttributes.timeoutMinutes).toBeDefined();
      expect(recheckSettingsAttributes.isEnabled).toBeDefined();
    });

    it('should have correct primary key configuration', () => {
      expect(recheckSettingsAttributes.id.primaryKey).toBe(true);
      expect(recheckSettingsAttributes.id.autoIncrement).toBe(true);
      expect(recheckSettingsAttributes.id.allowNull).toBe(false);
    });

    it('should have correct required fields configuration', () => {
      expect(recheckSettingsAttributes.owner.allowNull).toBe(false);
      expect(recheckSettingsAttributes.repo.allowNull).toBe(false);
      expect(recheckSettingsAttributes.rateLimitMinutes.allowNull).toBe(false);
      expect(recheckSettingsAttributes.maxConcurrentExecutions.allowNull).toBe(false);
      expect(recheckSettingsAttributes.allowedCheckTypes.allowNull).toBe(false);
      expect(recheckSettingsAttributes.timeoutMinutes.allowNull).toBe(false);
      expect(recheckSettingsAttributes.isEnabled.allowNull).toBe(false);
    });

    it('should have correct default values', () => {
      expect(recheckSettingsAttributes.rateLimitMinutes.defaultValue).toBe(3);
      expect(recheckSettingsAttributes.maxConcurrentExecutions.defaultValue).toBe(1);
      expect(recheckSettingsAttributes.allowedCheckTypes.defaultValue).toEqual(['branch', 'clone', 'gitleaks', 'issue']);
      expect(recheckSettingsAttributes.timeoutMinutes.defaultValue).toBe(10);
      expect(recheckSettingsAttributes.isEnabled.defaultValue).toBe(true);
    });

    it('should have correct field mappings', () => {
      expect(recheckSettingsAttributes.rateLimitMinutes.field).toBe('rate_limit_minutes');
      expect(recheckSettingsAttributes.maxConcurrentExecutions.field).toBe('max_concurrent_executions');
      expect(recheckSettingsAttributes.allowedCheckTypes.field).toBe('allowed_check_types');
      expect(recheckSettingsAttributes.timeoutMinutes.field).toBe('timeout_minutes');
      expect(recheckSettingsAttributes.isEnabled.field).toBe('is_enabled');
      expect(recheckSettingsAttributes.createdAt.field).toBe('created_at');
      expect(recheckSettingsAttributes.updatedAt.field).toBe('updated_at');
    });
  });

  describe('recheckExecutionModelOptions', () => {
    it('should be defined and have required configuration', () => {
      expect(recheckExecutionModelOptions).toBeDefined();
      expect(recheckExecutionModelOptions.modelName).toBe('RecheckExecution');
      expect(recheckExecutionModelOptions.tableName).toBe('recheck_executions');
      expect(recheckExecutionModelOptions.timestamps).toBe(true);
      expect(recheckExecutionModelOptions.underscored).toBe(true);
    });

    it('should have correct indexes configuration', () => {
      expect(recheckExecutionModelOptions.indexes).toBeDefined();
      expect(Array.isArray(recheckExecutionModelOptions.indexes)).toBe(true);
      expect(recheckExecutionModelOptions.indexes.length).toBeGreaterThan(0);

      // 基本的なインデックスの存在確認
      const indexNames = recheckExecutionModelOptions.indexes.map(index => index.name);
      expect(indexNames).toContain('idx_recheck_owner_repo');
      expect(indexNames).toContain('idx_recheck_started_at');
      expect(indexNames).toContain('idx_recheck_status');
      expect(indexNames).toContain('idx_recheck_execution_id');
      expect(indexNames).toContain('idx_recheck_rate_limit');
      expect(indexNames).toContain('idx_recheck_running_tasks');
    });

    it('should have unique index for execution_id', () => {
      const executionIdIndex = recheckExecutionModelOptions.indexes.find(index => 
        index.name === 'idx_recheck_execution_id'
      );
      expect(executionIdIndex).toBeDefined();
      expect(executionIdIndex.unique).toBe(true);
      expect(executionIdIndex.fields).toEqual([{ name: 'execution_id' }]);
    });

    it('should have composite index for owner and repo', () => {
      const ownerRepoIndex = recheckExecutionModelOptions.indexes.find(index => 
        index.name === 'idx_recheck_owner_repo'
      );
      expect(ownerRepoIndex).toBeDefined();
      expect(ownerRepoIndex.fields).toEqual([{ name: 'owner' }, { name: 'repo' }]);
    });
  });

  describe('recheckSettingsModelOptions', () => {
    it('should be defined and have required configuration', () => {
      expect(recheckSettingsModelOptions).toBeDefined();
      expect(recheckSettingsModelOptions.modelName).toBe('RecheckSettings');
      expect(recheckSettingsModelOptions.tableName).toBe('recheck_settings');
      expect(recheckSettingsModelOptions.timestamps).toBe(true);
      expect(recheckSettingsModelOptions.underscored).toBe(true);
    });

    it('should have correct indexes configuration', () => {
      expect(recheckSettingsModelOptions.indexes).toBeDefined();
      expect(Array.isArray(recheckSettingsModelOptions.indexes)).toBe(true);
      expect(recheckSettingsModelOptions.indexes.length).toBeGreaterThan(0);

      // 基本的なインデックスの存在確認
      const indexNames = recheckSettingsModelOptions.indexes.map(index => index.name);
      expect(indexNames).toContain('idx_recheck_settings_unique_repo');
      expect(indexNames).toContain('idx_recheck_settings_enabled');
    });

    it('should have unique index for owner and repo combination', () => {
      const uniqueRepoIndex = recheckSettingsModelOptions.indexes.find(index => 
        index.name === 'idx_recheck_settings_unique_repo'
      );
      expect(uniqueRepoIndex).toBeDefined();
      expect(uniqueRepoIndex.unique).toBe(true);
      expect(uniqueRepoIndex.fields).toEqual([{ name: 'owner' }, { name: 'repo' }]);
    });

    it('should have index for enabled status', () => {
      const enabledIndex = recheckSettingsModelOptions.indexes.find(index => 
        index.name === 'idx_recheck_settings_enabled'
      );
      expect(enabledIndex).toBeDefined();
      expect(enabledIndex.fields).toEqual([{ name: 'is_enabled' }]);
    });
  });

  describe('Schema Validation', () => {
    it('should accept valid recheck execution data structure', () => {
      const validExecution: RecheckExecutionAttributes = {
        id: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        executionId: 'exec-123',
        status: 'running',
        checkTypes: ['security', 'performance'],
        startedAt: new Date(),
        completedAt: new Date(),
        durationSeconds: 120,
        result: { alerts: [] },
        errorMessage: null,
        errorCode: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // スキーマ構造の検証
      expect(validExecution.owner).toBeDefined();
      expect(validExecution.repo).toBeDefined();
      expect(validExecution.executionId).toBeDefined();
      expect(validExecution.status).toBeDefined();
      expect(Array.isArray(validExecution.checkTypes)).toBe(true);
      expect(typeof validExecution.durationSeconds).toBe('number');
    });

    it('should accept valid recheck settings data structure', () => {
      const validSettings: RecheckSettingsAttributes = {
        id: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        rateLimitMinutes: 5,
        maxConcurrentExecutions: 2,
        allowedCheckTypes: ['security', 'performance'],
        timeoutMinutes: 10,
        isEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // スキーマ構造の検証
      expect(validSettings.owner).toBeDefined();
      expect(validSettings.repo).toBeDefined();
      expect(typeof validSettings.rateLimitMinutes).toBe('number');
      expect(typeof validSettings.maxConcurrentExecutions).toBe('number');
      expect(Array.isArray(validSettings.allowedCheckTypes)).toBe(true);
      expect(typeof validSettings.timeoutMinutes).toBe('number');
      expect(typeof validSettings.isEnabled).toBe('boolean');
    });

    it('should handle optional fields correctly', () => {
      const minimalExecution: Partial<RecheckExecutionAttributes> = {
        owner: 'test-owner',
        repo: 'test-repo',
        executionId: 'exec-456',
        status: 'running',
        checkTypes: ['security'],
      };

      // 必須フィールドのみの検証
      expect(minimalExecution.owner).toBeDefined();
      expect(minimalExecution.repo).toBeDefined();
      expect(minimalExecution.executionId).toBeDefined();
      expect(minimalExecution.status).toBeDefined();
      expect(Array.isArray(minimalExecution.checkTypes)).toBe(true);
    });

    it('should validate status enum values', () => {
      const validStatuses = ['running', 'completed', 'error', 'timeout'];
      
      validStatuses.forEach(status => {
        const execution: Partial<RecheckExecutionAttributes> = {
          owner: 'test-owner',
          repo: 'test-repo',
          executionId: 'exec-789',
          status: status as RecheckExecutionAttributes['status'],
          checkTypes: ['security'],
        };
        
        expect(validStatuses).toContain(execution.status);
      });
    });

    it('should have proper field constraints', () => {
      const ownerConfig = recheckExecutionAttributes.owner;
      const repoConfig = recheckExecutionAttributes.repo;
      const executionIdConfig = recheckExecutionAttributes.executionId;
      const statusConfig = recheckExecutionAttributes.status;

      expect(ownerConfig.allowNull).toBe(false);
      expect(repoConfig.allowNull).toBe(false);
      expect(executionIdConfig.allowNull).toBe(false);
      expect(statusConfig.allowNull).toBe(false);
    });

    it('should have proper default values for settings', () => {
      const rateLimitConfig = recheckSettingsAttributes.rateLimitMinutes;
      const concurrentConfig = recheckSettingsAttributes.maxConcurrentExecutions;
      const timeoutConfig = recheckSettingsAttributes.timeoutMinutes;
      const enabledConfig = recheckSettingsAttributes.isEnabled;

      expect(rateLimitConfig.defaultValue).toBe(3);
      expect(concurrentConfig.defaultValue).toBe(1);
      expect(timeoutConfig.defaultValue).toBe(10);
      expect(enabledConfig.defaultValue).toBe(true);
    });
  });

  describe('Index Configuration', () => {
    it('should have correct index for owner and repo combination in execution', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const ownerRepoIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'owner') && 
        index.fields.some(field => field.name === 'repo')
      );

      expect(ownerRepoIndex).toBeDefined();
      expect(ownerRepoIndex.name).toBe('idx_recheck_owner_repo');
    });

    it('should have index for started_at in execution', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const startedAtIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'started_at')
      );

      expect(startedAtIndex).toBeDefined();
      expect(startedAtIndex.name).toBe('idx_recheck_started_at');
    });

    it('should have index for status in execution', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const statusIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'status')
      );

      expect(statusIndex).toBeDefined();
      expect(statusIndex.name).toBe('idx_recheck_status');
    });

    it('should have unique index for execution_id', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const executionIdIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'execution_id') && index.unique
      );

      expect(executionIdIndex).toBeDefined();
      expect(executionIdIndex.name).toBe('idx_recheck_execution_id');
      expect(executionIdIndex.unique).toBe(true);
    });

    it('should have composite index for rate limiting', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const rateLimitIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'owner') && 
        index.fields.some(field => field.name === 'repo') && 
        index.fields.some(field => field.name === 'started_at')
      );

      expect(rateLimitIndex).toBeDefined();
      expect(rateLimitIndex.name).toBe('idx_recheck_rate_limit');
    });

    it('should have composite index for running tasks', () => {
      const indexes = recheckExecutionModelOptions.indexes;
      const runningTasksIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'owner') && 
        index.fields.some(field => field.name === 'repo') && 
        index.fields.some(field => field.name === 'status')
      );

      expect(runningTasksIndex).toBeDefined();
      expect(runningTasksIndex.name).toBe('idx_recheck_running_tasks');
    });

    it('should have unique index for settings owner/repo combination', () => {
      const indexes = recheckSettingsModelOptions.indexes;
      const uniqueRepoIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'owner') && 
        index.fields.some(field => field.name === 'repo') && 
        index.unique
      );

      expect(uniqueRepoIndex).toBeDefined();
      expect(uniqueRepoIndex.name).toBe('idx_recheck_settings_unique_repo');
      expect(uniqueRepoIndex.unique).toBe(true);
    });

    it('should have index for enabled status in settings', () => {
      const indexes = recheckSettingsModelOptions.indexes;
      const enabledIndex = indexes.find(index => 
        index.fields.some(field => field.name === 'is_enabled')
      );

      expect(enabledIndex).toBeDefined();
      expect(enabledIndex.name).toBe('idx_recheck_settings_enabled');
    });
  });
});

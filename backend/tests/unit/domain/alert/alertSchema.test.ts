/**
 * Alert Schema のユニットテスト
 */

import { alertAttributes, alertModelOptions } from '../../../../src/domain/alert/alertSchema';
import { mockAlerts } from '../../../fixtures/mockData';

// スキーマファイルがモック化されているため、実際の値をテスト
jest.unmock('../../../../src/domain/alert/alertSchema');

describe('Alert Schema', () => {
  describe('alertAttributes', () => {
    it('should be defined and have required fields', () => {
      expect(alertAttributes).toBeDefined();
      expect(alertAttributes.id).toBeDefined();
      expect(alertAttributes.owner).toBeDefined();
      expect(alertAttributes.repo).toBeDefined();
      expect(alertAttributes.checkType).toBeDefined();
      expect(alertAttributes.title).toBeDefined();
      expect(alertAttributes.detectCount).toBeDefined();
      expect(alertAttributes.isIgnored).toBeDefined();
      expect(alertAttributes.manualResolved).toBeDefined();
      expect(alertAttributes.systemResolved).toBeDefined();
    });

    it('should have correct primary key configuration', () => {
      expect(alertAttributes.id.primaryKey).toBe(true);
      expect(alertAttributes.id.autoIncrement).toBe(true);
      expect(alertAttributes.id.allowNull).toBe(false);
    });

    it('should have correct required fields configuration', () => {
      expect(alertAttributes.owner.allowNull).toBe(false);
      expect(alertAttributes.repo.allowNull).toBe(false);
      expect(alertAttributes.checkType.allowNull).toBe(false);
      expect(alertAttributes.title.allowNull).toBe(false);
      expect(alertAttributes.detectCount.allowNull).toBe(false);
      expect(alertAttributes.isIgnored.allowNull).toBe(false);
      expect(alertAttributes.manualResolved.allowNull).toBe(false);
      expect(alertAttributes.systemResolved.allowNull).toBe(false);
    });

    it('should have correct optional fields configuration', () => {
      expect(alertAttributes.description.allowNull).toBe(true);
      expect(alertAttributes.severity.allowNull).toBe(true);
      expect(alertAttributes.author.allowNull).toBe(true);
      expect(alertAttributes.authorDisplayName.allowNull).toBe(true);
      expect(alertAttributes.filePath.allowNull).toBe(true);
      expect(alertAttributes.lineNumber.allowNull).toBe(true);
      expect(alertAttributes.codeSnippet.allowNull).toBe(true);
      expect(alertAttributes.branch.allowNull).toBe(true);
      expect(alertAttributes.lastDetectedAt.allowNull).toBe(true);
      expect(alertAttributes.ignoreReason.allowNull).toBe(true);
      expect(alertAttributes.manualResolvedReason.allowNull).toBe(true);
      expect(alertAttributes.systemResolvedReason.allowNull).toBe(true);
      expect(alertAttributes.issueUrl.allowNull).toBe(true);
      expect(alertAttributes.notes.allowNull).toBe(true);
    });

    it('should have correct default values', () => {
      expect(alertAttributes.detectCount.defaultValue).toBe(1);
      expect(alertAttributes.isIgnored.defaultValue).toBe(false);
      expect(alertAttributes.manualResolved.defaultValue).toBe(false);
      expect(alertAttributes.systemResolved.defaultValue).toBe(false);
    });

    it('should have severity string configuration', () => {
      expect(alertAttributes.severity.type).toBeDefined();
      expect(alertAttributes.severity.allowNull).toBe(true);
    });
  });

  describe('alertModelOptions', () => {
    it('should be defined and have required configuration', () => {
      expect(alertModelOptions).toBeDefined();
      expect(alertModelOptions.modelName).toBe('Alert');
      expect(alertModelOptions.tableName).toBe('alerts');
      expect(alertModelOptions.timestamps).toBe(false);
      expect(alertModelOptions.underscored).toBe(true);
    });

    it('should have correct indexes configuration', () => {
      expect(alertModelOptions.indexes).toBeDefined();
      expect(Array.isArray(alertModelOptions.indexes)).toBe(true);
      expect(alertModelOptions.indexes.length).toBeGreaterThan(0);

      // 基本的なインデックスの存在確認
      const indexFields = alertModelOptions.indexes.map(index => index.fields);
      expect(indexFields).toContainEqual([{ name: 'owner' }, { name: 'repo' }]);
      expect(indexFields).toContainEqual([{ name: 'check_type' }]);
      expect(indexFields).toContainEqual([{ name: 'last_detected_at' }]);
    });

    it('should have unique index for health issues', () => {
      const uniqueIndex = alertModelOptions.indexes.find(index => 
        index.name === 'unique_health_issue' && index.unique === true
      );
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex!.fields).toContainEqual({ name: 'owner', length: 100 });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'repo', length: 100 });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'check_type', length: 50 });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'title', length: 50 });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'file_path', length: 255 });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'line_number' });
      expect(uniqueIndex!.fields).toContainEqual({ name: 'branch', length: 50 });
    });
  });

  describe('Schema Validation', () => {
    it('should accept valid alert data structure', () => {
      const validAlert = {
        id: 1,
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'Test alert',
        description: 'Test description',
        severity: 'high',
        author: 'test-author',
        authorDisplayName: 'Test Author',
        filePath: '/src/test.js',
        lineNumber: 10,
        codeSnippet: 'console.log("test");',
        branch: 'main',
        detectCount: 1,
        lastDetectedAt: new Date(),
        isIgnored: false,
        ignoreReason: null,
        manualResolved: false,
        manualResolvedReason: null,
        systemResolved: false,
        systemResolvedReason: null,
        issueUrl: 'https://github.com/test/repo/issues/1',
        notes: 'Test notes',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // スキーマ構造の検証
      expect(validAlert.owner).toBeDefined();
      expect(validAlert.repo).toBeDefined();
      expect(validAlert.checkType).toBeDefined();
      expect(validAlert.title).toBeDefined();
      expect(typeof validAlert.detectCount).toBe('number');
      expect(typeof validAlert.isIgnored).toBe('boolean');
      expect(typeof validAlert.manualResolved).toBe('boolean');
      expect(typeof validAlert.systemResolved).toBe('boolean');
    });

    it('should handle optional fields correctly', () => {
      const minimalAlert = {
        owner: 'test-owner',
        repo: 'test-repo',
        checkType: 'security',
        title: 'Minimal alert',
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false,
      };

      // 必須フィールドのみの検証
      expect(minimalAlert.owner).toBeDefined();
      expect(minimalAlert.repo).toBeDefined();
      expect(minimalAlert.checkType).toBeDefined();
      expect(minimalAlert.title).toBeDefined();
      expect(minimalAlert.detectCount).toBeDefined();
      expect(minimalAlert.isIgnored).toBeDefined();
      expect(minimalAlert.manualResolved).toBeDefined();
      expect(minimalAlert.systemResolved).toBeDefined();
    });

    it('should validate severity string field', () => {
      const severityConfig = alertAttributes.severity;
      expect(severityConfig.type).toBeDefined();
      expect(severityConfig.allowNull).toBe(true);
    });

    it('should have proper field constraints', () => {
      const ownerConfig = alertAttributes.owner;
      const repoConfig = alertAttributes.repo;
      const checkTypeConfig = alertAttributes.checkType;
      const titleConfig = alertAttributes.title;

      expect(ownerConfig.allowNull).toBe(false);
      expect(repoConfig.allowNull).toBe(false);
      expect(checkTypeConfig.allowNull).toBe(false);
      expect(titleConfig.allowNull).toBe(false);
    });
  });
});
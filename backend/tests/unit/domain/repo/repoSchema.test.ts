import { repoAttributes, repoModelOptions } from '../../../../src/domain/repo/repoSchema';
import { DataTypes } from 'sequelize';

// Unmock the schema to ensure we get the actual definitions
jest.unmock('../../../../src/domain/repo/repoSchema');

describe('repoSchema', () => {
  describe('repoAttributes', () => {
    it('should define all required fields', () => {
      expect(repoAttributes).toBeDefined();
      expect(repoAttributes.id).toBeDefined();
      expect(repoAttributes.name).toBeDefined();
      expect(repoAttributes.owner).toBeDefined();
      expect(repoAttributes.description).toBeDefined();
      expect(repoAttributes.topics).toBeDefined();
      expect(repoAttributes.isPrivate).toBeDefined();
      expect(repoAttributes.lastCommitAt).toBeDefined();
      expect(repoAttributes.lastIssueCreatedAt).toBeDefined();
      expect(repoAttributes.lastPrCreatedAt).toBeDefined();
      expect(repoAttributes.pushedAt).toBeDefined();
      expect(repoAttributes.lastActivityAt).toBeDefined();
      expect(repoAttributes.createdAt).toBeDefined();
      expect(repoAttributes.updatedAt).toBeDefined();
    });

    it('should have correct field types', () => {
      expect(repoAttributes.id.type).toBe(DataTypes.BIGINT);
      expect(repoAttributes.name.type).toBe(DataTypes.STRING(255));
      expect(repoAttributes.owner.type).toBe(DataTypes.STRING(255));
      expect(repoAttributes.description.type).toBe(DataTypes.TEXT);
      expect(repoAttributes.topics.type).toBe(DataTypes.JSON);
      expect(repoAttributes.isPrivate.type).toBe(DataTypes.BOOLEAN);
      expect(repoAttributes.lastCommitAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.lastIssueCreatedAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.lastPrCreatedAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.pushedAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.lastActivityAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.createdAt.type).toBe(DataTypes.DATE);
      expect(repoAttributes.updatedAt.type).toBe(DataTypes.DATE);
    });

    it('should have correct field constraints', () => {
      // Primary key
      expect(repoAttributes.id.primaryKey).toBe(true);
      expect(repoAttributes.id.autoIncrement).toBe(true);
      expect(repoAttributes.id.allowNull).toBe(false);

      // Required fields
      expect(repoAttributes.name.allowNull).toBe(false);
      expect(repoAttributes.owner.allowNull).toBe(false);

      // Optional fields
      expect(repoAttributes.description.allowNull).toBe(true);
      expect(repoAttributes.topics.allowNull).toBe(true);
      expect(repoAttributes.lastCommitAt.allowNull).toBe(true);
      expect(repoAttributes.lastIssueCreatedAt.allowNull).toBe(true);
      expect(repoAttributes.lastPrCreatedAt.allowNull).toBe(true);
      expect(repoAttributes.pushedAt.allowNull).toBe(true);
      expect(repoAttributes.lastActivityAt.allowNull).toBe(true);

      // Timestamps
      expect(repoAttributes.createdAt.allowNull).toBe(false);
      expect(repoAttributes.updatedAt.allowNull).toBe(false);

      // Default values
      expect(repoAttributes.isPrivate.defaultValue).toBe(false);
      expect(repoAttributes.createdAt.defaultValue).toBe(DataTypes.NOW);
      expect(repoAttributes.updatedAt.defaultValue).toBe(DataTypes.NOW);
    });

    it('should have correct field mappings', () => {
      expect(repoAttributes.isPrivate.field).toBe('is_private');
      expect(repoAttributes.lastCommitAt.field).toBe('last_commit_at');
      expect(repoAttributes.lastIssueCreatedAt.field).toBe('last_issue_created_at');
      expect(repoAttributes.lastPrCreatedAt.field).toBe('last_pr_created_at');
      expect(repoAttributes.pushedAt.field).toBe('pushed_at');
      expect(repoAttributes.lastActivityAt.field).toBe('last_activity_at');
      expect(repoAttributes.createdAt.field).toBe('created_at');
      expect(repoAttributes.updatedAt.field).toBe('updated_at');
    });

    it('should have validation rules', () => {
      expect(repoAttributes.name.validate).toBeDefined();
      expect(repoAttributes.name.validate.notEmpty).toBeDefined();
      expect(repoAttributes.name.validate.notEmpty.msg).toBe('Invalid or missing name');

      expect(repoAttributes.owner.validate).toBeDefined();
      expect(repoAttributes.owner.validate.notEmpty).toBeDefined();
      expect(repoAttributes.owner.validate.notEmpty.msg).toBe('Invalid or missing owner');
    });
  });

  describe('repoModelOptions', () => {
    it('should define model options', () => {
      expect(repoModelOptions).toBeDefined();
      expect(repoModelOptions.tableName).toBe('repos');
      expect(repoModelOptions.timestamps).toBe(true);
      expect(repoModelOptions.underscored).toBe(true);
    });

    it('should have correct indexes', () => {
      expect(repoModelOptions.indexes).toBeDefined();
      expect(repoModelOptions.indexes).toHaveLength(7);

      const uniqueIndex = repoModelOptions.indexes.find(idx => 
        idx.unique === true
      );
      expect(uniqueIndex).toBeDefined();
      expect(uniqueIndex!.fields).toHaveLength(2);
      expect(uniqueIndex!.fields[0].name).toBe('owner');
      expect(uniqueIndex!.fields[1].name).toBe('name');
    });
  });
});

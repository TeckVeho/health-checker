import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

// Attributes for github_repos table
export const repoAttributes = {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Invalid or missing name' },
    },
  },
  owner: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Invalid or missing owner' },
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  topics: {
    type: DataTypes.JSON, // MySQL では ARRAY の代わりに JSON
    allowNull: true,
  },
  isPrivate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_private',
  },
  lastCommitAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_commit_at',
  },
  lastIssueCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_issue_created_at',
  },
  lastPrCreatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_pr_created_at',
  },
  pushedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'pushed_at',
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_activity_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
};

// Define Repo model
class Repo extends Model {
  public id!: number;
  public name!: string;
  public owner!: string;
  public description?: string;
  public topics?: string[];
  public isPrivate!: boolean;

  public lastCommitAt?: Date;
  public lastIssueCreatedAt?: Date;
  public lastPrCreatedAt?: Date;
  public pushedAt?: Date;
  public lastActivityAt?: Date;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize Repo model
Repo.init(repoAttributes, {
  sequelize,
  modelName: 'Repo',
  tableName: 'repos',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: [{ name: 'created_at' }] },
    { fields: [{ name: 'last_commit_at' }] },
    { fields: [{ name: 'last_issue_created_at' }] },
    { fields: [{ name: 'last_pr_created_at' }] },
    { fields: [{ name: 'pushed_at' }] },
    { fields: [{ name: 'last_activity_at' }] },
    {
      name: 'unique_owner_name',
      unique: true,
      fields: [{ name: 'owner' }, { name: 'name' }],
    },
  ],
});

export default Repo;

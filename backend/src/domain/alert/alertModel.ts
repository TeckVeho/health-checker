// src/features/alert/alertModel.ts

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../config/database';

// TypeScript用の属性定義
export interface AlertAttributes {
  id?: number;
  owner: string;
  repo: string;
  checkType: string;
  title: string;
  description?: string;
  severity?: string;
  filePath?: string;
  lineNumber?: number;
  codeSnippet?: string;
  branch?: string;
  detectCount: number;
  lastDetectedAt?: Date;
  isIgnored: boolean;
  ignoreReason?: string;
  manualResolved: boolean;
  manualResolvedReason?: string;
  systemResolved: boolean;
  systemResolvedReason?: string;
  issueUrl?: string;
  notes?: string;
  createdAt?: Date;
}

type AlertCreationAttributes = Optional<AlertAttributes, 'id' | 'createdAt'>;

// モデル定義
class Alert extends Model<AlertAttributes, AlertCreationAttributes> implements AlertAttributes {
  public id!: number;
  public owner!: string;
  public repo!: string;
  public checkType!: string;
  public title!: string;
  public description?: string;
  public severity?: string;
  public filePath?: string;
  public lineNumber?: number;
  public codeSnippet?: string;
  public branch?: string;
  public detectCount!: number;
  public lastDetectedAt?: Date;
  public isIgnored!: boolean;
  public ignoreReason?: string;
  public manualResolved!: boolean;
  public manualResolvedReason?: string;
  public systemResolved!: boolean;
  public systemResolvedReason?: string;
  public issueUrl?: string;
  public notes?: string;
  public createdAt?: Date;
}

export const alertAttributes = {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  repo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  checkType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'check_type',
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  severity: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  filePath: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'file_path',
  },
  lineNumber: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'line_number',
  },
  codeSnippet: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'code_snippet',
  },
  branch: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  detectCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'detect_count',
  },
  lastDetectedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_detected_at',
  },
  isIgnored: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_ignored',
  },
  ignoreReason: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ignore_reason',
  },
  manualResolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'manual_resolved',
  },
  manualResolvedReason: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'manual_resolved_reason',
  },
  systemResolved: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'system_resolved',
  },
  systemResolvedReason: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'system_resolved_reason',
  },
  issueUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'issue_url',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
};
Alert.init(alertAttributes, {
  sequelize,
  modelName: 'Alert',
  tableName: 'alerts',
  timestamps: false,
  underscored: true,
  indexes: [
    { fields: [{ name: 'owner' }, { name: 'repo' }] },
    { fields: [{ name: 'check_type' }] },
    { fields: [{ name: 'last_detected_at' }] },
    {
      name: 'unique_health_issue',
      unique: true,
      fields: [
        { name: 'owner', length: 100 },
        { name: 'repo', length: 100 },
        { name: 'check_type', length: 50 },
        { name: 'title', length: 50 },
        { name: 'file_path', length: 255 },
        { name: 'line_number' },
        { name: 'code_snippet', length: 255 },
        { name: 'branch', length: 50 },
      ],
    },
  ],
});



export default Alert;

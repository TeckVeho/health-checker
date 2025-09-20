import { DataTypes, Optional } from 'sequelize';

// TypeScript interface for RecheckExecution attributes
export interface RecheckExecutionAttributes {
  id?: number;
  owner: string;
  repo: string;
  executionId: string;
  status: 'running' | 'completed' | 'error' | 'timeout';
  checkTypes: string[];
  startedAt?: Date;
  completedAt?: Date;
  durationSeconds?: number;
  result?: any;
  errorMessage?: string;
  errorCode?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RecheckExecutionCreationAttributes = Optional<
  RecheckExecutionAttributes,
  'id' | 'createdAt' | 'updatedAt' | 'startedAt' | 'completedAt' | 'durationSeconds' | 'result' | 'errorMessage' | 'errorCode'
>;

// TypeScript interface for RecheckSettings attributes
export interface RecheckSettingsAttributes {
  id?: number;
  owner: string;
  repo: string;
  rateLimitMinutes: number;
  maxConcurrentExecutions: number;
  allowedCheckTypes: string[];
  timeoutMinutes: number;
  isEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type RecheckSettingsCreationAttributes = Optional<
  RecheckSettingsAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

// Sequelize attributes definition for RecheckExecution
export const recheckExecutionAttributes = {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'GitHubリポジトリのオーナー名',
  },
  repo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'GitHubリポジトリ名',
  },
  executionId: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    field: 'execution_id',
    comment: 'ユニークな実行ID',
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'error', 'timeout'),
    allowNull: false,
    defaultValue: 'running',
    comment: '実行状態',
  },
  checkTypes: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'check_types',
    defaultValue: ['branch', 'clone', 'gitleaks', 'issue'],
    comment: '実行したチェック種類の配列',
  },
  startedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'started_at',
    comment: '実行開始時刻',
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'completed_at',
    comment: '実行完了時刻',
  },
  durationSeconds: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'duration_seconds',
    comment: '実行時間（秒）',
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '実行結果の詳細（JSON形式）',
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message',
    comment: 'エラーメッセージ',
  },
  errorCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'error_code',
    comment: 'エラーコード',
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

// Sequelize attributes definition for RecheckSettings
export const recheckSettingsAttributes = {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  owner: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'GitHubリポジトリのオーナー名',
  },
  repo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'GitHubリポジトリ名',
  },
  rateLimitMinutes: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 3,
    field: 'rate_limit_minutes',
    comment: 'レート制限時間（分）',
  },
  maxConcurrentExecutions: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    field: 'max_concurrent_executions',
    comment: '同時実行数制限',
  },
  allowedCheckTypes: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'allowed_check_types',
    defaultValue: ['branch', 'clone', 'gitleaks', 'issue'],
    comment: '許可されたチェック種類の配列',
  },
  timeoutMinutes: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 10,
    field: 'timeout_minutes',
    comment: 'タイムアウト時間（分）',
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_enabled',
    comment: 'ReCheck機能の有効/無効',
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

// Model configuration options for RecheckExecution
export const recheckExecutionModelOptions = {
  modelName: 'RecheckExecution',
  tableName: 'recheck_executions',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    { 
      name: 'idx_recheck_owner_repo',
      fields: [{ name: 'owner' }, { name: 'repo' }] 
    },
    { 
      name: 'idx_recheck_started_at',
      fields: [{ name: 'started_at' }] 
    },
    { 
      name: 'idx_recheck_status',
      fields: [{ name: 'status' }] 
    },
    { 
      name: 'idx_recheck_execution_id',
      unique: true,
      fields: [{ name: 'execution_id' }] 
    },
    { 
      name: 'idx_recheck_rate_limit',
      fields: [{ name: 'owner' }, { name: 'repo' }, { name: 'started_at' }] 
    },
    { 
      name: 'idx_recheck_running_tasks',
      fields: [{ name: 'owner' }, { name: 'repo' }, { name: 'status' }] 
    },
  ],
  comment: 'ReCheck実行履歴と状態管理',
};

// Model configuration options for RecheckSettings
export const recheckSettingsModelOptions = {
  modelName: 'RecheckSettings',
  tableName: 'recheck_settings',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  indexes: [
    { 
      name: 'idx_recheck_settings_unique_repo',
      unique: true,
      fields: [{ name: 'owner' }, { name: 'repo' }] 
    },
    { 
      name: 'idx_recheck_settings_enabled',
      fields: [{ name: 'is_enabled' }] 
    },
  ],
  comment: 'リポジトリごとのReCheck設定',
};

import { DataTypes, Optional } from 'sequelize';

/** キャッシュキーに含める論理バージョン（ハッシュ材料の先頭に付与） */
export const LLM_CACHE_KEY_VERSION = 'v1';

export interface LlmCacheAttributes {
  id?: number;
  /** SHA-256 hex（model + temperature + 完全プロンプト から生成） */
  inputHash: string;
  model: string;
  temperature: number;
  /** 用途ラベル（例: issue_template, pr_quality） */
  purpose: string;
  /** LLM の生テキスト応答 */
  responseRaw: string;
  /** 任意メタ（JSON 文字列） */
  metaJson?: string | null;
  hitCount: number;
  lastHitAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export type LlmCacheCreationAttributes = Optional<
  LlmCacheAttributes,
  'id' | 'metaJson' | 'hitCount' | 'lastHitAt' | 'createdAt' | 'updatedAt'
>;

export const llmCacheAttributes = {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  inputHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    field: 'input_hash',
  },
  model: {
    type: DataTypes.STRING(128),
    allowNull: false,
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING(64),
    allowNull: false,
  },
  responseRaw: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'response_raw',
  },
  metaJson: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'meta_json',
  },
  hitCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'hit_count',
  },
  lastHitAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'last_hit_at',
  },
};

export const llmCacheModelOptions = {
  modelName: 'LlmCache',
  tableName: 'llm_cache',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [{ fields: ['purpose'] }, { fields: ['created_at'] }],
};

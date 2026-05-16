import { Model } from 'sequelize';
import createSequelizeInstance from '../../config/database';
import {
  LlmCacheAttributes,
  LlmCacheCreationAttributes,
  llmCacheAttributes,
  llmCacheModelOptions,
} from './llmCacheSchema';

const sequelize = createSequelizeInstance();

class LlmCache extends Model<LlmCacheAttributes, LlmCacheCreationAttributes> implements LlmCacheAttributes {
  public id!: number;
  public inputHash!: string;
  public model!: string;
  public temperature!: number;
  public purpose!: string;
  public responseRaw!: string;
  public metaJson?: string | null;
  public hitCount!: number;
  public lastHitAt?: Date | null;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;
}

LlmCache.init(llmCacheAttributes, {
  sequelize,
  ...llmCacheModelOptions,
});

export default LlmCache;

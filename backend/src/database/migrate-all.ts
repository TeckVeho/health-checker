// backend/src/database/migrate-all.ts
import { Model } from 'sequelize';
import sequelize from '../config/database';
import { repoAttributes, repoModelOptions } from '../domain/repo/repoSchema';
import { alertAttributes, alertModelOptions } from '../domain/alert/alertSchema';
import { 
  recheckExecutionAttributes, 
  recheckExecutionModelOptions,
  recheckSettingsAttributes,
  recheckSettingsModelOptions
} from '../domain/recheck/recheckSchema';

/**
 * Create tables directly from schema definitions without importing model classes
 */
async function createTablesFromSchemas(): Promise<void> {
  // Define Repo model directly from schema
  class Repo extends Model {}
  Repo.init(repoAttributes, {
    sequelize,
    ...repoModelOptions,
  });

  // Define Alert model directly from schema
  class Alert extends Model {}
  Alert.init(alertAttributes, {
    sequelize,
    ...alertModelOptions,
  });

  // Define RecheckExecution model directly from schema
  class RecheckExecution extends Model {}
  RecheckExecution.init(recheckExecutionAttributes, {
    sequelize,
    ...recheckExecutionModelOptions,
  });

  // Define RecheckSettings model directly from schema
  class RecheckSettings extends Model {}
  RecheckSettings.init(recheckSettingsAttributes, {
    sequelize,
    ...recheckSettingsModelOptions,
  });

  /**
   * - 初回作成      : sync()
   * - スキーマ差分  : sync({ alter: true })  ※本番環境は要バックアップ
   * - 全再生成      : sync({ force: true })  ※開発用
   */
  await sequelize.sync();
  console.log('All tables are in sync ✨');
}

(async () => {
  try {
    await createTablesFromSchemas();
    process.exit(0);
  } catch (error) {
    console.error('Error during schema sync:', error);
    process.exit(1);
  }
})();

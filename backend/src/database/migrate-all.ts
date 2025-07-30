// backend/src/database/migrate-all.ts
import { Model } from 'sequelize';
import sequelize from '../config/database';
import { repoAttributes, repoModelOptions } from '../domain/repo/repoSchema';
import { alertAttributes, alertModelOptions } from '../domain/alert/alertSchema';

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

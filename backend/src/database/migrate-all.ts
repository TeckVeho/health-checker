// backend/src/database/migrate-all.ts
import { readdirSync, statSync } from 'fs';
import path from 'path';
import sequelize from '../config/database';

/**
 * Import schema definitions directly and create tables
 */
async function createTablesFromSchemas(): Promise<void> {
  // Import model classes to register them with Sequelize
  // This is still needed because the models need to be registered
  const domainPath = path.join(__dirname, '../domain');
  importAllModels(domainPath);

  /**
   * - 初回作成      : sync()
   * - スキーマ差分  : sync({ alter: true })  ※本番環境は要バックアップ
   * - 全再生成      : sync({ force: true })  ※開発用
   */
  await sequelize.sync();
  console.log('All tables are in sync ✨');
}

/**
 * 再帰的にすべての *Model.ts を import して Sequelize に登録する
 */
function importAllModels(dir: string): void {
  const items = readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = statSync(itemPath);

    if (stat.isDirectory()) {
      importAllModels(itemPath);
    } else if (stat.isFile() && item.endsWith('Model.ts')) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require(itemPath); // 動的 import でモデルが self-register
      console.log(`Model loaded: ${itemPath}`);
    }
  }
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

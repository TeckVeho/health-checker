import { readdirSync, statSync } from 'fs';
import path from 'path';
import sequelize from '@config/database';

/**
 * Recursively find all migration files ending with .ts in the provided directory
 */
function getMigrationFiles(dir: string): string[] {
  let migrationFiles: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const itemStat = statSync(itemPath);

    if (itemStat.isDirectory()) {
      migrationFiles = migrationFiles.concat(getMigrationFiles(itemPath)); // Recursively search subdirectories
    } else if (itemStat.isFile() && item.endsWith('Migration.ts')) {
      migrationFiles.push(itemPath); // Add .ts files to migration list
    }
  }

  return migrationFiles;
}

(async () => {
  try {
    const featuresPath = path.join(__dirname, '../domain');
    const migrationFiles = getMigrationFiles(featuresPath);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const { up } = await import(file);
      await up(sequelize.getQueryInterface());

      console.log(`Migration ${file} executed successfully.`);
    }

    console.log('All migrations executed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error executing migrations:', error);
    process.exit(1);
  }
})();

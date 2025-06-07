import { readdirSync, statSync } from 'fs';
import path from 'path';
import sequelize from '../config/database';

/**
 * Recursively find all seeder files ending with *Seeder.ts in the provided directory
 */
function getSeederFiles(dir: string): string[] {
  let seederFiles: string[] = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const itemStat = statSync(itemPath);

    if (itemStat.isDirectory()) {
      seederFiles = seederFiles.concat(getSeederFiles(itemPath)); // Recursively search subdirectories
    } else if (itemStat.isFile() && item.endsWith('Seeder.ts')) {
      seederFiles.push(itemPath); // Add *Seeder.ts files to seeder list
    }
  }

  return seederFiles;
}

(async () => {
  try {
    const featuresPath = path.join(__dirname, '../features');
    const seederFiles = getSeederFiles(featuresPath);

    for (const file of seederFiles) {
      console.log(`Running seeder: ${file}`);
      const { seed } = await import(file);
      if (typeof seed === 'function') {
        await seed(sequelize);
        console.log(`Seeder ${file} executed successfully.`);
      } else {
        console.warn(`No seed function exported in ${file}. Skipping.`);
      }
    }

    console.log('All seeders executed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error executing seeders:', error);
    process.exit(1);
  }
})();

// src/database/drop-all.ts

import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    console.log('Starting to drop all tables in the database...');

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    const tables = await sequelize.query<{ name: string }>('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE();', { type: QueryTypes.SELECT });

    for (const table of tables) {
      console.log(`Dropping table: ${table.name}`);
      await queryInterface.dropTable(table.name);
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('All tables dropped successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error dropping tables:', error);
    process.exit(1);
  }
})();

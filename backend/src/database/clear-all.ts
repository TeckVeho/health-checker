// src/database/clear-all.ts
import { QueryTypes } from 'sequelize';
import sequelize from '../config/database';

(async () => {
  try {
    const queryInterface = sequelize.getQueryInterface();

    const tables = await sequelize.query<{ name: string }>('SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE();', { type: QueryTypes.SELECT });

    console.log('Starting to clear all tables in the database...');

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');

    for (const table of tables) {
      console.log(`Truncating table: ${table.name}`);
      await queryInterface.sequelize.query(`TRUNCATE TABLE \`${table.name}\``);
    }
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('All tables cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing tables:', error);
    process.exit(1);
  }
})();

import { QueryInterface, QueryTypes } from 'sequelize';
import { alertAttributes } from '../alertModel';
import { mapUniqueIndexes } from '../../../utils/databaseUtils';

const tableName = 'alerts';
export async function up(queryInterface: QueryInterface) {
  const result = await queryInterface.sequelize.query<{ count: number }>(`SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = '${queryInterface.sequelize.config.database}' AND table_name = '${tableName}'`, { type: QueryTypes.SELECT });
  const tableExists = result.length > 0 && result[0].count > 0;
  if (tableExists) {
    console.log(`Table "${tableName}" already exists. Skipping creation.`);
    return;
  }
  await queryInterface.createTable(tableName, alertAttributes);
  console.log(`Table "${tableName}" created successfully.`);

  for (const index of mapUniqueIndexes(alertAttributes)) {
    await queryInterface.addIndex(tableName, index);
  }
}
export async function down(queryInterface: QueryInterface) {
  await queryInterface.dropTable(tableName);
  console.log(`Table "${tableName}" dropped successfully.`);
}

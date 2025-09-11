import sequelize from '../../src/config/database';
import Alert from '../../src/domain/alert/alertModel';

export async function setupTestDatabase(): Promise<void> {
  try {
    // Sync database schema
    await sequelize.sync({ force: true });
    
    // Run any migrations needed
    // This would typically be done via migrate-all.ts in a real setup
    console.log('Test database setup complete');
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase(): Promise<void> {
  try {
    // Close database connection
    await sequelize.close();
    console.log('Test database cleanup complete');
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    throw error;
  }
}

export async function clearTestData(): Promise<void> {
  try {
    // Clear all test data
    await Alert.destroy({ where: {} });
    console.log('Test data cleared');
  } catch (error) {
    console.error('Failed to clear test data:', error);
    throw error;
  }
}
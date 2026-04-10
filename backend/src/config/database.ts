import { Sequelize } from 'sequelize';
import path from 'path';

// Environment variables are initialized by EnvironmentConfig

let sequelize: Sequelize | null = null;

function createSequelizeInstance(): Sequelize {
  if (sequelize) {
    return sequelize;
  }

  const dbName = process.env.DB_NAME as string;
  const dbUser = process.env.DB_USER as string;
  const dbPassword = process.env.DB_PASSWORD as string;
  const dbHost = process.env.DB_HOST || '127.0.0.1';
  const dbPort = Number(process.env.DB_PORT) || 3306;
  const dbClient = process.env.DB_CLIENT || 'mysql'; // 'mysql' | 'postgres' | 'sqlite3'
  const tz = process.env.TZ || '+09:00';

  process.env.TZ = tz;

  console.log(`[Database] Creating Sequelize instance with DB_USER: ${dbUser}, DB_HOST: ${dbHost}, DB_NAME: ${dbName}`);

  if (dbClient === 'sqlite3') {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_FILE === ':memory:' ? ':memory:' : path.resolve(__dirname, process.env.DB_FILE || 'database.sqlite'),
      logging: false,
    });
  } else if (dbClient === 'postgres') {
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort || 5432,
      dialect: 'postgres',
      timezone: tz,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    });
  } else {
    // default: mysql
    sequelize = new Sequelize(dbName, dbUser, dbPassword, {
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      timezone: tz,
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
      logging: false,
    });
  }

  return sequelize;
}

export { createSequelizeInstance };
export default createSequelizeInstance;

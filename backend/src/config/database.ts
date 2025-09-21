import { Sequelize } from 'sequelize';
import path from 'path';

// Environment variables are initialized by EnvironmentConfig

const DB_NAME = process.env.DB_NAME as string;
const DB_USER = process.env.DB_USER as string;
const DB_PASSWORD = process.env.DB_PASSWORD as string;
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_CLIENT = process.env.DB_CLIENT || 'mysql'; // 'mysql' | 'postgres' | 'sqlite3'
const TZ = process.env.TZ || '+09:00';

process.env.TZ = TZ;

let sequelize: Sequelize;

if (DB_CLIENT === 'sqlite3') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_FILE === ':memory:' ? ':memory:' : path.resolve(__dirname, process.env.DB_FILE || 'database.sqlite'),
    logging: false,
  });
} else if (DB_CLIENT === 'postgres') {
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT || 5432,
    dialect: 'postgres',
    timezone: TZ,
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
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: DB_PORT,
    dialect: 'mysql',
    timezone: TZ,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: false,
  });
}

export default sequelize;

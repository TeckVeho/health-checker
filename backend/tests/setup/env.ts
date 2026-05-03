// テスト用の環境変数設定
process.env.NODE_ENV = 'test';
process.env.GITHUB_API_KEY = 'test-dummy-token';
process.env.OPENAI_API_KEY = 'test-dummy-openai-key';
process.env.TZ = '+09:00';
process.env.GITHUB_LOCAL_WORKSPACE = '/tmp/test-workspace';

// データベースを使わないようにモック化（default は createSequelizeInstance ファクトリ）
jest.mock('../../src/config/database', () => {
  const mockSequelize = {
    sync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    authenticate: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn().mockImplementation((callback) => callback({})),
    query: jest.fn().mockResolvedValue([]),
    define: jest.fn().mockReturnValue({
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue(0),
    }),
  };
  const createSequelizeInstance = jest.fn(() => mockSequelize);
  return {
    __esModule: true,
    default: createSequelizeInstance,
    createSequelizeInstance,
  };
});

// Sequelizeモデルをモック化
jest.mock('sequelize', () => {
  const mockSequelize = {
    sync: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    authenticate: jest.fn().mockResolvedValue(undefined),
    transaction: jest.fn().mockImplementation((callback) => callback({})),
    query: jest.fn().mockResolvedValue([]),
    define: jest.fn().mockReturnValue({
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue([1]),
      destroy: jest.fn().mockResolvedValue(1),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue(0),
    }),
  };
  
  return {
    Sequelize: jest.fn().mockImplementation(() => mockSequelize),
    Model: class MockModel {
      static init = jest.fn();
      static findAll = jest.fn().mockResolvedValue([]);
      static findOne = jest.fn().mockResolvedValue(null);
      static create = jest.fn().mockResolvedValue({});
      static update = jest.fn().mockResolvedValue([1]);
      static destroy = jest.fn().mockResolvedValue(1);
      static count = jest.fn().mockResolvedValue(0);
      static aggregate = jest.fn().mockResolvedValue(0);
      static sync = jest.fn().mockResolvedValue(undefined);
      static drop = jest.fn().mockResolvedValue(undefined);
      static bulkCreate = jest.fn().mockResolvedValue([]);
      static findOrCreate = jest.fn().mockResolvedValue([{}, true]);
    },
    DataTypes: {
      STRING: jest.fn().mockReturnValue('STRING'),
      INTEGER: jest.fn().mockReturnValue('INTEGER'),
      BIGINT: jest.fn().mockReturnValue('BIGINT'),
      FLOAT: jest.fn().mockReturnValue('FLOAT'),
      TEXT: jest.fn().mockImplementation(() => 'TEXT'),
      DATE: jest.fn().mockReturnValue('DATE'),
      BOOLEAN: jest.fn().mockReturnValue('BOOLEAN'),
      ENUM: jest.fn().mockReturnValue('ENUM'),
      NOW: jest.fn().mockReturnValue('NOW'),
    },
  };
});

// Alertモデルをモック化
jest.mock('../../src/domain/alert/alertModel', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue(0),
    sync: jest.fn().mockResolvedValue(undefined),
    drop: jest.fn().mockResolvedValue(undefined),
    bulkCreate: jest.fn().mockResolvedValue([]),
    findOrCreate: jest.fn().mockResolvedValue([{}, true]),
  },
}));

// その他のモデルもモック化
jest.mock('../../src/domain/repo/repoModel', () => ({
  __esModule: true,
  default: {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    count: jest.fn().mockResolvedValue(0),
  },
}));

// スキーマファイルをモック化
jest.mock('../../src/domain/repo/repoSchema', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('../../src/domain/alert/alertSchema', () => ({
  __esModule: true,
  default: {},
}));

// テスト用のコンソール出力を抑制（エラーレベルのみ表示）
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// プロセス終了時の警告を抑制
process.removeAllListeners('warning');

// テスト終了後にコンソールを復元
afterAll(() => {
  global.console = originalConsole;
});

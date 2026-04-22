import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: false,  // 詳細出力を無効化
  collectCoverage: true,
  coverageDirectory: 'coverage',
  moduleFileExtensions: ['ts', 'js'],
  // tsc 出力 dist が残っていると手動モック等が二重解決されうる
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/src/**/*.test.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup/env.ts'],
  testTimeout: 10000,  // タイムアウトを10秒に設定
  moduleNameMapper: {
    '@services/(.*)': '<rootDir>/src/services/$1',
    '@models/(.*)': '<rootDir>/src/models/$1',
    '@controllers/(.*)': '<rootDir>/src/controllers/$1',
    '@middlewares/(.*)': '<rootDir>/src/middlewares/$1',
    '@validators/(.*)': '<rootDir>/src/middlewares/validators/$1',
    '@utils/(.*)': '<rootDir>/src/utils/$1',
    '@config/(.*)': '<rootDir>/src/config/$1',
    '@routes/(.*)': '<rootDir>/src/routes/$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: ['.ts'],
};

export default config;

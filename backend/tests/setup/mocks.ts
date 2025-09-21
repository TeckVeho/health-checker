/**
 * 共通モックユーティリティ
 * 全テストで使用する共通のモック設定とヘルパー関数
 */

import { jest } from '@jest/globals';

// モックデータファクトリー
export const createMockAlert = (overrides: Partial<any> = {}) => ({
  id: 1,
  severity: 'high',
  type: 'security',
  message: 'Test alert message',
  repoId: 1,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const createMockRepo = (overrides: Partial<any> = {}) => ({
  id: 1,
  owner: 'test-owner',
  name: 'test-repo',
  url: 'https://github.com/test-owner/test-repo',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  ...overrides,
});

export const createMockGitHubPR = (overrides: Partial<any> = {}) => ({
  number: 1,
  title: 'Test PR',
  body: 'Test PR description',
  state: 'open',
  user: {
    login: 'test-user',
    id: 123,
  },
  head: {
    ref: 'feature-branch',
    sha: 'abc123',
  },
  base: {
    ref: 'main',
    sha: 'def456',
  },
  ...overrides,
});

export const createMockGitHubIssue = (overrides: Partial<any> = {}) => ({
  number: 1,
  title: 'Test Issue',
  body: 'Test issue description',
  state: 'open',
  user: {
    login: 'test-user',
    id: 123,
  },
  labels: [],
  assignees: [],
  ...overrides,
});

// データベース操作のモック
export const createMockModel = () => ({
  findAll: jest.fn().mockResolvedValue([] as any),
  findOne: jest.fn().mockResolvedValue(null as any),
  create: jest.fn().mockResolvedValue({} as any),
  update: jest.fn().mockResolvedValue([1] as any),
  destroy: jest.fn().mockResolvedValue(1 as any),
  count: jest.fn().mockResolvedValue(0 as any),
  aggregate: jest.fn().mockResolvedValue(0 as any),
  sync: jest.fn().mockResolvedValue(undefined as any),
  drop: jest.fn().mockResolvedValue(undefined as any),
  bulkCreate: jest.fn().mockResolvedValue([] as any),
  findOrCreate: jest.fn().mockResolvedValue([{}, true] as any),
  findByPk: jest.fn().mockResolvedValue(null as any),
  findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 } as any),
  upsert: jest.fn().mockResolvedValue([{}, true] as any),
});

// GitHub API のモック
export const createMockGitHubAPI = () => ({
  rest: {
    pulls: {
      get: jest.fn().mockResolvedValue({ data: createMockGitHubPR() } as any),
      list: jest.fn().mockResolvedValue({ data: [createMockGitHubPR()] } as any),
      createReview: jest.fn().mockResolvedValue({ data: { id: 1 } } as any),
    },
    issues: {
      get: jest.fn().mockResolvedValue({ data: createMockGitHubIssue() } as any),
      list: jest.fn().mockResolvedValue({ data: [createMockGitHubIssue()] } as any),
      createComment: jest.fn().mockResolvedValue({ data: { id: 1 } } as any),
    },
    repos: {
      get: jest.fn().mockResolvedValue({ 
        data: { 
          name: 'test-repo',
          owner: { login: 'test-owner' },
          full_name: 'test-owner/test-repo'
        } 
      } as any),
      listCommits: jest.fn().mockResolvedValue({ data: [] } as any),
    },
  },
});

// OpenAI API のモック
export const createMockOpenAI = () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Mock AI response',
            },
          },
        ],
      } as any),
    },
  },
});

// ファイルシステムのモック
export const createMockFileSystem = () => ({
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  statSync: jest.fn().mockReturnValue({ isDirectory: () => true }),
});

// 環境変数のモック
export const createMockEnv = () => ({
  NODE_ENV: 'test',
  GITHUB_API_KEY: 'test-dummy-token',
  OPENAI_API_KEY: 'test-dummy-openai-key',
  GITHUB_LOCAL_WORKSPACE: '/tmp/test-workspace',
  TZ: '+09:00',
});

// リクエスト/レスポンスのモック
export const createMockRequest = (overrides: Partial<any> = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ...overrides,
});

export const createMockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

export const createMockNext = () => jest.fn();

// エラーハンドリングのモック
export const createMockError = (message: string = 'Test error', status: number = 500) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};

// モックのクリーンアップヘルパー
export const clearAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

// 非同期操作のテストヘルパー
export const waitForAsync = () => new Promise(resolve => setImmediate(resolve));

// タイムアウト処理のテストヘルパー
export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number = 1000
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Test timeout')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

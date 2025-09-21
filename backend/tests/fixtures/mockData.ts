/**
 * モックデータフィクスチャ
 * テストで使用する定型的なデータセット
 */

// アラート関連のモックデータ
export const mockAlerts = {
  high: {
    id: 1,
    severity: 'high',
    type: 'security',
    message: 'Critical security vulnerability detected',
    repoId: 1,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  medium: {
    id: 2,
    severity: 'medium',
    type: 'performance',
    message: 'Performance degradation detected',
    repoId: 1,
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },
  low: {
    id: 3,
    severity: 'low',
    type: 'maintenance',
    message: 'Dependency update recommended',
    repoId: 1,
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z'),
  },
};

// リポジトリ関連のモックデータ
export const mockRepos = [
  {
    id: 1,
    owner: 'test-owner',
    name: 'test-repo',
    url: 'https://github.com/test-owner/test-repo',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 2,
    owner: 'test-owner-2',
    name: 'test-repo-2',
    url: 'https://github.com/test-owner-2/test-repo-2',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  },
];

// GitHub PR関連のモックデータ
export const mockGitHubPRs = {
  open: {
    number: 1,
    title: 'Add new feature',
    body: 'This PR adds a new feature to the application',
    state: 'open',
    user: {
      login: 'test-user',
      id: 123,
    },
    head: {
      ref: 'feature/new-feature',
      sha: 'abc123def456',
    },
    base: {
      ref: 'main',
      sha: 'def456ghi789',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  closed: {
    number: 2,
    title: 'Fix bug in authentication',
    body: 'This PR fixes a critical bug in the authentication system',
    state: 'closed',
    user: {
      login: 'test-user-2',
      id: 456,
    },
    head: {
      ref: 'bugfix/auth-fix',
      sha: 'ghi789jkl012',
    },
    base: {
      ref: 'main',
      sha: 'def456ghi789',
    },
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
};

// GitHub Issue関連のモックデータ
export const mockGitHubIssues = {
  open: {
    number: 1,
    title: 'Bug in user authentication',
    body: 'Users are unable to log in with valid credentials',
    state: 'open',
    user: {
      login: 'test-user',
      id: 123,
    },
    labels: [
      { name: 'bug', color: 'd73a4a' },
      { name: 'high-priority', color: 'ff6b6b' },
    ],
    assignees: [
      { login: 'developer-1', id: 789 },
    ],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  closed: {
    number: 2,
    title: 'Feature request: Add dark mode',
    body: 'It would be great to have a dark mode option for the application',
    state: 'closed',
    user: {
      login: 'test-user-2',
      id: 456,
    },
    labels: [
      { name: 'enhancement', color: 'a2eeef' },
      { name: 'ui', color: '7057ff' },
    ],
    assignees: [],
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
};

// プロジェクト関連のモックデータ
export const mockProjects = {
  main: {
    id: 1,
    name: 'Health Checker',
    description: 'Automated health checking system for repositories',
    settings: {
      autoScan: true,
      notificationEnabled: true,
      scanInterval: 3600,
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

// 再チェック関連のモックデータ
export const mockRechecks = {
  pending: {
    id: 1,
    repoId: 1,
    status: 'pending',
    requestedAt: new Date('2024-01-01T00:00:00Z'),
    startedAt: null,
    completedAt: null,
    result: null,
  },
  inProgress: {
    id: 2,
    repoId: 1,
    status: 'in_progress',
    requestedAt: new Date('2024-01-01T00:00:00Z'),
    startedAt: new Date('2024-01-01T00:05:00Z'),
    completedAt: null,
    result: null,
  },
  completed: {
    id: 3,
    repoId: 1,
    status: 'completed',
    requestedAt: new Date('2024-01-01T00:00:00Z'),
    startedAt: new Date('2024-01-01T00:05:00Z'),
    completedAt: new Date('2024-01-01T00:10:00Z'),
    result: {
      alertsFound: 3,
      criticalIssues: 1,
      warnings: 2,
    },
  },
};

// RecheckExecution関連のモックデータ
export const mockRecheckExecutions = [
  {
    id: 1,
    owner: 'test-owner',
    repo: 'test-repo',
    executionId: 'exec-123',
    status: 'running',
    checkTypes: ['security', 'performance'],
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: null,
    durationSeconds: null,
    result: null,
    errorMessage: null,
    errorCode: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 2,
    owner: 'test-owner',
    repo: 'test-repo',
    executionId: 'exec-456',
    status: 'completed',
    checkTypes: ['security'],
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: new Date('2024-01-01T00:05:00Z'),
    durationSeconds: 300,
    result: { alerts: 2, critical: 0, warnings: 2 },
    errorMessage: null,
    errorCode: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:05:00Z'),
  },
  {
    id: 3,
    owner: 'test-owner-2',
    repo: 'test-repo-2',
    executionId: 'exec-789',
    status: 'error',
    checkTypes: ['performance'],
    startedAt: new Date('2024-01-01T00:00:00Z'),
    completedAt: new Date('2024-01-01T00:02:00Z'),
    durationSeconds: 120,
    result: null,
    errorMessage: 'Connection timeout',
    errorCode: 'TIMEOUT_ERROR',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:02:00Z'),
  },
];

// RecheckSettings関連のモックデータ
export const mockRecheckSettings = [
  {
    id: 1,
    owner: 'test-owner',
    repo: 'test-repo',
    rateLimitMinutes: 5,
    maxConcurrentExecutions: 2,
    allowedCheckTypes: ['security', 'performance'],
    timeoutMinutes: 10,
    isEnabled: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: 2,
    owner: 'test-owner-2',
    repo: 'test-repo-2',
    rateLimitMinutes: 3,
    maxConcurrentExecutions: 1,
    allowedCheckTypes: ['security'],
    timeoutMinutes: 15,
    isEnabled: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
];

// GitHub Action関連のモックデータ
export const mockGitHubActions = {
  prReview: {
    id: 1,
    repoId: 1,
    prNumber: 1,
    action: 'review',
    status: 'completed',
    result: {
      approved: true,
      comments: ['Looks good!'],
      suggestions: [],
    },
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  },
};

// エラーレスポンスのモックデータ
export const mockErrors = {
  notFound: {
    status: 404,
    message: 'Resource not found',
    code: 'NOT_FOUND',
  },
  unauthorized: {
    status: 401,
    message: 'Unauthorized access',
    code: 'UNAUTHORIZED',
  },
  badRequest: {
    status: 400,
    message: 'Invalid request parameters',
    code: 'BAD_REQUEST',
  },
  internalServerError: {
    status: 500,
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  },
};

// 成功レスポンスのモックデータ
export const mockSuccessResponses = {
  created: {
    status: 201,
    message: 'Resource created successfully',
    data: {},
  },
  updated: {
    status: 200,
    message: 'Resource updated successfully',
    data: {},
  },
  deleted: {
    status: 200,
    message: 'Resource deleted successfully',
  },
  retrieved: {
    status: 200,
    message: 'Resource retrieved successfully',
    data: {},
  },
};

// ページネーション関連のモックデータ
export const mockPagination = {
  firstPage: {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: true,
    hasPrev: false,
  },
  middlePage: {
    page: 2,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: true,
    hasPrev: true,
  },
  lastPage: {
    page: 3,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: false,
    hasPrev: true,
  },
};

// 環境設定のモックデータ
export const mockEnvConfig = {
  development: {
    NODE_ENV: 'development',
    PORT: 3000,
    DATABASE_URL: 'postgresql://localhost:5432/health_checker_dev',
    GITHUB_API_KEY: 'dev-github-token',
    OPENAI_API_KEY: 'dev-openai-key',
  },
  test: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://localhost:5432/health_checker_test',
    GITHUB_API_KEY: 'test-github-token',
    OPENAI_API_KEY: 'test-openai-key',
  },
  production: {
    NODE_ENV: 'production',
    PORT: 8080,
    DATABASE_URL: 'postgresql://prod-server:5432/health_checker',
    GITHUB_API_KEY: 'prod-github-token',
    OPENAI_API_KEY: 'prod-openai-key',
  },
};

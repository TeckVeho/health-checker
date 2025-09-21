/**
 * Test Helper Functions
 * 
 * This module provides common utility functions to improve test readability and maintainability.
 * It includes:
 * - Test data generators for various entities (alerts, repos, etc.)
 * - Mock object creators for Express components
 * - Assertion helpers for common test scenarios
 * - Utility functions for test setup and teardown
 */

import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// テストデータ生成ヘルパー
export const generateTestData = {
  // アラートテストデータ
  alert: (count: number = 1) => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      severity: ['high', 'medium', 'low'][index % 3],
      type: ['security', 'performance', 'maintenance'][index % 3],
      message: `Test alert message ${index + 1}`,
      repoId: index + 1,
      createdAt: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
      updatedAt: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
    }));
  },

  // リポジトリテストデータ
  repo: (count: number = 1) => {
    return Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      owner: `test-owner-${index + 1}`,
      name: `test-repo-${index + 1}`,
      url: `https://github.com/test-owner-${index + 1}/test-repo-${index + 1}`,
      createdAt: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
      updatedAt: new Date(`2024-01-${String(index + 1).padStart(2, '0')}T00:00:00Z`),
    }));
  },

  // GitHub PRテストデータ
  githubPR: (count: number = 1) => {
    return Array.from({ length: count }, (_, index) => ({
      number: index + 1,
      title: `Test PR ${index + 1}`,
      body: `Test PR description ${index + 1}`,
      state: ['open', 'closed', 'merged'][index % 3],
      user: {
        login: `test-user-${index + 1}`,
        id: 100 + index,
      },
      head: {
        ref: `feature-branch-${index + 1}`,
        sha: `abc${index + 1}`,
      },
      base: {
        ref: 'main',
        sha: 'def456',
      },
    }));
  },

  // GitHub Issueテストデータ
  githubIssue: (count: number = 1) => {
    return Array.from({ length: count }, (_, index) => ({
      number: index + 1,
      title: `Test Issue ${index + 1}`,
      body: `Test issue description ${index + 1}`,
      state: ['open', 'closed'][index % 2],
      user: {
        login: `test-user-${index + 1}`,
        id: 100 + index,
      },
      labels: [
        { name: 'bug', color: 'd73a4a' },
        { name: 'enhancement', color: 'a2eeef' },
      ],
      assignees: [],
    }));
  },
};

// Express リクエスト/レスポンス モック生成
export const createExpressMocks = () => {
  const mockReq: Partial<Request> = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
  };

  const mockRes: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
  } as any;

  const mockNext: NextFunction = jest.fn();

  return {
    req: mockReq as any,
    res: mockRes as any,
    next: mockNext,
  };
};

// 非同期関数のテストヘルパー
export const testAsyncFunction = async (
  asyncFn: () => Promise<any>,
  expectedResult?: any,
  shouldThrow: boolean = false
) => {
  try {
    const result = await asyncFn();
    if (shouldThrow) {
      throw new Error('Expected function to throw but it did not');
    }
    if (expectedResult !== undefined) {
      expect(result).toEqual(expectedResult);
    }
    return result;
  } catch (error) {
    if (!shouldThrow) {
      throw error;
    }
    return error;
  }
};

// エラーハンドリングテストヘルパー
export const testErrorHandling = async (
  asyncFn: () => Promise<any>,
  expectedErrorType?: string,
  expectedErrorMessage?: string
) => {
  try {
    await asyncFn();
    throw new Error('Expected function to throw but it did not');
  } catch (error) {
    if (expectedErrorType && error.constructor.name !== expectedErrorType) {
      throw new Error(`Expected error type ${expectedErrorType}, got ${error.constructor.name}`);
    }
    if (expectedErrorMessage && !error.message.includes(expectedErrorMessage)) {
      throw new Error(`Expected error message to contain "${expectedErrorMessage}", got "${error.message}"`);
    }
    return error;
  }
};

// モックの検証ヘルパー
export const verifyMockCall = (
  mockFn: jest.Mock,
  callIndex: number = 0,
  expectedArgs?: any[]
) => {
  expect(mockFn).toHaveBeenCalledTimes(callIndex + 1);
  if (expectedArgs) {
    expect(mockFn).toHaveBeenNthCalledWith(callIndex + 1, ...expectedArgs);
  }
};

// データベース操作のモック検証
export const verifyDatabaseOperation = (
  mockModel: any,
  operation: string,
  expectedCalls: number = 1
) => {
  expect(mockModel[operation]).toHaveBeenCalledTimes(expectedCalls);
};

// パフォーマンステストヘルパー
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now();
  const result = await fn();
  const end = Date.now();
  return {
    result,
    executionTime: end - start,
  };
};

// メモリ使用量テストヘルパー
export const getMemoryUsage = () => {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
  };
};

// テストデータのクリーンアップ
export const cleanupTestData = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};

// 条件付きテスト実行ヘルパー
export const conditionalTest = (condition: boolean, testName: string, testFn: () => void) => {
  if (condition) {
    test(testName, testFn);
  } else {
    test.skip(testName, testFn);
  }
};

// 並列テスト実行の制御
export const sequentialTest = (testName: string, testFn: () => void) => {
  test.serial(testName, testFn);
};

// タイムアウト設定ヘルパー
export const withTimeout = (timeoutMs: number) => {
  return (testFn: () => void | Promise<void>) => {
    return () => {
      return Promise.race([
        Promise.resolve(testFn()),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);
    };
  };
};

// テスト環境の検証
export const validateTestEnvironment = () => {
  expect(process.env.NODE_ENV).toBe('test');
  expect(process.env.GITHUB_API_KEY).toBeDefined();
  expect(process.env.OPENAI_API_KEY).toBeDefined();
};

// テスト結果の集計ヘルパー
export const aggregateTestResults = (results: any[]) => {
  return {
    total: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
  };
};

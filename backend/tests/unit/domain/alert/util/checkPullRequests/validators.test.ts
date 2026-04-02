/**
 * Unit tests for PR validators (Dependabot open PR, etc.)
 */
import { describe, test, expect } from '@jest/globals';
import {
  isDependabotAuthor,
  validateDependabotOpenPr,
} from '../../../../../../src/domain/alert/util/checkPullRequests/validators';
import type { GitHubPullRequest } from '../../../../../../src/domain/alert/util/checkPullRequests/types';

function basePr(overrides: Partial<GitHubPullRequest> = {}): GitHubPullRequest {
  return {
    number: 1,
    title: 'chore(deps): bump foo',
    body: 'body',
    user: { login: 'dependabot[bot]' },
    head: { ref: 'dependabot/npm-foo' },
    html_url: 'https://github.com/o/r/pull/1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    state: 'open',
    ...overrides,
  };
}

describe('isDependabotAuthor', () => {
  test('returns true when login contains dependabot', () => {
    expect(isDependabotAuthor(basePr({ user: { login: 'dependabot[bot]' } }))).toBe(true);
    expect(isDependabotAuthor(basePr({ user: { login: 'DependaBot-test' } }))).toBe(true);
  });

  test('returns false otherwise', () => {
    expect(isDependabotAuthor(basePr({ user: { login: 'renovate[bot]' } }))).toBe(false);
  });
});

describe('validateDependabotOpenPr', () => {
  test('returns one alert for open Dependabot PR', () => {
    const alerts = validateDependabotOpenPr(basePr(), 'o', 'r');
    expect(alerts).toHaveLength(1);
    expect(alerts[0].checkType).toBe('dependabot_open_pr');
    expect(alerts[0].title).toBe('pr:1');
    expect(alerts[0].severity).toBe('low');
  });

  test('returns empty when PR is closed', () => {
    expect(validateDependabotOpenPr(basePr({ state: 'closed' }), 'o', 'r')).toHaveLength(0);
  });

  test('returns empty when author is not Dependabot', () => {
    expect(
      validateDependabotOpenPr(basePr({ user: { login: 'human' } }), 'o', 'r')
    ).toHaveLength(0);
  });
});

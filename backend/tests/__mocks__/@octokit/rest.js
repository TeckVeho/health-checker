// Mock for @octokit/rest to resolve ES module issues in Jest tests

class MockOctokit {
  constructor(options) {
    this.auth = options?.auth;
  }

  rest = {
    repos: {
      get: jest.fn().mockResolvedValue({
        data: {
          id: 123,
          name: 'test-repo',
          full_name: 'test-owner/test-repo',
          owner: {
            login: 'test-owner'
          },
          default_branch: 'main'
        }
      }),
      listForOrg: jest.fn().mockResolvedValue({
        data: []
      }),
      listForUser: jest.fn().mockResolvedValue({
        data: []
      })
    },
    issues: {
      listForRepo: jest.fn().mockResolvedValue({
        data: []
      })
    },
    pulls: {
      list: jest.fn().mockResolvedValue({
        data: []
      })
    }
  };
}

module.exports = {
  Octokit: MockOctokit
};

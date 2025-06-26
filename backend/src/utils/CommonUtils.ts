// src/utils/CommonUtils.ts
export default class CommonUtils {
    static getGraphQLQuery(type: string): any {
        switch (type) {
            case 'project_number':
                return this.getGraphQLQueryProjectNumber();
            case 'all_project_number':
                return this.getGraphQLQueryProjectNumberAll();
            case 'pagination_project_number':
                return this.getGraphQLQueryPaginationProjectNumberAll();
            default: "";
        }
    }

    private static getGraphQLQueryProjectNumber(): string {
        const queryProjectNumber = `query ($org: String!, $number: Int!) { organization(login: $org) { projectV2(number: $number) {
          items(first: 100) {
            nodes {
              content { __typename
                  ... on Issue {  createdAt  updatedAt
                  repository {  name  owner { login } description   isPrivate  pushedAt createdAt  updatedAt  repositoryTopics(first: 1) {
                      nodes {
                        topic { name }
                      }
                    }
                  }
                }
                ... on PullRequest {  title createdAt  updatedAt  repository {  name
                    owner { login }  description isPrivate  pushedAt  createdAt updatedAt
                    repositoryTopics(first: 10) {
                      nodes {
                        topic { name } } } } } } } } } } }`;
        return queryProjectNumber;
    }
    private static getGraphQLQueryProjectNumberAll(): string {
        const queryProjectNumberAll =  `
    query ($org: String!) {
      organization(login: $org) {
        projectsV2(first: 100) {
          nodes {
            id
            number
            title
          }
        }
      }
    }
  `;

        return queryProjectNumberAll;
    }
    private static getGraphQLQueryPaginationProjectNumberAll(): string {
        const queryPaginationProjectNumberAll =  `
      query ($projectId: ID!, $after: String) {
        node(id: $projectId) {
          ... on ProjectV2 {
          items(first: 50, after: $after) { 
              pageInfo {
                hasNextPage
                endCursor
              }
              nodes {
                content {
                  __typename
                  ... on Issue {
                    repository {
                      name
                      owner { login }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;
        return  queryPaginationProjectNumberAll;

    }

}
import 'dotenv/config';
import { Octokit } from '@octokit/rest';
import { graphql } from '@octokit/graphql';

const githubToken = process.env.GITHUB_API_KEY;
if (!githubToken) throw new Error('GITHUB_API_KEY is required');

const octokit = new Octokit({
  auth: githubToken,
  request: {
    headers: { accept: 'application/vnd.github+json' },
  },
});

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `Bearer ${githubToken}`,
  },
});

export class ProjectService {
  static async getProjectV2(owner: string, projectNumber: number): Promise<any> {
    const query = `
      query GetProjectV2($owner: String!, $number: Int!) {
        organization(login: $owner) {
          projectV2(number: $number) {
            id
            number
            title
            fields(first: 100) {
              nodes {
                ... on ProjectV2Field {
                  id
                  name
                  dataType
                }
              }
            }
          }
        }
      }
    `;
    const data = await graphqlWithAuth(query, { owner, number: projectNumber }) as any;
    const project = data.organization?.projectV2;
    if (!project) {
      throw new Error(`Project V2 with number ${projectNumber} not found for organization ${owner}`);
    }
    return project;
  }

  static async getAllProjectsV2(owner: string): Promise<any[]> {
    const query = `
      query GetProjectsV2($owner: String!) {
        organization(login: $owner) {
          projectsV2(first: 100) {
            nodes {
              id
              number
              title
              fields(first: 100) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                }
              }
            }
          }
        }
        user(login: $owner) {
          projectsV2(first: 100) {
            nodes {
              id
              number
              title
              fields(first: 100) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                    dataType
                  }
                }
              }
            }
          }
        }
      }
    `;
    const data = await graphqlWithAuth(query, { owner }) as any;
    const projects = data.organization?.projectsV2?.nodes || data.user?.projectsV2?.nodes || [];
    return projects;
  }

  static async createProjectV2Field(projectId: string, fieldName: string, dataType: string): Promise<any> {
    const query = `
      mutation CreateProjectV2Field($projectId: ID!, $name: String!, $dataType: ProjectV2CustomFieldType!) {
        createProjectV2Field(input: {
          projectId: $projectId
          name: $name
          dataType: $dataType
        }) {
          projectV2Field {
            ... on ProjectV2FieldCommon {
              id
              name
              dataType
            }
          }
        }
      }
    `;
    const data = await graphqlWithAuth(query, {
      projectId,
      name: fieldName,
      dataType: dataType.toUpperCase(),
    }) as any;
    return data.createProjectV2Field.projectV2Field;
  }

  static hasSpField(project: any): boolean {
    if (!project.fields || !Array.isArray(project.fields.nodes)) return false;
    return project.fields.nodes.some((field: any) =>
      field?.name?.toLowerCase() === 'sp' && field?.dataType === 'NUMBER'
    );
  }

  static async addSpFieldToProject(owner: string, projectNumber: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🔍 Fetching project V2 #${projectNumber} for ${owner}...`);
      const project = await this.getProjectV2(owner, projectNumber);
      if (this.hasSpField(project)) {
        return {
          success: true,
          message: `✅ Project "${project.title}" (#${project.number}) already has SP field`
        };
      }
      await this.createProjectV2Field(project.id, 'SP', 'NUMBER');
      return {
        success: true,
        message: `✅ Successfully added SP field to project "${project.title}" (#${project.number})`
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to add SP field to project #${projectNumber}: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  static async addSpFieldToAllProjects(owner: string): Promise<{ success: boolean; message: string; results: any[] }> {
    try {
      console.log(`🔍 Fetching all projects V2 for ${owner}...`);
      const projects = await this.getAllProjectsV2(owner);
      if (projects.length === 0) {
        return {
          success: true,
          message: `ℹ️ No projects V2 found for ${owner}`,
          results: []
        };
      }
      const results = [];
      for (const project of projects) {
        const result = await this.addSpFieldToProject(owner, project.number);
        results.push({
          projectNumber: project.number,
          projectTitle: project.title,
          ...result
        });
      }
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      return {
        success: true,
        message: `✅ Processed ${totalCount} project(s). ${successCount} successful, ${totalCount - successCount} failed.`,
        results
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to process projects for ${owner}: ${error instanceof Error ? error.message : String(error)}`,
        results: []
      };
    }
  }
}

export default ProjectService; 
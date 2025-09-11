/**
 * Module Contracts for checkIssues Refactoring
 * These interfaces define the contracts between modules
 */

// ============= Public API (Preserved) =============

export interface IssueAlertCandidate {
  readonly projectId: string
  readonly alertType: string
  readonly severity: 'high' | 'middle' | 'low'
  readonly message: string
  readonly link: string
  readonly targetNodeId: string
  readonly targetType: 'issue'
  readonly isIgnored?: boolean
  readonly metadata?: {
    readonly title?: string
    readonly labels?: string[]
    readonly assignees?: string[]
    readonly body?: string
    readonly storyPoints?: number
    readonly endDate?: string
    readonly [key: string]: unknown
  }
}

export interface CheckIssuesResult {
  readonly owner: string
  readonly repo: string
  readonly alerts: IssueAlertCandidate[]
}

// ============= Core Module Contract =============

export interface ICheckIssuesCore {
  /**
   * Main entry point - orchestrates all checks
   * MUST maintain backward compatibility
   */
  checkIssues(owner: string, repo: string): Promise<CheckIssuesResult>
}

// ============= GitHub Module Contract =============

export interface GitHubIssue {
  readonly id: number
  readonly node_id: string
  readonly number: number
  readonly title: string
  readonly body: string | null
  readonly html_url: string
  readonly created_at: string
  readonly updated_at: string
  readonly assignees: Array<{ login: string }>
  readonly labels: Array<{ name: string }>
  readonly state: 'open' | 'closed'
}

export interface IGitHubClient {
  /**
   * Fetch all open issues created after CREATED_SINCE
   */
  fetchIssues(owner: string, repo: string): Promise<GitHubIssue[]>
  
  /**
   * Execute GraphQL query against GitHub API
   */
  graphql<T>(query: string, variables: Record<string, any>): Promise<T>
}

// ============= Projects Module Contract =============

export interface ProjectFieldValue {
  readonly issueNodeId: string
  readonly storyPoints?: number
  readonly endDate?: string
  readonly projectNodeId?: string
}

export interface ProjectMembership {
  readonly issueNodeId: string
  readonly inProject: boolean
  readonly projectIds: string[]
}

export interface IProjectsAnalyzer {
  /**
   * Get project field values for all issues
   */
  getProjectFieldValues(
    owner: string,
    repo: string,
    issueNodeIds: string[]
  ): Promise<Map<string, ProjectFieldValue>>
  
  /**
   * Check which issues are in projects
   */
  checkProjectMembership(
    owner: string,
    repo: string,
    issueNodeIds: string[]
  ): Promise<Map<string, ProjectMembership>>
}

// ============= Parsers Module Contract =============

export interface ParsedIssueData {
  readonly storyPoints?: number
  readonly endDate?: string
  readonly hasTemplate: boolean
  readonly templatePercentage?: number
}

export interface ITextParser {
  /**
   * Extract story points from issue body
   */
  extractStoryPoints(body: string | null): number | undefined
  
  /**
   * Extract end date from issue body
   */
  extractEndDate(body: string | null): string | undefined
  
  /**
   * Detect template markers in text
   */
  detectTemplateMarkers(body: string | null): {
    hasTemplate: boolean
    percentage: number
  }
}

// ============= LLM Module Contract =============

export interface LLMAnalysisResult {
  readonly isTemplateOnly: boolean
  readonly hasUnclearInstructions: boolean
  readonly confidence: number
  readonly fallbackUsed: boolean
  readonly analysis?: string
}

export interface IContentAnalyzer {
  /**
   * Analyze if issue contains only template content
   */
  detectTemplateOnlyIssue(
    title: string,
    body: string | null
  ): Promise<LLMAnalysisResult>
  
  /**
   * Analyze if issue has unclear instructions
   */
  detectUnclearInstructions(
    title: string,
    body: string | null
  ): Promise<LLMAnalysisResult>
}

// ============= Validators Module Contract =============

export interface ValidationResult {
  readonly passed: boolean
  readonly alertType?: string
  readonly severity?: 'high' | 'middle' | 'low'
  readonly message?: string
}

export interface IssueContext {
  readonly issue: GitHubIssue
  readonly projectData?: ProjectFieldValue
  readonly parsedData?: ParsedIssueData
  readonly llmAnalysis?: LLMAnalysisResult
  readonly inProject: boolean
}

export interface IBusinessValidator {
  /**
   * Validate assignment rules
   */
  validateAssignment(context: IssueContext): ValidationResult
  
  /**
   * Validate story points
   */
  validateStoryPoints(context: IssueContext): ValidationResult[]
  
  /**
   * Validate end dates
   */
  validateDates(context: IssueContext): ValidationResult[]
  
  /**
   * Validate project membership
   */
  validateProjectMembership(context: IssueContext): ValidationResult
  
  /**
   * Validate content quality
   */
  validateContentQuality(context: IssueContext): ValidationResult[]
}

// ============= Factory Contracts =============

export interface IModuleFactory {
  createGitHubClient(): IGitHubClient
  createProjectsAnalyzer(client: IGitHubClient): IProjectsAnalyzer
  createTextParser(): ITextParser
  createContentAnalyzer(): IContentAnalyzer
  createBusinessValidator(): IBusinessValidator
}
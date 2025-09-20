import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { createAppError, errorMessages, logError, type ErrorContext } from './errors'

// Types
export interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

export interface Repo {
  id: string
  owner: string
  name: string
  description?: string
  lastActivityAt: string
  [key: string]: any
}

export interface AlertSummary {
  [repoKey: string]: {
    [key: string]: number
  }
}

// ReCheck Types
export interface RecheckResponse {
  success: boolean
  message: string
  result?: {
    owner: string
    repo: string
    executionId: string
    startedAt: string
    estimatedDuration: number
  }
  error?: {
    code: string
    message: string
    retryAfter?: number
  }
}

export interface RecheckStatusResponse {
  status: 'idle' | 'running' | 'completed' | 'error'
  lastExecutedAt?: string
  nextAvailableAt?: string
  currentExecution?: {
    executionId: string
    startedAt: string
    progress: number
    durationSeconds?: number
    currentPhase?: string
    totalPhases?: number
    phaseProgress?: number
    phaseDetails?: {
      phase: string
      progress: number
      totalItems?: number
      processedItems?: number
    }
  }
}

export interface RecheckExecution {
  id: number
  executionId: string
  status: 'running' | 'completed' | 'error' | 'timeout'
  checkTypes: string[]
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  errorMessage?: string
  errorCode?: string
}

export interface RecheckSettings {
  id: number
  owner: string
  repo: string
  rateLimitMinutes: number
  maxConcurrentExecutions: number
  allowedCheckTypes: string[]
  timeoutMinutes: number
  isEnabled: boolean
}

export interface RecheckStats {
  totalExecutions: number
  successRate: number
  averageDuration: number
  lastExecutedAt?: string
}

// API Configuration
export interface ApiConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
}

// Request Options with better typing
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: Record<string, any>
  params?: Record<string, any>
  timeout?: number
}

// API Client Class
class ApiClient {
  private client: AxiosInstance | null = null
  private config: ApiConfig
  private apiBaseUrl?: string

  constructor(config: Partial<ApiConfig> = {}, apiBaseUrl?: string) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3000',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    }
    this.apiBaseUrl = apiBaseUrl
  }

  private createClient(baseURL: string): AxiosInstance {
    const client = axios.create({
      baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    client.interceptors.request.use(
      (config) => {
        // Add auth token if available (only in browser)
        if (process.client) {
          const token = localStorage.getItem('auth_token')
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor with retry logic
    client.interceptors.response.use(
      (response) => {
        return response
      },
      async (error) => {
        const { config: requestConfig } = error
        
        // Retry logic for network errors
        if (error.code === 'ECONNABORTED' || !error.response) {
          if (requestConfig && !requestConfig._retry) {
            requestConfig._retry = true
            requestConfig._retryCount = (requestConfig._retryCount || 0) + 1
            
            if (requestConfig._retryCount <= this.config.retryAttempts) {
              await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
              return client.request(requestConfig)
            }
          }
        }

        // Handle common errors
        if (error.response?.status === 401) {
          logError(createAppError.auth(errorMessages.AUTH.UNAUTHORIZED), 'Response Interceptor')
          // Could trigger logout here
        } else if (error.response?.status === 500) {
                      logError(createAppError.server('Server error occurred - please try again later'), 'Response Interceptor')
          } else if (error.response?.status === 404) {
            logError(createAppError.notFound('Resource not found'), 'Response Interceptor')
        }
        
        return Promise.reject(error)
      }
    )

    return client
  }

  private getClient(): AxiosInstance {
    if (!this.client) {
      const baseURL = this.apiBaseUrl || this.config.baseURL
      this.client = this.createClient(baseURL)
    }
    return this.client
  }

  // Method to set base URL dynamically
  setBaseURL(baseURL: string) {
    this.config.baseURL = baseURL
    this.client = this.createClient(baseURL)
  }

  // Method to set API base URL
  setApiBaseUrl(apiBaseUrl: string) {
    this.apiBaseUrl = apiBaseUrl
    this.client = null // Reset client to use new base URL
  }

  // Generic request method
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.getClient().request(config)
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.getClient().get(url, config)
  }

  // POST request
  async post<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.getClient().post(url, data, config)
  }

  // PUT request
  async put<T = any>(url: string, data?: Record<string, any>, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.getClient().put(url, data, config)
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.getClient().delete(url, config)
  }
}

// API Service Class
export class ApiService {
  private client: ApiClient
  private apiBaseUrl?: string

  constructor(config?: Partial<ApiConfig>) {
    this.client = new ApiClient(config)
  }

  // Method to initialize with runtime config
  init(baseURL?: string) {
    this.apiBaseUrl = baseURL
    if (baseURL) {
      this.client.setApiBaseUrl(baseURL)
    }
  }

  // Validation helpers
  private validateLimit(limit: number): number {
    if (limit < 1 || limit > 1000) {
      throw createAppError.validation(errorMessages.VALIDATION.LIMIT_RANGE, { limit })
    }
    return limit
  }

  private validateSort(sort: string): string {
    const validSorts = ['last_activity_at', 'name', 'owner', 'created_at', 'description']
    if (!validSorts.includes(sort)) {
      throw createAppError.validation(errorMessages.VALIDATION.INVALID_SORT(validSorts), { sort, validSorts })
    }
    return sort
  }

  // Repo methods
  async getRepos(limit: number = 200, sort: string = 'last_activity_at'): Promise<Repo[]> {
    try {
      const validatedLimit = this.validateLimit(limit)
      const validatedSort = this.validateSort(sort)
      
      const response = await this.client.get<ApiResponse<Repo[]>>(
        `/api/repos/?limit=${validatedLimit}&sort=${validatedSort}`
      )
      return response.data.data || []
    } catch (error) {
      logError(error, 'getRepos')
      const context: ErrorContext = { operation: 'fetch repositories', limit, sort }
      throw createAppError.api(errorMessages.API.FETCH_FAILED('repositories'), context)
    }
  }

  // Alert methods
  async getAlertSummary(repos: Array<{ owner: string; repo: string }>): Promise<AlertSummary> {
    try {
      if (!Array.isArray(repos) || repos.length === 0) {
        throw createAppError.validation(errorMessages.VALIDATION.EMPTY_ARRAY, { repos })
      }
      
      const response = await this.client.post<AlertSummary>('/api/alerts/summary', repos)
      return response.data
    } catch (error) {
      logError(error, 'getAlertSummary')
      const context: ErrorContext = { operation: 'fetch alert summary', reposCount: repos.length }
      throw createAppError.api(errorMessages.API.FETCH_FAILED('alert summary'), context)
    }
  }

  // Alert methods
  async getAlertSummaryByCheckType(repos: Array<{ owner: string; repo: string }>): Promise<AlertSummary> {
    try {
      if (!Array.isArray(repos) || repos.length === 0) {
        throw createAppError.validation(errorMessages.VALIDATION.EMPTY_ARRAY, { repos })
      }
      
      const response = await this.client.post<AlertSummary>('/api/alerts/summary-by-checktype', repos)
      return response.data
    } catch (error) {
      logError(error, 'getAlertSummaryByCheckType')
      const context: ErrorContext = { operation: 'fetch alert summary by check type', reposCount: repos.length }
      throw createAppError.api(errorMessages.API.FETCH_FAILED('alert summary by check type'), context)
    }
  }

  // ReCheck methods
  async executeGlobalRecheck(checks?: string[]): Promise<RecheckResponse> {
    try {
      const response = await this.client.post<RecheckResponse>('/api/recheck/global', {
        checks: checks || ['branch', 'clone', 'gitleaks', 'issue']
      })
      return response.data
    } catch (error) {
      logError(error, 'executeGlobalRecheck')
      const context: ErrorContext = { operation: 'execute global recheck', checks }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('Global ReCheck execution'), context)
    }
  }

  async executeRecheck(owner: string, repo: string, checks?: string[]): Promise<RecheckResponse> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.post<RecheckResponse>(`/api/recheck/${owner}/${repo}`, {
        checks: checks || ['branch', 'clone', 'gitleaks', 'issue']
      })
      return response.data
    } catch (error) {
      logError(error, 'executeRecheck')
      const context: ErrorContext = { operation: 'execute recheck', owner, repo, checks }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck execution'), context)
    }
  }

  async getRecheckStatus(owner: string, repo: string): Promise<RecheckStatusResponse> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.get<RecheckStatusResponse>(`/api/recheck/${owner}/${repo}/status`)
      return response.data
    } catch (error) {
      logError(error, 'getRecheckStatus')
      const context: ErrorContext = { operation: 'get recheck status', owner, repo }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck status'), context)
    }
  }

  async getRecheckHistory(owner: string, repo: string, limit: number = 10, offset: number = 0): Promise<{
    success: boolean
    data: RecheckExecution[]
    pagination: {
      total: number
      limit: number
      offset: number
    }
  }> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.get(`/api/recheck/${owner}/${repo}/history`, {
        params: { limit, offset }
      })
      return response.data
    } catch (error) {
      logError(error, 'getRecheckHistory')
      const context: ErrorContext = { operation: 'get recheck history', owner, repo, limit, offset }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck history'), context)
    }
  }

  async getRecheckStats(owner: string, repo: string): Promise<{
    success: boolean
    data: RecheckStats
  }> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.get(`/api/recheck/${owner}/${repo}/stats`)
      return response.data
    } catch (error) {
      logError(error, 'getRecheckStats')
      const context: ErrorContext = { operation: 'get recheck stats', owner, repo }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck stats'), context)
    }
  }

  async getRecheckSettings(owner: string, repo: string): Promise<{
    success: boolean
    data: RecheckSettings
  }> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.get(`/api/recheck/${owner}/${repo}/settings`)
      return response.data
    } catch (error) {
      logError(error, 'getRecheckSettings')
      const context: ErrorContext = { operation: 'get recheck settings', owner, repo }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck settings'), context)
    }
  }

  async updateRecheckSettings(owner: string, repo: string, settings: Partial<RecheckSettings>): Promise<{
    success: boolean
    message: string
    data: RecheckSettings
  }> {
    try {
      if (!owner || !repo) {
        throw createAppError.validation('Owner and repo are required', { owner, repo })
      }
      
      const response = await this.client.put(`/api/recheck/${owner}/${repo}/settings`, settings)
      return response.data
    } catch (error) {
      logError(error, 'updateRecheckSettings')
      const context: ErrorContext = { operation: 'update recheck settings', owner, repo, settings }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('ReCheck settings update'), context)
    }
  }

  // Generic method for any API call with better typing
  async fetchData<T = any>(url: string, options?: RequestOptions): Promise<T> {
    try {
      const { method = 'GET', data, params, timeout } = options || {}
      
      const config: AxiosRequestConfig = {
        method,
        url,
        data,
        params,
        timeout: timeout || this.client['config'].timeout,
      }

      const response = await this.client.request<T>(config)
      return response.data
    } catch (error) {
      logError(error, 'fetchData')
      const { method = 'GET', timeout } = options || {}
      const context: ErrorContext = { 
        operation: 'fetch data', 
        url, 
        method, 
        timeout: timeout || this.client['config'].timeout 
      }
      throw createAppError.api(errorMessages.API.REQUEST_FAILED('API'), context)
    }
  }
}

// Create singleton instance
let apiServiceInstance: ApiService | null = null

export function useApiService(): ApiService {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService()
  }
  return apiServiceInstance
}

// Export for direct use
export const apiService = useApiService() 
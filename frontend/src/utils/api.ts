import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useApiConfig } from '../composables/useApiConfig'

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
  lastActivityAt: string
  [key: string]: any
}

export interface AlertSummary {
  [repoKey: string]: {
    high: number
    middle: number
    low: number
  }
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

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || 'http://localhost:3000',
      timeout: config.timeout || 10000,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
    }
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
          console.error('Unauthorized access - please login again')
          // Could trigger logout here
        } else if (error.response?.status === 500) {
          console.error('Server error occurred - please try again later')
        } else if (error.response?.status === 404) {
          console.error('Resource not found')
        }
        
        return Promise.reject(error)
      }
    )

    return client
  }

  private getClient(): AxiosInstance {
    const { apiBaseUrl } = useApiConfig()
    if (!this.client) {
      const baseURL = apiBaseUrl || this.config.baseURL
      this.client = this.createClient(baseURL)
    }
    return this.client
  }

  // Method to set base URL dynamically
  setBaseURL(baseURL: string) {
    this.config.baseURL = baseURL
    this.client = this.createClient(baseURL)
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

  constructor(config?: Partial<ApiConfig>) {
    this.client = new ApiClient(config)
  }

  // Method to initialize with runtime config
  init(baseURL?: string) {
    if (baseURL) {
      this.client.setBaseURL(baseURL)
    }
  }

  // Validation helpers
  private validateLimit(limit: number): number {
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000')
    }
    return limit
  }

  private validateSort(sort: string): string {
    const validSorts = ['last_activity_at', 'name', 'owner', 'created_at']
    if (!validSorts.includes(sort)) {
      throw new Error(`Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`)
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
      console.error('Failed to fetch repos:', error)
      throw new Error(`Failed to fetch repositories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Alert methods
  async getAlertSummary(repos: Array<{ owner: string; repo: string }>): Promise<AlertSummary> {
    try {
      if (!Array.isArray(repos) || repos.length === 0) {
        throw new Error('Repos array must not be empty')
      }
      
      const response = await this.client.post<AlertSummary>('/api/alerts/summary', repos)
      return response.data
    } catch (error) {
      console.error('Failed to fetch alert summary:', error)
      throw new Error(`Failed to fetch alert summary: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
      console.error(`Failed to fetch data from ${url}:`, error)
      throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
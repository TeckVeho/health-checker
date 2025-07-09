import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiService, type Repo, type AlertSummary, type ApiResponse } from '@/utils/api'
import axios from 'axios'
import { createAppError, errorMessages } from '@/utils/errors'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock error utilities
vi.mock('@/utils/errors', () => ({
  createAppError: {
    validation: vi.fn((message: string, context?: any) => new Error(message)),
    api: vi.fn((message: string, context?: any) => new Error(message)),
    auth: vi.fn((message: string) => new Error(message)),
    server: vi.fn((message: string) => new Error(message)),
    notFound: vi.fn((message: string) => new Error(message))
  },
  errorMessages: {
    VALIDATION: {
      LIMIT_RANGE: 'Limit must be between 1 and 1000',
      INVALID_SORT: (validSorts: string[]) => `Invalid sort parameter. Must be one of: ${validSorts.join(', ')}`,
      EMPTY_ARRAY: 'Array must not be empty'
    },
    API: {
      FETCH_FAILED: (operation: string) => `Failed to fetch ${operation}`,
      REQUEST_FAILED: (operation: string) => `${operation} request failed`
    },
    AUTH: {
      UNAUTHORIZED: 'Unauthorized access - please login again'
    }
  },
  logError: vi.fn()
}))

describe('ApiService', () => {
  let apiService: ApiService
  let mockAxiosInstance: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Create mock axios instance
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
    
    ;(mockedAxios.create as any).mockReturnValue(mockAxiosInstance)
    
    apiService = new ApiService({ baseURL: 'http://localhost:3000' })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('instantiation', () => {
    it('should create ApiService with default config', () => {
      const service = new ApiService()
      expect(service).toBeInstanceOf(ApiService)
    })

    it('should create ApiService with custom config', () => {
      const config = {
        baseURL: 'https://api.example.com',
        timeout: 5000,
        retryAttempts: 5,
        retryDelay: 2000
      }
      const service = new ApiService(config)
      expect(service).toBeInstanceOf(ApiService)
    })
  })

  describe('init method', () => {
    it('should initialize with base URL', () => {
      apiService.init('https://api.example.com')
      expect(apiService).toBeDefined()
    })

    it('should initialize without base URL', () => {
      apiService.init()
      expect(apiService).toBeDefined()
    })
  })

  describe('validation methods', () => {
    describe('validateLimit', () => {
      it('should accept valid limit values', async () => {
        const validLimits = [1, 100, 500, 1000]
        
        for (const limit of validLimits) {
          mockAxiosInstance.get.mockResolvedValue({
            data: { data: [], success: true }
          })
          
          await expect(apiService.getRepos(limit)).resolves.toEqual([])
        }
      })

      it('should reject invalid limit values', async () => {
        const invalidLimits = [0, -1, 1001, 9999]
        
        for (const limit of invalidLimits) {
          await expect(apiService.getRepos(limit)).rejects.toThrow()
        }
      })
    })

    describe('validateSort', () => {
      it('should accept valid sort values', async () => {
        const validSorts = ['last_activity_at', 'name', 'owner', 'created_at']
        
        for (const sort of validSorts) {
          mockAxiosInstance.get.mockResolvedValue({
            data: { data: [], success: true }
          })
          
          await expect(apiService.getRepos(200, sort)).resolves.toEqual([])
        }
      })

      it('should reject invalid sort values', async () => {
        const invalidSorts = ['invalid', 'test', 'random']
        
        for (const sort of invalidSorts) {
          await expect(apiService.getRepos(200, sort)).rejects.toThrow()
        }
      })
    })
  })

  describe('getRepos method', () => {
    const mockRepos: Repo[] = [
      {
        id: '1',
        owner: 'test-owner',
        name: 'test-repo',
        lastActivityAt: '2023-01-01T00:00:00Z'
      }
    ]

    const mockApiResponse: ApiResponse<Repo[]> = {
      data: mockRepos,
      success: true,
      message: 'Success'
    }

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue({
        data: mockApiResponse
      })
    })

    it('should fetch repos successfully', async () => {
      const result = await apiService.getRepos(100, 'name')
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/repos/?limit=100&sort=name',
        undefined
      )
      expect(result).toEqual(mockRepos)
    })

    it('should use default parameters', async () => {
      await apiService.getRepos()
      
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        '/api/repos/?limit=200&sort=last_activity_at',
        undefined
      )
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      mockAxiosInstance.get.mockRejectedValue(error)

      await expect(apiService.getRepos()).rejects.toThrow()
    })

    it('should return empty array when no data', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: { data: null, success: true }
      })

      const result = await apiService.getRepos()
      expect(result).toEqual([])
    })
  })

  describe('getAlertSummary method', () => {
    const mockRepos = [
      { owner: 'test-owner', repo: 'test-repo' }
    ]

    const mockAlertSummary: AlertSummary = {
      'test-owner/test-repo': {
        high: 2,
        middle: 1,
        low: 0
      }
    }

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue({
        data: mockAlertSummary
      })
    })

    it('should fetch alert summary successfully', async () => {
      const result = await apiService.getAlertSummary(mockRepos)
      
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/alerts/summary',
        mockRepos,
        undefined
      )
      expect(result).toEqual(mockAlertSummary)
    })

    it('should reject empty repos array', async () => {
      await expect(apiService.getAlertSummary([])).rejects.toThrow()
    })

    it('should reject non-array input', async () => {
      await expect(apiService.getAlertSummary(null as any)).rejects.toThrow()
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      mockAxiosInstance.post.mockRejectedValue(error)

      await expect(apiService.getAlertSummary(mockRepos)).rejects.toThrow()
    })
  })

  describe('fetchData method', () => {
    const mockData = { test: 'data' }

    beforeEach(() => {
      mockAxiosInstance.request.mockResolvedValue({
        data: mockData
      })
    })

    it('should fetch data with GET method by default', async () => {
      const result = await apiService.fetchData('/test-endpoint')
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/test-endpoint',
        data: undefined,
        params: undefined,
        timeout: 10000
      })
      expect(result).toEqual(mockData)
    })

    it('should fetch data with custom options', async () => {
      const options = {
        method: 'POST' as const,
        data: { test: 'payload' },
        params: { query: 'param' },
        timeout: 5000
      }

      const result = await apiService.fetchData('/test-endpoint', options)
      
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/test-endpoint',
        data: { test: 'payload' },
        params: { query: 'param' },
        timeout: 5000
      })
      expect(result).toEqual(mockData)
    })

    it('should handle API errors', async () => {
      const error = new Error('Network error')
      mockAxiosInstance.request.mockRejectedValue(error)

      await expect(apiService.fetchData('/test-endpoint')).rejects.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('Network error') as any
      networkError.code = 'ECONNABORTED'
      mockAxiosInstance.get.mockRejectedValue(networkError)

      await expect(apiService.getRepos()).rejects.toThrow()
    })

    it('should handle 401 errors', async () => {
      const authError = new Error('Unauthorized') as any
      authError.response = { status: 401 }
      mockAxiosInstance.get.mockRejectedValue(authError)

      await expect(apiService.getRepos()).rejects.toThrow()
    })

    it('should handle 404 errors', async () => {
      const notFoundError = new Error('Not found') as any
      notFoundError.response = { status: 404 }
      mockAxiosInstance.get.mockRejectedValue(notFoundError)

      await expect(apiService.getRepos()).rejects.toThrow()
    })

    it('should handle 500 errors', async () => {
      const serverError = new Error('Server error') as any
      serverError.response = { status: 500 }
      mockAxiosInstance.get.mockRejectedValue(serverError)

      await expect(apiService.getRepos()).rejects.toThrow()
    })
  })
}) 
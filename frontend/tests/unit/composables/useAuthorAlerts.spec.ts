import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthorAlerts } from '~/composables/useAuthorAlerts'
import axios from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock useRuntimeConfig
vi.mock('#app', () => ({
  useRuntimeConfig: () => ({
    public: {
      apiBaseUrl: 'http://localhost:3000'
    }
  })
}))

describe('useAuthorAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties and methods', () => {
      const result = useAuthorAlerts()
      
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('loading')
      expect(result).toHaveProperty('error')
      expect(result).toHaveProperty('currentPage')
      expect(result).toHaveProperty('totalItems')
      expect(result).toHaveProperty('totalPages')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('sortBy')
      expect(result).toHaveProperty('sortOrder')
      expect(result).toHaveProperty('owner')
      expect(result).toHaveProperty('repo')
      expect(result).toHaveProperty('fetchData')
      expect(result).toHaveProperty('refresh')
      expect(result).toHaveProperty('setFilters')
      expect(result).toHaveProperty('setSorting')
      expect(result).toHaveProperty('goToPage')
      expect(result).toHaveProperty('hasData')
      expect(result).toHaveProperty('isEmpty')
      expect(result).toHaveProperty('hasError')
      expect(result).toHaveProperty('paginationInfo')
    })

    it('should initialize with default values', () => {
      const result = useAuthorAlerts()
      
      expect(result.data.value).toEqual([])
      expect(result.loading.value).toBe(false)
      expect(result.error.value).toBeNull()
      expect(result.currentPage.value).toBe(1)
      expect(result.totalItems.value).toBe(0)
      expect(result.totalPages.value).toBe(0)
      expect(result.limit.value).toBe(50)
      expect(result.sortBy.value).toBe('totalAlerts')
      expect(result.sortOrder.value).toBe('desc')
      expect(result.owner.value).toBe('')
      expect(result.repo.value).toBe('')
    })
  })

  describe('fetchData', () => {
    it('should fetch data successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              author: 'test-author',
              totalAlerts: 10,
              issueTypeCounts: {
                missingSp: 5,
                largeSp: 2,
                missingEndDate: 3,
                notInProject: 0,
                templateOnly: 0,
                unclearInstruction: 0,
                unassigned: 0
              },
              lastActivity: '2023-01-01T00:00:00Z'
            }
          ],
          pagination: {
            page: 1,
            limit: 50,
            total: 1,
            totalPages: 1
          }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { fetchData, data, loading, error, totalItems, totalPages, currentPage } = useAuthorAlerts()

      await fetchData()

      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(data.value).toEqual(mockResponse.data.data)
      expect(totalItems.value).toBe(1)
      expect(totalPages.value).toBe(1)
      expect(currentPage.value).toBe(1)
    })

    it('should handle fetch errors', async () => {
      const mockError = {
        response: {
          data: {
            message: 'API Error'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      const { fetchData, data, loading, error, totalItems, totalPages } = useAuthorAlerts()

      await fetchData()

      expect(loading.value).toBe(false)
      expect(error.value).toBe('API Error')
      expect(data.value).toEqual([])
      expect(totalItems.value).toBe(0)
      expect(totalPages.value).toBe(0)
    })

    it('should include query parameters correctly', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { fetchData, sortBy, sortOrder, currentPage, limit, owner, repo } = useAuthorAlerts()

      sortBy.value = 'author'
      sortOrder.value = 'asc'
      currentPage.value = 2
      limit.value = 25
      owner.value = 'test-owner'
      repo.value = 'test-repo'

      await fetchData()

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/alerts/by-author?sortBy=author&sortOrder=asc&page=2&limit=25&owner=test-owner&repo=test-repo'
      )
    })
  })

  describe('refresh', () => {
    it('should reset page to 1 and fetch data', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { refresh, currentPage } = useAuthorAlerts()

      currentPage.value = 5

      await refresh()

      expect(currentPage.value).toBe(1)
      expect(mockedAxios.get).toHaveBeenCalled()
    })
  })

  describe('setFilters', () => {
    it('should update filters and reset page', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { setFilters, owner, repo, currentPage } = useAuthorAlerts()

      currentPage.value = 3

      await setFilters({ owner: 'new-owner', repo: 'new-repo' })

      expect(owner.value).toBe('new-owner')
      expect(repo.value).toBe('new-repo')
      expect(currentPage.value).toBe(1)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should handle partial filter updates', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { setFilters, owner, repo, currentPage } = useAuthorAlerts()

      owner.value = 'existing-owner'
      repo.value = 'existing-repo'

      await setFilters({ owner: 'updated-owner' })

      expect(owner.value).toBe('updated-owner')
      expect(repo.value).toBe('existing-repo')
      expect(currentPage.value).toBe(1)
      expect(mockedAxios.get).toHaveBeenCalled()
    })
  })

  describe('setSorting', () => {
    it('should update sorting and reset page', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { setSorting, sortBy, sortOrder, currentPage } = useAuthorAlerts()

      currentPage.value = 3

      await setSorting('author', 'asc')

      expect(sortBy.value).toBe('author')
      expect(sortOrder.value).toBe('asc')
      expect(currentPage.value).toBe(1)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should use default order when not specified', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { setSorting, sortBy, sortOrder } = useAuthorAlerts()

      await setSorting('lastActivity')

      expect(sortBy.value).toBe('lastActivity')
      expect(sortOrder.value).toBe('desc')
      expect(mockedAxios.get).toHaveBeenCalled()
    })
  })

  describe('goToPage', () => {
    it('should navigate to valid page', async () => {
      const mockResponse = {
        data: {
          data: [],
          pagination: { page: 3, limit: 50, total: 100, totalPages: 5 }
        }
      }

      mockedAxios.get.mockResolvedValue(mockResponse)

      const { goToPage, currentPage, totalPages } = useAuthorAlerts()

      totalPages.value = 5

      await goToPage(3)

      expect(currentPage.value).toBe(3)
      expect(mockedAxios.get).toHaveBeenCalled()
    })

    it('should not navigate to invalid page', async () => {
      const { goToPage, currentPage, totalPages } = useAuthorAlerts()

      currentPage.value = 2
      totalPages.value = 5

      await goToPage(0) // Invalid: less than 1
      expect(currentPage.value).toBe(2)
      expect(mockedAxios.get).not.toHaveBeenCalled()

      await goToPage(6) // Invalid: greater than totalPages
      expect(currentPage.value).toBe(2)
      expect(mockedAxios.get).not.toHaveBeenCalled()
    })
  })

  describe('computed properties', () => {
    it('should compute hasData correctly', () => {
      const { hasData, data } = useAuthorAlerts()

      data.value = []
      expect(hasData.value).toBe(false)

      data.value = [{ author: 'test', totalAlerts: 1, issueTypeCounts: {}, lastActivity: '2023-01-01' }]
      expect(hasData.value).toBe(true)
    })

    it('should compute isEmpty correctly', () => {
      const { isEmpty, loading, data, error } = useAuthorAlerts()

      loading.value = false
      data.value = []
      error.value = null
      expect(isEmpty.value).toBe(true)

      loading.value = true
      expect(isEmpty.value).toBe(false)

      data.value = [{ author: 'test', totalAlerts: 1, issueTypeCounts: {}, lastActivity: '2023-01-01' }]
      loading.value = false
      expect(isEmpty.value).toBe(false)

      error.value = 'Some error'
      data.value = []
      loading.value = false
      expect(isEmpty.value).toBe(false)
    })

    it('should compute hasError correctly', () => {
      const { hasError, error } = useAuthorAlerts()

      error.value = null
      expect(hasError.value).toBe(false)

      error.value = 'Some error'
      expect(hasError.value).toBe(true)
    })

    it('should compute paginationInfo correctly', () => {
      const { paginationInfo, currentPage, totalPages, totalItems, limit } = useAuthorAlerts()

      currentPage.value = 2
      totalPages.value = 5
      totalItems.value = 100
      limit.value = 25

      const info = paginationInfo.value
      expect(info.current).toBe(2)
      expect(info.total).toBe(5)
      expect(info.items).toBe(100)
      expect(info.from).toBe(26) // (2-1) * 25 + 1
      expect(info.to).toBe(50) // min(2 * 25, 100)
    })

    it('should handle zero items in paginationInfo', () => {
      const { paginationInfo, currentPage, totalPages, totalItems, limit } = useAuthorAlerts()

      currentPage.value = 1
      totalPages.value = 0
      totalItems.value = 0
      limit.value = 25

      const info = paginationInfo.value
      expect(info.from).toBe(0)
      expect(info.to).toBe(0)
    })
  })
})

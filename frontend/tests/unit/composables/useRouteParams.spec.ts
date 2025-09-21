import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useRouteParams } from '~/composables/useRouteParams'

import { reactive } from 'vue'

// Mock useRoute from vue-router with reactive object
const mockRoute = reactive({
  params: {
    owner: 'test-owner',
    repo: 'test-repo',
    author: 'test-author'
  },
  query: {
    tab: 'severity',
    page: '2'
  }
})

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute
}))

describe('useRouteParams', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should return expected properties', () => {
      const result = useRouteParams()
      
      expect(result).toHaveProperty('owner')
      expect(result).toHaveProperty('repo')
      expect(result).toHaveProperty('author')
      expect(result).toHaveProperty('tab')
      expect(result).toHaveProperty('page')
    })

    it('should extract params from route', () => {
      const { owner, repo, author } = useRouteParams()
      
      expect(owner.value).toBe('test-owner')
      expect(repo.value).toBe('test-repo')
      expect(author.value).toBe('test-author')
    })

    it('should extract query parameters from route', () => {
      const { tab, page } = useRouteParams()
      
      expect(tab.value).toBe('severity')
      expect(page.value).toBe('2')
    })
  })

  describe('reactive updates', () => {
    it('should update when route params change', () => {
      const { owner, repo, author } = useRouteParams()
      
      // Initial values
      expect(owner.value).toBe('test-owner')
      expect(repo.value).toBe('test-repo')
      expect(author.value).toBe('test-author')
      
      // Simulate route change
      mockRoute.params.owner = 'new-owner'
      mockRoute.params.repo = 'new-repo'
      mockRoute.params.author = 'new-author'
      
      // Values should be reactive
      expect(owner.value).toBe('new-owner')
      expect(repo.value).toBe('new-repo')
      expect(author.value).toBe('new-author')
    })

    it('should update when route query changes', () => {
      const { tab, page } = useRouteParams()
      
      // Initial values
      expect(tab.value).toBe('severity')
      expect(page.value).toBe('2')
      
      // Simulate route change
      mockRoute.query.tab = 'checktype'
      mockRoute.query.page = '3'
      
      // Values should be reactive
      expect(tab.value).toBe('checktype')
      expect(page.value).toBe('3')
    })
  })

  describe('undefined values', () => {
    it('should handle undefined params', () => {
      // Reset route with undefined params
      mockRoute.params = {}
      mockRoute.query = {}
      
      const { owner, repo, author, tab, page } = useRouteParams()
      
      expect(owner.value).toBeUndefined()
      expect(repo.value).toBeUndefined()
      expect(author.value).toBeUndefined()
      expect(tab.value).toBeUndefined()
      expect(page.value).toBeUndefined()
    })

    it('should handle partial params', () => {
      // Reset route with partial params
      mockRoute.params = { owner: 'partial-owner' }
      mockRoute.query = { tab: 'author' }
      
      const { owner, repo, author, tab, page } = useRouteParams()
      
      expect(owner.value).toBe('partial-owner')
      expect(repo.value).toBeUndefined()
      expect(author.value).toBeUndefined()
      expect(tab.value).toBe('author')
      expect(page.value).toBeUndefined()
    })
  })

  describe('type safety', () => {
    it('should handle string values correctly', () => {
      mockRoute.params = {
        owner: 'string-owner',
        repo: 'string-repo',
        author: 'string-author'
      }
      mockRoute.query = {
        tab: 'string-tab',
        page: 'string-page'
      }
      
      const { owner, repo, author, tab, page } = useRouteParams()
      
      expect(typeof owner.value).toBe('string')
      expect(typeof repo.value).toBe('string')
      expect(typeof author.value).toBe('string')
      expect(typeof tab.value).toBe('string')
      expect(typeof page.value).toBe('string')
    })

    it('should handle array values correctly', () => {
      mockRoute.params = {
        owner: ['array-owner'],
        repo: ['array-repo'],
        author: ['array-author']
      }
      mockRoute.query = {
        tab: ['array-tab'],
        page: ['array-page']
      }
      
      const { owner, repo, author, tab, page } = useRouteParams()
      
      expect(Array.isArray(owner.value)).toBe(true)
      expect(Array.isArray(repo.value)).toBe(true)
      expect(Array.isArray(author.value)).toBe(true)
      expect(Array.isArray(tab.value)).toBe(true)
      expect(Array.isArray(page.value)).toBe(true)
    })
  })
})

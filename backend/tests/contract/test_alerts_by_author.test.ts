import request from 'supertest';
import app from '../../src/app';

describe('GET /api/alerts/by-author', () => {
  describe('Contract Test - Response Schema', () => {
    it('should return aggregated alerts grouped by author with correct schema', async () => {
      const response = await request(app)
        .get('/api/alerts/by-author')
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      
      // Validate pagination structure
      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('totalPages');
      
      // Validate data array
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        const firstItem = response.body.data[0];
        
        // Validate author aggregation structure
        expect(firstItem).toHaveProperty('author');
        expect(firstItem).toHaveProperty('totalAlerts');
        expect(firstItem).toHaveProperty('severityCounts');
        expect(firstItem).toHaveProperty('typeCounts');
        expect(firstItem).toHaveProperty('repositories');
        expect(firstItem).toHaveProperty('lastActivityDate');
        
        // Validate severity counts structure
        expect(firstItem.severityCounts).toHaveProperty('high');
        expect(firstItem.severityCounts).toHaveProperty('middle');
        expect(firstItem.severityCounts).toHaveProperty('low');
        
        // Validate type counts structure
        expect(firstItem.typeCounts).toHaveProperty('Issue');
        expect(firstItem.typeCounts).toHaveProperty('Branch');
        expect(firstItem.typeCounts).toHaveProperty('Security');
        expect(firstItem.typeCounts).toHaveProperty('Test');
        expect(firstItem.typeCounts).toHaveProperty('Performance');
        expect(firstItem.typeCounts).toHaveProperty('Action');
        
        // Validate data types
        expect(typeof firstItem.author).toBe('string');
        expect(typeof firstItem.totalAlerts).toBe('number');
        expect(Array.isArray(firstItem.repositories)).toBe(true);
      }
    });

    it('should support query parameters for filtering and sorting', async () => {
      const response = await request(app)
        .get('/api/alerts/by-author')
        .query({
          owner: 'TeckVeho',
          repo: 'health-checker',
          sortBy: 'totalAlerts',
          sortOrder: 'desc',
          page: 1,
          limit: 10
        })
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle unknown authors correctly', async () => {
      const response = await request(app)
        .get('/api/alerts/by-author')
        .expect(200);

      // Check if "Unknown Author" is handled
      const unknownAuthor = response.body.data.find(
        (item: any) => item.author === 'Unknown Author'
      );
      
      if (unknownAuthor) {
        expect(unknownAuthor.totalAlerts).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate sorting parameters', async () => {
      const response = await request(app)
        .get('/api/alerts/by-author')
        .query({
          sortBy: 'author',
          sortOrder: 'asc'
        })
        .expect(200);

      if (response.body.data.length > 1) {
        // Check if results are sorted alphabetically
        const authors = response.body.data.map((item: any) => item.author);
        const sortedAuthors = [...authors].sort();
        expect(authors).toEqual(sortedAuthors);
      }
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/api/alerts/by-author')
        .query({
          sortBy: 'invalidField',
          page: -1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });
});
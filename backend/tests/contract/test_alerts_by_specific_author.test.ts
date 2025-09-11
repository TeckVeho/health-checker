import request from 'supertest';
import app from '../../src/app';

describe('GET /api/alerts/authors/:author', () => {
  describe('Contract Test - Response Schema', () => {
    it('should return alerts for a specific author with correct schema', async () => {
      const testAuthor = 'john-doe';
      const response = await request(app)
        .get(`/api/alerts/authors/${testAuthor}`)
        .expect(200);

      // Validate response structure
      expect(response.body).toHaveProperty('author');
      expect(response.body).toHaveProperty('alerts');
      expect(response.body.author).toBe(testAuthor);
      
      // Validate alerts array
      expect(Array.isArray(response.body.alerts)).toBe(true);
      
      if (response.body.alerts.length > 0) {
        const firstAlert = response.body.alerts[0];
        
        // Validate alert structure
        expect(firstAlert).toHaveProperty('id');
        expect(firstAlert).toHaveProperty('owner');
        expect(firstAlert).toHaveProperty('repo');
        expect(firstAlert).toHaveProperty('checkType');
        expect(firstAlert).toHaveProperty('title');
        expect(firstAlert).toHaveProperty('severity');
        expect(firstAlert).toHaveProperty('author');
        expect(firstAlert).toHaveProperty('detectCount');
        expect(firstAlert).toHaveProperty('lastDetectedAt');
        expect(firstAlert).toHaveProperty('createdAt');
        
        // Validate data types
        expect(typeof firstAlert.owner).toBe('string');
        expect(typeof firstAlert.repo).toBe('string');
        expect(['Issue', 'Branch', 'Security', 'Test', 'Performance', 'Action']).toContain(firstAlert.checkType);
        expect(['high', 'middle', 'low']).toContain(firstAlert.severity);
        expect(firstAlert.author).toBe(testAuthor);
      }
    });

    it('should support filtering by severity', async () => {
      const testAuthor = 'john-doe';
      const response = await request(app)
        .get(`/api/alerts/authors/${testAuthor}`)
        .query({ severity: 'high' })
        .expect(200);

      // All returned alerts should have high severity
      response.body.alerts.forEach((alert: any) => {
        expect(alert.severity).toBe('high');
      });
    });

    it('should support filtering by check type', async () => {
      const testAuthor = 'john-doe';
      const response = await request(app)
        .get(`/api/alerts/authors/${testAuthor}`)
        .query({ checkType: 'Issue' })
        .expect(200);

      // All returned alerts should be Issue type
      response.body.alerts.forEach((alert: any) => {
        expect(alert.checkType).toBe('Issue');
      });
    });

    it('should return 404 for non-existent author', async () => {
      const response = await request(app)
        .get('/api/alerts/authors/non-existent-user-xyz')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('not found');
    });

    it('should handle special characters in author name', async () => {
      const authorWithDash = 'user-with-dash';
      const response = await request(app)
        .get(`/api/alerts/authors/${encodeURIComponent(authorWithDash)}`)
        .expect((res) => {
          // Either 200 with data or 404 if not found
          expect([200, 404]).toContain(res.status);
        });

      if (response.status === 200) {
        expect(response.body.author).toBe(authorWithDash);
      }
    });

    it('should return empty alerts array for author with no alerts', async () => {
      const testAuthor = 'author-with-no-alerts';
      const response = await request(app)
        .get(`/api/alerts/authors/${testAuthor}`);

      if (response.status === 200) {
        expect(response.body.author).toBe(testAuthor);
        expect(response.body.alerts).toEqual([]);
      } else {
        expect(response.status).toBe(404);
      }
    });
  });
});
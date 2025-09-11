import request from 'supertest';
import app from '../../src/app';

describe('POST /api/alerts/backfill-authors', () => {
  describe('Contract Test - Response Schema', () => {
    it('should accept backfill request and return job status', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({})
        .expect(202);

      // Validate response structure
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('message');
      
      // Validate data types
      expect(typeof response.body.jobId).toBe('string');
      expect(['started', 'in_progress', 'completed', 'failed']).toContain(response.body.status);
      expect(response.body.message).toContain('started');
    });

    it('should accept optional parameters for targeted backfill', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({
          owner: 'TeckVeho',
          repo: 'health-checker',
          batchSize: 25
        })
        .expect(202);

      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('started');
      
      if (response.body.estimatedAlerts !== undefined) {
        expect(typeof response.body.estimatedAlerts).toBe('number');
        expect(response.body.estimatedAlerts).toBeGreaterThanOrEqual(0);
      }
    });

    it('should validate batch size constraints', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({
          batchSize: 150 // Exceeds maximum of 100
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('batch');
    });

    it('should reject invalid batch size', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({
          batchSize: 0 // Below minimum of 1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.message).toContain('batch');
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .expect(202);

      // Should use default values
      expect(response.body).toHaveProperty('jobId');
      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('started');
    });

    it('should return unique job ID for each request', async () => {
      const response1 = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({})
        .expect(202);

      const response2 = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({})
        .expect(202);

      // Job IDs should be unique
      expect(response1.body.jobId).not.toBe(response2.body.jobId);
    });

    it('should validate owner and repo if provided', async () => {
      const response = await request(app)
        .post('/api/alerts/backfill-authors')
        .send({
          owner: 'Valid-Owner_123',
          repo: 'valid-repo-name'
        })
        .expect(202);

      expect(response.body.status).toBe('started');
    });

    it('should handle concurrent backfill requests', async () => {
      const requests = [
        request(app).post('/api/alerts/backfill-authors').send({}),
        request(app).post('/api/alerts/backfill-authors').send({}),
        request(app).post('/api/alerts/backfill-authors').send({})
      ];

      const responses = await Promise.all(requests);
      
      // All should succeed with unique job IDs
      const jobIds = responses.map(r => r.body.jobId);
      const uniqueJobIds = new Set(jobIds);
      
      expect(uniqueJobIds.size).toBe(3);
      responses.forEach(response => {
        expect(response.status).toBe(202);
      });
    });
  });
});
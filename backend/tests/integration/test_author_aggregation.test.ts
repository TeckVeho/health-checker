import Alert from '../../src/domain/alert/alertModel';
import AlertService from '../../src/domain/alert/alertService';
import { setupTestDatabase, cleanupTestDatabase } from '../setup/testDatabase';

describe('Author Aggregation Integration', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up alerts table before each test
    await Alert.destroy({ where: {} });
  });

  describe('aggregateAlertsByAuthor', () => {
    it('should aggregate alerts correctly by author', async () => {
      // Create test data
      const testAlerts = [
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: 'Test alert 1',
          severity: 'high',
          author: 'john-doe',
          authorDisplayName: 'John Doe',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        },
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Branch',
          title: 'Test alert 2',
          severity: 'middle',
          author: 'john-doe',
          authorDisplayName: 'John Doe',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        },
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Security',
          title: 'Test alert 3',
          severity: 'high',
          author: 'jane-smith',
          authorDisplayName: 'Jane Smith',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        }
      ];

      await Alert.bulkCreate(testAlerts);

      const result = await AlertService.getAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'health-checker'
      });

      expect(result.data).toHaveLength(2);

      // Check john-doe aggregation
      const johnDoe = result.data.find(item => item.author === 'john-doe');
      expect(johnDoe).toMatchObject({
        author: 'john-doe',
        displayName: 'John Doe',
        totalAlerts: 2,
        severityCounts: {
          high: 1,
          middle: 1,
          low: 0
        },
        typeCounts: {
          Issue: 1,
          Branch: 1,
          Security: 0,
          Test: 0,
          Performance: 0,
          Action: 0
        },
        repositories: ['TeckVeho/health-checker']
      });

      // Check jane-smith aggregation
      const janeSmith = result.data.find(item => item.author === 'jane-smith');
      expect(janeSmith).toMatchObject({
        author: 'jane-smith',
        displayName: 'Jane Smith',
        totalAlerts: 1,
        severityCounts: {
          high: 1,
          middle: 0,
          low: 0
        },
        typeCounts: {
          Issue: 0,
          Branch: 0,
          Security: 1,
          Test: 0,
          Performance: 0,
          Action: 0
        }
      });
    });

    it('should handle unknown authors correctly', async () => {
      const testAlerts = [
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: 'Alert without author',
          severity: 'middle',
          author: null,
          authorDisplayName: null,
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        }
      ];

      await Alert.bulkCreate(testAlerts);

      const result = await AlertService.getAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'health-checker'
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        author: 'Unknown Author',
        displayName: null,
        totalAlerts: 1,
        severityCounts: {
          high: 0,
          middle: 1,
          low: 0
        }
      });
    });

    it('should sort by total alerts descending by default', async () => {
      const testAlerts = [
        // Author with 1 alert
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: 'Alert 1',
          severity: 'low',
          author: 'user-with-one',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        },
        // Author with 3 alerts
        ...Array(3).fill(null).map((_, i) => ({
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: `Alert ${i + 2}`,
          severity: 'high',
          author: 'user-with-three',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        }))
      ];

      await Alert.bulkCreate(testAlerts);

      const result = await AlertService.getAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'health-checker',
        sortBy: 'totalAlerts',
        sortOrder: 'desc'
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].author).toBe('user-with-three');
      expect(result.data[0].totalAlerts).toBe(3);
      expect(result.data[1].author).toBe('user-with-one');
      expect(result.data[1].totalAlerts).toBe(1);
    });

    it('should sort alphabetically when requested', async () => {
      const testAlerts = [
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: 'Alert Z',
          author: 'zebra-user',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        },
        {
          owner: 'TeckVeho',
          repo: 'health-checker',
          checkType: 'Issue',
          title: 'Alert A',
          author: 'alpha-user',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        }
      ];

      await Alert.bulkCreate(testAlerts);

      const result = await AlertService.getAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'health-checker',
        sortBy: 'author',
        sortOrder: 'asc'
      });

      expect(result.data).toHaveLength(2);
      expect(result.data[0].author).toBe('alpha-user');
      expect(result.data[1].author).toBe('zebra-user');
    });

    it('should handle pagination correctly', async () => {
      // Create 25 alerts with unique authors
      const testAlerts = Array(25).fill(null).map((_, i) => ({
        owner: 'TeckVeho',
        repo: 'health-checker',
        checkType: 'Issue',
        title: `Alert ${i}`,
        author: `user-${i.toString().padStart(2, '0')}`,
        detectCount: 1,
        isIgnored: false,
        manualResolved: false,
        systemResolved: false
      }));

      await Alert.bulkCreate(testAlerts);

      const result = await AlertService.getAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'health-checker',
        page: 2,
        limit: 10
      });

      expect(result.data).toHaveLength(10);
      expect(result.pagination).toMatchObject({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3
      });
    });

    it('should filter by repository correctly', async () => {
      const testAlerts = [
        {
          owner: 'TeckVeho',
          repo: 'project-a',
          checkType: 'Issue',
          title: 'Alert in project A',
          author: 'shared-user',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        },
        {
          owner: 'TeckVeho',
          repo: 'project-b',
          checkType: 'Issue',
          title: 'Alert in project B',
          author: 'shared-user',
          detectCount: 1,
          isIgnored: false,
          manualResolved: false,
          systemResolved: false
        }
      ];

      await Alert.bulkCreate(testAlerts);

      const resultA = await aggregateAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'project-a'
      });

      const resultB = await aggregateAlertsByAuthor({
        owner: 'TeckVeho',
        repo: 'project-b'
      });

      expect(resultA.data).toHaveLength(1);
      expect(resultA.data[0].repositories).toEqual(['TeckVeho/project-a']);

      expect(resultB.data).toHaveLength(1);
      expect(resultB.data[0].repositories).toEqual(['TeckVeho/project-b']);
    });
  });
});
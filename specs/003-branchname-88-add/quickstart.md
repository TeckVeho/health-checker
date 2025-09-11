# Quickstart: Display Alerts Grouped by Issue Author

## Overview

This guide demonstrates the new functionality for viewing health check alerts grouped by issue author, helping identify patterns in issue creation and understand responsibility distribution.

## Prerequisites

1. Health Checker application running locally
2. At least one repository configured with alerts
3. Some alerts with associated GitHub issues

## Step-by-Step Validation

### 1. Start the Application

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
yarn install
yarn dev
```

### 2. Navigate to Dashboard

Open browser to `http://localhost:3000`

### 3. View Author-Grouped Alerts

#### Test Scenario 1: Basic Author Grouping

1. **Action**: Click on the "Author" tab in the dashboard
2. **Expected Result**: 
   - New tab appears alongside "Severity" and "CheckType" tabs
   - Table displays authors with their alert counts
   - Columns show: Author, Total Alerts, High, Middle, Low, Issue, Branch, Security, Test, Performance

#### Test Scenario 2: Sort by Alert Count

1. **Action**: Click on "Total Alerts" column header
2. **Expected Result**:
   - Authors sorted by total alert count (descending by default)
   - Click again to sort ascending
   - Authors with most alerts appear at top

#### Test Scenario 3: Sort Alphabetically

1. **Action**: Click on "Author" column header
2. **Expected Result**:
   - Authors sorted alphabetically (A-Z)
   - Click again for reverse order (Z-A)
   - Makes it easy to find specific authors

#### Test Scenario 4: Handle Unknown Authors

1. **Setup**: Ensure some alerts exist without author information
2. **Action**: View the Author tab
3. **Expected Result**:
   - "Unknown Author" appears as a grouped entry
   - Shows count of alerts without author attribution
   - Treated as regular entry for sorting/filtering

### 4. API Testing

#### Get Grouped Alerts

```bash
# Get all alerts grouped by author
curl http://localhost:3001/api/alerts/by-author

# Filter by repository
curl "http://localhost:3001/api/alerts/by-author?owner=TeckVeho&repo=health-checker"

# Sort alphabetically
curl "http://localhost:3001/api/alerts/by-author?sortBy=author&sortOrder=asc"

# Pagination
curl "http://localhost:3001/api/alerts/by-author?page=2&limit=10"
```

**Expected Response Structure**:
```json
{
  "data": [
    {
      "author": "john-doe",
      "displayName": "John Doe",
      "totalAlerts": 42,
      "severityCounts": {
        "high": 5,
        "middle": 15,
        "low": 22
      },
      "typeCounts": {
        "Issue": 20,
        "Branch": 8,
        "Security": 3,
        "Test": 7,
        "Performance": 2,
        "Action": 2
      },
      "repositories": ["TeckVeho/health-checker"],
      "lastActivityDate": "2025-09-10T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

#### Get Specific Author's Alerts

```bash
# Get all alerts for a specific author
curl http://localhost:3001/api/alerts/authors/john-doe

# Filter by severity
curl "http://localhost:3001/api/alerts/authors/john-doe?severity=high"

# Filter by check type
curl "http://localhost:3001/api/alerts/authors/john-doe?checkType=Issue"
```

### 5. Backfill Author Data

For existing alerts without author information:

```bash
# Trigger backfill for all alerts
curl -X POST http://localhost:3001/api/alerts/backfill-authors

# Backfill specific repository
curl -X POST http://localhost:3001/api/alerts/backfill-authors \
  -H "Content-Type: application/json" \
  -d '{"owner": "TeckVeho", "repo": "health-checker"}'
```

**Expected Response**:
```json
{
  "jobId": "backfill-12345",
  "status": "started",
  "message": "Backfill job started successfully",
  "estimatedAlerts": 250
}
```

## Validation Checklist

- [ ] Author tab appears in dashboard
- [ ] Authors grouped with correct alert counts
- [ ] Severity breakdown (High/Middle/Low) accurate
- [ ] Type breakdown (Issue/Branch/Security/Test/Performance) accurate
- [ ] Sort by total alerts works (ascending/descending)
- [ ] Sort alphabetically by author works
- [ ] Unknown authors handled gracefully
- [ ] API endpoint `/api/alerts/by-author` returns grouped data
- [ ] API endpoint `/api/alerts/authors/{author}` returns specific author alerts
- [ ] Pagination works correctly
- [ ] Backfill endpoint triggers successfully
- [ ] Performance acceptable (<500ms for aggregation)

## Edge Cases to Test

### 1. Deleted GitHub User

1. Create alert for issue by user
2. Simulate deleted user (mock response)
3. Verify shows as "[Deleted User]"

### 2. Bot Accounts

1. Create alert from Dependabot issue
2. Verify bot indicator displayed
3. Confirm grouped separately if needed

### 3. Large Dataset

1. Generate 1000+ alerts across 100+ authors
2. Verify pagination works
3. Confirm response time <500ms

### 4. Empty State

1. Clear all alerts
2. Navigate to Author tab
3. Verify appropriate empty state message

## Troubleshooting

### Authors Not Showing

1. Check alerts have `issueNumber` populated
2. Verify GitHub API credentials configured
3. Run backfill job to populate missing data

### Performance Issues

1. Check database indexes created:
   - `idx_alerts_author`
   - `idx_alerts_author_severity`
2. Verify caching enabled
3. Check pagination limits

### Incorrect Counts

1. Verify no duplicate alerts
2. Check aggregation query logic
3. Clear cache and refresh

## Success Criteria

✅ Users can view alerts grouped by author  
✅ Sorting works by count and alphabetically  
✅ Unknown authors handled gracefully  
✅ Performance meets targets (<500ms)  
✅ API endpoints functioning correctly  
✅ Backfill process populates historical data
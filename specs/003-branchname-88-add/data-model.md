# Data Model: Display Alerts Grouped by Issue Author

**Feature**: Group health check alerts by issue author  
**Date**: 2025-09-10  
**Phase**: 1 - Design

## Entity Definitions

### 1. Alert (Extended)

**Description**: Health check alert with author information  
**Table**: `alerts`

#### Fields

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | UUID | Yes | Unique identifier | Auto-generated |
| owner | String | Yes | Repository owner | Max 255 chars |
| repo | String | Yes | Repository name | Max 255 chars |
| checkType | Enum | Yes | Type of check | One of: Issue, Branch, Security, Test, Performance, Action |
| title | String | Yes | Alert title | Max 500 chars |
| description | Text | No | Detailed description | No limit |
| severity | Enum | Yes | Alert severity | One of: high, middle, low |
| **author** | String | No | Issue author username | Max 255 chars, nullable |
| **authorDisplayName** | String | No | Author display name | Max 255 chars, nullable |
| issueNumber | Integer | No | GitHub issue number | Positive integer |
| issueUrl | String | No | Link to GitHub issue | Valid URL |
| filePath | String | No | File location | Valid path |
| lineNumber | Integer | No | Line in file | Positive integer |
| codeSnippet | Text | No | Code excerpt | No limit |
| branch | String | No | Git branch | Max 255 chars |
| detectCount | Integer | Yes | Detection count | Default 1, min 0 |
| lastDetectedAt | DateTime | Yes | Last detection time | ISO 8601 |
| isIgnored | Boolean | Yes | Ignore flag | Default false |
| manualResolved | Boolean | Yes | Manual resolution | Default false |
| systemResolved | Boolean | Yes | System resolution | Default false |
| createdAt | DateTime | Yes | Creation time | Auto-generated |
| updatedAt | DateTime | Yes | Update time | Auto-updated |

#### Indexes
- Primary: `id`
- Unique Composite: `(owner, repo, checkType, generatedKey)`
- Search: `author` (for efficient author-based queries)
- Filter: `(author, severity)` (for grouped queries)

#### Relationships
- None (self-contained entity)

### 2. AuthorAggregation (View Model)

**Description**: Aggregated view of alerts grouped by author  
**Type**: Computed/Virtual (not persisted)

#### Fields

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| author | String | Author username | Alert.author |
| displayName | String | Display name | Alert.authorDisplayName |
| totalAlerts | Integer | Total alert count | COUNT(*) |
| highSeverityCount | Integer | High severity alerts | COUNT(severity='high') |
| middleSeverityCount | Integer | Medium severity alerts | COUNT(severity='middle') |
| lowSeverityCount | Integer | Low severity alerts | COUNT(severity='low') |
| issueAlerts | Integer | Issue type alerts | COUNT(checkType='Issue') |
| branchAlerts | Integer | Branch type alerts | COUNT(checkType='Branch') |
| securityAlerts | Integer | Security type alerts | COUNT(checkType='Security') |
| testAlerts | Integer | Test type alerts | COUNT(checkType='Test') |
| performanceAlerts | Integer | Performance type alerts | COUNT(checkType='Performance') |
| actionAlerts | Integer | Action type alerts | COUNT(checkType='Action') |
| repositories | String[] | Affected repositories | DISTINCT(owner + '/' + repo) |
| lastActivityDate | DateTime | Most recent alert | MAX(lastDetectedAt) |

## State Transitions

### Alert Author Population

```
States: NO_AUTHOR → AUTHOR_FETCHED → AUTHOR_STORED

Transitions:
1. Alert created from issue → NO_AUTHOR
2. GitHub API fetch → AUTHOR_FETCHED
3. Database update → AUTHOR_STORED
```

### Author Data Lifecycle

```
1. Issue Processing:
   - Fetch issue from GitHub
   - Extract user.login as author
   - Extract user.name as authorDisplayName
   - Store with alert

2. Backfill Process:
   - Query alerts with null author
   - Batch fetch issues from GitHub
   - Update alerts with author data

3. Cache Invalidation:
   - Author aggregations cached for 5 minutes
   - Invalidate on new alert creation
   - Invalidate on alert update
```

## Data Integrity Rules

### Business Rules

1. **Author Consistency**
   - If issueNumber exists, attempt to populate author
   - Author can be null (for non-issue alerts or missing data)
   - Once set, author should not change unless issue is reassigned

2. **Unknown Author Handling**
   - Null author displayed as "Unknown Author"
   - Deleted GitHub users shown as "[Deleted User]"
   - Maintain last known username if available

3. **Bot Detection**
   - GitHub Apps identified by [bot] suffix
   - Dependabot identified by specific username
   - Group separately in aggregation if needed

### Validation Rules

1. **Author Field**
   - Must be valid GitHub username format (alphanumeric, hyphen, underscore)
   - Maximum 39 characters (GitHub limit)
   - Case-insensitive for aggregation

2. **Display Name**
   - Can contain any UTF-8 characters
   - Maximum 255 characters
   - Optional field (can be null)

3. **Aggregation Constraints**
   - Total alerts must equal sum of severity counts
   - Total alerts must equal sum of type counts
   - Repository list must be unique

## Migration Strategy

### Schema Migration

```sql
-- Add author columns to alerts table
ALTER TABLE alerts 
ADD COLUMN author VARCHAR(255),
ADD COLUMN author_display_name VARCHAR(255);

-- Add index for author queries
CREATE INDEX idx_alerts_author ON alerts(author);
CREATE INDEX idx_alerts_author_severity ON alerts(author, severity);
```

### Data Migration

```javascript
// Backfill existing alerts with author data
async function backfillAuthors() {
  // 1. Get alerts with issues but no author
  const alerts = await Alert.findAll({
    where: {
      issueNumber: { [Op.not]: null },
      author: null
    }
  });
  
  // 2. Group by repository for efficient API calls
  const grouped = groupBy(alerts, ['owner', 'repo']);
  
  // 3. Fetch and update in batches
  for (const group of grouped) {
    const issues = await fetchIssuesFromGitHub(group);
    await updateAlertsWithAuthors(group, issues);
  }
}
```

## Performance Considerations

### Query Optimization

1. **Indexed Queries**
   - All author-based queries use indexed columns
   - Aggregation queries use covering indexes
   - Avoid full table scans

2. **Caching Strategy**
   - Cache author aggregations for 5 minutes
   - Cache key: `author_aggregation_${owner}_${repo}`
   - Invalidate on write operations

3. **Pagination**
   - Limit author list to 100 per page
   - Sort options: total alerts (desc), alphabetical
   - Support offset-based pagination

### Scalability Targets

- Support 1,000 unique authors
- Handle 10,000 alerts efficiently
- Aggregation query < 500ms
- API response < 1 second
/**
 * Issue Cache Utility
 * 
 * Provides optimized issue data retrieval by using cached issue.md files
 * instead of repeated GitHub API calls.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Parse issue data from issue.md file
 * @param {string} issueFilePath - Path to issue.md file
 * @returns {Object} Parsed issue data
 */
function parseIssueFromMarkdown(issueFilePath) {
  try {
    const content = fs.readFileSync(issueFilePath, 'utf8');
    
    // Extract issue information from markdown
    const issueData = {
      title: '',
      body: '',
      labels: [],
      assignees: [],
      state: 'OPEN',
      createdAt: '',
      updatedAt: '',
      url: ''
    };

    // Parse title from first heading
    const titleMatch = content.match(/^# Issue #\d+: (.+)$/m);
    if (titleMatch) {
      issueData.title = titleMatch[1];
    }

    // Parse issue information section
    const infoSection = content.match(/## 📋 Issue情報[\s\S]*?(?=##|$)/);
    if (infoSection) {
      const info = infoSection[0];
      
      // Extract state
      const stateMatch = info.match(/- \*\*状態\*\*: (\w+)/);
      if (stateMatch) {
        issueData.state = stateMatch[1];
      }
      
      // Extract creation date
      const createdMatch = info.match(/- \*\*作成日時\*\*: (.+)/);
      if (createdMatch) {
        issueData.createdAt = createdMatch[1];
      }
      
      // Extract update date
      const updatedMatch = info.match(/- \*\*更新日時\*\*: (.+)/);
      if (updatedMatch) {
        issueData.updatedAt = updatedMatch[1];
      }
      
      // Extract URL
      const urlMatch = info.match(/- \*\*URL\*\*: (.+)/);
      if (urlMatch) {
        issueData.url = urlMatch[1];
      }
    }

    // Extract body from issue details section
    const detailsSection = content.match(/## 📝 Issue詳細([\s\S]*?)(?=## 🎯|$)/);
    if (detailsSection) {
      issueData.body = detailsSection[1].trim();
    }

    return issueData;
  } catch (error) {
    console.error(`Error parsing issue file ${issueFilePath}:`, error.message);
    return null;
  }
}

/**
 * Get issue data with caching strategy
 * @param {number} issueNumber - GitHub issue number
 * @returns {Object} Issue data object
 */
function getIssueData(issueNumber) {
  const issueFile = path.join(process.cwd(), `docs/issues/${issueNumber}/issue.md`);
  
  // First try: Use cached local file
  if (fs.existsSync(issueFile)) {
    console.log(`📋 Using cached issue data from: docs/issues/${issueNumber}/issue.md`);
    const cachedData = parseIssueFromMarkdown(issueFile);
    if (cachedData) {
      return cachedData;
    }
    console.log('⚠️  Failed to parse cached file, falling back to GitHub API...');
  }
  
  // Fallback: GitHub API call
  console.log(`🌐 Fetching issue #${issueNumber} from GitHub API...`);
  try {
    const result = execSync(
      `gh issue view ${issueNumber} --json title,body,labels,assignees,state,createdAt,updatedAt,url`,
      { encoding: 'utf8' }
    );
    return JSON.parse(result);
  } catch (error) {
    console.error(`Error fetching issue #${issueNumber} from GitHub:`, error.message);
    throw new Error(`Failed to retrieve issue #${issueNumber} data`);
  }
}

/**
 * Auto-detect the most recent issue number
 * @returns {number} Most recent issue number
 */
function detectLatestIssueNumber() {
  const issuesDir = path.join(process.cwd(), 'docs/issues');
  
  if (!fs.existsSync(issuesDir)) {
    throw new Error('No issues directory found. Please run /issue command first.');
  }
  
  const issueDirs = fs.readdirSync(issuesDir)
    .filter(dir => {
      const dirPath = path.join(issuesDir, dir);
      return fs.statSync(dirPath).isDirectory() && /^\d+$/.test(dir);
    })
    .map(dir => ({
      number: parseInt(dir),
      path: path.join(issuesDir, dir),
      mtime: fs.statSync(path.join(issuesDir, dir)).mtime
    }))
    .sort((a, b) => b.mtime - a.mtime);
  
  if (issueDirs.length === 0) {
    throw new Error('No issue directories found. Please run /issue command first.');
  }
  
  return issueDirs[0].number;
}

/**
 * Get issue data with auto-detection support
 * @param {number|undefined} issueNumber - Issue number (optional)
 * @returns {Object} Issue data with issue number
 */
function getIssueDataWithAutoDetection(issueNumber) {
  const actualIssueNumber = issueNumber || detectLatestIssueNumber();
  const issueData = getIssueData(actualIssueNumber);
  
  return {
    issueNumber: actualIssueNumber,
    ...issueData
  };
}

module.exports = {
  parseIssueFromMarkdown,
  getIssueData,
  detectLatestIssueNumber,
  getIssueDataWithAutoDetection
};

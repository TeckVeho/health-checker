#!/usr/bin/env node

/**
 * Issue Registration Script for Health Checker Project
 * Generates issue proposal and registers it to GitHub
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class IssueRegistrator {
  constructor() {
    this.issueGeneratorPath = path.join(__dirname, 'issue-generator.js');
    this.tempFile = path.join(__dirname, 'temp-issue.md');
  }

  async registerIssue(summary) {
    try {
      console.log('Generating issue proposal...');
      
      // Generate issue proposal
      const proposal = this.generateIssueProposal(summary);
      
      // Parse title and body from proposal
      const { title, body } = this.parseProposal(proposal);
      
      console.log(`Generated title: ${title}`);
      console.log('Creating GitHub issue...');
      
      // Create temporary file with body
      fs.writeFileSync(this.tempFile, body);
      
      // Create GitHub issue
      const command = `gh issue create --title "${title}" --body-file "${this.tempFile}" --label "frontend"`;
      const result = execSync(command, { encoding: 'utf8' });
      
      console.log('✅ Issue created successfully!');
      console.log(result);
      
      // Clean up temp file
      this.cleanup();
      
      return result;
      
    } catch (error) {
      console.error('❌ Error creating issue:', error.message);
      this.cleanup();
      process.exit(1);
    }
  }

  generateIssueProposal(summary) {
    try {
      const command = `node "${this.issueGeneratorPath}" "${summary}"`;
      return execSync(command, { encoding: 'utf8' });
    } catch (error) {
      throw new Error(`Failed to generate issue proposal: ${error.message}`);
    }
  }

  parseProposal(proposal) {
    const lines = proposal.split('\n');
    let title = '';
    let body = '';
    let inBody = false;
    
    for (const line of lines) {
      if (line.startsWith('**Title:**')) {
        title = line.replace('**Title:**', '').trim();
      } else if (line.startsWith('**Body:**')) {
        inBody = true;
        continue;
      } else if (line.startsWith('**Story Points:**')) {
        break;
      } else if (inBody) {
        body += line + '\n';
      }
    }
    
    if (!title) {
      throw new Error('Could not extract title from proposal');
    }
    
    return { title, body: body.trim() };
  }

  cleanup() {
    try {
      if (fs.existsSync(this.tempFile)) {
        fs.unlinkSync(this.tempFile);
      }
    } catch (error) {
      console.warn('Warning: Could not clean up temp file:', error.message);
    }
  }
}

// CLI usage
if (require.main === module) {
  const summary = process.argv[2];
  
  if (!summary) {
    console.error('Usage: node issue-regist.js "summary text"');
    process.exit(1);
  }
  
  const registrator = new IssueRegistrator();
  registrator.registerIssue(summary);
}

module.exports = IssueRegistrator;

// src/commands/checkIssues.ts

import 'dotenv/config';
import { checkIssues } from '../domain/alert/util/checkIssues';

async function main() {
  const args = process.argv.slice(2);
  const owner = args[0];
  const repo = args[1];

  if (!owner || !repo) {
    console.error('❌ Usage: npm run checkIssues -- <owner> <repo>');
    process.exit(1);
  }

  try {
    console.log(`🐙 Fetching open issues for ${owner}/${repo}...`);
    await checkIssues(owner, repo);
  } catch (error) {
    console.error('❌ Error fetching issues:', error);
    process.exit(1);
  }
}

main();

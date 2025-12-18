// src/commands/syncRepos.ts

import { EnvironmentConfig } from '../config/environment';
import RepoService from '../domain/repo/repoService';

async function main() {
  // Initialize environment variables first
  EnvironmentConfig.initialize();
  
  const args = process.argv.slice(2);
  const owner = args[0];

  if (!owner) {
    console.error('❌ Usage: yarn repo:sync <owner>');
    process.exit(1);
  }

  try {
    console.log(`🔄 Syncing repositories for owner: ${owner}`);
    const savedRepos = await RepoService.syncReposFromGithub(owner);
    savedRepos.forEach((repo) => {
      console.log(`- ${(repo as any).owner}/${(repo as any).name}`);
    });
  } catch (error) {
    console.error('❌ Error syncing repositories:', error);
    process.exit(1);
  }
}

main();

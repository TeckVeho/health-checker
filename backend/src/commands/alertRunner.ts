import 'dotenv/config';
import AlertService from '../domain/alert/alertService';

async function main() {
  const [checksArg, owner, repo] = process.argv.slice(2);

  if (!checksArg || !owner) {
    console.error('❌ Usage: yarn alert <checks> <owner> [repo]');
    console.error('   <checks>: branch | clone | gitleaks | branch|gitleaks');
    process.exit(1);
  }

  const checks = checksArg === 'all' ? undefined : checksArg.split('|');

  if (repo) {
    // Single repository
    try {
      const result = await AlertService.runAlert({ owner, repo, checks });
      console.log(`✅ Manual check done for ${owner}/${repo}`);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`❌ Error checking ${owner}/${repo}:`, error);
      process.exit(1);
    }
  } else {
    // All repositories
    try {
      const results = await AlertService.checkStoredRepos(owner, checks);
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error(`❌ Error checking stored repositories:`, error);
      process.exit(1);
    }
  }
}

main();

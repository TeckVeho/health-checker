import 'dotenv/config';
import AlertService from '../domain/alert/alertService';

async function main() {
  const [owner, repoOrDays, checksArg] = process.argv.slice(2);

  if (!owner) {
    console.error('❌ Usage: npm run alert -- <owner> [repo] [check1,check2,...]');
    process.exit(1);
  }

  if (repoOrDays && repoOrDays.match(/^\d+$/)) {
    // === stored: owner + activeWithinDays (optional)
    const activeWithinDays = Number(repoOrDays);
    try {
      const results = await AlertService.checkStoredRepos(owner, activeWithinDays);
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('❌ Error checking stored repositories:', error);
      process.exit(1);
    }
  } else if (repoOrDays) {
    // === manual: owner + repo (+ optional checks)
    const repo = repoOrDays;
    const checks = checksArg ? checksArg.split(',') : [];

    try {
      const result = await AlertService.runAlert({ owner, repo, checks });
      console.log(`✅ Manual check done for ${owner}/${repo}`);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(`❌ Error checking ${owner}/${repo}:`, error);
      process.exit(1);
    }
  } else {
    // === stored: only owner
    try {
      const results = await AlertService.checkStoredRepos(owner, undefined);
      console.log(JSON.stringify(results, null, 2));
    } catch (error) {
      console.error('❌ Error checking stored repositories:', error);
      process.exit(1);
    }
  }
}

main();

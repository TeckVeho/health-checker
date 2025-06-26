import 'dotenv/config';
import RepoService from '../domain/repo/repoService';

async function main() {
  const [owner, projectIdArg] = process.argv.slice(2);

  if (!owner) {
    console.error('❌ Usage: yarn project:setsp <owner> [projectId]');
    console.error('   <owner>: GitHub organization or user name');
    console.error('   [projectId]: optional GitHub classic project ID to target specifically');
    process.exit(1);
  }

  const projectId = projectIdArg ? Number(projectIdArg) : undefined;

  try {
    const result = await RepoService.syncReposFromGithubWithProjectId({ owner, projectId });
    console.log('✅ Data synchronization completed successfully.');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

main();

import 'dotenv/config';
import ProjectService from '../domain/project/projectService';

async function main() {
  const [owner, projectIdArg] = process.argv.slice(2);

  if (!owner) {
    console.error('❌ Usage: yarn project:setsp <owner> [projectId]');
    console.error('   <owner>: GitHub organization or user name');
    console.error('   [projectId]: optional GitHub project V2 number to target specifically');
    process.exit(1);
  }

  const projectId = projectIdArg ? Number(projectIdArg) : undefined;

  try {
    if (projectId) {
      // Add SP field to specific project
      const result = await ProjectService.addSpFieldToProject(owner, projectId);
      console.log(result.message);
      
      if (!result.success) {
        process.exit(1);
      }
    } else {
      // Add SP field to all projects
      const result = await ProjectService.addSpFieldToAllProjects(owner);
      console.log(result.message);
      
      if (result.results.length > 0) {
        console.log('\n📊 Detailed results:');
        result.results.forEach((projectResult: any) => {
          console.log(`  ${projectResult.success ? '✅' : '❌'} Project #${projectResult.projectNumber}: ${projectResult.projectTitle}`);
          console.log(`    ${projectResult.message}`);
        });
      }
      
      if (!result.success) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
    process.exit(1);
  }
}

main();

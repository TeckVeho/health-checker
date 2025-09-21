import app from './app';
import { EnvironmentConfig } from './config/environment';

// Initialize environment variables
EnvironmentConfig.initialize();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Log environment variable status
  const envStatus = EnvironmentConfig.getStatus();
  console.log('[Server] Environment status:', {
    initialized: envStatus.initialized,
    githubWorkspace: envStatus.githubWorkspace ? 'SET' : 'NOT SET',
    githubApiKey: envStatus.githubApiKey ? 'SET' : 'NOT SET',
    dbHost: envStatus.dbHost ? 'SET' : 'NOT SET'
  });
});

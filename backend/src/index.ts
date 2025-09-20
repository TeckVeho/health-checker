import app from './app';
import { EnvironmentConfig } from './config/environment';

// 環境変数の初期化
EnvironmentConfig.initialize();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // 環境変数の状態をログ出力
  const envStatus = EnvironmentConfig.getStatus();
  console.log('[Server] Environment status:', {
    initialized: envStatus.initialized,
    githubWorkspace: envStatus.githubWorkspace ? 'SET' : 'NOT SET',
    githubApiKey: envStatus.githubApiKey ? 'SET' : 'NOT SET',
    dbHost: envStatus.dbHost ? 'SET' : 'NOT SET'
  });
});

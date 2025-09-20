const dotenv = require('dotenv');
const path = require('path');

// 本番環境での.envファイルのパスを明示的に指定
const envPath = path.resolve(__dirname, '.env');
console.log(`[PM2] Loading environment from: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error(`[PM2] Error loading .env file:`, result.error);
} else {
  console.log(`[PM2] Environment loaded successfully from: ${envPath}`);
  console.log(`[PM2] GITHUB_LOCAL_WORKSPACE: ${process.env.GITHUB_LOCAL_WORKSPACE || 'NOT SET'}`);
}

module.exports = {
    apps: [
      {
        name: 'backend-prod',
        script: 'dist/src/index.js',
        cwd: './',
        interpreter: '/home/ec2-user/.nvm/versions/node/v22.15.0/bin/node',
        exec_mode: 'fork',
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  
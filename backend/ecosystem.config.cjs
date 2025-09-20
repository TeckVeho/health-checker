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
  console.log(`[PM2] GITHUB_API_KEY: ${process.env.GITHUB_API_KEY ? 'SET' : 'NOT SET'}`);
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
        env_file: './.env',  // 重要：.envファイルを直接指定
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT,
          TZ: process.env.TZ,
          DB_CLIENT: process.env.DB_CLIENT,
          DB_HOST: process.env.DB_HOST,
          DB_USER: process.env.DB_USER,
          DB_NAME: process.env.DB_NAME,
          DB_PASSWORD: process.env.DB_PASSWORD,
          DB_PORT: process.env.DB_PORT,
          JWT_SECRET: process.env.JWT_SECRET,
          OPENAI_API_KEY: process.env.OPENAI_API_KEY,
          OPENAI_MODEL: process.env.OPENAI_MODEL,
          GITHUB_API_KEY: process.env.GITHUB_API_KEY,
          GITHUB_LOCAL_WORKSPACE: process.env.GITHUB_LOCAL_WORKSPACE,
          NODE_INTERPRETER: process.env.NODE_INTERPRETER,
          CORS_ORIGINS: process.env.CORS_ORIGINS,
        },
      },
    ],
  };
  
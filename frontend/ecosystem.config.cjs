const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  apps: [
    {
      name: 'frontend-prod',
      script: '.output/server/index.mjs',
      cwd: './',
      interpreter: process.env.NODE_INTERPRETER || 'node',
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: process.env.NITRO_HOST,
        PORT: process.env.NITRO_PORT,
        API_BASE_URL: process.env.API_BASE_URL,
      },
    },
  ],
};
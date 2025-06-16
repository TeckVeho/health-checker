module.exports = {
  apps: [
    {
      name: 'frontend-prod',
      script: '.output/server/index.mjs',
      cwd: './',
      interpreter: '/home/ec2-user/.nvm/versions/node/v22.15.0/bin/node',
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
        PORT: 5001,
      },
    },
  ],
};
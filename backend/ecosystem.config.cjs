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
  
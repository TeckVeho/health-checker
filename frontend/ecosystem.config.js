module.exports = {
    apps: [
      {
        name: 'frontend-prod',
        script: 'node_modules/.bin/nuxt',
        args: 'start',
        cwd: './frontend',
        interpreter: '/home/ec2-user/.nvm/versions/node/v22.15.0/bin/node',
        exec_mode: 'fork',
        watch: false,
        env: {
          NODE_ENV: 'production',
        },
      },
    ],
  };
  
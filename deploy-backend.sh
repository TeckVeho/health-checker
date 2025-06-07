#!/bin/bash
set -e 
git pull
cd backend
yarn install --frozen-lockfile
yarn build
pm2 restart ecosystem.config.js

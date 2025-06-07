#!/bin/bash
set -e 
git pull
cd frontend
yarn install --frozen-lockfile
yarn build
pm2 restart ecosystem.config.cjs

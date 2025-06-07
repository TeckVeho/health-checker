#!/bin/bash

set -e  # エラーが出たら即終了

echo "  デプロイ開始"
git pull
# backend デプロイ
echo "  backend: yarn install & build"
cd backend
yarn install --frozen-lockfile
yarn build

echo "  backend: PM2 restart"
pm2 restart ecosystem.config.js

cd ..

# frontend デプロイ
echo "  frontend: yarn install & build"
cd frontend
yarn install --frozen-lockfile
yarn build

echo "  frontend: PM2 restart"
pm2 restart ecosystem.config.cjs

cd ..

echo "? デプロイ完了"

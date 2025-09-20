#!/usr/bin/env node

/**
 * 環境変数読み込みテストスクリプト
 * 本番環境での環境変数読み込み状況をテストする
 */

// backendディレクトリから実行するため、相対パスでdotenvを読み込み
const dotenv = require('../../../../node_modules/dotenv');
const path = require('path');
const fs = require('fs');

console.log('🔍 Environment Variable Loading Test');
console.log('=====================================');

// テスト1: PM2設定での環境変数読み込み
console.log('\n1. Testing PM2-style environment loading...');
const pm2EnvPath = path.resolve(process.cwd(), '.env');
console.log(`   Looking for .env at: ${pm2EnvPath}`);

try {
  fs.accessSync(pm2EnvPath, fs.constants.F_OK);
  console.log('   ✅ .env file found');
  
  const result = dotenv.config({ path: pm2EnvPath });
  if (result.error) {
    console.error('   ❌ Error loading .env:', result.error);
  } else {
    console.log('   ✅ .env loaded successfully');
  }
} catch (error) {
  console.error('   ❌ .env file not found:', error.message);
}

// テスト2: 重要な環境変数の確認
console.log('\n2. Checking critical environment variables...');
const criticalVars = [
  'GITHUB_API_KEY',
  'GITHUB_LOCAL_WORKSPACE',
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'DB_PASSWORD',
  'NODE_ENV'
];

criticalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('PASSWORD') || varName.includes('KEY') 
      ? `${value.substring(0, 8)}...` 
      : value;
    console.log(`   ✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`   ❌ ${varName}: NOT SET`);
  }
});

// テスト3: GITHUB_LOCAL_WORKSPACEの特別な検証
console.log('\n3. Testing GITHUB_LOCAL_WORKSPACE...');
const workspace = process.env.GITHUB_LOCAL_WORKSPACE;
if (workspace) {
  console.log(`   Workspace path: ${workspace}`);
  try {
    fs.accessSync(workspace, fs.constants.F_OK);
    console.log('   ✅ Directory exists');
    
    fs.accessSync(workspace, fs.constants.W_OK);
    console.log('   ✅ Directory is writable');
    
    const stats = fs.statSync(workspace);
    if (stats.isDirectory()) {
      console.log('   ✅ Is a directory');
    } else {
      console.log('   ❌ Not a directory');
    }
  } catch (error) {
    console.error('   ❌ Directory access error:', error.message);
  }
} else {
  console.log('   ❌ GITHUB_LOCAL_WORKSPACE not set');
}

// テスト4: 現在の作業ディレクトリとファイル構造
console.log('\n4. Current directory and file structure...');
console.log(`   Current working directory: ${process.cwd()}`);
console.log(`   __dirname: ${__dirname}`);

const files = fs.readdirSync(process.cwd());
console.log('   Files in current directory:');
files.forEach(file => {
  const stats = fs.statSync(path.join(process.cwd(), file));
  const type = stats.isDirectory() ? '[DIR]' : '[FILE]';
  console.log(`     ${type} ${file}`);
});

console.log('\n✅ Environment loading test completed');

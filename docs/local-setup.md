# Local Development Setup Guide

This guide describes how to set up the local development environment for the project.

---

## Project Structure

```
project-root/
├── backend/        # Express.js app
├── frontend/       # Nuxt 3 + Vue
├── docker-compose.yml  # MySQL & phpMyAdmin services
├── .env.localsample    # Sample env file for local setup
└── docs/           # Documentation directory (this file)
```
---

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-root
```

### 2. Copy `.env` File

```bash
cp .env.localsample .env
```

You can customize values as needed. Here's what's included by default:

```ini
PORT=3000
TZ=+09:00

DB_CLIENT=mysql
DB_HOST=localhost
DB_USER=admin
DB_NAME=health-checker
DB_PASSWORD=health-checker-123
DB_PORT=3306

JWT_SECRET=a1b2c3d4e5f6g7h6q7r8s9t0u1v2w8i9j0k1l2m3n4o5p3x4y5z6

OPENAI_API_KEY=sk-proj-...
GITHUB_API_KEY=ghp_...
GITHUB_LOCAL_WORKSPACE="C:/Users/yourname/Documents/github-workspace"
```
> ⚠️ **Important**: `GITHUB_LOCAL_WORKSPACE` should point to an **empty directory on your local machine**.
> This is where cloned GitHub repositories will be copied to.
> If the directory already contains files, they might be overwritten during sync.

### 3. Start MySQL & phpMyAdmin via Docker Compose

```bash
docker compose up -d
```

> This launches MySQL on port `3306` and phpMyAdmin on `http://localhost:3307` (configurable via `docker-compose.yml`).

### 4. Install Backend Dependencies

```bash
cd backend
yarn install
```

### 5. Install Frontend Dependencies

```bash
cd ../frontend
yarn install
```

### 6. Run Backend Server

```bash
cd ../backend
yarn dev
```

### 7. Run Frontend Server

```bash
cd ../frontend
yarn dev
```

Access your app via `http://localhost:3001` (or whichever port is defined).

##  Local Service Ports Summary
| Port | URL                                            | Service              |
| ---- | ---------------------------------------------- | -------------------- |
| 3000 | [http://localhost:3000/api](http://localhost:3000/api) | Backend (Express.js) |
| 3001 | [http://localhost:3001](http://localhost:3001) | Frontend (Nuxt 3)    |
| 3306 | -                                              | MySQL (DB service)   |
| 3307 | [http://localhost:3307](http://localhost:3307) | phpMyAdmin           |

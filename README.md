
# 🧭 Health Checker

This is a full-stack web application to monitor the health of GitHub repositories and raise alerts based on customizable conditions.


## Project Structure

```
project-root/
├── backend/        # Express.js app
├── frontend/       # Nuxt 3 + Vue
├── docker-compose.yml  # MySQL & phpMyAdmin services
├── .env.localsample    # Sample env file for local setup
└── docs/           # Documentation directory (this file)


## Overview

The project consists of:
- **Backend**: Express.js + TypeScript + Sequelize  
- **Frontend**: Nuxt 3 + Vue 3 + PrimeVue  
- **Database**: MySQL (via Docker Compose)  
- **Other Tools**: phpMyAdmin, GitHub API, OpenAI API
---

## Local Development Setup
For complete setup instructions, please refer to the guide in [`docs/local-setup.md`](./docs/local-setup.md).

---
## 🧩 Requirements

| Tool      | Version              |
|-----------|----------------------|
| Node.js   | `>=18`               |
| Yarn      | `>=1`             |
| Docker    | Required for DB setup |

> You can confirm versions with `node -v` and `yarn -v`.
---

## Backend Command Reference

| Command               | Description                                   |
|------------------------|-----------------------------------------------|
| `yarn dev`             | Run the backend server in development mode    |
| `yarn build`           | Compile TypeScript to JS (`dist/` output)     |
| `yarn start`           | Start the backend from `dist/index.js`        |
| `yarn db:migrate`      | Run all DB migrations                         |
| `yarn repo:sync <org>` | Sync GitHub repos for given org               |
| `yarn alert branch <org> <project>` | Run branch alert for given repo  |
| `yarn lint`            | Run ESLint                                    |
| `yarn format`          | Format all files in `src/`                    |
| `yarn test:unit`       | Run Jest unit tests                           |
| `yarn test:feature`    | Run Cucumber feature tests                    |

## Frontend Command Reference

| Command            | Description                                 |
|--------------------|---------------------------------------------|
| `yarn dev`         | Run the Nuxt 3 development server           |
| `yarn build`       | Build the frontend for production           |
| `yarn lint`        | Run ESLint on frontend source files         |
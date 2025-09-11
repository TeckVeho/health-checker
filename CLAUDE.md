# health-checker Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-09-10

## Active Technologies
- TypeScript + Node.js/Express (backend)
- Nuxt 3 + Vue 3 + PrimeVue (frontend)
- Sequelize ORM + MySQL/PostgreSQL (database)
- Octokit (GitHub API integration)
- Jest/Vitest (testing)

## Project Structure
```
backend/
├── src/
│   ├── domain/
│   │   └── alert/
│   │       ├── alertSchema.ts
│   │       ├── alertModel.ts
│   │       └── alertService.ts
│   └── api/
│       └── alertRoutes.ts
└── tests/

frontend/
├── src/
│   ├── components/
│   │   └── AuthorGroupedTable.vue
│   └── pages/
│       └── index.vue
└── tests/
```

## Commands
```bash
# Backend
npm run dev        # Start development server
npm test          # Run tests
npm run migrate   # Run database migrations

# Frontend
yarn dev          # Start development server
yarn test         # Run tests
yarn build        # Build for production
```

## Code Style
TypeScript: Follow existing patterns with strict mode
Vue: Composition API with script setup syntax
Testing: TDD with contract tests first

## Recent Changes
- 003-branchname-88-add: Added author-based alert grouping
- 001-backend-src-domain: Initial domain structure

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
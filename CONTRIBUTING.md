# Contributing

## Getting Started

```bash
git clone <repo-url>
cd qts
npm install
docker compose up -d postgres
cd backend
npx prisma generate && npx prisma migrate deploy && npx tsx ../scripts/import-problems.ts
cd ..
npm run dev:all
```

## Code Quality

All commits are checked by lint-staged:

```bash
# Manual checks
npm run build        # frontend + backend
npx eslint .         # lint
npm test -w backend  # backend tests
npm test -w frontend # frontend tests
```

## Structure

| Directory                 | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `frontend/src/modules/`   | Feature modules (chess, poker, math, quant, leetcode) |
| `frontend/src/shared/`    | Design system, contexts, common hooks                 |
| `frontend/src/shell/`     | App shell (layout, router, navbar)                    |
| `backend/src/routes/`     | Express route handlers                                |
| `backend/src/services/`   | External integrations (Judge0, email)                 |
| `backend/src/middleware/` | Auth, admin, error handling                           |
| `packages/shared/`        | Shared TypeScript types                               |
| `scripts/`                | Data import tools                                     |
| `data/`                   | Problem/seed data                                     |

## Pull Requests

- Keep PRs focused on a single concern
- Add tests for new backend routes
- Run the full check suite before requesting review
- Use conventional commits (`feat:`, `fix:`, `chore:`, `docs:`)

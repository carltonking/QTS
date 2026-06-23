# Quantitative Training Suite (QTS)

Multi-module training platform for chess puzzles, poker strategy, mental math, quant interview prep, and LeetCode-style coding problems.

## Architecture

```
qts/
├── frontend/          # React SPA (Vite + React Router)
│   └── src/
│       ├── modules/   # Feature modules (chess, poker, math, quant, leetcode)
│       ├── shared/    # Design system components, contexts, hooks
│       └── shell/     # Layout, router, app shell
├── backend/           # Express REST API (PostgreSQL + Prisma)
│   └── src/
│       ├── routes/    # Route handlers per domain
│       ├── services/  # Judge0 (code execution), email
│       ├── middleware/ # Auth (JWT), admin guard
│       ├── config/    # Swagger, OAuth strategies
│       └── lib/       # Prisma client, JSON schema validation
├── packages/shared/   # Shared TypeScript types (Difficulty, ProblemDetail, etc.)
├── scripts/           # Data import & problem generation tools
└── data/              # LeetCode training data & problem JSON files
```

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d postgres

# 2. Install dependencies
npm install

# 3. Generate Prisma client & run migrations
cd backend
npx prisma generate
npx prisma migrate deploy
cd ..

# 4. Seed the database with LeetCode problems
npm run seed -w backend

# 5. Start both frontend and backend
npm run dev:all
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- API docs: http://localhost:3001/api/docs
- Health: http://localhost:3001/health

## Full Stack (with code execution)

```bash
docker compose up -d          # Starts postgres + judge0
npm install
cd backend
npx prisma generate && npx prisma migrate deploy
cd ..
npm run seed -w backend
npm run dev:all
```

## Services

| Service           | Port | Purpose                |
| ----------------- | ---- | ---------------------- |
| Frontend (Vite)   | 5173 | React SPA              |
| Backend (Express) | 3001 | REST API               |
| PostgreSQL        | 5432 | Database               |
| Judge0            | 2358 | Code execution sandbox |

## Environment Variables

Copy `.env.example` to `backend/.env` and `frontend/.env`:

### Backend (`backend/.env`)

| Variable               | Default                 | Required | Description                                  |
| ---------------------- | ----------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`         | —                       | yes      | PostgreSQL connection string                 |
| `JWT_SECRET`           | —                       | yes      | JWT signing secret (use a long random value) |
| `JUDGE0_URL`           | `http://localhost:2358` | no       | Judge0 code execution API                    |
| `PORT`                 | `3001`                  | no       | Backend listen port                          |
| `CORS_ORIGIN`          | `http://localhost:5173` | no       | Allowed CORS origin                          |
| `GOOGLE_CLIENT_ID`     | —                       | no       | Google OAuth client ID                       |
| `GOOGLE_CLIENT_SECRET` | —                       | no       | Google OAuth client secret                   |
| `GITHUB_CLIENT_ID`     | —                       | no       | GitHub OAuth client ID                       |
| `GITHUB_CLIENT_SECRET` | —                       | no       | GitHub OAuth client secret                   |
| `SMTP_HOST`            | —                       | no       | SMTP server for password reset emails        |
| `SMTP_PORT`            | `587`                   | no       | SMTP port                                    |
| `SMTP_USER`            | —                       | no       | SMTP username                                |
| `SMTP_PASS`            | —                       | no       | SMTP password                                |
| `SMTP_FROM`            | `noreply@qts.app`       | no       | From address for emails                      |

### Frontend (`frontend/.env`)

| Variable       | Default                 | Description          |
| -------------- | ----------------------- | -------------------- |
| `VITE_API_URL` | `http://localhost:3001` | Backend API base URL |

## Modules

### Chess

- **Puzzles** — Live puzzles from Lichess with Glicko-2 rating system
- **Play AI** — Play against Stockfish (via WebAssembly) with configurable ELO
- Hints, move review, captured piece display

### Poker

- **Simulator** — Table-based decision spots with position, board texture, range feedback
- **Hand Ranking** — Track your hand through flop/turn/river with timed drills
- **Best Hand** — Compare multiple holdings on the same board
- **Odds** — Pot odds and break-even percentage drills
- Rank progression (Bronze → Elite) with timer pressure

### Math

- Configurable operations (ADD, SUB, MUL, DIV)
- Adjustable number ranges per operation
- Timed sessions with streak tracking
- Local leaderboard

### Quant

- 21 interview questions across Math, Probability, and Finance
- Adaptive difficulty based on self-assessed performance
- LaTeX rendering (KaTeX)
- Bookmarking and attempt history
- Persistent local study record

### Code (LeetCode)

- Problem browser with search, filter, pagination
- Code editor (Monaco) with Python, JS, Java, C++, TS, Go
- Judge0-powered code execution and submission
- NeetCode 150 roadmap view
- Submission history

## API

Full OpenAPI documentation is available at `/api/docs` when the backend is running.

### Key Endpoints

| Method | Path                        | Auth     | Description                   |
| ------ | --------------------------- | -------- | ----------------------------- |
| POST   | `/api/auth/register`        | —        | Create account                |
| POST   | `/api/auth/login`           | —        | Login                         |
| GET    | `/api/auth/me`              | Required | Current user                  |
| GET    | `/api/problems`             | —        | List problems                 |
| GET    | `/api/problems/:slug`       | —        | Problem detail                |
| POST   | `/api/submissions/run`      | Required | Run code against sample tests |
| POST   | `/api/submissions`          | Required | Submit solution               |
| GET    | `/api/leaderboard/chess`    | —        | Chess leaderboard             |
| GET    | `/api/leaderboard/math`     | —        | Math leaderboard              |
| GET    | `/api/leaderboard/poker`    | —        | Poker leaderboard             |
| GET    | `/api/leaderboard/quant`    | —        | Quant leaderboard             |
| POST   | `/api/auth/forgot-password` | —        | Request password reset        |
| POST   | `/api/auth/reset-password`  | —        | Reset password with token     |
| GET    | `/api/admin/stats`          | Admin    | Platform stats                |
| GET    | `/api/admin/users`          | Admin    | User management               |

## Scripts

| Script                    | Description                            |
| ------------------------- | -------------------------------------- |
| `npm run dev`             | Start frontend dev server              |
| `npm run dev:all`         | Start frontend + backend concurrently  |
| `npm run build`           | Build frontend + backend               |
| `npm run seed -w backend` | Import LeetCode problems into database |
| `npm test -w backend`     | Run backend tests                      |
| `npm test -w frontend`    | Run frontend tests                     |

## Testing

```bash
# Backend
npm test -w backend

# Frontend
npm test -w frontend

# Type check
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit

# Lint
npx eslint .
```

## Deployment

### Vercel (Frontend)

The frontend includes a `vercel.json` with SPA rewrites. Deploy by connecting the repo to Vercel and setting the build command to `cd frontend && npm run build`.

### Docker

```bash
docker compose up -d --build
```

The Dockerfile runs `prisma migrate deploy` on startup to apply pending migrations.

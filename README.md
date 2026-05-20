# F&B ERP

ERP custom cho doanh nghiệp F&B vừa và nhỏ (~20 nhân viên). Custom build, monolith, GitHub-first.

## Stack

- **Framework**: Next.js 16 (App Router), TypeScript strict
- **API**: tRPC v11 (type-safe end-to-end)
- **DB**: Prisma 6 + PostgreSQL 17 (Neon managed)
- **Auth**: Clerk
- **Authorization**: CASL (RBAC)
- **UI**: Tailwind CSS v4 + shadcn/ui patterns + Radix primitives
- **Tables**: TanStack Table + TanStack Query
- **Hosting**: Vercel + Neon Postgres

See `ARCHITECTURE.md` for the layered design and `docs/double-entry.md` for accounting rules.

## Getting started

```powershell
# 1. Install
npm install

# 2. Configure env
copy .env.example .env.local
# Fill in DATABASE_URL, DIRECT_URL, Clerk keys.

# 3. Generate Prisma client + apply migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Seed Chart of Accounts + demo users
npm run prisma:seed

# 5. Dev
npm run dev
```

App runs at <http://localhost:3000>. Health check: `/api/health`.

## Scripts

| Script            | Purpose                              |
| ----------------- | ------------------------------------ |
| `dev`             | Next.js dev server                   |
| `build`           | `prisma generate` + production build |
| `start`           | Run production build                 |
| `lint`            | ESLint                               |
| `typecheck`       | `tsc --noEmit`                       |
| `format`          | Prettier write                       |
| `prisma:generate` | Regenerate Prisma client             |
| `prisma:migrate`  | Create + apply a dev migration       |
| `prisma:deploy`   | Apply pending migrations (CI / prod) |
| `prisma:studio`   | Browse the DB                        |
| `prisma:seed`     | Run `prisma/seed.ts`                 |

## Deploy

See `DEPLOY.md` for the Vercel + Neon setup walk-through.

## Contributing

See `CONTRIBUTING.md` for branch / commit / PR conventions.

## Roadmap

| Tháng | Module                              |
| ----- | ----------------------------------- |
| 1     | Foundation (auth, RBAC, accounting) |
| 2     | Inventory + Purchasing              |
| 3     | Sales + POS + e-Invoice             |
| 4     | HR + Payroll                        |
| 5     | Accounting reports + Metabase       |
| 6     | Polish + Mobile                     |

# Architecture

## Layered overview

```
+---------------------------------------------------------------+
|  app/  (Next.js App Router)                                   |
|    (auth)/sign-in, sign-up           ← Clerk-hosted UI        |
|    (dashboard)/<module>/page.tsx     ← Server Components UI   |
|    api/trpc/[trpc]/route.ts          ← tRPC HTTP entry        |
|    api/webhooks/clerk/route.ts       ← Clerk → DB sync        |
|    api/health/route.ts                                        |
+---------------------------------------------------------------+
|  components/                                                  |
|    layout/  (sidebar, header)                                 |
|    ui/      (shadcn/ui)                                       |
|    data-table/                                                |
+---------------------------------------------------------------+
|  lib/                                                         |
|    abilities.ts  (CASL roles → abilities)                     |
|    trpc/         (client + provider)                          |
|    utils.ts      (cn, money helpers)                          |
+---------------------------------------------------------------+
|  server/                                                      |
|    db.ts             (PrismaClient singleton)                 |
|    auth.ts           (Clerk → AuthContext)                    |
|    trpc/                                                      |
|      context.ts      (per-request ctx: db + auth)             |
|      trpc.ts         (router + protectedProcedure)            |
|      routers/                                                 |
|        org, branch, user, account, journal                    |
+---------------------------------------------------------------+
|  prisma/schema.prisma  (source of truth for DB)               |
+---------------------------------------------------------------+
|  PostgreSQL 17 (Neon)                                         |
+---------------------------------------------------------------+
```

## Design principles

1. **Monolith first.** 20 users, 1–2 devs — microservices would burn the budget. Split modules only when a module is independently deployable AND we have evidence it needs to be.
2. **Type safety end-to-end.** Prisma types flow up through tRPC into the React tree; one `npm run typecheck` validates the whole stack.
3. **Multi-tenant by `organizationId`.** Every business table carries an `organization_id`. Every tRPC `protectedProcedure` injects it from `ctx.auth.organizationId` — resolvers MUST never accept it from input.
4. **Authorization at the edge of business logic.** Clerk handles authentication. CASL (`lib/abilities.ts`) handles authorization, evaluated inside resolvers, not inside the UI.
5. **Money is BIGINT cents.** Never `Float` or `Decimal` strings flowing through JSON. Convert at the UI boundary (`lib/utils.ts#formatCents`).
6. **Double-entry from day 1.** Business documents (Order, PurchaseOrder, Payroll) post `JournalEntry` records as side effects. Reports query journals, not the documents. See `docs/double-entry.md`.
7. **Explicit migrations, no schema drift.** Every change to `schema.prisma` ships with a Prisma migration in `prisma/migrations/`. Never `prisma db push` against shared envs.

## Folder conventions

- `app/` — only UI / route handlers. No business logic.
- `server/` — server-only logic. `import 'server-only'` at the top of every file. Anything imported into a Client Component will fail to build, which is the goal.
- `components/` — UI primitives. No data fetching.
- `lib/` — small pure helpers usable on either side of the network.

## Data flow (request)

1. Request hits `middleware.ts` → Clerk gates everything except public routes.
2. tRPC route handler (`app/api/trpc/[trpc]/route.ts`) builds `Context` via `createContext()`.
3. `getAuthContext()` resolves the Clerk `userId` to a row in `users` and the active `organization_id`.
4. `protectedProcedure` rejects unauthenticated or org-less callers.
5. Resolver runs against `ctx.db` (Prisma) scoped to `ctx.auth.organizationId`.
6. Result superjson-serialised back to the client; React Query caches it.

## Future modules

The folder skeleton under `app/(dashboard)/` carves space for inventory, purchasing, sales, hr, accounting, reports, settings. Routers in `server/trpc/routers/` will mirror these as we implement.

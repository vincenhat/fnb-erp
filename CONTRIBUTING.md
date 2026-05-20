# Contributing

## Workflow

1. Branch from `main`: `feat/<module>` for features, `fix/<short-id>` for bug fixes, `chore/<topic>` for tooling.
2. Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`.
3. Open a PR. CI runs `lint`, `typecheck`, `prisma validate`, `build`. All must be green.
4. Squash-merge to keep `main` linear.

## Code style

- Prettier 2-space, single quote, trailing commas.
- File naming: `kebab-case.ts` for files, `PascalCase` for React components, `camelCase` for functions / variables.
- DB naming: `snake_case` for tables / columns, mapped via Prisma `@@map` and `@map`.
- Money: BIGINT cents. Never raw `Float` / `string` decimals.

## DB changes

1. Edit `prisma/schema.prisma`.
2. `npm run prisma:migrate -- --name <descriptive_name>` — generates a migration locally.
3. Commit `prisma/schema.prisma` AND the migration file.
4. PR review must include a sanity check on the migration SQL.
5. CI doesn't run migrations; production is deployed via `npm run prisma:deploy` against Neon.

## Adding a tRPC router

1. New file `server/trpc/routers/<module>.ts`. Export a `router({...})`.
2. Use `protectedProcedure` for everything by default.
3. Always scope queries by `ctx.auth.organizationId` — the resolver must NEVER trust `organizationId` coming from input.
4. Mount in `server/trpc/routers/_app.ts`.
5. Use it from a Client Component via `trpc.<module>.<procedure>.useQuery(...)`.

## CASL abilities

Whenever a new resource gets a tRPC endpoint, also declare its ability in `lib/abilities.ts`. The role-to-ability map is the canonical source of truth — UI hides things based on it, but resolvers are the actual enforcement point.

## Testing

Tests are not yet wired in. When we add Vitest + Playwright (week 2), update this file.

## Local hooks

Husky + lint-staged run Prettier and ESLint on staged files at commit time. To skip in an emergency: `git commit --no-verify` — but make CI green afterwards.

# Deploy

Target: Vercel (frontend + API) + Neon Postgres.

## 1. Provision Neon Postgres

1. Sign in at <https://console.neon.tech>.
2. New Project → name `fnb-erp` → region `Singapore` (closest to VN).
3. From the connection-string panel, copy:
   - **Pooled** connection (used as `DATABASE_URL` at runtime).
   - **Direct** connection (used as `DIRECT_URL` for `prisma migrate`).
4. Optional: enable point-in-time recovery (paid plan).

## 2. Provision Clerk

1. <https://dashboard.clerk.com> → New Application → name `fnb-erp`.
2. Copy `Publishable key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.
3. Copy `Secret key` → `CLERK_SECRET_KEY`.
4. Webhooks → Add endpoint `https://<vercel-domain>/api/webhooks/clerk`.
   - Subscribe to `user.created`, `user.updated`, `user.deleted`.
   - Copy signing secret → `CLERK_WEBHOOK_SECRET`.

## 3. Push to GitHub

```powershell
git init
git add .
git commit -m "feat: initial scaffold"
gh repo create fnb-erp --public --source=. --remote=origin --push
```

## 4. Link to Vercel

```powershell
vercel link
# select scope, link to new project "fnb-erp"

# Add env vars (mirror .env.example)
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add CLERK_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_APP_URL production
# Repeat for `preview` and `development` if you want them populated.
```

## 5. Apply schema to Neon

```powershell
$env:DIRECT_URL = "<neon-direct-url>"
npx prisma migrate deploy
npm run prisma:seed   # optional
```

## 6. Deploy

```powershell
vercel deploy --prod
```

## 7. Smoke test

```powershell
$URL = "https://<your-project>.vercel.app"
curl "$URL/api/health"          # expect { status: "ok" }
curl "$URL/"                     # landing page
```

Sign in via Clerk-hosted UI at `/sign-in` and confirm the user lands on `/overview`.

## 8. Branch protection

In GitHub → repo → Settings → Branches → Add rule for `main`:

- Require pull request before merging
- Require status check `lint-typecheck-build` to pass
- Require linear history (squash-only)

## Rollback

Vercel keeps every deployment. To roll back:

```powershell
vercel rollback <deployment-url>
```

DB rollbacks: use Neon point-in-time recovery from the console (paid tier).

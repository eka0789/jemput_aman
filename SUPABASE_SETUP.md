# Supabase Setup

## 1. Apply the database migration

Run the migration in:

`supabase/migrations/202607240001_initial_jemput_aman.sql`

Recommended options:

- Supabase CLI: link the project, then run `supabase db push`.
- Supabase Dashboard: paste the migration into SQL Editor and run it once.

The migration creates the JemputAman tables, indexes, RLS configuration, and demo seed data.

## 2. Configure backend environment variables

Use server-only environment variables:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_YOUR_SERVER_KEY
```

`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are recognized
as development fallbacks, but the publishable key is subject to RLS and is not suitable
for the trusted JemputAman backend.

Never expose `SUPABASE_SECRET_KEY` in frontend code or commit it to Git.

## 3. Verify

Start the backend and open:

`GET /api/health`

Expected response:

```json
{
  "status": "HEALTHY",
  "database": "CONNECTED"
}
```

For Vercel, add the same server-only variables in Project Settings.

## 4. Vercel monorepo deployment setup

JemputAman uses a single-project Vercel deployment with serverless API functions and static frontend compilation:

- **Root Directory**: repository root (`.`)
- **Build Command**: `npm run build` (runs `npm --prefix frontend install && npm --prefix frontend run build`)
- **Output Directory**: `frontend/dist`
- **Serverless API Entrypoint**: `api/index.js` (routes `/api/*` to Express backend)

In Vercel Project Settings -> Environment Variables, set:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `JWT_SECRET`
  - `ADMIN_PASSWORD_HASH`
  - `FOUNDATION_PASSWORD_HASH`
  - `KIOSK_PIN_HASH`
  - `CRON_SECRET`
  - `DEFAULT_SCHOOL_ID`
  - `WHATSAPP_API_URL`
  - `WHATSAPP_API_TOKEN`

Do not set `VITE_API_BASE_URL` for this single-domain setup. The frontend uses `/api/v1`, which is routed to the Express serverless backend by Vercel rewrites.

After deployment, verify `GET /api/health` and confirm that `status` is `HEALTHY` and `database` is `CONNECTED`.


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

For Vercel, add the same server-only variables in Project Settings, and set the frontend
`VITE_API_BASE_URL` only when the API is deployed on a different domain.

## 4. Vercel monorepo setup

Create two Vercel projects from the same repository:

### Backend project

- Root Directory: `backend`
- Framework Preset: Other / Express
- Environment Variables:
  - `SUPABASE_URL`
  - `SUPABASE_SECRET_KEY`
  - `DEFAULT_SCHOOL_ID`
  - `WHATSAPP_API_URL`
  - `WHATSAPP_API_TOKEN`

### Frontend project

- Root Directory: `frontend`
- Framework Preset: Vite
- Environment Variable:
  - `VITE_API_BASE_URL=https://YOUR-BACKEND.vercel.app/api/v1`

Deploy the backend first so its URL can be added to the frontend environment.

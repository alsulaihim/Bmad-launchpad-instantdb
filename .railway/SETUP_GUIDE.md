# Railway Environment Variables - Quick Setup Guide

This folder contains pre-configured environment variables for all three Railway environments.

---

## Files

- `development.env` - Development environment variables
- `staging.env` - Staging environment variables  
- `production.env` - Production environment variables

---

## Quick Setup Steps

### 1. Create Supabase Projects

Go to https://supabase.com/dashboard/projects and create **3 separate projects**:

| Project Name | Purpose |
|-------------|---------|
| `bmad-dev` | Development |
| `bmad-staging` | Staging |
| `bmad-prod` | Production |

### 2. Get Supabase Credentials

For each project, go to **Project Settings → API**:

- **Project URL**: Copy from "Project URL" section
- **Anon Key**: Copy `anon` `public` key
- **Service Role Key**: Copy `service_role` `secret` key (⚠️ Keep this secret!)

### 3. Run Database Migrations

For each Supabase project:

1. Go to **SQL Editor**
2. Copy the contents of `/supabase/migrations/001_initial_schema.sql`
3. Paste and **Run** the SQL
4. Verify tables are created

### 4. Configure Railway Variables

For each Railway environment:

#### Development:
1. Open `.railway/development.env`
2. Replace `YOUR_DEV_SUPABASE_*` with values from your `bmad-dev` Supabase project
3. Update `NEXT_PUBLIC_APP_URL` after deployment (or leave as is)
4. Copy **all variables**
5. Go to Railway → Development → Variables → **Raw Editor**
6. Paste all variables
7. Save

#### Staging:
1. Open `.railway/staging.env`
2. Replace `YOUR_STAGING_SUPABASE_*` with values from your `bmad-staging` Supabase project
3. Update `NEXT_PUBLIC_APP_URL` after deployment (or leave as is)
4. Copy **all variables**
5. Go to Railway → Staging → Variables → **Raw Editor**
6. Paste all variables
7. Save

#### Production:
1. Open `.railway/production.env`
2. Replace `YOUR_PROD_SUPABASE_*` with values from your `bmad-prod` Supabase project
3. Update `NEXT_PUBLIC_APP_URL` with your domain or Railway domain
4. Copy **all variables**
5. Go to Railway → Production → Variables → **Raw Editor**
6. Paste all variables
7. Save

---

## Railway Raw Editor Format

Variables should be pasted exactly as shown in the `.env` files:

```
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://...
NEXT_PUBLIC_SUPABASE_URL=https://...
```

Railway will automatically parse them correctly.

---

## Important Notes

✅ **Encryption Keys**: Each environment has a unique encryption key. DO NOT reuse keys across environments.

✅ **Service Role Keys**: These are secret! Never expose them in client-side code.

✅ **App URLs**: Update these after Railway assigns domains, or use custom domains.

✅ **Git Safety**: The `.railway` folder is in `.gitignore`. Do NOT commit these files with real credentials.

✅ **Backup**: Store a secure backup of production variables (encrypted password manager).

---

## Verification Checklist

After setting up each environment:

- [ ] All variables are set in Railway
- [ ] Supabase database migrations ran successfully
- [ ] Railway deployment succeeded
- [ ] App URL is correct
- [ ] Health check passes
- [ ] Can create user account
- [ ] Can connect Anthropic API key
- [ ] Can create and use BMAD workflow

---

## Troubleshooting

**Error: "Cannot connect to Supabase"**
- Verify URL and keys are correct (no extra spaces)
- Check Supabase project is active

**Error: "Encryption failed"**
- Verify `ENCRYPTION_KEY` is exactly 32 characters (hex)
- Each environment must have unique key

**Build fails in Railway**
- Check logs in Railway dashboard
- Verify all variables are set
- Try manual redeploy

---

## Getting Supabase Keys (Screenshot Guide)

### Project URL
Supabase Dashboard → Project Settings → API → Project URL
```
https://xxxxxxxxxxxxx.supabase.co
```

### Anon Key (Public)
Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Service Role Key (Secret - Keep Safe!)
Supabase Dashboard → Project Settings → API → Project API keys → `service_role` `secret`
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Ready to deploy!** 🚀

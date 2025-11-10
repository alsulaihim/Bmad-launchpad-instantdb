# Supabase Branch Configuration

Branch configuration has been completed successfully!

## Current Setup

| Supabase Branch | Git Branch | Status | Use Case |
|----------------|------------|--------|----------|
| `development` | `development` | ✅ Active | Railway Development Environment |
| `main` (default) | `production` | ✅ Active | Railway Production Environment |

## Branch IDs

- **Development Branch ID**: `nzqgndedxyprowbqqgsi`
- **Main/Production Branch ID**: `nlxhueovycvmfwxsxrev`

## Getting Connection Details

### For Development Branch:

1. Go to: https://supabase.com/dashboard/project/nzqgndedxyprowbqqgsi
2. Navigate to: Settings → API
3. Copy the following:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`

### For Production Branch (Main):

1. Go to: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev
2. Navigate to: Settings → API
3. Copy the following:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`

## Database Details (Development)

- **Host**: `db.nzqgndedxyprowbqqgsi.supabase.co`
- **Port**: `5432`
- **User**: `postgres`
- **Database**: `postgres`
- **Status**: ACTIVE_HEALTHY

## Next Steps

1. **Run Database Migration** on both branches:
   - Copy content from `supabase/migrations/001_initial_schema.sql`
   - Go to SQL Editor in each Supabase project
   - Paste and execute the migration

2. **Update Railway Environment Variables**:
   - Replace the placeholder Supabase values in:
     - `.railway/development-vars.txt` (use development branch credentials)
     - `.railway/production-vars.txt` (use main/production branch credentials)

3. **Deploy to Railway**:
   - Create Railway project with two environments
   - Development → `development` Git branch → development Supabase branch
   - Production → `production` Git branch → main Supabase branch

## CLI Commands

```bash
# List all branches
supabase branches list

# Get development branch details
supabase branches get development

# Get main branch details
supabase branches get main

# Switch to development branch locally
supabase link --branch development

# Switch to main branch locally
supabase link --branch main
```

## Important Notes

- The `development` Supabase branch will auto-update when you push to the `development` Git branch
- The `main` Supabase branch will auto-update when you push to the `production` Git branch
- Each branch has its own database, API keys, and configuration
- Preview branches are included in your Supabase plan

# Supabase Setup Guide

Complete guide to setting up Supabase for the Vibe Coding Launchpad application.

---

## Step 1: Create Supabase Account & Project

### 1.1 Sign Up / Sign In

1. Go to https://app.supabase.com
2. Sign in with GitHub (recommended) or email

### 1.2 Create New Project

1. Click **"New Project"** button
2. Select your organization (or create one)
3. Fill in project details:
   ```
   Name: vibe-coding-launchpad
   Database Password: [Create a strong password - SAVE THIS!]
   Region: Choose closest to you (e.g., US East, Europe West)
   Pricing Plan: Free (perfect for development)
   ```
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning to complete ☕

---

## Step 2: Get Your API Credentials

### 2.1 Navigate to API Settings

1. Once project is ready, click **"Project Settings"** (⚙️ gear icon in left sidebar)
2. Click **"API"** in the settings submenu

### 2.2 Copy Your Credentials

You'll see three important values:

#### **Project URL**
```
https://xxxxxxxxxxxxx.supabase.co
```
✅ Copy this → Goes in `NEXT_PUBLIC_SUPABASE_URL`

#### **anon/public Key** (under "Project API keys")
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
✅ Copy this → Goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`

#### **service_role Key** (⚠️ Secret - click "Reveal" to see it)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```
✅ Copy this → Goes in `SUPABASE_SERVICE_ROLE_KEY`

### 2.3 Update .env.local

Open your `.env.local` file and paste the values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Run Database Migration

### 3.1 Open SQL Editor

1. In Supabase dashboard, click **"SQL Editor"** in left sidebar
2. Click **"+ New query"** button

### 3.2 Copy Migration SQL

1. Open the file: `supabase/migrations/001_initial_schema.sql`
2. Copy **ALL** the contents (entire file)

### 3.3 Execute Migration

1. Paste the SQL into the query editor
2. Click **"Run"** button (or press `Cmd/Ctrl + Enter`)
3. Wait for success message ✅

### 3.4 Verify Tables Created

1. Click **"Table Editor"** in left sidebar
2. You should see 5 new tables:
   - ✅ `profiles`
   - ✅ `projects`
   - ✅ `project_stages`
   - ✅ `claude_sessions`
   - ✅ `prd_documents`

---

## Step 4: Configure Authentication

### 4.1 Enable Email Authentication

1. Go to **"Authentication"** → **"Providers"** in left sidebar
2. **Email** provider should be enabled by default ✅
3. Configure settings:
   - ✅ Enable email confirmations (recommended)
   - ✅ Enable secure password requirements

### 4.2 Configure Email Templates (Optional)

1. Go to **"Authentication"** → **"Email Templates"**
2. Customize:
   - **Confirm signup** - Email verification template
   - **Magic Link** - Passwordless login email
   - **Reset Password** - Password reset email

### 4.3 Set Site URL

1. Go to **"Authentication"** → **"URL Configuration"**
2. Set **Site URL**:
   ```
   Development: http://localhost:3050
   Production: https://your-app.railway.app (update later)
   ```
3. Add **Redirect URLs**:
   ```
   http://localhost:3050/auth/callback
   https://your-app.railway.app/auth/callback (for production)
   ```

---

## Step 5: Test Your Connection

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Try Authentication

1. Open http://localhost:3050
2. Navigate to signup page
3. Create a test account
4. Check your email for verification link
5. Verify account and login

### 5.3 Check Database

1. Go to Supabase **"Table Editor"** → **"profiles"**
2. You should see your new user profile ✅

---

## Step 6: Set Up Row Level Security (RLS)

**Good news!** RLS policies are already included in the migration script. To verify:

1. Go to **"Authentication"** → **"Policies"**
2. Check each table has policies:
   - `profiles` - Users can view/update own profile
   - `projects` - Users can CRUD own projects
   - `project_stages` - Users can access own project stages
   - `claude_sessions` - Users can access own sessions
   - `prd_documents` - Users can access own documents

---

## Troubleshooting

### Issue: "Invalid API key"

**Solution:**
- Double-check you copied the full key (they're very long!)
- Make sure no extra spaces or line breaks
- Restart dev server after updating `.env.local`

### Issue: "Failed to fetch"

**Solution:**
- Verify Project URL is correct
- Check if project is still provisioning (wait a few minutes)
- Ensure no firewall blocking supabase.co

### Issue: Migration fails

**Solution:**
- Check if tables already exist (drop them first if needed)
- Run migration sections one at a time
- Check SQL Editor error messages for specific issues

### Issue: "User already registered"

**Solution:**
- Use a different email
- Or delete user from **"Authentication"** → **"Users"** table

### Issue: Email not received

**Solution:**
- Check spam folder
- In development, check Supabase **"Authentication"** → **"Users"** → Email verification status
- You can manually confirm users in the dashboard

---

## Database Schema Overview

Your database now has this structure:

```
┌─────────────────┐
│    profiles     │  ← User accounts (extends auth.users)
├─────────────────┤
│ id (FK)         │
│ email           │
│ full_name       │
│ anthropic_key   │  ← User's own Claude API key (encrypted)
└─────────────────┘
         │
         │ 1:N
         ↓
┌─────────────────┐
│    projects     │  ← User's projects
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ name            │
│ description     │
│ status          │  ← in_progress | completed | archived
│ current_stage   │  ← 1, 2, or 3
└─────────────────┘
         │
         │ 1:3
         ↓
┌──────────────────┐
│ project_stages   │  ← Stage data (1: Brainstorm, 2: Tech, 3: UX)
├──────────────────┤
│ id (PK)          │
│ project_id (FK)  │
│ stage_number     │  ← 1, 2, or 3
│ stage_name       │
│ responses (JSON) │  ← All Q&A responses stored here
│ summary          │
│ completed        │
└──────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────┐
│ claude_sessions  │  ← AI conversation history
├──────────────────┤
│ id (PK)          │
│ project_id (FK)  │
│ stage_number     │
│ messages (JSON)  │  ← Chat history
│ session_data     │
└──────────────────┘

┌──────────────────┐
│ prd_documents    │  ← Generated PRDs
├──────────────────┤
│ id (PK)          │
│ project_id (FK)  │
│ content          │  ← Full PRD markdown
│ format           │  ← markdown | pdf | html
│ version          │
└──────────────────┘
```

---

## Next Steps

After completing Supabase setup:

1. ✅ Get Anthropic API key from https://console.anthropic.com/settings/keys
2. ✅ Add it to `.env.local` as `ANTHROPIC_API_KEY`
3. ✅ Test the authentication flow
4. ✅ Ready to continue building the dashboard and workflow pages!

---

## Useful Supabase Dashboard Links

Quick access to key sections:

- **SQL Editor**: Write and execute SQL queries
- **Table Editor**: View and edit table data visually
- **Authentication**: Manage users and auth settings
- **Database**: View schema, relationships, and backups
- **API Docs**: Auto-generated API documentation for your database
- **Logs**: Monitor database queries and errors

---

## Security Best Practices

⚠️ **Important Reminders:**

1. **Never commit `.env.local`** (already in .gitignore ✅)
2. **service_role key is SECRET** - only use server-side
3. **anon key is safe** to use client-side (RLS protects data)
4. **Use RLS policies** for all data access (already implemented ✅)
5. **Rotate keys** if accidentally exposed
6. **Enable 2FA** on Supabase account

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase/supabase/issues

---

**Ready to code?** Once you've completed these steps, run `npm run dev` and start building! 🚀

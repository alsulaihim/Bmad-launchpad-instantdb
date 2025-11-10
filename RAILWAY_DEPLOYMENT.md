# Railway Deployment Guide

Complete guide for deploying the BMAD Framework Vibe Coding Launchpad to Railway with three environments.

---

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub  
3. **Supabase Projects**: Create 3 Supabase projects (dev, staging, prod)
4. **Railway CLI** (optional): `npm i -g @railway/cli`

---

## Quick Setup Guide

### Step 1: Create Three Branches

```bash
# Development branch
git checkout -b development
git push -u origin development

# Staging branch  
git checkout -b staging
git push -u origin staging

# Production branch (or use main/master)
git checkout -b production  
git push -u origin production
```

### Step 2: Create Railway Project with Three Environments

1. Go to [railway.app](https://railway.app) and create a new project
2. Connect your GitHub repository
3. Railway will create the first environment automatically

#### Configure Development Environment:
- Rename to "Development"
- Set branch to `development`
- Enable auto-deploy

#### Create Staging Environment:
- Click "+ New" → "Empty Service" → "GitHub Repo"
- Name it "Staging"
- Set branch to `staging`  
- Enable auto-deploy

#### Create Production Environment:
- Click "+ New" → "Empty Service" → "GitHub Repo"
- Name it "Production"
- Set branch to `production`
- Disable auto-deploy (manual only)

### Step 3: Environment Variables

Add these to each environment (Development, Staging, Production):

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-16>
```

### Step 4: Database Setup

Run the migration SQL in each Supabase project:
- Copy `supabase/migrations/001_initial_schema.sql`
- Paste in Supabase SQL Editor
- Run the migration

---

## Deployment Workflow

| Environment | Branch | Auto-Deploy | Use Case |
|------------|--------|-------------|----------|
| Development | `development` | ✅ Yes | Feature testing |
| Staging | `staging` | ✅ Yes | QA & pre-prod |
| Production | `production` | ❌ Manual | Live app |


# Quick Start Guide

Get up and running with Vibe Coding Launchpad in 5 minutes.

## Prerequisites

- Node.js 18.17+ installed
- Git installed
- Supabase account (free tier works)

## Step 1: Environment Setup

Create your environment file:

```bash
cp env.template .env.local
```

## Step 2: Configure Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project (or use existing)
3. Go to Project Settings → API
4. Copy your values into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3050](http://localhost:3050) in your browser.

## Current Branch Structure

```
✓ development (you are here) - Active development
✓ staging                     - Pre-production testing  
✓ production                  - Production-ready code
```

All changes should be pushed to `development` branch.

## Next Steps

1. **Explore the Landing Page** - Check light/dark mode toggle
2. **Review Project Structure** - See README.md for details
3. **Set Up Database** - Create tables in Supabase for workflow data
4. **Start Building** - Implement the BMAD workflow stages

## Common Commands

```bash
# Development server on port 3050
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Git Workflow

```bash
# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push to development
git push origin development

# When ready for staging
git checkout staging
git merge development
git push origin staging

# When ready for production
git checkout production
git merge staging
git push origin production
```

## Troubleshooting

### Port 3050 already in use

```bash
# Find process using port 3050
lsof -i :3050

# Kill the process
kill -9 <PID>
```

### Missing environment variables

Ensure `.env.local` exists and contains all required variables from `env.template`.

### Dependency issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Security Checklist

- [ ] Never commit `.env.local`
- [ ] Keep service role key secret
- [ ] Enable RLS policies in Supabase
- [ ] Review security headers in `middleware.ts`
- [ ] Validate user input on both client and server

## Resources

- 📖 [Full Documentation](README.md)
- 🤝 [Contributing Guidelines](CONTRIBUTING.md)
- 🔐 [Supabase Docs](https://supabase.com/docs)
- ⚛️ [Next.js Docs](https://nextjs.org/docs)

---

Happy coding! 🚀


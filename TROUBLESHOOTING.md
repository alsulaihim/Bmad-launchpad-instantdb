# Troubleshooting Guide

## Magic Link Not Received

### Common Causes & Solutions

#### 1. **Email Provider Not Configured in Supabase**

By default, Supabase uses a rate-limited email service for development. Production apps need a custom SMTP provider.

**Solution A: Check Spam/Junk Folder**
- Magic links from Supabase's default service often go to spam
- Check your spam/junk folder
- Mark as "Not Spam" if found

**Solution B: Use Development Mode (Recommended for Testing)**

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Find **Email** provider
3. Enable **"Confirm email"** - Toggle it OFF for development
4. This allows instant login without email verification

**Solution C: Configure Custom SMTP (Production)**

1. Go to Supabase Dashboard → **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Add your email provider:
   - **Gmail**: smtp.gmail.com (port 587)
   - **SendGrid**: smtp.sendgrid.net (port 587)
   - **Mailgun**: smtp.mailgun.org (port 587)
4. Enter credentials and save

#### 2. **Email Template Issues**

Check if email templates are configured:

1. Go to **Authentication** → **Email Templates**
2. Verify **Magic Link** template exists
3. Check the template has `{{ .ConfirmationURL }}` or `{{ .Token }}`

#### 3. **Redirect URL Not Configured**

1. Go to **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   ```
   http://localhost:3050/auth/callback
   ```
3. Make sure **Site URL** is set to:
   ```
   http://localhost:3050
   ```

#### 4. **Rate Limiting**

Supabase limits emails in development:
- Max 4 emails per hour per email address
- Wait 15 minutes and try again
- Or use a different email address

---

## Alternative: Use Password Authentication Instead

### Recommended for Development:

1. Go to signup page: http://localhost:3050/auth/signup
2. Use **email + password** (not magic link)
3. Create account
4. If email confirmation is required, you can:

**Option A: Disable Email Confirmation (Dev Only)**
1. Supabase Dashboard → **Authentication** → **Providers**
2. Toggle OFF **"Confirm email"**
3. Users can login immediately after signup

**Option B: Manually Confirm User**
1. Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Click the three dots menu
4. Select **"Confirm user"**

---

## Quick Fix: Disable Email Confirmation

**For Development Only:**

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project: `vibe-coding-launchpad`
3. Go to **Authentication** (left sidebar)
4. Click **Providers**
5. Find **Email** provider
6. **Disable** the toggle for **"Confirm email"**
7. Save changes

Now you can:
- Sign up without email verification
- Login immediately with email/password
- Skip the magic link entirely

---

## Testing the Fix

### Test Signup Flow:

```bash
# 1. Go to signup page
http://localhost:3050/auth/signup

# 2. Enter details:
Email: your@email.com
Password: test123456
Full Name: Test User

# 3. Click "Create Account"

# 4. If email confirmation is disabled:
✅ Redirected to /onboarding immediately

# 5. If email confirmation is enabled:
📧 Check email for verification link
```

### Test Login Flow:

```bash
# 1. Go to login page
http://localhost:3050/auth/login

# 2. Enter credentials
Email: your@email.com
Password: test123456

# 3. Click "Sign In"

# 4. Should redirect to:
✅ /dashboard (or /onboarding if no API key)
```

---

## Database Check

If signup succeeds but you can't see the user:

```sql
-- Run in Supabase SQL Editor

-- Check if user exists in auth.users
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Check if profile was created
SELECT id, email, full_name, created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 5;
```

If user exists in `auth.users` but not in `profiles`:
- The trigger might not have fired
- Manually insert a profile:

```sql
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE id = 'USER_ID_HERE';
```

---

## Common Errors & Solutions

### Error: "Invalid login credentials"
**Cause**: Wrong password or user doesn't exist
**Solution**:
- Try signup again with a new email
- Check caps lock is off
- Password must be 6+ characters

### Error: "Email not confirmed"
**Cause**: Email confirmation enabled but not verified
**Solution**:
- Disable email confirmation in Supabase
- Or manually confirm user in dashboard

### Error: "User already registered"
**Cause**: Email already used
**Solution**:
- Use different email
- Or delete existing user in Supabase dashboard
- Or use login instead of signup

### Redirected to login after signup
**Cause**: Session not created or email not confirmed
**Solution**:
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Disable email confirmation

---

## Recommended Setup for Development

1. **Disable Email Confirmation**
   - Supabase Dashboard → Auth → Providers → Email
   - Toggle OFF "Confirm email"

2. **Use Password Auth**
   - Don't use magic links for development
   - Use email + password signup/login

3. **Test with Multiple Emails**
   - Use different emails to avoid rate limits
   - Or use Gmail aliases: `yourname+test1@gmail.com`

4. **Monitor Logs**
   - Supabase Dashboard → Logs → Auth
   - Check for failed login attempts
   - See error messages

---

## Production Checklist

Before deploying:

- [ ] Configure custom SMTP provider
- [ ] Enable email confirmation
- [ ] Set production redirect URLs
- [ ] Update Site URL to production domain
- [ ] Test email delivery
- [ ] Test magic link functionality
- [ ] Set up email rate limits
- [ ] Configure email templates

---

## Still Having Issues?

### Check These:

1. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed requests

2. **Supabase Logs**
   - Dashboard → Logs → Auth
   - Look for authentication errors

3. **Environment Variables**
   - Verify `.env.local` has correct values
   - Restart dev server after changes: `npm run dev`

4. **Network Issues**
   - Check if you can reach Supabase: `ping nlxhueovycvmfwxsxrev.supabase.co`
   - Try different network/wifi

---

## Contact Support

If none of these work:

- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: Create issue with error details
- **Check Status**: https://status.supabase.com

---

**Quick Fix Summary**: Disable email confirmation in Supabase Auth settings, then use email/password signup instead of magic links for development.

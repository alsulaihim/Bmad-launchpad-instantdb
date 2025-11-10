# Supabase Email Troubleshooting Guide

## The Problem
You're not receiving magic link emails from Supabase in your Gmail account.

## Common Causes & Solutions

### 1. **Gmail Spam/Promotions Folder** (Most Common)
- Check your **Spam** folder
- Check your **Promotions** tab in Gmail
- Check **All Mail** folder
- Search for emails from: `noreply@mail.app.supabase.com`

### 2. **Supabase Email Rate Limits**
Supabase has rate limits on emails:
- **Production**: Up to 4 emails per hour per email address
- If you've been testing repeatedly, you may have hit the rate limit
- **Solution**: Wait 1 hour and try again

### 3. **Email Service Not Configured (Most Likely)**
By default, Supabase uses their SMTP service which may have deliverability issues.

**To check your email settings:**
1. Go to: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/settings/auth
2. Scroll to "SMTP Settings"
3. Check if you're using:
   - ✅ **Custom SMTP** (recommended for production)
   - ⚠️ **Supabase's default SMTP** (may have deliverability issues)

### 4. **Email Confirmation Requirement**
- By default, Supabase requires email confirmation
- This means users can't sign in until they click the confirmation link

**To check this setting:**
1. Go to: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/settings/auth
2. Find "Enable email confirmations"
3. Options:
   - **Enabled**: Users must confirm email before signing in
   - **Disabled**: Users can sign in immediately (not recommended for production)

## Recommended Solutions

### Option 1: Disable Email Confirmation (Quick Fix for Testing)
⚠️ **Only for testing/development**

1. Go to Auth Settings
2. Disable "Enable email confirmations"
3. Try signing up with a new account
4. You should be able to sign in immediately without confirmation

### Option 2: Set Up Custom SMTP (Recommended for Production)
Use a reliable email service:

**Using Gmail SMTP:**
1. Create an App Password in your Google Account:
   - Go to: https://myaccount.google.com/apppasswords
   - Generate app password for "Mail"
2. In Supabase Auth Settings → SMTP Settings:
   - Enable Custom SMTP
   - Sender email: your-email@gmail.com
   - Sender name: Your App Name
   - Host: smtp.gmail.com
   - Port: 587
   - Username: your-email@gmail.com
   - Password: [your app password]

**Using SendGrid (Free tier available):**
1. Sign up at: https://sendgrid.com/
2. Create an API key
3. In Supabase SMTP Settings:
   - Host: smtp.sendgrid.net
   - Port: 587
   - Username: apikey
   - Password: [your SendGrid API key]

**Using Resend (Modern, developer-friendly):**
1. Sign up at: https://resend.com/
2. Verify your domain
3. Get API key
4. Configure in Supabase

### Option 3: Check Email Templates
1. Go to: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/auth/templates
2. Check "Magic Link" template
3. Ensure the template is properly configured
4. Check that the {{ .ConfirmationURL }} variable is present

## Testing Magic Links

Once configured, test with:
1. Clear browser cache
2. Use incognito/private mode
3. Try with a different email address
4. Check all folders in Gmail (Spam, Promotions, All Mail)
5. Wait at least 1 hour if you've been testing repeatedly

## Quick Verification Commands

Check if emails are being sent (via Supabase logs):
1. Go to: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/logs/explorer
2. Filter for auth logs
3. Look for email sending events

## Current Project Info
- Project: vibe coding lunchpad
- Reference ID: nlxhueovycvmfwxsxrev
- Region: Oceania (Sydney)
- Auth Settings: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/settings/auth

# Setting Up Resend with GoDaddy Domain

This guide walks you through setting up a custom domain with Resend for production email delivery using GoDaddy as your DNS provider.

## Prerequisites

- A domain registered with GoDaddy (e.g., `yourdomain.com`)
- A Resend account (free tier available at https://resend.com)
- Access to your GoDaddy account

---

## Step 1: Get Your Resend API Key

1. Go to https://resend.com/api-keys
2. Click **"Create API Key"**
3. Give it a name like "Vibe Coding Launchpad Production"
4. Select permissions: **"Sending access"**
5. Click **"Add"**
6. **IMPORTANT**: Copy the API key immediately and save it securely (you won't see it again)

---

## Step 2: Add Your Domain to Resend

1. Go to https://resend.com/domains
2. Click **"Add Domain"**
3. Enter your domain name (e.g., `yourdomain.com`)
4. Click **"Add"**
5. Resend will show you DNS records to add - **keep this page open**

Resend will display a list of DNS records that need to be added. The exact records may vary, but typically include:
- **TXT records** (for domain verification and SPF)
- **MX records** (for bounce handling - optional but recommended)

**Important**: Copy each record exactly as shown in your Resend dashboard. The format and number of records may differ from this guide, so always use what Resend shows you.

---

## Step 3: Configure DNS in GoDaddy

### Access GoDaddy DNS Management

1. Log in to https://account.godaddy.com
2. Click **"My Products"** in the top menu
3. Find your domain in the list
4. Click the **three dots (⋮)** next to your domain
5. Select **"Manage DNS"**

### Add DNS Records

Now you'll add each record from Resend to GoDaddy. **Important**: Add the records exactly as shown in your Resend dashboard.

#### General Instructions for Each Record:

1. In GoDaddy DNS Management, scroll to the **"Records"** section
2. Click **"Add"** button
3. Select the record **Type** shown in Resend (TXT, MX, or CNAME)
4. Fill in the details:
   - **Name/Host**: Copy from Resend (use `@` if Resend shows your domain name or is blank)
   - **Value/Points to**: Copy exactly from Resend
   - **Priority**: (Only for MX records - copy from Resend if shown)
   - **TTL**: `1 Hour` (default is fine)
5. Click **"Save"**
6. **Repeat for each record** shown in Resend

#### Common Record Types:

**TXT Records** (most common):
- Used for domain verification and SPF
- Name is usually `@` or `_resend` or similar
- Value is a long string - copy it exactly

**MX Records** (optional but recommended):
- Used for bounce handling
- Name is usually `@`
- Value might be something like `feedback-smtp.us-east-1.amazonses.com`
- Priority is usually `10`

**CNAME Records** (if shown):
- Copy the name and value exactly as shown
- Name might include `_domainkey` or similar

**Example - What you might see in Resend:**

```
Type: TXT
Name: @
Value: resend-verification=abc123xyz...

Type: TXT
Name: @
Value: v=spf1 include:amazonses.com ~all

Type: MX
Name: @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
```

**Your records will look different - always copy from your Resend dashboard!**

---

## Step 4: Verify Domain in Resend

1. Go back to https://resend.com/domains
2. Find your domain in the list
3. Click **"Verify"** button
4. Resend will check the DNS records

**Note**: DNS propagation can take 5-60 minutes. If verification fails:
- Wait 15-30 minutes and try again
- Double-check all DNS records match exactly
- Check for typos in GoDaddy DNS records

Once verified, you'll see a **green checkmark** next to your domain.

---

## Step 5: Configure Supabase to Use Resend

Now that your domain is verified, configure Supabase to use Resend SMTP:

1. Go to your Supabase project: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/settings/auth
2. Scroll down to **"SMTP Settings"**
3. Click **"Enable Custom SMTP"**
4. Fill in:

```
Sender email: noreply@yourdomain.com
Sender name: Vibe Coding Launchpad
Host: smtp.resend.com
Port: 587
Username: resend
Password: [Your Resend API Key from Step 1]
```

5. Click **"Save"**

---

## Step 6: Test Email Delivery

1. Go to your production app (Railway deployment)
2. Try signing up with a new email address
3. Check that you receive the confirmation email
4. Try the Magic Link feature
5. Verify emails arrive quickly and don't go to spam

---

## Troubleshooting

### DNS Records Not Verifying

**Problem**: Resend says "DNS records not found"

**Solutions**:
- Wait 30-60 minutes for DNS propagation
- Use https://dnschecker.org to verify records are propagating globally
- Double-check you copied records exactly from Resend
- Make sure you're using `@` for the root domain (not `www`)

### Emails Still Not Arriving

**Problem**: Supabase configured but emails not sending

**Solutions**:
- Check Resend dashboard > Logs: https://resend.com/emails
- Verify API key has "Sending access" permission
- Check sender email matches your verified domain (`noreply@yourdomain.com`)
- Check Supabase logs for SMTP errors

### "Invalid SMTP Credentials" Error

**Problem**: Supabase shows SMTP authentication failed

**Solutions**:
- Username must be exactly `resend` (lowercase)
- Password must be your Resend API Key (starts with `re_`)
- Make sure you copied the full API key without extra spaces

### Emails Going to Spam

**Problem**: Emails arrive but in spam folder

**Solutions**:
- Verify all 3 DKIM records are present and verified
- Make sure SPF record is correct
- Add a DMARC record (optional but recommended):
  ```
  Type: TXT
  Name: _dmarc
  Value: v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
  ```

---

## Important Notes

1. **MX Records and Email Hosting**: Adding the MX record for Resend is only for bounce handling. If you use your domain for regular email (Gmail Workspace, Outlook, etc.), **do not remove your existing MX records** - add Resend's MX record with a lower priority (higher number like 20).

2. **Subdomain Option**: If you want to avoid conflicts, you can use a subdomain like `mail.yourdomain.com` instead of your root domain. Just enter `mail.yourdomain.com` in Resend and use `noreply@mail.yourdomain.com` as your sender.

3. **API Key Security**: Never commit your Resend API key to git. Store it only in Supabase SMTP settings.

4. **Rate Limits**: Resend free tier allows 100 emails/day, 3,000/month. Upgrade if you need more.

---

## Quick Reference

**Your Resend Dashboard**: https://resend.com/domains

**Your Supabase Auth Settings**: https://supabase.com/dashboard/project/nlxhueovycvmfwxsxrev/settings/auth

**GoDaddy DNS Management**: https://dcc.godaddy.com/control/yourdomain.com/dns (replace with your domain)

**Check DNS Propagation**: https://dnschecker.org

---

## Expected Timeline

- DNS changes in GoDaddy: **Immediate**
- DNS propagation globally: **5-60 minutes**
- Resend verification: **Immediate after propagation**
- First email delivery: **Within seconds**

Once verified, your production app will send reliable, fast emails that won't end up in spam!

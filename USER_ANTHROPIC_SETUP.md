# User Anthropic Account Setup Guide

This guide explains how users will connect their own Anthropic (Claude) accounts to use the BMAD Framework application.

---

## Architecture Overview

```
┌──────────────┐
│     User     │
└──────┬───────┘
       │
       │ 1. Signs up/logs in
       ↓
┌──────────────────────────┐
│  Your App (Supabase)     │
│  - Authentication        │
│  - Project Management    │
│  - BMAD Workflow UI      │
└──────────┬───────────────┘
           │
           │ 2. Enters their Anthropic API key
           │    (stored encrypted in database)
           ↓
┌──────────────────────────┐
│  Claude API (Anthropic)  │
│  - Uses USER's API key   │
│  - Charges USER's account│
│  - BMAD Agent execution  │
└──────────────────────────┘
```

---

## Why Users Need Their Own Anthropic Account

### Benefits:
1. **Direct Control**: Users manage their own Claude usage and costs
2. **Privacy**: Conversations stay within their Anthropic account
3. **Quota Management**: Users control their own API limits
4. **No Middleman**: Direct connection to Claude AI
5. **Transparency**: Users see exactly what they're paying for

### User Costs:
- **Claude Sonnet 4**: ~$3/million input tokens, ~$15/million output tokens
- **Typical BMAD Project**: $0.10 - $0.50 per complete 3-stage workflow
- **Free Tier**: Anthropic provides credits for new accounts

---

## User Journey

### Step 1: Sign Up on Your App
```
1. User visits your landing page
2. Clicks "Start Your Project"
3. Creates account via Supabase (email/password or magic link)
4. Email verification (optional)
```

### Step 2: Connect Anthropic Account

After signup, users are prompted:

```
┌─────────────────────────────────────────┐
│  Connect Your Anthropic Account         │
├─────────────────────────────────────────┤
│                                         │
│  To use the BMAD Framework and Claude   │
│  AI, you need an Anthropic API key.     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Enter your API key:             │   │
│  │ sk-ant-api03-xxxxx____________  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Test Connection]  [Save & Continue]  │
│                                         │
│  Don't have an API key?                │
│  → Get one from Anthropic Console       │
└─────────────────────────────────────────┘
```

### Step 3: Get Anthropic API Key

**Guide users to:**

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to **Settings** → **API Keys**
4. Click **"Create Key"**
5. Name it: `BMAD-Launchpad`
6. Copy the key (starts with `sk-ant-api03-...`)
7. Paste into your app

### Step 4: Start Using BMAD

Once API key is connected:
- Create projects
- Run Stage 1, 2, 3 workflows
- All Claude usage billed to their Anthropic account
- Can update/rotate API key anytime

---

## Implementation Details

### Database Storage (Already Implemented)

The `profiles` table has:
```sql
anthropic_api_key TEXT -- Encrypted storage for user's API key
```

### API Key Security

**Encryption Strategy:**
1. User enters API key in frontend
2. Sent over HTTPS to your API route
3. **Encrypted** before storing in database (use AES-256)
4. **Never** logged or exposed in responses
5. Decrypted only when making Claude API calls
6. Used server-side only (never sent to client)

### Validation Flow

```typescript
// When user enters API key:
1. Validate format (starts with sk-ant-api03-)
2. Test connection to Anthropic API
3. Check if key is valid and active
4. Encrypt and store in database
5. Show success message
```

### Usage Flow

```typescript
// When user starts a BMAD workflow:
1. Retrieve encrypted API key from database
2. Decrypt in memory (server-side)
3. Create Anthropic client with user's key
4. Run BMAD agent conversation
5. Stream responses back to user
6. Save conversation to database
```

---

## User-Facing Documentation

### What to Tell Users

**In your app's help section:**

> ### Why do I need an Anthropic API key?
>
> This app uses Claude AI (by Anthropic) to power the BMAD Framework's intelligent agents. To use Claude:
>
> 1. You need your own Anthropic account
> 2. Create an API key from their console
> 3. Connect it to this app
>
> **Benefits:**
> - You control your AI usage
> - Pay only for what you use
> - Your conversations are private
> - No subscription fees to this app
>
> **Costs:**
> Most BMAD projects cost $0.10 - $0.50 in Claude API usage.

### FAQ for Users

**Q: Do I have to pay for Claude?**
A: Yes, but it's pay-as-you-go. A complete BMAD project costs ~$0.10-$0.50.

**Q: Is my API key safe?**
A: Yes, we encrypt it and only use it server-side to call Claude on your behalf.

**Q: Can I change my API key?**
A: Yes, anytime in Settings → Anthropic Connection.

**Q: What if I run out of credits?**
A: You'll see an error. Add credits to your Anthropic account and try again.

**Q: Do you see my conversations?**
A: We store conversation history in our database so you can review past sessions, but we never share your data.

---

## Code Changes Required

### 1. Remove App-Level API Key Requirement

**Update `.env.example`:**
```env
# Remove this line:
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Or mark it optional:
ANTHROPIC_API_KEY=optional_fallback_key_for_testing
```

### 2. Update Claude Service

**Modify `lib/services/claude.service.ts`:**
```typescript
export function createClaudeClient(apiKey: string): Anthropic {
  if (!apiKey) {
    throw new Error("User API key is required. Please connect your Anthropic account.");
  }

  return new Anthropic({
    apiKey: apiKey, // Always use user's key
  });
}
```

### 3. Add API Key Encryption

**Create `lib/encryption.ts`:**
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encrypted: string): string {
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

### 4. Create API Key Setup Page

**Create `app/settings/api-key/page.tsx`:**
- Form to enter/update Anthropic API key
- Validation: Test connection before saving
- Encrypted storage in database
- Success/error feedback

### 5. Add Onboarding Flow

**Create `app/onboarding/page.tsx`:**
- Welcome screen after signup
- "Connect Anthropic Account" step
- Link to Anthropic console
- Instructions with screenshots
- Can't proceed without valid API key

### 6. Update Dashboard

**Modify `app/dashboard/page.tsx`:**
- Check if user has connected API key
- Show warning banner if not connected
- Disable "Create Project" until key is set
- Link to API key setup

---

## Environment Variables Needed

### Add to `.env.example`:
```env
# Encryption key for storing user API keys (32 bytes hex)
ENCRYPTION_KEY=generate_with_openssl_rand_hex_32
```

### Generate encryption key:
```bash
openssl rand -hex 32
```

---

## User Experience Flow

### First Time User:
```
1. Sign up → Email verification
2. Redirected to /onboarding
3. Prompted to connect Anthropic account
4. Follow guide to get API key from Anthropic
5. Enter and test API key
6. Redirected to dashboard
7. Create first project
8. Start BMAD workflow
```

### Returning User:
```
1. Log in
2. Dashboard shows projects
3. Click "New Project"
4. BMAD workflow uses their stored API key
5. Everything works seamlessly
```

### API Key Management:
```
Settings → Anthropic Connection
- Current status: ✓ Connected
- Key: sk-ant-api03-***************
- [Test Connection] [Update Key] [Remove]
- Usage stats (if available from Anthropic)
```

---

## Migration for Existing Users

If you already have users (later):

1. Send email announcing change
2. Add banner: "Action Required: Connect Anthropic Account"
3. Existing projects read-only until key connected
4. One-time setup wizard

---

## Alternative: Anthropic OAuth (Future)

**Note:** Anthropic doesn't currently offer OAuth for user accounts. If they add it in the future, you could:

1. Implement "Connect with Anthropic" button
2. OAuth flow (like "Login with Google")
3. Automatic API key retrieval
4. Better UX, no manual key entry

**For now, manual API key entry is the only option.**

---

## Summary

✅ **Users bring their own Anthropic API key**
✅ **Your app has NO API costs**
✅ **Users control their usage and billing**
✅ **More transparent and scalable**
✅ **Secure encrypted storage**
✅ **Better privacy model**

This is the **recommended approach** for SaaS applications using Claude AI.

---

## Next Steps

Want me to implement:
1. API key onboarding flow?
2. Encryption utilities?
3. Settings page for API key management?
4. User guide page with Anthropic setup instructions?

Let me know and I'll build it!

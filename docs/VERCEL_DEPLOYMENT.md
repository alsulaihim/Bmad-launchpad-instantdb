# Vercel Deployment Guide

This project is designed to be deployed on Vercel with a multi-environment strategy.

## Environments

We use three distinct environments to ensure quality and stability:

### 1. Development
- **Branch**: `development`
- **Purpose**: Integration testing of new features.
- **URL**: `https://dev.your-app.vercel.app` (example)
- **Database**: InstantDB Development App

### 2. Staging
- **Branch**: `staging`
- **Purpose**: Pre-production validation and QA.
- **URL**: `https://staging.your-app.vercel.app` (example)
- **Database**: InstantDB Staging App (separate App ID)

### 3. Production (Live)
- **Branch**: `live`
- **Purpose**: End-user traffic.
- **URL**: `https://your-app.com`
- **Database**: InstantDB Production App (separate App ID)

## Configuration Steps

1. **Create Vercel Project**
   - Import the repository from GitHub.
   - Select Next.js framework preset.

2. **Configure Environment Variables**
   
   Go to **Settings > Environment Variables** and add the following for each environment (scope them to specific environments):

   | Variable | Description | Scopes |
   |----------|-------------|--------|
   | `NEXT_PUBLIC_INSTANTDB_APP_ID` | Unique App ID for the environment's InstantDB | All (Different values) |
   | `INSTANTDB_ADMIN_TOKEN` | Admin token for server-side operations | All (Different values) |
   | `NEXT_PUBLIC_APP_URL` | The base URL of the deployment | All (Different values) |
   | `ENCRYPTION_KEY` | 32-char string for data encryption | All (Different values) |

3. **Configure Git Branches**
   - In **Settings > Git**, connect the production branch to `live`.
   - Vercel Preview deployments will be created for Pull Requests.
   - To set up `development` and `staging` as persistent environments, you can use Vercel's "Custom Domains" feature mapped to specific Git branches, or simply treat `development` branch deploys as Preview deployments that act as your dev environment.

## CI/CD Pipeline

Deployments are automatic:
- Pushing to `development` triggers a Development build.
- Pushing to `staging` triggers a Staging build.
- Pushing to `live` triggers a Production build.

## InstantDB Setup for Environments

1. Create 3 separate apps in InstantDB dashboard:
   - `vibe-coding-dev`
   - `vibe-coding-staging`
   - `vibe-coding-prod`
2. Copy the App ID and Admin Token for each into the respective Vercel environment variables.
3. Apply schema rules to all environments (you can use the `lib/instantdb/schema.ts` as reference).

## Troubleshooting

- **Build Fails**: Check the Build Logs in Vercel. Common issues include missing env vars or linting errors.
- **Auth Fails**: Verify `NEXT_PUBLIC_INSTANTDB_APP_ID` matches the environment.
- **API Errors**: Check `INSTANTDB_ADMIN_TOKEN` is correct and has permission.


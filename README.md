# Vibe Coding Launchpad

A structured Next.js application implementing the BMAD (Brainstorm, Model, Architect, Design) framework for transforming ideas into production-ready code specifications.

## 🎯 Overview

Vibe Coding Launchpad guides users through a comprehensive three-stage workflow:

1. **Brainstorming & Requirements** - Define project vision and core features
2. **Tech Stack & Architecture** - Select technologies and design system architecture
3. **UI/UX Requirements** - Craft interface specifications and interaction flows

At completion, users receive a comprehensive Product Requirements Document (PRD) and AI-optimized prompts for development.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4 with Shadcn/ui components
- **Database**: InstantDB (Real-time & Auth)
- **Theme**: next-themes for light/dark mode (system preference default)
- **Icons**: Lucide React
- **Deployment**: Vercel (Development, Staging, Production)

## 📋 Prerequisites

- Node.js 18.17 or higher
- npm or yarn package manager
- InstantDB account (for database and auth features)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vibe-coding-launchpad
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Copy the example environment file and fill in your InstantDB credentials:

```bash
cp env.template .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_INSTANTDB_APP_ID=your_instantdb_app_id
INSTANTDB_ADMIN_TOKEN=your_instantdb_admin_token
NEXT_PUBLIC_APP_URL=http://localhost:3050
```

**⚠️ Security Note**: Never commit `.env.local` to version control. The admin token should only be used server-side.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3050](http://localhost:3050) in your browser.

## 🏗️ Project Structure

```
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with theme provider
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles and CSS variables
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   │   └── button.tsx    # Button component
│   ├── theme-provider.tsx # Theme context provider
│   └── theme-toggle.tsx   # Theme switcher component
├── lib/                   # Utility libraries
│   ├── instantdb/        # InstantDB client configuration
│   │   ├── client.ts     # Client-side InstantDB instance
│   │   ├── admin.ts      # Server-side InstantDB admin instance
│   │   └── schema.ts     # Database schema
│   ├── logger.ts         # Centralized logging utility
│   └── utils.ts          # Helper functions
├── middleware.ts          # Security headers and request handling
├── next.config.ts         # Next.js configuration
└── vercel.json            # Vercel deployment configuration
```

## 🔒 Security Features

This project implements OWASP ASVS security controls:

- **Security Headers**: CSP, X-Frame-Options, HSTS (production), etc.
- **Environment Variable Validation**: Runtime checks for required config
- **Sensitive Data Redaction**: Automatic PII/secret filtering in logs
- **InstantDB Permissions**: Rules-based access control (to be configured in InstantDB dashboard)
- **TypeScript Strict Mode**: Type safety and compile-time error checking

## 📝 Development Workflow

### Branch Strategy

- `development` - Active development branch (default)
- `staging` - Pre-production testing
- `live` - Production-ready code

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user authentication flow
fix: resolve theme toggle hydration issue
docs: update README with setup instructions
chore: update dependencies
```

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes

## 🧪 Testing

```bash
# Run linter
npm run lint

# Type checking
npx tsc --noEmit
```

## ship Deployment

### Vercel Deployment

This project is configured for Vercel deployment with three environments:

1. **Development** (from `development` branch)
2. **Staging** (from `staging` branch)
3. **Production** (from `live` branch)

### Environment Variables (Vercel)

Set these in your Vercel project settings for each environment:

- `NEXT_PUBLIC_INSTANTDB_APP_ID`
- `INSTANTDB_ADMIN_TOKEN` (Server-side only)
- `NEXT_PUBLIC_APP_URL` (Your Vercel deployment URL)
- `ENCRYPTION_KEY` (32-char string for sensitive data encryption)

## 🎨 Customization

### Theme Colors

Edit CSS variables in `app/globals.css` to customize the color scheme:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  /* ... more variables */
}
```

### Adding Shadcn/ui Components

```bash
npx shadcn-ui@latest add <component-name>
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Shadcn/ui](https://ui.shadcn.com)
- [InstantDB](https://instantdb.com/docs)

## 🐛 Known Issues

None at this time.

## 🤝 Contributing

1. Create a feature branch from `development`
2. Make your changes following the code style
3. Test thoroughly
4. Submit a pull request to `development`

## 📄 License

Private project - All rights reserved.

## 🆘 Support

For issues or questions, please create an issue in the GitHub repository.

---

Built with the BMAD Framework | © 2025 Vibe Coding Launchpad

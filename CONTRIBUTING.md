# Contributing to Vibe Coding Launchpad

Thank you for your interest in contributing! This document provides guidelines and standards for contributing to this project.

## 🌿 Branch Strategy

We follow a three-branch workflow:

- **`development`** - Active development branch (default)
  - All feature development happens here
  - Most unstable but most active
  - Deploy to development environment

- **`staging`** - Pre-production testing branch
  - Merge from `development` when features are ready for testing
  - Deploy to staging environment for QA
  - Should be relatively stable

- **`production`** - Production-ready code
  - Merge from `staging` after thorough testing
  - Deploy to production environment
  - Only stable, tested code

### Workflow

```
development → staging → production
```

## 📝 Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear version history:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```bash
feat(workflow): add brainstorming stage UI
fix(theme): resolve hydration mismatch in theme toggle
docs(readme): update setup instructions
refactor(api): improve error handling in API routes
perf(database): optimize Supabase query performance
```

### Breaking Changes

Mark breaking changes in the footer:

```bash
feat(auth): migrate to new authentication system

BREAKING CHANGE: Old auth tokens will no longer work
```

## 🏗️ Development Workflow

### 1. Create Feature Branch

```bash
git checkout development
git pull origin development
git checkout -b feat/your-feature-name
```

### 2. Make Changes

- Write clean, documented code
- Follow TypeScript strict mode
- Add JSDoc comments for public functions
- Implement proper error handling
- Add logging for key operations

### 3. Test Your Changes

```bash
# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Test locally on port 3050
npm run dev
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat: your descriptive commit message"
```

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Create a Pull Request to `development` branch.

## 🎨 Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Export types/interfaces from `types/index.ts`
- Use explicit return types for functions

### Components

```typescript
/**
 * Component description
 * @param props - Component props
 */
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Implementation
}
```

### Functions

```typescript
/**
 * Function description
 * @param param1 - Parameter description
 * @returns Return value description
 */
export function myFunction(param1: string): ReturnType {
  // Implementation
}
```

### Comments

- Explain **why**, not **what**
- Document constraints and trade-offs
- Mark TODOs with context: `// TODO: Add validation (blocked by API changes)`
- JSDoc for all public APIs

## 🔒 Security Guidelines

### Never Commit

- Environment variables (`.env.local`)
- API keys or secrets
- Supabase service role key
- Personal access tokens

### Always

- Validate user input
- Use parameterized queries
- Implement rate limiting for APIs
- Follow OWASP security guidelines
- Log security events

### Code Review Checklist

- [ ] No hardcoded secrets or keys
- [ ] Input validation implemented
- [ ] Error handling in place
- [ ] Logging added for key operations
- [ ] TypeScript types defined
- [ ] Security headers configured
- [ ] WCAG 2.2 AA compliance for UI changes

## 🧪 Testing Standards

### Required Tests

- Unit tests for utility functions
- Integration tests for API routes
- Component tests for critical UI
- E2E tests for main user flows

### Test Structure

```typescript
describe("ComponentName", () => {
  it("should behave as expected", () => {
    // Arrange
    // Act
    // Assert
  });
});
```

## 📚 Documentation

### Update When

- Adding new features
- Changing APIs or interfaces
- Modifying environment variables
- Updating dependencies
- Changing deployment process

### Files to Update

- `README.md` - User-facing documentation
- `CONTRIBUTING.md` - This file
- JSDoc comments - In-code documentation
- Type definitions - `types/index.ts`

## 🐛 Bug Reports

Include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Numbered steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, Node version
6. **Screenshots**: If applicable

## ✨ Feature Requests

Include:

1. **Problem**: What problem does this solve?
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions considered
4. **Additional Context**: Screenshots, mockups, etc.

## 📞 Questions?

- Create a GitHub issue with the `question` label
- Reach out to maintainers

---

Thank you for contributing to Vibe Coding Launchpad! 🚀


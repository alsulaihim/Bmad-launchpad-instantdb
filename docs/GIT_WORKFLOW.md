# Git Workflow & Release Strategy

## Branching Strategy

This repository follows a strict branching strategy aligned with our Vercel environments:

- **`development`**: Default branch. All feature branches should target `development`. Deploys to Vercel Development environment.
- **`staging`**: Pre-production branch. Merges from `development` for QA. Deploys to Vercel Staging environment.
- **`live`**: Production branch. Merges from `staging`. Deploys to Vercel Production environment.

### Promotion Flow
1. Feature -> `development` (via PR)
2. `development` -> `staging` (via PR, after QA in dev)
3. `staging` -> `live` (via PR, after QA in staging)

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Formatting, missing semi-colons, etc.
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` changes to the build process or auxiliary tools

## Versioning

We use [Semantic Versioning (SemVer)](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality
- **PATCH**: Backwards-compatible bug fixes

Tags should be created on the `live` branch upon release.


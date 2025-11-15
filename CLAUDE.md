# CLAUDE.md

Development guidelines for Claude Code when working with this repository.

## Before Starting Any Task
**IMPORTANT**: Always check these directories first:
- **`/skills`** - Custom skills for specific actions
- **`/agents`** - Custom agent personas to invoke via Task tool
- **`/plans`** - Implementation plans for features

## Quick Reference

### Commands
- `npm run dev` - Start dev server (http://localhost:3000)
- `npx convex deploy` - Deploy Convex functions

### Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS 4, shadcn/ui
- **Backend**: Convex (schema: `convex/schema.ts`)
- **Auth**: Clerk (middleware.ts protects routes)
- **Path alias**: `@/*` → root directory

### Project Structure
- `/app` - Next.js pages and layouts (App Router)
  - `/app/(auth)` - Authentication pages if needed
  - `/app/(protected)` - Protected routes requiring authentication
- `/components` - React components including sidebar and UI components
- `/convex` - Backend functions, schema, and auth configuration
  - `schema.ts` - Database schema definition
  - `auth.config.ts` - Clerk authentication configuration
- `/public` - Static assets including custom fonts
- `/agents` - Custom Claude Code agent definitions for specialized tasks
- `/plans` - Implementation plans and guides for specific features
- `/skills` - Custom skills for specific actions
- `middleware.ts` - Route protection configuration

## Development Patterns

### Documentation
**IMPORTANT**: All Markdown files created for logging, recording, or instructing must be placed in the `/docs` folder.
- This includes: implementation notes, feature documentation, troubleshooting guides, etc.
- Keep documentation organized and discoverable
- Never create documentation files in the root directory or scattered throughout the codebase

### Convex Backend
**CRITICAL**: When working with Convex, ALWAYS follow `convexGuidelines.md`
- Covers: queries, mutations, actions, validators, schema, indexes, file storage
- Never deviate without explicit user approval

### Code Organization
- Break large pages into focused components
- Extract reusable UI into separate files
- Keep pages concise (avoid 1000+ line files)
- Use hooks for logic separation

### UI-First Approach
1. Build complete UI with styling first
2. Match existing design patterns
3. Then add business logic and backend integration

### API Keys
- Ask user for API key
- Add to `.env.local` yourself (create if needed)
- Never ask user to manually edit env files

### Auth & Security
- Routes protected via Clerk middleware
- User-specific filtering at Convex database level
- Use `useQuery`, `useMutation`, `useAction` hooks

## Git & Version Control

### Committing Changes
**IMPORTANT**: Only create commits when explicitly requested by the user. If unclear, ask first.

#### Git Safety Protocol
- NEVER update git config
- NEVER run destructive/irreversible commands (force push, hard reset) without explicit user request
- NEVER skip hooks (--no-verify, --no-gpg-sign) without explicit user request
- NEVER force push to main/master (warn user if they request it)
- Avoid `git commit --amend` unless explicitly requested or adding pre-commit hook edits

#### Commit Process
1. Run git commands in parallel to gather context:
   - `git status` - See untracked files
   - `git diff` - See staged and unstaged changes
   - `git log` - Review recent commit message style
2. Analyze all changes and draft a commit message:
   - Summarize nature of changes (new feature, enhancement, bug fix, refactor, etc.)
   - Do not commit files with secrets (.env, credentials.json, etc.)
   - Focus on "why" rather than "what"
   - Keep concise (1-2 sentences)
3. Add files and create commit with proper message format:
   ```
   [Summary message]

   🤖 Generated with [Claude Code](https://claude.com/claude-code)

   Co-Authored-By: Claude <noreply@anthropic.com>
   ```
4. Run `git status` after commit to verify success
5. If pre-commit hooks modify files, verify it's safe to amend (check authorship and not pushed)

#### Notes
- Never use git commands with `-i` flag (interactive mode not supported)
- Do not create empty commits
- Always use HEREDOC for commit messages to ensure proper formatting
- Do not push to remote unless explicitly requested
- Always sacrifice grammar for the sake of conciseness.
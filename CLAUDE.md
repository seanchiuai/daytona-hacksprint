# CLAUDE.md

Project-specific guidelines for this repository.

## Before Starting Any Task
Always check these directories first:
- `/skills` - Custom skills for specific actions
- `/agents` - Custom agent personas to invoke via Task tool
- `/plans` - Implementation plans for features

## Quick Reference

### Commands
- `npm run dev` - Start dev server (http://localhost:3000)
- `npx convex deploy` - Deploy Convex functions
- `coderabbit review --plain` - Review code quality and get suggestions

### Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS 4, shadcn/ui
- **Backend**: Convex (schema: `convex/schema.ts`)
- **Auth**: Clerk (middleware.ts protects routes)
- **Path alias**: `@/*` → root directory

### Project Structure
- `/app` - Next.js pages (App Router)
  - `/app/(auth)` - Authentication pages
  - `/app/(protected)` - Protected routes requiring auth
- `/components` - React components
- `/convex` - Backend functions, schema, auth config
- `/agents` - Custom Claude agent definitions
- `/plans` - Implementation plans
- `/skills` - Custom skills
- `/docs` - All project documentation
- `middleware.ts` - Route protection

## Project-Specific Patterns

### Documentation
All markdown files for logging, recording, or instructing must go in `/docs` folder.

### Convex Backend
**CRITICAL**: Always follow `convexGuidelines.md` for all Convex work.

### UI-First Development
1. Build complete UI with styling first
2. Match existing design patterns
3. Then add business logic and backend integration

### API Keys
- Ask user for API key
- Add to `.env.local` yourself (create if needed)

### Auth & Security
- Routes protected via Clerk middleware
- User-specific filtering at database level
- Use `useQuery`, `useMutation`, `useAction` hooks
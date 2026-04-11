# Contributing to AeonRFP

Thank you for considering contributing to AeonRFP! Here's how to get started.

## 🔧 Development Setup

```bash
# Fork & clone
git clone https://github.com/<your-username>/AeonRFP.git
cd AeonRFP

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Start dev server
npm run dev
```

## 📐 Code Standards

### TypeScript
- **Strict mode** — no `any` types unless absolutely necessary
- **Named exports** — prefer named over default exports for utilities
- **Type-first** — define interfaces before implementation

### Commits
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add DOCX export to draft editor
fix: correct clause splitting for nested bullets
docs: update environment variable reference
refactor: extract SSE parser into shared hook
```

### File Organization
```
lib/           → Shared logic, AI modules, database clients
app/api/       → API routes (server-side only)
app/dashboard/ → Dashboard pages (client components)
```

## 🔄 Pull Request Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes
3. Run type check: `npx tsc --noEmit`
4. Run build: `npm run build`
5. Commit with conventional format
6. Push and open a PR against `main`
7. Fill out the PR template

## 🧪 Testing Checklist

Before submitting:
- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] Manual testing on Chrome/Edge
- [ ] No console errors or regressions

## 📁 Key Directories

| Directory | Purpose |
|-----------|---------|
| `lib/ai/` | Gemini client, prompt construction, validation |
| `lib/smartmatch/` | Vector search, reranking, embedding, compression |
| `lib/parsing/` | PDF/DOCX/XLSX text extraction and clause splitting |
| `lib/supabase/` | Database client, auth middleware, schema |
| `app/api/` | Server-side API routes |
| `app/dashboard/` | Client-side dashboard pages |

## 📄 License

By contributing, you agree that your contributions will be licensed under the project's proprietary license.

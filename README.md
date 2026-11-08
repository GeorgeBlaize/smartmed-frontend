# SmartMed — Frontend

Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui.

The project overview, features, ERD, architecture, API reference, testing plan and team workflow live in the
**[backend repo](https://github.com/GeorgeBlaize/backend#readme)** (`docs/` folder) so there is one source of truth.

| | |
| --- | --- |
| Live app | https://smartmed-frontend-nine.vercel.app |
| API repo + docs | https://github.com/GeorgeBlaize/backend |
| Architecture | [docs/ARCHITECTURE.md](https://github.com/GeorgeBlaize/backend/blob/main/docs/ARCHITECTURE.md) |
| Contributing | [CONTRIBUTING.md](CONTRIBUTING.md) |

```bash
cp .env.example .env.local   # BACKEND_URL=http://localhost:5000
npm install
npm run dev                  # http://localhost:3000
```

- `src/app` – routes only (public site, auth, `/dashboard`, `/admin`, `/share/[token]`)
- `src/features/<feature>` – React Query hooks (`api.ts`) and the components for that feature
- `src/components/{ui,shared,layout}` – shadcn primitives, shared states/dialogs, app shell
- `src/lib` – API client with token refresh, formatting, Bangla voice, push, image compression
- `src/proxy.ts` – redirects logged-out users away from protected routes

All `/api/*` requests are rewritten to `BACKEND_URL` (see `next.config.ts`), so auth cookies stay first-party.

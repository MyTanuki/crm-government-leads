# Frontend — CRM Government Leads

Next.js 14 App Router frontend for System 1. Connects to the NestJS backend in `../backend`.

## Quick start

```bash
npm install
cp .env.example .env.local  # default: http://localhost:3001/api/v1
npm run dev                  # → http://localhost:3000
```

## Pages

| Route | Description |
|---|---|
| `/leads` | Lead List — stats, filter, paginated table |
| `/leads/new` | Create Lead — Smart Search + 6-field form |
| `/leads/[id]` | Lead Detail — agency info + audit timeline |
| `/settings/agency-suggestions` | Admin review queue |
| `/me` | Profile — identity, LINE status, sessions |
| `/archive` | Archive Search — deleted + cold storage |

## Smart Search

`components/agencies/smart-search.tsx` — calls `GET /agencies/search?q=`,
debounced 300ms, keyboard navigation, match highlight, auto-fills metadata on select.

## Stack

Next.js 14 App Router, TypeScript, Tailwind CSS, lucide-react.
No state management library — React useState only in Phase 1.

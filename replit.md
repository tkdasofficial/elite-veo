# Elite Veo

An AI-powered chat assistant built with React + Vite on the frontend and Supabase as the sole backend.

## STRICT PROJECT RULES

1. **Use Supabase as the only backend** — all data, auth, storage, and AI calls go through Supabase.
2. **Use npm only** — no pnpm, yarn, or other package managers.
3. **Do NOT use Replit Database, Replit Auth, or any other Replit-specific backend service.**
4. **Supabase is the primary and only backend service** — no custom Express/Hono/Fastify servers, no Neon, no Drizzle.

## Architecture

- **Frontend**: React 18, Vite, TailwindCSS, shadcn/ui, React Router v6, TanStack Query
- **Backend**: Supabase (Auth, Postgres database, Storage, Edge Functions)
- **AI providers**: Groq (primary) → Gemini (fallback) for chat & web search; Freepik Mystic for image generation; Gemini for image editing & analysis
- **No custom server** — all data and AI calls go through Supabase

## Supabase Edge Functions

| Function | Purpose |
|---|---|
| `chat` | Streaming chat via Groq → Gemini fallback |
| `generate-image` | Image generation via Freepik Mystic |
| `edit-image` | Image editing via Gemini |
| `analyze` | Vision/image analysis via Groq → Gemini |
| `web-search` | Web search & URL scraping via Firecrawl + AI summary |

## Database Tables (Supabase Postgres)

- `profiles` — user profiles, auto-created on signup
- `conversations` — chat conversation threads
- `messages` — individual messages per conversation
- `creations` — generated images/content with storage references

## Key Files

- `src/App.tsx` — routing
- `src/context/AuthContext.tsx` — Supabase auth (sign up, OTP, Google OAuth)
- `src/context/AppContext.tsx` — conversations & messages CRUD via Supabase
- `src/pages/ChatPage.tsx` — main chat UI, intent routing, SSE streaming
- `src/lib/intent-router.ts` — detects user intent (chat / image / search / analyze)
- `src/integrations/supabase/client.ts` — Supabase client

## Running

The workflow `Start application` runs `npm run dev` and serves the app on port 5000.

## Environment Variables

Supabase credentials are stored in `.env` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Edge function secrets (GROQ_API_KEY, GEMINI_API_KEY, FREEPIK_API_KEY, FIRECRAWL_API_KEY) are configured in the Supabase project dashboard.

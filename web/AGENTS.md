<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dev server (Next 16 + Windows)

`npm run dev` binds to `0.0.0.0`. Two gotchas that both manifest as "the page reloads every ~200 ms forever":

1. **Cross-origin HMR is blocked by default.** Add every host you'll hit (LAN IP, `127.0.0.1`, etc.) to `allowedDevOrigins` in `next.config.ts`. The booth iPad uses the dev laptop's LAN IP, so IP wildcards (`192.168.*`) are required. Without this, the HMR WebSocket is rejected and the client reconnect-loops, re-mounting the React tree on every retry — looks identical to `npm run dev` getting stuck in a loop.
2. **Don't `npm install` while the dev server is running.** Turbopack's in-memory module resolver goes stale and starts panicking with `Next.js package not found` on every page request. Stop the dev server, install, restart.

Access the dev server via `http://127.0.0.1:3000` or LAN IP — `localhost` resolves to IPv6 on Windows and can also misalign with the HMR origin check.

# AI SDK (v6) — Google Gemini

The `/me` track talks to Gemini via Vercel AI SDK 6. Notes:

- Provider: `@ai-sdk/google` (`^3.0`)
- Default model: `google("gemini-2.5-flash-lite")` (Free tier ~1000/일. `gemini-2.5-flash`는 20/일이라 11명 규모에선 즉시 한도 초과 — 모든 라우트가 flash-lite로 통일되어 있어야 함)
- Structured output: `generateText` + `Output.object({ schema })` (not the deprecated `generateObject`)
- Server route: `app/api/me/chat/route.ts` (Node runtime; never call Gemini from the client)
- Env var: `GOOGLE_GENERATIVE_AI_API_KEY` in `web/.env.local` (see `.env.example`). Get a key in 5 minutes at https://aistudio.google.com/apikey
- The system prompt lives in `lib/ai/pacemaker-prompt.ts` and encodes the pacemaker design rules from `being_myself_mvp_plan.md` §4.1, §8.1–§8.3.

When upgrading: run `npx @ai-sdk/codemod v6 .` if migrating from v5, and read `node_modules/ai/docs/08-migration-guides/24-migration-guide-6-0.mdx`.


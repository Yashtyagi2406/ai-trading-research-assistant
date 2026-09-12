# AI Trading Research Assistant — Mini Prototype

A small web app that turns a plain-English trading question into a structured,
testable "experiment" — asking for clarification when key information is
missing, instead of guessing.

This deliberately implements only steps 1–4 of the larger product vision
(understand → structure → identify missing info → show the final experiment).
It does **not** run backtests, fetch market data, or execute trades.

## Live demo
- Deployed URL: https://ai-trading-research-assistant-sooty.vercel.app
- GitHub repo: https://github.com/Yashtyagi2406/ai-trading-research-assistant
- Screen recording: `screen_recording_demo.webp` (local file — share via Drive/Loom before submitting)

## Architecture

```
app/
  page.tsx                → chat UI + clarification loop (client component)
  api/experiment/route.ts → POST endpoint, calls the LLM extraction step
components/
  ChatMessage.tsx          → chat bubble
  ExperimentCard.tsx       → final structured-experiment display
lib/
  schema.ts                → zod schema = the shared "experiment" contract
  llm.ts                   → Claude tool-use call that forces structured JSON
  backtest.ts              → optional/bonus: maps a complete experiment to a
                              hypothetical backtest spec (not implemented)
```

Flow:
1. User types a question. The full conversation (not just the latest message)
   is sent to `/api/experiment` on every turn.
2. The API route calls Claude with a system prompt + a forced tool call
   (`structure_experiment`) via Groq's OpenAI-compatible function-calling API,
   so the model can only respond with JSON matching the `ExperimentFields` schema
   — not free text. This is what "AI implementation"
   is doing here: real information extraction with a fixed output contract,
   not a chatbot wrapper that just echoes an LLM's prose.
3. The server re-validates the model's own `isComplete` flag by checking the
   actual field values in code (never trusts the model blindly). If required
   fields (`instrument`, `timeframe`, `entryCondition`, `exitCondition`,
   `holdingPeriod`, `question`) are still null, it returns a single, specific
   clarifying question instead.
4. The frontend shows that question as a normal chat message and waits for the
   next reply, appending it to the same conversation until the experiment is
   complete.
5. Once complete, the structured experiment renders as a card — the "final
   experiment" output required by the brief.

## Technologies used
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS for styling
- Groq (`openai/gpt-oss-120b`) via `groq-sdk`, using
  **forced function calling** (OpenAI-compatible, `tool_choice: "required"`) for structured output
- Zod for schema validation on both the LLM output and the API boundary
- No database — state lives in the browser session only (see "What I'd
  improve" below)

## AI tools used
See `AI_USAGE.md` for the required disclosure (tools, what for, what was
personally designed vs. reviewed/modified). **Fill this in honestly based on
your own session** before submitting — it currently reflects that this
scaffold was generated with Claude and should be annotated with what you
changed.

## Key decisions
- **Ask, don't assume, is enforced in two places, not one.** The system
  prompt tells the model not to invent values, but the API route also
  independently recomputes `missingFields`/`isComplete` from the raw field
  values before trusting the response. This matters because LLMs sometimes
  mark themselves "complete" even when a field is null — the code, not the
  prompt, is the actual guardrail.
- **Function calling over free-form JSON-in-text.** Forcing a specific function
  call via Groq's OpenAI-compatible API guarantees parseable output and avoids
  brittle regex/JSON-extraction from prose, which is the difference between
  "using AI meaningfully" and building a thin chat wrapper.
- **The whole conversation is resent each turn** rather than trying to diff
  or patch a partial experiment client-side. This keeps the extraction logic
  stateless and lets the model merge a clarifying answer into the existing
  fields itself, which is simpler and more robust than hand-written merge
  logic on the frontend.
- **No database.** The assignment's scope is understand → structure → clarify
  → display; persistence ("remember what it learned") is explicitly framed as
  a later stage of the larger product, so it's left out here rather than
  bolted on superficially.
- **Backtesting is a typed stub, not a feature.** `lib/backtest.ts` shows the
  handoff shape the brief's optional bonus asks about, without building an
  engine — in line with "do not build a full trading platform."

## What I'd improve with more time
- Persist experiments (and past Q&A sessions) to a lightweight DB (e.g.
  Postgres/SQLite via Prisma) so the assistant can reference prior questions —
  the "remember what it learned" part of the long-term vision.
- Allow editing individual fields directly on the `ExperimentCard` instead of
  only through conversation.
- Handle multi-field clarifications in one turn (currently the model is
  instructed to ask one at a time, which is safer for non-experts but slower
  for power users).
- Add streaming responses so the clarifying question appears token-by-token
  instead of after a full round trip.
- Add basic tests around `lib/schema.ts` completeness logic and a couple of
  fixture conversations for `lib/llm.ts`.

## Running locally
```bash
npm install
cp .env.example .env.local   # add your GROQ_API_KEY (get one free at console.groq.com)
npm run dev
```
Open http://localhost:3000.

## Deploying
Push to GitHub, import the repo in Vercel, add `ANTHROPIC_API_KEY` as an
environment variable in the Vercel project settings, and deploy.

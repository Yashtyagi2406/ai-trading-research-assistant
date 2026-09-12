# AI Usage Note

## Which AI tools I used
- **Claude (Anthropic)** — used to generate the initial full-stack scaffold
  (Next.js app structure, the extraction API route, the Zod schema, and the
  chat UI) from a written specification of the assignment.
- **Antigravity (Google DeepMind)** — used to install, smoke-test, debug, and
  deploy the scaffold; swap the LLM provider from Anthropic to Groq; diagnose
  model compatibility issues across Groq's preview tier; run all three required
  clarification-loop tests locally and on the live Vercel deployment; and fill
  in the README/AI_USAGE.md placeholders.

## What I used them for
- **Claude**: Turned the assignment brief into a concrete architecture (chat UI →
  extraction API → structured card) and a first working implementation of
  `lib/schema.ts`, `lib/llm.ts`, `app/api/experiment/route.ts`, and the two
  UI components.
- **Antigravity**:
  - Ran `npm install` and `npm run build` to verify the scaffold compiled cleanly.
  - Swapped `@anthropic-ai/sdk` for `groq-sdk` in `package.json` and rewrote
    `lib/llm.ts` to use Groq's OpenAI-compatible function-calling API.
  - Diagnosed Groq model availability issues (Qwen3 thinking-mode empty-output
    bug; llama-3.3-70b-versatile unavailable on preview-tier keys) and landed on
    `openai/gpt-oss-120b` with `tool_choice: "required"` as the working model.
  - Updated `.env.example`, `README.md`, and all model references throughout.
  - Ran the three required clarification-loop smoke tests against localhost
    and confirmed all three pass (missing-fields question → asks; fully-specified
    question → resolves complete; vague one-liner → asks sensibly).
  - Ran `git init`, made the initial commit (confirming `.env.local` was
    gitignored before staging), added the GitHub remote, and pushed.
  - Deployed to Vercel, added `GROQ_API_KEY` as an environment variable in
    project settings, and confirmed the live URL passes the same smoke tests.
  - Filled in README placeholders (live URL, repo URL).

## What I personally designed
- The core "ask, don't assume" architectural decision: required fields are
  defined in `REQUIRED_FIELDS` in `lib/schema.ts`, and the API route
  **re-computes** `isComplete`/`missingFields` from the raw field values after
  parsing the model's response — it never trusts the model's own `isComplete`
  flag. This double-check is the main guardrail.
- The choice to use forced function/tool calling (rather than asking the model
  to return JSON in free text) so the output contract is always parseable — this
  is enforced at the SDK level (`tool_choice: "required"`), not just by prompt.
- The decision to resend the full conversation history on every turn (stateless
  extraction, no client-side field merging), keeping the extraction logic simple
  and robust.
- The decision to leave `lib/backtest.ts` as a typed stub — the assignment scope
  is structure-and-clarify, not execute; a stub communicates the handoff shape
  without building something out of scope.
- The decision not to add a database — session state in the browser is sufficient
  for the prototype scope, and bolting on a DB would add complexity without
  serving the stated requirement.

## What I reviewed or modified
- Read `lib/llm.ts` line by line when rewriting it for Groq to ensure the system
  prompt content was preserved verbatim (the "ask, don't assume" instructions
  and the one-question-at-a-time constraint must not be weakened).
- Verified the server-side `isComplete` recheck (lines 160–165 in the new
  `lib/llm.ts`) is identical in logic to the original Anthropic version.
- Tested the clarification loop end-to-end with all three required inputs, both
  locally and on the live Vercel deployment, and confirmed no hallucinated
  values, no double-questions, and no false-complete responses.
- Reviewed `.gitignore` before the first commit to confirm `.env.local` and
  `.env` are both excluded.

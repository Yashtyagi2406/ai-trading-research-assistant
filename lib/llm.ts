import Groq from "groq-sdk";
import {
  ExtractionResult,
  ExtractionResultSchema,
  ChatMessage,
  REQUIRED_FIELDS,
} from "./schema";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const SYSTEM_PROMPT = `You are the research-question parser inside an AI-native trading research
assistant. Your ONLY job is step 1-3 of the product: understand a natural-language
trading question, convert it into a structured, testable experiment, and detect
what's missing.

You are NOT a trading advisor, you do NOT run backtests, and you must NEVER
invent specific numeric values (e.g. a % threshold, a number of days) that the
user did not state or clearly imply. If a value is not given, leave it null and
surface it as a missing field with a concrete clarifying question instead of
guessing. This "ask, don't assume" behavior is the most important part of your job.

Guidelines:
- "Instrument", "timeframe", "entryCondition", "exitCondition", "holdingPeriod",
  and "question" are the required fields.
- "filters" is optional context (e.g. "only in high-volatility regimes") — an
  empty array is fine if the user gave none.
- If the user's message already answers a previously asked clarifying question,
  merge that answer into the existing experiment rather than starting over.
- Only ask ONE clarifying question at a time, and make it specific enough that
  a non-trader can answer it (e.g. "How many trading days should the position
  be held before closing it if no exit condition has triggered yet?").
- Mark isComplete = true only once every required field is non-null. Do not
  fabricate a plausible-sounding value just to mark it complete.
- Keep "reasoning" short (1-2 sentences): explain how you interpreted the
  question, in plain English.`;

const EXTRACTION_TOOL: Groq.Chat.ChatCompletionTool = {
  type: "function",
  function: {
    name: "structure_experiment",
    description:
      "Record the structured trading experiment extracted from the conversation so far, including which fields are still missing.",
    parameters: {
      type: "object",
      properties: {
        experiment: {
          type: "object",
          properties: {
            instrument: {
              type: ["string", "null"] as unknown as "string",
              description:
                "The market/instrument being asked about, e.g. NIFTY, BANKNIFTY, RELIANCE. Null if not specified.",
            },
            timeframe: {
              type: ["string", "null"] as unknown as "string",
              description:
                "The bar/candle timeframe, e.g. Daily, 15min, Weekly. Null if not specified.",
            },
            entryCondition: {
              type: ["string", "null"] as unknown as "string",
              description:
                "The precise, testable condition that triggers entering a position. Null if not specified.",
            },
            exitCondition: {
              type: ["string", "null"] as unknown as "string",
              description:
                "The precise, testable condition that triggers exiting a position. Null if not specified.",
            },
            holdingPeriod: {
              type: ["string", "null"] as unknown as "string",
              description:
                "How long a position is held if no exit condition fires, e.g. '5 trading days'. Null if not specified.",
            },
            filters: {
              type: "array",
              items: { type: "string" },
              description:
                "Any additional conditions/filters. Empty array if none.",
            },
            question: {
              type: ["string", "null"] as unknown as "string",
              description:
                "The underlying yes/no or comparative research question the user wants answered. Null if not specified.",
            },
          },
          required: [
            "instrument",
            "timeframe",
            "entryCondition",
            "exitCondition",
            "holdingPeriod",
            "filters",
            "question",
          ],
        },
        missingFields: {
          type: "array",
          items: { type: "string" },
          description:
            "Names of required fields that are still null/unknown.",
        },
        isComplete: {
          type: "boolean",
          description:
            "True only when there is enough information to run/describe the experiment unambiguously.",
        },
        clarifyingQuestion: {
          type: ["string", "null"] as unknown as "string",
          description:
            "A single, specific, human-friendly question to ask the user next. Null when isComplete is true.",
        },
        reasoning: {
          type: "string",
          description:
            "One or two sentences on how the question was interpreted. Shown to the user for transparency.",
        },
      },
      required: [
        "experiment",
        "missingFields",
        "isComplete",
        "clarifyingQuestion",
        "reasoning",
      ],
    },
  },
};

/**
 * Sends the full conversation to Groq (Llama 3.3 70B) and forces it to return
 * the structured experiment via function calling, so the API route always gets
 * predictable JSON to validate and forward to the frontend.
 */
export async function extractExperiment(
  history: ChatMessage[]
): Promise<ExtractionResult> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to .env.local (see .env.example)."
    );
  }

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    max_tokens: 1024,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ],
    tools: [EXTRACTION_TOOL],
    tool_choice: "required",
  });

  const toolCall = response.choices[0]?.message?.tool_calls?.[0];

  if (!toolCall || toolCall.type !== "function") {
    throw new Error("Model did not return a structured function call.");
  }

  let parsed: ExtractionResult;
  try {
    const rawArgs = JSON.parse(toolCall.function.arguments);
    parsed = ExtractionResultSchema.parse(rawArgs);
  } catch (e) {
    throw new Error(
      `Failed to parse model's function call arguments: ${(e as Error).message}`
    );
  }

  // Defensive re-check: don't trust the model's own isComplete flag blindly.
  // Recompute it from the actual field values so the UI never shows a
  // "complete" card with a hidden null in it.
  const stillMissing = REQUIRED_FIELDS.filter(
    (field) => !parsed.experiment[field]
  );
  parsed.missingFields = stillMissing;
  parsed.isComplete = stillMissing.length === 0;
  if (parsed.isComplete) parsed.clarifyingQuestion = null;

  return parsed;
}

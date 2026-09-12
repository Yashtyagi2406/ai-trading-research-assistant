import { z } from "zod";

/**
 * The core data model of the assignment: a "structured experiment".
 * This is the shared contract between the LLM extraction step, the
 * clarification flow, the UI, and (optionally) a future backtesting engine.
 *
 * Any field can be null, meaning "not yet known" — the app treats null
 * fields as reasons to ask a clarifying question rather than guessing.
 */
export const ExperimentFieldsSchema = z.object({
  instrument: z.string().nullable().describe("The market/instrument being asked about, e.g. NIFTY, BANKNIFTY, RELIANCE."),
  timeframe: z.string().nullable().describe("The bar/candle timeframe the strategy operates on, e.g. Daily, 15min, Weekly."),
  entryCondition: z.string().nullable().describe("The precise, testable condition that triggers entering a position."),
  exitCondition: z.string().nullable().describe("The precise, testable condition that triggers exiting a position."),
  holdingPeriod: z.string().nullable().describe("How long a position is held if no exit condition fires, e.g. '5 trading days'."),
  filters: z.array(z.string()).describe("Any additional conditions/filters narrowing when the setup applies, e.g. 'high volatility regime'. Empty array if none."),
  question: z.string().nullable().describe("The underlying yes/no or comparative research question the user wants answered, e.g. 'Does this setup have a positive edge?'"),
});

export type ExperimentFields = z.infer<typeof ExperimentFieldsSchema>;

/**
 * What the LLM extraction step returns on every turn: the current best
 * understanding of the experiment, plus whether it's complete enough to
 * show as a final result, plus (if not) a single clarifying question.
 */
export const ExtractionResultSchema = z.object({
  experiment: ExperimentFieldsSchema,
  missingFields: z.array(z.string()).describe("Names of required fields that are still null/unknown and materially affect the experiment."),
  isComplete: z.boolean().describe("True only when there is enough information to run/describe the experiment unambiguously."),
  clarifyingQuestion: z.string().nullable().describe("A single, specific, human-friendly question to ask the user next. Null when isComplete is true."),
  reasoning: z.string().describe("One or two sentences on how the question was interpreted. Shown to the user for transparency."),
});

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Fields we require to be non-null (and non-empty for filters is NOT required)
// before we consider an experiment "complete". `filters` is optional by nature.
export const REQUIRED_FIELDS: (keyof ExperimentFields)[] = [
  "instrument",
  "timeframe",
  "entryCondition",
  "exitCondition",
  "holdingPeriod",
  "question",
];

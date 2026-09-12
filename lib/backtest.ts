import { ExperimentFields } from "./schema";

/**
 * OPTIONAL / BONUS — NOT wired into the UI or required for evaluation.
 *
 * This shows the shape of the handoff from "structured experiment" to a
 * hypothetical backtesting engine, without implementing one (per the brief:
 * "do not build a full trading platform"). A real engine would consume this
 * spec against historical OHLCV data and return trade-by-trade results.
 */
export interface BacktestSpec {
  symbol: string;
  timeframe: string;
  entryRule: string;
  exitRule: string;
  maxHoldingPeriod: string;
  filters: string[];
  objective: string;
}

export function toBacktestSpec(experiment: ExperimentFields): BacktestSpec {
  if (
    !experiment.instrument ||
    !experiment.timeframe ||
    !experiment.entryCondition ||
    !experiment.exitCondition ||
    !experiment.holdingPeriod ||
    !experiment.question
  ) {
    throw new Error(
      "Cannot build a backtest spec from an incomplete experiment."
    );
  }

  return {
    symbol: experiment.instrument,
    timeframe: experiment.timeframe,
    entryRule: experiment.entryCondition,
    exitRule: experiment.exitCondition,
    maxHoldingPeriod: experiment.holdingPeriod,
    filters: experiment.filters,
    objective: experiment.question,
  };
}

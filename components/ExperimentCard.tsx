import { ExperimentFields } from "@/lib/schema";

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-slate-800 last:border-b-0">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className={value ? "text-slate-100" : "text-slate-600 italic"}>
        {value ?? "not specified"}
      </span>
    </div>
  );
}

export default function ExperimentCard({
  experiment,
}: {
  experiment: ExperimentFields;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-accent tracking-wide">
          STRUCTURED EXPERIMENT
        </h3>
        <span className="text-xs rounded-full bg-good/10 text-good px-2 py-0.5 border border-good/30">
          Ready
        </span>
      </div>

      <Row label="Instrument" value={experiment.instrument} />
      <Row label="Timeframe" value={experiment.timeframe} />
      <Row label="Entry condition" value={experiment.entryCondition} />
      <Row label="Exit condition" value={experiment.exitCondition} />
      <Row label="Holding period" value={experiment.holdingPeriod} />
      <Row
        label="Filters"
        value={
          experiment.filters.length > 0 ? experiment.filters.join(", ") : null
        }
      />
      <Row label="Research question" value={experiment.question} />

      <p className="mt-4 text-xs text-slate-500">
        This is the structured spec the platform would eventually hand off to
        a backtesting engine. No historical data has been run — this
        prototype stops at "structure and explain."
      </p>
    </div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage as ChatMessageType, ExtractionResult } from "@/lib/schema";
import ChatMessage from "@/components/ChatMessage";
import ExperimentCard from "@/components/ExperimentCard";

const EXAMPLE_QUESTIONS = [
  "Does buying NIFTY after a 1% fall work better during high-volatility periods?",
  "Is there an edge in shorting BANKNIFTY after three consecutive green days?",
  "Does RELIANCE tend to bounce after gapping down more than 2%?",
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, result]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const nextHistory: ChatMessageType[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history: nextHistory }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed.");

      const extraction: ExtractionResult = data;
      setResult(extraction);

      if (!extraction.isComplete && extraction.clarifyingQuestion) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: extraction.clarifyingQuestion as string },
        ]);
      } else if (extraction.isComplete) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Got it — I have everything I need. Here's the structured experiment:",
          },
        ]);
      }
    } catch (e: any) {
      setError(e.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setMessages([]);
    setResult(null);
    setError(null);
    setInput("");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-white">
          AI Trading Research Assistant
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Ask a plain-English trading question. The assistant turns it into a
          structured, testable experiment — and asks before assuming anything
          you didn't say.
        </p>
      </header>

      {messages.length === 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase text-slate-500 tracking-wide">
            Try an example
          </span>
          <div className="flex flex-col gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left text-sm rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 hover:border-accent hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} content={m.content} />
        ))}

        {result?.isComplete && (
          <ExperimentCard experiment={result.experiment} />
        )}

        {loading && (
          <div className="text-xs text-slate-500 italic">Thinking…</div>
        )}
        {error && (
          <div className="text-xs text-red-400 border border-red-900 bg-red-950/40 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 sticky bottom-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            result?.isComplete
              ? "Ask another question…"
              : "Type your answer or a new question…"
          }
          className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 hover:text-white"
          >
            Reset
          </button>
        )}
      </form>
    </main>
  );
}

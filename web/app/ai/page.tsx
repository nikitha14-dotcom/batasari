"use client";

import { useState } from "react";

import { getAccessToken } from "../../lib/supabase/client";
import { RequireSession } from "../../lib/supabase/RequireSession";

// Blank counts as unset. `??` keeps an empty string, which turns every call
// into a same-origin relative path that 404s against the frontend host.
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

type StreamEvent =
  | { event: "stage"; data: { stage: string } }
  | { event: "complete"; data: { answer: string; sources?: Source[] } }
  | { event: "error"; data: { message?: string } };

type Source = {
  title?: string;
  url?: string;
};

const CATEGORIES = [
  {
    category: "Housing",
    subcategories: ["Find Housing", "Compare", "Check the Place"],
  },
  {
    category: "Employment",
    subcategories: ["general"],
  },
  {
    category: "Healthcare",
    subcategories: ["general"],
  },
  {
    category: "Education",
    subcategories: ["general"],
  },
];

async function apiHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Shared with the onboarding flow. Goes through supabase-js, which refreshes
  // a token close to expiry -- the previous hand-parse of the
  // sb-<ref>-auth-token localStorage key could not, and that key's shape is a
  // library internal that has changed between major versions.
  const token = await getAccessToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Local-only. The backend ignores this header unless ENVIRONMENT=development.
  if (process.env.NEXT_PUBLIC_TEST_USER_ID) {
    headers["x-test-user-id"] = process.env.NEXT_PUBLIC_TEST_USER_ID;
  }

  return headers;
}

function parseSseEvent(raw: string): StreamEvent | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!dataLines.length) return null;

  try {
    return { event, data: JSON.parse(dataLines.join("\n")) } as StreamEvent;
  } catch {
    return null;
  }
}

export default function AiAnswerPage() {
  return (
    <RequireSession>
      <AiAnswerForm />
    </RequireSession>
  );
}

function AiAnswerForm() {
  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].category);
  const [subcategory, setSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [stage, setStage] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function askQuestion() {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setLoading(true);
    setStage("routing");
    setAnswer("");
    setSources([]);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/ai/answer`, {
        method: "POST",
        credentials: "include",
        headers: await apiHeaders(),
        body: JSON.stringify({
          question: question.trim(),
          category,
          subcategory,
        }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "Request failed.");
      }

      if (!response.body) {
        throw new Error("Streaming is not available.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      const CHUNK_TIMEOUT_MS = 60_000;

      while (!done) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), CHUNK_TIMEOUT_MS);

        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await Promise.race([
            reader.read(),
            new Promise<never>((_, reject) => {
              controller.signal.addEventListener("abort", () =>
                reject(new Error("Stream timed out: no data received for 60 seconds."))
              );
            }),
          ]);
        } finally {
          clearTimeout(timer);
        }

        done = chunk.done;
        buffer += decoder.decode(chunk.value, { stream: !done });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const parsed = parseSseEvent(part);
          if (!parsed) continue;

          if (parsed.event === "stage") {
            setStage(parsed.data.stage);
          }

          if (parsed.event === "complete") {
            setAnswer(parsed.data.answer);
            setSources(parsed.data.sources ?? []);
            setStage(null);
          }

          if (parsed.event === "error") {
            throw new Error(parsed.data.message ?? "Could not generate an answer.");
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate an answer.");
      setStage(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="card ai-card">
        <div className="screen">
          <a className="back-link" href="/onboarding">
            Back to onboarding
          </a>
          <h2>Batasari Assistant</h2>
          <p className="muted">Receive AI-generated answers in real time.</p>

          <label className="muted" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="input"
            value={category}
            onChange={(event) => {
              const next = CATEGORIES.find((item) => item.category === event.target.value);
              setCategory(event.target.value);
              setSubcategory(next?.subcategories[0] ?? "general");
            }}
            disabled={loading}
          >
            {CATEGORIES.map((item) => (
              <option key={item.category} value={item.category}>
                {item.category}
              </option>
            ))}
          </select>

          <label className="muted" htmlFor="subcategory">
            Subcategory
          </label>
          <select
            id="subcategory"
            className="input"
            value={subcategory}
            onChange={(event) => setSubcategory(event.target.value)}
            disabled={loading}
          >
            {CATEGORIES.find((item) => item.category === category)
              ?.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
          </select>

          <label className="muted" htmlFor="question">
            Question
          </label>
          <textarea
            id="question"
            className="input textarea"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about planning a move or settling in an Indian city."
            disabled={loading}
          />

          <button className="primary-button" onClick={() => void askQuestion()} disabled={loading}>
            {loading ? "Generating..." : "Ask"}
          </button>

          {stage && <p className="muted">Status: {stage}</p>}
          {error && <p className="error">{error}</p>}

          {answer && (
            <section className="answer-box" aria-live="polite">
              <h3>Answer</h3>
              <p>{answer}</p>
              <h3>Sources</h3>
              {sources.length ? (
                <ul>
                  {sources.map((source) => (
                    <li key={source.url ?? source.title}>
                      {source.url ? <a href={source.url}>{source.title ?? source.url}</a> : source.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No sources returned yet.</p>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}


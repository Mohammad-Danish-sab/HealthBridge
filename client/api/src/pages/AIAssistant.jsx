import React, { useState } from "react";
import { AlertTriangle, Bot, Send, ShieldCheck } from "lucide-react";
import { aiService } from "../services/aiService";

const starterPrompts = [
  "How should I prepare for a routine blood test?",
  "What questions should I ask my doctor?",
  "Explain common reasons for feeling tired.",
];

export default function AIAssistant() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async (event, prompt = "") => {
    event?.preventDefault();
    const text = (prompt || message).trim();
    if (!text || sending) return;

    setSending(true);
    setError("");
    try {
      const response = await aiService.chat(text, history);
      setHistory((current) => [
        ...current,
        { role: "user", content: text },
        { role: "assistant", content: response.reply },
      ].slice(-10));
      setMessage("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "The AI assistant is unavailable. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-violet-600">
            HEALTH INFORMATION
          </p>
          <h1 className="mt-1 text-3xl font-black text-slate-950">
            AI Health Assistant
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Educational guidance only. For symptoms or emergencies, contact a
            qualified healthcare professional.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[520px] min-h-[420px] overflow-y-auto p-5 sm:p-6">
          {history.length === 0 ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
                <p className="font-bold">How can I help?</p>
                <p className="mt-1">
                  Ask general questions about reports, appointments, or preparing
                  for a visit.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {starterPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={(event) => sendMessage(event, prompt)}
                    disabled={sending}
                    className="rounded-full border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((turn, index) => (
                <div
                  key={`${turn.role}-${index}`}
                  className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${
                      turn.role === "user"
                        ? "rounded-br-none bg-violet-600 text-white"
                        : "rounded-bl-none border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    {turn.content}
                  </div>
                </div>
              ))}
              {sending && (
                <p className="text-sm font-medium text-slate-500">
                  HealthBridge AI is responding...
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 sm:mx-6"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="flex gap-2 border-t border-slate-200 p-4 sm:p-5"
        >
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={4000}
            placeholder="Ask a general health information question..."
            className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            aria-label="Health assistant message"
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            aria-label="Send message"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
        AI responses are not a diagnosis or treatment plan. Do not delay
        professional care based on AI guidance.
      </p>
    </div>
  );
}

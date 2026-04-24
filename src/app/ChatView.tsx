"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resolveMenu } from "@/constants/menu";
import { AGENTS } from "@/constants/agents";
import type { KnowledgeReference } from "@/constants/knowledge";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  references?: KnowledgeReference[];
  showEscalation?: boolean;
};

type ChatApiResponse = {
  answer: string;
  references: KnowledgeReference[];
  matched: boolean;
  confidence: number;
  shouldEscalate: boolean;
};

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function refIcon(kind: KnowledgeReference["kind"]): string {
  switch (kind) {
    case "pdf":
      return "📄";
    case "video":
      return "🎥";
    case "email":
      return "✉️";
    default:
      return "🔗";
  }
}

export function ChatView() {
  const searchParams = useSearchParams();
  const menuType = searchParams.get("type");
  const menu = useMemo(() => resolveMenu(menuType), [menuType]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  const [inquiryOpenFor, setInquiryOpenFor] = useState<string | null>(null);
  const [inquiryAgentId, setInquiryAgentId] = useState<string>(AGENTS[0].id);
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryQuestion, setInquiryQuestion] = useState("");
  const [inquirySubmitting, setInquirySubmitting] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = "partner-link.sessionId";
    const existing = sessionStorage.getItem(key);
    if (existing) {
      setSessionId(existing);
    } else {
      const fresh = uuid();
      sessionStorage.setItem(key, fresh);
      setSessionId(fresh);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, inquiryOpenFor]);

  async function send(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query || pending) return;
    setInput("");
    const userMsg: ChatMessage = { id: uuid(), role: "user", content: query };
    setMessages((m) => [...m, userMsg]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, sessionId, menuType }),
      });
      const data = (await res.json()) as ChatApiResponse & { error?: string };
      const content =
        data.answer ?? data.error ?? "回答の取得に失敗しました。";

      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          role: "assistant",
          content,
          references: data.references ?? [],
          showEscalation: Boolean(data.shouldEscalate),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          role: "assistant",
          content: "通信エラーが発生しました。時間をおいて再度お試しください。",
          showEscalation: true,
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function openInquiryFor(msg: ChatMessage) {
    setInquiryOpenFor(msg.id);
    setInquiryError(null);
    // 直近のユーザー質問を初期値に
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    setInquiryQuestion(lastUser?.content ?? "");
  }

  async function submitInquiry() {
    setInquiryError(null);
    if (!inquiryName.trim() || !inquiryEmail.trim() || !inquiryQuestion.trim()) {
      setInquiryError("必須項目をご入力ください。");
      return;
    }
    setInquirySubmitting(true);
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId: inquiryAgentId,
          customerName: inquiryName,
          customerEmail: inquiryEmail,
          question: inquiryQuestion,
          sessionId,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (!data.ok) {
        setInquiryError(data.error ?? "送信に失敗しました。");
        return;
      }
      setMessages((m) => [
        ...m,
        {
          id: uuid(),
          role: "system",
          content:
            data.message ??
            "担当者へお繋ぎしました。追ってご連絡いたします。",
        },
      ]);
      setInquiryOpenFor(null);
      setInquiryName("");
      setInquiryEmail("");
      setInquiryQuestion("");
    } catch {
      setInquiryError("通信エラーが発生しました。時間をおいて再度お試しください。");
    } finally {
      setInquirySubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-baseline justify-between">
          <div>
            <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Partner-Link サポート
            </h1>
            <p className="text-xs text-zinc-500">
              代理店さんの活動を加速する AI アシスタント
            </p>
          </div>
          <span className="text-xs rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-3 py-1">
            {menu.label}
          </span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
          {/* Greeting bubble */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-3 text-sm whitespace-pre-wrap">
              {menu.greeting}
            </div>
          </div>

          {/* Quick replies — always available pre-first-message */}
          {messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {menu.quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-indigo-400 dark:hover:border-indigo-500 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id}>
              {m.role === "system" ? (
                <div className="flex justify-center">
                  <div className="rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-4 py-1.5 text-xs">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div
                  className={
                    m.role === "user" ? "flex justify-end" : "flex justify-start"
                  }
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] rounded-2xl bg-indigo-600 text-white px-4 py-2 text-sm whitespace-pre-wrap"
                        : "max-w-[85%] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 px-4 py-3 text-sm"
                    }
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.role === "assistant" &&
                      m.references &&
                      m.references.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                          <p className="text-[11px] font-semibold text-zinc-500 mb-1.5">
                            参照元
                          </p>
                          <ul className="space-y-1">
                            {m.references.map((ref, i) => (
                              <li key={i} className="text-xs">
                                {ref.url ? (
                                  <a
                                    href={ref.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-indigo-600 dark:text-indigo-400 hover:underline break-all"
                                  >
                                    {refIcon(ref.kind)} {ref.label}
                                  </a>
                                ) : (
                                  <span className="text-zinc-600 dark:text-zinc-400">
                                    {refIcon(ref.kind)} {ref.label}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {m.role === "assistant" && m.showEscalation && (
                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        {inquiryOpenFor === m.id ? (
                          <InquiryForm
                            agentId={inquiryAgentId}
                            name={inquiryName}
                            email={inquiryEmail}
                            question={inquiryQuestion}
                            submitting={inquirySubmitting}
                            error={inquiryError}
                            onAgentIdChange={setInquiryAgentId}
                            onNameChange={setInquiryName}
                            onEmailChange={setInquiryEmail}
                            onQuestionChange={setInquiryQuestion}
                            onCancel={() => setInquiryOpenFor(null)}
                            onSubmit={submitInquiry}
                          />
                        ) : (
                          <button
                            onClick={() => openInquiryFor(m)}
                            className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5"
                          >
                            担当者に繋ぐ（GPに質問）
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {pending && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm text-zinc-500">
                回答を生成中...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div className="mx-auto max-w-3xl px-4 py-3 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="ご質問を入力してください..."
            className="flex-1 resize-none rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => void send(input)}
            disabled={pending || !input.trim()}
            className="rounded-xl bg-indigo-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            送信
          </button>
        </div>
      </footer>
    </div>
  );
}

type InquiryFormProps = {
  agentId: string;
  name: string;
  email: string;
  question: string;
  submitting: boolean;
  error: string | null;
  onAgentIdChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onQuestionChange: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

function InquiryForm(props: InquiryFormProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
        一次代理店（GP）への問い合わせフォーム
      </p>

      <label className="block text-[11px] text-zinc-500">
        一次代理店
        <select
          value={props.agentId}
          onChange={(e) => props.onAgentIdChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-xs"
        >
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.company} — {a.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-[11px] text-zinc-500">
        お名前（必須）
        <input
          type="text"
          maxLength={200}
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-xs"
        />
      </label>

      <label className="block text-[11px] text-zinc-500">
        メールアドレス（必須）
        <input
          type="email"
          maxLength={320}
          value={props.email}
          onChange={(e) => props.onEmailChange(e.target.value)}
          className="mt-1 block w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-xs"
        />
      </label>

      <label className="block text-[11px] text-zinc-500">
        ご質問内容（必須・最大5000文字）
        <textarea
          rows={4}
          maxLength={5000}
          value={props.question}
          onChange={(e) => props.onQuestionChange(e.target.value)}
          className="mt-1 block w-full resize-none rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-xs"
        />
      </label>

      {props.error && (
        <p className="text-[11px] text-rose-600">{props.error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={props.onSubmit}
          disabled={props.submitting}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium px-3 py-1.5 disabled:opacity-40"
        >
          {props.submitting ? "送信中..." : "送信する"}
        </button>
        <button
          onClick={props.onCancel}
          disabled={props.submitting}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs px-3 py-1.5"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

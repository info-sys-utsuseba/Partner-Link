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
  timestamp: Date;
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

function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

// LINE風タイピングドット
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* アバター */}
      <div className="w-9 h-9 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0 shadow-sm">
        <span className="text-white text-sm font-bold">AI</span>
      </div>
      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // textareaの高さを自動調整
  function adjustTextarea() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  async function send(rawQuery: string) {
    const query = rawQuery.trim();
    if (!query || pending) return;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    const userMsg: ChatMessage = {
      id: uuid(),
      role: "user",
      content: query,
      timestamp: new Date(),
    };
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
          timestamp: new Date(),
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
          timestamp: new Date(),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function openInquiryFor(msg: ChatMessage) {
    setInquiryOpenFor(msg.id);
    setInquiryError(null);
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
          content: data.message ?? "担当者へお繋ぎしました。追ってご連絡いたします。",
          timestamp: new Date(),
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
    } else if (e.key === "Enter" && e.shiftKey) {
      // Shift+Enter: 改行後にtextarea高さを更新
      setTimeout(() => adjustTextarea(), 0);
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "#EBF5FB" }}>
      {/* ===== ヘッダー（LINE風グリーン） ===== */}
      <header
        className="flex-shrink-0 shadow-sm"
        style={{ background: "#06C755" }}
      >
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          {/* ロゴアバター */}
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <span className="text-[#06C755] text-base font-extrabold leading-none">PL</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-base leading-tight truncate">
              Partner-Link サポート
            </h1>
            <p className="text-green-100 text-xs truncate">
              代理店さんの活動を加速する AI アシスタント
            </p>
          </div>
          {/* メニュータグ */}
          <span className="flex-shrink-0 text-xs rounded-full bg-white/20 text-white px-3 py-1 font-medium">
            {menu.label}
          </span>
        </div>
      </header>

      {/* ===== チャットエリア ===== */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-3 py-4 space-y-1">

          {/* ウェルカムバブル（AIアバター付き） */}
          <AssistantBubble
            content={menu.greeting}
            timestamp={new Date()}
            references={[]}
            showEscalation={false}
            inquiryOpenFor={null}
            msgId="welcome"
            onOpenInquiry={() => {}}
            inquiryProps={null}
          />

          {/* クイックリプライ（初回のみ） */}
          {messages.length === 0 && (
            <div className="pl-11 flex flex-wrap gap-2 pt-1 pb-2">
              {menu.quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => void send(q)}
                  className="text-sm rounded-full border-2 border-[#06C755] text-[#06C755] bg-white hover:bg-green-50 px-4 py-1.5 font-medium transition-colors shadow-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* メッセージ一覧 */}
          {messages.map((m) => {
            if (m.role === "system") {
              return (
                <div key={m.id} className="flex justify-center py-2">
                  <div className="rounded-full bg-white/80 text-gray-500 px-4 py-1.5 text-xs shadow-sm border border-gray-200">
                    ✅ {m.content}
                  </div>
                </div>
              );
            }
            if (m.role === "user") {
              return (
                <div key={m.id} className="flex justify-end items-end gap-2 mb-1">
                  <span className="text-[10px] text-gray-400 mb-0.5 flex-shrink-0">
                    {formatTime(m.timestamp)}
                  </span>
                  <div
                    className="max-w-[75%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap shadow-sm"
                    style={{ background: "#06C755", color: "white" }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            }
            // assistant
            return (
              <AssistantBubble
                key={m.id}
                content={m.content}
                timestamp={m.timestamp}
                references={m.references ?? []}
                showEscalation={Boolean(m.showEscalation)}
                inquiryOpenFor={inquiryOpenFor}
                msgId={m.id}
                onOpenInquiry={() => openInquiryFor(m)}
                inquiryProps={
                  inquiryOpenFor === m.id
                    ? {
                        agentId: inquiryAgentId,
                        name: inquiryName,
                        email: inquiryEmail,
                        question: inquiryQuestion,
                        submitting: inquirySubmitting,
                        error: inquiryError,
                        onAgentIdChange: setInquiryAgentId,
                        onNameChange: setInquiryName,
                        onEmailChange: setInquiryEmail,
                        onQuestionChange: setInquiryQuestion,
                        onCancel: () => setInquiryOpenFor(null),
                        onSubmit: submitInquiry,
                      }
                    : null
                }
              />
            );
          })}

          {/* タイピングインジケーター */}
          {pending && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ===== 入力フッター ===== */}
      <footer className="flex-shrink-0 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="mx-auto max-w-2xl px-3 py-2.5 flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextarea();
            }}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="メッセージを入力..."
            className="flex-1 resize-none rounded-2xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            onClick={() => void send(input)}
            disabled={pending || !input.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 shadow-sm"
            style={{ background: input.trim() ? "#06C755" : "#ccc" }}
            aria-label="送信"
          >
            {/* 送信アイコン（紙飛行機） */}
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5 translate-x-0.5">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 pb-2">
          Shift+Enter で改行 / Enter で送信
        </p>
      </footer>
    </div>
  );
}

// ===== AIアシスタントバブルコンポーネント =====
type AssistantBubbleProps = {
  content: string;
  timestamp: Date;
  references: KnowledgeReference[];
  showEscalation: boolean;
  inquiryOpenFor: string | null;
  msgId: string;
  onOpenInquiry: () => void;
  inquiryProps: InquiryFormProps | null;
};

function AssistantBubble({
  content,
  timestamp,
  references,
  showEscalation,
  inquiryOpenFor,
  msgId,
  onOpenInquiry,
  inquiryProps,
}: AssistantBubbleProps) {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* アバター */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm self-end"
        style={{ background: "#06C755" }}
      >
        <span className="text-white text-xs font-bold">AI</span>
      </div>

      <div className="flex flex-col gap-1 max-w-[80%]">
        {/* メインバブル */}
        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100 text-sm text-gray-800 whitespace-pre-wrap">
          {content}

          {/* 参照元 */}
          {references.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-[11px] font-semibold text-gray-400 mb-1.5">参照元</p>
              <ul className="space-y-1">
                {references.map((ref, i) => (
                  <li key={i} className="text-xs">
                    {ref.url ? (
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#06C755] hover:underline break-all"
                      >
                        {refIcon(ref.kind)} {ref.label}
                      </a>
                    ) : (
                      <span className="text-gray-500">
                        {refIcon(ref.kind)} {ref.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* エスカレーションボタン or フォーム */}
          {showEscalation && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {inquiryOpenFor === msgId && inquiryProps ? (
                <InquiryForm {...inquiryProps} />
              ) : (
                <button
                  onClick={onOpenInquiry}
                  className="w-full rounded-xl text-white text-xs font-semibold px-4 py-2.5 transition-colors shadow-sm"
                  style={{ background: "#06C755" }}
                >
                  👤 担当者に繋ぐ（GPに直接質問）
                </button>
              )}
            </div>
          )}
        </div>

        {/* タイムスタンプ */}
        <span className="text-[10px] text-gray-400 pl-1">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
}

// ===== 問い合わせフォームコンポーネント =====
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
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-700">
        一次代理店（GP）への問い合わせ
      </p>

      <div>
        <label className="block text-[11px] text-gray-500 mb-1">一次代理店</label>
        <select
          value={props.agentId}
          onChange={(e) => props.onAgentIdChange(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.company} — {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] text-gray-500 mb-1">お名前 *</label>
        <input
          type="text"
          maxLength={200}
          value={props.name}
          onChange={(e) => props.onNameChange(e.target.value)}
          placeholder="山田 太郎"
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-[11px] text-gray-500 mb-1">メールアドレス *</label>
        <input
          type="email"
          maxLength={320}
          value={props.email}
          onChange={(e) => props.onEmailChange(e.target.value)}
          placeholder="example@email.com"
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div>
        <label className="block text-[11px] text-gray-500 mb-1">ご質問内容 *</label>
        <textarea
          rows={3}
          maxLength={5000}
          value={props.question}
          onChange={(e) => props.onQuestionChange(e.target.value)}
          className="block w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {props.error && (
        <p className="text-[11px] text-red-500">{props.error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={props.onSubmit}
          disabled={props.submitting}
          className="flex-1 rounded-xl text-white text-xs font-semibold py-2.5 disabled:opacity-40 transition-colors"
          style={{ background: "#06C755" }}
        >
          {props.submitting ? "送信中..." : "送信する"}
        </button>
        <button
          onClick={props.onCancel}
          disabled={props.submitting}
          className="rounded-xl border border-gray-300 text-gray-600 text-xs px-4 py-2.5"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AGENTS } from "@/constants/agents";
import { sanitizeTerms } from "@/constants/terms";

export const runtime = "nodejs";

type InquiryRequest = {
  agentId: string;
  customerName: string;
  customerEmail: string;
  question: string;
  sessionId?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const body = (await req.json()) as InquiryRequest;

  const { agentId, customerName, customerEmail, question, sessionId } = body;

  if (!agentId || !AGENTS.some((a) => a.id === agentId)) {
    return NextResponse.json({ error: "代理店の選択が必要です" }, { status: 400 });
  }
  if (!customerName?.trim() || customerName.length > 200) {
    return NextResponse.json(
      { error: "お名前を 200 文字以内でご入力ください" },
      { status: 400 }
    );
  }
  if (!customerEmail?.trim() || !EMAIL_RE.test(customerEmail) || customerEmail.length > 320) {
    return NextResponse.json(
      { error: "メールアドレスの形式をご確認ください" },
      { status: 400 }
    );
  }
  if (!question?.trim() || question.length > 5000) {
    return NextResponse.json(
      { error: "ご質問内容を 5000 文字以内でご入力ください" },
      { status: 400 }
    );
  }

  const safeQuestion = sanitizeTerms(question);

  try {
    const supabase = await createClient();
    await supabase.from("inquiries").insert({
      agent_id: agentId,
      customer_name: customerName,
      customer_email: customerEmail,
      question: safeQuestion,
      session_id: sessionId ?? null,
    });
  } catch {
    // DB 失敗時もユーザー体験は保つ（通知系はバッチで再送する想定）
  }

  const agent = AGENTS.find((a) => a.id === agentId)!;

  return NextResponse.json({
    ok: true,
    message: sanitizeTerms(
      `ありがとうございます。${agent.company}（${agent.name} 様）へお繋ぎしました。追って担当よりご連絡いたします。`
    ),
  });
}

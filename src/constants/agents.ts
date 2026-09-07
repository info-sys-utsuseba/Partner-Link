/**
 * エスカレーション時に選択いただく一次代理店（GP）のリスト。
 * 匿名化済みのサンプルデータ。本番では Supabase の `agents` テーブル等から取得する想定。
 */

export type Agent = {
  id: string;
  name: string;
  company: string;
};

export const AGENTS: Agent[] = [
  { id: "agent-a", name: "KATO", company: "代理店A" },
  { id: "agent-b", name: "YU-KI", company: "代理店B" },
  { id: "agent-c", name: "Jennie", company: "代理店C" },
  { id: "agent-d", name: "岡", company: "代理店D" },
  { id: "agent-e", name: "岡田", company: "代理店E" },
  { id: "agent-f", name: "杉本", company: "代理店F" },
  { id: "agent-g", name: "杉本", company: "代理店G" },
  { id: "agent-h", name: "田中", company: "代理店H" },
  { id: "agent-i", name: "河野", company: "代理店I（Link Intelligence 経由）" },
  { id: "agent-j", name: "鈴木", company: "代理店J" },
  { id: "agent-k", name: "みやび", company: "代理店K" },
  { id: "agent-l", name: "山里", company: "代理店L" },
  { id: "agent-m", name: "榊原", company: "代理店M" },
  { id: "agent-n", name: "Shizuka", company: "代理店N" },
  { id: "agent-o", name: "磯田", company: "代理店O" },
  { id: "agent-p", name: "佐々木", company: "代理店P" },
  { id: "agent-q", name: "中村", company: "代理店Q" },
  { id: "agent-r", name: "小林", company: "代理店R" },
  { id: "agent-s", name: "山田", company: "代理店S" },
  { id: "agent-t", name: "直接 UBM（一次代理店未選択）", company: "UBM Wealth" },
];

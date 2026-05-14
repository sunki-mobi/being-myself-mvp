import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { shapeToFullReport } from "@/lib/me/baseline-adapter";
import type { BaselineShape } from "@/lib/me/baseline-shape";
import { MeReportClient } from "./MeReportClient";
import type { AnswerCard } from "@/components/TodayAnswerCard";

/**
 * /me/report — "오늘의 답변" 보고서.
 *
 * Server에서 본인 baseline + qa_pair 전체 + answer_card join + daily_digest
 * 캐시 조회 후 KST 날짜별로 그룹화. 오늘 entry는 hero 카드, 이전 날짜들은
 * 더보기 토글 list로.
 *
 * baseline 없으면 /me로 (BaselineSelectClient 진입 화면).
 */

export type Digest = {
  summary: string;
  connections: { partTitle: string; itemTitle: string; note: string }[];
  tension: string;
  nextThread: string;
};

export type DayPair = {
  qaPairId: string;
  question: string;
  answer: string;
  createdAt: string;
  answerCard: AnswerCard | null;
};

export type DayEntry = {
  /** KST 기준 YYYY-MM-DD */
  date: string;
  /** "5/14 (수)" 같은 라벨 */
  label: string;
  /** question_index 순 정렬된 pair list */
  pairs: DayPair[];
  /** 캐시된 daily_digest.digest. 없으면 null (오늘이면 client에서 fetch). */
  digest: Digest | null;
};

function kstDateOf(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
}

function kstToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00+09:00");
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day} (${weekdays[d.getDay()]})`;
}

export default async function MeReportPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/report");

  const { data: baselineRow } = await supabase
    .from("baseline_report")
    .select("report")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!baselineRow) redirect("/me");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, email")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.display_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "친구";

  // qa_pair 전체 + answer_card · daily_digest 별도 조회 후 client-side merge.
  // join syntax(`answer_card(card)`)는 supabase의 inverse 1:1 추론에 의존
  // 하므로 안전하게 분리. 11명 규모라 query 3개 비용 무시 가능.
  const [qaRes, cardRes, digestRes] = await Promise.all([
    supabase
      .from("qa_pair")
      .select("id, question_text, answer_text, created_at, question_index")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("answer_card")
      .select("qa_pair_id, card")
      .eq("user_id", user.id),
    supabase
      .from("daily_digest")
      .select("digest_date, digest")
      .eq("user_id", user.id),
  ]);

  if (qaRes.error) {
    console.error("[/me/report] qa_pair query error:", qaRes.error.message);
  }
  if (cardRes.error) {
    console.warn(
      "[/me/report] answer_card query error:",
      cardRes.error.message,
    );
  }
  if (digestRes.error) {
    console.warn(
      "[/me/report] daily_digest query error (migration 008 미적용?):",
      digestRes.error.message,
    );
  }

  const qaRows = qaRes.data ?? [];
  const cardRows = cardRes.data ?? [];
  const digestRows = digestRes.data ?? [];

  const cardByQaPairId = new Map<string, AnswerCard>();
  for (const c of cardRows) {
    cardByQaPairId.set(c.qa_pair_id as string, c.card as AnswerCard);
  }

  // KST 날짜별 그룹화
  const dayMap = new Map<string, DayEntry>();

  for (const row of qaRows) {
    const date = kstDateOf(row.created_at as string);
    let entry = dayMap.get(date);
    if (!entry) {
      entry = {
        date,
        label: formatDayLabel(date),
        pairs: [],
        digest: null,
      };
      dayMap.set(date, entry);
    }
    entry.pairs.push({
      qaPairId: row.id as string,
      question: row.question_text as string,
      answer: row.answer_text as string,
      createdAt: row.created_at as string,
      answerCard: cardByQaPairId.get(row.id as string) ?? null,
    });
  }

  for (const row of digestRows) {
    const date = row.digest_date as string;
    let entry = dayMap.get(date);
    if (!entry) {
      entry = {
        date,
        label: formatDayLabel(date),
        pairs: [],
        digest: row.digest as Digest,
      };
      dayMap.set(date, entry);
    } else {
      entry.digest = row.digest as Digest;
    }
  }

  // 날짜 내림차순
  const days = Array.from(dayMap.values()).sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  const todayStr = kstToday();
  const today = days.find((d) => d.date === todayStr) ?? null;
  const history = days.filter((d) => d.date !== todayStr);

  const shape = baselineRow.report as BaselineShape;
  const baseline = shapeToFullReport(shape, { userName: displayName });

  return (
    <MeReportClient
      baseline={baseline}
      today={today}
      history={history}
    />
  );
}

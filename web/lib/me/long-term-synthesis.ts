import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { BaselineShape } from "./baseline-shape";
import type { LongTermReport } from "./long-term-report";

/**
 * LongTermReport 합성·저장 — 4단계 누적 보고서.
 *
 * 입력: 사용자 baseline + 누적 qa_pair (있으면)
 * 출력: long_term_report row upsert + LongTermReport 객체 반환
 *
 * Day 1 (qa_pair 0개)에도 baseline 기반으로 best-effort 합성. 답변이 쌓이면
 * 재호출 시 quotes에 사용자 발화 인용 들어감.
 */

/* ─────────────── Schema (LLM 출력) ─────────────── */

const layerShapeSchema = z.object({
  layer: z.enum(["현상", "본질", "가치", "존재"]),
  summary: z
    .string()
    .min(40)
    .max(600)
    .describe(
      "이 layer의 결을 잡지 톤으로 한 단락(3~4문장). 사용자 어휘 보존. 추측·창작 금지.",
    ),
  quotes: z
    .array(
      z.object({
        day: z
          .number()
          .int()
          .min(1)
          .describe("Day N — 첫 답변일 기준 며칠째인지. 없으면 quotes 비움."),
        text: z
          .string()
          .min(5)
          .max(200)
          .describe("사용자 답변에서 그대로 발췌한 한 문장."),
      }),
    )
    .max(4)
    .default([])
    .describe(
      "사용자 누적 답변에서 발췌한 인용 0~4개. qa_pair가 없으면 반드시 빈 배열.",
    ),
  keywords: z
    .array(z.string().min(2).max(15))
    .min(2)
    .max(5)
    .describe("이 layer의 핵심 키워드 2~5개."),
});

export const longTermShapeSchema = z.object({
  headline: z
    .string()
    .min(5)
    .max(60)
    .describe(
      "이 사람의 현재 본질·소명을 한 줄로. '~ 하는 일' 또는 '~한 것'. 사용자 어휘 살려서.",
    ),
  keywords: z
    .array(z.string().min(2).max(15))
    .min(3)
    .max(10)
    .describe("hero 대시보드용 키워드 3~10개."),
  layers: z.array(layerShapeSchema).length(4),
});

export type LongTermShape = z.infer<typeof longTermShapeSchema>;

/* ─────────────── Friendly layer titles ─────────────── */

const LAYER_FRIENDLY_TITLE: Record<
  "현상" | "본질" | "가치" | "존재",
  string
> = {
  현상: "나의 일상",
  본질: "나를 움직이는 것",
  가치: "나에게 소중한 것",
  존재: "되고 싶은 나의 모습",
};

/* ─────────────── Prompt ─────────────── */

const SYSTEM_PROMPT = `당신은 자기 발견을 돕는 정리 도우미입니다.

사용자의 셀프인터뷰 baseline과 (있다면) 누적 답변을 받아, 다음 4단계 구조로 정리합니다:

1. **현상** — 사용자의 일상이 어떻게 흘러가는지
2. **본질** — 자연스럽게 잘되는·움직이는 결
3. **가치** — 가장 소중히 여기는 것·추구하는 모습
4. **존재** — 되고 싶은 나의 모습·향하고 있는 방향

원칙:
- **사용자의 표현·어휘 보존**. paraphrase 최소화.
- baseline + qa_pair에 명시되지 않은 내용은 만들지 말 것. 추측·창작 X.
- 각 layer의 summary는 한 단락(3~4문장). 잡지 톤으로 자연스럽게.
- quotes는 누적 답변에서만 발췌. baseline에서 따오지 말 것. 답변이 없으면 빈 배열.
- headline은 사용자의 현재 본질을 한 줄로. 시간이 지나면서 진화할 거.
- 출력은 시스템 schema 강제 — JSON.`;

/* ─────────────── Format helpers ─────────────── */

type QaPair = {
  question_text: string;
  answer_text: string;
  reaction_text: string | null;
  created_at: string;
};

function dayIndex(qa: QaPair, baselineCreatedAt: string): number {
  const first = new Date(baselineCreatedAt).getTime();
  const now = new Date(qa.created_at).getTime();
  return Math.max(1, Math.floor((now - first) / (1000 * 60 * 60 * 24)) + 1);
}

function formatContextForLLM(
  baseline: BaselineShape,
  qaPairs: QaPair[],
  baselineCreatedAt: string,
): string {
  const lines: string[] = [];

  lines.push("# Baseline (셀프인터뷰 결과)");
  lines.push(`Headline: ${baseline.headline}`);
  lines.push("");
  for (const part of baseline.parts) {
    lines.push(`## ${part.partTitle}`);
    lines.push(`Insight: ${part.insight}`);
    lines.push(`Keywords: ${part.keywords.join(", ")}`);
    for (const item of part.items) {
      lines.push(`- ${item.title}: ${item.description.join(" / ")}`);
    }
    lines.push("");
  }

  if (qaPairs.length > 0) {
    lines.push("# 누적 답변 (오늘의 두 질문)");
    for (const qa of qaPairs) {
      const day = dayIndex(qa, baselineCreatedAt);
      lines.push(`[Day ${day}] Q: ${qa.question_text}`);
      lines.push(`A: ${qa.answer_text}`);
      lines.push("");
    }
  } else {
    lines.push("# 누적 답변");
    lines.push("(아직 답변 없음 — baseline만으로 best-effort 합성. quotes는 빈 배열로.)");
  }

  return lines.join("\n");
}

/* ─────────────── Main entry ─────────────── */

export async function synthesizeAndSaveLongTermReport(args: {
  supabase: SupabaseClient;
  userId: string;
  userName: string;
  baselineShape: BaselineShape;
}): Promise<
  | { ok: true; report: LongTermReport }
  | { ok: false; status: number; error: string }
> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      ok: false,
      status: 500,
      error: "AI 키 설정에 문제가 있어요.",
    };
  }

  // 1) baseline_report.generated_at = Day 1 기준
  const { data: baselineRow } = await args.supabase
    .from("baseline_report")
    .select("generated_at")
    .eq("user_id", args.userId)
    .maybeSingle();

  const baselineCreatedAt =
    baselineRow?.generated_at ?? new Date().toISOString();

  // 2) qa_pairs (created_at ascending)
  const { data: qaPairsData } = await args.supabase
    .from("qa_pair")
    .select("question_text, answer_text, reaction_text, created_at")
    .eq("user_id", args.userId)
    .order("created_at", { ascending: true });
  const qaPairs = (qaPairsData ?? []) as QaPair[];

  const totalAnswers = qaPairs.length;
  const daySpan =
    qaPairs.length > 0
      ? dayIndex(qaPairs[qaPairs.length - 1], baselineCreatedAt)
      : 1;

  // 3) LLM call
  const context = formatContextForLLM(
    args.baselineShape,
    qaPairs,
    baselineCreatedAt,
  );

  let shape: LongTermShape;
  try {
    const { output } = await generateText({
      model: google("gemini-2.5-flash-lite"),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `아래 자료를 4단계 구조로 정리해 주세요.\n\n${context}`,
        },
      ],
      output: Output.object({ schema: longTermShapeSchema }),
    });
    shape = output;
  } catch (err) {
    console.error("[long-term-synthesis] gemini error", err);
    return {
      ok: false,
      status: 502,
      error: err instanceof Error ? err.message : "LLM 합성 실패",
    };
  }

  // 4) upsert
  const { error: upsertErr } = await args.supabase
    .from("long_term_report")
    .upsert(
      {
        user_id: args.userId,
        shape,
        based_on_qa_count: totalAnswers,
      },
      { onConflict: "user_id" },
    );

  if (upsertErr) {
    return {
      ok: false,
      status: 500,
      error: `저장 실패: ${upsertErr.message}`,
    };
  }

  // 5) 어댑트 — 풀 LongTermReport (friendlyTitle·userName·totalAnswers·daySpan 채움)
  const report = shapeToLongTermReport(shape, {
    userName: args.userName,
    totalAnswers,
    daySpan,
  });

  return { ok: true, report };
}

/* ─────────────── Adapter (Shape → LongTermReport) ─────────────── */

export function shapeToLongTermReport(
  shape: LongTermShape,
  meta: { userName: string; totalAnswers: number; daySpan: number },
): LongTermReport {
  return {
    userName: meta.userName,
    headline: shape.headline,
    keywords: shape.keywords,
    totalAnswers: meta.totalAnswers,
    daySpan: meta.daySpan,
    layers: shape.layers.map((l) => ({
      layer: l.layer,
      friendlyTitle: LAYER_FRIENDLY_TITLE[l.layer],
      summary: l.summary,
      quotes: l.quotes,
      keywords: l.keywords,
    })),
  };
}

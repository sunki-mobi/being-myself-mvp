import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOTAL_STEPS } from "@/lib/me/baseline-interview-questions";
import type { InterviewAnswers } from "@/lib/me/baseline-interview-questions";
import { InterviewClient } from "./InterviewClient";

/**
 * /me/baseline/interview — Phase 3b 셀프인터뷰 본 흐름.
 *
 * Server component에서 user + baseline + progress 조회 후 client island로
 * 진행 상태 주입. baseline 이미 있으면 /me로 redirect.
 *
 * 이탈해서 다시 들어오면 progress의 current_step부터 이어서 시작.
 * 완료(step === TOTAL_STEPS) 상태에서 들어와도 InterviewClient가 완료 화면 표시.
 */
export default async function BaselineInterviewPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/baseline/interview");

  // 이미 baseline 만들었다면 /me로
  const { data: baseline } = await supabase
    .from("baseline_report")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (baseline) redirect("/me");

  // 진행 상태 가져오기 (없으면 새 진행)
  const { data: progress } = await supabase
    .from("baseline_interview_progress")
    .select("current_step, answers")
    .eq("user_id", user.id)
    .maybeSingle();

  const initialStep = Math.min(progress?.current_step ?? 0, TOTAL_STEPS);
  const initialAnswers = (progress?.answers ?? {}) as InterviewAnswers;

  return (
    <InterviewClient initialStep={initialStep} initialAnswers={initialAnswers} />
  );
}

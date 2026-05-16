import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewDiaryClient } from "./NewDiaryClient";

/**
 * /me/diary/new — 오늘 소명일기 작성.
 *
 * Server component에서 사용자 + 오늘 기존 entry 조회. 이미 작성한 entry가
 * 있으면 그 데이터를 client에 주입해 "수정" 모드로 진입. 없으면 paste 단계
 * 부터 시작.
 */
export default async function DiaryNewPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/diary/new");

  const today = new Date().toISOString().slice(0, 10);
  const [existingRes, goalRes] = await Promise.all([
    supabase
      .from("somyeong_entries")
      .select(
        "evening_report_text, contribution_flow, ai_question, ai_question_source, answer, free_note",
      )
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .maybeSingle(),
    supabase
      .from("somyeong_user_okr")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);

  const existing = existingRes.data;
  const hasGoal = Boolean(goalRes.data);

  return (
    <NewDiaryClient
      hasGoal={hasGoal}
      existing={
        existing
          ? {
              eveningReport: existing.evening_report_text,
              contributionFlow: existing.contribution_flow as Record<
                string,
                unknown
              >,
              aiQuestion: existing.ai_question ?? "",
              aiQuestionSource: existing.ai_question_source ?? "",
              answer: existing.answer ?? "",
              freeNote: existing.free_note ?? "",
            }
          : null
      }
    />
  );
}

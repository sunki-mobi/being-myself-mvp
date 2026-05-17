import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConversationPageClient } from "./ConversationPageClient";

/**
 * /me/conversation — 본인 매일 두 질문 트랙.
 *
 * server에서 인증 + KST 오늘 qa_pair count 조회. LocalStorage state와 mismatch
 * 시(예: DB 비웠는데 LocalStorage가 isComplete=true) client mount 시 자동
 * reset해서 새 세션 시작 가능.
 */
export default async function MeConversationPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/conversation");

  const todayKst = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Seoul",
  });
  const startKst = `${todayKst}T00:00:00+09:00`;
  const endKst = `${todayKst}T23:59:59.999+09:00`;
  const { count } = await supabase
    .from("qa_pair")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startKst)
    .lte("created_at", endKst);

  return <ConversationPageClient todayQaCount={count ?? 0} />;
}

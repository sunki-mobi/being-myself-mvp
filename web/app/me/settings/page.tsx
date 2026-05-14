import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * /me/settings — 설정 hub.
 *
 * 현재 카드 1개("내 목표"). 향후 알람·언어 등 추가 가능 layout.
 * server component (auth check).
 */
export default async function MeSettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/me/settings");

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

  const cards: {
    key: string;
    badge: string;
    title: string;
    sub: string;
    href: string;
    bgImage: string;
    textTone: "light" | "dark";
  }[] = [
    {
      key: "goal",
      badge: "# 비교 기준",
      title: "내 목표",
      sub: "OKR · KPI · 분기 목표 등을 적어두면 일기 합성에 반영해요",
      href: "/me/settings/goal",
      bgImage: "/img/list/lavender-purple.svg",
      textTone: "light",
    },
  ];

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        <header className="px-6 pt-10 pb-2 animate-fade-up">
          <Link
            href="/me"
            aria-label="홈으로"
            className="inline-flex w-9 h-9 -ml-2 items-center justify-center rounded-md text-fg-light hover:bg-surface-card transition-colors no-select"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <p className="mt-5 text-xs font-medium text-fg-light-soft">
            {displayName}님의 설정
          </p>
          <h1 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light">
            설정
          </h1>
        </header>

        <section className="flex-1 px-6 py-8 flex flex-col gap-1.5">
          {cards.map((c, idx) => (
            <Link
              key={c.key}
              href={c.href}
              prefetch
              className={`relative block no-select active:scale-[0.99] transition-transform animate-fade-up-delay-${
                Math.min(idx, 3) + 1
              }`}
              style={{
                padding: "20px 32px 22px 28px",
                backgroundImage: `url('${c.bgImage}')`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
                backgroundColor: "transparent",
                minHeight: 132,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide mb-1.5 ${
                      c.textTone === "light"
                        ? "bg-white/15 text-white"
                        : "bg-white/60 text-fg-light"
                    }`}
                  >
                    {c.badge}
                  </span>
                  <h2
                    className={`text-base font-bold leading-snug mb-0.5 ${
                      c.textTone === "light" ? "text-white" : "text-fg-light"
                    }`}
                  >
                    {c.title}
                  </h2>
                  <p
                    className={`text-xs leading-relaxed ${
                      c.textTone === "light"
                        ? "text-white/80"
                        : "text-fg-light/75"
                    }`}
                  >
                    {c.sub}
                  </p>
                </div>
                <span
                  aria-hidden
                  className={`text-xl mt-1 ${
                    c.textTone === "light"
                      ? "text-white/80"
                      : "text-fg-light/75"
                  }`}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}

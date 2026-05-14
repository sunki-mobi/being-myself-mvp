"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StageContainer } from "@/components/StageContainer";
import { PrimaryButton } from "@/components/PrimaryButton";

/**
 * /auth/sign-up — 이메일·비번 회원가입.
 *
 * Supabase 대시보드에서 Confirm email 옵션:
 *  - OFF (dev 권장): signUp 즉시 세션 생성 → /me로
 *  - ON (운영): signUp 후 메일 발송 → 메일 링크 클릭 → /auth/callback 진입
 *    → 세션 생성 → /me로
 */
export default function SignUpPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = agreeTerms && agreePrivacy && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) {
      setError("이용약관과 개인정보 처리방침에 모두 동의해야 가입할 수 있어요.");
      return;
    }
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/me`,
        data: {
          display_name: displayName.trim() || null,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // session 즉시 생성됐으면 (Confirm email OFF) /me로 진입
    if (data.session) {
      router.push("/me");
      router.refresh();
      return;
    }

    // Confirm email ON 케이스 — 메일 확인 안내
    setPendingVerification(true);
    setLoading(false);
  }

  if (pendingVerification) {
    return (
      <StageContainer variant="light">
        <div className="flex-1 flex flex-col justify-center text-center animate-fade-up">
          <h1 className="text-2xl font-bold mb-3">이메일을 확인해주세요</h1>
          <p className="text-sm text-fg-light-soft leading-relaxed">
            <strong>{email}</strong> 로 인증 메일을 보냈어요.
            <br />
            메일 안의 링크를 클릭하면 가입이 완료돼요.
          </p>
        </div>
      </StageContainer>
    );
  }

  return (
    <StageContainer variant="light">
      <div className="flex-1 flex flex-col">
        <div className="animate-fade-up">
          <p className="text-sm text-fg-light-soft mb-3">처음 만나서 반가워요</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            회원가입
          </h1>
          <p className="text-sm text-fg-light-soft leading-relaxed mt-3">
            이메일과 비밀번호만 있으면 시작할 수 있어요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 animate-fade-up-delay-1"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-light-soft">이름 (선택)</span>
            <input
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="어떻게 부르면 좋을까요?"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-light-soft">이메일</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg-light-soft">
              비밀번호 (6자 이상)
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </label>

          {/* 동의 체크박스 */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand-500 cursor-pointer"
              />
              <span className="text-xs text-fg-light-soft leading-relaxed">
                <Link
                  href="/legal/terms"
                  target="_blank"
                  className="text-brand-600 underline-offset-4 hover:underline"
                >
                  이용약관
                </Link>
                에 동의합니다.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-brand-500 cursor-pointer"
              />
              <span className="text-xs text-fg-light-soft leading-relaxed">
                <Link
                  href="/legal/privacy"
                  target="_blank"
                  className="text-brand-600 underline-offset-4 hover:underline"
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다. (답변이 AI 정리에 사용돼요)
              </span>
            </label>
          </div>

          {error ? (
            <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
              {error}
            </p>
          ) : null}

          <PrimaryButton type="submit" disabled={!canSubmit} className="mt-2">
            {loading ? "가입 중…" : "가입하기"}
          </PrimaryButton>
        </form>

        <p className="mt-8 text-sm text-fg-light-soft text-center animate-fade-up-delay-2">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/auth/sign-in"
            className="text-brand-600 font-semibold underline-offset-4 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </StageContainer>
  );
}

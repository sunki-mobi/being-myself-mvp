"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { StageContainer } from "@/components/StageContainer";
import { PrimaryButton } from "@/components/PrimaryButton";

/**
 * /auth/sign-in — 이메일·비번 로그인.
 *
 * 성공 시 ?next=<path>로 이동, 없으면 /me로. 미들웨어가 이미 로그인 사용자
 * 진입 시 /me로 redirect 처리.
 */
export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/me";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <StageContainer variant="light">
      <div className="flex-1 flex flex-col">
        <div className="animate-fade-up">
          <p className="text-sm text-fg-light-soft mb-3">반갑습니다</p>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            로그인
          </h1>
          <p className="text-sm text-fg-light-soft leading-relaxed mt-3">
            이메일과 비밀번호로 들어가세요.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 flex flex-col gap-4 animate-fade-up-delay-1"
        >
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
            <span className="text-xs font-medium text-fg-light-soft">비밀번호</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-4 py-3 rounded-[12px] border border-border-line bg-surface-paper text-fg-light focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            />
          </label>

          {error ? (
            <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px]">
              {error}
            </p>
          ) : null}

          <PrimaryButton type="submit" disabled={loading} className="mt-2">
            {loading ? "로그인 중…" : "로그인"}
          </PrimaryButton>
        </form>

        <p className="mt-8 text-sm text-fg-light-soft text-center animate-fade-up-delay-2">
          처음 오셨나요?{" "}
          <Link
            href="/auth/sign-up"
            className="text-brand-600 font-semibold underline-offset-4 hover:underline"
          >
            회원가입
          </Link>
        </p>
      </div>
    </StageContainer>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useConversation } from "@/lib/conversation";

/**
 * /me landing — 디자인 토큰(README) 기반 hero + 콘텐츠 카드.
 *
 * 라우팅·데이터는 유지. 시각만:
 *  - Hero 우측 부채꼴 4-card stack 일러스트 (순수 CSS)
 *  - "{name}님을 위한 추천 컨텐츠" 섹션 헤더
 *  - ContentCard available variant 통일 (mint→lavender 그라데이션 + 광원)
 *  - 푸터 위 디바이더
 *
 * useConversation login 호출 유지 — 다른 페이지가 LocalStorage userName 의존.
 */
export function MeLandingClient({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const { state, hydrated, login } = useConversation();

  useEffect(() => {
    if (hydrated && state.userName !== displayName) {
      login(displayName);
    }
  }, [hydrated, state.userName, displayName, login]);

  if (!hydrated) {
    return <main className="min-h-screen w-full bg-[#f6f4fb]" />;
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30">
        {/* ─── HERO ─── */}
        <header
          className="gradient-hero text-fg-dark px-6 pt-10 rounded-b-[2rem] relative overflow-hidden animate-fade-up"
          style={{ height: 240 }}
        >
          <form
            action="/auth/sign-out"
            method="POST"
            className="absolute top-4 right-4 z-20"
          >
            <button
              type="submit"
              aria-label="로그아웃"
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/20 transition-colors"
              title="로그아웃"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-fg-dark-soft"
                aria-hidden
              >
                <path
                  d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className="relative z-10 w-3/5">
            <p
              style={{
                color: "rgba(255,255,253,0.55)",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              {displayName}님, 안녕하세요
            </p>
            <h1
              className="mt-2 leading-tight tracking-tight"
              style={{ color: "#FFFFFD" }}
            >
              <span style={{ fontWeight: 500, fontSize: 22 }}>
                소명대로 일하는 도구,
              </span>
              <br />
              <span style={{ fontWeight: 800, fontSize: 28 }}>Being</span>
            </h1>
          </div>

          <HeroIllust />
        </header>

        {/* ─── 섹션 헤더 ─── */}
        <p
          className="mb-5"
          style={{
            marginTop: 16 + 32,
            paddingLeft: 24,
            paddingRight: 24,
            fontFamily: "var(--font-sans)",
          }}
        >
          <span style={{ color: "#8948DD", fontWeight: 800, fontSize: 18 }}>
            {displayName}
          </span>
          <span style={{ color: "#1E1A34", fontWeight: 700, fontSize: 18 }}>
            님을 위한 추천 컨텐츠
          </span>
        </p>

        {/* ─── ContentCard list ─── */}
        <section className="flex-1 px-6 py-8 flex flex-col gap-3">
          <ContentCard
            href="/me/do"
            tag="# 오늘"
            title="오늘 할 일"
            preview="Being myself · 소명일기"
            delayClass="animate-fade-up-delay-1"
            bgImage="/img/list/mint-lavender.svg"
            textTone="dark"
          />
          <ContentCard
            href="/me/reports"
            tag="# 내 모습"
            title="내 보고서"
            preview="셀프인터뷰 보고서 · 4단계 누적 · 소명일기 누적"
            delayClass="animate-fade-up-delay-2"
            bgImage="/img/list/paper.svg"
            textTone="dark"
          />
        </section>

        {/* ─── 푸터 ─── */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 32,
            paddingLeft: 24,
            paddingRight: 24,
            paddingBottom: 24,
            borderTop: "1px solid #F4F2F4",
          }}
        >
          <p
            className="text-center"
            style={{
              fontSize: 12,
              color: "#55575C",
              fontFamily: "var(--font-sans)",
            }}
          >
            {email ? `${email} · ` : ""}© 2026 MOBINITY. All Rights Reserved.
          </p>
        </div>
      </div>
    </main>
  );
}

/* ─────────────── Hero illust — 4장 카드 부채꼴 ─────────────── */

function HeroIllust() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right: -20,
        top: "50%",
        transform: "translateY(-50%)",
        width: 240,
        height: 200,
        pointerEvents: "none",
      }}
    >
      <DeckCard
        z={1}
        rotate={-12}
        translateY={10}
        bg="linear-gradient(180deg, #C6EDF5 0%, #FFFFFD 100%)"
        label="셀프인터뷰"
        labelColor="#1E1A34"
        left={28}
      />
      <DeckCard
        z={2}
        rotate={-4}
        translateY={4}
        bg="rgba(255,255,253,0.95)"
        label="소명일기"
        labelColor="#1E1A34"
        left={72}
      />
      <DeckCard
        z={3}
        rotate={4}
        translateY={4}
        bg="linear-gradient(160deg, #E5ADFF 0%, #C6B0F2 100%)"
        labelColor="#FFFFFD"
        left={114}
      />
      <DeckCard
        z={4}
        rotate={12}
        translateY={10}
        bg="linear-gradient(160deg, #8948DD 0%, #6D2EC2 100%)"
        labelColor="#FFFFFD"
        left={154}
      />
    </div>
  );
}

function DeckCard({
  z,
  rotate,
  translateY,
  bg,
  label,
  labelColor,
  left,
}: {
  z: number;
  rotate: number;
  translateY: number;
  bg: string;
  label?: string;
  labelColor: string;
  left: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: 30,
        width: 70,
        height: 132,
        borderRadius: 12,
        padding: 12,
        background: bg,
        boxShadow: "0 8px 16px rgba(0,0,0,0.25)",
        transform: `rotate(${rotate}deg) translateY(${translateY}px)`,
        transformOrigin: "center bottom",
        zIndex: z,
      }}
    >
      {label ? (
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 700,
            fontSize: 11,
            color: labelColor,
            letterSpacing: "-0.01em",
            display: "block",
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}

/* ─────────────── ContentCard (available) ─────────────── */

function ContentCard({
  href,
  tag,
  title,
  preview,
  delayClass,
  bgImage,
  textTone = "dark",
  variant = "available",
}: {
  href: string;
  tag: string;
  title: string;
  preview: string;
  delayClass: string;
  bgImage: string;
  textTone?: "light" | "dark";
  variant?: "available" | "locked";
}) {
  const isLocked = variant === "locked";
  const isLight = textTone === "light";
  return (
    <Link
      href={isLocked ? "#" : href}
      prefetch={!isLocked}
      aria-disabled={isLocked || undefined}
      tabIndex={isLocked ? -1 : undefined}
      onClick={isLocked ? (e) => e.preventDefault() : undefined}
      className={`relative block no-select ${delayClass}`}
      style={{
        // /me/reports list 카드와 동일 padding/minHeight — 사용자가
        // "맞는 디자인"으로 확정한 값.
        // anchor 기본 inline → display:block + width:100% inline 강제.
        display: "block",
        width: "100%",
        padding: "20px 32px 22px 28px",
        backgroundImage: `url('${isLocked ? "/img/card/locked.svg" : bgImage}')`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundColor: "transparent",
        minHeight: 132,
        opacity: isLocked ? 0.95 : 1,
        pointerEvents: isLocked ? "none" : "auto",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide mb-2 ${
              isLight
                ? "bg-white/20 text-white backdrop-blur-sm"
                : "bg-white/70 text-purple-deep"
            }`}
          >
            {tag}
          </span>
          <h2
            className={`text-lg font-extrabold leading-snug mb-1 tracking-[-0.015em] ${
              isLight ? "text-white" : "text-fg-light"
            }`}
          >
            {title}
          </h2>
          <p
            className={`text-sm leading-relaxed line-clamp-2 ${
              isLight ? "text-white/85" : "text-fg-light/85"
            }`}
          >
            {preview}
          </p>
        </div>
        <span
          aria-hidden
          className={`text-2xl mt-1 ${
            isLight ? "text-white/85" : "text-fg-light/70"
          }`}
        >
          →
        </span>
      </div>
    </Link>
  );
}

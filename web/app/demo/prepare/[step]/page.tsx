"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type ReactNode } from "react";

/**
 * Discover · 준비단계 온보딩 (O1-2 ~ O4-2)
 *
 * 게스트가 "체험해보기" 버튼(/)을 누른 뒤 페르소나 선택(/demo) 전에 거치는
 * 4-step 안내 화면. 시간·공간·목소리·기록 4가지 마음가짐을 잡아준다.
 *
 * 진입: `/` → `/demo/prepare/1`
 * 종료: `/demo/prepare/4` → `/demo` (페르소나 선택)
 */

type StepConfig = {
  /** 제목 — 줄바꿈 단위로 분리 */
  title: string[];
  illustration: string;
  illustrationAlt: string;
  /** bold 강조 1줄 + 본문 N줄 */
  description: { bold: string; rest: string[] };
  cta: string;
};

const STEPS: StepConfig[] = [
  {
    title: ["혼자만의 ‘시간’을", "준비해주세요"],
    illustration: "/img/prepare/step-1-clock.svg",
    illustrationAlt: "회중시계 일러스트",
    description: {
      bold: "셀프인터뷰의 평균 소요시간은 약 5분이지만,",
      rest: [
        "개인에 따라 15~20분을 하기도 해요.",
        "시간에 구애받지 않고 몰입해 봐요.",
      ],
    },
    cta: "준비됐어요!",
  },
  {
    title: ["혼자만의 ‘공간’을", "준비해주세요"],
    illustration: "/img/prepare/step-2-house.svg",
    illustrationAlt: "작은 집과 나무 일러스트",
    description: {
      bold: "방해받지 않는 조용한 환경은",
      rest: [
        "나의 내면 깊은 이야기들을 꺼내는데",
        "도움이 될 거에요.",
      ],
    },
    cta: "네, 준비됐어요!",
  },
  {
    title: ["차분하고 낮은 ‘목소리’로", "떠오르는 것을 답해보세요"],
    illustration: "/img/prepare/step-3-voice.svg",
    illustrationAlt: "말풍선과 옆모습 일러스트",
    description: {
      bold: "글로 적거나 말로 답해도 괜찮아요!",
      rest: [
        "의식의 흐름대로 말하다보면",
        "내 본심에 더 가까워질거에요.",
      ],
    },
    cta: "이해했어요!",
  },
  {
    title: ["나를 발견하는 기록이", "쌓여가요"],
    illustration: "/img/prepare/step-4-review.svg",
    illustrationAlt: "보고서를 살피는 일러스트",
    description: {
      bold: "답변한 내용은 나만의 보고서로 정리돼요.",
      rest: [
        "하루하루 쌓일수록 내가 어떤 사람인지",
        "조금씩 선명해질 거에요.",
      ],
    },
    cta: "시작할게요!",
  },
];

const TOTAL = STEPS.length;

export default function PreparePage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = use(params);
  const router = useRouter();
  const n = parseInt(step, 10);
  const valid = !Number.isNaN(n) && n >= 1 && n <= TOTAL;

  // 잘못된 step (예: /demo/prepare/9) → step 1로 보정
  useEffect(() => {
    if (!valid) router.replace("/demo/prepare/1");
  }, [valid, router]);

  if (!valid) return null;

  const idx = n - 1;
  const config = STEPS[idx];

  function goBack() {
    if (n === 1) router.push("/");
    else router.push(`/demo/prepare/${n - 1}`);
  }

  function goNext() {
    if (n === TOTAL) router.push("/demo");
    else router.push(`/demo/prepare/${n + 1}`);
  }

  return (
    <main className="min-h-screen w-full flex justify-center bg-surface-paper lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col bg-surface-paper text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 overflow-hidden">
        {/* 상단: 뒤로가기 + 진행바 */}
        <header className="px-6 pt-8 animate-fade-up">
          <button
            type="button"
            onClick={goBack}
            aria-label="뒤로 가기"
            className="w-9 h-9 -ml-2 flex items-center justify-center rounded-md text-fg-light hover:bg-surface-card active:bg-surface-card transition-colors no-select"
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
          </button>

          <ProgressBar step={n} total={TOTAL} />
        </header>

        {/* 본문 */}
        <section className="flex-1 flex flex-col px-6 pt-10 pb-8">
          <h1
            key={`title-${n}`}
            className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-fg-light animate-fade-up-delay-1"
          >
            {config.title.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
          </h1>

          <div className="flex-1 flex items-center justify-center my-8 animate-fade-up-delay-2">
            <Image
              src={config.illustration}
              alt={config.illustrationAlt}
              width={220}
              height={180}
              priority
              className="max-w-[220px] w-full h-auto"
            />
          </div>

          <div className="text-[13.5px] leading-[1.8] text-fg-light-soft animate-fade-up-delay-3">
            <p className="font-bold text-fg-light">{config.description.bold}</p>
            {config.description.rest.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </section>

        {/* 하단 CTA — 카드 하단에 붙음 (desktop은 카드 모서리에 맞춰 둥글게) */}
        <CTAButton onClick={goNext}>{config.cta}</CTAButton>
      </div>
    </main>
  );
}

/** 라운드 4분할 progress bar — step 변경 시 width 트랜지션(300ms ease-out) */
function ProgressBar({ step, total }: { step: number; total: number }) {
  // 이전 step에서 진입할 때 width 애니메이션이 자연스럽게 보이도록
  // mount 직후 한 프레임 뒤에 목표값으로 설정.
  const target = (step / total) * 100;
  const prev = ((step - 1) / total) * 100;
  const [width, setWidth] = useState(prev);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);

  return (
    <div className="mt-5">
      <div className="h-2 w-full rounded-full bg-[#E5E5EA] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#C6D5F5] transition-[width] duration-300 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="text-right text-xs text-fg-light-soft mt-1.5">
        {step}/{total}
      </p>
    </div>
  );
}

function CTAButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full py-5 bg-[#DCE7F7] hover:brightness-95 active:brightness-90 text-fg-light text-base font-semibold transition-[filter] no-select lg:rounded-b-3xl"
    >
      <span className="block text-center">{children}</span>
      <span
        aria-hidden
        className="absolute right-6 top-1/2 -translate-y-1/2 text-fg-light"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </span>
    </button>
  );
}

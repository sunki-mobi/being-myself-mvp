"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PrepareStage } from "@/components/PrepareStage";
import { TOTAL_PREPARE_STEPS } from "@/lib/me/prepare-steps";

/**
 * /demo/prepare/[step] — 박람회 데모 prepare 안내 (deprecated).
 *
 * 현재 랜딩의 "체험해보기"는 /demo 직진으로 변경됐기 때문에 이 라우트는 더
 * 이상 자동 진입 경로가 아님. 직접 URL 진입은 여전히 동작 (PrepareStage 재사용).
 *
 * 신규 사용자 셀프인터뷰 prepare는 /me/baseline/prepare에서 처리.
 */
export default function DemoPreparePage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = use(params);
  const router = useRouter();
  const n = parseInt(step, 10);
  const valid = !Number.isNaN(n) && n >= 1 && n <= TOTAL_PREPARE_STEPS;

  useEffect(() => {
    if (!valid) router.replace("/demo/prepare/1");
  }, [valid, router]);

  if (!valid) return null;

  function goBack() {
    if (n === 1) router.push("/");
    else router.push(`/demo/prepare/${n - 1}`);
  }

  function goNext() {
    router.push(`/demo/prepare/${n + 1}`);
  }

  function goComplete() {
    router.push("/demo");
  }

  return (
    <PrepareStage
      step={n}
      onBack={goBack}
      onNext={goNext}
      onComplete={goComplete}
    />
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrepareStage } from "@/components/PrepareStage";
import { TOTAL_PREPARE_STEPS } from "@/lib/me/prepare-steps";

/**
 * /me/baseline/prepare client island.
 *
 * - 일반 step: 단순히 다음 step으로 push.
 * - 마지막 step: prepare_seen 마킹 API 호출 → /me/baseline/interview로 이동.
 */
export function PrepareWrapper({ step }: { step: number }) {
  const router = useRouter();
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goBack() {
    if (step === 1) router.push("/me");
    else router.push(`/me/baseline/prepare/${step - 1}`);
  }

  function goNext() {
    router.push(`/me/baseline/prepare/${step + 1}`);
  }

  async function goComplete() {
    setError(null);
    setCompleting(true);
    try {
      const res = await fetch("/api/me/prepare-seen", { method: "POST" });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        setError(detail?.error ?? "준비 표시에 실패했어요.");
        setCompleting(false);
        return;
      }
      router.push("/me/baseline/interview");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "네트워크 오류");
      setCompleting(false);
    }
  }

  return (
    <>
      <PrepareStage
        step={step}
        onBack={goBack}
        onNext={goNext}
        onComplete={goComplete}
        completeCtaLoading={completing && step === TOTAL_PREPARE_STEPS}
      />
      {error ? (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md w-full px-6">
          <p className="text-sm text-record bg-record/5 px-3 py-2 rounded-[8px] text-center">
            {error}
          </p>
        </div>
      ) : null}
    </>
  );
}

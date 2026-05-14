/**
 * /me/* 라우트 전환 시 자동 Suspense fallback.
 *
 * Next.js가 navigation 트리거 즉시 이걸 보여주고, server component가
 * 준비되면 실제 컴포넌트로 교체. 빈 화면 답답함 ↓ + 라우팅 응답 ↑.
 */
export default function MeLoading() {
  return (
    <main className="min-h-screen w-full flex justify-center items-center bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]">
      <div className="w-full max-w-md flex flex-col items-center justify-center bg-surface-light text-fg-light lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:shadow-xl lg:shadow-brand-200/30 px-6 py-12 text-center gap-4">
        <div className="flex gap-1.5">
          <span
            className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
        <p className="text-xs text-fg-light-muted">잠시만요…</p>
      </div>
    </main>
  );
}

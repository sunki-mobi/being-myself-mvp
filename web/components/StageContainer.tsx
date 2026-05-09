import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "light" | "dark";
  className?: string;
};

/**
 * iPad portrait를 기본 가정한 공통 컨테이너.
 * - 모바일: 폭 가득
 * - 태블릿/iPad portrait (lg+): max-w-md 카드 형태로 중앙 정렬, 양쪽에 부드러운 라벤더 배경
 * - 안전 영역: 상하 padding 충분히
 */
export function StageContainer({
  children,
  variant = "light",
  className = "",
}: Props) {
  const outerBg =
    variant === "dark"
      ? "bg-surface-dark"
      : "bg-[#f6f4fb] lg:bg-gradient-to-b lg:from-[#f6f4fb] lg:to-[#ece8f5]";

  const innerBg =
    variant === "dark"
      ? "bg-surface-dark text-fg-dark"
      : "bg-surface-light text-fg-light lg:shadow-xl lg:shadow-brand-200/30";

  const innerWrap = "w-full max-w-md flex flex-col px-6 pt-10 pb-10 sm:pt-14 lg:rounded-3xl lg:my-8 lg:min-h-[820px] lg:px-8 lg:pt-16 lg:pb-12";

  return (
    <main
      className={`min-h-screen w-full flex justify-center ${outerBg} ${className}`}
    >
      <div className={`${innerWrap} ${innerBg}`}>{children}</div>
    </main>
  );
}

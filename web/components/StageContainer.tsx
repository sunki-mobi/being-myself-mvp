import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "light" | "dark";
  className?: string;
};

/**
 * iPad portrait를 기본 가정한 공통 컨테이너.
 * - 폭은 화면 가득 (모바일도 OK), 가독성을 위해 max-w-md 정도 안쪽
 * - 상하 padding은 안전 영역 고려
 */
export function StageContainer({
  children,
  variant = "light",
  className = "",
}: Props) {
  const bg = variant === "dark" ? "bg-surface-dark text-fg-dark" : "bg-surface-light text-fg-light";
  return (
    <main
      className={`min-h-screen w-full flex justify-center ${bg} ${className}`}
    >
      <div className="w-full max-w-md flex flex-col px-6 pt-10 pb-10 sm:pt-14">
        {children}
      </div>
    </main>
  );
}

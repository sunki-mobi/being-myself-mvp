type Props = {
  /** 0..1 사이 값 — 0이면 0%, 1이면 100% */
  value: number;
  /** 우측 라벨 — 예: "1/2" */
  label?: string;
};

export function ProgressBar({ value, label }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="w-full flex items-center gap-3 mb-6">
      <div className="flex-1 h-1 bg-surface-card rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <span className="text-sm text-fg-light-soft tabular-nums">{label}</span>
      ) : null}
    </div>
  );
}

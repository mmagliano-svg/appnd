interface OnboardingProgressProps {
  total: number
  current: number
}

// ── Progress bar + step count ─────────────────────────────────────────────
// Shows both a thin fill bar and "2 / 7" counter for clarity

export function OnboardingProgress({ total, current }: OnboardingProgressProps) {
  const pct = ((current + 1) / total) * 100
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={total}
    >
      {/* Fill bar */}
      <div className="w-20 h-[2.5px] rounded-full overflow-hidden bg-black/[0.10]">
        <div
          className="h-full rounded-full transition-all duration-350 ease-out"
          style={{
            width: `${pct}%`,
            background: 'rgba(17,17,17,0.35)',
          }}
        />
      </div>
      {/* Step count */}
      <span
        className="text-[10px] tabular-nums"
        style={{ color: 'rgba(17,17,17,0.22)' }}
      >
        {current + 1} / {total}
      </span>
    </div>
  )
}

interface OnboardingProgressProps {
  total: number
  current: number
}

export function OnboardingProgress({ total, current }: OnboardingProgressProps) {
  const pct = ((current + 1) / total) * 100
  return (
    <div
      className="w-16 h-[2px] rounded-full overflow-hidden bg-black/[0.08]"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full bg-black/25 transition-all duration-400 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

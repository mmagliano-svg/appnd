/**
 * Onboarding layout — covers the global BottomNav and needs no auth.
 * Uses fixed+inset so it sits above everything else in the root layout.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-background overflow-hidden">
      {children}
    </div>
  )
}

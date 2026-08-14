// Intentionally-disabled instrumentation points, distinct from src/lib/events.ts (which fires for
// real). These three are placeholders for behavioral remarketing (e.g. "reached 75% of the quiz
// but never unlocked", "unlocked but never bought") that this project has discussed but not yet
// decided how to implement — no destination (first-party table? which third-party platform?) has
// been chosen, and none of the three currently receive an identifier (email/phone) that would make
// the resulting data actionable for remarketing. Wire a real destination in before treating these
// as live tracking. quizUnlockFlow-adjacent event names (trackQuizStart, trackCTAClick) were
// removed from here — they were dead no-ops shadowing the real, working implementations in
// src/lib/events.ts, which is exactly the kind of confusion this file used to cause.

/**
 * Track quiz progress (Disabled — see file header)
 */
export function trackQuizProgress(percentage: number): void {
  // No-op
}

/**
 * Track quiz completion (Disabled — see file header)
 */
export function trackQuizComplete(): void {
  // No-op
}

/**
 * Track result view (Disabled — see file header)
 */
export function trackResultView(profileName: string, profileCode: string): void {
  // No-op
}

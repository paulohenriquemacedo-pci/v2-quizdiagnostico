interface TrackCTAClickParams {
  email?: string;
  dominantProfile?: string;
  dominantCode?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceType?: string | null;
}

/**
 * Track quiz start event (Disabled)
 */
export function trackQuizStart(): void {
  // No-op
}

/**
 * Track quiz progress (Disabled)
 */
export function trackQuizProgress(percentage: number): void {
  // No-op
}

/**
 * Track quiz completion (Disabled)
 */
export function trackQuizComplete(): void {
  // No-op
}

/**
 * Track result view (Disabled)
 */
export function trackResultView(profileName: string, profileCode: string): void {
  // No-op
}

/**
 * Track CTA click (Disabled)
 */
export async function trackCTAClick(params: TrackCTAClickParams): Promise<void> {
  // No-op
}

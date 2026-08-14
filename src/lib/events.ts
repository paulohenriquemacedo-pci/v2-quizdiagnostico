// Single home for every first-party funnel event this app records (quiz_starts, cta_clicks).
// Before this module existed, tracking-shaped logic was scattered across a dead no-op
// analytics.ts, an ad-hoc trackQuizStart.ts, and an inline Supabase insert inside QuizResult.tsx —
// three places doing three different things with no shared contract. Everything that writes to a
// first-party tracking table, or that will eventually fire a third-party pixel event, goes through
// here instead.
//
// isDebugMode guards matter: the `?debug=result&profile=X` shortcut (see CLAUDE.md) renders an
// unlocked result page in production without going through the real funnel, and clicks on it must
// never be recorded as real funnel activity — this already happened once (debug-mode CTA clicks
// were inserted into cta_clicks during tracking tests) before this guard existed.

import { supabase } from '@/integrations/supabase/client';
import { getAttribution } from '@/lib/attribution';

function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

// Third-party pixel/event adapter. No-op today: LowTrack's automatic click-based detection is
// what InitiateCheckout currently relies on for the checkout CTA (see CLAUDE.md Tracking). Wire a
// real call in here once a platform's manual event-firing API is confirmed, so call sites below
// don't each need touching individually when that happens.
function fireThirdPartyEvent(eventName: string, payload: Record<string, unknown>): void {
  void eventName;
  void payload;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
}

/** Fires once per browser session when the user clicks "Começar Quiz". Used for funnel metrics. */
export async function trackQuizStarted(): Promise<void> {
  try {
    const sessionId = getSessionId();
    const attribution = getAttribution();
    const deviceType = getDeviceType();

    const alreadyTracked = sessionStorage.getItem('quiz_start_tracked');
    if (alreadyTracked) return;

    const { error } = await supabase.from('quiz_starts').insert({
      session_id: sessionId,
      utm_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
      utm_content: attribution.utm_content,
      utm_term: attribution.utm_term,
      fbclid: attribution.fbclid,
      device_type: deviceType,
    });

    if (error) {
      console.error('[events] quiz_starts insert error:', error);
    } else {
      sessionStorage.setItem('quiz_start_tracked', 'true');
    }
  } catch (error) {
    console.error('[events] quiz_starts insert error:', error);
  }
}

export interface CtaClickedParams {
  email: string;
  dominantProfile: string;
  dominantCode: string;
  isDebugMode: boolean;
}

/** Fires when the user clicks a checkout CTA on the result page. */
export function trackCtaClicked(params: CtaClickedParams): void {
  if (params.isDebugMode) return;

  const attribution = getAttribution();
  const deviceType = getDeviceType();

  supabase.from('cta_clicks').insert({
    email: params.email,
    dominant_profile: params.dominantProfile,
    dominant_code: params.dominantCode,
    utm_source: attribution.utm_source,
    utm_medium: attribution.utm_medium,
    utm_campaign: attribution.utm_campaign,
    utm_content: attribution.utm_content,
    utm_term: attribution.utm_term,
    fbclid: attribution.fbclid,
    device_type: deviceType,
  }).then(({ error }) => {
    if (error) console.error('[events] cta_clicks insert error:', error);
  });

  fireThirdPartyEvent('CtaClicked', { email: params.email, dominantCode: params.dominantCode });
}

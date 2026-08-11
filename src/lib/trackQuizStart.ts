import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/attribution";

// Generate a unique session ID for this browser session
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
}

// Detect device type
function getDeviceType(): string {
  if (typeof window === 'undefined') return 'unknown';
  return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

/**
 * Track when a user starts the quiz (clicks "Começar Quiz")
 * This is used to calculate funnel metrics (start -> complete -> CTA click)
 */
export async function trackQuizStart(): Promise<void> {
  try {
    const sessionId = getSessionId();
    const attribution = getAttribution();
    const deviceType = getDeviceType();

    // Check if we already tracked this session
    const alreadyTracked = sessionStorage.getItem('quiz_start_tracked');
    if (alreadyTracked) {
      console.log('[trackQuizStart] Already tracked for this session');
      return;
    }

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
      console.error('[trackQuizStart] Error:', error);
    } else {
      sessionStorage.setItem('quiz_start_tracked', 'true');
      console.log('[trackQuizStart] Quiz start tracked successfully');
    }
  } catch (error) {
    console.error('[trackQuizStart] Error:', error);
  }
}

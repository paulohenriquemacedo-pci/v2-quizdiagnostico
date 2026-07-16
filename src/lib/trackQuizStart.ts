import { supabase } from "@/integrations/supabase/client";

// Generate a unique session ID for this browser session
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('quiz_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('quiz_session_id', sessionId);
  }
  return sessionId;
}

// Get UTM params from URL
function getUTMParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
  };
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
    const utmParams = getUTMParams();
    const deviceType = getDeviceType();

    // Check if we already tracked this session
    const alreadyTracked = sessionStorage.getItem('quiz_start_tracked');
    if (alreadyTracked) {
      console.log('[trackQuizStart] Already tracked for this session');
      return;
    }

    const { error } = await supabase.from('quiz_starts').insert({
      session_id: sessionId,
      utm_source: utmParams.utm_source,
      utm_medium: utmParams.utm_medium,
      utm_campaign: utmParams.utm_campaign,
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

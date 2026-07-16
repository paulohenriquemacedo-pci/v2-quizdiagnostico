import { supabase } from "@/integrations/supabase/client";

interface TrackCTAClickParams {
  email?: string;
  dominantProfile?: string;
  dominantCode?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  deviceType?: string | null;
}

// Declare global types for analytics
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Track quiz start event
 */
export function trackQuizStart(): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: 'Quiz Procrastinação',
      content_category: 'quiz_start',
    });
  }

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'quiz_start',
      eventCategory: 'Quiz',
      eventLabel: 'Quiz Started',
    });
  }
}

/**
 * Track quiz progress (25%, 50%, 75%)
 */
export function trackQuizProgress(percentage: number): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', 'QuizProgress', {
      content_name: 'Quiz Procrastinação',
      progress_percentage: percentage,
    });
  }

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'quiz_progress',
      eventCategory: 'Quiz',
      eventLabel: `Progress ${percentage}%`,
      progressPercentage: percentage,
    });
  }
}

/**
 * Track quiz completion (before email collection)
 */
export function trackQuizComplete(): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Quiz Procrastinação',
      content_category: 'quiz_complete',
    });
  }

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'quiz_complete',
      eventCategory: 'Quiz',
      eventLabel: 'Quiz Completed',
    });
  }
}

/**
 * Track result view with profile info
 */
export function trackResultView(profileName: string, profileCode: string): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: profileName,
      content_category: 'quiz_result',
      content_ids: [profileCode],
    });
  }

  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'result_view',
      eventCategory: 'Quiz',
      eventLabel: profileName,
      profileCode: profileCode,
    });
  }
}

/**
 * Track CTA click to multiple analytics platforms
 */
export async function trackCTAClick(params: TrackCTAClickParams): Promise<void> {
  const {
    email,
    dominantProfile,
    dominantCode,
    utmSource,
    utmMedium,
    utmCampaign,
    deviceType,
  } = params;

  // 1. Google Analytics / GTM Event
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'cta_click', {
      event_category: 'Quiz',
      event_label: 'Diagnostico Completo',
      dominant_profile: dominantProfile,
      dominant_code: dominantCode,
      value: 27,
    });
  }

  // Also push to dataLayer for GTM
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'cta_click',
      eventCategory: 'Quiz',
      eventLabel: 'Diagnostico Completo',
      dominantProfile,
      dominantCode,
      ctaValue: 27,
    });
  }

  // 2. Facebook Pixel Event
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: 'Diagnostico Completo',
      content_category: dominantProfile,
      value: 27,
      currency: 'BRL',
    });
  }

  // 3. Save to Supabase database
  try {
    await supabase.from('cta_clicks').insert({
      email: email || null,
      dominant_profile: dominantProfile || null,
      dominant_code: dominantCode || null,
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      device_type: deviceType || null,
    });
  } catch (error) {
    console.error('Error saving CTA click:', error);
  }
}

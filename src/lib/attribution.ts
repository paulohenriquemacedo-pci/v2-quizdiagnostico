const ATTRIBUTION_STORAGE_KEY = 'quiz_attribution';

export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  captured_at?: string;
}

function readUrlParam(params: URLSearchParams, key: string): string | undefined {
  return params.get(key) ?? undefined;
}

/**
 * Captures UTM/fbclid params from the current URL into localStorage, once — first touch wins.
 * Call as early as possible (before any tracking is initialized) so every later step of the
 * funnel sees the same attribution values even if the visitor navigates within the SPA and the
 * URL's query string is gone by the time a later step fires (resumed quiz, multi-step funnel, etc).
 */
export function captureAttributionFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem(ATTRIBUTION_STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const data: AttributionData = {
      utm_source: readUrlParam(params, 'utm_source'),
      utm_medium: readUrlParam(params, 'utm_medium'),
      utm_campaign: readUrlParam(params, 'utm_campaign'),
      utm_content: readUrlParam(params, 'utm_content'),
      utm_term: readUrlParam(params, 'utm_term'),
      fbclid: readUrlParam(params, 'fbclid'),
      captured_at: new Date().toISOString(),
    };
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing, disabled storage) — no-op, getAttribution()
    // just returns {} everywhere downstream.
  }
}

/** Safe to call anywhere — returns {} if nothing was ever captured. */
export function getAttribution(): AttributionData {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AttributionData;
  } catch {
    return {};
  }
}

/**
 * Meta's documented fbc cookie format is `fb.1.<ms-timestamp>.<fbclid>`. If the visitor landed
 * with fbclid in the URL but the _fbc cookie never got set (ad blockers stripping fbevents.js's
 * cookie write, Safari ITP, or any timing gap before Pixel init runs), this reconstructs an
 * equivalent value from our own stored fbclid + captured_at so the CAPI payload still carries fbc
 * instead of silently dropping it — a fallback Meta explicitly documents for CAPI implementations
 * with degraded cookie visibility.
 */
export function getFbcWithFallback(cookieFbc: string | undefined): string | undefined {
  if (cookieFbc) return cookieFbc;
  const { fbclid, captured_at } = getAttribution();
  if (!fbclid) return undefined;
  const timestamp = captured_at ? new Date(captured_at).getTime() : Date.now();
  return `fb.1.${timestamp}.${fbclid}`;
}

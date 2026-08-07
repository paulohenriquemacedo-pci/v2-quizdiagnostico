import { normalizeEmail, normalizePhone } from '@/lib/phoneUtils';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function fbq(...args: unknown[]): void {
  if (typeof window === 'undefined' || !window.fbq) return;
  window.fbq(...args);
}

const EXTERNAL_ID_STORAGE_KEY = 'meta_external_id';
// Greenn's own offer code for this product (matches the "ascwjh4" segment of the checkout URL and
// the item_id Greenn's own Pixel/CAPI already sends) — kept as content_ids so our InitiateCheckout
// carries the same commerce parameters Meta's docs recommend (content_ids/content_type/num_items).
const PRODUCT_ID = 'ascwjh4';

/**
 * A persistent anonymous ID, generated on first visit and reused for the life of the browser
 * (localStorage, not sessionStorage) — gives Meta a stable identity thread from the very first
 * pageview through Lead/Purchase, even before we know the visitor's real PII.
 */
function getExternalId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let id = localStorage.getItem(EXTERNAL_ID_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(EXTERNAL_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

/** Initializes the Pixel with the configured ID, sets the persistent external_id/country as
 * Advanced Matching context (so even anonymous events like QuizStart carry it), and fires
 * PageView. No-ops if the env var is unset. */
export function initMetaPixel(): void {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
  if (!pixelId) {
    console.warn('[metaPixel] VITE_META_PIXEL_ID is not set — Meta Pixel disabled');
    return;
  }
  // Must be called before 'init' — disables the Pixel's default automatic tracking
  // (Microdata, SubscribedButtonClick on every button/link click) since we already fire
  // precise, meaningful custom events ourselves; the automatic ones were just noise.
  fbq('set', 'autoConfig', false, pixelId);
  fbq('init', pixelId, { external_id: getExternalId(), country: 'br' });
  fbq('track', 'PageView');
}

// BR phone numbers are captured as 10-11 digits (DDD + number), Meta expects E.164 (country code, no +)
function toE164BR(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  return `55${digits}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function getFbCookies(): { fbp?: string; fbc?: string } {
  return { fbp: getCookie('_fbp'), fbc: getCookie('_fbc') };
}

interface CapiRelayPayload {
  event_name: 'Lead' | 'InitiateCheckout';
  event_id: string;
  email?: string;
  phone?: string;
  name?: string;
  value?: number;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  num_items?: number;
  fbp?: string;
  fbc?: string;
  external_id?: string;
  country?: string;
  event_source_url: string;
}

function callCapiRelay(payload: CapiRelayPayload, opts?: { keepalive?: boolean }): void {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;
  fetch(`${SUPABASE_URL}/functions/v1/capi-relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
    keepalive: opts?.keepalive ?? false,
  }).catch((error) => {
    console.error('[metaPixel] capi-relay error:', error);
  });
}

/**
 * Updates Advanced Matching data for subsequent Pixel events (Meta's documented
 * pattern: re-calling fbq('init', ...) with user data updates it for events fired after).
 */
export function setAdvancedMatching(data: { email?: string; phone?: string; name?: string }): void {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID as string;
  if (!pixelId) return;
  const nameParts = data.name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : undefined;
  fbq('init', pixelId, {
    em: data.email ? normalizeEmail(data.email) : undefined,
    ph: data.phone ? toE164BR(data.phone) : undefined,
    fn: firstName ? firstName.toLowerCase() : undefined,
    ln: lastName ? lastName.toLowerCase() : undefined,
    // Re-including these on every call: fbq('init', ...) replaces the Advanced Matching
    // object rather than merging it, so omitting them here would drop them from this point on.
    external_id: getExternalId(),
    country: 'br',
  });
}

export function trackQuizStartPixel(): void {
  fbq('trackCustom', 'QuizStart');
}

export function trackQuizProgressPixel(percentage: number): void {
  fbq('trackCustom', 'QuizProgress', { percentage });
}

export function trackViewContentPixel(params: { contentName: string; contentCategory: string }): void {
  fbq('track', 'ViewContent', { content_name: params.contentName, content_category: params.contentCategory });
}

/** Dual-fires Lead: browser Pixel + server-side CAPI relay, deduplicated via shared event_id. */
export function trackLead(params: { eventId: string; email: string; phone: string; name: string }): void {
  fbq('track', 'Lead', {}, { eventID: params.eventId });

  const { fbp, fbc } = getFbCookies();
  callCapiRelay({
    event_name: 'Lead',
    event_id: params.eventId,
    email: params.email,
    phone: params.phone,
    name: params.name,
    fbp,
    fbc,
    external_id: getExternalId(),
    country: 'br',
    event_source_url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

/**
 * Dual-fires InitiateCheckout: browser Pixel + server-side CAPI relay (keepalive, since the
 * page navigates away to the Greenn checkout right after this is called).
 */
export function trackInitiateCheckout(params: {
  eventId: string;
  value: number;
  contentName: string;
  email: string;
  phone: string;
  name: string;
}): void {
  fbq(
    'track',
    'InitiateCheckout',
    {
      value: params.value,
      currency: 'BRL',
      content_name: params.contentName,
      content_ids: [PRODUCT_ID],
      content_type: 'product',
      num_items: 1,
    },
    { eventID: params.eventId }
  );

  const { fbp, fbc } = getFbCookies();
  callCapiRelay(
    {
      event_name: 'InitiateCheckout',
      event_id: params.eventId,
      email: params.email,
      phone: params.phone,
      name: params.name,
      value: params.value,
      content_name: params.contentName,
      content_ids: [PRODUCT_ID],
      content_type: 'product',
      num_items: 1,
      fbp,
      fbc,
      external_id: getExternalId(),
      country: 'br',
      event_source_url: typeof window !== 'undefined' ? window.location.href : '',
    },
    { keepalive: true }
  );
}

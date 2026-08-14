// Single source of truth for the checkout destination. This project has switched checkout
// providers before (Greenn -> Hotmart, 2026-08-14) — when this URL lived as a literal string
// duplicated inside a component, swapping providers meant grepping the codebase to find every
// place it was used. Change it here only.
export const CHECKOUT_URL = "https://pay.hotmart.com/T107146469P?checkoutMode=10";

/**
 * Merges the current page's query params (UTMs, click IDs, etc.) into CHECKOUT_URL, preserving
 * whatever params the checkout URL itself already has (e.g. checkoutMode). Computed eagerly from
 * `window.location.search` rather than at click time, so the href a <CheckoutCTA> renders is
 * always the real, final destination — no onClick redirect logic needed.
 */
export function getFinalCheckoutUrl(): string {
  if (typeof window === 'undefined') return CHECKOUT_URL;
  try {
    const url = new URL(CHECKOUT_URL);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
    return url.toString();
  } catch (err) {
    console.error('[checkout] Failed to build final checkout URL:', err);
    return CHECKOUT_URL;
  }
}

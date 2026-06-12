export type RevenueEventName =
  | "page_view"
  | "signup_complete"
  | "purchase"
  | "lead_submit"
  | "generator_start"
  | "generator_complete"
  | "pricing_view"
  | "contact_submit"
  | "auth_error"
  | "api_error";

type Payload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(eventName: RevenueEventName, payload: Payload = {}) {
  if (typeof window === "undefined") return;

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...cleanPayload });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, cleanPayload);
  }
}

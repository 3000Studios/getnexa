// Stripe Checkout + PayPal Orders integrations
// Secrets are stored as Worker secrets via `wrangler secret put`:
//   STRIPE_SECRET_KEY       - sk_live_... or sk_test_...
//   STRIPE_WEBHOOK_SECRET   - whsec_... (for fulfillment webhook)
//   PAYPAL_CLIENT_ID        - live or sandbox client ID
//   PAYPAL_CLIENT_SECRET    - live or sandbox client secret
//   PAYPAL_MODE             - 'live' or 'sandbox' (default 'sandbox')

export type PayBindings = {
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  PAYPAL_CLIENT_ID?: string;
  PAYPAL_CLIENT_SECRET?: string;
  PAYPAL_MODE?: string;
  SITE_URL: string;
};

/* ─── Stripe ─────────────────────────────────────────── */

export async function createStripeCheckoutSession(
  env: PayBindings,
  opts: {
    productName: string;
    priceCents: number;
    successUrl: string;
    cancelUrl: string;
    userId: number;
    productId: string;
    recurring?: boolean;
    metadata?: Record<string, string>;
  }
): Promise<{ url: string; id: string }> {
  if (!env.STRIPE_SECRET_KEY) throw new Error('Stripe is not configured');

  const form = new URLSearchParams();
  form.set('mode', opts.recurring ? 'subscription' : 'payment');
  form.set('success_url', opts.successUrl);
  form.set('cancel_url', opts.cancelUrl);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'usd');
  form.set('line_items[0][price_data][product_data][name]', opts.productName);
  form.set('line_items[0][price_data][unit_amount]', String(opts.priceCents));
  if (opts.recurring) form.set('line_items[0][price_data][recurring][interval]', 'month');
  form.set('client_reference_id', String(opts.userId));
  form.set('metadata[user_id]', String(opts.userId));
  form.set('metadata[product_id]', opts.productId);
  for (const [k, v] of Object.entries(opts.metadata || {})) form.set(`metadata[${k}]`, v);
  form.set('allow_promotion_codes', 'true');

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.error?.message || 'Stripe error');
  return { url: json.url, id: json.id };
}

// Verify Stripe webhook signature
export async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string,
  toleranceSec = 300
): Promise<boolean> {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
  const t = parts.t as string; const v1 = parts.v1 as string;
  if (!t || !v1) return false;
  const age = Math.abs(Math.floor(Date.now() / 1000) - parseInt(t, 10));
  if (age > toleranceSec) return false;
  const payload = `${t}.${rawBody}`;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const hex = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* ─── PayPal ─────────────────────────────────────────── */

function paypalBase(env: PayBindings) {
  return env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getPaypalAccessToken(env: PayBindings): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) throw new Error('PayPal is not configured');
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.error_description || 'PayPal auth failed');
  return json.access_token;
}

export async function createPaypalOrder(
  env: PayBindings,
  opts: {
    productName: string;
    priceCents: number;
    returnUrl: string;
    cancelUrl: string;
    userId: number;
    productId: string;
  }
): Promise<{ id: string; approveUrl: string }> {
  const token = await getPaypalAccessToken(env);
  const body = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: `${opts.userId}:${opts.productId}`,
      description: opts.productName.slice(0, 127),
      amount: {
        currency_code: 'USD',
        value: (opts.priceCents / 100).toFixed(2),
      },
      custom_id: `${opts.userId}`,
    }],
    application_context: {
      brand_name: 'Nexa Arcade',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      return_url: opts.returnUrl,
      cancel_url: opts.cancelUrl,
    },
  };
  const res = await fetch(`${paypalBase(env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.message || 'PayPal order failed');
  const approveUrl = json.links?.find((l: any) => l.rel === 'approve')?.href;
  return { id: json.id, approveUrl };
}

export async function capturePaypalOrder(env: PayBindings, orderId: string): Promise<any> {
  const token = await getPaypalAccessToken(env);
  const res = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json.message || 'PayPal capture failed');
  return json;
}

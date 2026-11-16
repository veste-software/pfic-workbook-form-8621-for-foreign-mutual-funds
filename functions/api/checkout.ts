// Cloudflare Pages Function. The body holds only { taxYear }; no lot or fund data.
interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_PRICE_ID: string;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  let taxYear = 0;
  try {
    taxYear = Number(((await request.json()) as { taxYear?: unknown }).taxYear);
  } catch {
    /* handled below */
  }
  if (taxYear !== 2025 && taxYear !== 2026) return Response.json({ error: 'Unsupported tax year.' }, { status: 400 });
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) return Response.json({ error: 'Payments are not configured.' }, { status: 503 });

  const origin = new URL(request.url).origin;
  const body = new URLSearchParams({
    mode: 'payment',
    'line_items[0][price]': env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    'metadata[taxYear]': String(taxYear),
    success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/`,
  });
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as { url?: string };
  if (!res.ok || !data.url) return Response.json({ error: 'Could not start checkout.' }, { status: 502 });
  return Response.json({ url: data.url });
};

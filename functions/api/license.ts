import { issueLicense } from '../../src/lib/license-sign';

interface Env {
  STRIPE_SECRET_KEY: string;
  LICENSE_SIGNING_KEY: string;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const id = new URL(request.url).searchParams.get('session_id') ?? '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return Response.json({ error: 'Bad session.' }, { status: 400 });
  if (!env.STRIPE_SECRET_KEY || !env.LICENSE_SIGNING_KEY) return Response.json({ error: 'Payments are not configured.' }, { status: 503 });

  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${id}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
  });
  if (!res.ok) return Response.json({ error: 'Session not found.' }, { status: 404 });
  const s = (await res.json()) as { payment_status?: string; metadata?: { taxYear?: string } };
  const taxYear = Number(s.metadata?.taxYear);
  if (s.payment_status !== 'paid' || !taxYear) return Response.json({ error: 'Not paid.' }, { status: 402 });
  return Response.json({ license: await issueLicense(taxYear, id, env.LICENSE_SIGNING_KEY) });
};

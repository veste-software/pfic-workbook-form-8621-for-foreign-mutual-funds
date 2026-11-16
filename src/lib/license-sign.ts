import { signLicense, type LicensePayload } from './license';

/** Builds and signs a license for a paid Checkout Session. The session id is hashed so the code does not carry it. */
export async function issueLicense(taxYear: number, sessionId: string, privateKey: string, now = new Date()): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId));
  const id = Array.from(new Uint8Array(digest).slice(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
  const payload: LicensePayload = { taxYear, id, issued: now.toISOString().slice(0, 10) };
  return signLicense(payload, privateKey);
}

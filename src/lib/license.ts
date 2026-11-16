import * as ed from '@noble/ed25519';

/** A license code is base64url(payload JSON) + "." + base64url(Ed25519 signature of the payload bytes). */
export interface LicensePayload {
  taxYear: number;
  id: string;
  issued: string;
}

export const LICENSE_KEY = 'pfic-workbook:license';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function toB64Url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromB64Url(text: string): Uint8Array {
  const b = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '='.repeat((4 - (b.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Accepts a public or private key as hex (64 chars) or base64/base64url. */
export function keyBytes(key: string): Uint8Array {
  const k = key.trim();
  if (/^[0-9a-fA-F]{64}$/.test(k)) return Uint8Array.from(k.match(/../g)!.map((h) => parseInt(h, 16)));
  return fromB64Url(k);
}

function isPayload(v: unknown): v is LicensePayload {
  const o = v as Record<string, unknown>;
  return !!o && typeof o.taxYear === 'number' && typeof o.id === 'string' && typeof o.issued === 'string';
}

/** Returns the payload when the signature is valid for the public key, otherwise null. Never throws. */
export async function verifyLicense(code: string, publicKey: string): Promise<LicensePayload | null> {
  try {
    const [p, s] = code.trim().split('.');
    if (!p || !s) return null;
    const payloadBytes = fromB64Url(p);
    const ok = await ed.verifyAsync(fromB64Url(s), payloadBytes, keyBytes(publicKey));
    if (!ok) return null;
    const payload: unknown = JSON.parse(dec.decode(payloadBytes));
    return isPayload(payload) ? payload : null;
  } catch {
    return null;
  }
}

/** True when the code is genuine and was bought for this tax year. */
export async function licenseUnlocks(code: string | undefined, publicKey: string, taxYear: number): Promise<boolean> {
  if (!code) return false;
  const p = await verifyLicense(code, publicKey);
  return !!p && p.taxYear === taxYear;
}

/** Signing (server side only, see functions/api/license.ts). */
export async function signLicense(payload: LicensePayload, privateKey: string): Promise<string> {
  const bytes = enc.encode(JSON.stringify(payload));
  const sig = await ed.signAsync(bytes, keyBytes(privateKey));
  return `${toB64Url(bytes)}.${toB64Url(sig)}`;
}

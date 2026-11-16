import { describe, it, expect } from 'vitest';
import * as ed from '@noble/ed25519';
import { verifyLicense, licenseUnlocks, signLicense, toB64Url } from '../src/lib/license';
import { issueLicense } from '../src/lib/license-sign';
import { isFundUnlocked } from '../src/lib/paywall';

async function keys() {
  const priv = ed.utils.randomPrivateKey();
  return { priv: toB64Url(priv), pub: toB64Url(await ed.getPublicKeyAsync(priv)) };
}

describe('license', () => {
  it('unlocks 2025 and not 2026', async () => {
    const { priv, pub } = await keys();
    const code = await signLicense({ taxYear: 2025, id: 'abc', issued: '2026-01-05' }, priv);
    expect(await licenseUnlocks(code, pub, 2025)).toBe(true);
    expect(await licenseUnlocks(code, pub, 2026)).toBe(false);
  });

  it('rejects a tampered payload or signature', async () => {
    const { priv, pub } = await keys();
    const code = await signLicense({ taxYear: 2025, id: 'abc', issued: '2026-01-05' }, priv);
    const [p, s] = code.split('.');
    const forged = toB64Url(new TextEncoder().encode(JSON.stringify({ taxYear: 2026, id: 'abc', issued: '2026-01-05' })));
    expect(await verifyLicense(`${forged}.${s}`, pub)).toBeNull();
    const badSig = s.slice(0, -2) + (s.endsWith('A') ? 'BB' : 'AA');
    expect(await verifyLicense(`${p}.${badSig}`, pub)).toBeNull();
    expect(await verifyLicense('garbage', pub)).toBeNull();
    expect(await licenseUnlocks(undefined, pub, 2025)).toBe(false);
  });

  it('rejects a license signed with another key', async () => {
    const a = await keys();
    const b = await keys();
    const code = await signLicense({ taxYear: 2025, id: 'x', issued: '2026-01-05' }, a.priv);
    expect(await verifyLicense(code, b.pub)).toBeNull();
  });

  it('verifies a license issued by the server helper', async () => {
    const { priv, pub } = await keys();
    const code = await issueLicense(2025, 'cs_test_123', priv, new Date('2026-02-01T10:00:00Z'));
    expect(await verifyLicense(code, pub)).toMatchObject({ taxYear: 2025, issued: '2026-02-01' });
    expect(atob(code.split('.')[0].replace(/-/g, '+').replace(/_/g, '/'))).not.toContain('cs_test');
  });
});

describe('paywall', () => {
  it('first fund free, later funds need the year', () => {
    expect(isFundUnlocked(0, null, 2025)).toBe(true);
    expect(isFundUnlocked(1, null, 2025)).toBe(false);
    expect(isFundUnlocked(1, { taxYear: 2025 }, 2025)).toBe(true);
    expect(isFundUnlocked(2, { taxYear: 2025 }, 2026)).toBe(false);
  });
});

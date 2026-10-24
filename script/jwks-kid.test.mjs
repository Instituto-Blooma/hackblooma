import { createPublicKey, generateKeyPair } from 'node:crypto';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { rfc7638RsaKid, stampJwksKids } from './lib.mjs';

const generateKeyPairAsync = promisify(generateKeyPair);

describe('JWKS kid stamping', () => {
  it('stamps RFC 7638 kids on keys that omit kid and leaves existing kids', async () => {
    const { publicKey } = await generateKeyPairAsync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const jwk = createPublicKey(publicKey).export({ format: 'jwk' });
    const expected = rfc7638RsaKid(jwk);

    const stamped = stampJwksKids(JSON.stringify({ keys: [{ use: 'sig', ...jwk }] }));
    expect(stamped.changed).toBe(true);
    expect(JSON.parse(stamped.json).keys[0].kid).toBe(expected);

    const already = stampJwksKids(stamped.json);
    expect(already.changed).toBe(false);
    expect(JSON.parse(already.json).keys[0].kid).toBe(expected);
  });
});

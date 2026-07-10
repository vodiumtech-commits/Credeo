import test from "node:test";
import assert from "node:assert/strict";

// Env is read lazily inside the functions, so setting it here (before the tests
// run) is sufficient even though the imports are hoisted.
process.env.SESSION_SECRET ||= "test-session-secret";
process.env.SECRET_ENCRYPTION_KEY ||= Buffer.alloc(32, 7).toString("base64");

import { normalisePhone, formatNaira } from "../src/lib/utils";
import { encryptSecret, decryptSecret } from "../src/lib/crypto/secrets";
import { signOrderToken, verifyOrderToken } from "../src/lib/bnpl-token";

test("normalisePhone handles Nigerian formats", () => {
  assert.equal(normalisePhone("08031234567"), "+2348031234567");
  assert.equal(normalisePhone("+2348031234567"), "+2348031234567");
  assert.equal(normalisePhone("2348031234567"), "+2348031234567");
  assert.equal(normalisePhone("123"), null);
});

test("formatNaira formats with the naira sign and separators", () => {
  const out = formatNaira(1000000);
  assert.match(out, /₦/);
  assert.match(out, /1,000,000/);
});

test("secret encryption round-trips and rejects tampering", () => {
  const enc = encryptSecret("super-secret-token");
  assert.ok(enc, "expected ciphertext");
  assert.equal(decryptSecret(enc), "super-secret-token");
  assert.equal(decryptSecret(enc!.slice(0, -3) + "xxx"), null); // tampered
  assert.equal(decryptSecret("not-a-token"), null);
});

test("bnpl order token signs and verifies, rejects tampering", () => {
  const token = signOrderToken("order_abcdef123456");
  assert.equal(verifyOrderToken(token), "order_abcdef123456");
  assert.equal(verifyOrderToken(token + "x"), null);
  assert.equal(verifyOrderToken("garbage.token"), null);
});

import test from "node:test";
import assert from "node:assert/strict";

// Env is read lazily inside the functions, so setting it here (before the tests
// run) is sufficient even though the imports are hoisted. Set unconditionally so
// the test is hermetic regardless of any (possibly invalid) CI env value.
process.env.SESSION_SECRET = "test-session-secret";
process.env.SECRET_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); // valid 32-byte key

import { normalisePhone, formatNaira } from "../src/lib/utils";
import { encryptSecret, decryptSecret } from "../src/lib/crypto/secrets";
import { signOrderToken, verifyOrderToken } from "../src/lib/bnpl-token";
import { detectIntent, parseInvoiceItem, step, type SessionContext } from "../src/lib/whatsapp/state-machine";

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

test("parseInvoiceItem reads item lines and rejects junk", () => {
  assert.deepEqual(parseInvoiceItem("Rice, 2, 1500"), { name: "Rice", quantity: 2, unitPrice: 1500 });
  assert.deepEqual(parseInvoiceItem("Delivery, 500"), { name: "Delivery", quantity: 1, unitPrice: 500 });
  assert.deepEqual(parseInvoiceItem("Jollof pack, 3, ₦1,200"), { name: "Jollof pack", quantity: 3, unitPrice: 1200 });
  assert.equal(parseInvoiceItem("just some text"), null);
  assert.equal(parseInvoiceItem("Rice, 0, 100"), null);
  assert.equal(parseInvoiceItem("500, 2"), null);
});

test("WhatsApp invoice flow walks to a CREATE_INVOICE side effect", () => {
  const send = (context: Record<string, unknown>, body: string) =>
    step(
      { state: "IDLE", context, vendorId: "vendor_1" } as SessionContext,
      { body, fromPhone: "+2348030000000" },
    );
  const advance = (context: Record<string, unknown>, patch?: Record<string, unknown>) =>
    ({ ...context, ...(patch ?? {}) });

  assert.equal(detectIntent("invoice"), "INVOICE");

  let ctx: Record<string, unknown> = {};
  let r = send(ctx, "INVOICE");
  ctx = advance(ctx, r.contextPatch);
  assert.equal(ctx.invStep, "customer");

  r = send(ctx, "Chidi Okeke");
  ctx = advance(ctx, r.contextPatch);
  assert.equal(ctx.invStep, "phone");

  r = send(ctx, "08012345678");
  ctx = advance(ctx, r.contextPatch);
  assert.equal(ctx.invStep, "items");

  r = send(ctx, "Rice, 2, 1500");
  ctx = advance(ctx, r.contextPatch);
  r = send(ctx, "Delivery, 500");
  ctx = advance(ctx, r.contextPatch);
  assert.equal((ctx.invItems as unknown[]).length, 2);

  r = send(ctx, "not an item at all");
  assert.match(r.reply, /couldn't read that item/i);

  r = send(ctx, "DONE");
  ctx = advance(ctx, r.contextPatch);
  assert.equal(ctx.invStep, "due");

  r = send(ctx, "7");
  ctx = advance(ctx, r.contextPatch);
  assert.equal(ctx.invStep, "confirm");
  assert.match(r.reply, /3,500/); // 2×1500 + 500

  r = send(ctx, "SEND");
  ctx = advance(ctx, r.contextPatch);
  const effect = r.sideEffects?.[0];
  assert.ok(effect && effect.type === "CREATE_INVOICE");
  if (effect?.type === "CREATE_INVOICE") {
    assert.equal(effect.data.customerName, "Chidi Okeke");
    assert.equal(effect.data.items.length, 2);
    assert.equal(effect.data.dueInMinutes, 7 * 1440);
  }
  assert.equal(ctx.invStep, null); // flow context cleared
});

test("CANCEL exits the invoice flow", () => {
  const r = step(
    { state: "IDLE", context: { invStep: "items", invItems: [] }, vendorId: "vendor_1" } as SessionContext,
    { body: "CANCEL", fromPhone: "+2348030000000" },
  );
  assert.equal(r.contextPatch?.invStep, null);
  assert.match(r.reply, /cancelled/i);
});

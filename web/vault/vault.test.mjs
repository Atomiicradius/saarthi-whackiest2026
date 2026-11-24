// Run with `npm run test:vault` (Node's built-in runner; Node strips the types from index.ts).
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { beforeEach, describe, test } from "node:test";
import {
  appendAudit,
  auditHead,
  decryptBlob,
  encryptFile,
  resetAudit,
  shredBlob,
  verifyChain,
  VaultError,
} from "./index.ts";

const PASSPHRASE = "correct horse battery";
const text = "Synthetic income certificate: Ravi, Rs 2,40,000";

function flipLastByte(base64) {
  const bytes = Buffer.from(base64, "base64");
  bytes[bytes.length - 1] ^= 1;
  return bytes.toString("base64");
}

function entry(action, fields = ["annual_family_income_inr"]) {
  return {
    ts: "2026-11-24T14:02:11+05:30",
    actor: "user",
    action,
    fields,
    purpose: "sandbox-portal:example-welfare-c",
  };
}

describe("vault blobs", () => {
  test("encrypt then decrypt returns the original", async () => {
    const blob = await encryptFile(new Blob([text]), PASSPHRASE, { docId: "doc-1" });
    assert.equal(blob.v, 1);
    assert.equal(blob.aad, "doc-1|demo-user");
    assert.ok(!JSON.stringify(blob).includes("Ravi"), "plaintext must not appear in the blob");
    const plain = await decryptBlob(blob, PASSPHRASE);
    assert.equal(await plain.text(), text);
  });

  test("each file gets a fresh key and nonces", async () => {
    const a = await encryptFile(new Blob([text]), PASSPHRASE);
    const b = await encryptFile(new Blob([text]), PASSPHRASE);
    assert.notEqual(a.data.nonce, b.data.nonce);
    assert.notEqual(a.kdf.salt, b.kdf.salt);
    assert.notEqual(a.data.ciphertext, b.data.ciphertext);
  });

  test("a wrong passphrase fails", async () => {
    const blob = await encryptFile(new Blob([text]), PASSPHRASE);
    await assert.rejects(decryptBlob(blob, "wrong passphrase"), VaultError);
  });

  test("tampered ciphertext, nonce or authenticated data fails", async () => {
    const blob = await encryptFile(new Blob([text]), PASSPHRASE);
    const tampered = [
      { ...blob, data: { ...blob.data, ciphertext: flipLastByte(blob.data.ciphertext) } },
      { ...blob, data: { ...blob.data, nonce: flipLastByte(blob.data.nonce) } },
      {
        ...blob,
        wrapped_dek: { ...blob.wrapped_dek, ciphertext: flipLastByte(blob.wrapped_dek.ciphertext) },
      },
      { ...blob, aad: "another-doc|demo-user" },
    ];
    for (const changed of tampered) {
      await assert.rejects(decryptBlob(changed, PASSPHRASE), VaultError);
    }
  });

  test("a weakened KDF or unknown version is refused", async () => {
    const blob = await encryptFile(new Blob([text]), PASSPHRASE);
    await assert.rejects(
      decryptBlob({ ...blob, kdf: { ...blob.kdf, iterations: 1 } }, PASSPHRASE),
      VaultError,
    );
    await assert.rejects(decryptBlob({ ...blob, v: 2 }, PASSPHRASE), VaultError);
  });

  test("a shredded blob has no key left to decrypt with", async () => {
    const blob = await encryptFile(new Blob([text]), PASSPHRASE);
    assert.equal("wrapped_dek" in shredBlob(blob), false);
  });

  test("an empty passphrase is refused", async () => {
    await assert.rejects(encryptFile(new Blob([text]), ""), VaultError);
  });
});

describe("audit chain", () => {
  beforeEach(() => resetAudit());

  test("appended entries link and verify", async () => {
    const first = await appendAudit(entry("grant"));
    const second = await appendAudit(entry("prefill"));
    assert.equal(first.prev_hash, "0".repeat(64));
    assert.equal(second.prev_hash, first.hash);
    assert.deepEqual(await verifyChain([first, second]), { ok: true });
    assert.deepEqual(auditHead(), { idx: 1, hash: second.hash });
  });

  test("changing any past entry breaks verification from that entry", async () => {
    const chain = [];
    for (const action of ["grant", "read", "prefill", "revoke"])
      chain.push(await appendAudit(entry(action)));
    for (let i = 0; i < chain.length; i += 1) {
      const edits = [
        { fields: ["name"] },
        { purpose: "sandbox-portal:other" },
        { actor: "copilot" },
        { ts: "2026-11-24T15:00:00+05:30" },
      ];
      for (const edit of edits) {
        const forged = chain.map((item, j) => (j === i ? { ...item, ...edit } : item));
        assert.deepEqual(await verifyChain(forged), { ok: false, brokenAt: i });
      }
    }
  });

  test("removing or reordering entries is detected", async () => {
    const chain = [];
    for (const action of ["grant", "read", "prefill"]) chain.push(await appendAudit(entry(action)));
    assert.equal((await verifyChain([chain[0], chain[2]])).ok, false);
    assert.equal((await verifyChain([chain[1], chain[0], chain[2]])).ok, false);
  });

  test("recomputing a forged entry's own hash still breaks the next link", async () => {
    const chain = [];
    for (const action of ["grant", "read"]) chain.push(await appendAudit(entry(action)));
    resetAudit();
    const forged = await appendAudit(entry("grant", ["name"]));
    assert.deepEqual(await verifyChain([forged, chain[1]]), { ok: false, brokenAt: 1 });
  });

  test("continues a chain the caller already holds (the UI's seeded log)", async () => {
    const seeded = JSON.parse(
      await readFile(new URL("../mocks/audit.json", import.meta.url), "utf8"),
    );
    assert.deepEqual(await verifyChain(seeded), { ok: true });
    const next = await appendAudit(entry("read"), seeded);
    assert.equal(next.idx, seeded.length);
    assert.deepEqual(await verifyChain([...seeded, next]), { ok: true });
  });

  test("entries carry field names only", async () => {
    await assert.rejects(appendAudit({ ...entry("read"), values: { income: 240000 } }), VaultError);
    await assert.rejects(appendAudit(entry("leak")), VaultError);
    await assert.rejects(appendAudit({ ...entry("read"), fields: [{ income: 1 }] }), VaultError);
  });
});

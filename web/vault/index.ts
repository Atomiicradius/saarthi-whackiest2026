// The browser vault and the hash-chained audit log (sections 7 and 8 of
// context/data-and-contracts.md). The UI reaches this module only through lib/vault-adapter.ts.
//
// Everything runs in the browser on WebCrypto. The passphrase, the plaintext and the raw data keys
// never leave this module; only the blob below (ciphertext plus a wrapped key) may be sent anywhere.
//
// This file has no runtime imports so `node --test` can load it directly (see vault.test.mjs).

import type { AuditEntry } from "@/lib/types";
import type { NewAuditEntry, VaultBlob, VerifyResult } from "@/lib/vault-adapter";

const BLOB_VERSION = 1;
const KDF_ALG = "PBKDF2-SHA256";
const DATA_ALG = "AES-256-GCM";
const PBKDF2_ITERATIONS = 600_000;
const MIN_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const DEK_BYTES = 32;
const NONCE_BYTES = 12;
const GENESIS_HASH = "0".repeat(64);
const DEFAULT_USER = "demo-user";
const ACTIONS: ReadonlySet<string> = new Set(["grant", "read", "prefill", "revoke", "delete"]);
const ENTRY_KEYS = ["action", "actor", "fields", "purpose", "ts"];

const encoder = new TextEncoder();

/** A wrong passphrase, a tampered blob or a malformed entry. The message is safe to show. */
export class VaultError extends Error {
  override name = "VaultError";
}

// ---------- bytes ----------

function toBase64(bytes: Uint8Array): string {
  let text = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    text += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(text);
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  const raw = atob(text);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ---------- encryption ----------

async function deriveKek(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const base = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function checkPassphrase(passphrase: string): void {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new VaultError("A passphrase is required");
  }
}

export interface EncryptOptions {
  /** Bound into the ciphertext as authenticated data. A random id is used when omitted. */
  docId?: string;
  userId?: string;
}

/**
 * Encrypts a file with a fresh AES-256-GCM data key (DEK), then wraps the DEK with a key derived
 * from the passphrase. `docId|userId` is authenticated data on both, so a blob cannot be moved
 * to another document or user without failing to decrypt.
 */
export async function encryptFile(
  file: Blob,
  passphrase: string,
  options: EncryptOptions = {},
): Promise<VaultBlob> {
  checkPassphrase(passphrase);
  const docId = options.docId ?? crypto.randomUUID();
  const userId = options.userId ?? DEFAULT_USER;
  if (docId.includes("|") || userId.includes("|")) throw new VaultError("Ids cannot contain |");
  const aad = `${docId}|${userId}`;
  const aadBytes = encoder.encode(aad);

  const dekBytes = randomBytes(DEK_BYTES);
  try {
    const dek = await crypto.subtle.importKey("raw", dekBytes, "AES-GCM", false, ["encrypt"]);
    const dataNonce = randomBytes(NONCE_BYTES);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: dataNonce, additionalData: aadBytes },
      dek,
      await file.arrayBuffer(),
    );

    const salt = randomBytes(SALT_BYTES);
    const kek = await deriveKek(passphrase, salt, PBKDF2_ITERATIONS);
    const wrapNonce = randomBytes(NONCE_BYTES);
    const wrapped = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: wrapNonce, additionalData: aadBytes },
      kek,
      dekBytes,
    );

    return {
      v: BLOB_VERSION,
      kdf: { alg: KDF_ALG, iterations: PBKDF2_ITERATIONS, salt: toBase64(salt) },
      wrapped_dek: { nonce: toBase64(wrapNonce), ciphertext: toBase64(new Uint8Array(wrapped)) },
      data: {
        alg: DATA_ALG,
        nonce: toBase64(dataNonce),
        ciphertext: toBase64(new Uint8Array(ciphertext)),
      },
      aad,
    };
  } finally {
    // The raw DEK only exists wrapped from here on.
    dekBytes.fill(0);
  }
}

function checkBlob(blob: VaultBlob): void {
  if (blob?.v !== BLOB_VERSION) throw new VaultError(`Unsupported vault blob version ${blob?.v}`);
  if (blob.kdf?.alg !== KDF_ALG || blob.data?.alg !== DATA_ALG) {
    throw new VaultError("Unsupported vault algorithms");
  }
  // A blob that asks for a weak KDF could make a guessed passphrase cheap to test.
  if (!(blob.kdf.iterations >= MIN_ITERATIONS)) throw new VaultError("KDF iterations too low");
  if (typeof blob.aad !== "string") throw new VaultError("Vault blob has no authenticated data");
}

/** Decrypts in the browser. A wrong passphrase or any changed byte throws VaultError. */
export async function decryptBlob(blob: VaultBlob, passphrase: string): Promise<Blob> {
  checkPassphrase(passphrase);
  checkBlob(blob);
  const aad = encoder.encode(blob.aad);
  let dekBytes: Uint8Array<ArrayBuffer> | null = null;
  try {
    const kek = await deriveKek(passphrase, fromBase64(blob.kdf.salt), blob.kdf.iterations);
    dekBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromBase64(blob.wrapped_dek.nonce), additionalData: aad },
        kek,
        fromBase64(blob.wrapped_dek.ciphertext),
      ),
    );
    const dek = await crypto.subtle.importKey("raw", dekBytes, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(blob.data.nonce), additionalData: aad },
      dek,
      fromBase64(blob.data.ciphertext),
    );
    return new Blob([plain]);
  } catch {
    // GCM cannot tell a wrong passphrase from tampering, and we should not guess.
    throw new VaultError("Wrong passphrase, or the file was changed");
  } finally {
    dekBytes?.fill(0);
  }
}

/**
 * Crypto-shredding: without the wrapped key the ciphertext can never be decrypted, even by
 * someone who later learns the passphrase. Delete the returned blob's server copy as well.
 */
export function shredBlob(blob: VaultBlob): Omit<VaultBlob, "wrapped_dek"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropping the key is the point
  const { wrapped_dek, ...rest } = blob;
  return rest;
}

// ---------- audit log ----------

// Canonical JSON for hashing: keys sorted, no whitespace (section 8).
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(text));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hashOf(entry: Omit<AuditEntry, "hash">): Promise<string> {
  return sha256Hex(canonical(entry));
}

/** Compares two hex strings without exiting early on the first difference. */
function sameHex(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkEntry(entry: NewAuditEntry): void {
  const keys = Object.keys(entry).sort();
  if (keys.join() !== ENTRY_KEYS.join()) {
    // An extra key could smuggle a value into the log; the log holds field names only.
    throw new VaultError(`Audit entries have exactly these keys: ${ENTRY_KEYS.join(", ")}`);
  }
  if (!ACTIONS.has(entry.action)) throw new VaultError(`Unknown audit action ${entry.action}`);
  if (!Array.isArray(entry.fields) || !entry.fields.every((f) => typeof f === "string")) {
    throw new VaultError("Audit fields must be a list of field names");
  }
  if (Number.isNaN(Date.parse(entry.ts))) throw new VaultError("Audit ts must be an ISO time");
  if (typeof entry.actor !== "string" || typeof entry.purpose !== "string") {
    throw new VaultError("Audit actor and purpose must be text");
  }
}

let auditChain: AuditEntry[] = [];

/**
 * Appends an entry and returns it with its index and hashes. Pass `chain` when the caller already
 * holds the log (the UI seeds one); otherwise this module's own copy is used.
 */
export async function appendAudit(entry: NewAuditEntry, chain?: AuditEntry[]): Promise<AuditEntry> {
  checkEntry(entry);
  const base = chain ?? auditChain;
  const last = base[base.length - 1];
  const body: Omit<AuditEntry, "hash"> = {
    idx: base.length,
    ts: entry.ts,
    actor: entry.actor,
    action: entry.action,
    fields: [...entry.fields],
    purpose: entry.purpose,
    prev_hash: last ? last.hash : GENESIS_HASH,
  };
  const appended: AuditEntry = { ...body, hash: await hashOf(body) };
  auditChain = [...base, appended];
  return appended;
}

/** Recomputes every hash and link. `brokenAt` is the index of the first entry that fails. */
export async function verifyChain(entries: AuditEntry[]): Promise<VerifyResult> {
  let previous = GENESIS_HASH;
  for (const [position, entry] of entries.entries()) {
    const { hash, ...body } = entry;
    const intact =
      entry.idx === position &&
      sameHex(entry.prev_hash, previous) &&
      sameHex(await hashOf(body), hash);
    if (!intact) return { ok: false, brokenAt: position };
    previous = hash;
  }
  return { ok: true };
}

/** The value to anchor with `PUT /api/audit/head`, or null for an empty log. */
export function auditHead(): { idx: number; hash: string } | null {
  const last = auditChain[auditChain.length - 1];
  return last ? { idx: last.idx, hash: last.hash } : null;
}

/** Clears this module's copy of the log. For demo reset and tests. */
export function resetAudit(): void {
  auditChain = [];
}

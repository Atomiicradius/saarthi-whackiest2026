import * as realModule from "vault-real";
import type { AuditEntry } from "@/lib/types";

// The UI talks to the vault only through this file. The real vault module (web/vault, owned by
// another teammate) is used automatically when it exports all four functions below. Until then
// an in-file STUB runs, built on WebCrypto, so the demo is honest but it is not the vault.

// Section 7 of context/data-and-contracts.md.
export interface VaultBlob {
  v: number;
  kdf: { alg: string; iterations: number; salt: string };
  wrapped_dek: { nonce: string; ciphertext: string };
  data: { alg: string; nonce: string; ciphertext: string };
  aad: string;
}

export interface VerifyResult {
  ok: boolean;
  brokenAt?: number;
}

// Everything in an audit entry except what the chain itself computes.
export type NewAuditEntry = Omit<AuditEntry, "idx" | "prev_hash" | "hash">;

export interface VaultApi {
  /** Encrypts in the browser. Plaintext and passphrase never leave it. */
  encryptFile(file: File, passphrase: string): Promise<VaultBlob>;
  /** Decrypts in the browser. A wrong passphrase or tampered blob must throw. */
  decryptBlob(blob: VaultBlob, passphrase: string): Promise<Blob>;
  /** Appends to the hash-chained audit log. `chain` is the log so far (the stub needs it). */
  appendAudit(entry: NewAuditEntry, chain: AuditEntry[]): Promise<AuditEntry>;
  /** Recomputes every hash and link. `brokenAt` is the first entry that fails. */
  verifyChain(entries: AuditEntry[]): Promise<VerifyResult>;
}

const GENESIS_HASH = "0".repeat(64);
const PBKDF2_ITERATIONS = 600_000;
const encoder = new TextEncoder();

function warnStub(name: string): void {
  if (process.env.NODE_ENV !== "production") console.info(`STUB vault: ${name}`);
}

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

const stub: VaultApi = {
  async encryptFile(file, passphrase) {
    warnStub("encryptFile");
    const aad = `${crypto.randomUUID()}|demo-user`;
    const salt = randomBytes(16);
    const dekBytes = randomBytes(32);
    const dek = await crypto.subtle.importKey("raw", dekBytes, "AES-GCM", false, ["encrypt"]);
    const dataNonce = randomBytes(12);
    const ciphertext = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: dataNonce, additionalData: encoder.encode(aad) },
      dek,
      await file.arrayBuffer(),
    );
    const kek = await deriveKek(passphrase, salt, PBKDF2_ITERATIONS);
    const wrapNonce = randomBytes(12);
    const wrapped = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: wrapNonce, additionalData: encoder.encode(aad) },
      kek,
      dekBytes,
    );
    return {
      v: 1,
      kdf: { alg: "PBKDF2-SHA256", iterations: PBKDF2_ITERATIONS, salt: toBase64(salt) },
      wrapped_dek: { nonce: toBase64(wrapNonce), ciphertext: toBase64(new Uint8Array(wrapped)) },
      data: {
        alg: "AES-256-GCM",
        nonce: toBase64(dataNonce),
        ciphertext: toBase64(new Uint8Array(ciphertext)),
      },
      aad,
    };
  },

  async decryptBlob(blob, passphrase) {
    warnStub("decryptBlob");
    const aad = encoder.encode(blob.aad);
    const kek = await deriveKek(passphrase, fromBase64(blob.kdf.salt), blob.kdf.iterations);
    const dekBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(blob.wrapped_dek.nonce), additionalData: aad },
      kek,
      fromBase64(blob.wrapped_dek.ciphertext),
    );
    const dek = await crypto.subtle.importKey("raw", dekBytes, "AES-GCM", false, ["decrypt"]);
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(blob.data.nonce), additionalData: aad },
      dek,
      fromBase64(blob.data.ciphertext),
    );
    return new Blob([plain]);
  },

  async appendAudit(entry, chain) {
    warnStub("appendAudit");
    const last = chain[chain.length - 1];
    const body = { idx: chain.length, ...entry, prev_hash: last ? last.hash : GENESIS_HASH };
    return { ...body, hash: await hashOf(body) };
  },

  async verifyChain(entries) {
    warnStub("verifyChain");
    let previous = GENESIS_HASH;
    for (const entry of entries) {
      const { hash, ...body } = entry;
      if (entry.prev_hash !== previous || (await hashOf(body)) !== hash) {
        return { ok: false, brokenAt: entry.idx };
      }
      previous = hash;
    }
    return { ok: true };
  },
};

function realApi(): VaultApi | null {
  const candidate = realModule as Record<string, unknown>;
  const names = ["encryptFile", "decryptBlob", "appendAudit", "verifyChain"];
  if (!names.every((name) => typeof candidate[name] === "function")) return null;
  const call = (name: string, ...args: unknown[]) =>
    Promise.resolve((candidate[name] as (...input: unknown[]) => unknown)(...args));
  return {
    encryptFile: (file, passphrase) => call("encryptFile", file, passphrase) as Promise<VaultBlob>,
    decryptBlob: (blob, passphrase) => call("decryptBlob", blob, passphrase) as Promise<Blob>,
    // The UI seeds its own log, so the chain is passed on and the next idx continues from it.
    appendAudit: (entry, chain) => call("appendAudit", entry, chain) as Promise<AuditEntry>,
    verifyChain: (entries) => call("verifyChain", entries) as Promise<VerifyResult>,
  };
}

const real = realApi();

export const vaultMode: "real" | "stub" = real ? "real" : "stub";
export const vault: VaultApi = real ?? stub;

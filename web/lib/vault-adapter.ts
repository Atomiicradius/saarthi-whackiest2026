import type { AuditEntry } from "@/lib/types";

// Typed stub. The vault itself (web/vault) is owned by another teammate and is not built yet.
// The UI calls this adapter only, so wiring the real vault later changes this file alone.
export interface VaultDocument {
  id: string;
  label: string;
}

export interface VaultAdapter {
  /** Encrypts in the browser and stores ciphertext only. Never sends plaintext to the server. */
  storeDocument(file: File, passphrase: string): Promise<VaultDocument>;
  /** Decrypts in the browser. A wrong passphrase must fail. */
  openDocument(id: string, passphrase: string): Promise<Blob>;
  listDocuments(): Promise<VaultDocument[]>;
  /** Hash-chained audit log, newest last. */
  readAuditLog(): Promise<AuditEntry[]>;
  /** True when every entry's hash and prev_hash chain verifies. */
  verifyAuditLog(entries: AuditEntry[]): Promise<boolean>;
}

function notReady(): never {
  throw new Error("Vault is not connected yet.");
}

export const vaultAdapter: VaultAdapter = {
  storeDocument: notReady,
  openDocument: notReady,
  listDocuments: notReady,
  readAuditLog: notReady,
  verifyAuditLog: notReady,
};

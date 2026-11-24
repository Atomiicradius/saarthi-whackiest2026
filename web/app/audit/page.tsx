import { StubScreen } from "@/components/stub-screen";

// Stub route. The audit timeline reads from lib/vault-adapter.ts once the vault is connected.
export default function AuditPage() {
  return (
    <StubScreen title="Audit" body="A tamper-evident log of who used which field. Coming soon." />
  );
}

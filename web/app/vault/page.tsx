import { StubScreen } from "@/components/stub-screen";

// Stub route. The vault UI is built on top of lib/vault-adapter.ts by its owner.
export default function VaultPage() {
  return (
    <StubScreen
      title="Vault"
      body="Your documents will be encrypted on this device. Coming soon."
    />
  );
}

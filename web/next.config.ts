import { existsSync } from "node:fs";
import path from "node:path";
import type { NextConfig } from "next";

// The real vault module lives in web/vault (owned by another teammate). If its entry file exists,
// "vault-real" resolves to it; otherwise to an empty placeholder and lib/vault-adapter.ts uses its
// in-file stub. The check runs at startup, so restart `npm run dev` after the vault module lands.
const vaultEntry = ["index.ts", "index.tsx"].find((file) =>
  existsSync(path.join(process.cwd(), "vault", file)),
);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  turbopack: {
    resolveAlias: {
      "vault-real": vaultEntry ? `./vault/${vaultEntry}` : "./lib/vault-missing.ts",
    },
  },
};

export default nextConfig;

// "vault-real" is an alias set in next.config.ts. It is the real vault module when web/vault
// exists. lib/vault-adapter.ts checks at runtime which functions it actually exports.
declare module "vault-real";

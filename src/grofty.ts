// Thin wrapper around @groftylabs/dapp-sdk so the UI never touches the raw provider.
// SDK facts (verified against groftywallet/grofty-dapp-sdk README, v0.2.0):
//  - createGroftyClient() -> GroftyClient | null (null when extension missing / SSR)
//  - connect(), getPrimaryAccount() -> { partyId }, getActiveNetwork() -> { networkId }
//  - getBalance(), prepareExecuteAndWait({ receiver, amount, tokenSymbol?, memo? }) -> { tx }
//  - Grofty is MAINNET ONLY: reports canton:da-mainnet, no network switching.
import { createGroftyClient, isUserRejection } from "@groftylabs/dapp-sdk";

export type GroftyClient = NonNullable<Awaited<ReturnType<typeof createGroftyClient>>>;

export async function getClient(): Promise<GroftyClient | null> {
  // discoveryTimeoutMs bounds how long we wait for the extension to answer.
  return createGroftyClient({ discoveryTimeoutMs: 1500 });
}

export { isUserRejection };

// getBalance() shape is not pinned by the README, so normalise defensively.
export function readBalance(raw: unknown, symbol: string): string | null {
  if (raw == null) return null;
  const want = symbol.toUpperCase();
  const pick = (o: any): string | null => {
    if (o == null) return null;
    if (typeof o === "string" || typeof o === "number") return String(o);
    if (Array.isArray(o)) {
      const hit = o.find(
        (e) => String(e?.tokenSymbol ?? e?.symbol ?? "").toUpperCase() === want
      );
      return hit ? String(hit.amount ?? hit.balance ?? hit.value ?? "") : null;
    }
    if (typeof o === "object") {
      if (want in o) return String((o as any)[want]);
      if ("balances" in o) return pick((o as any).balances);
      if ("amount" in o) return String((o as any).amount);
    }
    return null;
  };
  return pick(raw);
}

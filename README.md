# Grofty Pay — end-to-end Canton MainNet checkout

A minimal, production-shaped web app that completes a **real end-to-end MainNet
transaction** through the **Grofty** wallet, built for the HackCanton season-3
Grofty integration bounty.

Flow: **Connect Grofty → read Party ID + balance → pay CC / USDCx to a Party ID →
transaction executed on Canton MainNet → show the `updateId`.**

## Why this qualifies

- Uses the official **`@groftylabs/dapp-sdk`** (CIP-0103, the Canton dApp standard).
- Runs the full non-custodial path: **Prepare → Sign (in the extension) → Execute**
  on `canton:da-mainnet`. The key never leaves the device; the dApp only calls
  `prepareExecuteAndWait(...)` and shows the resulting on-ledger `updateId`.
- MainNet only — Grofty reports `canton:da-mainnet` and does not implement network
  switching, so every successful transfer is a real MainNet transfer that also
  emits the CIP-56 `FeaturedAppActivityMarker`.

## Integration surface (where the SDK is used)

- `src/grofty.ts` — thin wrapper over `createGroftyClient()`; defensive balance reader.
- `src/App.tsx` — the UI flow:
  - `client.connect()` + `client.getPrimaryAccount()` → Party ID
  - `client.getActiveNetwork()` → `canton:da-mainnet`
  - `client.getBalance()` → balance
  - `client.prepareExecuteAndWait({ receiver, amount, tokenSymbol, memo })`
    → `tx.payload.updateId`
  - `client.on('accountsChanged', …)` to track account switches
  - errors branched on `GroftyRpcError.code` via `isUserRejection(...)`

## Requirements to run the real MainNet test

1. **Grofty Wallet** browser extension installed, **v2.0.4+** (older versions:
   `createGroftyClient()` returns `null` or key features fail).
2. A Canton Party with **real CC** (and/or USDCx) on MainNet — end-to-end MainNet
   means a real transfer. Fees are deducted *from* the amount, so send an amount
   greater than the fee.
3. A **receiver Party ID** (your treasury / a second wallet). Paste it in the UI,
   or hardcode it in `TREASURY_PARTY_ID` at the top of `src/App.tsx`.

## Run

```bash
npm install
npm run dev     # http://localhost:5190
```

Then: open the page with the Grofty extension installed → **Connect Grofty** →
enter receiver + amount → **Pay** → approve & sign in the extension → the page
shows the executed `updateId`. That `updateId` + the extension's transaction
record is the end-to-end MainNet proof for submission.

## Build

```bash
npm run build   # tsc -b && vite build  (verified passing)
```

## Notes

- Pure client-side; `@groftylabs/dapp-sdk` is zero-dependency and SSR-safe.
- No API keys, no backend — the extension owns signing and submission.
- Portable: the `src/grofty.ts` + flow in `App.tsx` lift directly into any larger
  app (e.g. a "pay for credits with Canton Coin" checkout).

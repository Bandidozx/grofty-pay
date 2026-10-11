# Grofty Pay — HackCanton S3 submission

> **Copy-paste this into the HackCanton submission form.** Two placeholders are marked
> `⟪…⟫` — fill them after you run the MainNet test (see "Proof" below). Everything else is done.

---

## Project name
**Grofty Pay** — end-to-end Canton MainNet checkout via Grofty

## One-liner
A minimal, production-shaped web checkout that completes a **real end-to-end MainNet
transaction** through the **Grofty** wallet: connect → read Party ID + balance → pay CC / USDCx
to any Party ID → transaction executed on Canton MainNet → shows the on-ledger `updateId`.

## What it does (the end-to-end MainNet flow)
1. **Connect Grofty** — `createGroftyClient()` discovers the extension (CIP-0103 announce), `connect()`.
2. **Read account** — `getPrimaryAccount().partyId` + `getActiveNetwork()` (`canton:da-mainnet`) + `getBalance()`.
3. **Pay** — user enters receiver Party ID, amount, asset (CC/USDCx), memo, then
   `prepareExecuteAndWait({ receiver, amount, tokenSymbol, memo })` runs the full non-custodial
   **Prepare → Sign (in the extension) → Execute** path.
4. **Proof** — the resulting `tx.payload.updateId` is shown; that is the on-ledger MainNet record.

## Why it qualifies
- Uses the **official `@groftylabs/dapp-sdk`** (v0.2.0, CIP-0103 — the Canton dApp standard).
- Full **non-custodial** path on `canton:da-mainnet`: the private key never leaves the device;
  the dApp only calls `prepareExecuteAndWait(...)` and reads back the `updateId`.
- **MainNet-only by construction** — Grofty reports `canton:da-mainnet` and implements no network
  switching, so every successful transfer is a real MainNet transfer that also emits the
  CIP-56 `FeaturedAppActivityMarker`.
- Account-change aware (`accountsChanged`), rejection-aware (`isUserRejection` on `GroftyRpcError`).

## Integration surface (where the SDK is used)
- `src/grofty.ts` — thin wrapper over `createGroftyClient()` + defensive balance reader.
- `src/App.tsx` — the full UI flow (connect, read, pay, show `updateId`, error branching).

## Tech
Vite + React + TypeScript, pure client-side, zero backend, no API keys. The extension owns
signing + submission. SDK is zero-dependency and SSR-safe.

## Run
```bash
npm install
npm run dev     # http://localhost:5190
```
Open with the Grofty extension (v2.0.4+) installed → Connect → enter receiver + amount → Pay →
approve & sign in the extension → the page shows the executed `updateId`.

## Build (verified passing)
```bash
npm run build   # tsc -b && vite build  →  33 modules, 152 kB bundle, clean
```

## Proof — end-to-end MainNet transaction
- Network: `canton:da-mainnet`
- Asset / amount: ⟪e.g. 1 CC⟫
- Receiver Party ID: ⟪your treasury / second wallet Party ID⟫
- **On-ledger `updateId`: ⟪PASTE updateId FROM THE APP AFTER PAYING⟫**
- Grofty extension transaction record: ⟪screenshot/entry from the extension⟫

## Links
- Repo: ⟪public repo URL — see note below⟫
- Demo / video: ⟪optional: short screen capture of connect → pay → updateId⟫

---

### Notes for you (not part of the submission text)
- **Fees are deducted *from* the amount** — send more than the fee or the receiver gets ~0.
- If the form requires a public repo link and `grofty-canton-app` isn't pushed yet, that's the
  only remaining setup step. Say the word and I'll prep the push.
- Deadline: **2026-10-12, before 12:00 UTC (19:00 WIB)** — closing ceremony per your email.

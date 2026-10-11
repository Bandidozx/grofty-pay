import { useCallback, useEffect, useState } from "react";
import { getClient, isUserRejection, readBalance, type GroftyClient } from "./grofty";

type Phase = "idle" | "connecting" | "ready" | "sending" | "done" | "error";

const TREASURY_PARTY_ID = ""; // <-- set your receiver Canton Party ID here (or paste one below)

export function App() {
  const [client, setClient] = useState<GroftyClient | null>(null);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [partyId, setPartyId] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [balance, setBalance] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [err, setErr] = useState<string>("");

  const [receiver, setReceiver] = useState(TREASURY_PARTY_ID);
  const [amount, setAmount] = useState("1");
  const [token, setToken] = useState("CC");
  const [memo, setMemo] = useState("Grofty Pay demo");
  const [updateId, setUpdateId] = useState("");

  // Discover the extension once on mount.
  useEffect(() => {
    getClient().then((c) => {
      setClient(c);
      setInstalled(!!c);
    });
  }, []);

  const refreshBalance = useCallback(async (c: GroftyClient) => {
    try {
      const raw = await (c as any).getBalance();
      setBalance(readBalance(raw, token));
    } catch {
      setBalance(null);
    }
  }, [token]);

  const connect = useCallback(async () => {
    if (!client) return;
    setPhase("connecting"); setErr("");
    try {
      await client.connect();
      const acct = await client.getPrimaryAccount();
      const net = await (client as any).getActiveNetwork?.();
      setPartyId(acct?.partyId ?? "");
      setNetwork(net?.networkId ?? "");
      setReceiver((r) => r || TREASURY_PARTY_ID);
      await refreshBalance(client);
      setPhase("ready");
      client.on?.("accountsChanged", async () => {
        const a = await client.getPrimaryAccount();
        setPartyId(a?.partyId ?? "");
        await refreshBalance(client);
      });
    } catch (e: any) {
      setErr(isUserRejection(e) ? "You rejected the connection." : (e?.message ?? String(e)));
      setPhase("error");
    }
  }, [client, refreshBalance]);

  const pay = useCallback(async () => {
    if (!client) return;
    if (!receiver.trim()) { setErr("Enter a receiver Party ID."); return; }
    setPhase("sending"); setErr(""); setUpdateId("");
    try {
      const res: any = await (client as any).prepareExecuteAndWait({
        receiver: receiver.trim(),
        amount: amount.trim(),
        tokenSymbol: token,
        memo: memo || undefined,
      });
      const id = res?.tx?.payload?.updateId ?? res?.tx?.updateId ?? "";
      setUpdateId(id);
      setPhase("done");
      await refreshBalance(client);
    } catch (e: any) {
      setErr(isUserRejection(e) ? "You rejected the transfer." : (e?.message ?? String(e)));
      setPhase("error");
    }
  }, [client, receiver, amount, token, memo, refreshBalance]);

  const explorer = updateId ? `https://rh-scan.com/` : "";

  return (
    <main style={S.wrap}>
      <h1 style={S.h1}>Grofty&nbsp;Pay</h1>
      <p style={S.sub}>End-to-end <b>Canton MainNet</b> checkout — connect Grofty, pay in CC / USDCx.</p>

      {installed === false && (
        <div style={S.warn}>
          Grofty Wallet extension not detected. Install Grofty (v2.0.4+) and reload.{" "}
          <a href="https://grofty.cc/" target="_blank" rel="noreferrer">grofty.cc</a>
        </div>
      )}

      {!partyId ? (
        <button style={S.btn} disabled={!client || phase === "connecting"} onClick={connect}>
          {phase === "connecting" ? "Connecting…" : "Connect Grofty"}
        </button>
      ) : (
        <section style={S.card}>
          <Row label="Party ID" value={partyId} mono />
          <Row label="Network" value={network || "—"} mono />
          <Row label={`Balance (${token})`} value={balance ?? "—"} />
          <hr style={S.hr} />
          <label style={S.lbl}>Receiver Party ID
            <input style={S.in} value={receiver} onChange={(e) => setReceiver(e.target.value)} placeholder="party-…::1220…" />
          </label>
          <div style={S.grid}>
            <label style={S.lbl}>Amount
              <input style={S.in} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </label>
            <label style={S.lbl}>Asset
              <select style={S.in} value={token} onChange={(e) => setToken(e.target.value)}>
                <option>CC</option><option>USDCx</option>
              </select>
            </label>
          </div>
          <label style={S.lbl}>Memo
            <input style={S.in} value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>
          <button style={S.btn} disabled={phase === "sending"} onClick={pay}>
            {phase === "sending" ? "Awaiting signature…" : `Pay ${amount} ${token}`}
          </button>
          <p style={S.note}>Fee is deducted from the amount — receiver gets amount minus fee. You approve &amp; sign in the extension; the key never leaves your device.</p>
        </section>
      )}

      {phase === "done" && (
        <div style={S.ok}>
          ✅ Executed on Canton MainNet.<br />
          <span style={S.mono}>updateId: {updateId || "(pending event)"}</span>
          {explorer && <> · <a href={explorer} target="_blank" rel="noreferrer">explorer</a></>}
        </div>
      )}
      {err && <div style={S.warn}>{err}</div>}
    </main>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={S.row}>
      <span style={S.rowK}>{label}</span>
      <span style={{ ...S.rowV, ...(mono ? S.mono : {}) }}>{value}</span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 460, margin: "6vh auto", padding: 24, fontFamily: "system-ui, sans-serif", color: "#e9e6f0" },
  h1: { margin: 0, fontSize: 34, letterSpacing: -1 },
  sub: { color: "#a79fbf", marginTop: 4 },
  card: { background: "#17121f", border: "1px solid #2b2340", borderRadius: 14, padding: 18, marginTop: 16 },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0" },
  rowK: { color: "#8c84a6" }, rowV: { textAlign: "right", wordBreak: "break-all" },
  hr: { border: 0, borderTop: "1px solid #2b2340", margin: "12px 0" },
  lbl: { display: "block", fontSize: 13, color: "#a79fbf", marginTop: 10 },
  in: { width: "100%", boxSizing: "border-box", marginTop: 4, padding: "9px 10px", borderRadius: 9, border: "1px solid #2b2340", background: "#0f0b16", color: "#e9e6f0" },
  grid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 },
  btn: { width: "100%", marginTop: 16, padding: "12px 16px", borderRadius: 10, border: 0, background: "#7c5cff", color: "#fff", fontWeight: 600, fontSize: 15, cursor: "pointer" },
  note: { fontSize: 12, color: "#8c84a6", marginTop: 10, lineHeight: 1.5 },
  ok: { marginTop: 16, padding: 14, borderRadius: 10, background: "#10261a", border: "1px solid #1f5a37", color: "#8ff0b5", lineHeight: 1.6 },
  warn: { marginTop: 16, padding: 14, borderRadius: 10, background: "#2a1620", border: "1px solid #5a2130", color: "#f0a5b5" },
  mono: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 },
};

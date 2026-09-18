"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileStack, PlusCircle, RefreshCw, Search, AlertTriangle } from "lucide-react";
import "../monitor.css";
import { useWallet } from "@/lib/useWallet";
import { readContract, writeContract, TimeoutError } from "@/lib/genlayer";
import { EXPLORER_TX_URL, CONTRACT_ADDRESS } from "@/config/chains";

const FORM_TYPES = ["10-Q", "10-K", "8-K"];

type TxState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "ok"; hash: string; message: string }
  | { kind: "timeout"; hash: string }
  | { kind: "err"; message: string };

function TxBanner({ state }: { state: TxState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "pending") {
    return (
      <div className="pending-note">
        <span className="spinner" /> Waiting for validator consensus — this can take
        several minutes.
      </div>
    );
  }
  if (state.kind === "ok") {
    return (
      <div className="tx-result ok">
        {state.message} ·{" "}
        <a href={EXPLORER_TX_URL(state.hash)} target="_blank" rel="noreferrer">
          view transaction
        </a>
      </div>
    );
  }
  if (state.kind === "timeout") {
    return (
      <div className="tx-result timeout">
        Still finalizing — your transaction was submitted.{" "}
        <a href={EXPLORER_TX_URL(state.hash)} target="_blank" rel="noreferrer">
          check status
        </a>
      </div>
    );
  }
  return <div className="tx-result err">{state.message}</div>;
}

function ObligationForm({
  account,
  onRegistered,
}: {
  account: string | null;
  onRegistered: () => void;
}) {
  const [cik, setCik] = useState("");
  const [ticker, setTicker] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [requiredForm, setRequiredForm] = useState(FORM_TYPES[0]);
  const [periodLabel, setPeriodLabel] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [cadenceDays, setCadenceDays] = useState("90");
  const [tx, setTx] = useState<TxState>({ kind: "idle" });

  const submit = useCallback(async () => {
    if (!account) return;
    setTx({ kind: "pending" });
    try {
      const deadlineAt = Math.floor(new Date(deadlineDate).getTime() / 1000);
      const cadenceSeconds = Number(cadenceDays) * 86400;
      const totalsBefore = await readContract("get_totals");
      const expectedId = String(Number(totalsBefore?.obligations ?? 0));
      const { hash } = await writeContract(account as `0x${string}`, "register_obligation", [
        cik,
        ticker,
        companyName,
        requiredForm,
        periodLabel,
        deadlineAt,
        cadenceSeconds,
      ]);
      setTx({ kind: "ok", hash, message: `Registered as obligation #${expectedId}` });
      onRegistered();
    } catch (err: any) {
      if (err instanceof TimeoutError) setTx({ kind: "timeout", hash: err.txHash });
      else setTx({ kind: "err", message: err?.message || "Registration failed" });
    }
  }, [account, cik, ticker, companyName, requiredForm, periodLabel, deadlineDate, cadenceDays, onRegistered]);

  return (
    <div className="panel">
      <h3>Register a disclosure obligation</h3>
      <p className="sub">
        Locked at creation — the evidence source is derived from the CIK alone,
        never a link you enter here.
      </p>

      <div className="field-row-2">
        <div className="field">
          <label>SEC CIK (digits only)</label>
          <input value={cik} onChange={(e) => setCik(e.target.value)} placeholder="0000320193" />
        </div>
        <div className="field">
          <label>Ticker</label>
          <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="AAPL" />
        </div>
      </div>

      <div className="field">
        <label>Company name</label>
        <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Apple Inc." />
      </div>

      <div className="field-row-2">
        <div className="field">
          <label>Required form</label>
          <select value={requiredForm} onChange={(e) => setRequiredForm(e.target.value)}>
            {FORM_TYPES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Reporting period label</label>
          <input value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} placeholder="FY2026 Q3" />
        </div>
      </div>

      <div className="field-row-2">
        <div className="field">
          <label>First deadline date</label>
          <input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
          <div className="hint">Must be 1–180 days from now.</div>
        </div>
        <div className="field">
          <label>Cadence (days)</label>
          <input value={cadenceDays} onChange={(e) => setCadenceDays(e.target.value)} placeholder="90" />
        </div>
      </div>

      <button className="btn btn-primary" onClick={submit} disabled={!account || tx.kind === "pending"}>
        {tx.kind === "pending" ? <span className="spinner" /> : <PlusCircle size={15} />}
        Register obligation
      </button>
      <TxBanner state={tx} />
    </div>
  );
}

function ObligationCard({ id, account, onChanged }: { id: string; account: string | null; onChanged: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkTx, setCheckTx] = useState<TxState>({ kind: "idle" });
  const [check, setCheck] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const obligation = await readContract("get_obligation", [id]);
      setData(obligation);
      if (obligation?.latest_check_id) {
        const c = await readContract("get_check", [obligation.latest_check_id]);
        setCheck(c);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const openAndAssess = useCallback(async () => {
    if (!account) return;
    setCheckTx({ kind: "pending" });
    try {
      // open_check's own write return value IS the new check_id — read it
      // back via the totals view rather than guessing, since a write
      // receipt's decoded return isn't reliably exposed by every SDK
      // version. next_check_id (pre-increment) is the id just assigned.
      const totalsBefore = await readContract("get_totals");
      await writeContract(account as `0x${string}`, "open_check", [id]);
      const checkId = String(Number(totalsBefore?.checks ?? 0));
      const assessed = await writeContract(account as `0x${string}`, "assess_check", [checkId]);
      setCheckTx({ kind: "ok", hash: assessed.hash, message: "Checkpoint assessed" });
      onChanged();
      load();
    } catch (err: any) {
      if (err instanceof TimeoutError) setCheckTx({ kind: "timeout", hash: err.txHash });
      else setCheckTx({ kind: "err", message: err?.message || "Check failed" });
    }
  }, [account, id, onChanged, load]);

  if (loading) {
    return (
      <div className="obligation-card">
        <span className="spinner" /> Loading obligation…
      </div>
    );
  }
  if (!data) return null;

  const deadlineDate = new Date(data.deadline_at * 1000);
  const now = Date.now();
  const isDue = deadlineDate.getTime() <= now;

  return (
    <div className="obligation-card">
      <div className="top-row">
        <div>
          <div className="ticker">{data.ticker}</div>
          <div className="company">{data.company_name}</div>
        </div>
        <span className={`mini-stamp ${data.standing}`}>{data.standing}</span>
      </div>
      <div className="obligation-meta">
        <div>
          <span>FORM</span>
          {data.required_form}
        </div>
        <div>
          <span>PERIOD</span>
          {data.period_label}
        </div>
        <div>
          <span>NEXT DEADLINE</span>
          {deadlineDate.toLocaleDateString()}
        </div>
        <div>
          <span>CIK</span>
          {data.cik}
        </div>
      </div>
      {check && check.rationale && (
        <div className="rationale-box">{check.rationale}</div>
      )}
      <div className="obligation-actions">
        <button
          className="btn btn-outline btn-sm"
          onClick={openAndAssess}
          disabled={!account || !isDue || checkTx.kind === "pending"}
        >
          {checkTx.kind === "pending" ? <span className="spinner" /> : <RefreshCw size={13} />}
          {isDue ? "Open + assess checkpoint" : "Not yet due"}
        </button>
      </div>
      <TxBanner state={checkTx} />
    </div>
  );
}

function ObligationLookup({ account, refreshKey }: { account: string | null; refreshKey: number }) {
  const [lookupId, setLookupId] = useState("");
  const [ids, setIds] = useState<string[]>([]);

  const addLookup = useCallback(() => {
    if (lookupId.trim() && !ids.includes(lookupId.trim())) {
      setIds((prev) => [...prev, lookupId.trim()]);
      setLookupId("");
    }
  }, [lookupId, ids]);

  return (
    <div>
      <div className="panel">
        <h3>Track an obligation</h3>
        <p className="sub">
          Enter an obligation ID (returned when you registered it) to watch its
          standing here.
        </p>
        <div className="field-row-2">
          <div className="field" style={{ marginBottom: 0 }}>
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="Obligation ID, e.g. 0"
            />
          </div>
          <button className="btn btn-outline" onClick={addLookup}>
            <Search size={14} /> Track
          </button>
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="empty-state">
          <FileStack size={28} />
          <p>No obligations tracked yet in this session.</p>
        </div>
      ) : (
        <div style={{ marginTop: 18 }}>
          {ids.map((id) => (
            <ObligationCard key={`${id}-${refreshKey}`} id={id} account={account} onChanged={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Monitor() {
  const { account, connecting, connect } = useWallet();
  const [tab, setTab] = useState<"register" | "track">("register");
  const [refreshKey, setRefreshKey] = useState(0);
  const [contractReady, setContractReady] = useState<boolean | null>(null);

  useEffect(() => {
    readContract("get_contract_version")
      .then(() => setContractReady(true))
      .catch(() => setContractReady(false));
  }, []);

  return (
    <div className="console">
      <div className="console-shell">
        <div className="console-head">
          <Link href="/" className="back">
            <ArrowLeft size={15} /> FilingWatch
          </Link>
          {account ? (
            <span className="wallet-pill">
              {account.slice(0, 6)}…{account.slice(-4)}
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={connect} disabled={connecting}>
              {connecting ? <span className="spinner" /> : null}
              Connect wallet
            </button>
          )}
        </div>

        {contractReady === false && (
          <div className="panel" style={{ marginBottom: 18, borderColor: "var(--stamp-red)" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <AlertTriangle size={18} color="var(--stamp-red-ink)" />
              <div>
                <h3 style={{ marginBottom: 4 }}>Contract unreachable</h3>
                <p className="sub" style={{ marginBottom: 0 }}>
                  Couldn&rsquo;t reach FilingWatch at {CONTRACT_ADDRESS}. Confirm the
                  address in config/chains.ts matches the current deployment.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="tabs">
          <button className={`tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")}>
            Register
          </button>
          <button className={`tab ${tab === "track" ? "active" : ""}`} onClick={() => setTab("track")}>
            Track obligations
          </button>
        </div>

        {tab === "register" ? (
          <ObligationForm account={account} onRegistered={() => setRefreshKey((k) => k + 1)} />
        ) : (
          <ObligationLookup account={account} refreshKey={refreshKey} />
        )}
      </div>
    </div>
  );
}

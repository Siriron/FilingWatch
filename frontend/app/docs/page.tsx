import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: "FilingWatch locks a recurring SEC disclosure obligation — CIK, required form, deadline, cadence — and checks it against EDGAR's own submissions record via independent GenLayer validator consensus. No stake, no fund custody: the output is a durable, fail-closed compliance-standing record.",
  },
  {
    id: "how-it-works",
    title: "How it works",
    body: "register_obligation locks the obligation. Once its deadline passes, open_check creates a checkpoint and rolls the deadline forward by the cadence. assess_check runs gl.eq_principle.prompt_comparative: independent validators each fetch EDGAR fresh and must agree exactly on the matched filing's form, date, and accession number. A deterministic layer then re-derives SATISFIED vs. LATE from that date against the sealed deadline — the model never gets to hand over its own verdict label directly.",
  },
  {
    id: "architecture",
    title: "Architecture",
    body: "Two storage record types (Obligation, Check) plus a lightweight boolean index preventing duplicate checkpoints. Full diagram and evidence-binding rationale in docs/architecture.md in the repository.",
  },
  {
    id: "smart-contracts",
    title: "Smart contracts",
    body: "contracts/FilingWatch.py — the only contract in this repo. Full method table, verdict-reachability trace, and deliberate-gaps list in docs/contracts.md.",
  },
  {
    id: "api-reference",
    title: "API reference",
    body: "Writes: register_obligation, open_check, assess_check, close_obligation. Views (all plain dict): get_contract_version, get_obligation, get_check, get_totals. Full parameter and precondition table in docs/contracts.md.",
  },
  {
    id: "faq",
    title: "FAQ",
    body: "Why not a submitter-supplied evidence URL? Because a caller-chosen page only proves the page repeats a claim, not that the claim is true — the evidence source here is instead derived deterministically from the locked CIK, and EDGAR's own JSON is required to echo that CIK before anything in it counts as evidence. Why no stake? There's no adversarial counterparty positioned to benefit from a false verdict here, so a slashing mechanic would be decorative rather than structural. Is this legal or investment advice? No — it's a public monitoring record, not a compliance or legal determination.",
  },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--paper)" }}>
      <div className="shell" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <Link href="/" className="back" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28, fontSize: 13.5, color: "var(--ink-soft)" }}>
          <ArrowLeft size={15} /> FilingWatch
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, marginBottom: 36 }}>
          Documentation
        </h1>
        {sections.map((s) => (
          <section key={s.id} id={s.id} style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid var(--hairline)" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.65, maxWidth: "62ch" }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

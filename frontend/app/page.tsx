import Link from "next/link";
import { FileStack, Radar, ShieldCheck, Gavel } from "lucide-react";

const verdicts: [string, string, string][] = [
  ["SATISFIED", "Required form filed on or before the sealed deadline.", "verified"],
  ["LATE", "Filed, but after the deadline had already passed.", "amber"],
  ["DELINQUENT", "Deadline passed with no matching filing in EDGAR's record.", "red"],
  ["UNRESOLVED", "EDGAR unreachable, ambiguous, or the CIK didn't confirm.", "quiet"],
];

export default function Home() {
  return (
    <>
      <header className="site">
        <div className="shell">
          <Link className="brand" href="/">
            <span className="mark">
              <FileStack size={15} />
            </span>
            FilingWatch
          </Link>
          <nav className="site-nav">
            <a href="#mechanism">Mechanism</a>
            <a href="#verdicts">Verdicts</a>
            <Link href="/docs">Docs</Link>
            <Link href="/monitor">Console</Link>
          </nav>
          <Link className="btn btn-outline" href="/monitor">
            Open console
          </Link>
        </div>
      </header>

      <main>
        <section className="hero shell">
          <div>
            <div className="eyebrow">GENLAYER · REGULATORY DISCLOSURE MONITOR</div>
            <h1>A filing deadline isn't met until EDGAR says so.</h1>
            <p className="lede">
              Lock a recurring SEC disclosure obligation to a company&rsquo;s own CIK.
              Independent validators fetch EDGAR&rsquo;s submissions record directly —
              never a link you supply — and judge whether the required filing landed
              on time.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/monitor">
                Register an obligation
              </Link>
              <a className="btn btn-quiet" href="#mechanism">
                See how it's checked
              </a>
            </div>
          </div>

          <div className="hero-panel">
            <div className={`stamp tone-verified`} style={{ marginBottom: 20 }}>
              <span className="stamp-label">CHECKPOINT #0412</span>
              <span className="stamp-status">SATISFIED</span>
            </div>
            <div className="field-row">
              <span>Form required</span>
              <span>10-Q</span>
            </div>
            <div className="field-row">
              <span>Matched filing</span>
              <span>2026-08-11</span>
            </div>
            <div className="field-row">
              <span>Source</span>
              <span>data.sec.gov</span>
            </div>
            <div className="field-row">
              <span>Consensus</span>
              <span>eq_principle</span>
            </div>
          </div>
        </section>

        <section id="mechanism" className="section shell">
          <div className="section-head">
            <div>
              <div className="num">01 — THE PRIMITIVE</div>
              <h2>Bound to a CIK, not a link.</h2>
            </div>
          </div>
          <p className="dek" style={{ marginTop: -20, marginBottom: 28 }}>
            The evidence source is never chosen by whoever files the obligation.
          </p>
          <div className="clause-grid">
            <article>
              <div className="index">FIELD</div>
              <b>Locked obligation</b>
              <p>
                CIK, required form type, reporting period and deadline are sealed at
                registration. Nothing about what gets checked can be reshaped later.
              </p>
            </article>
            <article>
              <div className="index">FETCH</div>
              <b>EDGAR, directly</b>
              <p>
                The fetch URL is built only from the locked CIK —
                data.sec.gov/submissions/CIK&#123;10-digit&#125;.json. No submitter
                link ever enters the contract.
              </p>
            </article>
            <article>
              <div className="index">JUDGE</div>
              <b>Independent consensus</b>
              <p>
                Validators re-fetch EDGAR fresh and agree via GenLayer&rsquo;s
                comparative equivalence principle on the exact matched filing, form
                and date — not a rounded-off summary.
              </p>
            </article>
          </div>
        </section>

        <section id="verdicts" className="section shell">
          <div className="section-head">
            <div>
              <div className="num">02 — FAIL CLOSED</div>
              <h2>Missing evidence is never a violation.</h2>
            </div>
          </div>
          <div className="verdict-rail">
            {verdicts.map(([label, copy, tone]) => (
              <div className="verdict-card" key={label}>
                <span className={`dot ${tone}`} />
                <span className="label">{label}</span>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section shell">
          <div className="section-head">
            <div>
              <div className="num">03 — SCOPE</div>
              <h2>A monitoring registry, not enforcement.</h2>
            </div>
          </div>
          <div className="evidence-strip">
            <span>
              <ShieldCheck /> No stake, no fund custody, no automatic penalty
            </span>
            <span>
              <Radar /> Every filing check re-derives its own verdict, never trusts a
              cached one
            </span>
            <span>
              <Gavel /> A standing record, not a legal compliance determination
            </span>
          </div>
        </section>
      </main>

      <footer className="site">
        <div className="shell">
          <span>FilingWatch — public EDGAR monitoring. Not legal or investment advice.</span>
          <Link href="/monitor">Open console →</Link>
        </div>
      </footer>
    </>
  );
}

# Threat model

## What this contract is and isn't

FilingWatch produces a **monitoring record**, not a legal compliance
determination and not an enforcement mechanism. No funds are held, staked,
or transferred by this contract. The worst outcome of a wrong verdict is a
wrong entry in a public standing record — there is no adversarial party
positioned to profit from a false verdict the way a claimant/respondent
would in a staked dispute, which is why this concept uses the single-party
attestation shape rather than staked arbitration.

## Adversarial scenarios considered

**A watcher registers a fake CIK to make a company look good or bad.**
`_clean_cik` only accepts a purely numeric string ≤10 digits — it cannot
be used to smuggle a URL, a different company's data, or anything other
than a well-formed CIK. If the CIK doesn't correspond to a real EDGAR
filer, `_fetch_json` will still succeed (EDGAR returns a generic 404-style
JSON body or an empty submissions object for an unassigned CIK) and the
evaluator's `cik_confirmed` check will fail, producing `UNRESOLVED` — never
a false `SATISFIED`/`DELINQUENT` for a company that was never actually
being monitored.

**A watcher tries to make an obligation trivially satisfiable by setting
an absurdly long deadline or cadence.** `register_obligation` caps
`deadline_at` to 1-180 days from registration and `cadence_seconds` to
1 day-1 year. A 10-year "obligation" that could never meaningfully fail
is rejected at registration.

**Someone opens a checkpoint before the deadline to force an early,
favorable `UNRESOLVED`/`DELINQUENT` read.** `open_check` asserts
`now >= obligation.deadline_at` — a checkpoint literally cannot be opened
early.

**A leader tries to fabricate a filing that doesn't exist in the EDGAR
JSON.** `_canonicalize` requires `matched_form`, `matched_filing_date`, and
`matched_accession` to all be present and well-formed for `match_found` to
resolve to anything but a rejected/UNRESOLVED shape; the equivalence
principle then requires an independent validator's own fresh fetch and
independent LLM read of the same public document to agree on the exact
same accession number and filing date. A leader-invented accession number
that doesn't correspond to anything a second, honest validator can find in
its own independently-fetched copy of the same document fails the
equivalence check outright — this is the same protection a hand-rolled
`validator_fn` re-derivation gives, expressed through the equivalence
principle instead.

**Prompt injection inside the fetched EDGAR JSON.** EDGAR's own JSON is
not free-form user text, but any field within it (a company's registered
`name`, former names, addresses) is nonetheless external, uncontrolled
data. The evaluator prompt wraps the entire fetched body in
`_wrap_untrusted()` with explicit instructions to treat it as data, never
instructions, and the same disclaimer is embedded directly into `_CHARTER`.

**An amendment filing is used to falsely claim an obligation is satisfied.**
`_canonicalize` requires `matched_form` to equal `required_form` exactly
(case- and suffix-sensitive) — `"10-Q/A"` never matches a `"10-Q"`
obligation, and the charter explicitly instructs the model not to accept
an amendment suffix as a match. This is enforced by deterministic string
comparison in `_canonicalize`, not left to the model's own judgment.

**Someone calls `assess_check` repeatedly, hoping to eventually get a
favorable verdict by chance (answer-shopping).** Once a check's `status`
becomes `ASSESSED`, `assess_check`'s own precondition
(`status in ("OPEN", "UNRESOLVED")`) blocks any further call against that
check_id. A check can only be re-assessed if its prior result was itself
`UNRESOLVED` — which is the fail-closed state precisely because a genuine
answer wasn't yet available, not a state a watcher can engineer on demand.

## What is NOT defended against (named explicitly)

- **EDGAR itself returning stale or delayed data.** This contract trusts
  EDGAR's submissions API as the fixed ground truth. If EDGAR's own
  indexing lags a real SEC filing by more than the obligation's deadline
  window, a genuinely-on-time filer could receive a false `DELINQUENT` or
  `LATE`. This is an accepted limitation of relying on any single
  authoritative source, matching this project's own confirmed pattern
  (SentinelSLA relies on GitHub's GHSA API the same way).
- **A company that files under a different or newly-changed CIK.**
  Obligations are locked to one CIK at registration; a corporate
  restructuring that changes a filer's CIK would require a new obligation,
  not an automatic migration.
- **Sybil registration of many obligations for the same company by
  different watchers.** Nothing in this contract prevents multiple parties
  from independently registering overlapping obligations for the same
  CIK — this is intentional; the contract is a permissionless monitoring
  registry, not a single canonical source of truth per company.

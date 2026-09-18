# Portal submission packet — FilingWatch

## Track
Projects track.

## Title
FilingWatch — SEC EDGAR Disclosure Deadline Monitor

## Description (806 chars — under the 1000-char cap)
FilingWatch locks a recurring SEC disclosure obligation (CIK, required
form 10-Q/10-K/8-K, deadline, cadence) on-chain. When the deadline passes,
assess_check runs GenLayer's gl.eq_principle.prompt_comparative:
independent validators each fetch data.sec.gov/submissions/CIK{cik}.json
directly (never a submitter URL) and must agree exactly on the matched
filing's form, date and accession number. A deterministic layer then
re-derives SATISFIED vs LATE from that date against the sealed deadline —
the model never hands over its own verdict label. No match plus a passed
deadline is DELINQUENT; anything ambiguous or unreachable fails closed to
UNRESOLVED, never a guessed violation. No stake or fund custody — the
output is a durable, fail-closed compliance-standing record on a
permissionless registry.

## Why this concept, checked against the Concept Evaluation Framework

- **Test 1 (consensus necessity):** single-party attestation shape
  (sanctioned fallback — no adversarial counterparty benefits from a false
  verdict here). Consensus need comes from the judgment being genuinely
  non-trivial (matching form/amended-form/period against a real filing
  list) and from removing any incentive for a self-report to matter — only
  EDGAR's independently-fetched record does.
- **Test 2 (evidence verifiability):** evidence is EDGAR's own submissions
  API, fetched fresh by every validator, never a submitter-supplied URL
  (Rule 0.7) and gated on the fetched document's own `cik` field matching
  the bound CIK before anything in it counts (Rule 0.8).
- **Test 3 (novelty/rotation):** genre (regulatory disclosure) and
  mechanism (`gl.eq_principle.prompt_comparative`, previously unused
  anywhere in this project's tracker) are both distinct from every prior
  build — Oraclon (AI-agent-accuracy dispute), Copyleft/Recourse (staked
  two-party disputes), SentinelSLA (security-response reputation).
- **Test 4 (depth potential):** the four-value fail-closed verdict set,
  cadence-rolling checkpoints, and permissionless multi-watcher design
  give this room to grow (pagination into older EDGAR history, additional
  form types, per-company aggregate standing views) without needing an
  appeal/dispute layer that wouldn't fit a single-party monitoring concept.

## What was adopted from PactPilot (380 pts) vs. built new

Adopted (proven, reused deliberately — logic, not code):
- Single-party attestation shape with a fail-closed four-value verdict set
- `gl.eq_principle.prompt_comparative` as the consensus primitive
- Sealed-obligation-before-checkpoint design (spec locked before the party
  being judged has any information about how the judgment might go)
- Boolean index preventing duplicate checkpoints per sequence

Built new for this concept:
- Genre: SEC/EDGAR regulatory disclosure (PactPilot monitored commercial
  SLA obligations against a submitter-approved source)
- Evidence binding: CIK-derived EDGAR API endpoint with an explicit
  identifier-echo gate (`cik_confirmed`), rather than a submitter-approved
  URL — closing a residual evidence-choice gap
- Deterministic amendment-rejection gate (`10-Q/A` never satisfies a
  `10-Q` obligation) as its own named, tested rule
- `gl.Event` emission and `@gl.contract_interface` stub block (adopted
  from this project's own Handshake/Treaty audit, not from PactPilot)
- Full pure-Python unit test suite (22 tests) exercising the
  canonicalize-before-consensus layer and verdict-reachability directly

# Architecture

## Overview

FilingWatch locks a recurring SEC disclosure obligation (form type, deadline,
cadence) to a company's 10-digit CIK. When a deadline passes, anyone can open
a checkpoint; assessing it runs independent validator consensus that fetches
EDGAR's own submissions API directly and judges whether the required filing
landed on time.

```
register_obligation(cik, ticker, name, form, period, deadline, cadence)
        │
        ▼
   Obligation (locked: CIK, form, deadline, cadence)
        │  deadline reached
        ▼
   open_check(obligation_id) ── creates a Check, rolls deadline forward
        │  window/deadline passed
        ▼
   assess_check(check_id)
        │
        ├─ evaluate() [inside gl.eq_principle.prompt_comparative]
        │     1. fetch https://data.sec.gov/submissions/CIK{cik}.json
        │     2. exec_prompt: find matching filing, confirm cik field
        │     3. return raw model JSON + source sha256
        │
        ├─ _canonicalize() — deterministic re-derivation
        │     • cik_confirmed=False        -> UNRESOLVED
        │     • match_found=False + overdue -> DELINQUENT
        │     • match_found=False + time left -> UNRESOLVED
        │     • wrong form / bad date shape -> {} -> UNRESOLVED
        │     • filed_epoch <= deadline     -> SATISFIED
        │     • filed_epoch >  deadline     -> LATE
        │
        └─ obligation.standing updated, Check finalized, Event emitted
```

## Why `gl.eq_principle.prompt_comparative` instead of `run_nondet_unsafe`

Both are valid GenVM consensus primitives. `run_nondet_unsafe` requires a
hand-written `validator_fn` that re-derives and compares every field
explicitly. `prompt_comparative` takes a single non-deterministic function
plus an **equivalence principle** — a natural-language contract stating which
fields must match exactly and which may vary in wording. GenVM's own
consensus layer runs the function independently across validators and
applies that principle to decide agreement.

FilingWatch's `_EQUIVALENCE_PRINCIPLE` names the five factual fields
(`cik_confirmed`, `match_found`, `matched_form`, `matched_filing_date`,
`matched_accession`) as required-exact and only `rationale` as free-form —
the same "every consequential field independently re-derived and compared"
discipline as a hand-rolled validator, expressed as the equivalence
principle's own text instead of Python comparison code.

## Canonicalize-before-consensus

The raw model JSON returned by `exec_prompt` is never trusted directly by
either the equivalence check or contract storage. `_canonicalize()` runs
**after** the model call, inside `evaluate()`, and:

1. Rejects any non-dict or missing-field shape outright (`{}` → caller
   treats as `UNRESOLVED`).
2. Treats `cik_confirmed=False` as conclusive — no verdict but `UNRESOLVED`
   is possible if the fetched document didn't echo the bound CIK.
3. **Re-derives** `SATISFIED` vs. `LATE` from `matched_filing_date` compared
   against the sealed `deadline_at`, in pure Python — never trusts a verdict
   label the model might have invented itself.
4. Rejects an amendment form (`10-Q/A`) as a match for a base-form
   obligation (`10-Q`) — a deterministic string-equality gate, not a
   judgment call left to the model.

This mirrors the confirmed Handshake/Treaty pattern: the model supplies
fact-finding, deterministic code supplies the judgment that actually
determines the on-chain outcome.

## Evidence binding

- **Rule 0.7 (derivation):** `_edgar_url()` builds the fetch target only
  from a CIK validated and locked at `register_obligation` time. No
  submitter-supplied URL exists anywhere in the contract's write surface.
- **Rule 0.8 (identifier echo):** EDGAR's submissions JSON includes its own
  `cik` field. The evaluator prompt requires the model to confirm that field
  matches the bound CIK before treating anything else in the document as
  usable evidence — `cik_confirmed=False` fails closed to `UNRESOLVED`
  regardless of what else the document contains.

## Storage model

Two record types, one lightweight boolean index (`check_keys`) preventing a
duplicate checkpoint from being opened twice for the same sequence number —
the same pattern as PactPilot's `checkpoint_keys` and Copyleft's
`dispute_index`.

## Events

`ObligationRegistered`, `CheckOpened`, `CheckAssessed` are emitted on every
state-changing write, giving a reviewer or indexer a reviewer-legible
on-chain activity log without needing to poll every obligation's view
method.

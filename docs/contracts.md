# Contract reference

`contracts/FilingWatch.py` — single contract, no external dependencies
beyond the pinned GenVM runtime.

## Public write methods

| Method | Preconditions | Effect |
|---|---|---|
| `register_obligation(cik, ticker, company_name, required_form, period_label, deadline_at, cadence_seconds)` | CIK numeric ≤10 digits; ticker 1-12 alnum/.-chars; form in `{10-Q, 10-K, 8-K}`; deadline 1-180 days out; cadence 1 day-1 year | Creates a locked `Obligation`, emits `ObligationRegistered`, returns the new `obligation_id` |
| `open_check(obligation_id)` | Obligation active; deadline reached; no existing check for this sequence | Creates a `Check` in `OPEN` status, rolls `obligation.deadline_at` forward by `cadence_seconds` (handles missed cadences via integer division), emits `CheckOpened` |
| `assess_check(check_id)` | Check status `OPEN`/`UNRESOLVED`; obligation still exists | Runs `gl.eq_principle.prompt_comparative` against EDGAR, canonicalizes the result, finalizes the check's verdict, updates `obligation.standing`, emits `CheckAssessed` |
| `close_obligation(obligation_id)` | Caller is the original watcher; obligation active | Deactivates the obligation (no further checks can be opened) |

## Public view methods (all return plain `dict`)

| Method | Returns |
|---|---|
| `get_contract_version()` | Static metadata: name, version, evidence source, consensus mechanism |
| `get_obligation(obligation_id)` | Full obligation record including current `standing` and `latest_check_id` |
| `get_check(check_id)` | Full check record: verdict, matched form/date/accession, rationale, source hash |
| `get_totals()` | Counts of obligations and checks created so far |

## Verdict values and reachability

| Verdict | Produced when |
|---|---|
| `SATISFIED` | Matching form filed on/before the sealed deadline (`_canonicalize`, exact-form branch, `filed_epoch <= deadline_epoch`) |
| `LATE` | Matching form filed, but after the sealed deadline (`_canonicalize`, exact-form branch, `filed_epoch > deadline_epoch`) |
| `DELINQUENT` | No matching filing found **and** the deadline has already passed (`_canonicalize`, `match_found=False` branch) |
| `UNRESOLVED` | CIK not confirmed by the fetched document; no match found but deadline not yet due; malformed/incomplete model output; EDGAR unreachable or non-JSON; invalid consensus result at the write-method level |

Every value has a distinct, traceable `leader`/`evaluate` code path — see
`_canonicalize()`'s own inline comments and `tests/test_filingwatch_logic.py::test_every_verdict_value_is_reachable_via_canonicalize_or_caller_gate`.

## Evidence source

`https://data.sec.gov/submissions/CIK{10-digit-zero-padded}.json` — EDGAR's
own public submissions API. Built once, deterministically, from the CIK
locked at `register_obligation`. No other URL is ever fetched by this
contract.

## What this contract does NOT do (deliberate gaps)

- No stake, slash, or GEN transfer of any kind — the consequence is a
  durable, on-chain compliance-standing record, not a financial penalty.
- No pagination into EDGAR's older filing-history archive — only the
  `filings.recent` block (roughly the most recent 1000 filings) is
  consulted, sufficient for any obligation with a cadence under one
  filing-history page.
- No automatic amendment-supersedes-original judgment — an amendment
  (`10-Q/A`) never satisfies a base-form (`10-Q`) obligation.
- No deadline/checkpoint automation — `open_check`/`assess_check` are
  explicit, permissionless but manually-triggered actions once a deadline
  has passed (anyone may call them, not only the watcher).

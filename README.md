<div align="center">

<img src="./docs/assets/favicon.svg" width="88" alt="FilingWatch logo" />

# FilingWatch

### A filing deadline isn't met until EDGAR's own record says so.

<br />

![Status](https://img.shields.io/badge/status-contract%20deployed-yellow?style=flat-square)
![Networks](https://img.shields.io/badge/networks-StudioNet-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Next.js%20%2B%20GenVM-1C1B18?style=flat-square)

<br />

**[Live App](#)** &nbsp;·&nbsp; **[Documentation](./docs/architecture.md)** &nbsp;·&nbsp; **[Smart Contract](./contracts/FilingWatch.py)**

</div>

<br />

---

## What this is

FilingWatch locks a recurring SEC disclosure obligation — form type,
deadline, cadence — to a public company's own CIK. When the deadline
passes, anyone can open a checkpoint; assessing it runs independent
GenLayer validator consensus that fetches EDGAR's own submissions API
directly and judges whether the required filing landed on time. The
result is a durable, fail-closed compliance-standing record, not a
one-time report.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | Recurring regulatory-disclosure obligation, checked against EDGAR |
| **Consensus need** | Distinguishing a genuine on-time filing from a late/missing/amended one requires judgment EDGAR's raw JSON doesn't hand you pre-labeled — not reducible to one string-equality check |
| **Evidence source** | `data.sec.gov/submissions/CIK{cik}.json` — never a submitter-supplied URL |
| **Networks** | StudioNet |

</div>

<br />

---

## How it works

1. A watcher registers an obligation: CIK, ticker, required form
   (10-Q/10-K/8-K), reporting period, first deadline, and cadence. All of
   it is sealed at creation.
2. Once the deadline passes, anyone opens a checkpoint (`open_check`),
   which also rolls the obligation's deadline forward by its cadence.
3. Assessing the checkpoint (`assess_check`) runs
   `gl.eq_principle.prompt_comparative`: independent validators each fetch
   EDGAR fresh, identify the matching filing (if any), and must agree
   exactly on the matched form, filing date, and accession number.
4. A deterministic layer re-derives `SATISFIED`/`LATE` from the matched
   date vs. the sealed deadline — never trusting a verdict label the model
   invents. No match plus a passed deadline is `DELINQUENT`; anything
   ambiguous, unreachable, or malformed fails closed to `UNRESOLVED`.

<br />

<details>
<summary><b>The four-value verdict, and why it isn't binary</b></summary>
<br />

A two-value satisfied/violated verdict can't honestly represent "EDGAR was
unreachable" or "the deadline hasn't actually passed yet" — both of those
are real, frequent states this contract needs to be able to say plainly,
rather than forcing a guess. `UNRESOLVED` exists so a missing or
ambiguous answer is never silently rounded into a violation. `DELINQUENT`
is reserved specifically for "the deadline passed and nothing showed up,"
distinct from `LATE` ("it showed up, just after the deadline").

</details>

<br />

---

## Deployed contracts

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0x9bbB29978d437c70b9148362dB2C77149d84C439` | [View](https://explorer-studio.genlayer.com/address/0x9bbB29978d437c70b9148362dB2C77149d84C439) |

</div>

<br />

---

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Full deployment instructions: [`docs/deployment.md`](./docs/deployment.md)

<br />

---

## Project structure

```
contracts/FilingWatch.py          The GenVM contract
frontend/                          Next.js app
tests/                              Contract logic unit tests (pure Python)
docs/                               architecture.md, deployment.md, frontend.md, contracts.md, THREAT_MODEL.md
LICENSE                             MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/contract%20logic-unit--tested-brightgreen?style=flat-square)
![Untested](https://img.shields.io/badge/live%20consensus-not%20yet%20run-yellow?style=flat-square)

</div>

The deterministic canonicalization layer (`_canonicalize`, evidence-URL
derivation, CIK/ticker validation) is covered by 22 passing unit tests run
against a mocked `genlayer` module — these do not require a live GenVM
runtime and were run directly in this environment.

**Deployed to StudioNet** at
`0x9bbB29978d437c70b9148362dB2C77149d84C439`. **Not yet confirmed by a
live end-to-end run:** `register_obligation` → `open_check` →
`assess_check` has not yet been exercised against the deployed contract in
this repo's own history, so `gl.eq_principle.prompt_comparative`'s actual
cross-validator agreement behavior on real EDGAR data, and the
`SATISFIED`/`LATE`/`DELINQUENT` branches specifically, remain unconfirmed
against the live network. Run the lifecycle in Studio's Run and Debug
panel and update this section with the real result once done — see
[`docs/deployment.md`](./docs/deployment.md).

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>

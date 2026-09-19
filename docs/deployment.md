# Deployment

## Status

**Contract deployed to StudioNet:**
`0x9bbB29978d437c70b9148362dB2C77149d84C439`
([explorer](https://explorer-studio.genlayer.com/address/0x9bbB29978d437c70b9148362dB2C77149d84C439)).

**Frontend not yet deployed** — no live Vercel URL exists yet. The
contract address is already wired into `frontend/config/chains.ts`, so
deploying the frontend is the only remaining step for a live app.

**Not yet run against the live contract:** a full
`register_obligation` → `open_check` → `assess_check` lifecycle. See the
"Known live-testing gaps" section below before treating any verdict
branch as confirmed.

## Contract

1. ~~Open [studio.genlayer.com/contracts](https://studio.genlayer.com/contracts)~~ — done, deployed at the address above.
2. ~~Deploy `contracts/FilingWatch.py` to StudioNet.~~ — done.
3. Recommended next step, before relying on this for a real submission:
   run the full lifecycle in Studio's Run and Debug panel. Call
   `register_obligation` with a real CIK (Apple's is `0000320193`), a
   deadline a few minutes in the future for testing purposes only (a real
   obligation should use a realistic filing deadline), then `open_check`
   and `assess_check` once the deadline passes, and confirm `get_check`
   returns a `SATISFIED`/`LATE`/`DELINQUENT`/`UNRESOLVED` verdict with
   clean stderr.

## Frontend

1. `cd frontend && npm install`
2. Set the deployed contract address in `config/chains.ts`
   (`CONTRACT_ADDRESS`) — the single place it lives, no `.env`.
3. `npm run build` to confirm a clean production build.
4. Deploy to Vercel (or run `npm run dev` locally at
   [http://localhost:3000](http://localhost:3000)).
5. Confirm `vercel.json`'s SPA rewrite is present so client-side routes
   (`/monitor`) resolve correctly on refresh.

## Testing before submission

```bash
# Contract logic tests (22 tests, no GenVM runtime required)
python -m pytest tests -q

# Frontend production build
cd frontend && npm run build
```

## Known live-testing gaps (state plainly, do not round up)

- The contract has been syntax-checked, audited against the full
  mandatory pre-deploy checklist, and deployed to StudioNet — but **has
  not yet been exercised end-to-end in Run and Debug or from the
  frontend**. In particular:
  - `gl.eq_principle.prompt_comparative`'s actual cross-validator agreement
    behavior on real EDGAR JSON has not been observed live — only the
    deterministic `_canonicalize()` layer has been unit-tested.
  - The `LATE` and `SATISFIED` branches have not been exercised against a
    real company's real filing history.
  - `DELINQUENT` has not been exercised against a real company that
    genuinely missed a deadline.
- The frontend's `openAndAssess` flow reads `get_totals()` immediately
  before calling `open_check` to predict the new check_id, then calls
  `assess_check` with that id. This is correct under single-user,
  sequential use but has a narrow race window if two checkpoints for
  different obligations are opened concurrently by different wallets
  between the read and the write — acceptable for this MVP's expected
  usage pattern, named here rather than left undocumented.

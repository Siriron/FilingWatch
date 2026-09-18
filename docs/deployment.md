# Deployment

## Status

**Not yet deployed.** No contract address, no live Vercel URL exist yet —
this section will be filled in once deployment actually happens. Nothing
below should be read as claiming a live deployment.

## Contract

1. Open [studio.genlayer.com/contracts](https://studio.genlayer.com/contracts)
   (or `genvm-lint check contracts/FilingWatch.py` locally first).
2. Deploy `contracts/FilingWatch.py` to StudioNet. No constructor arguments.
3. Confirm line 1's pragma hash matches
   `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6` before
   deploying — an older or `"py-genlayer:test"` pragma fails schema load.
4. Record the deployed address and deploy transaction hash here once known.
5. Recommended first live check in Studio's Run and Debug panel before
   wiring the frontend: call `register_obligation` with a real CIK (Apple's
   is `0000320193`), a deadline a few minutes in the future for testing
   purposes only (a real obligation should use a realistic filing deadline),
   then `open_check` and `assess_check` once the deadline passes, and
   confirm `get_check` returns a `SATISFIED`/`LATE`/`DELINQUENT`/`UNRESOLVED`
   verdict with clean stderr.

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

- The contract has been syntax-checked and audited against the full
  mandatory pre-deploy checklist, but **has not yet been deployed to
  StudioNet or exercised in Run and Debug**. In particular:
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

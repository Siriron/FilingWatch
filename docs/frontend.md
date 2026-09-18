# Frontend

React (Next.js 15, App Router) + `genlayer-js`. No Redux/Zustand — plain
`useState`/`useCallback`/`useEffect` throughout, since the app's state is
shallow (wallet address, form fields, per-obligation fetch results).

## Structure

```
frontend/
  app/
    page.tsx            landing page
    layout.tsx           root layout + metadata
    globals.css           design tokens, docket-stamp system
    error.tsx              global error boundary
    not-found.tsx           404 page
    monitor/
      page.tsx            console: register + track tabs
    monitor.css           console-specific styles
  lib/
    genlayer.ts          client helpers: read/write/ensureChain/TimeoutError
    useWallet.ts          wallet connect + persistence hook
  config/
    chains.ts             plain-constant contract address + StudioNet config
```

## Wallet

`useWallet()` checks `eth_accounts` silently on mount (no prompt) to
reconnect if already authorized, and subscribes to `accountsChanged` to stay
in sync if the person switches accounts in their wallet extension.
`connect()` is the only place `eth_requestAccounts` (which prompts) is
called.

## Writes

Every write goes through `writeContract()` in `lib/genlayer.ts`, which:

1. Calls `ensureChain()` first (switches/adds StudioNet if needed).
2. Builds a write client with `provider: window.ethereum` bound.
3. Calls `client.writeContract({ ..., value: BigInt(0) })`.
4. Waits for the receipt with a generous retry config (120 × 4s = 8 min
   ceiling) — GenLayer consensus, especially anything invoking an LLM
   judgment, genuinely takes minutes.
5. On a wait timeout, throws `TimeoutError` (carries the tx hash) rather
   than a generic error — the UI shows an explorer link and an explicit
   "still finalizing" state distinct from an actual failure.

## Transaction lifecycle states

Every write-triggering action in the UI (`register_obligation`,
`open_check` + `assess_check`) renders one of four states via the shared
`TxBanner` component: idle → pending (spinner + "this can take several
minutes") → ok (explorer link) or timeout (explorer link, different
copy) or err (the raw error message). No write button silently does
nothing while a transaction is in flight — the pending spinner replaces
the button icon and the button disables.

## Checkpoint flow specifics

`ObligationCard`'s "Open + assess checkpoint" button is disabled until the
obligation's own `deadline_at` has passed (checked client-side against
`Date.now()`, matching the contract's own `DEADLINE_NOT_YET_REACHED`
guard). Clicking it chains two writes (`open_check` then `assess_check`)
in sequence, predicting the new check_id via a `get_totals()` read
immediately beforehand (see `docs/deployment.md`'s named race-window
caveat).

## Error boundary and 404

`app/error.tsx` and `app/not-found.tsx` are both styled to match the
docket/filing design system — no blank white Next.js crash screen or
default 404.

## Design system

See `globals.css` for the full token set. Signature motif: a rotated
"docket stamp" rectangle (border + inset hairline) reused at hero scale
(`.hero-panel .stamp`) and small scale (`.mini-stamp` on each obligation
card) — a literal filing-stamp device, chosen because the subject matter
(regulatory filings) is itself stamped paperwork, not decoration for its
own sake.

# VERDICT: viewer never rebinds after port loss

**Recommendation: Strategy B** — keep the bind-once design and document
`node bin/olchipanel.js viewer` as the official recovery path. (B: 7/10, A: 5/10.)

## Why B wins

- **Recovery already works, verified in code.** The viewer is stateless: `/api/state`
  re-reads every session file from disk (`src/state.js:54-66`), so a fresh viewer shows
  the full current panel immediately. If the old server died, the new one rebinds 6711
  and the browser's `EventSource` (`public/index.html:254-259`) auto-reconnects — the
  stale tab heals with zero user action. Recovery is one command, often self-healing.
- **A structurally misses the common case.** With one agent there is one olchipanel
  process; when it dies there are no survivors left to run a retry timer. Periodic
  rebind only helps when ≥2 processes overlap — exactly when the panel is least at risk.
- **A's worst failure mode lands on this project's platform.** Node's default
  `SO_REUSEADDR` on Windows lets a second process bind an already-bound port, so
  interval-driven retries risk split-brain SSE delivery unless `exclusive: true` is
  added carefully.
- **A conflicts with the existing port-walk.** Today losers walk to 6712+ ("multiple
  viewers coexist by design", `ARCHITECTURE.md:21-25`). A useful retry must instead pin
  `BASE_PORT` (the port the human's tab is on), sacrificing that property — a real
  design change, not just ~40 lines in `src/viewer.js`.

## Required doc changes for B

1. README "Recovery" subsection near L44: panel dark / red "reconnecting…" dot →
   run `node bin/olchipanel.js viewer`, then use the URL it prints (the hardcoded
   `:6711` may be wrong if a foreign process holds the port — check
   `~/.olchipanel/viewer.json` or `get_panel` for the real URL).
2. Extend `ARCHITECTURE.md:57-59` with the same recovery statement.
3. Use the `node bin/...` form — the `olchipanel` bin alias only exists after
   global install/`npm link`.

## Residual risks accepted with B

- Weak death detection: red "reconnecting…" dot is the only signal; a human may stare
  at a stale tab. (Cheapest future mitigation: an explicit "viewer down — restart with
  …" banner in `index.html`, not process-side retries.)
- Stale `viewer.json` is never unlinked; docs must not present it as a liveness check.

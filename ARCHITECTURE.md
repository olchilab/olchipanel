# Architecture

OlchiPanel is a zero-dependency live situation board: agents report progress via MCP
tools, humans watch it render live in a browser. Three source files, one entry point.

## Process model

Every connected agent spawns its own `olchipanel` process (`bin/olchipanel.js`),
which exposes two things:

1. **MCP server** (`src/mcp.js`) — speaks newline-delimited JSON-RPC 2.0 over
   stdio with that one agent. One process per agent; `initialize` is read-only.
   The first explicit OlchiPanel tool call creates the session. Stdout belongs to
   the protocol, so nothing else may print there.
2. **Viewer** (`src/viewer.js`) — the first explicit tool call discovers and health-checks
   the canonical HTTP/SSE viewer. Only one process binds `OLCHIPANEL_PORT`
   (default 6711); another OlchiPanel adopts it, while a non-OlchiPanel port
   collision fails loud instead of drifting to another port. Whoever binds
   writes the real URL to `~/.olchipanel/viewer.json` so every process (and the `get_panel` tool) can
   report it. `olchipanel viewer` runs the viewer alone, without MCP. Browser
   opening is also claimed through that viewer: an active SSE client or pending
   claim blocks duplicate app windows, including simultaneous `open` commands.

N MCP servers share state through files. Viewer ownership is coordinated by the
discovery record plus the one canonical loopback port; window ownership is
coordinated by the viewer's `/api/window/claim` endpoint and live SSE clients.
An MCP handshake that never calls a tool creates no OlchiPanel storage and starts no viewer.

## Data flow

```
agent ──stdio JSON-RPC──▶ mcp.js ──▶ state.js ──▶ ~/.olchipanel/sessions/<id>.json
                                                        │
browser ◀──SSE "changed" ping── viewer.js ◀──fs.watch──┘
        └──GET /api/state──▶ viewer.js reads all session files
```

1. The agent calls a tool (`set_goal`, `add_step`, `set_status`, `push_interrupt`,
   `add_decision`, `set_pending`, `lock_term`, …). `mcp.js` mutates its in-memory
   session object and saves via `state.writeSession()`.
2. `state.js` (`src/state.js`) owns the disk format: one JSON file per session in
   `~/.olchipanel/sessions/` (override root with `OLCHIPANEL_HOME`). Writes go to
   a `.tmp` file then `rename` — atomic on the same volume, so readers never see
   half a file. It also holds the journey-tree helpers (`findNode`, `clearNow`).
3. The viewer watches the sessions directory with `fs.watch` (debounced 120 ms),
   backed by an unconditional 5 s re-broadcast that covers platforms where
   `fs.watch` is unreliable. On change it broadcasts a content-free `changed`
   event to all SSE clients on `/events`.
4. The browser (`public/index.html`) reacts to the ping by fetching
   `GET /api/state`, which re-reads *all* session files from disk. Torn or
   corrupt files are skipped; the next tick heals them.

## Session lifecycle

- Session IDs are timestamp + PID; no file exists until the first explicit tool call.
- On stdin close / SIGINT / SIGTERM the MCP process marks its session
  `alive: false` and exits, so the viewer can distinguish live from dead panels.
- The viewer is stateless: all truth lives in the session files, so a viewer
  dying loses nothing. Binding is attempted only once, at process start — running
  processes never retry — so serving resumes when the next `olchipanel` process
  starts (or another already-bound viewer keeps serving on its own port).

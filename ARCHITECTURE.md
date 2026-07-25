# Architecture

OlchiPanel is a zero-dependency live situation board: agents report progress via MCP
tools, humans watch it render live in a browser. Three source files, one entry point.

## Process model

Every connected agent spawns its own `olchipanel` process (`bin/olchipanel.js`),
which does two things:

1. **MCP server** (`src/mcp.js`) — speaks newline-delimited JSON-RPC 2.0 over
   stdio with that one agent. One process per agent; each `initialize` creates a
   fresh session. Stdout belongs to the protocol, so nothing else may print there.
2. **Viewer** (`src/viewer.js`) — every process *attempts* to start the HTTP/SSE
   viewer. Ports are walked from `OLCHIPANEL_PORT` (default 6711) upward; if all
   candidates are taken, another instance is already serving and this process
   silently skips it. Whoever binds writes the real URL to
   `~/.olchipanel/viewer.json` so every process (and the `get_panel` tool) can
   report it. `olchipanel viewer` runs the viewer alone, without MCP.

There is no coordination between processes beyond the filesystem: N MCP servers
share state through files. Because each process binds the first *free* candidate
port, several viewers can end up serving at once (up to the number of candidate
ports); that is harmless — viewers are stateless readers of the same files — and
`viewer.json` always points at whichever viewer bound most recently.

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

- Session IDs are timestamp + PID; files are never deleted by the server.
- On stdin close / SIGINT / SIGTERM the MCP process marks its session
  `alive: false` and exits, so the viewer can distinguish live from dead panels.
- The viewer is stateless: all truth lives in the session files, so a viewer
  dying loses nothing. Binding is attempted only once, at process start — running
  processes never retry — so serving resumes when the next `olchipanel` process
  starts (or another already-bound viewer keeps serving on its own port).

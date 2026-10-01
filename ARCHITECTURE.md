# Architecture

OlchiPanel is a live situation board: agents report progress via MCP tools and humans
watch it render in the desktop app. This PC uses one Electron window; the legacy browser route is only for other machines without the desktop-only preference.

Windows packaged first-run setup uses native selection and consent dialogs before
adding a user-scoped Codex or Claude Code MCP entry. The entry launches the installed
Electron executable with `ELECTRON_RUN_AS_NODE=1` and the MCP entrypoint in app.asar.
`desktop/windows-mcp-setup.cjs` preserves existing registrations, backs up changed
configuration, validates TOML/JSON, and checks for intervening edits. No panel is
created by setup or the MCP handshake. See `desktop/WINDOWS-FIRST-RUN.md`.

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

Explicit project startup uses `start_project` → `src/project-setup.js` before panel activation.
The same helper serves CLI `setup` (files only) and `start` (files, then viewer). It installs
project-local Codex/Claude skill copies and appends marked instruction blocks, preflighting
all conflicts and using a per-project exclusive setup lock. It does not run on initialize,
tool discovery, desktop app launch, or screen-only `open`. Older individual tracking tools
remain compatible; agents are instructed to call `start_project` first after user opt-in.

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
4. The renderer (`public/index.html`) reacts to the ping by fetching
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


### 2026-09-19 자료 분석 공통 소스와 저장 경계

- 정본 `src/scope/`: React 그래프/날짜 구간/통계. `npm ci --prefix src/scope` 후 `npm run build:scope`로 `public/scope/` 및 서버용 `src/scope/model.cjs` 생성. 데모 빌더도 같은 `buildScope`를 호출한다. 이전 `tools/championship/scope/` JS/CSS는 호환 입구다.
- 앱의 `/scope/index.html`과 데모의 `scope/index.html?demo=1`은 동일 자산이다. storage namespace와 부모로 보내는 반영 이벤트만 구분한다. fixtures host는 demo snapshot key를 명시적으로 읽는다.
- 앱의 반영 버튼은 대상 세션을 표시한 대화상자를 연다. 저장 시 `POST /api/analysis/capture`는 origin 검증 후 서버에서 가상 자료 통계를 다시 계산하고 공통 노트와 세션 플랜 카드를 기록한다. 플랜이 없으면 생성하여 해당 세션에 연결한다. 기존 카드/노트 편집을 덮어쓰지 않으며 동일 세션·지표·기간은 idempotent receipt로 중복을 막는다.
- 에이전트용 별도 복제 데이터가 아니다. 공통 `memo-common.json`과 기존 Plan 상태 파일을 사용하므로 기존 MCP `note_read`와 Plan 도구가 같은 결과를 읽는다. 분석에는 실제 AI 호출이 없다.
- `test/analysis-capture.test.cjs`: 실제 저장·재시도·사용자 편집·용량 상한·대상 변경·공통 빌드 자산 동등성·demo host/iframe 저장 경계 회귀.

Desktop launch policy: `src/desktop-launch.js` reads the machine-local `preferences.json` under the OlchiPanel state root. `windowMode: desktop` routes CLI open and requested auto-open to Electron without browser fallback. Electron owns the window singleton; an MCP-owned viewer stays alive during UI restarts.

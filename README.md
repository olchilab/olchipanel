# OlchiPanel

에이전트가 기록한 목표와 진행을 Windows 앱에서 확인하는 로컬 상황판입니다.
소스에서 앱을 실행하려면 `npm install` 후 `npm start`를 사용하세요.

| 찾는 내용 | 위치 |
| --- | --- |
| 제품 코드와 데스크톱 실행 | `src/`, `public/`, `desktop/`, `bin/` |
| 설계와 계획 | `ARCHITECTURE.md`, `01_plan/`, `docs/` |
| 현재 상태와 인계 | `STATE.md`, `HANDOFF.md` |
| 검사와 개발 명령 | `test/`, `tools/`, `package.json` |

Windows 설치본은 첫 실행에서 Codex·Claude Code를 선택하고 동의하면 MCP를 등록합니다. 취소 후에는 Alt → 설정 → 에이전트 연결에서 다시 진행할 수 있습니다. [Windows 첫 실행 안내](desktop/WINDOWS-FIRST-RUN.md).

[![ci](https://github.com/olchilab/olchipanel/actions/workflows/ci.yml/badge.svg)](https://github.com/olchilab/olchipanel/actions/workflows/ci.yml)

**A living situation board your AI agent draws for you — live.**

> **No API key. No token cost of its own.** OlchiPanel never calls a model — it
> visualizes the agent you already run (Claude Code, Cursor, Codex…), which works
> inside your own ChatGPT/Claude subscription. Nothing is added on top of the usage
> your agent already consumes.

![OlchiPanel demo — agent forks two fix strategies and you watch both develop live](https://raw.githubusercontent.com/olchilab/olchipanel/main/assets/demo.gif)

Your agent tells you what it's doing in a wall of text you'll never re-read.
OlchiPanel gives it a canvas instead: a pinned goal, a journey map that **actually branches**
when the agent forks into parallel paths, an interrupt stack so nothing you said gets lost,
and decisions/blockers — all updating **live in the desktop app** while the agent works.

Works with **any MCP-capable agent** — Claude Code, Cursor, Codex CLI, and friends.
The MCP connection runs locally; desktop development uses Electron from this checkout.

## Desktop baseline

The selected Studio (formerly E2) desktop is now canonical. Run `npm start` after installing development dependencies in a source checkout. `npm run e` and `npm run e2` open the same app and retain the existing Studio profile. Desktop beta packaging status: [desktop/BETA-DISTRIBUTION.md](desktop/BETA-DISTRIBUTION.md).

## Quick start

One command in your project folder — no install step, `npx` handles it:

**Claude Code**:
```sh
claude mcp add olchipanel -s project -- npx -y olchipanel@latest
```

**Codex CLI**:
```sh
codex mcp add olchipanel -- npx -y olchipanel@latest
```

**Cursor** (no CLI — paste into `.cursor/mcp.json`; Claude Code's `.mcp.json` takes the same shape):
```json
{
  "mcpServers": {
    "olchipanel": { "command": "npx", "args": ["-y", "olchipanel@latest"] }
  }
}
```

The panel's help screen (`?`) also has **Add for me** buttons that write these configs for you.

(Running from a clone instead: `"command": "node", "args": ["<path-to>/bin/olchipanel.js"]`.)

No always-on rules line is required. When you want a board for a task, tell the agent explicitly:

> Track this task in OlchiPanel.

The MCP startup handshake creates no panel or viewer. After you explicitly ask to connect
or track this session, the first panel tool call registers a `세션 연결됨` journey node.

On that request, the agent announces project instruction/skill registration and calls
`start_project` first. It appends a bounded guide to `AGENTS.md` and `CLAUDE.md`, and
installs the bundled `olchipanel-track` skill in `.agents/skills/` and `.claude/skills/`.
Existing instructions are preserved; repeats do not duplicate them and conflicts fail visibly.
The agent reads the installed skill directly. This does not authorize future sessions to auto-connect.

From a terminal, `olchipanel start --project <directory>` registers the project then opens
the board. `olchipanel setup --project <directory> --check` previews registration without
writing; omit `--check` to register without launching a viewer. `olchipanel open` and
desktop app launch remain screen-only operations. Global agent configuration and central
skill registries are not modified. See [startup details](skills/olchipanel-track/references/project-start.md).

**Who can connect**: any agent that can spawn a local process (stdio MCP). Confirmed working:
Claude Code, Codex CLI, Cursor, and the **ChatGPT desktop app's agent/"Work" mode** (its Codex
workspaces read `~/.codex/config.toml`, so the same `codex mcp add` line covers them — tested on
Windows: olchipanel shows up and runs). What does **not** get the tools: the ChatGPT app's plain
chat, and browser-only sessions (chatgpt.com / claude.ai) — those can't launch a local process,
and OlchiPanel is local-only by design.

Then open the panel — as the agent works, its situation appears and updates live.
The viewer uses one canonical loopback port (6711, or `OLCHIPANEL_PORT` when set);
the actual URL is written to `~/.olchipanel/viewer.json`.

### Native window: OlchiPanel

The canonical desktop UI runs in one Electron window:

```sh
npm install
npm run e
```

In Situation, Tree keeps the recorded hierarchy. Workflow connects main work
steps from left to right and places extra work below its parent phase. It marks
the current step, or the last recorded position for an ended session. This is
the agent's work map, not a LangGraph runtime trace.

`npm start`, `npm run e`, and `npm run e2` open the same Studio UI and reuse
its loopback viewer. The native single-instance lock focuses the existing app.
On Windows, closing the window keeps OlchiPanel running in the notification area
(including hidden icons). Double-click its icon to reopen the window, or use the
icon menu to open or quit the app.

For a desktop-only machine, set `"windowMode": "desktop"` in
`~/.olchipanel/preferences.json` (preserve any other settings). CLI `open` and
requested auto-open then use Electron, even if an older configuration says
`OLCHIPANEL_OPEN=app` or `tab`. A launch failure reports an error and never
falls back to a browser. This PC uses that desktop-only setting.

`OLCHIPANEL_OPEN=desktop` also selects Electron explicitly. `0` suppresses
viewer auto-open, and unset MCP mode stays quiet. An explicit CLI `open` still
requests a window. For headless runtime startup use `OLCHIPANEL_OPEN=0` with
`node bin/olchipanel.js viewer`. Do not stop an MCP-owned viewer to refresh UI;
restart only the app, preserving the agent connection.

Legacy `app` (Edge/Chrome app window) and `tab` modes remain for machines
without the desktop-only preference; they are not this PC's review workflow.

## What the agent gets

Seventeen tools the agent uses after your explicit OlchiPanel request:

| tool | what it does |
|---|---|
| `resume_project` | inherit the project's previous panel — goal, journey, decisions, dead ends — as memory; the old panel is archived |
| `name_session` | give this session a name — big in the sidebar |
| `set_goal` | pin the north-star goal at the top |
| `add_step` | grow the journey map — single step or a whole plan at once (`steps:[...]`); `branch: true` + why-note marks a fork |
| `set_status` | `now` / `next` / `done` / `pause` — live progress, incl. per-branch |
| `push_interrupt` / `pop_interrupt` | topic changed mid-task? the old task + resume point is saved, visibly |
| `log_change` | every file/command/commit touched — read this, not the transcript |
| `add_decision` | decisions made — and silent `assumption`s, surfaced |
| `log_deadend` | tried & failed, with why — nobody walks it twice |
| `need_human` | the agent's inbox to you: questions, approvals, blockers |
| `get_panel` | read back state + viewer URL |
| `note_read` | read the shared Note used across sessions; only the human-facing UI writes it |
| `plan_open` / `plan_add` / `plan_set` / `plan_list` | open, inspect, and maintain the shared Plan board |
| `plan_apply` | validate a complete `olchipanel.plan-author.v1` document and attach its new independent plan |
| `plan_next` / `plan_step` | compute dependency-ready work, claim or pause it, and complete it with idempotent evidence |

The shared Note supports nested pages, foldable page trees, breadcrumbs, slash-created
subpages, block reordering, and a local document-tab strip for switching among open notes.
Closing a tab only closes that view; it never deletes the note. Older flat notes remain
root pages when the v4 notebook schema is loaded.

Sessions are auto-grouped by vendor (Claude / Codex / Cursor / Gemini) with color coding —
the agent identifies itself in the MCP handshake, so this needs zero config.

Each session stays off the panel until you explicitly ask it to connect or track.
Re-initializing the same transport reuses its identity without registering another panel.
The first real root step replaces the placeholder created by the first authorized tool call.

Parallel subagents inherit the tools — each one updates its own branch,
so you watch alternatives develop **side by side, live**.

### Optional low-token tracking skill

The npm package includes `skills/olchipanel-track`, a portable guide for agents that
support skills. Its short entrypoint defines the opt-in lifecycle; the detailed
recording contract is loaded only when an agent is unsure what belongs in Map, Plan,
Records, or Requests. Copy that folder into the project's `.agents/skills/` or
`.claude/skills/` directory when you want native skill discovery.

The skill does not install hooks, start OlchiPanel, or change agent settings. The MCP
server already sends the same compact core behavior to every compatible agent, so
ordinary use remains: ask **“Track this task in OlchiPanel.”** Updates are event-driven
and incremental rather than a transcript or heartbeat.

The package also includes three Plan skills. `skills/olchipanel-plan-author` turns a
cross-domain objective into a typed `olchipanel.plan-author.v1` document. It first checks
available references, resolves material uncertainty, and confirms the direction with the
human before expanding and applying explicit scope, evidence-based completion, real
dependencies, risks, and one executable next action. The same document can be applied through MCP `plan_apply` or uploaded with the
Plan screen's existing **import** action. `skills/olchipanel-plan` handles routine card
maintenance and transfer after a plan exists. `skills/olchipanel-plan-runner` executes
an attached plan through a strict `todo → in_progress → done` path: it will not claim
blocked work, and completion records fresh proof in the portable `evidenceLog`. It
keeps execution synchronized without turning every command into a card update. The
Plan toolbar supports three distinct transfer actions: **continue together** attaches the same live plan to another session,
**send a copy** creates an independent local plan for that session, and **export/import**
moves a portable JSON copy between computers. Imported files never retain machine-local
session ownership. Install these folders beside the tracking skill when native discovery is
wanted; it does not add hooks or start the app.

## Sessions die. The panel doesn't.

Every panel belongs to a **project** (its working directory), not just a session.
When the human opts in and a previous panel exists, the server tells the agent,
and one `resume_project` call hands over the whole situation — goal,
journey so far, decisions, dead ends, open asks — as an inherited memory the new
agent actually reads. The old panel is archived; the board keeps **one living
panel per project**. This works across vendors: a panel baked by Claude Code can
be inherited by Codex, and vice versa.

Joined mid-task with no previous panel? The instructions tell the agent to
backfill: a panel that starts at step 5 should still show steps 1–4.

## Optional: deterministic Changes via hooks (Claude Code)

After a panel is explicitly started, a hook can keep its Changes tab deterministic: it logs
file edits, commands, and commits into that existing live panel even when the model forgets.

`.claude/settings.json` in your project:
```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write|Bash|NotebookEdit",
        "hooks": [{ "type": "command", "command": "npx -y olchipanel hook" }] }
    ]
  }
}
```

Repeated edits of the same file coalesce; read-only commands are skipped. The MCP core
stays agent-agnostic — hooks are a per-agent enhancer, not a requirement.

**Codex CLI note**: Codex has no equivalent change hook yet. Ask it to track the task in
OlchiPanel; the MCP instructions then tell it to `resume_project` / `set_goal` / backfill.

## Optional: stable workspace identity

Panels normally belong to a working directory. For role-based setups where one logical
role runs from several folders, set `OLCHIPANEL_WORKSPACE=<key>` in the agent's MCP `env` —
sessions sharing a key inherit each other (`resume_project`) regardless of folder.

## How it works

- One `olchipanel` process per agent (stdio MCP, handrolled JSON-RPC — that's why zero deps).
- State = plain JSON files in `~/.olchipanel/sessions/`. Multiple agents, one board.
- Whichever process gets the port serves the viewer (HTTP + SSE). Port taken → someone already serves. Default port 6711, walks up if reserved; `OLCHIPANEL_PORT` overrides.
- The viewer's sidebar lists every session, labeled by the agent's own `clientInfo.name` — that's how it stays agent-agnostic with zero config.
- If the viewer ever dies (red "reconnecting…" dot), recovery is one command: `npx olchipanel viewer`. The board is stateless — a fresh viewer re-reads everything from disk, and open tabs heal themselves via `EventSource` auto-retry.

## Updates

`@latest` in the MCP config means every agent start picks up the newest release —
measured: a bare `npx -y olchipanel` freezes on the first version npx ever cached.
The viewer shows a small `⬆` chip when a newer version exists; click it to copy the
one-line update command.

## Locked-down Windows (no admin rights)

Field notes from a corporate-laptop install:

- No Node and `winget` needs admin → use the official **ZIP distribution** from
  nodejs.org, unzip into your user folder, add it to your user `PATH`.
- `npm`/`npx` blocked by PowerShell execution policy → call **`npx.cmd`** (the
  `.cmd` shims bypass the `.ps1` policy): `codex mcp add olchipanel -- npx.cmd -y olchipanel@latest`.
- The Store/desktop-app `codex.exe` under `WindowsApps` may refuse to run from a
  shell → use the CLI path recorded in your Codex config instead.
- `npm error ENOTCACHED … cache mode is 'only-if-cached'` → the agent's sandbox ran
  npm offline; re-run the command with network access approved — first run needs
  one download, after that the cache serves.

## Scope & privacy

OlchiPanel is a **local developer tool**: it runs on your machine, binds only to
`127.0.0.1` (never exposed to the network) and has **zero runtime dependencies**.
The only network call it ever makes is an optional once-a-day version check against
the npm registry (a plain GET, nothing attached; disable with `OLCHIPANEL_NO_UPDATE_CHECK=1`).
Nothing else is sent anywhere. Panel state lives in plain JSON under `~/.olchipanel/` —
readable by anything on your account, so don't have your agent write secrets into
the goal/steps/changes (it shouldn't anyway). Nothing is uploaded, tracked, or shared.

**Token cost, measured**: the panel's tool surface is ~2.6k tokens nominal, but measured
end-to-end (same task run with and without the panel attached, headless Codex) the
difference was **within noise — about 1–3% of a typical task**, likely thanks to
client-side caching of tool definitions. And it's a trade, not a tax: the board replaces
the "wait, where were we?" re-explanations that routinely cost far more than that.

Hardening, because localhost servers deserve it: every request is **Host-checked**
(DNS-rebinding guard), every write endpoint is **Origin-checked** (CSRF guard) and
runs **fixed server-side templates only** — no request ever carries a command, a
path, or config content. And at ~115 kB of dependency-free source, auditing it
yourself is a ten-minute read.

## Status

Product and npm version **0.8.2**. The 0.8.x line is the full UI refinement and
rendered-QA phase; 0.9 begins only after that acceptance work is complete.

## License

AGPL-3.0-or-later (from v0.7.0). Versions 0.6.x and earlier were released under
the MIT License and remain available under MIT. See `LICENSE`.


## E2 현재 사용법 (2026-09-08)
- 사이드바 제목은 프로젝트 폴더명이며 20자 이내 한 줄로 표시한다. 전체 이름은 제목에 마우스를 올려 확인한다.
- 회색 원은 연결 안 됨, 초록 LED는 연결됨, 회전 스피너는 실제 응답 중이다. 응답 완료나 중단 뒤 연결이 유지되면 초록으로 돌아간다. 작업 완료 여부는 여정에서 확인한다.
- 응답 상태는 Orca의 실제 상태를 약 1.5초마다 확인한다. 동일 프로젝트의 여러 에이전트로 매칭이 모호하면 응답 중이라고 추정하지 않는다.
- OlchiPanel 제목 오른쪽 버튼으로 사이드바를 접고 편다. ◐ 버튼은 다크·라이트를 전환하고 선택을 저장한다.
- 상황·플랜·요청·기록·노트와 본문 탭의 사용법은 1초 hover 또는 키보드 포커스로 확인한다. 상시 안내를 최소화하되 실제 진행·오류는 숨기지 않는다.
- 상단 20자 목표는 현재 목적, 여정은 단계, 기록은 의미 있는 변경·결정·검증이다. 연결 LED를 켜기 위해 여정 상태를 바꾸지 않는다.

LED 추가 기준: 연결된 상태에서 마지막 활동 후 1시간 이상이면 노란불. 세션 시작 시각이 아니라 패널 갱신과 매칭된 Orca 활동의 최신 시각을 사용한다. 응답 중 스피너와 연결 끊김 회색이 우선한다.

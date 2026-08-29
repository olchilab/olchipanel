# 올치패널 런치 카피 초안 (게시=L5 Mark 전속 — 이 문서는 준비물)

작성: Master_D_Fable 2026-07-24 · 상태: draft (Mark 검수 대기)
전략 근거: agentic-os 8-stars 교훈 — 좋은 것만으론 묻힌다. 모든 카피는 예외성 2개(①진짜 fork 시각화 ②두 줄 통합)에만 집중, 범용 대시보드 피치 금지.

---

## 1. Show HN (본선 — 가장 공들일 것)

**제목 후보 (80자 제한):**
- A: `Show HN: OlchiPanel – Watch your AI agent think, branch, and explore – live`
- B: `Show HN: A live map of what your coding agent is doing, drawn by the agent itself`
- C: `Show HN: When your agent forks into parallel attempts, this shows both develop live`

추천=A (제품명+동사 3개가 기능 전부를 전달). C는 차별점 최대지만 맥락 없이 난해.

**본문:**

> I kept losing track of what my coding agent was doing. Not the diffs — the *situation*: what's the goal right now, which path are we on, what did we park when I changed the subject mid-task, and what got decided.
>
> So I built OlchiPanel: a situation board the agent draws for itself, live in your browser. It's narrative instrumentation for the human, not logging for the developer.
>
> The part I haven't seen elsewhere: when the agent forks — two fix hypotheses, parallel subagents — the journey map actually branches, with a note on *why* it forked, and you watch both paths develop side by side until they converge.
>
> Integration is two lines, agent-agnostic by construction: it's an MCP server (works with Claude Code, Cursor, Codex CLI, anything MCP), plus one line in your agent's rules file. That rules line matters — we measured it: with only the MCP config, agents finish tasks without touching the board; with the line, they bake it unprompted.
>
> Zero dependencies — the MCP stdio protocol is just newline-delimited JSON-RPC, so the whole thing is a few hundred lines of plain Node. State is JSON files; the viewer is HTTP+SSE.
>
> Honest limitations: the panel is only as truthful as the agent keeps it (a stale board is worse than none — the rules line pushes updates mid-work, not at the end). Session attribution of branch updates (worker vs orchestrator) is not yet verifiable from state alone.
>
> `npx -y olchipanel` in your MCP config and open localhost:6711. MIT.

포인트: 정직한 한계 문단 포함(HN 문화 — 한계 없는 Show HN은 두들겨 맞음. epistemic honesty가 여기선 전략이기도).

## 2. X/Twitter (스레드 4장)

**1/** Your AI agent works for 20 minutes and gives you a wall of text. You skim it. You miss the part where it silently changed approach.
We built a fix: a live board the agent draws for itself. (GIF)

**2/** The killer part: when the agent hits a crossroads and forks — two hypotheses, parallel subagents — the map *actually branches*. You watch both paths develop live, then converge. Each fork carries a note: why it split.

**3/** Agent-agnostic by construction: it's an MCP server. Claude Code, Cursor, Codex — same two lines: the npx config + one line in your rules file. (We A/B'd it: without the rules line, agents ignore the board. With it, they bake it unprompted.)

**4/** Zero deps, plain Node, JSON files + SSE. MIT. `npx -y olchipanel` → localhost:6711. (repo link)

## 3. r/ClaudeAI

제목: `I made my agent draw its own situation board — goal, journey map, real forks, interrupts — live (MCP, works with Claude Code)`
본문 요지: Claude Code 특화 각도 — .mcp.json 두 줄 + CLAUDE.md 한 줄 실측 스토리, 서브에이전트 fork가 트리로 갈라지는 GIF. "Task tool로 병렬 서브에이전트 돌릴 때 각 갈래가 어디까지 갔는지 보인다."

## 4. r/LocalLLaMA

제목: `OlchiPanel: agent-agnostic live situation board over MCP — zero-dep, local-only, MIT`
본문 요지: 로컬·프라이버시 각도 — 전부 localhost, 외부 전송 0, 상태=로컬 JSON 파일. 어떤 MCP 클라이언트든 동작.

## 5. Product Hunt (게시 시점은 HN 반응 본 뒤)

- Tagline: `Watch your AI agent think, branch, and explore — live`
- 첫 코멘트: Show HN 본문 축약 + GIF.

## 6. 타이밍 권고 (업계 표준)

- Show HN: 평일 한국 밤(미 동부 오전 8~10시) 게시가 정석. 화·수·목 선호.
- X 스레드: HN 게시 직후 같은 날.
- 레딧 2건: HN 다음날(중복 냄새 회피).
- Product Hunt: HN·레딧 반응 데이터로 카피 다듬은 뒤 별도 주(週).

## 7. 게시 전 체크리스트 (전부 서야 게시)

- [ ] npm publish 완료 (`npx -y olchipanel` 실동작 — 카피의 전제)
- [ ] GitHub 공개 레포 (README GIF가 npm/HN에서 보이려면 raw URL 필요)
- [ ] README GIF 경로를 GitHub raw URL로 교체
- [ ] 데모 GIF를 최신 UI로 재생성 (현 GIF=구 UI: 탭·사이드바 구성 변경 전)
- [x] **배포 리허설**: tarball 전역설치→생판 프로젝트에서 `npx olchipanel`로 실사용 실증 (2026-07-24, todoapp에서 세션 렌더 확인). npx 경로=배포 후와 동일 동작.
- [ ] **크로스플랫폼 실측**: mac·linux에서 부팅+MCP 핸드셰이크 (현재 Windows만 실측 — 순수 Node/무의존성이라 설계상 되지만 미검증). 배포 전 3-OS CI 또는 실기 1회.
- [ ] 웹 전용 에이전트(claude.ai 브라우저)는 로컬 stdio 미지원 = README에 "로컬 MCP 에이전트 필요" 명시
- [ ] **내부 전용 파일 공개 레포에서 제외/정리**: `AGENTS.md`·`CLAUDE.md`의 로컬 절대경로(surface 표준 줄), `.olchi/`, `.mcp.json`, `01_plan/` — 공개판에는 범용 CLAUDE.md 룰 한 줄만 남김

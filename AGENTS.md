# OlchiPanel 프로젝트 규칙

## 작업 기억

- 사용자가 OlchiPanel 사용·열기·추적을 명시적으로 요청한 작업에서만 목표를 기록하고, 진행 중 단계·분기·인터럽트를 실제 상태에 맞춰 갱신한다. 일반 세션 시작만으로 OlchiPanel을 등록하거나 실행하지 않는다.
- README·ARCHITECTURE·계획 문서와 Git 실물을 대조한다.
- 외부 공개·npm publish·GitHub push는 사용자 승인 없이 실행하지 않는다.

## 화면·서버 수명주기

- viewer·API·MCP 연동의 실행 방식을 바꾸기 전에 `.olchi/surfaces.json`과 `C:/OlchiProjects/SURFACE_SERVICE_STANDARD.md`를 읽는다.
- 현재 viewer는 loopback 6711~6720 on-demand runtime이다. 실제 주소 정본은 `${USERPROFILE}/.olchipanel/viewer.json`이지만 PID·URL이 stale할 수 있으므로 port range와 함께 대조한다.
- 변경 후 `python C:/Users/topli/.agents/skills/manage-project-surfaces/scripts/surface_manager.py validate --registry C:/OlchiTeams/Registry/surface-service-sources.v1.json`와 같은 registry의 `status`를 실행한다. OlchiTeams가 없는 독립 checkout에서는 portfolio `--root` 검사를 쓴다.
- broad process-name kill을 금지한다. 자신이 연 process·terminal 또는 manifest에 선언된 종료 방식만 사용한다.

## 포트폴리오 체크포인트

- 프로젝트 오너·상태·blocker·다음 행동이 바뀌면 계획 문서와 `.olchi/portfolio.json`을 같은 체크포인트에서 갱신한다.
- 변경 뒤 `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`를 실행한다.

## 올치팀즈 라우팅 (본사 관리 정본 — 전 프로젝트 공통, routing-block-v2)

- 스킬 원장(쓸 수 있는 도구): `C:/OlchiTeams/Skills/CLAUDE.md`
- 보드·포트·서버 수명주기: `C:/OlchiProjects/SURFACE_SERVICE_STANDARD.md`
- 연속성 계약: `C:/OlchiProjects/CONTINUITY_STANDARD.md`
- 포트폴리오 원장: `C:/OlchiProjects/PROJECT_PORTFOLIO_STANDARD.md`
- 프로젝트 신원·훅 계약: `C:/OlchiTeams/Registry/project-agent-bootstrap-v1.md`
- Mark 보고(카톡): Mark 직접 지시·Mark 파생 업무의 **종결 시에만** `C:/OlchiTeams/Runtime/MessageOutbox/pending/`에 요지+증거 포인터 1장
- 안전: 비밀값·PII 원문 기록 금지 · 외부(제3자) 발송·게시·**배포**=Mark 전속 · `C:/OlchiTeams` 수정 금지 — 한정 예외 4: 위 아웃박스 투하 · 자기 키 `pane_register` 원자 갱신 · 자기 세션 `pane_unregister` CAS 삭제 · `session_hook_receipt` append-only 기록

## 프로젝트 신원 (bootstrap v1)

- Claude project master_key: `project:olchipanel:claude`
- Codex project master_key: `project:olchipanel:codex`
- 이 키는 사용자 명시 요청 때의 수동 등록·해제에만 쓴다. `.olchi/pane-hooks.disabled`가 SessionStart·SessionEnd pane 훅을 차단한다.
- 계약: `C:/OlchiTeams/Registry/project-agent-bootstrap-v1.md`

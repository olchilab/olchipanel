# OlchiPanel

목적: 에이전트의 목표·진행·분기·결정을 보여 주는 로컬 MCP 상황판과 데스크톱 앱.
공용 지침: `C:/OlchiProjects/AGENTS.md`를 직접 읽는다.
기록 기준: `C:/OlchiProjects/CONTINUITY_STANDARD.md`. 제품 실행에 `C:/OlchiTeams`를 요구하지 않는다.
UI 작업: `$olchi-ui`, `01_plan/UI-REVIEW-CONTRACT.md`, `.olchi/surfaces.json`을 적용한다.

## 파일 역할 지도

| 역할 | 위치 | Git |
| --- | --- | --- |
| 제품 코드·앱·실행 입구 | `src/`, `public/`, `desktop/`, `bin/`, `packages/` | 추적 |
| 검사·도구 | `test/`, `tools/`, `package.json` | 추적 |
| 계획·UI 계약 | `01_plan/` | 추적; 기존 PLAN 경로 유지 |
| 설계·판단 | `ARCHITECTURE.md`, `docs/` | 추적 |
| 자산 원본 | `assets/` | 추적 |
| 재생성물·검수물 | `output/`, `tmp/`, `dist-desktop/` | 생성·증거 가치 확인 후 개별 판단 |
| 상태·인계·결정·기록·학습 | `STATE.md`, `HANDOFF.md`, `DECISIONS.md`, `WORKLOG.md`, `LEARNINGS.md` | 추적 |
| 비밀값 | 저장소 밖 | 추적 금지 |

시작: `npm start` (`npm run e`, `npm run e2`도 같은 정본 앱). 검사: `npm test`, `git diff --check`.
README는 사람용 안내, `01_plan/PRODUCT-BRIEF.md`는 현재 제품 계획 입구다.

## 이 프로젝트만의 규칙

- 명시적으로 패널 사용·열기·추적을 요청했을 때만 연결한다. 일반 진입이나 MCP 초기화만으로 세션을 만들지 않는다.
- 사용 요청에서는 범위 확인과 지침·스킬 등록을 알리고 MCP `start_project`를 호출한다. 충돌은 덮어쓰지 않는다. 상세는 `.agents/skills/olchipanel-track/SKILL.md`.
- 상태·단계·분기·결정·막힌 점은 실제 변화가 있을 때만 기록한다. 이전 작업은 인수 대상을 확인한 뒤 잇고 미래 세션 자동 연결을 가정하지 않는다.
- `package.json#productVersion`과 npm `version`은 `0.8.2`다. 0.9 확정은 사용자 지시가 필요하다. 의미 있는 변경은 같은 버전의 `CHANGELOG.md`에 기록한다.
- 기능 완료에는 화면과 에이전트 계약(`src/mcp.js`, `skills/olchipanel-track/`, 회귀 검사)이 함께 들어간다. MCP 기본 지침은 짧게 둔다.
- UI 구현 전 표시 의미→사용자 행동→기대 변화→재방문 상태를 정의한다. 구현 뒤 실제 앱에서 두 관점으로 전후·빈 상태·새 데이터·재실행을 확인하고 발견한 문제를 고쳐 재확인한다.
- 검수 대상은 PC의 `OlchiPanel E` 한 창이다. 이 PC의 `windowMode: desktop`을 따르며 실패 시 브라우저로 대체하지 않는다. `public/e2/`는 보관본이다.
- viewer·API·MCP 실행 변경 전 `.olchi/surfaces.json`과 `C:/OlchiProjects/SURFACE_SERVICE_STANDARD.md`를 읽는다. MCP 소유 viewer를 종료하지 않고, 독립 viewer만 소유권 확인 후 재시작한다.
- UI 갱신 후 앱을 다시 열고 `/api/state` 버전, 6711~6720 단일 listener, 새 실화면을 확인한다. MCP 서버 코드 반영 여부는 별도로 보고한다.
- 프로세스 이름 전체 종료를 금지한다. 자신이 연 프로세스·터미널 또는 manifest 종료 방식만 쓴다.
- 오너·상태·blocker·다음 행동 변경 시 계획과 `.olchi/portfolio.json`을 함께 갱신하고 `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`를 실행한다.
- 외부 공개·npm publish·GitHub push는 사용자 승인 없이 실행하지 않는다. `.olchi/pane-hooks.disabled`는 창 훅 차단 상태다.

<!-- olchipanel:project-start:v1 -->
OlchiPanel 등록은 위 명시적 사용 조건에만 따른다. Claude는 `.claude/skills/olchipanel-track/SKILL.md`를 사용한다.
<!-- /olchipanel:project-start:v1 -->

# HANDOFF — olchipanel

## Commit And Tree

- canonical_path: `C:/OlchiProjects/olchipanel`.
- canonical_line: 로컬 `master` 0.8.2 + 단일창·원본 아이콘 + 공개판 베타 피드백 + 내부 운영 문서.
- base_commit: `7e892c3`.
- pre-consolidation checkpoints: primary `3b6a12f`, public beta `812eacc`, latest product `7dad29f`.
- preservation refs: `archive/master-before-consolidation`=`3b6a12f`, `archive/public-beta-before-consolidation`=`812eacc`, `fix/single-panel-window`=`7dad29f`, `fix/plan-layout-fit`=`3a4f0ea`, `fix/taskbar-icon-v3`=`fba8096`.
- expected dirty paths: untracked `output/` 시각 검증 artifact만 허용.

## Current Goal

Wanted AI Championship 2026 제출을 위해 설치·첫 성공·공개 데모를 검증 가능한 환경 계약으로 닫는다.

## Completed

STATE.md 참조. **다시 하지 말 것**: ①패널 뷰어 반복 재기동으로 창 여러 개 띄우기 — 재기동은 `OLCHIPANEL_OPEN=0`으로 ②heredoc/curl에 백틱·한글·아포스트로피 — Write/Edit 도구로 ③CRLF 커밋 — LF 정규화 후.

## In Progress

- 보조 worktree 4개 제거 및 통합 브랜치 `master` 승격 완료. 원격 push만 권한 대기.
- 상단 탭은 상황·플랜·요청·기록·메모 5개가 정본이다. 상황 내부=지도·스택, 기록 내부=변경·결정·막힌 길이며 예전 저장 탭 값은 자동 이관한다.
- 지도 내부는 트리/그래프 두 보기다. 둘 다 `map.tree`가 정본이며 그래프 노드 위치만 `olchipanel.graph.layout.<session>` 로컬 설정에 저장한다. 노드 배치를 작업 상태로 역반영하지 않는다.
- 제출 일정 정본=`01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`. 기능 동결=9/15, 1차 최종 제출=9/17, 참가 접수=9/18, 공식 제출 마감=9/20.

## Next Actions

1. Mark가 개인/팀 참가 형태를 확정하고 참가 접수를 먼저 완료한다.
2. 9/1~3에 진단 명령·선택형 설치·Antigravity·Node LTS 계약을 닫는다.
3. 9/4~10에 Windows/macOS/Linux × Claude/Codex/Cursor/Antigravity acceptance 증거를 만든다.
4. 9/13까지 설치 없는 공개 데모와 익명 fixture 제출 자산을 완성하고 9/14 블라인드 설치를 실행한다.
5. 9/15 이후 기능 추가를 멈추고, `Olchi-Mark` 권한 해결 뒤 `master` 내용을 원격 `main` PR·release-please 경로로 배포한다.

## Blockers And Approval

- 배포 승인은 확보됨. blocker=`Olchi-Mark`의 `olchilab/olchipanel` 쓰기 권한 없음(HTTPS 403, SSH permission denied). 두 시도 모두 원격 변경 없음. 홍보=L5.

## Verification Commands

- `npm test` (= `node test/smoke.js`)
- `node test/ui-shell.test.js`
- `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`
- `python tools/continuity_check.py`

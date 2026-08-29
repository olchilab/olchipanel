# HANDOFF — olchipanel

## Commit And Tree

- canonical_path: `C:/OlchiProjects/olchipanel`.
- canonical_line: 로컬 `master` 0.8.2 + 단일창·원본 아이콘 + 공개판 베타 피드백 + 내부 운영 문서.
- base_commit: `5cd484f`.
- pre-consolidation checkpoints: primary `3b6a12f`, public beta `812eacc`, latest product `7dad29f`.
- preservation refs: `archive/master-before-consolidation`=`3b6a12f`, `archive/public-beta-before-consolidation`=`812eacc`, `fix/single-panel-window`=`7dad29f`, `fix/plan-layout-fit`=`3a4f0ea`, `fix/taskbar-icon-v3`=`fba8096`.
- expected dirty paths: untracked `output/` 시각 검증 artifact만 허용.

## Current Goal

주 폴더 단일 정본, 플랜 전체 폭, 5개 상단 작업군의 실물 검증을 유지한다.

## Completed

STATE.md 참조. **다시 하지 말 것**: ①패널 뷰어 반복 재기동으로 창 여러 개 띄우기 — 재기동은 `OLCHIPANEL_OPEN=0`으로 ②heredoc/curl에 백틱·한글·아포스트로피 — Write/Edit 도구로 ③CRLF 커밋 — LF 정규화 후.

## In Progress

- 보조 worktree 4개 제거 및 통합 브랜치 `master` 승격 완료. 원격 push만 권한 대기.
- 상단 탭은 상황·플랜·요청·기록·메모 5개가 정본이다. 상황 내부=지도·스택, 기록 내부=변경·결정·막힌 길이며 예전 저장 탭 값은 자동 이관한다.

## Next Actions

1. 코드 작업은 `C:/OlchiProjects/olchipanel` 한 곳에서만 한다.
2. `npm test`와 플랜 전체 폭·무가로넘침, 5개 상단 탭의 데스크톱·390px 실물 검수를 통과한 뒤에만 배포 경계로 이동한다.
3. `Olchi-Mark`에 저장소 쓰기 권한을 부여하거나 이 저장소에만 쓰기 가능한 인증을 제공한 뒤 `master`를 PR 브랜치로 push하고 release-please 경로를 진행한다.

## Blockers And Approval

- 배포 승인은 확보됨. blocker=`Olchi-Mark`의 `olchilab/olchipanel` 쓰기 권한 없음(HTTPS 403, SSH permission denied). 두 시도 모두 원격 변경 없음. 홍보=L5.

## Verification Commands

- `npm test` (= `node test/smoke.js`)
- `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`
- `python tools/continuity_check.py`

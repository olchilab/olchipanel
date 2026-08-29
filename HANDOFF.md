# HANDOFF — olchipanel

## Commit And Tree

- canonical_path: `C:/OlchiProjects/olchipanel`.
- canonical_line: `origin/main` 0.8.2 + 로컬 단일창·원본 아이콘 + 공개판 베타 피드백 + 내부 운영 문서.
- pre-consolidation checkpoints: primary `3b6a12f`, public beta `812eacc`, latest product `7dad29f`.
- expected dirty paths: `output/` 시각 검증 artifact와 ignored `.olchi/pane-hooks.disabled`만 허용.

## Current Goal

주 폴더 단일 정본과 플랜 화면 실물 검증을 유지한다.

## Completed

STATE.md 참조. **다시 하지 말 것**: ①패널 뷰어 반복 재기동으로 창 여러 개 띄우기 — 재기동은 `OLCHIPANEL_OPEN=0`으로 ②heredoc/curl에 백틱·한글·아포스트로피 — Write/Edit 도구로 ③CRLF 커밋 — LF 정규화 후.

## In Progress

- 보조 worktree 폴더 정리와 통합 브랜치의 `master` 승격.

## Next Actions

1. 코드 작업은 `C:/OlchiProjects/olchipanel` 한 곳에서만 한다.
2. `npm test`와 플랜 Playwright 렌더를 통과한 뒤에만 배포 경계로 이동한다.
3. push·release·npm publish는 Mark 승인 시 실행한다.

## Blockers And Approval

- release PR #9 머지=Mark(L5). 홍보=L5.

## Verification Commands

- `npm test` (= `node test/smoke.js`)
- `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`
- `python tools/continuity_check.py`

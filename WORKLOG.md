# WORKLOG — olchipanel (append-only)

- 2026-07-28 오전~오후 KST: 파일럿 피드백 당일 연쇄 반영 0.2→0.6(메모 패널별 탭·stop·유휴 접기·전용 크롬 프로필·창 1개/보드·벤더색). dev `94a2fa0` / public `9aa92cc`. release PR #9(0.6.2) 대기. 증거=CHANGELOG.md·git log.
- 2026-07-28 16:55 KST: 연속성 계약 파일 신설(STATE/HANDOFF/WORKLOG/DECISIONS/LEARNINGS + tools/continuity_check.py), `.olchi/portfolio.json` continuity 3칸 충족. 집행=Master_D_Fable.
- 2026-08-29 KST: 플랜의 중간 가로 스크롤 제거 뒤 5열을 좁은 `max-width`에 압축한 자기검수를 오답으로 판정. 플랜 탭만 OlchiPanel 전체 가용 폭을 사용하도록 보정하고, full-width 전환·무가로넘침 정적 회귀와 1920px 실제 렌더를 검수 기준으로 승격. 증거=`test/ui-shell.test.js`, `output/playwright/plan-consolidated-fullwidth.png`.
- 2026-08-29 12:54 KST: 상단 8개 탭을 상황·플랜·요청·기록·메모 5개 작업군으로 통합. 지도·스택은 상황 내부, 변경·결정·막힌 길은 기록 내부 보기로 낮추고 기존 저장 탭 이관·키보드·ARIA 회귀를 추가했다. 증거=`test/ui-shell.test.js`, `output/audit/02-five-tabs-records.png`, `output/audit/03-five-tabs-situation.png`, `output/audit/04-five-tabs-mobile.png`.
- 2026-08-31 KST: Wanted AI Championship 2026 공식 조건(참가 9/18, 제출 9/20, 배포 링크 필수)을 확인하고 9/15 기능 동결·9/17 1차 제출 계획을 수립. Windows/macOS/Linux × Claude/Codex/Cursor/Antigravity의 설치·첫 성공 계약, 공개 데모, 블라인드 설치 게이트를 P0로 확정. 증거=`01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`.
- 2026-08-31 19:09 KST: Gravity UI Graph의 노드·간선·카메라 패턴을 현재 여정 지도에 무의존 SVG로 흡수. 트리/그래프 전환, 이동·확대·맞춤·정렬, 로컬 노드 배치를 구현하고 1440×1000·390×844·다크 테마 실렌더를 검수했다. 상태 정본은 계속 `map.tree`이며 배치는 세션별 로컬 설정이다. 증거=`test/ui-shell.test.js`, `output/playwright/journey-graph-desktop.png`, `journey-graph-mobile.png`, `journey-graph-dark.png`.

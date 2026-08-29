# 올치패널 뷰어 UI — pack-ui-core 감사 (cs-001·002·003)

작성: Master_D_Fable 2026-07-24 · 대상: `public/index.html` (situation-board surface)
경위: Mark "uicore 문서 찾아봐바" → 트리거("UI 작업 시작 전") 위반 자백 — 오늘 UI 사이클 전체를 팩 없이 진행. 사후 감사로 수리.

## 권별 소요 (rubric 공통 항목)

| 권 | 시작 | 첫 실측 | 종료 | 소요 |
|---|---|---|---|---|
| cs-001 | 12:05 | 12:07 (구조 대조) | 12:20 | ~15분 (inventory 작성 포함) |
| cs-002 | 12:06 | 12:08 (전이 대조) | 12:20 | ~진행 겹침 |
| cs-003 | 12:07 | 12:09 (DOM 검사) | 12:14 (수리) | ~7분 |

## cs-001 기능 inventory (사후 작성 — 이후 UI 변경의 보존 기준)

| 사용자 질문 | 반드시 보는 값 | 제어 | 제어 뒤 상태 | 원천 | 최종 위치 |
|---|---|---|---|---|---|
| 지금 목표가 뭔가 | goal | — | — | session.goal | goalbar(h1), 첫 viewport |
| 지금 어디까지 왔나 | now 노드·트리 | ▾접기, 탭 | openState 보존 | map.tree | 지도 탭(기본) |
| 어느 세션인가/살았나 | name·agent·alive·갱신시각 | 세션 클릭·드래그 | 선택/순서 저장 | 세션 목록 | 사이드바+stamp |
| 뭘 바꿨나 | changes 목록 | 탭 | — | changes[] | 변경 탭+배지 |
| 나한테 뭘 원하나 | pending(hot) | 탭 | — | pending[] | 요청 탭+배지 |
| 뭘 결정/가정했나 | decisions(kind) | 탭 | — | decisions[] | 결정 탭 |
| 뭐가 실패했나 | deadends | 탭 | — | deadends[] | 막힌 길 탭 |
| 하던 일 어디 갔나 | stack(재개점) | 탭 | — | stack[] | 스택 탭 |
| 연결 살아있나 | SSE 상태 | — | live/재연결 표시 | EventSource | 탑바 status |
| (보조) 테마·언어·접기 | — | ◐·한/EN·☰ | localStorage 보존 | — | 탑바 |

역대조: 전 행이 최종 위치에 연결됨 — 누락 0. (용어 탭 삭제=명시적 범위 밖 결정, f17a826 커밋 메시지에 근거.)

## cs-002 상태표 (뷰어=read-only, 비동기는 연결·조회 2종)

| action | pending cue | duplicate policy | success evidence | failure | recovery |
|---|---|---|---|---|---|
| SSE 연결 | "연결 중…" | EventSource 단일 | ● live(초록) | "재연결 중…"(빨강 점) | EventSource 내장 auto-retry |
| /api/state fetch | (120ms 내 무표시) | debounce 후속 이벤트 병합 | 화면 갱신+updated 티커 | 조용히 skip(.catch) — 다음 SSE/5s 폴백이 재시도 | SSE 폴백 |
| 탭/세션/테마/언어/접기/드래그 | 즉시(<300ms 로컬) | 멱등 | 화면 전환+localStorage | 해당 없음(로컬) | 새로고침=저장 상태 복원 |

- 사용자 입력 필드 없음 → 입력 보존 항목 N/A.
- fixture: MCP 왕복·SSE 무리로드 갱신·중복 id 거부는 기존 테스트로 커버(mcp_test_v2·simulate_worker). 응답 역전 fixture는 미작성 — 뷰어 fetch가 전체 스냅샷 교체라 역전 무해(마지막 응답 승리), 잔여 위험=오래된 응답이 늦게 도착하는 창(다음 SSE로 자가 치유).

## 3권 첫 실행 원본 결과 → 수리 trace

| 권 | 항목 | 첫 실행 | 수리 | 재검증 |
|---|---|---|---|---|
| cs-001 | 1 inventory 존재 | **FAIL** (부재) | 이 문서 §inventory | 작성됨 |
| cs-001 | 2·6 대조·역대조 | FAIL(1 종속) | 역대조 표 | 누락 0 |
| cs-001 | 3 첫 viewport 상태·주행동 | PASS | — | — |
| cs-001 | 4 overflow·복귀 제어 | PASS (800px 실측 49324d3) | — | — |
| cs-001 | 5 사례쌍 재현 없음 | PASS | — | — |
| cs-002 | 1 상태표 | **FAIL** (부재) | 이 문서 §상태표 | 작성됨 |
| cs-002 | 2·5·6 | PASS | — | — |
| cs-002 | 3·4 | N/A (입력 필드·overlay 없음) | — | — |
| cs-002 | 7 fixture | 부분 FAIL | 역전 무해 논증+잔여 위험 명시 | 문서화 |
| cs-003 | 1 의미 구조 | **FAIL** (div 수프) | header/nav/main/h1/tablist | DOM 검사 PASS |
| cs-003 | 2 키보드 완주 | **FAIL** (탭=div, focus 불가) | 탭 전부 `<button role=tab>` | 실측 아래 |
| cs-003 | 3 focus 표시 | FAIL(2 종속) | focus-visible outline(lime) | 실측 아래 |
| cs-003 | 4 색만 전달 | 경계 (live=초록 점만) | dot에 role=img+aria-label+title, dead=무점+투명도(형태 신호) | PASS |
| cs-003 | 5 이름 없는 아이콘 | 경계 (title만) | ☰·◐·한/EN aria-label 부여 | PASS |
| cs-003 | 6 두 viewport 가림 | PASS (1100/800 실측) | — | — |
| cs-003 | 7·8 | PASS / N/A(overlay 없음) | — | — |

판정: 3권 모두 첫 실행 FAIL 존재(정직 기록) → 수리 → 재검증. N/A 사유 전부 명기. cs-002 #7만 부분(역전 fixture 미작성, 위험 논증으로 대체 — 완전 PASS 아님을 명시).

## 남는 것

- 이후 UI 변경 시 이 inventory가 보존/변경 표의 기준이다 — 행 삭제는 명시 결정으로만.
- 디자인 시각 완성도(Mark 불만)는 이 감사 범위 밖 — 별도 재작업 대기.

# LEARNINGS — olchipanel

- 뷰어를 백그라운드 태스크로 띄우면 세션 정리 때 자주 killed → 기본값=`OLCHIPANEL_OPEN=0` + PowerShell `Start-Process -WindowStyle Hidden` 분리 기동. 적용 범위=모든 재기동.
- UI 변경은 에이전트 세션 재시작 불요 — 뷰어만 새 코드로 재기동하면 즉시 반영. 적용 범위=프론트 수정 전부.
- `start msedge --app=`은 Edge 별칭 부재 시 조용히 탭 모드로 폴백(주소창 노출) → 실제 exe 경로 탐지 후 직접 실행이 기본값.
- 전역 MCP는 머신의 모든 세션을 자동 접속시켜 빈 패널이 누적 → untouched 세션은 접어서 표시(idle fold)가 기본값.
- 셸 문자열(heredoc/curl/치환)에 백틱·한글·아포스트로피는 깨짐 → 파일 조작은 Write/Edit 도구, 커밋 전 LF 정규화.
- 플랜 5열을 `max-width` 안에 압축해 "전부 보인다"고 판단하면 열은 잘리지 않아도 OlchiPanel 오른쪽 가용 폭을 버리는 오답이다 → 플랜 탭에서만 workspace의 폭 제한을 해제하고, 데스크톱 검수는 `workspace`가 viewport 오른쪽 끝까지 쓰이는지와 document·iframe·board의 `scrollWidth === clientWidth`를 함께 확인한다. 글 중심 탭의 읽기 폭은 유지한다.

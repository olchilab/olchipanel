# 앱 실행·메뉴·라벨 검수 — 2026-09-20

목적: PC에서 앱 한 창만 사용하고, 작은 메뉴 간격과 분명한 카드 라벨/정렬로 내용을 빠르게 찾는다. 공통 노트는 Backquote, 상황/기록 탭은 글자를 키우고 세로 여백을 줄인다.

구현: machine-local desktop preference, native launcher with no browser fallback, README/AGENTS/CLAUDE/설치된 프로젝트 스킬 정합. 사이드바32px, 상단탭16px/세로padding6px, 공통노트 Backquote. 색 라벨은 카드 제목 아래/설명 위, 12px 채움 배지. 우선순위 점은8px/box-sizing:border-box로 통일하고22px 제목 첫 줄과 손잡이 중심 정렬. 색 라벨과 우선순위는 다른 데이터이며 미지정 라벨은 새로 만들지 않는다.

디자이너 관찰: labels-board-light/dark.png에서 다섯 색과 흰 글자 구분, 제목→라벨→설명 순서 확인. 선택 라벨의 체크와 채움 구별. records-tabs.png에서 키캡/건수 중앙 정렬 및 밑줄 선택, 상단 세로 공간 축소 확인. 전체 테마의 겹테두리 문제는 개선 제안만 기록했고 대규모 테마 교체는 하지 않았다.

UI 담당자: 실제 Electron에 CDP로 연결; 별도 브라우저 없음. checks.json의9개 동작 확인. Backquote 본문/플랜 iframe, 0 무동작, 입력/IME/대화상자 보호, 라벨 선택·저장·재열기, 재로드 확인. 라벨 저장 검수는 메모리 fixture/API 대체 사용으로 실제 카드 쓰기 없음. 기존 plan.test 51개 PASS는 실제 저장 계약 증거와 구분한다. 흰 글자 대비5.03~6.96. 밝음/어두움과 긴 설명 확인.

자체 교정: 최초 iframe QA는 좌표 클릭이 카드 작성창을 열어 단축키가 정상 차단됐다. 비편집 body focus로 교체. 재로드 직후 프레임 로드 대기를 추가했다. 전환 직후 캡처는 색상 transition 완료를 기다려 다시 촬영했다. 실패는 제품 버그로 오인하지 않고 재검증했다.

실행: MCP viewer60868/6711을 보존. 새 CLI open이 기존 Electron 한 창을 재사용함을 프로세스로 확인. 기존 MCP가 메모리에 읽은 launcher 모듈은 그 MCP의 다음 정상 시작에 로드되며, 현재 자동열기 설정은 없음. 임시 디버그 app은 종료하고 정상 앱만 다시 유지한다.

검증: desktop-launch, ui-shell, electron-shell, theme-renderer, tracking-skill, project-setup, single-instance, plan 모두 PASS. 공개 데모/깃허브/npm 배포 없음. 배포된 v84와 제출 완료 상태 유지. 최종 사용자 시각 승인은 별도.

최종 실행 확인: 일반 Electron PID39024 실창/접근성 확인, viewer60868 단일6711/version0.8.2, 디버그9337 종료. surface registry는 기존 외부3경로 누락, portfolio는 기존 타프로젝트7오류로 RED; OlchiPanel continuity PASS와 구분한다. UI candidate ui.20260920.001 / 사건 err.20260920.006 target check PASS.

최종 OS 캡처는 다른 작업 창에 가려져 완전한 눈검수 증거로 사용하지 않는다. 눈검수 증거는 같은 실제 Electron 렌더러에서 직접 캡처한 위 light/dark 및 tabs PNG다.

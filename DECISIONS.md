# DECISIONS — olchipanel

- **레포 2벌 구조**: dev(`master`, Seat trailer 포함 전 이력)와 공개판(`public`, 내부파일·trailer 제거) 분리. 근거=내부 운영 흔적을 공개 이력에서 차단. 버린 갈래=단일 레포+브랜치 분리(trailer 유출 위험). 경계=공개판만 push, 연속성·내부 파일은 dev 전용.
- **배포 승인=릴리스 PR 머지**: release-please가 PR을 유지하고 Mark 머지가 곧 배포 승인(L5). 버린 갈래=수동 npm publish(토큰 관리·승인 증거 부재).
- **ChatGPT 앱 연결 범위**: 실측으로 "Work(Codex) 노출/일반 채팅 미노출" 확정(2026-07-28, Mark 실측). 문서보다 실물 우선 — README "Who can connect"가 정본.
- **메모 UI=패널별 탭**(우측 드로어 기각 — 가림·닫힘 문제), **자동열기=보드당 창 1개**(반복 open 기각), **주소창 제거=전용 크롬/엣지 프로필 --app 직접 실행**(별칭 폴백 기각).

# STATE — olchipanel

## Current Goal

OlchiPanel 개발 정본을 `C:/OlchiProjects/olchipanel` 하나로 통합하고 플랜 화면 잘림 회귀를 닫는다.

## Stage

로컬 통합본 0.8.2 검증 완료. 외부 push·npm 배포 전 상태.

## Completed

- 공개판 베타 피드백, UI Core, 플랜 레이아웃, 단일창, 원본 남색 투명 아이콘 변경을 최신 0.8.2 코드 위에 통합했다.
- 플랜 데스크톱 5열은 중간 가로 스크롤 없이 한 화면에 맞고 iframe 높이는 내용에 따라 맞춰진다.
- 전체 회귀: smoke, beta-feedback, single-instance, UI shell, Windows icon launch, plan 3종 PASS.
- 실제 PWA는 설치된 Chrome app-id로 실행되며 viewer는 127.0.0.1:6711 on-demand로 동작한다.

## In Progress

- 개발용 보조 worktree 제거 및 주 폴더 단일화 마감.

## Next Branches

- Mark가 원할 때 통합본 push·release·npm 배포.
- 배포 뒤 친구 설치 경로(운영체제·Claude/Codex/Antigravity 구분) 재검증.

## Approval Status

- 외부 push·release PR·npm 배포는 Mark 승인 경계. 이번 체크포인트는 로컬 통합만 수행한다.

## Last Updated

2026-08-29 12:26 KST

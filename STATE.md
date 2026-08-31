# STATE — olchipanel

## Current Goal

Wanted AI Championship 2026 제출본을 2026-09-17까지 먼저 제출하고, Windows·macOS·Linux와 Claude·Codex·Cursor·Antigravity의 검증된 설치·첫 성공 경로를 만든다.

## Stage

제출 계획과 환경 계약 수립 완료. 9/1부터 설치·진단·크로스플랫폼 P0를 시작하며 GitHub 쓰기 권한은 계속 대기한다.

## Completed

- 공개판 베타 피드백, UI Core, 플랜 레이아웃, 단일창, 원본 남색 투명 아이콘 변경을 최신 0.8.2 코드 위에 통합했다.
- 플랜 데스크톱 5열은 플랜 탭의 전체 가용 폭을 사용하며 중간·하단 가로 스크롤 없이 한 화면에 맞고 iframe 높이는 내용에 따라 맞춰진다.
- 전체 회귀: smoke, beta-feedback, single-instance, UI shell, Windows icon launch, plan 3종 PASS.
- 실제 PWA는 설치된 Chrome app-id로 실행되며 viewer는 127.0.0.1:6711 on-demand로 동작한다.
- 보조 worktree 4개를 제거했고 개발 정본은 `C:/OlchiProjects/olchipanel`의 `master` 하나다. 제거 전 변경은 archive/checkpoint 브랜치에 보존했다.
- 상단 8개 탭을 `상황·플랜·요청·기록·메모` 5개로 정리했다. `지도·스택`은 상황 안에서, `변경·결정·막힌 길`은 기록 안에서 전환하며 플랜과 요청은 즉시 접근성을 유지한다.
- 기존 저장 탭 값은 새 그룹으로 자동 이관되고, 상위·내부 탭 모두 Arrow/Home/End 키보드 이동과 ARIA 상태를 유지한다.
- 1440급 PWA 실물과 390×844 렌더에서 5개 상단 탭 및 내부 탭 구성을 확인했다.

## In Progress

- 9/15 기능 동결, 9/17 1차 제출, 9/20 공식 마감을 기준으로 `01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`를 실행한다.
- 원격 배포는 인증 권한에 막혀 있지만 로컬 설치·진단·테스트·공개 데모 준비는 먼저 진행할 수 있다.

## Next Branches

- Mark가 개인/팀 참가 형태를 정하고 9/18 전에 참가 접수를 완료한다.
- 9/3 전 GitHub 쓰기 권한과 로컬 `master`→원격 `main` 반영 경로를 닫는다.
- `olchipanel doctor`, OS×에이전트 선택형 설치 안내, Antigravity 설정, 세 OS 전체 테스트를 P0로 구현한다.
- 설치 없는 공개 데모와 제출 자산을 9/13까지 완성하고 9/14 블라인드 설치를 진행한다.

## Approval Status

- Mark의 push·PR·release·npm 배포 승인은 확보했다. HTTPS와 SSH 모두 `Olchi-Mark` 권한 부족(403/permission denied)으로 원격 변경 없이 중단했다.

## Last Updated

2026-08-31 KST

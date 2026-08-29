# STATE — olchipanel

## Current Goal

OlchiPanel 단일 정본에서 상단 정보 구조를 5개 작업군으로 단순화하고 검증 상태를 유지한다.

## Stage

로컬 통합본 0.8.2의 주 폴더 단일화·플랜 폭·5개 상단 탭 검증 완료. GitHub 쓰기 권한 대기.

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

- 로컬 배포 후보 검수는 마감했고, 원격 배포만 인증 권한에 막혀 있다.

## Next Branches

- `Olchi-Mark`에 `olchilab/olchipanel` 쓰기 권한을 부여하거나 쓰기 가능한 계정으로 이 저장소에만 인증한 뒤 통합본 push·release·npm 배포.
- 배포 뒤 친구 설치 경로(운영체제·Claude/Codex/Antigravity 구분) 재검증.

## Approval Status

- Mark의 push·PR·release·npm 배포 승인은 확보했다. HTTPS와 SSH 모두 `Olchi-Mark` 권한 부족(403/permission denied)으로 원격 변경 없이 중단했다.

## Last Updated

2026-08-29 12:54 KST

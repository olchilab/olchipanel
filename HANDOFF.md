# HANDOFF — olchipanel

## 2026-09-20 앱 실행·메뉴·라벨 후속 교정

PC desktop-only preference와 Electron launcher를 반영하고 관련 지침/설치된 스킬을 맞췄다. 사이드바32px, 상황/기록 글자16px·세로여백 축소, 공통노트 Backquote. 라벨은 카드 제목 바로 아래의 채움 배지, 우선순위 점8px 정렬. 실제 Electron 밝음/어두움·단축키·입력 보호·라벨 선택/재열기 검수 및 표적 테스트 통과. 라벨 쓰기는 격리 메모리 fixture로 검수했다. 증거 `output/app-only-sidebar/REVIEW.md`, `checks.json`, PNG. 전체 테마 겹테두리는 제안 단계. 제품0.8.2, 제출 완료 및 공개v84 유지. 다음은 Mark 시각 검토. MCP 소유 viewer는 보존하며 앱만 재시작; 기존 MCP launcher 모듈은 다음 정상 시작에 갱신된다.


## 2026-09-20 최신 — 최종 제출 및 운영 고지 완료

원티드 AI Championship 2026 최종 제출 완료. 과제 제출하기 클릭 후 “과제를 제출했어요.” 알림 및 개인 과제 카드 확인. 내 과제 미리보기 재열람·새로고침 후 R8 문구/대표 이미지/스크린샷5장/서비스 링크 일치. 운영 고지 메일도 t-mktg@wantedlab.com 발송 및 SENT 재확인(1a0bd790b4c2b987). 증거 `output/championship-submission-r8/SUBMISSION-RECEIPT.md`. 2026-09-20 15:26 KST. 이전 제출 보류·미완료·PC 조작 답변 대기 기록은 모두 이전 이력이다. 창 변화는 사용자 조작으로 입증되지 않았으며 별도 Windows 첨부 창에 대한 자동화 대상 지정 문제로 정정했다. 다음은 심사/주최 측 회신 확인과 데모 공개 상태 유지.

## 2026-09-20 제출 재개 — 첨부 전 사용자 PC 조작 확인 대기

Mark가 최종 제출을 명시 승인해 보류를 해제했다. 로그인된 원티드 apply 화면에서 실제 문제100자 제한과 이전 입력 오염을 확인하고 문제64자·AI456자로 교체하여 읽어 검증했다. 공개 v84 화면5장(1920×1080) R8 촬영·눈검수 완료. 대표/스크린샷 첨부와 최종 제출은 미완료. Chrome 탭/창이 입력 중 바뀌어 사용자 PC 조작 중지 확인을 요청했고 답변 대기 중이다. 별도 주최 측 운영 고지 이메일도 수신자/발송 명시 확인 대기. 다음: 사용자 조작 중지 응답 후 파일 첨부, React 태그 확인, 저장/최종 제출/재열람 증거. R8 `fields.json`, `제출문안.md`, `images.json`, `운영고지-이메일.txt` 참조. 사용자 무응답을 승인으로 해석하지 않는다.

## 2026-09-20 최신 — 처음 체험 흐름 검수·공개 v84

공개 데모 v84 체험자 관점 검수 및 수정 완료. 접힌 안내를 상단으로 이동하고 그래프 가독성·안내 완료 피드백·다크 로고를 개선했다. 연결 노트→자료 분석 저장에서 이전 자동 저장이 결과를 삭제하던 오류를 reload 없는 병합으로 수정했다. 2개 화면 크기 14단계 눈검수, 공개 연속 흐름12개·노트 연결14개·표적8개 PASS, 공개 정적18개 해시 일치. 앱 원본7개 해시 유지·내부 스킬 제외. 대회 제출은 계속 보류. 증거 `output/playwright/tester-review/REVIEW.md` / `DEPLOYMENT.md`.

아래 이전 공개 버전 기록은 이 체크포인트 이전 이력이다.

## 2026-09-20 최신 공개 상태

노트 페이지 연결 데모는 Mark 배포 지시로 **공개 v83 완료**, https://olchilab.com/olchipanel/. 바로 아래의 “공개 미반영”은 배포 전 기록이다. 원본 앱·내부 스킬 비공개 경계는 유지한다. 공개 검증/제한은 `output/playwright/note-links/DEPLOYMENT.md`. 대회 최종 제출은 계속 보류이며 이번 배포가 제출 재개 지시는 아니다.

## 2026-09-20 우선 인계

이번 변경 소유 경로: `.github/workflows/release.yml`, `.gitignore`, `01_plan/PUBLIC-DEMO-BOUNDARY-20260920.md`, `tools/check-public-package.cjs`, `tools/prepare-public-demo.cjs`, `tools/build-championship-demo.cjs`, `tools/championship/note-links.js`, `tools/championship/shell.js`, 관련 상태/제출 문서 및 `output/playwright/note-links/`, `output/github-demo-public/`. 기존 dirty 앱 코드와 다른 사용자 변경은 보존했다.

대회 제출은 Mark의 중단 요청 이후 보류 중. 그래프 항목→특정 노트 페이지 연결을 **데모에만** 추가해 로컬 검수 완료. 원본 앱은 승격하지 않는다. 이번 변경은 공개 미반영(v82 유지). `STATE.md` 최신 항목과 `01_plan/PUBLIC-DEMO-BOUNDARY-20260920.md`를 먼저 확인한다. 내부 스킬은 GitHub/배포에 포함하지 않으며 `output/github-demo-public/`만 정적 공개 묶음이다. npm/설치 파일은 스킬 포함 상태라 게시 금지. 다음은 사용자 로컬 검토와 공개 반영 여부 확인.

## 2026-09-19 최신 — 세션 하위 메뉴와 0 공통 노트

선택한 세션 바로 아래에 1 상황·2 플랜·3 자료 분석·4 요청·5 기록이 펼쳐진다. 다른 세션을 고르면 이전 메뉴는 접히고 새 세션 아래로 이동한다. 하단 0 공통 노트는 독립 유지한다. 본문 QWE는 상황(1)과 기록(5)에서 동작한다. 앱 원본과 생성 데모 동일 구현, 제품 0.8.2 유지.

- 180ms 펼침과 방향 표시, reduced-motion 생략. 갱신 때 같은 메뉴 DOM/단축키 포커스·스크롤 보존. 공통 노트에서 세션을 선택하면 마지막 세션 화면 복귀. 세션이 없는 상태에서도 0 공통 노트 사용 가능.
- 원본 렌더+공개 브라우저: 숫자 0~5 및 QWE의 마우스/단축키 표시 일치, 메뉴 이동·단일 메뉴·0 독립, 1.8초 갱신 후 포커스 유지, 빈 세션, 입력/대화상자 보호, 플랜 iframe에서 0, 작은 1100×660 화면 펼침/접힘, 다크·모션 감소·새 방문 초기화 PASS. 표적9/9. 증거 output/playwright/smooth-review/session-nav-public.txt, session-nav-edge-public.txt, session-nav-tests.txt.
- viewer stop/open 및 앱 재기동 완료: viewer3184/6711 단일 listener, Electron27200, API version0.8.2. 실제 앱 접근성 트리에서 세션 아래 메뉴와 공통 노트 확인. OS 화면 캡처는 다른 창에 일부 가려져 완전한 시각 증거로 쓰지 않으며 원본 렌더 격리 브라우저 캡처로 보완했다. 실제 사용자 세션 데이터는 변경하지 않음.
- 공개 https://olchilab.com/olchipanel/ Sites v82 succeeded. source f4944aeb39c92ceb034814c18b723fa0f52e7553; version appgprj_6a689c14a3bc8191a40a55fb13a8f28a~appgver_4f3d114040a48191b47202f444a3cc82; deployment appgdep_6aae9fe5da6481919551ef38bb8aed1c. 최신 홈페이지 리뷰/D1 변경3b13a60를 먼저 흡수하고 SQL 2개 및 DB 보존 검증.
- 제출 이미지 R7 5장 1920×1080 공개 촬영 및 시각 검토, 가로 넘침/페이지 오류0. 최신 제출 묶음 output/championship-submission-r7/review.html. 실제 원티드 입력·첨부·임시저장·최종 제출/운영 고지 이메일은 미실행. GitHub 업로드 범위/계정 질문은 미응답이고 Olchi-Mark READ 문제는 남아 있음. GitHub/npm 업로드 없음.
- UI direction candidate ui.20260919.004에 최신 명시 요청 기록. 과거 메뉴 고정 위치 선호보다 이 지시가 우선. 전역 surface/portfolio 검사는 기존 타 프로젝트 누락/불일치로 RED이며 OlchiPanel 오류와 구분.


추가 확인: 원본 앱의 renderTheme 출력(검수용 가상 데이터)과 공개 데모에서 숫자 1–5 및 두 그룹 QWE를 마우스 선택과 각각 비교했다. 총 22쌍 모두 outline 없음과 테두리/그림자/선택 표시 동일. 본문 아래 2px 밑줄, sidebar 왼쪽 3×18px만 유지. 증거 output/playwright/smooth-review/mouse-shortcut-compare.txt 및 canonical-app-mouse-shortcut-equal.png / public-demo-mouse-shortcut-equal.png. 원본 Electron OS 키 입력 제한과 분리한 실제 브라우저 렌더 검수다.

## 2026-09-19 최신 — 새 방문 초기화와 단축키 테두리 수정

공개 https://olchilab.com/olchipanel/ Sites v80 반영 완료. 모든 새 방문/새로고침은 소개와 초기 샘플부터 시작한다. 데모는 탭별 sessionStorage를 사용하며 같은 체험의 단계·AI 세션 전환에서는 변경을 유지한다. 기존 localStorage 자료는 읽거나 삭제하지 않는다. 원본 앱의 실제 저장은 유지했다.

- QWE/숫자키가 만든 프로그램 포커스만 outline을 억제했다. Tab·방향키의 정상 포커스는 보존한다. public/index.html 원본과 생성 데모에 동시 적용.
- 로컬/공개 브라우저: 예전 데이터 무시, 새 탭 독립/기존 탭 유지, 새로고침 초기화, 체험 중 노트·플랜·분석 유지, 처음부터 초기화, QWE 테두리 제거/방향키 포커스 보존 PASS. 표적 13/13. 증거 output/playwright/smooth-review/fresh-visit-public.txt 및 fresh-visit-tests.txt.
- 앱 viewer를 stop/open으로 재시작. Electron 58748, viewer 52828, 127.0.0.1:6711 단일 listener, 0.8.2 유지. 앱 실화면은 확인했으나 OS window_not_focused로 실제 Electron 키 입력 자동 검증은 미완료. 공통 코드 브라우저 검사와 구분한다.
- 배포 source 33b0fbdb362ecb89b5d41d29f6c7db09cc8ff74d, version appgprj_6a689c14a3bc8191a40a55fb13a8f28a~appgver_86d2719269688191a38bc17440597935, deployment appgdep_6aae4cc06d3881919ca140f2966bfc72 succeeded. Sites 소스만 push, GitHub/npm에는 업로드하지 않음.
- 최신 제출 이미지 R6 5장 1920×1080 공개 화면 재촬영·시각 검토 완료. 실제 원티드 첨부/임시저장/최종 제출, 운영 상태 고지 이메일은 미실행.
- GitHub olchilab/olchipanel은 PUBLIC이나 CLI/연결 앱 계정 Olchi-Mark 권한은 READ. 원격 main은 fd38cdbc2e81cd1603e9a4dc14a955aec3bea4d4(8/21), 로컬 master의 개발 내용은 아직 미반영. 사용자에게 업로드 범위와 관리 계정을 두 질문으로 확인 중. 응답 없이 권한 변경/최종 제출하지 않는다.


## 2026-09-19 최신 — 앱과 데모 공통 기능 복구 및 UI 정리

https://olchilab.com/olchipanel/ — Sites v79 공개 완료. 앱 원본 0.8.2에 자료 분석 탭과 실제 노트·플랜 결과 저장을 추가했다. 분석은 src/scope 공통 소스와 동일 자산을 사용한다. 공통 sidebar 정렬·숫자 키캡·상황/기록 QWE·드래그 손잡이·카드 상세·compact composer·테마 스크롤/화살표/hover를 양쪽에 적용했다. 소개/7단계 안내/가상 Codex·Claude는 데모 전용이며 실제 AI 호출 없음. 양쪽 분석은 가상 방문자·매출 자료다. 파일 업로드와 AI 자동 그래프 선택은 미구현 미래 범위.

- 실제 저장 격리 E2E: 매출193900원 분석→공통 노트와 세션 플랜→재열기→중복0. 기존 편집 보존·중단 재시도·대상 변경·노트100개 거부 확인. 사용자의 실제 olchi-baek 노트/플랜에는 검수 데이터를 쓰지 않았다.
- 앱 Electron73204, viewer74500/6711 단일 listener, version0.8.2. 실제 앱 자료 분석 화면을 열어 확인했다. 앱/데모 자산 동등성 및 storage 경계 포함 표적13/13, 홈페이지 build와42/42 PASS.
- 배포 source 60de558dd8dc4f18663fa61af220cd98269f8f67, version appgprj_6a689c14a3bc8191a40a55fb13a8f28a~appgver_14567d6c54448191b2a4aebd26b54c04, deployment appgdep_6aae3e99e7f481919304ef1e02f90d21 succeeded. 최신 All100 변경 보존.
- 검수 및 오류 수정: output/playwright/smooth-review/REVIEW.md. 오답노트 err.20260919.016/.017, UI direction candidate ui.20260919.003. 공통화 중 데모 host 저장소 키 누락을 공개 검수에서 발견해 명시 demo key로 수정하고 양성/음성 회귀 추가 후 v78 배포.
- 원티드 실제 첨부·임시저장·최종 제출은 미완료. 기존 제출 이미지 R5는 이전 UI이므로 최신 화면 교체가 필요하다. 제출 완료로 보고하지 않는다.


## 2026-09-19 최신 — 같은 작업 공간의 튜토리얼 공개

https://olchilab.com/olchipanel/ — Sites v75 공개 완료. 처음부터 플랜 5개·노트 2개·Codex/Claude/이전 세션 3개가 있는 동일 작업 공간을 보여준다. 단계마다 데이터/iframe을 교체하지 않고 탭·세션·강조 위치만 바꾼다. 실제 대상의 테두리와 옆 비모달 안내, 다음·직접 해보기·건너뛰기·재열기·Escape·모션 감소 구현. 누구나 같은 초기 자료이며 변경은 각 브라우저 로컬에만 저장한다. 실제 AI 호출 없음.

- 공개 실브라우저: 첫 플랜·같은 iframe 유지·drag·분석→노트·노트 새로고침 보존·요청·인계·Claude 공통 플랜·안내 생략/재열기·모션 감소 PASS. 로컬 1280×720/960×540의 7단계 강조-안내 겹침0. 표적 10/10, 홈페이지 build 및42/42 PASS.
- 근거: `output/playwright/smooth-review/REVIEW.md`, `tour-actions-public.txt`, `tour-public.txt` 및 화면 PNG. source `5d739db6393ebe11f88b8bd885c9652fffe47bda`, deployment `appgdep_6aae307f642481918820ec590655810a` succeeded.
- 앱 원본 코드는 이번 안내 수정에서 변경하지 않았다. 제품 0.8.2 유지. 최신 홈페이지의 All100 변경을 합쳐 보존한 격리 checkout에서 배포했다.
- 제출 자료 R5와453자 문안은 준비돼 있다. 실제 원티드 첨부·임시저장·최종 제출은 미완료. 다음은 PC 조작 가능 시 정확한 입력·첨부·임시저장·재열람 확인이며 최종 제출은 누르지 않는다.

## 2026-09-19 최신 — 직접 조작 체험 공개·제출 직전 준비

https://olchilab.com/olchipanel/ — Sites v72 공개 완료. 화면 크기·플랜 드래그·노트 작성/편집/저장·요청 상세·Codex/Claude 가상 세션·7단계 안내와 확인 버튼의 단계 이동을 구현했다. R5 5장(1920×1080), AI 활용 453자, 검수 전달문 준비. 최종 제출은 하지 않았다. 원티드 입력 도중 사용자 키보드 입력이 섞였고 원티드 창이 닫혀 현재 첨부·임시저장은 미완료다. PC 조작 가능 시 양식을 다시 열어 텍스트 정확성·이미지 업로드·저장 후 재열람을 확인한다.

- 증거: [R5 이미지·문안](output/championship-submission-r5/review.html), [검수](output/championship-submission-r5/REVIEW.md), `output/playwright/demo-fit-drag/`.
- 앱 원본은 0.8.2 유지. 플랜 높이/짧은 창/요청 상세를 정본에 반영했다. 노트 편집은 기존 앱 기능을 웹 로컬 어댑터에 연결했다. 앱 runtime 재시작: 6711 단일 listener, pid10620, Electron pid66920, 세션0. 재시작 후 실제 앱을 전면에 두고 빈 플랜 5열·sidebar·하단 경계를 눈검수했다(`output/playwright/demo-fit-drag/app-plan-final.png`). 실제 세션이 없어 채워진 노트/요청 흐름은 동일 Studio 렌더러의 합성 체험으로 검증했다.
- 다음: 실제 원티드 양식 저장 및 재열람. 주최 측 기존 서비스 고지 이메일 초안은 준비됐고 발송은 미실행.

## 이번 수정 소유 범위

`test/championship-plan.test.mjs` 신규: 공개 체험의 플랜/노트 로컬 저장 회귀. public/index.html, public/themes/studio.css, test/ui-shell.test.js 및 tools/championship/·빌드/캡처 스크립트의 이번 수정만 소유한다. 나머지 기존 dirty는 보존했다.

## 2026-09-19 공개 완료 — 제출은 별도

Mark의 명시적 배포 지시로 https://olchilab.com/olchipanel/ 을 공개했다. 기존 홈페이지 v69 기준 격리 checkout에서 v70으로 배포 성공. 공개 비로그인 7단계·분석→노트/플랜·상태 복원·인계 복사 PASS. Chrome에 플랜 화면을 열어 두었다. R3 5장과 425자 AI 문안이 최신이다. 주최 측 운영 상태 고지·실제 첨부 검수·최종 제출은 미실행. [공개 검증 및 공식 조건](output/playwright/public-deployment-20260919/점검결과.md).

## 2026-09-11 추가 인계 — 프로젝트 시작 등록

- 완료: `src/project-setup.js`, `start_project` MCP, `olchipanel start/setup` CLI, 두 벤더 프로젝트 지침·스킬 등록. 코드/계약/회귀 정본은 `test/project-setup.test.js` 및 `skills/olchipanel-track/references/project-start.md`.
- 실제 OlchiPanel 등록 후 반복 검사 변경 0건. setup·smoke·session identity·tracking skill·multi-agent·plan MCP 검사 통과. 기존 dirty 작업은 모두 보존, 커밋·게시 없음.
- 새 사용 요청 때만 `start_project`를 호출한다. 새 프로세스가 아닌 기존 MCP 연결에는 이 도구가 없으므로 CLI `setup --project <directory>`를 사용한다. 앱 열기만으로 프로젝트나 전 세션이 활성화되지 않는다.
- 현재 요청은 완료. 다음 사용자 지시를 기다린다. 오래된 배포 작업을 자동 재개하지 않는다.

## Commit And Tree

- canonical_path: `C:/OlchiProjects/olchipanel`.
- canonical_line: 로컬 `master` 제품 개발·npm 배포 0.8.2 + 단일창·원본 아이콘 + 공개판 베타 피드백 + 내부 운영 문서.
- base_commit: `7e892c3`.
- pre-consolidation checkpoints: primary `3b6a12f`, public beta `812eacc`, latest product `7dad29f`.
- preservation refs: `archive/master-before-consolidation`=`3b6a12f`, `archive/public-beta-before-consolidation`=`812eacc`, `fix/single-panel-window`=`7dad29f`, `fix/plan-layout-fit`=`3a4f0ea`, `fix/taskbar-icon-v3`=`fba8096`.
- expected dirty paths: 아래 전부 현재 사용자 작업으로 보존한다.
  - `src/desktop-launch.js`
  - `test/desktop-launch.test.js`
  - 2026-09-20 데모 전용 연결/비공개 경계: `.github/workflows/release.yml`, `01_plan/PUBLIC-DEMO-BOUNDARY-20260920.md`, `tools/check-public-package.cjs`, `tools/prepare-public-demo.cjs`.
  - 앱·데모 동시 적용: `src/analysis-capture.js`, `src/scope/`, `public/scope/`, `test/analysis-capture.test.cjs`, `tools/build-scope.cjs`.
  - 이번 직접 조작 체험: `test/championship-plan.test.mjs`, `WORKLOG.md`, `DECISIONS.md`.
  - 체크포인트: `.olchi/portfolio.json`, `01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`, `HANDOFF.md`, `STATE.md`.
  - UI 정본·검수: `01_plan/UI_CORE-APPLICATION.md`, `public/plan.html`, `.playwright-cli/`, `output/`.
  - 기존 아이콘: `public/icons/olchi-dark-16.png`, `public/icons/olchi-dark-32.png`, `public/icons/olchi-dark-48.png`, `public/icons/olchi-favicon-dark-v1.ico`, `tools/generate_olchi_icons.ps1`.
  - 첫 성공/진단/단일창·세션 신원: `README.md`, `bin/olchipanel.js`, `package.json`, `public/index.html`, `src/viewer.js`, `src/mcp.js`, `src/doctor.js`, `test/doctor.test.js`, `test/session-identity.test.js`, `test/multi-agent.test.js`, `test/single-instance.js`, `test/ui-shell.test.js`.
  - 공통 노트: `src/memo.js`, `test/memo.test.js`, `test/plan_mcp.test.js`.
  - Plan 코어·스킬: `src/plan.js`, `test/plan.test.js`, `test/plan_api.test.js`, `test/plan-skill.test.js`, `skills/olchipanel-plan/`, `skills/olchipanel-plan-author/`, `skills/olchipanel-plan-runner/`.
  - 제품 버전·에이전트 계약: `AGENTS.md`, `CHANGELOG.md`, `skills/olchipanel-track/`, `test/versioning.test.js`, `test/tracking-skill.test.js`.
  - E판: `.olchi/surfaces.json`, `desktop/main.cjs`, `package-lock.json`, `package.json`, `test/electron-shell.test.js`, `output/design/olchipanel-e-shell-v0.md`, `output/electron/`.
  - 인수인계 기록: `handoffs/`.

  - 2026-09-19 현장 재확인: 기존 사용자/다른 작업의 dirty와 앞선 제출 준비 산출물이 섞여 있다. 이번 배포는 위 최신 체크포인트 문서만 갱신했고 나머지는 변경·정리·커밋하지 않았다. 아래 목록은 보존 인벤토리이며 소유권 인수를 뜻하지 않는다: `.gitignore`, `01_plan/PRODUCT-BRIEF.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `src/state.js`, `test/smoke.js`, `.agents/`, `.claude/`, `01_plan/ADAPTIVE-DATA-VISUALIZATION-DIRECTION.md`, `01_plan/AI-CHAMPIONSHIP-2026-DEMO-BRIEF.md`, `01_plan/AI-CHAMPIONSHIP-2026-DEMO-VERIFICATION.md`, `01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-CHECKLIST.md`, `01_plan/CHAMPIONSHIP-GRAPH-REFERENCE-R1.md`, `01_plan/FUTURE-CHAT-IDEA-20260919.md`, `01_plan/FUTURE-IDEAS.md`, `01_plan/GRAPH-LAYOUT.md`, `01_plan/UI-REVIEW-CONTRACT.md`, `packages/`, `public/e2/`, `public/themes/`, `release.config.json`, `src/project-setup.js`, `test/championship-analysis.test.mjs`, `test/graph-layout.test.js`, `test/packaged-mcp.test.cjs`, `test/project-setup.test.js`, `test/record-read.test.js`, `test/release-kit.test.cjs`, `test/session-activity.test.js`, `test/theme-renderer.test.js`, `test/windows-mcp-setup.test.cjs`, `tools/build-championship-demo.cjs`, `tools/capture-championship-submission.js`, `tools/championship/`, `tools/import-championship-scope.cjs`, `tools/preview-championship-demo.cjs`.

## Current Goal

현재 `0.8.2`를 첫 버전 단위 완료 대상으로 삼아 Plan 작성→적용→실행→증거→종료 흐름을 먼저 닫고, 그 위에서 Wanted AI Championship 2026 제출과 설치·첫 성공·공개 데모를 완성한다.

## Completed

STATE.md 참조. **다시 하지 말 것**: ①패널 뷰어 반복 재기동으로 창 여러 개 띄우기 — 재기동은 `OLCHIPANEL_OPEN=0`으로 ②heredoc/curl에 백틱·한글·아포스트로피 — Write/Edit 도구로 ③CRLF 커밋 — LF 정규화 후.

## In Progress

- `olchipanel-plan-author`는 중앙 `sk-035`, 버전 `v1-beta.1` 공개 베타로 등록됐다. `C:/Users/topli/.codex/skills/olchipanel-plan-author`와 `.claude/skills/olchipanel-plan-author`는 중앙 정본 junction이며 새 세션에서 `$olchipanel-plan-author`로 명시 호출한다. 실제 사용 뒤 비식별 요약 1건을 `.olchi/plan-skill-feedback/inbox`에 저장하고 외부 전송하지 않는다.
- `OlchiPanel E`는 같은 0.8.2 UI를 쓰는 개발 실행형 Electron 셸이다. `npm run e`로 시작하며 앱 1개·6711 listener 1개·Chrome PWA 0개를 Windows 200% 배율에서 확인했다. 아직 설치 프로그램이나 서명본이 아니다.
- 제품 개발 정본=`package.json#productVersion` 0.8.2이며 npm 배포 버전과 맞춘다. 변경은 `CHANGELOG.md` Product 0.8.2에 UI·에이전트 계약·테스트 단위로 함께 기록하고, 전체 UI 검수를 닫은 뒤 0.9로 올린다.
- 앞으로 `productVersion` 하나를 하나의 개발 완료 단위로 운영한다. 현재 우선순위는 0.8.2 Plan 종단 흐름이며, 성공 조건·UI·에이전트 계약·회귀 테스트·실화면 증거를 terminal release checkpoint에서 함께 닫는다. 버전 증가는 Mark만 결정한다.
- 같은 `gpt-5.6-sol/high` 새 컨텍스트로 Plan A/B를 실행했다. 무스킬=`output/plan-ab/baseline.json` 23개 카드, Plan Author=`output/plan-ab/with-skill.json` 12개 카드이며 둘 다 실제 validator PASS다. 스킬 초안의 frontier는 `canonical_baseline` 하나다.
- 기존 무스킬 prompt의 간접 오염을 검증한 `output/plan-ab-v2/` 실험도 완료했다. schema-only=21장/23점, 사용자 원칙=11장/26점, Plan Author=6장/30점이다. 맹검 평가자는 이전 무스킬 결과를 새 순수 대조군보다 이전 스킬 결과에 가장 가깝다고 판정했다. 직접 skill 파일 사용 증거는 없지만 frozen brief를 통한 의미 유입이 있어 이전 무스킬 결과는 hybrid contamination이다.
- 현재 최선의 pre-application 산출물은 `output/plan-ab-v2/skill.json`이다. `HumanCheckpoint` 하나만 todo이고 나머지 5장은 backlog라서 Mark의 방향 확인 전 상세 분해를 멈춘다.
- 실제 `public/plan.html` 기반 읽기 전용 렌더에서 desktop 문서 overflow 0, narrow 문서 overflow 0과 board 내부 scroll을 확인했다. 다만 ready 1개와 blocked 11개가 모두 To do로 보이고 full completion/evidence를 안전하게 읽는 상세보기가 없다. 증거=`output/plan-ab/visual-review.json`.
- v2 렌더에서도 desktop 5열 overflow 0, narrow 문서 overflow 0을 확인했다. 새 결함은 초기 선택이 실제 next action인 `HumanCheckpoint` 대신 첫 Backlog 카드로 가는 것이며, 상세 내용 두 줄 잘림도 유지된다. 증거=`output/plan-ab-v2/visual-review.json`.
- live Plan은 아직 미적용이다. 0.8.2 installer/cross-platform 범위를 Mark가 결정한 뒤 스킬 초안을 최종화·적용한다.
- 보조 worktree 4개 제거 및 통합 브랜치 `master` 승격 완료. 원격 push만 권한 대기.
- 세로 사이드바가 정본이다. 현재 세션 메뉴=상황·플랜·요청·기록이며, 공통 노트는 상단 탭이다. 상황 내부=지도·스택, 기록 내부=변경·결정·막힌 길이다. 노트 UI는 `memo-common.json`만 쓰고 기존 세션별 메모 파일은 보존한다.
- 열린 사이드바의 세션 목록은 카드가 아닌 얇은 행이다. 둥근 배경·그림자·굵은 라운드 막대를 쓰지 않고 선택 제목 굵기와 2×10px 각진 표식만 쓴다.
- 공통 노트 저장 형식은 `olchipanel.memo.v4`다. `parentId`/`collapsed`로 페이지 트리를 만들고, 기존 v3 평면 페이지는 루트로 호환한다. 본문 HTML은 그대로 두고 최상위 요소만 이동 블록으로 취급한다. 계약=`output/design/olchipanel-note-tree-v4-contract.md`.
- 지도 내부는 트리/그래프 두 보기다. 둘 다 `map.tree`가 정본이며 그래프 노드 위치만 `olchipanel.graph.layout.<session>` 로컬 설정에 저장한다. 노드 배치를 작업 상태로 역반영하지 않는다.
- `olchipanel doctor`와 `/api/doctor`는 읽기 전용이다. Node·npm·npx·viewer/port·브라우저·버전과 4개 에이전트 설정을 검사하되 자동 수정하지 않는다.
- 세션 0개인 상황·요청·기록은 같은 첫 성공 화면을 사용한다. 에이전트 선택과 복사 동작을 실물 PWA에서 확인했고 현재 PWA 창은 1개만 열려 있다.
- `window.json`의 짧은 토큰 lease가 SSE 재연결·viewer 교체 사이의 앱 창 신원을 유지한다. 동시 `open` 4회가 모두 기존 창을 재사용했고 Chrome의 OlchiPanel 창은 1개였다.
- 같은 MCP stdio transport가 다시 `initialize`해도 기존 세션 객체를 재사용한다. 4개 실제 병렬 에이전트는 사이드바 4줄로 남고 하나의 재초기화가 다섯 번째 줄을 만들지 않는 회귀가 있다.
- 제출 일정 정본=`01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`. 기능 동결=9/15, 1차 최종 제출=9/17, 참가 접수=9/18, 공식 제출 마감=9/20.

## Next Actions

1. 다른 프로젝트의 새 Codex·Claude 세션에서 `$olchipanel-plan-author`를 실제 호출하고 `.olchi/plan-skill-feedback/inbox`의 베타 피드백을 검토한다.
2. Mark가 남은 installer/cross-platform 항목을 0.8.2 종료 게이트에 포함할지 이후 버전으로 이관할지 결정한다.
3. 결정과 방향 확인에 맞춰 `output/plan-ab-v2/skill.json`을 세부 실행 카드로 확장·재검토해 live Plan에 적용한다.
4. ready/blocked 구분과 읽기 전용 카드 상세 UI gap을 기존 dependency·completion·evidence 데이터로 보완하고 눈검수한다.
5. 그 플랜을 에이전트가 직접 실행해 claim·pause·fresh evidence·최종 release checkpoint까지 패널 상태와 일치하는지 검증한다.
6. Mark가 개인/팀 참가 형태를 확정하고 참가 접수를 완료한다.
7. E판과 OS·에이전트 acceptance, 공개 데모·제출 자산은 선택된 버전 경계에 맞춰 수행한다.
8. 9/15 이후 기능 추가를 멈추고, `Olchi-Mark` 권한 해결 뒤 `master` 내용을 원격 `main` PR·release-please 경로로 배포한다.

## Blockers And Approval

- 배포 승인은 확보됨. blocker=`Olchi-Mark`의 `olchilab/olchipanel` 쓰기 권한 없음(HTTPS 403, SSH permission denied). 두 시도 모두 원격 변경 없음. 홍보=L5.

## Verification Commands

- `npm test` (doctor 포함 9개 회귀 묶음)
- `node bin/olchipanel.js doctor`
- `node test/session-identity.test.js`
- `node test/multi-agent.test.js`
- `node test/single-instance.js`
- `node test/ui-shell.test.js`
- `python C:/OlchiProjects/tools/project_portfolio.py validate --root C:/OlchiProjects`
- `python tools/continuity_check.py`

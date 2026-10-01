# STATE — olchipanel

## 2026-09-20 앱 실행·메뉴·라벨 후속 교정

PC desktop-only preference와 Electron launcher를 반영하고 관련 지침/설치된 스킬을 맞췄다. 사이드바32px, 상황/기록 글자16px·세로여백 축소, 공통노트 Backquote. 라벨은 카드 제목 바로 아래의 채움 배지, 우선순위 점8px 정렬. 실제 Electron 밝음/어두움·단축키·입력 보호·라벨 선택/재열기 검수 및 표적 테스트 통과. 라벨 쓰기는 격리 메모리 fixture로 검수했다. 증거 `output/app-only-sidebar/REVIEW.md`, `checks.json`, PNG. 전체 테마 겹테두리는 제안 단계. 제품0.8.2, 제출 완료 및 공개v84 유지. 다음은 Mark 시각 검토. MCP 소유 viewer는 보존하며 앱만 재시작; 기존 MCP launcher 모듈은 다음 정상 시작에 갱신된다.


## 2026-09-20 최신 — 최종 제출 및 운영 고지 완료

원티드 AI Championship 2026 최종 제출 완료. 과제 제출하기 클릭 후 “과제를 제출했어요.” 알림 및 개인 과제 카드 확인. 내 과제 미리보기 재열람·새로고침 후 R8 문구/대표 이미지/스크린샷5장/서비스 링크 일치. 운영 고지 메일도 t-mktg@wantedlab.com 발송 및 SENT 재확인(1a0bd790b4c2b987). 증거 `output/championship-submission-r8/SUBMISSION-RECEIPT.md`. 2026-09-20 15:26 KST. 이전 제출 보류·미완료·PC 조작 답변 대기 기록은 모두 이전 이력이다. 창 변화는 사용자 조작으로 입증되지 않았으며 별도 Windows 첨부 창에 대한 자동화 대상 지정 문제로 정정했다. 다음은 심사/주최 측 회신 확인과 데모 공개 상태 유지.

## 2026-09-20 제출 재개 — 첨부 전 사용자 PC 조작 확인 대기

Mark가 최종 제출을 명시 승인해 보류를 해제했다. 로그인된 원티드 apply 화면에서 실제 문제100자 제한과 이전 입력 오염을 확인하고 문제64자·AI456자로 교체하여 읽어 검증했다. 공개 v84 화면5장(1920×1080) R8 촬영·눈검수 완료. 대표/스크린샷 첨부와 최종 제출은 미완료. Chrome 탭/창이 입력 중 바뀌어 사용자 PC 조작 중지 확인을 요청했고 답변 대기 중이다. 별도 주최 측 운영 고지 이메일도 수신자/발송 명시 확인 대기. 다음: 사용자 조작 중지 응답 후 파일 첨부, React 태그 확인, 저장/최종 제출/재열람 증거. R8 `fields.json`, `제출문안.md`, `images.json`, `운영고지-이메일.txt` 참조. 사용자 무응답을 승인으로 해석하지 않는다.

## 2026-09-20 최신 — 처음 체험 흐름 검수·공개 v84

공개 데모 v84 체험자 관점 검수 및 수정 완료. 접힌 안내를 상단으로 이동하고 그래프 가독성·안내 완료 피드백·다크 로고를 개선했다. 연결 노트→자료 분석 저장에서 이전 자동 저장이 결과를 삭제하던 오류를 reload 없는 병합으로 수정했다. 2개 화면 크기 14단계 눈검수, 공개 연속 흐름12개·노트 연결14개·표적8개 PASS, 공개 정적18개 해시 일치. 앱 원본7개 해시 유지·내부 스킬 제외. 대회 제출은 계속 보류. 증거 `output/playwright/tester-review/REVIEW.md` / `DEPLOYMENT.md`.

아래 이전 공개 버전 기록은 이 체크포인트 이전 이력이다.

## 2026-09-20 공개 완료 — 노트 페이지 연결 데모

Mark의 배포 지시로 https://olchilab.com/olchipanel/ Sites v83 공개 succeeded. 데모 전용 그래프 항목→특정 노트 페이지 연결·편집·복귀 반영. 앱 원본은 유지하고 내부 스킬·설치 파일은 배포에서 제외했다. 공개 주요14+경계7/안내 흐름 PASS 및 정적18개 파일 SHA256 일치. 기존 공개 브라우저 갱신. 증거 `output/playwright/note-links/DEPLOYMENT.md` 및 `public/` 검사·캡처. source95ff26cfdd415a4e9b47f7a3d521a80c1aedf598, deployment appgdep_6aaf5e02d4d48191a29506515002d154.

대회 제출은 아직 보류/미실행. GitHub/npm 게시 없음. 홈페이지 기존 후기 검사2개 불일치(40/42)와 전역 surface/portfolio 기존RED는 이번 데모 검증과 구분한다. 다음은 사용자 공개 화면 검토, 제출 재개 지시 후 실제 양식 진행.

## 2026-09-20 최신 — 데모 전용 노트 페이지 연결 / 내부 스킬 비공개

Mark가 제출을 중단한 뒤 요청한 변경이다. 대회 제출은 계속 보류. 상황 그래프 항목 → 특정 공통 노트 페이지 선택·연결 저장·해제 → 실제 노트 편집 → 보던 그래프 확대/위치 복귀를 데모에만 구현했다. 최초 연결 예시는 분석 기준/다음 세션 참고이며 새 하위 페이지도 선택 가능하다. 안내 2단계에서 데모 전용 미리보기로 구분한다.

- `tools/championship/note-links.js`를 생성 데모에만 삽입. 원본 앱 7개 대상 파일의 변경 전후 해시 동일, 제품 0.8.2 유지. 앱 viewer 재기동·실데이터 변경 불필요/미실행.
- 로컬 브라우저 주요 14개+경계 7개 검사, 처음 안내→페이지 열기→복귀→다음 단계 PASS. 라이트/다크·1100×660·키보드·드래그·수정 보존·새 방문 초기화·신규 하위 페이지·삭제/빈 상태 확인. `output/playwright/note-links/REVIEW.md`와 PNG/검사 결과 참조. 검사의 비동기 대기 누락을 수정했고 err.20260920.001 검증 완료.
- GitHub 현재 공개 main 재귀 트리에는 스킬 경로 0개. 내부 스킬 4개 경로를 Git ignore에 추가. 공개용 정적 18개 파일만 `output/github-demo-public/`에 추출. npm 패키지에는 내부 스킬 21개가 있어 새 게시 검사가 의도대로 차단함. 원본 설치 패키지는 내부용으로 보존, 게시하지 않는다. 경계 문서 `01_plan/PUBLIC-DEMO-BOUNDARY-20260920.md`.
- **이번 변경의 공개 배포/GitHub push/npm publish/대회 제출은 미실행. 공개 사이트는 이전 v82.** 다음은 로컬 결과 사용자 검토 후 공개 반영 여부를 정하고, 제출 중단이 해제되면 최종 폼 입력을 재개한다.

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

## 2026-09-19 공개 완료 — 제출은 별도

Mark의 명시적 배포 지시로 https://olchilab.com/olchipanel/ 을 공개했다. 기존 홈페이지 v69 기준 격리 checkout에서 v70으로 배포 성공. 공개 비로그인 7단계·분석→노트/플랜·상태 복원·인계 복사 PASS. Chrome에 플랜 화면을 열어 두었다. R3 5장과 425자 AI 문안이 최신이다. 주최 측 운영 상태 고지·실제 첨부 검수·최종 제출은 미실행. [공개 검증 및 공식 조건](output/playwright/public-deployment-20260919/점검결과.md).

## 2026-09-11 체크포인트 — Windows MCP 동의 등록

- Windows 설치본 첫 실행의 Codex·Claude Code 선택/동의/등록, 취소/재진입 구현. 설치된 Electron+ASAR MCP를 사용하며 Node/npm 별도 설치 불필요. 사용자 설정을 임의로 덮어쓰지 않고 백업·충돌·변경 재검사를 수행한다.
- 임시 홈 대상 10개 테스트, doctor·Electron shell 회귀 및 실제 패키지 MCP initialize/tools/list/start_project 발견·초기 세션 무생성 통과. 실제 Windows 확인창에서 격리된 두 설정 저장·재조회 확인.
- 사용 중인 Mark의 전역 에이전트 설정은 변경하지 않았다. 실제 클라이언트 재시작 연결·새 PC 설치·서명은 미검증. 메뉴 Alt 입력은 자동화 도구에서 지원하지 않아 메뉴 클릭 자체는 미검증.
- 실행 절차·코드/테스트 계약: `desktop/WINDOWS-FIRST-RUN.md`. 제품 0.8.2, macOS 제외, 외부 배포 요청 없음. 과거 배포 권한 문제를 현재 구현 blocker에서 분리했다.
- 최종 로컬 설치 파일: `output/windows-setup-0911/OlchiPanel-0.8.2-x64-Setup.exe`(NotSigned). 패키지 내부 프로젝트 지침·두 벤더 스킬 등록 및 반복 변경 0도 확인. 실화면·제한·공용 검사 결과는 `output/windows-setup-ui/REVIEW.md`.

## 2026-09-11 체크포인트 — 명시적 시작 시 지침·스킬 등록

- `start_project` MCP 및 `olchipanel start/setup` CLI 구현. AGENTS.md·CLAUDE.md 안내와 `.agents/skills/olchipanel-track`, `.claude/skills/olchipanel-track`를 프로젝트 안에 등록한다.
- 초기 MCP 연결은 계속 무기록. 기존 문서 바이트 보존·재실행 무변경·충돌 사전 차단·링크 경로 차단·등록 잠금·실제 CLI/MCP 회귀 통과.
- 이 프로젝트 등록 완료, 재검사 변경 0건. 두 로컬 스킬 유효성 통과. 중앙 등록 및 실행 중 클라이언트의 스킬 재발견을 의미하지 않는다.
- 현재 연결된 기존 MCP 프로세스에는 새 도구가 아직 로드되지 않는다. 새 프로세스부터 `start_project` 사용; 현재 세션은 `setup` CLI로 등록했다.
- 상세 계약: `skills/olchipanel-track/references/project-start.md`. 이전 배포 관련 기록은 과거 참고이며 현재 배포 요청은 없다.

## Current Goal

현재 `0.8.2`를 첫 버전 단위 완료 대상으로 삼아 OlchiPanel Plan의 작성→적용→실행→증거→종료 흐름을 먼저 닫고, 그 위에서 Wanted AI Championship 2026 제출과 설치·첫 성공 경로를 완성한다.

## Stage

설치·첫 성공 P0의 첫 수직 기능과 단일창·다중 에이전트 신원 안정화를 완료했다. 진단과 첫 화면이 실제 환경 상태를 읽어 다음 행동으로 연결되며, GitHub 쓰기 권한은 계속 대기한다.

제품 개발 버전과 npm 배포 버전은 `0.8.2`로 맞춘다. 0.8.x에서 전체 UI 고도화와 실화면 검수를 닫고, 그 완료 뒤 0.9로 올린다.

앞으로 소프트웨어 개발은 `productVersion` 하나를 하나의 완료 단위로 운영한다. 개별 카드가 끝난 것만으로 버전을 닫지 않고, 버전 플랜의 성공 조건과 UI·에이전트 계약·회귀 테스트·실화면 증거를 최종 체크포인트에서 함께 확인한다. 다음 버전 시작과 번호 증가는 Mark가 결정한다.

## Completed

- 실험판 `OlchiPanel E`를 같은 정본 저장소에 추가했다. Electron 44.1.0을 정확히 잠그고 기존 0.8.2 UI와 viewer 6711을 그대로 재사용한다.
- E판은 앱 단일 인스턴스, 기존 viewer 채택/직접 소유, Chrome PWA 미생성, 앱 확대 100%, 200% OS 배율, 1440×960 DIP 창 복원, 외부 이동/새 창 차단을 실물 검증했다.
- 실제 E창의 홈과 플랜을 200% 배율에서 확인했다. 플랜 5열은 sidebar 오른쪽 가용 폭에 모두 보이고 중간 가로 스크롤이나 열 잘림이 없다.
- 세로 사이드바에는 현재 세션의 `상황·플랜·요청·기록`만 두고, 세션과 무관한 공통 `노트`는 상단 탭으로 분리했다. 노트는 세션을 바꿔도 `memo-common.json` 하나를 쓰며 MCP 에이전트는 `note_read`로 읽기만 한다.
- 사이드바 세션 목록의 둥근 카드·선택 배경·라운드 막대를 없애고 얇은 목록형으로 정리했다. 선택 상태는 굵은 제목과 작은 각진 표식만 사용한다.
- 노트 중간 폭 회귀를 수정했다. 960px에서 324px로 눌리던 편집기는 목록을 위로 재배치해 600px 전체 폭을 쓰며, 2열 복귀 시점의 편집기 폭은 565px다.
- 노트 패널이 콘텐츠 높이 458px에서 끝나던 세로 회귀를 수정했다. 1440×900에서 패널 높이 854px·하단 의도 여백 32px, 960×760에서 패널 높이 714px·하단 여백 32px를 실제 렌더로 확인했다.
- 공통 노트에 부모·자식 페이지 트리, 접기/펼치기, 경로 표시, `/페이지` 하위 생성, 블록 끌기·위/아래 이동을 추가했다. 기존 평면 노트는 손실 없이 루트 페이지로 읽는다.
- 노트 트리를 1440×900의 오른쪽 목록과 960×760의 위쪽 세로 목록에서 실검수했다. 두 크기 모두 가로 넘침 0, 패널 하단 여백 32px이며 전체 `npm test`가 통과했다.
- 공개판 베타 피드백, UI Core, 플랜 레이아웃, 단일창, 원본 남색 투명 아이콘 변경을 최신 0.8.2 코드 위에 통합했다.
- 플랜 데스크톱 5열은 플랜 탭의 전체 가용 폭을 사용하며 중간·하단 가로 스크롤 없이 한 화면에 맞고 iframe 높이는 내용에 따라 맞춰진다.
- 전체 회귀: smoke, beta-feedback, single-instance, UI shell, Windows icon launch, plan 3종 PASS.
- 실제 PWA는 설치된 Chrome app-id로 실행되며 viewer는 127.0.0.1:6711 on-demand로 동작한다.
- 보조 worktree 4개를 제거했고 개발 정본은 `C:/OlchiProjects/olchipanel`의 `master` 하나다. 제거 전 변경은 archive/checkpoint 브랜치에 보존했다.
- 기존 8개 작업군을 `상황·플랜·요청·기록·노트` 5개로 정리했다. `지도·스택`은 상황 안에서, `변경·결정·막힌 길`은 기록 안에서 전환한다.
- 기존 저장 탭 값은 새 그룹으로 자동 이관되고, 상위·내부 탭 모두 Arrow/Home/End 키보드 이동과 ARIA 상태를 유지한다.
- 1440급 PWA 실물과 390×844 렌더에서 5개 상단 탭 및 내부 탭 구성을 확인했다.
- 상황→지도에 트리/그래프 전환을 추가했다. 그래프는 기존 `map.tree`를 그대로 그리며 이동·확대·맞춤·정렬과 노드 위치 조정을 지원하고, 사용자 배치만 세션별 로컬 설정으로 보존한다.
- 그래프 데스크톱·모바일·다크 테마 실렌더와 키보드 이동, 확대, 정렬 복구, 문서/viewport 무가로넘침을 확인했다.
- 읽기 전용 `olchipanel doctor`가 Node·npm·npx·viewer/port·브라우저·실제 패키지 버전과 Claude·Codex·Cursor·Antigravity MCP 설정을 한 번에 점검한다.
- 세션이 0개인 상황·요청·기록 탭은 공통 첫 성공 화면을 쓴다. 진단→에이전트 선택→설정 복사→추적 프롬프트→세션 자동 감지의 실제 흐름이며 전역 설정을 자동 변경하지 않는다.
- Windows Node 22의 `.cmd` 직접 spawn `EINVAL`로 생기던 npx 거짓 FAIL을 PATH 실물 확인으로 수정했고 `err.20260831.017`에 회귀를 잠갔다.
- 앱 창 토큰을 짧은 lease로 유지해 SSE 재연결과 viewer 재시작 사이에도 후속 에이전트가 새 창을 띄우지 않게 했다. 네 개의 동시 `open` 실물 호출은 기존 창 하나를 재사용했다.
- 같은 MCP stdio 연결의 반복 `initialize`는 기존 논리 세션을 재사용한다. Claude·Codex·Cursor·Antigravity 4개 동시 연결은 viewer 1개와 사이드바 4줄을 만들고, 한 연결의 재초기화 뒤에도 4줄을 유지한다.
- 단일창·논리 세션 신원 오류는 `err.20260831.019`, 재사용 UI 기준은 `ui.20260831.004`에 기록했다.

## In Progress

- `olchipanel-plan-author` v1-beta.1을 중앙 스킬 `sk-035`로 등록하고 Codex·Claude 전역 발견 junction을 열었다. 명시 호출은 `$olchipanel-plan-author`이며, 암묵 호출은 플랜이 유용한 상황에서 한 번 제안한 뒤 opt-in을 기다린다. 실제 사용 피드백은 원문 없이 `.olchi/plan-skill-feedback/inbox`에 로컬 JSON 1건으로 쌓인다.
- 같은 `gpt-5.6-sol/high`를 새 컨텍스트 두 번으로 실행해 0.8.2 Plan A/B를 만들었다. 무스킬 초안은 23개 카드(20 backlog), Plan Author 초안은 12개 카드(todo 12, 실제 frontier 1개)였고 둘 다 실제 OlchiPanel validator를 통과했다. 선택 기준은 `output/plan-ab/`에 보존했다.
- 기존 A/B의 prompt contamination을 확인하려고 `output/plan-ab-v2/`에서 새 격리 실험을 했다. schema-only 21장·사용자 원칙 11장·Plan Author 6장이며 맹검 점수는 각각 23·26·30/30이다. 이전 무스킬 23장 결과는 직접 스킬 파일을 읽은 증거는 없지만 맹검상 이전 스킬 결과에 가장 가까워, 순수 대조군이 아니라 스킬 의미가 brief를 통해 유입된 hybrid contamination으로 판정했다.
- 새 Plan Author 결과는 미결 경계를 숨기지 않고 `HumanCheckpoint` 하나만 실행 가능한 6장 방향 초안으로 멈췄다. Mark 확인 전 세부 카드 그래프로 확장하거나 live panel에 적용하지 않는 것이 현재 스킬 계약에 가장 맞다.
- 현재 `public/plan.html`로 두 초안을 읽기 전용 렌더링해 눈검수했다. 스킬 초안은 더 간결하지만 실행 가능 1개와 dependency-blocked 11개가 모두 같은 To do로 보이고, 완료·증거 계약은 두 줄로 잘린 뒤 읽기 전용 상세보기가 없다. 기존 데이터로 해결 가능한 Plan-first UI gap이며 새 schema/MCP는 필요하지 않다.
- v2 눈검수에서는 새 스킬 초안 6장이 1440×900 한 화면에 맞고 390×844 문서 overflow도 0이었다. 다만 초기 선택이 실제 next action인 To do `HumanCheckpoint`가 아니라 첫 Backlog 카드로 가며, 완료·의존성·증거의 두 줄 잘림도 재확인했다. 증거는 `output/plan-ab-v2/visual-review.json`이다.
- Plan Author 초안은 아직 live panel에 적용하지 않았다. Mark가 0.8.2 종료 게이트에 남은 installer/cross-platform 항목을 포함할지 이후 버전으로 이관할지 결정한 뒤 적용한다.
- 최우선 작업은 `0.8.2` Plan 흐름의 종단 완성이다. 대화형 작성(레퍼런스·조사/자문·질문·확인), 패널 적용, 에이전트 실행, pause/증거/완료 동기화, 전송, 실패 복구를 하나의 버전 플랜에서 실제로 닫는다.
- 노트 추가 고도화와 세션 자동 이름 개선은 이 버전의 Plan 종료 게이트가 닫힌 뒤 순서를 다시 잡는다.
- E판은 개발 실행형 첫 셸까지 완료했다. 서명 설치 프로그램, 자동 업데이트, macOS/Linux 네이티브 검증은 아직 포함하지 않는다.
- `CHANGELOG.md`의 Product 0.8.2 아래에서 UI·에이전트 계약·회귀 테스트를 함께 기록한다. MCP 기본 지침은 500자 미만을 유지하고 상세 기준은 스킬 reference로 점진 공개한다.
- 9/15 기능 동결, 9/17 1차 제출, 9/20 공식 마감을 기준으로 `01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`를 실행한다.
- 원격 배포는 인증 권한에 막혀 있지만 로컬 설치·진단·테스트·공개 데모 준비는 먼저 진행할 수 있다.

## Next Branches

- 다른 프로젝트의 새 Codex·Claude 세션에서 `$olchipanel-plan-author`를 실제 호출해 방향 확인까지 진행하고, 로컬 beta inbox에 들어온 `friction`·`missed`·`overdesigned`·`tool_gap`을 다음 스킬 개정의 근거로 검토한다.
- Mark가 0.8.2 installer/cross-platform 경계를 정하고 v2 방향을 확인하면 `output/plan-ab-v2/skill.json`을 세부 실행 카드로 확장·재검토해 live panel에 적용한다.
- 그 플랜을 에이전트가 직접 실행하며 항목 claim, pause, fresh evidence, 최종 release checkpoint가 패널과 일치하는지 실검증한다.
- Mark가 개인/팀 참가 형태를 정하고 9/18 전에 참가 접수를 완료한다.
- 9/3 전 GitHub 쓰기 권한과 로컬 `master`→원격 `main` 반영 경로를 닫는다.
- OS별 설치 문구와 Antigravity 설정 writer의 무덮어쓰기 회귀, Node 22/24 계약을 이어서 닫는다.
- Windows/macOS/Linux × Claude/Codex/Cursor/Antigravity acceptance를 실행한다.
- 설치 없는 공개 데모와 제출 자산을 9/13까지 완성하고 9/14 블라인드 설치를 진행한다.

## Approval Status

- Mark의 push·PR·release·npm 배포 승인은 확보했다. HTTPS와 SSH 모두 `Olchi-Mark` 권한 부족(403/permission denied)으로 원격 변경 없이 중단했다.

## Last Updated

2026-09-05 15:10 KST

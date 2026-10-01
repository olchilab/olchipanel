# 대회 데모 로컬 초안 검수 — 2026-09-19

## 2026-09-19 최신 — 같은 작업 공간의 튜토리얼 공개

https://olchilab.com/olchipanel/ — Sites v75 공개 완료. 처음부터 플랜 5개·노트 2개·Codex/Claude/이전 세션 3개가 있는 동일 작업 공간을 보여준다. 단계마다 데이터/iframe을 교체하지 않고 탭·세션·강조 위치만 바꾼다. 실제 대상의 테두리와 옆 비모달 안내, 다음·직접 해보기·건너뛰기·재열기·Escape·모션 감소 구현. 누구나 같은 초기 자료이며 변경은 각 브라우저 로컬에만 저장한다. 실제 AI 호출 없음.

- 공개 실브라우저: 첫 플랜·같은 iframe 유지·drag·분석→노트·노트 새로고침 보존·요청·인계·Claude 공통 플랜·안내 생략/재열기·모션 감소 PASS. 로컬 1280×720/960×540의 7단계 강조-안내 겹침0. 표적 10/10, 홈페이지 build 및42/42 PASS.
- 근거: `output/playwright/smooth-review/REVIEW.md`, `tour-actions-public.txt`, `tour-public.txt` 및 화면 PNG. source `5d739db6393ebe11f88b8bd885c9652fffe47bda`, deployment `appgdep_6aae307f642481918820ec590655810a` succeeded.
- 앱 원본 코드는 이번 안내 수정에서 변경하지 않았다. 제품 0.8.2 유지. 최신 홈페이지의 All100 변경을 합쳐 보존한 격리 checkout에서 배포했다.
- 제출 자료 R5와453자 문안은 준비돼 있다. 실제 원티드 첨부·임시저장·최종 제출은 미완료. 다음은 PC 조작 가능 시 정확한 입력·첨부·임시저장·재열람 확인이며 최종 제출은 누르지 않는다.

## 2026-09-19 최신 — 직접 조작 체험 공개·제출 직전 준비

https://olchilab.com/olchipanel/ — Sites v72 공개 완료. 화면 크기·플랜 드래그·노트 작성/편집/저장·요청 상세·Codex/Claude 가상 세션·7단계 안내와 확인 버튼의 단계 이동을 구현했다. R5 5장(1920×1080), AI 활용 453자, 검수 전달문 준비. 최종 제출은 하지 않았다. 원티드 입력 도중 사용자 키보드 입력이 섞였고 원티드 창이 닫혀 현재 첨부·임시저장은 미완료다. PC 조작 가능 시 양식을 다시 열어 텍스트 정확성·이미지 업로드·저장 후 재열람을 확인한다.

- 증거: [R5 이미지·문안](../output/championship-submission-r5/review.html), [검수](../output/championship-submission-r5/REVIEW.md), `output/playwright/demo-fit-drag/`.
- 앱 원본은 0.8.2 유지. 플랜 높이/짧은 창/요청 상세를 정본에 반영했다. 노트 편집은 기존 앱 기능을 웹 로컬 어댑터에 연결했다. 앱 runtime 재시작: 6711 단일 listener, pid10620, Electron pid66920, 세션0. 재시작 후 실제 앱을 전면에 두고 빈 플랜 5열·sidebar·하단 경계를 눈검수했다(`output/playwright/demo-fit-drag/app-plan-final.png`). 실제 세션이 없어 채워진 노트/요청 흐름은 동일 Studio 렌더러의 합성 체험으로 검증했다.
- 다음: 실제 원티드 양식 저장 및 재열람. 주최 측 기존 서비스 고지 이메일 초안은 준비됐고 발송은 미실행.


## 2026-09-19 공개 완료 — 제출은 별도

Mark의 명시적 배포 지시로 https://olchilab.com/olchipanel/ 을 공개했다. 기존 홈페이지 v69 기준 격리 checkout에서 v70으로 배포 성공. 공개 비로그인 7단계·분석→노트/플랜·상태 복원·인계 복사 PASS. Chrome에 플랜 화면을 열어 두었다. R3 5장과 425자 AI 문안이 최신이다. 주최 측 운영 상태 고지·실제 첨부 검수·최종 제출은 미실행. [공개 검증 및 공식 조건](../output/playwright/public-deployment-20260919/점검결과.md).

아래 내용은 각 당시의 이전 체크포인트다.

## 구현과 실행

- 분석 모듈 의존성 준비(처음 한 번): `npm ci --prefix tools/championship/scope`.
- 빌드: `node tools/build-championship-demo.cjs`
- 산출물: `output/championship-demo/site/` (정적 파일, 상대 경로, `/olchipanel/` 배치용)
- 로컬 검수: `node tools/preview-championship-demo.cjs`. 주소·소유 PID: `output/championship-demo/preview.json`. 소유 터미널 Ctrl+C로 종료한다.
- 현재 앱의 `renderTheme('studio', surface)`를 사용한다. 소스 해시는 산출물 `build.json`에 기록한다. 제품 원본 HTML·렌더러는 수정하지 않았다.
- 첫 소개, 7단계, 단계별 자유 탐색, 읽기 전용 플랜 상세·노트, 요청·기록·재개 내용, 사용 방법·GitHub 안내를 구현했다.
- 사용자의 최신 지시에 따라 샘플 직접 편집은 보류했다. AI 호출·실사용 데이터·외부 배포·대회 제출은 실행하지 않았다.

## 확인한 결과

- Playwright 검수 입구: `output/playwright/championship-check.js`.
- 7단계 진입과 해당 탭 표시, 플랜 상세 읽기 전용, 노트 본문 읽기 전용 및 새 노트 버튼 숨김 확인.
- 판단 요청을 읽고 다른 탭을 오가도 미해결 요청은 남는다.
- 재개 창에 목표·진행·최근 기록·다음 할 일·미해결 요청 표시 확인. 복사 결과/실제 에이전트 재개는 이번 점검에 포함하지 않았다.
- 7단계와 다크 테마를 새로고침 뒤 유지함을 확인했다.
- 각 단계 1440px에서 document 가로 넘침 0. 브라우저 JS 오류·실패한 네트워크 응답·네트워크 쓰기 요청 0.
- 1440×960 라이트, 1180×800 다크 캡처. 프로젝트 앱과 동일 fixture를 넣어 실행한 Electron 대조는 아직 미검증이다.

## 디자이너 관찰

- 현재 Studio의 사이드바·제목·본문 위계를 유지하고 단계 제어를 프레임 밖 하단에 두어 플랜의 세 열과 접힌 두 열을 가리지 않았다.
- 노트는 본문과 문서 목록의 폭을 유지하고 편집 도구를 숨겼다. 첫 캡처에서 발견한 '새 노트' 버튼도 읽기 전용 목적에 맞춰 숨기고 재확인했다.
- 1180px 그래프 전체 맞춤은 노드 글자가 작아지는 한계가 있다. 원본 확대·맞춤 제어가 동작하며, 최종 시연 장면 선정 때 가독성을 다시 확인해야 한다.
- 증거: `output/playwright/championship-stage1.png`~`championship-stage7.png`, `championship-handoff.png`, `championship-laptop.png`.

## 남은 확인

- OlchiScope 연계는 아래 추가 검수까지 마쳤다. 현재 준비된 방문자·매출 자료만 사용하며 업로드·자동 시각화 선택은 향후 방향이다.
- 사용자 시각 승인, Electron 동일 데이터 대조, 최종 제출용 이미지, 홈페이지 결합과 공개 주소 검증은 남아 있다.
- 공용 portfolio/surface validate 및 status는 실행했으나 타 프로젝트의 기존 누락·스키마 오류로 전체 FAIL. 이번 출력에 olchipanel 항목 오류는 없다. 무관한 프로젝트 파일은 수정하지 않았다.

## 자체 검수 수정

- 노트 탭은 목표 제목을 숨기는 정상 동작인데 QA가 제목 visible을 기다려 중단됐다. 활성 탭별 표시 검증으로 수정 후 7단계 재실행을 통과했다. 사건 `err.20260919.001`.
- 데모에서 사용하지 않는 작성·설정·보관 버튼과 쓰기 동작을 차단했다. 기존 제품의 작성 기능은 바꾸지 않았다.

## 자료 분석 추가 검수 — 2026-09-19

- 목적: 익숙한 날짜별 방문자·매출 자료를 통해 분석 결과가 노트·플랜으로 이어지는 흐름을 보여준다. 현재 Studio의 위계·색·여백을 재사용하고 기존 Scope의 그래프/구간 동작을 추출했다.
- 정적 샘플 50일(8/1~9/19), 지표 전환, 날짜 입력·역방향 그래프 드래그, 확대/전체 보기, 노트 반영, 후속 플랜 카드, 재방문·초기화 검수 완료.
- 단위 테스트 4개 PASS: 날짜 연속성, 포함 경계·역방향·단일 날짜 계산, 잘못된 날짜/빈 범위, 저장할 선택 결과.
- 브라우저 검증: `output/playwright/championship-scope-check.js` PASS. 8/23~8/30 8일 방문자 일평균 1,285.1명 표시. 같은 구간 매출 일평균 38,962.5원·합계 311,700원이 실제 샘플 계산과 노트 양쪽에서 일치했다.
- 후속 플랜은 같은 결과를 반영해 `선택 구간 추가 자료 확인` 카드 하나를 보여준다. 실제 제품 MCP 호출/노트 쓰기와는 별도의 브라우저 데모 저장소다.
- 날짜 범위·지표를 유지한 채 탭 왕복/새로고침, 다크 동기화 확인. 처음부터는 분석 결과·선택 구간·유효하지 않은 노트 탭 캐시를 정리한다. 원본 제품의 사용자 데이터는 읽거나 바꾸지 않는다.
- 전체 7단계 회귀도 변경된 웹사이트 분석 이야기로 재실행 PASS. 브라우저 오류·실패 응답·네트워크 쓰기 요청 0.
- 실제 화면: 1440×960 라이트, 1180×800 다크. 노트의 분석 수치와 그래프 통계가 같고 하단 반영 버튼이 보인다. 노트북 내부 분석 화면 `902×633`, scrollWidth 902/scrollHeight 633으로 넘침 없음.
- 자체 수정: Y축 제목과 상단 눈금 간 간격을 늘렸고, 날짜 눈금은 정수 날짜 좌표에 맞췄다. 초기화 뒤 사라진 결과 노트의 선택 캐시가 남는 문제를 수정했다.
- 증거: `championship-scope-visitors-light.png`, `championship-scope-revenue-light.png`, `championship-scope-revenue-dark-laptop.png`, `championship-scope-note.png` (모두 `output/playwright/`). 사용자 최종 시각 승인은 별도다.
- import 범위 개명 충돌 기록: `err.20260919.003`. 샘플 초기화/노트 탭 수명 수정: `err.20260919.004`. iframe 검수는 src 설정 시점 대신 내부 카드/분석 영역 렌더를 기다리도록 바꿨다.

## 2026-09-19 제출 묶음 및 홈페이지 연결본

- 1920×1080 PNG 5장 실제 렌더 확인. 목표/분기·플랜·매출 구간·계산 결과 노트·인계 화면이며 개인정보 대신 가상 자료만 사용했다. 파일·크기·해시는 `output/championship-submission/manifest.json`.
- 입력 문안은 `output/championship-submission/제출문안.md`; AI 활용 392자. 대표 이미지는 플랜 화면 추천.
- 홈페이지 운영 v69 격리 checkout: `C:/OlchiProjects/olchilab-business-homepage/output/championship-20260919`. 정적 파일 복사, slash redirect·asset route 추가. build 및 기존 경로 포함 42개 검사 PASS. 공개 배포·push·최종 제출 미실행.
- 사용자 최신 범위: 데모 기능은 제출 수준으로 완성하고 세밀한 디자인 검수는 후속으로 둔다. 공개 익명 접속과 실제 양식 첨부는 배포 후 남아 있다.

## R2 최종 자체 눈검수 및 공개 보류

최신 사용자 지시: 플랜 대표, 연결 세션 표시, 제출 이미지의 데모 문구 제외, 기능별 5장 구성, 공개 배포 보류. 최신 증거는 `output/championship-submission-r2/검수결과.md`와 `review.html`이다. R1 이미지는 보존된 이전 후보이며 제출 대상으로 사용하지 않는다. 현재/이전 세션 전환과 분석→노트→플랜 연결을 검증했다. 홈페이지 격리 checkout은 R1 배치안이므로 추후 공개 지시 때 최신 static 산출물로 다시 동기화·빌드해야 한다.

## 2026-09-19 R3 — 앱 원본 그래프 개선

R2 이후 사용자 승인 레퍼런스를 앱 원본에 구현하고 동일 Studio 렌더러로 R3를 생성했다. [실제 앱 동작·두 관점 검수](../output/graph-app-review/검수결과.md), [제출 이미지 R3](../output/championship-submission-r3/review.html). 공개 배포 보류.

## 제출 준비 전체 재점검

2026-09-19 첫 방문·7단계·분석·노트/플랜 반영·재방문·인계 클립보드·그래프 재확인 PASS. [이번 점검결과](../output/playwright/submission-readiness-20260919/점검결과.md). 공개 URL 404, 계정·업로드·최종 제출은 별도 미완료.


## 2026-09-19 앱·데모 공통 구현 재검수

| 기능 | 앱 정본 | 공개 체험 |
| --- | --- | --- |
| 자료 분석 | src/scope 공통 소스, 방문자·매출·날짜 구간·확대·이동·마커 | 동일 JS/CSS 자산, demo 쿼리로 저장소만 분리 |
| 결과 반영 | 저장 대상 세션 확인 후 공통 노트와 세션 플랜에 실제 저장 | 브라우저 로컬 샘플 노트·후속 카드 반영 |
| 플랜 카드 | 본문 클릭 상세/편집, 점 손잡이 드래그, 상태 선택 대안 | 같은 동작; 샘플 원본 제목·설명은 읽기 전용 |
| 키보드 | 1 상황, 2 플랜, 3 요청, 4 기록, 5 노트; 상황 QWE 트리/그래프/스택; 기록 QWE 변경/결정/막힌길 | 같은 단축키와 키캡, 안내에서 진입 가능 |
| 제어 외관 | compact composer, 테마 스크롤, select 11px gutter, 잉크 hover, 공통 sidebar CSS | 동일 공통 렌더러 |
| 소개·가상 세션·안내 | 실제 세션/데이터 사용 | 소개와 7단계 체험, 합성 Codex/Claude 세션만 별도 |

실제 엑셀 업로드/AI 자동 시각화는 향후 방향이며 구현 완료로 표기하지 않는다. 현 단계 분석은 양쪽 모두 명시된 가상 방문자·매출 자료다.

디자이너: 앱 라이트/다크 화면에서 제목→지표→그래프→구간 통계→반영 버튼 위계, 균등한 도구 정렬 확인. 카드 창 506px, 라벨 아래 간격 14px로 불필요한 빈 오류 영역을 제거. textarea는 외곽 clipping과 스크롤을 분리. 키캡은 20px 보조 표시. 공개 체험의 접힌 안내가 카드 창 제목을 가린 것을 발견해 대화상자가 열린 동안 감추고 닫히면 복귀하도록 수정.

UI 담당자: 격리된 실제 viewer API에서 8/1~8/3 매출 193900원→노트/카드 저장→새로고침→반복 저장 중복0. 기존 노트/카드 편집 보존, 중단된 카드 저장 회복, 잘못된 날짜/바뀐 대상/노트100개 거부를 검사. 실제 사용자 세션에는 샘플 노트·카드를 만들지 않음. 실제 Electron 73204에서 자료 분석 화면을 열어 검수했으며 runtime 74500/6711, 버전0.8.2 단일 listener 확인.

검증: 표적12/12, 홈페이지 build 및42/42 PASS. controls-public.txt의 실제 공개 QWE·키캡·편집창·입력보호·라이트/다크·짧은 창 PASS. app-scope-check.js, app-analysis-native.json, app-analysis-light/dark.png, app-composer-light/dark.png, controls-check.txt 참조. UI 오답노트 err.20260919.016/.017과 방향 candidate ui.20260919.003 기록 및 check PASS.

Sites v77 source bab842da6a9507ac676c20e6c73cd58d54c4dfa2, deployment appgdep_6aae3b47543881919d105cc3f560d05b succeeded. 최신 All100 변경을 보존한 격리 checkout 사용. archive의 DB binding과 drizzle SQL/journal을 실파일 대조했다.


### 최종 공개 검증 — Sites v79

source `60de558dd8dc4f18663fa61af220cd98269f8f67`, deployment `appgdep_6aae3e99e7f481919304ef1e02f90d21` succeeded. 분석 반영 저장소 경계와 iframe 문서 준비 전 observer 호출을 교정했다. 공개 주소에서 지연 로딩 450ms·첫 진입/안내 재열기 4회, QWE/숫자키 입력 보호, 편집창 라이트/다크/짧은 높이, 전체 7단계·분석311700원 노트 반영·노트 재열기·요청·인계·Claude 공통 플랜 PASS. 브라우저 오류0. `cold-start-public.txt`, `controls-public.txt`, `tour-actions-synced-public.txt`가 최종 근거다. 기존 championship-view 창을 최신 공개 소개 화면으로 갱신했다. 앱 원본은 자료 분석 화면으로 확인했고 임시 API 검수 서버는 종료했다.

표적 회귀13/13, 홈페이지42/42 및 build PASS. continuity PASS. 공용 surfaces/portfolio RED는 기존 외부 프로젝트 누락과 olchi-commons 스키마 문제이며 OlchiPanel 관련 오류 없음. 대회 실제 입력/첨부/제출은 이 UI 수정으로 완료되지 않았다.

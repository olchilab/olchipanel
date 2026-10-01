# WORKLOG — olchipanel (append-only)

## 2026-09-20 최신 — 최종 제출 및 운영 고지 완료

원티드 AI Championship 2026 최종 제출 완료. 과제 제출하기 클릭 후 “과제를 제출했어요.” 알림 및 개인 과제 카드 확인. 내 과제 미리보기 재열람·새로고침 후 R8 문구/대표 이미지/스크린샷5장/서비스 링크 일치. 운영 고지 메일도 t-mktg@wantedlab.com 발송 및 SENT 재확인(1a0bd790b4c2b987). 증거 `output/championship-submission-r8/SUBMISSION-RECEIPT.md`. 2026-09-20 15:26 KST. 이전 제출 보류·미완료·PC 조작 답변 대기 기록은 모두 이전 이력이다. 창 변화는 사용자 조작으로 입증되지 않았으며 별도 Windows 첨부 창에 대한 자동화 대상 지정 문제로 정정했다. 다음은 심사/주최 측 회신 확인과 데모 공개 상태 유지.

## 2026-09-20 최신 — 처음 체험 흐름 검수·공개 v84

공개 데모 v84 체험자 관점 검수 및 수정 완료. 접힌 안내를 상단으로 이동하고 그래프 가독성·안내 완료 피드백·다크 로고를 개선했다. 연결 노트→자료 분석 저장에서 이전 자동 저장이 결과를 삭제하던 오류를 reload 없는 병합으로 수정했다. 2개 화면 크기 14단계 눈검수, 공개 연속 흐름12개·노트 연결14개·표적8개 PASS, 공개 정적18개 해시 일치. 앱 원본7개 해시 유지·내부 스킬 제외. 대회 제출은 계속 보류. 증거 `output/playwright/tester-review/REVIEW.md` / `DEPLOYMENT.md`.

아래 이전 공개 버전 기록은 이 체크포인트 이전 이력이다.

## 2026-09-19 최신 — 직접 조작 체험 공개·제출 직전 준비

https://olchilab.com/olchipanel/ — Sites v72 공개 완료. 화면 크기·플랜 드래그·노트 작성/편집/저장·요청 상세·Codex/Claude 가상 세션·7단계 안내와 확인 버튼의 단계 이동을 구현했다. R5 5장(1920×1080), AI 활용 453자, 검수 전달문 준비. 최종 제출은 하지 않았다. 원티드 입력 도중 사용자 키보드 입력이 섞였고 원티드 창이 닫혀 현재 첨부·임시저장은 미완료다. PC 조작 가능 시 양식을 다시 열어 텍스트 정확성·이미지 업로드·저장 후 재열람을 확인한다.

- 증거: [R5 이미지·문안](output/championship-submission-r5/review.html), [검수](output/championship-submission-r5/REVIEW.md), `output/playwright/demo-fit-drag/`.
- 앱 원본은 0.8.2 유지. 플랜 높이/짧은 창/요청 상세를 정본에 반영했다. 노트 편집은 기존 앱 기능을 웹 로컬 어댑터에 연결했다. 앱 runtime 재시작: 6711 단일 listener, pid10620, Electron pid66920, 세션0. 재시작 후 실제 앱을 전면에 두고 빈 플랜 5열·sidebar·하단 경계를 눈검수했다(`output/playwright/demo-fit-drag/app-plan-final.png`). 실제 세션이 없어 채워진 노트/요청 흐름은 동일 Studio 렌더러의 합성 체험으로 검증했다.
- 다음: 실제 원티드 양식 저장 및 재열람. 주최 측 기존 서비스 고지 이메일 초안은 준비됐고 발송은 미실행.

- 2026-07-28 오전~오후 KST: 파일럿 피드백 당일 연쇄 반영 0.2→0.6(메모 패널별 탭·stop·유휴 접기·전용 크롬 프로필·창 1개/보드·벤더색). dev `94a2fa0` / public `9aa92cc`. release PR #9(0.6.2) 대기. 증거=CHANGELOG.md·git log.
- 2026-07-28 16:55 KST: 연속성 계약 파일 신설(STATE/HANDOFF/WORKLOG/DECISIONS/LEARNINGS + tools/continuity_check.py), `.olchi/portfolio.json` continuity 3칸 충족. 집행=Master_D_Fable.
- 2026-08-29 KST: 플랜의 중간 가로 스크롤 제거 뒤 5열을 좁은 `max-width`에 압축한 자기검수를 오답으로 판정. 플랜 탭만 OlchiPanel 전체 가용 폭을 사용하도록 보정하고, full-width 전환·무가로넘침 정적 회귀와 1920px 실제 렌더를 검수 기준으로 승격. 증거=`test/ui-shell.test.js`, `output/playwright/plan-consolidated-fullwidth.png`.
- 2026-08-29 12:54 KST: 상단 8개 탭을 상황·플랜·요청·기록·메모 5개 작업군으로 통합. 지도·스택은 상황 내부, 변경·결정·막힌 길은 기록 내부 보기로 낮추고 기존 저장 탭 이관·키보드·ARIA 회귀를 추가했다. 증거=`test/ui-shell.test.js`, `output/audit/02-five-tabs-records.png`, `output/audit/03-five-tabs-situation.png`, `output/audit/04-five-tabs-mobile.png`.
- 2026-08-31 KST: Wanted AI Championship 2026 공식 조건(참가 9/18, 제출 9/20, 배포 링크 필수)을 확인하고 9/15 기능 동결·9/17 1차 제출 계획을 수립. Windows/macOS/Linux × Claude/Codex/Cursor/Antigravity의 설치·첫 성공 계약, 공개 데모, 블라인드 설치 게이트를 P0로 확정. 증거=`01_plan/AI-CHAMPIONSHIP-2026-SUBMISSION-PLAN.md`.
- 2026-08-31 19:09 KST: Gravity UI Graph의 노드·간선·카메라 패턴을 현재 여정 지도에 무의존 SVG로 흡수. 트리/그래프 전환, 이동·확대·맞춤·정렬, 로컬 노드 배치를 구현하고 1440×1000·390×844·다크 테마 실렌더를 검수했다. 상태 정본은 계속 `map.tree`이며 배치는 세션별 로컬 설정이다. 증거=`test/ui-shell.test.js`, `output/playwright/journey-graph-desktop.png`, `journey-graph-mobile.png`, `journey-graph-dark.png`.

## 2026-09-19 추가 결정 — 한 작업 공간의 안내 튜토리얼

Mark는 처음부터 플랜이 채워진 동일 작업 화면을 모든 방문자에게 보여주고, 안내 단계별로 강조 위치·탭·세션만 달라지도록 지시했다. 대상 테두리와 옆 말풍선, 확인/다음 이동, 실제 조작 시 안내 접기, 건너뛰기/재열기를 구현했다. 샘플 데이터는 고정이고 사용자 변경은 각 브라우저에만 남는다. 실제 AI 호출은 없다. 새 UI 취향 탐색이 아니라 기존 Studio 안내의 동작 개선으로 처리했다. 배포 명시 승인 받음.

검증: 표적 10/10; 같은 iframe 유지; 카드 이동/분석 반영/노트 재방문/요청/인계/Claude 공통자료/모션 감소 PASS. 1280×720 및 960×540 전 7단계 강조-안내 겹침0. 근거: output/playwright/smooth-review/REVIEW.md.

## 2026-09-19 안내 복귀·소개·사이드바 보완

직접 해보기 뒤 말풍선을 찾기 어렵다는 Mark 지적에 따라 접힌 자리의 다시 보기/다음 안내를 유지하고 새로고침에도 복귀하도록 수정. 추가 요청으로 소개에 앱 역할과 체험 사례/동선, 가상 데이터 경계를 설명. sidebar는 AI 그룹 제목/구분선과 중복 목록 경계를 제거하고 세션-기능 메뉴 경계 한 개만 유지. 도움말/명암 전환 버튼 동일 규격 정렬. 데모 UI 범위이며 앱 원본의 스타일은 이번에 변경하지 않음.

검증: 7단계 접기/재열기/다음, drag, 재방문, Escape, skip PASS. 소개/양방향 theme/도움말/소개 복귀 PASS. 960×540의7단계 겹침0. 표적10/10 및 홈페이지42/42 PASS. 증거 output/playwright/smooth-review/REVIEW.md.

## 2026-09-19 공통 구현 복구

앱 누락 지적에 따라 자료 분석을 src/scope 정본으로 승격하고 앱·데모 동일 자산 비교 검사 추가. 공통 sidebar/키캡/QWE/compact composer/스크롤/hover 반영. 앱은 대상 세션 확인 후 실제 노트·플랜 저장, 데모는 가상 자료와 로컬 저장으로 구분. 0.8.2 유지; 오답노트 .016/.017, Sites v77 공개. 상세 검수 output/playwright/smooth-review/REVIEW.md.


### 최종 공개 검증 — Sites v79

source `60de558dd8dc4f18663fa61af220cd98269f8f67`, deployment `appgdep_6aae3e99e7f481919304ef1e02f90d21` succeeded. 분석 반영 저장소 경계와 iframe 문서 준비 전 observer 호출을 교정했다. 공개 주소에서 지연 로딩 450ms·첫 진입/안내 재열기 4회, QWE/숫자키 입력 보호, 편집창 라이트/다크/짧은 높이, 전체 7단계·분석311700원 노트 반영·노트 재열기·요청·인계·Claude 공통 플랜 PASS. 브라우저 오류0. `cold-start-public.txt`, `controls-public.txt`, `tour-actions-synced-public.txt`가 최종 근거다. 기존 championship-view 창을 최신 공개 소개 화면으로 갱신했다. 앱 원본은 자료 분석 화면으로 확인했고 임시 API 검수 서버는 종료했다.

표적 회귀13/13, 홈페이지42/42 및 build PASS. continuity PASS. 공용 surfaces/portfolio RED는 기존 외부 프로젝트 누락과 olchi-commons 스키마 문제이며 OlchiPanel 관련 오류 없음. 대회 실제 입력/첨부/제출은 이 UI 수정으로 완료되지 않았다.

## 2026-09-19 최신 — 새 방문 초기화와 단축키 테두리 수정

공개 https://olchilab.com/olchipanel/ Sites v80 반영 완료. 모든 새 방문/새로고침은 소개와 초기 샘플부터 시작한다. 데모는 탭별 sessionStorage를 사용하며 같은 체험의 단계·AI 세션 전환에서는 변경을 유지한다. 기존 localStorage 자료는 읽거나 삭제하지 않는다. 원본 앱의 실제 저장은 유지했다.

- QWE/숫자키가 만든 프로그램 포커스만 outline을 억제했다. Tab·방향키의 정상 포커스는 보존한다. public/index.html 원본과 생성 데모에 동시 적용.
- 로컬/공개 브라우저: 예전 데이터 무시, 새 탭 독립/기존 탭 유지, 새로고침 초기화, 체험 중 노트·플랜·분석 유지, 처음부터 초기화, QWE 테두리 제거/방향키 포커스 보존 PASS. 표적 13/13. 증거 output/playwright/smooth-review/fresh-visit-public.txt 및 fresh-visit-tests.txt.
- 앱 viewer를 stop/open으로 재시작. Electron 58748, viewer 52828, 127.0.0.1:6711 단일 listener, 0.8.2 유지. 앱 실화면은 확인했으나 OS window_not_focused로 실제 Electron 키 입력 자동 검증은 미완료. 공통 코드 브라우저 검사와 구분한다.
- 배포 source 33b0fbdb362ecb89b5d41d29f6c7db09cc8ff74d, version appgprj_6a689c14a3bc8191a40a55fb13a8f28a~appgver_86d2719269688191a38bc17440597935, deployment appgdep_6aae4cc06d3881919ca140f2966bfc72 succeeded. Sites 소스만 push, GitHub/npm에는 업로드하지 않음.
- 최신 제출 이미지 R6 5장 1920×1080 공개 화면 재촬영·시각 검토 완료. 실제 원티드 첨부/임시저장/최종 제출, 운영 상태 고지 이메일은 미실행.
- GitHub olchilab/olchipanel은 PUBLIC이나 CLI/연결 앱 계정 Olchi-Mark 권한은 READ. 원격 main은 fd38cdbc2e81cd1603e9a4dc14a955aec3bea4d4(8/21), 로컬 master의 개발 내용은 아직 미반영. 사용자에게 업로드 범위와 관리 계정을 두 질문으로 확인 중. 응답 없이 권한 변경/최종 제출하지 않는다.


## 2026-09-19 최신 — 세션 하위 메뉴와 0 공통 노트

선택한 세션 바로 아래에 1 상황·2 플랜·3 자료 분석·4 요청·5 기록이 펼쳐진다. 다른 세션을 고르면 이전 메뉴는 접히고 새 세션 아래로 이동한다. 하단 0 공통 노트는 독립 유지한다. 본문 QWE는 상황(1)과 기록(5)에서 동작한다. 앱 원본과 생성 데모 동일 구현, 제품 0.8.2 유지.

- 180ms 펼침과 방향 표시, reduced-motion 생략. 갱신 때 같은 메뉴 DOM/단축키 포커스·스크롤 보존. 공통 노트에서 세션을 선택하면 마지막 세션 화면 복귀. 세션이 없는 상태에서도 0 공통 노트 사용 가능.
- 원본 렌더+공개 브라우저: 숫자 0~5 및 QWE의 마우스/단축키 표시 일치, 메뉴 이동·단일 메뉴·0 독립, 1.8초 갱신 후 포커스 유지, 빈 세션, 입력/대화상자 보호, 플랜 iframe에서 0, 작은 1100×660 화면 펼침/접힘, 다크·모션 감소·새 방문 초기화 PASS. 표적9/9. 증거 output/playwright/smooth-review/session-nav-public.txt, session-nav-edge-public.txt, session-nav-tests.txt.
- viewer stop/open 및 앱 재기동 완료: viewer3184/6711 단일 listener, Electron27200, API version0.8.2. 실제 앱 접근성 트리에서 세션 아래 메뉴와 공통 노트 확인. OS 화면 캡처는 다른 창에 일부 가려져 완전한 시각 증거로 쓰지 않으며 원본 렌더 격리 브라우저 캡처로 보완했다. 실제 사용자 세션 데이터는 변경하지 않음.
- 공개 https://olchilab.com/olchipanel/ Sites v82 succeeded. source f4944aeb39c92ceb034814c18b723fa0f52e7553; version appgprj_6a689c14a3bc8191a40a55fb13a8f28a~appgver_4f3d114040a48191b47202f444a3cc82; deployment appgdep_6aae9fe5da6481919551ef38bb8aed1c. 최신 홈페이지 리뷰/D1 변경3b13a60를 먼저 흡수하고 SQL 2개 및 DB 보존 검증.
- 제출 이미지 R7 5장 1920×1080 공개 촬영 및 시각 검토, 가로 넘침/페이지 오류0. 최신 제출 묶음 output/championship-submission-r7/review.html. 실제 원티드 입력·첨부·임시저장·최종 제출/운영 고지 이메일은 미실행. GitHub 업로드 범위/계정 질문은 미응답이고 Olchi-Mark READ 문제는 남아 있음. GitHub/npm 업로드 없음.
- UI direction candidate ui.20260919.004에 최신 명시 요청 기록. 과거 메뉴 고정 위치 선호보다 이 지시가 우선. 전역 surface/portfolio 검사는 기존 타 프로젝트 누락/불일치로 RED이며 OlchiPanel 오류와 구분.


- 2026-09-20: 데모 전용 그래프→특정 노트 페이지 연결/복귀 로컬 구현, 주요14+경계7 및 안내 흐름 PASS. 원본 앱 해시7개 동일. 내부 스킬 Git 제외·정적 공개 묶음·npm 게시 차단 검증. 공개 배포와 대회 제출 미실행/보류. 증거 output/playwright/note-links/REVIEW.md; 경계 01_plan/PUBLIC-DEMO-BOUNDARY-20260920.md.

- 2026-09-20: Mark 배포 지시로 데모 노트 페이지 연결 공개 v83 succeeded. source95ff26cfdd415a4e9b47f7a3d521a80c1aedf598. 내부 스킬 제외·DB와홈페이지 보존. 공개21검사+안내/18파일 해시 PASS. 기존 홈페이지 후기검사2불일치 별도. 대회 제출 보류. 증거 output/playwright/note-links/DEPLOYMENT.md.

## 2026-09-20 앱 실행·메뉴·라벨 후속 교정

PC desktop-only preference와 Electron launcher를 반영하고 관련 지침/설치된 스킬을 맞췄다. 사이드바32px, 상황/기록 글자16px·세로여백 축소, 공통노트 Backquote. 라벨은 카드 제목 바로 아래의 채움 배지, 우선순위 점8px 정렬. 실제 Electron 밝음/어두움·단축키·입력 보호·라벨 선택/재열기 검수 및 표적 테스트 통과. 라벨 쓰기는 격리 메모리 fixture로 검수했다. 증거 `output/app-only-sidebar/REVIEW.md`, `checks.json`, PNG. 전체 테마 겹테두리는 제안 단계. 제품0.8.2, 제출 완료 및 공개v84 유지. 다음은 Mark 시각 검토. MCP 소유 viewer는 보존하며 앱만 재시작; 기존 MCP launcher 모듈은 다음 정상 시작에 갱신된다.

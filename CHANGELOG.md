# Changelog

제품 개발 버전은 npm 배포 버전과 맞춘다. 현재 0.8.x에서는 전체 UI의 구조와
반응형 안정성을 충분히 검수하고, 그 완료 기준을 통과한 뒤 0.9로 올린다.

## Product 0.8.2 — current development baseline (2026-09-01)

- 상황의 그래프 보기를 작업 워크플로우로 바꿨다. 기록된 주 단계는 왼쪽에서 오른쪽으로 잇고 세부·분기·보류는 부모 단계 아래로 표시한다. 추가 작업 화살표는 부모 하단에서 자식 상단으로 내려간다. 높이가 다른 주 단계의 연결점을 정렬하고 카드 간격을 줄였으며 단계 번호를 카드 안에 두고 제목 줄바꿈을 고쳤다. 실제 `now`의 단계 위치와 이동 버튼을 제공하며 종료된 세션은 마지막 위치로 구분한다. 기존 트리와 그래프 조작은 유지하고 추적 스킬의 작성 계약을 맞췄다.

- Windows 앱 창을 닫으면 알림 영역에 남기고, 숨겨진 아이콘 더블클릭·메뉴로 창을 다시 연다. 아이콘 메뉴의 종료는 앱과 앱 소유 viewer를 정상 종료한다.

- PC 앱 전용 실행을 preferences와 Electron 단일 창으로 연결하고 브라우저 fallback을 차단했다. 메뉴 간격 축소·상황/기록 탭 글자 확대·공통노트 Backquote·카드 상단 색 라벨·우선순위 점 정렬을 적용하고 실제 앱 검수했다.

- 2026-09-20 데모 체험 검수: 안내 상단 이동·그래프 가독성·완료 피드백·다크 로고 개선, 연결 노트 이후 분석 저장 경합 수정. 공개 v84 실브라우저 재검증 완료. 앱 원본 유지, 내부 스킬 제외, 제출 보류.

- 2026-09-20 후속: 사용자 배포 지시로 데모 전용 노트 페이지 연결을 공개 v83에 반영했다. 공개21개 동작/경계와 안내 흐름, 파일18개 해시 검증 완료. 내부 스킬·설치 파일 제외, 앱 원본 유지. 대회 제출은 계속 보류.

- 2026-09-20 데모 전용으로 상황 그래프 항목과 공통 노트의 특정 페이지 연결·해제·열기·편집·그래프 복귀를 구현했다. 앱/MCP 원본은 변경하지 않았다. 내부 스킬 Git 추적 제외, 정적 파일 허용 목록 기반 공개 묶음, npm 게시 전 스킬 포함 차단 검사를 추가했다. 로컬 검수 완료이며 이 변경의 공개 배포·대회 제출은 미실행.

- 선택한 세션 아래에 1상황·2플랜·3자료분석·4요청·5기록을 펼치고 하단 0공통노트를 분리했다. 앱·데모 동일 적용, 주기적 갱신에도 메뉴 포커스 유지, 세션 전환·빈 상태·숫자/QWE·입력 보호 검수. 공개 v82 및 R7 제출 이미지 갱신.

- 공개 체험은 새 방문/새로고침에 소개와 초기 샘플로 돌아가며 탭마다 독립적으로 동작한다. 체험 중 단계·AI 전환은 유지하고 앱 원본의 영속 저장은 보존했다. 단축키 포커스의 잘린 외곽선을 앱·데모에서 제거하고 Tab/방향키 포커스를 유지했다. Sites v80 및 공개 회귀 PASS; 제출 이미지 R6 갱신.

- 자료 분석을 `src/scope/` 앱 공통 소스로 승격했다. 앱·데모가 같은 그래프·구간통계·테마를 사용하며 앱은 명시적 저장으로 공통 노트와 현재 세션 플랜에 결과를 기록한다. 재저장 중복 방지, 사용자 편집 보존, 잘못된 날짜·대상 변경·노트 상한 회귀를 포함한다. 실제 자료 업로드와 AI 자동 차트 선택은 향후 범위다.
- 카드 편집의 빈 오류 여백을 제거하고 textarea 모서리·테마 스크롤·select 화살표 안쪽 간격·손잡이 hover를 통일했다. 사이드바 공통 CSS를 앱에 승격하고 숫자 키캡과 상황/기록 QWE 단축키를 추가했다. UI 오답노트 err.20260919.016 및 .017 기록.

- 앱 원본과 체험 플랜 카드에 전용 점 손잡이를 추가했다. 본문 클릭/Enter/Space는 상세를 열고 손잡이에서만 드래그로 상태를 옮긴다. 1 상황·2 플랜·3 요청·4 기록·5 노트 단축키를 프레임 안에서도 지원하며 입력·편집·대화상자·수식키 조합에서는 작동하지 않는다.

- 체험의 직접 해보기 이후 안내를 완전히 숨기지 않고 같은 자리에 다시 보기·다음 안내 제어를 남긴다. 새로고침 뒤에도 복귀할 수 있다. 소개에 앱 역할·시나리오·체험 동선을 설명하고 sidebar의 AI 그룹/중복 선을 제거했으며 도움말·명암 버튼을 정렬했다.

- 공개 체험은 처음부터 채워진 동일 작업 공간을 사용하고 안내 단계마다 탭·세션·강조 위치만 바꾼다. 중앙 모달을 대상 옆 비모달 말풍선·테두리 강조로 바꾸고 직접 조작 시 접기, 다음·건너뛰기·재열기·Escape·모션 감소를 지원한다.

- 체험 안내의 직접 해보기가 해당 탭·Codex 세션·조작 위치를 복원하도록 수정했다. 화면 준비 전 진입을 막고, 접힌 sidebar·다른 AI 탐색·노트 저장 후 재진입을 검증했다. 짧은 노트북의 소개 화면 간격도 조정했다.

- 앱 원본의 플랜 프레임을 실제 가용 높이에 맞추고 짧은 컴퓨터 화면의 여백을 조정했다. 요청 항목을 클릭·키보드로 열면 에이전트·목표·작업·대기 상태와 복사를 제공하며 미해결 건수는 유지한다.
- 공개 체험의 플랜 드래그·상태 저장, 노트 작성·편집·자동 저장·재방문·초기화를 구현했다. 분석 SVG를 실제 크기에 맞추고 날짜 축·통계·반영 버튼 잘림을 수정했다. 서버에 개인 입력을 전송하지 않는다.
- Codex·Claude 가상 세션과 공통 플랜·노트 체험, 단계별 조작 안내 및 확인 버튼의 다음 단계 이동을 추가했다. 중복 버전 표시와 sidebar 도구 간격을 정리하고 제출 이미지 R5 5장·453자 문안을 갱신했다. 실제 AI 호출·대회 최종 제출은 하지 않는다.

- 사용자 승인으로 대회 웹 체험을 `https://olchilab.com/olchipanel/`에 공개하고 7단계·분석 반영·상태 복원·세션 인계의 공개 환경 검증을 완료했다. 앱 버전·npm 배포는 변경하지 않았다. 최종 대회 제출은 별도다.

- 대회 제출 문안을 공식 예선 기준과 검증 근거에 맞춰 정리하고, 다른 AI가 검수할 수 있는 독립 전달문을 추가했다. 제작 AI와 제품 내 AI 역할, 실제 앱·합성 체험·향후 기능을 구분했다.

- 실제 Studio 앱의 상황 그래프를 개선했다. 상자 폭·글자·모서리를 정리하고 둥근 직교 연결선과 방향 화살촉, 현재 강조·보류 점선을 적용했다. 노드를 반대편으로 이동해도 경계 연결을 다시 계산하며 기존 수동 위치 저장을 유지한다. 동일 렌더러로 제출 데모와 R3 이미지를 갱신했다. 공개 배포는 보류한다.

- 대회 제출 이미지 5장을 플랜·연결 세션(대표), 공통 노트, 작업 그래프, 자료 분석, 세션 인계로 구성했다. Studio 렌더러를 사용하는 제출 캡처에서 체험 안내 문구를 제거하고, 웹 체험에는 샘플 안내를 유지했다. 마지막 장면은 이전·현재 세션을 전환하며 같은 플랜과 노트를 확인한다. 공개 배포는 사용자 지시로 보류한다.

- 대회 데모의 자료 분석 탭에 OlchiScope 그래프를 재사용해 날짜별 방문자 수·매출 전환, 구간 통계, 샘플 노트·플랜 반영을 추가했다. 엑셀/CSV 입력 후 스킬이 표현을 선택하는 장기 방향을 현재 고정 자료 데모와 구분해 기록했다. 제품 원본 UI와 OlchiScope 저장소는 수정하지 않았다.

- 대회용 로컬 웹 데모 초안을 추가했다. 현재 Studio 앱 렌더러에 합성 데이터를 공급해 7단계·플랜 상세·공통 노트·판단 요청·인계 내용을 읽기 전용으로 체험한다. 직접 편집은 보류하며 공개 배포는 하지 않았다.

- Wanted AI Championship 제출 준비 문서에 최신 공식 조건, 팀원 초대 마감, 웹 체험 URL 요건, 제출 문안·시연 구성과 미확인 항목을 정리했다. 제품 코드·버전·배포 상태는 변경하지 않았다.

- Windows 설치본 첫 실행에 Codex·Claude Code 선택 및 MCP 등록 동의를 추가했다. 취소·재진입·기존 설정 백업·충돌 보존을 지원하며, 설치된 앱 엔진으로 MCP를 실행해 별도 Node/npm 설치를 요구하지 않는다. 등록과 실제 에이전트 연결 상태는 구분한다.

- 명시적 프로젝트 시작에 `start_project` MCP와 `olchipanel start/setup` 명령을 추가했다. AGENTS.md·CLAUDE.md 안내와 Codex·Claude용 로컬 추적 스킬을 중복 없이 등록하며 기존 내용 충돌은 보존하고 보고한다. MCP 초기 연결은 계속 무기록이다.

- 노트 탭은 선택 여부와 관계없이 같은 글자 크기·굵기를 사용하고, 선택 탭의 진한 아래 테두리로 구분한다.

- 노트 제목 표시·편집을 현재 탭 한 줄로 통합하고 중복 경로·별도 제목행을 제거해 본문 공간을 넓혔다.

- 노트 링크 입력을 Electron에서 지원하지 않는 prompt 대신 앱 내 대화상자로 변경했다. 선택 글자·주소 수정·취소를 지원하고 Ctrl+클릭으로 기본 브라우저에서 링크를 연다.

- MCP 초기 연결의 자동 패널 등록을 제거했다. 사용자 연결·추적 요청 후 첫 패널 도구 호출에서만 등록하며 미사용 세션 종료도 기록을 남기지 않는다.

- E 앱 플랜 도구줄 아래 구분선을 복구하고 도구줄·카드 영역 사이 세로 여백을 줄였다.

- 올치노트 목록 스타일을 분리해 번호 목록에 공통 점 표시가 중복되는 문제를 수정했다. 글머리 목록은 점, 번호 목록은 숫자로 표시한다.
- 올치노트 체크 기호를 상자 내부에 고정해 체크 전후 상자 위치와 다음 행 높이가 변하지 않도록 수정했다.
- 올치노트 점·번호 목록의 들여쓰기와 표식 뒤 여백을 조정해 본문과 구분하고 줄바꿈 정렬을 유지한다.

### 기준

- 제품 개발 버전과 npm 배포 버전을 `0.8.2`로 통일했다.
- 0.8.x는 전체 UI 고도화·실화면 검수 단계이며, 0.9는 이 단계의 완료 체크포인트다.
- 기능은 UI, 에이전트 계약, 회귀 테스트가 함께 맞을 때 완료로 기록한다.
- 앞으로 `productVersion` 하나를 하나의 개발 완료 단위로 운영한다. 버전 플랜의 성공 조건·UI·에이전트 계약·회귀 테스트·실화면 증거를 최종 release checkpoint에서 함께 확인하고, 버전 증가는 Mark가 별도로 결정한다.

### 에이전트 계약

- 노트 작성 스킬에 내용별 기능 선택 기준을 추가했다. 제목 계층·목록·체크·인용·코드·링크·하위 페이지·고정·정렬을 목적에 맞게 적용하고 저장 내용과 실제 기능을 함께 검수한다.

- `olchipanel-note-author` 스킬 추가: 공통 노트 대상 확인, 신규 작성/부분 갱신, 중복 방지, 실제 편집기 저장 후 재조회. 읽기 전용 MCP를 쓰기 도구로 오인하거나 공통 노트 전체를 덮어쓰지 않는다.

- 공용 `@olchilab/release-kit` 설정·배포파일 검수·Electron 업데이트 수명주기와 OlchiPanel 설치형 NSIS 빌드를 추가했다. 설치 앱 자동 확인/다운로드, 정상 종료 적용, Windows 종료 시 적용 보류. 외부 게시·서명·실제 버전 간 업데이트 검증은 별도 배포 게이트다.

- 사용자 선택 E2 Studio를 기본 데스크톱 정본으로 채택했다. npm start/e/e2 통합, 기존 E2 사용자 설정 유지, 비교 표기 제거. 데스크톱 코드 배포 포함 검사와 베타 전달 가이드를 추가했다.

- E2 공통 메뉴를 브랜드 아래·세션 제목 위로 이동하고 내보내기·도움말·언어·화면 모드에 1초 지연 툴팁을 적용했다. 모드 안내는 전환 대상에 맞춰 표시한다.

- E2 플랜 내부 좌우 여백을 패널 8px·보드 4px로 줄이고 도구 행을 보드와 맞췄다. 실화면 가로 넘침 없음 확인.

- E2 본문 상단 탭 글자를 15px로 확대하고 밑줄·행 정렬을 실화면에서 확인했다.

- 연결 후 마지막 활동 1시간 이상이면 LED를 노랑으로 표시한다. 경계값·응답 우선순위 회귀 통과. 결정 목록은 체크와 첫 줄 정렬, 보통 굵기, 제한된 읽기 폭과 행 구분선으로 정리했다.

- E2 상태등을 연결 안 됨=회색, 연결됨=초록, 실제 응답 중=스피너로 정정했다. 상시 안내를 1초 탭 툴팁으로 옮기고 실제 진행은 유지했다. README·추적 계약을 현재 사용법과 일치시켰다.

- E2 토글을 브랜드 오른쪽 세로 중앙으로 조정했다. Orca worktree ps의 실제 에이전트 working/done 상태를 1.5초 주기로 읽어 응답 스피너·완료 초록불에 연결했다. 프로젝트/에이전트가 모호하거나 조회 실패 시 완료를 추정하지 않는다.

- E2 사이드바 접기 버튼을 최상단 고정 위치로 이동했다. 표시등을 원형으로 변경하고 기록된 여정의 now=스피너, 전체 완료=초록, 대기=회색, 연결 끊김=빈 원으로 구분했다. 버튼 왕복 위치와 상태 분류 회귀를 확인했다.

- E2 사이드바 제목을 프로젝트 폴더명으로 표시하고 보조 줄의 중복 이름을 제거했다. 제목은 표시 20자 이내·한 줄 말줄임으로 제한하며 전체 이름 툴팁과 독립 상태표시 칸을 둬 줄바꿈을 방지한다. 원본 세션 이름은 변경하지 않는다.

- E2 선택 위계를 구분했다. 세션 표식은 34px, 사이드바 메뉴는 18px, 본문 탭은 아래 2px 밑줄로 적용하고 다크·라이트에서 확인했다.

- E2 Studio Console을 다크 기본값과 대응하는 라이트 팔레트로 확장했다. 모드 전환 버튼·별도 선택 저장·플랜 동기화를 연결하고 선택 탭 왼쪽 표식을 3×18px 직사각형으로 통일했다.

- 사용자 선택으로 E2 Studio Console과 E3 Editorial Desk 비교 앱을 추가했다. 정본 HTML·실제 API를 공유하고 프로필을 분리하며 차콜·앰버/아이보리·벽돌색 테마를 주요 탭에 적용했다. 그래프 글꼴은 측정 기준과 맞추고 접힌 세션 아이콘의 채움 강조를 제거했다.

- E2 검수 승인 내용을 정본에 흡수하고 비교 번호·창을 종료했다. 그래프는 남은 본문 높이를 사용하고 폭·높이 변경 시 맞춘다. 자동정렬 v5는 같은 깊이의 상자 폭·좌우 경계 통일, 최소 24px 행 간격, 중앙 연결점, 형제 그룹 중심의 부모 배치를 적용한다. 이전 수동 배치 v4는 삭제하지 않고 별도 키로 보존한다.
- E2 비교 앱을 추가했다. 기존 E와 나란히 실행하며 같은 실제 API와 독립 화면 설정을 사용한다. ① 그래프 재맞춤 ② 노트 편집 높이 ③ 현재 진행·과거 메모 구분 ④ 최신 기록·요약 우선 ⑤ 선택 표시 통일 ⑥ 빈 플랜 도구 정리를 번호로 표시한다. E2는 비교 명칭이며 제품 버전은 0.8.2다.
- UI 작업 입구에 디자이너·UI 담당자 검토 계약을 연결했다. 구현 전 판단, 실제 사용 전후 검수, 자체 수정, 합의된 비교 사례와 미승인 구현 증거의 구분을 완료 기준으로 명시했다.
- 선택 메뉴의 둥근 강조 배경과 긴 색막대를 작은 각진 표식으로 교체했다. 그래프는 작업명과 상태를 얇은 경계로 묶고 내부 선·원을 제거했다. 재개를 목표 옆으로 옮기고 세션의 목표·진행·최근 기록·다음 작업·미해결 요청을 표시하며 실제 복사 요청에도 포함한다.
- 기록 배지는 전체 건수 대신 세션별 미확인 건수를 표시한다. 실제로 연 변경·결정·막힌 길 탭만 읽음 처리하며 재실행 후에도 유지한다. 다른 탭과 비활성 창의 새 기록은 미확인으로 남기고 요청·중단 작업은 해결 전까지 유지한다.
- 연결된 플랜이 없어도 빈 5열 보드를 표시한다. 백로그·취소 열은 기본으로 접으며 사용자가 저장한 접힘 선택은 유지한다. 빈 보드를 보는 것만으로 플랜 데이터를 생성하지 않는다.
- 상단 목표는 공백 포함 20자 이내 한 줄로 제한하며 초과 입력은 기존 목표를 보존하고 거절한다. 목표를 자동 갱신할 때 짧게 요약하고 제목 위아래 간격을 조금 늘렸다.
- 상단 목표는 현재 작업 목적이며 주제·목표가 바뀌면 갱신하고, 세부 진행 상태는 여정에 반영하도록 MCP·추적 스킬에 명시했다.
- MCP 연결 시 실제 세션과 `세션 연결됨` 첫 여정 항목을 자동 등록한다. 재초기화는 같은 항목을 유지하고 첫 실제 루트 단계는 초기 항목을 대체한다. 연결만으로 viewer를 열거나 목표·Plan·Note를 만들지 않는다.
- 현재 검수 범위를 컴퓨터·노트북으로 한정하고 OlchiPanel E 앱 창 하나만 유지하는 실행 기준을 프로젝트 지침에 반영했다.
- OlchiPanel 사용 승인 후 매 응답 종료 전에 의미 있는 진행·결정·막힘·검증 결과·다음 행동을 자동 반영하도록 MCP와 추적 스킬에 명시했다. 변화 없는 대화는 기록하지 않으며 읽기 전용 제한과 공통 노트 내용은 보호한다. 서버의 대화 감시 기능이 아닌 에이전트 실행 계약이다.
- MCP 최소 지침: `src/mcp.js`
- 필요할 때만 읽는 안내: `skills/olchipanel-track/SKILL.md`
- 상세 기록 기준: `skills/olchipanel-track/references/recording-contract.md`
- 토큰 회귀: 기본 지침 500자 미만, 변경된 사실만 기록, 대화·추론 복제 금지

### 0.9 진입 전 개발 중

- 상황 상단을 `트리·그래프·스택` 3개 직접 선택 탭으로 정리했다. 기존 지도 내부 토글을 없애고 키보드 전환과 이전 지도/그래프 선택 복원을 유지한다.
- 트리·그래프 위의 완료·현재·다음·분기 기호 범례를 제거해 본문 공간을 확보했다.
- 상황·요청·기록에서 반복되던 세션명·에이전트·시작/갱신 시각·라이브 정보 줄을 제거하고 목표 제목을 플랜에도 표시한다. 종료 세션의 복구 동작은 유지한다.
- 빈 플랜 안내는 보드 전체 폭을 사용한다. 세션 전환 시 남은 접힌 열 너비를 초기화해 한 글자씩 세로 줄바꿈되거나 빈 화면에 스크롤이 생기던 문제를 수정했다.
- 앱 다크 모드의 플랜 iframe 배경을 테마 색으로 명시해 빈 영역만 검게 보이던 차이를 없앴다.
- 좁은 기록 화면에서는 파일명 아래에 설명을 배치해 두 내용이 서로 폭을 빼앗지 않게 했다. 노트 경로 표시줄은 높이를 확보해 불필요한 세로 스크롤을 없앴다.
- 노트 버튼을 상단에서 사이드바 공통 메뉴로 옮겼다. 세션 독립 공통 노트와 키보드 접근을 유지한다.

- 세션 안의 플랜 화면은 선택한 세션에 연결된 플랜만 조회한다. 플랜 없는 세션과 세션 전환 시 이전 보드를 즉시 비우고 늦은 응답을 무시하며, 새 플랜도 현재 세션에 연결한다.

- `olchipanel-plan-runner` 스킬과 MCP `plan_next`·`plan_step`을 추가했다. 에이전트는 선행 작업이 끝난 실행 가능 항목만 claim하고, pause 시 소유권을 놓으며, 실제 증거를 원자 기록해야 완료할 수 있다. 같은 증거 키 재전송은 중복 없이 성공하고 충돌 내용은 fail-loud한다.
- 여러 분야에 공통으로 쓰는 `olchipanel-plan-author` 스킬과 `olchipanel.plan-author.v1` 스키마를 추가했다. 목표·범위·검증 가능한 완료 조건·실제 의존성·위험·다음 행동을 구조화하고, MCP `plan_apply`와 기존 Plan 가져오기가 같은 문서를 새 독립 플랜으로 적용한다.
- `olchipanel-plan-author`를 `sk-035` 공개 베타로 중앙 등록하고 Codex·Claude 전역 발견 경로에 노출했다. 실제 사용 뒤에는 원문·비밀·개인정보 없이 짧은 피드백 1건만 `.olchi/plan-skill-feedback/inbox`에 append-only로 저장하며 외부 전송하지 않는다.
- 현재 UI를 그대로 재사용하는 실험판 `OlchiPanel E` 단일창 셸을 추가한다. viewer 6711 재사용, 중복 앱 차단, 브라우저 자동 열기 금지, 100% 앱 확대와 창 크기 복원을 먼저 검증한다.
- 세션 작업 메뉴는 세로 사이드바에 두고, 세션과 무관한 공통 `노트`는 상단 탭으로 분리했다.
- 세션 목록의 둥근 카드·선택 배경·굵은 라운드 막대를 제거했다. 선택은 굵은 제목과 2×10px 각진 표식으로만 구분한다.
- 배율·창 크기에 흔들리지 않는 공통 프레임, 플랜 메뉴, 그래프 자동배치를 고친다.
- 모든 세션이 같은 공통 노트를 보고, UI만 쓰며 에이전트는 `note_read`로 읽는 권한 분리 계약을 구현했다. 기존 세션별 메모 파일은 보존한다.
- 공통 노트 편집기 안에 열린 문서를 전환하는 평평한 탭 골격을 추가했다. 탭 닫기는 노트를 삭제하지 않으며, 열린 탭과 활성 탭은 브라우저 로컬 상태로 복원한다.
- 플랜 스킬군을 한 번에 계획·적용하는 흐름이 아니라 레퍼런스 확인·필요 최소 조사·선제 자문·중요 질문·방향 확인·세부화 순으로 진행하도록 보강했다. 최신성이 결과를 바꾸는 사실은 실시간 검색과 조회일을 요구하고, 미확정 중요 사항이 있으면 작성·수정·실행을 멈춘다. 단순 작업과 미래 가정은 플랜을 부풀리지 않는다.
- 소프트웨어 플랜은 정본 제품 버전이 있으면 그 버전을 기본 범위로 삼고 terminal release checkpoint를 둔다. 빈 실행 대기열이나 개별 카드 완료를 버전 종료로 오인하지 않으며, 다음 버전 번호는 에이전트가 자동으로 올리지 않는다.

### 2026-09-01 실화면 UI 검수

- Windows PWA와 실제 Chromium을 2310×1302, 1440×900, 900×700, 720×760에서 확인했다.
- UI 갱신 검수는 기존 viewer와 창을 완전히 종료하고 현재 저장소에서 다시 시작한 실화면을 기준으로 한다.
- 문서 전체 가로 넘침은 없었지만, 큰 세션 제목·재개 안내·상단 탭이 좁은 화면의 작업 높이를 과도하게 사용한다.
- 720px 플랜은 5열을 억지로 축소해 읽기 폭이 부족하고 카드 메뉴가 180×427px 단일열로 길어진다.
- 다크 모드는 남색 면이 겹쳐 흔한 AI 대시보드 인상이 강하고 접힌 세션 표시는 한 글자로 의미를 잃는다.
- 상세 증거와 0.9 진입 조건: `output/playwright/ui-0.8.2-visual-review.json`.
- 여정 그래프를 경로 레일형으로 개편했다. 작업명 우선 좌측 정렬, 작은 보조 상태, 직교 분기선, 평평한 중립 캔버스를 사용하고 기존 드래그·키보드·확대·정렬 계약은 유지한다. 520px 이하에서는 세로 레일로 바꾸고 wide·compact 배치 저장을 분리한다.
- 플랜 탭에서는 큰 세션 제목과 갱신 문구를 숨겨 작업 높이를 회수하고, Electron 200% 배율에서도 5열이 sidebar 오른쪽 폭 안에 모두 보이게 했다.
- 노트는 바깥 창 760px가 아니라 사이드바 뒤 실제 pane 폭을 기준으로 재구성한다. content-box 840px 이하에서는 목록을 위로 올려 편집기를 전체 폭으로 확보한다.
- 노트 활성 시 패널·내부 레이아웃·편집기가 앱의 남은 세로 높이를 이어받아 창 중간에서 끝나지 않게 했다.
- 공통 노트를 `olchipanel.memo.v4`로 확장해 하위 페이지·접기 상태를 보존한다. 기존 평면 페이지는 루트로 그대로 읽고, 잘못된 부모·자기 참조·순환은 페이지를 삭제하지 않고 루트로 안전하게 푼다.
- 노트 본문 최상위 요소를 블록 단위로 보고 끌기·위/아래 버튼·Alt+화살표로 순서를 바꾼다. `/페이지`와 행 메뉴에서 현재 페이지 아래 하위 페이지를 만들 수 있다.
- 1440×900에서는 오른쪽 세로 트리, 960×760에서는 위쪽의 짧은 세로 트리로 재구성했다. 두 화면 모두 문서 가로 넘침 0, 패널 하단 여백 32px를 실측했다.
- 최신 Mark 방향에 따라 공통 `노트`를 상단의 얇은 탭으로 옮겼다. 세션 목록은 투명 배경·0px 라운드·무그림자 행으로 평평하게 만들고, 1440×900과 960×760에서 가로 넘침 0을 다시 확인했다.

### 2026-09-07 공간 활용 복구

- 모든 최상위 화면과 첫 실행 안내가 남은 viewport 높이를 사용하고, 긴 내용은 화면 중앙을 늘리거나 자르지 않고 해당 pane 안에서 스크롤하도록 통일했다.
- Plan iframe은 카드 전체 높이만큼 바깥 문서를 늘리지 않고 보드가 세로 스크롤을 소유한다. 761~1100px Plan에서는 저장된 사용자 설정을 바꾸지 않은 채 사이드바만 임시로 접어 5열을 모두 확보하고, 다른 화면이나 넓은 폭으로 돌아오면 이전 상태를 복원한다.
- 새 viewer와 Windows PWA를 다시 열어 1440×900, 960×600, 390×844에서 문서 가로·세로 넘침 0, Plan 5열 가시성 또는 모바일 보드 내부 스크롤, Situation·Request·Record·Note의 내부 높이 사용을 확인했다. 증거: `output/playwright/olchipanel-space-utilization-review-20260907.json`.

## [0.8.2](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.8.1...olchipanel-v0.8.2) (2026-08-21)


### Bug Fixes

* **ui:** fit plan board without clipping ([b1ed03a](https://github.com/olchilab/olchipanel/commit/b1ed03a77e70656851af0292c32805b3cd2a8ad1))
* **ui:** fit plan board without clipping ([3a4f0ea](https://github.com/olchilab/olchipanel/commit/3a4f0ea04c8e58207d0d91e166826d5bbfba8684))

## [0.8.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.8.0...olchipanel-v0.8.1) (2026-08-20)


### Bug Fixes

* **ui:** sharpen Windows taskbar icon ([39818a8](https://github.com/olchilab/olchipanel/commit/39818a88d133c94b3b3cba148eabc8c7fe06a88d))
* **ui:** sharpen Windows taskbar icon ([fba8096](https://github.com/olchilab/olchipanel/commit/fba8096de095c9f04012dfdd168835dd3db52fd0))

## [0.8.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.7.0...olchipanel-v0.8.0) (2026-08-20)


### Features

* **ui:** add responsive shell and Olchi app icons ([d2fd734](https://github.com/olchilab/olchipanel/commit/d2fd7346b769b4a1a1084c5897817d0e1d0d4cb5))
* **ui:** responsive shell and Olchi app icons ([3c18d29](https://github.com/olchilab/olchipanel/commit/3c18d298ba39d663559426b42a3c9ee2aeb95f55))

## [0.7.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.2...olchipanel-v0.7.0) (2026-07-29)


### Features

* brand tokens, session rename, plan tab, empty-board onboarding ([015c37b](https://github.com/olchilab/olchipanel/commit/015c37b7eab06e492052187d25d1cc9a41b31780))
* Linear/Jira-style plan feature ([f2231e3](https://github.com/olchilab/olchipanel/commit/f2231e312fc21d39d660b14abd670e8298a8cfc9))


### Bug Fixes

* single-port single-instance viewer + auto-archive stale sessions ([44e8685](https://github.com/olchilab/olchipanel/commit/44e86851d8d0d4561e56c37a5f8b129a37426f33))

## [0.6.2](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.1...olchipanel-v0.6.2) (2026-07-28)


### Bug Fixes

* auto-open opens one window per board (was one per connected agent) ([9aa92cc](https://github.com/olchilab/olchipanel/commit/9aa92ccb3ecebd6399af0c0bd2a418c90bc68339))

## [0.6.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.6.0...olchipanel-v0.6.1) (2026-07-28)


### Bug Fixes

* hide idle-fold line when sidebar collapsed; dedicated Chrome app profile ([5600d87](https://github.com/olchilab/olchipanel/commit/5600d87c9aae5b10b751a58e0ced8038c97675bd))

## [0.6.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.5.0...olchipanel-v0.6.0) (2026-07-28)


### Features

* per-panel memo tab + fold idle panels + app-window without address bar + ChatGPT chat/work verdict ([dae136a](https://github.com/olchilab/olchipanel/commit/dae136af032f483ca2b757169540a16ae85eb2ee))

## [0.5.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.4.0...olchipanel-v0.5.0) (2026-07-28)


### Features

* memo drawer + olchipanel stop + honest quitting guidance ([c5a42e2](https://github.com/olchilab/olchipanel/commit/c5a42e238dffb4689c000be8955b9ff53f968976))


### Bug Fixes

* friend-pilot polish — batch newlines, READY line, path hint, ENOTCACHED note ([0b47ba8](https://github.com/olchilab/olchipanel/commit/0b47ba8c738f96675c3a3b660feba1dba2be3ea5))

## [0.4.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.3.0...olchipanel-v0.4.0) (2026-07-27)


### Features

* laptop-pilot batch — [@latest](https://github.com/latest) auto-update, update chip, star ask, now semantics, batch add_step, Windows field notes ([2c5b0c4](https://github.com/olchilab/olchipanel/commit/2c5b0c4274adf237d322b7c9d84ea9b5fe6d2db4))


### Performance Improvements

* background devices armed only in the bind-winning process ([ccf8ad6](https://github.com/olchilab/olchipanel/commit/ccf8ad6ab91cb3e4b2ded85071a7b4191ddaec37))

## [0.3.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.2.0...olchipanel-v0.3.0) (2026-07-27)


### Features

* archive button in the main view ([9dcc7c2](https://github.com/olchilab/olchipanel/commit/9dcc7c21cb5b439f5e2815c97b6629f8ab0b54f2))
* stale-live state — alive but silent 30m+ gets marked and becomes archivable ([7004780](https://github.com/olchilab/olchipanel/commit/7004780d7ff6daff37335c789d29fb7474d2fa1c))


### Bug Fixes

* adopting open no longer lingers as a zombie process + ping timeout 900ms-&gt;2s ([624bb5f](https://github.com/olchilab/olchipanel/commit/624bb5f20ec3350f0bf6dd765e5071286d86d719))
* bootstrap one-liner wraps; session name follows the conversation title via name_session contract ([d10c10a](https://github.com/olchilab/olchipanel/commit/d10c10a5689c52edbe1518c30d79e83b7229d9a8))

## [0.2.0](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.1.1...olchipanel-v0.2.0) (2026-07-25)


### Features

* titlebar melts into the app — theme-color meta + installable PWA manifest ([90cd538](https://github.com/olchilab/olchipanel/commit/90cd538f287e7d30210256626ddf87f625efaa62))
* uninitialized-board state + optional stable workspace key (issue [#3](https://github.com/olchilab/olchipanel/issues/3), items 2 & 3) ([00cc1a8](https://github.com/olchilab/olchipanel/commit/00cc1a8705c7f502de9364513ba1f04f0795ea1e))


### Bug Fixes

* viewer discovery self-heals + no duplicate viewers + true server version (issue [#3](https://github.com/olchilab/olchipanel/issues/3), items 1 & 4) ([534fd4a](https://github.com/olchilab/olchipanel/commit/534fd4a531deca557f42031412c7c9e5f53380d7))

## [0.1.1](https://github.com/olchilab/olchipanel/compare/olchipanel-v0.1.0...olchipanel-v0.1.1) (2026-07-25)


### Bug Fixes

* npm pkg fix — bin path without ./ (npm was stripping the bin entry on publish) ([4ef7777](https://github.com/olchilab/olchipanel/commit/4ef7777cda515e1b8c8691d01a2296e94e2c5e74))

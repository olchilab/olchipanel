# OlchiPanel — UI_CORE 적용 판단 기록

근거 정본: `C:/OlchiProjects/olchilab-business-homepage/UI_CORE.md` + `BRAND_COLOR_TOKENS.md`
적용자: `Master_D_Fable` · 2026-07-29 · Mark 지시("좋은 기술 선별→목적 적합성 검수하며 적용→확인, 하나 찾고 멈추지 말 것")

## user_outcome
사람이 로컬 상황판에서 ①에이전트들이 지금 뭘 하는지 ②플랜의 상태·우선순위·담당을 한눈에 판단한다.

## primary_capability (선별 결과)
- **Operations Workspace** — 올치패널의 정체 그 자체(진행 보드·세션 패널). 지라 흉내가 아니라 같은 업무 원본에서 파생. named 액션(클릭=상태 전진)·drag-only 금지·현재값을 추세로 표시 안 함을 준수.
- **Olchi Visual Composition** — 전 UI 항상 적용. 읽기 순서(세션→목표→탭→트리 / 플랜선택→열→카드)·계층·정렬·정보 예산.
- **control-feedback**(절제) — 내부 도구 보조 액션(탭·버튼)의 hover/focus 동일 결과.

## 제외한 기술군과 이유 (avoid_when = 핵심 운영 UI)
text-motion · gallery-transition · image-inspection · raster-reveal · ambient-background · spatial-feedback · spatial-navigation · pointer-interaction · readable-label-feedback · ambient-decoration — 전부 마케팅·레퍼런스·프레젠테이션 표면용. 상황판은 필수 정보·핵심 컨트롤·상시 화면이라 이 효과들의 `avoid_when`(필수 메뉴·핵심 CTA·drag-only·자동재생·장식이 결과보다 앞섬)에 정면으로 걸린다. "좋아 보인다"는 이유로 붙이지 않는다.

## brand_color_contract
고정 역할 토큰만 사용, 임의 hue 0. Deep Navy=구조/대기, Active Teal=선택·활성·라이브·세션 링크, Sensor Lime=제한적 실행 신호(진행 상태점), Warm Paper=기본 배경, Graphite=본문, Safety Orange=긴급(경고에만). 구 보라(#5b5bd6) 팔레트 전량 교체. light/dark 두 테마 remap.

## 적용 범위
- 플랜 보드(`public/plan.html`) 신규를 브랜드 계약으로 제작.
- 상황판 SPA(`public/index.html`) `:root` 토큰 remap으로 전체 통일(구조 무변경, 색만).

## visual_checks (screenshot 검수)
- 플랜 보드: Warm Paper 배경·상태별 점(진행=Lime/완료=Teal)·우선순위 색(긴급=Orange·높음=Teal)·세션 담당 뱃지(Teal). 읽기 순서 명확. ✓
- 상황판 SPA: Teal 브랜드 마크·활성 탭·라이브 점, 목표바 Teal 강조, Graphite 본문. 플랜 보드와 통일. ✓
- desktop 뷰포트 확인. narrow/mobile·reduced-motion은 후속 P1에서 재검.

## consumer_checks
- keyboard: 기존 SPA 키보드 유지, 플랜 보드는 P1에서 키보드 추가 예정(현재 클릭 기반).
- CSRF/loopback: 쓰기 라우트 모두 sameOrigin 가드.
- 성능: CSS 변수 remap이라 무비용.

## decision
**적용(applied)** — 두 화면 실제 소비 + screenshot 검수 완료. 단 독립 검수(다른 뇌) 전이라 `promoted` 아님, `self_review_complete`로 기록. 되돌리기=git revert. 유지보수 owner=olchipanel 담당.

## 다음
P1(키보드·인라인 편집·narrow/mobile 검수), 필요 시 control-feedback 세부 적용.

## 데스크톱 플랜 폭 계약

- 플랜은 OlchiPanel의 운영 보드이므로 글 중심 탭의 `max-width`를 상속하지 않고 세션 레일 오른쪽 가용 폭 전체를 사용한다.
- 5열을 좁은 컨테이너에 압축해 단순히 모두 보이게 한 상태는 PASS가 아니다. 각 열이 실사용 가능한 폭을 가져야 한다.
- 실제 렌더 검수는 `workspace` 오른쪽 경계가 viewport에 닿고, document·plan iframe·board 각각 `scrollWidth === clientWidth`이며, 중간 또는 하단 가로 스크롤바가 없는지를 함께 확인한다.
- 이 폭 해제는 플랜 보기에만 적용한다. 지도·스택·변경·결정·요청·막힌 길·노트의 읽기 폭은 유지한다.

## 2026-08-20 P1 업그레이드

- `user_outcome`: 데스크톱과 390px 화면 모두에서 세션→목표→탭→현재 내용을 같은 읽기 순서로 판단한다.
- `primary_capability`: Operations Workspace + Olchi Visual Composition. 마케팅 모션·장식 기술은 계속 제외한다.
- `fit`: 기존 고정 레일이 좁은 화면의 본문 폭을 소진해 한글이 글자 단위로 찢어졌다. 모바일 상단 도구바와 세션 서랍, 가로 탐색 탭, 1열 플랜 보드가 이 실패를 직접 닫는다.
- `maturity_and_rights`: 프로젝트 내부 UI Core 계약의 독립 적용이며 외부 레이아웃·asset을 복사하지 않았다.
- `brand_color_contract`: 기존 Navy/Teal/Lime/Paper/Graphite/Orange 역할을 유지하고 새 hue를 추가하지 않았다.
- `composition_note`: desktop=세션 레일→목표→탭→패널, mobile=도구바→목표→가로 탭→패널. 화면당 정보 예산과 카드 필드는 유지한다.
- `consumer_checks`: 탭 Arrow/Home/End, 세션 Alt+Arrow 재정렬, Escape 서랍 닫기, named click, `prefers-reduced-motion` 대안을 적용했다.
- `visual_checks`: 1440×1000과 390×844 실제 렌더링 PASS. 390px에서 문서 scrollWidth=390, 목표 폭=362이며 clipping·한글 세로 찢김이 없다. 플랜 1열, 세션 서랍, 2px 키보드 포커스, reduced-motion 0.01ms 대안도 확인했다.
- `decision`: 적용. 구현자 자기검수 단계이며 독립 인수는 별도다.

## 2026-08-29 상단 정보 구조 단순화

- `user_outcome`: 사용자가 탭 이름을 해석하는 시간을 줄이고, 현재 상황·실행 플랜·응답 필요·과거 기록·자유 메모 중 원하는 작업군으로 바로 이동한다.
- `composition_note`: 상위 탭은 상황·플랜·요청·기록·메모 5개만 둔다. 지도·스택은 상황의 내부 보기, 변경·결정·막힌 길은 기록의 내부 보기다. 즉시 행동이 필요한 플랜과 요청은 상위 접근성을 유지한다.
- `consumer_checks`: 예전 저장 값(map/stack/changes/dec/deadends)을 새 상위 그룹과 내부 보기로 이관하고, 상위·내부 탭 모두 Arrow/Home/End, focus, selected, hidden 계약을 지킨다.
- `visual_checks`: 설치 PWA 데스크톱에서 상위 5개와 두 내부 그룹을 직접 전환했고, 390×844 렌더에서 5개 상위 탭이 한 줄에 들어가는 것을 확인했다.
- `decision`: 적용. 정보 구조만 재배치하며 데이터·API·플랜 전체 폭 계약은 바꾸지 않는다.

## 2026-09-02 세로 사이드바와 공통 노트

- `user_outcome`: 세션을 먼저 고른 뒤 같은 자리에서 상황·플랜·요청·기록으로 이동하며, 노트는 어떤 세션에서도 같은 내용을 본다.
- `composition_note`: 상단 작업 탭을 제거한다. 세션 목록 아래의 고정 세로 메뉴에 세션 보기 4개를 두고, 선으로 분리한 공통 영역에 노트 1개를 둔다.
- `state_contract`: 노트 UI는 고정 범위 `common`만 읽고 쓴다. 기존 `memo-<session>.json`은 이관·삭제·덮어쓰기하지 않는다. MCP는 `note_read`로 공통 노트를 읽기만 한다.
- `responsive`: 데스크톱은 평평한 세로 행, 접힌 레일은 아이콘, 760px 이하는 세션과 메뉴를 합친 한 드로어를 사용한다.
- `consumer_checks`: 세로 메뉴는 ArrowUp/ArrowDown/Home/End와 ARIA vertical tablist를 제공하며, 플랜 전체 폭과 내부 보기 키보드 계약은 유지한다.
- `visual_checks`: Electron 200% 배율의 2880×1920 실제 창에서 세로 메뉴, 공통 노트, 플랜 5열과 무가로잘림을 확인했다.
- `note_width_gate`: 넓은 화면과 모바일만 확인하지 않는다. 1440·1201·1180·960·760·390에서 실제 pane content-box, editor/list rect, `clientWidth/scrollWidth`를 함께 재고 2열 편집기는 520px 이상이어야 한다.
- `decision`: 적용. 브리프=`output/design/olchipanel-sidebar-navigation-v1.md`.

## 2026-09-02 상단 공통 노트와 평평한 세션 목록

- `latest_direction`: 위의 공통 노트 위치만 최신 Mark 요청으로 대체한다. 현재 세션 보기 4개는 세로 사이드바에 유지하고, 세션과 무관한 `노트`는 작업영역 상단의 얇은 탭으로 둔다.
- `session_list`: 세션 행에서 둥근 카드, 선택 배경, 그림자, 굵고 둥근 왼쪽 막대를 쓰지 않는다. 공급자와 갱신 정보는 보조 글자로 남기고 선택은 제목 굵기와 2×10px 각진 표식으로만 구분한다.
- `responsive`: 1440×900에서는 노트 트리를 오른쪽에, 960×760에서는 위에 두며 두 폭 모두 문서 가로 넘침이 없어야 한다.
- `keyboard`: 세로 세션 보기에는 ArrowUp/ArrowDown, 상단 노트 탭에는 ArrowLeft/ArrowRight를 적용하고 Home/End 계약을 함께 유지한다.
- `decision`: 적용. 브리프=`output/design/olchipanel-top-note-flat-sessions-v1.md`.

## 2026-08-31 여정 그래프 흡수

- `source_fit`: [Gravity UI Graph](https://github.com/gravity-ui/graph)의 노드·간선과 카메라 상호작용을 참고했다. 외부 코드는 복사하지 않고, OlchiPanel의 작은 정적 여정에는 기존 무빌드·무의존 구조를 유지하는 SVG 구현이 더 적합하다고 판단했다.
- `state_contract`: 에이전트가 기록한 `map.tree`가 상태·구조의 유일한 정본이다. 그래프는 같은 데이터를 그리는 보기이며, 사람이 조정한 노드 위치만 세션별 `localStorage`에 저장한다.
- `interaction`: 지도 안에서 트리/그래프를 전환한다. 빈 곳 드래그 이동, 포인터 중심 휠 확대, 맞춤, 자동 정렬, 노드 드래그와 키보드 화살표 이동을 제공한다.
- `responsive`: 뷰포트 크기가 바뀌면 그래프를 다시 맞춘다. 1440×1000과 390×844에서 문서 및 그래프 viewport의 `scrollWidth === clientWidth`를 확인했다.
- `accessibility`: 그래프 viewport와 각 노드는 키보드로 접근 가능하고, 노드는 상태·분기·레이블을 합친 이름을 노출한다. 데이터가 있을 때 빈 상태 안내는 렌더와 접근성 트리 모두에서 숨긴다.
- `visual_checks`: 밝은/어두운 테마, 9개 노드·8개 연결, 확대 64→77%, 노드 이동의 로컬 저장, 정렬 시 레이아웃 복구를 실제 브라우저에서 확인했다. 증거=`output/playwright/journey-graph-desktop.png`, `journey-graph-mobile.png`, `journey-graph-dark.png`.
- `decision`: 적용. 상단 탭은 늘리지 않고 상황→지도 내부 보기로 둔다. 완전한 다이어그램 편집기나 상태 변경 기능은 이번 범위에 포함하지 않는다.

## 2026-09-01 여정 그래프 시각 정본 고도화

- `visual_authority`: ImageGen 경로 레일형을 선택했다. 정본=`output/design/olchipanel-journey-route-rail-v1.png`, brief=`output/design/olchipanel-journey-route-rail-v1.md`.
- `hierarchy`: 작업명을 좌측 정렬 1차 정보로, 상태를 레일 위 작은 2차 정보로 둔다. 동일 라운드 카드·그림자·중앙 정렬 상태 위계를 제거한다.
- `routing`: 루트 한 점에서 뒤엉키던 곡선을 깊이별 직교 spine과 가로 작업 레일로 바꾼다.
- `theme`: 그래프 캔버스는 라이트·다크 모두 중립색을 쓰고 현재 경로에만 OlchiPanel 청록색을 제한한다.
- `state_contract`: `map.tree` 정본과 기존 조작은 유지한다. 새 기하에는 `localStorage` v3 키를 사용해 예전 카드형 저장 좌표만 분리한다.

## 2026-09-02 노트 페이지 트리와 블록 이동

- `user_outcome`: 긴 노트를 한 문서에 몰아넣지 않고 부모·자식 페이지로 나누며, 본문 순서를 다시 쓰지 않고 블록째 옮긴다.
- `state_contract`: `olchipanel.memo.v4`의 `parentId`와 `collapsed`만 추가한다. 기존 HTML 본문과 v3 평면 페이지는 보존하고, 잘못된 계층은 삭제 없이 루트로 푼다.
- `composition_note`: 넓은 화면은 편집기 오른쪽 세로 트리, 중간 폭은 편집기 위의 높이 제한 세로 트리를 쓴다. 계층을 가로 카드로 바꾸지 않는다. 페이지 작업은 제목을 덮는 다중 버튼 대신 `⋯` 메뉴에서 연다.
- `interaction`: 경로 탐색, 트리 접기/펼치기, 행 메뉴와 `/페이지` 하위 생성, 블록 끌기·버튼·Alt+화살표 이동을 제공한다.
- `visual_checks`: 1440×900과 960×760에서 3단계 트리, 블록 두 개, 문서 가로 넘침 0, 패널 하단 여백 32px를 확인했다.
- `decision`: 첫 사용 가능 골격으로 적용. 외부 편집기 의존성이나 Notion 시각 복제는 포함하지 않는다.

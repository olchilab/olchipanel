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
- 이 폭 해제는 플랜 탭에만 적용한다. 지도·스택·변경·결정·요청·막힌 길·메모의 읽기 폭은 유지한다.

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

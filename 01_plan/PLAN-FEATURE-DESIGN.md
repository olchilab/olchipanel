# OlchiPanel 플랜 페이지 설계 (Linear/Jira 경량형)

작성: 2026-07-29 · 오너: `Master_D_Fable` · 상태: **설계 draft**(Mark 지시 "지라/리니어 경량형 플랜 페이지+API, 경량 구현 가능하게 꼼꼼히 설계")
전제: olchipanel = 제로 의존성 Node(http+fs) · JSON 파일 저장 · 단일 뷰어가 포트 보유+SPA+`/api/*` · loopback+CSRF. **이 결을 절대 벗어나지 않는다**(DB·프레임워크·빌드체인 도입 금지).

## 0. 한 문장

에이전트가 일하며 스스로 갱신하고 사람이 Linear처럼 한눈에 보는 **경량 플랜 보드**를, 기존 세션 상황판 옆 탭으로 넣는다. 저장=JSON 파일, API=뷰어에 REST 몇 개, 에이전트 쓰기=MCP 툴, 라이브=기존 dir-watch/SSE 재사용.

## 1. 왜 이 형태인가 (Linear/Jira에서 취한 것·버린 것)

- **취함**: ①상태 워크플로우(backlog→todo→in_progress→done/canceled) ②우선순위 5단(none~urgent) ③계층(parent로 Initiative>Epic>Task, 중첩 저장 아님 — Linear식 parent 참조) ④칸반+리스트 두 뷰 ⑤키보드 우선 UX ⑥manual order(상태 내 수동 정렬).
- **버림(경량 위해)**: 워크플로우 커스터마이즈·사이클/스프린트·SLA·자동화 룰·권한 모델·코멘트 스레드. v1은 고정 워크플로우.
- **olchipanel 고유 차별**: 항목이 **에이전트 세션과 링크**된다 — 항목을 그 일을 한 세션(panel)에 연결해, 보드에서 "이 태스크=저 에이전트가 지금 함"이 보인다. 이게 지라/리니어에 없는, olchipanel 논지(에이전트 자기서술)와 맞는 지점.

## 2. 데이터 모델

**저장 위치**: `~/.olchipanel/plans/<planId>.json` — 세션 파일과 같은 규약(원자적 전체 쓰기, 파일 하나=플랜 하나). 동시 쓰기 낮음(사람 1 + 에이전트 소수)이라 per-item 파일 불요.

```
plan = {
  schema: "olchipanel.plan.v1",
  id: "<14자리 타임스탬프-rand>",     // 세션 id 규약 재사용
  title: "...",
  version: 7,                          // 낙관적 동시성: 매 mutation +1
  updated: "<iso>",
  states: ["backlog","todo","in_progress","done","canceled"],  // v1 고정
  items: [ item, ... ]
}
item = {
  id: "itm_<8>",
  title: "...",
  status: "todo",                      // states 중 하나
  priority: 0,                         // 0 none / 1 low / 2 med / 3 high / 4 urgent
  parent: null | "itm_..",             // 계층(2~3레벨 권장, 순환 금지 검증)
  order: 1024,                         // 상태 열 내 정렬(sparse — 재정렬 시 중간값)
  labels: ["..."],                     // 소문자 kebab, v1 표시만
  session: null | "<session id>",      // ★ 에이전트 세션 링크(olchipanel 고유)
  note: "",                            // 본문(짧게)
  created: "<iso>", updated: "<iso>"
}
```

**id 생성**: `itm_` + crypto.randomBytes(4).hex — 충돌 사실상 0, 파일명 안전. 순수 core(`crypto`)만.

**불변식(서버 검증)**: ①status ∈ states ②priority ∈ 0..4 ③parent가 실재+자기참조/순환 금지(DFS 1회) ④title 1~200자 ⑤version 일치(stale write 거부). 위반=400, 값 안 삼킴.

## 3. API — 사람용 REST (뷰어에 추가, loopback+CSRF 기존 가드 재사용)

기존 `/api/memo`·`/api/archive`와 같은 스타일. **쓰기 전부 `sameOriginOk` 통과 필수**(CSRF). 응답=JSON, `Cache-Control: no-store`.

| 메서드·경로 | 용도 | 본문/쿼리 | 반환 |
|---|---|---|---|
| `GET /api/plans` | 플랜 요약 목록 | — | `[{id,title,updated,counts:{status:n}}]` |
| `POST /api/plans` | 플랜 생성 | `{title}` | `{id}` |
| `GET /api/plan?id=` | 플랜 전체 | — | `plan` |
| `POST /api/plan/item?plan=` | 항목 생성 | `{title,status?,priority?,parent?,session?}` | `{id,version}` |
| `PATCH /api/plan/item?plan=&id=` | 항목 수정 | `{baseVersion, patch:{status?/priority?/title?/parent?/order?/note?/labels?}}` | `{version}` 또는 409(stale) |
| `DELETE /api/plan/item?plan=&id=` | 항목 삭제 | `{baseVersion}` | `{version}` |

- **낙관적 동시성**: 클라이언트가 읽은 `version`을 `baseVersion`으로 보냄. 서버 version과 다르면 **409 stale**(덮어쓰기 금지 — 비밀값 게이트에서 배운 index-bound 규율의 축소판). 클라이언트는 재조회 후 재시도.
- **원자 쓰기**: `state.js`의 세션 원자 쓰기 헬퍼 재사용(tmp+rename). 매 mutation은 plan 파일 전체를 version+1로 rename 교체.
- **엔드포인트 수 절제**: 6개. 필요하면 PATCH 하나로 대부분 흡수(status만 바꾸는 것도 PATCH). 별도 `/status` 같은 편의 엔드포인트 안 만듦.

## 4. API — 에이전트용 MCP 툴 (killer 통합)

olchipanel은 agent-agnostic MCP다. 에이전트가 일하며 플랜을 갱신 → 사람이 라이브로 봄. 기존 `set_goal`·`log_change` 옆에 추가:

| 툴 | 인자 | 동작 |
|---|---|---|
| `plan_open` | `{title?}` | 현재 세션의 활성 플랜 확보(없으면 생성), plan id 반환 |
| `plan_add` | `{title, parent?, priority?}` | 항목 추가, **현재 세션 자동 링크**(item.session=내 세션) |
| `plan_set` | `{id, status?, priority?, note?}` | 항목 갱신(server-side baseVersion 자동) |
| `plan_list` | `{status?}` | 내 플랜 항목 조회(에이전트가 다음 할 일 확인) |

- 에이전트 경로는 CSRF 무관(로컬 stdio MCP). 단 같은 불변식·원자쓰기·version을 공유(사람 REST와 같은 코어 함수 `plan_mutate()` 호출 — 이중 구현 금지).
- 자동 링크로 보드에서 "이 항목=이 에이전트가 지금"이 성립. 세션 죽으면 항목은 남고 링크만 dangling 표시(세션 alive 오버레이 재사용).

## 5. 프론트엔드 (public/index.html에 탭 추가, 바닐라 JS·프레임워크 0)

- **새 탭 "Plans"**: 기존 세션 사이드바 옆. 상단=플랜 선택 드롭다운+새 플랜.
- **칸반 뷰(기본)**: 상태별 열(backlog|todo|in_progress|done|canceled), 카드=제목+우선순위 점+세션 링크 뱃지. 카드 클릭=상태 순환(빠른 진행), 더블클릭=인라인 편집. 드래그=P2.
- **리스트 뷰(토글)**: parent 들여쓰기 트리, 우선순위 정렬. Linear의 밀도 높은 리스트.
- **키보드(P1)**: `c` 새 항목 · `1~4` 우선순위 · `x` 상태 전진 · `/` 검색. Linear 감성.
- **라이브**: 기존 SSE(`/api/state` dir-watch)에 `plans/` watch 추가 → 플랜 변경 push. 에이전트가 `plan_set` 하면 사람 화면 즉시 갱신.
- **테마/스타일**: 기존 벤더색·다크 팔레트 재사용, 새 CSS 최소.

## 6. 경량 구현 로드맵 (단계별, 각 단계 독립 배포 가능)

- **P0 — 저장+REST+보드 ✅ 배포됨(dev 640a9e7/public 723fa56)**: `src/plan.js`(모델·불변식·원자쓰기·plan_mutate 코어·optimistic version) + 뷰어 6 REST 라우트(loopback+CSRF·stale 409) + 자기완결 칸반 `/plan`(세션 SPA 무접촉). 회귀: plan.test 19/19(불변식·version·순환)·plan_api 10/10(REST e2e·CSRF·stale).
- **P2 — 에이전트 MCP 툴 ✅ 배포됨(dev 9941984/public ce2298f)**: `plan_open/add/set/list`, 항목 세션 자동 링크, 사람은 /plan에서 라이브. 회귀 plan_mcp 7/7(stdio JSON-RPC→저장소 진실). ★agent-agnostic 자기서술=지라/리니어 대비 차별.
- **P1 — 사람 쓰기 UX(다음)**: 인라인 편집·키보드(c/1~4/x)·드래그 정렬. 현재 보드는 클릭=상태전진·+추가로 최소 쓰기 가능.
- **P3 — 폴리시**: 라벨·필터·리스트 트리뷰·세션 SPA 탭 통합.

각 단계는 conventional commit(feat:)로 release-please 태움 → Mark 머지=배포.

## 7. 안전·경계

- 저장은 로컬 `~/.olchipanel/plans/`만. 외부 전송·동기화 0(olchipanel 원칙).
- 쓰기 CSRF·loopback·host 가드는 기존 코드 재사용(새 우회면 안 만듦).
- version stale=409, 값·비밀 안 담음(플랜은 업무 메타지 비밀 저장소 아님 — secret-custody와 분리).
- olchipanel 논지 유지: 에이전트 자기서술의 연장이지 범용 PM 도구로 팽창하지 않는다(버린 것 목록 §1 준수).

## 8. 미결(Mark 확인 후 확정)

1. **플랜 범위**: 머신 전역 다중 플랜인가, 세션/workspace당 1플랜인가? (권고=다중 플랜, 항목이 세션에 링크 — 유연)
2. **계층 깊이**: 2레벨(Epic>Task)로 고정인가 3레벨(Initiative>Epic>Task)까지인가? (권고=parent 무제한이되 UI는 2레벨 들여쓰기, 깊이는 데이터가 허용)
3. **OlchiTeams 지라 연동**: 이 플랜을 올치팀즈 지라/plans-v0와 동기화할 것인가, olchipanel 독립인가? (권고=v1 독립, 동기화는 별도 축 — 범위 팽창 방지)

# OlchiPanel 여정 그래프 UI brief

- 모드: production
- 시각 정본: `output/design/olchipanel-journey-route-rail-v1.png`
- 선택: ImageGen B안 경로 레일형. A안의 얇은 조작 경계는 hover·focus에서만 사용한다.
- 사용자 순간: Mark가 데스크톱 패널에서 세션의 작업 순서와 현재 위치를 짧은 시간 안에 훑는다.
- 핵심 행동: 트리/그래프 전환, 전체 맞춤, 확대·이동, 노드 위치 조정, 자동 정렬.

## 방향

- 피함: 상태가 제목 위에 오는 중앙 정렬 카드, 반복 라운드 박스와 그림자, 한 점에서 뒤엉키는 곡선, 넓은 남색 면, 장식용 상태점.
- 선호: 좌측 정렬 작업명, 작은 2차 상태, 직교 연결선과 행 레일, 평평한 중립 표면, 현재 경로에만 제한한 청록색.
- 예외: 드래그·키보드 조작의 hit area는 노드 전체로 유지하되 평소에는 보이지 않고 hover·focus에서만 얇게 드러낸다.
- 상태 계약: `map.tree`가 구조와 상태의 정본이다. 위치와 카메라만 세션별 localStorage에 저장한다.

## 완료 기준

- 작업명이 상태보다 먼저 읽히며 모든 노드 제목이 좌측 정렬된다.
- 연결선은 직교 경로로 분기되고 루트의 곡선 묶음이 사라진다.
- 라이트·다크에서 카드 그림자와 넓은 남색 그래프 면이 없다.
- desktop과 720px narrow, 390px mobile에서 제목 겹침·클리핑·문서 가로 넘침이 없다.
- 520px 이하에서는 같은 상태 트리를 세로 레일로 재배치하고 wide·compact 로컬 좌표를 분리한다.
- 노드 드래그, 화살표 키 이동, 확대, 맞춤, 자동 정렬, 저장 좌표가 유지된다.
- reduced-motion에서 불필요한 전환이 제거된다.

## ImageGen prompt

Use case: ui-mockup. Redesign the OlchiPanel journey graph as a route rail work map. Put Korean task names first and left-aligned, statuses as quiet secondary text, use flat neutral surfaces, restrained teal only for the current route, disciplined horizontal rows and orthogonal branching. Preserve zoom, fit, arrange and drag affordances. Avoid centered rounded cards, shadows, navy AI-dashboard panels, status pills or dots, card-in-card composition, tangled curves, gradients, glassmorphism and decorative avatars.

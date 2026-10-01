# 공개 데모와 내부 스킬 경계

2026-09-20 Mark 명시: 상황 그래프 항목에서 공통 노트의 특정 페이지로 연결하는 기능은 데모에만 구현한다. 앱 원본으로 승격하지 않는다. 내부 스킬은 GitHub 공개 배포에 포함하지 않는다. 대회 제출은 사용자의 중단 요청 이후 계속 보류한다.

- 데모 코드: `tools/championship/note-links.js`, 생성 연결은 `tools/build-championship-demo.cjs`. 연결 선택·저장·해제, 특정 페이지 편집, 기존 그래프 위치로 복귀. 방문 단위 저장이며 새 방문은 초기화한다. 실제 AI/MCP 노트 연결 계약을 구현했다는 뜻이 아니다.
- 원본 앱의 `public/index.html`, `public/plan.html`, MCP·state·viewer, package.json, Electron 패키지 설정은 이 변경에서 수정하지 않았다. 해시 비교 증거는 `output/playwright/note-links/app-before.json`.
- `skills/`, `.agents/skills/`, `.claude/skills/`, `.codex/skills/`는 `.gitignore`로 공개 Git 추적에서 제외한다. 확인 당시 해당 경로의 Git 추적 파일은 0개다. `git add -f`나 전체 디렉터리 직접 업로드로 우회하지 않는다.
- GitHub `olchilab/olchipanel`의 현재 공개 main `fd38cdbc2e81cd1603e9a4dc14a955aec3bea4d4` 재귀 트리에서 스킬 경로는 0개. 이는 현재 main 확인이며 모든 과거 커밋·태그·릴리스 첨부 검사 완료를 뜻하지 않는다.
- 로컬 npm/설치 패키지는 현재 내부 스킬을 포함한다. 내부 개발·실행을 위해 유지하되 이 상태의 tgz/exe/asar를 외부에 올리지 않는다. npm 공개 workflow에 `tools/check-public-package.cjs` 재고 검사를 추가해 내부 스킬 포함 시 게시를 차단한다. 원격 workflow에는 아직 반영하지 않았다.
- 공개용 파일 묶음은 `node tools/build-championship-demo.cjs` → `node tools/prepare-public-demo.cjs`. `output/github-demo-public/`에는 명시한 정적 자산 18개와 공개 README·파일 해시 목록만 포함한다. 내부 스킬·MCP 서버·앱 설치 파일·로컬 작업 문서는 복사하지 않는다. 예상하지 않은 파일·심볼릭 링크가 있으면 중단한다.
- 제출 설명 추가: “상황 그래프 항목에 공통 노트의 특정 페이지를 연결해 열고 돌아오는 흐름은 웹 데모 전용 미리보기입니다. 설치 앱의 제공 기능과 구분합니다.”

현재 검수와 공개 반영 여부는 STATE.md 최신 항목을 따른다. GitHub/npm/설치 배포와 대회 제출을 이 문서 작성만으로 실행하지 않는다.

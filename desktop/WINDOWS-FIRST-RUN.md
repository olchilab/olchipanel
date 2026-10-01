# Windows 첫 실행·MCP 등록

범위: Windows x64 설치본, Codex와 Claude Code. macOS·WSL·Claude 일반 채팅 앱은 이번 대상에서 제외한다. 현재 외부 배포 요청은 없다.

1. NSIS 설치 후 OlchiPanel을 처음 실행하면 Windows 기본 확인창에서 Codex / Claude Code / 둘 다 / 나중에를 선택한다.
2. 실제 변경 파일과 실행 파일을 확인하고 **동의하고 등록**을 누를 때만 에이전트 사용자 설정을 쓴다. 기본 선택은 취소다.
3. Codex는 `CODEX_HOME/config.toml`(기본 `~/.codex/config.toml`), Claude Code는 `CLAUDE_CONFIG_DIR/.claude.json`(기본 `~/.claude.json`)을 사용한다. 다른 설정은 보존한다. 기존 파일 백업은 원본 옆 `*.olchipanel-backup-*`이며 계정 정보가 포함될 수 있으므로 공유하지 않는다.
4. 설치된 `OlchiPanel.exe`와 `resources/app.asar/bin/olchipanel.js`, `ELECTRON_RUN_AS_NODE=1`로 MCP를 실행한다. 이 경로에는 별도 Node/npm 설치가 필요 없다.
5. 에이전트를 완전히 종료하고 다시 실행한 뒤 “이 프로젝트에서 올치패널 시작해”라고 요청한다. `start_project`가 해당 프로젝트의 지침·상세 스킬을 등록한다. MCP 초기 연결만으로 패널은 생성하지 않는다.

나중에·취소 선택은 다시 실행할 때 반복 질문하지 않는다. **Alt → 설정 → 에이전트 연결** 또는 설치된 실행 파일의 `--setup-mcp`로 다시 열 수 있다. 설정 실패는 다음 실행에서 다시 안내한다. 사용자가 직접 추가한 다른 olchipanel 항목은 덮어쓰지 않고 충돌을 알린다. 두 에이전트의 사전 검사가 모두 통과해야 동의창을 열며 쓰기 중 오류는 에이전트별 결과를 보여준다.

등록 완료와 실제 클라이언트 연결 성공은 별도다. 조직 정책·프로젝트별 우선 설정·클라이언트 MCP 승인 때문에 연결이 보류될 수 있다. 업데이트는 같은 설치 경로의 MCP 파일을 사용한다. 설치 위치 변경·앱 제거 후의 오래된 MCP 설정은 자동 삭제하거나 교체하지 않는다.

## 구현·검증 계약

- `desktop/windows-mcp-setup.cjs`: 플랫폼 차단, 선택/동의, 형식 검사, 기존 등록 충돌 차단, 백업, 잠금과 변경 재검사, 파일 교체.
- `desktop/main.cjs`: 패키지 Windows 첫 실행만 자동 안내, 로컬 완료/보류 상태, 재설정 메뉴, 단일 창의 재설정 인수 처리. 표준 `--user-data-dir`로 격리된 앱 검수 가능.
- `src/doctor.js`: 설치본 MCP와 Claude 사용자 설정 인식. 실행 파일 존재 확인은 실제 MCP 핸드셰이크를 대신하지 않는다.
- `npm run test:windows-setup`: 임시 홈에서 실제 파일 저장/재조회, 취소·충돌·동시 변경·중복·오류·Windows 범위·설치본 진단 검증.
- `node test/packaged-mcp.test.cjs <unpacked/OlchiPanel.exe>`: 실제 패키지 실행 엔진과 ASAR 안 MCP의 initialize/tools/list 응답, start_project 발견, 초기 세션 무생성 검증.
- UI 판단: 새 사용자에게 연결 대상이 먼저, 설정 변경 동의가 다음으로 읽히게 한다. 기존 Windows 기본 확인창을 사용하며, 나중에 선택 이후 재진입까지 제공한다. 실제 에이전트 연결·새 PC 설치 검증과 로컬 자동 검증은 구분한다.

공식 계약: [Codex MCP](https://developers.openai.com/codex/mcp), [Claude Code MCP](https://code.claude.com/docs/en/mcp), [Electron 환경 변수](https://www.electronjs.org/docs/latest/api/environment-variables).

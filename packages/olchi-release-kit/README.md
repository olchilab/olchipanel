# Olchi Release Kit

여러 앱에서 재사용하는 릴리스 검수 코어와 Electron 업데이트 어댑터. 첫 적용 제품은 OlchiPanel이다. PhotoStudio 전용 설치 코드와 별개이며, Windows NSIS 설치 파일은 electron-builder가 만든다.

## 다른 제품에 적용

1. 이 폴더에서 `npm pack`으로 만든 tgz를 해당 제품에 `npm install ./olchilab-release-kit-0.1.0.tgz`로 설치한다.
2. 제품의 `release.config.json`에 `schema: "olchi-release.v1"`, 고유 `productId`, 공개 다운로드 위치 `publish`를 지정한다.
3. electron-builder 설정에서 `validateConfig(config).publish`를 사용한다. GitHub는 `{provider:"github",owner:"조직",repo:"저장소"}`, R2/웹서버는 `{provider:"generic",url:"https://다운로드주소/제품/"}`다. 제품별 경로를 분리한다.
4. 설치된 Electron 앱에서 `createUpdateService({updater:require('electron-updater').autoUpdater,enabled:app.isPackaged,onState})`를 만들고 `check()`를 호출한다. Windows `query-session-end`/`session-end`, powerMonitor `shutdown`에서 `deferInstall()`을 호출한다.
5. `olchi-release prepare release.config.json`, 빌드 후 `olchi-release verify release.config.json 배포폴더`로 게시 위치와 버전·해시를 확인한다.

## 동작 계약

- 앱 시작 및 6시간마다 확인. 중복 확인/다운로드 병합. 네트워크 실패는 다음 확인에서 재시도한다.
- 정상적으로 다운로드된 파일만 정상 종료 시 적용한다. 실행 중인 앱을 강제로 종료하지 않는다. 시스템 종료 때 설치하지 않는다.
- 다운로드 검증·서명 검증·설치는 electron-updater가 담당한다. 이 패키지는 임의 EXE 실행기나 자체 암호 검증을 구현하지 않는다.
- 기본 downgrade/prerelease 비활성. 되돌릴 때는 정상 소스를 **더 높은 수정 버전**으로 재출시한다. 자동 롤백 기능은 아직 없다.
- 사용자 데이터 위치는 제품 어댑터가 유지한다. 설치 폴더에 사용자 문서를 저장하지 않는다.
- `onState`는 checking/downloading/ready/current/error를 제공한다. 오류 원문/인증 정보는 UI로 내보내지 않는다.
- 호스팅 토큰은 CI/게시 컴퓨터에만 둔다. 앱에는 공개 읽기 주소만 포함한다.

## 게시 순서

GitHub: 설치 EXE와 blockmap, latest.yml을 **같은 draft release**에 올려 검수한 뒤 공개한다. R2/generic: 버전별 EXE/blockmap을 먼저 올려 해시 검증 후 latest.yml을 마지막에 교체한다. 이전 설치 파일은 보존한다. 이 CLI는 파일을 외부로 보내지 않는다.

공통화 범위: 설정 검증, 아티팩트 검수, 업데이트 수명주기. 플랫폼별 설치/서명, 공급망 증빙(SBOM), 자동 롤백은 별도 어댑터 또는 향후 범위다. Python/Inno 제품에 Electron 어댑터를 그대로 적용하지 않는다.

공식 기반: https://www.electron.build/v26/docs/features/auto-update/

# 0.8.2 데스크톱 베타 전달 준비

현재 정본은 Studio(E2)이며 npm start / npm run e / npm run e2가 같은 앱을 연다. 제품 버전 0.8.2 유지. 외부 게시·배포는 아직 하지 않았다.

## 권장 전달물
Windows x64 NSIS 설치 EXE + blockmap + latest.yml + release-artifacts.json. Electron 런타임과 앱 코드가 포함된다. `npm run desktop:build`로 로컬 설치 파일을 만들며 외부로 게시하지 않는다. 공용 패키지와 자동 확인/다운로드·정상 종료 적용을 연결했다. 코드 서명·클린 PC·실제 버전 간 업데이트 검증은 미완료다. 실행 절차와 남은 배포 조건은 [RELEASE-RUNBOOK.md](RELEASE-RUNBOOK.md)를 따른다.

## 배포 전 확인
- 베타 식별자: 0.8.2 + 빌드 날짜/식별자를 안내에 표시. npm 버전 변경은 별도 승인.
- 실제 MCP 연결은 테스터의 Codex/Claude 등에서 설정해야 한다. 화면만 실행해도 자동으로 에이전트에 연결되지는 않는다.
- 응답 스피너는 현재 Windows Orca 설치 경로와 공개 CLI 상태 조회에 의존한다. 다른 환경에서는 연결 LED만 동작한다. 테스터 환경을 확인하고 범용 연동은 별도 구현.
- 배포 파일에는 개인 세션·노트·프로필·.olchi·output·handoffs·환경변수를 넣지 않는다.
- AGPL 라이선스와 해당 빌드 소스 전달 경로를 포함한다.
- 연결/재연결, 첫 실행 빈 화면, 기록/플랜/노트, 다크/라이트, 재실행, 단일 앱, 스피너 상태를 깨끗한 Windows 환경에서 확인한다.
- 피드백은 빌드 식별자, OS, 에이전트/Orca 버전, 재현 단계, 기대/실제 결과, 비밀정보 제거한 화면으로 받는다.

## 현재 검증
기본 실행을 Studio로 통합, E2 프로필 유지, Electron 보안/중복 실행·렌더러·연결 상태 테스트 통과. npm pack dry-run 결과 output/desktop-beta-pack-preview.json. 이것은 파일 포함 검사이며 외부 배포나 클린 PC 검증 완료를 뜻하지 않는다.

## PhotoStudio 업데이트 재사용 조사 (실물 확인)
- D:/PS2/scripts/legacy_update/: 17개 보존 모듈. manifest.py(CMS 검증·버전/재전송 정책), download.py(HTTPS 다운로드), runtime_install.py(ZIP/Inno 설치), state.py(버전별 활성화), launcher.py(신뢰 검증), health.py 등.
- D:/PS2/scripts/photostudio_update_agent.py, build_runtime_update.py, create_update_manifest.py, sign_update_manifest.py가 실행·빌드 도구다.
- D:/PS2/docs/1.2.6-update-runtime-removal.md: 2026-09-07 제품 import와 실행 연결 제거, 이전 배포 지원 코드만 scripts/legacy_update에 보존. 기존 설치·서버 정책은 변경하지 않았다고 기록됨.
- 현재 코드는 PhotoStudio.exe, photostudio 스키마, app.process_wait/app.utils.paths를 참조한다. 설치 가능한 범용 패키지로 확인된 것은 아니다. 그대로 복사해서 OlchiPanel용이라고 배포하지 않는다.
- 재사용 방향: 서명 manifest·해시 검증·버전별 설치/복구 계약을 사용하고 제품 ID, Electron 실행파일, 설치 경로, 상태 저장 위치, beta 전용 채널을 분리한다. PhotoStudio 운영 채널/정책/인증서는 수정하지 않는다.
- 후속 구현: packages/olchi-release-kit에 공용 코어를 만들고 OlchiPanel Electron 어댑터와 NSIS 빌드를 연결했다. PhotoStudio 코드를 복사한 패키지가 아니라 같은 운영 설계를 적용한 Electron용 구현이다. 원격 게시와 실제 설치 업데이트 시험은 아직 실행하지 않았다.

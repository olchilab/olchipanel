# OlchiPanel 설치 배포·자동업데이트

제품 버전 0.8.2 유지. 초기 게시 후보는 기존 olchilab/olchipanel GitHub Releases이며 최종 게시 위치는 Mark 결정 대기. `release.config.json` 한 곳에서 GitHub 또는 공개 R2 다운로드 경로를 선택한다.

## 로컬 준비

```powershell
npm ci
npm run test:release
npm run release:prepare
npm run desktop:build
npm run release:verify
npm pack ./packages/olchi-release-kit
```

`desktop:build`는 항상 `--publish never`다. `dist-desktop`의 설치 EXE·blockmap·latest.yml·release-artifacts.json이 전달물이다. 개인 세션, 노트, output, handoffs는 포함하지 않는다. 서명 인증서가 구성되지 않은 빌드는 검수용이며 서명 완료라고 보고하지 않는다.

## 게시 및 다음 버전

1. 현재 버전의 설치 파일을 깨끗한 Windows VM에서 설치/실행한다. MCP 연결은 에이전트에 별도로 등록한다. 앱 설치 자체는 Node 설치를 요구하지 않는다.
2. 다음 릴리스는 Mark가 정한 새 버전으로 package.json version/productVersion을 함께 올린다. **동일한 0.8.2 재게시로 업데이트되지 않는다.**
3. 테스트·빌드·해시 검수 후 GitHub draft release에 EXE, blockmap, latest.yml을 함께 올린다. 대응 소스/라이선스도 제공한다. 게시 권한·서명·실제 설치 테스트를 확인한 뒤 Mark 승인으로 공개한다.
4. 설치된 앱은 시작 및 6시간마다 확인/다운로드하고 정상 종료할 때 적용한다. 개발 실행은 자동업데이트 대상이 아니다.
5. 잘못된 릴리스는 배포를 중단하고 이전 정상 소스를 더 높은 수정 버전으로 출시한다. 자동 rollback은 아직 없다.

R2 선택 시 공개 HTTPS 제품 전용 경로를 generic provider로 지정하고 다시 빌드한다. EXE/blockmap 먼저, latest.yml 마지막 업로드. 인증 토큰을 클라이언트에 넣지 않는다.

## 현재 한계와 실제 배포 완료 조건

- 공용 패키지와 OlchiPanel 연결은 로컬 구현이다. 외부 게시, 인증서 서명, VM의 A→B 실제 업데이트 시험은 별도 검증이 필요하다.
- 앱은 기존 Studio userData 및 ~/.olchipanel 데이터를 유지한다. 외부 MCP 프로세스/다른 소유 viewer를 강제로 종료하지 않는다.
- 앱과 기존 viewer 버전이 다르면 현재 시작 오류로 안내한다. 원격 배포 전에 오래된 MCP/viewer와의 버전 전환을 테스트해야 한다. 앱 업데이트가 별도 npm MCP 설치까지 자동 갱신하지 않는다.
- 게시 저장소 쓰기 권한 부족은 기존 포트폴리오 blocker로 남아 있다. 이번 작업에서 권한 해결을 확인하지 않았다.

# 2026-09-08 로컬 배포 구현 검증

- 공용 release-kit 0.1.0 tgz 생성, OlchiPanel 0.8.2 Windows x64 NSIS 빌드 성공.
- 공용 계약 2제품 입력, HTTPS/인증정보 금지, 다운로드 병합, 실패 재시도, 정상 종료 적용/시스템 종료 보류, 손상 파일 및 버전 불일치 거부 테스트 통과.
- Electron shell/theme/session-activity 회귀 통과. npm audit: 0 vulnerabilities.
- 패키지 실실행: title OlchiPanel, theme studio, API version 0.8.2, 본인 세션 존재, 문서 가로 overflow 없음. output/playwright/release-packaged-app.png.
- updater 실제 상태: error. 원격 피드 정상 동작을 확인한 것이 아니다. 게시된 update metadata가 준비되면 추가 시험한다.
- installer Authenticode: NotSigned. 서명된 배포물로 취급하지 않는다.
- app.asar에 handoffs/portfolio/window-state 개인 자료 미포함 확인.
- viewer: 단일 6711/PID20104 유지, MCP 프로세스 종료하지 않음. 패키지 검수 창은 닫고 원래 개발 앱 하나로 복귀.
- 공용 surface registry: 기존 타 프로젝트 manifest 누락 4건 RED. 공용 portfolio: 타 프로젝트 누락/스키마 오류 RED. 이번 범위에서 수정하지 않음.
- 외부 게시, 코드 서명, 별도 VM 설치/A→B 업그레이드, 자동 rollback은 미검증/미구현 범위. 게시 위치 사용자 답변 대기.

# PC 애니메이션 실행 조건 수정

- 기준본: tarot_tab_modular_prototype_20261029.zip
- 수정 파일: js/main.js만
- 변경: prefers-reduced-motion이 true일 때 셔플과 카드 공개 애니메이션을 건너뛰는 조건 분기 제거. 기존 shuffleMotion, fanMotion, revealMotion을 모두 실행하도록 연결.
- 기존 CSS, 카드 데이터, 뒷면 이미지, 화면 구조는 변경하지 않음.
- 주의: 움직임 감소를 요청한 사용자에게도 전체 효과가 재생되므로 접근성 정책은 별도 검토 필요.
- 검증: 소스 정적 검사 및 ZIP 무결성 검사만 완료. PC/모바일 실제 브라우저 동작은 미검증.

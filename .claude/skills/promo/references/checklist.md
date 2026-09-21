# checklist — 단계별 체크

| 단계 | 체크 |
|---|---|
| brief | audience·unit 확정 / 대외면 `must_include`에 credit_line / `sources`에 facts 경로 1개 이상 / deadline / 요청 원문 보존 |
| draft | 모든 수치에 `<!-- facts: -->` 주석 / audience 어조표 적용 / 슬롯·분량 규격 / deprecated·forbidden 0건 / 연락처·실명 비움 |
| visual | yaml 슬롯 전부 채움 / fill 경고 0 (로고 폴백 제외) / 카드뉴스 page 순번 / 표지 variant |
| render | PNG·preview를 Read로 검토 — 잘림·겹침·빈 슬롯·폰트 폴백 / 인쇄물은 pdf + preview 쌍 / 리플릿 2쪽 |
| doc | validate 통과 / 표 정상 / 쪽수 적정 / 골격 필수 섹션 전부 |
| check | check-report FAIL 0 / WARN은 사유 확인 후 응답에 기록 |
| final | brief status=final / `promo.py index` / 사용자 확인 사항 목록: 로고 파일 · 학교 실명 · 연락처 · 사진 초상권 · 재단 배포 전 문의 (지원처 명기) · 보도자료는 재단 검수 |
| kb-sync | 변경 후보 표 → 승인 → facts·07-변경이력·관련 kb 갱신 → pii-scan 0건 → 총계 검산(사업비+운영비=총계) |
| 도구 변경 | `promo.py`·템플릿·facts.deprecated/forbidden을 고친 뒤에는 `promo.py selftest --render` PASS 확인 |

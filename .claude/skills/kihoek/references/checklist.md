# checklist — 단계별 체크

| 단계 | 체크 |
|---|---|
| 시작 | `kb-index --check`(+`--raw`) 0 또는 재생성 / `facts.meta.schema_version ≥ 2` / `kb-select --emit basis` 출력 = `brief.basis` / `chars_read ≤ 60,000` / `missing`·`dropped` 응답에 보고 / 첫 줄 "기준: … 계획 · … 실적" |
| idea | `gap_scan` 근거 경로 / 항목마다 `gap≥1`·`refs≥1`(읽은 섹션 안)·`resources`·`risks`·`rule_check` / AskUserQuestion 1회(질문≤3·선택지≤4) / `brief.md`+`ideas.md` / `status: final` / `promo.py index` |
| plan | 골격 필수 절 10개 헤딩 그대로 / 수치마다 `<!-- facts: -->` / 예산 단가×수량·소계·합계 / 파생 금액 `(산출: …)` / 날짜 규칙 / `⚠ 규정` 블록 / `(가정)` 목록 / `promo.py check` PASS(재검사 ≤2회) / `status: draft` |
| proposal | 추출본 PII 정리 / `⚠ 자격` 첫 줄 / `requirements.md` 상태 3종 / `section_map` / `credit` 결정 / check PASS |
| review | `brief.review_as`·`templates` / hwpx·docx는 `--headings` 추출 / check 표 + Claude 표 / **원본 무수정** / `status: final` |
| learn | 마스킹 diff 승인 / 후보 표 4종 승인(행 단위) / 반영 → as_of → learn-log → pii-scan 0 → kb-index / `--kind summary`는 exec-summary 출력만 |
| doc | `promo.py doc-stamp` / hwpx VALID / check PASS(final_from 경고 없음) / `status: final` / `promo.py index` |
| 도구 변경 | `promo.py`·골격·`kb-select.yaml`을 고친 뒤에는 `promo.py selftest` PASS · `kb-select --cmd <각각> --unit research` missing 없음 |

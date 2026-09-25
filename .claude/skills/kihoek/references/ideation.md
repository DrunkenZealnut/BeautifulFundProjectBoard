# ideation — `/kihoek idea` 빈틈 스캔 · 발산 · 수렴

## 1. 빈틈 스캔 (Gap Scan) — 결과는 `ideas.md` frontmatter `gap_scan`에 근거 경로와 함께

| 코드 | 빈틈 | 계산 | 근거 경로 (refs 에 쓰는 형식) |
|---|---|---|---|
| G1 | KPI 미달·위험 | `facts.outcomes.kpi_status`에서 `at_risk`, 또는 `planned`인데 **due가 90일 이내이거나 이미 지남**(지난 planned는 at_risk 취급) | `facts.outcomes.kpi_status[id=kpi-…]` |
| G2 | 예산 미집행 | 기준일 = min(오늘, `program.period.year1_end`). unit 기간 = `units[id].period.start`~`end`(없으면 연초~연말). 경과 비율 = (기준일−start)/(end−start) (0~1). `executed/budget.total`이 경과 비율보다 **30%p 이상 낮으면** G2. `budget_execution.by_unit`에 없는 unit·`budget: null`·start가 기준일 이후인 unit은 건너뜀. 판정에 쓴 as_of를 적는다 | `facts.units[id=…].budget.total`, `facts.outcomes.budget_execution.by_unit[unit=…]` |
| G3 | 문제정의 미대응 대상 | 01 §1·§2의 대상·문제 목록 ↔ 02 활동 매핑. 1차는 색인의 02 섹션 `s`·`k`로, 대응 후보가 없는 대상만 해당 02 파일을 Read해 확인 | `kb/01-사업개요.md#1`, `kb/02-단위사업/<파일>.md#<앵커>` |
| G4 | 일정 여백·미확정 | 05 §3 미확정 항목, 05 §1 표에서 하반기 빈 달 | `kb/05-일정.md#3`, `kb/05-일정.md#1` |
| G5 | 교훈 "다음에" 미반영 | 10 §4의 `- [ ]` 항목 | `kb/10-교훈.md#4` |
| G6 | 다음 연도 씨앗 | `facts.plans_2027`, `facts.strategy.implication`, `program.deadlines.continuation_*` | `facts.plans_2027.textbook_support`, `facts.strategy.implication` |
| G7 | 자립 축 공백 | 01 §8 자립 비전 4축(재정·조직·활동가·회원) ↔ 현재 활동·KPI. 대응 활동이 없는 축 | `kb/01-사업개요.md#8`, `kb/04-성과지표.md#1` |

**due 정규화** (G1): 마지막 토큰만 본다 — `YYYY-Qn`·`n분기`→분기 말일, `YYYY-MM`·`n월`→월 말일, `연중`·`하반기`→12-31, `A~B`·`A, B`→B 적용 (`1분기~연중`→12-31, `2분기 구축, 4분기 달성`→12-31). 연도가 없으면 `program.period.year1_start`의 연도.

전부 비면 응답에 "빈틈 없음"을 쓰고 `--free`를 안내한다. `--free`는 스캔을 생략하지 않는다 — 자유 항목을 `gap: [free]`로 추가할 뿐이다.

## 2. 발산 — 빈틈마다 1~3개, 총 8~10개

`ideas.md` frontmatter 항목 필드(설계 §3.5):

| 필드 | 규칙 |
|---|---|
| `id` | `I-01`… |
| `title` | 한 줄. 대상·활동·규모가 보이게 |
| `gap` | `[G1…G7]` 1개 이상 (`[free]`는 --free 항목만) |
| `refs` | 1개 이상. kb 앵커는 **읽은 섹션(`sections_read`) 안**의 것, 또는 facts 경로 |
| `unit` | `research·app·campaign·ai-club·regional·org` 또는 `new`(사유 필수: 왜 기존 단위사업에 못 넣는지) |
| `summary` | 2~3문장. (가정)은 표기 |
| `resources` | `budget_hint`(facts 경로 또는 `단가×수량` 힌트), `accounts`(08 §4·03 계정명), `people` |
| `risks` | 1개 이상 (10 §2·§5에 같은 것이 있으면 앵커) |
| `links` | 연결되는 단위사업 id |
| `rule_check` | 08 §4(내부인 인건비·계정 구분)·§7(집행 규칙)·`facts.forbidden` 대조 결과 `OK` / `주의 — 사유` |
| `score` | `contribution`·`feasibility`·`risk` 1~5, `rule` OK/주의 + 한 줄 근거(표에서) |

## 3. 점수표

| 축 | 5 | 3 | 1 |
|---|---|---|---|
| 기여 | 미달 KPI 직접 해소·비전 축 2개 이상 | 빈틈 1개 부분 해소 | 간접 |
| 실행성 | 기존 예산·인력·파트너로 가능 | 단가·파트너 일부 미확인 | 신규 계정·인력·검정 절차 필요 |
| 리스크(낮을수록 좋음) | 5 = 학교·재단 협의 미확정, 규정 주의 | 3 | 1 = 기존 활동 연장 |

점수는 순위 참고용. 한 줄 근거 없이 숫자만 두지 않는다.

## 4. 수렴 — AskUserQuestion 1회

- 질문 최대 3개, 각 `multiSelect: true`, 선택지 = 아이디어 ≤4개(제목 + 점수 요약). 예: Q1 I-01~I-04, Q2 I-05~I-08, Q3 I-09~I-10.
- 선택 = `decision: adopt`, 미선택 = `hold`. `drop`은 사용자 메모("I-04 폐기")로만.
- 저장: `content/out/<id>/brief.md`(`type: idea`, `audience: internal`, `templates: [아이디어보드]`, `credit: exempt`, `gaps_used`, `basis`, `status: final`) + `ideas.md`(frontmatter + `아이디어보드.md` 골격 4절). `promo.py index`.
- 응답: 채택/보류 표 + "채택 항목으로 `/kihoek plan <제목> --from <id>#I-nn`".

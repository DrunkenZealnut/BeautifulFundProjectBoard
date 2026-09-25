# context-budget — 시작 절차 · 읽기 예산 · missing/dropped

`P = content/.venv/bin/python3 content/tools/promo.py`

## 시작 절차 (모든 서브커맨드)

| 단계 | 명령 · 동작 | 실패 처리 |
|---|---|---|
| 0 | `$P kb-index --check` | 종료 1 → `$P kb-index` 실행(0이 아니면 중단) · 종료 2 → 출력의 `FAIL <파일>: frontmatter`를 보고하고 중단 (따옴표 규칙: `[`·`#`·`,`·`:`가 든 값은 큰따옴표, 값 안에 `"`가 있으면 작은따옴표) |
| 0' | `$P kb-index --raw --check` | 종료 1 → `$P kb-index --raw`. `_raw` 폴더가 없으면 건너뜀 |
| 1 | `Read content/kb/facts.yaml` 전체 | `meta.schema_version < 2` → "설계 §8 2단계(facts v2)를 먼저" 안내 후 중단 |
| 2 | `Read content/kb/kb-index.yaml` 전체 | 없으면 0단계가 만든다 |
| 3 | `$P kb-select --cmd <sub> [--unit <id>] [--query "<인자 텍스트>"] [--raw] --emit plan` → `selected`를 순서대로 `Read(file_path=content/<path>, offset=l, limit=e-l+1)`. 같은 파일의 인접 섹션은 한 Read로 합친다 | `dropped`가 있으면 사용자에게 목록을 보이고 고른 앵커로 `--include a,b` 재실행(1회). `missing`은 응답에 그대로 보고 |
| 4 | 같은 인자 + `--emit basis` → 출력 YAML을 `brief.basis`에 **그대로** 붙인다 (`select_args`·`sections_read`·`chars_read`·`dropped`·`missing`). Claude가 값을 고치지 않는다 | — |
| 5 | 사용자 입력 파일(요강·review 대상·learn 입력)은 `data/_extract/`의 텍스트를 `$P kb-outline <md> --chunk 15000`으로 나눠 필요한 조각만 Read | — |

## 읽기 예산

- 단위는 **문자 수(len)**. 기본 60,000 (`--budget`).
- 계상 대상은 kb-select가 고른 kb 섹션과 `_raw` 구간(`--raw`, 같은 호출·같은 예산)뿐. `facts.yaml`·색인·사용자 입력·골격 파일은 계상하지 않는다.
- `chars_read`는 kb-select 출력값이다. 예산을 넘는 섹션은 `dropped`에 적고 **건너뛰며 계속** 담는다(더 작은 섹션은 담길 수 있음).
- 부모(`##`) 섹션이 담기면 자식(`###`)은 따로 담지 않는다.

## 앵커 표기

- 정규: `kb/<파일경로>#<번호|텍스트>[/<하위>]` — 예 `kb/01-사업개요.md#1`, `kb/02-단위사업/기초연구.md#현행-목표`, `kb/09-성과실적.md#1/1.1`, `kb/_raw/수행가이드.md#L452`
- 약식(`kb-select.yaml`·문서에서만): `01#1` → `kb/01-*.md#1`, `02/캠페인#*` → `kb/02-단위사업/캠페인.md`의 `##` 전부, `{unit}.kb#*`, `{unit}.h09`
- 산출물 frontmatter(`refs`, `sections_read`)에는 **정규 표기만** 쓴다.

## 기본 앵커

`content/kb/kb-select.yaml`의 `defaults[cmd]`가 원천이다. 절차가 요구하는 입력을 바꾸면 그 파일을 고치고, `$P kb-select --cmd <sub> --unit research --emit basis`로 `missing`이 비는지 확인한다.

| 서브커맨드 | 왜 이 섹션인가 |
|---|---|
| status | 09 §5(확인 필요)·10 §4(다음에) 만 — 나머지는 facts·색인 |
| idea | 01 §1·§2·§8(문제·목적·자립 축) · 04 §1·§2(KPI 형식) · 05 §1·§3(일정 여백) · 08 §4·§7(규정) · 09 §1·§5 · 10 §4·§5. G3(02 활동 매핑)은 색인 `s`·`k`로 1차 판정, `--unit`이면 그 02 파일 전체 |
| plan | 01 §1·§2·§8 · `{unit}` 02 전체 · 03 §1·§2(산출근거·운영비) · 04 전체 · 07 §2(변경) · 08 §3·§4·§7 · `{unit}` 09 소절 · 10 §1·§2·§3·§5 |
| proposal | 01 전체(단체 소개) · `{unit}` 02 · 03 §1 · 04 전체 · 05 §1 · 06 §1·§2(메시지) · 08 §1·§5(명기·저작권) · 09 §1·§2(실적·산출물) |
| review | 03 §1·§2 · 04 전체 · 07 §2 · 08 전체 |
| learn | 07 §2 · 09 전체 · 10 전체 (갱신 대상) |

## `_raw` 읽기

`_raw/_index.yaml` 구간(`#L<줄>`)만, 한 구간 ≤ 15,000자. 구간은 `제n장`·`n.`·`Ⅰ.`·`가.` 후보 줄로 잡는다(기초보고서·수행가이드 모두 후보 5개 이상). 후보가 5개 미만인 문서만 `<!-- page -->` 5쪽 단위, 그것도 없으면 12,000자 청크. (`kb-outline`은 md 헤딩 기준이라 수행가이드 추출본은 청크로 보인다) `--raw`를 붙이면 kb-select가 질의 점수로 골라 준다(기본 앵커에는 없음).

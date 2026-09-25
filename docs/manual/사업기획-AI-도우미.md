# 사업기획 AI 도우미 사용 매뉴얼 — `/kihoek`

> **대상**: 청년노동자인권센터 대표 (Claude Code에서 사용) · **기준일**: 2026-09-25 · **기능**: F-16 (설계 v0.4.1, 검증 Match Rate 93%)
>
> 센터의 사업 문서(신청서·사업계획·변경신청서·수행가이드)와 결과물(보고서·홍보물·집행 요약)을 정리한 지식베이스를 근거로 **아이디어·사업계획·공모 신청서를 만들고, 초안을 감사하고, 새 결과물을 다시 학습**시키는 Claude Code 명령입니다. 이 컴퓨터 안에서만 동작하며 웹앱(`index.html`)과는 별개입니다. 서버·API 키가 필요 없습니다.
>
> 이 문서는 사용법 안내서입니다. Claude가 따르는 규칙 원본은 `.claude/skills/kihoek/SKILL.md`와 `references/`, 설계는 `docs/02-design/features/사업기획-AI-도우미.design.md`입니다.

## 목차

1. [무엇을 하는 도구인가](#1-무엇을-하는-도구인가)
2. [처음 준비](#2-처음-준비)
3. [빠른 시작 — 계획서 한 바퀴](#3-빠른-시작--계획서-한-바퀴)
4. [명령별 사용법](#4-명령별-사용법)
5. [초안 표기 약속](#5-초안-표기-약속)
6. [자동 검사(check) 읽는 법](#6-자동-검사check-읽는-법)
7. [지식베이스 구조](#7-지식베이스-구조)
8. [산출물 폴더와 brief.md](#8-산출물-폴더와-briefmd)
9. [promo.py 명령어 레퍼런스](#9-promopy-명령어-레퍼런스)
10. [개인정보·재단 규정 안전장치](#10-개인정보재단-규정-안전장치)
11. [유지보수 — 언제 무엇을](#11-유지보수--언제-무엇을)
12. [문제 해결](#12-문제-해결)
13. [현재 한계](#13-현재-한계)
- [부록 A. 파일 지도](#부록-a-파일-지도) · [부록 B. 용어](#부록-b-용어)

---

## 1. 무엇을 하는 도구인가

`/promo`가 **정해진 것을 알리는 문서**(홍보물·보도자료·공문)를 만든다면, `/kihoek`은 **다음에 무엇을 할지**를 만듭니다. 둘은 같은 지식베이스(`content/kb/`), 같은 검사 도구(`promo.py`), 같은 산출물 폴더(`content/out/`)를 씁니다.

| 명령 | 하는 일 | 만드는 것 |
|---|---|---|
| `/kihoek status` | 현황판 — 기준일, KPI 진행, 마감 D-day, 다음 할 일 | 화면 출력만 |
| `/kihoek idea <주제>` | 빈틈(KPI 위험·예산 미집행·교훈 미반영 등)을 찾아 아이디어 8~10개 제안 → 채택 선택 | `ideas.md` |
| `/kihoek plan <제목>` | 재단 양식 10개 절 사업계획 초안, 예산 자동 검산 | `draft.md` |
| `/kihoek proposal <요강 파일>` | 다른 기관 공모 요강을 읽고 자격 확인·요구항목 대조·신청서 초안 | `requirements.md`, `draft.md` |
| `/kihoek review <파일>` | 이미 쓴 초안(md·hwpx·docx)을 규정·근거 기준으로 감사 (원본 무수정) | `review.md` |
| `/kihoek learn <결과물 파일>` | 보고서·회의록·집행 요약에서 실적·교훈을 뽑아 지식베이스에 반영 (승인 후) | kb `09`·`10`, `facts.outcomes` |
| `/kihoek doc <id>` | 확정한 초안을 한글(HWPX) 파일로 | `final/*.hwpx` |

```
status ─┬─ idea <주제> ──▶ plan <제목> ──▶ doc <id> ──▶ final
        ├─ proposal <요강 파일> ──▶ doc ──▶ final
        ├─ review <초안 파일>        (감사만, 원본은 그대로)
        └─ learn <결과물 파일>       (승인 후 kb 갱신 → 다음 idea·plan의 근거가 됨)
```

### 믿고 쓸 수 있게 하는 7가지 약속

1. **숫자는 `facts.yaml`에서만** — 초안의 금액·날짜·인원 옆에 출처 주석(`<!-- facts: 경로 -->`)이 붙고, 자동 검사가 그 경로가 실제로 있는지 확인합니다. 주석은 한글 파일로 바꿀 때 지워집니다.
2. **근거 없는 말은 `(가정)`** — 지식베이스에 없는 사실은 단정하지 않습니다.
3. **예산은 단가×수량** — 산출근거 식을 계산해 금액·소계·합계를 검산합니다.
4. **계획과 실적을 섞지 않음** — "했다·달성·집행률"은 실적 자료(`facts.outcomes`)에서만 인용합니다.
5. **지식베이스는 승인한 것만 바뀜** — `learn`이 후보를 표로 보여 주고, 고른 행만 반영합니다.
6. **개인정보·학교 실명 차단** — 금지 목록(denylist)과 패턴 검사가 모든 산출물에서 걸러 냅니다.
7. **읽은 범위를 기록** — 명령마다 6만 자 안에서 무엇을 읽었는지 `brief.md`에 남습니다. 같은 요청은 같은 범위를 읽습니다.

---

## 2. 처음 준비

한 번만 하면 됩니다.

**① 실행 환경** — `content/.venv`가 있어야 합니다(`/promo`와 같이 씀). 없으면 저장소 루트에서:

```bash
python3 -m venv content/.venv && content/.venv/bin/pip install -r content/tools/requirements.txt && content/.venv/bin/playwright install chromium
```

**② 개인정보 목록** — 둘 다 `data/` 아래라 git에 올라가지 않습니다.

| 파일 | 내용 | 예 |
|---|---|---|
| `data/pii-denylist.txt` | 산출물에 나오면 안 되는 이름. 한 줄에 하나 | 학교 실명 |
| `data/pii-allowlist.txt` | denylist·마스킹에서 빼 줄 이름 | 공개해도 되는 대표 이름 |

denylist가 없으면 검사 보고서에 `INFO denylist 없음`이 뜨고 실명 검사를 건너뜁니다.

**③ 색인과 자가진단**

```bash
content/.venv/bin/python3 content/tools/promo.py kb-index         # content/kb/kb-index.yaml 생성
content/.venv/bin/python3 content/tools/promo.py kb-index --raw   # 원문 추출본(content/kb/_raw) 색인 — 폴더가 있을 때만
content/.venv/bin/python3 content/tools/promo.py selftest         # 마지막 줄이 "selftest PASS"면 정상
```

평소에는 `/kihoek`이 시작할 때 색인이 최신인지 확인하고 필요하면 다시 만들므로 직접 돌릴 일이 거의 없습니다. Claude Code 입력창에서는 명령 앞에 `!`를 붙이면 바로 실행됩니다.

---

## 3. 빠른 시작 — 계획서 한 바퀴

Claude Code 입력창에서 차례로:

```
/kihoek status
```
기준일, KPI 현황, 마감 D-day, 권장 행동을 봅니다.

```
/kihoek idea 2027 2차년도 신규 활동
```
빈틈 스캔 결과와 아이디어 표가 나오고, 질문 창에서 채택할 아이디어를 고릅니다. 결과는 `content/out/<날짜-슬러그>/ideas.md`로 저장됩니다.

```
/kihoek plan 2027 교과서 제작 지원 --from <idea 폴더명>#I-01
```
사업계획 초안(`draft.md`)을 쓰고 자동 검사까지 돌립니다. 고칠 점은 대화로 요청하면 됩니다.

```
/kihoek doc <plan 폴더명>
```
`final/` 폴더에 한글 파일(HWPX)이 생기고 상태가 `final`이 됩니다.

> **실제 예** — `content/out/2026-09-25-2027-교과서지원-사업계획/`: 10개 절, 예산표 13행(항목 8·소계 4·합계 1) 2,000만 원 검산 일치, 검사 PASS(FAIL 0·WARN 0), 읽은 분량 20,648자.

---

## 4. 명령별 사용법

### 4.1 status — 현황판

```
/kihoek status
```

facts와 색인만 읽고 보여 줍니다. 파일은 만들지 않습니다.

- 계획 기준일·실적 기준일 — 실적 기준일이 30일 넘게 지났으면 "learn 권장"
- 색인이 최신인지 (원문 색인 포함)
- KPI 12개 집계: 완료 · 진행 중 · 위험 · 예정 — **마감이 지난 '예정'은 위험으로** 셉니다
- `10-교훈` §4 "다음에 다르게"에서 아직 안 한 항목 수
- 진행 중인 산출물 (brief·draft 단계)
- 마감 D-day (`program.deadlines` — 사업변경신청 10-31, 연속지원 서류 11월, 결과보고서 2027-01-29 등)
- 다음 권장 행동 1~3개

> 2026-09-25 기준: KPI 12개 중 진행 중 1(기초연구 보고서) · 위험 1(단체 등록 — 1분기 마감이 지났는데 '예정') · 예정 10. 실제로 끝난 일이라면 `learn`으로 상태를 갱신하면 됩니다.

### 4.2 idea — 아이디어 발산

```
/kihoek idea <주제> [--unit <단위사업>] [--free]
```

**빈틈 스캔 7종** — 아이디어는 반드시 아래 빈틈 하나 이상과 근거 경로를 가집니다.

| 코드 | 빈틈 | 무엇을 보나 |
|---|---|---|
| G1 | KPI 미달·위험 | 위험(at_risk) KPI, 또는 마감이 90일 안이거나 이미 지난 '예정' KPI |
| G2 | 예산 미집행 | 단위사업 집행률이 기간 경과율보다 30%p 이상 낮음 |
| G3 | 문제 정의 미대응 | 사업개요(01)의 대상·문제 가운데 대응 활동이 없는 것 |
| G4 | 일정 여백 | 일정(05)의 미확정 항목, 하반기 빈 달 |
| G5 | 교훈 미반영 | 교훈(10) §4의 `- [ ]` 할 일 |
| G6 | 다음 연도 씨앗 | 2027 계획(`plans_2027`), 전략 시사점, 연속지원 일정 |
| G7 | 자립 축 공백 | 자립 비전 4축(재정·조직·활동가·회원) 중 활동이 없는 축 |

**아이디어 한 개에 담기는 것**: 제목 · 빈틈 코드 · 근거 경로 · 단위사업(맞는 게 없으면 `new`와 사유) · 요약 · 자원(예산 힌트·계정·사람) · 위험 · 연결 사업 · 재단 규정 대조(OK/주의) · 점수(기여·실행성·리스크 1~5, 한 줄 근거).

**고르기**: 질문 창이 한 번 뜹니다(질문 최대 3개, 질문마다 아이디어 최대 4개, 복수 선택). 고른 것은 채택(`adopt`), 나머지는 보류(`hold`)입니다. 버릴 것은 "I-04 폐기"처럼 말로 알려 주면 `drop`이 됩니다.

**옵션**
- `--unit research` — 그 단위사업 문서(`02-단위사업/…`) 전체를 추가로 읽습니다.
- `--free` — 빈틈과 무관한 자유 아이디어를 `gap: [free]`로 **추가**합니다. 스캔은 그대로 합니다.

**결과**: `content/out/<id>/brief.md`(type: idea, status: final) + `ideas.md`(아이디어보드). 빈틈이 하나도 없으면 "빈틈 없음"과 함께 `--free`를 안내합니다. 다음 단계는 `/kihoek plan <제목> --from <id>#I-01`.

### 4.3 plan — 사업계획 초안

```
/kihoek plan <제목> [--from <idea 폴더명>#I-nn] [--year 2027] [--unit <단위사업>]
```

- `--from` — idea에서 채택한 항목을 이어받습니다(단위사업도 따라옵니다). `--unit`도 `--from`도 없으면 단위사업을 물어봅니다.
- **골격**: `content/templates/docs/사업계획.md` — 재단 신청서 표기 그대로 10개 절
  1 사업 개요 · 2 배경과 목적 · 3 세부 사업목표 · 4 세부 활동내용 · 5 추진 일정 · 6 사업예산 · 7 성과지표와 성과측정 계획 · 8 평가 계획 · 9 위험과 대응 · 10 이전 계획과의 연결
- **`⚠ 규정` 블록** (초안 맨 위): 사업기간(연차 1/1~12/31 안) · 결제(카드·계좌이체만) · 원천징수(동일인 일 지급 125,000원 초과) · 내부인 인건비 불가 · 통합지출 금지 · 회의비 범위 · 중복지출 · 재단 표기 · 미확인 단가와 `(가정)` 목록
- **흐름**: 작성 → 자동 검사 → FAIL이면 Claude가 고쳐 다시 검사(최대 2회) → PASS면 `status: draft`
- **응답**: 초안 전문 + 인용한 facts 경로 목록 + 검사 결과 요약
- **수정**: 대화로 요청합니다. 고친 판을 `draft-v2.md`처럼 새 번호로 저장해도 되고, 엄격한 검사는 **가장 높은 번호 하나**에만 적용됩니다.
- 확정되면 `/kihoek doc <id>`. 예산표·표기 규칙은 [5장](#5-초안-표기-약속).

### 4.4 proposal — 공모 신청서

```
/kihoek proposal <요강 파일> [--title 제목] [--unit <단위사업>]
```

| 요강 형식 | 처리 |
|---|---|
| 텍스트 PDF | 그대로 추출 (`<!-- page: n -->` 쪽 표시) |
| HWPX · DOCX | 문단·표 추출. 병합 셀은 열을 맞춰 반복 |
| MD | 그대로 사용 |
| HWP (구형) | 불가 — 한글에서 "다른 이름으로 저장 → HWPX 또는 PDF" |
| 스캔 PDF·이미지 | 불가 — 글자 인식(OCR)이 없습니다. 텍스트 PDF나 HWPX 원본을 구하세요 |

진행 순서:

1. 추출본 `data/_extract/요강-<슬러그>.md` 생성 + **개인정보 보고**(담당자 전화·이메일 등) → 지운 뒤 진행
2. **자격 확인** — 응답 첫 줄 `⚠ 자격: …` (설립 연한·법적 지위, 소재지, 예산 규모·자부담, 중복 지원 제한, 제출 서류)
3. **`requirements.md`** — 요강 요구항목마다 우리 근거와 상태
   - `있음`: kb·facts에 근거가 있음
   - `부족`: 근거는 있으나 수치·증빙이 없음 → 초안에 `(가정)`
   - `없음`: 초안에 `(근거 없음 — 확인 필요)` 자리를 남김
4. **초안** — `공모신청서` 골격(단체 개요 · 사업 필요성 · 사업 내용 · 추진 체계와 일정 · 예산 · 기대 성과와 평가 · 지속 계획)을 요강 순서로 재배열합니다. 절 이름을 요강 표기로 바꾸면 `brief.section_map`에 대응이 기록되어 검사가 인정합니다.
5. 자동 검사 → 응답: 자격 → 요구항목 표 → 초안 → 채워야 할 부족·없음 목록

아름다운재단 지원 문구는 기본으로 넣지 않고(타 기관 제출), 요강이 요구할 때만 넣습니다.

### 4.5 review — 초안 감사

```
/kihoek review <파일> [--as plan|proposal]
```

- 대상(md·hwpx·docx)을 `content/out/<id>/src/`에 복사하고 텍스트로 뽑아 검사합니다. **원본은 고치지 않습니다.**
- `--as plan`이면 사업계획 규칙(필수 절 10개·예산 검산·날짜·facts 경로), `--as proposal`이면 신청서 규칙을 적용합니다.
- 결과 `review.md` = 자동 검사 표 + Claude 검토 표 `| 심각도 | 위치 | 문제 | 근거 | 수정안 |` — 근거 없는 주장, 변경 전 표현, 계정·집행 규칙, 필수 절 누락, 계획/실적 혼동, 재단 표기.
- 한글 파일의 병합 셀 표도 열이 맞게 추출되고, 구분선(`|---|`)이 없는 추출 표도 검산합니다.

### 4.6 learn — 결과물 학습 (승인형)

```
/kihoek learn <결과물 파일> [--kind report|minutes|summary|deliverable]
```

| kind | 넣는 것 | 주로 바뀌는 곳 |
|---|---|---|
| `report` | 보고서·연구보고서 | 09 §1 한 일·산출물, `outcomes.deliverables`, 10 §1·§2 |
| `minutes` | 회의록·간담회 기록 | 10 §3 결정·§4 다음에·§5 가정, 09 §4 외부 반응 |
| `deliverable` | 산출물 목록 (`content/out/INDEX.md` 등) | `outcomes.deliverables`, 09 §2 |
| `summary` | 집행 요약 (아래) | `outcomes.budget_execution`, 09 §3 |

진행 순서:

1. 텍스트 추출 (`data/_extract/`)
2. **마스킹 확인** — 원문 발췌와 마스킹 결과를 표로 보여 줍니다. 성명 → 역할(교사·학생·담당자·대표, allowlist 이름은 유지), 학교 실명 → 지역+유형, 연락처·계좌·주소 삭제, 개인 평가·인사·건강·갈등 문장 제외.
3. **갱신 후보 표** — ① 09 실적 문장 ② 10 교훈 항목 ③ `facts.outcomes` 수치 ④ 10↔07 링크. 질문 창에서 **행 단위로** 고릅니다. 고르지 않은 행은 반영되지 않습니다(보류).
4. 반영 → 실적 기준일 갱신 → `content/kb/learn-log.md`에 1줄 → 개인정보 재검사 **0건 확인**(아니면 되돌림) → 색인 재생성 → 결과 보고

learn은 **계획 수치를 새로 쓰지 않습니다.** 계획이 바뀐 것(변경신청 등)은 `/promo kb-sync`로 반영합니다.

#### 집행 요약 넣기 (`--kind summary`)

1. 웹앱 **예산 관리 → 집행내역**에서 필터를 모두 풀고 **📊 Excel 내보내기** → `data/집행내역-YYYYMMDD.xlsx`로 저장 (「선택 내보내기」가 아니라 전체)
2. `/kihoek learn data/집행내역-20261001.xlsx --kind summary`
3. Claude는 원본 엑셀을 열지 않고, `promo.py exec-summary`가 만든 **합계 요약만** 읽습니다. 수취인·설명은 요약에 나오지 않습니다.
   - `대기` 상태는 빼고, 환입(음수 금액)은 합계에 반영합니다.
   - 상태별 건수(`status_counts`)와 기간(`date_range`)을 먼저 보여 주니 전체 내보내기가 맞는지 확인하세요.
4. 소분류가 단위사업에 연결되지 않으면 `unmapped`로 보고됩니다 → `content/kb/unit-map.yaml`에 한 줄 추가.

### 4.7 doc — 한글 파일로 확정

```
/kihoek doc <id> [hwpx|docx]
```

1. `promo.py doc-stamp content/out/<id>` — 최신 초안의 지문(sha1)을 `brief.final_from`에 기록
2. doc-stamp가 알려 준 **최신 초안 파일**(`draft-v2.md` 등)을 `/promo doc` 절차로 변환 — 사업계획은 `report` 서식, 공모신청서는 `proposal` 서식
3. 검사 PASS → `status: final` → `content/out/INDEX.md` 갱신

나중에 초안을 다시 고치면 검사가 `final 갱신 필요` 경고를 냅니다. 그때 `doc`을 다시 실행하세요. 재단 공식 양식 HWPX를 구하면 그 양식을 레퍼런스로 쓸 수 있습니다(현재 미확보).

---

## 5. 초안 표기 약속

| 표기 | 뜻 | 예 |
|---|---|---|
| `<!-- facts: 경로 -->` | 바로 앞 숫자의 출처 (한글 파일에선 지워짐) | `1,200,000원 <!-- facts: unit_costs.advisor_fee -->` |
| `(신규 단가 — 확인 필요)` | facts에 없는 새 단가 | `2개교×8단원×500,000 (신규 단가 — 확인 필요)` |
| `(산출: 식)` | 표 밖에서 계산한 금액 — 식을 검산 (facts에 있는 금액이어도 검산) | `10,000,000원(산출: 5,000,000×2)` |
| `(추정)` | 어림값 | — |
| `(가정)` | 지식베이스에 근거 없는 전제 | `학교당 안전 소절 8단원 (가정)` |
| `(신규 지표)` | 기존 KPI 12개에 없는 지표 | — |
| `(예정)` · `(안)` | 확정 전 날짜 | `2027-03-02 (화) ~ 03-06 (예정)` |
| `(근거 없음 — 확인 필요)` | 신청서에서 채워야 할 자리 | — |

### facts 경로 쓰는 법

- 점으로 내려갑니다: `program.budget.reserve`
- 목록은 id로: `units[id=research].budget.total` (= `units.research.budget.total`)
- 다른 키로 고르기: `outcomes.budget_execution.by_unit[unit=app].executed`
- 여러 개는 쉼표로, 같은 부모면 뒤쪽은 줄여 씁니다: `program.period.total_start, total_end`
- `[0]` 같은 번호 인덱스는 경고(WARN) — 순서가 바뀌면 틀리므로 id로 씁니다.

### 예산표 — 자동 검산

```
| 계정항목 | 금액 | 산출근거 |
|---|---:|---|
| 사업인건비 — 전문가 검수 | 1,200,000원 | 2개교×4회×150,000 <!-- facts: unit_costs.advisor_fee --> |
| 사업인건비 — 기술교정 | 2,000,000원 | 2개교×100쪽×10,000 <!-- facts: unit_costs.proofreading --> |
| **소계 (사업인건비)** | **3,200,000원** | |
| 예비비 | 500,000원 | 500,000×1 <!-- facts: program.budget.reserve --> |
| **합계** | **3,700,000원** | |
```

- 머리행에 `금액`과 `산출근거` 열이 있어야 검산 대상이 됩니다.
- 산출근거는 `×`(또는 숫자 사이 `x`)·`+`·괄호만 씁니다. 단위어(회·명·부·쪽·개월·인분 등)는 붙여도 되고, `커피차 대여(300인분)` 같은 설명 괄호는 무시됩니다.
- **쓰면 안 되는 것**: 범위 `3~4회`, 배수어 `1천만원`, 나눗셈 `/`, 뺄셈·음수 `-` → 계산할 수 없어 `R4b 파싱` 경고가 나고 검산되지 않습니다.
- 금액 칸에 `(신규 단가 — 확인 필요)`를 붙여도 금액은 그대로 읽힙니다. 합계 행은 표 맨 끝에 두세요 — 합계 뒤에 항목이 있으면 경고가 납니다.
- 항목 행은 식 값과 금액의 차이가 0.1% 이내여야 하고, 소계·합계·총계는 **정확히** 맞아야 합니다.
  - 소계 = 앞 소계 뒤로 나온 항목들의 합
  - 합계 = 소계들 + 소계 밖 행(예비비 등)
  - 사업비 합계·운영비 합계처럼 합계가 여럿이면 총계 = 합계들의 합
- 계정명은 재단 계정만: 사업인건비·사업회의비·도서인쇄비·지급수수료·여비교통비·물품구매비·사업홍보비·예비비 / 운영인건비·일반관리비·임차료·교육훈련비·홍보비
- 단가는 facts `unit_costs`의 21개에서 인용합니다. 지금은 모두 `note: 미확인`(대표 확인 전)이라 초안의 ⚠ 규정 블록에 "미확인 단가"로 나열됩니다.

### 날짜

- 확정 일자(facts에 있는 마감·행사일)만 `YYYY-MM-DD`로 씁니다.
- 그 밖의 계획 일정은 `2027년 3월`·`1분기`처럼 씁니다.
- 부득이 미래 날짜를 쓰면 `(예정)`·`(안)`을 붙입니다. 범위는 끝에 한 번이면 양 끝이 모두 인정됩니다: `2027-03-02 (화) ~ 03-06 (예정)`.

---

## 6. 자동 검사(check) 읽는 법

`/kihoek`이 알아서 돌리지만 직접 돌릴 수도 있습니다: `promo.py check content/out/<id>` → 같은 폴더에 `check-report.md`.

- **PASS / FAIL** — FAIL이 하나라도 있으면 FAIL(종료코드 1). WARN은 확인 권장, INFO는 참고입니다. `--strict`를 붙이면 WARN도 실패로 칩니다.
- **엄격 모드** — `type`이 plan·proposal이거나 `review --as`일 때, **가장 높은 번호의 draft 하나**에 강화된 규칙이 적용됩니다. 옛 draft·`ideas.md`·`requirements.md`는 개인정보·금지어·단체명만 봅니다. `/promo` 홍보물은 기존 규칙 그대로입니다.

| 규칙 | 보는 것 | 계획·신청서 | 그 외 (`/promo`) |
|---|---|:-:|:-:|
| R0 | `brief.md`가 있는가 | WARN | WARN |
| R1 | 개인정보(휴대전화·이메일·주민번호·직인) + denylist 실명 | FAIL | FAIL |
| R2 | 변경 전 수치·명칭, 재단 표기 금지어('후원' 등) | FAIL | FAIL |
| R3 | 재단 지원 문구 | 면제(INFO) | FAIL (최종본) |
| R4 | 금액이 facts나 검산된 표에 있는가 | FAIL | WARN |
| R4b | 예산표 검산 | FAIL | — |
| R5 | 날짜가 facts에 있는가 | FAIL | WARN |
| R6 | 단체명 오기 | FAIL | FAIL |
| R7 | 빈 자리(초안에 남은 골격 `{{…}}`) · 빈 슬롯(visual 슬롯 YAML의 빈 값) | WARN (빈 자리) | WARN (빈 슬롯) |
| R1 추출 불가 | hwpx·docx에서 글자를 못 읽음 — 개인정보 검사가 안 됐다는 뜻 | WARN | WARN |
| R8 | facts 주석 경로가 실제로 있는가 | FAIL | WARN |
| R8b | 실적 표현 옆 경로가 실적 자료인가 | WARN | — |
| R9 | 골격 필수 절 헤딩 | FAIL | — |
| final_from | 한글 파일이 최신 초안에서 나왔는가 | WARN | INFO (doc 유형) |

- R1의 전화·이메일은 brief에 `contact_in_final: true`가 있으면 WARN으로 낮아집니다(최종본에 연락처를 넣는 경우).
- R2의 변경 전 표현은 "변경 전 …" 문맥 안에서는 허용됩니다. 내부용(`audience: internal`) 문서는 변경 전 표현 검사를 건너뛰지만 review는 예외입니다.

### 자주 보는 메시지와 해결

| 메시지 | 뜻 | 해결 |
|---|---|---|
| `R4b 예산 검산` | 식 값과 금액이 다름 | 식이나 금액 수정 |
| `R4b 합계` | 소계·합계·총계가 안 맞음 | 합을 다시 계산 |
| `R4b 파싱` | 식을 계산할 수 없음 | 범위·배수어·나눗셈 대신 `×`·`+` |
| `R4b 산출근거 없음` · `표 없음` · `합계 없음` | 식 칸이 빔 · 예산표가 없음 · 합계 행이 없거나 합계 뒤에 항목이 있음 | 채우기 · 합계를 맨 끝으로 |
| `R4 금액` | facts에도, 검산된 표에도 없는 금액 | facts 주석, 또는 `(신규 단가 — 확인 필요)`·`(산출: 식)` |
| `R4 산출 불일치` | `(산출: 식)`의 값이 금액과 다르거나 계산 불가 | 식 수정 (괄호는 한 겹까지) |
| `R5 날짜` | facts에 없는 날짜 | 월·분기로, 또는 `(예정)` |
| `R8 facts 경로 — … 없음` | 주석 경로 오타 | `content/kb/facts.yaml`에서 경로 확인 |
| `R8 id 표기` | `[0]` 번호 인덱스 | `[id=…]`로 (경고라 PASS에는 영향 없음) |
| `R8b 실적 인용` | "달성·완료" 같은 말 옆에 계획 경로 | `outcomes.…` 경로로, 또는 계획 표현으로 |
| `R9 필수 절` | 골격 절 헤딩이 빠짐 | 골격 절 이름 그대로 (번호·기호는 무시됨) |
| `R1 PII(denylist)` | 학교 실명 등 | 지역+유형 표기로 |
| `final 갱신 필요` | 초안을 고친 뒤 한글 파일을 다시 안 만듦 | `/kihoek doc` 다시 |
| `골격 frontmatter` | 골격 파일 머리말 오류 | 템플릿 머리말 따옴표 확인 |

---

## 7. 지식베이스 구조

`content/kb/`는 세 층과 수치 원천으로 나뉩니다.

| 층 | 파일 | 담는 것 | 고치는 방법 |
|---|---|---|---|
| 계획·규정 | `01-사업개요` ~ `08-재단규정`, `02-단위사업/` 5개 | 확정된 계획·재단 규정 | `/promo kb-sync` (계획이 바뀔 때) |
| 실적 | `09-성과실적.md` | 단위사업별 한 일·산출물·집행 요약·외부 반응·확인 필요 | `/kihoek learn` |
| 교훈 | `10-교훈.md` | 잘된 것·바꾼 것·결정 기록·다음에 다르게·가정 | `/kihoek learn` |
| 수치 원천 | `facts.yaml` | 모든 숫자·날짜·이름 | 계획 → kb-sync, 실적(`outcomes`) → learn |
| 색인 (생성물) | `kb-index.yaml`, `_raw/_index.yaml` | 섹션 위치·글자 수·요약·키워드 | `promo.py kb-index` (자동) |
| 설정 | `kb-select.yaml`, `unit-map.yaml` | 명령별 기본 읽기 목록 · 앱 소분류 → 단위사업 | 사람이 직접 |
| 이력 | `learn-log.md` | learn 반영 기록 (개인정보 없음) | learn이 1줄씩 |

**`facts.yaml` 주요 키**

- `program` — 기간·예산·마감(`deadlines`)·원천징수 기준(`withholding_threshold`)
- `units` — 단위사업 6개: `research`(기초연구) · `app`(노동안전보건 APP) · `campaign`(캠페인) · `ai-club`(AI 학습동아리) · `regional`(지역협력) · `org`(조직)
- `kpi` — 성과지표 12개. id로 인용합니다(`kpi-research-report` 등)
- `unit_costs` — 단가 21개 (현재 전부 `note: 미확인`)
- `outcomes` — 실적: KPI 상태, 산출물 대장, 활동 횟수, 집행 요약(`budget_execution`)
- `plans_2027` · `strategy` · `partners` · `schools` — 다음 연도 계획·전략·협력기관·학교 현황(지역+유형)
- `deprecated` · `forbidden` — 변경 전 표현 · 재단 표기 금지어 (검사가 차단)
- `changelog` — 변경 이력 (10-교훈 §3 결정 기록과 1:1)

**섹션 주소(앵커)**: `kb/<파일>#<번호 또는 제목>[/<하위>]` — 예: `kb/01-사업개요.md#1`, `kb/09-성과실적.md#1/1.1`, `kb/02-단위사업/기초연구.md#현행-목표`

**읽기 예산** — 명령 한 번에 kb를 6만 자까지 읽습니다. 무엇을 읽을지는 `promo.py kb-select`가 정하고(설정 `kb-select.yaml` + 요청 문장의 단어), 결과가 그대로 `brief.basis`에 남습니다.

- `dropped` — 예산을 넘어 뺀 섹션. Claude가 목록을 보여 주면 필요한 것을 골라 주세요(한 번 다시 읽습니다).
- `missing` — 설정에는 있는데 kb에 없는 섹션. 설정이나 kb를 고칠 신호입니다.
- 현재 기본 분량: status 453 · idea 10,644 · plan 13,244 · proposal 14,772 · review 8,248 · learn 5,481자

**kb 파일을 직접 고칠 때**
- 머리말(frontmatter) 값에 `[`·`#`·`,`·`:`가 있으면 큰따옴표로 감쌉니다(값 안에 `"`가 있으면 작은따옴표).
- 계획층(01~08)에 실적 문장을 쓰지 말고 09로 보냅니다.
- 고친 뒤 `promo.py kb-index`.

---

## 8. 산출물 폴더와 brief.md

```
content/out/<YYYY-MM-DD-슬러그>/       git에 올라가지 않는 로컬 작업 폴더
  brief.md                매니페스트 (모든 종류 공통)
  ideas.md                idea
  draft.md · draft-v2.md  plan·proposal (엄격 검사는 가장 높은 번호 하나)
  requirements.md         proposal
  review.md · src/        review (src = 감사 대상 사본과 추출본)
  final/                  doc 결과 (HWPX)
  check-report.md         검사 결과
content/out/INDEX.md       전체 목록 — promo.py index 가 만듦 (직접 고치지 말 것)
```

**brief.md 주요 필드**

| 필드 | 뜻 |
|---|---|
| `type` | idea · plan · proposal · review (+ `/promo`의 visual · doc · text) |
| `status` | brief → draft → final (idea·review는 바로 final) |
| `audience` | 재단 · 외부 기관 · internal |
| `unit` | 단위사업 id |
| `templates` | 사용한 골격 (사업계획 · 공모신청서 · 아이디어보드) |
| `credit` · `credit_reason` | 재단 지원 문구 필요(required) / 면제(exempt)와 사유 |
| `basis` | 읽은 범위 기록 (kb-select 출력 그대로 — 손으로 고치지 않음) |
| `from_ideas` · `gaps_used` | 이어받은 아이디어 · 사용한 빈틈 코드 |
| `section_map` | 절 이름을 바꿨을 때 골격 절과의 대응 (proposal) |
| `review_as` | review 기준 (plan · proposal) |
| `final_from` | 한글 파일을 만든 초안과 지문 (doc-stamp가 기록) |
| `contact_in_final` | 최종본에 연락처를 넣음 → 전화·이메일 검사를 WARN으로 |
| `must_include` · `must_exclude` | 반드시 넣을 것 · 넣지 말 것 |

---

## 9. promo.py 명령어 레퍼런스

저장소 루트에서 `content/.venv/bin/python3 content/tools/promo.py <명령>`으로 실행합니다(아래 표에서는 `promo.py`로 줄임).

| 명령 | 용도 | 주요 옵션 | 종료 코드 |
|---|---|---|---|
| `kb-index` | kb 섹션 색인 생성 | `--check` 신선도만 확인 · `--raw` 원문 추출본 색인 · `--kb` · `--out` | 0 정상 · 1 오래됨(`--check`) · 2 머리말 오류 |
| `kb-select` | 명령별로 읽을 섹션 선택 | `--cmd`(필수) · `--unit` · `--query` · `--budget 60000` · `--raw` · `--include` · `--exclude` · `--emit plan\|basis` · `--strict` | 0 · 1 missing 있음(`--strict`) · 2 색인 없음 |
| `kb-outline <md>` | md 헤딩·줄 범위 표, 긴 문서를 조각으로 | `--chunk 15000` · `--json` | 0 |
| `kb-extract <형식> <원본> --out <md>` | pdf · hwpx · docx → 텍스트(md) | `--headings` · `--pages 3-7`(pdf) | 0 · 2 형식 불일치(.hwp 등)·깨진 파일 · 3 텍스트 없음(스캔본) |
| `kb-extract --pii-scan <폴더>` | 폴더 안 텍스트의 개인정보·denylist 검사 | — | 0 없음 · 1 발견 |
| `exec-summary <xlsx\|csv>` | 앱 집행내역 → 단위사업·계정별 합계 | `--map content/kb/unit-map.yaml` · `--out` | 0 · 2 머리행 없음 |
| `doc-stamp content/out/<id>` | 최신 초안 지문 → `brief.final_from` | — | 0 · 2 brief·draft 없음, 머리말 형식 오류 (파일은 그대로) |
| `check content/out/<id>` | 산출물 검사 → `check-report.md` | `--strict` · `--facts` | 0 PASS · 1 FAIL |
| `index` | `content/out/INDEX.md` 재생성 | — | 0 |
| `selftest` | 검사기 자가진단 | `--render` (렌더 재현성까지) | 0 PASS · 1 FAIL |

**세부 동작**

- **kb-index** — 섹션마다 앵커·시작/끝 줄·글자 수·요약(120자)·키워드(8개)를 적고, 파일마다 지문(sha1)을 남겨 `--check`가 바뀐 파일을 알아냅니다. 두 번 돌려도 결과가 같습니다.
- **kb-select** — `--query`의 단어가 섹션 키워드와 맞으면 3점, 요약에 있으면 1점으로 기본 목록에 추가합니다. `--emit plan`은 읽을 목록(앵커·줄 범위·글자 수·선택 이유), `--emit basis`는 brief에 붙일 기록을 냅니다. 예산을 넘는 섹션은 건너뛰고 계속 담습니다(`dropped`).
- **kb-extract** — hwpx·docx는 문단 하나가 한 줄, 표는 md 행입니다. 병합 셀은 값을 반복해 열을 맞추고, 글상자 안 문단은 한 번만 뽑습니다. `--headings`는 `1.`·`제1장`·`Ⅰ.`로 시작하는 줄을 `##` 헤딩으로 바꿉니다(필수 절 검사용). 추출 직후 개인정보가 발견된 줄을 알려 줍니다. `tables` 형식은 HTML 표가 든 md를 md 표로 바꿉니다(변경신청서 정리용). 한글 문단의 탭·줄바꿈은 공백으로 바뀌고, Strict 형식으로 저장한 워드 파일도 읽습니다. `--headings`는 번호가 지워진 내보내기 헤딩(골격 절 이름의 짧은 줄, 번호바 표)도 헤딩으로 알아봅니다.
- **exec-summary** — 머리행은 앞부분만 맞으면 됩니다(`집행일`·`소분류`·`유형`·`금액`·`상태`). 결과는 `as_of`·`date_range`·`source_rows`·`status_counts`·`by_unit`·`by_account`·`unmapped`이고, 수취인·설명은 내보내지 않습니다. `대기`/`pending`은 제외, 음수(환입)는 반영합니다.
- **selftest** — `/promo` 픽스처 · 계획서 픽스처(기대·금지 목록) · brief 없음 · 예산식 평가·예산표 케이스 · 리뷰 결함·테스트 공백 회귀 · 색인 재현성과 `--check`(최신·오래됨). 케이스 개수는 selftest 출력에 나옵니다. 개인정보 목록은 가상 토큰으로 바꿔 끼워 실행하므로 기계마다 결과가 같습니다.

---

## 10. 개인정보·재단 규정 안전장치

| 장치 | 언제 작동 |
|---|---|
| denylist 실명 검사 (R1) | 모든 산출물 검사, 추출 직후, learn 반영 후 |
| 휴대전화·이메일·주민번호·직인 패턴 (R1) | 같음 |
| 마스킹 확인 표 · 행 단위 승인 | learn 반영 전 |
| 집행 원본 비열람 | learn `--kind summary` (요약 YAML만 읽음) |
| 원본 무수정 | review |
| 원본·추출본 보관 | `data/`, `data/_extract/` — git 제외 |
| `⚠ 규정` 블록 | plan·proposal 초안 맨 위 |
| 변경 전 표현·금지어 (R2) | 모든 산출물 |

**사람이 지킬 것**

- 학교는 실명 대신 **지역+유형**으로 씁니다 (예: "인천 소재 반도체고").
- 연락처는 초안에 넣지 않고 `(연락처는 최종본에 기입)`으로 비워 두었다가 최종본에만 넣습니다. 그때 brief에 `contact_in_final: true`.
- 새로 등장한 실명은 `data/pii-denylist.txt`에 추가합니다.
- 재단 표기: '후원' 대신 '지원', '아름다운재단'은 붙여 쓰고, 단체명은 '청년노동자인권센터'.

---

## 11. 유지보수 — 언제 무엇을

| 상황 | 할 일 |
|---|---|
| 사업변경신청 등으로 계획이 바뀜 | `/promo kb-sync` (끝에 색인도 다시 만듦) |
| 보고서·회의록·산출물이 생김 | `/kihoek learn <파일>` |
| 분기 말·정산 전 | 집행내역 전체 내보내기 → `/kihoek learn … --kind summary` |
| status에 "learn 권장" | 실적 기준일이 30일 지남 → learn |
| 단가를 확인함 | `facts.yaml`의 `unit_costs`에서 해당 `note: 미확인` 삭제 (10-교훈 §4 할 일) |
| 끝난 KPI가 '위험'으로 뜸 | learn(보고서·증빙)으로 `outcomes.kpi_status` 갱신 |
| kb md를 직접 고침 | `promo.py kb-index` |
| 앱에 새 소분류가 생김 | `content/kb/unit-map.yaml`에 `소분류명: 단위사업id` |
| 새 실명이 등장 | `data/pii-denylist.txt`에 추가 |
| `promo.py`·골격·`kb-select.yaml`을 고침 | `promo.py selftest` PASS + `promo.py kb-select --cmd <각 명령> --unit research`에서 `missing` 없음 확인 |

---

## 12. 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `kb-index --check  오래됨` | 색인 뒤에 kb·facts가 바뀜 | `promo.py kb-index` (`/kihoek`은 자동으로 함) |
| `FAIL <파일>: frontmatter` (종료 2) | kb 머리말 YAML 오류 | [7장](#7-지식베이스-구조) 따옴표 규칙 |
| 추출 종료 2 | `.hwp`, 확장자 불일치 | 한글에서 HWPX·PDF로 저장 |
| 추출 종료 3 | 스캔 PDF, 이미지뿐인 문서 | 텍스트 PDF·HWPX 원본 |
| `dropped`가 있음 | 6만 자 초과 | 필요한 섹션을 골라 다시 읽기 (Claude가 물어봄) |
| `missing`이 있음 | `kb-select.yaml`의 앵커가 kb에 없음 | 설정이나 kb 섹션 이름 수정 |
| 옛 `/promo` 산출물이 R1 denylist로 FAIL | denylist는 모든 산출물에 적용 | 그 산출물의 실명을 지역+유형으로 |
| `R8 id 표기` WARN이 많음 | 옛 산출물의 `[0]` 인덱스 | `[id=…]`로 (PASS에는 영향 없음) |
| exec-summary `unmapped` | `unit-map.yaml`에 없는 소분류 | unit-map 보완 |
| check `R1 추출 불가` | hwpx·docx가 깨졌거나 이미지뿐이라 글자를 못 읽음 | 원본을 다시 저장하거나 PDF·md로 확인 — 이 파일은 개인정보 검사가 안 된 상태 |
| exec-summary `머리행을 찾지 못함` | 첫 10행 안에 `집행일`·`소분류`·`유형`·`금액`·`상태` 머리행이 없음 | 앱에서 내보낸 파일을 그대로 사용 (오류 메시지에는 행 값이 나오지 않음) |
| `selftest FAIL` | 검사기 변경의 부작용 | 출력의 `FAIL …` 줄이 가리키는 규칙 확인 |

---

## 13. 현재 한계

2026-09-25 기준입니다.

- **실사용 검증 전**: `idea`(실제 채택 흐름), `review`(실제 초안), `proposal`(공모 요강 샘플 필요). 처음 쓸 때 결과를 한 번 더 확인해 주세요.
- **재단 공식 양식 HWPX 미확보** → `doc`은 기본 보고서 서식으로 변환합니다.
- **단가 21개 미확인** → 계획서마다 "미확인 단가"로 표시됩니다.
- **집행 실적은 2026-06-30 기준** → 최신화는 `learn --kind summary`.
- **글자 인식(OCR) 없음**(스캔 PDF 불가), **구형 `.hwp` 직접 읽기 불가**.
- 색인 키워드가 완벽하지 않아 요청 문장의 단어 매칭이 가끔 엉뚱할 수 있습니다 — `basis.sections_read`를 보고 필요하면 섹션을 지정해 달라고 하세요.

---

## 부록 A. 파일 지도

| 경로 | 역할 |
|---|---|
| `.claude/skills/kihoek/SKILL.md` | `/kihoek` 규칙·절차 (Claude가 읽는 원본) |
| `.claude/skills/kihoek/references/` | context-budget · ideation · plan-rules · proposal-mapping · learn · checklist |
| `content/kb/` | 지식베이스 ([7장](#7-지식베이스-구조)) |
| `content/templates/docs/` | 골격: 사업계획 · 공모신청서 · 아이디어보드 (+ `/promo` 골격) |
| `content/tools/promo.py` | 색인·선택·추출·검사·요약 도구 |
| `content/tools/md2hwpx.py` | md → HWPX 변환 |
| `content/out/` | 산출물 (로컬 전용) |
| `data/` | 원천 문서·개인정보 목록·추출본 (git 제외) |
| `docs/02-design/features/사업기획-AI-도우미.design.md` | 설계서 |
| `docs/03-analysis/사업기획-AI-도우미.analysis.md` | 검증 결과 |

## 부록 B. 용어

| 용어 | 뜻 |
|---|---|
| facts | `content/kb/facts.yaml` — 모든 숫자·날짜·이름의 단일 원천 |
| kb | 지식베이스 `content/kb/` |
| 앵커 | kb 섹션 주소 (`kb/01-사업개요.md#1`) |
| 색인 | 섹션 위치·크기·요약 목록 (`kb-index.yaml`) |
| 읽기 예산 | 명령 한 번에 읽는 kb 분량 상한 (6만 자) |
| basis | 읽은 범위 기록 (`brief.basis`) |
| 골격 | 문서 틀 (`content/templates/docs/*.md`) — 필수 절·예산표 규칙을 선언 |
| 최신 draft | `draft.md`·`draft-v2.md`… 가운데 가장 높은 번호 |
| 엄격 모드 | plan·proposal·review(`--as`)에 적용되는 강화 검사 |
| denylist · allowlist | 금지 이름 목록 · 예외 이름 목록 |
| 빈틈 (G1~G7) | idea가 찾는 7가지 기회 유형 |

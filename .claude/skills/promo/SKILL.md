---
name: promo
description: "청년노동자인권센터 사업문서 기반 홍보물·문서 생성. 카드뉴스·포스터·리플릿 이미지(PNG/PDF), 보고서·공문·제안서(HWPX/DOCX), 보도자료·소개글 텍스트. 사용: /promo brief|draft|visual|render|doc|check|kb-sync|status"
argument-hint: "<brief|draft|visual|render|doc|check|kb-sync|status> [args]"
---

# /promo — 홍보콘텐츠 생성 워크플로

로컬 전용. 사업 문서 지식베이스(`content/kb/`)에 근거해 텍스트 초안과 이미지를 만든다. 서버·API 키 없음.

```
brief ──▶ draft ──▶ visual ──▶ render ──▶ (check) ──▶ final
                └──▶ doc (hwpx/docx) ──▶ (check) ──▶ final
kb-sync : data/ 에 새 문서가 들어왔을 때 kb 갱신
status  : 기준 시점 · 진행 중 산출물
```

## 절대 규칙

1. **숫자·날짜·명칭은 `content/kb/facts.yaml`에서만** 인용한다. kb md는 서술·맥락용. 충돌 시 facts가 이긴다.
2. 초안의 모든 수치 옆에 근거 주석: `<!-- facts: units.campaign.schools -->` (final 변환 시 제거).
3. **변경 전 수치 금지** (`facts.deprecated`), **재단 표기 규정** (`facts.forbidden`, `kb/08-재단규정.md`): '후원'이 아니라 '지원', '아름다운재단' 붙여 쓰기, 대외 산출물에 `credit_line` 필수.
4. **개인정보 금지**: 연락처·주소·계좌·직인·학생 실명·학교 실명은 초안에 넣지 않는다. 필요한 자리는 `(연락처는 최종본에 기입)`으로 비운다. 학교는 지역명(인천·대구·충북)까지만.
5. 도구 실행은 항상 `content/.venv/bin/python3 content/tools/promo.py <cmd>`.
6. 응답 첫 줄에 기준 시점 표시: `기준: {facts.meta.as_of} 사업변경신청서`.

## 라우팅

`$ARGUMENTS` 첫 토큰 = 서브커맨드. 없으면 `status`. 두 번째 토큰이 `<id>`(= `content/out/` 폴더명)이면 그 작업, 없으면 `content/out/`에서 `status != final`이고 `type ∈ {visual, doc, text}`인 최신 폴더 (`idea|plan|proposal|review`는 `/kihoek`의 것).

시작 시 항상 읽기: `content/kb/facts.yaml` + `content/kb/kb-index.yaml` (먼저 `promo.py kb-index --check` — 1이면 `promo.py kb-index`로 재생성, 2면 frontmatter 파싱 실패 파일을 보고하고 중단). 필요한 절은 색인의 앵커 `a`·줄 범위 `l`~`e`로 `Read(offset=l, limit=e-l+1)` — 보통 해당 단위사업 `02-단위사업/*.md`, `06-메시지.md`, `08-재단규정.md`. 서브커맨드별 상세는 `references/` 참조.

| 서브커맨드 | 참조 |
|---|---|
| brief / draft | `references/writing-rules.md` (대상별 어조·분량·금칙) |
| visual / render | `references/templates.md` (템플릿 카탈로그·슬롯표·글자수) |
| doc | `references/doc-export.md` (hwpx·docx 변환 절차) |
| 모든 단계 | `references/checklist.md` (단계별 체크) |

## 서브커맨드

### `brief <자연어 요청>`

1. 요청에서 `type`(visual/doc/text) · `audience` · `unit` · `templates` · `channel` · `deadline`을 추론. 확정 불가 항목만 AskUserQuestion **1회**.
2. 관련 kb 열람 → 핵심 메시지 3개, 필수 표기, 근거 경로 확정.
3. `<id> = YYYY-MM-DD-<한글슬러그 3어절 이내>`. `content/out/<id>/brief.md` 작성 (아래 frontmatter). audience가 `internal`이 아니면 `must_include`에 `credit_line`.
4. 응답: 브리프 요약표 + "다음: `/promo draft`".

```yaml
---
id: 2026-09-20-열아홉-토론회-포스터
type: visual            # visual | doc | text
audience: 시민·활동가   # 학생|교사|학교|지역단체|재단|시민·활동가|언론|후원자|internal
channel: [인스타그램, 학교게시]
unit: research          # facts.units[].id 또는 org
templates: [poster-a4, card-square]   # type=doc이면 templates/docs 이름
purpose: "…"
key_messages: ["…", "…", "…"]
must_include: [credit_line, dates, partners]
must_exclude: [대표 연락처, 학교 실명]
sources: [{facts: "units.research.events[0]"}, {kb: "02-단위사업/기초연구.md#토론회"}]   # 대괄호·# 포함 값은 따옴표
deadline: 2026-10-01
status: brief           # brief → draft → visual → final
created: 2026-09-20
---
## 요청 원문
## 브리프 본문
```

### `draft [<id>]`

1. brief 읽기. `type`이 doc/text면 `content/templates/docs/<템플릿>.md` 골격을, visual이면 `references/templates.md`의 슬롯 글자수 규격을 로드.
2. `references/writing-rules.md`의 audience 어조표를 적용해 초안 작성. visual은 슬롯별 **짧은/긴 두 버전** 제시.
3. `content/out/<id>/draft.md` 저장 (있으면 `draft-v2.md`…). brief `status: draft`.
4. 응답: 초안 전문 + 인용 facts 경로 목록 + "수정 후 `/promo visual` 또는 `/promo doc`".

### `visual [<id>] [<template>[,<template>]]`

1. 확정 초안 → 템플릿별 `content/out/<id>/visual/<template>-<nn>.yaml` (카드뉴스는 페이지당 1파일, `page:` 순번, 표지는 `variant: cover`). 슬롯 형식은 `references/templates.md`.
2. `promo.py fill content/out/<id>/visual/*.yaml` → `.html`. `WARN slot=…` 이 나오면 해당 슬롯을 줄여 재실행 (최대 2회). 로고 파일 없음 경고는 워드마크 폴백이므로 무시.
3. brief `status: visual`. 응답: 파일 목록 + 남은 경고 + "다음: `/promo render`".

### `render [<id>]`

1. `promo.py render content/out/<id>/visual/*.html --out content/out/<id>/final/`
2. 생성된 PNG(인쇄물은 `-preview.png`)를 **Read로 열어 시각 검토**: 잘림·겹침·빈 슬롯·폰트 폴백 경고.
3. 문제면 원인을 구분해 보고 — 문안 길이면 `visual` 재실행 제안, 템플릿 CSS면 `content/templates/visual/*.html` 수정 제안.
4. `promo.py check content/out/<id>` 실행. PASS면 brief `status: final` + `promo.py index`. FAIL이면 항목 보고하고 final로 올리지 않는다.
5. 응답 마지막에 **사용자 확인 사항**: 로고 파일, 학교 실명, 연락처 기입, 재단 배포 전 문의.

### `doc [<id>] [hwpx|docx]`

`references/doc-export.md` 절차. 요약: 초안 확정 → `promo.py doc-stamp content/out/<id>` → hwpx는 doc-stamp가 출력한 최신 draft로 `content/tools/md2hwpx.py <최신 draft> --template <gonmun|report|proposal|base> --output final/<id>.hwpx` (내부에서 hwpx 스킬 build·validate 호출; 레퍼런스 양식이 있으면 `hwpx` 스킬 직접) / docx는 `document-skills:docx` → `content/out/<id>/final/<id>.hwpx|docx` → `promo.py check` → PASS면 `status: final`.

### `check [<id>]`

`promo.py check content/out/<id>` 실행 결과를 표로 보고. 규칙: R0 brief · R1 개인정보(+denylist) · R2 deprecated/forbidden · R3 credit_line(`credit: exempt`면 생략) · R4 금액 · R5 날짜 · R6 단체명 · R7 빈 슬롯 · R8 facts 경로(WARN). `type`이 plan·proposal(또는 review_as)이면 R4b·R8b·R9·R7 빈 자리가 추가되고 R4·R5·R8이 FAIL로 오른다(`/kihoek`). final_from은 doc·plan·proposal에서 final/이 있을 때(`/promo doc`에는 INFO만), R1 추출 불가는 모든 산출물. FAIL이 있으면 어떤 파일 몇 줄을 어떻게 고칠지 제안.

### `kb-sync <data/새문서.md>`

1. 새 문서를 읽고 `facts.yaml`과 비교 → 변경 후보 표 (facts 경로 / 현재값 / 새값 / 근거 줄).
2. AskUserQuestion으로 반영 승인.
3. 반영: `facts.yaml` 값·`meta.as_of`·`meta.source`·`changelog`·`deprecated` 갱신 → `kb/07-변경이력.md`에 새 절 추가 → 영향받는 `kb/02-단위사업/*.md`·`03-예산.md`·`04-성과지표.md`·`05-일정.md` 본문 수정.
4. `promo.py kb-extract --pii-scan content/kb` 0건 확인 → `promo.py kb-index`(+`--raw`) 재생성 후 보고. 표 손상 문서는 `promo.py kb-extract tables <md> --out content/kb/_raw/…`로 먼저 변환.
5. kb-sync는 **계획이 바뀐 것**(변경신청·확정 결정)만 다룬다. 결과·실적(한 일·산출물·집행 요약·교훈)은 `/kihoek learn`으로 `09-성과실적`·`10-교훈`·`facts.outcomes`에 반영한다.

### `status`

`facts.meta.as_of`, `content/out/INDEX.md` 요약(status별 개수), 진행 중(brief/draft/visual) 목록, 다음 권장 행동.

## 파일 규약

```
content/out/<id>/
  brief.md · draft.md (draft-v2.md…) · visual/<template>-<nn>.yaml|.html
  final/<template>-<nn>.png | <name>.pdf + <name>-preview.png | <id>.hwpx|docx
  check-report.md
content/out/INDEX.md   ← promo.py index 가 재생성 (수동 편집 금지)
```

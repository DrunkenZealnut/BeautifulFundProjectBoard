# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템 — 청년노동자인권센터용.
총 사업비 7천만원 예산 집행 관리, 일정, 갤러리, 게시판, 뉴스레터, 학교관리 통합 웹앱.
**단일 사용자** (대표 1인, 직원 없음). 아름다운재단이 대시보드에 직접 접속하여 집행 현황 확인.

## Tech Stack

- **Frontend**: React 18 (no-build, CDN via unpkg/jsdelivr) + Babel standalone transpiler
- **Backend**: Supabase (PostgreSQL + RLS, `bf` schema) — anon key hardcoded in `index.html`
- **Serverless**: Vercel Python functions (`api/`) — HWPX 생성/서식채우기, NEIS 프록시, AI 재작성, 관리 API
- **CDN Libraries**: Chart.js, DOMPurify, JSZip, SheetJS, html2pdf.js, pdf.js (pdfjs-dist 3.11.174 UMD), Google APIs (Calendar + GSI)
- **Language**: Korean-first UI, English code comments

## Running the Application

No build step. Serve static files:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. No package.json, no npm install, no linter, no test runner.

`api/` Python functions are **not** served by `http.server` — they only run on Vercel (`vercel dev` or a preview deployment). Required env vars (set in Vercel project settings):

| Var | Used by |
|-----|---------|
| `ANTHROPIC_API_KEY` | `api/rewrite.py` |
| `NEIS_API_KEY` | `api/neis.py` |
| `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `api/supabase-admin.py` |

## Database Setup

Execute in Supabase SQL Editor in order:
1. `supabase-schema-safe.sql` — All tables, indexes, RLS, sample data
2. `supabase-migration-auth.sql` — Users RLS + 로컬 개발용 초기 관리자 (배포 전 변경 필수)

Additional migrations (apply in order): `supabase-migration-{rls-improved,gallery-category,gallery-rls-fix,password-hash,recipients,features,rls,schools,projects,execution-project-id,admin-sql,newsletters,payee-rules}.sql`

Note: migrations before the bf-schema switch (commit 014b8bb) target `public.`; `newsletters` onward target `bf.` directly.

## Architecture

### Single-file SPA

The entire app lives in `index.html` (~14,600 lines). **Only `index.html` is the live app.** Root also contains older standalone prototypes — `index-simple.html`, `index-supabase.html`, `budget-management-advanced.html` — and superseded schema files (`supabase-schema.sql`, `database-schema.sql`). Do NOT edit these; the canonical schema is `supabase-schema-safe.sql`.

Top to bottom, `index.html` is:

1. **CDN imports** (React, ReactDOM, Babel, Supabase, Chart.js, DOMPurify, JSZip, SheetJS, Google APIs)
2. **Inline `<style>` block** (~2300 lines) — includes `@media print` for dashboard printing
3. **Single `<script type="text/babel">` block** (from ~line 2369) containing:
   - Supabase client init with `db: { schema: 'bf' }` (~line 2381) — so `.from('table')` needs no schema prefix
   - `CONFIG` constant — budget, tax rates, periods (~line 2386)
   - `EXECUTION_STATUS` — approval workflow states (~line 2400)
   - HWPX fill builders (`buildSalaryFillDocs`/`buildReceiptFillDocs`/`buildMinutesFillDocs`) (~line 2766)
   - `BUDGET_DATA` — budget hierarchy structure (~line 3059)
   - `DOCUMENT_RULES` — evidence requirements per expense type (~line 3195)
   - `downloadHwpxFill` — HWPX fill download dispatcher (~line 3408)
   - 입금확인증 PDF parser (`extractPdfPages`/`extractPdfPageFile`/`DEPOSIT_PDF_LABELS`/`parseDepositConfirmation`/`executionDupKey`/`matchDuplicateExecutions`) (~line 3457)
   - Newsletter template system (`_nlEsc` ~3437, `NL_FONTS`/`NL_EMAIL_FONT` ~3466, `NL_THEMES` ~3474, `generateNewsletterHTML` ~3730)
   - `LoginPage` — authentication component (~line 4195)
   - `ProjectManagementSystem` — root component (~line 4304, ~10,000 lines)
4. **Service worker** registration and offline handlers (`service-worker.js`, network-first with cache fallback; Supabase/Google requests bypass it)

Use `/find-component <name>` to locate symbols — line numbers above drift with every edit.

### Critical constraint: Babel standalone

Code is transpiled by Babel standalone in the browser. This means:
- **Do NOT use React hooks (`useMemo`, `useCallback`, `useEffect`) inside `render*()` helper functions** — only at the top level of `ProjectManagementSystem()`. The `render*()` functions are regular functions called during render, not React components, so hooks inside them violate React's rules and cause a white screen. (`renderMonthlyChart` is the one existing `useCallback` — it is declared at top level, not inside another renderer.)
- `catch {}` (without parameter) works in the CDN Babel version but avoid if possible.
- No source maps, no linter: a syntax error anywhere in the babel block yields a blank page with the error only in the browser console.

### Root component structure

`ProjectManagementSystem` contains ALL app state (~173 `useState` declarations) and these page renderers:

| Function | ~Line | Page | Key features |
|----------|-------|------|-------------|
| `renderDashboard()` | 5770 | 대시보드 | Budget gauge, alerts (`getDashboardAlerts()`), category breakdown, print/snapshot export |
| `renderSchedule()` | 6741 | 일정 관리 | Calendar view, list view, Google Calendar sync |
| `renderBoard()` | 8330 | 게시판 | 4 categories (공지/자료/보고서/자유), rich text, comments |
| `renderGallery()` | 8551 | 갤러리 | Categorized images, ZIP download, newsletter integration |
| `renderBudget()` | 8704 | 예산 관리 | 8 sub-tabs (dashboard, breakdown, register, import, calculator, history, ratio, calendar) — `import` = 일괄등록 (입금확인증 PDF / 은행 엑셀) |
| `renderGuide()` | 11511 | 회계가이드 | Accounting rules, withholding tax calculator, FAQ |
| `renderNewsletter()` | 12028 | 뉴스레터 | 3-step wizard (내용선택 → 템플릿 → 배치/편집), 7 templates, AI rewrite, iframe preview (desktop/mobile), save/load drafts (`bf.newsletters`), color/font customization, inline editing |
| `renderSchools()` | 12778 | 학교관리 | NEIS API school search, timetable viewer, textbook management |
| `renderAdmin()` | 13170 | 관리자 | Users, recipients, org settings, project management (admin-only) |
| `renderContent()` | 14019 | — | `currentPage` switch |

Navigation is state-driven via `currentPage` (no URL routing).

### Newsletter Template System

7 templates using a unified theme architecture:

- **Modern/Magazine/Classic/Bold/Community**: Rendered via `NL_THEMES` theme objects → `_nlGenerateThemed()` shared renderer. Each theme defines `header`, `title`, `greeting`, `closing`, `footer`, `sectionLabel`, `scheduleItem`, `boardItem`, `galleryItem` as functions returning HTML strings, plus `galleryGrid`/`contentPad` style strings. `community` (Figma-derived card-list design) is the default template.
- **Email**: `generateNewsletterEmail()` — table-based layout for Gmail/Outlook compatibility
- **Grid**: `generateNewsletterGrid()` — Hoom-style 3-column card grid with featured center

`generateNewsletterHTML(template, config, sections, orgName, assets)` is the unified dispatcher.
- `sections`: `[{ type: 'boards'|'schedules'|'gallery', label, items }]` — ordering AND labels controlled by user in Step 3 (`sec.label` flows into `sectionLabel()`; email/grid take a `labels` param)
- `assets`: `{ boardImageUrls, rewrittenContents, galleryThumbUrls, itemLinks }`

To add a new themed template: add an entry to `NL_THEMES` with the required render functions AND add a matching card to the template picker list in `renderNewsletter` (`{ id, name, desc, color, preview }`). For custom layouts (like email/grid), add a standalone generate function and a layout check in the dispatcher.

**Color/font customization** works by post-processing the generated HTML (`applyCustomDesign` in `renderNewsletter`): the theme's declared `accent`/`accent2` hex strings are string-replaced with user-picked colors, and font stacks likewise (`NL_FONTS`, `NL_EMAIL_FONT`). Theme render functions hardcode hex values — keep each theme's declared `accent`/`accent2` in sync with the hex actually used in its render functions, or replacement silently stops working.

**Save/load** (`bf.newsletters`): full snapshot serialization — `config` (+`custom`), `sections` (orderedSections verbatim), `assets` (incl. `editedItems`), `selection` (Step 1 checkbox IDs). Inline title edits live in `editedItems` state; body edits reuse `rewrittenContents` (same override slot as AI rewrite). `syncSections()` merges fresh selection into existing sections on Step 3 entry — do not revert to rebuild-on-entry or user ordering/labels are lost.

### 홍보콘텐츠 생성시스템 (`content/` + `/promo`)

Local-only workspace, independent of `index.html`. Source docs in `data/` (git-ignored, contains PII) are distilled into `content/kb/` — `facts.yaml` is the **single source of truth** for every number, date, and name (baseline: 2026-08-23 사업변경신청서 "변경 후"); the `01`~`08` markdown files are narrative context. `facts.deprecated` lists pre-change figures (캠페인 30회, 청소년참견위원회…) and `facts.forbidden` the foundation's wording rules ('후원'→'지원', '아름다운재단' no space) — `promo.py check` fails any output containing them.

- `/promo brief|draft|visual|render|doc|check|kb-sync|status` — skill in `.claude/skills/promo/`; workflow and rules in its `SKILL.md` + `references/`
- `content/tools/promo.py` — single CLI: `fill` (slot YAML → HTML via mini-mustache, warns on `promo-slots` length limits), `render` (Playwright Chromium → PNG @2x / A4 PDF + preview), `check` (R1 PII · R2 deprecated/forbidden · R3 credit_line · R4 amounts · R5 dates · R6 org name · R7 empty slots), `index`, `kb-extract`, `selftest [--render]` (check 민감도 픽스처 + 렌더 재현성)
- `content/tools/md2hwpx.py` — markdown subset → section0.xml → hwpx skill `build_hwpx.py`/`validate.py` (proposal/report/gonmun/base styles)
- Templates: `content/templates/visual/*.html` (6: card-square, card-portrait, og-banner, poster-a4, leaflet-3fold, notice-a4 — each declares `promo-size`/`promo-print`/`promo-slots` meta) and `content/templates/docs/*.md` (6 skeletons)
- `content/brand/tokens.css` must stay in sync with `NL_THEMES.community` in `index.html` (`#0b98ff`/`#f9e450`/`#131313`); Pretendard Variable (OFL) is vendored in `content/brand/fonts/`
- Outputs: `content/out/<YYYY-MM-DD-슬러그>/{brief.md, draft.md, visual/, final/, check-report.md}`; `content/out/INDEX.md` is generated — never hand-edit
- Runtime: `content/.venv` (playwright, pyyaml, lxml, pdfplumber). Rebuild with `python3 -m venv content/.venv && content/.venv/bin/pip install -r content/tools/requirements.txt && content/.venv/bin/playwright install chromium`
- Never write contact info, seals, or real school names into `content/kb/` or drafts; leave `(연락처는 최종본에 기입)` placeholders

### 사업기획 AI 도우미 (`/kihoek`, F-16)

`/promo`가 "정해진 것을 알리는 문서"라면 `/kihoek`은 "다음에 무엇을 할지"(아이디어·사업계획·공모신청서·초안 감사·결과물 학습). 같은 kb·facts·`promo.py`·`content/out/` 규약을 쓴다. 설계: `docs/02-design/features/사업기획-AI-도우미.design.md`. 사람용 사용 매뉴얼: `docs/manual/사업기획-AI-도우미.md` — 명령·옵션·check 규칙을 바꾸면 함께 갱신.

- **kb 3층**: 계획(01~08, `layer: plan|rule`) / 실적(`09-성과실적.md`, `layer: outcome`, 수치는 `facts.outcomes`) / 교훈(`10-교훈.md`, `layer: lesson`). 계획층에 실적 문장을 쓰지 말 것 — 09로. `facts.yaml`은 `schema_version: 2` (`kpi[].id` 12개 = 04 표 순서, `unit_costs` 단가 21개 — 계획서 예산 줄은 `unit_costs.<id>`만 인용, `outcomes`). 학교 실명은 kb에 쓰지 않고 `data/pii-denylist.txt`(git-ignored)로 관리
- **kb frontmatter**: `[`·`#`·`,`·`:`가 든 값은 큰따옴표(값에 `"`가 있으면 작은따옴표). 안 지키면 `promo.py kb-index`가 종료코드 2로 파일명을 보고한다
- **색인·읽기 예산**: `promo.py kb-index`(`content/kb/kb-index.yaml`, 파일별 sha1로 신선도 `--check`; `--raw`는 `_raw/_index.yaml`) → `promo.py kb-select --cmd <sub> [--unit] [--query] --emit basis`가 읽을 섹션(앵커 `kb/<파일>#<번호|텍스트>[/<하위>]`, `l`~`e` 줄)을 6만 자 안에서 정하고 그 출력을 `brief.basis`에 그대로 붙인다. 기본 앵커는 `content/kb/kb-select.yaml`(`units` 맵 포함). 색인·선택 결과는 결정적(2회 실행 동일)
- **check 규칙 추가** (`type ∈ {plan, proposal}` 또는 `review_as`에만 FAIL. R1 denylist는 모든 산출물에 적용되므로 옛 산출물에 학교 실명이 남아 있으면 FAIL로 바뀔 수 있다 — brief·초안의 실명을 지역+유형으로 고친다): R0 brief 없음 · R1 denylist · R3 `credit: exempt`(골격 `credit_default`) · R4 금액/R5 날짜 FAIL 상향(예외 `(신규 단가 — 확인 필요)`·`(추정)`·`(산출: 식)`·`(예정)`·`(안)`) · **R4b 예산 검산**(`| 계정항목 | 금액 | 산출근거 |` 표, 단가×수량 식을 AST로 평가, 항목 행 0.1% 허용오차·소계/합계/총계 정확 일치, 범위 `3~4회`·배수 `1천만원`·나눗셈 `/`·뺄셈은 파싱 WARN; `(산출: 식)` 표식은 값 불일치·파싱 불가면 FAIL) · **R8 facts 경로**(`<!-- facts: a.b, units[id=x].c -->` — 리스트는 `.id`로도 접근, 쉼표 뒤 형제 약식 허용, `[n]` 정수 인덱스는 WARN) · R8b 실적 인용(실적 표지어 + `outcomes.*` 밖 경로) · R7 빈 자리(초안에 남은 골격 `{{…}}`, WARN) · R1 추출 불가(hwpx·docx 텍스트 못 읽음, WARN) · **R9 필수 절**(골격 `required_sections`, 번호·기호 무시 부분 일치, `brief.section_map`) · `final_from`(`promo.py doc-stamp`가 최신 draft sha1 기록). 규칙은 최신 draft(`draft(-vN).md` 최고 버전)에만 — 옛 draft·ideas·requirements는 R1/R2/R6만
- **도구**: `kb-index`·`kb-select`·`kb-outline`·`kb-extract hwpx|docx [--headings]`(문단 단위, 안전한 lxml 파서 — 병합 셀은 그리드로 정렬·상한, 글상자 문단은 한 번만, 탭·줄바꿈은 공백, Strict docx 지원, 깨진 파일은 종료 2)·`exec-summary <xlsx|csv> --map content/kb/unit-map.yaml`(수급자·설명 미출력, `대기`·`pending` 제외)·`doc-stamp`. `selftest`는 promo·plan·nobrief 픽스처(`_samples/_check-fixture*`, denylist는 가상 토큰으로 바꿔 끼움) + R4b 평가기·예산표 케이스 + 리뷰 결함·테스트 공백 회귀 + kb-index 재현성·신선도 — 개수는 selftest 출력을 볼 것(문서에 적지 않는다). `PROMO_DENYLIST`/`PROMO_ALLOWLIST` 환경변수로 목록 경로 대체 가능(selftest 용)
- **스킬**: `.claude/skills/kihoek/SKILL.md` + `references/{context-budget,ideation,plan-rules,proposal-mapping,learn,checklist}.md`. 골격 `content/templates/docs/{사업계획,공모신청서,아이디어보드}.md`(`budget_table`·`credit_default` 키). `learn`은 승인형 — kb 09·10·`facts.outcomes`는 learn(과 `/promo kb-sync`)만 쓴다. `learn-log.md`는 반영 이력(PII 없음)
- `/promo` 변경: 시작 시 `kb-index --check` + 색인 우선 읽기, 라우팅 기본 선택은 `type ∈ {visual, doc, text}`, `kb-sync` 끝에 `kb-index`, `doc` 직전 `doc-stamp`(변환은 doc-stamp가 출력한 최신 draft로)

### Serverless API Functions (`api/`)

| File | Endpoint | Purpose | Timeout |
|------|----------|---------|---------|
| `api/neis.py` | `GET /api/neis` | NEIS school search + timetable proxy | 10s |
| `api/hwpx.py` | `POST /api/hwpx` | HWPX (한글) document generation | 30s |
| `api/hwpx-fill.py` | `POST /api/hwpx-fill` | HWPX 서식 채우기 (급여명세서·영수증빙·회의일지) | 30s |
| `api/rewrite.py` | `POST /api/rewrite` | AI newsletter rewrite (Claude API) | 15s |
| `api/supabase-admin.py` | `POST /api/supabase-admin` | Admin SQL operations (bf schema) via service role — whitelisted in `ALLOWED_OPERATIONS` | 15s |

HWPX templates in `api/hwpxskill_templates/{base,gonmun,report,minutes,proposal}/`; HWPX build/validation helpers in `api/hwpxskill_scripts/`. Python deps are in `requirements.txt` (`lxml`) — used by the serverless functions only, not the static frontend.

**Important:** `hwpx.py` generates new HWPX from scratch (tab-separated text paragraphs). It does NOT support filling existing template forms with merged cells/checkboxes — that is `hwpx-fill.py`.

### HWPX Template Fill (F-13)

`api/hwpx-fill.py` fills foundation form templates via the unzip-replace-repackage approach: preprocessed templates in `api/hwpxfill_templates/{salary,receipt,minutes}/` contain `{{placeholder}}` markers in `Contents/section0.xml`; the server only substitutes placeholders (XML-escaped) and zips — data collection, formatting, and document splitting happen client-side in `buildSalaryFillDocs`/`buildReceiptFillDocs`/`buildMinutesFillDocs` + `downloadHwpxFill`. Grid limits per document: salary 12 payment rows, receipt 2 entries, minutes 6 attendees (excess splits into multiple documents; multiple documents return a ZIP). Templates are regenerated from `templates/*.hwpx` originals by `python3 scripts/preprocess_templates.py` — never edit `hwpxfill_templates` with the Hancom editor (it splits placeholder runs).

### 입금확인증 PDF 집행등록 (F-14)

일괄등록 탭(`budgetTab === 'import'`, `bankImportSource: 'pdf' | 'excel'`)과 단건 등록 폼의 「📎 입금확인증 PDF로 자동입력」 버튼이 같은 파서를 쓴다. 모든 처리가 브라우저 안에서 끝난다 (서버 전송 없음).

- `extractPdfPages(file, worker?, maxPages=MAX_PDF_PAGES(200))` → `{ pages: string[][], numPages }`: pdf.js `getTextContent()` 아이템을 y(±2pt)로 줄을 묶고 x로 정렬해 **페이지별** 줄 문자열 배열로 재구성 — PDFium 출력은 글자 1개가 아이템 1개이고 순서가 읽기 순서와 다르므로 정렬이 필수. 다건 처리 시 `new pdfjsLib.PDFWorker()` 하나를 넘겨 재사용(파일마다 새 워커 ≈ 70ms)
- **여러 장짜리 PDF**: 일괄등록은 쪽마다 확인증 1건(행에 `_pdfPage` 0-based, `_pdfPageCount`), 확인증이 아닌 쪽·텍스트 없는 쪽은 건너뛰고 안내. 텍스트가 한 쪽도 없으면(스캔본) 파일 전체 1건. 등록 시 `extractPdfPageFile(file, pageIndex, cache)`(pdf-lib 1.17.1 CDN, `window.PDFLib`)로 해당 쪽만 잘라 `원본_p3.pdf`로 첨부 — 본 행·수수료 행이 같은 쪽을 공유하므로 cache 사용, 분리 실패·라이브러리 미로드 시 파일 전체 첨부. 단건 폼은 1쪽만 채우고 1쪽만 첨부
- `parseDepositConfirmation(lines, fileName)`: `DEPOSIT_PDF_LABELS`(평문 라벨 → `_spaced`가 글자 사이 공백 허용 정규식 조립, 긴 라벨 우선)로 줄마다 라벨 위치를 찾고 "라벨 끝 ~ 다음 라벨 시작"을 값으로 취함. 빈 `lines`(스캔본)도 파서가 처리해 `'텍스트 없음(스캔본)'` 경고를 붙임. 신한은행 입금확인증만 검증됨. 매핑: 거래일시→`execution_date`(`normalizeDate`), 입금금액→`amount`(실지급액), 수취인성명→`recipient`, 출금통장표시내용→거래메모→파일명→`description`, 수수료→별도 집행 행(`_kind: 'fee'`, 본 행 예산항목 연동, 수취인 `신한은행`)
- **중복 판정**: 일괄 이체는 같은 초·같은 금액·같은 수취인으로 여러 건이 나가고 적요만 다르다 (실사용 57쪽 PDF에서 5건 확인). 업로드 내 중복 키는 `executionDupKey + 적요(parsed.memo)`, 기존 집행과는 `matchDuplicateExecutions`로 1:1 매칭(1단계 적요까지 같은 쌍, 2단계 나머지 순서대로) — DB에 있는 건수만큼만 중복 표시, 컴포넌트 `withPdfDups(rows, { updateSelection })`가 업로드 직후·편집 시 공용. PDF 행의 일자·금액·수취인·설명을 편집하면 미리보기 IIFE의 `rematchPdfDups`가 전 PDF 행을 같은 1:1 매칭으로 재판정
- 계좌번호(`acctOut`/`acctIn`)는 라벨 소비용으로만 매칭 — 결과 객체·state·로그에 넣지 말 것
- 증빙 첨부는 컴포넌트 헬퍼 `uploadExecutionDoc(execId, docName, file, tag)` → `insertExecutionDocs(rows)`(documents insert + `mergeExecutionDocs`)로 통일 — 단건 폼·수수료 후속·일괄 등록·집행내역 탭 재첨부 4곳이 공용. 문서명은 `pickTransferDocName(type)` (유형별 필수 서류 중 `/이체(내역서|확인증|증)/`, 없으면 `'이체확인증'` → 집행내역 탭 "기타 첨부 증빙"에 표시)
- 일괄 등록은 행마다 `id: crypto.randomUUID()`를 클라이언트에서 부여해 insert하므로 증빙 첨부가 서버 반환 순서에 의존하지 않는다
- `executionDocsMap` 전체 로드 여부는 `executionDocsLoaded` 플래그가 담당한다 (맵이 비어 있는지로 판단하지 말 것 — 과거 그 가드 때문에 탭 진입 전 병합하면 전체 로드가 건너뛰어졌음). 병합은 조건 없이 `mergeExecutionDocs`로
- `bankImportRows` 행은 `_kind` (`'excel' | 'pdf' | 'fee'`)로 분기: 엑셀 행은 `_raw`+`bankColMap`에서 렌더 시 파생, PDF/수수료 행은 `execution_date`/`amount`/`recipient` 필드를 직접 편집. 행 편집은 미리보기 IIFE의 `updateRow(ri, patch)` 하나로 — 본 행 날짜는 수수료 행에 항상 전파, 소분류/항목은 `_feeLinked`일 때만, PDF 본 행 편집 시 `_dup` 전체 재매칭
- pdf.js 워커는 교차출처라 `blob:` 래퍼로 뜨므로 CSP에 `worker-src 'self' blob:`이 있어야 한다 (없으면 fake worker로 폴백, 동작은 함)

### 거래처 → 예산항목 자동배정 (F-15)

`bf.payee_budget_rules`(수취인·거래처 → 소분류·항목 규칙)와 과거 집행이력으로 예산항목을 자동 배정한다. 순수 함수는 F-14 파서 블록 바로 아래 모듈 수준에 있다.

- `normalizePayee(s)`: `(주)`/`㈜`/`주식회사` 등 법인 표기·공백·괄호 제거 + 소문자화 — 규칙 저장·조회·이력 집계는 반드시 이 함수 하나로
- `resolveBudgetAssignment({ payee, bizNo }, { ruleIndex, historyIndex })`: `biz_no` 규칙 → `exact` → `contains`(긴 패턴 우선) → 이력(같은 정규화 수취인의 최빈 항목, **2회 이상이고 유일할 때만** 자동 배정, 1회·동률이면 `candidates`만 → 후보 드롭다운) → 미배정. 인덱스는 `indexPayeeRules`(활성·예산에 존재·**프로젝트 규칙이 공통 규칙보다 우선**)와 `indexPayeeHistory`로 만들고, 컴포넌트는 최상위 `useMemo`(`payeeAssignIndex`)로 한 번만 구성 — 행마다 집행 전체를 다시 정규화하지 말 것. 규칙 매칭은 `matchPayeeRule` 하나(규칙 제안의 "이미 규칙 있음" 판정도 공용). 컴포넌트에서는 `resolveAssign(payee, bizNo)` 래퍼 사용
- `findBudgetItem(budgetData, subId, itemId)` → `{ cat, sub, item } | null`, `budgetSnapshot(subId, itemId)` → 집행 레코드 예산 필드, `budgetItemLabel` → "소분류 > 항목"
- 미리보기 행 메타: `_assignSource`(`'rule'|'history'|null`), `_assignRuleId`, `_assignCandidates`, `_assignLocked`(사용자가 직접 고름 → 자동배정이 덮지 않음), `_saveRule`. 단건 폼은 `formAssign = { source, ruleId, candidates, locked }` + `formSaveRule`로 같은 의미
- 행 자동배정 판정은 `autoAssignPatch(row, colMap, { refresh })` 하나 — 수수료 행·잠긴 행 제외, 엑셀 입금 행(`isWithdrawType` 아님) 제외. 엑셀 업로드·「빈 항목 채우기」·PDF 수취인 blur 재배정(`reassignRow`)이 공용. 패치 적용·수수료 전파는 미리보기 IIFE의 순수 함수 `applyRowPatch(rows, ri, patch)`(`updateRow`가 감쌈)
- 직접 선택 시 규칙 저장 기본값은 `manualAssignMeta`가 처음 잠글 때 한 번만 정함: 규칙 배정을 이번 건만 바꾸면 해제(기존 규칙을 조용히 덮지 않음), 그 외엔 수취인이 있으면 체크
- 등록 성공 후 `persistRuleEffects(entries)` → `{ saved, failed }`: `_saveRule` 행을 `upsert(onConflict: project_id,match_type,pattern)`하고 규칙 적중 `hit_count`를 병렬 갱신. 규칙 테이블이 없으면(`payeeRulesError`) 규칙 저장 UI를 숨기고 이력 배정만 동작 — `loadPayeeRules`는 전체 로딩 `Promise.all`과 분리돼 있다. 규칙 탭 CRUD는 반환 행으로 `payeeRules`를 로컬 갱신(재조회 없음)
- 1차 입력 경로는 사업자번호를 공급하지 않는다 — `biz_no` 규칙은 2차(세금계산서·영수증)부터 매칭됨
- 예산관리 「🔗 거래처 규칙」 탭(`budgetTab === 'rules'`): 규칙 CRUD + `computeRuleSuggestions`(같은 수취인 2건↑, 최빈 항목 80%↑, 규칙 미적용; 최상위 `useMemo` `ruleSuggestions`) 일괄 저장
- 2·3차(세금계산서 파서·기존 건 매칭·영수증 OCR)는 설계서 `docs/02-design/features/증빙-예산항목-자동배정.design.md` §9 참조

### Authentication
- SHA-256 hashed password check against `users` table (client-side, no Supabase Auth)
- Session in `localStorage` (`bf_user_session`), 24h expiry
- Admin page: `role = 'admin'` only
- 초기 관리자 계정은 로컬 개발 전용

## Domain Logic

### Withholding Tax (원천징수)
```
Gross > 125,000원 → 소득세 8% + 지방소득세 0.8% (소득세의 10%)
Gross ≤ 125,000원 → 면세
Net = Gross - incomeTax - localTax
```

### Budget Hierarchy
Category (사업비/운영비) → Subcategory → Line Item → Executions

### Approval Workflow
`pending` → `approved` → `executed` → `completed`

### Report Data Filtering
`getSettlementReportHTML()` and `getMonthlyReportHTML()` filter to approved/executed/completed only. `handleExportExcel()` exports whatever the user's current filter is (including pending).

### Evidence Documents
`DOCUMENT_RULES` maps each expense type to required proof documents. `getRequiredDocuments(type, paymentMethod)` returns the list. `executionDocsMap` tracks upload status per execution.

### Dashboard Alerts
`getDashboardAlerts()` generates D-day alerts for: upcoming schedules, pending executions, 정산 마감 (06-30, 12-31), 보고서 마감 (07-15, 12-15), and budget burn warnings (85%+, 95%+).

## Supabase Patterns

```javascript
const { data, error } = await supabase.from('table').select('*').order('created_at', { ascending: false });
```

All tables use `bf` schema (not `public`) — the client is configured with `db: { schema: 'bf' }`. RLS enabled. Public anon key client-side. UUID primary keys.

## Code Conventions

- Korean commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- Utility functions: `fmt(n)` (number formatting), `pct(spent, budget)`, `parseInput(s)`, `fmtInput(v)`, `esc(s)` (HTML escape)
- All code is inline in `index.html` — styles, components, logic coexist
- New report/export logic should go in `api/` as serverless functions when possible to avoid growing index.html further
- JSZip pattern for batch downloads: create zip → loop items → add files → `generateAsync({type:'blob'})` → download
- Newsletter HTML generation uses template literal strings — `_nlEsc()` for escaping user content

## Deployment

Vercel auto-deploy on push to `main`. `vercel.json` configures Python runtimes (@vercel/python@4.5.0), timeouts, and security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

When adding external resources, update the CSP in `vercel.json`: new CDN scripts → `script-src`; new fetch targets → `connect-src`; new image hosts → `img-src` (currently only Supabase + data/blob); Web Worker from CDN (pdf.js style blob wrapper) → `worker-src`. CSP is not enforced under `http.server`, so a missing entry only shows up after deploy.

## PDCA Docs (`docs/`)

bkit PDCA workflow: `01-plan/features/*.plan.md` → `02-design/features/*.design.md` → `03-analysis/*.analysis.md` → `04-report/*.report.md`. Completed features are moved to `archive/YYYY-MM/` with an `_INDEX.md`. Feature IDs (`F-06`, `F-10`, `F-13`…) or Korean slugs name the docs.

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Primary application (~14,600 lines, edit this) |
| `api/neis.py` | NEIS school/timetable proxy |
| `api/hwpx.py` | HWPX document generator (from scratch) |
| `api/hwpx-fill.py` | HWPX 서식 채우기 (F-13) |
| `api/rewrite.py` | AI newsletter rewriter |
| `api/supabase-admin.py` | Admin SQL operations |
| `api/hwpxfill_templates/` | Placeholder-preprocessed HWPX form templates (generated, do not hand-edit) |
| `templates/` | 재단 서식 원본 (무수정 보존) |
| `scripts/preprocess_templates.py` | templates/ → hwpxfill_templates/ 전처리 (재실행 가능) |
| `vercel.json` | Deployment config + security headers |
| `supabase-schema-safe.sql` | Database schema (bf schema) |
| `supabase-migration-*.sql` | Incremental migrations (`payee-rules` = F-15 거래처 규칙) |
| `SUPABASE_SETUP.md` | Supabase project setup walkthrough |
| `manifest.json` + `service-worker.js` | PWA support |
| `docs/` | bkit PDCA docs — `01-plan/`, `02-design/`, `03-analysis/`, `04-report/`, `archive/`; `manual/` = 사용 매뉴얼 (PDCA archive 대상 아님) |
| `_archive/` | Reference JSX modules (not used by running app) |
| `.claude/agents/` | Project agents: `budget-domain-expert`, `code-reviewer`, `feature-planner`, `sql-migration-validator` |
| `.claude/skills/promo/` | `/promo` skill — 홍보물·문서 생성 워크플로 |
| `data/` | 사업 원천 문서 (신청서·사업계획·예산·변경신청서·수행가이드). git-ignored, read-only |
| `content/kb/` | 정제된 지식베이스 — `facts.yaml` (단일 진실 원천, v2) + `01`~`10` md (09 실적·10 교훈은 `/kihoek learn`만 갱신) + `kb-index.yaml`(생성물)·`kb-select.yaml`·`unit-map.yaml` |
| `content/templates/` | `visual/` HTML 템플릿 6종, `docs/` 문서 골격 9종 (사업계획·공모신청서·아이디어보드 = `/kihoek`) |
| `content/tools/` | `promo.py` (fill/render/check/index/kb-extract/kb-index/kb-select/kb-outline/exec-summary/doc-stamp/selftest), `md2hwpx.py` |
| `content/brand/` | `tokens.css`, Pretendard font, `logo/` (user-supplied) |
| `content/out/` | 산출물 (git-ignored), `INDEX.md` generated |

## Claude Code Commands

- `/commit` — Korean commit message with convention
- `/deploy` — Push to main for Vercel deploy
- `/new-migration` — Create Supabase migration file
- `/find-component` — Locate component/function in index.html
- `/review-changes` — Review current changes
- `/promo <brief|draft|visual|render|doc|check|kb-sync|status>` — 홍보물·문서 생성 (see `.claude/skills/promo/SKILL.md`)
- `/kihoek <idea|plan|proposal|review|learn|doc|status>` — 기획: 아이디어·사업계획·공모신청서·감사·학습 (see `.claude/skills/kihoek/SKILL.md`)

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health

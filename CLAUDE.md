# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템 — 청년노동자인권센터용.
총 사업비 7천만원 예산 집행 관리, 일정, 갤러리, 게시판, 참여자 관리, 학교관리 통합 웹앱.
**단일 사용자** (대표 1인, 직원 없음). 아름다운재단이 대시보드에 직접 접속하여 집행 현황 확인.

## Tech Stack

- **Frontend**: React 18 (no-build, CDN via unpkg/jsdelivr) + Babel standalone transpiler
- **Backend**: Supabase (PostgreSQL + JWT Auth + RLS, `bf` schema)
- **Serverless**: Vercel Python functions (`api/`) — HWPX 생성, NEIS 프록시, AI 재작성, 관리 API
- **CDN Libraries**: Chart.js, DOMPurify, JSZip, SheetJS, html2pdf.js, Google APIs (Calendar + GSI)
- **Language**: Korean-first UI, English code comments

## Running the Application

No build step. Serve static files:

```bash
python -m http.server 8000
```

Open `http://localhost:8000`. No package.json, no npm install, no linter, no test runner.

## Database Setup

Execute in Supabase SQL Editor in order:
1. `supabase-schema-safe.sql` — All tables, indexes, RLS, sample data
2. `supabase-migration-auth.sql` — Users RLS + 로컬 개발용 초기 관리자 (배포 전 변경 필수)

Additional migrations (apply in order): `supabase-migration-{rls-improved,gallery-category,gallery-rls-fix,password-hash,recipients,features,rls,schools,projects,execution-project-id,admin-sql}.sql`

## Architecture

### Single-file SPA

The entire app lives in `index.html` (~14,000 lines). Top to bottom:

1. **CDN imports** (React, ReactDOM, Babel, Supabase, Chart.js, DOMPurify, JSZip, SheetJS, Google APIs)
2. **Inline `<style>` block** (~1300 lines) — includes `@media print` for dashboard printing
3. **Single `<script type="text/babel">` block** containing:
   - Supabase client init (~line 2186)
   - `CONFIG` constant — budget, tax rates, periods (~line 2384)
   - `EXECUTION_STATUS` — approval workflow states (~line 2398)
   - `BUDGET_DATA` — budget hierarchy structure (~line 2934)
   - `DOCUMENT_RULES` — evidence requirements per expense type (~line 3070)
   - Newsletter template system (`NL_THEMES`, `_nlRenderSections`, `generateNewsletterHTML`) (~line 3281)
   - `LoginPage` — authentication component (~line 3960)
   - `ProjectManagementSystem` — root component (~line 4070, ~9900 lines)
4. **Service worker** registration and offline handlers

### Critical constraint: Babel standalone

Code is transpiled by Babel standalone in the browser. This means:
- **Do NOT use React hooks (`useMemo`, `useCallback`, `useEffect`) inside `render*()` helper functions** — only at the top level of `ProjectManagementSystem()`. The `render*()` functions are regular functions called during render, not React components, so hooks inside them violate React's rules and cause a white screen.
- `catch {}` (without parameter) works in the CDN Babel version but avoid if possible.

### Root component structure

`ProjectManagementSystem` contains ALL app state (~150 `useState` declarations) and these page renderers:

| Function | Page | Key features |
|----------|------|-------------|
| `renderDashboard()` | 대시보드 | Budget gauge, alerts (`getDashboardAlerts()`), category breakdown, print/snapshot export |
| `renderBudget()` | 예산 관리 | 7 sub-tabs (dashboard, breakdown, register, calculator, history, ratio, calendar) |
| `renderSchedule()` | 일정 관리 | Calendar view, list view, Google Calendar sync |
| `renderBoard()` | 게시판 | 4 categories (공지/자료/보고서/자유), rich text, comments |
| `renderGallery()` | 갤러리 | Categorized images, ZIP download, newsletter integration |
| `renderNewsletter()` | 뉴스레터 | 3-step wizard (내용선택 → 템플릿 → 배치/편집), 5 templates, AI rewrite, iframe preview |
| `renderSchools()` | 학교관리 | NEIS API school search, timetable viewer, textbook management |
| `renderAdmin()` | 관리자 | Users, recipients, org settings, project management (admin-only) |
| `renderGuide()` | 회계가이드 | Accounting rules, withholding tax calculator, FAQ |

Navigation is state-driven via `currentPage` (no URL routing).

### Newsletter Template System

5 templates using a unified theme architecture:

- **Modern/Magazine/Classic**: Rendered via `NL_THEMES` theme objects → `_nlGenerateThemed()` shared renderer. Each theme defines `header`, `title`, `greeting`, `closing`, `footer`, `sectionLabel`, `scheduleItem`, `boardItem`, `galleryItem` as functions returning HTML strings.
- **Email**: `generateNewsletterEmail()` — table-based layout for Gmail/Outlook compatibility
- **Grid**: `generateNewsletterGrid()` — Hoom-style 3-column card grid with featured center

`generateNewsletterHTML(template, config, sections, orgName, assets)` is the unified dispatcher.
- `sections`: `[{ type: 'boards'|'schedules'|'gallery', label, items }]` — ordering controlled by user in Step 3
- `assets`: `{ boardImageUrls, rewrittenContents, galleryThumbUrls }`

To add a new themed template: add an entry to `NL_THEMES` with the required render functions. For custom layouts (like email/grid), add a standalone generate function and a layout check in the dispatcher.

### Serverless API Functions (`api/`)

| File | Endpoint | Purpose | Timeout |
|------|----------|---------|---------|
| `api/neis.py` | `GET /api/neis` | NEIS school search + timetable proxy | 10s |
| `api/hwpx.py` | `POST /api/hwpx` | HWPX (한글) document generation | 30s |
| `api/rewrite.py` | `POST /api/rewrite` | AI newsletter rewrite (Claude API) | 15s |
| `api/supabase-admin.py` | `POST /api/supabase-admin` | Admin SQL operations (bf schema) | 15s |

HWPX templates in `api/hwpxskill_templates/{base,gonmun,report,minutes,proposal}/`.

**Important:** `hwpx.py` generates new HWPX from scratch (tab-separated text paragraphs). It does NOT support filling existing template forms with merged cells/checkboxes. Foundation report auto-fill will require an unzip-replace-repackage approach.

### Authentication
- SHA-256 hashed password check against `users` table
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

All tables use `bf` schema (not `public`). RLS enabled. Public anon key client-side. UUID primary keys.

## Code Conventions

- Korean commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- Utility functions: `fmt(n)` (number formatting), `pct(spent, budget)`, `parseInput(s)`, `fmtInput(v)`, `esc(s)` (HTML escape)
- All code is inline in `index.html` — styles, components, logic coexist
- New report/export logic should go in `api/` as serverless functions when possible to avoid growing index.html further
- JSZip pattern for batch downloads: create zip → loop items → add files → `generateAsync({type:'blob'})` → download
- Newsletter HTML generation uses template literal strings — `_nlEsc()` for escaping user content

## Deployment

Vercel auto-deploy on push to `main`. `vercel.json` configures Python runtimes (@vercel/python@4.5.0), timeouts, and security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

When adding new CDN scripts, update the CSP `script-src` in `vercel.json`.

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Primary application (~14,000 lines, edit this) |
| `api/neis.py` | NEIS school/timetable proxy |
| `api/hwpx.py` | HWPX document generator |
| `api/rewrite.py` | AI newsletter rewriter |
| `api/supabase-admin.py` | Admin SQL operations |
| `vercel.json` | Deployment config + security headers |
| `supabase-schema-safe.sql` | Database schema (bf schema) |
| `supabase-migration-*.sql` | Incremental migrations |
| `manifest.json` + `service-worker.js` | PWA support |
| `_archive/` | Reference JSX modules (not used by running app) |

## Claude Code Commands

- `/commit` — Korean commit message with convention
- `/deploy` — Push to main for Vercel deploy
- `/new-migration` — Create Supabase migration file
- `/find-component` — Locate component/function in index.html
- `/review-changes` — Review current changes

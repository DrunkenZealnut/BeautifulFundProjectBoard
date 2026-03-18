# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템 - 청년노동자인권센터용.
총 사업비 7천만원 예산 집행 관리, 일정, 갤러리, 게시판, 참여자 관리 통합 웹앱.

## Tech Stack

- **Frontend**: React 18 (no-build, CDN via unpkg/jsdelivr) + Babel standalone transpiler
- **Backend**: Supabase (PostgreSQL + JWT Auth + RLS)
- **CDN Libraries**: Chart.js, DOMPurify (XSS sanitization), JSZip (gallery ZIP download), SheetJS (Excel export)
- **Google APIs**: Calendar API + GSI client (Google Calendar sync)
- **Language**: Korean-first UI, English code comments

## Running the Application

No build step required. Serve static files:

```bash
python -m http.server 8000
# or: npx http-server
# or: VS Code Live Server extension
```

Open `http://localhost:8000` → loads `index.html`.

No package.json, no npm install, no linting, no test runner configured.

## Database Setup

Execute in Supabase SQL Editor in this order:
1. `supabase-schema-safe.sql` — Creates all 11 tables, indexes, RLS policies, sample data
2. `supabase-migration-auth.sql` — Users RLS + 로컬 개발용 초기 관리자 계정 생성 (배포 전 반드시 변경)

Additional migrations (run as needed):
- `supabase-migration-rls-improved.sql` — Improved RLS policies
- `supabase-migration-gallery-category.sql` — Gallery category additions
- `supabase-migration-gallery-rls-fix.sql` — Gallery RLS fix
- `supabase-migration-password-hash.sql` — Password hashing
- `supabase-migration-recipients.sql` — Recipients table for payroll
- `supabase-migration-features.sql` — Feature additions

## Architecture

### Single-file SPA pattern

The entire application lives in `index.html` (~11,400 lines). Structure top to bottom:

1. **CDN imports** (React, ReactDOM, Babel, Supabase, Chart.js, DOMPurify, JSZip, SheetJS, Google APIs)
2. **Inline `<style>` block** (~1200 lines of CSS)
3. **Single `<script type="text/babel">` block** containing:
   - Supabase client init (line ~2186)
   - `CONFIG` constant — project-wide settings (budget, tax rates, periods)
   - Utility functions: `fmt()`, `parseInput()`, `fmtInput()`, `pct()`, `hashPassword()`
   - `generateSalaryStatementHTML()` — payroll statement generator (line ~2234)
   - `LoginPage({ onLogin })` — authentication component (line ~3034)
   - `ProjectManagementSystem()` — root component containing ALL app state and render functions (line ~3143)
4. **Service worker registration** and offline/online handlers

### Root component internal structure

`ProjectManagementSystem` is a single massive function component (~8000 lines) that contains:
- ~50+ `useState` declarations for all app state
- Data fetching via `useEffect` + Supabase queries
- Google Calendar integration (`initGapi`, `initGis`)
- Sub-components defined as inner functions: `DashboardGalleryThumb`, `LinkPreviewCard`, `BoardTemplateHeader`, `BoardPagination`, `RichEditorToolbar`, `FileUploadArea`, `BoardWriteForm`, `GalleryWriteForm`, `AttachmentListDisplay`, `CommentSection`, `BoardDetailView`, `GalleryDetailView`, `GalleryCardWithThumb`
- Page render functions: `renderDashboard()`, `renderBudget()`, `renderSchedule()`, `renderBoard()`, `renderGallery()`, `renderAdmin()`, `renderGuide()`, `renderContent()`
- `renderContent()` dispatches based on `currentPage` state

### Navigation

State-driven (no URL routing) via `currentPage`:
- `dashboard` → 대시보드 (budget execution rate, stats)
- `budget` → 예산 관리 (execution tracking, withholding tax calc)
- `schedule` → 일정 관리 (calendar view, participant tracking)
- `gallery` → 갤러리 (categorized image management)
- `board` → 게시판 (공지, 자료, 보고서, 자유)
- `guide` → 회계가이드 (accounting guide)
- `admin` → 관리자 (user/recipient/org management, admin-only)

### Authentication
- Login checks `users` table (username + SHA-256 hashed password)
- Session stored in `localStorage` (`bf_user_session`), 24h expiry
- Admin page visible only to `role = 'admin'`
- 초기 관리자 계정은 로컬 개발 전용 — 배포 전 반드시 변경 필수

### File variants

| File | Purpose |
|------|---------|
| `index.html` | Primary full-featured application (edit this) |
| `index-supabase.html` | Supabase integration variant |
| `index-simple.html` | Lightweight testing version |
| `budget-management-advanced.html` | Standalone budget module demo |
| `manifest.json` | PWA manifest |
| `service-worker.js` | Offline support service worker |

### Archived JSX modules (`_archive/`)

Reference only — not used by the running app:
- `project-management-system.jsx` — Full component library (84KB)
- `participant-management.jsx` — Participant module
- `budget-manager.jsx` — Budget module

## Domain Logic

### Global Config (`CONFIG` constant, line ~2193)
```javascript
CONFIG.TOTAL_BUDGET = 70000000          // 총 사업비 7천만원
CONFIG.WITHHOLDING_THRESHOLD = 125000   // 원천징수 기준액 (이하 면세)
CONFIG.INCOME_TAX_RATE = 0.08           // 기타소득세율 8%
CONFIG.LOCAL_TAX_RATE = 0.1             // 지방소득세율 (기타소득세의 10%)
```

### Withholding Tax (원천징수)
Amounts > 125,000 KRW trigger automatic tax:
- 소득세 (income tax): 8% of gross
- 지방소득세 (local tax): 10% of income tax (= 0.8% of gross)
- Net = Gross - incomeTax - localTax

### Budget Hierarchy
Category (사업비/운영비) → Subcategory (교과서, APP, 캠페인, etc.) → Line Item → Executions

### Approval Workflow
Budget executions: `pending` → `approved` → `executed` → `completed`
(Status labels and badge colors defined in `EXECUTION_STATUS` constant)

### Document Requirements
Each expense type has required proof documents via `getRequiredDocs()`. Payment method and expense category determine mandatory documents.

### Payroll Statement
`generateSalaryStatementHTML()` creates a printable HTML salary statement matching the HWP template format, aggregating all 운영인건비 executions for a recipient.

## Supabase Patterns

```javascript
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false });
```

All 11 tables have RLS enabled. Public anon key is used client-side. UUID primary keys throughout.

## Code Conventions

- React functional components with hooks (`useState`, `useEffect`, `useCallback`, `useRef`, `useMemo`)
- Utility functions: `fmt(n)` for Korean number formatting, `pct(spent, budget)` for percentages
- `parseInput(s)` strips non-numeric chars, `fmtInput(v)` formats input with commas
- Korean commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- All inline — styles, components, and logic coexist in the same HTML file
- Inner components and render functions are defined inside `ProjectManagementSystem`

## Deployment

Hosted on Vercel. Push to `main` triggers auto-deploy. `vercel.json` configures security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

## Claude Code Commands

Custom commands available via `/` in Claude Code:
- `/commit` — Korean commit message with convention
- `/deploy` — Push to main for Vercel deploy
- `/new-migration` — Create Supabase migration file
- `/find-component` — Locate component/function in index.html
- `/review-changes` — Review current changes

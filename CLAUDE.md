# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템 - 청년노동자인권센터용.
총 사업비 7천만원 예산 집행 관리, 일정, 갤러리, 게시판, 참여자 관리 통합 웹앱.

## Tech Stack

- **Frontend**: React 18 (no-build, CDN via unpkg/jsdelivr) + Babel standalone transpiler
- **Backend**: Supabase (PostgreSQL + JWT Auth + RLS)
- **Charting**: Chart.js (CDN)
- **Language**: Korean-first UI, English code comments

## Running the Application

No build step required. Serve static files:

```bash
# Any of these work:
python -m http.server 8000
npx http-server
# Or use VS Code Live Server extension
```

Open `http://localhost:8000` → loads `index.html`.

No package.json, no npm install, no linting, no test runner configured.

## Database Setup

Execute `supabase-schema-safe.sql` in Supabase SQL Editor. This creates all 11 tables, indexes, RLS policies, and sample data.

Then execute `supabase-migration-auth.sql` to add users table RLS policies and set the default admin password (`admin/admin1234`).

## Architecture

### Single-file SPA pattern

The main application lives entirely in `index.html` (~97KB):
1. CDN imports (React, ReactDOM, Babel, Supabase client, Chart.js)
2. Inline `<style>` block (1000+ lines)
3. Single `<script type="text/babel">` block containing all React components
4. Root component: `ProjectManagementSystem` rendered into `<div id="root">`

Navigation is state-driven (no URL routing) via `currentPage` state:
- `dashboard` → 대시보드 (budget execution rate, stats)
- `budget` → 예산 관리 (execution tracking, withholding tax calc)
- `schedule` → 일정 관리 (events, participant tracking)
- `gallery` → 갤러리 (categorized image management)
- `board` → 게시판 (공지, 자료, 보고서, 자유)
- `admin` → 관리자 (user management, admin-only)

### Authentication
- Login required on page load, checks `users` table (username + password_hash)
- Session stored in `localStorage` (`bf_user_session`)
- Admin page visible only to users with `role = 'admin'`
- Default admin account: `admin` / `admin1234`
- Session expires after 24 hours

> **중요**: 프로덕션 환경에서는 반드시 기본 관리자 비밀번호를 변경하세요!

### File variants

| File | Purpose |
|------|---------|
| `index.html` | Primary full-featured application |
| `index-supabase.html` | Supabase integration variant |
| `index-simple.html` | Lightweight testing version |
| `budget-management-advanced.html` | Standalone budget module demo |

### Standalone JSX modules (reference/components)

- `project-management-system.jsx` - Full component library (84KB)
- `participant-management.jsx` - Participant management module
- `budget-manager.jsx` - Budget management module

### Database schema files

- `supabase-schema-safe.sql` - Primary schema (PostgreSQL/Supabase, use this)
- `supabase-schema.sql` - Earlier schema version
- `database-schema.sql` - Original MySQL schema (reference only)

## Domain Logic

### Withholding Tax (원천징수)
Amounts >= 125,000 KRW trigger automatic tax:
- 소득세 (income tax): 8%
- 지방소득세 (local tax): 10% of income tax
- Net = Gross - incomeTax - localTax

### Budget Hierarchy
Category (사업비/운영비) → Subcategory (교과서, APP, 캠페인, etc.) → Line Item (predetermined amounts) → Executions (actual spending)

### Document Requirements
Each expense type has specific required proof documents defined in `getRequiredDocs()`. Payment method and expense category determine which documents are mandatory.

### Approval Workflow
Budget executions: `pending` → `approved` → `executed` → `completed`

## Supabase Patterns

```javascript
const supabase = window.supabase.createClient(URL, KEY);
// Standard query pattern:
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false });
```

All 11 tables have RLS enabled. Public key is used client-side (read-oriented). UUID primary keys throughout.

## Code Conventions

- React functional components with hooks (useState, useEffect, useCallback, useRef)
- Utility functions: `fmt(n)` for Korean number formatting, `pct(spent, budget)` for percentages, `Icon({ name, size })` for SVG icons
- Korean commit messages: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- All inline — styles, components, and logic coexist in the same HTML file

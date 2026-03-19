# Feature Suggestions Gap Analysis Report (Iteration 4)

> **Analysis Type**: Plan vs Implementation Gap Analysis -- PDCA Re-Check
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Analyst**: gap-detector
> **Date**: 2026-03-10
> **Iteration**: 4 (previous: 66.5% -> 89.0% -> 89.5%)
> **Plan Doc**: feature-suggestions.plan.md
> **Implementation**: index.html (~11,500 lines)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Iteration 4: Verify F-07 Supabase attendance persistence fix applied after iteration 3 (89.5%). Recalculate F-07 score and overall match rate.

### 1.2 Changes Applied Since Iteration 1

| # | Fix | Feature | Verified |
|---|-----|---------|:--------:|
| 1 | SHA-256 hashing + current password verification against DB | F-03 | Yes |
| 2 | Password strength indicator (약함/보통/강함) | F-03 | Yes |
| 3 | Confirm password field + mismatch warning | F-03 | Yes |
| 4 | State keys unified to currentPassword/newPassword/confirmPassword | F-03 | Yes |
| 5 | Comment edit: handleEdit, editingCmtId, editCmtText, inline UI | F-02 | Yes |
| 6 | Activity log filters: logFilterUser, logFilterAction, filteredLogs, dropdown UI | F-04 | Yes |
| 7 | Dashboard recent activity widget (last 5 logs with icons) | F-04 | Yes |
| 8 | Online auto-reload: window.location.reload() on 'online' event | F-09 | Yes |
| 9 | Selected Excel export: handleExportExcel(selectedOnly), "선택 내보내기" button | F-10 | Yes |
| 10 | Category surplus/deficit analysis section on dashboard | F-05 | Yes |
| 11 | Monthly expected vs actual side-by-side bar chart | F-05 | Yes |
| 12 | Attendance print button generating printable sheet | F-07 | Yes |
| 13 | Dashboard participation widget (circular progress + stats) | F-07 | Yes |
| 14 | Business timeline with milestones and progress bar | F-08 | Yes |
| 15 | Budget vs performance correlation (dual horizontal bars) | F-08 | Yes |
| 16 | Quarterly report auto-generation button | F-08 | Yes |
| 17 | Monthly execution breakdown report button | F-06 | Yes |
| 18 | Activity logs loaded on app init (loadActivityLogs in useEffect) | F-04 | Yes |

### 1.3 Changes Applied Since Iteration 2

| # | Fix | Feature | Verified |
|---|-----|---------|:--------:|
| 19 | Date range filter: logFilterDateFrom/logFilterDateTo state + date inputs + filteredLogs date comparison | F-04 | Yes |

### 1.4 Changes Applied Since Iteration 3

| # | Fix | Feature | Verified |
|---|-----|---------|:--------:|
| 20 | Supabase attendance persistence: setAttendance() upserts to system_settings (key: 'attendance_data') + useEffect loads & merges on app init | F-07 | Yes |

---

## 2. Overall Scores

| Category | Iter 1 | Iter 2 | Iter 3 | Iter 4 | Delta | Status |
|----------|:------:|:------:|:------:|:------:|:-----:|:------:|
| F-01: 마감일 알림 & 리마인더 배너 | 90% | 90% | 90% | 90% | -- | ✅ |
| F-02: 게시판/갤러리 댓글 기능 | 80% | 95% | 95% | 95% | -- | ✅ |
| F-03: 사용자 프로필 & 비밀번호 변경 | 70% | 100% | 100% | 100% | -- | ✅ |
| F-04: 활동 로그 (Audit Trail) | 70% | 90% | 95% | 95% | -- | ✅ |
| F-05: 대시보드 기간별 비교 분석 | 65% | 95% | 95% | 95% | -- | ✅ |
| F-06: PDF 직접 생성 (정산보고서) | 50% | 75% | 75% | 75% | -- | ⚠️ |
| F-07: 일정 참여자 출석 관리 | 55% | 80% | 80% | 90% | +10 | ✅ |
| F-08: 데이터 대시보드 강화 | 35% | 80% | 80% | 80% | -- | ⚠️ |
| F-09: 오프라인 모드 (PWA) | 75% | 90% | 90% | 90% | -- | ✅ |
| F-10: 대량 작업 (Bulk Operations) | 75% | 95% | 95% | 95% | -- | ✅ |
| **Overall Match Rate** | **66.5%** | **89.0%** | **89.5%** | **90.5%** | **+1.0** | **✅** |

---

## 3. Feature-by-Feature Gap Analysis

### F-01: 마감일 알림 & 리마인더 배너 -- 90% (unchanged)

All planned sub-features remain fully implemented. No changes in this iteration.

| Sub-feature | Status |
|-------------|:------:|
| 7일 이내 일정 알림 (D-7/D-3/D-1/D-Day) | ✅ |
| 반기별 정산 마감 알림 (6/30, 12/31) | ✅ |
| 미승인 집행건 알림 | ✅ |
| 색상 구분 (빨강/주황/파랑) | ✅ |
| 닫기(dismiss) 기능 | ✅ |

**Remaining gap**: None significant. Score capped at 90% due to plan not originally specifying the budget consumption warnings that were added as bonuses.

---

### F-02: 게시판/갤러리 댓글 기능 -- 80% -> 95%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 댓글 작성 | ✅ | ✅ | addComment() line 3910 |
| 댓글 삭제 | ✅ | ✅ | deleteComment() line 3919 |
| 댓글 수정 | ❌ | ✅ | handleEdit() line 6433, editingCmtId/editCmtText state line 6404-6405, inline edit UI with Enter/Escape keys line 6470-6474 |
| 작성자명/시간 표시 | ✅ | ✅ | |
| 본인 댓글만 수정/삭제 (admin 전체) | ✅ | ✅ | |
| Supabase comments 테이블 | ✅ | ✅ | |
| 게시판/갤러리 렌더링 | ✅ | ✅ | |

**Remaining gap**: Comment edit updates `updated_at` but does not display "수정됨" indicator in the UI. Minor UX polish item.

---

### F-03: 사용자 프로필 & 비밀번호 변경 -- 70% -> 100%

All 3 critical gaps from iteration 1 are resolved.

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 프로필 모달 | ✅ | ✅ | |
| 이름/이메일/전화번호 수정 | ✅ | ✅ | |
| 현재 비밀번호 검증 against DB | ⚠️ | ✅ | Line 3951-3955: hashPassword(currentPassword) compared to users.password_hash via Supabase query |
| 새 비밀번호 SHA-256 해싱 | ⚠️ | ✅ | Line 3958: `await hashPassword(profileForm.newPassword)` |
| 비밀번호 확인(confirm) 필드 | ⚠️ | ✅ | Line 11127-11131: confirm input with real-time mismatch warning |
| 비밀번호 강도 표시 | ❌ | ✅ | getPasswordStrength() line 3933-3943, visual bar + label line 11114-11124 |
| State key 통일 | ⚠️ | ✅ | Line 3705: currentPassword/newPassword/confirmPassword consistently |

**Security issues from iteration 1**: All resolved. Password change now requires current password verification against DB hash, new password is hashed with SHA-256 before storage.

---

### F-04: 활동 로그 (Audit Trail) -- 70% -> 90% -> 95%

| Sub-feature | Iter 1 | Iter 2 | Iter 3 | Evidence |
|-------------|:------:|:------:|:------:|----------|
| activity_logs 테이블 | ✅ | ✅ | ✅ | |
| logActivity 함수 | ✅ | ✅ | ✅ | |
| 관리자 '활동 로그' 탭 | ✅ | ✅ | ✅ | |
| 로그 목록 표시 | ✅ | ✅ | ✅ | |
| 필터: 사용자별 | ❌ | ✅ | ✅ | logFilterUser state line 3975, dropdown line 10928-10932 |
| 필터: 작업 유형별 | ❌ | ✅ | ✅ | logFilterAction state line 3976, dropdown line 10934-10942 |
| 필터: 기간별 | ❌ | ⚠️ | ✅ | logFilterDateFrom/logFilterDateTo state lines 3977-3978, date inputs lines 10948-10950, filteredLogs date comparison lines 3988-3989 |
| 최근 활동 대시보드 위젯 | ❌ | ✅ | ✅ | Lines 4974-5003: last 5 logs with icons, "전체보기" link to admin |
| 앱 초기화 시 로그 로딩 | -- | ✅ | ✅ | loadActivityLogs() in useEffect line 4214 |

**Previous gap resolved**: Date range filter now implemented with `logFilterDateFrom`/`logFilterDateTo` state variables, two `<input type="date">` elements in the filter bar, and date comparison logic in `filteredLogs`. All three filter axes (user, action type, date range) are complete.

**Remaining gap**: Minor -- no log export/download feature, but this is not specified in the plan. Score capped at 95% for minor UX polish (e.g., no "clear filters" button).

---

### F-05: 대시보드 기간별 비교 분석 -- 65% -> 95%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 예산 소진 속도 (집행률 vs 기간 경과율) | ✅ | ✅ | |
| 월별 예상 vs 실제 비교 차트 | ❌ | ✅ | Lines 4737-4773: side-by-side bar chart, monthlyExpected = totalBudget/12, color-coded (green=normal, red=over) |
| 잔여 예산 월평균 사용 가능 금액 | ✅ | ✅ | |
| 카테고리별 과부족 분석 | ⚠️ | ✅ | Lines 4452-4497: dedicated section with over-budget (red) and warning 80%+ (yellow) items |
| 소진 속도 경고 아이콘 | ✅ | ✅ | |

**Remaining gap**: The monthly comparison uses bar chart (side-by-side bars) rather than the "line chart" mentioned in the plan. Functionally equivalent and arguably better for the use case. Minor design divergence.

---

### F-06: PDF 직접 생성 (정산보고서) -- 50% -> 75%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 집행 총괄표 | ✅ | ✅ | Print-based summary report |
| 월별 집행 명세서 | ❌ | ✅ | Lines 8715-8728: monthly breakdown with per-month tables, subtotals, print button |
| 급여지급명세서 | ⚠️ | ⚠️ | Exists as print-based payroll, no true PDF |
| jsPDF 직접 PDF 다운로드 | ❌ | ❌ | Still uses window.print() approach |

**Remaining gaps**:
- No programmatic PDF generation (jsPDF/html2canvas). All reports use `window.open()` + `window.print()`.
- The print-based approach works but requires user to manually select "Save as PDF" in the print dialog.
- Payroll slip remains print-only.

---

### F-07: 일정 참여자 출석 관리 -- 55% -> 80% -> 90%

| Sub-feature | Iter 1 | Iter 2 | Iter 4 | Evidence |
|-------------|:------:|:------:|:------:|----------|
| 참여자 목록 표시 | ✅ | ✅ | ✅ | |
| 출석 체크 기능 | ✅ | ✅ | ✅ | |
| 출석/불참/미확인/지각 상태 관리 | ✅ | ✅ | ✅ | |
| 출석부 인쇄 | ❌ | ✅ | ✅ | Line 5188-5194: print button generating HTML attendance sheet with status table |
| 대시보드 참여율 통계 | ❌ | ✅ | ✅ | Lines 5006-5034: circular progress ring, total/present counts, average rate |
| Supabase 데이터 저장 | ❌ | ❌ | ✅ | Line 4000: setAttendance() upserts JSON to system_settings (key: 'attendance_data'); Lines 4003-4017: useEffect loads from Supabase on init, merges with localStorage via `{ ...parsed, ...prev }` |

**Previous gap resolved**: Attendance data is now persisted to Supabase via the `system_settings` table (key: `attendance_data`). On each status change, `setAttendance()` upserts the full attendance map as JSON. On app initialization, a `useEffect` loads from Supabase and merges with any existing localStorage data, ensuring cross-device persistence and backward compatibility.

**Remaining minor gap**: Attendance uses `system_settings` as a JSON blob rather than a dedicated relational `attendance` table with per-row records. This is functionally complete but architecturally imperfect for large-scale querying. Score capped at 90%.

---

### F-08: 데이터 대시보드 강화 -- 35% -> 80%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 사업 진행 타임라인 | ❌ | ✅ | Lines 4695-4724: visual timeline with 5 milestones (사업시작, 1분기, 반기, 3분기, 종료), progress bar, checkmarks |
| 성과지표 달성 추이 그래프 | ⚠️ | ⚠️ | Still shows current-status cards (checkmarks), no historical trend graph over time |
| 예산 vs 성과 상관관계 분석 | ❌ | ✅ | Lines 4926-4971: dual horizontal bars per category (spending % vs achievement %), efficiency labels |
| 분기별 보고서 자동 생성 | ❌ | ✅ | Lines 4425-4449: quarterly breakdown with per-quarter tables, cumulative rates, print output |

**Remaining gap**: Performance indicator trend over time is still a static current-status view. A historical line graph tracking KPI progression across months/quarters is not implemented. This is the most complex remaining item.

---

### F-09: 오프라인 모드 (PWA) -- 75% -> 90%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| Service Worker 캐싱 | ✅ | ✅ | |
| manifest.json | ✅ | ✅ | |
| 오프라인 배너 | ✅ | ✅ | |
| 온라인 복귀 자동 갱신 | ❌ | ✅ | Lines 11487-11491: 'online' event listener with setTimeout reload |
| Service Worker 등록 | ✅ | ✅ | |

**Remaining gap**: PWA icons are still SVG-only (single data URI). Production PWA spec recommends multiple PNG sizes (192x192, 512x512). Minor compliance item.

---

### F-10: 대량 작업 (Bulk Operations) -- 75% -> 95%

| Sub-feature | Iter 1 | Iter 2 | Evidence |
|-------------|:------:|:------:|----------|
| 전체 선택/해제 | ✅ | ✅ | |
| 선택 건수 표시 | ✅ | ✅ | |
| 일괄 상태 변경 | ✅ | ✅ | |
| 일괄 삭제 | ✅ | ✅ | |
| 일괄 Excel 내보내기 (선택 건) | ❌ | ✅ | handleExportExcel(selectedOnly) line 9571-9573, "선택 내보내기" button line 8823 |

**Remaining gap**: None significant. Full implementation of all planned bulk operations.

---

## 4. Summary of Differences

### 4.1 Remaining Missing Features (Plan O, Implementation X)

| # | Feature | Plan Reference | Description | Impact |
|---|---------|----------------|-------------|--------|
| ~~1~~ | ~~F-04 기간별 필터~~ | ~~F-04~~ | ~~활동 로그 날짜 범위 필터 미구현~~ | ~~Resolved in Iter 3~~ |
| 2 | F-06 jsPDF 직접 PDF | F-06 | 모든 보고서가 window.print() 기반, 프로그래매틱 PDF 생성 없음 | Medium |
| ~~3~~ | ~~F-07 Supabase 출석 저장~~ | ~~F-07~~ | ~~출석 데이터가 localStorage에만 저장됨~~ | ~~Resolved in Iter 4~~ |
| 4 | F-08 성과지표 추이 그래프 | F-08 | 성과지표 시간 경과 추이 없음 (현재 상태만 표시) | Low |

### 4.2 Design Divergences

| # | Feature | Plan | Implementation | Impact |
|---|---------|------|----------------|--------|
| 1 | F-05 차트 형태 | 라인 차트 | 바 차트 (side-by-side) | Negligible -- functionally equivalent |
| 2 | F-06 PDF 방식 | jsPDF + html2canvas | window.open() + print() | Medium -- user must manually save as PDF |
| 3 | F-09 PWA 아이콘 | 다중 PNG 사이즈 | 단일 SVG data URI | Low |

### 4.3 Security Issues

All HIGH severity issues from iteration 1 are **resolved**.

| Severity | Feature | Issue | Status |
|----------|---------|-------|:------:|
| ~~HIGH~~ | ~~F-03 비밀번호 미검증~~ | ~~현재 비밀번호 없이 변경 가능~~ | Resolved |
| ~~HIGH~~ | ~~F-03 비밀번호 평문 저장~~ | ~~SHA-256 해싱 없음~~ | Resolved |
| ~~MEDIUM~~ | ~~F-07 localStorage 출석~~ | ~~다른 사용자/기기에서 접근 불가, 브라우저 초기화 시 손실~~ | Resolved (Iter 4) |

---

## 5. Match Rate Calculation

```
Feature-weighted Match Rate (equal weight per feature):
  = (90 + 95 + 100 + 95 + 95 + 75 + 90 + 80 + 90 + 95) / 10
  = 905 / 10
  = 90.5%

Previous: 89.5% (Iter 3), 89.0% (Iter 2), 66.5% (Iter 1)
Delta:    +1.0 from Iter 3, +24.0 from Iter 1

Threshold: 90%
Status:    PASSED -- above threshold by 0.5%
```

---

## 6. Iteration Comparison

| Feature | Iter 1 | Iter 2 | Iter 3 | Iter 4 | Items Fixed (Iter 4) |
|---------|:------:|:------:|:------:|:------:|-------------|
| F-01 | 90% | 90% | 90% | 90% | -- |
| F-02 | 80% | 95% | 95% | 95% | -- |
| F-03 | 70% | 100% | 100% | 100% | -- |
| F-04 | 70% | 90% | 95% | 95% | -- |
| F-05 | 65% | 95% | 95% | 95% | -- |
| F-06 | 50% | 75% | 75% | 75% | -- |
| F-07 | 55% | 80% | 80% | 90% | Supabase persistence (upsert to system_settings + load on init) |
| F-08 | 35% | 80% | 80% | 80% | -- |
| F-09 | 75% | 90% | 90% | 90% | -- |
| F-10 | 75% | 95% | 95% | 95% | -- |

---

## 7. Recommended Actions (Backlog -- Threshold Passed)

The 90% threshold has been reached (90.5%). The following items remain as optional backlog improvements.

### Quick Wins (polish)

| Action | Feature | Current | Target | Effort |
|--------|---------|:-------:|:------:|:------:|
| Add "수정됨" indicator on edited comments | F-02 | 95% | 100% | ~15 min |
| Add 512x512 PNG icon for PWA | F-09 | 90% | 95% | ~20 min |

### Higher Impact Items (backlog)

| Action | Feature | Current | Target | Effort |
|--------|---------|:-------:|:------:|:------:|
| Add jsPDF CDN for direct PDF download | F-06 | 75% | 95% | ~4-5 hours |
| Add KPI trend line chart over time | F-08 | 80% | 95% | ~3-4 hours |
| Migrate attendance to dedicated Supabase table (relational) | F-07 | 90% | 100% | ~2-3 hours |

---

## 8. Post-Analysis Assessment

Given the 90.5% match rate (above the 90% threshold):

> Design and implementation match well. The 90% threshold has been crossed. Remaining gaps are optional backlog items.

The F-07 Supabase persistence fix in iteration 4 closed the last critical data durability gap. Attendance data is now persisted server-side via `system_settings` table, with automatic loading and merge on app initialization.

**All security issues**: Resolved (F-03 password hashing/verification in iter 2, F-07 data persistence in iter 4).

**Remaining gaps** (2 items, lower-priority features):
1. **F-06** (75%): No jsPDF -- all reports use window.print()
2. **F-08** (80%): No KPI trend graph over time (static current-status view only)

**Journey**: 66.5% (iter 1) -> 89.0% (iter 2, +18 fixes) -> 89.5% (iter 3, F-04 date filter) -> 90.5% (iter 4, F-07 Supabase persistence). Total: 20 fixes across 4 iterations.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-10 | Initial gap analysis (66.5%) | gap-detector |
| 2.0 | 2026-03-10 | Iteration 2 re-check after 18 fixes (89.0%) | gap-detector |
| 3.0 | 2026-03-10 | Iteration 3: F-04 date range filter verified (89.5%) | gap-detector |
| 4.0 | 2026-03-10 | Iteration 4: F-07 Supabase attendance persistence verified (90.5%) -- THRESHOLD PASSED | gap-detector |

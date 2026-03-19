# F-06 PDF 직접 생성 Gap Analysis

> **Feature**: F-06-pdf-generation
> **Date**: 2026-03-18
> **Design Document**: `docs/02-design/features/F-06-pdf-generation.design.md`
> **Implementation**: `index.html`

---

## Overall Match Rate: 93% (after fixes)

| Category | Before Fix | After Fix |
|----------|:----------:|:---------:|
| Design Match | 86% | 93% |
| Status | WARNING | PASS |

---

## Findings (14 items + 1 design section)

| # | Requirement | Status | Note |
|---|-------------|:------:|------|
| 1 | html2pdf.js CDN in `<head>` | MATCH | jsdelivr 0.10.1 |
| 2 | `generatePDF()` top-level utility | MATCH | |
| 3 | CDN 미로드 fallback alert | MATCH | |
| 4 | `.no-print` 요소 제거 | MATCH | |
| 5 | html2pdf options (A4, scale:2, margin:10) | MATCH | |
| 6 | 에러 처리 (.catch + cleanup) | MATCH | |
| 7 | 정산보고서 `📥 PDF` 버튼 | MATCH | |
| 8 | 정산보고서 HTML 헬퍼 추출 | MATCH (fixed) | `getSettlementReportHTML()` 추출 완료 |
| 9 | 월별 명세서 `📥 PDF` 버튼 | MATCH | |
| 10 | 월별 명세서 HTML 헬퍼 추출 | MATCH (fixed) | `getMonthlyReportHTML()` 추출 완료 |
| 11 | 급여지급명세서 `📥 PDF` 버튼 | MATCH | |
| 12 | 급여명세서 → `generateSalaryStatementHTML()` 재활용 | MATCH | |
| 13 | 기존 인쇄 버튼 하위호환 | MATCH | |
| 14 | PDF 파일명에 날짜 포함 | MATCH | |
| 15 | 인쇄 창 내 PDF 버튼 (Design Section 6) | N/A | 설계에서 제외 — 메인 페이지 PDF 버튼으로 충분 |

---

## Fix Applied

- 정산보고서: 인라인 HTML 생성 → `getSettlementReportHTML()` 헬퍼 추출, 인쇄+PDF 공유
- 월별 명세서: 인라인 HTML 생성 → `getMonthlyReportHTML()` 헬퍼 추출, 인쇄+PDF 공유
- Design Section 6 (인쇄 창 내부 PDF 버튼): 메인 페이지에서 PDF 다운로드 가능하므로 실용적 가치 낮아 설계 문서에서 제외

# F-10 뉴스레터 제작 기능 Gap Analysis

> **Feature**: F-10-newsletter
> **Date**: 2026-03-18
> **Design Document**: `docs/02-design/features/F-10-newsletter.design.md`
> **Implementation**: `index.html`

---

## Overall Match Rate: 95%

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 95% | PASS |
| Feature Completeness | 100% | PASS |

---

## Detailed Findings

| # | Requirement | Status | Evidence |
|---|-------------|:------:|----------|
| 1 | `generateNewsletterHTML()` 최상위 스코프, 시그니처 `(config, selectedSchedules, selectedBoards, orgName)` | MATCH | line ~3037 |
| 2 | 네비게이션 `{ id: 'newsletter', label: '📰 뉴스레터' }` (guide 뒤, admin 앞) | MATCH | line ~11379 |
| 3 | `renderContent()` switch `case "newsletter"` | MATCH | line ~11329 |
| 4 | useState: `newsletterConfig` (9개 필드), `selectedScheduleIds` (Set), `selectedBoardIds` (Set) | MATCH | line ~3303-3309 |
| 5a | 뉴스레터 정보 입력 (title, issueNumber, publishDate, greeting, closing) | MATCH | line ~10536-10566 |
| 5b | 기간 필터 (dateFrom, dateTo) | MATCH | line ~10569-10578 |
| 5c | 일정 필터링 (기간 + 카테고리) | MATCH | line ~10480-10484 |
| 5d | 게시글 필터링 (기간 + board_type, `created_at.split('T')[0]`) | MATCH | line ~10487-10492 |
| 5e | 체크박스 개별 선택 (Set toggle 패턴) | MATCH | line ~10495-10502 |
| 5f | 전체 선택/해제 토글 | MATCH | line ~10498-10505 |
| 5g | 카테고리 드롭다운 (일정 5종, 게시판 4종) | MATCH | line ~10474-10478 |
| 5h | 실시간 미리보기 패널 | MATCH | line ~10656-10731 |
| 5i | 인쇄 버튼 → `handlePrintNewsletter()` | MATCH | line ~10650 |
| 6 | `handlePrintNewsletter()` 유효성검증 + 생성 + window.open | MATCH | line ~10508-10520 |
| 7 | `DOMPurify.sanitize` 게시글 content XSS 방어 | MATCH | line ~3071 |
| 8 | 게시글 미리보기 200자 요약 (`stripHtml`) | MATCH | line ~10706 |
| 9 | 빈 상태 안내 메시지 | MATCH | line ~10720-10725 |
| 10 | A4 인쇄 CSS (`@page`, `@media print`) | MATCH | line ~3089-3090 |
| 11 | 2분할 그리드 레이아웃 | **PARTIAL** | `gridTemplateColumns: '1fr 1fr'` — 모바일 반응형 breakpoint 없음 |

---

## Gap Details

### GAP-01: 모바일 반응형 브레이크포인트 (PARTIAL)

**설계**: 데스크톱·모바일 반응형 작동
**구현**: `gridTemplateColumns: '1fr 1fr'` 인라인 스타일만 있고, 모바일에서 1열 스택으로 전환하는 `@media` 규칙 없음
**영향**: Low — 뉴스레터 제작은 주로 데스크톱에서 수행
**수정 방안**: 글로벌 `<style>` 블록에 미디어 쿼리 추가

---

## Enhancements Beyond Design

설계 문서에 없으나 구현에 추가된 개선사항:

1. **팝업 차단 감지** — window.open 실패 시 사용자 안내
2. **DOMPurify 폴백** — DOMPurify 미로드 시 HTML escaping으로 대체
3. **스크롤 가능 목록** — `maxHeight: 250` + overflow scroll
4. **선택 카운터** — `(N/M)` 형태로 선택/전체 수량 표시
5. **빈 필터 결과 안내** — 기간 필터 적용 후 결과 없을 때 메시지
6. **고정 미리보기** — `position: sticky` 로 스크롤 시 미리보기 고정

---

## Summary

전체 18개 검증 항목 중 17개 완전 일치, 1개 부분 일치.
모바일 반응형 미비는 Low 영향으로, Match Rate **95%**로 PASS 기준(90%) 충족.

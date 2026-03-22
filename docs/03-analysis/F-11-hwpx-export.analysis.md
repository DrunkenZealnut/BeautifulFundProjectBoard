# F-11 HWPX 내보내기 Gap Analysis

> **Feature**: F-11-hwpx-export
> **Date**: 2026-03-18
> **Design Document**: `docs/02-design/features/F-11-hwpx-export.design.md`
> **Implementation**: `index.html`

---

## Overall Match Rate: 100%

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | 100% | PASS |
| Architecture Compliance | 100% | PASS |
| Convention Compliance | 100% | PASS |

---

## Findings (20 items)

| # | Requirement | Status |
|---|-------------|:------:|
| 1 | OWPML XML 상수 4개 (VERSION, CONTAINER, CONTENT_HPF, HEADER) | MATCH |
| 2 | A4 용지 크기 (59528 x 84188) + 여백 | MATCH |
| 3 | fontfaces (함초롬돋움), charProperties (0,1,2), paraProperties (0,1) | MATCH |
| 4 | `generateHWPX(title, sections, filename)` async 함수 | MATCH |
| 5 | JSZip 미로드 시 alert fallback | MATCH |
| 6 | paragraph 지원 (text, bold, fontSize, align) | MATCH |
| 7 | table 지원 (headers + rows) | MATCH |
| 8 | XML escape 함수 적용 | MATCH |
| 9 | ZIP 구조 6개 파일 (mimetype STORE) | MATCH |
| 10 | Blob + createObjectURL 자동 다운로드 | MATCH |
| 11 | try/catch 에러 처리 | MATCH |
| 12 | 정산보고서 📄 HWPX 버튼 | MATCH |
| 13 | 정산보고서 sections (제목+요약+표+합계) | MATCH |
| 14 | 월별 명세서 📄 HWPX 버튼 | MATCH |
| 15 | 월별 그룹핑 + 소계 표 | MATCH |
| 16 | 뉴스레터 📄 HWPX 버튼 | MATCH |
| 17 | 뉴스레터 일정 표 + 게시글 본문 | MATCH |
| 18 | 뉴스레터 빈 선택 시 alert | MATCH |
| 19 | formatLocalDate() 파일명 (UTC 아님) | MATCH |
| 20 | 기존 인쇄·PDF 버튼 하위호환 | MATCH |

---

## Enhancements Beyond Design (7건)

1. HANJA fontface 추가 (한자 지원)
2. `&quot;` XML escape 추가
3. paragraph 순차 id 속성 추가
4. table cellSpacing/borderFill 속성
5. table 헤더 행 bold (charPrIDRef="2")
6. 정산보고서 기관명+날짜 부제목 추가
7. DEFLATE compression level 6 명시

---

## Summary

20개 검증 항목 전체 MATCH. 7건의 설계 대비 추가 개선 포함.
Match Rate **100%**로 PASS.

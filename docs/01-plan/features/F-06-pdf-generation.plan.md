# F-06 PDF 직접 생성 스코어 향상 Planning Document

> **Summary**: window.print() 기반 보고서를 jsPDF 직접 다운로드로 전환하여 F-06 스코어 75% → 95%+ 달성
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: PDCA Plan
> **Date**: 2026-03-11
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 모든 보고서(정산보고서, 월별 명세서, 분기별 보고서, 급여지급명세서)가 `window.print()`에 의존하여 사용자가 직접 "PDF로 저장"을 선택해야 함. 자동화된 PDF 파일 다운로드 불가 |
| **Solution** | jsPDF + html2canvas CDN을 추가하고, 기존 print-based 보고서를 직접 PDF 다운로드 기능으로 전환/보강 |
| **Function UX Effect** | 클릭 한 번으로 PDF 파일 자동 다운로드 → 행정 제출 워크플로우 간소화. 기존 인쇄 기능도 병행 유지 |
| **Core Value** | 아름다운재단 제출용 정산보고서를 일관된 포맷의 PDF로 즉시 생성, 행정 업무 효율 극대화 |

---

## 1. Overview

### 1.1 Purpose

F-06 PDF 직접 생성 기능의 Gap Analysis 스코어를 75%에서 95%+ 로 향상시킨다. 현재 `window.open()` + `window.print()` 방식으로 구현된 보고서들을 jsPDF 기반 직접 다운로드로 전환한다.

### 1.2 Background

- **현재 상태**: 정산보고서, 월별 명세서, 분기별 보고서 모두 구현되어 있으나 print 기반
- **Gap**: jsPDF 프로그래매틱 PDF 생성 미구현 (Plan 원본에서 명시적으로 요구)
- **영향 범위**: 예산 관리 페이지의 보고서 버튼 3개 + 급여지급명세서 1개

### 1.3 Related Documents

- Plan: `docs/01-plan/features/feature-suggestions.plan.md` (F-06 섹션)
- Analysis: `docs/03-analysis/feature-suggestions.analysis.md` (F-06: 75%)
- Implementation: `index.html` (현재 11,500+ 줄)

---

## 2. Scope

### 2.1 In Scope

- [ ] jsPDF + html2canvas CDN 추가 (`<head>` 영역)
- [ ] 정산보고서: PDF 직접 다운로드 버튼 추가 (기존 인쇄와 병행)
- [ ] 월별 명세서: PDF 직접 다운로드 옵션 추가
- [ ] 급여지급명세서: PDF 다운로드 옵션 추가
- [ ] 기관 직인 이미지 자동 삽입 (system_settings의 org_seal 활용)

### 2.2 Out of Scope

- 분기별 보고서 PDF 전환 (이미 충분한 기능, 우선순위 낮음)
- 아름다운재단 제출 양식 정밀 매칭 (범용 포맷으로 충분)
- PDF 서버사이드 생성 (클라이언트 사이드 CDN 라이브러리로 대체)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | jsPDF + html2canvas CDN 스크립트 추가 | High | Pending |
| FR-02 | 정산보고서 "📥 PDF 다운로드" 버튼 추가 | High | Pending |
| FR-03 | 월별 명세서 PDF 다운로드 기능 추가 | Medium | Pending |
| FR-04 | 급여지급명세서 PDF 다운로드 기능 추가 | Medium | Pending |
| FR-05 | 기관 직인 이미지(org_seal) PDF에 삽입 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | PDF 생성 3초 이내 | 브라우저 콘솔 타이머 |
| Compatibility | Chrome, Safari, Firefox 지원 | 수동 테스트 |
| File Size | 생성 PDF 1MB 이하 (텍스트 위주) | 다운로드 파일 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] jsPDF CDN 로드 확인 (window.jspdf 사용 가능)
- [ ] 정산보고서 PDF 버튼 클릭 시 .pdf 파일 자동 다운로드
- [ ] 월별 명세서 PDF 다운로드 정상 동작
- [ ] 급여지급명세서 PDF 다운로드 정상 동작
- [ ] 기존 인쇄 버튼은 그대로 유지 (하위호환)

### 4.2 Quality Criteria

- [ ] Gap Analysis F-06 스코어 95%+ 달성
- [ ] 전체 Match Rate 90.5% → 92%+ 향상

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| jsPDF CDN 로딩 실패 | Medium | Low | 로딩 상태 체크 + 기존 인쇄 기능 fallback 유지 |
| 한글 폰트 깨짐 | High | Medium | jsPDF 기본 폰트로 충분한 텍스트만 사용, 복잡한 레이아웃은 html2canvas로 이미지 변환 |
| PDF 파일 크기 과다 | Low | Low | 텍스트 기반 생성 우선, 이미지는 최소화 |
| 복잡한 테이블 레이아웃 깨짐 | Medium | Medium | jsPDF-AutoTable 플러그인 활용 또는 html2canvas 캡처 방식 사용 |

---

## 6. Architecture Considerations

### 6.1 Project Level

**Starter** — 단일 파일 SPA, CDN 기반, 빌드 없음

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| PDF 라이브러리 | jsPDF / pdfmake / html2pdf.js | html2pdf.js (= jsPDF + html2canvas 래퍼) | 가장 간단한 CDN 사용, HTML → PDF 변환 한 줄로 가능 |
| 한글 처리 | 커스텀 폰트 임베딩 / html2canvas | html2canvas | 폰트 파일 불필요, 렌더링된 화면을 이미지로 캡처 후 PDF 삽입 |
| CDN 소스 | unpkg / jsdelivr / cdnjs | jsdelivr | 기존 프로젝트에서 사용 중인 CDN |

### 6.3 Implementation Approach

```
Strategy: html2pdf.js CDN (jsPDF + html2canvas 통합 래퍼)

1. <script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"></script>

2. PDF 생성 함수:
   const generatePDF = (htmlContent, filename) => {
       const el = document.createElement('div');
       el.innerHTML = htmlContent;
       document.body.appendChild(el);
       html2pdf().set({
           margin: 10,
           filename: filename,
           html2canvas: { scale: 2 },
           jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
       }).from(el).save().then(() => document.body.removeChild(el));
   };

3. 기존 버튼 옆에 "📥 PDF" 버튼 추가
4. 기존 window.print() 로직의 HTML 생성 코드를 재사용
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` 코딩 컨벤션 섹션 존재
- [x] CDN 라이브러리 추가 시 `<head>` 영역에 `<script>` 태그 추가
- [x] 한글 커밋 메시지 (`feat:`, `fix:` 등)
- [x] 단일 파일 SPA 패턴 (index.html)

### 7.2 CDN 추가 규칙

| Rule | Detail |
|------|--------|
| 위치 | `<head>` 영역, 기존 CDN 스크립트 아래 |
| 소스 | jsdelivr CDN 우선 사용 |
| 라이브러리 체크 | `if (!window.html2pdf) { alert('...'); return; }` 패턴 |

---

## 8. Implementation Plan

### 8.1 작업 순서

| Step | Task | 예상 소요 | 우선순위 |
|------|------|-----------|----------|
| 1 | html2pdf.js CDN 스크립트 추가 | 5분 | High |
| 2 | `generatePDF()` 유틸리티 함수 작성 | 15분 | High |
| 3 | 정산보고서 PDF 다운로드 버튼 추가 | 20분 | High |
| 4 | 월별 명세서 PDF 다운로드 기능 추가 | 15분 | Medium |
| 5 | 급여지급명세서 PDF 다운로드 기능 추가 | 15분 | Medium |
| 6 | 기관 직인 삽입 (org_seal 활용) | 10분 | Low |

### 8.2 예상 결과

| Before | After |
|--------|-------|
| F-06: 75% | F-06: 95%+ |
| Overall: 90.5% | Overall: 92%+ |

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design F-06-pdf-generation`)
2. [ ] 구현 시작 (`/pdca do F-06-pdf-generation`)
3. [ ] Gap 분석 재실행 (`/pdca analyze F-06-pdf-generation`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-11 | Initial draft | PDCA Plan |

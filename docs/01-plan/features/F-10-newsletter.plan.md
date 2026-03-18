# F-10 뉴스레터 제작 기능 Planning Document

> **Summary**: 일정(schedules)과 게시글(boards)을 선택하여 인쇄 가능한 뉴스레터 HTML을 생성하는 기능
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: Claude Code
> **Date**: 2026-03-18
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 사업 진행 현황을 이해관계자에게 정기적으로 공유해야 하나, 일정·게시글이 시스템 내에 분산되어 수동 취합에 시간이 소요됨 |
| **Solution** | 일정과 게시글을 UI에서 선택하고, 인쇄/공유 가능한 뉴스레터 HTML을 자동 생성하는 기능 추가 |
| **Function/UX Effect** | 뉴스레터 탭에서 기간·카테고리별 콘텐츠 선택 → 미리보기 → 인쇄/새 창 출력. 기존 정산보고서 출력 패턴과 동일한 UX |
| **Core Value** | 사업 투명성 강화 및 이해관계자 커뮤니케이션 효율화 — 5분 이내 뉴스레터 제작 가능 |

---

## 1. Overview

### 1.1 Purpose

사업 관리시스템에 축적된 일정(schedules)과 게시글(boards)을 선택적으로 취합하여, 인쇄 가능한 뉴스레터 형태의 HTML 문서를 생성한다. 아름다운재단 보고, 참여자 공유, 외부 홍보 등에 활용한다.

### 1.2 Background

- 현재 시스템에 일정·게시글 데이터가 충분히 축적되어 있으나, 이를 외부 공유용으로 정리하려면 수작업이 필요함
- 기존에 정산보고서(`window.open` + `document.write` + `print()`) 패턴이 확립되어 있어 동일 방식으로 구현 가능
- 공익사업 특성상 사업 현황을 정기적으로 지원기관·참여자에게 공유해야 함

### 1.3 Related Documents

- CLAUDE.md — 프로젝트 아키텍처 및 코드 컨벤션
- `index.html` — 단일 파일 SPA (모든 구현이 이 파일에 추가됨)

---

## 2. Scope

### 2.1 In Scope

- [ ] 네비게이션에 `newsletter` 페이지 추가
- [ ] 기간(시작일~종료일) 선택으로 일정·게시글 필터링
- [ ] 카테고리별 필터 (일정: 교육/캠페인/회의/평가/기타, 게시판: 공지/자료/보고서/자유)
- [ ] 체크박스로 개별 항목 선택/해제
- [ ] 뉴스레터 제목·인사말·마무리말 직접 입력
- [ ] 미리보기 화면 (실제 출력과 동일한 레이아웃)
- [ ] 새 창 열어 인쇄 (`window.open` + `print()` — 기존 정산보고서 패턴)

### 2.2 Out of Scope

- 이메일 발송 기능 (SMTP 연동 없음)
- PDF 파일 직접 생성 (브라우저 인쇄 → PDF 저장으로 대체)
- 뉴스레터 이력 DB 저장 (생성 시점에 즉시 출력만)
- 갤러리 이미지 삽입 (Phase 2에서 검토)
- 뉴스레터 템플릿 관리 (고정 레이아웃 1종)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 네비게이션에 '뉴스레터' 메뉴 추가 (`currentPage = 'newsletter'`) | High | Pending |
| FR-02 | 기간 선택 (시작일·종료일) 필터 | High | Pending |
| FR-03 | 일정 목록 표시 및 체크박스 선택 (제목, 날짜, 카테고리, 장소) | High | Pending |
| FR-04 | 게시글 목록 표시 및 체크박스 선택 (제목, 작성일, 유형, 요약) | High | Pending |
| FR-05 | 뉴스레터 헤더 입력 (제목, 발행호수, 발행일) | High | Pending |
| FR-06 | 인사말·마무리말 텍스트 입력 영역 | Medium | Pending |
| FR-07 | 미리보기 영역 (실시간 반영) | High | Pending |
| FR-08 | '인쇄' 버튼 → 새 창 HTML 생성 + `window.print()` | High | Pending |
| FR-09 | 전체 선택/해제 토글 (일정, 게시글 각각) | Medium | Pending |
| FR-10 | 카테고리별 필터 (일정 5종, 게시판 4종) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 항목 100개 이하에서 UI 버벅임 없음 | 체감 테스트 |
| 인쇄 품질 | A4 용지에 깔끔하게 출력 | `@media print` CSS 검증 |
| 접근성 | 키보드로 항목 선택 가능 | 탭 네비게이션 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 뉴스레터 페이지에서 일정·게시글 선택 가능
- [ ] 선택한 항목으로 미리보기 렌더링
- [ ] 인쇄 버튼으로 새 창에 뉴스레터 HTML 출력
- [ ] A4 인쇄 시 레이아웃 정상 (헤더, 본문, 푸터)
- [ ] 기존 페이지(대시보드, 예산 등) 정상 동작 확인

### 4.2 Quality Criteria

- [ ] 기존 코드 패턴(정산보고서 출력) 일관성 유지
- [ ] 빈 항목 선택 시 안내 메시지 표시
- [ ] 모바일 반응형 레이아웃 (선택 화면)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| index.html 비대화 (현재 11,400줄) | Medium | High | 렌더 함수 최소화, 뉴스레터 HTML 생성은 별도 함수로 분리 |
| 게시글 content에 HTML 포함 시 XSS | High | Medium | DOMPurify로 sanitize (이미 CDN 로드됨) |
| 인쇄 시 레이아웃 깨짐 | Medium | Medium | 기존 정산보고서 `@media print` CSS 패턴 재활용 |
| 장문 게시글 선택 시 뉴스레터 과도하게 길어짐 | Low | Medium | content 미리보기에 200자 요약 표시, 전문 포함 옵션 |

---

## 6. Architecture Considerations

### 6.1 Project Level

**Starter** — 기존 단일 파일 SPA 패턴 유지. 빌드 도구 없음, CDN React + Babel.

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 구현 위치 | `index.html` 내 인라인 | 기존 패턴 일관성 — 모든 코드가 단일 파일 |
| 뉴스레터 HTML 생성 | `generateNewsletterHTML()` 최상위 함수 | `generateSalaryStatementHTML()` 패턴과 동일 |
| 출력 방식 | `window.open()` + `document.write()` + `print()` | 정산보고서·분기보고서와 동일한 검증된 패턴 |
| 게시글 HTML 처리 | DOMPurify sanitize 후 삽입 | 이미 로드된 라이브러리 활용 |
| 데이터 소스 | 기존 `data.schedules`, `data.boards` state 재사용 | 추가 Supabase 쿼리 불필요 |

### 6.3 구현 구조

```
index.html 추가 영역:
├── generateNewsletterHTML(config)      ← 최상위 스코프 (line ~2234 부근, 급여명세서 함수 옆)
│   ├── 뉴스레터 HTML 템플릿 생성
│   ├── 선택된 일정 섹션 렌더링
│   ├── 선택된 게시글 섹션 렌더링
│   └── @media print CSS 포함
│
└── ProjectManagementSystem 내부:
    ├── useState: newsletterConfig (제목, 호수, 기간, 인사말 등)
    ├── useState: selectedScheduleIds, selectedBoardIds
    ├── renderNewsletter()             ← 뉴스레터 편집/선택 UI
    └── renderContent() 에 'newsletter' case 추가
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions (적용됨)

- [x] `CLAUDE.md` 코딩 컨벤션 섹션 존재
- [x] 한국어 UI, 영어 코드 주석
- [x] React functional components + hooks
- [x] `fmt()`, `pct()` 유틸리티 패턴
- [x] `window.open` + `document.write` 인쇄 패턴

### 7.2 준수할 컨벤션

| Category | Rule |
|----------|------|
| 네비게이션 | `currentPage` state에 `'newsletter'` 추가, nav 버튼 추가 |
| 상태 관리 | `ProjectManagementSystem` 내 `useState`로 관리 |
| 함수 명명 | `renderNewsletter()`, `generateNewsletterHTML()` |
| HTML 생성 | 기존 `generateSalaryStatementHTML()` 패턴 따름 |
| 커밋 메시지 | `feat: 뉴스레터 제작 기능 추가` |

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`F-10-newsletter.design.md`)
2. [ ] 구현 (`index.html`에 코드 추가)
3. [ ] Gap 분석 및 검증

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial draft | Claude Code |

# F-12 뉴스레터 이미지 삽입 + 글 재가공 기능 Planning Document

> **Summary**: 게시판 첨부 이미지를 뉴스레터에 표시하고, 게시글 본문을 뉴스레터에 적합한 톤으로 AI 재가공하는 기능
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: Claude Code
> **Date**: 2026-03-20
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 뉴스레터에 게시글을 포함할 때 텍스트만 표시되고, 첨부 이미지가 누락되며, 원본 게시글이 뉴스레터 톤에 맞지 않아 수동 편집이 필요함 |
| **Solution** | 게시판 첨부파일(Supabase Storage)에서 이미지를 자동 로드하여 뉴스레터 카드에 삽입하고, Claude API를 통해 게시글 본문을 뉴스레터 톤으로 자동 재가공 |
| **Function/UX Effect** | 게시글 선택 시 첨부 이미지 자동 표시 + "AI 재가공" 버튼으로 원클릭 톤 변환. 미리보기·인쇄·SNS 복사 모두 이미지 포함 |
| **Core Value** | 뉴스레터 제작 시간 대폭 단축 — 이미지 삽입 자동화 + AI 글쓰기 보조로 비전문가도 전문적 뉴스레터 생성 가능 |

---

## 1. Overview

### 1.1 Purpose

뉴스레터에 게시판 첨부 이미지를 자동 포함하고, 게시글 본문을 뉴스레터에 적합한 톤/형식으로 AI가 자동 재가공하는 기능을 추가한다.

### 1.2 Background

- 현재 뉴스레터는 게시글의 텍스트만 표시하며, Supabase Storage에 저장된 첨부 이미지는 누락됨
- 게시판 글은 업무용 톤이라 뉴스레터의 친근한 톤과 맞지 않아 수동 편집 필요
- 첨부파일은 `attachments` 테이블에 `board_id`로 연결되어 있고, `supabase.storage.from('attachments').getPublicUrl()` 패턴으로 URL 획득 가능
- 이미지 표시와 AI 재가공은 독립적 기능이므로 단계적 구현 가능

---

## 2. Scope

### 2.1 In Scope

**Part 1: 이미지 삽입**
- [ ] 게시글 선택 시 `attachments` 테이블에서 해당 게시글의 이미지 자동 조회
- [ ] 뉴스레터 미리보기에 이미지 썸네일 표시
- [ ] 인쇄 출력 HTML에 이미지 `<img>` 태그 포함
- [ ] SNS 복사 시 이미지 포함

**Part 2: AI 글 재가공**
- [ ] 게시글 본문을 뉴스레터 톤으로 변환하는 "AI 재가공" 버튼
- [ ] Vercel Serverless Function으로 Claude API 호출 (`/api/rewrite`)
- [ ] 재가공된 텍스트를 미리보기에 반영 (원본 대체 또는 편집 가능)
- [ ] 재가공 결과 수동 편집 가능

### 2.2 Out of Scope

- 갤러리 이미지 삽입 (게시판 첨부파일만 대상)
- 이미지 크기 조정/편집 (원본 비율 유지, CSS로 max-width만 설정)
- 게시글 본문 외 일정 설명 재가공
- AI 재가공 이력 저장 (세션 내에서만 유지)
- 다국어 재가공

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 게시글 선택 시 attachments 테이블에서 이미지(file_type LIKE 'image/%') 조회 | High | Pending |
| FR-02 | Supabase Storage publicUrl로 이미지 URL 생성 | High | Pending |
| FR-03 | 미리보기 게시글 카드에 이미지 표시 (max-width: 100%, border-radius) | High | Pending |
| FR-04 | 인쇄 HTML(generateNewsletterHTML)에 이미지 `<img>` 삽입 | High | Pending |
| FR-05 | SNS 복사 시 이미지 포함 (HTML 리치 텍스트) | Medium | Pending |
| FR-06 | "AI 재가공" 버튼 — POST /api/rewrite API 호출 | Medium | Pending |
| FR-07 | Claude API로 게시글 본문을 뉴스레터 톤으로 변환 | Medium | Pending |
| FR-08 | 재가공 결과를 미리보기에 반영 (원본/재가공 토글) | Medium | Pending |
| FR-09 | 재가공 결과 직접 편집 가능 (textarea) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 이미지 로딩 | 3초 이내 (공개 URL, CDN 경유) | 체감 테스트 |
| AI 재가공 | 5초 이내 응답 | API 응답 시간 |
| 비용 | Claude API 호출당 ~$0.01 이하 (짧은 텍스트) | API 로그 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 이미지 있는 게시글 선택 시 미리보기에 이미지 표시
- [ ] 인쇄 출력에 이미지 포함
- [ ] AI 재가공 버튼 클릭 시 톤 변환 결과 표시
- [ ] 기존 기능(필터, 인쇄, PDF, SNS 복사) 정상 동작

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Supabase Storage 이미지 URL CORS 문제 | High | Low | getPublicUrl()은 CORS 제한 없음. CSP에 supabase.co 이미 허용 |
| 이미지 크기가 커서 인쇄 레이아웃 깨짐 | Medium | Medium | CSS max-width: 100% + object-fit: cover로 제한 |
| Claude API 키 노출 | High | Low | 환경 변수로 관리, Vercel 서버사이드에서만 사용 |
| AI 재가공 결과 품질 불만족 | Medium | Medium | 재가공 결과 편집 가능 + 원본 복원 토글 |
| AI API 비용 증가 | Low | Low | 짧은 텍스트만 처리 (게시글 본문 500자 이내 권장) |

---

## 6. Architecture Considerations

### 6.1 Project Level

**Starter → Dynamic 확장** — Claude API 호출을 위해 Vercel Serverless Function 추가 (기존 /api/hwpx 패턴 재사용)

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| 이미지 소스 | Supabase Storage publicUrl | 이미 사용 중인 패턴, CORS 무관 |
| AI API | Claude API (Vercel Serverless) | 프로젝트와 동일 AI 제품군, 한국어 품질 우수 |
| API 엔드포인트 | `/api/rewrite` (Vercel Python) | 기존 `/api/hwpx` 패턴 재사용 |
| 재가공 결과 저장 | 세션 state only | DB 저장 불필요, 간단한 구현 |

### 6.3 구현 구조

```text
Part 1 — 이미지:
├── 뉴스레터 게시글 선택 시 attachments 조회 (Supabase)
├── publicUrl로 이미지 URL 매핑
├── 미리보기 카드에 <img> 표시
├── generateNewsletterHTML에 이미지 삽입
└── SNS 복사 시 이미지 포함

Part 2 — AI 재가공:
├── api/rewrite.py (Vercel Serverless Function)
│   └── Claude API 호출: "뉴스레터 톤으로 재작성"
├── "AI 재가공" 버튼 (게시글 카드 하단)
├── useState: rewrittenContents (boardId → rewritten text)
└── 원본/재가공 토글 표시
```

---

## 7. Next Steps

1. [ ] Design 문서 작성 (`/pdca design F-12-newsletter-images-rewrite`)
2. [ ] Part 1 (이미지) 구현
3. [ ] Part 2 (AI 재가공) 구현
4. [ ] Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-20 | Initial draft | Claude Code |

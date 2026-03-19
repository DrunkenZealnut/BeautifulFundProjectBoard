# F-11 HWPX 내보내기 기능 Planning Document

> **Summary**: 보고서(정산보고서, 월별 명세서 등) HTML을 HWPX(한글) 파일로 변환하여 다운로드하는 기능
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: Claude Code
> **Date**: 2026-03-18
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 아름다운재단 제출 서류가 한글(HWP/HWPX) 포맷을 요구하지만, 현재 시스템은 인쇄(HTML)와 PDF 다운로드만 지원하여 사용자가 별도 변환 작업을 해야 함 |
| **Solution** | JSZip(이미 로드됨)으로 OWPML(HWPX) XML 구조를 직접 생성하여 .hwpx 파일 다운로드 기능 추가. 별도 서버 불필요 |
| **Function/UX Effect** | 기존 📥 PDF 버튼 옆에 📄 HWPX 버튼 추가. 클릭 한 번으로 .hwpx 자동 다운로드. 한글 프로그램에서 바로 열기 가능 |
| **Core Value** | 아름다운재단 행정 제출 워크플로우 완전 자동화 — PDF→한글 수동 변환 과정 제거 |

---

## 1. Overview

### 1.1 Purpose

시스템에서 생성하는 보고서(정산보고서, 월별 명세서, 급여지급명세서, 뉴스레터)를 HWPX 포맷으로 직접 다운로드할 수 있게 한다. HWPX는 ZIP 안에 OWPML XML을 담은 개방형 포맷이므로, 이미 프로젝트에 로드된 JSZip으로 클라이언트 사이드 생성이 가능하다.

### 1.2 Background

- 아름다운재단 및 공공기관 제출 서류는 한글(HWP/HWPX) 포맷을 요구하는 경우가 많음
- 현재 보고서는 HTML 인쇄 + PDF 다운로드만 지원
- HWPX는 KS X 6101(OWPML) 국가 표준 기반 개방형 포맷으로, ZIP + XML 구조
- JSZip CDN이 이미 프로젝트에 로드되어 있어 추가 의존성 없이 구현 가능

### 1.3 Technical Research

#### HWPX 포맷 구조

HWPX = ZIP 아카이브, 내부 구조:
```text
├── mimetype                      # "application/hwp+zip"
├── META-INF/
│   └── manifest.xml              # 파일 목록
├── Contents/
│   ├── header.xml                # 문서 헤더 (용지 크기, 여백 등)
│   ├── content.hpf               # 본문 XML (단락, 텍스트, 표)
│   └── section0.xml              # 섹션 내용
└── settings.xml                  # 문서 설정
```

#### 사용 가능한 도구

| 도구 | 종류 | CDN 가용 | 비고 |
|------|------|:--------:|------|
| JSZip | ZIP 생성 | ✅ 이미 로드됨 | HWPX ZIP 패키징에 사용 |
| `@ssabrojs/hwpxjs` | npm 라이브러리 | ❌ CDN 없음 | Node.js 전용, HwpxWriter 클래스 제공 |
| 직접 XML 생성 | 순수 JS | ✅ | OWPML XML을 문자열로 직접 생성 |

#### 선택: JSZip + 직접 XML 생성

- `@ssabrojs/hwpxjs`는 CDN이 없고 Node.js 전용이라 no-build SPA에서 사용 불가
- JSZip이 이미 로드되어 있으므로, OWPML XML을 직접 생성하여 ZIP으로 패키징하는 방식 채택
- 복잡한 서식(표, 이미지)보다는 텍스트 + 기본 표 위주의 보고서이므로 직접 생성 가능

### 1.4 Related Documents

- [한컴테크: HWPX 포맷 구조](https://tech.hancom.com/hwpxformat/)
- [NHN Cloud: HWPX 살펴보기](https://meetup.nhncloud.com/posts/311)
- [한컴: OWPML 형식](https://www.hancom.com/support/downloadCenter/hwpOwpml)

---

## 2. Scope

### 2.1 In Scope

- [ ] `generateHWPX(title, content)` 유틸리티 함수 — JSZip으로 HWPX 파일 생성
- [ ] 정산보고서 📄 HWPX 다운로드 버튼
- [ ] 월별 명세서 📄 HWPX 다운로드 버튼
- [ ] 뉴스레터 📄 HWPX 다운로드 버튼
- [ ] A4 용지 설정 (210mm x 297mm, 여백 포함)
- [ ] 기본 텍스트 + 표(table) 지원

### 2.2 Out of Scope

- 이미지 삽입 (기관 직인 등 — 텍스트 기반 보고서로 충분)
- 복잡한 서식 (글머리 기호, 색상, 폰트 지정 — 기본 한글 스타일)
- 급여지급명세서 HWPX (이미 HWP 서식 파일이 별도로 존재)
- HWP → HWPX 양방향 변환
- 서버사이드 변환 (클라이언트 전용)
- HWPX 템플릿 편집/관리

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `generateHWPX(sections)` 함수 — OWPML XML 생성 + JSZip 패키징 | High | Pending |
| FR-02 | 정산보고서 HWPX 다운로드 버튼 (기존 PDF 버튼 옆) | High | Pending |
| FR-03 | 월별 명세서 HWPX 다운로드 버튼 | Medium | Pending |
| FR-04 | 뉴스레터 HWPX 다운로드 버튼 | Medium | Pending |
| FR-05 | A4 용지 크기 및 여백 설정 (OWPML header.xml) | High | Pending |
| FR-06 | 표(table) 렌더링 — 보고서 데이터를 OWPML 표 마크업으로 변환 | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Compatibility | 한/글 2020 이상에서 정상 열림 | 수동 테스트 |
| Performance | HWPX 생성 2초 이내 | 체감 테스트 |
| File Size | 생성 파일 100KB 이하 (텍스트 기반) | 다운로드 파일 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] `generateHWPX()` 함수가 유효한 .hwpx 파일을 생성하는가
- [ ] 생성된 .hwpx 파일이 한/글에서 정상적으로 열리는가
- [ ] 정산보고서 HWPX에 요약(예산/집행/잔여)과 집행 내역 표가 포함되는가
- [ ] 기존 인쇄·PDF 버튼이 정상 동작하는가 (하위호환)

### 4.2 Quality Criteria

- [ ] OWPML XML이 한컴 표준 스키마에 부합
- [ ] UTF-8 한글 텍스트가 깨지지 않음

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| OWPML XML 스키마 오류로 한글에서 파일이 안 열림 | High | Medium | 실제 HWPX 파일을 언팩하여 XML 구조를 참고 후 구현. 최소 구조부터 점진적 추가 |
| 표(table) 마크업이 복잡하여 렌더링 깨짐 | Medium | Medium | 간단한 표(header + body rows)만 지원. 복잡한 병합 셀은 제외 |
| 한/글 버전별 호환성 차이 | Medium | Low | HWPX는 표준화된 포맷이므로 2014 이상 전체 호환. 최소 구조 유지 |
| JSZip compression 옵션에 따른 파일 손상 | Low | Low | `compression: 'DEFLATE'` + mimetype은 비압축 (STORE) |

---

## 6. Architecture Considerations

### 6.1 Project Level

**Starter** — 단일 파일 SPA, CDN 기반. JSZip 이미 로드됨.

### 6.2 Key Architectural Decisions

| Decision | Selected | Rationale |
|----------|----------|-----------|
| HWPX 생성 방식 | JSZip + 직접 OWPML XML 생성 | CDN 없는 hwpxjs 대신, 이미 로드된 JSZip 활용 |
| XML 생성 | 템플릿 리터럴 문자열 | DOMParser/XMLSerializer 불필요, 단순 문자열 조합으로 충분 |
| 데이터 소스 | 기존 `getSettlementReportHTML()` 등 재활용 | HTML 대신 원본 데이터(data.budgetExecutions 등)에서 직접 변환 |
| 다운로드 방식 | `JSZip.generateAsync({type: 'blob'})` + `URL.createObjectURL` | 기존 프로젝트의 ZIP 다운로드 패턴(갤러리)과 동일 |

### 6.3 HWPX 최소 구조

```text
generateHWPX() 생성 파일 구조:
├── mimetype                    ← "application/hwp+zip" (비압축)
├── META-INF/manifest.xml       ← 파일 목록
├── Contents/
│   ├── header.xml              ← 용지 크기, 여백, 기본 스타일
│   └── section0.xml            ← 본문 (단락, 표)
└── version.xml                 ← HWPX 버전 정보
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions (적용됨)

- [x] JSZip CDN 이미 로드
- [x] 한국어 UI, 영어 코드 주석
- [x] `generatePDF()` 패턴 참고 (유틸리티 함수 + 버튼)
- [x] 갤러리 ZIP 다운로드 패턴 (`JSZip.generateAsync` + Blob + URL.createObjectURL`)

---

## 8. Next Steps

1. [ ] Design 문서 작성 (`/pdca design F-11-hwpx-export`)
2. [ ] 실제 HWPX 파일을 언팩하여 최소 XML 구조 파악
3. [ ] 구현 및 한/글 열기 테스트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial draft | Claude Code |

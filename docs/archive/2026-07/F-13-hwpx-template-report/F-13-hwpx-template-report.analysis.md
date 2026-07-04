# F-13-hwpx-template-report Analysis Report

> **Analysis Type**: Gap Analysis (Design vs Implementation)
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Analyst**: bkit gap-detector (with Claude Code)
> **Date**: 2026-07-04
> **Design Doc**: [F-13-hwpx-template-report.design.md](../02-design/features/F-13-hwpx-template-report.design.md)

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

Design v0.2 문서 대비 구현(서버리스 채우기 엔진 + 전처리 산출물 + 프론트 UI)의 일치율을 검증하고, 갭을 식별하여 Act 조치를 결정한다.

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/F-13-hwpx-template-report.design.md` (v0.2 기준 분석)
- **Implementation**: `api/hwpx-fill.py`, `api/hwpxfill_templates/{salary,receipt,minutes}/`, `scripts/preprocess_templates.py`, `index.html` (F-13 구간), `vercel.json`
- **Analysis Date**: 2026-07-04

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 핵심 영역별 결과

| 영역 | 항목 수 | Match | 부분(⚠️) | 미구현 |
|------|:------:|:-----:|:--------:|:------:|
| §3 Placeholder 명세 (3종 63개 키 + 분할 규칙 + reason 포맷) | 7 | 7 | 0 | 0 |
| §4 API 명세 (엔드포인트·스키마·응답·에러) | 7 | 6 | 1 | 0 |
| §5 서버 구현 (엔진·패키징·무결성·구조) | 5 | 3 | 2 | 0 |
| §6 UI/UX (진입점 3곳·미리보기·플로우) | 7 | 6 | 1 | 0 |
| §7 Error Handling | 5 | 2 | 3 | 0 |
| §8 Security | 4 | 4 | 0 | 0 |
| §10 컨벤션 / §11 파일 | 8 | 8 | 0 | 0 |
| **합계** | **43** | **36** | **7** | **0** |

세부 항목별 비교표는 gap-detector 원본 분석 참조 (본 문서 §9에 갭별 요약).

### 2.2 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Match Rate: 92% (가중) / 84% (엄격)          │
├─────────────────────────────────────────────┤
│  ✅ 완전 일치:      36 items (84%)            │
│  ⚠️ 부분/세부 편차:  7 items (16%)            │
│  ❌ 미구현:          0 items (0%)             │
│  가중: (36 + 7×0.5) / 43 = 91.9%             │
└─────────────────────────────────────────────┘
```

**판정: 90% 임계 초과 통과.** 기능 미구현(❌) 0건 — 모든 ⚠️는 UX 세부·문서 표기·패키징 명세 편차이며, 아래 Act 조치로 전량 해소함 (§5 참조).

---

## 3. Gap 목록 및 Act 조치 결과

| # | 심각도 | 갭 | Act 조치 | 상태 |
|---|:------:|-----|----------|:----:|
| 1 | 🔴 | 패키징 방식이 설계 §5.1(mimetype STORED+첫 항목)과 불일치 — 구현은 version.xml 첫 항목 + 전 엔트리 DEFLATED | **설계가 오류**: Do 단계에서 한글 원본 hwpx를 실측한 결과 전 엔트리 DEFLATED·version.xml 우선이 원본과 동일. 설계 §5.1을 실측 기반으로 정정 (v0.3) | ✅ 해소 |
| 2 | 🟡 | 성공 시 완료 토스트 없음, 오류 피드백이 alert | 프로젝트에 토스트 시스템이 없고 기존 `downloadHWPX`도 alert 패턴. 브라우저 다운로드 UI가 성공 피드백. 설계 §6.2/§7을 alert 기반으로 정정 (v0.3) | ✅ 해소 |
| 3 | 🟡 | 회의일지 참석자 0명 시 버튼 비활성 미구현 | 기존 HTML "문서 생성" 버튼도 0명 허용(서명란 수기 기입 용도) — 일관성을 위해 허용으로 설계 정정 (v0.3) | ✅ 해소 |
| 4 | 🟢 | 수령자 프로필 미등록 시 전용 경고 없음 | **코드 수정**: 미리보기 모달에 프로필 미등록 경고 배지 + "수급자 관리로 이동" 버튼 추가 (`index.html` 미리보기 모달) | ✅ 해소 |
| 5 | 🟢 | 다건 zip 서버 Content-Disposition에 날짜 누락 | 클라이언트 `a.download`가 날짜 포함명으로 override — 실제 파일명 정상. 설계 §4.3에 역할 분담 명시 (v0.3) | ✅ 해소 |
| 6 | 🟢 | 템플릿 무결성 검증이 기동 시가 아닌 요청 시(lazy) | 서버리스 콜드스타트 특성상 lazy가 합리적. 설계 §5를 정정 (v0.3) | ✅ 해소 |
| 7 | 🟢 | (표기) 파일명 날짜가 YYYY-MM-DD 고정 | 설계 허용 범위(`YYYY-MM(-DD)`) 이내 — 조치 불요 | ✅ 해당없음 |

**Act 후 유효 Match Rate: 100%** (코드 수정 1건 + 설계 동기화 5건, 설계 v0.3에 반영)

---

## 4. 코드 품질 및 보안 관찰 (gap-detector)

### 4.1 보안

| 항목 | 상태 |
|------|------|
| XML 인젝션 | ✅ 차단 — 전 field 값 `escape_xml()` |
| 경로 탐색 | ✅ 차단 — 템플릿 화이트리스트 + filename 정제(`/ \ ..` 제거) |
| DoS | ✅ 제한 — documents 100건 / 본문 2MB 상한 |
| 인증 | ✅ 설계 명시대로 anon (기존 `/api/hwpx`와 동일 정책) |

### 4.2 설계 초과 하드닝 (구현이 추가한 견고성)

- `fill_section`의 field 키 화이트리스트(`[a-z0-9_]+` fullmatch) — 비정상 키 무시
- 다건 zip 내 중복 파일명 자동 dedup (`(2)`, `(3)` 접미)
- `escape_xml`의 작은따옴표 미이스케이프는 값이 엘리먼트 텍스트에만 삽입되므로 문제 없음 (검토 완료)

### 4.3 잔여 리스크

- **한글 실물 개봉 확인**: 검증 샘플 3종을 한글(Hancom Office)에서 열어 레이아웃 확인 필요 — Do 단계에서 샘플을 열어 둔 상태이며 사용자 육안 확인 대기. 패키징이 원본 실측과 동일하므로 리스크 낮음
- **배포 후 통합 테스트**: `/api/hwpx-fill`은 아직 미배포 — 배포 후 버튼 3곳 실제 흐름 확인 필요

---

## 5. 검증 방법 및 결과 (Do 단계 수행분)

| 검증 | 방법 | 결과 |
|------|------|:----:|
| Placeholder 수량 (48/4/11) | 전처리 스크립트 출력 + grep | ✅ |
| XML well-formed (전처리 산출물·생성 문서) | xmllint | ✅ |
| 특수문자 이스케이프 (`& < > "`) | 엔진 직접 호출 | ✅ |
| 부분 필드 소거 (홀수 영수증빙 → `{{`잔존 없음) | 〃 | ✅ |
| zip 엔트리 순서 = 한글 원본 | zipfile 비교 | ✅ |
| filename 정제 | 단위 케이스 3종 | ✅ |
| Babel 파싱·렌더링 (화이트 스크린 없음) | Playwright 스모크 | ✅ |
| 한글 실물 개봉·레이아웃 | 샘플 3종 한글에서 열기 | 🔄 사용자 육안 확인 대기 |

---

## 6. Recommended Actions

### 6.1 완료됨 (본 Check-Act 사이클)

| 항목 | 조치 |
|------|------|
| 수령자 프로필 경고 | index.html 미리보기 모달에 경고+이동 버튼 추가 |
| 설계 문서 드리프트 5건 | design.md v0.3으로 동기화 |

### 6.2 후속 (배포 시)

| 항목 | 비고 |
|------|------|
| 한글 실물 육안 확인 | 열려 있는 검증샘플 3종 |
| 배포 후 3개 진입점 실제 흐름 테스트 | `/deploy` 후 |

---

## 7. Next Steps

- [x] Gap 조치 (코드 1건 + 설계 동기화 5건)
- [ ] 한글 실물 육안 확인 (사용자)
- [ ] `/pdca report F-13-hwpx-template-report` — 완료 보고서 (필요 시 `/simplify` 선행)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-04 | Initial gap analysis (92% 가중) + Act 조치로 갭 전량 해소 | gap-detector + Claude Code |

# F-13-hwpx-template-report Planning Document

> **Summary**: `templates/` 폴더의 HWPX 서식(급여지급명세서·영수증빙·회의진행일지)을 템플릿으로 사용, DB 데이터를 자동 주입하여 정산 서식 문서를 일괄 생성

> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: 청년노동자인권센터 (with Claude Code)
> **Date**: 2026-07-04
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 아름다운재단 정산 시 급여지급명세서·영수증빙·회의진행일지 서식을 제출해야 하는데, 시스템에 이미 있는 데이터(집행내역·지급대상자·회의일정·참석자)를 매번 한글 문서에 수기로 옮겨 적어야 함. 기존 `api/hwpx.py`는 신규 문서 생성만 가능하고 기존 서식(병합 셀 포함) 채우기는 미지원 |
| **Solution** | `templates/` 서식 원본을 unzip → `section0.xml`의 placeholder 치환 → repackage 하는 서식 채우기 엔진을 서버리스 함수(`api/hwpx-fill.py`)로 구현. 프론트에서 대상 데이터(집행 건, 수령자, 회의)를 선택하면 서식이 자동 완성되고, 다건 선택 시 ZIP으로 일괄 다운로드 |
| **Function/UX Effect** | 정산 서식 작성이 "한글에서 수기 입력" → "웹에서 항목 선택 후 버튼 1회"로 단축. 월별 급여명세서 전 인원, 영수증빙 전체 집행 건을 한 번에 생성 |
| **Core Value** | 단일 사용자(대표 1인) 운영 환경에서 정산 문서 작업 시간을 건당 수 분 → 수 초로 절감하고, DB 원본 데이터 기준 생성으로 전기 오류(금액·날짜 불일치) 원천 차단 |

---

## 1. Overview

### 1.1 Purpose

아름다운재단 지원사업 정산에 필요한 3종 서식 문서를, 시스템 DB에 축적된 데이터를 근거로 자동 생성한다. 서식의 레이아웃(병합 셀, 도장란, 안내 문구)은 재단 제공 원본 그대로 유지하고 데이터 칸만 채운다.

### 1.2 Background

- 총 사업비 7천만원 집행 내역이 `bf.budget_executions`에, 인건비 수령자가 `bf.recipients`에, 회의 일정·참석자가 `bf.schedules`/`bf.participants`에 이미 관리되고 있음
- CLAUDE.md 명시: *"hwpx.py generates new HWPX from scratch... Foundation report auto-fill will require an unzip-replace-repackage approach"* — 본 기능이 바로 그 접근의 구현
- `templates/` 폴더에 재단 서식 원본 3종 확보 완료 (2026-07-04):
  - `[서식]_급여지급명세서.hwpx`
  - `[서식]_영수증빙.hwpx`
  - `[서식]_회의진행일지.hwpx`

### 1.3 Related Documents

- 서식 원본: `templates/*.hwpx`
- 기존 HWPX 생성기: `api/hwpx.py`, `api/hwpxskill_scripts/`
- 아카이브 참고: `docs/archive/2026-03/F-11-hwpx-export/` (신규 문서 생성 방식의 한계 분석)

---

## 2. Scope

### 2.1 In Scope

- [ ] **서식 채우기 엔진**: HWPX unzip → placeholder 치환 → repackage (lxml 기반, 서버리스)
- [ ] **급여지급명세서 생성**: 수령자(recipients) + 기간 선택 → 해당 기간 인건비 집행 건(지급일자·지원금/자부담 금액) + 기관정보(system_settings) 자동 주입
- [ ] **영수증빙 생성**: 집행 건(budget_executions) 다중 선택 → 영수번호 자동 부여, 지출일자·금액·내역 주입
- [ ] **회의진행일지 생성**: 기존 회의진행일지 입력 모달(집행 건에서 제목·일자 프리필) → 제목·일시·장소·내용 + 참석자 명단 주입 *(v0.2: 일정 선택 방식에서 기존 입력 모달 방식으로 변경)*
- [ ] **일괄 생성**: 다건 선택 시 서버에서 개별 hwpx 생성 후 ZIP 묶음 다운로드
- [ ] **생성 전 데이터 확인 UI**: 주입될 값 미리보기(테이블) 후 생성 실행
- [ ] **placeholder 템플릿 전처리**: 원본 서식의 `section0.xml`에 `{{key}}` placeholder를 삽입한 사본을 `api/hwpxfill_templates/`에 배치 (원본 `templates/`는 무수정 보존)

### 2.2 Out of Scope

- 서식 레이아웃 편집 기능 (서식 변경은 재단 원본 교체로 대응)
- PDF 변환 (한글 프로그램에서 열어 인쇄/변환)
- 지급내역 행 무제한 동적 추가 — 서식 고정 격자 행 수를 초과하는 건은 문서 분할 생성으로 대응
- 도장/서명 이미지 삽입 (출력 후 날인)
- 기존 `api/hwpx.py`(신규 문서 생성) 및 뉴스레터 기능 변경

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | HWPX 서식 채우기 엔진: 템플릿 unzip → `{{key}}` placeholder 치환(XML escape 필수) → repackage 후 유효한 .hwpx 반환 | High | Pending |
| FR-02 | 급여지급명세서: 수령자·기간 선택 시 성명/생년월일/주소 + 지급일자·지급액(지원금/자부담)·합계 + 기관명/사업자등록번호/대표자명/기관주소 자동 주입 | High | Pending |
| FR-03 | 영수증빙: 선택한 집행 건마다 영수번호 자동 부여(연번), 지출일자·금액·지출사유 주입. approved/executed/completed 상태만 대상 | High | Pending |
| FR-04 | 회의진행일지: 기존 입력 모달의 폼 값(회의제목·일시·장소·내용·참석자 명단)을 서식에 주입 | High | Pending |
| FR-05 | 일괄 생성: 다건 선택 → 개별 hwpx 생성 → ZIP 묶음 응답(파일명: `서식명_대상_날짜.hwpx`) | Medium | Pending |
| FR-06 | 생성 전 미리보기: 주입될 데이터를 테이블로 표시, 사용자가 확인 후 생성 | Medium | Pending |
| FR-07 | 기관정보 미설정 시 안내: `system_settings`의 `org_*` 값이 비어 있으면 관리자 페이지로 유도 | Low | Pending |
| FR-08 | 급여지급명세서 원천징수 연동: 기존 원천징수 규칙(125,000원 초과 시 8%+0.8%)과 일관된 금액 표기 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 무결성 | 생성된 hwpx가 한글(Hancom Office)에서 오류 없이 열리고 서식 레이아웃(병합 셀·테두리) 원본과 동일 | 한글 뷰어에서 실제 열기 + `api/hwpxskill_scripts/` 검증 헬퍼 |
| 성능 | 단건 생성 < 3s, 30건 일괄 ZIP < 25s (Vercel 30s 타임아웃 내) | 실측 |
| 보안 | 사용자 입력 XML 이스케이프(기존 `escape_xml` 재사용), 템플릿 경로 화이트리스트(임의 경로 접근 차단) | 코드 리뷰 |
| 호환성 | 프론트 추가 코드 최소화 (CLAUDE.md: 신규 보고서 로직은 `api/`에 배치) | index.html diff 크기 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 3종 서식 모두 실데이터로 생성 → 한글에서 정상 열림 확인
- [ ] 일괄 생성(ZIP) 동작 확인
- [ ] 기관정보·수령자·집행내역이 DB 값과 일치함을 표본 검증
- [ ] `vercel.json` 함수 설정 추가(타임아웃) 및 배포 확인
- [ ] CLAUDE.md 파일맵/아키텍처 섹션 갱신

### 4.2 Quality Criteria

- [ ] placeholder 누락 시 빈 문자열 처리(깨진 `{{key}}` 잔존 금지)
- [ ] 지급내역 행 초과 시 문서 분할이 정상 동작
- [ ] 금액 표기 `fmt()` 규칙(천단위 콤마)과 일치

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 병합 셀·복잡 서식이 치환 과정에서 깨짐 | High | Medium | 서식 XML 구조는 일절 수정하지 않고 텍스트 노드만 치환. placeholder 전처리 시 단일 `<hp:t>` run 안에 온전히 배치 |
| 지급내역·참석자 반복 행 수가 서식 고정 격자를 초과 | Medium | Medium | 서식의 고정 행 수 내 채우기 우선, 초과분은 2페이지째 문서로 분할 생성 (행 복제 대신 — XML id 충돌 회피) |
| Vercel 응답 크기/타임아웃(대량 일괄 생성) | Medium | Low | 서식당 ~17KB로 작음. 100건 초과 시 분할 요청을 프론트에서 순차 호출 후 클라이언트 JSZip 재조합 |
| `recipients.birth_date` 자유형식(850101, 1985-01-01 혼재) | Low | High | 표기 그대로 주입(서식 요구 포맷 자유) + 미리보기에서 사용자 확인 |
| 한글 편집기로 서식 재저장 시 placeholder run 분절 | Medium | Low | placeholder 사본은 XML 직접 편집으로만 관리, `templates/` 원본과 분리 보관 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | ☑ |
| **Enterprise** | Strict layer separation, DI | High-traffic systems | ☐ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 생성 위치 | 서버리스(`api/`) / 클라이언트(JSZip) | **서버리스 `api/hwpx-fill.py`** | CLAUDE.md 규칙(신규 보고서 로직은 api/), lxml 기반 안전한 XML 처리, 기존 `hwpxskill_scripts` 재사용 |
| 데이터 흐름 | 서버가 DB 직접 조회 / 프론트가 데이터 수집 후 POST | **프론트 수집 → POST** | Supabase 클라이언트·RLS·세션이 프론트에 이미 있음. 서버에 DB 자격증명 추가 불필요 |
| 치환 방식 | placeholder 문자열 치환 / XML 좌표 기반 주입 | **placeholder 치환** | 전처리 1회로 이후 유지보수 단순. 서식 교체 시 placeholder만 재삽입 |
| 템플릿 보관 | `templates/` 직접 사용 / 전처리 사본 별도 | **`api/hwpxfill_templates/` 사본** | 원본 무수정 보존, 서버리스 함수와 함께 배포됨 |
| 반복 데이터 | 행 동적 복제 / 고정 격자 채우기 + 문서 분할 | **고정 격자 + 분할** | XML id 충돌·서식 깨짐 위험 회피 |
| 일괄 다운로드 | 서버 ZIP / 클라이언트 JSZip | **서버 ZIP (Python zipfile)** | 단일 요청·단일 응답으로 단순. 초대량 시에만 클라이언트 조합 폴백 |
| UI 진입점 | 페이지별 분산 / 통합 탭 | **통합 "정산서식" UI + 컨텍스트 버튼** | 예산관리에 정산서식 생성 진입점(급여명세서·영수증빙), 일정관리 회의 상세에 회의일지 버튼 — 상세는 Design에서 확정 |

### 6.3 Clean Architecture Approach

```
Selected Level: Dynamic (기존 구조 유지)

api/
  hwpx-fill.py              # 신규: 서식 채우기 서버리스 함수 (POST /api/hwpx-fill)
  hwpxfill_templates/       # 신규: placeholder 전처리된 서식 사본 3종
    salary/    (급여지급명세서)
    receipt/   (영수증빙)
    minutes/   (회의진행일지)
  hwpxskill_scripts/        # 기존: 재사용 (repackage·검증 헬퍼)
index.html
  └─ 정산서식 생성 UI (데이터 선택·미리보기·다운로드 호출만 — 로직 최소화)
templates/                  # 재단 서식 원본 (무수정 보존, 배포 대상 아님)
```

**API 계약 (초안)**:
```json
POST /api/hwpx-fill
{
  "template": "salary | receipt | minutes",
  "documents": [
    { "filename": "급여지급명세서_홍길동_2026-06.hwpx",
      "fields": { "name": "홍길동", "birth_date": "…", "rows": [ … ] } }
  ]
}
→ 1건: .hwpx 바이너리 / 다건: .zip 바이너리
```

### 데이터 매핑 (서식 → DB)

| 서식 | 서식 필드 | 데이터 소스 |
|------|----------|------------|
| 급여지급명세서 | 성명·생년월일·주소 | `bf.recipients` |
| | 기관명·사업자등록번호·대표자명·기관주소 | `bf.system_settings` (`org_*`) |
| | 지급일자·지급액(지원금/자부담)·합계 | `bf.budget_executions` (인건비, recipient 매칭) |
| 영수증빙 | 영수번호 | 자동 연번 부여 |
| | 지출일자·금액·지출사유 | `bf.budget_executions` (`execution_date`, `amount`, `description`) |
| 회의진행일지 | 회의제목·일시·장소·내용 | 회의진행일지 입력 모달 폼 (집행 건에서 프리필) |
| | 참석자 명단 | 입력 모달 폼 (한 줄당 1명) |

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [ ] `docs/01-plan/conventions.md` exists
- [ ] ESLint / Prettier / TypeScript — 해당 없음 (no-build SPA + Python 서버리스)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Placeholder 네이밍** | 없음 | `{{snake_case}}`, 반복 행은 `{{row1_date}}` 식 인덱스 접미 | High |
| **파일명 규칙** | 없음 | `서식명_대상_YYYY-MM(-DD).hwpx` | Medium |
| **금액 표기** | `fmt(n)` 존재 | 서버 측 동일 규칙(천단위 콤마) 적용 | Medium |
| **에러 응답** | `api/hwpx.py` 패턴 존재 | 동일 JSON 에러 포맷 재사용 | Low |

### 7.3 Environment Variables Needed

없음 — 프론트가 데이터를 수집해 전달하므로 서버리스 함수에 신규 자격증명 불필요.

### 7.4 Pipeline Integration

해당 없음 (기존 운영 중인 시스템에 기능 추가).

---

## 8. Next Steps

1. [ ] `/pdca design F-13-hwpx-template-report` — 설계 문서 작성
   - placeholder 목록 확정 (서식 3종 XML 분석 기반)
   - 급여지급명세서 지급내역 격자 행 수 실측 및 분할 기준 확정
   - UI 진입점·미리보기 화면 설계
2. [ ] 서식 전처리: `api/hwpxfill_templates/` placeholder 사본 생성
3. [ ] 구현 → `/pdca analyze` Gap 분석

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-04 | Initial draft | Claude Code |
| 0.2 | 2026-07-04 | 회의진행일지 데이터 소스를 일정 선택에서 기존 입력 모달로 변경 (Do 단계 확정) | Claude Code |

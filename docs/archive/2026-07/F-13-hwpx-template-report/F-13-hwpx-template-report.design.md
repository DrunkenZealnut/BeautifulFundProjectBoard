# F-13-hwpx-template-report Design Document

> **Summary**: HWPX 서식 3종(급여지급명세서·영수증빙·회의진행일지)에 placeholder를 전처리하고, 서버리스 채우기 엔진(`api/hwpx-fill.py`)이 DB 데이터를 주입해 정산 서식을 일괄 생성하는 기능의 상세 설계
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Author**: 청년노동자인권센터 (with Claude Code)
> **Date**: 2026-07-04
> **Status**: Draft
> **Planning Doc**: [F-13-hwpx-template-report.plan.md](../../01-plan/features/F-13-hwpx-template-report.plan.md)

---

## 1. Overview

### 1.1 Design Goals

- 재단 서식 원본의 레이아웃(병합 셀·테두리·스타일)을 **바이트 수준으로 보존**하면서 텍스트 칸만 채운다
- 서버는 도메인 로직 없이 **"placeholder 치환 + 패키징"만** 수행 — 데이터 수집·포맷·분할은 프론트가 담당 (기존 `generateSalaryStatementHTML` 등의 매핑 로직 재사용)
- `index.html` 증가 최소화: 프론트 추가분은 fields 빌더 3개 + 미리보기 모달 + 버튼 3곳

### 1.2 Design Principles

- **원본 불변**: `templates/*.hwpx`는 수정하지 않음. placeholder 사본은 `api/hwpxfill_templates/`에 별도 보관
- **XML 구조 불변**: 치환은 `<hp:t>` 텍스트 노드 내부 문자열만 변경. 노드 추가/삭제/복제 없음
- **잔존 placeholder 금지**: 값이 없는 키는 빈 문자열로 소거
- **기존 패턴 재사용**: `api/hwpx.py`의 handler 구조(CORS, URL-encoded filename, 에러 JSON), 프론트의 `downloadHWPX` 호출 패턴

---

## 2. Architecture

### 2.1 Component Diagram

```
┌──────────────────────── index.html ────────────────────────┐
│  [집행 상세]        [집행 목록]         [회의 일정 상세]      │
│  급여명세서 HWPX     영수증빙 HWPX        회의일지 HWPX        │
│       │                  │                   │              │
│  buildSalaryFields  buildReceiptFields  buildMinutesFields  │
│       └──────────────────┼───────────────────┘              │
│              HwpxFill 미리보기 모달 (데이터 확인·건 선택)      │
└──────────────────────────┼──────────────────────────────────┘
                POST /api/hwpx-fill  { template, documents[] }
┌──────────────────────────▼──────────────────────────────────┐
│  api/hwpx-fill.py (Vercel Python, lxml 불필요 — 문자열 치환)  │
│   1. api/hwpxfill_templates/{template}/ 로드                │
│   2. 문서별 section0.xml placeholder 치환 (XML escape)       │
│   3. zip 패키징(hwpx) → 1건: .hwpx / 다건: .zip 응답          │
└─────────────────────────────────────────────────────────────┘
```

Supabase 조회는 프론트 기존 로직(`recipients`, `budgetExecutions`, `schedules`, `participants`, `orgSettings`)을 그대로 사용한다. 서버는 DB에 접근하지 않는다.

### 2.2 Data Flow

```
사용자 버튼 클릭
→ 프론트: 대상 데이터 수집 (기존 state) → fields 맵 생성 (포맷·분할 포함)
→ 미리보기 모달: 주입될 값 테이블 표시, 사용자 확인
→ POST /api/hwpx-fill
→ 서버: 템플릿 로드 → 치환 → 패키징
→ 프론트: blob 다운로드 (기존 downloadHWPX 패턴)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `api/hwpx-fill.py` | `api/hwpxfill_templates/` | placeholder 전처리된 서식 3종 |
| `api/hwpx-fill.py` | Python stdlib (`zipfile`, `json`, `re`) | 패키징·치환 (lxml 불필요) |
| fields 빌더 (프론트) | `recipients`, `orgSettings`, `data.budgetExecutions`, `schedules`+`participants` | 기존 state 재사용 |
| fields 빌더 (프론트) | `fmt()`, `formatLocalDate()` | 금액·날짜 포맷 |

---

## 3. 서식 분석 및 Placeholder 명세

> 전처리: 아래 셀 좌표(rN cM = rowAddr/colAddr)의 빈 `<hp:t>` 노드에 placeholder 텍스트를 삽입한 사본을 만든다. placeholder는 반드시 **단일 `<hp:t>` run 안에 온전히** 위치해야 한다 (한글 편집기 재저장 금지, XML 직접 편집만).

### 3.1 급여지급명세서 (`salary`) — 표 22행×8열 1개

| 셀 좌표 | 원본 내용 | Placeholder | 데이터 소스 |
|---------|----------|-------------|------------|
| r2c1 | (빈칸) | `{{r_name}}` | `recipients.name` |
| r2c5 | (빈칸) | `{{r_birth}}` | `recipients.birth_date` (원문 그대로) |
| r3c1 | (빈칸) | `{{r_addr}}` | `recipients.address` |
| r5c1 | (빈칸) | `{{org_name}}` | `orgSettings.org_name` |
| r5c5 | ※ 안내문 | `{{org_regno}}` | `orgSettings.org_registration_number` (없으면 빈칸) |
| r6c1 | (빈칸) | `{{org_rep}}` | `orgSettings.org_representative` |
| r6c5 | ※ 안내문 | `{{org_rep_birth}}` | 고유번호 있으면 생략(빈칸) — 기본 빈 값 |
| r7c1 | (빈칸) | `{{org_addr}}` | `orgSettings.org_address` |
| r12~r17 c0/c1/c2 (좌측 6행) | (빈칸) | `{{pay1_date}}`/`{{pay1_fund}}`/`{{pay1_self}}` ~ `{{pay6_*}}` | 인건비 집행 건 1~6 |
| r12~r17 c3/c5/c7 (우측 6행) | (빈칸) | `{{pay7_date}}`/`{{pay7_fund}}`/`{{pay7_self}}` ~ `{{pay12_*}}` | 인건비 집행 건 7~12 |
| r19c3 | (빈칸) | `{{total_fund}}` | 지원금 합계 (`fmt()`) |
| r19c6 | (빈칸) | `{{total_self}}` | 자부담 합계 |
| r21c0 문단 "년  월  일" | 텍스트 교체 | `{{issue_date}}` | 발급일 `YYYY년 MM월 DD일` |
| r21c0 문단 "단체(기관)명" | 텍스트 교체 | `{{org_name_footer}}` | `orgSettings.org_name` + " (단체직인 또는 대표자 서명)" 유지 |

- **격자 한도 12건**: 인건비 집행 건이 12건 초과 시 프론트가 12건 단위로 `documents[]` 항목을 분할 생성
- 지원금/자부담 구분: 현 시스템은 전액 지원금 집행이므로 `pay*_fund`에 금액, `pay*_self`는 빈칸 (자부담 도입 시 확장)
- 금액 표기는 `fmt()` (천단위 콤마), 지급일자는 `YYYY-MM-DD`

### 3.2 영수증빙 (`receipt`) — 1행×4열 표 2개 (페이지당 2건)

| 위치 | 원본 내용 | Placeholder | 데이터 소스 |
|------|----------|-------------|------------|
| 표1 r0c1 | `1` | `{{no1}}` | 영수번호 (연번, 프론트 부여) |
| 표1 r0c3 | (빈칸) | `{{reason1}}` | 집행 건 요약 |
| 표2 r0c1 | ` 2` | `{{no2}}` | 영수번호 |
| 표2 r0c3 | (빈칸) | `{{reason2}}` | 집행 건 요약 |

- `reason` 포맷: `{execution_date} · {budget_item_name} · {description} · {fmt(amount)}원 ({payment_method})`
- **문서당 2건**: 선택 건이 3건 이상이면 2건 단위로 문서 분할 (마지막 홀수 건은 `no2`/`reason2` 빈칸)
- 영수번호는 선택 목록 순서대로 1부터 연번. 시작 번호는 미리보기 모달에서 조정 가능 (기존 제출분 이후 이어서 부여하는 경우)
- 대상: `status IN (approved, executed, completed)` 집행 건만

### 3.3 회의진행일지 (`minutes`) — 표 11행×3열 1개

| 셀 좌표 | 원본 내용 | Placeholder | 데이터 소스 |
|---------|----------|-------------|------------|
| r0c1 | (빈칸) | `{{m_title}}` | `schedules.title` |
| r1c1 | (빈칸) | `{{m_datetime}}` | `start_date` + `start_time`~`end_time` 조합 |
| r2c1 | (빈칸) | `{{m_place}}` | `schedules.location` |
| r3c1 | (빈칸) | `{{m_content}}` | `schedules.description` |
| r5~r10 c1 (6행) | (빈칸) | `{{att1}}` ~ `{{att6}}` | 회의진행일지 입력 폼 참석자 명단 (한 줄당 1명) |
| 서명칸 r5~r10 c2 | (빈칸) | 치환 없음 (수기 서명) | — |
| 표 밖 하단 문단 "단체명(클릭시 입력가능)" | 텍스트 교체 | `{{org_name_footer}}` | `orgSettings.org_name` |

- **참석자 한도 6명**: 초과 시 문서 분할(2번째 문서는 회의정보 동일 + 명단 7~12번째)
- **데이터 소스 (v0.2 확정)**: 기존 회의진행일지 입력 모달(`meetingMinutesForm`)을 그대로 사용. 집행 건에서 제목·일자가 프리필되고 사용자가 장소·내용·참석자를 입력 — 이 폼 자체가 미리보기(FR-06) 역할을 수행하므로 별도 미리보기 모달을 거치지 않고 즉시 다운로드

---

## 4. API Specification

### 4.1 Endpoint

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/hwpx-fill` | 서식 채우기 및 hwpx/zip 반환 | 없음 (anon — 기존 `/api/hwpx`와 동일 정책) |
| OPTIONS | `/api/hwpx-fill` | CORS preflight | — |

### 4.2 Request

```json
{
  "template": "salary",           // "salary" | "receipt" | "minutes" (화이트리스트)
  "documents": [
    {
      "filename": "급여지급명세서_홍길동_2026-06.hwpx",
      "fields": {
        "r_name": "홍길동",
        "r_birth": "850101",
        "pay1_date": "2026-06-25",
        "pay1_fund": "500,000",
        "total_fund": "500,000",
        "issue_date": "2026년 07월 04일",
        "org_name_footer": "청년노동자인권센터"
      }
    }
  ]
}
```

- `fields`: flat map (placeholder key → string). 서버는 템플릿의 **전체 placeholder 키 목록**을 순회하며 요청에 없는 키는 `""`로 치환
- `filename`: 프론트가 생성. 규칙: `서식명_대상_YYYY-MM(-DD)[_N].hwpx` (분할 시 `_1`, `_2` 접미)

### 4.3 Response

| 상황 | Content-Type | Content-Disposition |
|------|--------------|---------------------|
| documents 1건 | `application/octet-stream` | `filename*=UTF-8''{URL-encoded .hwpx}` |
| documents 2건 이상 | `application/zip` | `filename*=UTF-8''{서식명}_일괄.zip` (날짜는 클라이언트 `a.download`에서 `{서식명}_일괄_{날짜}.zip`으로 부여) |

- zip 내 중복 파일명은 서버가 `(2)`, `(3)` 접미로 자동 dedup

### 4.4 Error Responses

```json
{ "error": "메시지" }
```

| 상태 | 원인 |
|------|------|
| 400 | `template` 화이트리스트 외 값, `documents` 비어있음/누락, 100건 초과 |
| 500 | 템플릿 파일 누락, 패키징 실패 (원인 메시지 포함) |

---

## 5. 서버 구현 설계 (`api/hwpx-fill.py`)

### 5.1 채우기 엔진 알고리즘

```python
PLACEHOLDER_RE = re.compile(r'\{\{[a-z0-9_]+\}\}')
TEMPLATES = {'salary': '급여지급명세서', 'receipt': '영수증빙', 'minutes': '회의진행일지'}

def fill_document(template_dir, fields):
    xml = (template_dir / 'Contents' / 'section0.xml').read_text(encoding='utf-8')
    for key, value in fields.items():
        xml = xml.replace('{{%s}}' % key, escape_xml(value))   # api/hwpx.py의 escape_xml 재사용
    xml = PLACEHOLDER_RE.sub('', xml)                          # 잔존 placeholder 소거
    return xml

def package_hwpx(template_dir, filled_section_xml) -> bytes:
    # template_dir의 모든 파일을 zip으로 복사하되 Contents/section0.xml만 치환본으로 교체
    # 엔트리 순서·압축: 한글(Hancom) 원본 실측과 동일하게 재현 (v0.3 확정)
    #   ENTRY_ORDER = version.xml → mimetype → META-INF/container.xml → settings.xml
    #                 → Contents/section0.xml → header.xml → content.hpf → META-INF/manifest.xml
    #   전 엔트리 ZIP_DEFLATED (mimetype 포함 — 원본 실측 결과 STORED 아님)
```

- 다건이면 `zipfile`로 개별 hwpx bytes를 다시 zip에 수록
- 템플릿 무결성: 요청 시 요청된 템플릿의 section0.xml 존재 검증(FileNotFoundError → 500 + 전처리 안내 메시지) — 서버리스 콜드스타트 특성상 기동 시 검사 대신 lazy 검증 (v0.3 확정)
- field 키 화이트리스트: `[a-z0-9_]+` fullmatch 검증으로 비정상 키 무시 (하드닝)

### 5.2 파일 구조

```
api/
  hwpx-fill.py                      # 신규 서버리스 함수 (~150줄 예상)
  hwpxfill_templates/               # 신규: placeholder 전처리 사본 (디렉터리 형태로 커밋 — diff 리뷰 가능)
    salary/   {mimetype, version.xml, META-INF/, Contents/{content.hpf, header.xml, section0.xml}}
    receipt/  {동일 구조}
    minutes/  {동일 구조}
scripts/ (또는 일회성)
  preprocess_templates.py           # templates/*.hwpx → 좌표 기반 placeholder 삽입 → hwpxfill_templates/ 생성 (1회 실행 후 커밋)
```

### 5.3 전처리 스크립트 규칙

- `templates/*.hwpx` unzip → §3의 셀 좌표에 따라 대상 `<hp:tc>` 내부의 빈 `<hp:t></hp:t>`(없으면 run 내 `<hp:t>` 추가가 아니라 기존 빈 run의 t 노드에 삽입)에 placeholder 기입
- 원본에 이미 텍스트가 있는 셀(r5c5 안내문, 영수번호 "1"/" 2", 하단 증명 문단)은 해당 텍스트를 placeholder로 **교체**
- 산출물을 한글 편집기로 열어 저장하지 않는다 (run 분절 방지)
- `vercel.json`의 함수 글롭이 `api/*.py`를 포함하는지 확인하고 `hwpx-fill.py`에 timeout 30s 지정

---

## 6. UI/UX Design

### 6.1 진입점 3곳

| 위치 | 버튼 | 동작 |
|------|------|------|
| 예산관리 > 집행 상세 (기존 "급여지급명세서" HTML/PDF 버튼 옆) | `📝 HWPX` | 해당 수령자의 운영인건비 집행 건 수집(기존 `generateSalaryStatementHTML`과 동일 필터·중복제거·정렬) → 미리보기 모달 |
| 예산관리 > 집행 목록 대량 작업 바 (기존 체크박스 선택 `selectedExecIds` 재사용) | `🧾 영수증빙 HWPX` | 선택 건 중 approved/executed/completed만 필터 → 미리보기 모달(시작 영수번호 입력 가능) |
| 예산관리 > 집행 상세의 기존 회의진행일지 입력 모달 푸터 (사업인건비·사업회의비·교육훈련비) | `📝 HWPX 다운로드` | 입력 폼 값으로 즉시 생성·다운로드 (폼이 미리보기 역할) |

> v0.2 변경: 회의일지 진입점을 "일정관리 > 회의 일정 상세"에서 기존 회의진행일지 입력 모달로 확정.
> 이유: 회의진행일지는 지출 증빙 문서로서 집행 건 기반 생성이 기존 UX이며, 참석자 명단도 이 폼에서 관리됨.
> 영수증빙 건 선택은 집행 목록에 이미 존재하는 체크박스 선택을 재사용 (별도 선택 UI 불필요).

### 6.2 User Flow

```
버튼 클릭 → 미리보기 모달(주입 데이터 테이블, 분할 시 문서별 표시)
→ [생성 및 다운로드] → POST /api/hwpx-fill → blob 다운로드(브라우저 다운로드 UI가 성공 피드백) → 모달 닫힘
→ 기관정보 미설정 시: 모달 상단 경고 + "관리자 > 기관설정" 이동 버튼 (FR-07)
→ 수령자 프로필(생년월일·주소) 미등록 시: 경고 + "수급자 관리" 이동 버튼 (v0.3)
→ 오류 시: alert (기존 downloadHWPX와 동일 패턴 — 토스트 시스템 없음)
```

### 6.3 프론트 신규 코드 (index.html, `<script type="text/babel">` 내)

| 함수/state | 위치 | 책임 |
|-----------|------|------|
| `buildSalaryFillDocs(execution, allExecutions, orgSettings, recipientProfile)` | 유틸 영역 (openMeetingMinutes 인접) | 12건 분할 포함 documents[] 생성 |
| `buildReceiptFillDocs(executions, startNo)` | 〃 | 2건 단위 분할, 영수번호 연번 |
| `buildMinutesFillDocs(formData, orgSettings)` | 〃 | 6명 단위 분할 (입력 폼 데이터 기반) |
| `HWPX_FILL_LABELS` / `hwpxFillPreviewRows(fields)` / `hwpxFillDateStr()` | 〃 | 미리보기 라벨 매핑·행 축약(지급 일자+금액 결합), 파일명 날짜 (`formatLocalDate`는 컴포넌트 내부 함수라 모듈 레벨 자체 헬퍼 사용) |
| `HWPX_FILL_TEMPLATE_LABELS` + `downloadHwpxFill(template, documents)` | 기존 `downloadHWPX` 인접 | fetch + blob 다운로드 (1건 hwpx / 다건 zip 분기) |
| `hwpxFillPreview`·`receiptStartNo` state + 미리보기 모달 JSX | `ProjectManagementSystem` 내 (회의진행일지 모달 인접) | 미리보기 모달 — 영수증빙은 `execs`를 저장하고 렌더 시 `buildReceiptFillDocs` 재계산(시작번호 변경 반영). **render 내 hooks 사용 금지** 준수 |

---

## 7. Error Handling

| 상황 | 처리 |
|------|------|
| 기관정보(`org_*`) 미설정 | 미리보기 모달에 경고 배지 + 기관설정 이동 버튼, 생성은 허용(빈칸 출력) — FR-07 |
| 수령자 프로필 미등록 (recipients에 이름 매칭 실패) | 성명만 집행 건의 `recipient`로 채우고 생년월일/주소 빈칸 + 모달 경고 배지 + 수급자 관리 이동 버튼 |
| 영수증빙: 승인/집행/완료 건 미선택 | alert 안내 (해당 상태의 건 선택 요청) |
| 회의일지 참석자 0명 | 생성 허용 — 서명란 수기 기입 용도, 기존 HTML 문서 생성 버튼과 동일 정책 (v0.3 확정) |
| API 4xx/5xx | 기존 패턴대로 `alert(서버 error 메시지)` |
| fetch 네트워크 오류 | `alert('서식 생성 서버 연결 실패. 잠시 후 다시 시도해주세요.')` — 기존 downloadHWPX와 동일 패턴 |

---

## 8. Security Considerations

- [x] **XML 이스케이프**: 모든 field 값에 `escape_xml()` 적용 (XML 인젝션 차단)
- [x] **템플릿 화이트리스트**: `template ∉ {salary, receipt, minutes}` → 400 (경로 탐색 차단)
- [x] **filename 정제**: 서버에서 `/`, `\`, `..` 제거 후 zip 엔트리명으로 사용
- [x] **요청 상한**: documents 100건, 요청 본문 2MB 초과 시 400
- [ ] Rate Limiting — Vercel 기본에 위임 (단일 사용자 시스템)

---

## 9. Test Plan

프로젝트에 테스트 러너가 없으므로 (CLAUDE.md) 스크립트 검증 + 실물 확인으로 대체한다.

### 9.1 검증 방법

| Type | Target | 방법 |
|------|--------|------|
| 엔진 단위 | 치환·소거·escape | 로컬 `python3 -c` 스니펫으로 fill_document 직접 호출, `{{` 잔존 여부 grep |
| 무결성 | 생성 hwpx | `api/hwpxskill_scripts/` 검증 헬퍼 + 한글(Hancom Office)에서 실제 열기 |
| 통합 | /api/hwpx-fill | `vercel dev` 또는 배포 후 curl로 3종 각 1건·다건 zip 확인 |

### 9.2 Test Cases (Key)

- [ ] Happy path: 3종 각 1건 생성 → 한글에서 열림, 병합 셀 레이아웃 원본과 동일
- [ ] 일괄: 영수증빙 5건 선택 → 3문서 zip (2+2+1, 마지막 문서 2번 칸 빈칸)
- [ ] 분할: 인건비 13건 → 급여명세서 2문서, 합계는 문서별 부분합
- [ ] 특수문자: 지출사유에 `& < > "` 포함 → 문서 정상, XML 유효
- [ ] 누락 필드: org_regno 미설정 → 해당 칸 빈칸, `{{org_regno}}` 잔존 없음
- [ ] 오류: template="base" → 400, documents=[] → 400

---

## 10. Coding Convention Reference

| Item | Convention Applied |
|------|-------------------|
| Placeholder | `{{snake_case}}`, 반복 칸은 `pay{N}_{field}` / `att{N}` / `no{N}` 인덱스 접미 |
| 파일명 | `서식명_대상_YYYY-MM(-DD)[_N].hwpx` |
| 커밋 | `feat: HWPX 서식 자동 채우기 (급여명세서·영수증빙·회의일지)` |
| 프론트 | 기존 유틸 인접 배치, render 함수 내 hooks 금지 (Babel standalone 제약) |
| Python | `api/hwpx.py` handler 패턴 (BaseHTTPRequestHandler, CORS 헤더, URL-encoded filename) |

---

## 11. Implementation Guide

### 11.1 Implementation Order

1. [ ] **전처리**: `scripts/preprocess_templates.py` 작성·실행 → `api/hwpxfill_templates/` 3종 커밋 (§3 좌표표 기준)
2. [ ] **서버**: `api/hwpx-fill.py` (fill 엔진 + 단건/zip 응답 + 에러 처리)
3. [ ] **배포 설정**: `vercel.json`에 hwpx-fill 함수 timeout 확인/추가
4. [ ] **프론트 빌더**: `buildSalaryFillDocs` / `buildReceiptFillDocs` / `buildMinutesFillDocs` + `downloadHwpxFill`
5. [ ] **프론트 UI**: 미리보기 모달 + 진입 버튼 3곳
6. [ ] **검증**: §9 테스트 케이스 수행, 한글 실물 확인
7. [ ] **문서**: CLAUDE.md 파일맵·아키텍처 갱신

### 11.2 예상 변경 파일

| 파일 | 변경 |
|------|------|
| `api/hwpx-fill.py` | 신규 (~150줄) |
| `api/hwpxfill_templates/{salary,receipt,minutes}/` | 신규 (전처리 사본) |
| `scripts/preprocess_templates.py` | 신규 (일회성, 재전처리 대비 커밋) |
| `index.html` | 빌더 3개 + 모달 + 버튼 3곳 (+300줄 내외 목표) |
| `vercel.json` | 함수 timeout 항목 |
| `CLAUDE.md` | 파일맵·API 표 갱신 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-04 | Initial draft — 서식 3종 XML 셀 좌표 실측 기반 placeholder 명세 확정 | Claude Code |
| 0.2 | 2026-07-04 | Do 단계 확정 반영: 회의일지 진입점을 기존 입력 모달로 변경, 영수증빙은 기존 체크박스 선택 재사용, 프론트 함수 목록 실제 구현과 동기화 | Claude Code |
| 0.3 | 2026-07-04 | Check 단계 Gap 분석 반영: 패키징 방식(전 엔트리 DEFLATED, 원본 실측) 확정, lazy 템플릿 검증, alert 기반 피드백, 참석자 0명 허용, 수령자 프로필 경고 추가 | Claude Code |

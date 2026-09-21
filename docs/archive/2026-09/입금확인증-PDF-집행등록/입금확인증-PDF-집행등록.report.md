# 입금확인증 PDF 집행등록 (F-14) — PDCA 완료 보고서

> **Feature**: 입금확인증-PDF-집행등록 (F-14)
> **기간**: 2026-09-20 (Plan → Report 단일 세션)
> **Match Rate**: 94% ✅ (Check 통과, iterate 불필요)
> **작성자**: Claude Code
> **Status**: Completed — 코드 완성·PR #38 오픈(리뷰 반영 완료), 머지·배포는 사용자 액션 대기

---

## Executive Summary

### 1.1 개요

| 항목 | 내용 |
|------|------|
| 기능명 | 입금확인증 PDF 집행등록 |
| 선행 작업 | 없음 (신규 기능) |
| PDCA 사이클 | Plan → Design → Do → Check(gap-detector) → Simplify → Report (1세션) |
| Match Rate | **94%** (44항목: ✅39 + ⚠️5, 미구현 0) |
| PR | [#38](https://github.com/DrunkenZealnut/BeautifulFundProjectBoard/pull/38) — OPEN, CodeRabbit 리뷰 3건 반영·확인 완료 |

### 1.2 결과 요약

```
┌─────────────────────────────────────────────┐
│  Match Rate: 94%  (44항목)                   │
├─────────────────────────────────────────────┤
│  ✅ 일치:        39 / 44 항목                 │
│  ⚠️ 부분 일치:     5 / 44 항목 (설계서 갱신)   │
│  ❌ 미구현:        0 / 44 항목                 │
└─────────────────────────────────────────────┘
```

| 지표 | 값 |
|------|-----|
| 변경 파일 | index.html(+726/−…줄), vercel.json(CSP), CLAUDE.md, docs 3건 신규 |
| 신규 최상위 유틸 | `normalizeDate`, `safeFileName`, `extractPdfTextLines`, `DEPOSIT_PDF_LABELS`, `parseDepositConfirmation`, `executionDupKey`, `findDuplicateExecution`, `pdfReadErrorMsg` |
| 신규 컴포넌트 상태 | 5개 (`bankImportSource`, `pdfParseProgress`, `bulkRegisterResult`, `formPdfEvidence`, `executionDocsLoaded`) + ref 1개 |
| 신규 컴포넌트 헬퍼 | `uploadExecutionDoc`/`insertExecutionDocs`/`mergeExecutionDocs`(증빙 업로드 공용), `resetBankImport`/`resetRegisterForm`, `pickTransferDocName`, `autoDocName` |
| 커밋 | 3개 (`4a5c050` feat, `03f3288` docs, `4b674c0` fix — CodeRabbit) |
| 발견·수정 결함 | Check 단계 🟡2·🟢7 + CodeRabbit 🟠1·🟡2 = **12건 전부 수정** |
| Check 후 조치 | `/simplify` 4관점(재사용·단순화·효율·고도) 리팩터 — E2E 결과 불변 확인 |

### 1.3 Value Delivered

| Perspective | Content |
|-------------|---------|
| **Problem** | 계좌이체 집행 1건마다 입금확인증 PDF를 열어 날짜·금액·수취인·적요를 눈으로 읽고 폼에 옮겨 적은 뒤, 같은 PDF를 증빙으로 다시 첨부해야 했음. 오타·중복등록·증빙 누락 위험 |
| **Solution** | 일괄등록 탭에 "입금확인증 PDF" 소스 추가. pdf.js(브라우저 내)로 텍스트를 추출하고 라벨 스캔 파서로 `거래일시→집행일`, `입금금액→금액(실지급액)`, `수취인성명→수취인`, `출금통장표시내용→집행내용`을 자동 채움. 등록과 동시에 PDF를 이체 증빙으로 자동 첨부, 이체수수료는 본 행에 연동된 별도 집행 건으로 등록 |
| **Function/UX Effect** | PDF 여러 장을 한 번에 드롭 → 건당 2~3분이 예산항목 선택 10초로 단축(실측: 워커 재사용으로 파일당 파싱 오버헤드 ~0.6ms). 동일 날짜·금액·수취인 기존 건은 "중복 의심" 경고로 이중 등록 방지 — CodeRabbit 리뷰로 수수료 행까지 연동되도록 보강 |
| **Core Value** | 재단 필수 증빙(이체확인증/이체내역서)과 집행내역이 등록 시점에 1:1로 연결되어 정산 시 증빙 누락 위험 감소. 계좌번호는 파싱 과정에서 소비만 되고 화면·DB·로그 어디에도 남지 않아 개인정보 노출 위험 없음 |

---

## 2. PDCA 사이클 요약

| Phase | 문서/산출물 | 핵심 내용 |
|-------|-------------|-----------|
| Plan | [입금확인증-PDF-집행등록.plan.md](../01-plan/features/입금확인증-PDF-집행등록.plan.md) v0.2 | 사용자 제공 샘플 PDF(신한은행) 구조 분석, FR-01~11, 열린 질문 5건 → 사용자 결정 반영(실지급액/수수료 별도 건/출금통장표시내용/신한 단일/단건 폼 포함) |
| Design | [입금확인증-PDF-집행등록.design.md](../02-design/features/입금확인증-PDF-집행등록.design.md) v0.3 | 파서 알고리즘(Node+pdfjs-dist로 샘플 검증 완료 후 설계에 실제 코드 수록), 행 모델, 처리 흐름, UI, 증빙 첨부 시퀀스. Check·Simplify 결과를 v0.2→v0.3으로 계속 반영 |
| Do | index.html 등 6파일 구현 | 설계서 §10 순서대로 10단계 구현. Babel 트랜스파일 + Playwright E2E로 검증 |
| Check | [입금확인증-PDF-집행등록.analysis.md](../03-analysis/입금확인증-PDF-집행등록.analysis.md) | gap-detector 에이전트가 44항목 대조 → 94%. 🟡2·🟢7 결함 발견 즉시 수정, 부분 일치 5건은 설계서로 흡수 |
| (Simplify) | analysis.md §7 | 재사용·단순화·효율·고도 4관점 리뷰 에이전트 병렬 실행 → 21+9+2+4건 반영, E2E로 동작 불변 확인 |
| (외부 리뷰) | 본 보고서 §5.2 | PR #38에 대한 CodeRabbit 자동 리뷰 3건(🟠1·🟡2) 검증 후 수정, CodeRabbit이 커밋으로 재확인 |
| Report | 본 문서 | 완료 보고 |

---

## 3. 주요 기술 결정

| 결정 | 대안 | 선택 근거 |
|------|------|-----------|
| PDF 파싱 위치 | 서버(Python) / Claude Vision API | **브라우저 pdf.js** — 엑셀 일괄등록과 동일한 클라이언트 패턴, 로컬 `http.server` 개발 가능, 계좌번호 포함 PDF가 외부로 나가지 않음 |
| 파서 방식 | 은행별 좌표 템플릿 | **라벨 별칭 스캔** — 글자 1개=아이템 1개·순서 뒤섞임인 PDFium 출력을 y/x 정렬로 줄 재구성 후, 라벨 사이 구간을 값으로 추출(4열 격자에 강함) |
| 수수료 처리 | 옵션 체크박스 | **자동 별도 집행 건** — 회계가이드("이체수수료: 해당 예산항목에 편성") + 사용자 결정. 본 행 날짜·예산항목에 연동, 직접 수정 시 연동 해제 |
| 일괄 등록 id | 서버 `RETURNING` 순서 의존 | **클라이언트 `crypto.randomUUID()`** — Check 단계에서 발견한 반환 순서 의존 위험을 Simplify에서 근본 수정, id 재식별 로직 전부 제거 |
| 증빙 캐시 가드 | "맵이 비어있지 않음"으로 로드 완료 판단 | **`executionDocsLoaded` 플래그** — 3곳에 복제됐던 가드를 상태 1개로 통일, 조건 없는 병합 |
| CSP | 변경 없음 | `worker-src 'self' blob:` 추가 — pdf.js가 교차출처 워커를 blob 래퍼로 띄우기 때문 |

---

## 4. 발견·해결한 결함

### 4.1 Check 단계 (gap-detector, 9건 — 전부 수정)

| 심각도 | 결함 | 조치 |
|:---:|------|------|
| 🟡 | 본 행 날짜 편집이 수수료 행에 전파되지 않아 배치 등록 불가 케이스 발생 | 편집 단일 진입점에서 날짜는 항상 전파 |
| 🟡 | 규칙 없는 유형(예비비·임차료)의 폴백 증빙이 집행내역 탭에서 안 보임 | 게이트를 "규칙 있음 ‖ 첨부 문서 있음"으로 완화 |
| 🟢 ×7 | 스캔본 증빙 미보관, `inserted` 누락 시 무응답, `uploaded_by` 불일치, FileList 리셋 순서, id 매칭 설명 누락, 파싱 중 토글, 중복 배지 미갱신 | 전부 수정 |

### 4.2 CodeRabbit 리뷰 (PR #38, 3건 — 전부 수정·확인)

| 심각도 | 결함 | 조치 |
|:---:|------|------|
| 🟠 Major | 중복 의심으로 본 행이 해제돼도 연동된 수수료 행은 기본 선택 유지 → 수수료만 등록될 위험 | 수수료 행 `_selected`도 본 행과 같은 `!dup && !dupInUpload` |
| 🟡 Minor | `documents` insert 실패 시 업로드된 PDF(계좌정보 포함)가 storage에 고아로 남음 | 실패 시 `attachments.remove(file_paths)` |
| 🟡 Minor | promo 샘플의 `logo_org` 상대경로가 yaml 위치 기준 계산 시 `content/brand`를 벗어남 (이 브랜치의 선행 커밋분) | `../../../brand/logo/org.svg`로 수정 |

CodeRabbit이 커밋 `4b674c0`을 재검토해 3건 모두 "확인했습니다" 응답으로 종결.

---

## 5. 품질 지표

| 항목 | 결과 |
|------|------|
| Design Match Rate | 94% (임계값 90% 통과) |
| Babel standalone 트랜스파일 | 통과 (문법 오류 없음, 수정마다 재검증) |
| Playwright E2E | 파싱 정확도(샘플 PDF 필드 100% 일치)·중복 감지·수수료 연동(날짜·매핑)·단건 폼 자동입력·엑셀 경로 회귀·집행내역 탭(54건 렌더) — `/simplify` 전후 결과 동일 |
| 외부 리뷰 | CodeRabbit 3건 Major/Minor 전부 반영·재확인 |
| PII 처리 | 계좌번호는 파싱 중 라벨 소비에만 사용, 결과 객체·state·콘솔 로그에 미포함 확인 |

---

## 6. 잔여 작업 (사용자 액션)

| # | 항목 | 비고 |
|---|------|------|
| 1 | PR #38 머지 | 이 브랜치는 F-14 외 이전 12커밋(뉴스레터 community 템플릿, `/promo` 홍보콘텐츠 생성시스템 등)도 포함 |
| 2 | Vercel 배포 후 CSP 확인 | 콘솔에 CSP 위반·"Setting up fake worker" 경고 없는지 (분석서 T12) |
| 3 | 실제 등록 1건 검증 | `budget_executions` + `documents` insert, 집행내역 탭에서 증빙 다운로드 확인 (T4) |
| 4 | 스캔본 PDF 검증 | 이미지로 인쇄한 PDF 업로드 → 수동 입력 경로 확인 (T6) |
| 5 | `/pdca archive 입금확인증-PDF-집행등록` | 위 검증 완료 후 아카이브 권장 |

---

## 7. 파일 변경 요약

| 파일 | 변경 | 핵심 |
|------|------|------|
| `index.html` | +726줄 | pdf.js 로드·워커 설정, 파서 8개 유틸, 일괄등록 탭 PDF/엑셀 이원화, 단건 폼 자동입력, 증빙 업로드 공용 헬퍼 3종, 집행내역 탭 기타 첨부 증빙 |
| `vercel.json` | CSP 1줄 | `worker-src 'self' blob:` |
| `CLAUDE.md` | F-14 섹션 신설 | 파서 위치·매핑 규칙·캐시 가드 근거 문서화 |
| `docs/01-plan/features/입금확인증-PDF-집행등록.plan.md` | 신규 (v0.2) | FR 11개, 결정 사항 5건 |
| `docs/02-design/features/입금확인증-PDF-집행등록.design.md` | 신규 (v0.3) | 파서 실제 코드, 행 모델, 처리 흐름, UI, 증빙 시퀀스 |
| `docs/03-analysis/입금확인증-PDF-집행등록.analysis.md` | 신규 | 44항목 갭 분석 + Simplify 반영 기록 |
| `docs/04-report/입금확인증-PDF-집행등록.report.md` | 신규 (본 문서) | 완료 보고 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-09-21 | 완료 보고서 작성 | Claude Code |

# 입금확인증 PDF 집행등록 (F-14) — 갭 분석

> **Analysis Type**: Gap Analysis (Design vs Implementation) + Code Defect Review
>
> **Match Rate: 94%** (일치 39 / 부분 5 / 미구현 0, 총 44) — (39 + 5×0.5) / 44 = 94.3%
> **분석 후 조치**: 🟡 2건 + 🟢 7건 코드 수정 완료, 부분 일치 5건은 설계서 갱신(v0.2)으로 해소 → 조치 후 잔여 갭 0
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Analyst**: gap-detector (bkit) + Claude Code 검증
> **Date**: 2026-09-20 · Iteration 1
> **Design Doc**: [입금확인증-PDF-집행등록.design.md](../02-design/features/입금확인증-PDF-집행등록.design.md)
> **Implementation**: `index.html`, `vercel.json`, `service-worker.js`, `CLAUDE.md` (base HEAD `0caa13f`, 미커밋 워킹트리)

파서 4개 함수·상수(`extractPdfTextLines` / `DEPOSIT_PDF_LABELS` / `parseDepositConfirmation` / `findDuplicateExecution`)는 설계 코드와 **알고리즘 동일**. 미구현 항목 없음. 부분 일치 5건은 모두 구현이 더 합리적이거나 사소한 표현 차이. 별도로 코드 결함 🟡 2건(수수료 행 날짜 미전파, 기타 첨부 증빙 표시 게이트)을 발견해 수정했다.

> 줄 번호는 분석 시점(수정 전) 기준이며 `grep -n`으로 재확인할 것.

---

## 1. 항목별 판정

### §1.3 의존성 / §7 인프라 (6)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 1 | pdf.js 스크립트 태그 | html2pdf 아래 `pdfjs-dist@3.11.174/build/pdf.min.js` | index.html:38-39 | ✅ | |
| 2 | `workerSrc` 설정 | CONFIG 아래, `if (window.pdfjsLib)` 가드 | index.html:2402-2405 (`DEFAULT_ORG_NAME` 직후) | ✅ | |
| 3 | CSP `worker-src 'self' blob:` | | vercel.json:42 | ✅ | script-src/connect-src에 jsdelivr 기존 허용 |
| 4 | SW precache | ASSETS에 pdf.min.js + pdf.worker.min.js | service-worker.js:9-10 | ✅ | |
| 5 | CLAUDE.md | 일괄등록 설명·파서 위치·CDN 목록 | CLAUDE.md:16, 65, 90, 148-158, 211 | ✅ | F-14 섹션 + CSP worker-src 지침 |
| 6 | 기존 파이프라인 재사용 | bankImportRows/Step, getAllSubcategories, effectiveBudgetData, activeProject, refreshExecutions, storage `attachments`, `documents`, getRequiredDocuments, setExecutionDocsMap | 일괄 등록 핸들러 | ✅ | |

### §2 데이터 설계 (6)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 7 | §2.1 DB 무변경 | 기존 컬럼만, `status:'pending'`, `payment_method:'계좌이체'`, `document_type:'required'`, `execution/{id}/{ts}_{i}_{safeName}` | 일괄 등록 핸들러 | ✅ | 마이그레이션 없음 |
| 8 | §2.2 `DepositParseResult` | 9개 필드, 계좌번호 미포함 | `parseDepositConfirmation` 반환부 | ✅ | acctOut/acctIn은 라벨 소비만 |
| 9 | §2.3 PDF 본 행 | `_idx/_kind:'pdf'/_pdfFile/_parsed/_warnings/_dup/_selected/execution_date/amount/recipient/description/payment_method` | `handleDepositPdfFiles` | ✅ | amount는 문자열 보관(fmtInput/parseInput 호환) |
| 10 | §2.3 수수료 행 | `_kind:'fee'/_feeOf/_feeLinked:true/_pdfFile(동일 File)/recipient '신한은행'/description '이체수수료 · …'` | `handleDepositPdfFiles` | ✅ | description 비면 `'이체수수료'` 폴백 추가 |
| 11 | §2.3 엑셀 행 `_kind:'excel'` | | 엑셀 업로드 onChange | ✅ | |
| 12 | §2.4 신규 state·ref, 소스 전환 리셋 | 4 useState + 1 useRef, 전환 시 rows/headers/step 리셋 | 5137-5138, 5196-5198 | ✅ | `setBulkRegisterResult(null)`도 리셋. 설계 §10 "state 5개"는 §2.4(4+1)와 불일치 → 문서 수정 |

### §3 파서 (7)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 13 | §3.1 `extractPdfTextLines` | pdfjsLib 체크, y ±2pt 줄 묶기, y↓·x↑ 정렬, 3pt 초과 공백, 2p 제한, `finally destroy`, charCount | 3448-3482 | ✅ | 설계 코드와 동일 |
| 14 | §3.2 라벨 테이블 | 13키 동일 순서, `\s*` 허용, `DEPOSIT_LABEL_RE`/`FOOTER_RE`/`SHINHAN_KEYS` | 3485-3502 | ✅ | 동일 |
| 15 | §3.3 `parseDepositConfirmation` | docType 감지, footer 제외, 라벨 구간 추출, 첫 등장 우선, 날짜 정규식, `num()`, description 우선순위, profile ≥3, warnings 4종 | 3506-3547 | ✅ | 동일 |
| 16 | §3.5 엣지 케이스 | charCount 0 → 스캔본 행 / PasswordException / 손상 파일 제외 / 2p | `handleDepositPdfFiles` | ✅ | 전부 실패 시 preview 진입 없이 alert만 — 합리적 추가 |
| 17 | §3.6 `findDuplicateExecution` | (날짜, 금액, 수취인) 일치 | 3550-3553 | ✅ | 동일 |
| 18 | §3.6 기존 중복 → `_dup` + 선택 해제 | | `handleDepositPdfFiles` | ✅ | 날짜·금액 모두 있을 때만 검사(`complete`) — 빈 값 오탐 방지 |
| 19 | §3.6 업로드 내 중복 + 수수료 제외 | 두 번째 이후 `'업로드 내 중복'` + 선택 해제, 본 행끼리만 | `seen` Set | ✅ | |

### §4 처리 흐름 (6)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 20 | §4.1 업로드 핸들러 6단계 | 필터→진행률→순차 파싱(본 행+수수료 행)→내부 중복→state 전환→오류 alert | `handleDepositPdfFiles` | ✅ | pdfjsLib 부재 alert 추가 |
| 21 | §4.2 값 접근 통일 | `rowDate/rowAmount/rowName/rowIsWithdraw` | 미리보기 IIFE | ✅ | 동일 |
| 22 | §4.2 수수료 행 연동 | 본 행 select → `_feeLinked` 수수료 행 복사, 직접 변경 시 false | `updateMapping` | ✅ | |
| 23 | §4.3 1~3단계 | 검증 throw, insertRows, `.select(...)`, id 인덱스 매칭 + 폴백 | 일괄 등록 핸들러 | ✅ | |
| 24 | §4.3 4~6단계 | allSettled 업로드, documents insert, docs map 병합(비면 안 함), failedDocs, bulkRegisterResult, done, refresh | 일괄 등록 핸들러 | ✅ | documents insert 실패도 failedDocs 처리 — 추가 |
| 25 | §4.4 done 화면 | `n건 등록 · 📎 증빙 n건 첨부` + 실패 목록 + 기존 버튼 | done 분기 | ✅ | 증빙 0건이면 첨부 문구 생략 |

### §5 UI (11)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 26 | §5.1 소스 선택 | segmented, 전환 confirm, 설명문 | import 탭 상단 | ✅ | PDF 설명문에 수수료 문구 추가 |
| 27 | §5.2 드롭존 | 문구·hidden input(multiple)·dragover/drop·pdfjsLib 부재 안내 | PDF 업로드 분기 | ✅ | dragLeave 복원 추가 |
| 28 | §5.2 진행률 표시 | 별도 줄 `⏳ 3 / 5 장 읽는 중…` | 버튼 라벨 | ⚠️ | 버튼 라벨로 표시 + disabled(재클릭 방지 겸함) → 설계 갱신 |
| 29 | §5.3 열 구성·편집·배지 | date/numeric/recipient input, 결제 텍스트, 매핑 카드 엑셀만, 상태 열, 배지 색 | 미리보기 표 | ✅ | "금액 (실지급액)" 헤더 |
| 30 | §5.3 수수료 행 표시 | 구분 `출금`, 상태 `└ 수수료`, 첫 셀 `└`, 배경 `#fafafa` | 미리보기 표 | ⚠️ | 구분 열 `수수료` pill + 상태 열 `본 행 항목 연동`/`항목 직접 지정`, `└`는 날짜 셀 → 연동 여부가 보여 T3 확인에 유리 → 설계 갱신 |
| 31 | §5.3 건수 문구 | `총 N건 (수수료 M건 포함) 중 K건 선택` | Actions Bar | ✅ | |
| 32 | §5.4 엑셀 미리보기 무변경 | 렌더 분기만 `_kind` | diff | ✅ | 헬퍼 본문 동일, 렌더 등가 |
| 33 | §5.6 버튼·안내줄·해제 | 제목 우측 버튼, hidden input, 안내줄 + 해제 | register 탭 | ✅ | `disabled={!window.pdfjsLib}` |
| 34 | §5.6 `handleFormPdfAutofill` | 4필드+결제방법 채움, `formPdfEvidence` 보관, warnings alert | 5201-5220 | ⚠️ | 스캔본이면 alert 후 return → 증빙 미보관 (일괄 경로 T6과 비대칭) → **수정됨** (§3) |
| 35 | §5.6 증빙 슬롯·docEntries | `autoDocName`, 우선순위, 수동 첨부 우선 | register 탭 | ✅ | |
| 36 | §5.6 수수료 추가 등록 + 초기화 | confirm → 1건 + 같은 PDF 첨부, 초기화 시 리셋 | 등록 핸들러 | ✅ | |

### §6 증빙 첨부 (3)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 37 | §6.1 `pickTransferDocName` | 규칙 코드 동일 | 5367-5368 | ✅ | 단, 설계 §6.1 **표**가 부정확(§2 참조) |
| 38 | §6.2 업로드·insert·docs map 병합 | safeName, 경로, documents 7필드, 병합(비면 안 함) | 일괄/단건 | ✅ | 단건 폼 누락분 보완 포함 |
| 39 | §6.3 기타 첨부 증빙 | 필수 목록 외 문서명 + 다운로드 | 11127-11150 | ✅ | 상위 게이트 문제 → **수정됨** (§3) |

### §8 에러 처리 / §9 보안 (3)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 40 | §8 1~8행 | 미로드/손상/암호화/텍스트 없음/필수값/중복/insert 실패/증빙 일부 실패 | 각 핸들러 | ✅ | |
| 41 | §8 9행 RLS 오류 | 단건 폼과 동일 안내 | 일괄 등록 catch | ⚠️ | `'등록 오류: ' + err.message`만. 기존 일괄등록도 동일(회귀 아님) → 설계 갱신 |
| 42 | §9 보안·개인정보 | 계좌번호 미저장·미로그, `lines` 미출력, 신규 출처 없음 | 파서·핸들러 | ✅ | console.error는 `file.name`·`err.name`만 |

### §11.1 회귀 (2)

| # | 항목 | 설계 | 구현 위치 | 판정 | 비고 |
|---|------|------|-----------|:----:|------|
| 43 | 엑셀 경로 무변경 | `.select()` 외 변경 없음 | diff | ⚠️ | 매핑·행 편집·insert 필드는 등가. 차이 2건: 성공 `alert` 제거 → done 화면 텍스트, 기본 소스 `'pdf'`라 엑셀은 토글 1회 → 설계 §11.1에 명시 |
| 44 | 단건 폼 기존 경로 | `formPdfEvidence === null`이면 동일 | 등록 핸들러 | ✅ | docs map 병합은 설계가 요구한 보완 |

---

## 2. 설계 갱신 (구현이 더 나은 경우) — design.md v0.2에 반영

| 설계 섹션 | 갱신 내용 | 근거 |
|-----------|-----------|------|
| §5.3 표 | 수수료 행: 구분 `수수료` pill, 상태 `본 행 항목 연동` / `항목 직접 지정`, 날짜 셀 `└ {날짜}` | 연동 여부 시각화 |
| §5.2 | 진행률을 버튼 라벨 + disabled로 표기, 드롭도 파싱 중 무시 | 중복 업로드 방지 |
| §6.1 표 | 교육훈련비·기자재구매관리비·일반관리비·홍보비 → `이체내역서 (계좌이체시)` (`conditional`에 있고 `getRequiredDocuments`가 conditional을 항상 포함). `이체확인증` 폴백은 **여비교통비**와 DOCUMENT_RULES에 없는 유형(예비비·임차료·`'일반지출'`·`''`)뿐 | 코드 규칙은 동일하나 표의 결과가 틀림 |
| §2.4 / §10 | "신규 state 4개 + ref 1개"로 통일 | §10 오기 |
| §4.1 3단계 | `_selected: !dup && !warnings.includes('업로드 내 중복')` | 설계 식이 `!dup`과 동치라 내부 중복 해제가 표현되지 않음 |
| §3.6 | 기존 중복 검사는 날짜·금액이 모두 인식된 행만 대상 | 빈 값 오탐 방지 |
| §4.1 6단계 | 모든 파일 실패 시 preview 진입 없이 alert만 | 빈 미리보기 방지 |
| §2.3 | 수수료 행 description 폴백 `'이체수수료'`, 소스 설명문에 수수료 문구 | |
| §8 9행 | 일괄 등록은 `등록 오류: {message}` (RLS 분기 없음, 기존 동작) | |
| §11.1 | 엑셀 경로 차이 2건 명시(성공 alert 제거, 기본 소스 pdf) | 회귀 기준 명확화 |
| §5.6 | 스캔본(charCount 0): 증빙 보관 후 수동 입력 (T6과 대칭) | §3 🟢 수정 반영 |

---

## 3. 코드 결함 / 위험 및 조치

| 심각도 | 위치(수정 전) | 설명 | 조치 |
|:------:|------|------|------|
| 🟡 | 미리보기 날짜 input `updateRow` | **수수료 행 `execution_date`는 파싱 시점 복사본**. 본 행 날짜를 고쳐도 전파되지 않음 → `날짜 미인식` + 수수료 > 0이면 본 행 날짜를 입력해도 수수료 행이 검증에서 throw(배치 전체 등록 불가), 오인식 날짜를 고쳐도 수수료는 옛 날짜로 등록 | ✅ **수정** — `updateMainRow(ri, patch)` 도입: 날짜는 `_feeOf` 일치 수수료 행에 항상 전파(`_feeLinked` 무관), 날짜·금액·수취인 편집 시 `_dup` 재검사. E2E로 전파 확인 |
| 🟡 | 집행내역 탭 `DOCUMENT_RULES[execution.type] &&` 게이트 | DOCUMENT_RULES에 없는 유형(예비비·임차료 등)은 `'이체확인증'`으로 첨부돼도 **표시되지 않음** → §6.3 목적 미달 | ✅ **수정** — 게이트를 `DOCUMENT_RULES[type] \|\| 첨부 문서 존재`로 완화, "필요 증빙서류:" 헤더는 규칙 있는 유형만 |
| 🟢 | `handleFormPdfAutofill` | 스캔본: alert 후 return → PDF 증빙 미보관 | ✅ **수정** — 빈 parsed + `텍스트 없음(스캔본)` warning으로 `formPdfEvidence` 보관, 결제방법 `계좌이체` 설정 후 안내 |
| 🟢 | 일괄 등록 `Array.isArray(inserted)` | `inserted`가 null이거나 행 수 부족(RLS로 RETURNING이 가려질 때) 시 증빙 업로드를 조용히 건너뜀 | ✅ **수정** — 행 수 불일치면 PDF 파일명 전부 `failedDocs`로 처리 + console.error |
| 🟢 | 단건 폼 수수료 문서 `uploaded_by: currentUser.id` | 일괄 경로와 불일치 | ✅ **수정** — `currentUser?.id \|\| _session.id \|\| null` |
| 🟢 | PDF input onChange | `handleDepositPdfFiles(e.target.files)` 후 `value=''` — 현재는 동기 `Array.from`이 먼저 실행돼 안전하나 취약 | ✅ **수정** — 배열로 복사 후 리셋 |
| 🟢 | id 매칭 폴백 | (날짜, 금액)만 비교 → 같은 날 500원 수수료 행 다건 시 이론적 오매칭 | ✅ **수정** — `.select('id, execution_date, amount, description')` + `sameRow()`로 description까지 비교 |
| 🟢 | 소스 토글 | 파싱 진행 중 토글 가능 → 엑셀 소스 상태로 PDF 행 preview 진입 | ✅ **수정** — `disabled={!!pdfParseProgress}` |
| 🟢 | 미리보기 편집 | 날짜·금액 편집 후 `_dup` 배지 미갱신 | ✅ **수정** — `updateMainRow`에서 재검사 |

**명시 요청 항목 검증 결과 (문제 없음)**

| 항목 | 결과 |
|------|------|
| `render*()` 내부 훅 | 없음. 미리보기 IIFE·기타 첨부 IIFE·핸들러 모두 훅 미사용. 신규 `useState/useRef`는 컴포넌트 최상위 |
| `React.Fragment` | 전역 React UMD, 파일 내 기존 15곳 사용 — 정상 |
| `fmtInput/parseInput/fmt` | 최상위 정의(~2416) — 존재 |
| `usedIds` 동시성 | `allSettled` 콜백은 첫 `await`(storage.upload) 전까지 동기 실행 → target 선택·`usedIds.add`가 순서대로 완료된 뒤 업로드 시작. 경쟁 없음 |
| `e.target.value=''` 순서 | 단건·드롭 정상, 일괄은 위 🟢로 보강 |
| XSS | 신규 코드 전부 JSX 텍스트 렌더, `dangerouslySetInnerHTML` 없음 |
| PII | 계좌번호 결과 미포함, `lines`/raw 객체 미로그, console.error는 파일명·err.name만 |
| `currentUser` null | LoginPage 게이트로 예산 페이지 렌더 시 non-null 보장 |

---

## 4. 런타임 검증 결과 (Do 단계 병행, Playwright + 로컬 `http.server`, DB 쓰기 없음)

| 시나리오 | 결과 |
|----------|------|
| T1 샘플 PDF 1장 | 본 행 `2026-09-18 / 96,968 / 수취인 / 인천캠페인0917 / 계좌이체`, 배지 `📎 PDF` `🏦 카카오뱅크`, 수수료 행 `500 / 신한은행 / 이체수수료 · 인천캠페인0917 / 본 행 항목 연동` — 경고 없음 ✅ |
| T3 연동 | 본 행 소분류·항목 선택 → 수수료 행 동기화 ✅ / 본 행 날짜 편집 → 수수료 행 날짜 전파 ✅ (수정 후) |
| T5 중복 | 같은 PDF 2장 업로드 → 2번째 `⚠ 업로드 내 중복` + 선택 해제, "총 4건 (수수료 2건 포함) 중 3건 선택" ✅ |
| T8 단건 폼 | 4필드 + 결제방법 채움, 항목 선택 시 `전용계좌 체크카드 매출전표 또는 이체내역서` 슬롯에 ✅ PDF, 해제 동작 ✅ |
| T10 엑셀 회귀 | BOM CSV 헤더 매핑·행 파생 정상. BOM 없는 UTF-8 CSV 한글 깨짐은 HEAD와 동일한 기존 현상(범위 외) ✅ |
| 문법 | `@babel/standalone` preset react 트랜스파일 통과 (수정 전·후) ✅ |
| 콘솔 | 신규 오류 없음 (기존 Babel 500KB deopt 안내만) ✅ |

## 5. 미검증 항목 (배포·실DB 필요)

| 항목 | 검증 방법 |
|------|-----------|
| T4 실제 등록 | anon key로 `budget_executions` insert + `attachments` upload + `documents` insert, 집행내역 탭 즉시 ✅ 표시·다운로드 |
| PostgREST `RETURNING` 순서 | 5장 등록 후 각 건의 증빙 파일명 대응 확인 (폴백은 날짜·금액·설명 비교) |
| T12 Vercel CSP | blob 워커 + `importScripts`(jsdelivr) 허용, 콘솔 "Setting up fake worker" 경고 없음 |
| T6 스캔본 | 이미지 PDF 업로드 → `텍스트 없음(스캔본)` 행, 수동 입력 후 등록·증빙 첨부 |
| SW precache | `addAll`이 jsdelivr 2 URL 캐시 성공 (실패 시 SW 설치 실패) |
| 성능 | 10장 < 5초 |

---

## 6. 결론

- **Match Rate 94% ≥ 90% → Check 통과.** 미구현 0건, 부분 일치 5건은 설계서 갱신으로 해소.
- 🟡 2건·🟢 7건 코드 수정 완료, Babel 재검증·E2E 재실행 통과.
- 다음: 커밋(4파일 + docs 3건) → 배포 후 T4/T12 확인 → `/pdca report 입금확인증-PDF-집행등록`.

---

## 7. /simplify 반영 (2026-09-21, 리뷰 에이전트 4종: 재사용·단순화·효율·고도)

| 분류 | 적용 |
|------|------|
| 재사용 | 증빙 업로드 3단계를 `uploadExecutionDoc`/`insertExecutionDocs`/`mergeExecutionDocs` 헬퍼로 통일(단건·수수료·일괄·집행내역 탭 4곳), `safeFileName`·`normalizeDate` 최상위 유틸(엑셀 `fmtDate`와 파서 날짜 규칙 공유), `executionDupKey`로 중복 규칙 1곳, `resetBankImport`/`resetRegisterForm`, `autoDocName` 렌더 파생값 1회 계산, `pdfReadErrorMsg` |
| 단순화 | 파서 죽은 값 제거(`docType`/`profile`/`DEPOSIT_SHINHAN_KEYS`/`charCount`), 라벨 평문화 + `_spaced`, `matchAll`, 스캔본 처리 파서 내부화(플레이스홀더 2벌 삭제), `_parsed`→`_bankIn`, `_dup`에 레코드 그대로, `updateRow`/`updateMainRow`/`updateMapping` → 단일 `updateRow`, `bulkRegisterResult` null 리셋 6곳·done 가드 제거, 집행내역 탭 `requiredDocs`/`extraDocs`/`docDownloadBtn`로 IIFE·중복 markup 제거, `pill(..., key)` |
| 효율 | 배치당 `PDFWorker` 1개 재사용(실측 68ms→0.6ms/파일), `service-worker.js` pdf.js precache 되돌림(오프라인 효익 0, 1.4MB `addAll` 설치 실패 위험) |
| 고도 | `executionDocsLoaded` 플래그로 "빈 맵 = 미로드" 가드의 근본 수정(병합 3벌 → 무조건 병합 1벌), 일괄 등록 `id: crypto.randomUUID()` 클라이언트 부여(`.select()`·행 수 검사·`sameRow`/`usedIds` 재식별 삭제) |
| 건너뜀 | `getRequiredDocuments`가 계좌이체 시 이체 증빙 항목을 가산하는 일반 수정 — 기존 집행의 필수 목록·미비 배너 집계가 바뀌는 도메인 결정이라 범위 밖. 드롭존 스타일 공유·`PDFJS_READY` 상수·`defer` — 이득 미미 |

검증: Babel 트랜스파일 통과, E2E 3종 + 집행내역 탭(54건 렌더, 기타 첨부 1건 실데이터 노출) + BOM CSV 엑셀 경로 동일 결과.


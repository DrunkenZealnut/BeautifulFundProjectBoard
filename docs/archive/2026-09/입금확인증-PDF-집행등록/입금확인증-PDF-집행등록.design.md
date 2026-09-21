# 입금확인증 PDF 집행등록 (F-14) — 설계 문서

> **Summary**: 신한은행 입금확인증 PDF를 pdf.js로 브라우저 내에서 읽어 라벨 스캔 파서로 집행일·금액·수취인·집행내용·수수료를 추출하고, 기존 일괄등록 미리보기/등록 파이프라인에 PDF 행(+수수료 행)을 흘려보낸 뒤 원본 PDF를 이체 증빙으로 자동 첨부한다.
>
> **Project**: 아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템
> **Feature ID**: F-14
> **Author**: Claude Code
> **Date**: 2026-09-20
> **Status**: v0.3 — 구현 완료·갭 분석·/simplify 리팩터 반영 (2026-09-21)
> **Analysis**: [입금확인증-PDF-집행등록.analysis.md](../../03-analysis/입금확인증-PDF-집행등록.analysis.md) — Match Rate 94%, 🟡2·🟢7 수정
> **Planning Doc**: [입금확인증-PDF-집행등록.plan.md](../../01-plan/features/입금확인증-PDF-집행등록.plan.md)

### Plan 열린 질문 → 확정 (2026-09-20 사용자 결정)

| # | 결정 | 설계 반영 |
|---|------|-----------|
| Q1 | 집행금액 = **실지급액** (확인증 입금금액 그대로) | `amount ← 입금금액`. 세전 환산 표시 없음 |
| Q2 | 이체 수수료는 **별도 집행 건** | 확인증 1장 → 본 행 + 수수료 행(`_kind: 'fee'`) 자동 생성, 기본 선택. 회계가이드 규칙("이체수수료: 해당 예산항목에 편성")에 따라 본 행과 같은 소분류·항목을 따라감 |
| Q3 | "제목" = **출금통장표시내용** | `description ← 출금통장표시내용 → 거래메모 → 파일명 → "{수취인} 계좌이체"` |
| Q4 | 출금은 **신한은행만** | 신한 프로파일 단일 지원. 별칭 테이블은 확장 가능 구조만 유지(타 은행 검증 범위 외) |
| Q5 | 단건 등록 폼 자동입력 버튼 **포함** | §5.6 설계 |

---

## 1. Architecture Overview

### 1.1 현재 구조 (Before) — 일괄등록 탭

```
[xlsx/csv] → FileReader → XLSX.read → 헤더 자동 매핑(bankColMap)
   → bankImportRows[{_raw, _selected, subcategory_id, budget_item_id, description, payment_method}]
   → preview 표 (소분류/항목/설명/결제방법 편집)
   → supabase.from('budget_executions').insert(rows)   ← 증빙 첨부 없음, id 회수 없음
   → done
```

### 1.2 변경 구조 (After)

```
소스 선택: ( ) 은행 거래내역 엑셀   (●) 입금확인증 PDF
                                        │
        ┌───────────────────────────────┘
        ▼
[*.pdf 다중] → extractPdfTextLines(file)      pdf.js getTextContent → y/x 정렬 → 줄 문자열[]
             → parseDepositConfirmation(lines, name)   라벨 스캔 → {execution_date, amount, fee, recipient, description, warnings}
             → findDuplicateExecution(...)             기존 집행내역·업로드 내 중복 표시
             → bankImportRows[ 본 행(_kind:'pdf'), 수수료 행(_kind:'fee') ... ]
             → preview 표 (PDF 행은 날짜/금액/수취인도 편집 가능, 배지 표시)
             → insert(행마다 클라이언트 id: crypto.randomUUID())  →  uploadExecutionDoc(PDF → attachments 버킷) → insertExecutionDocs(documents insert + 맵 병합)
             → refreshExecutions → done(등록 n건 · 증빙 n건 · 실패 목록)
```

단건 등록 폼: `📎 입금확인증 PDF로 자동입력` → 같은 파서 → `formData` 채움 + `formPdfEvidence`(File) 보관 → 등록 시 이체 증빙 슬롯으로 업로드, 수수료가 있으면 추가 등록 확인.

### 1.3 의존성

| 구성요소 | 의존 대상 | 용도 |
|----------|-----------|------|
| `extractPdfTextLines` | `window.pdfjsLib` (pdfjs-dist@3.11.174 UMD, cdn.jsdelivr.net) | PDF 텍스트 아이템 추출 |
| pdf.js 워커 | `GlobalWorkerOptions.workerSrc` = jsdelivr `pdf.worker.min.js` | 교차출처이므로 pdf.js가 `blob:` 래퍼 워커 생성 → CSP `worker-src 'self' blob:` 필요. 차단 시 자동으로 fake worker(메인스레드) 폴백 |
| `parseDepositConfirmation` | 없음 (순수 함수) | 라벨 스캔 |
| 일괄등록 UI | `bankImportRows/Step`, `getAllSubcategories`, `getAllBudgetItems`, `effectiveBudgetData`, `activeProject`, `refreshExecutions` | 기존 파이프라인 재사용 |
| 증빙 첨부 | `supabase.storage.from('attachments')`, `documents` 테이블, `getRequiredDocuments`, `setExecutionDocsMap` | 단건 폼과 동일 규칙 |

---

## 2. 데이터 설계

### 2.1 DB — 변경 없음

| 테이블/버킷 | 작업 | 비고 |
|-------------|------|------|
| `bf.budget_executions` | insert | 기존 컬럼만 사용 (`status: 'pending'`, `payment_method: '계좌이체'`) |
| `bf.documents` | insert | `document_name` = §6.1 규칙, `document_type: 'required'` |
| storage `attachments` | upload | `execution/{execution_id}/{ts}_{i}_{safeName}` (단건 폼과 동일 경로 규칙) |

### 2.2 파싱 결과 모델 — `DepositParseResult`

```javascript
{
  execution_date: 'YYYY-MM-DD' | '',
  amount: number | null,               // 입금금액 (실지급액)
  fee: number | null,                  // 수수료
  recipient: string,                   // 수취인성명
  description: string,                 // 출금통장표시내용 → 거래메모 → 파일명 → "{수취인} 계좌이체"
  bankIn: string,                      // 입금은행 (미리보기 참고 표시만)
  warnings: string[]                   // '날짜 미인식' | '금액 미인식' | '수취인 미인식' | '입금확인증 형식을 인식하지 못했습니다' | '텍스트 없음(스캔본)'
}
```

(v0.3) `docType`/`profile`은 소비처가 없어 제거. 빈 `lines`(스캔본)도 파서가 직접 처리해 `'텍스트 없음(스캔본)'` 경고를 붙인다 — 호출부는 스캔본 플레이스홀더를 만들지 않는다.

**계좌번호(출금계좌·입금계좌)는 라벨 소비용으로만 매칭하고 결과 객체에 넣지 않는다.** `console.log`에 줄 배열이나 raw 객체를 출력하지 않는다.

### 2.3 `bankImportRows` 행 모델 (확장)

| 필드 | 엑셀 행 | PDF 본 행 | 수수료 행 | 설명 |
|------|:-------:|:---------:|:---------:|------|
| `_idx` | ✓ | ✓ | ✓ | 표시용 순번 |
| `_kind` | `'excel'` | `'pdf'` | `'fee'` | 렌더·등록 분기 키 (엑셀 행은 `_raw` 유무로도 판별 가능하나 명시) |
| `_raw` | ✓ | – | – | 엑셀 원본 배열 (기존) |
| `_selected` | ✓ | ✓ (중복 의심 시 false) | ✓ | 등록 대상 |
| `_pdfFile` | – | File | File (본 행과 동일 객체) | 증빙 업로드 원본 |
| `_bankIn` | – | string | – | `🏦 입금은행` 배지 (파싱 결과 중 유일하게 행 필드로 복사되지 않는 값) |
| `_warnings` | – | string[] | – | 배지 |
| `_dup` | – | 기존 집행 레코드 \| null | – | 기존 집행내역 중복 (렌더는 `.execution_date/.amount`만 사용) |
| `_feeOf` | – | – | 본 행 `_idx` | 부모 참조 |
| `_feeLinked` | – | – | boolean (기본 true) | true인 동안 부모의 소분류·항목 변경을 따라감; 수수료 행 select를 직접 바꾸면 false |
| `execution_date` | – (`_raw`에서 파생) | ✓ 편집 가능 | ✓ (부모와 동일 — 부모 날짜 편집 시 `_feeLinked` 무관하게 전파) | |
| `amount` | – | ✓ 편집 가능 | ✓ (= fee) | |
| `recipient` | – | ✓ 편집 가능 | `'신한은행'` | 수수료 수취처 = 은행 |
| `subcategory_id`, `budget_item_id` | ✓ | ✓ | ✓ | 기존 |
| `description` | ✓ | ✓ (= parsed.description) | `이체수수료 · {부모 description}` (부모 설명 비면 `이체수수료`) | |
| `payment_method` | ✓ | `'계좌이체'` 고정 표시 | `'계좌이체'` | PDF 행은 select 대신 텍스트 |

### 2.4 신규 State (index.html ~line 5066 "은행 엑셀 일괄등록 상태" 블록에 추가)

```javascript
const [bankImportSource, setBankImportSource] = useState('pdf');   // 'pdf' | 'excel'
const [pdfParseProgress, setPdfParseProgress] = useState(null);     // { done, total } | null
const [bulkRegisterResult, setBulkRegisterResult] = useState(null); // { inserted, attached, failedDocs: [] } (done 진입 직전 항상 설정 → done 화면은 가드 1개)
const resetBankImport = () => { setBankImportStep('upload'); setBankImportRows([]); setBankHeaders([]); };
// 단건 등록 폼
const [formPdfEvidence, setFormPdfEvidence] = useState(null);       // { file, parsed } | null
const pdfAutofillInputRef = useRef(null);
const autoDocName = formPdfEvidence ? pickTransferDocName(formData.type) : null; // 렌더 파생값 (증빙 슬롯·등록·수수료 공용)
const resetRegisterForm = () => { setFormData(emptyExecutionForm()); setFormDocFiles({}); setFormPdfEvidence(null); activeFormDocNameRef.current = null; };
// 집행내역 탭 (기존 캐시 가드의 근본 수정)
const [executionDocsLoaded, setExecutionDocsLoaded] = useState(false); // documents 전체 로드 완료 여부 — 로드 effect·미비 배너가 이 플래그를 본다
```

신규 state 5개 + ref 1개. 기존 `bankImportRows`, `bankImportStep`, `bankColMap`, `bankHeaders`는 그대로 사용. 소스 전환 시 `bankImportRows=[]`, `bankHeaders=[]`, `bankImportStep='upload'`, `bulkRegisterResult=null`로 리셋. 파싱 진행 중(`pdfParseProgress`)에는 소스 토글 비활성.

---

## 3. 파서 설계 (최상위 순수 함수 — `downloadHwpxFill` 인근, ~line 3408 뒤에 배치)

### 3.1 텍스트 추출 `extractPdfTextLines(file, worker?)` → `lines[]`

검증된 사실(샘플, pdf.js 3.11.174): PDFium이 만든 입금확인증은 **글자 1개가 아이템 1개**(323개)이고 **아이템 순서가 읽기 순서와 다르다**(값 열이 먼저, 라벨 열이 나중). 따라서 y로 줄을 묶고 x로 정렬해 줄 문자열을 재구성해야 한다.

```javascript
// worker(pdfjsLib.PDFWorker)를 넘기면 여러 파일이 워커 1개를 재사용 (파일마다 새 워커 ≈ 70ms, 재사용 ≈ 0.6ms — 실측)
const extractPdfTextLines = async (file, worker) => {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await window.pdfjsLib.getDocument({ data, worker }).promise;
    const lines = [];
    try {
        const pageCount = Math.min(pdf.numPages, 2);           // 확인증은 1p, 안전상 2p까지
        for (let p = 1; p <= pageCount; p++) {
            const page = await pdf.getPage(p);
            const tc = await page.getTextContent();
            const rows = [];                                    // [{ y, items: [{ x, w, s }] }]
            tc.items.forEach(it => {
                if (!('str' in it) || it.str === '') return;
                const x = it.transform[4], y = it.transform[5];
                let row = rows.find(r => Math.abs(r.y - y) <= 2);  // 같은 줄 판정: ±2pt
                if (!row) { row = { y, items: [] }; rows.push(row); }
                row.items.push({ x, w: it.width, s: it.str });
            });
            rows.sort((a, b) => b.y - a.y).forEach(row => {     // PDF 좌표계: y 클수록 위
                row.items.sort((a, b) => a.x - b.x);
                let s = '', lastEnd = null;
                row.items.forEach(it => {
                    if (lastEnd != null && it.x - lastEnd > 3) s += ' ';  // 글자 간격 3pt 초과 → 공백
                    s += it.s; lastEnd = it.x + it.w;
                });
                s = s.replace(/\s+/g, ' ').trim();
                if (s) lines.push(s);
            });
        }
    } finally {
        pdf.destroy(); // 외부 worker는 파괴하지 않음 (pdf.js는 내부 생성 worker만 task에 묶음)
    }
    return lines;
};
const pdfReadErrorMsg = (err) => err && err.name === 'PasswordException' ? '암호가 걸린 PDF입니다' : '읽을 수 없는 PDF입니다';
```

- 암호화 PDF: `getDocument`가 `PasswordException`을 던짐 → 호출부는 `pdfReadErrorMsg(err)`로 메시지 통일
- `lines.length === 0` → 스캔본 → `parseDepositConfirmation`이 `'텍스트 없음(스캔본)'` 경고를 붙여 반환 (빈 문자열 줄은 push되지 않으므로 charCount는 불필요)

### 3.2 라벨 별칭 테이블 `DEPOSIT_PDF_LABELS`

라벨 글자 사이에 `\s*`를 허용해 "업체사용 Key", "수취인 성명" 같은 공백 변형을 흡수한다. **긴 라벨을 먼저** 두어 `입금통장표시내용` ⊃ `입금` 류의 부분 일치를 막는다.

```javascript
const DEPOSIT_PDF_LABELS = [
    { key: 'memoOut',      labels: ['출금통장표시내용'] }, // "제목" (Q3)
    { key: 'memoIn',       labels: ['입금통장표시내용'] },
    { key: 'recipient',    labels: ['수취인성명', '수취인', '받는분'] },
    { key: 'amount',       labels: ['입금금액', '이체금액', '거래금액'] },
    { key: 'fee',          labels: ['이체수수료', '수수료'] },
    { key: 'date',         labels: ['거래일시', '이체일시', '거래일자'] },
    { key: 'bankIn',       labels: ['입금은행'] },
    { key: 'acctOut',      labels: ['출금계좌'] }, // 소비만, 저장 안 함
    { key: 'acctIn',       labels: ['입금계좌'] }, // 소비만, 저장 안 함
    { key: 'memo',         labels: ['거래메모'] },
    { key: 'transferType', labels: ['이체구분'] },
    { key: 'senderCode',   labels: ['입금인코드'] },
    { key: 'vendorKey',    labels: ['업체사용Key'] }
];
const _spaced = (label) => label.split('').join('\\s*');   // 라벨 글자 사이 공백 허용 정규식 소스
const DEPOSIT_LABEL_RE = new RegExp(DEPOSIT_PDF_LABELS.map(l => `(${l.labels.map(_spaced).join('|')})`).join('|'), 'g');
const DEPOSIT_FOOTER_RE = /바랍니다|입니다\.?$|참고용/;          // 하단 안내문 2줄 제외
```

라벨은 평문으로 두고 `_spaced`가 정규식을 조립한다 (v0.3). 신한 프로파일 판정(`DEPOSIT_SHINHAN_KEYS`)은 소비처가 없어 제거.

### 3.3 필드 파싱 `parseDepositConfirmation(lines, fileName)`

규칙: 줄마다 라벨 위치를 모두 찾고, **라벨 끝 ~ 다음 라벨 시작** 구간을 값으로 취한다(한 줄에 라벨-값 쌍 2개인 4열 격자 대응). 같은 키는 **첫 등장이 우선**(본문이 안내문보다 위에 있음). 안내문 줄은 `DEPOSIT_FOOTER_RE`로 건너뛴다(안내문에 "이체구분", "수취인성명"이 다시 등장함).

```javascript
const parseDepositConfirmation = (lines, fileName = '') => {
    const raw = {};
    lines.forEach(line => {
        if (DEPOSIT_FOOTER_RE.test(line)) return;
        const hits = [];
        for (const m of line.matchAll(DEPOSIT_LABEL_RE)) {
            const gi = m.slice(1).findIndex(g => g !== undefined);
            hits.push({ key: DEPOSIT_PDF_LABELS[gi].key, start: m.index, end: m.index + m[0].length });
        }
        hits.forEach((h, i) => {
            const value = line.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : undefined).trim();
            if (raw[h.key] === undefined) raw[h.key] = value;
        });
    });
    const num = v => { const digits = parseInput(v || ''); return digits ? Number(digits) : null; };
    const execution_date = normalizeDate(raw.date);   // 공용 유틸 (엑셀 경로와 공유). "2026.09.1814:03:33"도 통과
    const amount = num(raw.amount);
    const recipient = raw.recipient || '';
    const memo = raw.memoOut || raw.memo || '';
    const baseName = fileName.replace(/\.pdf$/i, '').trim();
    const warnings = [];
    if (lines.length === 0) warnings.push('텍스트 없음(스캔본)');
    else if (Object.keys(raw).length === 0) warnings.push('입금확인증 형식을 인식하지 못했습니다');
    if (!execution_date) warnings.push('날짜 미인식');
    if (amount == null) warnings.push('금액 미인식');
    if (!recipient) warnings.push('수취인 미인식');
    return { execution_date, amount, fee: num(raw.fee), recipient,
             description: memo || baseName || (recipient ? `${recipient} 계좌이체` : ''), bankIn: raw.bankIn || '', warnings };
};
```

### 3.4 샘플 검증 결과 (Node + pdfjs-dist@3.11.174, 2026-09-20)

재구성된 줄(계좌번호·성명 마스킹):

```
L0  입금확인증
L1  청년노동자인권센터 2026.09.18 14:03:37
L2  거래일시 2026.09.18 14:03:33
L3  이체구분 건별(즉시)이체 출금계좌 100-038-47****
L4  입금은행 카카오뱅크 입금계좌 33***********
L5  입금금액 96,968원 수취인성명 ○○○
L6  수수료 500원 거래메모
L7  입금인코드 업체사용 Key
L8  입금통장표시내용 청년노동자인권 출금통장표시내용 인천캠페인0917
L9  본 명세서는 인터넷뱅킹에서 … 참고용으로만 사용하시기 바랍니다.   (제외)
L10 이체구분이 ‘대량’ 이체의 성격일 경우 … 이체한 경우입니다.       (제외)
```

파싱 결과: `{ docType:'입금확인증', profile:'shinhan', execution_date:'2026-09-18', amount:96968, fee:500, recipient:'○○○', description:'인천캠페인0917', bankIn:'카카오뱅크', warnings:[] }` — Plan DoD 1항 충족.

### 3.5 엣지 케이스

| 케이스 | 동작 |
|--------|------|
| 텍스트 없음(스캔·이미지 PDF) | `charCount === 0` → 빈 행 + `텍스트 없음(스캔본)` 배지, 수동 입력 |
| 대량이체로 수취인 공백 | `수취인 미인식` 배지, 수취인 입력란 비움 |
| 거래메모·출금통장표시내용 모두 비어 있음 | description = 파일명(확장자 제거) → 그래도 없으면 `{수취인} 계좌이체` |
| 날짜·시각 붙음 `2026.09.1814:03:33` | 날짜 정규식 첫 매칭으로 정상 |
| 같은 줄에 라벨 2쌍 | 라벨 사이 구간 추출로 정상 (L3~L8) |
| 안내문에 라벨 재등장 | `DEPOSIT_FOOTER_RE`로 제외 + 첫 등장 우선 |
| 2페이지 이상 | 2p까지만 읽음, 1p 값이 우선 |
| PDF 아닌 파일 / 손상 | `getDocument` reject → 행 생성 없이 파일명과 함께 오류 목록 표시 |
| 암호화 PDF | `PasswordException` → "암호가 걸린 PDF입니다" |

### 3.6 중복 감지 `findDuplicateExecution(list, { execution_date, amount, recipient })`

```javascript
const executionDupKey = (e) => `${e.execution_date}|${Number(e.amount)}|${(e.recipient || '').trim()}`;  // 업로드 내 중복 Set 키와 공유
const findDuplicateExecution = (executions, cand) => {
    const key = executionDupKey(cand);
    return (executions || []).find(e => executionDupKey(e) === key) || null;
};
```

- 기존 집행내역(`data.budgetExecutions`) 대상 — 날짜·금액이 모두 인식된 행만 검사(빈 값 오탐 방지) → `_dup = { id, execution_date, amount }`, `_selected = false`. 미리보기에서 날짜·금액·수취인을 편집하면 재검사
- 업로드 묶음 내 동일 (날짜, 금액, 수취인) → 두 번째 이후 행에 `_warnings.push('업로드 내 중복')`, `_selected = false`
- 수수료 행은 중복 검사 제외(같은 날 500원 다건이 정상)

---

## 4. 처리 흐름 설계

### 4.1 PDF 업로드 핸들러 `handleDepositPdfFiles(fileList)` (ProjectManagementSystem 내부, 일반 async 함수)

```
1. files = [...fileList].filter(f => /\.pdf$/i.test(f.name) || f.type === 'application/pdf'); 없으면 alert
2. setPdfParseProgress({ done: 0, total: files.length }); worker = new pdfjsLib.PDFWorker()  // 배치당 1개, finally에서 destroy
3. for (i, file) 순차:
     try parsed = parseDepositConfirmation(await extractPdfTextLines(file, worker), file.name)   // 스캔본도 파서가 처리
     catch err → errors.push(`${file.name}: ${pdfReadErrorMsg(err)}`); continue
     dup = findDuplicateExecution(data.budgetExecutions, parsed)
     base = { _pdfFile, execution_date, subcategory_id:'', budget_item_id:'', payment_method:'계좌이체' }  // 두 행 공통
     rows.push({ ...base, _kind:'pdf', _bankIn, _warnings, _dup, _selected: !dup && !dupInUpload, amount, recipient, description })
     if (parsed.fee > 0) rows.push({ ...base, _kind:'fee', _feeOf: 본 행 인덱스, _feeLinked: true, _selected: 본 행과 동일(!dup && !dupInUpload), amount: fee, recipient:'신한은행', description })   // 중복 PDF면 수수료 행만 등록되는 일 방지
     setPdfParseProgress({ done: i + 1, total })
4. 업로드 내 중복 표시 (본 행끼리)
5. rows가 하나도 없으면(전부 실패) alert만 하고 upload 단계 유지; 있으면 setBankImportRows(rows); setBankImportStep('preview'); setPdfParseProgress(null)
6. errors.length → alert('읽지 못한 파일:\n' + errors.join('\n'))  (행은 생성됨, 진행 가능)
```

순차 처리 이유: 진행률 표시 단순화, 동시 워커 메모리 절약. 워커는 배치당 1개를 재사용하므로 파일당 오버헤드는 진행률 렌더 정도. 10장 기준 수 초 이내.

### 4.2 미리보기 값 접근 통일

기존 `getVal(row,key)`/`fmtDate`/`parseAmt`는 엑셀 행 전용. PDF/수수료 행은 행 필드를 직접 쓴다.

```javascript
const rowDate = r => r._kind === 'excel' ? fmtDate(getVal(r, 'date')) : r.execution_date;
const rowAmount = r => r._kind === 'excel' ? parseAmt(getVal(r, 'amount')) : (parseInt(r.amount) || 0);
const rowName = r => r._kind === 'excel' ? String(getVal(r, 'name') || '') : (r.recipient || '');
const rowIsWithdraw = r => r._kind === 'excel' ? /출금|지급|이체/.test(String(getVal(r, 'type'))) : true;
```

행 편집은 `updateRow(ri, patch)` 하나로 통일한다 (v0.3). 모든 셀 핸들러가 `updateRow(ri, { field: value })`만 호출하고, 규칙은 updater 안에 있다:
- 편집 행이 PDF 본 행이면 `findDuplicateExecution`으로 `_dup` 재검사 (날짜·금액·수취인에만 의존하므로 매 패치 재계산해도 값 동일)
- 편집 행이 수수료 행이고 patch에 `subcategory_id`/`budget_item_id`가 있으면 `_feeLinked = false` (직접 지정)
- `_kind==='fee' && _feeOf===ri`인 수수료 행에 전파: `execution_date`는 항상(수수료 날짜는 본 행과 같아야 함), 소분류/항목은 `_feeLinked`일 때만

### 4.3 일괄 등록 핸들러 (기존 onClick 확장)

```
1. toInsert = rows.filter(_selected && subcategory_id && budget_item_id)
   - PDF 행 추가 검증: rowDate(r) && rowAmount(r) > 0, 아니면 `행 N: 날짜/금액 확인` throw
2. insertRows = toInsert.map(기존 매핑 + rowDate/rowAmount/rowName 사용)
   - 수수료 행: recipient '신한은행', description `이체수수료 · {부모 description}`, amount = fee
3. insertRows 각 행에 `id: crypto.randomUUID()`를 클라이언트에서 부여 (`budget_executions.id`는 DEFAULT일 뿐 명시 삽입 가능, RLS insert는 `amount > 0`만 검사, `crypto.subtle` 로그인과 같은 보안 컨텍스트 전제) → `await supabase.from('budget_executions').insert(insertRows)`. 서버 반환 순서·가시성에 의존하는 id 재식별이 필요 없다 (v0.3)
4. 증빙 업로드 (PDF·수수료 행만, `_pdfFile` 있는 행) — Promise.allSettled(jobs.map(({r,i}) => uploadExecutionDoc(insertRows[i].id, pickTransferDocName(insertRows[i].type), r._pdfFile, `${i}_`)))
   docsToInsert = fulfilled 값, failedDocs = rejected 항목의 파일명
   docErr = await insertExecutionDocs(docsToInsert)   // documents insert + mergeExecutionDocs; 실패 시 docsToInsert 전부 failedDocs에 추가
5. setBulkRegisterResult({ inserted: insertRows.length, attached: docsToInsert.length, failedDocs })
6. setBankImportStep('done'); await refreshExecutions()
```

엑셀 행만 있는 경우 4단계는 건너뛰므로 기존 동작과 동일(단, `.select()`가 붙는 것만 차이).

### 4.4 done 화면

`✅ {inserted}건 등록 · 📎 증빙 {attached}건 첨부` + `failedDocs.length > 0`이면 "⚠️ 증빙 첨부 실패: 파일명 목록 — 집행내역 탭에서 다시 첨부해주세요". 버튼은 기존(추가 업로드 / 집행내역 보기) 유지.

---

## 5. UI 설계

### 5.1 소스 선택 (import 탭 상단, 제목 아래)

```
📥 일괄등록
[ 📄 입금확인증 PDF ] [ 📊 은행 거래내역 엑셀 ]     ← segmented, 활성 = btn-primary
```

- 소스 전환 시 `bankImportStep !== 'upload'`이면 `confirm('현재 미리보기를 지우고 소스를 바꿀까요?')`
- 설명문: PDF → "신한은행 인터넷뱅킹에서 저장한 입금확인증 PDF를 올리면 집행일·금액·수취인·집행내용이 자동으로 채워집니다. 계좌번호는 저장하지 않습니다." / 엑셀 → 기존 문구

### 5.2 PDF 업로드 단계

```
┌───────────────────────────────────────────────────────────┐
│                      📄                                    │
│   입금확인증 PDF를 여기에 끌어다 놓거나 선택하세요            │
│   여러 장 가능 · 신한은행 인터넷뱅킹 출력본 검증됨            │
│        [ 파일 선택 ] → 파싱 중엔 [ ⏳ 3 / 5 장 읽는 중… ] (disabled) │
└───────────────────────────────────────────────────────────┘
<input type="file" id="deposit-pdf-input" accept="application/pdf,.pdf" multiple hidden>
```

- 드롭존: `onDragOver preventDefault`, `onDrop → handleDepositPdfFiles(e.dataTransfer.files)` (파싱 중 드롭 무시); 드래그 중 테두리 색 강조, `onDragLeave` 복원
- 파일 input `onChange`는 FileList를 배열로 복사한 뒤 `value=''`로 리셋하고 핸들러에 넘김
- `window.pdfjsLib` 부재 시 버튼 비활성 + "PDF 라이브러리 로딩 중/실패 — 새로고침" 안내

### 5.3 미리보기 표 (PDF 소스)

열 매핑 카드는 `bankImportSource === 'excel'`일 때만 렌더. 표 열:

| ☑ | 날짜 | 금액 | 구분 | 수취인 | 소분류 | 예산항목 | 설명 | 결제 | 상태 |
|---|------|------|------|--------|--------|----------|------|------|------|
| ☑ | `<input type=date>` | `<input inputMode=numeric>` (fmtInput/parseInput) | 출금 | `<input>` | select | select | `<input>` | 계좌이체 | `📎 PDF` `🏦 카카오뱅크` |
| ☑ | `└ 2026-09-18` (텍스트) | 500 | `수수료` (보라 pill) | 신한은행 | select(연동) | select(연동) | 이체수수료 · 인천캠페인0917 | 계좌이체 | `본 행 항목 연동` / 직접 바꾸면 `항목 직접 지정` |
| ☐ | … | … | … | … | … | … | … | … | `⚠ 중복 의심 (기존 건 2026-09-18 · 96,968)` |
| ☑ | (빈값) | (빈값) | 출금 | (빈값) | … | … | 파일명 | 계좌이체 | `⚠ 텍스트 없음(스캔본)` |

- 배지 스타일: 기존 입금/출금 pill 스타일 재사용 (`fontSize 11, borderRadius 10`), 경고는 `#fef3c7/#92400e`, 중복은 `#fee2e2/#991b1b`
- 수수료 행은 부모 바로 아래, 날짜 셀에 `└` 들여쓰기, 배경 `#fafafa`, 날짜·금액·수취인은 텍스트(부모 날짜를 따라감), 설명만 편집
- 행 카운트 문구: `총 {rows}건 (수수료 {feeRows}건 포함) 중 {selected}건 선택`

### 5.4 엑셀 소스 미리보기

변경 없음 (렌더 분기만 `_kind` 기준으로 통일).

### 5.5 done 단계

§4.4.

### 5.6 단건 등록 폼 — `📎 입금확인증 PDF로 자동입력`

위치: "📝 예산 집행 등록" 제목 우측(같은 줄, `justify-content: space-between`).

```
📝 예산 집행 등록                    [📎 입금확인증 PDF로 자동입력]
… (폼) …
집행 내용 [인천캠페인0917                        ]
📎 자동입력됨: 김○○인건비.pdf → 이체 증빙으로 첨부 예정 · 수수료 500원 (등록 후 추가 등록 여부 확인)   [해제]
```

핸들러 `handleFormPdfAutofill(file)`:
```
0. lines.length === 0(스캔본) → 파서가 돌려준 빈 parsed(+ '텍스트 없음(스캔본)')로 formPdfEvidence만 보관, 결제방법 '계좌이체', 안내 alert 후 종료 (증빙 첨부는 유지, 값은 수동 입력)
1. lines = await extractPdfTextLines(file); parsed = parseDepositConfirmation(lines, file.name); setFormPdfEvidence({ file, parsed })
2. setFormData(prev => ({ ...prev,
       execution_date: parsed.execution_date || prev.execution_date,
       amount: parsed.amount != null ? String(parsed.amount) : prev.amount,
       recipient: parsed.recipient || prev.recipient,
       description: parsed.description || prev.description,
       payment_method: '계좌이체' }))
3. setFormPdfEvidence({ file, parsed })
4. parsed.warnings.length → alert('일부 항목을 읽지 못했습니다: ' + warnings.join(', ') + '\n직접 입력해주세요.')
```

증빙 슬롯 연동 (필요 증빙서류 목록 렌더):
```javascript
const autoDocName = formPdfEvidence && formData.type ? pickTransferDocName(formData.type) : null;
const attachedFile = formDocFiles[doc] || (doc === autoDocName ? formPdfEvidence.file : null);
```
등록 핸들러: `docEntries = Object.entries(formDocFiles)`; `autoDocName`(컴포넌트 렌더 파생값)이 있고 `formDocFiles[autoDocName]`이 없으면 `[autoDocName, formPdfEvidence.file]` 추가(수동 첨부 우선). 업로드는 `uploadExecutionDoc`·`insertExecutionDocs` 공용 헬퍼(§6.2). 성공 alert 뒤 `formPdfEvidence.parsed.fee > 0`이면 `confirm('이체수수료 {fee}원을 같은 예산항목으로 추가 등록할까요?')` → 동일 `insertData`에 `amount: fee, recipient: '신한은행', description: '이체수수료 · ' + description`로 1건 더 insert + 같은 PDF를 `uploadExecutionDoc(feeId, autoDocName, file, 'fee_')`로 첨부. 폼 초기화는 `resetRegisterForm()` (등록 성공·초기화 버튼 공용).

---

## 6. 증빙 첨부 설계

### 6.1 문서명 결정 `pickTransferDocName(type)`

```javascript
const pickTransferDocName = (type) =>
    getRequiredDocuments(type, '계좌이체').find(d => /이체(내역서|확인증|증)/.test(d)) || '이체확인증';
```

| 유형 | 결과 |
|------|------|
| 사업인건비 | `전용계좌 체크카드 매출전표 또는 이체내역서` |
| 운영인건비 · 지급수수료 | `이체내역서 (일괄출력)` |
| 사업회의비 · 사업홍보비 · 물품구매비 · 도서인쇄비 (required) · 교육훈련비 · 기자재구매관리비 · 일반관리비 · 홍보비 (conditional — `getRequiredDocuments`는 conditional을 항상 포함) | `이체내역서 (계좌이체시)` |
| 여비교통비, DOCUMENT_RULES에 없는 유형(예비비 · 임차료 · `'일반지출'` 폴백 · `''`) | 이체 항목 없음 → `이체확인증` (§6.3으로 표시) |

### 6.2 업로드·insert — 공용 헬퍼 (v0.3)

단건 폼·수수료 후속·일괄 등록·집행내역 탭 재첨부 4곳이 같은 3단계(storage 업로드 → `documents` insert → 증빙 맵 병합)를 쓰므로 컴포넌트 헬퍼로 통일한다.

```javascript
const uploadExecutionDoc = async (execId, docName, file, tag = '') => {   // storage 실패 시 throw
    const filePath = `execution/${execId}/${Date.now()}_${tag}${safeFileName(file.name)}`;
    const { data: storageData, error } = await supabase.storage.from('attachments').upload(filePath, file);
    if (error) throw error;
    return { execution_id: execId, document_name: docName, document_type: 'required',
             file_path: storageData?.path || filePath, file_name: file.name, file_size: file.size, uploaded_by: currentUser.id };
};
const mergeExecutionDocs = (docRows) => setExecutionDocsMap(prev => { /* 무조건 병합 */ });
const insertExecutionDocs = async (docRows) => { /* documents insert → 성공 시 mergeExecutionDocs; 실패 시 업로드한 file_path를 storage에서 remove(계좌정보 PDF 고아 방지); error 반환 */ };
```

- `safeFileName`은 최상위 유틸(`fmtInput` 옆). 경로 규칙은 기존 단건 폼과 동일 (`execution/{id}/{ts}_{tag}{safeName}`)
- **캐시 가드 근본 수정**: 기존 집행내역 탭 effect는 "맵이 비어 있지 않음"을 로드 완료의 대용으로 써서(`if (Object.keys(executionDocsMap).length > 0) return;`) 탭 진입 전 병합하면 전체 로드가 영영 건너뛰어졌다. `executionDocsLoaded` 플래그를 두어 effect와 미비 배너가 그 플래그를 보게 하고, 병합은 조건 없이 수행한다. 탭 첫 진입 시 전체 로드가 병합분을 DB 값으로 덮어쓴다
- 같은 File 객체를 본 행과 수수료 행 두 곳에 업로드(경로가 execution_id로 달라 충돌 없음)

### 6.3 집행내역 탭 — 기타 첨부 증빙 표시 (소규모 추가, ~line 10620)

필요 증빙 목록 아래에 `Object.keys(executionDocsMap[execution.id] || {})` 중 `getRequiredDocuments(...)`에 없는 이름을 "기타 첨부 증빙: 📄 이체확인증 [⬇️]"로 렌더. 기존 다운로드 버튼 로직 재사용. 문서 목록 블록의 게이트는 `DOCUMENT_RULES[type] || 첨부 문서 존재`로 두어 규칙이 없는 유형(예비비·임차료)의 폴백 문서도 보이게 한다("필요 증빙서류:" 헤더는 규칙 있는 유형만).

---

## 7. 인프라 변경

| 파일 | 변경 |
|------|------|
| `index.html` `<head>` | `<!-- pdf.js: 입금확인증 PDF 텍스트 추출 --> <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>` (html2pdf 태그 아래) |
| `index.html` babel 블록 (CONFIG 아래) | `if (window.pdfjsLib) window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';` |
| `vercel.json` CSP | `script-src`에 jsdelivr 이미 허용. **`worker-src 'self' blob:` 추가** (pdf.js가 교차출처 워커를 `blob:` + `importScripts` 래퍼로 띄움. 미추가 시 `SecurityError` → pdf.js가 "Setting up fake worker" 경고 후 메인스레드 폴백, 기능은 동작) |
| `service-worker.js` | **변경 없음** (v0.3에서 precache 추가를 되돌림) — 오프라인에서는 Supabase 등록·업로드가 불가능해 프리캐시 효익이 0이고, 1.4MB 워커 파일이 원자적 `addAll`에 들어가면 SW 설치 실패 위험만 생김. jszip/sheetjs/html2pdf도 프리캐시하지 않는 기존 선례와 동일 |
| `CLAUDE.md` | 일괄등록 탭 설명(PDF 소스), 파서 함수 위치, CDN 목록에 pdf.js 추가 |

---

## 8. 에러 처리

| 상황 | 감지 | 사용자 메시지 | 후속 |
|------|------|---------------|------|
| pdf.js 미로드 | `!window.pdfjsLib` | "PDF 라이브러리가 로드되지 않았습니다. 새로고침 후 다시 시도" | 버튼 비활성 |
| PDF 아님/손상 | `getDocument` reject | 파일명 + "읽을 수 없는 PDF" | 해당 파일만 제외, 나머지 진행 |
| 암호화 | `err.name === 'PasswordException'` | "암호가 걸린 PDF입니다" | 제외 |
| 텍스트 없음 | `charCount === 0` | 행 배지 `텍스트 없음(스캔본)` | 수동 입력 |
| 필수값 미인식 | `warnings` | 행 배지 | 수동 입력, 등록 시 날짜/금액 재검증 |
| 중복 의심 | `_dup` | 행 배지 + 선택 해제 | 사용자가 체크하면 등록 가능 |
| insert 실패 | `error` | "등록 오류: " + message | 상태 유지(preview) |
| 증빙 업로드 일부 실패 | `allSettled rejected` | done 화면 실패 목록 | 집행내역 탭에서 재첨부 |
| RLS 오류 | — | 일괄 등록은 `등록 오류: {message}` 그대로(기존 일괄등록과 동일), 단건 폼은 기존 RLS 안내 유지 | — |

---

## 9. 보안·개인정보

- 파싱·미리보기 전 과정이 브라우저 안에서 완결. 네트워크로 나가는 것은 (a) 등록 데이터 (b) 증빙 PDF 업로드(기존과 동일 버킷)뿐
- 계좌번호: `acctOut`/`acctIn`은 라벨 소비용으로만 매칭, 결과 객체·state·로그에 미포함. `lines` 배열을 `console.log`하지 않음
- `description`·`recipient`는 사용자가 기존에도 입력하던 필드 범위
- CSP: 신규 출처 없음(jsdelivr 기존 허용), `worker-src`만 추가. `connect-src` 변경 없음(PDF는 로컬 파일)

---

## 10. 구현 순서 (Do)

| 순서 | 작업 | 위치 | 확인 |
|:----:|------|------|------|
| 1 | pdf.js 스크립트 태그 + `workerSrc` 설정 | head, CONFIG 아래 | 콘솔 `pdfjsLib.version === '3.11.174'` |
| 2 | `DEPOSIT_PDF_LABELS`, `extractPdfTextLines`, `parseDepositConfirmation`, `findDuplicateExecution`, `pickTransferDocName`(컴포넌트 내부, `getRequiredDocuments` 아래) | ~line 3408 뒤 / ~5160 | 콘솔에서 샘플 File로 파싱 → §3.4 결과 |
| 3 | 신규 state 4개 + ref 1개 | ~line 5066, ~5013 | — |
| 4 | import 탭: 소스 선택 + PDF 업로드 단계 + `handleDepositPdfFiles` | ~line 9558 | 5장 업로드 → preview |
| 5 | 미리보기: `_kind` 분기, PDF 행 편집 입력, 배지, 수수료 행 연동 | ~line 9630~9800 | 표 렌더 |
| 6 | 등록 핸들러: `.select()`, 증빙 업로드, `executionDocsMap` 병합, `bulkRegisterResult`, done 화면 | ~line 9680, ~9805 | 등록 후 집행내역 탭에서 증빙 확인 |
| 7 | 단건 폼: 버튼 + `handleFormPdfAutofill` + 증빙 슬롯 연동 + 수수료 추가 등록 확인 + 초기화 | ~line 9212, ~9330, ~9468, ~9520 | 자동입력·첨부·수수료 |
| 8 | 집행내역 탭 기타 첨부 표시 | ~line 10620 | 폴백 문서 노출 |
| 9 | `vercel.json` worker-src, `service-worker.js` ASSETS, `CLAUDE.md` | — | 배포 후 CSP 로그 |
| 10 | 엑셀 경로·단건 폼·집행내역 회귀 확인 | — | §11 |

예상 규모: index.html +350~420줄.

---

## 11. 영향 범위 및 테스트 시나리오 (Check 기준)

### 11.1 영향 없는 기능 (회귀 확인)
- 엑셀 일괄등록: 헤더 매핑·행 편집·등록 결과 동일. 차이 2건 — 성공 `alert('N건 일괄 등록 완료!')`가 done 화면 텍스트로 대체, 기본 소스가 `pdf`라 엑셀은 토글 1회 필요. BOM 없는 UTF-8 CSV 한글 깨짐은 기존 현상(SheetJS latin1 해석, 범위 외)
- 단건 등록 폼: PDF 버튼을 쓰지 않으면 기존과 동일 (`formPdfEvidence === null` 경로)
- 집행내역 탭: 필요 증빙 목록·경고 배너·편집·삭제 동일, 기타 첨부 블록은 해당 문서가 있을 때만 렌더

### 11.2 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| T1 | 샘플 PDF 1장 업로드 | 본 행 `2026-09-18 / 96,968 / 수취인 / 인천캠페인0917 / 계좌이체` + 수수료 행 `500 / 신한은행 / 이체수수료 · 인천캠페인0917`, 배지 `📎 PDF`, `🏦 카카오뱅크`, 경고 없음 |
| T2 | 5장 동시 업로드 | 진행률 표시 후 본 행 5 + 수수료 행 ≤5, 순서 = 파일 순서 |
| T3 | 본 행 소분류·항목 선택 | 연동된 수수료 행 select 자동 동기화; 수수료 행 직접 변경 후 본 행 변경 시 미동기화 |
| T4 | 등록 | `budget_executions` n건 insert, 각 건에 `documents` 1건(문서명 §6.1), 집행내역 탭에서 즉시 ✅ 표시·다운로드 |
| T5 | 같은 PDF 재업로드 | `⚠ 중복 의심 (기존 건 …)` + 선택 해제; 체크 후 등록 가능 |
| T6 | 이미지로 인쇄한 PDF | `⚠ 텍스트 없음(스캔본)` 행, 날짜·금액 입력 후 등록 가능, PDF는 증빙 첨부됨 |
| T7 | PDF 아닌 파일 섞어 업로드 | 해당 파일만 오류 목록, 나머지 정상 |
| T8 | 단건 폼 자동입력 | 4개 필드 + 결제방법 채움, 항목 선택 시 이체 증빙 슬롯에 파일명 표시, 등록 후 수수료 추가 등록 confirm → 2건 등록·증빙 2건 |
| T9 | 단건 폼에서 같은 슬롯에 수동 첨부도 한 경우 | 수동 첨부 우선, 자동 PDF는 업로드하지 않음 |
| T10 | 엑셀 일괄등록 | 기존과 동일 결과, 증빙 없음 |
| T11 | 콘솔·네트워크 | 계좌번호 로그 없음, Supabase 외 요청 없음(jsdelivr 스크립트 제외) |
| T12 | Vercel 배포 | CSP 위반 없음, 워커 정상(콘솔에 "fake worker" 경고 없음) |

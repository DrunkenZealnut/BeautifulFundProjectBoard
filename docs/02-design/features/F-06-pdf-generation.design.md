# F-06 PDF 직접 생성 Design

> **Created**: 2026-03-18
> **Plan Reference**: `docs/01-plan/features/F-06-pdf-generation.plan.md`
> **Level**: Starter (단일 파일 SPA)

---

## Goal

기존 `window.print()` 기반 보고서(정산보고서, 월별 명세서, 급여지급명세서)에 PDF 직접 다운로드 버튼을 추가한다. html2pdf.js CDN을 사용하여 기존 HTML 생성 코드를 그대로 재활용한다. 기존 인쇄 기능은 하위호환으로 유지한다.

---

## How It Works

```text
사용자 흐름:
예산관리 페이지 → 보고서 버튼 영역
  → 기존 '📄 정산보고서' 버튼 옆에 '📥 PDF' 버튼 추가
  → 클릭 시 html2pdf.js로 HTML → PDF 변환 → .pdf 자동 다운로드
  → 기존 인쇄 버튼은 그대로 유지
```

---

## Implementation Design

### 1. CDN 추가

**위치**: `index.html` `<head>` 영역, 기존 CDN 스크립트 뒤 (Google APIs 다음)

```html
<!-- html2pdf.js: HTML → PDF 직접 다운로드 -->
<script src="https://cdn.jsdelivr.net/npm/html2pdf.js@0.10.1/dist/html2pdf.bundle.min.js"></script>
```

### 2. generatePDF() 유틸리티 함수

**위치**: 최상위 스코프, `generateNewsletterHTML()` 함수 아래 (LoginPage 바로 위)

**시그니처**:
```javascript
const generatePDF = (htmlContent, filename) => {
    // htmlContent: 기존 HTML 생성 함수의 반환값 재사용
    // filename: 다운로드 파일명 (예: '정산보고서_2026-03-18.pdf')
    // html2pdf.js가 로드되지 않았을 때 fallback으로 기존 인쇄 방식 사용
};
```

**구현**:
```javascript
const generatePDF = (htmlContent, filename) => {
    if (typeof html2pdf === 'undefined') {
        alert('PDF 라이브러리가 로드되지 않았습니다. 인쇄 기능을 이용해주세요.');
        return;
    }
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    // no-print 요소 제거 (인쇄/닫기 버튼)
    container.querySelectorAll('.no-print').forEach(el => el.remove());
    document.body.appendChild(container);
    html2pdf().set({
        margin: 10,
        filename: filename,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(container).save().then(() => {
        document.body.removeChild(container);
    }).catch(() => {
        document.body.removeChild(container);
        alert('PDF 생성 중 오류가 발생했습니다. 인쇄 기능을 이용해주세요.');
    });
};
```

### 3. 정산보고서 PDF 버튼

**위치**: 예산관리 페이지, 기존 `📄 정산보고서` 버튼 바로 옆

기존 정산보고서 버튼의 onClick 내부에서 HTML을 생성하는 로직이 인라인으로 되어 있다.
PDF 버튼은 동일한 HTML을 생성하되, `window.open` 대신 `generatePDF()`를 호출한다.

**변경 방식**: 기존 정산보고서 HTML 생성 로직을 `getSettlementReportHTML()` 헬퍼로 추출한 뒤, 인쇄 버튼과 PDF 버튼이 동일한 HTML을 공유하도록 리팩토링한다.

```javascript
// 헬퍼 함수 (renderBudget 내부)
const getSettlementReportHTML = () => {
    const totalBudget = CONFIG.TOTAL_BUDGET;
    const totalSpent = (data?.budgetExecutions || []).reduce((s, e) => s + (e.amount || 0), 0);
    const rows = /* 기존 rows 생성 로직 */;
    return `<!DOCTYPE html>...`; // 기존 HTML 그대로
};

// 기존 인쇄 버튼 (수정)
onClick={() => {
    const printWin = window.open('', '_blank');
    printWin.document.write(getSettlementReportHTML());
    printWin.document.close();
    printWin.print();
}}

// 새 PDF 버튼
<button onClick={() => {
    const html = getSettlementReportHTML();
    const date = new Date().toISOString().split('T')[0];
    generatePDF(html, `정산보고서_${date}.pdf`);
}}>📥 PDF</button>
```

### 4. 월별 명세서 PDF 버튼

**위치**: 기존 `📋 월별 명세서` 버튼 옆

동일한 패턴: 기존 월별 명세서 HTML 생성 로직을 `getMonthlyReportHTML()` 헬퍼로 추출, 인쇄와 PDF에서 공유.

```javascript
const getMonthlyReportHTML = () => {
    // 기존 monthly grouping + HTML 생성 로직 추출
    return html;
};

// 새 PDF 버튼
<button onClick={() => {
    const html = getMonthlyReportHTML();
    const date = new Date().toISOString().split('T')[0];
    generatePDF(html, `월별명세서_${date}.pdf`);
}}>📥 PDF</button>
```

### 5. 급여지급명세서 PDF 버튼

**위치**: 기존 `📄 급여지급명세서 생성` 버튼의 인쇄 창 내부, 또는 인쇄 버튼 옆에 추가

급여지급명세서는 이미 `generateSalaryStatementHTML()` 최상위 함수로 분리되어 있으므로, 인쇄 팝업의 "🖨️ 인쇄 / PDF 저장" 버튼 옆에 "📥 PDF 다운로드" 버튼을 추가하는 방식이 자연스럽다.

**방식 A (팝업 내 버튼)**: 생성된 HTML 내에 PDF 다운로드 버튼 인라인 추가. 단, 팝업 창에서 `html2pdf`가 로드되지 않으므로 이 방식은 불가.

**방식 B (메인 페이지 버튼) — 선택**: 집행내역 행의 급여명세서 버튼 옆에 `📥 PDF` 버튼 추가. 메인 페이지에서 `generateSalaryStatementHTML()`로 HTML을 생성하고 `generatePDF()`로 변환.

```javascript
// 집행내역 행 내부 (급여명세서 버튼 영역)
<button onClick={() => {
    const html = generateSalaryStatementHTML(exec, data.budgetExecutions, orgSettings, recipientProfile);
    generatePDF(html, `급여지급명세서_${exec.recipient || ''}_${exec.execution_date || ''}.pdf`);
}}>📥 PDF</button>
```

### ~~6. 기존 인쇄 창의 PDF 버튼 업그레이드~~ (제외)

> 메인 페이지에서 PDF 다운로드 가능하므로 인쇄 창 내부 PDF 버튼은 실용적 가치가 낮아 제외.

---

## Implementation Order

| Step | Task | FR | Estimated Lines |
|------|------|----|:---------------:|
| 1 | html2pdf.js CDN `<script>` 태그 추가 | FR-01 | 1 |
| 2 | `generatePDF()` 유틸리티 함수 추가 (최상위 스코프) | FR-01 | ~20 |
| 3 | 정산보고서: HTML 생성 로직 → `getSettlementReportHTML()` 추출 + PDF 버튼 | FR-02 | ~15 |
| 4 | 월별 명세서: HTML 생성 로직 → `getMonthlyReportHTML()` 추출 + PDF 버튼 | FR-03 | ~15 |
| 5 | 급여지급명세서: 집행내역 행에 PDF 버튼 추가 | FR-04 | ~5 |
| 6 | 인쇄 창 HTML에 html2pdf CDN + PDF 버튼 추가 (4개 보고서) | FR-02~04 | ~30 |

**총 예상 추가 코드**: ~90줄 (리팩토링 포함)

---

## Data Flow

```text
기존 인쇄 흐름 (유지):
  onClick → HTML string 생성 → window.open → document.write → print()

새 PDF 흐름 (추가):
  onClick → 동일한 HTML string 생성 → generatePDF(html, filename)
                                        ├── document.createElement('div')
                                        ├── .no-print 요소 제거
                                        ├── html2pdf().from(el).save()
                                        └── cleanup (removeChild)

인쇄 창 내 PDF 버튼:
  버튼 클릭 → body clone → .no-print 제거 → html2pdf().from(el).save()
```

---

## Completion Checklist

- [ ] html2pdf.js CDN이 정상 로드되는가 (`window.html2pdf` 확인)
- [ ] `generatePDF()` 함수가 html2pdf 미로드 시 안내 메시지를 표시하는가
- [ ] 정산보고서 `📥 PDF` 버튼이 .pdf 파일을 자동 다운로드하는가
- [ ] 월별 명세서 `📥 PDF` 버튼이 정상 동작하는가
- [ ] 급여지급명세서 `📥 PDF` 버튼이 정상 동작하는가
- [ ] 기존 `📄 정산보고서` / `📋 월별 명세서` 인쇄 버튼이 그대로 동작하는가 (하위호환)
- [ ] 인쇄 창 내 PDF 버튼이 동작하는가
- [ ] PDF 파일이 A4 크기로 생성되는가
- [ ] PDF에 한글 텍스트가 정상 렌더링되는가 (html2canvas 방식)
- [ ] 기존 페이지(대시보드, 일정 등) 정상 동작 확인

---

## Notes

- **리팩토링 핵심**: 정산보고서·월별 명세서의 인라인 HTML 생성 로직을 헬퍼 함수로 추출하여 인쇄와 PDF가 동일 HTML을 공유
- **한글 폰트**: html2pdf.js는 내부적으로 html2canvas를 사용하여 화면을 이미지로 캡처 → 폰트 임베딩 불필요
- **인쇄 창 PDF**: 별도 창에서도 PDF 다운로드가 가능하도록 html2pdf CDN을 인쇄 HTML 내에 인라인 포함
- **기관 직인**: `orgSettings.org_seal` 이미 HTML에 포함되므로 html2canvas가 자동 캡처
- **에러 처리**: CDN 로드 실패 시 인쇄 기능으로 fallback, PDF 생성 실패 시 사용자 안내

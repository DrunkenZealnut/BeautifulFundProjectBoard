# F-11 HWPX 내보내기 기능 Design

> **Created**: 2026-03-18
> **Plan Reference**: `docs/01-plan/features/F-11-hwpx-export.plan.md`
> **Level**: Starter (단일 파일 SPA)

---

## Goal

보고서 데이터를 OWPML XML로 변환하고, JSZip(이미 CDN 로드됨)으로 패키징하여 .hwpx 파일을 클라이언트 사이드에서 직접 생성·다운로드한다. 추가 CDN이나 서버 불필요.

---

## How It Works

```text
사용자 흐름:
예산관리 → 정산보고서 영역 → 📄 HWPX 버튼 클릭
  → 집행 데이터를 OWPML XML 단락/표로 변환
  → JSZip으로 HWPX ZIP 구조 생성 (mimetype, header.xml, section0.xml 등)
  → Blob → URL.createObjectURL → 자동 다운로드
  → 한/글에서 .hwpx 파일 열기
```

---

## Implementation Design

### 1. generateHWPX() 유틸리티 함수

**위치**: 최상위 스코프, `generatePDF()` 함수 아래

**시그니처**:
```javascript
const generateHWPX = async (title, sections, filename) => {
    // title: 문서 제목 (예: '정산보고서')
    // sections: [{ type: 'paragraph'|'table', content: ... }]
    // filename: 다운로드 파일명 (예: '정산보고서_2026-03-18.hwpx')
};
```

**sections 데이터 구조**:
```javascript
// 단락 (paragraph)
{ type: 'paragraph', text: '아름다운재단 정산보고서', bold: true, fontSize: 18 }

// 표 (table)
{ type: 'table', headers: ['집행일', '카테고리', '금액'], rows: [['2026-01-15', '교육', '500,000']] }
```

### 2. HWPX ZIP 내부 파일 구조

```text
[JSZip으로 생성]
├── mimetype                          ← "application/hwp+zip" (비압축 STORE)
├── META-INF/
│   └── container.xml                 ← rootfile 경로 지정
├── Contents/
│   ├── content.hpf                   ← OPF manifest (파일 목록)
│   ├── header.xml                    ← 문서 설정 (용지, 여백, 글자/문단 모양)
│   └── section0.xml                  ← 본문 (단락, 표)
└── version.xml                       ← OWPML 버전 정보
```

### 3. 각 XML 파일 내용

#### mimetype (비압축)
```text
application/hwp+zip
```

#### version.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hv:HWPVersion xmlns:hv="http://www.hancom.co.kr/hwpml/2011/version"
  major="1" minor="2" micro="0" buildnum="0" />
```

#### META-INF/container.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="Contents/content.hpf" media-type="application/hwpml-package+xml"/>
  </rootfiles>
</container>
```

#### Contents/content.hpf
```xml
<?xml version="1.0" encoding="UTF-8"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0" unique-identifier="bookid">
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>
```

#### Contents/header.xml
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hh:head xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"
         xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph">
  <hh:beginNum page="1" footnote="1" endnote="1"/>
  <hh:refList>
    <hh:fontfaces>
      <hh:fontface lang="HANGUL"><hh:font id="0" face="함초롬돋움" type="TTF"/></hh:fontface>
      <hh:fontface lang="LATIN"><hh:font id="0" face="함초롬돋움" type="TTF"/></hh:fontface>
    </hh:fontfaces>
    <hh:charProperties>
      <!-- id=0: 기본 본문 글자 (10pt) -->
      <hh:charPr id="0" height="1000" bold="0"/>
      <!-- id=1: 제목 글자 (18pt, bold) -->
      <hh:charPr id="1" height="1800" bold="1"/>
      <!-- id=2: 소제목 (14pt, bold) -->
      <hh:charPr id="2" height="1400" bold="1"/>
    </hh:charProperties>
    <hh:paraProperties>
      <hh:paraPr id="0" align="JUSTIFY">
        <hh:spacing line="160" lineType="PERCENT"/>
      </hh:paraPr>
      <hh:paraPr id="1" align="CENTER">
        <hh:spacing line="160" lineType="PERCENT"/>
      </hh:paraPr>
    </hh:paraProperties>
  </hh:refList>
  <hh:secProperties>
    <hh:secPr textDirection="HORIZONTAL" spaceColumns="1134">
      <hh:pageSize width="59528" height="84188"/>  <!-- A4: 210mm x 297mm -->
      <hh:pageMar header="4252" footer="4252"
        left="4252" right="4252" top="5668" bottom="4252"/>
    </hh:secPr>
  </hh:secProperties>
</hh:head>
```

#### Contents/section0.xml (동적 생성)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hs:sec xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section"
        xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
        xmlns:ht="http://www.hancom.co.kr/hwpml/2011/table">

  <!-- 제목 단락 -->
  <hp:p paraPrIDRef="1" styleIDRef="0">
    <hp:run charPrIDRef="1"><hp:t>정산보고서</hp:t></hp:run>
  </hp:p>

  <!-- 본문 단락 -->
  <hp:p paraPrIDRef="0" styleIDRef="0">
    <hp:run charPrIDRef="0"><hp:t>총 예산: 70,000,000원</hp:t></hp:run>
  </hp:p>

  <!-- 표 -->
  <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0">
    <hp:tbl colCnt="3" rowCnt="2" cellSpacing="0" borderFill="1">
      <hp:tr><hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>집행일</hp:t></hp:run></hp:p></hp:tc>
             <hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>항목</hp:t></hp:run></hp:p></hp:tc>
             <hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>금액</hp:t></hp:run></hp:p></hp:tc></hp:tr>
      <hp:tr><hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>2026-01-15</hp:t></hp:run></hp:p></hp:tc>
             <hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>교육</hp:t></hp:run></hp:p></hp:tc>
             <hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>500,000</hp:t></hp:run></hp:p></hp:tc></hp:tr>
    </hp:tbl>
  </hp:run></hp:p>

</hs:sec>
```

### 4. generateHWPX() 구현 핵심 로직

```javascript
const generateHWPX = async (title, sections, filename) => {
    if (!window.JSZip) { alert('JSZip 라이브러리가 로드되지 않았습니다.'); return; }
    const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    // Build section0.xml from sections array
    let bodyXml = '';
    sections.forEach(sec => {
        if (sec.type === 'paragraph') {
            const charRef = sec.bold ? (sec.fontSize >= 16 ? '1' : '2') : '0';
            const paraRef = sec.align === 'center' ? '1' : '0';
            bodyXml += `<hp:p paraPrIDRef="${paraRef}"><hp:run charPrIDRef="${charRef}"><hp:t>${esc(sec.text)}</hp:t></hp:run></hp:p>\n`;
        } else if (sec.type === 'table') {
            const colCnt = sec.headers.length;
            const rowCnt = sec.rows.length + 1;
            let tblXml = `<hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:tbl colCnt="${colCnt}" rowCnt="${rowCnt}">`;
            // Header row
            tblXml += '<hp:tr>' + sec.headers.map(h =>
                `<hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>${esc(h)}</hp:t></hp:run></hp:p></hp:tc>`
            ).join('') + '</hp:tr>';
            // Data rows
            sec.rows.forEach(row => {
                tblXml += '<hp:tr>' + row.map(cell =>
                    `<hp:tc><hp:p><hp:run charPrIDRef="0"><hp:t>${esc(cell)}</hp:t></hp:run></hp:p></hp:tc>`
                ).join('') + '</hp:tr>';
            });
            tblXml += '</hp:tbl></hp:run></hp:p>\n';
            bodyXml += tblXml;
        }
    });

    const section0 = `<?xml version="1.0" encoding="UTF-8"?>\n<hs:sec xmlns:hs="..." xmlns:hp="...">\n${bodyXml}</hs:sec>`;

    // Package with JSZip
    const zip = new JSZip();
    zip.file('mimetype', 'application/hwp+zip', { compression: 'STORE' });
    zip.file('version.xml', VERSION_XML);
    zip.file('META-INF/container.xml', CONTAINER_XML);
    zip.file('Contents/content.hpf', CONTENT_HPF);
    zip.file('Contents/header.xml', HEADER_XML);
    zip.file('Contents/section0.xml', section0);

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
```

### 5. 보고서별 HWPX 버튼 + 데이터 변환

#### 정산보고서

```javascript
// 기존 📥 PDF 버튼 옆에 추가
<button onClick={() => {
    const execs = data?.budgetExecutions || [];
    const totalBudget = CONFIG.TOTAL_BUDGET;
    const totalSpent = execs.reduce((s, e) => s + (e.amount || 0), 0);
    generateHWPX('정산보고서', [
        { type: 'paragraph', text: '아름다운재단 2026 공익단체 인큐베이팅 지원사업 정산보고서', bold: true, fontSize: 18, align: 'center' },
        { type: 'paragraph', text: `총 예산: ${fmt(totalBudget)}원 | 총 집행: ${fmt(totalSpent)}원 | 집행률: ${pct(totalSpent, totalBudget)}%` },
        { type: 'table',
          headers: ['집행일', '카테고리', '소분류', '항목', '금액', '결제방법', '수취인', '상태'],
          rows: execs.map(e => [e.execution_date, e.category_name, e.subcategory_name, e.budget_item_name, fmt(e.amount||0)+'원', e.payment_method, e.recipient||'', EXECUTION_STATUS[e.status]?.label||e.status])
        }
    ], `정산보고서_${formatLocalDate()}.hwpx`);
}}>📄 HWPX</button>
```

#### 월별 명세서

동일 패턴 — 월별 그룹핑 후 sections 배열로 변환 (월별 소제목 + 월별 표).

#### 뉴스레터

`renderNewsletter` 내부에 📄 HWPX 버튼 추가. 선택된 일정/게시글을 sections으로 변환.

---

## Implementation Order

| Step | Task | FR | Estimated Lines |
|------|------|----|:---------------:|
| 1 | OWPML XML 상수 정의 (header.xml, version.xml 등 5개) | FR-01, FR-05 | ~60 |
| 2 | `generateHWPX(title, sections, filename)` 유틸리티 함수 | FR-01, FR-06 | ~50 |
| 3 | 정산보고서 📄 HWPX 버튼 + 데이터 변환 | FR-02 | ~10 |
| 4 | 월별 명세서 📄 HWPX 버튼 + 데이터 변환 | FR-03 | ~15 |
| 5 | 뉴스레터 📄 HWPX 버튼 + 데이터 변환 | FR-04 | ~10 |

**총 예상 추가 코드**: ~145줄

---

## Data Flow

```text
data.budgetExecutions ──┐
                        ├── sections 배열로 변환 (paragraph + table)
CONFIG.TOTAL_BUDGET ────┘
        │
        ▼
generateHWPX(title, sections, filename)
        │
        ├── OWPML XML 문자열 생성 (section0.xml)
        ├── 정적 XML 상수 (header.xml, version.xml, content.hpf 등)
        ├── JSZip으로 ZIP 패키징
        ├── zip.generateAsync({ type: 'blob' })
        └── URL.createObjectURL → <a>.click() → 자동 다운로드
```

---

## Completion Checklist

- [ ] `generateHWPX()` 함수가 JSZip으로 유효한 .hwpx ZIP을 생성하는가
- [ ] mimetype 파일이 비압축(STORE)으로 저장되는가
- [ ] 생성된 .hwpx가 한/글 2020+에서 정상 열리는가
- [ ] 정산보고서 📄 HWPX 버튼이 올바른 내용의 파일을 다운로드하는가
- [ ] 월별 명세서 📄 HWPX 버튼이 정상 동작하는가
- [ ] 뉴스레터 📄 HWPX 버튼이 정상 동작하는가
- [ ] 표(table)의 행/열이 올바르게 렌더링되는가
- [ ] 한글 텍스트가 UTF-8로 깨지지 않는가
- [ ] A4 용지 크기 및 여백이 올바른가
- [ ] JSZip 미로드 시 안내 메시지 표시
- [ ] 기존 인쇄·PDF 버튼 정상 동작 (하위호환)
- [ ] XML 특수문자 escape 처리 (esc 함수)

---

## Notes

- **추가 CDN 없음** — JSZip 이미 로드됨, OWPML XML은 문자열로 직접 생성
- **다운로드 패턴** — 갤러리 ZIP 다운로드 (`JSZip.generateAsync` + Blob + URL.createObjectURL) 재활용
- **XML namespace** — `hs:` (section), `hp:` (paragraph), `hh:` (head), `hv:` (version)
- **한/글 호환성** — HWPX는 한/글 2014+ 지원. 최소 XML 구조로 시작하여 한/글 열기 테스트 후 점진 보강
- **OWPML 레퍼런스** — [한컴테크 HWPX 포맷 구조](https://tech.hancom.com/hwpxformat/), [NHN Cloud HWPX](https://meetup.nhncloud.com/posts/311)

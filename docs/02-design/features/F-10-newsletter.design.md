# F-10 뉴스레터 제작 기능 Design

> **Created**: 2026-03-18
> **Plan Reference**: `docs/01-plan/features/F-10-newsletter.plan.md`
> **Level**: Starter (단일 파일 SPA)

---

## Goal

일정(schedules)과 게시글(boards)을 선택하여, 인쇄 가능한 뉴스레터 HTML을 새 창에 생성한다.
기존 정산보고서·급여명세서 출력 패턴(`window.open` + `document.write` + `print()`)을 그대로 따른다.

---

## How It Works

```
사용자 흐름:
네비게이션 '📰 뉴스레터' 클릭
  → 기간 설정 (시작일·종료일)
  → 해당 기간의 일정·게시글 자동 필터링
  → 체크박스로 포함할 항목 선택
  → 제목·인사말·마무리말 입력
  → 미리보기 확인
  → '🖨️ 인쇄' 버튼 → 새 창에 뉴스레터 HTML 출력 → window.print()
```

---

## Implementation Design

### 1. 네비게이션 추가

**위치**: `index.html` line ~11003 — 네비게이션 배열

```javascript
// 기존 배열에 추가 (guide 뒤, admin 앞)
{ id: 'newsletter', label: '📰 뉴스레터', description: '일정·게시글 뉴스레터 제작' },
```

### 2. State 추가

**위치**: `ProjectManagementSystem()` 내 useState 선언부 (line ~3193 부근)

```javascript
// ===== 뉴스레터 상태 =====
const [newsletterConfig, setNewsletterConfig] = useState({
    title: '',                    // 뉴스레터 제목
    issueNumber: '',              // 발행 호수 (예: '제3호')
    publishDate: new Date().toISOString().split('T')[0],  // 발행일
    greeting: '',                 // 인사말
    closing: '',                  // 마무리말
    dateFrom: '',                 // 필터 시작일
    dateTo: '',                   // 필터 종료일
    scheduleCategory: 'all',      // 일정 카테고리 필터
    boardCategory: 'all',         // 게시판 카테고리 필터
});
const [selectedScheduleIds, setSelectedScheduleIds] = useState(new Set());
const [selectedBoardIds, setSelectedBoardIds] = useState(new Set());
```

### 3. generateNewsletterHTML() 함수

**위치**: 최상위 스코프, `generateSalaryStatementHTML()` 함수 바로 아래 (line ~2500 부근)

**시그니처**:
```javascript
const generateNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName) => {
    // config: newsletterConfig state
    // selectedSchedules: 선택된 일정 객체 배열
    // selectedBoards: 선택된 게시글 객체 배열
    // orgName: DEFAULT_ORG_NAME
    // returns: HTML string
};
```

**HTML 구조**:
```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <style>
        /* A4 인쇄 최적화 CSS */
        @page { size: A4; margin: 15mm; }
        @media print { .no-print { display: none !important; } }
        body { font-family: '맑은 고딕', sans-serif; max-width: 210mm; margin: 0 auto; }
        /* 기존 정산보고서 CSS 패턴 참고 */
    </style>
</head>
<body>
    <!-- 인쇄/닫기 버튼 (no-print) -->
    <div class="no-print">
        <button onclick="window.print()">🖨️ 인쇄</button>
        <button onclick="window.close()">✕ 닫기</button>
    </div>

    <!-- 뉴스레터 헤더 -->
    <div class="newsletter-header">
        <h1>{config.title}</h1>
        <p>{orgName} | {config.issueNumber} | {config.publishDate}</p>
    </div>

    <!-- 인사말 -->
    <div class="newsletter-greeting">{config.greeting}</div>

    <!-- 일정 섹션 (선택된 항목이 있을 때만) -->
    <section class="newsletter-section">
        <h2>📅 주요 일정</h2>
        <table>
            <thead><tr><th>날짜</th><th>제목</th><th>카테고리</th><th>장소</th></tr></thead>
            <tbody>
                <!-- selectedSchedules 루프 -->
            </tbody>
        </table>
    </section>

    <!-- 게시글 섹션 (선택된 항목이 있을 때만) -->
    <section class="newsletter-section">
        <h2>📋 주요 소식</h2>
        <!-- selectedBoards 루프: 제목 + 본문 요약/전문 -->
    </section>

    <!-- 마무리말 -->
    <div class="newsletter-closing">{config.closing}</div>

    <!-- 푸터 -->
    <div class="newsletter-footer">
        <p>{orgName} · 아름다운재단 2026 공익단체 인큐베이팅 지원사업</p>
    </div>
</body>
</html>
```

**XSS 방어**: 게시글 content 삽입 시 `DOMPurify.sanitize(board.content)` 사용.

### 4. renderNewsletter() 함수

**위치**: `ProjectManagementSystem()` 내, `renderGuide()` 함수 아래

**UI 레이아웃**:
```
┌─────────────────────────────────────────────────────────┐
│  📰 뉴스레터 제작                                        │
├───────────────────────────┬─────────────────────────────┤
│  좌측: 설정 & 콘텐츠 선택   │  우측: 미리보기              │
│                           │                             │
│  ┌─ 뉴스레터 정보 ────────┐│  ┌─────────────────────────┐│
│  │ 제목: [          ]    ││  │                         ││
│  │ 호수: [    ]          ││  │  (실시간 미리보기)        ││
│  │ 발행일: [    ]        ││  │                         ││
│  │ 인사말: [          ]  ││  │  뉴스레터 제목            ││
│  │ 마무리말: [        ]  ││  │  인사말...               ││
│  └───────────────────────┘│  │                         ││
│                           │  │  📅 주요 일정             ││
│  ┌─ 기간 필터 ───────────┐│  │  ┌──────────────────┐   ││
│  │ 시작일~종료일          ││  │  │ 표 형태 일정      │   ││
│  └───────────────────────┘│  │  └──────────────────┘   ││
│                           │  │                         ││
│  ┌─ 📅 일정 선택 ────────┐│  │  📋 주요 소식             ││
│  │ [전체선택] 카테고리필터 ││  │  게시글 제목+내용...      ││
│  │ ☑ 일정1 (03-01 교육)  ││  │                         ││
│  │ ☐ 일정2 (03-05 회의)  ││  │  마무리말...             ││
│  │ ☑ 일정3 (03-10 캠페인)││  │                         ││
│  └───────────────────────┘│  └─────────────────────────┘│
│                           │                             │
│  ┌─ 📋 게시글 선택 ──────┐│  ┌─────────────────────────┐│
│  │ [전체선택] 유형필터    ││  │ [🖨️ 인쇄하기]            ││
│  │ ☑ 공지: 제목1         ││  └─────────────────────────┘│
│  │ ☐ 자료: 제목2         ││                             │
│  │ ☑ 보고서: 제목3       ││                             │
│  └───────────────────────┘│                             │
└───────────────────────────┴─────────────────────────────┘
```

**세부 구현**:

#### 4-1. 기간 필터 영역
```jsx
<div className="schedule-form-group">
    <label>기간 선택</label>
    <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={newsletterConfig.dateFrom}
            onChange={e => setNewsletterConfig(p => ({...p, dateFrom: e.target.value}))} />
        <span>~</span>
        <input type="date" value={newsletterConfig.dateTo}
            onChange={e => setNewsletterConfig(p => ({...p, dateTo: e.target.value}))} />
    </div>
</div>
```

#### 4-2. 일정 필터링 로직
```javascript
const filteredSchedules = data.schedules.filter(s => {
    // 기간 필터
    if (newsletterConfig.dateFrom && s.start_date < newsletterConfig.dateFrom) return false;
    if (newsletterConfig.dateTo && s.start_date > newsletterConfig.dateTo) return false;
    // 카테고리 필터
    if (newsletterConfig.scheduleCategory !== 'all' && s.category !== newsletterConfig.scheduleCategory) return false;
    return true;
});
```

#### 4-3. 게시글 필터링 로직
```javascript
const filteredBoards = data.boards.filter(b => {
    // 기간 필터 (created_at 기준)
    const createdDate = b.created_at?.split('T')[0];
    if (newsletterConfig.dateFrom && createdDate < newsletterConfig.dateFrom) return false;
    if (newsletterConfig.dateTo && createdDate > newsletterConfig.dateTo) return false;
    // 유형 필터
    if (newsletterConfig.boardCategory !== 'all' && b.board_type !== newsletterConfig.boardCategory) return false;
    return true;
});
```

#### 4-4. 체크박스 선택 로직
```javascript
// 개별 토글
const toggleSchedule = (id) => {
    setSelectedScheduleIds(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
    });
};

// 전체 선택/해제
const toggleAllSchedules = () => {
    if (selectedScheduleIds.size === filteredSchedules.length) {
        setSelectedScheduleIds(new Set());
    } else {
        setSelectedScheduleIds(new Set(filteredSchedules.map(s => s.id)));
    }
};
// 게시글도 동일 패턴
```

#### 4-5. 미리보기 영역
```jsx
<div style={{ border: '1px solid #EBE8E1', borderRadius: 12, padding: 24, background: '#fff', minHeight: 400 }}>
    {/* 실시간 미리보기 — 선택된 항목 기반으로 렌더링 */}
    <h2 style={{ textAlign: 'center' }}>{newsletterConfig.title || '뉴스레터 제목'}</h2>
    <p style={{ textAlign: 'center', color: '#666' }}>
        {DEFAULT_ORG_NAME} | {newsletterConfig.issueNumber} | {newsletterConfig.publishDate}
    </p>
    {newsletterConfig.greeting && <p>{newsletterConfig.greeting}</p>}

    {/* 선택된 일정 */}
    {selectedScheduleIds.size > 0 && (
        <>
            <h3>📅 주요 일정</h3>
            <table>...</table>
        </>
    )}

    {/* 선택된 게시글 */}
    {selectedBoardIds.size > 0 && (
        <>
            <h3>📋 주요 소식</h3>
            {/* 게시글 제목 + 200자 요약 */}
        </>
    )}

    {newsletterConfig.closing && <p>{newsletterConfig.closing}</p>}
</div>
```

#### 4-6. 인쇄 버튼 핸들러
```javascript
const handlePrintNewsletter = () => {
    const selSchedules = data.schedules.filter(s => selectedScheduleIds.has(s.id));
    const selBoards = data.boards.filter(b => selectedBoardIds.has(b.id));

    if (selSchedules.length === 0 && selBoards.length === 0) {
        alert('뉴스레터에 포함할 항목을 선택해주세요.');
        return;
    }

    const html = generateNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME);
    const pw = window.open('', '_blank', 'width=900,height=700');
    pw.document.write(html);
    pw.document.close();
};
```

### 5. renderContent() switch 추가

**위치**: line ~10958

```javascript
case "newsletter": return renderNewsletter();
```

### 6. CSS 추가 불필요

기존 `.schedule-form-group`, `.btn`, `.btn-primary`, `table` 등 스타일 클래스 재사용.
뉴스레터 출력 HTML은 인라인 스타일 포함 (기존 정산보고서 패턴).

---

## Implementation Order

| Step | Task | FR Reference | Estimated Lines |
|------|------|-------------|-----------------|
| 1 | `generateNewsletterHTML()` 함수 추가 (최상위 스코프) | FR-08 | ~120줄 |
| 2 | 뉴스레터 관련 `useState` 선언 추가 | FR-01~06 | ~15줄 |
| 3 | `renderNewsletter()` 함수 구현 | FR-02~07, FR-09~10 | ~250줄 |
| 4 | 네비게이션 배열에 newsletter 항목 추가 | FR-01 | ~1줄 |
| 5 | `renderContent()` switch에 newsletter case 추가 | FR-01 | ~1줄 |

**총 예상 추가 코드**: ~390줄

---

## Data Flow

```
data.schedules (기존 state)──┐
                              ├── 기간·카테고리 필터 ── filteredSchedules
                              │                         ├── 체크박스 UI
                              │                         └── selectedScheduleIds (Set)
                              │
data.boards (기존 state)──────┤
                              ├── 기간·유형 필터 ── filteredBoards
                              │                     ├── 체크박스 UI
                              │                     └── selectedBoardIds (Set)
                              │
newsletterConfig (new state)──┤
                              │
                              └── handlePrintNewsletter()
                                    ├── generateNewsletterHTML(config, schedules, boards, orgName)
                                    └── window.open() + document.write() + close()
```

---

## Completion Checklist

- [ ] `generateNewsletterHTML()` 함수가 올바른 HTML을 반환하는가
- [ ] 네비게이션에 '📰 뉴스레터' 버튼이 표시되는가
- [ ] 기간 필터가 일정·게시글을 올바르게 필터링하는가
- [ ] 체크박스 선택/해제가 정상 작동하는가 (개별 + 전체)
- [ ] 미리보기에 선택된 항목이 실시간 반영되는가
- [ ] 인쇄 버튼으로 새 창에 뉴스레터 HTML이 출력되는가
- [ ] A4 인쇄 시 레이아웃이 정상인가 (@media print)
- [ ] 게시글 HTML content가 DOMPurify로 sanitize 되는가
- [ ] 항목 0개 선택 시 안내 메시지가 표시되는가
- [ ] 기존 페이지(대시보드, 예산 등)가 정상 동작하는가
- [ ] 데스크톱·모바일 반응형이 작동하는가

---

## Notes

- **DB 변경 없음** — 기존 `schedules`, `boards` 테이블만 읽기 사용
- **추가 CDN 없음** — 기존 로드된 DOMPurify만 활용
- **인쇄 패턴** — `generateSalaryStatementHTML()` (line ~2234)와 정산보고서 (line ~8642) 참고
- 게시글 본문이 HTML(`<p>`, `<b>` 등)일 수 있으므로 미리보기에서는 200자 텍스트 요약, 인쇄 출력에서는 DOMPurify sanitize 후 전문 포함

import { useState, useEffect, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────
const BUDGET_DATA = {
  projectName: "2026 공익단체 인큐베이팅 지원사업",
  organization: "청년노동자인권센터",
  totalBudget: 70000000,
  period: "2026.01 ~ 2026.12",
  categories: [
    {
      id: "business",
      name: "사업비",
      budget: 30300000,
      subcategories: [
        {
          id: "textbook",
          name: "노동안전보건 교과서",
          budget: 9100000,
          items: [
            { id: "tb-1", name: "자문비", budget: 2500000, type: "자문비", desc: "세미나 4회, 자문 10회" },
            { id: "tb-2", name: "사업인건비(인터뷰)", budget: 1000000, type: "사업인건비", desc: "인터뷰 10회" },
            { id: "tb-3", name: "사업인건비(원고료)", budget: 5000000, type: "사업인건비", desc: "연구팀 교과서 분석 및 집필" },
            { id: "tb-4", name: "사업회의비", budget: 600000, type: "사업회의비", desc: "6회 × 5명 × 20,000원" },
          ],
        },
        {
          id: "app",
          name: "노동안전보건 APP",
          budget: 2000000,
          items: [
            { id: "app-1", name: "자문비", budget: 1000000, type: "자문비", desc: "개발설계 자문 6회" },
            { id: "app-2", name: "시스템구축", budget: 1000000, type: "시스템구축", desc: "서버, 개발자등록, RAG" },
          ],
        },
        {
          id: "campaign",
          name: "캠페인",
          budget: 7600000,
          items: [
            { id: "cp-1", name: "자문비", budget: 900000, type: "자문비", desc: "자문 6회" },
            { id: "cp-2", name: "여비교통비", budget: 3000000, type: "여비교통비", desc: "30회 × 100,000원" },
            { id: "cp-3", name: "물품구매비", budget: 2500000, type: "물품구매비", desc: "테이블, 배너, 의자, 문구류" },
            { id: "cp-4", name: "사업회의비", budget: 1200000, type: "사업회의비", desc: "캠페인 회의" },
          ],
        },
        {
          id: "committee",
          name: "청소년 참견위원회",
          budget: 11100000,
          items: [
            { id: "cm-1", name: "자문비", budget: 600000, type: "자문비", desc: "자문 4회" },
            { id: "cm-2", name: "사업인건비", budget: 10000000, type: "사업인건비", desc: "5개 학교 운영 및 학습지원" },
            { id: "cm-3", name: "여비교통비", budget: 500000, type: "여비교통비", desc: "학교방문 5회" },
          ],
        },
        {
          id: "reserve",
          name: "예비비",
          budget: 500000,
          items: [
            { id: "rv-1", name: "예비비", budget: 500000, type: "예비비", desc: "예비비" },
          ],
        },
      ],
    },
    {
      id: "operation",
      name: "운영비",
      budget: 39700000,
      subcategories: [
        {
          id: "salary",
          name: "운영인건비",
          budget: 35248000,
          items: [
            { id: "sl-1", name: "상근활동가 인건비", budget: 30400000, type: "운영인건비", desc: "서울시생활임금 × 12개월 × 209시간" },
            { id: "sl-2", name: "단순인건비(400시간)", budget: 4848000, type: "단순인건비", desc: "서울시생활임금 × 400시간" },
          ],
        },
        {
          id: "rent",
          name: "임차료",
          budget: 660000,
          items: [
            { id: "rt-1", name: "사무실 임대료", budget: 660000, type: "임차료", desc: "55,000원 × 12개월" },
          ],
        },
        {
          id: "admin",
          name: "일반관리비",
          budget: 2232000,
          items: [
            { id: "ad-1", name: "기자재구매관리비", budget: 2232000, type: "일반관리비", desc: "클로드코드, 구글워크스페이스, n8n" },
          ],
        },
        {
          id: "training",
          name: "교육훈련비",
          budget: 1000000,
          items: [
            { id: "tr-1", name: "운영위 워크샵", budget: 1000000, type: "교육훈련비", desc: "운영위 운영비 및 워크샵" },
          ],
        },
        {
          id: "pr",
          name: "홍보비",
          budget: 560000,
          items: [
            { id: "pr-1", name: "홍보물 제작", budget: 560000, type: "홍보비", desc: "팜플렛, 명함, 피켓 등" },
          ],
        },
      ],
    },
  ],
};

// 샘플 일정 데이터
const SAMPLE_SCHEDULES = [
  {
    id: 1,
    title: "노동안전보건 교육 워크샵",
    category: "교육",
    subcategory: "노동안전보건",
    startDate: "2026-03-15",
    endDate: "2026-03-15",
    startTime: "14:00",
    endTime: "17:00",
    location: "청년노동자인권센터",
    maxParticipants: 30,
    currentParticipants: 12,
    status: "planned",
    responsiblePerson: "김담당자"
  },
  {
    id: 2,
    title: "청소년 참견위원회 1차 모임",
    category: "회의",
    subcategory: "참견위원회",
    startDate: "2026-04-10",
    endDate: "2026-04-10",
    startTime: "15:30",
    endTime: "18:00",
    location: "서울시 강남구 OO고등학교",
    maxParticipants: 25,
    currentParticipants: 8,
    status: "planned",
    responsiblePerson: "박활동가"
  }
];

// 샘플 갤러리 데이터
const SAMPLE_GALLERY = [
  {
    id: 1,
    title: "노동안전보건 교육 현장",
    description: "청년들을 대상으로 한 노동안전보건 교육 진행 모습",
    category: "현장사진",
    subcategory: "교육",
    imagePath: "/images/education-1.jpg",
    takenDate: "2026-03-15",
    location: "청년노동자인권센터",
    photographer: "김담당자",
    tags: ["교육", "노동안전", "청년"]
  },
  {
    id: 2,
    title: "캠페인 홍보물 제작 결과",
    description: "노동안전 인식 개선을 위한 캠페인 포스터 및 리플릿",
    category: "결과물",
    subcategory: "캠페인",
    imagePath: "/images/campaign-materials.jpg",
    takenDate: "2026-02-28",
    location: "디자인 스튜디오",
    photographer: "이디자이너",
    tags: ["캠페인", "홍보물", "디자인"]
  }
];

// 샘플 게시판 데이터
const SAMPLE_BOARDS = [
  {
    id: 1,
    boardType: "notice",
    title: "2026년 사업 킥오프 미팅 안내",
    content: "새해를 맞아 2026년 공익단체 인큐베이팅 지원사업의 킥오프 미팅을 다음과 같이 개최합니다...",
    category: "공지",
    authorName: "관리자",
    isPinned: true,
    viewCount: 156,
    createdAt: "2026-01-15"
  },
  {
    id: 2,
    boardType: "materials",
    title: "노동안전보건 교육 자료집 v1.0",
    content: "청년 노동자를 위한 안전보건 교육 자료집입니다. PDF 파일로 다운로드 받으실 수 있습니다.",
    category: "교육자료",
    authorName: "김담당자",
    downloadCount: 45,
    viewCount: 89,
    createdAt: "2026-02-01"
  },
  {
    id: 3,
    boardType: "faq",
    title: "사업 참여 신청은 어떻게 하나요?",
    content: "사업 참여 신청은 온라인 신청서를 작성해 주시면 됩니다. 자세한 내용은...",
    category: "참여",
    authorName: "박활동가",
    viewCount: 234,
    createdAt: "2026-01-20"
  }
];

// ─── 증빙서류 규칙 엔진 (기존과 동일)
const DOCUMENT_RULES = {
  "자문비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "통장사본", "사업자등록증"],
    always: ["참석확인서 또는 강의확인서", "지급내역서", "회의록/보고서/발제문 중 1건"],
    withholding: true,
    withholdingDocs: ["원천징수 납부내역서 (국세)", "원천징수 납부내역서 (지방세)"],
    optional: ["신분증", "통장사본 (확인서에 계좌+서명 있으면 생략 가능)"],
    notes: "외부 전문가에 한하여 지급. 내부자(대표, 임직원)에게 지급 불가.\\n1일 1회, 기본료 10만원(2시간 이내), 초과료 5만원.",
  },
  "사업인건비": {
    base: ["지출결의서"],
    card: [],
    transfer: ["계좌이체증"],
    always: ["고용 계획서 (고용목적, 기간, 인적사항)", "업무일지 또는 참여확인서", "지급내역서"],
    withholding: true,
    withholdingDocs: ["원천징수 납부내역서 (국세)", "원천징수 납부내역서 (지방세)"],
    optional: ["신분증", "통장사본"],
    notes: "반드시 계좌이체(현금 불가). 내부자에게 지급 불가.\\n주민번호 취합 필요 (다음해 2월 기타소득지급명세서 제출 시).",
  },
  // ... (다른 규칙들은 기존과 동일)
};

function getRequiredDocs(type, paymentMethod, amount) {
  const rule = DOCUMENT_RULES[type];
  if (!rule) return { docs: ["지출결의서", "영수증 또는 이체증"], notes: "" };
  let docs = [...rule.base];
  if (paymentMethod === "카드") {
    docs = [...docs, ...rule.card];
  } else {
    docs = [...docs, ...rule.transfer];
  }
  docs = [...docs, ...rule.always];
  if (amount >= 125000 && rule.withholding) {
    docs = [...docs, ...rule.withholdingDocs];
  }
  if (amount >= 1000000 && rule.over1m) {
    docs = [...docs, ...rule.over1m];
  }
  return { docs, optional: rule.optional || [], notes: rule.notes || "" };
}

function calcWithholding(grossAmount) {
  if (grossAmount <= 125000) {
    return { incomeTax: 0, localTax: 0, totalTax: 0, netAmount: grossAmount, taxable: false };
  }
  const incomeTax = Math.floor(grossAmount * 0.08);
  const localTax = Math.floor(incomeTax * 0.1);
  const totalTax = incomeTax + localTax;
  const netAmount = grossAmount - totalTax;
  return { incomeTax, localTax, totalTax, netAmount, taxable: true };
}

// ─── FORMAT & ICONS (기존과 동일)
const fmt = (n) => new Intl.NumberFormat("ko-KR").format(n);
const pct = (spent, budget) => budget === 0 ? 0 : Math.min(Math.round((spent / budget) * 100), 100);

const Icon = ({ name, size = 18 }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    list: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    file: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    calc: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
    alert: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    clip: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    folder: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    dollar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    camera: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
    message: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    map: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  };
  return icons[name] || null;
};

// ─── STYLES (확장된 스타일)
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;600&display=swap');

:root {
  --bg: #F8F6F1;
  --surface: #FFFFFF;
  --surface-alt: #F0EDE6;
  --border: #E2DED4;
  --border-light: #EBE8E1;
  --text: #1A1815;
  --text-secondary: #6B6560;
  --text-tertiary: #9C9690;
  --accent: #1B6B5A;
  --accent-light: #E8F5F0;
  --accent-dark: #134E42;
  --orange: #D4732A;
  --orange-light: #FFF3EB;
  --red: #C4382A;
  --red-light: #FDE8E5;
  --blue: #2B5EA7;
  --blue-light: #E8F0FC;
  --yellow: #B8860B;
  --yellow-light: #FFF8E1;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.08);
  --radius: 12px;
  --radius-sm: 8px;
  --radius-xs: 6px;
}

* { margin:0; padding:0; box-sizing:border-box; }

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
}

/* ── Header ── */
.header {
  background: var(--accent-dark);
  color: white;
  padding: 24px;
  border-radius: var(--radius);
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}
.header::before {
  content: '';
  position: absolute;
  top: -30px; right: -30px;
  width: 120px; height: 120px;
  border-radius: 50%;
  background: rgba(255,255,255,0.06);
}
.header-org { font-size: 12px; opacity: 0.7; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
.header-title { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
.header-period { font-size: 13px; opacity: 0.6; }

/* ── Nav ── */
.nav {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 4px;
  margin-bottom: 20px;
  border: 1px solid var(--border-light);
  flex-wrap: wrap;
}
.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}
.nav-btn:hover { background: var(--surface-alt); }
.nav-btn.active {
  background: var(--accent);
  color: white;
  box-shadow: var(--shadow-sm);
}

/* ── Cards ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s;
}
.card:hover { box-shadow: var(--shadow-md); }
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.card-title { font-size: 15px; font-weight: 600; }
.card-subtitle { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }

/* ── Progress Bars ── */
.progress-wrap { margin-top: 12px; }
.progress-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 6px;
  color: var(--text-secondary);
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--surface-alt);
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}
.progress-fill.green { background: var(--accent); }
.progress-fill.orange { background: var(--orange); }
.progress-fill.red { background: var(--red); }

/* ── Stat Grid ── */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}
.stat-box {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 16px;
  text-align: center;
}
.stat-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  color: var(--accent-dark);
}
.stat-label { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }

/* ── Gallery Grid ── */
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}
.gallery-item {
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}
.gallery-item:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.gallery-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  background: var(--surface-alt);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}
.gallery-content {
  padding: 14px;
}
.gallery-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  line-height: 1.4;
}
.gallery-meta {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}
.gallery-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}
.gallery-tag {
  background: var(--accent-light);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
}

/* ── Schedule List ── */
.schedule-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.schedule-item:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}
.schedule-date {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 16px;
  padding: 8px 12px;
  background: var(--surface-alt);
  border-radius: var(--radius-xs);
  min-width: 60px;
}
.schedule-month { font-size: 10px; color: var(--text-tertiary); }
.schedule-day { font-size: 18px; font-weight: 700; color: var(--accent); }
.schedule-info { flex: 1; min-width: 0; }
.schedule-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
.schedule-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}
.schedule-participants {
  font-size: 12px;
  color: var(--orange);
  font-weight: 500;
}

/* ── Board List ── */
.board-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  cursor: pointer;
  transition: all 0.15s;
}
.board-item:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}
.board-type-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  margin-right: 12px;
  white-space: nowrap;
}
.board-type-notice { background: var(--red-light); color: var(--red); }
.board-type-materials { background: var(--blue-light); color: var(--blue); }
.board-type-faq { background: var(--yellow-light); color: var(--yellow); }
.board-info { flex: 1; min-width: 0; }
.board-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.board-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-tertiary);
}
.board-stats {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-left: 12px;
}

/* ── Forms ── */
.form-group { margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block; }
.form-input, .form-select, .form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 14px;
  font-family: inherit;
  background: var(--surface);
  color: var(--text);
  transition: border-color 0.15s;
}
.form-textarea { resize: vertical; min-height: 100px; }
.form-input:focus, .form-select:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(27,107,90,0.1);
}
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
  justify-content: center;
}
.btn-primary:hover { background: var(--accent-dark); }
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--surface-alt);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xs);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .nav {
    flex-direction: column;
    gap: 2px;
  }
  .nav-btn {
    justify-content: flex-start;
    padding: 12px 16px;
  }
  .stat-grid { grid-template-columns: 1fr; }
  .gallery-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .schedule-item { flex-direction: column; align-items: flex-start; }
  .schedule-date { margin-bottom: 8px; margin-right: 0; }
}

/* 기존 스타일들 (예산 관리 부분) */
.exec-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.exec-item:hover {
  border-color: var(--accent);
  background: var(--accent-light);
}
.exec-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;
}
.exec-dot.complete { background: var(--accent); }
.exec-dot.pending { background: var(--orange); }
.exec-dot.missing { background: var(--red); }
.exec-info { flex: 1; min-width: 0; }
.exec-name { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.exec-meta { font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }
.exec-amount {
  font-family: 'JetBrains Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin-left: 12px;
  white-space: nowrap;
}

/* ── Detail Page ── */
.detail-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  font-family: inherit;
  transition: all 0.15s;
}
.detail-back:hover { border-color: var(--accent); color: var(--accent); }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.detail-field {
  background: var(--surface-alt);
  padding: 12px 14px;
  border-radius: var(--radius-xs);
}
.detail-field-label { font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px; }
.detail-field-value { font-size: 14px; font-weight: 500; }
.detail-field.full { grid-column: 1 / -1; }

/* ── Empty State ── */
.empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
}
.empty-icon { margin-bottom: 12px; opacity: 0.4; }
.empty-text { font-size: 14px; }
.empty-sub { font-size: 12px; margin-top: 4px; }
`;

// ─── MAIN APP ────────────────────────────────────────────────────
export default function ProjectManagementSystem() {
  const [tab, setTab] = useState("dashboard");

  // 예산 관리 상태
  const [executions, setExecutions] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);
  const [checkedDocs, setCheckedDocs] = useState({});
  const [attachedDocs, setAttachedDocs] = useState({});
  const [expandedCats, setExpandedCats] = useState({});

  // 일정 관리 상태
  const [schedules, setSchedules] = useState(SAMPLE_SCHEDULES);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // 갤러리 상태
  const [gallery, setGallery] = useState(SAMPLE_GALLERY);
  const [selectedImage, setSelectedImage] = useState(null);

  // 게시판 상태
  const [boards, setBoards] = useState(SAMPLE_BOARDS);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [boardFilter, setBoardFilter] = useState("all");

  // 예산 집행 폼 데이터
  const [formData, setFormData] = useState({
    subcategory: "",
    budgetItem: "",
    description: "",
    amount: "",
    paymentMethod: "카드",
    date: new Date().toISOString().split("T")[0],
    recipient: "",
  });

  // 일정 추가 폼 데이터
  const [scheduleForm, setScheduleForm] = useState({
    title: "",
    description: "",
    category: "교육",
    subcategory: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    maxParticipants: "",
    responsiblePerson: "",
  });

  // 갤러리 업로드 폼 데이터
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    description: "",
    category: "현장사진",
    subcategory: "",
    takenDate: new Date().toISOString().split("T")[0],
    location: "",
    photographer: "",
    tags: "",
  });

  // 게시글 작성 폼 데이터
  const [boardForm, setBoardForm] = useState({
    boardType: "notice",
    title: "",
    content: "",
    category: "",
    subcategory: "",
    isPinned: false,
    isPublic: true,
  });

  const totalSpent = executions.reduce((s, e) => s + e.amount, 0);
  const totalRate = pct(totalSpent, BUDGET_DATA.totalBudget);

  const getSpentBySubcat = useCallback((subcatId) => {
    return executions.filter((e) => e.subcategoryId === subcatId).reduce((s, e) => s + e.amount, 0);
  }, [executions]);

  const getSpentByCat = useCallback((catId) => {
    const cat = BUDGET_DATA.categories.find((c) => c.id === catId);
    if (!cat) return 0;
    return cat.subcategories.reduce((s, sc) => s + getSpentBySubcat(sc.id), 0);
  }, [getSpentBySubcat]);

  // All budget items flat
  const allItems = BUDGET_DATA.categories.flatMap((c) =>
    c.subcategories.flatMap((sc) =>
      sc.items.map((it) => ({
        ...it,
        categoryName: c.name,
        subcategoryName: sc.name,
        subcategoryId: sc.id,
        subcategoryBudget: sc.budget,
      }))
    )
  );

  // All subcategories flat for form
  const allSubcats = BUDGET_DATA.categories.flatMap((c) =>
    c.subcategories.map((sc) => ({ ...sc, categoryName: c.name }))
  );

  function handleAddExecution() {
    const subcat = allSubcats.find((s) => s.id === formData.subcategory);
    if (!subcat || !formData.amount || !formData.description) return;
    const item = subcat.items.find((i) => i.id === formData.budgetItem);
    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount <= 0) return;

    const newExec = {
      id: Date.now().toString(),
      subcategoryId: subcat.id,
      subcategoryName: subcat.name,
      categoryName: subcat.categoryName,
      budgetItemId: item ? item.id : "",
      budgetItemName: item ? item.name : formData.description,
      type: item ? item.type : subcat.items[0]?.type || "기타",
      description: formData.description,
      amount,
      paymentMethod: formData.paymentMethod,
      date: formData.date,
      recipient: formData.recipient,
    };
    setExecutions((prev) => [newExec, ...prev]);
    setFormData({ subcategory: "", budgetItem: "", description: "", amount: "", paymentMethod: "카드", date: new Date().toISOString().split("T")[0], recipient: "" });
    setTab("budget-list");
  }

  function handleAddSchedule() {
    if (!scheduleForm.title || !scheduleForm.startDate) return;

    const newSchedule = {
      id: Date.now(),
      title: scheduleForm.title,
      description: scheduleForm.description,
      category: scheduleForm.category,
      subcategory: scheduleForm.subcategory,
      startDate: scheduleForm.startDate,
      endDate: scheduleForm.endDate || scheduleForm.startDate,
      startTime: scheduleForm.startTime,
      endTime: scheduleForm.endTime,
      location: scheduleForm.location,
      maxParticipants: parseInt(scheduleForm.maxParticipants) || 0,
      currentParticipants: 0,
      status: "planned",
      responsiblePerson: scheduleForm.responsiblePerson,
    };
    setSchedules((prev) => [...prev, newSchedule]);
    setScheduleForm({
      title: "",
      description: "",
      category: "교육",
      subcategory: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      location: "",
      maxParticipants: "",
      responsiblePerson: "",
    });
    setTab("schedule");
  }

  function handleAddGallery() {
    if (!galleryForm.title) return;

    const newGallery = {
      id: Date.now(),
      title: galleryForm.title,
      description: galleryForm.description,
      category: galleryForm.category,
      subcategory: galleryForm.subcategory,
      imagePath: "/placeholder-image.jpg", // 실제로는 파일 업로드 처리 필요
      takenDate: galleryForm.takenDate,
      location: galleryForm.location,
      photographer: galleryForm.photographer,
      tags: galleryForm.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
    };
    setGallery((prev) => [newGallery, ...prev]);
    setGalleryForm({
      title: "",
      description: "",
      category: "현장사진",
      subcategory: "",
      takenDate: new Date().toISOString().split("T")[0],
      location: "",
      photographer: "",
      tags: "",
    });
    setTab("gallery");
  }

  function handleAddBoard() {
    if (!boardForm.title || !boardForm.content) return;

    const newBoard = {
      id: Date.now(),
      boardType: boardForm.boardType,
      title: boardForm.title,
      content: boardForm.content,
      category: boardForm.category,
      subcategory: boardForm.subcategory,
      authorName: "현재 사용자", // 실제로는 로그인 사용자 정보
      isPinned: boardForm.isPinned,
      isPublic: boardForm.isPublic,
      viewCount: 0,
      downloadCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setBoards((prev) => [newBoard, ...prev]);
    setBoardForm({
      boardType: "notice",
      title: "",
      content: "",
      category: "",
      subcategory: "",
      isPinned: false,
      isPublic: true,
    });
    setTab("board");
  }

  function toggleDoc(execId, docName) {
    const key = `${execId}-${docName}`;
    setCheckedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAttach(execId, docName) {
    const key = `${execId}-${docName}`;
    setAttachedDocs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── RENDER: Dashboard ──
  function renderDashboard() {
    const upcomingSchedules = schedules.filter(s => new Date(s.startDate) >= new Date()).slice(0, 3);
    const recentGallery = gallery.slice(0, 4);
    const recentBoards = boards.slice(0, 3);

    return (
      <div>
        {/* 전체 통계 */}
        <div className="stat-grid">
          <div className="stat-box">
            <div className="stat-value">{fmt(BUDGET_DATA.totalBudget)}</div>
            <div className="stat-label">총 예산 (원)</div>
          </div>
          <div className="stat-box">
            <div className="stat-value" style={{ color: totalRate > 90 ? "var(--red)" : "var(--accent-dark)" }}>{fmt(totalSpent)}</div>
            <div className="stat-label">집행액 (원)</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalRate}%</div>
            <div className="stat-label">집행률</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">등록된 일정</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{gallery.length}</div>
            <div className="stat-label">갤러리 사진</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{boards.length}</div>
            <div className="stat-label">게시글</div>
          </div>
        </div>

        {/* 예산 집행률 */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div>
              <div className="card-title">전체 예산 집행률</div>
              <div className="card-subtitle">총 예산 대비 집행 현황</div>
            </div>
            <span className={`badge ${totalRate < 50 ? "green" : totalRate < 80 ? "orange" : "red"}`}>{totalRate}%</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-labels">
              <span>₩{fmt(totalSpent)}</span>
              <span>₩{fmt(BUDGET_DATA.totalBudget)}</span>
            </div>
            <div className="progress-bar">
              <div className={`progress-fill ${totalRate < 50 ? "green" : totalRate < 80 ? "orange" : "red"}`} style={{ width: `${totalRate}%` }} />
            </div>
          </div>
        </div>

        {/* 다가오는 일정 */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">다가오는 일정</div>
            <button className="btn-secondary" onClick={() => setTab("schedule")}>
              <Icon name="calendar" size={14} /> 전체보기
            </button>
          </div>
          {upcomingSchedules.length > 0 ? upcomingSchedules.map((schedule) => {
            const date = new Date(schedule.startDate);
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");

            return (
              <div key={schedule.id} className="schedule-item" onClick={() => { setSelectedSchedule(schedule); setTab("schedule-detail"); }}>
                <div className="schedule-date">
                  <div className="schedule-month">{month}월</div>
                  <div className="schedule-day">{day}</div>
                </div>
                <div className="schedule-info">
                  <div className="schedule-title">{schedule.title}</div>
                  <div className="schedule-meta">
                    <span><Icon name="clock" size={12} /> {schedule.startTime}-{schedule.endTime}</span>
                    <span><Icon name="map" size={12} /> {schedule.location}</span>
                    <span>{schedule.category}</span>
                  </div>
                  <div className="schedule-participants">
                    참여자 {schedule.currentParticipants}/{schedule.maxParticipants}명
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="empty">
              <div className="empty-text">등록된 일정이 없습니다</div>
            </div>
          )}
        </div>

        {/* 최근 갤러리 */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">최근 갤러리</div>
            <button className="btn-secondary" onClick={() => setTab("gallery")}>
              <Icon name="camera" size={14} /> 전체보기
            </button>
          </div>
          {recentGallery.length > 0 ? (
            <div className="gallery-grid">
              {recentGallery.map((item) => (
                <div key={item.id} className="gallery-item" onClick={() => { setSelectedImage(item); setTab("gallery-detail"); }}>
                  <div className="gallery-image">
                    <Icon name="camera" size={40} />
                  </div>
                  <div className="gallery-content">
                    <div className="gallery-title">{item.title}</div>
                    <div className="gallery-meta">
                      <span>{item.category}</span>
                      <span>{item.takenDate}</span>
                    </div>
                    <div className="gallery-tags">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="gallery-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty">
              <div className="empty-text">등록된 사진이 없습니다</div>
            </div>
          )}
        </div>

        {/* 최근 게시글 */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card-header">
            <div className="card-title">최근 게시글</div>
            <button className="btn-secondary" onClick={() => setTab("board")}>
              <Icon name="message" size={14} /> 전체보기
            </button>
          </div>
          {recentBoards.length > 0 ? recentBoards.map((board) => (
            <div key={board.id} className="board-item" onClick={() => { setSelectedBoard(board); setTab("board-detail"); }}>
              <div className={`board-type-badge board-type-${board.boardType}`}>
                {board.boardType === "notice" ? "공지" : board.boardType === "materials" ? "자료" : "FAQ"}
              </div>
              <div className="board-info">
                <div className="board-title">{board.title}</div>
                <div className="board-meta">
                  <span>{board.authorName}</span>
                  <span>{board.createdAt}</span>
                  {board.category && <span>{board.category}</span>}
                </div>
              </div>
              <div className="board-stats">
                <span><Icon name="eye" size={12} /> {board.viewCount}</span>
                {board.downloadCount > 0 && <span><Icon name="download" size={12} /> {board.downloadCount}</span>}
              </div>
            </div>
          )) : (
            <div className="empty">
              <div className="empty-text">등록된 게시글이 없습니다</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: Budget List ──
  function renderBudgetList() {
    if (executions.length === 0) {
      return (
        <div className="empty">
          <div className="empty-icon"><Icon name="folder" size={40} /></div>
          <div className="empty-text">아직 집행 내역이 없습니다</div>
          <div className="empty-sub">'예산집행' 탭에서 예산 집행을 등록하세요</div>
        </div>
      );
    }
    return (
      <div>
        <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 12 }}>
          총 {executions.length}건 · ₩{fmt(totalSpent)}
        </div>
        {executions.map((ex) => {
          const docInfo = getRequiredDocs(ex.type, ex.paymentMethod, ex.amount);
          const totalDocs = docInfo.docs.length;
          const checkedCount = docInfo.docs.filter((d) => checkedDocs[`${ex.id}-${d}`]).length;
          const status = checkedCount === totalDocs ? "complete" : checkedCount > 0 ? "pending" : "missing";
          return (
            <div key={ex.id} className="exec-item" onClick={() => { setSelectedExec(ex); setTab("budget-detail"); }}>
              <div className={`exec-dot ${status}`} />
              <div className="exec-info">
                <div className="exec-name">{ex.description}</div>
                <div className="exec-meta">
                  {ex.date} · {ex.categoryName} &gt; {ex.subcategoryName} · {ex.paymentMethod}
                  {" · "}
                  <span style={{ color: status === "complete" ? "var(--accent)" : status === "pending" ? "var(--orange)" : "var(--red)" }}>
                    서류 {checkedCount}/{totalDocs}
                  </span>
                </div>
              </div>
              <div className="exec-amount">₩{fmt(ex.amount)}</div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── RENDER: Budget New Entry ──
  function renderBudgetNewEntry() {
    const selectedSubcat = allSubcats.find((s) => s.id === formData.subcategory);
    const previewType = selectedSubcat?.items.find((i) => i.id === formData.budgetItem)?.type || selectedSubcat?.items[0]?.type;
    const previewAmount = parseInt(formData.amount) || 0;
    const previewDocs = previewType ? getRequiredDocs(previewType, formData.paymentMethod, previewAmount) : null;
    const wh = previewType && ["자문비", "사업인건비", "단순인건비"].includes(previewType) ? calcWithholding(previewAmount) : null;

    return (
      <div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>새 예산 집행 등록</div>

          <div className="form-group">
            <label className="form-label">단위사업</label>
            <select className="form-select" value={formData.subcategory} onChange={(e) => setFormData({ ...formData, subcategory: e.target.value, budgetItem: "" })}>
              <option value="">선택하세요</option>
              {allSubcats.map((sc) => (
                <option key={sc.id} value={sc.id}>[{sc.categoryName}] {sc.name}</option>
              ))}
            </select>
          </div>

          {selectedSubcat && (
            <div className="form-group">
              <label className="form-label">예산 항목</label>
              <select className="form-select" value={formData.budgetItem} onChange={(e) => setFormData({ ...formData, budgetItem: e.target.value })}>
                <option value="">선택하세요</option>
                {selectedSubcat.items.map((it) => (
                  <option key={it.id} value={it.id}>{it.name} (예산: ₩{fmt(it.budget)})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">집행 내용</label>
            <input className="form-input" placeholder="예: 박동욱 교수 자문료" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">금액 (원)</label>
              <input className="form-input" type="number" placeholder="200000" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">결제방식</label>
              <select className="form-select" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}>
                <option>카드</option>
                <option>계좌이체</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">집행일</label>
              <input className="form-input" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">지급대상</label>
              <input className="form-input" placeholder="거래처 또는 수령인" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary" onClick={handleAddExecution} style={{ marginTop: 8, width: "100%" }}>
            <Icon name="plus" size={16} /> 집행 등록
          </button>
        </div>

        {/* Live Preview */}
        {previewType && previewAmount > 0 && (
          <>
            {wh && wh.taxable && (
              <div style={{ background: "var(--yellow-light)", border: "1px solid #E6D47A", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--yellow)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="calc" size={16} /> 원천징수 계산
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>지급총액</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(previewAmount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>소득세 (국세 8%)</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(wh.incomeTax)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>지방소득세 (국세의 10%)</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(wh.localTax)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>원천징수 합계</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15, color: "var(--red)" }}>₩{fmt(wh.totalTax)}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1", marginTop: 8, paddingTop: 10, borderTop: "1px dashed #D4C86A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-dark)" }}>실지급액</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--accent-dark)" }}>₩{fmt(wh.netAmount)}</span>
                  </div>
                </div>
              </div>
            )}
            {wh && !wh.taxable && previewType && ["자문비", "사업인건비", "단순인건비"].includes(previewType) && (
              <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--radius-xs)", padding: "12px 14px", fontSize: 13, color: "var(--accent-dark)", marginBottom: 16 }}>
                ✓ 125,000원 이하로 원천징수 대상이 아닙니다. 전액 ₩{fmt(previewAmount)} 지급.
              </div>
            )}

            <div className="card">
              <div className="card-title" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="file" size={16} /> 필요 증빙서류 미리보기
              </div>
              {previewDocs && previewDocs.docs.map((doc, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < previewDocs.docs.length - 1 ? "1px solid var(--border-light)" : "none", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--accent)" }}>•</span> {doc}
                </div>
              ))}
              {previewDocs?.optional?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>선택 사항</div>
                  {previewDocs.optional.map((doc, i) => (
                    <div key={i} style={{ padding: "6px 0", fontSize: 12, color: "var(--text-tertiary)" }}>○ {doc}</div>
                  ))}
                </div>
              )}
              {previewDocs?.notes && (
                <div style={{ background: "var(--blue-light)", border: "1px solid #B8D0F0", borderRadius: "var(--radius-xs)", padding: "12px 14px", fontSize: 12, color: "var(--blue)", lineHeight: 1.6, whiteSpace: "pre-line", marginTop: 12 }}>
                  <Icon name="alert" size={14} /> {previewDocs.notes}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── RENDER: Budget Detail ──
  function renderBudgetDetail() {
    if (!selectedExec) return null;
    const ex = selectedExec;
    const docInfo = getRequiredDocs(ex.type, ex.paymentMethod, ex.amount);
    const wh = ["자문비", "사업인건비", "단순인건비"].includes(ex.type) ? calcWithholding(ex.amount) : null;

    return (
      <div>
        <button className="detail-back" onClick={() => { setSelectedExec(null); setTab("budget-list"); }}>
          <Icon name="back" size={14} /> 목록으로
        </button>

        <div className="card">
          <div className="card-title" style={{ fontSize: 18, marginBottom: 4 }}>{ex.description}</div>
          <div className="card-subtitle">{ex.categoryName} &gt; {ex.subcategoryName}</div>

          <div className="detail-grid" style={{ marginTop: 16 }}>
            <div className="detail-field">
              <div className="detail-field-label">금액</div>
              <div className="detail-field-value" style={{ fontFamily: "'JetBrains Mono', monospace" }}>₩{fmt(ex.amount)}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">결제방식</div>
              <div className="detail-field-value">{ex.paymentMethod}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">집행일</div>
              <div className="detail-field-value">{ex.date}</div>
            </div>
            <div className="detail-field">
              <div className="detail-field-label">계정항목</div>
              <div className="detail-field-value">{ex.type}</div>
            </div>
            {ex.recipient && (
              <div className="detail-field full">
                <div className="detail-field-label">지급대상</div>
                <div className="detail-field-value">{ex.recipient}</div>
              </div>
            )}
          </div>
        </div>

        {wh && wh.taxable && (
          <div style={{ background: "var(--yellow-light)", border: "1px solid #E6D47A", borderRadius: "var(--radius-sm)", padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--yellow)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="calc" size={16} /> 원천징수 내역
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>지급총액</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(ex.amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>소득세 (국세 8%)</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(wh.incomeTax)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>지방소득세 (국세의 10%)</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15 }}>₩{fmt(wh.localTax)}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>원천징수 합계</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 15, color: "var(--red)" }}>₩{fmt(wh.totalTax)}</div>
              </div>
              <div style={{ gridColumn: "1 / -1", marginTop: 8, paddingTop: 10, borderTop: "1px dashed #D4C86A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-dark)" }}>실지급액</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--accent-dark)" }}>₩{fmt(wh.netAmount)}</span>
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--yellow)", lineHeight: 1.5 }}>
              * 신고기한: 지급일이 속하는 달의 다음달 10일까지<br />
              * 기타소득지급명세서: 다음 연도 2월 말까지 제출
            </div>
          </div>
        )}
        {wh && !wh.taxable && (
          <div style={{ background: "var(--accent-light)", border: "1px solid var(--accent)", borderRadius: "var(--radius-xs)", padding: "12px 14px", fontSize: 13, color: "var(--accent-dark)", marginBottom: 16 }}>
            ✓ 125,000원 이하로 원천징수 대상이 아닙니다.
          </div>
        )}

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Icon name="file" size={16} /> 필요 증빙서류 체크리스트
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border-light)" }}>
              필수 서류
            </div>
            {docInfo.docs.map((doc, i) => {
              const key = `${ex.id}-${doc}`;
              const isChecked = checkedDocs[key];
              const isAttached = attachedDocs[key];
              return (
                <div key={i} className={`doc-item ${isChecked ? "checked" : ""}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", marginBottom: 6, fontSize: 13, cursor: "pointer", transition: "all 0.15s", userSelect: "none" }}>
                  <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", ...(isChecked ? { background: "var(--accent)", borderColor: "var(--accent)", color: "white" } : {}) }} onClick={() => toggleDoc(ex.id, doc)}>
                    {isChecked && <Icon name="check" size={14} />}
                  </div>
                  <span onClick={() => toggleDoc(ex.id, doc)} style={{ flex: 1 }}>{doc}</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 4, fontSize: 11, color: "var(--text-tertiary)", background: "var(--surface-alt)", border: "1px solid var(--border-light)", cursor: "pointer", transition: "all 0.15s", ...(isAttached ? { background: "var(--accent-light)", color: "var(--accent)", borderColor: "var(--accent)" } : {}) }} onClick={(e) => { e.stopPropagation(); toggleAttach(ex.id, doc); }}>
                    <Icon name="clip" size={12} />
                    {isAttached ? "첨부됨" : "첨부"}
                  </div>
                </div>
              );
            })}
          </div>

          {docInfo.optional && docInfo.optional.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border-light)" }}>
                선택 서류
              </div>
              {docInfo.optional.map((doc, i) => {
                const key = `${ex.id}-opt-${doc}`;
                const isChecked = checkedDocs[key];
                const isAttached = attachedDocs[key];
                return (
                  <div key={i} className={`doc-item ${isChecked ? "checked" : ""}`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid var(--border-light)", borderRadius: "var(--radius-xs)", marginBottom: 6, fontSize: 13, cursor: "pointer", transition: "all 0.15s", userSelect: "none" }}>
                    <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", ...(isChecked ? { background: "var(--accent)", borderColor: "var(--accent)", color: "white" } : {}) }} onClick={() => toggleDoc(ex.id, `opt-${doc}`)}>
                      {isChecked && <Icon name="check" size={14} />}
                    </div>
                    <span onClick={() => toggleDoc(ex.id, `opt-${doc}`)} style={{ flex: 1 }}>{doc}</span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 4, fontSize: 11, color: "var(--text-tertiary)", background: "var(--surface-alt)", border: "1px solid var(--border-light)", cursor: "pointer", transition: "all 0.15s", ...(isAttached ? { background: "var(--accent-light)", color: "var(--accent)", borderColor: "var(--accent)" } : {}) }} onClick={(e) => { e.stopPropagation(); toggleAttach(ex.id, `opt-${doc}`); }}>
                      <Icon name="clip" size={12} />
                      {isAttached ? "첨부됨" : "첨부"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {docInfo.notes && (
            <div style={{ background: "var(--blue-light)", border: "1px solid #B8D0F0", borderRadius: "var(--radius-xs)", padding: "12px 14px", fontSize: 12, color: "var(--blue)", lineHeight: 1.6, whiteSpace: "pre-line", marginTop: 12 }}>
              <Icon name="alert" size={14} /> {docInfo.notes}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: Schedule List ──
  function renderSchedule() {
    return (
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">일정 관리</div>
            <button className="btn-primary" onClick={() => setTab("schedule-new")}>
              <Icon name="plus" size={14} /> 새 일정 추가
            </button>
          </div>
        </div>

        {schedules.length > 0 ? schedules.map((schedule) => {
          const date = new Date(schedule.startDate);
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
          const participantRate = schedule.maxParticipants > 0 ? Math.round((schedule.currentParticipants / schedule.maxParticipants) * 100) : 0;

          return (
            <div key={schedule.id} className="schedule-item" onClick={() => { setSelectedSchedule(schedule); setTab("schedule-detail"); }}>
              <div className="schedule-date">
                <div className="schedule-month">{month}월</div>
                <div className="schedule-day">{day}</div>
              </div>
              <div className="schedule-info">
                <div className="schedule-title">{schedule.title}</div>
                <div className="schedule-meta">
                  <span><Icon name="clock" size={12} /> {schedule.startTime}-{schedule.endTime}</span>
                  <span><Icon name="map" size={12} /> {schedule.location}</span>
                  <span>{schedule.category}</span>
                  {schedule.subcategory && <span>{schedule.subcategory}</span>}
                </div>
                <div className="schedule-participants">
                  참여자 {schedule.currentParticipants}/{schedule.maxParticipants}명 ({participantRate}%)
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span className={`badge ${schedule.status === "completed" ? "green" : schedule.status === "ongoing" ? "orange" : "red"}`}>
                  {schedule.status === "planned" ? "예정" : schedule.status === "ongoing" ? "진행중" : schedule.status === "completed" ? "완료" : "취소"}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{schedule.responsiblePerson}</span>
              </div>
            </div>
          );
        }) : (
          <div className="empty">
            <div className="empty-icon"><Icon name="calendar" size={40} /></div>
            <div className="empty-text">등록된 일정이 없습니다</div>
            <div className="empty-sub">새 일정을 추가해보세요</div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Schedule New ──
  function renderScheduleNew() {
    return (
      <div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>새 일정 등록</div>

          <div className="form-group">
            <label className="form-label">일정명</label>
            <input className="form-input" placeholder="예: 노동안전보건 교육 워크샵" value={scheduleForm.title} onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">설명</label>
            <textarea className="form-textarea" placeholder="일정에 대한 상세 설명을 입력하세요" value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">카테고리</label>
              <select className="form-select" value={scheduleForm.category} onChange={(e) => setScheduleForm({ ...scheduleForm, category: e.target.value })}>
                <option value="교육">교육</option>
                <option value="캠페인">캠페인</option>
                <option value="회의">회의</option>
                <option value="평가">평가</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">세부분류</label>
              <input className="form-input" placeholder="예: 노동안전보건, 참견위원회" value={scheduleForm.subcategory} onChange={(e) => setScheduleForm({ ...scheduleForm, subcategory: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작일</label>
              <input className="form-input" type="date" value={scheduleForm.startDate} onChange={(e) => setScheduleForm({ ...scheduleForm, startDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">종료일</label>
              <input className="form-input" type="date" value={scheduleForm.endDate} onChange={(e) => setScheduleForm({ ...scheduleForm, endDate: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">시작시간</label>
              <input className="form-input" type="time" value={scheduleForm.startTime} onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">종료시간</label>
              <input className="form-input" type="time" value={scheduleForm.endTime} onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">장소</label>
            <input className="form-input" placeholder="예: 청년노동자인권센터" value={scheduleForm.location} onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">최대 참여자 수</label>
              <input className="form-input" type="number" placeholder="30" value={scheduleForm.maxParticipants} onChange={(e) => setScheduleForm({ ...scheduleForm, maxParticipants: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">담당자</label>
              <input className="form-input" placeholder="예: 김담당자" value={scheduleForm.responsiblePerson} onChange={(e) => setScheduleForm({ ...scheduleForm, responsiblePerson: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary" onClick={handleAddSchedule} style={{ marginTop: 16, width: "100%" }}>
            <Icon name="calendar" size={16} /> 일정 등록
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Gallery ──
  function renderGallery() {
    const categoryFilter = ["all", "현장사진", "결과물", "교육자료", "캠페인", "행사", "기타"];
    const [galleryFilter, setGalleryFilter] = useState("all");
    const filteredGallery = galleryFilter === "all" ? gallery : gallery.filter(item => item.category === galleryFilter);

    return (
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">갤러리</div>
            <button className="btn-primary" onClick={() => setTab("gallery-new")}>
              <Icon name="upload" size={14} /> 사진 업로드
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {categoryFilter.map((filter) => (
              <button
                key={filter}
                className={`btn-secondary ${galleryFilter === filter ? 'active' : ''}`}
                onClick={() => setGalleryFilter(filter)}
                style={{
                  ...(galleryFilter === filter ? {
                    background: "var(--accent)",
                    color: "white",
                    borderColor: "var(--accent)"
                  } : {})
                }}
              >
                {filter === "all" ? "전체" : filter}
              </button>
            ))}
          </div>
        </div>

        {filteredGallery.length > 0 ? (
          <div className="gallery-grid">
            {filteredGallery.map((item) => (
              <div key={item.id} className="gallery-item" onClick={() => { setSelectedImage(item); setTab("gallery-detail"); }}>
                <div className="gallery-image">
                  <Icon name="camera" size={40} />
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.7)", color: "white", padding: "2px 6px", borderRadius: 4, fontSize: 10 }}>
                    {item.category}
                  </div>
                </div>
                <div className="gallery-content">
                  <div className="gallery-title">{item.title}</div>
                  <div className="gallery-meta">
                    <span><Icon name="calendar" size={11} /> {item.takenDate}</span>
                    {item.location && <span><Icon name="map" size={11} /> {item.location}</span>}
                  </div>
                  {item.photographer && (
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8 }}>
                      <Icon name="camera" size={11} /> {item.photographer}
                    </div>
                  )}
                  <div className="gallery-tags">
                    {item.tags.map((tag, i) => (
                      <span key={i} className="gallery-tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <div className="empty-icon"><Icon name="camera" size={40} /></div>
            <div className="empty-text">등록된 사진이 없습니다</div>
            <div className="empty-sub">사진을 업로드해보세요</div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Gallery New ──
  function renderGalleryNew() {
    return (
      <div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>사진 업로드</div>

          <div className="form-group">
            <label className="form-label">사진 파일</label>
            <div style={{ border: "2px dashed var(--border)", borderRadius: "var(--radius)", padding: 40, textAlign: "center", background: "var(--surface-alt)", cursor: "pointer" }}>
              <Icon name="upload" size={32} />
              <div style={{ marginTop: 12, fontSize: 14, color: "var(--text-secondary)" }}>
                클릭하여 사진을 선택하거나 드래그하세요
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                JPG, PNG, GIF 파일 지원 (최대 10MB)
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">제목</label>
            <input className="form-input" placeholder="예: 노동안전보건 교육 현장" value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">설명</label>
            <textarea className="form-textarea" placeholder="사진에 대한 설명을 입력하세요" value={galleryForm.description} onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">카테고리</label>
              <select className="form-select" value={galleryForm.category} onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}>
                <option value="현장사진">현장사진</option>
                <option value="결과물">결과물</option>
                <option value="교육자료">교육자료</option>
                <option value="캠페인">캠페인</option>
                <option value="행사">행사</option>
                <option value="기타">기타</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">세부분류</label>
              <input className="form-input" placeholder="예: 노동안전보건" value={galleryForm.subcategory} onChange={(e) => setGalleryForm({ ...galleryForm, subcategory: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">촬영일</label>
              <input className="form-input" type="date" value={galleryForm.takenDate} onChange={(e) => setGalleryForm({ ...galleryForm, takenDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">촬영장소</label>
              <input className="form-input" placeholder="예: 청년노동자인권센터" value={galleryForm.location} onChange={(e) => setGalleryForm({ ...galleryForm, location: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">촬영자</label>
              <input className="form-input" placeholder="예: 김담당자" value={galleryForm.photographer} onChange={(e) => setGalleryForm({ ...galleryForm, photographer: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">태그 (쉼표로 구분)</label>
              <input className="form-input" placeholder="교육, 노동안전, 청년" value={galleryForm.tags} onChange={(e) => setGalleryForm({ ...galleryForm, tags: e.target.value })} />
            </div>
          </div>

          <button className="btn-primary" onClick={handleAddGallery} style={{ marginTop: 16, width: "100%" }}>
            <Icon name="upload" size={16} /> 업로드
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Board ──
  function renderBoard() {
    const boardTypes = [
      { value: "all", label: "전체" },
      { value: "notice", label: "공지사항" },
      { value: "materials", label: "자료실" },
      { value: "faq", label: "FAQ" },
    ];
    const filteredBoards = boardFilter === "all" ? boards : boards.filter(board => board.boardType === boardFilter);

    return (
      <div>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">게시판</div>
            <button className="btn-primary" onClick={() => setTab("board-new")}>
              <Icon name="plus" size={14} /> 글 작성
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {boardTypes.map((type) => (
              <button
                key={type.value}
                className={`btn-secondary ${boardFilter === type.value ? 'active' : ''}`}
                onClick={() => setBoardFilter(type.value)}
                style={{
                  ...(boardFilter === type.value ? {
                    background: "var(--accent)",
                    color: "white",
                    borderColor: "var(--accent)"
                  } : {})
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {filteredBoards.length > 0 ? filteredBoards.map((board) => (
          <div key={board.id} className="board-item" onClick={() => { setSelectedBoard(board); setTab("board-detail"); }}>
            <div className={`board-type-badge board-type-${board.boardType}`}>
              {board.boardType === "notice" ? "공지" : board.boardType === "materials" ? "자료" : "FAQ"}
            </div>
            <div className="board-info">
              <div className="board-title">
                {board.isPinned && <span style={{ color: "var(--red)", marginRight: 4 }}>📌</span>}
                {board.title}
              </div>
              <div className="board-meta">
                <span>{board.authorName}</span>
                <span>{board.createdAt}</span>
                {board.category && <span>{board.category}</span>}
                {board.subcategory && <span>{board.subcategory}</span>}
              </div>
            </div>
            <div className="board-stats">
              <span><Icon name="eye" size={12} /> {board.viewCount}</span>
              {board.downloadCount > 0 && <span><Icon name="download" size={12} /> {board.downloadCount}</span>}
            </div>
          </div>
        )) : (
          <div className="empty">
            <div className="empty-icon"><Icon name="message" size={40} /></div>
            <div className="empty-text">등록된 게시글이 없습니다</div>
            <div className="empty-sub">게시글을 작성해보세요</div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Board New ──
  function renderBoardNew() {
    return (
      <div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>게시글 작성</div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">게시판 유형</label>
              <select className="form-select" value={boardForm.boardType} onChange={(e) => setBoardForm({ ...boardForm, boardType: e.target.value })}>
                <option value="notice">공지사항</option>
                <option value="materials">자료실</option>
                <option value="faq">FAQ</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">카테고리</label>
              <input className="form-input" placeholder="예: 공지, 교육자료" value={boardForm.category} onChange={(e) => setBoardForm({ ...boardForm, category: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">제목</label>
            <input className="form-input" placeholder="게시글 제목을 입력하세요" value={boardForm.title} onChange={(e) => setBoardForm({ ...boardForm, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">내용</label>
            <textarea className="form-textarea" style={{ minHeight: 200 }} placeholder="게시글 내용을 입력하세요" value={boardForm.content} onChange={(e) => setBoardForm({ ...boardForm, content: e.target.value })} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">세부분류</label>
              <input className="form-input" placeholder="예: 노동안전보건" value={boardForm.subcategory} onChange={(e) => setBoardForm({ ...boardForm, subcategory: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">설정</label>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={boardForm.isPinned} onChange={(e) => setBoardForm({ ...boardForm, isPinned: e.target.checked })} />
                  상단 고정
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input type="checkbox" checked={boardForm.isPublic} onChange={(e) => setBoardForm({ ...boardForm, isPublic: e.target.checked })} />
                  공개
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">첨부파일</label>
            <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-xs)", padding: 20, textAlign: "center", background: "var(--surface-alt)", cursor: "pointer" }}>
              <Icon name="clip" size={24} />
              <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                파일을 드래그하거나 클릭하여 업로드
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>
                PDF, DOC, XLS, PPT, HWP 파일 지원
              </div>
            </div>
          </div>

          <button className="btn-primary" onClick={handleAddBoard} style={{ marginTop: 16, width: "100%" }}>
            <Icon name="plus" size={16} /> 게시글 등록
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: Main Content ──
  const renderMainContent = () => {
    switch (tab) {
      case "dashboard": return renderDashboard();
      case "budget-list": return renderBudgetList();
      case "budget-new": return renderBudgetNewEntry();
      case "budget-detail": return renderBudgetDetail();
      case "schedule": return renderSchedule();
      case "schedule-new": return renderScheduleNew();
      case "gallery": return renderGallery();
      case "gallery-new": return renderGalleryNew();
      case "board": return renderBoard();
      case "board-new": return renderBoardNew();
      default: return renderDashboard();
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="header-org">{BUDGET_DATA.organization}</div>
          <div className="header-title">{BUDGET_DATA.projectName}</div>
          <div className="header-period">{BUDGET_DATA.period} · 종합 사업관리 시스템</div>
        </div>

        {!["budget-detail", "schedule-detail", "gallery-detail", "board-detail"].includes(tab) && (
          <div className="nav">
            <button className={`nav-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
              <Icon name="home" size={15} /> 대시보드
            </button>
            <button className={`nav-btn ${["budget-list", "budget-new"].includes(tab) ? "active" : ""}`} onClick={() => setTab("budget-list")}>
              <Icon name="dollar" size={15} /> 예산관리
            </button>
            <button className={`nav-btn ${tab === "budget-new" ? "active" : ""}`} onClick={() => setTab("budget-new")}>
              <Icon name="plus" size={15} /> 예산집행
            </button>
            <button className={`nav-btn ${["schedule", "schedule-new"].includes(tab) ? "active" : ""}`} onClick={() => setTab("schedule")}>
              <Icon name="calendar" size={15} /> 일정관리
            </button>
            <button className={`nav-btn ${["gallery", "gallery-new"].includes(tab) ? "active" : ""}`} onClick={() => setTab("gallery")}>
              <Icon name="camera" size={15} /> 갤러리
            </button>
            <button className={`nav-btn ${["board", "board-new"].includes(tab) ? "active" : ""}`} onClick={() => setTab("board")}>
              <Icon name="message" size={15} /> 게시판
            </button>
          </div>
        )}

        {renderMainContent()}
      </div>
    </>
  );
}
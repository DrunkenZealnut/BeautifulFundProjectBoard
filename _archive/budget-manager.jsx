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

// ─── 증빙서류 규칙 엔진 ─────────────────────────────────────────────
const DOCUMENT_RULES = {
  "자문비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "통장사본", "사업자등록증"],
    always: ["참석확인서 또는 강의확인서", "지급내역서", "회의록/보고서/발제문 중 1건"],
    withholding: true,
    withholdingDocs: ["원천징수 납부내역서 (국세)", "원천징수 납부내역서 (지방세)"],
    optional: ["신분증", "통장사본 (확인서에 계좌+서명 있으면 생략 가능)"],
    notes: "외부 전문가에 한하여 지급. 내부자(대표, 임직원)에게 지급 불가.\n1일 1회, 기본료 10만원(2시간 이내), 초과료 5만원.",
  },
  "사업인건비": {
    base: ["지출결의서"],
    card: [],
    transfer: ["계좌이체증"],
    always: ["고용 계획서 (고용목적, 기간, 인적사항)", "업무일지 또는 참여확인서", "지급내역서"],
    withholding: true,
    withholdingDocs: ["원천징수 납부내역서 (국세)", "원천징수 납부내역서 (지방세)"],
    optional: ["신분증", "통장사본"],
    notes: "반드시 계좌이체(현금 불가). 내부자에게 지급 불가.\n주민번호 취합 필요 (다음해 2월 기타소득지급명세서 제출 시).",
  },
  "단순인건비": {
    base: ["지출결의서"],
    card: [],
    transfer: ["계좌이체증"],
    always: ["고용 계획서 (고용목적, 기간, 인적사항)", "업무일지 또는 참여확인서", "지급내역서"],
    withholding: true,
    withholdingDocs: ["원천징수 납부내역서 (국세)", "원천징수 납부내역서 (지방세)"],
    optional: ["신분증", "통장사본"],
    notes: "반드시 계좌이체(현금 불가). 내부자에게 지급 불가.\n주민번호 취합 필요.",
  },
  "운영인건비": {
    base: ["지출결의서"],
    card: [],
    transfer: ["계좌이체증", "급여명세서"],
    always: ["근로계약서", "4대보험 가입확인서"],
    withholding: false,
    withholdingDocs: [],
    optional: [],
    notes: "상근활동가 급여. 4대보험 처리.",
  },
  "사업회의비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증"],
    always: ["참석자 명단"],
    withholding: false,
    withholdingDocs: [],
    optional: ["회의 사진"],
    notes: "식비 기준 1인 1식 8,000원.\n외부인 참석 필수, 내부자만 참석한 경우 지급 불가.\n참석인원 × 8,000원 초과 집행 불가.",
  },
  "여비교통비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증 또는 교통카드 내역"],
    transfer: ["계좌이체증"],
    always: ["출장보고서 또는 활동내역"],
    withholding: false,
    withholdingDocs: [],
    optional: ["사진"],
    notes: "캠페인/학교 방문 교통비.",
  },
  "물품구매비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "사업자등록증", "통장사본", "세금계산서", "거래내역서(견적서)"],
    always: [],
    withholding: false,
    withholdingDocs: [],
    over1m: ["비교견적(타인 견적서)"],
    optional: ["실물 사진 (담당자 확인)"],
    notes: "체크카드 사용 원칙.\n100만원 이상 거래 시 비교견적 필수.\n인쇄물: 지원기관 로고/문구 표기 필수, 결과물 3~5부 보관.",
  },
  "시스템구축": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "사업자등록증", "통장사본", "세금계산서", "거래내역서(견적서)"],
    always: [],
    withholding: false,
    withholdingDocs: [],
    over1m: ["비교견적(타인 견적서)"],
    optional: [],
    notes: "서버비용, 개발자등록비 등 IT 인프라 비용.\n체크카드 사용 원칙.",
  },
  "임차료": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "사업자등록증", "통장사본", "거래내역서(견적서)"],
    always: ["임대차 계약서"],
    withholding: false,
    withholdingDocs: [],
    over1m: ["비교견적(타인 견적서)"],
    optional: [],
    notes: "사무실 임대료. 공공시설 우선 활용.\n100만원 이상 시 비교견적 및 계약서.",
  },
  "일반관리비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "세금계산서"],
    always: [],
    withholding: false,
    withholdingDocs: [],
    optional: [],
    notes: "구독료 등 정기 결제 항목.\n체크카드 사용 원칙.",
  },
  "교육훈련비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증"],
    always: ["참석자 명단", "결과보고서 또는 회의록"],
    withholding: false,
    withholdingDocs: [],
    optional: ["사진"],
    notes: "워크샵, 교육 관련 비용.\n식비 포함 시 1인 1식 8,000원 기준.",
  },
  "홍보비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증", "사업자등록증", "통장사본", "세금계산서", "거래내역서(견적서)"],
    always: ["인쇄물 견본 3~5부 보관"],
    withholding: false,
    withholdingDocs: [],
    over1m: ["비교견적(타인 견적서)"],
    optional: ["실물 사진"],
    notes: "팜플렛, 명함, 피켓 등.\n지원기관 로고/문구 반드시 표기.\n체크카드 사용 원칙.",
  },
  "예비비": {
    base: ["지출결의서"],
    card: ["카드결제 영수증"],
    transfer: ["계좌이체증"],
    always: [],
    withholding: false,
    withholdingDocs: [],
    optional: [],
    notes: "예비비 사용 시 실제 집행 항목의 증빙 규정을 따름.",
  },
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

// ─── 원천징수 계산 ──────────────────────────────────────────────────
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

// ─── FORMAT ──────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("ko-KR").format(n);
const pct = (spent, budget) => budget === 0 ? 0 : Math.min(Math.round((spent / budget) * 100), 100);

// ─── ICONS ───────────────────────────────────────────────────────
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
  };
  return icons[name] || null;
};

// ─── STYLES ──────────────────────────────────────────────────────
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
  max-width: 900px;
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
}
.nav-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all 0.2s;
  font-family: inherit;
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
.progress-wrap {
  margin-top: 12px;
}
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
  grid-template-columns: repeat(3, 1fr);
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

/* ── Execution List ── */
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

/* ── Withholding Box ── */
.wh-box {
  background: var(--yellow-light);
  border: 1px solid #E6D47A;
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 16px;
}
.wh-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--yellow);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.wh-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}
.wh-item { font-size: 13px; }
.wh-item-label { color: var(--text-secondary); font-size: 11px; }
.wh-item-value { font-family: 'JetBrains Mono', monospace; font-weight: 600; font-size: 15px; }
.wh-net {
  grid-column: 1 / -1;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px dashed #D4C86A;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.wh-net-label { font-size: 13px; font-weight: 600; color: var(--accent-dark); }
.wh-net-value { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; color: var(--accent-dark); }

/* ── Doc Checklist ── */
.doc-section { margin-bottom: 16px; }
.doc-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-light);
}
.doc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-xs);
  margin-bottom: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.doc-item:hover { border-color: var(--accent); }
.doc-item.checked {
  background: var(--accent-light);
  border-color: var(--accent);
}
.doc-checkbox {
  width: 20px; height: 20px;
  border: 2px solid var(--border);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s;
}
.doc-item.checked .doc-checkbox {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.doc-item .doc-file-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--surface-alt);
  border: 1px solid var(--border-light);
  cursor: pointer;
  transition: all 0.15s;
}
.doc-item .doc-file-btn:hover { border-color: var(--accent); color: var(--accent); }
.doc-item .doc-file-btn.attached { background: var(--accent-light); color: var(--accent); border-color: var(--accent); }

.doc-notes {
  background: var(--blue-light);
  border: 1px solid #B8D0F0;
  border-radius: var(--radius-xs);
  padding: 12px 14px;
  font-size: 12px;
  color: var(--blue);
  line-height: 1.6;
  white-space: pre-line;
  margin-top: 12px;
}

/* ── New Entry Form ── */
.form-group { margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; display: block; }
.form-input, .form-select {
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
.form-input:focus, .form-select:focus {
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
  width: 100%;
  justify-content: center;
}
.btn-primary:hover { background: var(--accent-dark); }

/* ── Budget Category Accordion ── */
.cat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.cat-header:hover { border-color: var(--accent); }
.cat-name { font-size: 14px; font-weight: 600; }
.cat-amounts {
  display: flex;
  align-items: center;
  gap: 16px;
}
.cat-budget {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
}
.cat-pct {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}
.sub-items {
  padding-left: 20px;
  margin-bottom: 12px;
}
.sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-left: 2px solid var(--border);
  margin-bottom: 4px;
  font-size: 13px;
  transition: all 0.15s;
}
.sub-item:hover { border-left-color: var(--accent); background: var(--accent-light); border-radius: 0 var(--radius-xs) var(--radius-xs) 0; }
.sub-name { color: var(--text-secondary); }
.sub-amount { font-family: 'JetBrains Mono', monospace; font-size: 13px; }

/* ── Badge ── */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.badge.green { background: var(--accent-light); color: var(--accent); }
.badge.orange { background: var(--orange-light); color: var(--orange); }
.badge.red { background: var(--red-light); color: var(--red); }

/* ── Empty State ── */
.empty {
  text-align: center;
  padding: 48px 24px;
  color: var(--text-tertiary);
}
.empty-icon { margin-bottom: 12px; opacity: 0.4; }
.empty-text { font-size: 14px; }
.empty-sub { font-size: 12px; margin-top: 4px; }

/* ── Responsive ── */
@media (max-width: 600px) {
  .stat-grid { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
  .nav-btn { font-size: 11px; padding: 8px 6px; }
  .wh-grid { grid-template-columns: 1fr; }
}
`;

// ─── MAIN APP ────────────────────────────────────────────────────
export default function BudgetManager() {
  const [tab, setTab] = useState("dashboard");
  const [executions, setExecutions] = useState([]);
  const [selectedExec, setSelectedExec] = useState(null);
  const [checkedDocs, setCheckedDocs] = useState({});
  const [attachedDocs, setAttachedDocs] = useState({});
  const [expandedCats, setExpandedCats] = useState({});

  // New entry form state
  const [formData, setFormData] = useState({
    subcategory: "",
    budgetItem: "",
    description: "",
    amount: "",
    paymentMethod: "카드",
    date: new Date().toISOString().split("T")[0],
    recipient: "",
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
    setTab("list");
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
    return (
      <div>
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
        </div>

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

        {BUDGET_DATA.categories.map((cat) => {
          const catSpent = getSpentByCat(cat.id);
          const catRate = pct(catSpent, cat.budget);
          const isExpanded = expandedCats[cat.id];
          return (
            <div key={cat.id}>
              <div className="cat-header" onClick={() => setExpandedCats((p) => ({ ...p, [cat.id]: !p[cat.id] }))}>
                <div className="cat-name">{cat.name}</div>
                <div className="cat-amounts">
                  <span className="cat-budget">₩{fmt(cat.budget)}</span>
                  <span className={`cat-pct`} style={{
                    background: catRate < 50 ? "var(--accent-light)" : catRate < 80 ? "var(--orange-light)" : "var(--red-light)",
                    color: catRate < 50 ? "var(--accent)" : catRate < 80 ? "var(--orange)" : "var(--red)",
                  }}>{catRate}%</span>
                </div>
              </div>
              {isExpanded && (
                <div className="sub-items">
                  {cat.subcategories.map((sc) => {
                    const scSpent = getSpentBySubcat(sc.id);
                    const scRate = pct(scSpent, sc.budget);
                    return (
                      <div key={sc.id} className="sub-item">
                        <div>
                          <span className="sub-name">{sc.name}</span>
                          <span style={{ fontSize: 11, color: "var(--text-tertiary)", marginLeft: 8 }}>{scRate}%</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="sub-amount" style={{ color: "var(--text-tertiary)" }}>₩{fmt(scSpent)}</span>
                          <span style={{ color: "var(--text-tertiary)", fontSize: 11 }}>/</span>
                          <span className="sub-amount">₩{fmt(sc.budget)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {executions.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <div className="card-title" style={{ marginBottom: 12 }}>최근 집행 내역</div>
            {executions.slice(0, 5).map((ex) => (
              <div key={ex.id} className="exec-item" onClick={() => { setSelectedExec(ex); setTab("detail"); }}>
                <div className={`exec-dot ${checkedDocs[`${ex.id}-all`] ? "complete" : "pending"}`} />
                <div className="exec-info">
                  <div className="exec-name">{ex.description}</div>
                  <div className="exec-meta">{ex.date} · {ex.subcategoryName} · {ex.paymentMethod}</div>
                </div>
                <div className="exec-amount">₩{fmt(ex.amount)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: List ──
  function renderList() {
    if (executions.length === 0) {
      return (
        <div className="empty">
          <div className="empty-icon"><Icon name="folder" size={40} /></div>
          <div className="empty-text">아직 집행 내역이 없습니다</div>
          <div className="empty-sub">'새 집행' 탭에서 예산 집행을 등록하세요</div>
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
            <div key={ex.id} className="exec-item" onClick={() => { setSelectedExec(ex); setTab("detail"); }}>
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

  // ── RENDER: New Entry ──
  function renderNewEntry() {
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

          <button className="btn-primary" onClick={handleAddExecution} style={{ marginTop: 8 }}>
            <Icon name="plus" size={16} /> 집행 등록
          </button>
        </div>

        {/* Live Preview */}
        {previewType && previewAmount > 0 && (
          <>
            {wh && wh.taxable && (
              <div className="wh-box">
                <div className="wh-title"><Icon name="calc" size={16} /> 원천징수 계산</div>
                <div className="wh-grid">
                  <div className="wh-item">
                    <div className="wh-item-label">지급총액</div>
                    <div className="wh-item-value">₩{fmt(previewAmount)}</div>
                  </div>
                  <div className="wh-item">
                    <div className="wh-item-label">소득세 (국세 8%)</div>
                    <div className="wh-item-value">₩{fmt(wh.incomeTax)}</div>
                  </div>
                  <div className="wh-item">
                    <div className="wh-item-label">지방소득세 (국세의 10%)</div>
                    <div className="wh-item-value">₩{fmt(wh.localTax)}</div>
                  </div>
                  <div className="wh-item">
                    <div className="wh-item-label">원천징수 합계</div>
                    <div className="wh-item-value" style={{ color: "var(--red)" }}>₩{fmt(wh.totalTax)}</div>
                  </div>
                  <div className="wh-net">
                    <span className="wh-net-label">실지급액</span>
                    <span className="wh-net-value">₩{fmt(wh.netAmount)}</span>
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
              {previewDocs?.notes && <div className="doc-notes"><Icon name="alert" size={14} /> {previewDocs.notes}</div>}
            </div>
          </>
        )}
      </div>
    );
  }

  // ── RENDER: Detail ──
  function renderDetail() {
    if (!selectedExec) return null;
    const ex = selectedExec;
    const docInfo = getRequiredDocs(ex.type, ex.paymentMethod, ex.amount);
    const wh = ["자문비", "사업인건비", "단순인건비"].includes(ex.type) ? calcWithholding(ex.amount) : null;

    return (
      <div>
        <button className="detail-back" onClick={() => { setSelectedExec(null); setTab("list"); }}>
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
          <div className="wh-box">
            <div className="wh-title"><Icon name="calc" size={16} /> 원천징수 내역</div>
            <div className="wh-grid">
              <div className="wh-item">
                <div className="wh-item-label">지급총액</div>
                <div className="wh-item-value">₩{fmt(ex.amount)}</div>
              </div>
              <div className="wh-item">
                <div className="wh-item-label">소득세 (국세 8%)</div>
                <div className="wh-item-value">₩{fmt(wh.incomeTax)}</div>
              </div>
              <div className="wh-item">
                <div className="wh-item-label">지방소득세 (국세의 10%)</div>
                <div className="wh-item-value">₩{fmt(wh.localTax)}</div>
              </div>
              <div className="wh-item">
                <div className="wh-item-label">원천징수 합계</div>
                <div className="wh-item-value" style={{ color: "var(--red)" }}>₩{fmt(wh.totalTax)}</div>
              </div>
              <div className="wh-net">
                <span className="wh-net-label">실지급액</span>
                <span className="wh-net-value">₩{fmt(wh.netAmount)}</span>
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

          <div className="doc-section">
            <div className="doc-section-title">필수 서류</div>
            {docInfo.docs.map((doc, i) => {
              const key = `${ex.id}-${doc}`;
              const isChecked = checkedDocs[key];
              const isAttached = attachedDocs[key];
              return (
                <div key={i} className={`doc-item ${isChecked ? "checked" : ""}`}>
                  <div className="doc-checkbox" onClick={() => toggleDoc(ex.id, doc)}>
                    {isChecked && <Icon name="check" size={14} />}
                  </div>
                  <span onClick={() => toggleDoc(ex.id, doc)} style={{ flex: 1 }}>{doc}</span>
                  <div className={`doc-file-btn ${isAttached ? "attached" : ""}`} onClick={(e) => { e.stopPropagation(); toggleAttach(ex.id, doc); }}>
                    <Icon name="clip" size={12} />
                    {isAttached ? "첨부됨" : "첨부"}
                  </div>
                </div>
              );
            })}
          </div>

          {docInfo.optional && docInfo.optional.length > 0 && (
            <div className="doc-section">
              <div className="doc-section-title">선택 서류</div>
              {docInfo.optional.map((doc, i) => {
                const key = `${ex.id}-opt-${doc}`;
                const isChecked = checkedDocs[key];
                const isAttached = attachedDocs[key];
                return (
                  <div key={i} className={`doc-item ${isChecked ? "checked" : ""}`}>
                    <div className="doc-checkbox" onClick={() => toggleDoc(ex.id, `opt-${doc}`)}>
                      {isChecked && <Icon name="check" size={14} />}
                    </div>
                    <span onClick={() => toggleDoc(ex.id, `opt-${doc}`)} style={{ flex: 1 }}>{doc}</span>
                    <div className={`doc-file-btn ${isAttached ? "attached" : ""}`} onClick={(e) => { e.stopPropagation(); toggleAttach(ex.id, `opt-${doc}`); }}>
                      <Icon name="clip" size={12} />
                      {isAttached ? "첨부됨" : "첨부"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {docInfo.notes && <div className="doc-notes"><Icon name="alert" size={14} /> {docInfo.notes}</div>}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="header">
          <div className="header-org">{BUDGET_DATA.organization}</div>
          <div className="header-title">{BUDGET_DATA.projectName}</div>
          <div className="header-period">{BUDGET_DATA.period} · 1차년도</div>
        </div>

        {tab !== "detail" && (
          <div className="nav">
            <button className={`nav-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
              <Icon name="home" size={15} /> 대시보드
            </button>
            <button className={`nav-btn ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>
              <Icon name="list" size={15} /> 집행내역
            </button>
            <button className={`nav-btn ${tab === "new" ? "active" : ""}`} onClick={() => setTab("new")}>
              <Icon name="plus" size={15} /> 새 집행
            </button>
          </div>
        )}

        {tab === "dashboard" && renderDashboard()}
        {tab === "list" && renderList()}
        {tab === "new" && renderNewEntry()}
        {tab === "detail" && renderDetail()}
      </div>
    </>
  );
}

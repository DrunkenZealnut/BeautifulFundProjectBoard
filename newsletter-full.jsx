import { useState } from "react";

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const ARTICLES = [
  {
    id: 1,
    issue: "Vol.3 · No.12",
    date: "2026년 3월 20일",
    badge: { label: "주요 이슈", variant: "accent" },
    kicker: "산업안전",
    readTime: "5분",
    title: "반도체 공장 청년 노동자, 그들의 안전은 누가 지키나",
    lede: "전국 반도체 특성화고 졸업생 중 절반 이상이 입사 첫해 안전교육을 제대로 받지 못하고 현장에 투입되는 것으로 나타났습니다.",
    body: [
      "청년노동자인권센터가 2026년 1월부터 2월까지 반도체 특성화고 졸업생 340명을 대상으로 실시한 실태조사에 따르면, 응답자 중 63%가 "안전 위험요인을 스스로 찾아야 했다"고 답했습니다.",
      "화학물질 취급 교육 이수율은 51%, 비상대응 훈련 참여율은 38%에 그쳐 산업안전보건법에서 요구하는 기준을 크게 밑돌았습니다. 특히 신규 채용 후 3개월 이내 법정 교육 이수 여부를 묻는 질문에서 '이수하지 못했다'는 응답이 58%에 달했습니다.",
      "센터 관계자는 "특성화고 졸업생은 학교에서 배운 기술을 믿고 취업하지만, 실제 작업 환경의 위험성에 대한 현장 교육은 거의 이루어지지 않는다"며 "이는 구조적인 문제"라고 지적했습니다.",
      "조사에 응한 노동자 A씨는 이렇게 말했습니다. "처음 화학물질 창고에 들어갔을 때 아무도 알려주지 않았어요. 나중에 알고 보니 1급 발암물질이었습니다." 이런 증언은 이번 조사에서 반복적으로 등장했습니다.",
      "센터는 이번 조사 결과를 바탕으로 고용노동부에 청년 노동자 안전교육 실태 전수조사와 업종별 맞춤 가이드라인 마련을 촉구할 예정입니다. 또한 현재 개발 중인 산업안전 교과서와 O-# 앱을 통해 현장에서 직접 활용 가능한 안전 교육 콘텐츠를 제공할 계획입니다.",
    ],
    quote: { text: "처음 화학물질 창고에 들어갔을 때 아무도 알려주지 않았어요. 나중에 알고 보니 1급 발암물질이었습니다.", author: "인터뷰 참여자 A씨, 반도체 공장 2년차" },
    tags: ["반도체", "산업안전", "청년노동", "실태조사"],
  },
  {
    id: 2,
    issue: "Vol.3 · No.12",
    date: "2026년 3월 20일",
    badge: { label: "사업 소식", variant: "green" },
    kicker: "교과서 개발",
    readTime: "3분",
    title: "반도체 안전 교과서 집필 착수 — 연구팀 5인 구성 완료",
    lede: "산업안전보건 교과서 개발 사업이 본격적인 궤도에 올랐습니다. 집필진 5인이 확정되고 챕터별 초안 작업에 돌입했습니다.",
    body: [
      "청년노동자인권센터와 노동환경건강연구소가 공동으로 추진하는 '반도체고등학교 노동안전보건 교과서 개발 기초연구' 사업이 집필진 구성을 마치고 본격적인 내용 개발에 들어갔습니다.",
      "집필진은 산업보건 전문가 2인, 직업교육학 연구자 1인, 현직 특성화고 교사 1인, 청년 노동자 당사자 1인으로 구성되어 다양한 관점이 반영될 예정입니다.",
      "교과서는 총 6개 챕터로 구성되며, 화학물질 안전, 인간공학, 심리사회적 위험요인, 노동자 권리와 제도 등 핵심 주제를 다룹니다. 특성화고 재학생과 졸업 후 현장 투입 초기 단계 청년 모두를 주요 독자로 설정했습니다.",
      "1차 초안은 2026년 6월까지 완성하고, 현장 파일럿 테스트를 거쳐 9월에 최종본을 출판할 계획입니다.",
    ],
    tags: ["교과서", "기초연구", "특성화고"],
  },
  {
    id: 3,
    issue: "Vol.3 · No.11",
    date: "2026년 3월 6일",
    badge: { label: "캠페인", variant: "orange" },
    kicker: "권리 캠페인",
    readTime: "4분",
    title: "청년 노동자 10인의 이야기 — 우리가 겪은 산재",
    lede: "센터가 올 초부터 진행해 온 산재 경험 인터뷰 시리즈의 중간 결과를 공개합니다. 10명의 청년이 직접 말하는 산재 현장.",
    body: [
      "지난 1월부터 진행된 '청년 산재 경험 아카이브' 프로젝트는 총 10인의 인터뷰를 수집했습니다. 응답자 평균 나이는 23.4세, 직종은 반도체 제조업부터 식음료 서비스업까지 다양합니다.",
      "가장 많이 언급된 키워드는 '혼자', '몰랐다', '참았다'였습니다. 사고 발생 후 혼자 처리하거나 보고를 꺼렸던 이유로는 '불이익이 두려워서(67%)', '절차를 몰라서(52%)', '별거 아닌 것 같아서(41%)' 순으로 나타났습니다.",
      "센터는 이 인터뷰를 바탕으로 청년 친화적인 산재 신고 가이드와 O-# 앱 내 상담 기능 시나리오를 개발할 예정입니다.",
    ],
    tags: ["산재", "인터뷰", "캠페인"],
  },
];

const EVENTS = [
  { id: 1, month: "Apr", day: "03", title: "청년 노동안전 토크콘서트 — 당신의 오른쪽", time: "19:00 – 21:00", location: "서울 마포 청년공간 꿈틀", type: "오프라인", fee: "무료 입장", desc: "현장 청년 노동자 3인의 경험담과 전문가 토크를 결합한 참여형 콘서트입니다. 사전 신청 없이 현장 입장 가능합니다.", register: false },
  { id: 2, month: "Apr", day: "10", title: "산업안전 교과서 집필 워크숍 1차", time: "10:00 – 17:00", location: "센터 교육실 (동대문구)", type: "오프라인", fee: "집필진 대상", desc: "교과서 집필진과 연구팀이 모여 챕터별 목차와 집필 방향을 논의합니다. 집필진 외 참관 불가.", register: false },
  { id: 3, month: "Apr", day: "24", title: "2026 청년노동자 권리 네트워크 모임", time: "14:00 – 16:00", location: "온라인 (Zoom)", type: "온라인", fee: "무료", desc: "전국 청년 노동 관련 단체가 모여 연대 의제와 공동 캠페인을 논의하는 분기 정례 모임입니다.", register: true },
  { id: 4, month: "May", day: "08", title: "산재 예방 사진전 오프닝", time: "18:00 – 20:00", location: "서울시청 시민청", type: "오프라인", fee: "무료", desc: "청년 노동자의 작업 현장을 담은 사진 30점이 전시됩니다. 오프닝 행사에서는 사진작가와의 대화 시간이 마련됩니다.", register: false },
];

const ISSUES = [
  { vol: "Vol.3 · No.12", date: "2026년 3월 20일", headline: "반도체 공장 청년 노동자, 안전 실태 조사 결과", count: 4 },
  { vol: "Vol.3 · No.11", date: "2026년 3월 6일", headline: "청년 산재 인터뷰 시리즈 중간 보고", count: 3 },
  { vol: "Vol.3 · No.10", date: "2026년 2월 20일", headline: "O-# 앱 개발 착수 — 기획 과정 공개", count: 5 },
  { vol: "Vol.3 · No.9", date: "2026년 2월 6일", headline: "아름다운재단 인큐베이팅 선정 소감", count: 3 },
  { vol: "Vol.3 · No.8", date: "2026년 1월 23일", headline: "새해 첫 호 — 2026년 센터 사업 계획 전체 공개", count: 6 },
  { vol: "Vol.3 · No.7", date: "2026년 1월 9일", headline: "2025년 상담 통계 분석 보고", count: 4 },
];

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const Badge = ({ children, variant = "default" }) => {
  const s = {
    default: "bg-slate-100 text-slate-600 border-slate-200",
    accent:  "bg-blue-50 text-blue-700 border-blue-200",
    green:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    orange:  "bg-orange-50 text-orange-700 border-orange-200",
    red:     "bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${s[variant]}`}>{children}</span>;
};

const Card = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white border border-slate-200 rounded-xl shadow-sm ${onClick ? "cursor-pointer hover:border-slate-300 hover:shadow-md transition-all" : ""} ${className}`}>
    {children}
  </div>
);

const TopNav = ({ page, setPage, back }) => (
  <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
    <div className="max-w-[680px] mx-auto px-4 h-12 flex items-center justify-between">
      <button
        onClick={() => setPage(back || "home")}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        {back ? "돌아가기" : "뉴스레터"}
      </button>
      <div className="flex items-center gap-1">
        {[
          { id: "home", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
          { id: "archive", icon: "M4 4h16v4H4zM4 10h16v10H4zM9 14h6" },
          { id: "events", icon: "M8 2v4M16 2v4M3 8h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" },
          { id: "subscribe", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
        ].map(({ id, icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${page === id ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={icon}/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// PAGE: HOME
// ─────────────────────────────────────────────
const HomePage = ({ setPage, setSelected }) => {
  const latest = ARTICLES.filter(a => a.issue === "Vol.3 · No.12");
  return (
    <div className="space-y-4">
      {/* Hero header */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-7 pt-7 pb-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-white/70 text-xs font-medium tracking-wide flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
              최신 호
            </span>
            <span className="text-white/50 text-xs font-mono">Vol.3 · No.12</span>
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug mb-1.5">
            반도체 공장 청년들의<br/>안전권을 이야기합니다
          </h1>
          <p className="text-blue-200 text-xs">2026년 3월 20일 · 청년노동자인권센터</p>
          <div className="flex gap-2 mt-4">
            {["산업안전", "교과서 개발", "청년산재"].map(t => (
              <span key={t} className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/15 text-white/80">{t}</span>
            ))}
          </div>
        </div>
        <div className="px-7 py-3 flex gap-2 border-b border-slate-100 overflow-x-auto">
          {["최신 호", "이전 호", "일정", "구독"].map((t, i) => (
            <button key={t} onClick={() => setPage(["home","archive","events","subscribe"][i])}
              className="flex-shrink-0 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* Featured article */}
      <Card className="overflow-hidden" onClick={() => { setSelected(ARTICLES[0]); setPage("article"); }}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="accent">주요 이슈</Badge>
            <span className="text-xs text-slate-400">5분 읽기</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2">{ARTICLES[0].title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{ARTICLES[0].lede}</p>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-1.5">
              {ARTICLES[0].tags.slice(0,3).map(t => (
                <span key={t} className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">#{t}</span>
              ))}
            </div>
            <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
              읽기
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      </Card>

      {/* Other articles */}
      <div className="grid grid-cols-1 gap-3">
        {latest.slice(1).map(a => (
          <Card key={a.id} className="p-4" onClick={() => { setSelected(a); setPage("article"); }}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <Badge variant={a.badge.variant}>{a.badge.label}</Badge>
                  <span className="text-[11px] text-slate-400">{a.readTime} 읽기</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{a.title}</h3>
              </div>
              <svg className="flex-shrink-0 mt-1 text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </Card>
        ))}
      </div>

      {/* Stats bar */}
      <Card className="p-5">
        <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">이번 호 주요 수치</p>
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          {[["1,240명","누적 교육 수료","text-blue-600"],["63%","안전교육 부재 응답","text-orange-500"],["18개교","파트너 특성화고","text-emerald-600"]].map(([v,l,c])=>(
            <div key={l} className="text-center px-2">
              <div className={`text-2xl font-bold tabular-nums ${c}`}>{v}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">{l}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex gap-3 items-start">
        <svg className="flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <p className="text-sm font-semibold text-amber-800 mb-0.5">보고서 사전 신청 안내</p>
          <p className="text-xs text-amber-700 leading-relaxed">"2026 청년 노동자 산업재해 실태 보고서"를 4월 10일 배포 예정입니다. 사전 신청 시 먼저 받아보실 수 있습니다.</p>
        </div>
      </div>

      {/* Upcoming events preview */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-800">다가오는 일정</p>
          <button onClick={() => setPage("events")} className="text-xs text-blue-600 font-medium hover:underline">전체 보기</button>
        </div>
        <div className="divide-y divide-slate-100">
          {EVENTS.slice(0,2).map(e => (
            <div key={e.id} className="flex gap-4 items-center py-2.5">
              <div className="text-center w-10 flex-shrink-0">
                <div className="text-[10px] text-blue-500 font-semibold uppercase tracking-widest">{e.month}</div>
                <div className="text-xl font-bold text-slate-800 leading-none">{e.day}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 line-clamp-1">{e.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{e.time} · {e.location}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE: ARTICLE DETAIL
// ─────────────────────────────────────────────
const ArticlePage = ({ article, setPage }) => {
  if (!article) return null;
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <div className="space-y-4">
      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-7 pt-7 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="accent">{article.badge.label}</Badge>
            <span className="text-slate-400 text-xs">{article.readTime} 읽기</span>
          </div>
          <h1 className="text-xl font-bold text-white leading-snug mb-3">{article.title}</h1>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <span>{article.issue}</span>
            <span>·</span>
            <span>{article.date}</span>
          </div>
        </div>
      </Card>

      {/* Lede */}
      <Card className="p-6">
        <div className="rounded-lg bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-5">
          <p className="text-sm text-blue-800 leading-relaxed font-medium">{article.lede}</p>
        </div>

        {/* Body paragraphs */}
        <div className="space-y-4">
          {article.body.map((para, i) => (
            <div key={i}>
              {article.quote && i === 2 && (
                <div className="relative rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 mb-4">
                  <svg className="absolute top-3 left-4 text-slate-200 w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.748-9.57 9-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.995zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.999v10h-9.999z"/>
                  </svg>
                  <p className="text-sm text-slate-700 leading-relaxed pl-6 font-medium italic">{article.quote.text}</p>
                  <p className="text-xs text-slate-400 pl-6 mt-2">— {article.quote.author}</p>
                </div>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">{para}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-6 pt-5 border-t border-slate-100">
          {article.tags.map(t => (
            <span key={t} className="text-xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md">#{t}</span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
          <div className="flex gap-2">
            <button onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${liked ? "bg-red-50 border-red-200 text-red-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              {liked ? "좋아요" : "좋아요"}
            </button>
            <button onClick={() => setBookmarked(!bookmarked)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${bookmarked ? "bg-blue-50 border-blue-200 text-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
              저장
            </button>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            공유
          </button>
        </div>
      </Card>

      {/* Related articles */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-3">다른 기사</p>
        <div className="space-y-2">
          {ARTICLES.filter(a => a.id !== article.id).slice(0,2).map(a => (
            <Card key={a.id} className="p-4" onClick={() => { /* same page, different article */ }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <Badge variant={a.badge.variant}>{a.badge.label}</Badge>
                  <h4 className="text-sm font-semibold text-slate-800 leading-snug mt-1.5 line-clamp-2">{a.title}</h4>
                </div>
                <svg className="flex-shrink-0 mt-1 text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE: ARCHIVE
// ─────────────────────────────────────────────
const ArchivePage = ({ setPage, setSelected }) => {
  const [search, setSearch] = useState("");
  const filtered = ARTICLES.filter(a =>
    a.title.includes(search) || a.tags.some(t => t.includes(search)) || a.kicker.includes(search)
  );

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-base font-bold text-slate-900 mb-1">아카이브</h2>
        <p className="text-xs text-slate-500 mb-4">Vol.3 기준 전체 기사 · 발행호 목록</p>
        {/* Search */}
        <div className="relative mb-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="기사 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Article list */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2">기사 ({filtered.length})</p>
        <div className="space-y-2">
          {filtered.map(a => (
            <Card key={a.id} className="p-4" onClick={() => { setSelected(a); setPage("article"); }}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={a.badge.variant}>{a.badge.label}</Badge>
                    <span className="text-[11px] text-slate-400 font-mono">{a.issue}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">{a.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{a.lede}</p>
                  <div className="flex gap-1 mt-2">
                    {a.tags.slice(0,2).map(t=>(
                      <span key={t} className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">#{t}</span>
                    ))}
                  </div>
                </div>
                <svg className="flex-shrink-0 mt-1 text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Issues list */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1 mb-2 mt-2">발행호</p>
        <div className="space-y-2">
          {ISSUES.map((issue, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-semibold text-blue-600">{issue.vol}</span>
                    {i === 0 && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-medium">최신</span>}
                  </div>
                  <p className="text-sm font-medium text-slate-700 leading-snug">{issue.headline}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{issue.date} · 기사 {issue.count}개</p>
                </div>
                <svg className="text-slate-300 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE: EVENTS
// ─────────────────────────────────────────────
const EventsPage = ({ setPage, setSelectedEvent }) => {
  const [filter, setFilter] = useState("전체");
  const types = ["전체", "오프라인", "온라인"];
  const filtered = filter === "전체" ? EVENTS : EVENTS.filter(e => e.type === filter);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <h2 className="text-base font-bold text-slate-900 mb-0.5">일정</h2>
        <p className="text-xs text-slate-500 mb-4">센터 주최·주관 행사 및 네트워크 모임</p>
        <div className="flex gap-2">
          {types.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      {filtered.map(e => (
        <Card key={e.id} className="p-5" onClick={() => { setSelectedEvent(e); setPage("event-detail"); }}>
          <div className="flex gap-4 items-start">
            <div className="text-center w-12 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg py-2">
              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest">{e.month}</div>
              <div className="text-2xl font-bold text-slate-800 leading-none">{e.day}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${e.type === "온라인" ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                  {e.type}
                </span>
                <span className="text-[11px] text-slate-400">{e.fee}</span>
              </div>
              <h3 className="text-sm font-semibold text-slate-800 leading-snug mb-1">{e.title}</h3>
              <p className="text-xs text-slate-400">{e.time} · {e.location}</p>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{e.desc}</p>
            </div>
            <svg className="flex-shrink-0 mt-1 text-slate-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </Card>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE: EVENT DETAIL
// ─────────────────────────────────────────────
const EventDetailPage = ({ event, setPage }) => {
  const [registered, setRegistered] = useState(false);
  if (!event) return null;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-7 pt-7 pb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${event.type === "온라인" ? "bg-purple-900/40 text-purple-300 border-purple-700" : "bg-emerald-900/40 text-emerald-300 border-emerald-700"}`}>
              {event.type}
            </span>
            <span className="text-slate-500 text-xs">{event.fee}</span>
          </div>
          <h1 className="text-xl font-bold text-white leading-snug mb-3">{event.title}</h1>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{event.month} {event.day}, 2026 · {event.time}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">행사 소개</h2>
        <p className="text-sm text-slate-600 leading-relaxed">{event.desc}</p>
      </Card>

      <Card className="p-6">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">행사 정보</h2>
        <div className="space-y-3">
          {[["일시", `2026년 ${event.month} ${event.day}일 ${event.time}`],["장소", event.location],["참가비", event.fee],["유형", event.type]].map(([k,v]) => (
            <div key={k} className="flex gap-4">
              <span className="text-xs font-medium text-slate-400 w-16 flex-shrink-0">{k}</span>
              <span className="text-xs text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </Card>

      {event.register && (
        <Card className="p-6 text-center">
          {!registered ? (
            <>
              <p className="text-sm font-semibold text-slate-800 mb-1">사전 등록이 필요한 행사입니다</p>
              <p className="text-xs text-slate-500 mb-4">Zoom 링크는 등록 후 이메일로 발송됩니다.</p>
              <button onClick={() => setRegistered(true)}
                className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                사전 등록하기
              </button>
            </>
          ) : (
            <div className="py-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <p className="text-sm font-semibold text-slate-800">등록 완료!</p>
              <p className="text-xs text-slate-400 mt-0.5">이메일로 참가 확인서를 보내드렸습니다.</p>
            </div>
          )}
        </Card>
      )}

      {!event.register && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-center">
          <p className="text-sm text-slate-600">사전 등록 없이 <strong className="text-slate-800">현장 입장</strong> 가능합니다.</p>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// PAGE: SUBSCRIBE
// ─────────────────────────────────────────────
const SubscribePage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [prefs, setPrefs] = useState([]);
  const topics = ["산업안전", "교과서·교육", "캠페인·행사", "정책·제도", "연구·보고서"];

  const togglePref = (t) => setPrefs(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t]);

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">뉴스레터 구독</h2>
            <p className="text-xs text-slate-500">격주 금요일 오전 발송</p>
          </div>
        </div>
        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
                {step > s ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-8 rounded ${step > s ? "bg-blue-600" : "bg-slate-100"}`}/>}
            </div>
          ))}
          <span className="ml-1 text-xs text-slate-400">{["정보 입력","관심사 선택","완료"][step-1]}</span>
        </div>
      </Card>

      {step === 1 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">기본 정보</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">이름 (선택)</label>
              <input type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">이메일 <span className="text-red-500">*</span></label>
              <input type="email" placeholder="hello@example.com" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>
          <button onClick={() => email && setStep(2)}
            className={`w-full mt-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${email ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}>
            다음 단계
          </button>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-1">관심 주제 선택</h3>
          <p className="text-xs text-slate-500 mb-4">선택한 주제의 콘텐츠를 더 자세히 받아볼 수 있습니다.</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {topics.map(t => (
              <button key={t} onClick={() => togglePref(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${prefs.includes(t) ? "bg-blue-600 text-white border-blue-600" : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors">이전</button>
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">구독 완료</button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card className="p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">구독 완료!</h3>
          <p className="text-sm text-slate-500 mb-1">{name || "독자님"}, 환영합니다.</p>
          <p className="text-xs text-slate-400 mb-6">{email} 로 다음 호부터 발송됩니다.</p>
          {prefs.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {prefs.map(t => <Badge key={t} variant="accent">{t}</Badge>)}
            </div>
          )}
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-4 text-left">
            <p className="text-xs font-semibold text-slate-700 mb-1">다음 호 예정 · Vol.3 No.13</p>
            <p className="text-xs text-slate-500">2026년 4월 3일 (금) 오전 9시</p>
          </div>
        </Card>
      )}

      {/* Features */}
      {step < 3 && (
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">구독 혜택</p>
          <div className="space-y-3">
            {[
              ["격주 금요일 발송","최신 청년 노동 이슈를 가장 먼저 받아보세요","blue"],
              ["보고서 사전 배포","발간 전 보고서를 구독자에게 먼저 공유합니다","emerald"],
              ["행사 우선 알림","센터 주관 행사 사전 신청 알림을 받을 수 있습니다","orange"],
            ].map(([t,d,c])=>(
              <div key={t} className="flex gap-3 items-start">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-${c}-50`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c==="blue"?"#3b82f6":c==="emerald"?"#10b981":"#f97316"} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{t}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const pageTitle = {
    home: "청년노동레터",
    article: "기사 상세",
    archive: "아카이브",
    events: "일정",
    "event-detail": "행사 상세",
    subscribe: "구독",
  };

  const backMap = {
    article: "home",
    "event-detail": "events",
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <style>{`
        * { box-sizing: border-box; }
        .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
        .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .page-enter { animation: fadeUp 0.25s ease both; }
      `}</style>

      <TopNav page={page} setPage={setPage} back={backMap[page]} />

      <div className="max-w-[640px] mx-auto px-4 py-5 page-enter" key={page}>
        {page === "home" && <HomePage setPage={setPage} setSelected={setSelectedArticle} />}
        {page === "article" && <ArticlePage article={selectedArticle || ARTICLES[0]} setPage={setPage} />}
        {page === "archive" && <ArchivePage setPage={setPage} setSelected={setSelectedArticle} />}
        {page === "events" && <EventsPage setPage={setPage} setSelectedEvent={setSelectedEvent} />}
        {page === "event-detail" && <EventDetailPage event={selectedEvent} setPage={setPage} />}
        {page === "subscribe" && <SubscribePage />}
      </div>
    </div>
  );
}

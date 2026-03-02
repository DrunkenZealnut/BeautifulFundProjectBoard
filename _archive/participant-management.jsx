import { useState, useEffect } from "react";

// ─── 참여자 관리 및 출석체크 시스템 ────────────────────────────────
// 기존 project-management-system.jsx에 통합할 수 있는 참여자 관리 모듈

// 샘플 참여자 데이터
const SAMPLE_PARTICIPANTS = [
  {
    id: 1,
    scheduleId: 1,
    userId: 101,
    name: "김청년",
    email: "young@example.com",
    phone: "010-1234-5678",
    organization: "A고등학교",
    registrationType: "external",
    status: "confirmed",
    attendanceTime: null,
    feedback: "",
    rating: null,
    registeredAt: "2026-03-10T10:00:00"
  },
  {
    id: 2,
    scheduleId: 1,
    userId: null,
    name: "박학생",
    email: "student@example.com",
    phone: "010-2345-6789",
    organization: "B고등학교",
    registrationType: "external",
    status: "attended",
    attendanceTime: "2026-03-15T14:05:00",
    feedback: "매우 유익한 교육이었습니다.",
    rating: 5,
    registeredAt: "2026-03-12T15:30:00"
  }
];

// 아이콘 컴포넌트 (기존과 동일)
const Icon = ({ name, size = 18 }) => {
  const icons = {
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    mail: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>,
    phone: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    building: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    calendar: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
    download: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  };
  return icons[name] || null;
};

// 포맷팅 함수
const formatDateTime = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
};

// ─── PARTICIPANT MANAGEMENT COMPONENT ────────────────────────────
export default function ParticipantManagement({ schedule, onBack }) {
  const [participants, setParticipants] = useState(SAMPLE_PARTICIPANTS.filter(p => p.scheduleId === schedule?.id || 1));
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAttendanceCheck, setShowAttendanceCheck] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 참여자 등록 폼 데이터
  const [participantForm, setParticipantForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    registrationType: "external",
  });

  // 피드백 폼 데이터
  const [feedbackForm, setFeedbackForm] = useState({
    feedback: "",
    rating: 5,
  });

  // 필터링된 참여자 목록
  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || participant.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 통계 계산
  const stats = {
    total: participants.length,
    registered: participants.filter(p => p.status === "registered").length,
    confirmed: participants.filter(p => p.status === "confirmed").length,
    attended: participants.filter(p => p.status === "attended").length,
    absent: participants.filter(p => p.status === "absent").length,
    attendanceRate: participants.length > 0 ? Math.round((participants.filter(p => p.status === "attended").length / participants.length) * 100) : 0,
  };

  // 참여자 추가
  function handleAddParticipant() {
    if (!participantForm.name || !participantForm.email) return;

    const newParticipant = {
      id: Date.now(),
      scheduleId: schedule?.id || 1,
      userId: null,
      name: participantForm.name,
      email: participantForm.email,
      phone: participantForm.phone,
      organization: participantForm.organization,
      registrationType: participantForm.registrationType,
      status: "registered",
      attendanceTime: null,
      feedback: "",
      rating: null,
      registeredAt: new Date().toISOString(),
    };

    setParticipants(prev => [...prev, newParticipant]);
    setParticipantForm({
      name: "",
      email: "",
      phone: "",
      organization: "",
      registrationType: "external",
    });
    setShowAddForm(false);
  }

  // 출석 체크
  function handleAttendanceCheck(participantId, isAttended) {
    setParticipants(prev => prev.map(p =>
      p.id === participantId
        ? {
            ...p,
            status: isAttended ? "attended" : "absent",
            attendanceTime: isAttended ? new Date().toISOString() : null
          }
        : p
    ));
  }

  // 일괄 출석 체크
  function handleBulkAttendanceCheck() {
    const currentTime = new Date().toISOString();
    setParticipants(prev => prev.map(p =>
      p.status === "confirmed"
        ? { ...p, status: "attended", attendanceTime: currentTime }
        : p
    ));
  }

  // 참여자 상태 변경
  function handleStatusChange(participantId, newStatus) {
    setParticipants(prev => prev.map(p =>
      p.id === participantId ? { ...p, status: newStatus } : p
    ));
  }

  // 피드백 저장
  function handleSaveFeedback(participantId) {
    setParticipants(prev => prev.map(p =>
      p.id === participantId
        ? {
            ...p,
            feedback: feedbackForm.feedback,
            rating: feedbackForm.rating
          }
        : p
    ));
    setSelectedParticipant(null);
    setFeedbackForm({ feedback: "", rating: 5 });
  }

  // CSV 내보내기
  function exportToCSV() {
    const headers = ["이름", "이메일", "전화번호", "소속", "등록유형", "상태", "출석시간", "평가", "피드백", "등록일시"];
    const data = participants.map(p => [
      p.name,
      p.email,
      p.phone || "",
      p.organization || "",
      p.registrationType === "internal" ? "내부" : "외부",
      getStatusLabel(p.status),
      p.attendanceTime ? formatDateTime(p.attendanceTime) : "",
      p.rating || "",
      p.feedback || "",
      formatDateTime(p.registeredAt)
    ]);

    const csvContent = [headers, ...data].map(row =>
      row.map(field => `"${field}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `참여자명단_${schedule?.title || "일정"}_${formatDate(new Date())}.csv`;
    link.click();
  }

  // 상태 라벨
  function getStatusLabel(status) {
    const labels = {
      registered: "등록",
      confirmed: "확인",
      attended: "출석",
      absent: "결석",
      cancelled: "취소"
    };
    return labels[status] || status;
  }

  // 상태 색상
  function getStatusColor(status) {
    const colors = {
      registered: "var(--blue)",
      confirmed: "var(--orange)",
      attended: "var(--accent)",
      absent: "var(--red)",
      cancelled: "var(--text-tertiary)"
    };
    return colors[status] || "var(--text-secondary)";
  }

  // ── RENDER: 참여자 목록 ──
  if (!showAddForm && !selectedParticipant && !showAttendanceCheck) {
    return (
      <div style={{ fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
              border: "1px solid var(--border)", background: "var(--surface)",
              borderRadius: 6, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)",
              fontFamily: "inherit", transition: "all 0.15s", marginRight: 16
            }}
          >
            <Icon name="back" size={14} /> 뒤로가기
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text)" }}>
              참여자 관리
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--text-secondary)" }}>
              {schedule?.title || "일정명"} · {schedule?.startDate || "날짜"} · {schedule?.location || "장소"}
            </p>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--accent-dark)" }}>
              {stats.total}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>총 참여자</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--accent)" }}>
              {stats.attended}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>출석</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--red)" }}>
              {stats.absent}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>결석</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 8, padding: 16, textAlign: "center" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: "var(--orange)" }}>
              {stats.attendanceRate}%
            </div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 4 }}>출석률</div>
          </div>
        </div>

        {/* 컨트롤 바 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1 }}>
              {/* 검색 */}
              <div style={{ position: "relative", minWidth: 200 }}>
                <Icon name="search" size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
                <input
                  type="text"
                  placeholder="이름, 소속, 이메일로 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: 36, padding: "8px 12px", border: "1px solid var(--border)",
                    borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)",
                    color: "var(--text)", width: "100%"
                  }}
                />
              </div>

              {/* 상태 필터 */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6,
                  fontSize: 14, fontFamily: "inherit", background: "var(--surface)", color: "var(--text)"
                }}
              >
                <option value="all">전체 상태</option>
                <option value="registered">등록</option>
                <option value="confirmed">확인</option>
                <option value="attended">출석</option>
                <option value="absent">결석</option>
              </select>
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                  background: "var(--accent)", color: "white", border: "none", borderRadius: 6,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                }}
              >
                <Icon name="plus" size={14} /> 참여자 추가
              </button>
              <button
                onClick={() => setShowAttendanceCheck(true)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                  background: "var(--orange)", color: "white", border: "none", borderRadius: 6,
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit"
                }}
              >
                <Icon name="check" size={14} /> 출석체크
              </button>
              <button
                onClick={exportToCSV}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
                  background: "var(--surface-alt)", color: "var(--text-secondary)",
                  border: "1px solid var(--border)", borderRadius: 6,
                  fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
                }}
              >
                <Icon name="download" size={14} /> 내보내기
              </button>
            </div>
          </div>
        </div>

        {/* 참여자 목록 */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 12, overflow: "hidden" }}>
          {filteredParticipants.length > 0 ? (
            <>
              {/* 테이블 헤더 */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr", gap: 12, padding: "16px 20px", background: "var(--surface-alt)", borderBottom: "1px solid var(--border-light)", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                <div>참여자 정보</div>
                <div>연락처</div>
                <div>소속</div>
                <div>상태</div>
                <div>출석시간</div>
                <div>평가</div>
                <div>관리</div>
              </div>

              {/* 참여자 목록 */}
              {filteredParticipants.map((participant, index) => (
                <div key={participant.id} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1.5fr 1fr 1fr 1fr", gap: 12, padding: "16px 20px", borderBottom: index < filteredParticipants.length - 1 ? "1px solid var(--border-light)" : "none", fontSize: 14, alignItems: "center" }}>
                  {/* 참여자 정보 */}
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{participant.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      <Icon name="mail" size={11} style={{ marginRight: 4 }} />
                      {participant.email}
                    </div>
                  </div>

                  {/* 연락처 */}
                  <div>
                    {participant.phone && (
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 2 }}>
                        <Icon name="phone" size={11} style={{ marginRight: 4 }} />
                        {participant.phone}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                      {participant.registrationType === "internal" ? "내부" : "외부"}
                    </div>
                  </div>

                  {/* 소속 */}
                  <div style={{ fontSize: 13 }}>
                    {participant.organization && (
                      <>
                        <Icon name="building" size={11} style={{ marginRight: 4 }} />
                        {participant.organization}
                      </>
                    )}
                  </div>

                  {/* 상태 */}
                  <div>
                    <span style={{
                      padding: "4px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: `${getStatusColor(participant.status)}20`,
                      color: getStatusColor(participant.status)
                    }}>
                      {getStatusLabel(participant.status)}
                    </span>
                  </div>

                  {/* 출석시간 */}
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    {participant.attendanceTime ? (
                      <>
                        <Icon name="clock" size={11} style={{ marginRight: 4 }} />
                        {new Date(participant.attendanceTime).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </>
                    ) : "-"}
                  </div>

                  {/* 평가 */}
                  <div style={{ fontSize: 12 }}>
                    {participant.rating ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Icon name="star" size={12} style={{ color: "var(--yellow)" }} />
                        {participant.rating}
                      </div>
                    ) : "-"}
                  </div>

                  {/* 관리 버튼 */}
                  <div style={{ display: "flex", gap: 4 }}>
                    <select
                      value={participant.status}
                      onChange={(e) => handleStatusChange(participant.id, e.target.value)}
                      style={{ fontSize: 11, padding: "2px 4px", border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface)" }}
                    >
                      <option value="registered">등록</option>
                      <option value="confirmed">확인</option>
                      <option value="attended">출석</option>
                      <option value="absent">결석</option>
                      <option value="cancelled">취소</option>
                    </select>
                    {participant.status === "attended" && (
                      <button
                        onClick={() => {
                          setSelectedParticipant(participant);
                          setFeedbackForm({ feedback: participant.feedback || "", rating: participant.rating || 5 });
                        }}
                        style={{
                          padding: "4px 8px", background: "var(--accent-light)", color: "var(--accent)",
                          border: "1px solid var(--accent)", borderRadius: 4, fontSize: 11,
                          cursor: "pointer", fontFamily: "inherit"
                        }}
                      >
                        평가
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)" }}>
              <Icon name="users" size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14 }}>
                {searchTerm || statusFilter !== "all" ? "검색 조건에 맞는 참여자가 없습니다" : "등록된 참여자가 없습니다"}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>참여자를 추가해보세요</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: 참여자 추가 폼 ──
  if (showAddForm) {
    return (
      <div style={{ fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 600, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                border: "1px solid var(--border)", background: "var(--surface)",
                borderRadius: 6, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)",
                fontFamily: "inherit", marginRight: 16
              }}
            >
              <Icon name="back" size={14} /> 뒤로가기
            </button>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>참여자 추가</h3>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                참여자명 *
              </label>
              <input
                type="text"
                value={participantForm.name}
                onChange={(e) => setParticipantForm({ ...participantForm, name: e.target.value })}
                placeholder="예: 김청년"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                  borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                이메일 *
              </label>
              <input
                type="email"
                value={participantForm.email}
                onChange={(e) => setParticipantForm({ ...participantForm, email: e.target.value })}
                placeholder="young@example.com"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                  borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  전화번호
                </label>
                <input
                  type="tel"
                  value={participantForm.phone}
                  onChange={(e) => setParticipantForm({ ...participantForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                  등록 유형
                </label>
                <select
                  value={participantForm.registrationType}
                  onChange={(e) => setParticipantForm({ ...participantForm, registrationType: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                    borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)"
                  }}
                >
                  <option value="external">외부 참여자</option>
                  <option value="internal">내부 직원</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                소속 기관
              </label>
              <input
                type="text"
                value={participantForm.organization}
                onChange={(e) => setParticipantForm({ ...participantForm, organization: e.target.value })}
                placeholder="예: A고등학교"
                style={{
                  width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                  borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setShowAddForm(false)}
              style={{
                flex: 1, padding: "12px 24px", background: "var(--surface-alt)",
                color: "var(--text-secondary)", border: "1px solid var(--border)",
                borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              취소
            </button>
            <button
              onClick={handleAddParticipant}
              disabled={!participantForm.name || !participantForm.email}
              style={{
                flex: 1, padding: "12px 24px", background: "var(--accent)", color: "white",
                border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: participantForm.name && participantForm.email ? "pointer" : "not-allowed",
                fontFamily: "inherit", opacity: participantForm.name && participantForm.email ? 1 : 0.5
              }}
            >
              <Icon name="plus" size={14} style={{ marginRight: 6 }} /> 추가
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: 출석체크 ──
  if (showAttendanceCheck) {
    const confirmedParticipants = participants.filter(p => p.status === "confirmed" || p.status === "registered");

    return (
      <div style={{ fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 800, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <button
              onClick={() => setShowAttendanceCheck(false)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                border: "1px solid var(--border)", background: "var(--surface)",
                borderRadius: 6, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)",
                fontFamily: "inherit", marginRight: 16
              }}
            >
              <Icon name="back" size={14} /> 뒤로가기
            </button>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>출석 체크</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                참석 확인된 {confirmedParticipants.length}명의 출석을 체크하세요
              </p>
            </div>
          </div>

          {confirmedParticipants.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={handleBulkAttendanceCheck}
                style={{
                  padding: "10px 16px", background: "var(--accent)", color: "white",
                  border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit"
                }}
              >
                <Icon name="check" size={14} style={{ marginRight: 6 }} />
                전체 출석 처리
              </button>
            </div>
          )}

          {confirmedParticipants.length > 0 ? confirmedParticipants.map((participant) => (
            <div key={participant.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--border-light)", borderRadius: 8, marginBottom: 8, background: "var(--surface-alt)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{participant.name}</div>
                <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                  {participant.organization} · {participant.email}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handleAttendanceCheck(participant.id, true)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                    background: "var(--accent)", color: "white", border: "none", borderRadius: 4,
                    fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  <Icon name="check" size={12} /> 출석
                </button>
                <button
                  onClick={() => handleAttendanceCheck(participant.id, false)}
                  style={{
                    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
                    background: "var(--red)", color: "white", border: "none", borderRadius: 4,
                    fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
                  }}
                >
                  <Icon name="x" size={12} /> 결석
                </button>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)" }}>
              <Icon name="users" size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <div style={{ fontSize: 14 }}>출석 체크할 참여자가 없습니다</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>참여 확인된 인원이 없습니다</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── RENDER: 피드백 입력 ──
  if (selectedParticipant) {
    return (
      <div style={{ fontFamily: "'Noto Sans KR', sans-serif", maxWidth: 600, margin: "0 auto", padding: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-light)", borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
            <button
              onClick={() => setSelectedParticipant(null)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                border: "1px solid var(--border)", background: "var(--surface)",
                borderRadius: 6, cursor: "pointer", fontSize: 13, color: "var(--text-secondary)",
                fontFamily: "inherit", marginRight: 16
              }}
            >
              <Icon name="back" size={14} /> 뒤로가기
            </button>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>참여자 평가</h3>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
                {selectedParticipant.name} · {selectedParticipant.organization}
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                만족도 평가
              </label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setFeedbackForm({ ...feedbackForm, rating })}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: 36, height: 36, border: "none", borderRadius: 18,
                      background: feedbackForm.rating >= rating ? "var(--yellow)" : "var(--surface-alt)",
                      color: feedbackForm.rating >= rating ? "white" : "var(--text-tertiary)",
                      cursor: "pointer", fontSize: 16, fontFamily: "inherit"
                    }}
                  >
                    <Icon name="star" size={20} />
                  </button>
                ))}
                <span style={{ marginLeft: 8, fontSize: 14, color: "var(--text-secondary)" }}>
                  {feedbackForm.rating}점
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                피드백
              </label>
              <textarea
                value={feedbackForm.feedback}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                placeholder="교육에 대한 의견이나 개선사항을 자유롭게 작성해주세요..."
                style={{
                  width: "100%", minHeight: 100, padding: "10px 14px", border: "1px solid var(--border)",
                  borderRadius: 6, fontSize: 14, fontFamily: "inherit", background: "var(--surface)",
                  resize: "vertical"
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => setSelectedParticipant(null)}
              style={{
                flex: 1, padding: "12px 24px", background: "var(--surface-alt)",
                color: "var(--text-secondary)", border: "1px solid var(--border)",
                borderRadius: 6, fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit"
              }}
            >
              취소
            </button>
            <button
              onClick={() => handleSaveFeedback(selectedParticipant.id)}
              style={{
                flex: 1, padding: "12px 24px", background: "var(--accent)", color: "white",
                border: "none", borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit"
              }}
            >
              <Icon name="check" size={14} style={{ marginRight: 6 }} /> 저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
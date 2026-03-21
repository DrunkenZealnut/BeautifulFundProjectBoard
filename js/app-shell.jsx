            const renderContent = () => {
                if (loading) {
                    return (
                        <div className="loading">
                            <div className="loading-spinner"></div>
                            <div>데이터를 불러오고 있습니다...</div>
                        </div>
                    );
                }

                if (error) {
                    return (
                        <div>
                            <div className="error-message">
                                {error}
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={() => window.location.reload()}
                            >
                                다시 시도
                            </button>
                        </div>
                    );
                }

                switch(currentPage) {
                    case "dashboard": return renderDashboard();
                    case "budget": return renderBudget();
                    case "schedule": return renderSchedule();
                    case "gallery": return renderGallery();
                    case "board": return renderBoard();
                    case "guide": return renderGuide();
                    case "newsletter": return renderNewsletter();
                    case "admin": return currentUser?.role === 'admin' ? renderAdmin() : renderDashboard();
                    default: return renderDashboard();
                }
            };

            // 로그인 안 된 경우 로그인 페이지 표시
            if (!currentUser) {
                return <LoginPage onLogin={setCurrentUser} />;
            }

            return (
                <div>
                    {/* Header */}
                    <div className="header">
                        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>
                                    아름다운재단 2026 공익단체 인큐베이팅 지원사업
                                </h1>
                                <p style={{ margin: '8px 0 0 0', fontSize: '15px', opacity: 0.9 }}>
                                    청년노동자인권센터 • 총 예산 7천만원
                                </p>
                            </div>
                            <div className="header-user-info">
                                <div style={{ textAlign: 'right' }}>
                                    <div className="user-name" style={{ cursor: 'pointer', textDecoration: 'underline dotted' }} onClick={openProfileModal} title="프로필 수정">{currentUser.name}</div>
                                    <div className="user-role">{roleLabels[currentUser.role] || currentUser.role}</div>
                                </div>
                                <button className="logout-btn" onClick={handleLogout}>
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="container">
                        {/* Navigation */}
                        <div className="navigation">
                            {[
                                { id: 'dashboard', label: '🏠 대시보드', description: '전체 현황 보기' },
                                {
                                    id: 'budget',
                                    label: '💰 예산관리',
                                    description: '고급 예산 집행 시스템'
                                },
                                { id: 'schedule', label: '📅 일정관리', description: '사업 일정 및 참여자 관리' },
                                { id: 'gallery', label: '📸 갤러리', description: '현장 사진 및 결과물' },
                                { id: 'board', label: '📋 게시판', description: '공지사항 및 자료실' },
                                { id: 'guide', label: '📖 회계가이드', description: '회계처리방식 안내' },
                                { id: 'newsletter', label: '📰 뉴스레터', description: '일정·게시글 뉴스레터 제작' },
                                ...(currentUser.role === 'admin' ? [{ id: 'admin', label: '⚙️ 관리자', description: '사용자 및 시스템 관리' }] : [])
                            ].map(nav => (
                                <button
                                    key={nav.id}
                                    className={`nav-btn ${currentPage === nav.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setCurrentPage(nav.id);
                                        // Reset board/gallery views when navigating
                                        if (nav.id === 'board') { setBoardView('list'); setSelectedPost(null); setEditingPost(null); }
                                        if (nav.id === 'gallery') { setGalleryView('list'); setSelectedGalleryItem(null); setEditingGalleryItem(null); }
                                    }}
                                    title={nav.description}
                                >
                                    {nav.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="content-area">
                            {renderContent()}
                        </div>
                    </div>

                    {/* F-03: 프로필 수정 모달 */}
                    {profileModal && (
                        <div className="schedule-modal-overlay" onClick={() => setProfileModal(false)}>
                            <div className="schedule-modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
                                <div className="schedule-modal-header">
                                    <h3>👤 프로필 수정</h3>
                                    <button className="schedule-modal-close" onClick={() => setProfileModal(false)}>&times;</button>
                                </div>
                                <div className="schedule-modal-body">
                                    {profileMsg && <div style={{ padding: '8px 12px', marginBottom: 12, borderRadius: 8, fontSize: 13, background: profileMsg.includes('실패') || profileMsg.includes('일치') || profileMsg.includes('입력') ? '#FED7D7' : '#C6F6D5', color: profileMsg.includes('실패') || profileMsg.includes('일치') || profileMsg.includes('입력') ? '#9B2C2C' : '#22543D' }}>{profileMsg}</div>}
                                    <div className="schedule-form-group">
                                        <label>이름</label>
                                        <input type="text" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>이메일</label>
                                        <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>전화번호</label>
                                        <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    <div style={{ borderTop: '1px solid #E2E8F0', marginTop: 16, paddingTop: 16 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#E53E3E' }}>🔒 비밀번호 변경</div>
                                        <div className="schedule-form-group">
                                            <label>현재 비밀번호</label>
                                            <input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm(p => ({ ...p, currentPassword: e.target.value }))} />
                                        </div>
                                        <div className="schedule-form-group">
                                            <label>새 비밀번호</label>
                                            <input type="password" value={profileForm.newPassword} onChange={e => setProfileForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="변경 시에만 입력" />
                                            {profileForm.newPassword && (() => {
                                                const s = getPasswordStrength(profileForm.newPassword);
                                                return s && (
                                                    <div style={{ marginTop: 6 }}>
                                                        <div style={{ height: 4, background: '#E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
                                                            <div style={{ width: s.width, height: '100%', background: s.color, borderRadius: 2, transition: 'width 0.3s' }} />
                                                        </div>
                                                        <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.label}</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                        <div className="schedule-form-group">
                                            <label>새 비밀번호 확인</label>
                                            <input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="새 비밀번호 재입력" />
                                            {profileForm.confirmPassword && profileForm.newPassword !== profileForm.confirmPassword && (
                                                <span style={{ fontSize: 11, color: '#E53E3E', marginTop: 4, display: 'block' }}>비밀번호가 일치하지 않습니다.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="schedule-modal-footer">
                                    <button className="btn btn-secondary" onClick={() => setProfileModal(false)}>취소</button>
                                    <button className="btn btn-primary" onClick={saveProfile}>저장</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 회의진행일지 입력 모달 */}
                    {meetingMinutesModal && (
                        <div className="schedule-modal-overlay" onClick={() => setMeetingMinutesModal(null)}>
                            <div className="schedule-modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
                                <div className="schedule-modal-header">
                                    <h3>📋 회의진행일지 생성</h3>
                                    <button className="schedule-modal-close" onClick={() => setMeetingMinutesModal(null)}>&times;</button>
                                </div>
                                <div className="schedule-modal-body">
                                    <div className="schedule-form-group">
                                        <label>회의 제목</label>
                                        <input type="text" value={meetingMinutesForm.title}
                                            onChange={e => setMeetingMinutesForm(p => ({ ...p, title: e.target.value }))}
                                            placeholder="예: 2026년 청년노동권리교육 자문 회의" />
                                    </div>
                                    <div className="schedule-form-row">
                                        <div className="schedule-form-group">
                                            <label>일시</label>
                                            <input type="text" value={meetingMinutesForm.date}
                                                onChange={e => setMeetingMinutesForm(p => ({ ...p, date: e.target.value }))}
                                                placeholder="예: 2026-03-10 14:00" />
                                        </div>
                                        <div className="schedule-form-group">
                                            <label>장소</label>
                                            <input type="text" value={meetingMinutesForm.location}
                                                onChange={e => setMeetingMinutesForm(p => ({ ...p, location: e.target.value }))}
                                                placeholder="예: 청년노동자인권센터 사무실" />
                                        </div>
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>회의 내용 / 안건</label>
                                        <textarea rows="4" value={meetingMinutesForm.content}
                                            onChange={e => setMeetingMinutesForm(p => ({ ...p, content: e.target.value }))}
                                            placeholder="회의에서 다룬 안건, 논의 내용, 결정 사항 등을 입력하세요." />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>참석자 명단 <span style={{ fontWeight: 'normal', color: '#9C9690', fontSize: '12px' }}>(한 줄에 한 명씩 입력)</span></label>
                                        <textarea rows="5" value={meetingMinutesForm.participants}
                                            onChange={e => setMeetingMinutesForm(p => ({ ...p, participants: e.target.value }))}
                                            placeholder={'홍길동\n김영희\n이철수'} />
                                    </div>
                                </div>
                                <div className="schedule-modal-footer">
                                    <button className="btn" style={{ background: '#F8F6F1', border: '1px solid #EBE8E1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                        onClick={() => setMeetingMinutesModal(null)}>
                                        취소
                                    </button>
                                    <button className="btn btn-primary"
                                        onClick={() => {
                                            const participantList = meetingMinutesForm.participants
                                                .split('\n')
                                                .map(s => s.trim())
                                                .filter(Boolean);
                                            openMeetingMinutes({
                                                title: meetingMinutesForm.title,
                                                date: meetingMinutesForm.date,
                                                location: meetingMinutesForm.location,
                                                content: meetingMinutesForm.content,
                                                participants: participantList
                                            }, orgSettings);
                                            setMeetingMinutesModal(null);
                                        }}>
                                        📋 문서 생성
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 사업변경신청서 입력 모달 */}
                    {changeApplicationModal && (
                        <div className="schedule-modal-overlay" onClick={() => setChangeApplicationModal(false)}>
                            <div className="schedule-modal" style={{ maxWidth: 860, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                                <div className="schedule-modal-header">
                                    <h3>📝 사업변경신청서 생성</h3>
                                    <button className="schedule-modal-close" onClick={() => setChangeApplicationModal(false)}>&times;</button>
                                </div>
                                <div className="schedule-modal-body">
                                    {/* 섹션 1: 사유 */}
                                    <div className="schedule-form-group">
                                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>1. 사업변경취지 및 사유</label>
                                        <textarea rows="4" value={changeApplicationForm.reason}
                                            onChange={e => setChangeApplicationForm(p => ({ ...p, reason: e.target.value }))}
                                            placeholder="사업변경의 취지와 사유를 입력하세요." />
                                    </div>

                                    {/* 섹션 2: 사업변경내역 */}
                                    <div className="schedule-form-group">
                                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>2. 사업변경내역</label>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: 8 }}>
                                                <thead>
                                                    <tr>
                                                        <th colSpan="3" style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>변경 전</th>
                                                        <th colSpan="3" style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>변경 후</th>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '40px' }}></th>
                                                    </tr>
                                                    <tr>
                                                        {['단위사업', '일정', '추진내용', '단위사업', '일정', '추진내용'].map((h, i) => (
                                                            <th key={i} style={{ background: '#f9f9f9', border: '1px solid #ddd', padding: '4px 6px', fontSize: '11px', textAlign: 'center' }}>{h}</th>
                                                        ))}
                                                        <th style={{ background: '#f9f9f9', border: '1px solid #ddd', padding: '4px' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {changeApplicationForm.changeDetails.map((row, idx) => (
                                                        <tr key={idx}>
                                                            {['beforeUnit', 'beforeSchedule', 'beforeContent', 'afterUnit', 'afterSchedule', 'afterContent'].map(field => (
                                                                <td key={field} style={{ border: '1px solid #ddd', padding: '2px' }}>
                                                                    <input type="text" value={row[field]}
                                                                        style={{ width: '100%', border: 'none', padding: '4px', fontSize: '11px', background: 'transparent' }}
                                                                        onChange={e => {
                                                                            const updated = [...changeApplicationForm.changeDetails];
                                                                            updated[idx] = { ...updated[idx], [field]: e.target.value };
                                                                            setChangeApplicationForm(p => ({ ...p, changeDetails: updated }));
                                                                        }} />
                                                                </td>
                                                            ))}
                                                            <td style={{ border: '1px solid #ddd', padding: '2px', textAlign: 'center' }}>
                                                                {changeApplicationForm.changeDetails.length > 1 && (
                                                                    <button style={{ background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '14px' }}
                                                                        onClick={() => {
                                                                            const updated = changeApplicationForm.changeDetails.filter((_, i) => i !== idx);
                                                                            setChangeApplicationForm(p => ({ ...p, changeDetails: updated }));
                                                                        }}>✕</button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button style={{ marginTop: 6, padding: '4px 12px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                                            onClick={() => setChangeApplicationForm(p => ({
                                                ...p,
                                                changeDetails: [...p.changeDetails, { beforeUnit: '', beforeSchedule: '', beforeContent: '', afterUnit: '', afterSchedule: '', afterContent: '' }]
                                            }))}>
                                            + 행 추가
                                        </button>
                                    </div>

                                    {/* 섹션 3: 예산변경내역 */}
                                    <div className="schedule-form-group">
                                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>3. 예산변경내역</label>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginTop: 8 }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '15%' }}>관리그룹</th>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '25%' }}>단위사업</th>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '20%' }}>변경전 (원)</th>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '20%' }}>변경후 (원)</th>
                                                        <th style={{ background: '#f0f0f0', border: '1px solid #ddd', padding: '6px', width: '20%' }}>증감</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {BUDGET_DATA.categories.map(cat => {
                                                        let catBeforeTotal = 0;
                                                        let catAfterTotal = 0;
                                                        const subRows = cat.subcategories.map(sub => {
                                                            const bc = changeApplicationForm.budgetChanges[sub.id] || { before: sub.budget, after: sub.budget };
                                                            catBeforeTotal += bc.before;
                                                            catAfterTotal += bc.after;
                                                            const diff = bc.after - bc.before;
                                                            const changed = diff !== 0;
                                                            return (
                                                                <tr key={sub.id} style={changed ? { background: '#FFFDE7' } : {}}>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', fontSize: '11px' }}>{cat.name}</td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', fontSize: '11px' }}>{sub.name}</td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontSize: '11px', color: '#666' }}>
                                                                        {fmt(bc.before)}
                                                                    </td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '2px' }}>
                                                                        <input type="text" inputMode="numeric" value={fmtInput(bc.after)}
                                                                            style={{ width: '100%', border: 'none', padding: '4px', fontSize: '11px', textAlign: 'right', background: 'transparent' }}
                                                                            onChange={e => {
                                                                                const val = Number(parseInput(e.target.value)) || 0;
                                                                                setChangeApplicationForm(p => ({
                                                                                    ...p,
                                                                                    budgetChanges: { ...p.budgetChanges, [sub.id]: { ...p.budgetChanges[sub.id], after: val } }
                                                                                }));
                                                                            }} />
                                                                    </td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontSize: '11px',
                                                                        color: diff > 0 ? '#1B6B5A' : diff < 0 ? '#D32F2F' : '#666' }}>
                                                                        {diff > 0 ? '+' : ''}{fmt(diff)}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                        return (
                                                            <React.Fragment key={cat.id}>
                                                                {subRows}
                                                                <tr style={{ background: '#f5f5f5', fontWeight: 'bold' }}>
                                                                    <td colSpan="2" style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center', fontSize: '11px' }}>{cat.name} 소계</td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontSize: '11px' }}>{fmt(catBeforeTotal)}</td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontSize: '11px' }}>{fmt(catAfterTotal)}</td>
                                                                    <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontSize: '11px',
                                                                        color: (catAfterTotal - catBeforeTotal) > 0 ? '#1B6B5A' : (catAfterTotal - catBeforeTotal) < 0 ? '#D32F2F' : '#666' }}>
                                                                        {(catAfterTotal - catBeforeTotal) > 0 ? '+' : ''}{fmt(catAfterTotal - catBeforeTotal)}
                                                                    </td>
                                                                </tr>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                    {(() => {
                                                        let totalBefore = 0, totalAfter = 0;
                                                        BUDGET_DATA.categories.forEach(cat => cat.subcategories.forEach(sub => {
                                                            const bc = changeApplicationForm.budgetChanges[sub.id] || { before: sub.budget, after: sub.budget };
                                                            totalBefore += bc.before;
                                                            totalAfter += bc.after;
                                                        }));
                                                        const totalDiff = totalAfter - totalBefore;
                                                        return (
                                                            <tr style={{ background: '#e8e8e8', fontWeight: 'bold' }}>
                                                                <td colSpan="2" style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>합 계</td>
                                                                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>{fmt(totalBefore)}</td>
                                                                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>{fmt(totalAfter)}</td>
                                                                <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right',
                                                                    color: totalDiff > 0 ? '#1B6B5A' : totalDiff < 0 ? '#D32F2F' : '#666' }}>
                                                                    {totalDiff > 0 ? '+' : ''}{fmt(totalDiff)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* 섹션 4: 구체내역 */}
                                    <div className="schedule-form-group">
                                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>4. 구체내역</label>
                                        {changeApplicationForm.specificDetails.map((detail, idx) => (
                                            <div key={idx} style={{ border: '1px solid #ddd', borderRadius: 6, padding: 12, marginTop: 8, position: 'relative', background: '#fafafa' }}>
                                                {changeApplicationForm.specificDetails.length > 1 && (
                                                    <button style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#D32F2F', cursor: 'pointer', fontSize: '14px' }}
                                                        onClick={() => {
                                                            const updated = changeApplicationForm.specificDetails.filter((_, i) => i !== idx);
                                                            setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                        }}>✕</button>
                                                )}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                    <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                        <label style={{ fontSize: '12px' }}>단위사업명</label>
                                                        <input type="text" value={detail.unitName}
                                                            onChange={e => {
                                                                const updated = [...changeApplicationForm.specificDetails];
                                                                updated[idx] = { ...updated[idx], unitName: e.target.value };
                                                                setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                            }}
                                                            placeholder="예: 노동안전보건 교과서 기초연구" />
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                                                        <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                            <label style={{ fontSize: '12px' }}>변경전 금액</label>
                                                            <input type="text" inputMode="numeric" value={fmtInput(detail.beforeAmount)}
                                                                onChange={e => {
                                                                    const updated = [...changeApplicationForm.specificDetails];
                                                                    updated[idx] = { ...updated[idx], beforeAmount: Number(parseInput(e.target.value)) || 0 };
                                                                    setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                                }} />
                                                        </div>
                                                        <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                            <label style={{ fontSize: '12px' }}>변경후 금액</label>
                                                            <input type="text" inputMode="numeric" value={fmtInput(detail.afterAmount)}
                                                                onChange={e => {
                                                                    const updated = [...changeApplicationForm.specificDetails];
                                                                    updated[idx] = { ...updated[idx], afterAmount: Number(parseInput(e.target.value)) || 0 };
                                                                    setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                                }} />
                                                        </div>
                                                        <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                            <label style={{ fontSize: '12px' }}>증감</label>
                                                            <div style={{ padding: '8px', fontSize: '12px', color: (detail.afterAmount - detail.beforeAmount) > 0 ? '#1B6B5A' : (detail.afterAmount - detail.beforeAmount) < 0 ? '#D32F2F' : '#666' }}>
                                                                {(detail.afterAmount - detail.beforeAmount) > 0 ? '+' : ''}{fmt(detail.afterAmount - detail.beforeAmount)}원
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                        <label style={{ fontSize: '12px' }}>산출근거</label>
                                                        <textarea rows="2" value={detail.basis}
                                                            onChange={e => {
                                                                const updated = [...changeApplicationForm.specificDetails];
                                                                updated[idx] = { ...updated[idx], basis: e.target.value };
                                                                setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                            }}
                                                            placeholder="산출근거를 입력하세요" />
                                                    </div>
                                                    <div className="schedule-form-group" style={{ marginBottom: 4 }}>
                                                        <label style={{ fontSize: '12px' }}>사유</label>
                                                        <textarea rows="2" value={detail.reason}
                                                            onChange={e => {
                                                                const updated = [...changeApplicationForm.specificDetails];
                                                                updated[idx] = { ...updated[idx], reason: e.target.value };
                                                                setChangeApplicationForm(p => ({ ...p, specificDetails: updated }));
                                                            }}
                                                            placeholder="변경 사유를 입력하세요" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button style={{ marginTop: 8, padding: '4px 12px', fontSize: '12px', background: '#f0f0f0', border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer' }}
                                            onClick={() => setChangeApplicationForm(p => ({
                                                ...p,
                                                specificDetails: [...p.specificDetails, { unitName: '', beforeAmount: 0, afterAmount: 0, basis: '', reason: '' }]
                                            }))}>
                                            + 항목 추가
                                        </button>
                                    </div>

                                    {/* 신청일 */}
                                    <div className="schedule-form-group">
                                        <label style={{ fontWeight: 'bold', fontSize: '14px' }}>신청일</label>
                                        <input type="date" value={changeApplicationForm.applicationDate}
                                            onChange={e => setChangeApplicationForm(p => ({ ...p, applicationDate: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="schedule-modal-footer">
                                    <button className="btn" style={{ background: '#F8F6F1', border: '1px solid #EBE8E1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                        onClick={() => setChangeApplicationModal(false)}>
                                        취소
                                    </button>
                                    <button className="btn btn-primary"
                                        onClick={() => {
                                            openChangeApplication(changeApplicationForm, orgSettings);
                                            setChangeApplicationModal(false);
                                        }}>
                                        📝 문서 생성
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        // 앱 렌더링
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<ProjectManagementSystem />);


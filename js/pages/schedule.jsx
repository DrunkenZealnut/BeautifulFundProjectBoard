// pages/schedule.jsx — Schedule page (calendar, list, modal)
// Defined inside ProjectManagementSystem scope

            const renderScheduleModal = () => {
                if (!scheduleModal) return null;

                // 상세 보기 모달
                if (scheduleModal === 'detail' && selectedSchedule) {
                    const isGoogleEvent = !!selectedSchedule.htmlLink;
                    return (
                        <div className="schedule-modal-overlay" onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>
                            <div className="schedule-modal" onClick={e => e.stopPropagation()}>
                                <div className="schedule-modal-header">
                                    <h3>{selectedSchedule.title || selectedSchedule.summary}</h3>
                                    <button className="schedule-modal-close" onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>&times;</button>
                                </div>
                                <div className="schedule-modal-body">
                                    {isGoogleEvent && <div className="google-badge" style={{ marginBottom: 12 }}>G Google Calendar</div>}
                                    {!isGoogleEvent && selectedSchedule.category && (
                                        <span className={`badge badge-info`} style={{ marginBottom: 12, display: 'inline-block' }}>
                                            {selectedSchedule.category}
                                        </span>
                                    )}

                                    <div className="schedule-detail-row">
                                        <span className="schedule-detail-icon">📅</span>
                                        <span className="schedule-detail-label">날짜</span>
                                        <span className="schedule-detail-value">
                                            {isGoogleEvent
                                                ? (selectedSchedule.start.dateTime || selectedSchedule.start.date)
                                                : `${selectedSchedule.start_date}${selectedSchedule.end_date ? ' ~ ' + selectedSchedule.end_date : ''}`
                                            }
                                        </span>
                                    </div>

                                    {(isGoogleEvent ? selectedSchedule.start.dateTime : selectedSchedule.start_time) && (
                                        <div className="schedule-detail-row">
                                            <span className="schedule-detail-icon">🕒</span>
                                            <span className="schedule-detail-label">시간</span>
                                            <span className="schedule-detail-value">
                                                {isGoogleEvent
                                                    ? `${selectedSchedule.start.dateTime?.split('T')[1]?.substring(0,5) || ''} - ${selectedSchedule.end.dateTime?.split('T')[1]?.substring(0,5) || ''}`
                                                    : `${selectedSchedule.start_time} - ${selectedSchedule.end_time || ''}`
                                                }
                                            </span>
                                        </div>
                                    )}

                                    {(isGoogleEvent ? selectedSchedule.location : selectedSchedule.location) && (
                                        <div className="schedule-detail-row">
                                            <span className="schedule-detail-icon">📍</span>
                                            <span className="schedule-detail-label">장소</span>
                                            <span className="schedule-detail-value">{selectedSchedule.location}</span>
                                        </div>
                                    )}

                                    {!isGoogleEvent && (
                                        <div className="schedule-detail-row">
                                            <span className="schedule-detail-icon">👥</span>
                                            <span className="schedule-detail-label">참여자</span>
                                            <span className="schedule-detail-value">
                                                {selectedSchedule.current_participants || 0}/{selectedSchedule.max_participants || '-'}명
                                            </span>
                                        </div>
                                    )}

                                    {!isGoogleEvent && (
                                        <div className="schedule-detail-row">
                                            <span className="schedule-detail-icon">📋</span>
                                            <span className="schedule-detail-label">상태</span>
                                            <span className="schedule-detail-value">
                                                <span className={`badge ${
                                                    selectedSchedule.status === 'completed' ? 'badge-success' :
                                                    selectedSchedule.status === 'ongoing' ? 'badge-warning' : 'badge-info'
                                                }`}>
                                                    {selectedSchedule.status === 'completed' ? '완료' :
                                                     selectedSchedule.status === 'ongoing' ? '진행중' :
                                                     selectedSchedule.status === 'cancelled' ? '취소' : '예정'}
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    {(selectedSchedule.description || selectedSchedule.description) && (
                                        <div className="schedule-detail-row" style={{ flexDirection: 'column' }}>
                                            <span style={{ fontSize: 13, color: '#9C9690', marginBottom: 6 }}>📝 설명</span>
                                            <span style={{ fontSize: 14, color: '#2D2D2D', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {selectedSchedule.description}
                                            </span>
                                        </div>
                                    )}

                                    {/* F-07: 참여자 출석 관리 */}
                                    {!isGoogleEvent && selectedSchedule.participants && (() => {
                                        const names = selectedSchedule.participants.split(',').map(n => n.trim()).filter(Boolean);
                                        if (names.length === 0) return null;
                                        const att = getAttendance(selectedSchedule.id);
                                        return (
                                            <div style={{ marginTop: 16, padding: 16, background: '#F7FAFC', borderRadius: 12 }}>
                                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#1B6B5A' }}>📋 출석 관리</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {names.map(name => {
                                                        const status = att[name] || 'none';
                                                        return (
                                                            <div key={name} className="attendance-item" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'white', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                                                                <span style={{ fontSize: 13 }}>{name}</span>
                                                                <select value={status} onChange={e => setAttendance(selectedSchedule.id, name, e.target.value)}
                                                                    style={{ fontSize: 12, padding: '2px 6px', borderRadius: 4, border: '1px solid #CBD5E0',
                                                                        background: status === 'present' ? '#C6F6D5' : status === 'absent' ? '#FED7D7' : status === 'late' ? '#FEFCBF' : 'white',
                                                                        color: status === 'present' ? '#22543D' : status === 'absent' ? '#9B2C2C' : status === 'late' ? '#744210' : '#4A5568'
                                                                    }}>
                                                                    <option value="none">-</option>
                                                                    <option value="present">출석</option>
                                                                    <option value="absent">결석</option>
                                                                    <option value="late">지각</option>
                                                                </select>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: 12, color: '#718096' }}>
                                                        출석 {Object.values(att).filter(v => v === 'present').length} / 결석 {Object.values(att).filter(v => v === 'absent').length} / 지각 {Object.values(att).filter(v => v === 'late').length} / 미체크 {names.length - Object.values(att).filter(v => v !== 'none').length}
                                                    </span>
                                                    <button className="btn btn-secondary" style={{ fontSize: 11, padding: '3px 10px' }} onClick={() => {
                                                        const pw = window.open('', '_blank', 'width=700,height=500');
                                                        const rows = names.map(n => `<tr><td style="padding:6px 12px;border:1px solid #ddd">${n}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:center">${att[n] === 'present' ? '출석' : att[n] === 'absent' ? '결석' : att[n] === 'late' ? '지각' : '-'}</td></tr>`).join('');
                                                        pw.document.write(`<html><head><title>출석부</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th{background:#1B6B5A;color:white;padding:8px 12px;border:1px solid #ddd}</style></head><body><h2>${selectedSchedule.title} - 출석부</h2><p>일시: ${selectedSchedule.start_date || ''} ${selectedSchedule.start_time || ''}</p><table><thead><tr><th>이름</th><th>출석 상태</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:12px;font-size:13px;color:#666">출석 ${Object.values(att).filter(v=>v==='present').length} / 결석 ${Object.values(att).filter(v=>v==='absent').length} / 지각 ${Object.values(att).filter(v=>v==='late').length}</p></body></html>`);
                                                        pw.document.close();
                                                        pw.print();
                                                    }}>🖨️ 출석부 인쇄</button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="schedule-modal-footer">
                                    {isGoogleEvent && (
                                        <button className="btn btn-primary" onClick={() => importFromGoogleCalendar(selectedSchedule)}>
                                            Supabase에 가져오기
                                        </button>
                                    )}
                                    {!isGoogleEvent && googleConnected && (
                                        <button className="google-sync-btn" style={{ fontSize: 12 }} onClick={() => syncToGoogleCalendar(selectedSchedule)}>
                                            G Google에 동기화
                                        </button>
                                    )}
                                    {!isGoogleEvent && (
                                        <>
                                            <button className="btn" style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                                onClick={() => handleDeleteSchedule(selectedSchedule.id)}>
                                                삭제
                                            </button>
                                            <button className="btn btn-primary" onClick={() => {
                                                setScheduleForm({
                                                    title: selectedSchedule.title,
                                                    description: selectedSchedule.description || '',
                                                    category: selectedSchedule.category,
                                                    subcategory: selectedSchedule.subcategory || '',
                                                    start_date: selectedSchedule.start_date,
                                                    end_date: selectedSchedule.end_date || '',
                                                    start_time: selectedSchedule.start_time || '',
                                                    end_time: selectedSchedule.end_time || '',
                                                    location: selectedSchedule.location || '',
                                                    max_participants: selectedSchedule.max_participants || '',
                                                    status: selectedSchedule.status || 'planned',
                                                });
                                                setScheduleModal('edit');
                                            }}>
                                                수정
                                            </button>
                                        </>
                                    )}
                                    <button className="btn" style={{ background: '#F8F6F1', border: '1px solid #EBE8E1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                        onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>
                                        닫기
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }

                // 생성/수정 모달
                return (
                    <div className="schedule-modal-overlay" onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>
                        <div className="schedule-modal" onClick={e => e.stopPropagation()}>
                            <div className="schedule-modal-header">
                                <h3>{scheduleModal === 'edit' ? '일정 수정' : '새 일정 등록'}</h3>
                                <button className="schedule-modal-close" onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>&times;</button>
                            </div>
                            <div className="schedule-modal-body">
                                <div className="schedule-form-group">
                                    <label>제목 *</label>
                                    <input type="text" value={scheduleForm.title} placeholder="일정 제목"
                                        onChange={e => setScheduleForm(p => ({ ...p, title: e.target.value }))} />
                                </div>

                                <div className="schedule-form-row">
                                    <div className="schedule-form-group">
                                        <label>카테고리 *</label>
                                        <select value={scheduleForm.category}
                                            onChange={e => setScheduleForm(p => ({ ...p, category: e.target.value }))}>
                                            <option value="교육">교육</option>
                                            <option value="캠페인">캠페인</option>
                                            <option value="회의">회의</option>
                                            <option value="평가">평가</option>
                                            <option value="기타">기타</option>
                                        </select>
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>세부 카테고리</label>
                                        <input type="text" value={scheduleForm.subcategory} placeholder="선택사항"
                                            onChange={e => setScheduleForm(p => ({ ...p, subcategory: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="schedule-form-row">
                                    <div className="schedule-form-group">
                                        <label>시작일 *</label>
                                        <input type="date" value={scheduleForm.start_date}
                                            onChange={e => setScheduleForm(p => ({ ...p, start_date: e.target.value }))} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>종료일</label>
                                        <input type="date" value={scheduleForm.end_date}
                                            onChange={e => setScheduleForm(p => ({ ...p, end_date: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="schedule-form-row">
                                    <div className="schedule-form-group">
                                        <label>시작 시간</label>
                                        <input type="time" value={scheduleForm.start_time}
                                            onChange={e => setScheduleForm(p => ({ ...p, start_time: e.target.value }))} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>종료 시간</label>
                                        <input type="time" value={scheduleForm.end_time}
                                            onChange={e => setScheduleForm(p => ({ ...p, end_time: e.target.value }))} />
                                    </div>
                                </div>

                                <div className="schedule-form-group">
                                    <label>장소</label>
                                    <input type="text" value={scheduleForm.location} placeholder="장소"
                                        onChange={e => setScheduleForm(p => ({ ...p, location: e.target.value }))} />
                                </div>

                                <div className="schedule-form-row">
                                    <div className="schedule-form-group">
                                        <label>최대 참여자 수</label>
                                        <input type="number" value={scheduleForm.max_participants} placeholder="0"
                                            onChange={e => setScheduleForm(p => ({ ...p, max_participants: e.target.value }))} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>상태</label>
                                        <select value={scheduleForm.status}
                                            onChange={e => setScheduleForm(p => ({ ...p, status: e.target.value }))}>
                                            <option value="planned">예정</option>
                                            <option value="ongoing">진행중</option>
                                            <option value="completed">완료</option>
                                            <option value="cancelled">취소</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="schedule-form-group">
                                    <label>설명</label>
                                    <textarea rows="3" value={scheduleForm.description} placeholder="일정 설명"
                                        onChange={e => setScheduleForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                            </div>
                            <div className="schedule-modal-footer">
                                <button className="btn" style={{ background: '#F8F6F1', border: '1px solid #EBE8E1', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}
                                    onClick={() => { setScheduleModal(null); setSelectedSchedule(null); }}>
                                    취소
                                </button>
                                <button className="btn btn-primary" onClick={handleSaveSchedule}>
                                    {scheduleModal === 'edit' ? '수정' : '등록'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            };

            const renderScheduleCalendarView = () => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const today = new Date();
                const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
                const days = getCalendarDays(year, month);

                return (
                    <div className="calendar-grid">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="calendar-day-header">{day}</div>
                        ))}
                        {days.map((d, idx) => {
                            const dateStr = formatDateStr(
                                d.month < 0 ? d.year - 1 : d.month > 11 ? d.year + 1 : d.year,
                                d.month < 0 ? 11 : d.month > 11 ? 0 : d.month,
                                d.day
                            );
                            const isToday = dateStr === todayStr;
                            const isSelected = selectedDate === dateStr;
                            const { supabaseEvents: sEvents, googleEvents: gEvents } = getEventsForDate(dateStr);
                            const allEvents = [...sEvents.map(e => ({ ...e, type: 'supabase' })), ...gEvents.map(e => ({ ...e, type: 'google' }))];
                            const maxShow = 3;

                            return (
                                <div key={idx}
                                    className={`calendar-day${d.isOtherMonth ? ' other-month' : ''}${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                                    onClick={() => {
                                        setSelectedDate(dateStr);
                                        if (!d.isOtherMonth) {
                                            setScheduleForm(prev => ({ ...prev, start_date: dateStr }));
                                        }
                                    }}
                                    onDoubleClick={() => {
                                        if (!d.isOtherMonth) {
                                            setScheduleForm({
                                                title: '', description: '', category: '교육', subcategory: '',
                                                start_date: dateStr, end_date: '', start_time: '', end_time: '',
                                                location: '', max_participants: '', status: 'planned'
                                            });
                                            setScheduleModal('create');
                                        }
                                    }}>
                                    <div className="calendar-day-number">
                                        {d.day}
                                    </div>
                                    {allEvents.slice(0, maxShow).map((event, eIdx) => (
                                        <div key={eIdx}
                                            className={`calendar-event ${event.type === 'google' ? 'google-event' : `cat-${event.category}`}`}
                                            title={event.type === 'google' ? event.summary : event.title}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSchedule(event.type === 'google' ? event : event);
                                                setScheduleModal('detail');
                                            }}>
                                            {event.type === 'google' ? event.summary : event.title}
                                        </div>
                                    ))}
                                    {allEvents.length > maxShow && (
                                        <div className="calendar-event-more"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedDate(dateStr);
                                                setCalendarView('list');
                                            }}>
                                            +{allEvents.length - maxShow}개 더보기
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            };

            const renderScheduleListView = () => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`;
                const monthEnd = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

                const monthSchedules = data.schedules.filter(s => {
                    return s.start_date >= monthStart && s.start_date <= monthEnd;
                });

                const monthGoogleEvents = googleEvents.filter(e => {
                    const eDate = e.start.dateTime ? e.start.dateTime.split('T')[0] : e.start.date;
                    return eDate >= monthStart && eDate <= monthEnd;
                }).filter(ge => {
                    return !monthSchedules.some(se => se.title === ge.summary);
                });

                const allItems = [
                    ...monthSchedules.map(s => ({ ...s, type: 'supabase', sortDate: s.start_date })),
                    ...monthGoogleEvents.map(e => ({ ...e, type: 'google', sortDate: e.start.dateTime ? e.start.dateTime.split('T')[0] : e.start.date }))
                ].sort((a, b) => a.sortDate.localeCompare(b.sortDate));

                if (allItems.length === 0) {
                    return (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9C9690' }}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
                            <div style={{ fontSize: 16 }}>이번 달 등록된 일정이 없습니다.</div>
                            <div style={{ fontSize: 13, marginTop: 8 }}>날짜를 더블클릭하거나 + 버튼으로 일정을 추가하세요.</div>
                        </div>
                    );
                }

                return (
                    <div>
                        {allItems.map((item, idx) => {
                            const isGoogle = item.type === 'google';
                            const dateObj = new Date(item.sortDate + 'T00:00:00');
                            const monthStr = MONTHS_KR[dateObj.getMonth()];
                            const dayStr = dateObj.getDate();
                            const weekdayStr = WEEKDAYS[dateObj.getDay()];

                            return (
                                <div key={idx} className="schedule-list-card"
                                    onClick={() => {
                                        setSelectedSchedule(item);
                                        setScheduleModal('detail');
                                    }}>
                                    <div className="schedule-list-date">
                                        <div className="schedule-list-date-month">{monthStr}</div>
                                        <div className="schedule-list-date-day">{dayStr}</div>
                                        <div className="schedule-list-date-weekday">{weekdayStr}</div>
                                    </div>
                                    <div className="schedule-list-info">
                                        <div className="schedule-list-title">
                                            {isGoogle ? item.summary : item.title}
                                            {isGoogle && <span className="google-badge" style={{ marginLeft: 8 }}>G</span>}
                                        </div>
                                        <div className="schedule-list-meta">
                                            {!isGoogle && item.start_time && <span>🕒 {item.start_time}{item.end_time ? ` - ${item.end_time}` : ''}</span>}
                                            {isGoogle && item.start.dateTime && <span>🕒 {item.start.dateTime.split('T')[1]?.substring(0,5)}</span>}
                                            {(isGoogle ? item.location : item.location) && <span> &middot; 📍 {item.location}</span>}
                                            {!isGoogle && <span> &middot; 🏷️ {item.category}</span>}
                                            {!isGoogle && <span> &middot; 👥 {item.current_participants || 0}/{item.max_participants || '-'}</span>}
                                        </div>
                                    </div>
                                    {!isGoogle && (
                                        <span className={`badge ${
                                            item.status === 'completed' ? 'badge-success' :
                                            item.status === 'ongoing' ? 'badge-warning' : 'badge-info'
                                        }`} style={{ alignSelf: 'center' }}>
                                            {item.status === 'completed' ? '완료' :
                                             item.status === 'ongoing' ? '진행중' :
                                             item.status === 'cancelled' ? '취소' : '예정'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );
            };

            const renderSchedule = () => (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                            <h1 className="section-title">📅 일정 관리</h1>
                            <p className="section-subtitle">사업 일정과 참여자를 관리합니다. 날짜를 더블클릭하여 일정을 추가하세요.</p>
                        </div>
                        <button className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}
                            onClick={() => {
                                const today = new Date();
                                setScheduleForm({
                                    title: '', description: '', category: '교육', subcategory: '',
                                    start_date: formatDateStr(today.getFullYear(), today.getMonth(), today.getDate()),
                                    end_date: '', start_time: '', end_time: '',
                                    location: '', max_participants: '', status: 'planned'
                                });
                                setScheduleModal('create');
                            }}>
                            + 일정 추가
                        </button>
                    </div>

                    {/* 캘린더 헤더: 월 네비게이션 + 뷰 토글 + Google 연동 */}
                    <div className="calendar-header">
                        <div className="calendar-nav">
                            <button className="calendar-nav-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>◀</button>
                            <button className="calendar-nav-btn" onClick={() => setCalendarDate(new Date())} style={{ fontSize: 12 }}>오늘</button>
                            <span className="calendar-month-title">{calendarDate.getFullYear()}년 {MONTHS_KR[calendarDate.getMonth()]}</span>
                            <button className="calendar-nav-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>▶</button>
                        </div>

                        <div className="calendar-actions">
                            <div className="calendar-view-toggle">
                                <button className={`calendar-view-btn ${calendarView === 'month' ? 'active' : ''}`}
                                    onClick={() => setCalendarView('month')}>월간</button>
                                <button className={`calendar-view-btn ${calendarView === 'list' ? 'active' : ''}`}
                                    onClick={() => setCalendarView('list')}>목록</button>
                            </div>

                            {!googleConnected ? (
                                <button className="google-sync-btn" onClick={handleGoogleLogin}>
                                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                                    Google Calendar 연결
                                </button>
                            ) : (
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <button className={`google-sync-btn connected ${googleSyncing ? 'syncing' : ''}`}
                                        onClick={syncAllToGoogle} disabled={googleSyncing}>
                                        <svg width="14" height="14" viewBox="0 0 24 24"><path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/></svg>
                                        {googleSyncing ? '동기화 중...' : '전체 동기화'}
                                    </button>
                                    <button className="calendar-nav-btn" style={{ fontSize: 11, color: '#e74c3c' }}
                                        onClick={handleGoogleLogout}>
                                        연결 해제
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Google 연결 상태 안내 */}
                    {googleConnected && googleEvents.length > 0 && (
                        <div style={{ background: '#E8F0FE', borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13, color: '#1A73E8' }}>
                            Google Calendar에서 {googleEvents.length}개의 이벤트가 연동되었습니다.
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9C9690' }}>
                            데이터를 로딩 중입니다...
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#e74c3c' }}>
                            오류: {error}
                        </div>
                    ) : (
                        calendarView === 'month' ? renderScheduleCalendarView() : renderScheduleListView()
                    )}

                    {/* 선택된 날짜의 일정 요약 (캘린더 뷰) */}
                    {calendarView === 'month' && selectedDate && (() => {
                        const { supabaseEvents: sEvents, googleEvents: gEvents } = getEventsForDate(selectedDate);
                        const allSelected = [...sEvents, ...gEvents];
                        if (allSelected.length === 0) return null;

                        return (
                            <div style={{ marginTop: 20, background: 'white', borderRadius: 12, border: '1px solid #EBE8E1', padding: 20 }}>
                                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#134E42', marginBottom: 12 }}>
                                    📅 {selectedDate} 일정 ({allSelected.length}건)
                                </h3>
                                {sEvents.map(s => (
                                    <div key={s.id} className="schedule-list-card" style={{ cursor: 'pointer' }}
                                        onClick={() => { setSelectedSchedule(s); setScheduleModal('detail'); }}>
                                        <div className="schedule-list-info">
                                            <div className="schedule-list-title">{s.title}</div>
                                            <div className="schedule-list-meta">
                                                {s.start_time && <span>🕒 {s.start_time}</span>}
                                                {s.location && <span> &middot; 📍 {s.location}</span>}
                                                <span> &middot; 🏷️ {s.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {gEvents.map((ge, i) => (
                                    <div key={`g-${i}`} className="schedule-list-card" style={{ cursor: 'pointer' }}
                                        onClick={() => { setSelectedSchedule(ge); setScheduleModal('detail'); }}>
                                        <div className="schedule-list-info">
                                            <div className="schedule-list-title">
                                                {ge.summary} <span className="google-badge">G</span>
                                            </div>
                                            <div className="schedule-list-meta">
                                                {ge.start.dateTime && <span>🕒 {ge.start.dateTime.split('T')[1]?.substring(0,5)}</span>}
                                                {ge.location && <span> &middot; 📍 {ge.location}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    {/* 카테고리 범례 */}
                    <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#9C9690' }}>
                        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#D1ECF1', marginRight: 4, verticalAlign: 'middle' }}></span>교육</span>
                        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#FFF3CD', marginRight: 4, verticalAlign: 'middle' }}></span>캠페인</span>
                        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#E2D9F3', marginRight: 4, verticalAlign: 'middle' }}></span>회의</span>
                        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#D4EDDA', marginRight: 4, verticalAlign: 'middle' }}></span>평가</span>
                        <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#F0E6D3', marginRight: 4, verticalAlign: 'middle' }}></span>기타</span>
                        {googleConnected && <span><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 3, background: '#E8F0FE', border: '1px solid #4285F4', marginRight: 4, verticalAlign: 'middle' }}></span>Google</span>}
                    </div>

                    {renderScheduleModal()}
                </div>
            );

            // ===== 게시판 템플릿 공통 유틸리티 =====

            const BOARD_TYPE_MAP = {
                notice: { label: '공지', badge: 'badge-warning', icon: '📢' },
                materials: { label: '자료', badge: 'badge-success', icon: '📁' },
                report: { label: '보고서', badge: 'badge-info', icon: '📊' },
                free: { label: '자유', badge: 'badge-free', icon: '💬' }
            };

            const GALLERY_CATEGORY_MAP = {
                '현장사진': { icon: '📷', color: '#1B6B5A' },
                '결과물': { icon: '🎯', color: '#D97706' },
                '교육자료': { icon: '📚', color: '#7C3AED' },
                '캠페인': { icon: '📣', color: '#DC2626' },
                '행사': { icon: '🎉', color: '#2563EB' },
                '영수증': { icon: '🧾', color: '#059669' },
                '기타': { icon: '📌', color: '#6B7280' }
            };

            const ITEMS_PER_PAGE = 10;

            // 비밀번호 해시 유틸리티
            const hashPassword = async (password) => {
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const hash = await crypto.subtle.digest('SHA-256', data);
                return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
            };

            const verifyPostPassword = async (post, inputPassword) => {
                if (!post.post_password) return true; // 비밀번호가 없는 글은 통과
                const hashed = await hashPassword(inputPassword);
                return hashed === post.post_password;
            };

            // 링크 미리보기 추출 - 텍스트에서 URL을 감지
            const extractUrls = (text) => {
                const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
                return [...new Set(text.match(urlRegex) || [])];
            };

            // 링크 미리보기 데이터 가져오기 (CORS proxy 없이 기본 정보 표시)
            const fetchLinkPreview = async (url) => {
                try {
                    setLinkPreviewLoading(true);
                    // extract domain and path for display
                    const urlObj = new URL(url);
                    const domain = urlObj.hostname.replace('www.', '');
                    const preview = {
                        url: url,
                        title: domain + (urlObj.pathname !== '/' ? urlObj.pathname : ''),
                        description: url,
                        domain: domain,
                        image: null
                    };

                    // Try fetching via a simple proxy for og tags
                    try {
                        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 5000);
                        const response = await fetch(proxyUrl, { signal: controller.signal });
                        clearTimeout(timeoutId);

                        if (response.ok) {
                            const html = await response.text();
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(html, 'text/html');

                            const ogTitle = doc.querySelector('meta[property="og:title"]')?.content;
                            const ogDesc = doc.querySelector('meta[property="og:description"]')?.content;
                            const ogImage = doc.querySelector('meta[property="og:image"]')?.content;
                            const metaDesc = doc.querySelector('meta[name="description"]')?.content;
                            const titleTag = doc.querySelector('title')?.textContent;

                            if (ogTitle || titleTag) preview.title = ogTitle || titleTag;
                            if (ogDesc || metaDesc) preview.description = ogDesc || metaDesc;
                            if (ogImage) {
                                // Handle relative image URLs
                                preview.image = ogImage.startsWith('http') ? ogImage : new URL(ogImage, url).href;
                            }
                        }
                    } catch (fetchErr) {
                        // Fetch failed, use basic preview with domain info
                        console.log('Link preview fetch skipped:', fetchErr.message);
                    }

                    return preview;
                } catch (err) {
                    return { url, title: url, description: '', domain: '', image: null };
                } finally {
                    setLinkPreviewLoading(false);
                }
            };

            // 글 내용 변경 시 링크 미리보기 업데이트
            const handleContentChangeWithPreview = async (content) => {
                setBoardWriteData(prev => ({ ...prev, content }));
                const urls = extractUrls(content);
                const existingUrls = linkPreviews.map(p => p.url);
                const newUrls = urls.filter(u => !existingUrls.includes(u));

                // Remove previews for deleted URLs
                setLinkPreviews(prev => prev.filter(p => urls.includes(p.url)));

                // Fetch new previews
                for (const url of newUrls.slice(0, 3)) { // max 3 previews
                    const preview = await fetchLinkPreview(url);
                    setLinkPreviews(prev => {
                        if (prev.find(p => p.url === preview.url)) return prev;
                        return [...prev, preview];
                    });
                }
            };

            // 링크 미리보기 카드 컴포넌트

// pages/dashboard.jsx — Dashboard page
// Defined inside ProjectManagementSystem scope (shares state via closure)

            const DashboardGalleryThumb = ({ item, catInfo, onClick }) => {
                const [thumbUrl, setThumbUrl] = React.useState(
                    item.image_path && item.image_path !== 'placeholder' ? item.image_path : null
                );
                React.useEffect(() => {
                    // thumbUrl이 없을 때만 첨부파일에서 이미지 로드
                    // thumbUrl을 deps에서 제거: if(!thumbUrl)로 이미 방어되어 있으므로
                    // 포함하면 setThumbUrl 후 effect가 불필요하게 재실행됨
                    if (!thumbUrl) {
                        (async () => {
                            const { data: atts } = await supabase.from('attachments')
                                .select('file_path, file_type').eq('gallery_id', item.id)
                                .order('created_at', { ascending: true });
                            const img = atts?.find(a => a.file_type?.startsWith('image/'));
                            if (img) {
                                const { data: u } = supabase.storage.from('attachments').getPublicUrl(img.file_path);
                                if (u?.publicUrl) setThumbUrl(u.publicUrl);
                            }
                        })();
                    }
                }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

                return (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={onClick}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
                        style={{ cursor: 'pointer', borderRadius: 10, overflow: 'hidden', border: '1px solid #EBE8E1', transition: 'box-shadow 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                        <div style={{ height: 100, background: '#F8F6F1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {thumbUrl
                                ? <img src={thumbUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ fontSize: 28 }}>📷</span>
                            }
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2D2D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                            <div style={{ fontSize: 11, color: catInfo.color, marginTop: 2 }}>{catInfo.icon} {item.category}</div>
                        </div>
                    </div>
                );
            };

            const renderDashboard = () => {
                const alerts = getDashboardAlerts();
                // F-05: 예산 소진 분석
                const today = new Date();
                const yearStart = new Date(today.getFullYear(), 0, 1);
                const yearEnd = new Date(today.getFullYear(), 11, 31);
                const periodPct = Math.round(((today - yearStart) / (yearEnd - yearStart)) * 100);
                const totalSpent = (data?.budgetExecutions || []).reduce((s, e) => s + (e.amount || 0), 0);
                const budgetPct = Math.round((totalSpent / CONFIG.TOTAL_BUDGET) * 100);
                const burnRatio = periodPct > 0 ? (budgetPct / periodPct).toFixed(1) : 0;
                const remainingMonths = 12 - today.getMonth();
                const monthlyAvail = remainingMonths > 0 ? Math.round((CONFIG.TOTAL_BUDGET - totalSpent) / remainingMonths) : 0;

                return (
                <div>
                    <h1 className="section-title">🏠 전체 현황</h1>
                    <p className="section-subtitle">청년노동자인권센터 2026년 공익단체 인큐베이팅 지원사업의 전체 현황을 확인할 수 있습니다.</p>

                    {/* F-01: 알림 배너 */}
                    {alerts.length > 0 && (
                        <div className="alert-banner">
                            {alerts.slice(0, 5).map(a => (
                                <div key={a.id} className={`alert-item ${a.level}`}>
                                    <span>{a.level === 'urgent' ? '🔴' : a.level === 'warning' ? '🟠' : '🔵'}</span>
                                    <span style={{ flex: 1 }}>{a.text}</span>
                                    <button className="alert-dismiss" onClick={() => dismissAlert(a.id)}>&times;</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* F-05: 예산 소진 분석 */}
                    <div className="card" style={{ marginBottom: '16px', padding: '16px 20px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0' }}>📈 예산 소진 분석</h3>
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '12px', color: '#6B6560', marginBottom: '4px' }}>기간 경과율</div>
                                <div className="burn-rate-bar">
                                    <div className="burn-rate-fill" style={{ width: `${periodPct}%`, background: '#94A3B8' }}></div>
                                    <span className="burn-rate-label">{periodPct}%</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ fontSize: '12px', color: '#6B6560', marginBottom: '4px' }}>예산 집행률</div>
                                <div className="burn-rate-bar">
                                    <div className="burn-rate-fill" style={{ width: `${Math.min(budgetPct, 100)}%`, background: budgetPct > periodPct * 1.2 ? '#EF4444' : budgetPct > periodPct ? '#F59E0B' : '#22C55E' }}></div>
                                    <span className="burn-rate-label">{budgetPct}%</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px' }}>
                            <span>{burnRatio > 1.2 ? '⚠️' : burnRatio > 1 ? '🟡' : '🟢'} 집행 속도: 기간 대비 <strong>{burnRatio}배</strong></span>
                            <span>💰 남은 {remainingMonths}개월간 월평균 <strong>{fmt(monthlyAvail)}원</strong> 사용 가능</span>
                        </div>
                        {/* F-08: 분기별 보고서 자동 생성 */}
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 12px', marginTop: 8 }} onClick={() => {
                            const pw = window.open('', '_blank', 'width=900,height=700');
                            const execs = data?.budgetExecutions || [];
                            const qLabels = ['1분기 (1-3월)', '2분기 (4-6월)', '3분기 (7-9월)', '4분기 (10-12월)'];
                            const qData = [[], [], [], []];
                            execs.forEach(e => { if (e.execution_date) { const m = parseInt(e.execution_date.slice(5, 7)); qData[Math.floor((m - 1) / 3)].push(e); } });
                            const totalBudget = BUDGET_DATA.categories.reduce((s, c) => s + c.subcategories.reduce((ss, sc) => ss + sc.items.reduce((si, i) => si + i.amount, 0), 0), 0);
                            let html = `<!DOCTYPE html><html><head><title>분기별 사업 진행 보고서</title><style>body{font-family:sans-serif;padding:20px}h1{color:#134E42;text-align:center;font-size:18px}h2{color:#1B6B5A;margin-top:24px;font-size:15px}.qbox{border:1px solid #ddd;border-radius:8px;padding:12px;margin:8px 0}.stat{display:inline-block;padding:8px 16px;background:#f8f6f1;border-radius:6px;margin:4px;text-align:center}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #ddd;padding:4px 8px;font-size:12px}th{background:#134E42;color:white}@media print{body{padding:0}}</style></head><body><h1>분기별 사업 진행 보고서</h1><p style="text-align:center;color:#666;font-size:13px">청년노동자인권센터 • ${new Date().toLocaleDateString('ko-KR')}</p>`;
                            qLabels.forEach((label, qi) => {
                                const items = qData[qi];
                                const sum = items.reduce((s, e) => s + (e.amount || 0), 0);
                                const cumulSum = qData.slice(0, qi + 1).flat().reduce((s, e) => s + (e.amount || 0), 0);
                                html += `<div class="qbox"><h2>${label}</h2><div class="stat">건수: <b>${items.length}건</b></div><div class="stat">집행액: <b>${sum.toLocaleString()}원</b></div><div class="stat">누적 집행률: <b>${totalBudget > 0 ? ((cumulSum/totalBudget)*100).toFixed(1) : 0}%</b></div>`;
                                if (items.length > 0) {
                                    html += `<table><thead><tr><th>집행일</th><th>항목</th><th>금액</th><th>상태</th></tr></thead><tbody>`;
                                    items.slice(0, 10).forEach(e => { html += `<tr><td>${e.execution_date}</td><td>${e.budget_item_name||''}</td><td style="text-align:right">${(e.amount||0).toLocaleString()}원</td><td>${e.status||''}</td></tr>`; });
                                    if (items.length > 10) html += `<tr><td colspan="4" style="text-align:center;color:#999">외 ${items.length - 10}건...</td></tr>`;
                                    html += '</tbody></table>';
                                } else { html += '<p style="color:#999;font-size:13px">해당 분기 집행 내역 없음</p>'; }
                                html += '</div>';
                            });
                            html += '</body></html>';
                            pw.document.write(html); pw.document.close(); pw.print();
                        }}>📑 분기별 보고서</button>
                    </div>

                    {/* F-05: 카테고리별 과부족 분석 */}
                    {(() => {
                        const execs = data?.budgetExecutions || [];
                        if (execs.length === 0) return null;
                        // Build subcategory budget from BUDGET_DATA
                        const subcatBudgets = {};
                        BUDGET_DATA.categories.forEach(cat => cat.subcategories.forEach(sc => {
                            const budget = sc.items.reduce((s, i) => s + i.amount, 0);
                            subcatBudgets[sc.name] = (subcatBudgets[sc.name] || 0) + budget;
                        }));
                        // Sum spent per subcategory_name
                        const spent = {};
                        execs.forEach(e => { const k = e.subcategory_name || '기타'; spent[k] = (spent[k] || 0) + (e.amount || 0); });
                        const items = Object.keys(subcatBudgets).map(name => ({ name, budget: subcatBudgets[name], spent: spent[name] || 0 }))
                            .filter(i => i.budget > 0)
                            .map(i => ({ ...i, diff: i.budget - i.spent, pct: Math.round((i.spent / i.budget) * 100) }))
                            .sort((a, b) => b.pct - a.pct);
                        const over = items.filter(i => i.pct > 100);
                        const warn = items.filter(i => i.pct >= 80 && i.pct <= 100);
                        if (over.length === 0 && warn.length === 0) return null;
                        return (
                            <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px 0' }}>⚖️ 카테고리별 과부족 현황</h3>
                                {over.length > 0 && <div style={{ fontSize: 12, color: '#E53E3E', marginBottom: 8, fontWeight: 600 }}>🔴 초과 항목</div>}
                                {over.map(i => (
                                    <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                                        <span style={{ minWidth: 80, fontWeight: 500 }}>{i.name}</span>
                                        <div style={{ flex: 1, background: '#FED7D7', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                                            <div style={{ width: `${Math.min(i.pct, 200) / 2}%`, background: '#E53E3E', height: '100%', borderRadius: 4 }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: '#E53E3E', minWidth: 120, textAlign: 'right' }}>{i.pct}% ({fmt(Math.abs(i.diff))}원 초과)</span>
                                    </div>
                                ))}
                                {warn.length > 0 && <div style={{ fontSize: 12, color: '#D69E2E', marginBottom: 8, marginTop: over.length > 0 ? 8 : 0, fontWeight: 600 }}>🟡 주의 항목 (80%+)</div>}
                                {warn.map(i => (
                                    <div key={i.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13 }}>
                                        <span style={{ minWidth: 80, fontWeight: 500 }}>{i.name}</span>
                                        <div style={{ flex: 1, background: '#FEFCBF', borderRadius: 4, height: 16, overflow: 'hidden' }}>
                                            <div style={{ width: `${i.pct}%`, background: '#D69E2E', height: '100%', borderRadius: 4 }} />
                                        </div>
                                        <span style={{ fontSize: 11, color: '#D69E2E', minWidth: 120, textAlign: 'right' }}>{i.pct}% (잔여 {fmt(i.diff)}원)</span>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}

                    <div className="stats-grid">
                        <div
                            className="stat-card"
                            style={{ cursor: 'pointer', position: 'relative' }}
                            onClick={() => setCurrentPage('budget')}
                        >
                            <div className="stat-value">{data.stats.usageRate || 0}%</div>
                            <div className="stat-label">예산 집행률</div>
                            <div style={{
                                position: 'absolute',
                                top: '8px',
                                right: '8px',
                                fontSize: '14px',
                                opacity: '0.6'
                            }}>
                                💰
                            </div>
                        </div>
                        <div className="stat-card" onClick={() => setCurrentPage('schedule')} style={{ cursor: 'pointer' }}>
                            <div className="stat-value">{data.stats.upcomingSchedules || 0}</div>
                            <div className="stat-label">예정된 일정</div>
                            <div style={{ fontSize: '12px', color: '#9C9690', marginTop: '4px' }}>
                                전체: {data.schedules ? data.schedules.length : 0}개
                                {data.schedules && data.schedules.length === 0 && (
                                    <div>⚠️ 스케줄 데이터 없음</div>
                                )}
                            </div>
                        </div>
                        <div className="stat-card" role="button" tabIndex={0} onClick={() => setCurrentPage('gallery')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentPage('gallery'); } }} style={{ cursor: 'pointer' }}>
                            <div className="stat-value">{data.stats.totalGalleries || 0}</div>
                            <div className="stat-label">갤러리 사진</div>
                        </div>
                        <div className="stat-card" role="button" tabIndex={0} onClick={() => setCurrentPage('board')} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCurrentPage('board'); } }} style={{ cursor: 'pointer' }}>
                            <div className="stat-value">{data.stats.totalBoards || 0}</div>
                            <div className="stat-label">게시글</div>
                        </div>
                    </div>

                    {/* 성과지표 달성현황 */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div className="card-header">
                            <h2 className="card-title">🎯 성과지표 달성현황</h2>
                            {currentUser && currentUser.role === 'admin' && !perfEditing && (
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '12px', padding: '4px 10px' }}
                                    onClick={() => { setPerfEditing(true); setPerfDraft({ ...perfIndicators }); setPerfMsg(''); }}
                                >수정</button>
                            )}
                            {perfEditing && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: '12px', padding: '4px 10px' }}
                                        onClick={() => { setPerfEditing(false); setPerfDraft(null); setPerfMsg(''); }}
                                        disabled={perfSaving}
                                    >취소</button>
                                    <button
                                        className="btn btn-primary"
                                        style={{ fontSize: '12px', padding: '4px 10px' }}
                                        onClick={handleSavePerfIndicators}
                                        disabled={perfSaving}
                                    >{perfSaving ? '저장 중...' : '저장'}</button>
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', padding: '8px 0' }}>
                            {/* 교과서기초연구 */}
                            <div style={{ background: '#F9F7F4', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#3D3530' }}>📚 교과서기초연구</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#6B6560' }}>팀 구성</span>
                                        {perfEditing ? (
                                            <select
                                                value={perfDraft.perf_textbook_team}
                                                onChange={e => setPerfDraft(d => ({ ...d, perf_textbook_team: e.target.value }))}
                                                style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #D4CFC9' }}
                                            >
                                                <option value="0">❌ 미완료</option>
                                                <option value="1">✅ 완료</option>
                                            </select>
                                        ) : (
                                            <span className={`badge ${perfIndicators.perf_textbook_team === '1' ? 'badge-success' : 'badge-warning'}`}>
                                                {perfIndicators.perf_textbook_team === '1' ? '✅ 완료' : '❌ 미완료'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#6B6560' }}>보고서 완료</span>
                                        {perfEditing ? (
                                            <select
                                                value={perfDraft.perf_textbook_report}
                                                onChange={e => setPerfDraft(d => ({ ...d, perf_textbook_report: e.target.value }))}
                                                style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #D4CFC9' }}
                                            >
                                                <option value="0">❌ 미완료</option>
                                                <option value="1">✅ 완료</option>
                                            </select>
                                        ) : (
                                            <span className={`badge ${perfIndicators.perf_textbook_report === '1' ? 'badge-success' : 'badge-warning'}`}>
                                                {perfIndicators.perf_textbook_report === '1' ? '✅ 완료' : '❌ 미완료'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* 캠페인 */}
                            <div style={{ background: '#F9F7F4', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#3D3530' }}>📣 캠페인</div>
                                {(() => {
                                    const count = perfEditing ? parseInt(perfDraft.perf_campaign_count, 10) || 0 : parseInt(perfIndicators.perf_campaign_count, 10) || 0;
                                    const pct = Math.min(100, Math.round(count / 30 * 100));
                                    return (
                                        <React.Fragment>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', color: '#6B6560' }}>진행 횟수 / 30회</span>
                                                {perfEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="30"
                                                        value={perfDraft.perf_campaign_count}
                                                        onChange={e => setPerfDraft(d => ({ ...d, perf_campaign_count: e.target.value }))}
                                                        style={{ width: '60px', fontSize: '13px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #D4CFC9', textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: '700', fontSize: '18px', color: '#5B21B6' }}>{count}<span style={{ fontWeight: '400', fontSize: '13px', color: '#9C9690' }}>/30</span></span>
                                                )}
                                            </div>
                                            <div style={{ background: '#E8E0F0', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: '#7C3AED', borderRadius: '6px', transition: 'width 0.4s' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#9C9690', marginTop: '4px', textAlign: 'right' }}>{pct}% 달성</div>
                                        </React.Fragment>
                                    );
                                })()}
                            </div>
                            {/* APP */}
                            <div style={{ background: '#F9F7F4', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#3D3530' }}>📱 APP</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#6B6560' }}>네이티브 APP 출시</span>
                                    {perfEditing ? (
                                        <select
                                            value={perfDraft.perf_app_released}
                                            onChange={e => setPerfDraft(d => ({ ...d, perf_app_released: e.target.value }))}
                                            style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #D4CFC9' }}
                                        >
                                            <option value="0">❌ 미출시</option>
                                            <option value="1">✅ 출시</option>
                                        </select>
                                    ) : (
                                        <span className={`badge ${perfIndicators.perf_app_released === '1' ? 'badge-success' : 'badge-warning'}`}>
                                            {perfIndicators.perf_app_released === '1' ? '✅ 출시' : '❌ 미출시'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* 운영위원회 */}
                            <div style={{ background: '#F9F7F4', borderRadius: '10px', padding: '16px' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '12px', color: '#3D3530' }}>🏛️ 운영위원회</div>
                                {(() => {
                                    const count = perfEditing ? parseInt(perfDraft.perf_committee_count, 10) || 0 : parseInt(perfIndicators.perf_committee_count, 10) || 0;
                                    const pct = Math.min(100, Math.round(count / 12 * 100));
                                    return (
                                        <React.Fragment>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontSize: '13px', color: '#6B6560' }}>진행 횟수 / 12회</span>
                                                {perfEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="12"
                                                        value={perfDraft.perf_committee_count}
                                                        onChange={e => setPerfDraft(d => ({ ...d, perf_committee_count: e.target.value }))}
                                                        style={{ width: '60px', fontSize: '13px', padding: '2px 6px', borderRadius: '6px', border: '1px solid #D4CFC9', textAlign: 'center' }}
                                                    />
                                                ) : (
                                                    <span style={{ fontWeight: '700', fontSize: '18px', color: '#1D6B4A' }}>{count}<span style={{ fontWeight: '400', fontSize: '13px', color: '#9C9690' }}>/12</span></span>
                                                )}
                                            </div>
                                            <div style={{ background: '#D4EDDA', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                                                <div style={{ width: `${pct}%`, height: '100%', background: '#1D6B4A', borderRadius: '6px', transition: 'width 0.4s' }} />
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#9C9690', marginTop: '4px', textAlign: 'right' }}>{pct}% 달성</div>
                                        </React.Fragment>
                                    );
                                })()}
                            </div>
                        </div>
                        {perfMsg && (
                            <div style={{ fontSize: '13px', color: perfMsg.includes('오류') ? '#dc3545' : '#28a745', marginTop: '8px' }}>{perfMsg}</div>
                        )}
                    </div>

                    {/* 집행 추이 차트 */}
                    {data.budgetExecutions && data.budgetExecutions.length > 0 && (
                        <div className="card" style={{ marginBottom: '24px' }}>
                            <div className="card-header">
                                <h2 className="card-title">📈 월별 집행 추이 (카테고리별)</h2>
                            </div>
                            <canvas ref={node => { monthlyChartRef.current = node; if (node) renderMonthlyChart(); }} />
                        </div>
                    )}

                    <div className="grid-2">
                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">📅 최근 일정</h2>
                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}
                                    onClick={() => setCurrentPage('schedule')}>전체보기</button>
                            </div>
                            {data.schedules.slice(0, 5).map(schedule => (
                                <div key={schedule.id} className="item-card" role="button" tabIndex={0} style={{ cursor: 'pointer' }}
                                    onClick={() => {
                                        setSelectedDate(schedule.start_date);
                                        setSelectedSchedule(schedule);
                                        setScheduleModal('detail');
                                        setCurrentPage('schedule');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setSelectedDate(schedule.start_date);
                                            setSelectedSchedule(schedule);
                                            setScheduleModal('detail');
                                            setCurrentPage('schedule');
                                        }
                                    }}>
                                    <div className="item-title">{schedule.title}</div>
                                    <div className="item-meta">
                                        📅 {schedule.start_date}<br/>
                                        📍 {schedule.location}<br/>
                                        🏷️ {schedule.category}
                                        {schedule.subcategory && ` > ${schedule.subcategory}`}
                                    </div>
                                </div>
                            ))}
                            {data.schedules.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#9C9690', padding: '20px' }}>
                                    등록된 일정이 없습니다.
                                </div>
                            )}
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <h2 className="card-title">📋 최근 게시글</h2>
                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}
                                    onClick={() => setCurrentPage('board')}>전체보기</button>
                            </div>
                            {data.boards.slice(0, 5).map(board => {
                                const typeInfo = BOARD_TYPE_MAP[board.board_type] || { label: board.board_type, badge: 'badge-info', icon: '📄' };
                                return (
                                    <div
                                        key={board.id}
                                        className="item-card"
                                        onClick={() => {
                                            supabase.from('boards').update({ view_count: (board.view_count || 0) + 1 }).eq('id', board.id).catch(err => console.error('조회수 업데이트 실패:', err));
                                            setSelectedPost({ ...board, view_count: (board.view_count || 0) + 1 });
                                            setBoardView('detail');
                                            setCurrentPage('board');
                                            loadAttachments('board', board.id).then(setDetailAttachments);
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="item-title">{board.title}</div>
                                                <div className="item-meta">
                                                    ✍️ {board.author?.name || '관리자'} •
                                                    📅 {new Date(board.created_at).toLocaleDateString()} •
                                                    👁️ {board.view_count || 0}회
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', marginLeft: '8px', flexShrink: 0 }}>
                                                {board.is_pinned && (
                                                    <span className="badge badge-warning">📌</span>
                                                )}
                                                <span className={`badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {data.boards.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#9C9690', padding: '20px' }}>
                                    등록된 게시글이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* F-08: 월별 집행 추이 */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h2 className="card-title">📊 월별 집행 추이</h2>
                        </div>
                        {(() => {
                            const monthlyData = {};
                            (data?.budgetExecutions || []).forEach(ex => {
                                if (ex.execution_date) {
                                    const m = ex.execution_date.slice(0, 7);
                                    monthlyData[m] = (monthlyData[m] || 0) + (ex.amount || 0);
                                }
                            });
                            const months = Object.keys(monthlyData).sort();
                            const maxAmt = Math.max(...Object.values(monthlyData), 1);
                            return months.length > 0 ? (
                                <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 120, padding: '8px 0' }}>
                                    {months.map(m => {
                                        const h = Math.max(8, (monthlyData[m] / maxAmt) * 100);
                                        return (
                                            <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <div style={{ fontSize: 10, color: '#6B6560', fontWeight: 600 }}>{fmt(monthlyData[m])}</div>
                                                <div style={{ width: '100%', maxWidth: 40, height: `${h}%`, background: '#1B6B5A', borderRadius: '4px 4px 0 0', minHeight: 8 }} />
                                                <div style={{ fontSize: 10, color: '#9C9690' }}>{m.split('-')[1]}월</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <div style={{ textAlign: 'center', color: '#9C9690', padding: 20, fontSize: 13 }}>아직 집행 데이터가 없습니다.</div>;
                        })()}
                    </div>

                    {/* F-08: 카테고리별 집행 현황 */}
                    <div className="card" style={{ marginTop: '20px' }}>
                        <div className="card-header">
                            <h2 className="card-title">🏷️ 카테고리별 집행 현황</h2>
                        </div>
                        {(() => {
                            const catData = {};
                            (data?.budgetExecutions || []).forEach(ex => {
                                const cat = ex.category_name || '기타';
                                catData[cat] = (catData[cat] || 0) + (ex.amount || 0);
                            });
                            const cats = Object.entries(catData).sort((a, b) => b[1] - a[1]);
                            const totalCat = cats.reduce((s, [, v]) => s + v, 0);
                            return cats.length > 0 ? (
                                <div style={{ padding: '8px 0' }}>
                                    {cats.map(([name, amount]) => {
                                        const pct = totalCat > 0 ? ((amount / totalCat) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80, color: '#2D3748' }}>{name}</span>
                                                <div style={{ flex: 1, background: '#EDF2F7', borderRadius: 4, height: 20, overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, background: '#1B6B5A', height: '100%', borderRadius: 4, minWidth: 2 }} />
                                                </div>
                                                <span style={{ fontSize: 12, color: '#4A5568', minWidth: 100, textAlign: 'right' }}>{fmt(amount)}원 ({pct}%)</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : <div style={{ textAlign: 'center', color: '#9C9690', padding: 20, fontSize: 13 }}>아직 집행 데이터가 없습니다.</div>;
                        })()}
                    </div>

                    {/* F-08: 예산 vs 성과 상관관계 */}
                    {(() => {
                        const execs = data?.budgetExecutions || [];
                        if (execs.length === 0) return null;
                        const catSpent = {};
                        execs.forEach(e => { const c = e.category_name || '기타'; catSpent[c] = (catSpent[c] || 0) + (e.amount || 0); });
                        const perfItems = [
                            { name: '교과서기초연구', perf: perfIndicators.perf_textbook_team === '1' && perfIndicators.perf_textbook_report === '1' ? 100 : perfIndicators.perf_textbook_team === '1' || perfIndicators.perf_textbook_report === '1' ? 50 : 0 },
                            { name: '캠페인', perf: Math.min(100, Math.round((parseInt(perfIndicators.perf_campaign_count) || 0) / 30 * 100)) },
                            { name: 'APP', perf: perfIndicators.perf_app_released === '1' ? 100 : 0 },
                            { name: '운영위원회', perf: Math.min(100, Math.round((parseInt(perfIndicators.perf_committee_count) || 0) / 12 * 100)) }
                        ];
                        const totalExec = Object.values(catSpent).reduce((s, v) => s + v, 0) || 1;
                        return (
                            <div className="card" style={{ marginTop: 20 }}>
                                <div className="card-header"><h2 className="card-title">🔗 예산 vs 성과 상관관계</h2></div>
                                <div style={{ padding: '8px 0' }}>
                                    {perfItems.map(p => {
                                        const spent = catSpent[p.name] || 0;
                                        const spentPct = Math.round((spent / totalExec) * 100);
                                        return (
                                            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13 }}>
                                                <span style={{ minWidth: 80, fontWeight: 500 }}>{p.name}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                                                        <span style={{ fontSize: 10, color: '#718096', minWidth: 32 }}>집행</span>
                                                        <div style={{ flex: 1, height: 8, background: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                                                            <div style={{ width: `${spentPct}%`, height: '100%', background: '#3182CE', borderRadius: 4 }} />
                                                        </div>
                                                        <span style={{ fontSize: 10, color: '#4A5568', minWidth: 30 }}>{spentPct}%</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                                        <span style={{ fontSize: 10, color: '#718096', minWidth: 32 }}>성과</span>
                                                        <div style={{ flex: 1, height: 8, background: '#EDF2F7', borderRadius: 4, overflow: 'hidden' }}>
                                                            <div style={{ width: `${p.perf}%`, height: '100%', background: '#38A169', borderRadius: 4 }} />
                                                        </div>
                                                        <span style={{ fontSize: 10, color: '#4A5568', minWidth: 30 }}>{p.perf}%</span>
                                                    </div>
                                                </div>
                                                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: p.perf >= spentPct ? '#C6F6D5' : '#FED7D7', color: p.perf >= spentPct ? '#22543D' : '#9B2C2C' }}>{p.perf >= spentPct ? '효율적' : '저조'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}

                    {/* F-04: 최근 활동 위젯 */}
                    {(() => {
                        const recentLogs = activityLogs.slice(0, 5);
                        if (recentLogs.length === 0) return null;
                        const logIcon = (action) => {
                            if (action.includes('삭제')) return '🗑️';
                            if (action.includes('등록') || action.includes('추가')) return '➕';
                            if (action.includes('수정') || action.includes('변경')) return '✏️';
                            if (action.includes('승인')) return '✅';
                            if (action.includes('로그인')) return '🔑';
                            return '📋';
                        };
                        return (
                            <div className="card" style={{ marginTop: '20px' }}>
                                <div className="card-header">
                                    <h2 className="card-title">🕐 최근 활동</h2>
                                    <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}
                                        onClick={() => { setCurrentPage('admin'); }}>전체보기</button>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                    {recentLogs.map(log => (
                                        <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderBottom: '1px solid #F0EDE8', fontSize: 13 }}>
                                            <span>{logIcon(log.action)}</span>
                                            <span style={{ flex: 1 }}><b>{log.user_name || '시스템'}</b> {log.action}{log.details ? ` — ${log.details}` : ''}</span>
                                            <span style={{ color: '#9C9690', fontSize: 11, flexShrink: 0 }}>{new Date(log.created_at).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* F-07: 참여율 통계 위젯 */}
                    {(() => {
                        const schedules = data?.schedules || [];
                        let totalP = 0, presentP = 0;
                        schedules.forEach(s => {
                            if (s.participants) {
                                const names = s.participants.split(',').map(n => n.trim()).filter(Boolean);
                                const att = attendanceData[s.id] || {};
                                totalP += names.length;
                                presentP += names.filter(n => att[n] === 'present').length;
                            }
                        });
                        if (totalP === 0) return null;
                        const rate = Math.round((presentP / totalP) * 100);
                        return (
                            <div className="card" style={{ marginTop: '20px', padding: '16px 20px' }}>
                                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px 0' }}>📋 참여율 현황</h3>
                                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: `conic-gradient(#1B6B5A ${rate * 3.6}deg, #EDF2F7 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#1B6B5A' }}>{rate}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 13, color: '#4A5568' }}>전체 참여 대상: <b>{totalP}명</b></div>
                                        <div style={{ fontSize: 13, color: '#22543D' }}>출석: <b>{presentP}명</b></div>
                                        <div style={{ fontSize: 13, color: '#9C9690' }}>평균 참여율: <b>{rate}%</b></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Recent gallery */}
                    {data.galleries.length > 0 && (
                        <div className="card" style={{ marginTop: '20px' }}>
                            <div className="card-header">
                                <h2 className="card-title">📸 최근 갤러리</h2>
                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }}
                                    onClick={() => setCurrentPage('gallery')}>전체보기</button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', padding: '4px 0' }}>
                                {data.galleries.slice(0, 6).map(item => {
                                    const catInfo = GALLERY_CATEGORY_MAP[item.category] || { icon: '📌', color: '#6B7280' };
                                    return (
                                        <DashboardGalleryThumb key={item.id} item={item} catInfo={catInfo}
                                            onClick={() => {
                                                // Fire-and-forget view count increment
                                                supabase.from('galleries').update({ view_count: (item.view_count || 0) + 1 }).eq('id', item.id).catch(console.error);
                                                setSelectedGalleryItem({ ...item, view_count: (item.view_count || 0) + 1 });
                                                setGalleryView('detail');
                                                setCurrentPage('gallery');
                                                loadAttachments('gallery', item.id).then(setDetailAttachments);
                                            }} />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
            };


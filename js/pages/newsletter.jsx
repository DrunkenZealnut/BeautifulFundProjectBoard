// pages/newsletter.jsx — Newsletter builder page
// Defined inside ProjectManagementSystem scope

            const renderNewsletter = () => {
                const SCHEDULE_CATS = ['all', '교육', '캠페인', '회의', '평가', '기타'];
                const BOARD_TYPES = [
                    { value: 'all', label: '전체' }, { value: 'notice', label: '공지' },
                    { value: 'materials', label: '자료' }, { value: 'report', label: '보고서' }, { value: 'free', label: '자유' }
                ];

                const filteredSchedules = (data.schedules || []).filter(s => {
                    if (newsletterConfig.dateFrom && s.start_date < newsletterConfig.dateFrom) return false;
                    if (newsletterConfig.dateTo && s.start_date > newsletterConfig.dateTo) return false;
                    if (newsletterConfig.scheduleCategory !== 'all' && s.category !== newsletterConfig.scheduleCategory) return false;
                    return true;
                });

                const filteredBoards = (data.boards || []).filter(b => {
                    const createdDate = b.created_at ? b.created_at.split('T')[0] : '';
                    if (newsletterConfig.dateFrom && createdDate < newsletterConfig.dateFrom) return false;
                    if (newsletterConfig.dateTo && createdDate > newsletterConfig.dateTo) return false;
                    if (newsletterConfig.boardCategory !== 'all' && b.board_type !== newsletterConfig.boardCategory) return false;
                    return true;
                });

                const toggleSchedule = (id) => {
                    setSelectedScheduleIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
                };
                const toggleAllSchedules = () => {
                    setSelectedScheduleIds(prev => prev.size === filteredSchedules.length ? new Set() : new Set(filteredSchedules.map(s => s.id)));
                };
                const toggleBoard = (id) => {
                    setSelectedBoardIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
                };
                const toggleAllBoards = () => {
                    setSelectedBoardIds(prev => prev.size === filteredBoards.length ? new Set() : new Set(filteredBoards.map(b => b.id)));
                };

                const handlePrintNewsletter = () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    if (selSchedules.length === 0 && selBoards.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const html = generateNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id)), galleryThumbUrls);
                    const pw = window.open('', '_blank', 'width=900,height=700');
                    if (!pw) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
                    pw.document.write(html);
                    pw.document.close();
                };

                // Copy newsletter as rich HTML to clipboard (for SNS paste)
                const handleCopyNewsletter = async () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    if (selSchedules.length === 0 && selBoards.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const fullHtml = generateNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id)), galleryThumbUrls);
                    // Extract body content only (between <body> and </body>)
                    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    const bodyHtml = bodyMatch ? bodyMatch[1] : fullHtml;
                    // Remove no-print buttons
                    const cleanHtml = bodyHtml.replace(/<div class="no-print"[\s\S]*?<\/div>/gi, '');
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                'text/html': new Blob([cleanHtml], { type: 'text/html' }),
                                'text/plain': new Blob([cleanHtml.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
                            })
                        ]);
                        alert('뉴스레터가 클립보드에 복사되었습니다!\n카카오톡, 이메일, 블로그 등에 Ctrl+V로 붙여넣기하세요.');
                    } catch (err) {
                        // Fallback: select and copy from hidden element
                        const temp = document.createElement('div');
                        temp.innerHTML = cleanHtml;
                        temp.style.position = 'fixed'; temp.style.left = '-9999px';
                        document.body.appendChild(temp);
                        const range = document.createRange();
                        range.selectNodeContents(temp);
                        const sel = window.getSelection();
                        sel.removeAllRanges(); sel.addRange(range);
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        document.body.removeChild(temp);
                        alert('뉴스레터가 클립보드에 복사되었습니다!');
                    }
                };

                // Open full-styled newsletter (Tailwind design) in new window
                const handleFullNewsletter = () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const html = generateFullNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls);
                    const pw = window.open('', '_blank', 'width=900,height=700');
                    if (!pw) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
                    pw.document.write(html);
                    pw.document.close();
                };

                // Copy full-styled newsletter HTML to clipboard
                const handleCopyFullNewsletter = async () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const fullHtml = generateFullNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls);
                    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    const bodyHtml = bodyMatch ? bodyMatch[1] : fullHtml;
                    const cleanHtml = bodyHtml.replace(/<div class="no-print"[\s\S]*?<\/div>\s*<\/div>/i, '');
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                'text/html': new Blob([cleanHtml], { type: 'text/html' }),
                                'text/plain': new Blob([cleanHtml.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
                            })
                        ]);
                        alert('풀 뉴스레터가 클립보드에 복사되었습니다!\n이메일, 블로그, SNS 등에 붙여넣기하세요.');
                    } catch (err) {
                        const temp = document.createElement('div');
                        temp.innerHTML = cleanHtml;
                        temp.style.position = 'fixed'; temp.style.left = '-9999px';
                        document.body.appendChild(temp);
                        const range = document.createRange();
                        range.selectNodeContents(temp);
                        const sel = window.getSelection();
                        sel.removeAllRanges(); sel.addRange(range);
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        document.body.removeChild(temp);
                        alert('풀 뉴스레터가 클립보드에 복사되었습니다!');
                    }
                };

                // Open section-based newsletter (주요소식, 다가올일정, 우리의생각, 구독, 단체정보)
                const handleSectionNewsletter = () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const html = generateSectionNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls, orgSettings);
                    const pw = window.open('', '_blank', 'width=900,height=700');
                    if (!pw) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
                    pw.document.write(html);
                    pw.document.close();
                };

                // Copy section-based newsletter HTML to clipboard
                const handleCopySectionNewsletter = async () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const fullHtml = generateSectionNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls, orgSettings);
                    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    const bodyHtml = bodyMatch ? bodyMatch[1] : fullHtml;
                    const cleanHtml = bodyHtml.replace(/<div class="no-print"[\s\S]*?<\/div>\s*<\/div>/i, '');
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                'text/html': new Blob([cleanHtml], { type: 'text/html' }),
                                'text/plain': new Blob([cleanHtml.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
                            })
                        ]);
                        alert('섹션 뉴스레터가 클립보드에 복사되었습니다!\n이메일, 블로그, SNS 등에 붙여넣기하세요.');
                    } catch (err) {
                        const temp = document.createElement('div');
                        temp.innerHTML = cleanHtml;
                        temp.style.position = 'fixed'; temp.style.left = '-9999px';
                        document.body.appendChild(temp);
                        const range = document.createRange();
                        range.selectNodeContents(temp);
                        const sel = window.getSelection();
                        sel.removeAllRanges(); sel.addRange(range);
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        document.body.removeChild(temp);
                        alert('섹션 뉴스레터가 클립보드에 복사되었습니다!');
                    }
                };

                // Open digest-style newsletter in new window
                const handleDigestNewsletter = () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const html = generateDigestNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls, orgSettings);
                    const pw = window.open('', '_blank', 'width=900,height=700');
                    if (!pw) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
                    pw.document.write(html);
                    pw.document.close();
                };

                // Copy digest newsletter HTML to clipboard
                const handleCopyDigestNewsletter = async () => {
                    const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                    if (selSchedules.length === 0 && selBoards.length === 0 && selGalleries.length === 0) {
                        alert('뉴스레터에 포함할 항목을 선택해주세요.');
                        return;
                    }
                    const fullHtml = generateDigestNewsletterHTML(newsletterConfig, selSchedules, selBoards, DEFAULT_ORG_NAME, boardImageUrls, rewrittenContents, selGalleries, galleryThumbUrls, orgSettings);
                    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
                    const bodyHtml = bodyMatch ? bodyMatch[1] : fullHtml;
                    const cleanHtml = bodyHtml.replace(/<div class="no-print"[\s\S]*?<\/div>\s*<\/div>/i, '');
                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                'text/html': new Blob([cleanHtml], { type: 'text/html' }),
                                'text/plain': new Blob([cleanHtml.replace(/<[^>]*>/g, '')], { type: 'text/plain' })
                            })
                        ]);
                        alert('다이제스트 뉴스레터가 클립보드에 복사되었습니다!\n이메일, 블로그, SNS 등에 붙여넣기하세요.');
                    } catch (err) {
                        const temp = document.createElement('div');
                        temp.innerHTML = cleanHtml;
                        temp.style.position = 'fixed'; temp.style.left = '-9999px';
                        document.body.appendChild(temp);
                        const range = document.createRange();
                        range.selectNodeContents(temp);
                        const sel = window.getSelection();
                        sel.removeAllRanges(); sel.addRange(range);
                        document.execCommand('copy');
                        sel.removeAllRanges();
                        document.body.removeChild(temp);
                        alert('다이제스트 뉴스레터가 클립보드에 복사되었습니다!');
                    }
                };

                // AI batch rewrite all selected board posts
                const handleBatchRewrite = async () => {
                    const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                    if (selBoards.length === 0) { alert('게시글을 선택해주세요.'); return; }
                    const unrewritten = selBoards.filter(b => !rewrittenContents[b.id]);
                    if (unrewritten.length === 0) { alert('모든 게시글이 이미 재가공되었습니다.'); return; }
                    if (!confirm(`선택된 게시글 ${unrewritten.length}건을 AI로 일괄 재가공하시겠습니까?`)) return;
                    for (const b of unrewritten) {
                        await handleRewriteBoard(b.id, b.content);
                    }
                    alert(`${unrewritten.length}건 재가공 완료!`);
                };

                // Helper: strip HTML tags for board content preview
                const stripHtml = (html) => { try { return new DOMParser().parseFromString(html || '', 'text/html').body.textContent || ''; } catch { return String(html || '').replace(/<[^>]*>/g, ''); } };

                const selectedSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                const selectedBoardsArr = (data.boards || []).filter(b => selectedBoardIds.has(b.id));

                return (
                    <div>
                        <h1 className="section-title">📰 뉴스레터 제작</h1>

                        <div className="newsletter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                            {/* 좌측: 설정 & 콘텐츠 선택 */}
                            <div>
                                {/* 뉴스레터 정보 */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>뉴스레터 정보</h3>
                                    <div className="schedule-form-group">
                                        <label>제목</label>
                                        <input type="text" placeholder="예: 청년노동자인권센터 뉴스레터" value={newsletterConfig.title}
                                            onChange={e => setNewsletterConfig(p => ({...p, title: e.target.value}))} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                        <div className="schedule-form-group">
                                            <label>발행 호수</label>
                                            <input type="text" placeholder="예: 제3호" value={newsletterConfig.issueNumber}
                                                onChange={e => setNewsletterConfig(p => ({...p, issueNumber: e.target.value}))} />
                                        </div>
                                        <div className="schedule-form-group">
                                            <label>발행일</label>
                                            <input type="date" value={newsletterConfig.publishDate}
                                                onChange={e => setNewsletterConfig(p => ({...p, publishDate: e.target.value}))} />
                                        </div>
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>인사말</label>
                                        <textarea rows={3} placeholder="뉴스레터 상단에 표시할 인사말" value={newsletterConfig.greeting}
                                            onChange={e => setNewsletterConfig(p => ({...p, greeting: e.target.value}))}
                                            style={{ width: '100%', resize: 'vertical', padding: 8, border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                                    </div>
                                    <div className="schedule-form-group">
                                        <label>마무리말</label>
                                        <textarea rows={2} placeholder="뉴스레터 하단에 표시할 마무리말" value={newsletterConfig.closing}
                                            onChange={e => setNewsletterConfig(p => ({...p, closing: e.target.value}))}
                                            style={{ width: '100%', resize: 'vertical', padding: 8, border: '1px solid #ddd', borderRadius: 6, fontSize: 13 }} />
                                    </div>
                                </div>

                                {/* 기간 필터 */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 600 }}>기간 필터</h3>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <input type="date" value={newsletterConfig.dateFrom}
                                            onChange={e => setNewsletterConfig(p => ({...p, dateFrom: e.target.value}))} />
                                        <span>~</span>
                                        <input type="date" value={newsletterConfig.dateTo}
                                            onChange={e => setNewsletterConfig(p => ({...p, dateTo: e.target.value}))} />
                                    </div>
                                </div>

                                {/* 일정 선택 */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>📅 일정 선택 ({selectedScheduleIds.size}/{filteredSchedules.length})</h3>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <select value={newsletterConfig.scheduleCategory} onChange={e => setNewsletterConfig(p => ({...p, scheduleCategory: e.target.value}))}
                                                style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}>
                                                {SCHEDULE_CATS.map(c => <option key={c} value={c}>{c === 'all' ? '전체' : c}</option>)}
                                            </select>
                                            <button onClick={toggleAllSchedules} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#f8f8f8' }}>
                                                {selectedScheduleIds.size === filteredSchedules.length && filteredSchedules.length > 0 ? '전체해제' : '전체선택'}
                                            </button>
                                        </div>
                                    </div>
                                    {filteredSchedules.length === 0 ? (
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 16 }}>해당 기간의 일정이 없습니다.</p>
                                    ) : (
                                        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                                            {filteredSchedules.map(s => (
                                                <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13 }}>
                                                    <input type="checkbox" checked={selectedScheduleIds.has(s.id)} onChange={() => toggleSchedule(s.id)} />
                                                    <span style={{ color: '#888', whiteSpace: 'nowrap', fontSize: 12 }}>{s.start_date}</span>
                                                    <span style={{ flex: 1, fontWeight: 500 }}>{s.title}</span>
                                                    <span style={{ background: '#e8f5e9', color: '#2e7d32', padding: '2px 8px', borderRadius: 10, fontSize: 11 }}>{s.category}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* 게시글 선택 */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>📋 게시글 선택 ({selectedBoardIds.size}/{filteredBoards.length})</h3>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <select value={newsletterConfig.boardCategory} onChange={e => setNewsletterConfig(p => ({...p, boardCategory: e.target.value}))}
                                                style={{ padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}>
                                                {BOARD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                            <button onClick={toggleAllBoards} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#f8f8f8' }}>
                                                {selectedBoardIds.size === filteredBoards.length && filteredBoards.length > 0 ? '전체해제' : '전체선택'}
                                            </button>
                                            {selectedBoardIds.size > 0 && (
                                                <button onClick={handleBatchRewrite}
                                                    disabled={rewritingBoardId !== null}
                                                    style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #c4b5fd', borderRadius: 4, cursor: rewritingBoardId ? 'not-allowed' : 'pointer', background: rewritingBoardId ? '#f3f0ff' : 'linear-gradient(135deg,#8b5cf6,#6366f1)', color: rewritingBoardId ? '#999' : '#fff', fontWeight: 600 }}>
                                                    {rewritingBoardId ? '재가공 중...' : '✨ AI 일괄 재가공'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {filteredBoards.length === 0 ? (
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 16 }}>해당 기간의 게시글이 없습니다.</p>
                                    ) : (
                                        <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                                            {filteredBoards.map(b => {
                                                const typeLabels = { notice: '📢 공지', materials: '📁 자료', report: '📊 보고서', free: '💬 자유' };
                                                return (
                                                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13 }}>
                                                        <input type="checkbox" checked={selectedBoardIds.has(b.id)} onChange={() => toggleBoard(b.id)} />
                                                        <span style={{ color: '#888', whiteSpace: 'nowrap', fontSize: 11 }}>{typeLabels[b.board_type] || b.board_type}</span>
                                                        <span style={{ flex: 1, fontWeight: 500 }}>{b.title}</span>
                                                        <span style={{ color: '#aaa', fontSize: 11 }}>{b.created_at ? b.created_at.split('T')[0] : ''}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* 갤러리 선택 */}
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>📸 갤러리 선택 ({selectedGalleryNewsletterIds.size}/{(data.galleries || []).length})</h3>
                                        <button onClick={() => {
                                            const all = (data.galleries || []).map(g => g.id);
                                            setSelectedGalleryNewsletterIds(prev => prev.size === all.length ? new Set() : new Set(all));
                                        }} style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #ddd', borderRadius: 4, cursor: 'pointer', background: '#f8f8f8' }}>
                                            {selectedGalleryNewsletterIds.size === (data.galleries || []).length && (data.galleries || []).length > 0 ? '전체해제' : '전체선택'}
                                        </button>
                                    </div>
                                    {(data.galleries || []).length === 0 ? (
                                        <p style={{ color: '#999', fontSize: 13, textAlign: 'center', padding: 16 }}>갤러리 항목이 없습니다.</p>
                                    ) : (
                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                            {(data.galleries || []).map(g => (
                                                <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', fontSize: 13 }}>
                                                    <input type="checkbox" checked={selectedGalleryNewsletterIds.has(g.id)}
                                                        onChange={() => setSelectedGalleryNewsletterIds(prev => { const n = new Set(prev); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })} />
                                                    <span style={{ color: '#f59e0b', fontSize: 11 }}>📸</span>
                                                    <span style={{ flex: 1, fontWeight: 500 }}>{g.title}</span>
                                                    <span style={{ color: '#aaa', fontSize: 11 }}>{g.category}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 우측: 미리보기 */}
                            <div>
                                <div className="card" style={{ position: 'sticky', top: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>미리보기</h3>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            <button className="btn" onClick={handleDigestNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📋 다이제스트
                                            </button>
                                            <button className="btn" onClick={handleCopyDigestNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📋 다이제스트 복사
                                            </button>
                                            <button className="btn" onClick={handleSectionNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: 'linear-gradient(135deg,#059669,#10b981)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📰 섹션
                                            </button>
                                            <button className="btn" onClick={handleCopySectionNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: '#047857', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📋 섹션 복사
                                            </button>
                                            <button className="btn" onClick={handleFullNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                🎨 풀 뉴스레터
                                            </button>
                                            <button className="btn" onClick={handleCopyFullNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📋 풀 복사
                                            </button>
                                            <button className="btn" onClick={handleCopyNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13, background: '#1e1e2e', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                                                📋 SNS 복사
                                            </button>
                                            <button className="btn btn-primary" onClick={handlePrintNewsletter}
                                                style={{ padding: '8px 16px', fontSize: 13 }}>
                                                🖨️ 인쇄
                                            </button>
                                        </div>
                                        <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}
                                            onClick={() => {
                                                const selSchedules = (data.schedules || []).filter(s => selectedScheduleIds.has(s.id));
                                                const selBoards = (data.boards || []).filter(b => selectedBoardIds.has(b.id));
                                                if (selSchedules.length === 0 && selBoards.length === 0) { alert('뉴스레터에 포함할 항목을 선택해주세요.'); return; }
                                                const secs = [{ type: 'paragraph', text: newsletterConfig.title || '뉴스레터' },
                                                    { type: 'paragraph', text: `${DEFAULT_ORG_NAME}${newsletterConfig.issueNumber ? ' | ' + newsletterConfig.issueNumber : ''} | ${newsletterConfig.publishDate}` }];
                                                if (newsletterConfig.greeting) secs.push({ type: 'paragraph', text: newsletterConfig.greeting });
                                                if (selSchedules.length > 0) {
                                                    secs.push({ type: 'paragraph', text: '주요 일정' });
                                                    secs.push({ type: 'table', headers: ['날짜', '제목', '카테고리', '장소'],
                                                        rows: selSchedules.map(s => [s.start_date||'', s.title||'', s.category||'', s.location||'-']) });
                                                }
                                                if (selBoards.length > 0) {
                                                    secs.push({ type: 'paragraph', text: '주요 소식' });
                                                    selBoards.forEach(b => { secs.push({ type: 'paragraph', text: b.title }); secs.push({ type: 'paragraph', text: (b.content||'').replace(/<[^>]*>/g, '') }); });
                                                }
                                                if (newsletterConfig.closing) secs.push({ type: 'paragraph', text: newsletterConfig.closing });
                                                downloadHWPX('뉴스레터', secs, `뉴스레터_${formatLocalDate()}.hwpx`);
                                            }}>📄 한글</button>
                                    </div>

                                    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#f5f5f5', minHeight: 400, fontSize: 13, lineHeight: 1.7 }}>
                                        {/* Hero Header */}
                                        <div style={{ background: 'linear-gradient(135deg,#134E42,#0f766e,#06b6d4)', padding: '36px 24px 28px', textAlign: 'center', borderRadius: '0 0 24px 24px' }}>
                                            <div style={{ display: 'inline-block', padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 16, fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>
                                                {newsletterConfig.issueNumber ? `${newsletterConfig.issueNumber} · ` : ''}{newsletterConfig.publishDate}
                                            </div>
                                            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>{newsletterConfig.title || '뉴스레터 제목'}</h2>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, margin: 0 }}>{DEFAULT_ORG_NAME}</p>
                                        </div>

                                        <div style={{ padding: '20px 20px' }}>
                                        {/* Greeting */}
                                        {newsletterConfig.greeting && (
                                            <div style={{ margin: '0 0 16px', padding: '14px 16px', background: 'linear-gradient(135deg,#f0fdf4,#ecfdf5)', borderRadius: 12, borderLeft: '3px solid #10b981', whiteSpace: 'pre-line', fontSize: 12 }}>
                                                {newsletterConfig.greeting}
                                            </div>
                                        )}

                                        {/* Selected schedules preview */}
                                        {selectedSchedules.length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#6366f1,#a855f7)', borderRadius: 2 }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e1e2e', margin: 0 }}>주요 일정</h4>
                                                </div>
                                                {(() => { const cc_ = { '교육': '#6366f1', '캠페인': '#ec4899', '회의': '#f59e0b', '평가': '#10b981', '기타': '#8b5cf6' }; return selectedSchedules.map(s => {
                                                    const cc = cc_[s.category] || '#6b7280';
                                                    return (
                                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 8 }}>
                                                        <div style={{ minWidth: 42, textAlign: 'center' }}>
                                                            <div style={{ fontSize: 10, color: '#999' }}>{(s.start_date||'').slice(5,7)}월</div>
                                                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1e1e2e' }}>{(s.start_date||'').slice(8)}</div>
                                                            {s.end_date && s.end_date !== s.start_date && <div style={{ fontSize: 9, color: '#bbb', marginTop: 1 }}>~ {s.end_date.slice(5)}</div>}
                                                        </div>
                                                        <div style={{ width: 1, height: 28, background: '#eee' }}></div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1e1e2e' }}>{s.title}</div>
                                                            <div style={{ fontSize: 10, color: '#999' }}>{s.location || ''}</div>
                                                        </div>
                                                        <span style={{ padding: '3px 10px', background: `${cc}15`, color: cc, fontSize: 10, fontWeight: 600, borderRadius: 16 }}>{s.category}</span>
                                                    </div>
                                                    );
                                                }); })()}
                                            </div>
                                        )}

                                        {/* Selected boards preview */}
                                        {selectedBoardsArr.length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#3b82f6,#06b6d4)', borderRadius: 2 }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e1e2e', margin: 0 }}>주요 소식</h4>
                                                </div>
                                                {(() => { const tc = { notice: '#ef4444', materials: '#3b82f6', report: '#8b5cf6', free: '#6b7280' };
                                                    const tl = { notice: '공지', materials: '자료', report: '보고서', free: '자유' };
                                                    return selectedBoardsArr.map(b => (
                                                    <div key={b.id} style={{ marginBottom: 10, padding: '14px 16px', background: '#fff', borderRadius: 12, border: '1px solid #f0f0f0' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                            <span style={{ width: 6, height: 6, background: tc[b.board_type]||'#999', borderRadius: '50%', display: 'inline-block' }}></span>
                                                            <span style={{ fontSize: 10, fontWeight: 600, color: tc[b.board_type]||'#999' }}>{tl[b.board_type]||b.board_type}</span>
                                                            <span style={{ fontSize: 10, color: '#ccc', marginLeft: 'auto' }}>{b.created_at?.split('T')[0]}</span>
                                                        </div>
                                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1e1e2e', marginBottom: 4 }}>{b.title}</div>
                                                        {(boardImageUrls[b.id] || []).length > 0 && (
                                                            <div style={{ margin: '6px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                                {boardImageUrls[b.id].map((url, i) => (
                                                                    <img key={i} src={url} alt="" style={{ maxWidth: '100%', maxHeight: 160, borderRadius: 8, objectFit: 'cover' }} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div style={{ color: '#777', fontSize: 11 }}>
                                                            {rewrittenContents[b.id]
                                                                ? <span style={{ color: '#10b981' }}>{rewrittenContents[b.id]}</span>
                                                                : <>{stripHtml(b.content).slice(0, 200)}{stripHtml(b.content).length > 200 ? '...' : ''}</>
                                                            }
                                                        </div>
                                                        <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                                                            <button onClick={(e) => { e.stopPropagation(); handleRewriteBoard(b.id, b.content); }}
                                                                disabled={rewritingBoardId === b.id}
                                                                style={{ fontSize: 10, padding: '3px 8px', border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: rewritingBoardId === b.id ? '#f0f0f0' : '#fafafa', color: '#555' }}>
                                                                {rewritingBoardId === b.id ? '재가공 중...' : '✨ AI 재가공'}
                                                            </button>
                                                            {rewrittenContents[b.id] && (
                                                                <button onClick={(e) => { e.stopPropagation(); setRewrittenContents(prev => { const n = {...prev}; delete n[b.id]; return n; }); }}
                                                                    style={{ fontSize: 10, padding: '3px 8px', border: '1px solid #e0e0e0', borderRadius: 6, cursor: 'pointer', background: '#fff', color: '#999' }}>
                                                                    원본 복원
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}

                                        {/* Selected galleries preview */}
                                        {(() => { const selGalleries = (data.galleries || []).filter(g => selectedGalleryNewsletterIds.has(g.id));
                                            return selGalleries.length > 0 && (
                                            <div style={{ marginBottom: 16 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                                    <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg,#f59e0b,#ef4444)', borderRadius: 2 }}></div>
                                                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e1e2e', margin: 0 }}>갤러리</h4>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                                    {selGalleries.map(g => (
                                                        <div key={g.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #f0f0f0', background: '#fff' }}>
                                                            {galleryThumbUrls[g.id] ? <img src={galleryThumbUrls[g.id]} alt="" style={{ width: '100%', height: 100, objectFit: 'cover' }} />
                                                                : <div style={{ width: '100%', height: 100, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 20 }}>📷</div>}
                                                            <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 600, color: '#1e1e2e' }}>{g.title}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ); })()}

                                        {/* Closing */}
                                        {newsletterConfig.closing && (
                                            <div style={{ margin: '16px 0 0', padding: '14px 16px', background: '#f8f9fa', borderRadius: 12, whiteSpace: 'pre-line', fontSize: 12 }}>
                                                {newsletterConfig.closing}
                                            </div>
                                        )}
                                        </div>

                                        {/* Empty state */}
                                        {selectedSchedules.length === 0 && selectedBoardsArr.length === 0 && !newsletterConfig.greeting && !newsletterConfig.closing && (
                                            <div style={{ textAlign: 'center', color: '#ccc', padding: '60px 20px' }}>
                                                <p style={{ fontSize: 32, marginBottom: 8 }}>📰</p>
                                                <p>일정이나 게시글을 선택하면 미리보기가 표시됩니다</p>
                                            </div>
                                        )}

                                        {/* Footer */}
                                        <div style={{ marginTop: 20, paddingTop: 12, borderTop: '1px solid #ddd', textAlign: 'center', fontSize: 11, color: '#aaa' }}>
                                            {DEFAULT_ORG_NAME} · 아름다운재단 2026 공익단체 인큐베이팅 지원사업
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            };

            // 관리자 페이지 렌더링

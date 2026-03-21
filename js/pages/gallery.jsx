// pages/gallery.jsx — Gallery page
// Defined inside ProjectManagementSystem scope

            const GalleryCardWithThumb = ({ item, catInfo, onClick }) => {
                const [thumbUrl, setThumbUrl] = React.useState(
                    item.image_path && item.image_path !== 'placeholder' ? item.image_path : null
                );

                React.useEffect(() => {
                    // image_path가 유효하지 않으면 첨부파일에서 이미지 찾기
                    // thumbUrl을 deps에서 제거: if(!thumbUrl)로 이미 방어되어 있으므로
                    // 포함하면 setThumbUrl 후 effect가 불필요하게 재실행됨
                    if (!thumbUrl) {
                        (async () => {
                            try {
                                const { data: atts } = await supabase.from('attachments')
                                    .select('file_path, file_type')
                                    .eq('gallery_id', item.id)
                                    .order('created_at', { ascending: true });
                                const imgAtt = atts?.find(a => a.file_type?.startsWith('image/'));
                                if (imgAtt) {
                                    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(imgAtt.file_path);
                                    if (urlData?.publicUrl) {
                                        setThumbUrl(urlData.publicUrl);
                                        // image_path도 업데이트 (다음 로드 시 빠르게 표시)
                                        await supabase.from('galleries').update({ image_path: urlData.publicUrl }).eq('id', item.id);
                                    }
                                }
                            } catch (err) {
                                console.error('썸네일 로드 실패:', err);
                            }
                        })();
                    }
                }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

                return (
                    <div className="gallery-card" onClick={onClick}>
                        <div className="gallery-card-image">
                            {thumbUrl ? (
                                <img src={thumbUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <span>📷 이미지 미리보기</span>
                            )}
                        </div>
                        <div className="gallery-card-body">
                            <span className="gallery-card-category" style={{ background: `${catInfo.color}15`, color: catInfo.color }}>
                                {catInfo.icon} {item.category}
                            </span>
                            <div className="gallery-card-title">{item.title}</div>
                            <div className="gallery-card-meta">
                                <span>📅 {item.taken_date || new Date(item.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                                <span>📍 {item.location || '미지정'}</span>
                                <span>👁️ {item.view_count || 0}</span>
                            </div>
                        </div>
                    </div>
                );
            };

            // ===== 갤러리게시판 렌더링 (템플릿 활용) =====
            const renderGallery = () => {
                const galleryCategories = Object.entries(GALLERY_CATEGORY_MAP).map(([key, val]) => ({
                    key, label: key, icon: val.icon
                }));

                // Filter and search
                let filteredGalleries = data.galleries;
                if (galleryCategory !== 'all') {
                    filteredGalleries = filteredGalleries.filter(g => g.category === galleryCategory);
                }
                if (gallerySearchQuery.trim()) {
                    const query = gallerySearchQuery.toLowerCase();
                    filteredGalleries = filteredGalleries.filter(g =>
                        g.title?.toLowerCase().includes(query) ||
                        g.description?.toLowerCase().includes(query) ||
                        g.location?.toLowerCase().includes(query) ||
                        g.photographer?.toLowerCase().includes(query)
                    );
                }

                // Pagination
                const totalItems = filteredGalleries.length;
                const startIdx = (galleryCurrentPage - 1) * ITEMS_PER_PAGE;
                const pageItems = filteredGalleries.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                // View routing
                if (galleryView === 'detail') {
                    return (
                        <div>
                            <GalleryDetailView
                                item={selectedGalleryItem}
                                onBack={() => { setGalleryView('list'); setSelectedGalleryItem(null); setDetailAttachments([]); }}
                                attachments={detailAttachments}
                                onEdit={startGalleryEdit}
                                onDelete={handleGalleryDelete}
                            />
                        </div>
                    );
                }

                if (galleryView === 'write') {
                    return (
                        <div>
                            <div style={{ marginBottom: '16px' }}>
                                <button className="btn btn-secondary" onClick={() => { setGalleryView('list'); setGalleryAttachments([]); if (galleryEditorRef.current) galleryEditorRef.current.innerHTML = ''; }}>
                                    ← 목록으로
                                </button>
                            </div>
                            {GalleryWriteForm({
                                writeData: galleryWriteData,
                                setWriteData: setGalleryWriteData,
                                onSubmit: handleGallerySubmit,
                                onCancel: () => { setGalleryView('list'); setEditingGalleryItem(null); setGalleryAttachments([]); setExistingGalleryAttachments([]); setGalleryWriteData({ title: '', description: '', category: '현장사진', location: '', photographer: '', taken_date: '', password: '' }); if (galleryEditorRef.current) galleryEditorRef.current.innerHTML = ''; },
                                isEdit: !!editingGalleryItem
                            })}
                        </div>
                    );
                }

                return (
                    <div>
                        {BoardTemplateHeader({
                            title: "갤러리",
                            subtitle: "사업 현장 사진과 결과물을 관리합니다.",
                            icon: "📸",
                            view: galleryView,
                            onWrite: () => setGalleryView('write'),
                            onBack: () => setGalleryView('list'),
                            categories: galleryCategories,
                            activeCategory: galleryCategory,
                            onCategoryChange: (cat) => { setGalleryCategory(cat); setGalleryCurrentPage(1); },
                            searchQuery: gallerySearchQuery,
                            onSearchChange: (q) => { setGallerySearchQuery(q); setGalleryCurrentPage(1); }
                        })}

                        {/* ZIP 다운로드 버튼 */}
                        {filteredGalleries.length > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '13px', padding: '6px 14px' }}
                                    onClick={() => handleGalleryZipDownload(filteredGalleries)}
                                    disabled={galleryZipping}
                                >
                                    {galleryZipping ? '⏳ 압축 중...' : '📦 전체 다운로드'}
                                </button>
                            </div>
                        )}

                        {/* 갤러리 그리드 */}
                        {pageItems.length > 0 ? (
                            <div className="gallery-grid">
                                {pageItems.map(item => {
                                    const catInfo = GALLERY_CATEGORY_MAP[item.category] || { icon: '📌', color: '#6B7280' };
                                    return (
                                        <GalleryCardWithThumb key={item.id} item={item} catInfo={catInfo}
                                            onClick={async () => {
                                                await supabase.from('galleries').update({ view_count: (item.view_count || 0) + 1 }).eq('id', item.id);
                                                setSelectedGalleryItem({ ...item, view_count: (item.view_count || 0) + 1 });
                                                setGalleryView('detail');
                                                loadAttachments('gallery', item.id).then(setDetailAttachments);
                                            }} />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="board-empty">
                                <div className="board-empty-icon">📸</div>
                                <div className="board-empty-text">
                                    {gallerySearchQuery ? '검색 결과가 없습니다.' : '등록된 사진이 없습니다.'}
                                </div>
                            </div>
                        )}

                        {BoardPagination({
                            totalItems,
                            currentPage: galleryCurrentPage,
                            onPageChange: setGalleryCurrentPage
                        })}
                    </div>
                );
            };

            // Report HTML helpers (shared by print and PDF)
            const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const formatLocalDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
            const getSettlementReportHTML = () => {
                const totalBudget = CONFIG.TOTAL_BUDGET;
                const totalSpent = (data?.budgetExecutions || []).reduce((s, e) => s + (e.amount || 0), 0);
                const rows = (data?.budgetExecutions || []).map(e =>
                    `<tr><td>${esc(e.execution_date)}</td><td>${esc(e.category_name)}</td><td>${esc(e.subcategory_name)}</td><td>${esc(e.budget_item_name)}</td><td style="text-align:right">${fmt(e.amount || 0)}</td><td>${esc(e.payment_method)}</td><td>${esc(e.recipient || '')}</td><td>${esc(EXECUTION_STATUS[e.status]?.label || e.status)}</td></tr>`
                ).join('');
                return `<!DOCTYPE html><html><head><title>정산보고서</title><style>body{font-family:sans-serif;padding:20px}h1{color:#134E42;text-align:center}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;font-size:13px}th{background:#134E42;color:white}.summary{display:flex;gap:20px;margin:20px 0}.summary div{flex:1;padding:16px;background:#f8f6f1;border-radius:8px;text-align:center}.summary .label{font-size:12px;color:#666}.summary .value{font-size:20px;font-weight:bold;color:#134E42}@media print{body{padding:0}}</style></head><body><h1>아름다운재단 2026 공익단체 인큐베이팅 지원사업 정산보고서</h1><p style="text-align:center;color:#666">청년노동자인권센터 • ${new Date().toLocaleDateString('ko-KR')}</p><div class="summary"><div><div class="label">총 예산</div><div class="value">${totalBudget.toLocaleString()}원</div></div><div><div class="label">총 집행</div><div class="value">${totalSpent.toLocaleString()}원</div></div><div><div class="label">집행률</div><div class="value">${totalBudget > 0 ? ((totalSpent/totalBudget)*100).toFixed(1) : 0}%</div></div><div><div class="label">잔여</div><div class="value">${(totalBudget - totalSpent).toLocaleString()}원</div></div></div><table><thead><tr><th>집행일</th><th>카테고리</th><th>소분류</th><th>항목</th><th>금액</th><th>결제방법</th><th>수취인</th><th>상태</th></tr></thead><tbody>${rows}</tbody><tfoot><tr><th colspan="4">합계</th><th style="text-align:right">${totalSpent.toLocaleString()}원</th><th colspan="3"></th></tr></tfoot></table></body></html>`;
            };
            const getMonthlyReportHTML = () => {
                const execs = data?.budgetExecutions || [];
                const monthly = {};
                execs.forEach(e => { const m = (e.execution_date || '').slice(0, 7); if (!m) return; if (!monthly[m]) monthly[m] = []; monthly[m].push(e); });
                const months = Object.keys(monthly).sort();
                let html = `<!DOCTYPE html><html><head><title>월별 집행 명세서</title><style>body{font-family:sans-serif;padding:20px}h1{color:#134E42;text-align:center;font-size:18px}h2{color:#1B6B5A;border-bottom:2px solid #1B6B5A;padding-bottom:4px;margin-top:30px;font-size:15px}table{width:100%;border-collapse:collapse;margin:8px 0 16px}th,td{border:1px solid #ddd;padding:6px 8px;font-size:12px}th{background:#134E42;color:white}td.amt{text-align:right}.total{font-weight:bold;background:#f0f0f0}@media print{h2{page-break-before:auto}}</style></head><body><h1>월별 집행 명세서</h1><p style="text-align:center;color:#666;font-size:13px">청년노동자인권센터 • ${new Date().toLocaleDateString('ko-KR')}</p>`;
                months.forEach(m => {
                    const items = monthly[m]; const sum = items.reduce((s, e) => s + (e.amount || 0), 0);
                    html += `<h2>${m.replace('-', '년 ')}월 (${items.length}건, ${sum.toLocaleString()}원)</h2><table><thead><tr><th>집행일</th><th>카테고리</th><th>항목</th><th>금액</th><th>결제방법</th><th>수취인</th></tr></thead><tbody>`;
                    items.forEach(e => { html += `<tr><td>${esc(e.execution_date)}</td><td>${esc(e.category_name || '')}</td><td>${esc(e.budget_item_name || '')}</td><td class="amt">${fmt(e.amount||0)}원</td><td>${esc(e.payment_method||'')}</td><td>${esc(e.recipient||'')}</td></tr>`; });
                    html += `<tr class="total"><td colspan="3">소계</td><td class="amt">${sum.toLocaleString()}원</td><td colspan="2"></td></tr></tbody></table>`;
                });
                html += '</body></html>';
                return html;
            };


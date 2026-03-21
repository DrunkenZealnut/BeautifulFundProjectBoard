// pages/board.jsx — Board page
// Defined inside ProjectManagementSystem scope

            const renderBoard = () => {
                try {
                const boardCategories = Object.entries(BOARD_TYPE_MAP).map(([key, val]) => ({
                    key, label: val.label, icon: val.icon
                }));

                // Filter and search
                let filteredBoards = data.boards;
                if (boardCategory !== 'all') {
                    filteredBoards = filteredBoards.filter(b => b.board_type === boardCategory);
                }
                if (boardSearchQuery.trim()) {
                    const query = boardSearchQuery.toLowerCase();
                    filteredBoards = filteredBoards.filter(b =>
                        b.title?.toLowerCase().includes(query) ||
                        b.content?.toLowerCase().includes(query) ||
                        b.author?.name?.toLowerCase().includes(query)
                    );
                }

                // Sort: pinned first, then by date
                filteredBoards = [...filteredBoards].sort((a, b) => {
                    if (a.is_pinned && !b.is_pinned) return -1;
                    if (!a.is_pinned && b.is_pinned) return 1;
                    return new Date(b.created_at) - new Date(a.created_at);
                });

                // Pagination
                const totalItems = filteredBoards.length;
                const startIdx = (boardCurrentPage - 1) * ITEMS_PER_PAGE;
                const pageItems = filteredBoards.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                // View routing
                if (boardView === 'detail') {
                    return (
                        <div>
                            {BoardDetailView({
                                post: selectedPost,
                                onBack: () => { setBoardView('list'); setSelectedPost(null); setDetailAttachments([]); },
                                attachments: detailAttachments,
                                onEdit: startBoardEdit,
                                onDelete: handleBoardDelete
                            })}
                        </div>
                    );
                }

                if (boardView === 'write') {
                    return (
                        <div>
                            <div style={{ marginBottom: '16px' }}>
                                <button className="btn btn-secondary" onClick={() => { setBoardView('list'); setEditingPost(null); setLinkPreviews([]); setBoardAttachments([]); setBoardWriteData({ title: '', content: '', board_type: 'notice', category: '', is_pinned: false, password: '' }); if (boardEditorRef.current) boardEditorRef.current.innerHTML = ''; }}>
                                    ← 목록으로
                                </button>
                            </div>
                            {BoardWriteForm({
                                writeData: boardWriteData,
                                setWriteData: setBoardWriteData,
                                onSubmit: handleBoardSubmit,
                                onCancel: () => { setBoardView('list'); setEditingPost(null); setLinkPreviews([]); setBoardAttachments([]); setBoardWriteData({ title: '', content: '', board_type: 'notice', category: '', is_pinned: false, password: '' }); if (boardEditorRef.current) boardEditorRef.current.innerHTML = ''; },
                                isEdit: !!editingPost
                            })}
                        </div>
                    );
                }

                return (
                    <div>
                        {BoardTemplateHeader({
                            title: "게시판",
                            subtitle: "공지사항, 자료실, FAQ를 관리합니다.",
                            icon: "📋",
                            view: boardView,
                            onWrite: () => setBoardView('write'),
                            onBack: () => setBoardView('list'),
                            categories: boardCategories,
                            activeCategory: boardCategory,
                            onCategoryChange: (cat) => { setBoardCategory(cat); setBoardCurrentPage(1); },
                            searchQuery: boardSearchQuery,
                            onSearchChange: (q) => { setBoardSearchQuery(q); setBoardCurrentPage(1); }
                        })}

                        {/* 게시글 목록 (리스트형) */}
                        <div style={{ border: '1px solid #EBE8E1', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* 헤더 행 */}
                            <div style={{
                                display: 'flex', alignItems: 'center', padding: '12px 20px',
                                background: '#F8F9FA', borderBottom: '2px solid #134E42',
                                fontSize: '13px', fontWeight: '600', color: '#6B6560'
                            }}>
                                <div style={{ width: '40px', textAlign: 'center' }}>번호</div>
                                <div style={{ flex: 1, paddingLeft: '12px' }}>제목</div>
                                <div style={{ width: '80px', textAlign: 'center' }}>작성자</div>
                                <div style={{ width: '90px', textAlign: 'center' }}>작성일</div>
                                <div style={{ width: '50px', textAlign: 'center' }}>조회</div>
                            </div>

                            {pageItems.length > 0 ? pageItems.map((board, idx) => {
                                const typeInfo = BOARD_TYPE_MAP[board.board_type] || { label: board.board_type, badge: 'badge-info', icon: '📄' };
                                return (
                                    <div
                                        key={board.id}
                                        className={`board-list-item ${board.is_pinned ? 'pinned' : ''}`}
                                        onClick={() => {
                                            supabase.from('boards').update({ view_count: (board.view_count || 0) + 1 }).eq('id', board.id).catch(err => console.error('조회수 업데이트 실패:', err));
                                            setSelectedPost({ ...board, view_count: (board.view_count || 0) + 1 });
                                            setBoardView('detail');
                                            loadAttachments('board', board.id).then(setDetailAttachments);
                                        }}
                                    >
                                        <div className="board-list-number">
                                            {board.is_pinned ? '📌' : totalItems - startIdx - idx}
                                        </div>
                                        <div className="board-list-content">
                                            <div className="board-list-title">
                                                <span className={`badge ${typeInfo.badge}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className="title-text">{board.title}</span>
                                                {board.tags?.links?.length > 0 && (
                                                    <span style={{ fontSize: '12px', color: '#9C9690' }}>🔗</span>
                                                )}
                                            </div>
                                            <div className="board-list-info">
                                                <span>{board.content?.substring(0, 60)}{board.content?.length > 60 ? '...' : ''}</span>
                                            </div>
                                        </div>
                                        <div className="board-list-meta">
                                            <span>{board.author?.name || '관리자'}</span>
                                            <span>{new Date(board.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                                            <span>{board.view_count || 0}</span>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="board-empty">
                                    <div className="board-empty-icon">📋</div>
                                    <div className="board-empty-text">
                                        {boardSearchQuery ? '검색 결과가 없습니다.' : '등록된 게시글이 없습니다.'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {BoardPagination({
                            totalItems,
                            currentPage: boardCurrentPage,
                            onPageChange: setBoardCurrentPage
                        })}
                    </div>
                );
                } catch (err) {
                    console.error('renderBoard 에러:', err);
                    return (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#DC2626' }}>
                            <h2>게시판 로딩 오류</h2>
                            <p>{err.message}</p>
                            <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '12px', borderRadius: '8px', fontSize: '12px', overflow: 'auto' }}>{err.stack}</pre>
                        </div>
                    );
                }
            };

            // ===== 갤러리 카드 (첨부파일에서 썸네일 자동 로드) =====

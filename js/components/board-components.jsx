// components/board-components.jsx — Board & Gallery shared components
// LinkPreviewCard, BoardTemplateHeader, BoardPagination, RichEditorToolbar,
// FileUploadArea, BoardWriteForm, GalleryWriteForm, AttachmentListDisplay,
// CommentSection, BoardDetailView, GalleryDetailView
// Defined inside ProjectManagementSystem scope

            const LinkPreviewCard = ({ key, preview, onRemove }) => (
                <div key={key} style={{ position: 'relative', marginBottom: '8px' }}>
                    <a href={preview.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                        <div className="link-preview-card">
                            <div className="link-preview-image">
                                {preview.image ? (
                                    <img src={preview.image} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
                                ) : (
                                    <span style={{ fontSize: '32px', opacity: 0.5 }}>🔗</span>
                                )}
                            </div>
                            <div className="link-preview-info">
                                <div className="link-preview-title">{preview.title}</div>
                                {preview.description && (
                                    <div className="link-preview-desc">{preview.description}</div>
                                )}
                                <div className="link-preview-url">{preview.domain || preview.url}</div>
                            </div>
                        </div>
                    </a>
                    {onRemove && (
                        <button
                            className="link-preview-remove"
                            onClick={(e) => { e.preventDefault(); onRemove(preview.url); }}
                            title="미리보기 제거"
                        >×</button>
                    )}
                </div>
            );

            // ===== 게시판 템플릿: 공통 목록 헤더 =====
            const BoardTemplateHeader = ({ title, subtitle, icon, onWrite, view, onBack, categories, activeCategory, onCategoryChange, searchQuery, onSearchChange }) => (
                <div>
                    {view !== 'list' ? (
                        <div style={{ marginBottom: '16px' }}>
                            <button className="btn btn-secondary" onClick={onBack}>
                                ← 목록으로
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="board-header">
                                <div>
                                    <h1 className="section-title">{icon} {title}</h1>
                                    <p className="section-subtitle">{subtitle}</p>
                                </div>
                                <div className="board-toolbar">
                                    <div className="board-search">
                                        <input
                                            type="text"
                                            placeholder="검색어를 입력하세요"
                                            value={searchQuery}
                                            onChange={(e) => onSearchChange(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-primary" onClick={onWrite}>
                                        ✏️ 글쓰기
                                    </button>
                                </div>
                            </div>
                            {categories && categories.length > 0 && (
                                <div className="board-category-tabs">
                                    <button
                                        className={`board-category-tab ${activeCategory === 'all' ? 'active' : ''}`}
                                        onClick={() => onCategoryChange('all')}
                                    >전체</button>
                                    {categories.map(cat => (
                                        <button
                                            key={cat.key}
                                            className={`board-category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                                            onClick={() => onCategoryChange(cat.key)}
                                        >{cat.icon} {cat.label}</button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            );

            // ===== 게시판 템플릿: 페이지네이션 =====
            const BoardPagination = ({ totalItems, currentPage, onPageChange }) => {
                const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
                if (totalPages <= 1) return null;

                const pages = [];
                const startPage = Math.max(1, currentPage - 2);
                const endPage = Math.min(totalPages, startPage + 4);

                return (
                    <div className="board-pagination">
                        <button
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                        >«</button>
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                        >‹</button>
                        {Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                            <button
                                key={page}
                                className={currentPage === page ? 'active' : ''}
                                onClick={() => onPageChange(page)}
                            >{page}</button>
                        ))}
                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                        >›</button>
                        <button
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                        >»</button>
                    </div>
                );
            };

            // ===== 첨부파일 유틸리티 =====
            const formatFileSize = (bytes) => {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            };

            const getFileIcon = (type) => {
                if (type.startsWith('image/')) return '🖼️';
                if (type.startsWith('video/')) return '🎬';
                if (type.includes('pdf')) return '📄';
                if (type.includes('word') || type.includes('document')) return '📝';
                if (type.includes('sheet') || type.includes('excel')) return '📊';
                if (type.includes('presentation') || type.includes('powerpoint')) return '📑';
                if (type.includes('zip') || type.includes('compressed')) return '🗜️';
                return '📎';
            };

            const ALLOWED_MIME_TYPES = new Set([
                'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain', 'text/csv',
                'application/zip', 'application/x-zip-compressed',
                'application/haansofthwp', 'application/x-hwp', // 한글 문서
            ]);

            const validateFiles = (newFiles, existingFiles) => {
                const errors = [];
                const validFiles = [];
                const totalCount = existingFiles.length;

                for (const file of newFiles) {
                    if (totalCount + validFiles.length >= MAX_FILE_COUNT) {
                        errors.push(`최대 ${MAX_FILE_COUNT}개까지 첨부할 수 있습니다.`);
                        break;
                    }
                    if (!ALLOWED_MIME_TYPES.has(file.type)) {
                        errors.push(`"${file.name}" - 허용되지 않는 파일 형식입니다. (${file.type || '알 수 없음'})`);
                        continue;
                    }
                    if (file.size > MAX_FILE_SIZE) {
                        errors.push(`"${file.name}" - 파일 크기가 10MB를 초과합니다. (${formatFileSize(file.size)})`);
                        continue;
                    }
                    if (existingFiles.some(f => f.name === file.name && f.size === file.size)) {
                        errors.push(`"${file.name}" - 이미 첨부된 파일입니다.`);
                        continue;
                    }
                    validFiles.push(file);
                }
                return { validFiles, errors };
            };

            const handleFileSelect = (files, attachments, setAttachments) => {
                const { validFiles, errors } = validateFiles(files, attachments);
                if (errors.length > 0) {
                    alert(errors.join('\n'));
                }
                if (validFiles.length > 0) {
                    setAttachments(prev => [...prev, ...validFiles]);
                }
            };

            const handleFileDrop = (e, attachments, setAttachments) => {
                e.preventDefault();
                e.stopPropagation();
                e.currentTarget.classList.remove('dragging');
                const files = Array.from(e.dataTransfer.files);
                handleFileSelect(files, attachments, setAttachments);
            };

            // ===== 리치 텍스트 에디터 =====
            const execEditorCommand = (command, value) => {
                document.execCommand(command, false, value || null);
            };

            const getEditorContent = (editorRef) => {
                return editorRef.current ? editorRef.current.innerHTML : '';
            };

            const getEditorText = (editorRef) => {
                return editorRef.current ? editorRef.current.innerText : '';
            };

            const RichEditorToolbar = ({ editorRef }) => (
                <div className="rich-editor-toolbar">
                    <select
                        defaultValue=""
                        onChange={(e) => { if (e.target.value) { execEditorCommand('formatBlock', e.target.value); e.target.value = ''; } }}
                    >
                        <option value="" disabled>스타일</option>
                        <option value="p">본문</option>
                        <option value="h1">제목 1</option>
                        <option value="h2">제목 2</option>
                        <option value="h3">제목 3</option>
                        <option value="blockquote">인용</option>
                    </select>
                    <div className="toolbar-separator" />
                    <button onClick={() => execEditorCommand('bold')} title="굵게 (Ctrl+B)"><b>B</b></button>
                    <button onClick={() => execEditorCommand('italic')} title="기울임 (Ctrl+I)"><i>I</i></button>
                    <button onClick={() => execEditorCommand('underline')} title="밑줄 (Ctrl+U)"><u>U</u></button>
                    <button onClick={() => execEditorCommand('strikeThrough')} title="취소선"><s>S</s></button>
                    <div className="toolbar-separator" />
                    <button onClick={() => execEditorCommand('insertUnorderedList')} title="글머리 기호">•≡</button>
                    <button onClick={() => execEditorCommand('insertOrderedList')} title="번호 매기기">1.</button>
                    <div className="toolbar-separator" />
                    <button onClick={() => execEditorCommand('justifyLeft')} title="왼쪽 정렬">≡←</button>
                    <button onClick={() => execEditorCommand('justifyCenter')} title="가운데 정렬">≡↔</button>
                    <button onClick={() => execEditorCommand('justifyRight')} title="오른쪽 정렬">≡→</button>
                    <div className="toolbar-separator" />
                    <button onClick={() => {
                        const url = prompt('링크 URL을 입력하세요:');
                        if (url) execEditorCommand('createLink', url);
                    }} title="링크 삽입">🔗</button>
                    <button onClick={() => execEditorCommand('removeFormat')} title="서식 지우기">✕</button>
                    <div className="toolbar-separator" />
                    <button onClick={() => execEditorCommand('undo')} title="실행 취소 (Ctrl+Z)">↩</button>
                    <button onClick={() => execEditorCommand('redo')} title="다시 실행 (Ctrl+Y)">↪</button>
                </div>
            );

            // ===== 첨부파일 영역 컴포넌트 =====
            const FileUploadArea = ({ attachments, setAttachments, fileInputRef }) => (
                <div className="form-group">
                    <label className="form-label">📎 첨부파일 ({attachments.length}/{MAX_FILE_COUNT})</label>
                    <div
                        className="file-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('dragging'); }}
                        onDragLeave={(e) => { e.currentTarget.classList.remove('dragging'); }}
                        onDrop={(e) => handleFileDrop(e, attachments, setAttachments)}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                handleFileSelect(Array.from(e.target.files), attachments, setAttachments);
                                e.target.value = '';
                            }}
                        />
                        <div className="file-upload-icon">📂</div>
                        <div className="file-upload-text">클릭하거나 파일을 여기로 끌어다 놓으세요</div>
                        <div className="file-upload-hint">최대 {MAX_FILE_COUNT}개, 파일당 10MB 이하</div>
                    </div>
                    {attachments.length > 0 && (
                        <div className="file-list">
                            {attachments.map((file, idx) => (
                                <div key={`${file.name}-${idx}`} className="file-item">
                                    <span className="file-item-icon">{getFileIcon(file.type)}</span>
                                    <div className="file-item-info">
                                        <div className="file-item-name">{file.name}</div>
                                        <div className="file-item-size">{formatFileSize(file.size)}</div>
                                    </div>
                                    <button
                                        className="file-item-remove"
                                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                                        title="삭제"
                                    >×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );

            // ===== 일반게시판 글쓰기 (리치에디터 + 첨부파일 + 링크미리보기) =====
            const BoardWriteForm = ({ writeData, setWriteData, onSubmit, onCancel, isEdit }) => {
                const handleEditorInput = () => {
                    const html = getEditorContent(boardEditorRef);
                    const text = getEditorText(boardEditorRef);
                    setWriteData(prev => ({ ...prev, content: html }));
                    // Debounce link preview
                    if (boardWriteDebounceRef.current) clearTimeout(boardWriteDebounceRef.current);
                    boardWriteDebounceRef.current = setTimeout(() => {
                        handleContentChangeWithPreview(text);
                    }, 800);
                };

                return (
                    <div className="board-write-form">
                        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#134E42', marginBottom: '24px' }}>
                            {isEdit ? '📝 글 수정' : '✏️ 새 글 작성'}
                        </h2>

                        <div className="form-group">
                            <label className="form-label">분류</label>
                            <select
                                className="form-input"
                                value={writeData.board_type}
                                onChange={(e) => setWriteData(prev => ({ ...prev, board_type: e.target.value }))}
                            >
                                {Object.entries(BOARD_TYPE_MAP).map(([key, val]) => (
                                    <option key={key} value={key}>{val.icon} {val.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">제목</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="제목을 입력하세요"
                                value={writeData.title}
                                onChange={(e) => setWriteData(prev => ({ ...prev, title: e.target.value }))}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">내용</label>
                            <p style={{ fontSize: '12px', color: '#9C9690', margin: '0 0 8px 0' }}>
                                URL을 입력하면 자동으로 링크 미리보기가 표시됩니다.
                            </p>
                            {RichEditorToolbar({ editorRef: boardEditorRef })}
                            <div
                                ref={boardEditorRef}
                                className="rich-editor-body"
                                contentEditable
                                data-placeholder="내용을 입력하세요. 텍스트 서식을 적용하거나 URL을 포함하면 링크 미리보기가 자동 생성됩니다."
                                onInput={handleEditorInput}
                                onPaste={(e) => {
                                    // Clean paste: strip external formatting
                                    const clipboardData = e.clipboardData;
                                    const html = clipboardData.getData('text/html');
                                    const text = clipboardData.getData('text/plain');
                                    if (html) {
                                        // Allow paste with basic formatting
                                    } else if (text) {
                                        e.preventDefault();
                                        document.execCommand('insertText', false, text);
                                    }
                                    setTimeout(handleEditorInput, 50);
                                }}
                            />
                        </div>

                        {/* 링크 미리보기 영역 */}
                        {(linkPreviews.length > 0 || linkPreviewLoading) && (
                            <div className="link-preview-container" style={{ marginBottom: '20px' }}>
                                <label className="form-label" style={{ marginBottom: '8px' }}>🔗 링크 미리보기</label>
                                {linkPreviewLoading && (
                                    <div className="link-preview-loading">
                                        <div className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', marginBottom: 0 }}></div>
                                        링크 정보를 불러오는 중...
                                    </div>
                                )}
                                {linkPreviews.map(preview =>
                                    LinkPreviewCard({
                                        key: preview.url,
                                        preview,
                                        onRemove: (url) => setLinkPreviews(prev => prev.filter(p => p.url !== url))
                                    })
                                )}
                            </div>
                        )}

                        {/* 첨부파일 영역 */}
                        {FileUploadArea({ attachments: boardAttachments, setAttachments: setBoardAttachments, fileInputRef: boardFileInputRef })}

                        {!isEdit && (
                            <div className="form-group">
                                <label className="form-label">🔒 비밀번호 <span style={{ fontSize: '12px', color: '#9C9690', fontWeight: '400' }}>(수정/삭제 시 필요)</span></label>
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="비밀번호를 입력하세요"
                                    value={writeData.password}
                                    onChange={(e) => setWriteData(prev => ({ ...prev, password: e.target.value }))}
                                    style={{ maxWidth: '300px' }}
                                />
                            </div>
                        )}

                        {currentUser?.role === 'admin' && (
                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={writeData.is_pinned}
                                        onChange={(e) => setWriteData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                                    />
                                    <span className="form-label" style={{ margin: 0 }}>📌 상단 고정</span>
                                </label>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button className="btn btn-secondary" onClick={onCancel}>취소</button>
                            <button
                                className="btn btn-primary"
                                onClick={onSubmit}
                                disabled={!writeData.title.trim() || !getEditorText(boardEditorRef).trim() || (!isEdit && !writeData.password.trim())}
                            >{isEdit ? '수정' : '등록'}</button>
                        </div>
                    </div>
                );
            };

            // ===== 갤러리 글쓰기 (리치에디터 + 첨부파일) =====
            const GalleryWriteForm = ({ writeData, setWriteData, onSubmit, onCancel, isEdit }) => (
                <div className="board-write-form">
                    <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#134E42', marginBottom: '24px' }}>
                        {isEdit ? '📝 사진 수정' : '📸 사진 등록'}
                    </h2>

                    <div className="form-group">
                        <label className="form-label">카테고리</label>
                        <select
                            className="form-input"
                            value={writeData.category}
                            onChange={(e) => setWriteData(prev => ({ ...prev, category: e.target.value }))}
                        >
                            {Object.entries(GALLERY_CATEGORY_MAP).map(([key, val]) => (
                                <option key={key} value={key}>{val.icon} {key}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">제목</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="사진 제목을 입력하세요"
                            value={writeData.title}
                            onChange={(e) => setWriteData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">설명</label>
                        {RichEditorToolbar({ editorRef: galleryEditorRef })}
                        <div
                            ref={galleryEditorRef}
                            className="rich-editor-body"
                            contentEditable
                            data-placeholder="사진에 대한 설명을 입력하세요"
                            onInput={() => setWriteData(prev => ({
                                ...prev,
                                description: galleryEditorRef.current ? galleryEditorRef.current.innerHTML : ''
                            }))}
                            style={{ minHeight: '150px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">촬영일</label>
                            <input
                                type="date"
                                className="form-input"
                                value={writeData.taken_date}
                                onChange={(e) => setWriteData(prev => ({ ...prev, taken_date: e.target.value }))}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">촬영 장소</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="촬영 장소"
                                value={writeData.location}
                                onChange={(e) => setWriteData(prev => ({ ...prev, location: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">촬영자</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="촬영자 이름"
                            value={writeData.photographer}
                            onChange={(e) => setWriteData(prev => ({ ...prev, photographer: e.target.value }))}
                        />
                    </div>

                    {/* 기존 첨부파일 표시 (수정 모드) */}
                    {isEdit && existingGalleryAttachments.length > 0 && (
                        <div className="form-group">
                            <label className="form-label">📎 기존 첨부파일 ({existingGalleryAttachments.length})</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                                {existingGalleryAttachments.filter(a => a.file_type?.startsWith('image/')).map(att => (
                                    <div key={att.id} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid #EBE8E1' }}>
                                        <img src={getAttachmentUrl(att.file_path)} alt={att.original_filename}
                                            style={{ width: 120, height: 90, objectFit: 'cover', display: 'block' }} />
                                        <button onClick={() => deleteExistingAttachment(att)}
                                            style={{
                                                position: 'absolute', top: 4, right: 4,
                                                background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: 22, height: 22, fontSize: 12,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>&times;</button>
                                        <div style={{ fontSize: 11, padding: '4px 6px', color: '#6B6560', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 120 }}>
                                            {att.original_filename}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {existingGalleryAttachments.filter(a => !a.file_type?.startsWith('image/')).map(att => (
                                <div key={att.id} className="file-item" style={{ marginBottom: 6 }}>
                                    <span className="file-item-icon">{getFileIcon(att.file_type)}</span>
                                    <div className="file-item-info">
                                        <div className="file-item-name">{att.original_filename}</div>
                                        <div className="file-item-size">{formatFileSize(att.file_size)}</div>
                                    </div>
                                    <button className="btn btn-secondary"
                                        style={{ padding: '4px 10px', fontSize: '11px', color: '#DC2626' }}
                                        onClick={() => deleteExistingAttachment(att)}>삭제</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 새 첨부파일 추가 영역 */}
                    {FileUploadArea({ attachments: galleryAttachments, setAttachments: setGalleryAttachments, fileInputRef: galleryFileInputRef })}

                    {!isEdit && (
                        <div className="form-group">
                            <label className="form-label">🔒 비밀번호 <span style={{ fontSize: '12px', color: '#9C9690', fontWeight: '400' }}>(수정/삭제 시 필요)</span></label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="비밀번호를 입력하세요"
                                value={writeData.password}
                                onChange={(e) => setWriteData(prev => ({ ...prev, password: e.target.value }))}
                                style={{ maxWidth: '300px' }}
                            />
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button className="btn btn-secondary" onClick={onCancel}>취소</button>
                        <button
                            className="btn btn-primary"
                            onClick={onSubmit}
                            disabled={!writeData.title.trim() || (!isEdit && !writeData.password.trim())}
                        >{isEdit ? '수정' : '등록'}</button>
                    </div>
                </div>
            );

            // ===== 첨부파일 목록 로드 =====
            const loadAttachments = async (parentType, parentId) => {
                try {
                    const { data, error } = await supabase
                        .from('attachments')
                        .select('*')
                        .eq(`${parentType}_id`, parentId)
                        .order('created_at', { ascending: true });
                    if (error) throw error;
                    return data || [];
                } catch (err) {
                    console.error('첨부파일 로드 실패:', err);
                    return [];
                }
            };

            // 첨부파일 다운로드 URL 생성
            const getAttachmentUrl = (filePath) => {
                const { data } = supabase.storage.from('attachments').getPublicUrl(filePath);
                return data?.publicUrl || '#';
            };

            // 파일 다운로드 실행 (blob fetch → 강제 다운로드)
            const downloadFile = async (filePath, filename) => {
                try {
                    const { data, error } = await supabase.storage
                        .from('attachments')
                        .download(filePath);
                    if (error) throw error;

                    const url = URL.createObjectURL(data);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error('다운로드 실패:', err);
                    // Fallback: public URL을 새 탭으로 열기
                    window.open(getAttachmentUrl(filePath), '_blank');
                }
            };

            // 첨부파일 표시 컴포넌트
            const AttachmentListDisplay = ({ attachments }) => {
                if (!attachments || attachments.length === 0) return null;
                return (
                    <div className="attachment-list">
                        <div className="attachment-list-title">📎 첨부파일 ({attachments.length})</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {attachments.map(att => (
                                <div key={att.id} className="file-item" style={{ cursor: 'default' }}>
                                    <span className="file-item-icon">{getFileIcon(att.file_type)}</span>
                                    <div className="file-item-info">
                                        <div className="file-item-name">{att.original_filename}</div>
                                        <div className="file-item-size">{formatFileSize(att.file_size)}</div>
                                    </div>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap' }}
                                        onClick={() => downloadFile(att.file_path, att.original_filename)}
                                    >⬇ 다운로드</button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            };

            // ===== F-02: 댓글 컴포넌트 =====
            const CommentSection = ({ parentType, parentId }) => {
                const [cmts, setCmts] = React.useState([]);
                const [newCmt, setNewCmt] = React.useState('');
                const [loading, setLoading] = React.useState(false);
                const [editingCmtId, setEditingCmtId] = React.useState(null);
                const [editCmtText, setEditCmtText] = React.useState('');

                React.useEffect(() => {
                    if (parentId) {
                        setLoading(true);
                        supabase.from('comments')
                            .select('*')
                            .eq('parent_type', parentType)
                            .eq('parent_id', parentId)
                            .order('created_at', { ascending: true })
                            .then(({ data }) => { setCmts(data || []); setLoading(false); })
                            .catch(() => setLoading(false));
                    }
                }, [parentType, parentId]);

                const handleAdd = async () => {
                    if (!newCmt.trim()) return;
                    try {
                        const { data: inserted } = await supabase.from('comments').insert([{
                            parent_type: parentType, parent_id: parentId,
                            content: newCmt.trim(), author_id: currentUser.id, author_name: currentUser.name
                        }]).select();
                        if (inserted) setCmts(prev => [...prev, ...inserted]);
                        setNewCmt('');
                        logActivity('댓글 작성', parentType, parentId, newCmt.trim().slice(0, 50));
                    } catch (err) { console.error('댓글 작성 실패:', err); }
                };

                const handleEdit = async (id) => {
                    if (!editCmtText.trim()) return;
                    try {
                        const { error } = await supabase.from('comments').update({ content: editCmtText.trim(), updated_at: new Date().toISOString() }).eq('id', id);
                        if (!error) {
                            setCmts(prev => prev.map(c => c.id === id ? { ...c, content: editCmtText.trim(), updated_at: new Date().toISOString() } : c));
                            setEditingCmtId(null);
                            setEditCmtText('');
                        }
                    } catch (err) { console.error('댓글 수정 실패:', err); }
                };

                const handleDelete = async (id) => {
                    if (!confirm('댓글을 삭제하시겠습니까?')) return;
                    await supabase.from('comments').delete().eq('id', id);
                    setCmts(prev => prev.filter(c => c.id !== id));
                };

                return (
                    <div className="comment-section" style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
                        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: '#1B6B5A' }}>💬 댓글 ({cmts.length})</h4>
                        {loading ? <div style={{ color: '#9C9690', fontSize: 13 }}>로딩 중...</div> : (
                            <>
                                {cmts.map(c => (
                                    <div key={c.id} className="comment-item" style={{ padding: '10px 0', borderBottom: '1px solid #F0F0F0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#2D3748' }}>{c.author_name || '익명'}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 11, color: '#A0AEC0' }}>{new Date(c.created_at).toLocaleString('ko-KR')}{c.updated_at && c.updated_at !== c.created_at ? ' (수정됨)' : ''}</span>
                                                {c.author_id === currentUser.id && (
                                                    <button onClick={() => { setEditingCmtId(c.id); setEditCmtText(c.content); }} style={{ background: 'none', border: 'none', color: '#3182CE', fontSize: 11, cursor: 'pointer' }}>수정</button>
                                                )}
                                                {(c.author_id === currentUser.id || currentUser.role === 'admin') && (
                                                    <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#E53E3E', fontSize: 11, cursor: 'pointer' }}>삭제</button>
                                                )}
                                            </div>
                                        </div>
                                        {editingCmtId === c.id ? (
                                            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                                                <input type="text" className="form-input" value={editCmtText} onChange={e => setEditCmtText(e.target.value)}
                                                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(c.id); if (e.key === 'Escape') setEditingCmtId(null); }} style={{ flex: 1, fontSize: 13 }} autoFocus />
                                                <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => handleEdit(c.id)}>저장</button>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => setEditingCmtId(null)}>취소</button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 14, color: '#4A5568', lineHeight: 1.5 }}>{c.content}</div>
                                        )}
                                    </div>
                                ))}
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <input type="text" className="form-input" placeholder="댓글을 입력하세요..." value={newCmt} onChange={e => setNewCmt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }} style={{ flex: 1 }} />
                                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={handleAdd}>등록</button>
                                </div>
                            </>
                        )}
                    </div>
                );
            };

            // ===== 게시글 상세보기 (일반게시판) =====
            const BoardDetailView = ({ post, onBack, attachments, onEdit, onDelete }) => {
                if (!post) return null;
                const typeInfo = BOARD_TYPE_MAP[post.board_type] || { label: post.board_type, badge: 'badge-info' };

                const contentText = post.content || '';
                const contentUrls = extractUrls(contentText);
                const isHtml = /<[a-z][\s\S]*>/i.test(contentText);

                return (
                    <div className="board-detail">
                        <div className="board-detail-header">
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <span className={`badge ${typeInfo.badge}`}>{typeInfo.label}</span>
                                {post.is_pinned && <span className="badge badge-info">📌 고정</span>}
                            </div>
                            <div className="board-detail-title">{post.title}</div>
                            <div className="board-detail-meta">
                                <span>✍️ {post.author?.name || '관리자'}</span>
                                <span>📅 {new Date(post.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                <span>👁️ 조회 {post.view_count || 0}</span>
                            </div>
                        </div>

                        {isHtml ? (
                            <div className="board-detail-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(contentText) }} />
                        ) : (
                            <div className="board-detail-body">{contentText}</div>
                        )}

                        {/* 첨부파일 */}
                        {AttachmentListDisplay({ attachments: attachments || [] })}

                        {/* 본문 내 링크 미리보기 */}
                        {contentUrls.length > 0 && (
                            <div style={{ marginTop: '24px' }}>
                                <div style={{ fontSize: '13px', color: '#9C9690', marginBottom: '8px' }}>🔗 관련 링크</div>
                                {contentUrls.slice(0, 3).map(url => {
                                    let domain = '';
                                    try { domain = new URL(url).hostname.replace('www.', ''); } catch(e) {}
                                    return (
                                        <a key={url} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block', marginBottom: '6px' }}>
                                            <div className="link-preview-card" style={{ maxWidth: '100%' }}>
                                                <div className="link-preview-image" style={{ width: '80px', minHeight: '60px' }}>
                                                    <span style={{ fontSize: '24px', opacity: 0.5 }}>🔗</span>
                                                </div>
                                                <div className="link-preview-info">
                                                    <div className="link-preview-title">{domain || url}</div>
                                                    <div className="link-preview-url">{url}</div>
                                                </div>
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        )}

                        {/* F-02: 댓글 섹션 */}
                        <CommentSection parentType="board" parentId={post.id} />

                        <div className="board-detail-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-secondary" onClick={onBack}>← 목록으로</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" onClick={() => onEdit(post)} style={{ fontSize: '13px' }}>✏️ 수정</button>
                                <button className="btn btn-secondary" onClick={() => onDelete(post)} style={{ fontSize: '13px', color: '#DC2626', borderColor: '#FCA5A5' }}>🗑️ 삭제</button>
                            </div>
                        </div>
                    </div>
                );
            };

            // ===== 갤러리 상세보기 =====
            const GalleryDetailView = ({ item, onBack, attachments, onEdit, onDelete }) => {
                if (!item) return null;
                const catInfo = GALLERY_CATEGORY_MAP[item.category] || { icon: '📌', color: '#6B7280' };
                const isHtml = /<[a-z][\s\S]*>/i.test(item.description || '');

                // 이미지 첨부파일 분리
                const imageAttachments = (attachments || []).filter(a => a.file_type?.startsWith('image/'));
                const otherAttachments = (attachments || []).filter(a => !a.file_type?.startsWith('image/'));

                const [slideIdx, setSlideIdx] = React.useState(0);
                const [lightbox, setLightbox] = React.useState(false);

                // 슬라이드 이미지 목록: image_path가 유효하면 포함 + 이미지 첨부파일들
                const slideImages = [];
                if (item.image_path && item.image_path !== 'placeholder') {
                    // image_path가 첨부파일과 중복되지 않도록 확인
                    const isDuplicate = imageAttachments.some(a => {
                        const url = getAttachmentUrl(a.file_path);
                        return url === item.image_path;
                    });
                    if (!isDuplicate) {
                        slideImages.push({ url: item.image_path, name: item.title });
                    }
                }
                imageAttachments.forEach(a => {
                    slideImages.push({ url: getAttachmentUrl(a.file_path), name: a.original_filename });
                });

                const safeSlideIdx = slideImages.length > 0 ? Math.min(slideIdx, slideImages.length - 1) : 0;

                return (
                    <div className="board-detail">
                        {/* 이미지 슬라이드쇼 */}
                        {slideImages.length > 0 ? (
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <div className="gallery-detail-image" style={{ cursor: 'pointer', position: 'relative' }}
                                    onClick={() => setLightbox(true)}>
                                    <img src={slideImages[safeSlideIdx].url} alt={slideImages[safeSlideIdx].name}
                                        style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: '#1a1a1a', borderRadius: 12 }} />

                                    {/* 슬라이드 카운터 */}
                                    {slideImages.length > 1 && (
                                        <div style={{
                                            position: 'absolute', bottom: 12, right: 12,
                                            background: 'rgba(0,0,0,0.6)', color: 'white',
                                            padding: '4px 12px', borderRadius: 20, fontSize: 13
                                        }}>
                                            {safeSlideIdx + 1} / {slideImages.length}
                                        </div>
                                    )}
                                </div>

                                {/* 이전/다음 버튼 */}
                                {slideImages.length > 1 && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i <= 0 ? slideImages.length - 1 : i - 1); }}
                                            style={{
                                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: 40, height: 40, fontSize: 20,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>◀</button>
                                        <button onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i >= slideImages.length - 1 ? 0 : i + 1); }}
                                            style={{
                                                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                                background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: 40, height: 40, fontSize: 20,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>▶</button>
                                    </>
                                )}

                                {/* 썸네일 스트립 */}
                                {slideImages.length > 1 && (
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', padding: '4px 0' }}>
                                        {slideImages.map((img, idx) => (
                                            <img key={idx} src={img.url} alt={img.name}
                                                onClick={() => setSlideIdx(idx)}
                                                style={{
                                                    width: 72, height: 54, objectFit: 'cover', borderRadius: 8,
                                                    cursor: 'pointer', border: idx === safeSlideIdx ? '3px solid #134E42' : '3px solid transparent',
                                                    opacity: idx === safeSlideIdx ? 1 : 0.6, transition: 'all 0.2s',
                                                    flexShrink: 0
                                                }} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="gallery-detail-image">
                                <div style={{ textAlign: 'center', color: '#9C9690', padding: '40px' }}>
                                    <div style={{ fontSize: '64px', marginBottom: '12px' }}>📷</div>
                                    <div>이미지가 등록되지 않았습니다.</div>
                                </div>
                            </div>
                        )}

                        {/* 라이트박스 (전체화면 보기) */}
                        {lightbox && slideImages.length > 0 && (
                            <div style={{
                                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                                background: 'rgba(0,0,0,0.92)', zIndex: 2000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column'
                            }} onClick={() => setLightbox(false)}>
                                <button onClick={() => setLightbox(false)}
                                    style={{
                                        position: 'absolute', top: 20, right: 20,
                                        background: 'none', border: 'none', color: 'white',
                                        fontSize: 32, cursor: 'pointer', zIndex: 2001
                                    }}>&times;</button>
                                <img src={slideImages[safeSlideIdx].url} alt=""
                                    onClick={e => e.stopPropagation()}
                                    style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />

                                {slideImages.length > 1 && (
                                    <>
                                        <button onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i <= 0 ? slideImages.length - 1 : i - 1); }}
                                            style={{
                                                position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                                                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: 50, height: 50, fontSize: 24,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>◀</button>
                                        <button onClick={(e) => { e.stopPropagation(); setSlideIdx(i => i >= slideImages.length - 1 ? 0 : i + 1); }}
                                            style={{
                                                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                                                background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none',
                                                borderRadius: '50%', width: 50, height: 50, fontSize: 24,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>▶</button>
                                    </>
                                )}
                                <div style={{ color: 'white', marginTop: 12, fontSize: 14 }}>
                                    {slideImages[safeSlideIdx].name} ({safeSlideIdx + 1}/{slideImages.length})
                                </div>
                            </div>
                        )}

                        <div className="board-detail-header">
                            <span className="gallery-card-category" style={{ background: `${catInfo.color}15`, color: catInfo.color }}>
                                {catInfo.icon} {item.category}
                            </span>
                            <div className="board-detail-title" style={{ marginTop: '8px' }}>{item.title}</div>
                            <div className="board-detail-meta">
                                <span>📅 {item.taken_date || new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                                <span>📍 {item.location || '미지정'}</span>
                                <span>📷 {item.photographer || '관리자'}</span>
                                <span>👁️ 조회 {item.view_count || 0}</span>
                            </div>
                        </div>

                        {item.description && (
                            isHtml ? (
                                <div className="board-detail-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.description) }} />
                            ) : (
                                <div className="board-detail-body">{item.description}</div>
                            )
                        )}

                        {/* 이미지 외 첨부파일 */}
                        {AttachmentListDisplay({ attachments: otherAttachments })}

                        {/* F-02: 댓글 섹션 */}
                        <CommentSection parentType="gallery" parentId={item.id} />

                        <div className="board-detail-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="btn btn-secondary" onClick={onBack}>← 목록으로</button>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-secondary" onClick={() => onEdit(item)} style={{ fontSize: '13px' }}>✏️ 수정</button>
                                <button className="btn btn-secondary" onClick={() => onDelete(item)} style={{ fontSize: '13px', color: '#DC2626', borderColor: '#FCA5A5' }}>🗑️ 삭제</button>
                            </div>
                        </div>
                    </div>
                );
            };

            // ===== 첨부파일 Supabase Storage 업로드 =====
            const uploadAttachments = async (files, parentType, parentId) => {
                const uploaded = [];
                for (const file of files) {
                    try {
                        const timestamp = Date.now();
                        const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
                        const filePath = `${parentType}/${parentId}/${timestamp}_${safeName}`;

                        // Upload to Supabase Storage
                        const { data: storageData, error: storageError } = await supabase.storage
                            .from('attachments')
                            .upload(filePath, file);

                        if (storageError) {
                            console.warn('Storage upload failed, saving metadata only:', storageError.message);
                        }

                        // Save attachment metadata to DB
                        const attachmentData = {
                            [`${parentType}_id`]: parentId,
                            file_path: storageData?.path || filePath,
                            original_filename: file.name,
                            file_size: file.size,
                            file_type: file.type || 'application/octet-stream',
                            uploaded_by: currentUser.id
                        };

                        const { error: dbError } = await supabase.from('attachments').insert([attachmentData]);
                        if (dbError) console.error('Attachment DB insert failed:', dbError);

                        uploaded.push(attachmentData);
                    } catch (err) {
                        console.error(`Failed to upload ${file.name}:`, err);
                    }
                }
                return uploaded;
            };

            // ===== 게시글 저장 =====
            const handleBoardSubmit = async () => {
                const editorContent = getEditorContent(boardEditorRef);
                const editorText = getEditorText(boardEditorRef);
                if (!boardWriteData.title.trim() || !editorText.trim()) return;
                try {
                    const postData = {
                        board_type: boardWriteData.board_type,
                        title: boardWriteData.title.trim(),
                        content: editorContent,
                        is_pinned: boardWriteData.is_pinned,
                        tags: linkPreviews.length > 0 ? { links: linkPreviews } : null,
                        updated_at: new Date().toISOString()
                    };

                    if (editingPost) {
                        // 수정 모드
                        const { error: updateError } = await supabase
                            .from('boards').update(postData).eq('id', editingPost.id);
                        if (updateError) throw updateError;

                        // 새 첨부파일 업로드
                        if (boardAttachments.length > 0) {
                            await uploadAttachments(boardAttachments, 'board', editingPost.id);
                        }
                    } else {
                        // 새글 작성
                        postData.author_id = currentUser.id;
                        postData.status = 'published';
                        postData.published_at = new Date().toISOString();
                        if (boardWriteData.password.trim()) {
                            postData.post_password = await hashPassword(boardWriteData.password.trim());
                        }

                        const { data: inserted, error: insertError } = await supabase
                            .from('boards').insert([postData]).select().single();
                        if (insertError) throw insertError;

                        if (boardAttachments.length > 0 && inserted?.id) {
                            await uploadAttachments(boardAttachments, 'board', inserted.id);
                        }
                    }

                    // Reload boards
                    const { data: boards } = await supabase
                        .from('boards')
                        .select('*, author:users(name)')
                        .eq('status', 'published')
                        .order('created_at', { ascending: false });

                    setData(prev => ({ ...prev, boards: boards || [] }));
                    setBoardView('list');
                    setBoardWriteData({ title: '', content: '', board_type: 'notice', category: '', is_pinned: false, password: '' });
                    setEditingPost(null);
                    setLinkPreviews([]);
                    setBoardAttachments([]);
                    if (boardEditorRef.current) boardEditorRef.current.innerHTML = '';
                } catch (err) {
                    console.error('게시글 저장 실패:', err);
                    alert('게시글 저장에 실패했습니다: ' + (err.message || err));
                }
            };

            // ===== 게시글 수정 시작 =====
            const startBoardEdit = async (post) => {
                const isAdmin = currentUser?.role === 'admin';
                if (!isAdmin) {
                    const pw = prompt('비밀번호를 입력하세요');
                    if (!pw) return;
                    const valid = await verifyPostPassword(post, pw);
                    if (!valid) { alert('비밀번호가 일치하지 않습니다.'); return; }
                }
                setEditingPost(post);
                setBoardWriteData({
                    title: post.title,
                    content: post.content,
                    board_type: post.board_type,
                    category: post.category || '',
                    is_pinned: post.is_pinned || false,
                    password: ''
                });
                setBoardView('write');
                // 에디터 내용 설정 (다음 렌더 후) - XSS 방어: DOMPurify로 sanitize
                setTimeout(() => {
                    if (boardEditorRef.current) {
                        boardEditorRef.current.innerHTML = DOMPurify.sanitize(post.content || '');
                    }
                }, 100);
                // 기존 링크 미리보기 복원
                if (post.tags?.links) {
                    setLinkPreviews(post.tags.links);
                }
            };

            // ===== 게시글 삭제 =====
            const handleBoardDelete = async (post) => {
                const isAdmin = currentUser?.role === 'admin';
                if (!isAdmin) {
                    const pw = prompt('비밀번호를 입력하세요');
                    if (!pw) return;
                    const valid = await verifyPostPassword(post, pw);
                    if (!valid) { alert('비밀번호가 일치하지 않습니다.'); return; }
                }
                if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                try {
                    // 첨부파일 삭제
                    const { data: attachments } = await supabase
                        .from('attachments').select('file_path').eq('board_id', post.id);
                    if (attachments?.length > 0) {
                        await supabase.storage.from('attachments')
                            .remove(attachments.map(a => a.file_path));
                        await supabase.from('attachments').delete().eq('board_id', post.id);
                    }
                    // 게시글 삭제
                    const { error } = await supabase.from('boards').delete().eq('id', post.id);
                    if (error) throw error;

                    // Reload
                    const { data: boards } = await supabase
                        .from('boards')
                        .select('*, author:users(name)')
                        .eq('status', 'published')
                        .order('created_at', { ascending: false });
                    setData(prev => ({ ...prev, boards: boards || [] }));
                    setBoardView('list');
                    setSelectedPost(null);
                    setDetailAttachments([]);
                    alert('게시글이 삭제되었습니다.');
                } catch (err) {
                    console.error('게시글 삭제 실패:', err);
                    alert('삭제에 실패했습니다: ' + (err.message || err));
                }
            };

            // ===== 갤러리 저장 =====
            const handleGallerySubmit = async () => {
                if (!galleryWriteData.title.trim()) return;
                try {
                    const descContent = galleryEditorRef.current ? galleryEditorRef.current.innerHTML : '';
                    const postData = {
                        title: galleryWriteData.title.trim(),
                        description: descContent.trim() || null,
                        category: galleryWriteData.category,
                        location: galleryWriteData.location.trim() || null,
                        photographer: galleryWriteData.photographer.trim() || null,
                        taken_date: galleryWriteData.taken_date || null,
                        updated_at: new Date().toISOString()
                    };

                    if (editingGalleryItem) {
                        // 수정 모드
                        const { data: updatedRows, error: updateError } = await supabase
                            .from('galleries').update(postData).eq('id', editingGalleryItem.id).select();
                        if (updateError) throw updateError;
                        if (!updatedRows || updatedRows.length === 0) {
                            console.error('Gallery update returned 0 rows — check RLS UPDATE policy on galleries table');
                            throw new Error('항목을 수정할 수 없습니다. 권한을 확인하거나 관리자에게 문의해주세요.');
                        }
                        const updatedRow = updatedRows[0];

                        if (galleryAttachments.length > 0) {
                            await uploadAttachments(galleryAttachments, 'gallery', editingGalleryItem.id);
                        }

                        // 수정 후 data.galleries 및 selectedGalleryItem을 in-place 갱신 (전체 리로드 생략)
                        setData(prev => ({
                            ...prev,
                            galleries: prev.galleries.map(g => g.id === updatedRow.id ? { ...g, ...updatedRow } : g)
                        }));
                        setSelectedGalleryItem(prev => prev?.id === editingGalleryItem.id ? { ...prev, ...updatedRow } : prev);
                    } else {
                        // 새글 작성
                        postData.image_path = 'placeholder';
                        postData.uploaded_by = currentUser.id;
                        postData.is_public = true;
                        if (galleryWriteData.password.trim()) {
                            postData.post_password = await hashPassword(galleryWriteData.password.trim());
                        }

                        const { data: insertedRows, error: insertError } = await supabase
                            .from('galleries').insert([postData]).select();
                        if (insertError) throw insertError;
                        if (!insertedRows || insertedRows.length === 0) {
                            throw new Error('항목을 등록할 수 없습니다. 권한을 확인하거나 관리자에게 문의해주세요.');
                        }
                        const inserted = insertedRows[0];

                        if (galleryAttachments.length > 0 && inserted?.id) {
                            await uploadAttachments(galleryAttachments, 'gallery', inserted.id);

                            // 첫 번째 이미지 첨부파일을 대표 이미지로 설정
                            const firstImage = galleryAttachments.find(f => f.type?.startsWith('image/'));
                            if (firstImage) {
                                const timestamp = Date.now();
                                const safeName = firstImage.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
                                const thumbPath = `gallery/${inserted.id}/${timestamp}_${safeName}`;
                                const { data: thumbUrl } = supabase.storage.from('attachments').getPublicUrl(thumbPath);
                                // DB에 저장된 실제 파일 경로로 image_path 업데이트
                                const { data: atts } = await supabase.from('attachments')
                                    .select('file_path, file_type')
                                    .eq('gallery_id', inserted.id)
                                    .order('created_at', { ascending: true });
                                const firstImgAtt = atts?.find(a => a.file_type?.startsWith('image/'));
                                if (firstImgAtt) {
                                    const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(firstImgAtt.file_path);
                                    if (urlData?.publicUrl) {
                                        await supabase.from('galleries').update({ image_path: urlData.publicUrl }).eq('id', inserted.id);
                                    }
                                }
                            }
                        }

                        // 새 항목 등록 후 전체 목록 리로드 (image_path가 별도 쿼리로 갱신되므로 필요)
                        const { data: galleries } = await supabase
                            .from('galleries')
                            .select('*')
                            .order('created_at', { ascending: false });
                        setData(prev => ({ ...prev, galleries: galleries || [] }));
                    }
                    setGalleryView('list');
                    setGalleryWriteData({ title: '', description: '', category: '현장사진', location: '', photographer: '', taken_date: '', password: '' });
                    setEditingGalleryItem(null);
                    setGalleryAttachments([]);
                    setExistingGalleryAttachments([]);
                    if (galleryEditorRef.current) galleryEditorRef.current.innerHTML = '';
                } catch (err) {
                    console.error('갤러리 저장 실패:', err);
                    alert('사진 등록에 실패했습니다: ' + (err.message || err));
                }
            };

            // ===== 갤러리 수정 시작 =====
            const [existingGalleryAttachments, setExistingGalleryAttachments] = useState([]);

            const startGalleryEdit = async (item) => {
                const isAdmin = currentUser?.role === 'admin';
                if (!isAdmin) {
                    const pw = prompt('비밀번호를 입력하세요');
                    if (!pw) return;
                    const valid = await verifyPostPassword(item, pw);
                    if (!valid) { alert('비밀번호가 일치하지 않습니다.'); return; }
                }
                setEditingGalleryItem(item);
                setGalleryWriteData({
                    title: item.title,
                    description: item.description || '',
                    category: item.category,
                    location: item.location || '',
                    photographer: item.photographer || '',
                    taken_date: item.taken_date || '',
                    password: ''
                });

                // 기존 첨부파일 로드
                const atts = await loadAttachments('gallery', item.id);
                setExistingGalleryAttachments(atts);

                setGalleryView('write');
                setTimeout(() => {
                    if (galleryEditorRef.current) {
                        // XSS 방어: DOMPurify로 sanitize
                        galleryEditorRef.current.innerHTML = DOMPurify.sanitize(item.description || '');
                    }
                }, 100);
            };

            // 기존 첨부파일 삭제
            const deleteExistingAttachment = async (att) => {
                if (!confirm(`"${att.original_filename}" 파일을 삭제하시겠습니까?`)) return;
                try {
                    await supabase.storage.from('attachments').remove([att.file_path]);
                    await supabase.from('attachments').delete().eq('id', att.id);
                    setExistingGalleryAttachments(prev => prev.filter(a => a.id !== att.id));
                } catch (err) {
                    console.error('첨부파일 삭제 실패:', err);
                    alert('파일 삭제에 실패했습니다.');
                }
            };

            // ===== 갤러리 삭제 =====
            const handleGalleryDelete = async (item) => {
                const isAdmin = currentUser?.role === 'admin';
                if (!isAdmin) {
                    const pw = prompt('비밀번호를 입력하세요');
                    if (!pw) return;
                    const valid = await verifyPostPassword(item, pw);
                    if (!valid) { alert('비밀번호가 일치하지 않습니다.'); return; }
                }
                if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
                try {
                    const { data: attachments } = await supabase
                        .from('attachments').select('file_path').eq('gallery_id', item.id);
                    if (attachments?.length > 0) {
                        await supabase.storage.from('attachments')
                            .remove(attachments.map(a => a.file_path));
                        await supabase.from('attachments').delete().eq('gallery_id', item.id);
                    }
                    const { error } = await supabase.from('galleries').delete().eq('id', item.id);
                    if (error) throw error;

                    const { data: galleries } = await supabase
                        .from('galleries')
                        .select('*')
                        .order('created_at', { ascending: false });
                    setData(prev => ({ ...prev, galleries: galleries || [] }));
                    setGalleryView('list');
                    setSelectedGalleryItem(null);
                    setDetailAttachments([]);
                    alert('갤러리 항목이 삭제되었습니다.');
                } catch (err) {
                    console.error('갤러리 삭제 실패:', err);
                    alert('삭제에 실패했습니다: ' + (err.message || err));
                }
            };

            // ===== 일반게시판 렌더링 (템플릿 활용) =====

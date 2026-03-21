// pages/admin.jsx — Admin management page
// Defined inside ProjectManagementSystem scope

            const renderAdmin = () => {
                return (
                    <div>
                        <h1 className="section-title">⚙️ 관리자</h1>
                        <p className="section-subtitle">사용자 계정, 수급자 정보, 기관 정보를 관리합니다.</p>

                        {/* 탭 바 */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #E2E8F0', paddingBottom: '0' }}>
                            {[
                                { key: 'users', label: '👤 사용자 관리' },
                                { key: 'recipients', label: '📋 수급자 관리' },
                                { key: 'orgSettings', label: '🏢 기관 정보' },
                                { key: 'logs', label: '📜 활동 로그' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setAdminTab(tab.key)}
                                    style={{
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderBottom: adminTab === tab.key ? '3px solid #1B6B5A' : '3px solid transparent',
                                        background: 'none',
                                        color: adminTab === tab.key ? '#1B6B5A' : '#6B6560',
                                        fontWeight: adminTab === tab.key ? '700' : '400',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        marginBottom: '-2px'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── 수급자 관리 탭 ─────────────────────────────────────── */}
                        {adminTab === 'recipients' && (
                            <div>
                                {recipientMsg.text && (
                                    <div className={recipientMsg.type === 'success' ? 'success-message' : 'error-message'}>
                                        {recipientMsg.text}
                                    </div>
                                )}
                                <div style={{ marginBottom: '24px' }}>
                                    {!showRecipientForm ? (
                                        <button className="btn btn-primary" onClick={() => {
                                            setShowRecipientForm(true);
                                            setEditingRecipient(null);
                                            setRecipientForm({ name: '', birth_date: '', address: '', phone: '', notes: '' });
                                            setRecipientMsg({ type: '', text: '' });
                                        }}>
                                            + 수급자 등록
                                        </button>
                                    ) : (
                                        <div className="admin-form-card">
                                            <h3>{editingRecipient ? `✏️ '${editingRecipient.name}' 정보 수정` : '➕ 수급자 등록'}</h3>
                                            <form onSubmit={handleSaveRecipient}>
                                                <div className="form-grid">
                                                    <div className="form-group">
                                                        <label>성명 *</label>
                                                        <input
                                                            type="text"
                                                            value={recipientForm.name}
                                                            onChange={e => setRecipientForm({...recipientForm, name: e.target.value})}
                                                            placeholder="수급자 성명"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>생년월일</label>
                                                        <input
                                                            type="text"
                                                            value={recipientForm.birth_date}
                                                            onChange={e => setRecipientForm({...recipientForm, birth_date: e.target.value})}
                                                            placeholder="예: 850101 또는 1985-01-01"
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label>전화번호</label>
                                                        <input
                                                            type="text"
                                                            value={recipientForm.phone}
                                                            onChange={e => setRecipientForm({...recipientForm, phone: e.target.value})}
                                                            placeholder="010-0000-0000"
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label>주소</label>
                                                        <input
                                                            type="text"
                                                            value={recipientForm.address}
                                                            onChange={e => setRecipientForm({...recipientForm, address: e.target.value})}
                                                            placeholder="도로명 주소"
                                                        />
                                                    </div>
                                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                        <label>비고</label>
                                                        <input
                                                            type="text"
                                                            value={recipientForm.notes}
                                                            onChange={e => setRecipientForm({...recipientForm, notes: e.target.value})}
                                                            placeholder="메모 (선택)"
                                                        />
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                                    <button type="submit" className="btn btn-primary">
                                                        {editingRecipient ? '수정 저장' : '수급자 등록'}
                                                    </button>
                                                    <button type="button" className="btn btn-secondary" onClick={() => {
                                                        setShowRecipientForm(false);
                                                        setEditingRecipient(null);
                                                        setRecipientForm({ name: '', birth_date: '', address: '', phone: '', notes: '' });
                                                    }}>
                                                        취소
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>

                                {recipientsLoading ? (
                                    <div className="loading">
                                        <div className="loading-spinner"></div>
                                        <div>수급자 목록을 불러오고 있습니다...</div>
                                    </div>
                                ) : (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table className="user-table">
                                            <thead>
                                                <tr>
                                                    <th>성명</th>
                                                    <th>생년월일</th>
                                                    <th>전화번호</th>
                                                    <th>주소</th>
                                                    <th>비고</th>
                                                    <th>관리</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {recipients.map(r => (
                                                    <tr key={r.id}>
                                                        <td style={{ fontWeight: '500' }}>{r.name}</td>
                                                        <td style={{ color: '#6B6560', fontSize: '13px' }}>{r.birth_date || '-'}</td>
                                                        <td style={{ color: '#6B6560', fontSize: '13px' }}>{r.phone || '-'}</td>
                                                        <td style={{ color: '#6B6560', fontSize: '13px' }}>{r.address || '-'}</td>
                                                        <td style={{ color: '#6B6560', fontSize: '13px' }}>{r.notes || '-'}</td>
                                                        <td>
                                                            <div className="admin-actions">
                                                                <button
                                                                    className="btn btn-secondary btn-sm"
                                                                    onClick={() => {
                                                                        setEditingRecipient(r);
                                                                        setRecipientForm({
                                                                            name: r.name,
                                                                            birth_date: r.birth_date || '',
                                                                            address: r.address || '',
                                                                            phone: r.phone || '',
                                                                            notes: r.notes || ''
                                                                        });
                                                                        setShowRecipientForm(true);
                                                                        setRecipientMsg({ type: '', text: '' });
                                                                    }}
                                                                >
                                                                    수정
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => handleDeleteRecipient(r)}
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {recipients.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>
                                                            등록된 수급자가 없습니다.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                        <div style={{ marginTop: '16px', fontSize: '13px', color: '#A0AEC0' }}>
                                            총 {recipients.length}명
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── 기관 정보 탭 ──────────────────────────────────────── */}
                        {adminTab === 'orgSettings' && (
                            <div>
                                {orgSettingsMsg.text && (
                                    <div className={orgSettingsMsg.type === 'success' ? 'success-message' : 'error-message'}>
                                        {orgSettingsMsg.text}
                                    </div>
                                )}
                                <div className="admin-form-card">
                                    <h3>🏢 기관 정보 설정</h3>
                                    <p style={{ fontSize: '13px', color: '#6B6560', marginBottom: '16px' }}>
                                        급여지급명세서의 "지급자" 항목에 자동으로 채워집니다.
                                    </p>
                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>기관명</label>
                                            <input
                                                type="text"
                                                value={orgSettings.org_name}
                                                onChange={e => setOrgSettings({...orgSettings, org_name: e.target.value})}
                                                placeholder="기관(단체) 이름"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>기관 전화번호</label>
                                            <input
                                                type="text"
                                                value={orgSettings.org_phone}
                                                onChange={e => setOrgSettings({...orgSettings, org_phone: e.target.value})}
                                                placeholder="000-000-0000"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>대표자명</label>
                                            <input
                                                type="text"
                                                value={orgSettings.org_representative}
                                                onChange={e => setOrgSettings({...orgSettings, org_representative: e.target.value})}
                                                placeholder="대표자 이름"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>사업자등록번호 (고유번호)</label>
                                            <input
                                                type="text"
                                                value={orgSettings.org_registration_number}
                                                onChange={e => setOrgSettings({...orgSettings, org_registration_number: e.target.value})}
                                                placeholder="000-00-00000"
                                            />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>기관주소</label>
                                            <input
                                                type="text"
                                                value={orgSettings.org_address}
                                                onChange={e => setOrgSettings({...orgSettings, org_address: e.target.value})}
                                                placeholder="도로명 주소"
                                            />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                            <label>단체직인 이미지</label>
                                            {orgSettings.org_seal && (
                                                <div style={{ marginBottom: '8px' }}>
                                                    <img
                                                        src={orgSettings.org_seal}
                                                        alt="등록된 단체직인"
                                                        style={{ maxHeight: '80px', border: '1px solid #ddd', borderRadius: '4px', padding: '4px', background: '#f9f9f9' }}
                                                    />
                                                </div>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    const file = e.target.files[0];
                                                    if (!file) return;
                                                    const reader = new FileReader();
                                                    reader.onload = ev => setOrgSettings({...orgSettings, org_seal: ev.target.result});
                                                    reader.readAsDataURL(file);
                                                }}
                                            />
                                            {orgSettings.org_seal && (
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary"
                                                    style={{ marginTop: '6px', fontSize: '12px' }}
                                                    onClick={() => setOrgSettings({...orgSettings, org_seal: ''})}
                                                >
                                                    🗑 직인 삭제
                                                </button>
                                            )}
                                            <p style={{ fontSize: '12px', color: '#9C9690', marginTop: '4px' }}>
                                                PNG/JPG 권장. 배경이 투명한 PNG 사용 시 가장 자연스럽습니다.
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '16px' }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={saveOrgSettings}
                                            disabled={orgSettingsSaving}
                                        >
                                            {orgSettingsSaving ? '저장 중...' : '💾 저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── 사용자 관리 탭 ─────────────────────────────────────── */}
                        {adminTab === 'users' && (<div>
                        {adminError && <div className="error-message">{adminError}</div>}
                        {adminSuccess && <div className="success-message">{adminSuccess}</div>}

                        {/* 사용자 추가/수정 폼 */}
                        <div style={{ marginBottom: '24px' }}>
                            {!showUserForm ? (
                                <button className="btn btn-primary" onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ username: '', name: '', email: '', password: '', role: 'staff', phone: '', organization: '청년노동자인권센터', position: '' }); }}>
                                    + 새 사용자 추가
                                </button>
                            ) : (
                                <div className="admin-form-card">
                                    <h3>{editingUser ? `✏️ '${editingUser.name}' 정보 수정` : '➕ 새 사용자 추가'}</h3>
                                    <form onSubmit={editingUser ? handleUpdateUser : handleAddUser}>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>아이디 *</label>
                                                <input
                                                    type="text"
                                                    value={userForm.username}
                                                    onChange={e => setUserForm({...userForm, username: e.target.value})}
                                                    placeholder="영문 아이디"
                                                    required
                                                    disabled={!!editingUser}
                                                    style={editingUser ? { background: '#EDF2F7', cursor: 'not-allowed' } : {}}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>이름 *</label>
                                                <input
                                                    type="text"
                                                    value={userForm.name}
                                                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                                                    placeholder="사용자 이름"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>{editingUser ? '새 비밀번호 (변경시에만)' : '비밀번호 *'}</label>
                                                <input
                                                    type="password"
                                                    value={userForm.password}
                                                    onChange={e => setUserForm({...userForm, password: e.target.value})}
                                                    placeholder={editingUser ? '변경하지 않으려면 비워두세요' : '비밀번호 입력'}
                                                    required={!editingUser}
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>역할</label>
                                                <select
                                                    value={userForm.role}
                                                    onChange={e => setUserForm({...userForm, role: e.target.value})}
                                                >
                                                    <option value="admin">관리자</option>
                                                    <option value="staff">직원</option>
                                                    <option value="participant">참여자</option>
                                                    <option value="viewer">열람자</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>이메일</label>
                                                <input
                                                    type="email"
                                                    value={userForm.email}
                                                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                                                    placeholder="email@example.com"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>전화번호</label>
                                                <input
                                                    type="text"
                                                    value={userForm.phone}
                                                    onChange={e => setUserForm({...userForm, phone: e.target.value})}
                                                    placeholder="010-0000-0000"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>소속</label>
                                                <input
                                                    type="text"
                                                    value={userForm.organization}
                                                    onChange={e => setUserForm({...userForm, organization: e.target.value})}
                                                    placeholder="소속 단체명"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>직위</label>
                                                <input
                                                    type="text"
                                                    value={userForm.position}
                                                    onChange={e => setUserForm({...userForm, position: e.target.value})}
                                                    placeholder="직위/직책"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                            <button type="submit" className="btn btn-primary">
                                                {editingUser ? '수정 저장' : '사용자 추가'}
                                            </button>
                                            <button type="button" className="btn btn-secondary" onClick={resetUserForm}>
                                                취소
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* 사용자 목록 */}
                        {adminLoading ? (
                            <div className="loading">
                                <div className="loading-spinner"></div>
                                <div>사용자 목록을 불러오고 있습니다...</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="user-table">
                                    <thead>
                                        <tr>
                                            <th>아이디</th>
                                            <th>이름</th>
                                            <th>역할</th>
                                            <th>이메일</th>
                                            <th>소속</th>
                                            <th>상태</th>
                                            <th>관리</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminUsers.map(user => (
                                            <tr key={user.id}>
                                                <td style={{ fontWeight: '500' }}>{user.username}</td>
                                                <td>{user.name}</td>
                                                <td>
                                                    <span className={`role-badge role-${user.role}`}>
                                                        {roleLabels[user.role] || user.role}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#6B6560', fontSize: '13px' }}>{user.email}</td>
                                                <td style={{ color: '#6B6560', fontSize: '13px' }}>{user.organization || '-'}</td>
                                                <td>
                                                    {user.is_active ? (
                                                        <span className="status-active" style={{ fontSize: '13px' }}>● 활성</span>
                                                    ) : (
                                                        <span className="status-inactive" style={{ fontSize: '13px' }}>● 비활성</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div className="admin-actions">
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            onClick={() => startEditUser(user)}
                                                        >
                                                            수정
                                                        </button>
                                                        {user.is_active ? (
                                                            <button
                                                                className="btn btn-danger btn-sm"
                                                                onClick={() => handleDeleteUser(user)}
                                                            >
                                                                삭제
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className="btn btn-secondary btn-sm"
                                                                onClick={() => handleRestoreUser(user)}
                                                                style={{ color: '#22543D' }}
                                                            >
                                                                복원
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {adminUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>
                                                    등록된 사용자가 없습니다.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                                <div style={{ marginTop: '16px', fontSize: '13px', color: '#A0AEC0' }}>
                                    총 {adminUsers.length}명 (활성: {adminUsers.filter(u => u.is_active).length}명, 비활성: {adminUsers.filter(u => !u.is_active).length}명)
                                </div>
                            </div>
                        )}
                        </div>)}

                        {/* ── F-04: 활동 로그 탭 ─────────────────────────────────────── */}
                        {adminTab === 'logs' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>📜 활동 로그</h3>
                                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={loadActivityLogs}>🔄 새로고침</button>
                                    </div>
                                    {/* F-04: 필터링 */}
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                                        <select className="form-input" style={{ width: 'auto', fontSize: 13 }} value={logFilterUser} onChange={e => setLogFilterUser(e.target.value)}>
                                            <option value="">사용자 전체</option>
                                            {[...new Set(activityLogs.map(l => l.user_name).filter(Boolean))].map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <select className="form-input" style={{ width: 'auto', fontSize: 13 }} value={logFilterAction} onChange={e => setLogFilterAction(e.target.value)}>
                                            <option value="">작업 유형 전체</option>
                                            <option value="등록">등록</option>
                                            <option value="수정">수정</option>
                                            <option value="삭제">삭제</option>
                                            <option value="승인">승인</option>
                                            <option value="댓글">댓글</option>
                                            <option value="프로필">프로필</option>
                                            <option value="일괄">일괄</option>
                                        </select>
                                        <input type="date" className="form-input" style={{ width: 'auto', fontSize: 13 }} value={logFilterDateFrom} onChange={e => setLogFilterDateFrom(e.target.value)} title="시작일" />
                                        <span style={{ fontSize: 12, color: '#718096', lineHeight: '32px' }}>~</span>
                                        <input type="date" className="form-input" style={{ width: 'auto', fontSize: 13 }} value={logFilterDateTo} onChange={e => setLogFilterDateTo(e.target.value)} title="종료일" />
                                        <span style={{ fontSize: 12, color: '#718096', lineHeight: '32px' }}>{filteredLogs.length}건</span>
                                    </div>
                                    {activityLogs.length === 0 ? (
                                        <div style={{ textAlign: 'center', color: '#A0AEC0', padding: 40 }}>
                                            기록된 활동 로그가 없습니다.
                                            <div style={{ marginTop: 12 }}>
                                                <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={loadActivityLogs}>로그 불러오기</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                            {filteredLogs.map(log => (
                                                <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #F0F0F0', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                                    <div style={{ fontSize: 20 }}>
                                                        {log.action.includes('삭제') ? '🗑️' : log.action.includes('수정') ? '✏️' : log.action.includes('등록') || log.action.includes('작성') ? '📝' : log.action.includes('승인') ? '✅' : log.action.includes('로그인') ? '🔑' : '📋'}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: 14, fontWeight: 500, color: '#2D3748' }}>{log.action}</div>
                                                        {log.details && <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>{log.details}</div>}
                                                        <div style={{ fontSize: 11, color: '#A0AEC0', marginTop: 4 }}>
                                                            {log.user_name || '시스템'} • {new Date(log.created_at).toLocaleString('ko-KR')}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                        )}
                    </div>
                );
            };


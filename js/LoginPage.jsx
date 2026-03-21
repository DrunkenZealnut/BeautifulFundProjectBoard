// LoginPage.jsx — Authentication component
// Dependencies: supabase, hashPassword (from config.js)

        // 로그인 컴포넌트
        function LoginPage({ onLogin }) {
            const [username, setUsername] = useState('');
            const [password, setPassword] = useState('');
            const [loginError, setLoginError] = useState('');
            const [isLoading, setIsLoading] = useState(false);


            const handleLogin = async (e) => {
                e.preventDefault();
                setLoginError('');
                setIsLoading(true);

                try {
                    // users 테이블에서 username으로 조회 (password_hash는 인증에만 사용)
                    const { data: users, error } = await supabase
                        .from('users')
                        .select('id, username, name, email, role, phone, organization, position, password_hash')
                        .eq('username', username)
                        .eq('is_active', true)
                        .limit(1);

                    if (error) throw error;

                    if (!users || users.length === 0) {
                        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
                        setIsLoading(false);
                        return;
                    }

                    const user = users[0];

                    // 비밀번호 확인 (SHA-256 해시 비교)
                    const hashedInput = await hashPassword(password);
                    if (user.password_hash !== hashedInput) {
                        setLoginError('아이디 또는 비밀번호가 올바르지 않습니다.');
                        setIsLoading(false);
                        return;
                    }

                    // 로그인 성공 - localStorage에 세션 저장 (password_hash 제외, 만료시간 포함)
                    const sessionData = {
                        id: user.id,
                        username: user.username,
                        name: user.name,
                        role: user.role,
                        email: user.email,
                        organization: user.organization,
                        position: user.position,
                        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24시간
                    };
                    localStorage.setItem('bf_user_session', JSON.stringify(sessionData));
                    onLogin(sessionData);
                } catch (err) {
                    console.error('Login error:', err);
                    setLoginError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                } finally {
                    setIsLoading(false);
                }
            };


            return (
                <div className="login-overlay">
                    <div className="login-card">
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🌱</div>
                        </div>
                        <h1>아름다운재단 사업관리시스템</h1>
                        <p className="login-subtitle">2026 공익단체 인큐베이팅 지원사업</p>

                        {loginError && (
                            <div className="login-error">{loginError}</div>
                        )}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label>아이디</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    placeholder="아이디를 입력하세요"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>비밀번호</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="비밀번호를 입력하세요"
                                    required
                                />
                            </div>
                            <button type="submit" className="login-btn" disabled={isLoading}>
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                        </form>

                        <p style={{ textAlign: 'center', fontSize: '12px', color: '#A0AEC0', marginTop: '24px', marginBottom: 0 }}>
                            청년노동자인권센터 • 아름다운재단
                        </p>
                    </div>
                </div>
            );
        }

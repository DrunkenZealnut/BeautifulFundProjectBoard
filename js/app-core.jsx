// app.jsx — Main application component
// Dependencies: config.js, documents.jsx, LoginPage.jsx (loaded via script tags)

        function ProjectManagementSystem() {
            // 인증 상태
            const [currentUser, setCurrentUser] = useState(() => {
                try {
                    const saved = localStorage.getItem('bf_user_session');
                    if (!saved) return null;
                    const session = JSON.parse(saved);
                    // 세션 만료 확인
                    if (!session.expiresAt || Date.now() > session.expiresAt) {
                        localStorage.removeItem('bf_user_session');
                        return null;
                    }
                    return session;
                } catch { return null; }
            });

            const [currentPage, setCurrentPage] = useState("dashboard");
            const [loading, setLoading] = useState(true);
            const [error, setError] = useState(null);
            const [data, setData] = useState({
                schedules: [],
                galleries: [],
                boards: [],
                budgetExecutions: [],
                stats: {}
            });

            // 게시판 공통 상태
            const [boardView, setBoardView] = useState('list'); // list | detail | write
            const [boardCategory, setBoardCategory] = useState('all');
            const [boardSearchQuery, setBoardSearchQuery] = useState('');
            const [boardCurrentPage, setBoardCurrentPage] = useState(1);
            const [selectedPost, setSelectedPost] = useState(null);
            const [boardWriteData, setBoardWriteData] = useState({
                title: '', content: '', board_type: 'notice', category: '', is_pinned: false, password: ''
            });
            const [editingPost, setEditingPost] = useState(null); // null이면 새글, 객체면 수정모드

            // 갤러리 상태
            const [galleryView, setGalleryView] = useState('list'); // list | detail | write
            const [galleryCategory, setGalleryCategory] = useState('all');
            const [gallerySearchQuery, setGallerySearchQuery] = useState('');
            const [galleryCurrentPage, setGalleryCurrentPage] = useState(1);
            const [selectedGalleryItem, setSelectedGalleryItem] = useState(null);
            const [galleryWriteData, setGalleryWriteData] = useState({
                title: '', description: '', category: '현장사진', location: '', photographer: '', taken_date: '', password: ''
            });
            const [editingGalleryItem, setEditingGalleryItem] = useState(null);

            // ===== 캘린더 & Google Calendar 상태 =====
            const [calendarView, setCalendarView] = useState('month'); // month | list
            const [calendarDate, setCalendarDate] = useState(new Date());
            const [selectedDate, setSelectedDate] = useState(null);
            const [scheduleModal, setScheduleModal] = useState(null); // null | 'create' | 'detail' | 'edit'
            const [selectedSchedule, setSelectedSchedule] = useState(null);
            const [scheduleForm, setScheduleForm] = useState({
                title: '', description: '', category: '교육', subcategory: '',
                start_date: '', end_date: '', start_time: '', end_time: '',
                location: '', max_participants: '', status: 'planned'
            });

            // Google Calendar 상태
            const GOOGLE_CLIENT_ID = '661991001901-i6onuk7mdpe9jfss70u23j0g29bf83s2.apps.googleusercontent.com';
            const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar';
            const [googleConnected, setGoogleConnected] = useState(false);
            const [googleSyncing, setGoogleSyncing] = useState(false);
            const [googleEvents, setGoogleEvents] = useState([]);
            const [googleTokenClient, setGoogleTokenClient] = useState(null);
            const gapiInited = useRef(false);
            const gisInited = useRef(false);

            // ===== 뉴스레터 상태 =====
            const [newsletterConfig, setNewsletterConfig] = useState({
                title: '', issueNumber: '', publishDate: new Date().toISOString().split('T')[0],
                greeting: '', closing: '', dateFrom: '', dateTo: '',
                scheduleCategory: 'all', boardCategory: 'all',
            });
            const [selectedScheduleIds, setSelectedScheduleIds] = useState(new Set());
            const [selectedBoardIds, setSelectedBoardIds] = useState(new Set());
            const [boardImageUrls, setBoardImageUrls] = useState({});
            const [selectedGalleryNewsletterIds, setSelectedGalleryNewsletterIds] = useState(new Set());
            const [galleryThumbUrls, setGalleryThumbUrls] = useState({});
            const [rewrittenContents, setRewrittenContents] = useState({});
            const [rewritingBoardId, setRewritingBoardId] = useState(null);

            // Load board attachment images when newsletter selection changes
            const selectedBoardKey = useMemo(() => Array.from(selectedBoardIds).sort().join(','), [selectedBoardIds]);
            useEffect(() => {
                if (!selectedBoardKey) return;
                const ids = selectedBoardKey.split(',').filter(Boolean);
                const loadImages = async () => {
                    const newUrls = {};
                    for (const bid of ids) {
                        const { data: atts } = await supabase.from('attachments')
                            .select('file_path, file_type').eq('board_id', bid).order('created_at', { ascending: true });
                        const imgs = (atts || []).filter(a => a.file_type?.startsWith('image/'));
                        newUrls[bid] = imgs.map(img => { const { data: u } = supabase.storage.from('attachments').getPublicUrl(img.file_path); return u?.publicUrl || null; }).filter(Boolean);
                    }
                    setBoardImageUrls(newUrls);
                };
                loadImages();
            }, [selectedBoardKey]);

            // Load gallery thumbnail images when selection changes
            const selectedGalleryKey = useMemo(() => Array.from(selectedGalleryNewsletterIds).sort().join(','), [selectedGalleryNewsletterIds]);
            useEffect(() => {
                if (!selectedGalleryKey) return;
                const ids = selectedGalleryKey.split(',').filter(Boolean);
                const loadGalleryThumbs = async () => {
                    const urls = {};
                    for (const gid of ids) {
                        if (galleryThumbUrls[gid]) { urls[gid] = galleryThumbUrls[gid]; continue; }
                        const { data: atts } = await supabase.from('attachments')
                            .select('file_path, file_type').eq('gallery_id', gid).order('created_at', { ascending: true });
                        const img = (atts || []).find(a => a.file_type?.startsWith('image/'));
                        if (img) { const { data: u } = supabase.storage.from('attachments').getPublicUrl(img.file_path); urls[gid] = u?.publicUrl || null; }
                    }
                    setGalleryThumbUrls(urls);
                };
                loadGalleryThumbs();
            }, [selectedGalleryKey]);

            // AI rewrite handler
            const handleRewriteBoard = async (boardId, originalText) => {
                setRewritingBoardId(boardId);
                try {
                    const apiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'https://beautifulfundboard.vercel.app' : '';
                    const resp = await fetch(apiBase + '/api/rewrite', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: (originalText || '').replace(/<[^>]*>/g, '') }) });
                    if (!resp.ok) { const e = await resp.json().catch(() => ({})); alert(e.error || `AI 재가공 실패 (${resp.status})`); return; }
                    const d = await resp.json();
                    if (d.rewritten) setRewrittenContents(prev => ({ ...prev, [boardId]: d.rewritten }));
                    else alert(d.error || 'AI 재가공 실패');
                } catch (e) { alert('AI 서버 연결 실패'); }
                finally { setRewritingBoardId(null); }
            };

            // Google API 초기화
            useEffect(() => {
                const initGapi = () => {
                    if (window.gapi) {
                        window.gapi.load('client', async () => {
                            try {
                                await window.gapi.client.init({
                                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                                });
                                gapiInited.current = true;
                                console.log('✅ Google API client 초기화 완료');
                            } catch (err) {
                                console.error('❌ GAPI 초기화 실패:', err);
                            }
                        });
                    } else {
                        setTimeout(initGapi, 500);
                    }
                };

                const initGis = () => {
                    if (window.google?.accounts?.oauth2) {
                        const tokenClient = window.google.accounts.oauth2.initTokenClient({
                            client_id: GOOGLE_CLIENT_ID,
                            scope: GOOGLE_SCOPES,
                            callback: (tokenResponse) => {
                                if (tokenResponse.access_token) {
                                    setGoogleConnected(true);
                                    console.log('✅ Google 인증 성공');
                                    loadGoogleCalendarEvents();
                                }
                            },
                        });
                        setGoogleTokenClient(tokenClient);
                        gisInited.current = true;
                        console.log('✅ Google Identity Services 초기화 완료');
                    } else {
                        setTimeout(initGis, 500);
                    }
                };

                initGapi();
                initGis();
            }, []);

            // Google Calendar 로그인
            const handleGoogleLogin = useCallback(() => {
                if (!googleTokenClient) {
                    alert('Google API가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
                    return;
                }
                if (window.gapi.client.getToken() === null) {
                    googleTokenClient.requestAccessToken({ prompt: 'consent' });
                } else {
                    googleTokenClient.requestAccessToken({ prompt: '' });
                }
            }, [googleTokenClient]);

            // Google Calendar 로그아웃
            const handleGoogleLogout = useCallback(() => {
                const token = window.gapi.client.getToken();
                if (token) {
                    window.google.accounts.oauth2.revoke(token.access_token);
                    window.gapi.client.setToken('');
                }
                setGoogleConnected(false);
                setGoogleEvents([]);
                console.log('🔓 Google 연결 해제');
            }, []);

            // Google Calendar 이벤트 로드
            const loadGoogleCalendarEvents = useCallback(async () => {
                if (!gapiInited.current || !window.gapi.client.getToken()) return;

                try {
                    const year = calendarDate.getFullYear();
                    const month = calendarDate.getMonth();
                    const timeMin = new Date(year, month - 1, 1).toISOString();
                    const timeMax = new Date(year, month + 2, 0).toISOString();

                    const response = await window.gapi.client.calendar.events.list({
                        calendarId: 'primary',
                        timeMin,
                        timeMax,
                        showDeleted: false,
                        singleEvents: true,
                        maxResults: 250,
                        orderBy: 'startTime',
                    });

                    const events = response.result.items || [];
                    setGoogleEvents(events);
                    console.log(`📅 Google Calendar 이벤트 ${events.length}개 로드`);
                } catch (err) {
                    console.error('❌ Google Calendar 이벤트 로드 실패:', err);
                }
            }, [calendarDate]);

            // calendarDate 변경 시 Google Calendar 이벤트 다시 로드
            useEffect(() => {
                if (googleConnected) {
                    loadGoogleCalendarEvents();
                }
            }, [calendarDate, googleConnected, loadGoogleCalendarEvents]);

            // Supabase → Google Calendar 동기화 (일정 추가)
            const syncToGoogleCalendar = useCallback(async (schedule) => {
                if (!googleConnected || !gapiInited.current) {
                    alert('Google Calendar에 연결되지 않았습니다. 먼저 연결해주세요.');
                    return;
                }

                try {
                    setGoogleSyncing(true);

                    // 시간 형식 정규화: "HH:MM" → "HH:MM:SS", "HH:MM:SS" → 그대로
                    const normalizeTime = (t) => {
                        if (!t) return null;
                        const parts = t.split(':');
                        if (parts.length === 2) return `${t}:00`;
                        return t;
                    };

                    const startTime = normalizeTime(schedule.start_time);
                    const endTime = normalizeTime(schedule.end_time);
                    const hasTime = !!startTime;

                    // 종일 이벤트의 end.date는 종료일 다음 날이어야 함 (Google Calendar API 규칙)
                    // toISOString()은 UTC 변환하므로 KST(+9)에서 날짜가 밀림 → 로컬 메서드 사용
                    const getNextDay = (dateStr) => {
                        const [y, m, d] = dateStr.split('-').map(Number);
                        const next = new Date(y, m - 1, d + 1);
                        return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
                    };

                    const endDateStr = schedule.end_date || schedule.start_date;

                    let event;
                    if (hasTime) {
                        event = {
                            summary: schedule.title,
                            description: schedule.description || '',
                            location: schedule.location || '',
                            start: {
                                dateTime: `${schedule.start_date}T${startTime}+09:00`,
                                timeZone: 'Asia/Seoul',
                            },
                            end: {
                                dateTime: `${endDateStr}T${endTime || startTime}+09:00`,
                                timeZone: 'Asia/Seoul',
                            },
                        };
                    } else {
                        // 종일 이벤트: date 필드만 사용, dateTime/timeZone 없이
                        event = {
                            summary: schedule.title,
                            description: schedule.description || '',
                            location: schedule.location || '',
                            start: {
                                date: schedule.start_date,
                            },
                            end: {
                                date: getNextDay(endDateStr),
                            },
                        };
                    }

                    console.log('📤 Google Calendar 전송 데이터:', JSON.stringify(event, null, 2));

                    const response = await window.gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event,
                    });

                    console.log('✅ Google Calendar 동기화 완료:', response.result.htmlLink);
                    await loadGoogleCalendarEvents();
                    return response.result;
                } catch (err) {
                    console.error('❌ Google Calendar 동기화 실패:', err);
                    const detail = err?.result?.error?.message || err?.message || JSON.stringify(err);
                    console.error('❌ 상세 오류:', detail);
                    alert(`Google Calendar 동기화에 실패했습니다.\n\n원인: ${detail}`);
                } finally {
                    setGoogleSyncing(false);
                }
            }, [googleConnected, loadGoogleCalendarEvents]);

            // Google Calendar → Supabase 가져오기
            const importFromGoogleCalendar = useCallback(async (googleEvent) => {
                try {
                    const startDate = googleEvent.start.dateTime
                        ? googleEvent.start.dateTime.split('T')[0]
                        : googleEvent.start.date;
                    const endDate = googleEvent.end.dateTime
                        ? googleEvent.end.dateTime.split('T')[0]
                        : googleEvent.end.date;
                    const startTime = googleEvent.start.dateTime
                        ? googleEvent.start.dateTime.split('T')[1].substring(0, 5)
                        : null;
                    const endTime = googleEvent.end.dateTime
                        ? googleEvent.end.dateTime.split('T')[1].substring(0, 5)
                        : null;

                    // Duplicate check: skip if same title + start date already exists in Supabase
                    const title = googleEvent.summary || '(제목 없음)';
                    const duplicate = data.schedules.some(s =>
                        s.title === title && s.start_date === startDate
                    );
                    if (duplicate) {
                        alert(`"${title}" 일정은 이미 등록되어 있습니다.`);
                        return;
                    }

                    const { data: newSchedule, error } = await supabase
                        .from('schedules')
                        .insert({
                            title: googleEvent.summary || '(제목 없음)',
                            description: googleEvent.description || '',
                            location: googleEvent.location || '',
                            start_date: startDate,
                            end_date: endDate !== startDate ? endDate : null,
                            start_time: startTime,
                            end_time: endTime,
                            category: '기타',
                            status: 'planned',
                            created_by: currentUser.id,
                            is_public: true,
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    setData(prev => ({
                        ...prev,
                        schedules: [...prev.schedules, newSchedule].sort((a, b) =>
                            new Date(a.start_date) - new Date(b.start_date)
                        )
                    }));

                    console.log('✅ Google → Supabase 가져오기 완료:', newSchedule.title);
                    return newSchedule;
                } catch (err) {
                    console.error('❌ Google 이벤트 가져오기 실패:', err);
                    alert('이벤트 가져오기에 실패했습니다.');
                }
            }, [currentUser, data.schedules]);

            // Sync all Supabase schedules to Google Calendar (skips already-synced items)
            const syncAllToGoogle = useCallback(async () => {
                if (!googleConnected) return;
                setGoogleSyncing(true);
                try {
                    let synced = 0;
                    let skipped = 0;
                    for (const schedule of data.schedules) {
                        // Skip if an event with the same title + start date already exists in Google
                        const alreadySynced = googleEvents.some(ge => {
                            const geDate = ge.start.dateTime
                                ? ge.start.dateTime.split('T')[0]
                                : ge.start.date;
                            return ge.summary === schedule.title && geDate === schedule.start_date;
                        });
                        if (alreadySynced) { skipped++; continue; }
                        await syncToGoogleCalendar(schedule);
                        synced++;
                    }
                    alert(`${synced}개 일정이 Google Calendar에 동기화되었습니다.${skipped > 0 ? `\n(${skipped}개 중복 건너뜀)` : ''}`);
                } catch (err) {
                    console.error('❌ 전체 동기화 실패:', err);
                } finally {
                    setGoogleSyncing(false);
                }
            }, [googleConnected, data.schedules, googleEvents, syncToGoogleCalendar]);

            // 일정 저장 (신규/수정)
            const handleSaveSchedule = useCallback(async () => {
                if (!scheduleForm.title || !scheduleForm.start_date) {
                    alert('제목과 시작일은 필수입니다.');
                    return;
                }

                try {
                    const payload = {
                        title: scheduleForm.title,
                        description: scheduleForm.description,
                        category: scheduleForm.category,
                        subcategory: scheduleForm.subcategory || null,
                        start_date: scheduleForm.start_date,
                        end_date: scheduleForm.end_date || null,
                        start_time: scheduleForm.start_time || null,
                        end_time: scheduleForm.end_time || null,
                        location: scheduleForm.location || null,
                        max_participants: scheduleForm.max_participants ? parseInt(scheduleForm.max_participants) : null,
                        status: scheduleForm.status,
                    };

                    if (scheduleModal === 'edit' && selectedSchedule) {
                        // 수정
                        const { data: updated, error } = await supabase
                            .from('schedules')
                            .update(payload)
                            .eq('id', selectedSchedule.id)
                            .select()
                            .single();

                        if (error) throw error;

                        setData(prev => ({
                            ...prev,
                            schedules: prev.schedules.map(s => s.id === updated.id ? updated : s)
                        }));
                    } else {
                        // 신규
                        payload.created_by = currentUser.id;
                        payload.is_public = true;

                        const { data: created, error } = await supabase
                            .from('schedules')
                            .insert(payload)
                            .select()
                            .single();

                        if (error) throw error;

                        setData(prev => ({
                            ...prev,
                            schedules: [...prev.schedules, created].sort((a, b) =>
                                new Date(a.start_date) - new Date(b.start_date)
                            )
                        }));

                        // Google Calendar에도 동기화
                        if (googleConnected) {
                            await syncToGoogleCalendar(created);
                        }
                    }

                    setScheduleModal(null);
                    setSelectedSchedule(null);
                } catch (err) {
                    console.error('❌ 일정 저장 실패:', err);
                    alert('일정 저장에 실패했습니다: ' + err.message);
                }
            }, [scheduleForm, scheduleModal, selectedSchedule, currentUser, googleConnected, syncToGoogleCalendar]);

            // 일정 삭제
            const handleDeleteSchedule = useCallback(async (scheduleId) => {
                if (!confirm('이 일정을 삭제하시겠습니까?')) return;

                try {
                    const { error, count } = await supabase
                        .from('schedules')
                        .delete()
                        .eq('id', scheduleId)
                        .select();

                    if (error) {
                        console.error('❌ Supabase 삭제 오류:', error.message, error.details, error.hint);
                        throw error;
                    }

                    console.log('✅ 일정 삭제 완료, id:', scheduleId);

                    setData(prev => ({
                        ...prev,
                        schedules: prev.schedules.filter(s => s.id !== scheduleId)
                    }));
                    setScheduleModal(null);
                    setSelectedSchedule(null);
                } catch (err) {
                    console.error('❌ 일정 삭제 실패:', err);
                    alert('일정 삭제에 실패했습니다: ' + (err.message || ''));
                }
            }, []);

            // 캘린더 유틸리티 함수
            const getCalendarDays = useCallback((year, month) => {
                const firstDay = new Date(year, month, 1);
                const lastDay = new Date(year, month + 1, 0);
                const startDay = firstDay.getDay(); // 0=일
                const daysInMonth = lastDay.getDate();

                const days = [];

                // 이전 달
                const prevLastDay = new Date(year, month, 0).getDate();
                for (let i = startDay - 1; i >= 0; i--) {
                    days.push({ day: prevLastDay - i, month: month - 1, year, isOtherMonth: true });
                }

                // 이번 달
                for (let d = 1; d <= daysInMonth; d++) {
                    days.push({ day: d, month, year, isOtherMonth: false });
                }

                // 다음 달
                const remaining = 42 - days.length;
                for (let d = 1; d <= remaining; d++) {
                    days.push({ day: d, month: month + 1, year, isOtherMonth: true });
                }

                return days;
            }, []);

            const getEventsForDate = useCallback((dateStr) => {
                const supabaseEvents = data.schedules.filter(s => {
                    if (s.start_date === dateStr) return true;
                    if (s.end_date && s.start_date <= dateStr && s.end_date >= dateStr) return true;
                    return false;
                });

                const gEvents = googleEvents.filter(e => {
                    const eDate = e.start.dateTime ? e.start.dateTime.split('T')[0] : e.start.date;
                    const eEndDate = e.end.dateTime ? e.end.dateTime.split('T')[0] : e.end.date;
                    if (eDate === dateStr) return true;
                    if (eDate <= dateStr && eEndDate >= dateStr) return true;
                    return false;
                }).filter(ge => {
                    // 이미 Supabase에 같은 제목+날짜가 있으면 중복 제거
                    return !supabaseEvents.some(se => se.title === ge.summary && se.start_date === (ge.start.dateTime ? ge.start.dateTime.split('T')[0] : ge.start.date));
                });

                return { supabaseEvents, googleEvents: gEvents };
            }, [data.schedules, googleEvents]);

            const formatDateStr = (year, month, day) => {
                return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            };

            const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
            const MONTHS_KR = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

            // 링크 미리보기 상태
            const [linkPreviews, setLinkPreviews] = useState([]);
            const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
            const boardWriteDebounceRef = useRef(null);

            // 첨부파일 상태
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            const MAX_FILE_COUNT = 5;
            const [boardAttachments, setBoardAttachments] = useState([]);
            const [galleryAttachments, setGalleryAttachments] = useState([]);
            const [detailAttachments, setDetailAttachments] = useState([]);
            const boardFileInputRef = useRef(null);
            const galleryFileInputRef = useRef(null);
            const [budgetAttachments, setBudgetAttachments] = useState([]);
            const budgetFileInputRef = useRef(null);
            const [executionAttachmentsMap, setExecutionAttachmentsMap] = useState({});
            const executionFileInputRef = useRef(null);
            const activeUploadExecutionIdRef = useRef(null);
            const [executionDocsMap, setExecutionDocsMap] = useState({});
            // { [execId]: { [docName]: { file_path, file_name, file_size } } }
            const docUploadFileInputRef = useRef(null);
            const activeDocUploadRef = useRef(null); // { execId, docName }
            const [formDocFiles, setFormDocFiles] = useState({});
            // { [docName]: File } — 등록 폼 서류 첨부 (등록 완료 후 업로드)
            const formDocFileInputRef = useRef(null);
            const activeFormDocNameRef = useRef(null);
            const boardEditorRef = useRef(null);
            const galleryEditorRef = useRef(null);
            // ── 대시보드 차트 refs ────────────────────────────────────────
            const monthlyChartRef = useRef(null);
            const monthlyChartInst = useRef(null);

            // 회계가이드 상태
            const [guideTab, setGuideTab] = useState('principles');
            const [selectedAccount, setSelectedAccount] = useState(null);
            const [withholdingAmount, setWithholdingAmount] = useState('');
            const [expenseRate, setExpenseRate] = useState(60);

            // 예산관리 상태
            const [budgetTab, setBudgetTab] = useState("dashboard");
            const [budgetPeriod, setBudgetPeriod] = useState("total"); // total | h1 | h2
            const [ratioTab, setRatioTab] = useState('project'); // 비용비율 내부 탭: 'project' | 'operating'
            // ── 집행내역 정렬/필터/검색 상태 ──────────────────────────────
            const [execSortBy, setExecSortBy] = useState('execution_date');
            const [execSortDir, setExecSortDir] = useState('desc');
            const [execFilterCategory, setExecFilterCategory] = useState('');
            const [execFilterSubcategory, setExecFilterSubcategory] = useState('');
            const [execFilterStatus, setExecFilterStatus] = useState('');
            const [execFilterPayment, setExecFilterPayment] = useState('');
            const [execFilterDateFrom, setExecFilterDateFrom] = useState('');
            const [execFilterDateTo, setExecFilterDateTo] = useState('');
            const [execSearchQuery, setExecSearchQuery] = useState('');
            // ── 신규 기능 상태 ──────────────────────────────
            const [execCalMonth, setExecCalMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; });
            const [execCalSelectedDate, setExecCalSelectedDate] = useState(null);
            const [dismissedAlerts, setDismissedAlerts] = useState(() => { try { return JSON.parse(sessionStorage.getItem('bf_dismissed_alerts') || '[]'); } catch { return []; } });
            const [attendanceData, setAttendanceData] = useState(() => { try { return JSON.parse(localStorage.getItem('bf_attendance') || '{}'); } catch { return {}; } });
            const [profileModal, setProfileModal] = useState(false);
            const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', currentPassword: '', newPassword: '', confirmPassword: '' });
            const [profileMsg, setProfileMsg] = useState('');
            const [selectedExecIds, setSelectedExecIds] = useState(new Set());
            const [comments, setComments] = useState([]);
            const [newComment, setNewComment] = useState('');
            const [activityLogs, setActivityLogs] = useState([]);
            const [formData, setFormData] = useState({
                subcategory_id: '',
                subcategory_name: '',
                category_name: '',
                budget_item_id: '',
                budget_item_name: '',
                type: '',
                description: '',
                amount: '',
                payment_method: '',
                execution_date: new Date().toISOString().split('T')[0],
                recipient: ''
            });
            const [calculatorAmount, setCalculatorAmount] = useState('');
            const [calculationResult, setCalculationResult] = useState(null);
            const [calcIncomeType, setCalcIncomeType] = useState('강사료');
            const [calcPersons, setCalcPersons] = useState([{ name: '', amount: '' }]);
            const [calcMultiResults, setCalcMultiResults] = useState(null);
            const [calcMode, setCalcMode] = useState('single'); // single | multi

            // 예산관리 helper functions
            // 원천징수 계산: 원단위 절사 (국세, 지방세 따로 계산 후 절사)
            const calculateWithholdingTax = (amount) => {
                if (amount <= CONFIG.WITHHOLDING_THRESHOLD) {
                    return { income: 0, local: 0, total: 0, net: amount, taxable: false };
                }
                const incomeTax = Math.floor(amount * CONFIG.INCOME_TAX_RATE);   // 국세: 8% 후 원단위 절사
                const localTax = Math.floor(incomeTax * CONFIG.LOCAL_TAX_RATE);  // 지방세: 국세의 10% 후 원단위 절사
                return {
                    income: incomeTax,
                    local: localTax,
                    total: incomeTax + localTax,
                    net: amount - (incomeTax + localTax),
                    taxable: true
                };
            };

            const calculateMultiPersonTax = () => {
                const results = calcPersons
                    .filter(p => p.amount && parseInt(p.amount) > 0)
                    .map(p => ({
                        name: p.name || '(이름없음)',
                        amount: parseInt(p.amount),
                        ...calculateWithholdingTax(parseInt(p.amount))
                    }));
                const summary = results.reduce((acc, r) => ({
                    totalAmount: acc.totalAmount + r.amount,
                    totalIncome: acc.totalIncome + r.income,
                    totalLocal: acc.totalLocal + r.local,
                    totalTax: acc.totalTax + r.total,
                    totalNet: acc.totalNet + r.net
                }), { totalAmount: 0, totalIncome: 0, totalLocal: 0, totalTax: 0, totalNet: 0 });
                setCalcMultiResults({ persons: results, summary });
            };

            // 소득유형별 정보
            const INCOME_TYPE_INFO = {
                '강사료': {
                    label: '강사료',
                    desc: '외부 강사 초빙 시 지급하는 강의 대가',
                    docs: ['강의확인서 (인적사항, 강의일시/장소/주제, 소속/직위)', '강사료 지급내역서 (등급, 강사료, 공제액, 실지급액, 입금계좌)', '이체증', '강의 유인물 또는 강의자료 또는 강의사진 중 1가지', '원천징수 신고/납부내역서 (125,000원 초과 시)'],
                    rules: ['외래강사에 한하여 지급 (단체 직원, 임직원 지급 불가)', '금액 불문 계좌입금 원칙', '강사 등급에 맞는 이력사항 기재 필수', '야외 현장 강의 시 강의사진 첨부 필수']
                },
                '단순인건비': {
                    label: '단순인건비',
                    desc: '일용직 형태로 고용한 임시 근로자에게 지급하는 인건비',
                    docs: ['고용 계획서 (고용목적, 기간, 인적사항, 지급단가)', '업무일지 또는 참여확인서', '지급내역서 (이름, 업무, 근무기간, 인건비, 공제액, 실지급액, 입금계좌)', '이체증', '원천징수 신고/납부내역서 (125,000원 초과 시)'],
                    rules: ['단체 구성원이나 임직원에게 지급 불가', '반드시 계좌이체 (현금지급 불가)', '고용 전 내부 품의 결재 필요', '주민번호 취합 필요 (연말 기타소득지급명세서 제출용)']
                },
                '회의참석수당': {
                    label: '회의참석수당 / 심사비 / 토론비 / 발제비',
                    desc: '전문가 자문회의 등 참가자에게 지급하는 수당',
                    docs: ['회의참석 확인서 (인적사항, 회의명, 일시/장소)', '회의 참석수당 지급내역서', '회의록 사본', '이체증', '원천징수 신고/납부내역서 (125,000원 초과 시)'],
                    rules: ['1일 1회 한하여 지급 (최대 15만원)', '기본료 2시간 이내: 100,000원', '초과료 2시간 초과 시: +50,000원 (시간 무관)', '단체 임직원, 단순 청중에게 지급 불가', '토론비/발제비는 회의참석수당 적용 (강사수당 불가)', '금액 불문 계좌이체 원칙']
                },
                '원고료': {
                    label: '원고료',
                    desc: '외부 기고, 번역, 원고 작성 등에 대한 대가',
                    docs: ['원고 수령 확인서', '지급내역서', '이체증', '원천징수 신고/납부내역서 (125,000원 초과 시)'],
                    rules: ['외부인에 한하여 지급', '계좌이체 원칙']
                }
            };

            const getRequiredDocuments = (type, paymentMethod) => {
                if (!DOCUMENT_RULES[type]) return [];

                const rule = DOCUMENT_RULES[type];
                let docs = [...rule.base, ...rule.required];

                // 조건부 서류 추가
                if (rule.conditional && rule.conditional.length > 0) {
                    docs.push(...rule.conditional);
                }

                return docs;
            };

            // 시기별 예산 조회 헬퍼
            const getBudgetByPeriod = (item, period) => {
                if (period === 'total') return item.budget;
                return item[period] || 0;
            };

            const getAllSubcategories = () => {
                const subcategories = [];
                BUDGET_DATA.categories.forEach(category => {
                    category.subcategories.forEach(subcategory => {
                        subcategories.push({
                            ...subcategory,
                            categoryName: category.name
                        });
                    });
                });
                return subcategories;
            };

            const getAllBudgetItems = (subcategoryId) => {
                const subcategories = getAllSubcategories();
                const subcategory = subcategories.find(s => s.id === subcategoryId);
                return subcategory ? subcategory.items : [];
            };

            // ── 집행내역 필터링/정렬 파이프라인 ─────────────────────────
            const filteredExecutions = useMemo(() => {
                let result = data?.budgetExecutions || [];
                if (execFilterCategory) result = result.filter(e => e.category_name === execFilterCategory);
                if (execFilterSubcategory) result = result.filter(e => e.subcategory_name === execFilterSubcategory);
                if (execFilterStatus) result = result.filter(e => e.status === execFilterStatus);
                if (execFilterPayment) result = result.filter(e => e.payment_method === execFilterPayment);
                if (execFilterDateFrom) result = result.filter(e => e.execution_date >= execFilterDateFrom);
                if (execFilterDateTo) result = result.filter(e => e.execution_date <= execFilterDateTo);
                if (execSearchQuery.trim()) {
                    const q = execSearchQuery.trim().toLowerCase();
                    result = result.filter(e =>
                        (e.budget_item_name || '').toLowerCase().includes(q) ||
                        (e.description || '').toLowerCase().includes(q) ||
                        (e.recipient || '').toLowerCase().includes(q)
                    );
                }
                result = [...result].sort((a, b) => {
                    let va = a[execSortBy], vb = b[execSortBy];
                    if (execSortBy === 'amount') {
                        va = va || 0; vb = vb || 0;
                        return execSortDir === 'asc' ? va - vb : vb - va;
                    }
                    va = va || ''; vb = vb || '';
                    const cmp = va.localeCompare(vb);
                    return execSortDir === 'asc' ? cmp : -cmp;
                });
                return result;
            }, [data?.budgetExecutions, execFilterCategory, execFilterSubcategory, execFilterStatus, execFilterPayment, execFilterDateFrom, execFilterDateTo, execSearchQuery, execSortBy, execSortDir]);

            const resetExecFilters = () => {
                setExecSortBy('execution_date'); setExecSortDir('desc');
                setExecFilterCategory(''); setExecFilterSubcategory('');
                setExecFilterStatus(''); setExecFilterPayment('');
                setExecFilterDateFrom(''); setExecFilterDateTo('');
                setExecSearchQuery('');
                setSelectedExecIds(new Set());
            };

            // ── F-01: 알림 생성 ──────────────────────────────
            const getDashboardAlerts = () => {
                const alerts = [];
                const today = new Date();
                (data?.schedules || []).forEach(s => {
                    if (!s.start_date) return;
                    const diff = Math.ceil((new Date(s.start_date) - today) / 86400000);
                    if (diff < 0 || diff > 7) return;
                    const id = `sched-${s.id}`;
                    if (dismissedAlerts.includes(id)) return;
                    alerts.push({ id, level: diff <= 1 ? 'urgent' : diff <= 3 ? 'warning' : 'info', text: `[D-${diff === 0 ? 'Day' : diff}] ${s.title} (${s.start_date})`, sort: diff });
                });
                const pendingCount = (data?.budgetExecutions || []).filter(e => e.status === 'pending').length;
                if (pendingCount > 0 && !dismissedAlerts.includes('pending-execs'))
                    alerts.push({ id: 'pending-execs', level: 'warning', text: `미승인 집행건 ${pendingCount}건 처리 필요`, sort: 2 });
                [{ date: `${today.getFullYear()}-06-30`, label: '상반기 정산 마감' }, { date: `${today.getFullYear()}-12-31`, label: '하반기 정산 마감' }].forEach(h => {
                    const diff = Math.ceil((new Date(h.date) - today) / 86400000);
                    if (diff >= 0 && diff <= 30 && !dismissedAlerts.includes(`dl-${h.date}`))
                        alerts.push({ id: `dl-${h.date}`, level: diff <= 3 ? 'urgent' : diff <= 7 ? 'warning' : 'info', text: `[D-${diff}] ${h.label} (${h.date})`, sort: diff });
                });
                BUDGET_DATA.categories.forEach(cat => cat.subcategories.forEach(sub => {
                    const totalBudget = sub.items.reduce((s, i) => s + i.amount, 0);
                    const spent = (data?.budgetExecutions || []).filter(e => e.subcategory_id === sub.id).reduce((s, e) => s + (e.amount || 0), 0);
                    const rate = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
                    if (rate >= 85 && !dismissedAlerts.includes(`bw-${sub.id}`))
                        alerts.push({ id: `bw-${sub.id}`, level: rate >= 95 ? 'urgent' : 'warning', text: `${sub.name} 예산 소진율 ${Math.round(rate)}%`, sort: 5 });
                }));
                return alerts.sort((a, b) => ({ urgent: 0, warning: 1, info: 2 }[a.level] || 3) - ({ urgent: 0, warning: 1, info: 2 }[b.level] || 3) || a.sort - b.sort);
            };
            const dismissAlert = (id) => { const u = [...dismissedAlerts, id]; setDismissedAlerts(u); sessionStorage.setItem('bf_dismissed_alerts', JSON.stringify(u)); };

            // ── F-02: 댓글 CRUD ──────────────────────────────
            const loadComments = async (parentType, parentId) => {
                try {
                    const { data: c } = await supabase.from('comments').select('*').eq('parent_type', parentType).eq('parent_id', parentId).order('created_at', { ascending: true });
                    setComments(c || []);
                } catch { setComments([]); }
            };
            const addComment = async (parentType, parentId) => {
                if (!newComment.trim()) return;
                try {
                    await supabase.from('comments').insert({ parent_type: parentType, parent_id: parentId, content: newComment.trim(), author_id: currentUser?.id, author_name: currentUser?.name || '익명' });
                    setNewComment('');
                    await loadComments(parentType, parentId);
                    logActivity('댓글 작성', parentType, parentId, newComment.trim().slice(0, 50));
                } catch (err) { console.error('댓글 저장 실패:', err); }
            };
            const deleteComment = async (commentId, parentType, parentId) => {
                if (!confirm('댓글을 삭제하시겠습니까?')) return;
                try {
                    await supabase.from('comments').delete().eq('id', commentId);
                    await loadComments(parentType, parentId);
                } catch (err) { console.error('댓글 삭제 실패:', err); }
            };

            // ── F-03: 프로필 수정 ──────────────────────────────
            const openProfileModal = () => {
                setProfileForm({ name: currentUser?.name || '', email: currentUser?.email || '', phone: currentUser?.phone || '', currentPassword: '', newPassword: '', confirmPassword: '' });
                setProfileMsg('');
                setProfileModal(true);
            };
            const getPasswordStrength = (pw) => {
                if (!pw) return null;
                let score = 0;
                if (pw.length >= 6) score++;
                if (pw.length >= 10) score++;
                if (/[A-Z]/.test(pw)) score++;
                if (/[0-9]/.test(pw)) score++;
                if (/[^A-Za-z0-9]/.test(pw)) score++;
                if (score <= 1) return { label: '약함', color: '#E53E3E', width: '33%' };
                if (score <= 3) return { label: '보통', color: '#F59E0B', width: '66%' };
                return { label: '강함', color: '#22C55E', width: '100%' };
            };
            const saveProfile = async () => {
                setProfileMsg('');
                if (profileForm.newPassword && profileForm.newPassword !== profileForm.confirmPassword) { setProfileMsg('새 비밀번호가 일치하지 않습니다.'); return; }
                if (profileForm.newPassword && profileForm.newPassword.length < 4) { setProfileMsg('비밀번호는 4자 이상이어야 합니다.'); return; }
                try {
                    // 비밀번호 변경 시 현재 비밀번호 검증
                    if (profileForm.newPassword) {
                        if (!profileForm.currentPassword) { setProfileMsg('현재 비밀번호를 입력해주세요.'); return; }
                        const hashedCurrent = await hashPassword(profileForm.currentPassword);
                        const { data: userRow } = await supabase.from('users').select('password_hash').eq('id', currentUser.id).single();
                        if (userRow?.password_hash !== hashedCurrent) { setProfileMsg('현재 비밀번호가 일치하지 않습니다.'); return; }
                    }
                    const updates = { name: profileForm.name, email: profileForm.email, phone: profileForm.phone };
                    if (profileForm.newPassword) updates.password_hash = await hashPassword(profileForm.newPassword);
                    const { error } = await supabase.from('users').update(updates).eq('id', currentUser.id);
                    if (error) throw error;
                    setCurrentUser(prev => ({ ...prev, name: updates.name, email: updates.email, phone: updates.phone }));
                    const session = JSON.parse(localStorage.getItem('bf_user_session'));
                    if (session) { session.user = { ...session.user, name: updates.name, email: updates.email, phone: updates.phone }; localStorage.setItem('bf_user_session', JSON.stringify(session)); }
                    setProfileMsg('저장되었습니다!');
                    logActivity('프로필 수정', 'user', currentUser.id, profileForm.name);
                } catch (err) { setProfileMsg('저장 실패: ' + err.message); }
            };

            // ── F-04: 활동 로그 ──────────────────────────────
            const logActivity = async (action, targetType, targetId, details) => {
                try {
                    await supabase.from('activity_logs').insert({ user_id: currentUser?.id, user_name: currentUser?.name, action, target_type: targetType, target_id: targetId, details });
                } catch { /* 테이블 미생성 시 무시 */ }
            };
            const [logFilterUser, setLogFilterUser] = useState('');
            const [logFilterAction, setLogFilterAction] = useState('');
            const [logFilterDateFrom, setLogFilterDateFrom] = useState('');
            const [logFilterDateTo, setLogFilterDateTo] = useState('');
            const loadActivityLogs = async () => {
                try {
                    const { data: logs } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
                    setActivityLogs(logs || []);
                } catch { setActivityLogs([]); }
            };
            const filteredLogs = activityLogs.filter(l => {
                if (logFilterUser && l.user_name !== logFilterUser) return false;
                if (logFilterAction && !l.action.includes(logFilterAction)) return false;
                if (logFilterDateFrom && l.created_at < logFilterDateFrom) return false;
                if (logFilterDateTo && l.created_at > logFilterDateTo + 'T23:59:59') return false;
                return true;
            });

            // ── F-07: 출석 관리 ──────────────────────────────
            const getAttendance = (scheduleId) => attendanceData[scheduleId] || {};
            const setAttendance = (scheduleId, name, status) => {
                const updated = { ...attendanceData, [scheduleId]: { ...attendanceData[scheduleId], [name]: status } };
                setAttendanceData(updated);
                localStorage.setItem('bf_attendance', JSON.stringify(updated));
                // F-07: Supabase 영속 저장
                supabase.from('system_settings').upsert({ setting_key: 'attendance_data', setting_value: JSON.stringify(updated) }, { onConflict: 'setting_key' }).catch(() => {});
            };
            // F-07: 앱 시작 시 Supabase에서 출석 데이터 로딩
            React.useEffect(() => {
                supabase.from('system_settings').select('setting_value').eq('setting_key', 'attendance_data').single()
                    .then(({ data: row }) => {
                        if (row?.setting_value) {
                            try {
                                const parsed = JSON.parse(row.setting_value);
                                setAttendanceData(prev => {
                                    const merged = { ...parsed, ...prev };
                                    localStorage.setItem('bf_attendance', JSON.stringify(merged));
                                    return merged;
                                });
                            } catch {}
                        }
                    }).catch(() => {});
            }, []);

            // ── F-10: 대량 작업 ──────────────────────────────
            const toggleExecSelect = (id) => {
                setSelectedExecIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
            };
            const toggleAllExecs = () => {
                if (selectedExecIds.size === filteredExecutions.length) setSelectedExecIds(new Set());
                else setSelectedExecIds(new Set(filteredExecutions.map(e => e.id)));
            };
            const bulkChangeStatus = async (newStatus) => {
                if (selectedExecIds.size === 0) return;
                if (!confirm(`${selectedExecIds.size}건을 '${EXECUTION_STATUS[newStatus]?.label}'(으)로 변경하시겠습니까?`)) return;
                try {
                    for (const id of selectedExecIds) {
                        await supabase.from('budget_executions').update({ status: newStatus }).eq('id', id);
                    }
                    logActivity('일괄 상태 변경', 'budget_executions', null, `${selectedExecIds.size}건 → ${newStatus}`);
                    setSelectedExecIds(new Set());
                    await refreshExecutions();
                } catch (err) { alert('일괄 변경 오류: ' + err.message); }
            };
            const bulkDelete = async () => {
                if (selectedExecIds.size === 0) return;
                if (!confirm(`${selectedExecIds.size}건을 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return;
                try {
                    for (const id of selectedExecIds) {
                        await supabase.from('budget_executions').delete().eq('id', id);
                    }
                    logActivity('일괄 삭제', 'budget_executions', null, `${selectedExecIds.size}건`);
                    setSelectedExecIds(new Set());
                    await refreshExecutions();
                } catch (err) { alert('일괄 삭제 오류: ' + err.message); }
            };

            // 데이터 로딩 함수들
            const loadSchedules = useCallback(async () => {
                try {
                    console.log('🔍 스케줄 데이터 로딩 시작...');
                    console.log('🔗 Supabase 연결 확인:', { url: supabaseUrl, key: supabaseKey?.substring(0, 10) + '...' });

                    // Supabase 클라이언트 연결 테스트
                    console.log('🔗 연결 테스트 수행 중...');
                    try {
                        const { data: pingTest, error: pingError } = await supabase.auth.getSession();
                        console.log('🏓 연결 테스트 결과:', { pingError });
                    } catch (pingErr) {
                        console.error('🏓 연결 테스트 실패:', pingErr);
                    }

                    // 먼저 테이블 존재 확인
                    console.log('📋 테이블 존재 확인 중...');
                    const { data: tableCheck, error: tableError } = await supabase
                        .from('schedules')
                        .select('count', { count: 'exact', head: true });

                    console.log('📊 테이블 확인 결과:', { count: tableCheck, error: tableError });

                    // 실제 데이터 조회
                    const { data: schedules, error } = await supabase
                        .from('schedules')
                        .select('*')
                        .order('start_date', { ascending: true });

                    console.log('📊 Supabase 스케줄 응답:', {
                        data: schedules,
                        error,
                        count: schedules ? schedules.length : 0
                    });

                    if (error) {
                        console.error('❌ 스케줄 로딩 오류:', error);
                        console.error('❌ 오류 상세:', error.message, error.details, error.hint);
                        console.error('❌ 전체 오류 객체:', JSON.stringify(error, null, 2));

                        if (error.message === 'Invalid API key') {
                            console.error('🔑 API 키 문제 감지. Supabase 대시보드에서 API 키를 확인하세요.');
                        }
                        throw error;
                    }

                    if (schedules && schedules.length > 0) {
                        console.log('✅ 로딩된 스케줄들:', schedules.map(s => ({ id: s.id, title: s.title, date: s.start_date })));
                    } else {
                        console.warn('⚠️ 스케줄이 없습니다. RLS 정책을 확인해주세요.');
                    }

                    return schedules || [];
                } catch (err) {
                    console.error('💥 스케줄 로딩 중 예외 발생:', err);
                    console.error('💥 예외 상세:', err.message, err.stack);
                    return [];
                }
            }, []);

            const loadGalleries = useCallback(async () => {
                try {
                    const { data: galleries, error } = await supabase
                        .from('galleries')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    return galleries || [];
                } catch (err) {
                    console.error('Error loading galleries:', err);
                    return [];
                }
            }, []);

            const loadBoards = useCallback(async () => {
                try {
                    const { data: boards, error } = await supabase
                        .from('boards')
                        .select('*, author:users(name)')
                        .eq('status', 'published')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    return boards || [];
                } catch (err) {
                    console.error('Error loading boards:', err);
                    return [];
                }
            }, []);

            const loadBudgetExecutions = useCallback(async () => {
                try {
                    const { data: executions, error } = await supabase
                        .from('budget_executions')
                        .select('*')
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    return executions || [];
                } catch (err) {
                    console.error('Error loading budget executions:', err);
                    return [];
                }
            }, []);

            // 통계 계산
            const calculateStats = useCallback((schedules, galleries, boards, executions) => {
                const totalBudget = CONFIG.TOTAL_BUDGET;
                const usedBudget = executions.reduce((sum, exec) => sum + (exec.amount || 0), 0);
                const usageRate = Math.round((usedBudget / totalBudget) * 100);

                const upcomingSchedules = schedules.filter(s =>
                    new Date(s.start_date) >= new Date()
                ).length;

                return {
                    usageRate,
                    usedBudget,
                    totalBudget,
                    upcomingSchedules,
                    totalSchedules: schedules.length,
                    totalGalleries: galleries.length,
                    totalBoards: boards.length
                };
            }, []);

            // 초기 데이터 로딩
            useEffect(() => {
                const loadAllData = async () => {
                    try {
                        setLoading(true);
                        setError(null);

                        const [schedules, galleries, boards, executions, recipientsData, settingsData] = await Promise.all([
                            loadSchedules(),
                            loadGalleries(),
                            loadBoards(),
                            loadBudgetExecutions(),
                            supabase.from('recipients').select('id,name,birth_date,address,phone')
                                .eq('is_active', true).order('name').then(r => r.data || []),
                            supabase.from('system_settings').select('setting_key,setting_value')
                                .in('setting_key', [
                                    'org_name', 'org_phone',
                                    'org_representative', 'org_address', 'org_registration_number', 'org_seal',
                                    'perf_textbook_team', 'perf_textbook_report',
                                    'perf_campaign_count', 'perf_app_released', 'perf_committee_count'
                                ])
                                .then(r => r.data || [])
                        ]);

                        setRecipients(recipientsData);
                        const merged = { org_name: '', org_phone: '', org_representative: '', org_address: '', org_registration_number: '', org_seal: '' };
                        const perfMerged = {
                            perf_textbook_team: '0', perf_textbook_report: '0',
                            perf_campaign_count: '0', perf_app_released: '0', perf_committee_count: '0'
                        };
                        settingsData.forEach(row => {
                            if (row.setting_key in merged) merged[row.setting_key] = row.setting_value || '';
                            if (row.setting_key in perfMerged) perfMerged[row.setting_key] = row.setting_value || '0';
                        });
                        setOrgSettings(merged);
                        setPerfIndicators(perfMerged);

                        const stats = calculateStats(schedules, galleries, boards, executions);

                        setData({
                            schedules,
                            galleries,
                            boards,
                            budgetExecutions: executions,
                            stats
                        });

                    } catch (err) {
                        setError('데이터를 불러오는 중 오류가 발생했습니다: ' + err.message);
                        console.error('Error loading data:', err);
                    } finally {
                        setLoading(false);
                    }
                };

                loadAllData();
                // F-04: 활동 로그 초기 로딩 (대시보드 위젯용)
                loadActivityLogs();
            }, [loadSchedules, loadGalleries, loadBoards, loadBudgetExecutions, calculateStats]);

            // ── 대시보드 차트 ─────────────────────────────────────────────
            const renderMonthlyChart = useCallback(() => {
                if (!data?.budgetExecutions?.length) return;
                if (!monthlyChartRef.current) return;

                // 카테고리별 월별 집계 (누적 바차트용)
                const CATEGORY_COLORS = { '사업비': '#134E42', '운영비': '#D97706' };
                const FALLBACK_COLORS = ['#7C3AED', '#0891B2', '#E53E3E', '#38A169'];
                const categoriesFound = [...new Set(data.budgetExecutions.map(e => e.category_name).filter(Boolean))];
                const monthlyByCategory = {};
                categoriesFound.forEach(cat => { monthlyByCategory[cat] = Array(12).fill(0); });
                data.budgetExecutions.forEach(e => {
                    const m = parseInt((e.execution_date || '').slice(5, 7)) - 1;
                    if (m >= 0 && m < 12 && e.category_name) monthlyByCategory[e.category_name][m] += e.amount || 0;
                });
                const datasets = categoriesFound.map((cat, i) => ({
                    label: cat,
                    data: monthlyByCategory[cat],
                    backgroundColor: CATEGORY_COLORS[cat] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    borderRadius: 4,
                    stack: 'stack0'
                }));

                if (monthlyChartInst.current) monthlyChartInst.current.destroy();
                monthlyChartInst.current = new window.Chart(monthlyChartRef.current.getContext('2d'), {
                    type: 'bar',
                    data: {
                        labels: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
                        datasets
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
                            tooltip: {
                                callbacks: {
                                    footer: items => {
                                        const total = items.reduce((s, i) => s + i.parsed.y, 0);
                                        return '합계: ' + (total >= 10000 ? Math.floor(total / 10000) + '만' : total) + '원';
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true },
                            y: { stacked: true, ticks: { callback: v => (v >= 10000 ? Math.floor(v / 10000) + '만' : v) + '원' } }
                        }
                    }
                });
            }, [data?.budgetExecutions]);

            useEffect(() => {
                renderMonthlyChart();
                return () => {
                    if (monthlyChartInst.current) { monthlyChartInst.current.destroy(); monthlyChartInst.current = null; }
                };
            }, [renderMonthlyChart]);

            // 집행 내역 탭: 증빙서류 업로드 현황 로드
            useEffect(() => {
                if (budgetTab !== 'history') return;
                if (Object.keys(executionDocsMap).length > 0) return;
                const loadDocs = async () => {
                    try {
                        const { data: docs } = await supabase
                            .from('documents')
                            .select('*')
                            .order('created_at', { ascending: true });
                        const map = {};
                        (docs || []).forEach(d => {
                            if (!map[d.execution_id]) map[d.execution_id] = {};
                            map[d.execution_id][d.document_name] = d;
                        });
                        setExecutionDocsMap(map);
                    } catch (err) {
                        console.error('Error loading execution documents:', err);
                    }
                };
                loadDocs();
            }, [budgetTab]);

            // 집행 내역 탭이 열릴 때 첨부파일 로드 (이미 로드된 경우 재조회 생략)
            useEffect(() => {
                if (budgetTab !== 'history') return;
                if (Object.keys(executionAttachmentsMap).length > 0) return;
                const loadExecutionAttachments = async () => {
                    try {
                        const { data: atts } = await supabase
                            .from('attachments')
                            .select('*')
                            .not('execution_id', 'is', null)
                            .order('created_at', { ascending: true });
                        if (atts) {
                            const map = {};
                            atts.forEach(a => {
                                if (!map[a.execution_id]) map[a.execution_id] = [];
                                map[a.execution_id].push(a);
                            });
                            setExecutionAttachmentsMap(map);
                        }
                    } catch (err) {
                        console.error('Error loading execution attachments:', err);
                    }
                };
                loadExecutionAttachments();
            }, [budgetTab]);

            // 페이지 렌더링 함수들
            // Gallery thumbnails for dashboard (auto-load images from attachments)

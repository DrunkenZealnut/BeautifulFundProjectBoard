-- ===============================================
-- 아름다운재단 2026 공익단체 인큐베이팅 지원사업
-- 데이터베이스 설계
-- ===============================================

-- 사용자 및 권한 관리
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff', 'participant', 'viewer') DEFAULT 'participant',
    phone VARCHAR(20),
    organization VARCHAR(100),
    position VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

-- 예산 집행 관리 (기존 예산관리 확장)
CREATE TABLE budget_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subcategory_id VARCHAR(50) NOT NULL,
    subcategory_name VARCHAR(100) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    budget_item_id VARCHAR(50),
    budget_item_name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 자문비, 사업인건비 등
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_method ENUM('카드', '계좌이체') NOT NULL,
    execution_date DATE NOT NULL,
    recipient VARCHAR(100),
    status ENUM('pending', 'approved', 'executed', 'completed') DEFAULT 'pending',
    created_by INTEGER,
    approved_by INTEGER,
    approved_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 증빙서류 관리
CREATE TABLE documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_id INTEGER NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    document_type ENUM('required', 'optional') DEFAULT 'required',
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_by INTEGER,
    is_checked BOOLEAN DEFAULT 0,
    checked_by INTEGER,
    checked_at TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (execution_id) REFERENCES budget_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    FOREIGN KEY (checked_by) REFERENCES users(id)
);

-- 사업 일정 관리
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('교육', '캠페인', '회의', '평가', '기타') NOT NULL,
    subcategory VARCHAR(100), -- 노동안전보건, 참견위원회 등
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status ENUM('planned', 'ongoing', 'completed', 'cancelled') DEFAULT 'planned',
    responsible_person INTEGER,
    created_by INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (responsible_person) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 참여자 관리 및 출석 체크
CREATE TABLE participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_id INTEGER NOT NULL,
    user_id INTEGER,
    name VARCHAR(100) NOT NULL, -- 외부 참여자를 위해 별도 이름 필드
    email VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(100),
    registration_type ENUM('internal', 'external') DEFAULT 'external',
    status ENUM('registered', 'confirmed', 'attended', 'absent', 'cancelled') DEFAULT 'registered',
    attendance_time TIMESTAMP NULL,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 갤러리 관리 (사업 현장 사진, 결과물 등)
CREATE TABLE galleries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category ENUM('현장사진', '결과물', '교육자료', '캠페인', '행사', '영수증', '기타') NOT NULL,
    subcategory VARCHAR(100), -- 세부 분류
    image_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    original_filename VARCHAR(255),
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    taken_date DATE,
    location VARCHAR(200),
    photographer VARCHAR(100),
    schedule_id INTEGER, -- 관련 일정과 연결
    execution_id INTEGER, -- 관련 예산 집행과 연결
    uploaded_by INTEGER NOT NULL,
    is_public BOOLEAN DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    tags TEXT, -- JSON 형태로 태그 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id),
    FOREIGN KEY (execution_id) REFERENCES budget_executions(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 자료실 및 게시판
CREATE TABLE boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_type ENUM('notice', 'materials', 'faq', 'qna', 'report') NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    author_id INTEGER NOT NULL,
    is_pinned BOOLEAN DEFAULT 0,
    is_public BOOLEAN DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    status ENUM('draft', 'published', 'archived') DEFAULT 'published',
    published_at TIMESTAMP NULL,
    tags TEXT, -- JSON 형태로 태그 저장
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 첨부파일 관리
CREATE TABLE attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER,
    gallery_id INTEGER,
    execution_id INTEGER,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_by INTEGER NOT NULL,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE,
    FOREIGN KEY (execution_id) REFERENCES budget_executions(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- 댓글 시스템
CREATE TABLE comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER,
    gallery_id INTEGER,
    parent_id INTEGER, -- 대댓글을 위한 부모 댓글 ID
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

-- 시스템 로그 및 활동 기록
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type VARCHAR(50) NOT NULL, -- login, upload, edit, delete 등
    target_type VARCHAR(50), -- budget, schedule, gallery 등
    target_id INTEGER,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 시스템 설정
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    updated_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- 인덱스 생성
CREATE INDEX idx_budget_executions_date ON budget_executions(execution_date);
CREATE INDEX idx_budget_executions_status ON budget_executions(status);
CREATE INDEX idx_schedules_date ON schedules(start_date, end_date);
CREATE INDEX idx_participants_schedule ON participants(schedule_id);
CREATE INDEX idx_galleries_category ON galleries(category, subcategory);
CREATE INDEX idx_boards_type_date ON boards(board_type, created_at);
CREATE INDEX idx_comments_board ON comments(board_id);
CREATE INDEX idx_activity_logs_user_date ON activity_logs(user_id, created_at);

-- 초기 데이터 삽입
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('site_name', '2026 공익단체 인큐베이팅 지원사업', '사이트 이름'),
('organization_name', '청년노동자인권센터', '운영 기관명'),
('total_budget', '70000000', '총 사업비 (원)'),
('project_period', '2026.01 ~ 2026.12', '사업 기간'),
('max_file_size', '10485760', '최대 파일 업로드 크기 (10MB)'),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","hwp"]', '허용되는 파일 확장자'),
('gallery_thumbnail_size', '300x200', '갤러리 썸네일 크기'),
('items_per_page', '20', '페이지당 항목 수');

-- 기본 관리자 계정 (비밀번호는 실제 환경에서 해시화 필요)
INSERT INTO users (username, email, password_hash, name, role, organization, position) VALUES
('admin', 'admin@younglabor.org', 'hashed_password_here', '관리자', 'admin', '청년노동자인권센터', '사업담당자');
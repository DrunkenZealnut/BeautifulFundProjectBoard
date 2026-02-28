-- ===============================================
-- 아름다운재단 2026 공익단체 인큐베이팅 지원사업
-- Supabase 데이터베이스 스키마
-- ===============================================

-- Enable RLS (Row Level Security)
-- 이미 생성된 테이블이 있다면 먼저 삭제
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.boards CASCADE;
DROP TABLE IF EXISTS public.galleries CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.schedules CASCADE;
DROP TABLE IF EXISTS public.budget_executions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 사용자 및 권한 관리
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(100) NOT NULL,
    role TEXT CHECK (role IN ('admin', 'staff', 'participant', 'viewer')) DEFAULT 'participant',
    phone VARCHAR(20),
    organization VARCHAR(100),
    position VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- 예산 집행 관리
CREATE TABLE public.budget_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id VARCHAR(50) NOT NULL,
    subcategory_name VARCHAR(100) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    budget_item_id VARCHAR(50),
    budget_item_name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('카드', '계좌이체')) NOT NULL,
    execution_date DATE NOT NULL,
    recipient VARCHAR(100),
    status TEXT CHECK (status IN ('pending', 'approved', 'executed', 'completed')) DEFAULT 'pending',
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 증빙서류 관리
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.budget_executions(id) ON DELETE CASCADE,
    document_name VARCHAR(255) NOT NULL,
    document_type TEXT CHECK (document_type IN ('required', 'optional')) DEFAULT 'required',
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    uploaded_by UUID REFERENCES public.users(id),
    is_checked BOOLEAN DEFAULT FALSE,
    checked_by UUID REFERENCES public.users(id),
    checked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사업 일정 관리
CREATE TABLE public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('교육', '캠페인', '회의', '평가', '기타')) NOT NULL,
    subcategory VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(200),
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')) DEFAULT 'planned',
    responsible_person UUID REFERENCES public.users(id),
    created_by UUID NOT NULL REFERENCES public.users(id),
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 참여자 관리 및 출석 체크
CREATE TABLE public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(100),
    registration_type TEXT CHECK (registration_type IN ('internal', 'external')) DEFAULT 'external',
    status TEXT CHECK (status IN ('registered', 'confirmed', 'attended', 'absent', 'cancelled')) DEFAULT 'registered',
    attendance_time TIMESTAMP WITH TIME ZONE,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 갤러리 관리 (사업 현장 사진, 결과물 등)
CREATE TABLE public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('현장사진', '결과물', '교육자료', '캠페인', '행사', '영수증', '기타')) NOT NULL,
    subcategory VARCHAR(100),
    image_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    original_filename VARCHAR(255),
    file_size INTEGER,
    image_width INTEGER,
    image_height INTEGER,
    taken_date DATE,
    location VARCHAR(200),
    photographer VARCHAR(100),
    schedule_id UUID REFERENCES public.schedules(id),
    execution_id UUID REFERENCES public.budget_executions(id),
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 자료실 및 게시판
CREATE TABLE public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type TEXT CHECK (board_type IN ('notice', 'materials', 'faq', 'qna', 'report')) NOT NULL,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    author_id UUID NOT NULL REFERENCES public.users(id),
    is_pinned BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'published',
    published_at TIMESTAMP WITH TIME ZONE,
    tags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 첨부파일 관리
CREATE TABLE public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES public.budget_executions(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 댓글 시스템
CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
    gallery_id UUID REFERENCES public.galleries(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.users(id),
    content TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 로그 및 활동 기록
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 설정
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_budget_executions_date ON public.budget_executions(execution_date);
CREATE INDEX idx_budget_executions_status ON public.budget_executions(status);
CREATE INDEX idx_schedules_date ON public.schedules(start_date, end_date);
CREATE INDEX idx_participants_schedule ON public.participants(schedule_id);
CREATE INDEX idx_galleries_category ON public.galleries(category, subcategory);
CREATE INDEX idx_boards_type_date ON public.boards(board_type, created_at);
CREATE INDEX idx_comments_board ON public.comments(board_id);
CREATE INDEX idx_activity_logs_user_date ON public.activity_logs(user_id, created_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (모든 사용자에게 읽기 권한, 인증된 사용자에게 쓰기 권한)
-- 사용자 테이블 정책
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- 공개 읽기 정책 (로그인하지 않아도 볼 수 있는 데이터)
CREATE POLICY "Public read access for schedules" ON public.schedules
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public read access for galleries" ON public.galleries
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public read access for boards" ON public.boards
    FOR SELECT USING (is_public = true AND status = 'published');

-- 인증된 사용자 쓰기 정책
CREATE POLICY "Authenticated users can insert schedules" ON public.schedules
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert galleries" ON public.galleries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert boards" ON public.boards
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert budget executions" ON public.budget_executions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 초기 데이터 삽입
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
('site_name', '2026 공익단체 인큐베이팅 지원사업', '사이트 이름'),
('organization_name', '청년노동자인권센터', '운영 기관명'),
('total_budget', '70000000', '총 사업비 (원)'),
('project_period', '2026.01 ~ 2026.12', '사업 기간'),
('max_file_size', '10485760', '최대 파일 업로드 크기 (10MB)'),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","hwp"]', '허용되는 파일 확장자'),
('gallery_thumbnail_size', '300x200', '갤러리 썸네일 크기'),
('items_per_page', '20', '페이지당 항목 수');

-- 기본 관리자 사용자 생성 (실제 운영시에는 Supabase Auth를 통해 생성)
INSERT INTO public.users (id, username, email, name, role, organization, position) VALUES
('00000000-0000-0000-0000-000000000001'::uuid, 'admin', 'admin@younglabor.org', '관리자', 'admin', '청년노동자인권센터', '사업담당자');

-- 샘플 데이터 삭제됨 - 실제 운영 시 필요에 따라 데이터를 추가해주세요
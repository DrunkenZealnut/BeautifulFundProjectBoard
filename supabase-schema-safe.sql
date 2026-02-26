-- ===============================================
-- 아름다운재단 2026 공익단체 인큐베이팅 지원사업
-- Supabase 데이터베이스 스키마 (안전 버전)
-- ===============================================

-- 기존 테이블을 삭제하지 않고 새로 생성
-- 이미 존재하는 경우 오류가 발생할 수 있습니다

-- 사용자 및 권한 관리
CREATE TABLE IF NOT EXISTS public.users (
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
CREATE TABLE IF NOT EXISTS public.budget_executions (
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
CREATE TABLE IF NOT EXISTS public.documents (
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
CREATE TABLE IF NOT EXISTS public.schedules (
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
CREATE TABLE IF NOT EXISTS public.participants (
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
CREATE TABLE IF NOT EXISTS public.galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('현장사진', '결과물', '교육자료', '캠페인', '행사', '기타')) NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_type TEXT CHECK (board_type IN ('notice', 'materials', 'report', 'free')) NOT NULL,
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
CREATE TABLE IF NOT EXISTS public.attachments (
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
CREATE TABLE IF NOT EXISTS public.comments (
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
CREATE TABLE IF NOT EXISTS public.activity_logs (
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
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description VARCHAR(500),
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화) - 이미 존재할 경우 무시됨
CREATE INDEX IF NOT EXISTS idx_budget_executions_date ON public.budget_executions(execution_date);
CREATE INDEX IF NOT EXISTS idx_budget_executions_status ON public.budget_executions(status);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON public.schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_participants_schedule ON public.participants(schedule_id);
CREATE INDEX IF NOT EXISTS idx_galleries_category ON public.galleries(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_boards_type_date ON public.boards(board_type, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_board ON public.comments(board_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, created_at);

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

-- 기본 RLS 정책 (기존 정책이 있는 경우 무시됨)
DO $$
BEGIN
    -- 기존 정책이 있다면 삭제하고 새로 생성 (모든 스케줄 읽기 허용)
    DROP POLICY IF EXISTS "Public read access for schedules" ON public.schedules;
    CREATE POLICY "Public read access for schedules" ON public.schedules
        FOR SELECT USING (true);

    -- 갤러리와 게시판도 임시로 모든 데이터 읽기 허용
    DROP POLICY IF EXISTS "Public read access for galleries" ON public.galleries;
    CREATE POLICY "Public read access for galleries" ON public.galleries
        FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public read access for boards" ON public.boards;
    CREATE POLICY "Public read access for boards" ON public.boards
        FOR SELECT USING (true);

    -- 예산 집행도 임시로 읽기 허용 (디버깅을 위해)
    DROP POLICY IF EXISTS "Public read access for budget executions" ON public.budget_executions;
    CREATE POLICY "Public read access for budget executions" ON public.budget_executions
        FOR SELECT USING (true);

    -- 쓰기 정책 (임시로 모든 사용자에게 INSERT 허용)
    DROP POLICY IF EXISTS "Authenticated users can insert schedules" ON public.schedules;
    CREATE POLICY "Public insert access for schedules" ON public.schedules
        FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can insert galleries" ON public.galleries;
    CREATE POLICY "Public insert access for galleries" ON public.galleries
        FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can insert boards" ON public.boards;
    CREATE POLICY "Public insert access for boards" ON public.boards
        FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Authenticated users can insert budget executions" ON public.budget_executions;
    CREATE POLICY "Public insert access for budget executions" ON public.budget_executions
        FOR INSERT WITH CHECK (true);

    -- UPDATE 정책도 추가
    DROP POLICY IF EXISTS "Public update access for budget executions" ON public.budget_executions;
    CREATE POLICY "Public update access for budget executions" ON public.budget_executions
        FOR UPDATE USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update access for boards" ON public.boards;
    CREATE POLICY "Public update access for boards" ON public.boards
        FOR UPDATE USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public update access for galleries" ON public.galleries;
    CREATE POLICY "Public update access for galleries" ON public.galleries
        FOR UPDATE USING (true) WITH CHECK (true);
END
$$;

-- 초기 데이터 삽입 (중복 방지)
INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES
('site_name', '2026 공익단체 인큐베이팅 지원사업', '사이트 이름'),
('organization_name', '청년노동자인권센터', '운영 기관명'),
('total_budget', '70000000', '총 사업비 (원)'),
('project_period', '2026.01 ~ 2026.12', '사업 기간'),
('max_file_size', '10485760', '최대 파일 업로드 크기 (10MB)'),
('allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","xls","xlsx","ppt","pptx","hwp"]', '허용되는 파일 확장자'),
('gallery_thumbnail_size', '300x200', '갤러리 썸네일 크기'),
('items_per_page', '20', '페이지당 항목 수')
ON CONFLICT (setting_key) DO NOTHING;

-- 기본 관리자 사용자 생성 (중복 방지)
INSERT INTO public.users (id, username, email, name, role, organization, position)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'admin', 'admin@younglabor.org', '관리자', 'admin', '청년노동자인권센터', '사업담당자')
ON CONFLICT (username) DO NOTHING;

-- 테스트 스케줄 데이터 (디버그용)
INSERT INTO public.schedules (
    title, description, category, subcategory,
    start_date, end_date, start_time, end_time,
    location, max_participants, current_participants,
    status, responsible_person, created_by, is_public
) VALUES
(
    '노동안전보건 교육',
    '청년 노동자를 위한 기본 노동안전보건 교육',
    '교육',
    '기본교육',
    '2026-03-15',
    '2026-03-15',
    '14:00:00',
    '17:00:00',
    '청년노동자인권센터 교육실',
    30,
    0,
    'planned',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
),
(
    '근로기준법 워크샵',
    '근로기준법의 이해와 실무 적용',
    '교육',
    '심화교육',
    '2026-04-20',
    '2026-04-20',
    '10:00:00',
    '16:00:00',
    '온라인 (Zoom)',
    50,
    0,
    'planned',
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    true
)
ON CONFLICT DO NOTHING;
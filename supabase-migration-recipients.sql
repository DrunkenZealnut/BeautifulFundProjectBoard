-- ============================================================
-- 수급자 프로필 & 기관 정보 사전등록 마이그레이션
-- 실행 순서: Supabase SQL Editor에서 전체 선택 후 실행
-- ============================================================

-- 1. recipients 테이블 생성
CREATE TABLE IF NOT EXISTS public.recipients (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       text NOT NULL,
    birth_date text,          -- 자유 형식 (예: 850101 또는 1985-01-01)
    address    text,
    phone      text,
    notes      text,
    is_active  boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.recipients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipients_select" ON public.recipients;
CREATE POLICY "recipients_select" ON public.recipients
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "recipients_insert" ON public.recipients;
CREATE POLICY "recipients_insert" ON public.recipients
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "recipients_update" ON public.recipients;
CREATE POLICY "recipients_update" ON public.recipients
    FOR UPDATE USING (true) WITH CHECK (true);

-- 2. system_settings INSERT 정책 추가 (upsert 신규 행 삽입 허용)
DROP POLICY IF EXISTS "Public insert access for system_settings" ON public.system_settings;
CREATE POLICY "Public insert access for system_settings" ON public.system_settings
    FOR INSERT WITH CHECK (true);

-- 3. 기관 정보용 system_settings 초기 삽입 (있으면 무시)
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
    ('org_representative',      '', '대표자명'),
    ('org_address',             '', '기관주소'),
    ('org_registration_number', '', '사업자등록번호(고유번호)')
ON CONFLICT (setting_key) DO NOTHING;

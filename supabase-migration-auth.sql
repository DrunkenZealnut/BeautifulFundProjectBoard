-- ===============================================
-- 인증 및 관리자 기능을 위한 마이그레이션
-- Supabase SQL Editor에서 실행하세요
-- ===============================================

-- 1. users 테이블 RLS 정책 추가 (로그인 및 관리 기능용)
DO $$
BEGIN
    -- 읽기 정책: 모든 사용자가 users 테이블 조회 가능 (로그인 확인용)
    DROP POLICY IF EXISTS "Public read access for users" ON public.users;
    CREATE POLICY "Public read access for users" ON public.users
        FOR SELECT USING (true);

    -- 쓰기 정책: 모든 사용자가 users 테이블에 INSERT 가능 (관리자 페이지용)
    DROP POLICY IF EXISTS "Public insert access for users" ON public.users;
    CREATE POLICY "Public insert access for users" ON public.users
        FOR INSERT WITH CHECK (true);

    -- 수정 정책: 모든 사용자가 users 테이블 UPDATE 가능 (관리자 페이지용)
    DROP POLICY IF EXISTS "Public update access for users" ON public.users;
    CREATE POLICY "Public update access for users" ON public.users
        FOR UPDATE USING (true) WITH CHECK (true);

    -- 삭제 정책: 물리 삭제는 차단, 소프트 삭제(is_active=false)만 사용
    -- DELETE 정책은 의도적으로 추가하지 않음
END
$$;

-- 2. 기본 관리자 계정 비밀번호 설정 (최초 로그인용)
-- 비밀번호: admin1234 (로그인 후 반드시 변경하세요!)
UPDATE public.users
SET password_hash = 'admin1234',
    updated_at = NOW()
WHERE username = 'admin'
  AND (password_hash IS NULL OR password_hash = '');

-- 3. 관리자 계정이 없는 경우를 대비한 UPSERT
INSERT INTO public.users (id, username, email, name, role, organization, position, password_hash, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin',
    'admin@younglabor.org',
    '관리자',
    'admin',
    '청년노동자인권센터',
    '사업담당자',
    'admin1234',
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = CASE
        WHEN public.users.password_hash IS NULL OR public.users.password_hash = ''
        THEN 'admin1234'
        ELSE public.users.password_hash
    END;

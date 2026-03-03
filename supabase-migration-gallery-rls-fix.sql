-- =============================================================================
-- supabase-migration-gallery-rls-fix.sql
-- galleries 테이블 RLS 및 권한 수정
-- =============================================================================
--
-- 증상: 갤러리 수정 시 오류 없이 실패 (수정이 반영되지 않음)
-- 원인: anon role에 대한 UPDATE/DELETE GRANT 누락 또는 UPDATE RLS 정책 미적용
--
-- Supabase SQL Editor에서 실행하세요.
-- =============================================================================

-- [1] anon, authenticated 역할에 galleries 테이블 전체 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galleries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galleries TO authenticated;

-- [2] galleries UPDATE RLS 정책 재생성
DROP POLICY IF EXISTS "Public update access for galleries" ON public.galleries;
CREATE POLICY "Public update access for galleries" ON public.galleries
    FOR UPDATE USING (true) WITH CHECK (true);

-- [3] galleries DELETE RLS 정책 재생성 (삭제도 같은 이슈 가능성)
DROP POLICY IF EXISTS "Public delete access for galleries" ON public.galleries;
CREATE POLICY "Public delete access for galleries" ON public.galleries
    FOR DELETE USING (true);

-- [4] galleries SELECT RLS 정책 재확인
DROP POLICY IF EXISTS "Public read access for galleries" ON public.galleries;
CREATE POLICY "Public read access for galleries" ON public.galleries
    FOR SELECT USING (true);

-- [5] galleries INSERT RLS 정책 재확인
DROP POLICY IF EXISTS "Public insert access for galleries" ON public.galleries;
CREATE POLICY "Public insert access for galleries" ON public.galleries
    FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 적용 확인 쿼리:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies WHERE tablename = 'galleries';
-- → 4개 정책(SELECT/INSERT/UPDATE/DELETE)이 모두 보여야 합니다.
-- =============================================================================

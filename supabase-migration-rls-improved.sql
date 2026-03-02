-- =============================================================================
-- supabase-migration-rls-improved.sql
-- RLS 정책 보안 개선 마이그레이션
-- =============================================================================
--
-- ⚠️  현황 및 한계
-- 이 앱은 Supabase Auth 대신 커스텀 인증(users 테이블 + SHA-256)을 사용하므로
-- RLS 정책에서 auth.uid()를 활용한 사용자별 접근 제어가 불가능합니다.
-- 아래 정책은 anon key 환경에서 가능한 범위의 최소 보호를 적용합니다.
--
-- 장기 권고: Supabase Auth로 마이그레이션 시 auth.uid()를 활용한
--           사용자별 RLS 정책을 적용하여 근본적인 보안을 확보하세요.
-- =============================================================================

-- [1] users 테이블: DELETE 정책 완전 차단
--     이유: 사용자 삭제는 소프트 삭제(is_active = false)만 허용해야 함.
--          하드 삭제 시 관련 집행내역·일정 등 참조 무결성 파괴 위험.
DROP POLICY IF EXISTS "Public delete access for users" ON public.users;
-- DELETE 정책을 재생성하지 않음 → anon key로 users 레코드 직접 삭제 불가

-- [2] budget_executions: 금액 음수 방지
--     이유: 음수 금액 집행은 예산 집계를 왜곡하고 데이터 무결성을 손상시킴.
DROP POLICY IF EXISTS "Public insert access for budget executions" ON public.budget_executions;
CREATE POLICY "Budget executions insert positive amount" ON public.budget_executions
    FOR INSERT WITH CHECK (amount > 0);

DROP POLICY IF EXISTS "Public update access for budget executions" ON public.budget_executions;
CREATE POLICY "Budget executions update positive amount" ON public.budget_executions
    FOR UPDATE USING (true) WITH CHECK (amount > 0);

-- [3] recipients 테이블: DELETE 정책 차단 (소프트 삭제 권장)
--     이유: 수급자 삭제 시 급여지급명세서 등 연관 데이터 참조 손실 위험.
DROP POLICY IF EXISTS "Public delete access for recipients" ON public.recipients;
-- DELETE 정책을 재생성하지 않음

-- [4] activity_logs: INSERT 유지, UPDATE/DELETE 차단 (로그 불변성 확보)
--     이유: 활동 로그는 쓰기 전용이어야 함. 수정·삭제 가능하면 감사 무력화.
DROP POLICY IF EXISTS "Public update access for activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Public delete access for activity_logs" ON public.activity_logs;
-- UPDATE, DELETE 정책을 재생성하지 않음 → 로그 레코드 변조 불가

-- =============================================================================
-- 실행 후 확인 쿼리 (Supabase SQL Editor에서 실행):
-- =============================================================================
--
-- 1. users DELETE 차단 확인:
--    DELETE FROM public.users WHERE username = '__test__';
--    → "new row violates row-level security policy" 오류 발생해야 함
--
-- 2. budget_executions 음수 차단 확인:
--    INSERT INTO public.budget_executions (amount, ...) VALUES (-1000, ...);
--    → "new row violates row-level security policy" 오류 발생해야 함
--
-- 3. activity_logs 수정 차단 확인:
--    UPDATE public.activity_logs SET action_type = 'tampered' WHERE id = (SELECT id FROM public.activity_logs LIMIT 1);
--    → "new row violates row-level security policy" 오류 발생해야 함
-- =============================================================================

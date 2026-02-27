-- =============================================================
-- RLS 정책 마이그레이션 (PR #3 반영)
-- Supabase SQL Editor에서 실행하세요.
-- =============================================================

-- ① schedules 테이블: UPDATE/DELETE 정책 추가
-- (이게 없으면 일정 수정/삭제가 DB에 반영되지 않음)
DROP POLICY IF EXISTS "Public update access for schedules" ON public.schedules;
CREATE POLICY "Public update access for schedules" ON public.schedules
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public delete access for schedules" ON public.schedules;
CREATE POLICY "Public delete access for schedules" ON public.schedules
    FOR DELETE USING (true);

-- ② documents 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for documents" ON public.documents;
CREATE POLICY "Public read access for documents" ON public.documents
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for documents" ON public.documents;
CREATE POLICY "Public insert access for documents" ON public.documents
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for documents" ON public.documents;
CREATE POLICY "Public update access for documents" ON public.documents
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for documents" ON public.documents;
CREATE POLICY "Public delete access for documents" ON public.documents
    FOR DELETE USING (true);

-- ③ participants 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for participants" ON public.participants;
CREATE POLICY "Public read access for participants" ON public.participants
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for participants" ON public.participants;
CREATE POLICY "Public insert access for participants" ON public.participants
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for participants" ON public.participants;
CREATE POLICY "Public update access for participants" ON public.participants
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for participants" ON public.participants;
CREATE POLICY "Public delete access for participants" ON public.participants
    FOR DELETE USING (true);

-- ④ attachments 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for attachments" ON public.attachments;
CREATE POLICY "Public read access for attachments" ON public.attachments
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for attachments" ON public.attachments;
CREATE POLICY "Public insert access for attachments" ON public.attachments
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for attachments" ON public.attachments;
CREATE POLICY "Public update access for attachments" ON public.attachments
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for attachments" ON public.attachments;
CREATE POLICY "Public delete access for attachments" ON public.attachments
    FOR DELETE USING (true);

-- ⑤ comments 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for comments" ON public.comments;
CREATE POLICY "Public read access for comments" ON public.comments
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for comments" ON public.comments;
CREATE POLICY "Public insert access for comments" ON public.comments
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for comments" ON public.comments;
CREATE POLICY "Public update access for comments" ON public.comments
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for comments" ON public.comments;
CREATE POLICY "Public delete access for comments" ON public.comments
    FOR DELETE USING (true);

-- ⑥ activity_logs 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public read access for activity_logs" ON public.activity_logs
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public insert access for activity_logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public update access for activity_logs" ON public.activity_logs
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for activity_logs" ON public.activity_logs;
CREATE POLICY "Public delete access for activity_logs" ON public.activity_logs
    FOR DELETE USING (true);

-- ⑦ system_settings 테이블: 전체 CRUD 정책 추가
DROP POLICY IF EXISTS "Public read access for system_settings" ON public.system_settings;
CREATE POLICY "Public read access for system_settings" ON public.system_settings
    FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert access for system_settings" ON public.system_settings;
CREATE POLICY "Public insert access for system_settings" ON public.system_settings
    FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update access for system_settings" ON public.system_settings;
CREATE POLICY "Public update access for system_settings" ON public.system_settings
    FOR UPDATE USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete access for system_settings" ON public.system_settings;
CREATE POLICY "Public delete access for system_settings" ON public.system_settings
    FOR DELETE USING (true);

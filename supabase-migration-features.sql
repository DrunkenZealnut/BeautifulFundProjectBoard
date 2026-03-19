-- Migration: F-02 댓글 + F-04 활동 로그 테이블
-- 실행: Supabase SQL Editor에서 실행

-- F-02: 댓글 테이블
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_type TEXT NOT NULL CHECK (parent_type IN ('board', 'gallery')),
    parent_id UUID NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id),
    author_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_parent ON comments(parent_type, parent_id);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_update" ON comments FOR UPDATE USING (true);
CREATE POLICY "comments_delete" ON comments FOR DELETE USING (true);

-- F-04: 활동 로그 테이블
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    user_name TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "logs_insert" ON activity_logs FOR INSERT WITH CHECK (true);

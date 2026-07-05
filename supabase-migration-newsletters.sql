-- ============================================================
-- 뉴스레터 저장·불러오기 마이그레이션 (bf.newsletters)
-- 실행 순서: Supabase SQL Editor에서 전체 선택 후 실행
-- 주의: bf 스키마 전환(014b8bb) 이후 — bf 스키마에 생성
-- ============================================================

-- 1. newsletters 테이블 생성
CREATE TABLE IF NOT EXISTS bf.newsletters (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   uuid REFERENCES bf.projects(id) ON DELETE SET NULL,
    title        text NOT NULL DEFAULT '',
    issue_number text DEFAULT '',
    template     text NOT NULL DEFAULT 'modern',
    config       jsonb NOT NULL DEFAULT '{}',   -- newsletterConfig 전체 + custom(색상/폰트)
    sections     jsonb NOT NULL DEFAULT '[]',   -- orderedSections 스냅샷 (items 포함)
    assets       jsonb NOT NULL DEFAULT '{}',   -- boardImageUrls, rewrittenContents, galleryThumbUrls, itemLinks, editedItems
    selection    jsonb NOT NULL DEFAULT '{}',   -- { scheduleIds:[], boardIds:[], galleryIds:[] } — Step 1 복원용
    status       text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS (기존 테이블과 동일한 공개 정책 패턴)
ALTER TABLE bf.newsletters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "newsletters_select" ON bf.newsletters;
CREATE POLICY "newsletters_select" ON bf.newsletters
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "newsletters_insert" ON bf.newsletters;
CREATE POLICY "newsletters_insert" ON bf.newsletters
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "newsletters_update" ON bf.newsletters;
CREATE POLICY "newsletters_update" ON bf.newsletters
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "newsletters_delete" ON bf.newsletters;
CREATE POLICY "newsletters_delete" ON bf.newsletters
    FOR DELETE USING (true);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_newsletters_updated ON bf.newsletters (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_newsletters_project ON bf.newsletters (project_id);

-- ============================================================
-- 거래처(이체대상) → 예산항목 자동배정 규칙 (F-15)
-- 실행 순서: Supabase SQL Editor에서 전체 선택 후 실행
-- 주의: bf 스키마 전환(014b8bb) 이후 — bf 스키마에 생성
-- 개인정보 없음: 이름(정규화)·사업자번호만 저장
-- 요구: PostgreSQL 15+ (UNIQUE NULLS NOT DISTINCT). 버전 확인: SELECT version();
-- ============================================================

-- 1. payee_budget_rules 테이블 생성
CREATE TABLE IF NOT EXISTS bf.payee_budget_rules (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      uuid REFERENCES bf.projects(id) ON DELETE CASCADE,
    match_type      text NOT NULL CHECK (match_type IN ('biz_no', 'exact', 'contains')),
    pattern         text NOT NULL,              -- biz_no: 숫자 10자리 / exact·contains: normalizePayee() 결과
    display_name    text NOT NULL DEFAULT '',   -- 화면 표시용 원래 표기 (예: "(주)한빛인쇄")
    subcategory_id  text NOT NULL,
    budget_item_id  text NOT NULL,
    payment_method  text CHECK (payment_method IN ('카드', '계좌이체')),  -- NULL = 증빙에서 온 값 유지
    notes           text DEFAULT '',
    is_active       boolean NOT NULL DEFAULT true,
    hit_count       integer NOT NULL DEFAULT 0,
    last_used_at    timestamptz,
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payee_rules_pattern_len CHECK (char_length(pattern) >= 2),
    -- project_id NULL(하드코딩 예산 환경)끼리도 중복 금지 → NULLS NOT DISTINCT (PostgreSQL 15+)
    CONSTRAINT payee_rules_uniq UNIQUE NULLS NOT DISTINCT (project_id, match_type, pattern)
);

-- 2. RLS (기존 테이블과 동일한 공개 정책 패턴)
ALTER TABLE bf.payee_budget_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payee_budget_rules_select" ON bf.payee_budget_rules;
CREATE POLICY "payee_budget_rules_select" ON bf.payee_budget_rules
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "payee_budget_rules_insert" ON bf.payee_budget_rules;
CREATE POLICY "payee_budget_rules_insert" ON bf.payee_budget_rules
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "payee_budget_rules_update" ON bf.payee_budget_rules;
CREATE POLICY "payee_budget_rules_update" ON bf.payee_budget_rules
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "payee_budget_rules_delete" ON bf.payee_budget_rules;
CREATE POLICY "payee_budget_rules_delete" ON bf.payee_budget_rules
    FOR DELETE USING (true);

-- 3. 인덱스
CREATE INDEX IF NOT EXISTS idx_payee_rules_project ON bf.payee_budget_rules (project_id);

-- 4. 권한 (bf 스키마 기본 권한이 없는 환경 대비 — 이미 있으면 무해)
GRANT SELECT, INSERT, UPDATE, DELETE ON bf.payee_budget_rules TO anon, authenticated;

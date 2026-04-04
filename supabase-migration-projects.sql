-- Migration: projects table for multi-project support
-- Run in Supabase SQL Editor

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    organization VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    period VARCHAR(50),
    total_budget INTEGER NOT NULL,
    budget_data JSONB NOT NULL,
    config JSONB DEFAULT '{}',
    modules JSONB DEFAULT '["dashboard","budget","schedule","board","gallery","newsletter","guide"]',
    module_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE USING (true);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_projects_active ON public.projects (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_projects_year ON public.projects (year DESC);

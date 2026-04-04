-- Migration: Add project_id to budget_executions
-- Run in Supabase SQL Editor AFTER supabase-migration-projects.sql

-- 1. Add project_id column (nullable for backward compatibility)
ALTER TABLE public.budget_executions
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- 2. Index for project-scoped queries
CREATE INDEX IF NOT EXISTS idx_executions_project ON public.budget_executions (project_id);

-- 3. Backfill: assign existing executions to the active project (if any)
UPDATE public.budget_executions
SET project_id = (SELECT id FROM public.projects WHERE is_active = true LIMIT 1)
WHERE project_id IS NULL
  AND EXISTS (SELECT 1 FROM public.projects WHERE is_active = true);

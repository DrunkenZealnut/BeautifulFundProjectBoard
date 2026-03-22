-- Migration: schools + school_textbooks tables
-- Run in Supabase SQL Editor after supabase-schema-safe.sql

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- NEIS API auto-fill fields
    name TEXT NOT NULL,
    short_name TEXT,
    address TEXT,
    phone TEXT,
    fax TEXT,
    website TEXT,
    education_office TEXT,
    neis_code TEXT,
    neis_office_code TEXT,
    foundation_type TEXT,
    coeducation TEXT,
    founded_date TEXT,
    -- Manual input fields
    principal TEXT,
    contact_teacher TEXT,
    contact_teacher_phone TEXT,
    contact_teacher_email TEXT,
    departments TEXT[] DEFAULT '{}',
    student_count INTEGER DEFAULT 0,
    student_count_by_grade JSONB DEFAULT '{}',
    notice_url TEXT,
    memo TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    partnership_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- School textbooks table
CREATE TABLE IF NOT EXISTS public.school_textbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    textbook_name TEXT NOT NULL,
    subject TEXT,
    publisher TEXT,
    year INTEGER,
    is_safety_related BOOLEAN DEFAULT false,
    our_textbook BOOLEAN DEFAULT false,
    distribution_status TEXT DEFAULT 'planned' CHECK (distribution_status IN ('planned', 'distributed', 'in_use')),
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_neis_code ON public.schools(neis_code);
CREATE INDEX IF NOT EXISTS idx_textbooks_school_id ON public.school_textbooks(school_id);

-- RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_textbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schools_select" ON public.schools FOR SELECT USING (true);
CREATE POLICY "schools_insert" ON public.schools FOR INSERT WITH CHECK (true);
CREATE POLICY "schools_update" ON public.schools FOR UPDATE USING (true);
CREATE POLICY "schools_delete" ON public.schools FOR DELETE USING (true);

CREATE POLICY "textbooks_select" ON public.school_textbooks FOR SELECT USING (true);
CREATE POLICY "textbooks_insert" ON public.school_textbooks FOR INSERT WITH CHECK (true);
CREATE POLICY "textbooks_update" ON public.school_textbooks FOR UPDATE USING (true);
CREATE POLICY "textbooks_delete" ON public.school_textbooks FOR DELETE USING (true);

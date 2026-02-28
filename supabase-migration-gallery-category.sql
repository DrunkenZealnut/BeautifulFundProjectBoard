-- 갤러리 카테고리에 '영수증' 추가 마이그레이션
-- Supabase SQL Editor에서 실행하세요.

-- 기존 CHECK 제약조건 삭제 후 새로 생성
ALTER TABLE public.galleries DROP CONSTRAINT IF EXISTS galleries_category_check;
ALTER TABLE public.galleries ADD CONSTRAINT galleries_category_check
    CHECK (category IN ('현장사진', '결과물', '교육자료', '캠페인', '행사', '영수증', '기타'));

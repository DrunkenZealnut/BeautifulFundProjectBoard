# Create SQL Migration

새 Supabase 마이그레이션 파일을 생성합니다.

## 인자

$ARGUMENTS = 마이그레이션 설명 (예: "add-notification-table", "update-rls-policy")

## 절차

1. 기존 마이그레이션 파일 목록 확인: `supabase-migration-*.sql`
2. 파일명 생성: `supabase-migration-{$ARGUMENTS}.sql`
3. 마이그레이션 SQL 작성
4. 기존 스키마(`supabase-schema-safe.sql`)와 충돌 없는지 확인

## SQL 작성 규칙

- UUID primary key 사용 (`gen_random_uuid()`)
- `created_at TIMESTAMPTZ DEFAULT NOW()` 포함
- RLS 정책 포함 (테이블 생성 시 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- IF NOT EXISTS / IF EXISTS 사용으로 안전한 실행 보장
- 주석으로 마이그레이션 목적 기술

## 템플릿

```sql
-- Migration: {description}
-- Date: {today}
-- Run this in Supabase SQL Editor

BEGIN;

-- Your migration here

COMMIT;
```

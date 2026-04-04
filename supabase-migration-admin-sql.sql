-- Migration: exec_sql function for admin operations
-- Run in Supabase SQL Editor
-- WARNING: This function executes arbitrary SQL. Only callable with service_role key.

CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query || ') t'
    INTO result;
    RETURN result;
EXCEPTION WHEN OTHERS THEN
    -- For DDL statements (CREATE, ALTER, DROP) that don't return rows
    BEGIN
        EXECUTE query;
        RETURN '{"success": true}'::json;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
    END;
END;
$$;

-- Revoke public access, only service_role can call this
REVOKE ALL ON FUNCTION exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION exec_sql(text) FROM authenticated;

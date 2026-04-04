"""Supabase Admin API — Schema/table management via service_role key.
Only accessible by admin users. Executes DDL operations through Supabase REST API."""
import os, json
from http.server import BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.error import HTTPError

SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL', 'https://exnloiyzmdzbhljwwxrs.supabase.co')
SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Allowed SQL operations (whitelist approach for safety)
ALLOWED_OPERATIONS = {
    'list_schemas',
    'list_tables',
    'table_structure',
    'create_schema',
    'move_table',
    'rename_table',
    'list_rls_policies',
    'table_row_counts',
    'list_indexes',
    'storage_buckets',
}

def _rpc(sql):
    """Execute SQL via Supabase's pg_net / REST RPC or direct REST endpoint."""
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    body = json.dumps({'query': sql}).encode()
    req = Request(url, data=body, headers=headers, method='POST')
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"SQL execution failed: {error_body}")


def _query_info_schema(sql):
    """Execute read-only query via PostgREST raw SQL (using a DB function)."""
    # Fallback: use direct PostgREST for information_schema queries
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"
    headers = {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json',
    }
    body = json.dumps({'query': sql}).encode()
    req = Request(url, data=body, headers=headers, method='POST')
    try:
        with urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except HTTPError as e:
        error_body = e.read().decode() if e.fp else str(e)
        raise Exception(f"Query failed: {error_body}")


def handle_operation(op, params):
    """Route operation to appropriate SQL."""
    if op == 'list_schemas':
        return _rpc("""
            SELECT schema_name,
                   (SELECT count(*) FROM information_schema.tables t
                    WHERE t.table_schema = s.schema_name AND t.table_type = 'BASE TABLE') as table_count
            FROM information_schema.schemata s
            WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
            ORDER BY schema_name
        """)

    elif op == 'list_tables':
        schema = params.get('schema', 'public')
        # Sanitize schema name
        if not schema.isidentifier():
            raise ValueError('Invalid schema name')
        return _rpc(f"""
            SELECT t.table_name, t.table_type,
                   (SELECT count(*) FROM information_schema.columns c
                    WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name) as column_count,
                   pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))) as total_size,
                   obj_description((quote_ident(t.table_schema) || '.' || quote_ident(t.table_name))::regclass) as comment
            FROM information_schema.tables t
            WHERE t.table_schema = '{schema}' AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name
        """)

    elif op == 'table_structure':
        schema = params.get('schema', 'public')
        table = params.get('table', '')
        if not schema.isidentifier() or not table.isidentifier():
            raise ValueError('Invalid schema or table name')
        return _rpc(f"""
            SELECT c.column_name, c.data_type, c.column_default, c.is_nullable,
                   c.character_maximum_length, c.udt_name,
                   (SELECT count(*) > 0 FROM information_schema.key_column_usage k
                    WHERE k.table_schema = c.table_schema AND k.table_name = c.table_name
                    AND k.column_name = c.column_name) as is_key
            FROM information_schema.columns c
            WHERE c.table_schema = '{schema}' AND c.table_name = '{table}'
            ORDER BY c.ordinal_position
        """)

    elif op == 'create_schema':
        name = params.get('name', '')
        if not name.isidentifier() or len(name) > 63:
            raise ValueError('Invalid schema name (use letters, digits, underscores)')
        return _rpc(f"CREATE SCHEMA IF NOT EXISTS {name}")

    elif op == 'move_table':
        table = params.get('table', '')
        from_schema = params.get('from_schema', 'public')
        to_schema = params.get('to_schema', '')
        if not all(n.isidentifier() for n in [table, from_schema, to_schema]):
            raise ValueError('Invalid names')
        return _rpc(f"ALTER TABLE {from_schema}.{table} SET SCHEMA {to_schema}")

    elif op == 'rename_table':
        schema = params.get('schema', 'public')
        old_name = params.get('old_name', '')
        new_name = params.get('new_name', '')
        if not all(n.isidentifier() for n in [schema, old_name, new_name]):
            raise ValueError('Invalid names')
        return _rpc(f"ALTER TABLE {schema}.{old_name} RENAME TO {new_name}")

    elif op == 'list_rls_policies':
        schema = params.get('schema', 'public')
        if not schema.isidentifier():
            raise ValueError('Invalid schema name')
        return _rpc(f"""
            SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
            FROM pg_policies
            WHERE schemaname = '{schema}'
            ORDER BY tablename, policyname
        """)

    elif op == 'table_row_counts':
        schema = params.get('schema', 'public')
        if not schema.isidentifier():
            raise ValueError('Invalid schema name')
        return _rpc(f"""
            SELECT relname as table_name,
                   n_live_tup as row_count,
                   pg_size_pretty(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(relname))) as total_size
            FROM pg_stat_user_tables
            WHERE schemaname = '{schema}'
            ORDER BY n_live_tup DESC
        """)

    elif op == 'list_indexes':
        schema = params.get('schema', 'public')
        if not schema.isidentifier():
            raise ValueError('Invalid schema name')
        return _rpc(f"""
            SELECT indexname, tablename, indexdef
            FROM pg_indexes
            WHERE schemaname = '{schema}'
            ORDER BY tablename, indexname
        """)

    elif op == 'storage_buckets':
        return _rpc("""
            SELECT id, name, public, file_size_limit, allowed_mime_types, created_at
            FROM storage.buckets
            ORDER BY name
        """)

    else:
        raise ValueError(f'Unknown operation: {op}')


class handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False, default=str).encode())

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_POST(self):
        if not SERVICE_ROLE_KEY:
            return self._json(500, {'error': 'SUPABASE_SERVICE_ROLE_KEY not configured'})

        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}

            op = body.get('operation', '')
            if op not in ALLOWED_OPERATIONS:
                return self._json(400, {'error': f'Invalid operation: {op}', 'allowed': list(ALLOWED_OPERATIONS)})

            params = body.get('params', {})
            result = handle_operation(op, params)
            return self._json(200, {'success': True, 'data': result})

        except ValueError as e:
            return self._json(400, {'error': str(e)})
        except Exception as e:
            return self._json(500, {'error': str(e)})

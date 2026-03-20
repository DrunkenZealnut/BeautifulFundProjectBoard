"""
Vercel Serverless Function: AI Newsletter Rewriter
POST /api/rewrite — Rewrite board post text in newsletter tone using Claude API

Request: { "text": "원본 게시글 텍스트" }
Response: { "rewritten": "재가공된 뉴스레터 텍스트" }
"""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

SYSTEM_PROMPT = """당신은 공익단체 뉴스레터 편집자입니다.
주어진 게시글 본문을 다음 규칙에 따라 뉴스레터에 적합하게 재작성하세요:
- 2,30대가 읽기 편한 친근하고 따뜻한 톤
- 핵심 정보는 유지하되, 딱딱한 업무용 표현을 부드럽게 변환
- 200자 이내로 간결하게 요약
- 이모지 1-2개 자연스럽게 포함
- 마크다운 없이 순수 텍스트로 작성
- 줄바꿈은 최소화"""


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(content_length))
            text = body.get('text', '').strip()

            if not text:
                self._json(400, {'error': '텍스트가 비어있습니다.'})
                return

            if not ANTHROPIC_API_KEY:
                self._json(500, {'error': 'ANTHROPIC_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인하세요.'})
                return

            # Call Claude API
            req_data = json.dumps({
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 500,
                'system': SYSTEM_PROMPT,
                'messages': [{'role': 'user', 'content': f'다음 게시글을 뉴스레터용으로 재작성해주세요:\n\n{text[:2000]}'}]
            }).encode('utf-8')

            req = urllib.request.Request(
                'https://api.anthropic.com/v1/messages',
                data=req_data,
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                }
            )

            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read())
                rewritten = result['content'][0]['text']
                self._json(200, {'rewritten': rewritten})

        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='replace')
            self._json(e.code, {'error': f'Claude API error: {error_body[:200]}'})
        except Exception as e:
            self._json(500, {'error': str(e)})

    def _json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

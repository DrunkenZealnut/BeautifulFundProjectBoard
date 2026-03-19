"""
Vercel Serverless Function: HWPX Generator
POST /api/hwpx — Generate .hwpx file from JSON data

Request body:
{
    "title": "문서 제목",
    "template": "base",  // base|gonmun|report|minutes|proposal
    "sections": [
        { "type": "paragraph", "text": "본문 텍스트" },
        { "type": "table", "headers": ["A", "B"], "rows": [["1", "2"]] }
    ]
}

Response: .hwpx binary file (application/octet-stream)
"""

import json
import sys
import tempfile
from http.server import BaseHTTPRequestHandler
from pathlib import Path

# Add hwpxskill scripts to path
SCRIPTS_DIR = Path(__file__).parent / 'hwpxskill_scripts'
sys.path.insert(0, str(SCRIPTS_DIR))

# Template directory
TEMPLATES_DIR = Path(__file__).parent / 'hwpxskill_templates'

# Override template dir for build_hwpx
import os
os.environ['HWPXSKILL_TEMPLATES'] = str(TEMPLATES_DIR)


def escape_xml(s):
    return (str(s or '')
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;'))


def build_section_xml(sections):
    """Convert sections array to OWPML section0.xml content."""
    NS = ('xmlns:ha="http://www.hancom.co.kr/hwpml/2011/app" '
          'xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" '
          'xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section" '
          'xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" '
          'xmlns:hh="http://www.hancom.co.kr/hwpml/2011/head"')

    sec_pr = ('<hp:secPr id="" textDirection="HORIZONTAL" spaceColumns="1134" '
              'tabStop="8000" tabStopVal="4000" tabStopUnit="HWPUNIT" '
              'outlineShapeIDRef="1" memoShapeIDRef="0" textVerticalWidthHead="0" masterPageCnt="0">'
              '<hp:grid lineGrid="0" charGrid="0" wonggojiFormat="0"/>'
              '<hp:startNum pageStartsOn="BOTH" page="0" pic="0" tbl="0" equation="0"/>'
              '<hp:visibility hideFirstHeader="0" hideFirstFooter="0" hideFirstMasterPage="0" '
              'border="SHOW_ALL" fill="SHOW_ALL" hideFirstPageNum="0" hideFirstEmptyLine="0" showLineNumber="0"/>'
              '<hp:lineNumberShape restartType="0" countBy="0" distance="0" startNumber="0"/>'
              '<hp:pagePr landscape="WIDELY" width="59528" height="84186" gutterType="LEFT_ONLY">'
              '<hp:margin header="4252" footer="4252" gutter="0" left="8504" right="8504" top="5668" bottom="4252"/>'
              '</hp:pagePr>'
              '<hp:footNotePr>'
              '<hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>'
              '<hp:noteLine length="-1" type="SOLID" width="0.12 mm" color="#000000"/>'
              '<hp:noteSpacing betweenNotes="283" belowLine="567" aboveLine="850"/>'
              '<hp:numbering type="CONTINUOUS" newNum="1"/>'
              '<hp:placement place="EACH_COLUMN" beneathText="0"/>'
              '</hp:footNotePr>'
              '<hp:endNotePr>'
              '<hp:autoNumFormat type="DIGIT" userChar="" prefixChar="" suffixChar=")" supscript="0"/>'
              '<hp:noteLine length="14692344" type="SOLID" width="0.12 mm" color="#000000"/>'
              '<hp:noteSpacing betweenNotes="0" belowLine="567" aboveLine="850"/>'
              '<hp:numbering type="CONTINUOUS" newNum="1"/>'
              '<hp:placement place="END_OF_DOCUMENT" beneathText="0"/>'
              '</hp:endNotePr>'
              '<hp:pageBorderFill type="BOTH" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">'
              '<hp:offset left="1417" right="1417" top="1417" bottom="1417"/>'
              '</hp:pageBorderFill>'
              '<hp:pageBorderFill type="EVEN" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">'
              '<hp:offset left="1417" right="1417" top="1417" bottom="1417"/>'
              '</hp:pageBorderFill>'
              '<hp:pageBorderFill type="ODD" borderFillIDRef="1" textBorder="PAPER" headerInside="0" footerInside="0" fillArea="PAPER">'
              '<hp:offset left="1417" right="1417" top="1417" bottom="1417"/>'
              '</hp:pageBorderFill>'
              '</hp:secPr>')

    p_id = 1000000000
    body = ''

    # First paragraph with secPr
    first_text = ''
    if sections and sections[0].get('type') == 'paragraph':
        first_text = escape_xml(sections[0].get('text', ''))

    body += (f'<hp:p id="{p_id}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">'
             f'<hp:run charPrIDRef="0">{sec_pr}'
             '<hp:ctrl><hp:colPr id="" type="NEWSPAPER" layout="LEFT" colCount="1" sameSz="1" sameGap="0"/></hp:ctrl>'
             f'</hp:run><hp:run charPrIDRef="0"><hp:t>{first_text}</hp:t></hp:run>'
             '<hp:linesegarray><hp:lineseg textpos="0" vertpos="0" vertsize="1000" textheight="1000" '
             'baseline="850" spacing="600" horzpos="0" horzsize="42520" flags="393216"/></hp:linesegarray>'
             '</hp:p>')
    p_id += 1

    # Remaining sections
    start = 1 if sections and sections[0].get('type') == 'paragraph' else 0
    for sec in sections[start:]:
        if sec.get('type') == 'paragraph':
            text = escape_xml(sec.get('text', ''))
            body += (f'<hp:p id="{p_id}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">'
                     f'<hp:run charPrIDRef="0"><hp:t>{text}</hp:t></hp:run></hp:p>')
            p_id += 1
        elif sec.get('type') == 'table':
            headers = sec.get('headers', [])
            rows = sec.get('rows', [])
            # Render as tab-separated text for compatibility
            body += (f'<hp:p id="{p_id}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">'
                     f'<hp:run charPrIDRef="0"><hp:t>{escape_xml(chr(9).join(headers))}</hp:t></hp:run></hp:p>')
            p_id += 1
            for row in rows:
                body += (f'<hp:p id="{p_id}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">'
                         f'<hp:run charPrIDRef="0"><hp:t>{escape_xml(chr(9).join(row))}</hp:t></hp:run></hp:p>')
                p_id += 1

    return f"<?xml version='1.0' encoding='UTF-8'?><hs:sec {NS}>{body}</hs:sec>"


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)

            title = data.get('title', '문서')
            template = data.get('template', 'base')
            sections = data.get('sections', [])

            if template not in ('base', 'gonmun', 'report', 'minutes', 'proposal'):
                template = 'base'

            # Build section0.xml
            section_xml = build_section_xml(sections)

            # Write section to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
                f.write(section_xml)
                section_path = Path(f.name)

            output_path = Path(tempfile.mktemp(suffix='.hwpx'))

            try:
                from build_hwpx import build
                build(
                    template=template if template != 'base' else None,
                    header_override=None,
                    section_override=section_path,
                    title=title,
                    creator='BeautifulFund System',
                    output=output_path
                )

                hwpx_bytes = output_path.read_bytes()

                # Use URL-encoded filename for non-ASCII characters
                import urllib.parse
                safe_filename = urllib.parse.quote(f'{title}.hwpx')
                self.send_response(200)
                self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Disposition', f"attachment; filename*=UTF-8''{safe_filename}")
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(hwpx_bytes)

            finally:
                section_path.unlink(missing_ok=True)
                output_path.unlink(missing_ok=True)

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

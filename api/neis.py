"""NEIS School Search API Proxy — keeps API key server-side."""
import os, json
from urllib.request import urlopen, Request
from urllib.parse import quote
from http.server import BaseHTTPRequestHandler

NEIS_KEY = os.environ.get("NEIS_API_KEY", "aab253d940424f76a2de2bb786524694")

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        school_name = qs.get("q", [""])[0].strip()

        if not school_name or len(school_name) < 2:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "q parameter required (min 2 chars)"}).encode())
            return

        url = f"https://open.neis.go.kr/hub/schoolInfo?KEY={NEIS_KEY}&Type=json&pIndex=1&pSize=10&SCHUL_NM={quote(school_name)}"
        try:
            req = Request(url, headers={"User-Agent": "BeautifulFundBoard/1.0"})
            with urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())

            results = []
            if "schoolInfo" in data:
                for r in data["schoolInfo"][1]["row"]:
                    results.append({
                        "name": r.get("SCHUL_NM", ""),
                        "address": (r.get("ORG_RDNMA", "") + " " + r.get("ORG_RDNDA", "")).strip(),
                        "phone": r.get("ORG_TELNO", ""),
                        "fax": r.get("ORG_FAXNO", ""),
                        "website": r.get("HMPG_ADRES", ""),
                        "education_office": r.get("ATPT_OFCDC_SC_NM", ""),
                        "neis_code": r.get("SD_SCHUL_CODE", ""),
                        "neis_office_code": r.get("ATPT_OFCDC_SC_CODE", ""),
                        "foundation_type": r.get("FOND_SC_NM", ""),
                        "coeducation": r.get("COEDU_SC_NM", ""),
                        "founded_date": r.get("FOND_YMD", ""),
                    })

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(results, ensure_ascii=False).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

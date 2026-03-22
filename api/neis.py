"""NEIS Open API Proxy — school search + timetable. Keeps API key server-side."""
import os, json
from urllib.request import urlopen, Request
from urllib.parse import quote, urlparse, parse_qs
from http.server import BaseHTTPRequestHandler

NEIS_KEY = os.environ.get("NEIS_API_KEY", "aab253d940424f76a2de2bb786524694")
NEIS_BASE = "https://open.neis.go.kr/hub"

def _fetch_neis(endpoint, params):
    """Fetch from NEIS API and return parsed JSON."""
    qs = "&".join(f"{k}={quote(str(v))}" for k, v in params.items() if v)
    url = f"{NEIS_BASE}/{endpoint}?KEY={NEIS_KEY}&Type=json&{qs}"
    req = Request(url, headers={"User-Agent": "BeautifulFundBoard/1.0"})
    with urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        qs = parse_qs(urlparse(self.path).query)
        action = qs.get("action", ["search"])[0]

        try:
            if action == "timetable":
                self._handle_timetable(qs)
            else:
                self._handle_search(qs)
        except Exception as e:
            self._json_response(500, {"error": str(e)})

    def _handle_search(self, qs):
        school_name = qs.get("q", [""])[0].strip()
        if not school_name or len(school_name) < 2:
            self._json_response(400, {"error": "q parameter required (min 2 chars)"})
            return

        data = _fetch_neis("schoolInfo", {"pIndex": 1, "pSize": 10, "SCHUL_NM": school_name})
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
        self._json_response(200, results)

    def _handle_timetable(self, qs):
        office = qs.get("office", [""])[0]
        school = qs.get("school", [""])[0]
        from_ymd = qs.get("from", [""])[0]
        to_ymd = qs.get("to", [""])[0]

        if not office or not school or not from_ymd or not to_ymd:
            self._json_response(400, {"error": "office, school, from, to required"})
            return

        params = {
            "pIndex": 1, "pSize": 1000,
            "ATPT_OFCDC_SC_CODE": office,
            "SD_SCHUL_CODE": school,
            "TI_FROM_YMD": from_ymd,
            "TI_TO_YMD": to_ymd,
        }
        # Optional filters
        grade = qs.get("grade", [""])[0]
        class_nm = qs.get("class", [""])[0]
        if grade: params["GRADE"] = grade
        if class_nm: params["CLASS_NM"] = class_nm

        data = _fetch_neis("hisTimetable", params)
        results = []
        if "hisTimetable" in data:
            for r in data["hisTimetable"][1]["row"]:
                results.append({
                    "date": r.get("ALL_TI_YMD", ""),
                    "grade": r.get("GRADE", ""),
                    "class": r.get("CLASS_NM", ""),
                    "period": r.get("PERIO", ""),
                    "subject": r.get("ITRT_CNTNT", ""),
                    "department": r.get("DDDEP_NM", ""),
                })
        self._json_response(200, results)

    def _json_response(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

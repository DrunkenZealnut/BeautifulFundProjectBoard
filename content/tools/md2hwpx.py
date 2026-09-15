#!/usr/bin/env python3
"""
md2hwpx.py — 마크다운 부분집합 → HWPX section0.xml → hwpx 스킬 build_hwpx.py 로 빌드

  content/.venv/bin/python3 content/tools/md2hwpx.py draft.md --template proposal --output final/x.hwpx

지원 문법 (줄 단위):
  # 제목                 문서 제목 (가운데, 큰 글씨)
  ## 절 제목             대항목 (proposal: 녹색 번호바 Ⅰ,Ⅱ… / report: 섹션 헤더선 / 그 외: 볼드)
  ### 소절 제목          소항목 (proposal: 파란 배지 1,2… / 그 외: 볼드)
  - 항목  /  * 항목      ○ 불릿      (두 칸 들여쓰기 "  - " 는 - 하위 불릿)
  | a | b |              표 (첫 행 헤더, |---| 구분행 무시). 열 너비 균등
  **굵게**               인라인 볼드는 무시하고 텍스트만 (한 줄 전체가 **…**면 볼드 문단)
  <!-- … -->             주석 제거 (facts 주석 포함)
  빈 줄                  빈 문단
  그 외                  본문 문단

템플릿별 스타일 ID는 ~/.claude/skills/hwpx/SKILL.md "템플릿별 스타일 ID 맵" 기준.
"""
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path
from xml.sax.saxutils import escape

SKILL_DIR = Path.home() / ".claude" / "skills" / "hwpx"
BODY_W = 42520  # A4 본문폭 HWPUNIT

# 템플릿별 스타일: (charPr, paraPr) 및 표/헤더 옵션
STYLES = {
    "proposal": {"title": (7, 20), "h2": "bar", "h3": "badge", "bold": (9, 0), "th": (9, 21), "td": (0, 22), "th_bf": 4, "td_bf": 3},
    "report":   {"title": (7, 20), "h2": (13, 27), "h3": (8, 0), "bold": (9, 0), "th": (9, 21), "td": (0, 22), "th_bf": 4, "td_bf": 3},
    "gonmun":   {"title": (7, 20), "h2": (10, 0), "h3": (10, 0), "bold": (10, 0), "th": (10, 21), "td": (0, 22), "th_bf": 4, "td_bf": 3},
    "minutes":  {"title": (7, 20), "h2": (8, 0), "h3": (9, 0), "bold": (9, 0), "th": (9, 21), "td": (0, 22), "th_bf": 4, "td_bf": 3},
    "base":     {"title": (0, 0), "h2": (0, 0), "h3": (0, 0), "bold": (0, 0), "th": (0, 0), "td": (0, 0), "th_bf": 3, "td_bf": 3},
}
ROMAN = ["Ⅰ", "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅵ", "Ⅶ", "Ⅷ", "Ⅸ", "Ⅹ", "Ⅺ", "Ⅻ"]


def roman(n: int) -> str:
    return ROMAN[n - 1] if n <= len(ROMAN) else str(n)


class Gen:
    def __init__(self, template: str):
        self.st = STYLES[template]
        self.template = template
        self.pid = 1000000001
        self.tid = 1000000900
        self.parts: list[str] = []
        self.h2 = 0
        self.h3 = 0

    def _id(self) -> int:
        self.pid += 1
        return self.pid

    def para(self, text: str, char: int = 0, parapr: int = 0, page_break: int = 0):
        t = f"<hp:t>{escape(text)}</hp:t>" if text else "<hp:t/>"
        self.parts.append(
            f'  <hp:p id="{self._id()}" paraPrIDRef="{parapr}" styleIDRef="0" pageBreak="{page_break}" columnBreak="0" merged="0">\n'
            f'    <hp:run charPrIDRef="{char}">{t}</hp:run>\n  </hp:p>')

    def _cell(self, text: str, col: int, row: int, width: int, height: int, char: int, parapr: int, bf: int, span=(1, 1)) -> str:
        return (
            f'          <hp:tc name="" header="0" hasMargin="0" protect="0" editable="0" dirty="1" borderFillIDRef="{bf}">\n'
            f'            <hp:subList id="" textDirection="HORIZONTAL" lineWrap="BREAK" vertAlign="CENTER" linkListIDRef="0" linkListNextIDRef="0" textWidth="0" textHeight="0" hasTextRef="0" hasNumRef="0">\n'
            f'              <hp:p paraPrIDRef="{parapr}" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0" id="{self._id()}">\n'
            f'                <hp:run charPrIDRef="{char}"><hp:t>{escape(text)}</hp:t></hp:run>\n'
            f'              </hp:p>\n            </hp:subList>\n'
            f'            <hp:cellAddr colAddr="{col}" rowAddr="{row}"/>\n'
            f'            <hp:cellSpan colSpan="{span[0]}" rowSpan="{span[1]}"/>\n'
            f'            <hp:cellSz width="{width}" height="{height}"/>\n'
            f'            <hp:cellMargin left="141" right="141" top="141" bottom="141"/>\n          </hp:tc>')

    def table(self, rows: list[list[tuple[str, int, int, int]]], widths: list[int], heights: list[int], outer_bf: int = 3):
        """rows: [[(text,char,parapr,bf), …], …]"""
        self.tid += 1
        total_h = sum(heights)
        trs = []
        for r, row in enumerate(rows):
            tcs = "\n".join(self._cell(t, c, r, widths[c], heights[r], ch, pp, bf) for c, (t, ch, pp, bf) in enumerate(row))
            trs.append(f"        <hp:tr>\n{tcs}\n        </hp:tr>")
        self.parts.append(
            f'  <hp:p id="{self._id()}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">\n'
            f'    <hp:run charPrIDRef="0">\n'
            f'      <hp:tbl id="{self.tid}" zOrder="0" numberingType="TABLE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" pageBreak="CELL" repeatHeader="0" rowCnt="{len(rows)}" colCnt="{len(widths)}" cellSpacing="0" borderFillIDRef="{outer_bf}" noAdjust="0">\n'
            f'        <hp:sz width="{BODY_W}" widthRelTo="ABSOLUTE" height="{total_h}" heightRelTo="ABSOLUTE" protect="0"/>\n'
            f'        <hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>\n'
            f'        <hp:outMargin left="0" right="0" top="0" bottom="0"/>\n'
            f'        <hp:inMargin left="0" right="0" top="0" bottom="0"/>\n' + "\n".join(trs) +
            f'\n      </hp:tbl>\n    </hp:run>\n  </hp:p>')

    # -- headers
    def h2_bar(self, text: str):
        self.h2 += 1
        self.h3 = 0
        if self.st["h2"] == "bar":
            self.table([[(roman(self.h2), 10, 21, 5), ("  " + text, 8, 22, 6)]], [3200, BODY_W - 3200], [2800])
        else:
            ch, pp = self.st["h2"]
            self.para(text, ch, pp)

    def h3_badge(self, text: str):
        self.h3 += 1
        if self.st["h3"] == "badge":
            self.table([[(str(self.h3), 11, 21, 7), ("  " + text, 8, 22, 8)]], [2200, BODY_W - 2200], [2400])
        else:
            ch, pp = self.st["h3"]
            self.para(text, ch, pp)

    def md_table(self, lines: list[str]):
        rows = [[c.strip() for c in ln.strip().strip("|").split("|")] for ln in lines if not re.match(r"^\s*\|?\s*:?-{2,}", ln)]
        if not rows:
            return
        ncol = max(len(r) for r in rows)
        rows = [r + [""] * (ncol - len(r)) for r in rows]
        base = BODY_W // ncol
        widths = [base] * (ncol - 1) + [BODY_W - base * (ncol - 1)]
        th_c, th_p = self.st["th"]
        td_c, td_p = self.st["td"]
        out = []
        heights = []
        for i, r in enumerate(rows):
            if i == 0:
                out.append([(c, th_c, th_p, self.st["th_bf"]) for c in r]); heights.append(2400)
            else:
                longest = max(len(c) for c in r)
                lines_est = max(1, -(-longest * ncol // 44))  # 대략 44자/행폭 기준
                out.append([(c, td_c, td_p, self.st["td_bf"]) for c in r]); heights.append(1200 + 1200 * lines_est)
        self.table(out, widths, heights)

    def render(self, sec_pr_block: str) -> str:
        return ('<?xml version=\'1.0\' encoding=\'UTF-8\'?>\n'
                '<hs:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph" xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">\n'
                + sec_pr_block + "\n" + "\n".join(self.parts) + "\n</hs:sec>\n")


def _strip_inline(s: str) -> str:
    s = re.sub(r"<!--.*?-->", "", s)
    s = re.sub(r"\*\*(.+?)\*\*", r"\1", s)
    s = re.sub(r"`(.+?)`", r"\1", s)
    return s.strip()


def convert(md_text: str, template: str) -> str:
    g = Gen(template)
    # 원본 템플릿의 secPr 첫 문단을 그대로 사용
    tpl_sec = SKILL_DIR / "templates" / (f"{template}/section0.xml" if template != "base" else "base/Contents/section0.xml")
    src = tpl_sec.read_text(encoding="utf-8")
    m = re.search(r"(  <hp:p id=\"1000000001\".*?</hp:p>)", src, re.S)
    sec_block = m.group(1)
    # frontmatter 제거
    md_text = re.sub(r"^---\n.*?\n---\n", "", md_text, flags=re.S)
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        raw = lines[i]
        line = _strip_inline(raw)
        if raw.startswith("<!--"):
            while i < len(lines) and "-->" not in lines[i]:
                i += 1
            i += 1; continue
        if not line:
            g.para(""); i += 1; continue
        if line.startswith("|"):
            block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                block.append(_strip_inline(lines[i])); i += 1
            g.md_table(block); g.para(""); continue
        if line.startswith("# "):
            g.para(line[2:], *g.st["title"]); g.para("")
        elif line.startswith("## "):
            g.h2_bar(re.sub(r"^\d+\.\s*", "", line[3:])); g.para("")
        elif line.startswith("### "):
            g.h3_badge(re.sub(r"^\d+(\.\d+)*\.?\s*", "", line[4:]))
        elif raw.startswith(("  - ", "  * ", "\t- ")):
            g.para("    - " + line[2:].strip())
        elif line.startswith(("- ", "* ")):
            g.para("  ○ " + line[2:])
        elif re.fullmatch(r"\*\*.+\*\*", raw.strip()):
            g.para(line, *g.st["bold"])
        else:
            g.para(line)
        i += 1
    return g.render(sec_block)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("md")
    ap.add_argument("--template", default="proposal", choices=list(STYLES))
    ap.add_argument("--output", required=True)
    ap.add_argument("--title", default="")
    ap.add_argument("--section-out", help="생성된 section0.xml을 이 경로에도 저장")
    a = ap.parse_args()
    xml = convert(Path(a.md).read_text(encoding="utf-8"), a.template)
    sec = Path(a.section_out) if a.section_out else Path(a.output).with_suffix(".section0.xml")
    sec.write_text(xml, encoding="utf-8")
    py = sys.executable
    # build_hwpx.py --template 선택지에 proposal이 없으므로 header.xml을 직접 지정
    cmd = [py, str(SKILL_DIR / "scripts" / "build_hwpx.py"), "--section", str(sec), "--output", a.output]
    hdr = SKILL_DIR / "templates" / a.template / "header.xml"
    if hdr.exists():
        cmd += ["--header", str(hdr)]
    if a.title:
        cmd += ["--title", a.title]
    r = subprocess.run(cmd, capture_output=True, text=True)
    print(r.stdout.strip())
    if r.returncode:
        print(r.stderr, file=sys.stderr); return r.returncode
    v = subprocess.run([py, str(SKILL_DIR / "scripts" / "validate.py"), a.output], capture_output=True, text=True)
    print(v.stdout.strip() or v.stderr.strip())
    if not a.section_out:
        sec.unlink(missing_ok=True)
    return v.returncode


if __name__ == "__main__":
    sys.exit(main())

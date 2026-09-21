#!/usr/bin/env python3
"""
promo.py — 홍보콘텐츠 생성시스템 단일 CLI

  render      HTML → PNG / PDF(+preview)  (Playwright Chromium, 오프라인)
  fill        슬롯 YAML + 템플릿 HTML → HTML  (미니 머스타시, 슬롯 길이 경고)
  check       산출물 검사 (PII · deprecated · credit_line · 금액 · 날짜 · 단체명 · 빈 슬롯)
  index       out/*/brief.md → out/INDEX.md
  kb-extract  원본 문서 보조 변환 (pdf 텍스트 / HTML 표 → md 표 / PII 스캔)
  selftest    check 민감도 픽스처 검증 (+ --render 재현성)
  hwpx-image  HWPX 끝에 이미지 문단 추가 (지원문구 배너 등)

실행: content/.venv/bin/python3 content/tools/promo.py <cmd> …
설계: docs/archive/2026-09/홍보콘텐츠-생성시스템/홍보콘텐츠-생성시스템.design.md §7
"""
from __future__ import annotations

import argparse
import html as _html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # content/
REPO = ROOT.parent
KB = ROOT / "kb"
FACTS = KB / "facts.yaml"
TEMPLATES_VISUAL = ROOT / "templates" / "visual"
OUT = ROOT / "out"

# ---------------------------------------------------------------- helpers

def _yaml():
    import yaml  # lazy: kb-extract pdf 등은 yaml 없이도 동작
    return yaml


def load_facts(path: Path = FACTS) -> dict:
    return _yaml().safe_load(path.read_text(encoding="utf-8")) or {}


def read_frontmatter(md: Path) -> tuple[dict, str]:
    text = md.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
    if not m:
        return {}, text
    try:
        return (_yaml().safe_load(m.group(1)) or {}), m.group(2)
    except Exception as e:  # noqa: BLE001
        raise SystemExit(f"FAIL {md}: frontmatter YAML 오류 — 대괄호·#·콜론이 든 값은 따옴표로 감싸세요\n  {str(e).splitlines()[0]}")


def write_frontmatter(md: Path, fm: dict, body: str) -> None:
    dumped = _yaml().safe_dump(fm, allow_unicode=True, sort_keys=False).rstrip()
    md.write_text(f"---\n{dumped}\n---\n{body}", encoding="utf-8")


def walk_values(obj):
    """facts.yaml 안의 모든 스칼라 값을 순회"""
    if isinstance(obj, dict):
        for v in obj.values():
            yield from walk_values(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk_values(v)
    else:
        yield obj


def eprint(*a):
    print(*a, file=sys.stderr)


# ---------------------------------------------------------------- fill

_TAG_RE = re.compile(r"{{({)?\s*([#^/]?)\s*([\w.]+)\s*}?}}")


def _lookup(ctx_stack: list, key: str):
    if key == ".":
        return ctx_stack[-1].get(".") if isinstance(ctx_stack[-1], dict) else ctx_stack[-1]
    for ctx in reversed(ctx_stack):
        cur = ctx
        ok = True
        for part in key.split("."):
            if isinstance(cur, dict) and part in cur:
                cur = cur[part]
            else:
                ok = False
                break
        if ok:
            return cur
    return None


def _truthy(v) -> bool:
    return not (v is None or v is False or v == "" or v == [] or v == {})


def _parse(tpl: str) -> list:
    """미니 머스타시 파서 → 노드 트리. str | ('var', key, raw) | ['sec', kind, key, children]"""
    root: list = []
    stack = [root]
    pos = 0
    for m in _TAG_RE.finditer(tpl):
        if m.start() > pos:
            stack[-1].append(tpl[pos:m.start()])
        pos = m.end()
        raw, kind, key = m.group(1), m.group(2), m.group(3)
        if kind in ("#", "^"):
            node = ["sec", kind, key, []]
            stack[-1].append(node)
            stack.append(node[3])
        elif kind == "/":
            if len(stack) > 1:
                stack.pop()
        else:
            stack[-1].append(("var", key, bool(raw)))
    if pos < len(tpl):
        stack[-1].append(tpl[pos:])
    return root


def _render(nodes: list, stack: list) -> str:
    out = []
    for n in nodes:
        if isinstance(n, str):
            out.append(n)
        elif n[0] == "var":
            v = _lookup(stack, n[1])
            s = "" if v is None else str(v)
            out.append(s if n[2] else _html.escape(s, quote=False))
        else:
            _, kind, key, children = n
            v = _lookup(stack, key)
            if kind == "^":
                if not _truthy(v):
                    out.append(_render(children, stack))
            elif _truthy(v):
                if isinstance(v, list):
                    for item in v:
                        out.append(_render(children, stack + [item if isinstance(item, dict) else {".": item}]))
                elif isinstance(v, dict):
                    out.append(_render(children, stack + [v]))
                else:
                    out.append(_render(children, stack))
    return "".join(out)


def mustache(tpl: str, ctx_stack: list) -> str:
    return _render(_parse(tpl), ctx_stack)


def _slot_limits(tpl_html: str) -> dict:
    m = re.search(r'<meta\s+name="promo-slots"\s+content=\'(.*?)\'', tpl_html, re.S)
    if not m:
        return {}
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError as e:
        eprint(f"WARN promo-slots 메타 파싱 실패: {e}")
        return {}


def _check_lengths(slots: dict, limits: dict, prefix: str = "") -> list[str]:
    warns = []
    for key, lim in limits.items():
        val = slots.get(key)
        if isinstance(lim, dict):
            if isinstance(val, list):
                if "max" in lim and len(val) > lim["max"]:
                    warns.append(f"slot={prefix}{key} items={len(val)} max={lim['max']}")
                for i, item in enumerate(val):
                    if isinstance(item, dict):
                        warns += _check_lengths(item, {k: v for k, v in lim.items() if k != "max"}, f"{key}[{i}].")
            elif isinstance(val, dict):
                warns += _check_lengths(val, {k: v for k, v in lim.items() if k != "max"}, f"{key}.")
        elif isinstance(lim, int) and isinstance(val, str) and len(val) > lim:
            warns.append(f"slot={prefix}{key} len={len(val)} max={lim} :: {val[:30]}…")
    return warns


def cmd_fill(args) -> int:
    rc = 0
    for yml in args.files:
        yml = Path(yml)
        data = _yaml().safe_load(yml.read_text(encoding="utf-8")) or {}
        tpl_name = data.get("template")
        if not tpl_name:
            eprint(f"FAIL {yml}: 'template' 키 없음"); rc = 1; continue
        tpl_path = Path(args.templates) / f"{tpl_name}.html"
        if not tpl_path.exists():
            eprint(f"FAIL {yml}: 템플릿 없음 {tpl_path}"); rc = 1; continue
        tpl = tpl_path.read_text(encoding="utf-8")
        slots = dict(data.get("slots") or {})
        raw = dict(data.get("raw") or {})
        # 로고/이미지 슬롯: 경로가 실제 파일이면 절대 file:// 로, 아니면 빈 값(폴백 블록 활성)
        for k, v in list(slots.items()):
            if isinstance(v, str) and (k.startswith("logo_") or k.startswith("photo")):
                p = (yml.parent / v).resolve() if not Path(v).is_absolute() else Path(v)
                slots[k] = p.as_uri() if p.exists() else ""
                if not p.exists() and v:
                    eprint(f"WARN {yml.name}: {k} 파일 없음 → 폴백 ({v})")
        ctx = {**slots, **{k: v for k, v in raw.items()}, "variant": data.get("variant", ""), "page": data.get("page", 1)}
        html_out = mustache(tpl, [ctx])
        # raw 슬롯은 이스케이프 없이 (템플릿에서 {{{key}}} 사용 권장, 안전장치로 재치환)
        for k, v in raw.items():
            html_out = html_out.replace(_html.escape(str(v), quote=False), str(v))
        # brand 상대경로 → 절대 file://
        brand = (ROOT / "brand").resolve().as_uri()
        html_out = re.sub(r'(href|src)="(?:\.\./)+brand/', lambda m: f'{m.group(1)}="{brand}/', html_out)
        warns = _check_lengths(slots, _slot_limits(tpl))
        for w in warns:
            eprint(f"WARN {yml.name}: {w}")
        if warns and args.strict:
            rc = 1
        out_path = yml.with_suffix(".html")
        out_path.write_text(html_out, encoding="utf-8")
        print(f"fill  {yml.name} → {out_path.name}" + (f"  ({len(warns)} warn)" if warns else ""))
    return rc


# ---------------------------------------------------------------- render

def _meta(html_text: str, name: str) -> str | None:
    m = re.search(rf'<meta\s+name="{name}"\s+content="([^"]*)"', html_text)
    return m.group(1) if m else None


def cmd_render(args) -> int:
    from playwright.sync_api import sync_playwright

    out_dir = Path(args.out) if args.out else None
    failures: list[tuple[str, str]] = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        for f in args.files:
            f = Path(f).resolve()
            text = f.read_text(encoding="utf-8")
            size = _meta(text, "promo-size") or "1080x1080"
            w, h = (int(x) for x in size.lower().split("x"))
            print_fmt = _meta(text, "promo-print")
            dest_dir = out_dir or f.parent
            dest_dir.mkdir(parents=True, exist_ok=True)
            ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=args.scale)
            page = ctx.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            try:
                page.goto(f.as_uri(), wait_until="load", timeout=args.timeout)
                page.evaluate("document.fonts.ready")
                page.wait_for_function('document.fonts.status === "loaded"', timeout=args.timeout)
                page.wait_for_function(
                    "Array.from(document.images).every(i => i.complete)", timeout=args.timeout)
                if not page.evaluate('document.fonts.check("16px Pretendard")'):
                    eprint(f"WARN {f.name}: Pretendard 미로드 → 시스템 폰트 폴백")
                if print_fmt:
                    pdf_path = dest_dir / f"{f.stem}.pdf"
                    page.emulate_media(media="print")
                    page.pdf(path=str(pdf_path), format=print_fmt, print_background=True,
                             prefer_css_page_size=True)
                    page.emulate_media(media="screen")
                    prev = dest_dir / f"{f.stem}-preview.png"
                    if not args.pdf_only:
                        page.screenshot(path=str(prev), clip={"x": 0, "y": 0, "width": w, "height": h})
                    print(f"render {f.name} → {pdf_path.name}" + ("" if args.pdf_only else f", {prev.name}"))
                else:
                    png = dest_dir / f"{f.stem}.png"
                    page.screenshot(path=str(png), clip={"x": 0, "y": 0, "width": w, "height": h})
                    print(f"render {f.name} → {png.name} ({w}x{h} @{args.scale}x)")
                if errors:
                    eprint(f"WARN {f.name}: page errors: {errors[:3]}")
            except Exception as e:  # noqa: BLE001 — 파일별로 계속 진행
                failures.append((f.name, str(e).splitlines()[0][:160]))
            finally:
                ctx.close()
        browser.close()
    if failures:
        eprint("\n| 파일 | 사유 |\n|---|---|")
        for name, why in failures:
            eprint(f"| {name} | {why} |")
        return 1
    return 0


# ---------------------------------------------------------------- check

PII_PATTERNS = {
    "휴대전화": re.compile(r"01[016789]-?\d{3,4}-?\d{4}"),
    "이메일": re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+"),
    "주민번호": re.compile(r"\b\d{6}-[1-4]\d{6}\b"),
    "직인": re.compile(r"_bin_\d{3}\.png|직인\.(?:png|jpe?g)|\(단체직인\)"),
}
ORG_MISSPELL = re.compile(r"청년노동자\s+인권센터|청년노동인권센터|청년 노동자인권센터|청년노동자인권쎈터")
AMOUNT_RE = re.compile(r"\d{1,3}(?:,\d{3})+\s*원")
DATE_RE = re.compile(r"(20\d{2})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})")
# 연도 없는 월.일 (10.14, 11/4). 앞뒤가 숫자·점이 아닐 때만 — 소수·버전·금액과 구분
SHORT_DATE_RE = re.compile(r"(?<![\d.])(1[0-2]|0?[1-9])[./](3[01]|[12]\d|0?[1-9])(?![\d.]|\s*%)")

_TEXT_EXTS = {".md", ".yaml", ".yml", ".html", ".txt"}


def _extract_hwpx_text(path: Path) -> str:
    import zipfile
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("Contents/section0.xml").decode("utf-8", "ignore")
        return _html.unescape(" ".join(re.findall(r"<hp:t(?:\s[^>/]*)?>(.*?)</hp:t>", xml, re.S)))
    except Exception as e:  # noqa: BLE001
        eprint(f"WARN {path.name}: hwpx 텍스트 추출 실패 ({e})")
        return ""


def _extract_docx_text(path: Path) -> str:
    import zipfile
    try:
        with zipfile.ZipFile(path) as z:
            xml = z.read("word/document.xml").decode("utf-8", "ignore")
        return _html.unescape(" ".join(re.findall(r"<w:t(?:\s[^>/]*)?>(.*?)</w:t>", xml, re.S)))
    except Exception as e:  # noqa: BLE001
        eprint(f"WARN {path.name}: docx 텍스트 추출 실패 ({e})")
        return ""


def _strip_html(s: str) -> str:
    s = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", s, flags=re.S)
    return _html.unescape(re.sub(r"<[^>]+>", " ", s))


def _collect_texts(out_dir: Path) -> dict[str, str]:
    texts = {}
    for p in sorted(out_dir.rglob("*")):
        if not p.is_file() or p.name == "check-report.md":
            continue
        if p.suffix in _TEXT_EXTS:
            t = p.read_text(encoding="utf-8", errors="ignore")
            texts[str(p.relative_to(out_dir))] = _strip_html(t) if p.suffix == ".html" else t
        elif p.suffix == ".hwpx":
            texts[str(p.relative_to(out_dir))] = _extract_hwpx_text(p)
        elif p.suffix == ".docx":
            texts[str(p.relative_to(out_dir))] = _extract_docx_text(p)
    return texts


def _facts_amounts(facts: dict) -> set[str]:
    return {f"{v:,}" for v in walk_values(facts) if isinstance(v, int) and not isinstance(v, bool) and v >= 1000}


def _facts_dates(facts: dict) -> set[tuple[int, int, int]]:
    out = set()
    for v in walk_values(facts):
        if isinstance(v, date):
            out.add((v.year, v.month, v.day))
        elif isinstance(v, str):
            for m in DATE_RE.finditer(v):
                out.add(tuple(int(x) for x in m.groups()))
    return out


def _line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def cmd_check(args) -> int:
    out_dir = Path(args.out_dir).resolve()
    facts = load_facts(Path(args.facts))
    brief_fm, _ = read_frontmatter(out_dir / "brief.md") if (out_dir / "brief.md").exists() else ({}, "")
    audience = str(brief_fm.get("audience", ""))
    internal = audience == "internal"
    must_include = brief_fm.get("must_include") or []
    credit = (facts.get("program") or {}).get("credit_line", "")
    deprecated = (facts.get("deprecated") or [])
    forbidden = (facts.get("forbidden") or [])
    amounts = _facts_amounts(facts)
    fdates = _facts_dates(facts)
    fmonthdays = {(mth, dy) for (_, mth, dy) in fdates}

    findings: list[tuple[str, str, str, int, str]] = []  # level, rule, file, line, excerpt
    texts = _collect_texts(out_dir)

    for rel, text in texts.items():
        is_final = rel.startswith("final/") or rel.startswith("visual/")
        is_yaml = rel.endswith((".yaml", ".yml"))
        # R1 PII — brief.contact_in_final: true 이면 이 산출물의 전화·이메일은 사용자가 의도적으로 기입한 것 → WARN (그 외 PII는 여전히 FAIL)
        contact_ok = bool(brief_fm.get("contact_in_final"))
        for label, rx in PII_PATTERNS.items():
            for m in rx.finditer(text):
                lvl = "WARN" if (contact_ok and label in ("휴대전화", "이메일")) else "FAIL"
                findings.append((lvl, f"R1 PII({label})", rel, _line_of(text, m.start()), m.group(0)))
        # R2 deprecated (internal 제외) / forbidden (항상)
        for rule, items, active in (("R2 deprecated", deprecated, not internal), ("R2 forbidden", forbidden, True)):
            if not active:
                continue
            for d in items:
                t = d.get("text", "")
                for m in re.finditer(re.escape(t), text):
                    ctx = text[max(0, m.start() - 40): m.end() + 40]
                    if rule == "R2 deprecated" and ("변경 전" in ctx or "changed_from" in ctx or "07-변경이력" in ctx):
                        continue
                    findings.append(("FAIL", rule, rel, _line_of(text, m.start()), t))
        # R6 단체명 오표기
        for m in ORG_MISSPELL.finditer(text):
            findings.append(("FAIL", "R6 단체명", rel, _line_of(text, m.start()), m.group(0)))
        # R4 금액 / R5 날짜 — brief.md(메타)는 제외
        if rel == "brief.md":
            continue
        for m in AMOUNT_RE.finditer(text):
            num = m.group(0).replace("원", "").strip()
            if num not in amounts:
                findings.append(("WARN", "R4 금액", rel, _line_of(text, m.start()), m.group(0)))
        # R5 날짜 — 연도 포함(YYYY.MM.DD)은 전체 일치, 연도 없음(M.D)은 facts 월·일 집합과 대조
        for m in DATE_RE.finditer(text):
            tup = tuple(int(x) for x in m.groups())
            if tup not in fdates:
                findings.append(("WARN", "R5 날짜", rel, _line_of(text, m.start()), m.group(0)))
        for m in SHORT_DATE_RE.finditer(text):
            line_start = text.rfind("\n", 0, m.start()) + 1
            if text[line_start:m.start()].lstrip().startswith("#"):   # 마크다운 제목 번호(4.1 등) 제외
                continue
            md_ = (int(m.group(1)), int(m.group(2)))
            if md_ not in fmonthdays:
                findings.append(("WARN", "R5 날짜(M.D)", rel, _line_of(text, m.start()), m.group(0)))
        # R7 빈 슬롯
        if is_yaml and rel.startswith("visual/"):
            data = _yaml().safe_load(text) or {}
            for k, v in (data.get("slots") or {}).items():
                if v in ("", None) and not k.startswith(("logo_", "photo", "qr")):
                    findings.append(("WARN", "R7 빈 슬롯", rel, 0, k))
    # R3 credit_line — final/visual 텍스트 산출물 **각 파일**에 credit_line 또는 credit_sentences 중 하나 포함
    #   (카드뉴스 다장은 페이지마다 검사. 다장 중 한 장에만 넣으려면 brief.must_include에서 credit_line을 빼고 사유를 적는다)
    if credit and ("credit_line" in must_include or (not internal and brief_fm)):
        accepted = [credit] + [v for v in ((facts.get("program") or {}).get("credit_sentences") or {}).values() if v]
        for rel, text in texts.items():
            if not rel.startswith(("final/", "visual/")) or rel.endswith((".yaml", ".yml")) or rel.endswith("-preview.png"):
                continue
            if not any(a in text for a in accepted):
                findings.append(("FAIL", "R3 credit_line", rel, 0, "credit_line/credit_sentences 없음"))

    fails = [f for f in findings if f[0] == "FAIL"]
    warns = [f for f in findings if f[0] == "WARN"]
    lines = [f"# check-report — {out_dir.name}", "",
             f"- 기준 facts: `{facts.get('meta', {}).get('as_of', '?')}`  · 검사일: {date.today().isoformat()}",
             f"- 결과: **{'FAIL' if fails else 'PASS'}** (FAIL {len(fails)} · WARN {len(warns)})", "",
             "| 수준 | 규칙 | 파일 | 줄 | 발췌 |", "|---|---|---|---|---|"]
    for lvl, rule, rel, ln, ex in findings:
        lines.append(f"| {lvl} | {rule} | {rel} | {ln or '-'} | {ex.replace('|', '¦')[:60]} |")
    if not findings:
        lines.append("| - | - | - | - | 발견 없음 |")
    (out_dir / "check-report.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\n".join(lines[2:4]))
    for lvl, rule, rel, ln, ex in findings:
        print(f"  {lvl:4} {rule:16} {rel}:{ln}  {ex[:50]}")
    return 1 if fails or (args.strict and warns) else 0


# ---------------------------------------------------------------- index

def cmd_index(args) -> int:
    out = Path(args.out_dir)
    rows = []
    for d in sorted((p for p in out.iterdir() if p.is_dir()), reverse=True):
        b = d / "brief.md"
        if not b.exists():
            continue
        fm, _ = read_frontmatter(b)
        chk = "—"
        rep = d / "check-report.md"
        if rep.exists():
            t = rep.read_text(encoding="utf-8")
            chk = "✅" if "**PASS**" in t else "❌"
        tpls = fm.get("templates") or []
        rows.append(f"| {fm.get('id', d.name)} | {fm.get('type', '')} | {fm.get('unit', '')} | {fm.get('audience', '')} | "
                    f"{', '.join(tpls) if isinstance(tpls, list) else tpls} | {fm.get('status', '')} | {fm.get('deadline', '')} | {chk} |")
    text = ("# 산출물 대장 (자동 생성 — `promo.py index`)\n\n"
            f"갱신: {date.today().isoformat()} · 항목 {len(rows)}\n\n"
            "| id | type | unit | audience | templates | status | deadline | check |\n"
            "|----|------|------|----------|-----------|--------|----------|-------|\n" + "\n".join(rows) + "\n")
    (out / "INDEX.md").write_text(text, encoding="utf-8")
    print(f"index  {len(rows)} 항목 → {out / 'INDEX.md'}")
    return 0


# ---------------------------------------------------------------- kb-extract

def _html_table_to_grid(tbl: str) -> list[list[str]]:
    """rowspan/colspan을 펼쳐 직사각형 그리드로. 병합 셀 값은 반복 채움."""
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", tbl, re.S)
    grid: list[list[str | None]] = []
    pending: dict[tuple[int, int], str] = {}  # (row, col) -> value from rowspan
    for r, row in enumerate(rows):
        cells = re.findall(r"<t[dh]([^>]*)>(.*?)</t[dh]>", row, re.S)
        line: list[str | None] = []
        c = 0
        ci = 0
        while ci < len(cells) or (r, c) in pending:
            if (r, c) in pending:
                line.append(pending.pop((r, c))); c += 1; continue
            attrs, val = cells[ci]; ci += 1
            val = _html.unescape(re.sub(r"<br\s*/?>", " ", val))
            val = re.sub(r"<[^>]+>", "", val).strip()
            val = re.sub(r"\s+", " ", val)
            rs = int((re.search(r'rowspan="(\d+)"', attrs) or [0, 1])[1])
            cs = int((re.search(r'colspan="(\d+)"', attrs) or [0, 1])[1])
            for k in range(cs):
                line.append(val)
                for rr in range(1, rs):
                    pending[(r + rr, c + k)] = val
                c += 1
        grid.append(line)
    width = max(len(l) for l in grid) if grid else 0
    return [[(x or "") for x in l] + [""] * (width - len(l)) for l in grid]


def _grid_to_md(grid: list[list[str]]) -> str:
    if not grid:
        return ""
    esc = lambda s: s.replace("|", "¦")
    head = "| " + " | ".join(esc(x) for x in grid[0]) + " |"
    sep = "|" + "---|" * len(grid[0])
    body = "\n".join("| " + " | ".join(esc(x) for x in row) + " |" for row in grid[1:])
    return f"{head}\n{sep}\n{body}\n"


def cmd_kb_extract(args) -> int:
    if args.pii_scan:
        hits = 0
        for p in sorted(Path(args.pii_scan).rglob("*")):
            if p.is_file() and p.suffix in _TEXT_EXTS and "_raw" not in p.parts:
                t = p.read_text(encoding="utf-8", errors="ignore")
                for label, rx in PII_PATTERNS.items():
                    for m in rx.finditer(t):
                        hits += 1
                        print(f"PII {label:5} {p.relative_to(Path(args.pii_scan))}:{_line_of(t, m.start())}  {m.group(0)}")
        print(f"pii-scan  {hits} 건")
        return 1 if hits else 0
    if args.mode == "tables":
        src = Path(args.src).read_text(encoding="utf-8")
        tables = re.findall(r"<table>.*?</table>", src, re.S)
        parts = [f"<!-- source: {args.src} · tables: {len(tables)} -->\n"]
        for i, t in enumerate(tables, 1):
            parts.append(f"\n## 표 {i}\n\n" + _grid_to_md(_html_table_to_grid(t)))
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text("\n".join(parts), encoding="utf-8")
        print(f"kb-extract tables  {len(tables)}개 → {args.out}")
        return 0
    if args.mode == "pdf":
        import pdfplumber
        pages = None
        if args.pages:
            a, _, b = args.pages.partition("-")
            pages = range(int(a), int(b or a) + 1)
        parts = [f"<!-- source: {args.src} -->\n"]
        with pdfplumber.open(args.src) as pdf:
            total = len(pdf.pages)
            for n in (pages or range(1, total + 1)):
                if n > total:
                    break
                txt = pdf.pages[n - 1].extract_text() or ""
                parts.append(f"\n<!-- page: {n} -->\n{txt}\n")
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text("".join(parts), encoding="utf-8")
        print(f"kb-extract pdf  {total}쪽 중 {len(parts) - 1}쪽 → {args.out}")
        return 0
    eprint("kb-extract: mode(pdf|tables) 또는 --pii-scan 필요")
    return 2


# ---------------------------------------------------------------- hwpx-image

def cmd_hwpx_image(args) -> int:
    """HWPX 마지막에 이미지를 글자처럼 취급되는 그림 문단으로 추가. 원본은 <name>.bak.hwpx 로 보존."""
    import shutil
    import zipfile
    from PIL import Image

    hwpx = Path(args.hwpx).resolve()
    img = Path(args.image).resolve()
    if not hwpx.exists() or not img.exists():
        eprint("FAIL 파일 없음"); return 2
    px_w, px_h = Image.open(img).size
    ext = img.suffix.lower().lstrip(".")
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg", "gif": "image/gif", "bmp": "image/bmp"}.get(ext, f"image/{ext}")
    width = args.width                       # HWPUNIT (기본 본문폭 42520)
    height = round(width * px_h / px_w)
    dim_w, dim_h = px_w * 75, px_h * 75      # 1px@96dpi = 75 HWPUNIT

    bak = hwpx.with_suffix(".bak.hwpx")
    if not args.no_backup:
        shutil.copy2(hwpx, bak)
    # 원본 항목을 모두 메모리에 읽은 뒤 닫는다 — 같은 경로에 쓰기 위해 (--no-backup 시 자기 자신을 덮어씀)
    with zipfile.ZipFile(hwpx) as zsrc:
        names = zsrc.namelist()
        blobs = {n: zsrc.read(n) for n in names}

    class _Mem:
        def read(self, n): return blobs[n]
        def close(self): pass
    zin = _Mem()
    existing = [n for n in names if n.startswith("BinData/")]
    idx = 1
    while f"image{idx}" in "".join(existing) or any(f"image{idx}." in n for n in existing):
        idx += 1
    item_id = f"image{idx}"
    bin_name = f"BinData/{item_id}.{ext}"
    hpf = zin.read("Contents/content.hpf").decode("utf-8")
    sec = zin.read("Contents/section0.xml").decode("utf-8")
    hpf = hpf.replace("</opf:manifest>", f'  <opf:item id="{item_id}" href="{bin_name}" media-type="{mime}" isEmbeded="1"/>\n  </opf:manifest>')
    ids = [int(x) for x in re.findall(r'<hp:p id="(\d+)"', sec)]
    pid = max(ids + [1000000000]) + 1
    pic = f'''  <hp:p id="{pid}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="0"><hp:t/></hp:run>
  </hp:p>
  <hp:p id="{pid + 1}" paraPrIDRef="0" styleIDRef="0" pageBreak="0" columnBreak="0" merged="0">
    <hp:run charPrIDRef="0">
      <hp:pic id="{pid + 2}" zOrder="0" numberingType="PICTURE" textWrap="TOP_AND_BOTTOM" textFlow="BOTH_SIDES" lock="0" dropcapstyle="None" href="" groupLevel="0" instid="{pid + 2}" reverse="0">
        <hp:sz width="{width}" widthRelTo="ABSOLUTE" height="{height}" heightRelTo="ABSOLUTE" protect="0"/>
        <hp:pos treatAsChar="1" affectLSpacing="0" flowWithText="1" allowOverlap="0" holdAnchorAndSO="0" vertRelTo="PARA" horzRelTo="COLUMN" vertAlign="TOP" horzAlign="LEFT" vertOffset="0" horzOffset="0"/>
        <hp:outMargin left="0" right="0" top="0" bottom="0"/>
        <hp:offset x="0" y="0"/>
        <hp:orgSz width="{width}" height="{height}"/>
        <hp:curSz width="{width}" height="{height}"/>
        <hp:flip horizontal="0" vertical="0"/>
        <hp:rotationInfo angle="0" centerX="{width // 2}" centerY="{height // 2}" rotateimage="1"/>
        <hp:renderingInfo><hc:transMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:scaMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/><hc:rotMatrix e1="1" e2="0" e3="0" e4="0" e5="1" e6="0"/></hp:renderingInfo>
        <hp:lineShape color="none" width="0" style="NONE" endCap="FLAT" headStyle="NORMAL" tailStyle="NORMAL" headfill="0" tailfill="0" headSz="SMALL_SMALL" tailSz="SMALL_SMALL" outlineStyle="NORMAL" alpha="0"/>
        <hp:imgRect><hc:pt0 x="0" y="0"/><hc:pt1 x="{width}" y="0"/><hc:pt2 x="{width}" y="{height}"/><hc:pt3 x="0" y="{height}"/></hp:imgRect>
        <hp:imgClip left="0" right="{dim_w}" top="0" bottom="{dim_h}"/>
        <hp:inMargin left="0" right="0" top="0" bottom="0"/>
        <hp:imgDim dimwidth="{dim_w}" dimheight="{dim_h}"/>
        <hc:img binaryItemIDRef="{item_id}" bright="0" contrast="0" effect="REAL_PIC" alpha="0"/>
      </hp:pic>
    </hp:run>
  </hp:p>
</hs:sec>'''
    if "xmlns:hc=" not in sec[:1500]:
        sec = sec.replace("<hs:sec ", '<hs:sec xmlns:hc="http://www.hancom.co.kr/hwpml/2011/core" ', 1)
    sec = sec.rstrip()
    if not sec.endswith("</hs:sec>"):
        eprint("FAIL section0.xml 끝이 </hs:sec> 가 아님"); return 1
    sec = sec[: -len("</hs:sec>")] + pic + "\n"
    with zipfile.ZipFile(hwpx, "w") as zout:
        zout.writestr(zipfile.ZipInfo("mimetype"), zin.read("mimetype"), compress_type=zipfile.ZIP_STORED)
        for n in names:
            if n == "mimetype":
                continue
            data = zin.read(n)
            if n == "Contents/content.hpf":
                data = hpf.encode("utf-8")
            elif n == "Contents/section0.xml":
                data = sec.encode("utf-8")
            zout.writestr(n, data, compress_type=zipfile.ZIP_DEFLATED)
        zout.write(str(img), bin_name, compress_type=zipfile.ZIP_DEFLATED)
    zin.close()
    print(f"hwpx-image  {img.name} → {hwpx.name} ({bin_name}, {width}x{height} HWPUNIT)" + ("" if args.no_backup else f"  backup: {bak.name}"))
    return 0


# ---------------------------------------------------------------- selftest

FIXTURE = TEMPLATES_VISUAL / "_samples" / "_check-fixture"
EXPECTED_RULES = {"R1 PII(휴대전화)", "R1 PII(이메일)", "R2 deprecated", "R2 forbidden", "R3 credit_line",
                  "R4 금액", "R5 날짜", "R5 날짜(M.D)", "R6 단체명", "R7 빈 슬롯"}


def cmd_selftest(args) -> int:
    """check 민감도 (픽스처의 위반이 전부 검출되는지) + 선택적으로 렌더 재현성 (같은 HTML 2회 → 바이트 동일)"""
    import filecmp
    import shutil
    import tempfile

    ok = True
    with tempfile.TemporaryDirectory() as td:
        work = Path(td) / "fixture"
        shutil.copytree(FIXTURE, work)
        ns = argparse.Namespace(out_dir=str(work), facts=str(FACTS), strict=False)
        import contextlib, io
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            cmd_check(ns)
        report = (work / "check-report.md").read_text(encoding="utf-8")
        found = {row.split("|")[2].strip() for row in report.splitlines() if row.startswith("| FAIL") or row.startswith("| WARN")}
        missing = EXPECTED_RULES - found
        # with-sentence.html 은 credit_sentences 로 통과해야 함 → R3 가 no-credit.html 에만 떠야 한다
        r3_files = {row.split("|")[3].strip() for row in report.splitlines() if "R3 credit_line" in row}
        if r3_files != {"final/no-credit.html"}:
            ok = False
            print(f"FAIL R3 대상 파일 불일치: {sorted(r3_files)} (기대: final/no-credit.html 만)")
        if missing:
            ok = False
            print(f"FAIL 미검출 규칙: {sorted(missing)}")
        else:
            print(f"check 민감도  {len(EXPECTED_RULES)}개 규칙 전부 검출 ✓")
    if args.render:
        from playwright.sync_api import sync_playwright  # noqa: F401 — 설치 확인
        sample = TEMPLATES_VISUAL / "_samples" / "card-square-01.yaml"
        with tempfile.TemporaryDirectory() as td:
            a, b = Path(td) / "a", Path(td) / "b"
            a.mkdir(); b.mkdir()
            cmd_fill(argparse.Namespace(files=[str(sample)], templates=str(TEMPLATES_VISUAL), strict=False))
            html = sample.with_suffix(".html")
            for d in (a, b):
                cmd_render(argparse.Namespace(files=[str(html)], out=str(d), scale=2, pdf_only=False, timeout=15000))
            same = filecmp.cmp(a / "card-square-01.png", b / "card-square-01.png", shallow=False)
            print(f"렌더 재현성  {'동일 ✓' if same else '불일치 ✗'}")
            ok = ok and same
    print("selftest", "PASS" if ok else "FAIL")
    return 0 if ok else 1


# ---------------------------------------------------------------- main

def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="promo.py", description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("render", help="HTML → PNG/PDF")
    r.add_argument("files", nargs="+")
    r.add_argument("--out")
    r.add_argument("--scale", type=float, default=2)
    r.add_argument("--pdf-only", action="store_true")
    r.add_argument("--timeout", type=int, default=15000)
    r.set_defaults(fn=cmd_render)

    f = sub.add_parser("fill", help="슬롯 YAML → HTML")
    f.add_argument("files", nargs="+")
    f.add_argument("--templates", default=str(TEMPLATES_VISUAL))
    f.add_argument("--strict", action="store_true")
    f.set_defaults(fn=cmd_fill)

    c = sub.add_parser("check", help="산출물 검사")
    c.add_argument("out_dir")
    c.add_argument("--facts", default=str(FACTS))
    c.add_argument("--strict", action="store_true")
    c.set_defaults(fn=cmd_check)

    i = sub.add_parser("index", help="out/INDEX.md 재생성")
    i.add_argument("out_dir", nargs="?", default=str(OUT))
    i.set_defaults(fn=cmd_index)

    k = sub.add_parser("kb-extract", help="원본 보조 변환")
    k.add_argument("mode", nargs="?", choices=["pdf", "tables"])
    k.add_argument("src", nargs="?")
    k.add_argument("--out")
    k.add_argument("--pages")
    k.add_argument("--pii-scan", metavar="DIR")
    k.set_defaults(fn=cmd_kb_extract)

    h = sub.add_parser("hwpx-image", help="HWPX 끝에 이미지 문단 추가 (본문폭 맞춤)")
    h.add_argument("hwpx")
    h.add_argument("image")
    h.add_argument("--width", type=int, default=42520, help="HWPUNIT (A4 본문폭 42520)")
    h.add_argument("--no-backup", action="store_true")
    h.set_defaults(fn=cmd_hwpx_image)

    t = sub.add_parser("selftest", help="check 민감도 픽스처 + (--render) 렌더 재현성")
    t.add_argument("--render", action="store_true")
    t.set_defaults(fn=cmd_selftest)

    args = ap.parse_args(argv)
    if args.cmd == "kb-extract" and not args.pii_scan and not (args.mode and args.src and args.out):
        ap.error("kb-extract: <pdf|tables> <src> --out <file>  또는  --pii-scan <dir>")
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())

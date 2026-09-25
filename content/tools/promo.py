#!/usr/bin/env python3
"""
promo.py — 홍보콘텐츠 생성시스템 단일 CLI

  render      HTML → PNG / PDF(+preview)  (Playwright Chromium, 오프라인)
  fill        슬롯 YAML + 템플릿 HTML → HTML  (미니 머스타시, 슬롯 길이 경고)
  check       산출물 검사 (R0 brief · R1 PII+denylist · R2 deprecated · R3 credit(exempt) · R4 금액 · R4b 예산 검산 · R5 날짜 · R6 단체명 · R7 빈 슬롯 · R8 facts 경로 · R8b 실적 인용 · R9 필수 절 · final_from)
  index       out/*/brief.md → out/INDEX.md
  kb-extract  원본 문서 보조 변환 (pdf·hwpx·docx 텍스트 / HTML 표 → md 표 / PII 스캔)
  selftest    check 민감도 픽스처 · R4b 평가기·예산표 · 리뷰 결함 회귀 · kb-index 재현성 (+ --render 렌더 재현성)
  hwpx-image  HWPX 끝에 이미지 문단 추가 (지원문구 배너 등)
  kb-index    kb 섹션 색인 (kb-index.yaml · --raw → _raw/_index.yaml · --check 신선도)      [F-16]
  kb-select   서브커맨드별 읽을 섹션 선택 (읽기 예산 6만 자, --emit plan|basis)             [F-16]
  kb-outline  md 헤딩·줄 범위 표 (조각 읽기용)                                              [F-16]
  doc-stamp   최신 draft sha1 → brief.final_from (doc 변환 직전)                            [F-16]
  exec-summary 앱 집행내역 xlsx/csv → 단위사업·계정 합계 (learn --kind summary 입력)          [F-16]

실행: content/.venv/bin/python3 content/tools/promo.py <cmd> …
설계: docs/archive/2026-09/홍보콘텐츠-생성시스템/홍보콘텐츠-생성시스템.design.md §7
      docs/02-design/features/사업기획-AI-도우미.design.md §6 (kb-index·kb-select·kb-outline·kb-extract hwpx/docx)
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
    "휴대전화": re.compile(r"(?<!\d)01[016789]-?\d{3,4}-?\d{4}(?!\d)"),
    "이메일": re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+"),
    "주민번호": re.compile(r"(?<!\d)\d{6}-[1-4]\d{6}(?!\d)"),
    "직인": re.compile(r"_bin_\d{3}\.png|직인\.(?:png|jpe?g)|\(단체직인\)"),
}
ORG_MISSPELL = re.compile(r"청년노동자\s+인권센터|청년노동인권센터|청년 노동자인권센터|청년노동자인권쎈터")
AMOUNT_RE = re.compile(r"\d{1,3}(?:,\d{3})+\s*원")
DATE_RE = re.compile(r"(20\d{2})[.\-/]\s?(\d{1,2})[.\-/]\s?(\d{1,2})")
# 연도 없는 월.일 (10.14, 11/4). 앞뒤가 숫자·점이 아닐 때만 — 소수·버전·금액과 구분
SHORT_DATE_RE = re.compile(r"(?<![\d.])(1[0-2]|0?[1-9])[./](3[01]|[12]\d|0?[1-9])(?![\d.]|\s*%)")

_TEXT_EXTS = {".md", ".yaml", ".yml", ".html", ".txt"}


def _extract_hwpx_text(path: Path) -> str:
    """문단 단위(줄 = hp:p, 표 = md 행) — check-report 의 줄 번호가 문단 번호가 된다 (F-16 §6.4)"""
    try:
        return "\n".join(_hwpx_lines(path))
    except Exception as e:  # noqa: BLE001
        eprint(f"WARN {path.name}: hwpx 텍스트 추출 실패 ({e})")
        return ""


def _extract_docx_text(path: Path) -> str:
    try:
        return "\n".join(_docx_lines(path))
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
        elif p.suffix in (".hwpx", ".docx"):
            rel_p = p.relative_to(out_dir)
            if rel_p.parts[0] == "src" and p.with_suffix(".md").exists():   # review 원본만 — 같은 이름 .md 추출본이 대신 검사됨. final/ 은 항상 원본 검사
                continue
            texts[str(rel_p)] = _extract_hwpx_text(p) if p.suffix == ".hwpx" else _extract_docx_text(p)
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


# ---------------------------------------------------------------- check 확장 (F-16 §6.5 ~ §6.8): R0 · R1 denylist · R3 exempt · R4/R5 상향 · R4b · R8 · R8b · R9 · final_from

TEMPLATES_DOCS = ROOT / "templates" / "docs"
_DRAFT_RE = re.compile(r"^draft(?:-v(\d+))?\.md$")
_PATH_SEG_RE = re.compile(r"^([\w가-힣\-]+)((?:\[[^\]]+\])*)$")
_FACTS_COMMENT_RE = re.compile(r"<!--\s*facts:\s*([^>]*?)\s*-->")
_OUTCOME_WORDS = re.compile(r"달성|완료|실시|집행률|참여했|진행했")
_OUTCOME_OK_RE = re.compile(r"^(?:facts\.)?(?:outcomes\.|units(?:\.[\w\-]+|\[[^\]]+\])\.(?:findings|survey|analysis_scope)|schools\.visited_2026_h1)")
_UNIT_WORDS = sorted(["인분", "시간", "개월", "인월", "인회", "회", "부", "인", "월", "쪽", "명", "개", "원", "건", "대", "장", "매"], key=len, reverse=True)
_SUBTOTAL_RE = re.compile(r"(소\s*계|합\s*계|총\s*계)(?:\s*\([^)]*\))?\s*$")   # `소계` · `사업비 합계` · `사업비합계` · `합 계` · `소계 (사업인건비)`
_R4_MARK_RE = re.compile(r"^.{0,20}?\((신규 단가[^)]*|추정|산출:(?:[^()]|\([^()]*\))*)\)")   # 산출 식 안 괄호 1단계 허용
_R5_MARK_RE = re.compile(r"^(?:[\s~\-–.\/\d년월일]|\([월화수목금토일]\)|까지|부터)*\((?:예정|안)\)")   # `2027-03-02 (화) ~ 03-06 (예정)` 허용


def _latest_drafts(out_dir: Path, btype: str) -> set[str]:
    if btype == "review":
        return {str(p.relative_to(out_dir)) for p in (out_dir / "src").glob("*.md")} if (out_dir / "src").exists() else set()
    best, best_v = None, -1
    for p in out_dir.glob("draft*.md"):
        m = _DRAFT_RE.match(p.name)
        if not m:
            continue
        v = int(m.group(1) or 0)                 # draft.md = v0 < draft-v1.md (동률 없음)
        if v > best_v:
            best, best_v = p.name, v
    return {best} if best else set()


def _template_fm(brief_fm: dict) -> dict:
    tpls = brief_fm.get("templates") or []
    name = tpls[0] if isinstance(tpls, list) and tpls else (tpls if isinstance(tpls, str) else None)
    if not name:
        return {}
    p = TEMPLATES_DOCS / f"{name}.md"
    if not p.exists():
        return {}
    try:
        fm, _ = read_frontmatter(p)
    except SystemExit as e:  # 골격 frontmatter 파싱 실패 — check 를 멈추지 않고 골격 없는 것으로 (R9·R4b·credit_default 미적용)
        eprint(f"WARN 골격 frontmatter 파싱 실패 — {e}")
        return {"_error": str(e)}
    return fm or {}


# ---- R8: facts 경로 해석 (기존 /promo 인용 형식의 상위집합)

class _Missing:
    pass


def _step(node, key: str):
    if isinstance(node, dict):
        return node[key] if key in node else _Missing
    if isinstance(node, list):
        for el in node:
            if isinstance(el, dict) and str(el.get("id")) == key:
                return el
        return _Missing
    return _Missing


def _resolve_path(facts: dict, path: str, base=None) -> tuple[object, bool, str | None]:
    """반환 (값, 정수 인덱스로 id 요소를 가리킴 여부, 오류|None)"""
    path = path.strip()
    if path.startswith("facts."):
        path = path[6:]
    node = facts if base is None else base
    warn_idx = False
    for seg in path.split("."):
        m = _PATH_SEG_RE.match(seg)
        if not m:
            return None, warn_idx, f"형식 오류 '{seg}'"
        key, idxs = m.group(1), re.findall(r"\[([^\]]+)\]", m.group(2))
        node = _step(node, key)
        if node is _Missing:
            return None, warn_idx, f"'{key}' 없음"
        for ix in idxs:
            ix = ix.strip()
            if ix.isdigit():
                if not isinstance(node, list) or int(ix) >= len(node):
                    return None, warn_idx, f"[{ix}] 범위 밖"
                if any(isinstance(el, dict) and "id" in el for el in node):
                    warn_idx = True
                node = node[int(ix)]
            else:
                k, _, v = ix.partition("=") if "=" in ix else ("id", "=", ix)
                if isinstance(node, list):
                    node = next((el for el in node if isinstance(el, dict) and str(el.get(k)) == v), _Missing)
                else:
                    node = _step(node, ix)
                if node is _Missing:
                    return None, warn_idx, f"[{ix}] 없음"
    return node, warn_idx, None


def _parent_of(facts: dict, path: str):
    """형제 약식용: 마지막 세그먼트를 뺀 노드"""
    segs = path.strip().split(".")
    if len(segs) < 2:
        return None
    node, _, err = _resolve_path(facts, ".".join(segs[:-1]))
    return None if err else node


# ---- R4b: 산출근거 식 평가기 (§6.8 처리 순서가 규칙)

def _eval_expr(expr: str) -> tuple[int | None, str | None]:
    """반환 (값, 사유). 사유: '범위'·'배수'·'없음'·'파싱'"""
    import ast
    s = re.sub(r"<!--.*?-->", "", expr, flags=re.S)
    if re.search(r"\d\s*[~\-–]\s*\d", s):
        return None, "범위"
    if re.search(r"\d\s*[천만억]", s):
        return None, "배수"
    if re.search(r"[/÷%％]", s):                 # 나눗셈·백분율은 검산하지 않는다 (G1) — 지우면 식이 조용히 바뀐다
        return None, "파싱"
    if re.search(r"[-−–]\s*[\d(]|[\d)]\s*[-−–]", s):   # 뺄셈·음수도 검산하지 않는다 — 지우면 식이 조용히 바뀐다
        return None, "파싱"
    # 설명 괄호("(300인분)"·"(2개교)")는 연산자 없이 글자가 섞인 괄호 — 먼저 지운다. 숫자만 든 괄호·연산자 괄호는 식의 일부 (G6)
    s = re.sub(r"\([^()]*\)", lambda m: m.group(0) if (re.search(r"[+*×✕＊]|\d\s*[xX]\s*\d", m.group(0))
                                                     or not re.search(r"[^\d\s,.，()]", m.group(0))) else " ", s)
    s = s.replace(",", "").replace("，", "")
    for u in _UNIT_WORDS:                       # 단위어를 먼저 떼어야 "4회x300,000" 의 x 가 숫자 사이로 잡힌다
        s = re.sub(rf"(?<=\d)\s*{u}", "", s)
    s = re.sub(r"[×✕＊]", "*", s)
    s = re.sub(r"(?<=\d)\s*[xX]\s*(?=\d)", "*", s)
    s = re.sub(r"[^0-9+*(). ]", " ", s)         # 허용 외 문자는 공백으로 — 숫자가 붙어 버리지 않게 (G1)
    s = re.sub(r"\s+", " ", s).strip()
    if not s:
        return None, "없음"
    try:
        tree = ast.parse(s, mode="eval")
    except SyntaxError:
        return None, "파싱"

    def ev(n):
        if isinstance(n, ast.Expression):
            return ev(n.body)
        if isinstance(n, ast.BinOp) and isinstance(n.op, (ast.Add, ast.Mult)):
            a, b = ev(n.left), ev(n.right)
            if a is None or b is None:
                return None
            return a + b if isinstance(n.op, ast.Add) else a * b
        if isinstance(n, ast.Constant) and isinstance(n.value, int) and not isinstance(n.value, bool):
            return n.value
        return None
    v = ev(tree)
    return (v, None) if v is not None else (None, "파싱")


def _parse_amount_cell(cell: str) -> int | None:
    t = re.sub(r"<!--.*?-->", "", cell)
    while True:                                   # 금액 뒤 표식 (신규 단가 — 확인 필요)·(추정)·(산출: (a+b)×2) 제거 — 중첩 괄호 포함
        t2 = re.sub(r"\([^()]*\)", "", t)
        if t2 == t:
            break
        t = t2
    t = re.sub(r"[*원\s]", "", t)
    m = re.fullmatch(r"\d{1,3}(?:,\d{3})+|\d+", t)
    return int(m.group(0).replace(",", "")) if m else None


_SEP_CELL_RE = re.compile(r"^:?-+:?$")
DEFAULT_TOLERANCE = 0.001                          # R4b 항목 행 허용오차 (골격 budget_table.tolerance 가 없을 때)


def _md_tables(text: str) -> list[tuple[int, list[tuple[int, list[str]]]]]:
    """(첫 줄 번호, [(줄 번호, 셀들)…]) — 첫 행이 헤더. `|---|` 구분선은 위치가 아니라 패턴으로 뺀다
    (kb-extract 추출 표에는 구분선이 없다 — N2)"""
    out, cur, start = [], [], 0
    for i, line in enumerate(text.split("\n"), 1):
        if line.strip().startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if all(_SEP_CELL_RE.match(c) for c in cells if c) and any(cells):
                continue
            if not cur:
                start = i
            cur.append((i, cells))
        else:
            if len(cur) >= 2:
                out.append((start, cur))
            cur = []
    if len(cur) >= 2:
        out.append((start, cur))
    return out


def _check_budget_tables(text: str, rel: str, tolerance: float) -> tuple[list, set[str]]:
    """R4b. 반환 (findings, R4 허용 금액 문자열 집합)"""
    findings, allowed = [], set()
    n_tables = 0
    for start, rows in _md_tables(text):
        header = rows[0][1]
        try:
            ci_amt = next(i for i, h in enumerate(header) if "금액" in h)
            ci_exp = next(i for i, h in enumerate(header) if "산출근거" in h)
        except StopIteration:
            continue
        n_tables += 1
        sub_sum, group_sum = 0, 0
        totals: list[int] = []          # 합계 행들 (총계 = Σ합계)
        item_rows, total_rows, trailing = 0, 0, 0   # trailing = 마지막 합계·총계 뒤 항목 행
        for ln, cells in rows[1:]:
            if len(cells) <= max(ci_amt, ci_exp):
                continue
            amt_cell, exp_cell = cells[ci_amt], cells[ci_exp]
            amt = _parse_amount_cell(amt_cell)
            if amt is None:
                if amt_cell.strip():
                    findings.append(("WARN", "R4b 금액 셀", rel, ln, amt_cell))
                continue
            plain = [c.replace("**", "").strip() for c in cells]
            is_sub = any(_SUBTOTAL_RE.search(c) for c in plain)
            if is_sub:
                label = re.sub(r"\s", "", next(c for c in plain if _SUBTOTAL_RE.search(c)))
                if "소계" in label:
                    if amt != group_sum:
                        findings.append(("FAIL", "R4b 합계", rel, ln, f"소계 {amt:,} ≠ 항목 합 {group_sum:,}"))
                    else:
                        allowed.add(f"{amt:,}")
                    sub_sum += amt
                    group_sum = 0
                elif "총계" in label:
                    expect = sum(totals) + sub_sum + group_sum      # 합계들 + 마지막 합계 뒤에 남은 소계·항목 (N4)
                    if amt != expect:
                        findings.append(("FAIL", "R4b 합계", rel, ln, f"총계 {amt:,} ≠ 합계 합 {sum(totals):,} + 소계 합 {sub_sum:,} + 소계 밖 {group_sum:,}"))
                    else:
                        allowed.add(f"{amt:,}")
                    totals, sub_sum, group_sum, trailing = [], 0, 0, 0
                    total_rows += 1
                else:                                   # 합계 — 소계 합 + 소계 밖 행. 여러 합계(사업비·운영비)면 각각 닫고 총계가 묶는다 (G7)
                    expect = sub_sum + group_sum
                    if amt != expect:
                        findings.append(("FAIL", "R4b 합계", rel, ln, f"합계 {amt:,} ≠ 소계 합 {sub_sum:,} + 소계 밖 {group_sum:,}"))
                    else:
                        allowed.add(f"{amt:,}")
                    totals.append(amt)
                    sub_sum, group_sum, trailing = 0, 0, 0
                    total_rows += 1
                continue
            group_sum += amt
            item_rows += 1
            trailing += 1
            val, why = _eval_expr(exp_cell)
            if val is None:
                findings.append(("WARN", "R4b 산출근거 없음" if why == "없음" else "R4b 파싱", rel, ln, f"{exp_cell[:40]} ({why})"))
                continue
            if abs(val - amt) <= max(1, amt * tolerance):
                allowed.add(f"{amt:,}")
                for n in re.findall(r"\d[\d,]*", re.sub(r"<!--.*?-->", "", exp_cell)):
                    n = n.replace(",", "")
                    if n.isdigit() and int(n) >= 1000:
                        allowed.add(f"{int(n):,}")
            else:
                findings.append(("FAIL", "R4b 예산 검산", rel, ln, f"{amt:,} ≠ {val:,} ({exp_cell[:30]})"))
        if item_rows and not total_rows:
            findings.append(("WARN", "R4b 합계 없음", rel, start, "합계·총계 행 없음"))
        elif trailing:
            findings.append(("WARN", "R4b 합계 없음", rel, start, f"마지막 합계 뒤 항목 {trailing}행 — 합계에 들지 않음"))
    if n_tables == 0:
        findings.append(("WARN", "R4b 표 없음", rel, 0, "'금액'·'산출근거' 열이 있는 예산표 없음"))
    return findings, allowed


def _norm_heading(s: str) -> str:
    s = re.sub(r"^\s*[\d.①-⑩ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+[.)]?\s*", "", s.strip())
    return re.sub(r"[^\w가-힣]", "", s)


def _check_required_sections(text: str, rel: str, required: list, section_map: dict) -> list:
    heads = [_norm_heading(l[3:] if l.startswith("## ") else l[4:]) for l in text.split("\n") if l.startswith(("## ", "### "))]
    mapped = {_norm_heading(str(k)): _norm_heading(str(v)) for k, v in (section_map or {}).items()}
    out = []
    for req in required or []:
        rn = _norm_heading(str(req))
        target = mapped.get(rn, rn)
        if not any(target and target in h for h in heads):
            out.append(("FAIL", "R9 필수 절", rel, 0, str(req)))
    return out


def cmd_check(args) -> int:
    out_dir = Path(args.out_dir).resolve()
    facts = load_facts(Path(args.facts))
    has_brief = (out_dir / "brief.md").exists()
    brief_fm, _ = read_frontmatter(out_dir / "brief.md") if has_brief else ({}, "")
    btype = str(brief_fm.get("type", ""))
    audience = str(brief_fm.get("audience", ""))
    internal = audience == "internal" and btype != "review"   # review 대상 초안에는 deprecated 검사를 한다
    must_include = brief_fm.get("must_include") or []
    tpl_fm = _template_fm(brief_fm)
    credit_mode = brief_fm.get("credit") or tpl_fm.get("credit_default") or "required"
    credit_reason = brief_fm.get("credit_reason") or tpl_fm.get("credit_reason")
    is_p = btype in ("plan", "proposal") or (btype == "review" and brief_fm.get("review_as") in ("plan", "proposal"))
    latest = _latest_drafts(out_dir, btype)
    budget_table = tpl_fm.get("budget_table") if is_p else None
    tolerance = float((budget_table or {}).get("tolerance", DEFAULT_TOLERANCE))
    credit = (facts.get("program") or {}).get("credit_line", "")
    deprecated = (facts.get("deprecated") or [])
    forbidden = (facts.get("forbidden") or [])
    amounts = _facts_amounts(facts)
    fdates = _facts_dates(facts)
    fmonthdays = {(mth, dy) for (_, mth, dy) in fdates}
    deny, _ = _load_denylist()
    contact_ok = bool(brief_fm.get("contact_in_final"))

    findings: list[tuple[str, str, str, int, str]] = []  # level, rule, file, line, excerpt
    if not has_brief:
        findings.append(("WARN", "R0 brief 없음", "-", 0, "R3·R4b·R9 검사 없음"))
    if tpl_fm.get("_error"):
        findings.append(("WARN", "골격 frontmatter", "templates/docs", 0, str(tpl_fm["_error"]).split("\n")[0][:60]))
    if deny is None:
        findings.append(("INFO", "denylist 없음", "-", 0, "data/pii-denylist.txt"))
    if credit_mode == "exempt":
        findings.append(("INFO" if credit_reason else "WARN", "R3 exempt", "brief.md", 0, str(credit_reason or "credit_reason 없음")))
    texts = _collect_texts(out_dir)

    for rel, text in texts.items():
        if rel.endswith((".hwpx", ".docx")) and not text.strip():
            findings.append(("WARN", "R1 추출 불가", rel, 0, "텍스트를 읽지 못함 — 개인정보·표기 검사 안 됨"))
        is_final = rel.startswith("final/")
        is_yaml = rel.endswith((".yaml", ".yml"))
        role = "brief" if rel == "brief.md" else "latest" if rel in latest else "final" if is_final else "visual" if rel.startswith("visual/") else "other"
        # R1 PII (+ denylist)
        for label, ln, ex in _pii_findings(text, deny):
            lvl = "WARN" if (contact_ok and label in ("휴대전화", "이메일")) else "FAIL"
            findings.append((lvl, f"R1 PII({label})", rel, ln, ex))
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
        if role == "brief":
            continue
        p_here = is_p and role == "latest"          # 상향 규칙 적용 대상
        skip_money = is_p and role == "other"       # P 폴더의 비최신 draft·ideas·requirements — R4·R5·R8 생략
        # R4b (P·latest·budget_table)
        allowed_extra: set[str] = set()
        if p_here and budget_table:
            f4b, allowed_extra = _check_budget_tables(text, rel, tolerance)
            findings += f4b
        # R4 금액
        if not skip_money:
            for m in AMOUNT_RE.finditer(text):
                num = m.group(0).replace("원", "").strip()
                mk = None
                if p_here:
                    tail = text[m.end(): m.end() + 120].split("\n")[0]
                    mk = _R4_MARK_RE.match(tail)
                    if mk and AMOUNT_RE.search(tail[: mk.start(1)]):   # 표식이 뒤따르는 다른 금액의 것 — 이 금액 표식 아님
                        mk = None
                if mk and mk.group(1).startswith("산출:"):         # (산출: 식)은 허용 금액이어도 검산한다
                    val, _why = _eval_expr(mk.group(1)[3:])
                    if val is None or abs(val - int(num.replace(",", ""))) > 1:
                        findings.append(("FAIL", "R4 산출 불일치", rel, _line_of(text, m.start()), f"{m.group(0)} ≠ {val:,}" if val is not None else f"{m.group(0)} (산출 식 {_why})"))
                    continue
                if num in amounts or num in allowed_extra:
                    continue
                if p_here:
                    findings.append(("WARN" if mk else "FAIL", "R4 금액", rel, _line_of(text, m.start()), f"{m.group(0)} ({mk.group(1)[:12]})" if mk else m.group(0)))
                else:
                    findings.append(("WARN", "R4 금액", rel, _line_of(text, m.start()), m.group(0)))
            # R5 날짜
            for m in DATE_RE.finditer(text):
                tup = tuple(int(x) for x in m.groups())
                if tup in fdates:
                    continue
                if p_here:
                    tail = text[m.end(): m.end() + 120].split("\n")[0]
                    lvl = "WARN" if _R5_MARK_RE.match(tail) else "FAIL"
                else:
                    lvl = "WARN"
                findings.append((lvl, "R5 날짜", rel, _line_of(text, m.start()), m.group(0)))
            for m in SHORT_DATE_RE.finditer(text):
                line_start = text.rfind("\n", 0, m.start()) + 1
                if text[line_start:m.start()].lstrip().startswith("#"):
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
        if p_here:                                  # 골격 자리 {{…}} 가 남은 초안
            for m in re.finditer(r"\{\{[^{}\n]*\}\}", text):
                findings.append(("WARN", "R7 빈 자리", rel, _line_of(text, m.start()), m.group(0)))
        # R8 facts 경로 (latest draft + final 텍스트) / R8b (P·latest)
        if role in ("latest", "final"):
            for cm in _FACTS_COMMENT_RE.finditer(text):
                ln = _line_of(text, cm.start())
                line_start = text.rfind("\n", 0, cm.start()) + 1
                before = text[max(line_start, cm.start() - 40): cm.start()]
                line_text = text[line_start: text.find("\n", cm.end()) if text.find("\n", cm.end()) != -1 else len(text)]
                prev_parent, prev_prefix = None, ""
                for path in [x.strip() for x in cm.group(1).split(",") if x.strip()]:
                    node, warn_idx, err = _resolve_path(facts, path)
                    used_base = None
                    if err and prev_parent is not None:
                        node, warn_idx, err = _resolve_path(facts, path, base=prev_parent)
                        used_base = prev_parent
                    if err:
                        findings.append(("FAIL" if p_here else "WARN", "R8 facts 경로", rel, ln, f"{path} — {err}"))
                        continue
                    # 다음 형제 약식의 기준 = 이 경로의 부모 (상대 경로였으면 같은 기준 유지). full_path 는 R8b 판정용
                    segs = path.strip().split(".")
                    if used_base is not None:
                        full_path = f"{prev_prefix}.{path}" if prev_prefix else path
                        prev_parent = _resolve_path(facts, ".".join(segs[:-1]), base=used_base)[0] if len(segs) > 1 else used_base
                        prev_prefix = f"{prev_prefix}.{'.'.join(segs[:-1])}" if len(segs) > 1 else prev_prefix
                    else:
                        full_path = path
                        prev_parent = _parent_of(facts, path)
                        prev_prefix = ".".join(segs[:-1])
                    if warn_idx:
                        findings.append(("WARN", "R8 id 표기", rel, ln, path))
                    if isinstance(node, (int, float)) and not isinstance(node, bool):
                        n = int(node) if float(node).is_integer() else node
                        forms = {str(n), f"{n:,}"} if isinstance(n, int) else {str(n)}
                        if not any(f in before.replace(",", "") or f in before for f in forms):
                            findings.append(("WARN", "R8 인용값", rel, ln, f"{path} = {n}"))
                    if p_here and _OUTCOME_WORDS.search(line_text) and not _OUTCOME_OK_RE.match(full_path):
                        findings.append(("WARN", "R8b 실적 인용", rel, ln, path))
        # R9 필수 절 (P·latest)
        if p_here and tpl_fm.get("required_sections"):
            findings += _check_required_sections(text, rel, tpl_fm.get("required_sections"), brief_fm.get("section_map") or {})
    # R3 credit_line — final/visual 텍스트 산출물 각 파일 (exempt 면 건너뜀)
    if credit_mode != "exempt" and credit and ("credit_line" in must_include or (not internal and brief_fm)):
        accepted = [credit] + [v for v in ((facts.get("program") or {}).get("credit_sentences") or {}).values() if v]
        for rel, text in texts.items():
            if not rel.startswith(("final/", "visual/")) or rel.endswith((".yaml", ".yml")) or rel.endswith("-preview.png"):
                continue
            if not any(a in text for a in accepted):
                findings.append(("FAIL", "R3 credit_line", rel, 0, "credit_line/credit_sentences 없음"))
    # final_from — final/ 에 산출물이 있을 때 최신 draft 와 대조
    final_files = [p for p in (out_dir / "final").glob("*") if p.is_file()] if (out_dir / "final").exists() else []
    if final_files and btype in ("doc", "plan", "proposal") and latest:
        ff = brief_fm.get("final_from") or {}
        cur = _sha12((out_dir / next(iter(latest))).read_bytes())
        if not ff:
            findings.append(("INFO", "final_from 없음", "brief.md", 0, "promo.py doc-stamp <id> 로 기록"))
        elif str(ff.get("sha1", ""))[:12] != cur:
            findings.append(("WARN", "final 갱신 필요", "brief.md", 0, f"final_from {ff.get('draft')} {ff.get('sha1')} ≠ 최신 {next(iter(latest))} {cur}"))  # noqa: E501

    fails = [f for f in findings if f[0] == "FAIL"]
    warns = [f for f in findings if f[0] == "WARN"]
    lines = [f"# check-report — {out_dir.name}", "",
             f"- 기준 facts: `{facts.get('meta', {}).get('as_of', '?')}`  · 검사일: {date.today().isoformat()}" + (f"  · type: {btype}" if btype else ""),
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


# ---------------------------------------------------------------- doc-stamp

def cmd_doc_stamp(args) -> int:
    out_dir = Path(args.out_dir).resolve()
    b = out_dir / "brief.md"
    if not b.exists():
        eprint("FAIL brief.md 없음"); return 2
    fm, _ = read_frontmatter(b)
    latest = _latest_drafts(out_dir, str(fm.get("type", "")))
    if not latest:
        eprint("FAIL draft*.md 없음"); return 2
    name = next(iter(latest))
    sha = _sha12((out_dir / name).read_bytes())
    line = f'final_from: {{draft: {name}, sha1: "{sha}", at: {date.today().isoformat()}}}'   # sha 는 따옴표 — 숫자로만 된 sha 를 YAML 이 int 로 읽지 않게
    text = b.read_text(encoding="utf-8")
    head, sep, rest = text.partition("\n---\n")
    if not text.startswith("---") or not sep:
        eprint("FAIL brief.md 머리말(--- … ---) 형식이 아님"); return 2
    block = re.compile(r"^final_from:[^\n]*(?:\n[ \t]+[^\n]*)*", re.M)   # 인라인·블록 매핑 모두 통째로 교체
    if block.search(head):
        head = block.sub(lambda _m: line, head, count=1)
    else:
        head = re.sub(r"^status:", f"{line}\nstatus:", head, count=1, flags=re.M) if re.search(r"^status:", head, re.M) else head + "\n" + line
    try:
        fm_new = _yaml().safe_load(head.split("\n", 1)[1]) or {}
        ok = isinstance(fm_new, dict) and str((fm_new.get("final_from") or {}).get("sha1")) == sha
    except Exception:  # noqa: BLE001
        ok = False
    if not ok:
        eprint("FAIL brief.md 머리말을 안전하게 갱신하지 못함 — final_from 을 직접 확인하세요 (파일은 그대로)"); return 2
    b.write_text(head + sep + rest, encoding="utf-8")
    print(f"doc-stamp  {name} {sha} → brief.final_from")
    return 0


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


def _report_pii(path: Path) -> int:
    deny, _ = _load_denylist()
    t = path.read_text(encoding="utf-8", errors="ignore")
    finds = _pii_findings(t, deny)
    for label, ln, ex in finds:
        print(f"PII {label:8} {path.name}:{ln}  {ex}")
    if finds:
        print(f"⚠ 추출본에 PII {len(finds)}건 — 지운 뒤 진행" + ("" if deny is not None else " (denylist 없음)"))
    return len(finds)


_HWP_HINT = " — .hwp(바이너리)는 한글에서 hwpx 또는 PDF로 다른 이름 저장"
SCAN_MIN_CHARS, SCAN_MIN_PER_PAGE = 20, 50       # 실질 문자(공백·표 기호·쪽 표시 제외) — 미만이면 스캔본으로 보고 종료 3


def cmd_kb_extract(args) -> int:
    if args.pii_scan:
        deny, _ = _load_denylist()
        hits = 0
        for p in sorted(Path(args.pii_scan).rglob("*")):
            if p.is_file() and p.suffix in _TEXT_EXTS and "_raw" not in p.parts:
                t = p.read_text(encoding="utf-8", errors="ignore")
                for label, ln, ex in _pii_findings(t, deny):
                    hits += 1
                    print(f"PII {label:8} {p.relative_to(Path(args.pii_scan))}:{ln}  {ex}")
        print(f"pii-scan  {hits} 건" + ("" if deny is not None else "  (INFO denylist 없음: data/pii-denylist.txt)"))
        return 1 if hits else 0
    if args.mode in ("hwpx", "docx"):
        src = Path(args.src)
        if src.suffix.lower() != f".{args.mode}":
            eprint(f"FAIL {src.name}: {args.mode} 파일이 아닙니다{_HWP_HINT if src.suffix.lower() == '.hwp' else ''}"); return 2
        try:
            lines = _hwpx_lines(src) if args.mode == "hwpx" else _docx_lines(src)
        except Exception as e:  # noqa: BLE001 — 깨진 zip·XML·지원하지 않는 형식
            eprint(f"FAIL {src.name}: 읽을 수 없음 ({type(e).__name__}: {e})"); return 2
        if args.headings:
            lines = _mark_headings(lines)
        text = "\n".join(lines)
        if len(re.sub(r"[\s|¦#\-]", "", text)) < SCAN_MIN_CHARS:    # 표 기호·공백을 뺀 실질 문자 — 이미지만 든 문서가 대상 (짧은 서식은 통과)
            eprint(f"FAIL 텍스트 없음(스캔본) — {len(text)}자"); return 3
        out = Path(args.out)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(f"<!-- source: {args.src} · {args.mode} · 문단 {len(lines)} -->\n\n" + text + "\n", encoding="utf-8")
        rows = sum(1 for l in lines if l.startswith("|"))
        print(f"kb-extract {args.mode}  문단 {sum(1 for l in lines if l and not l.startswith('|'))} · 표 행 {rows} · {len(text):,}자 → {out}")
        _report_pii(out)
        return 0
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
        if Path(args.src).suffix.lower() != ".pdf":
            eprint(f"FAIL {Path(args.src).name}: pdf 파일이 아닙니다{_HWP_HINT if Path(args.src).suffix.lower() == '.hwp' else ''}"); return 2
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
        body = "".join(parts)
        n_pages = max(1, len(parts) - 1)
        real = len(re.sub(r"\s|<!-- (?:source|page)[^>]*-->", "", "".join(parts[1:])))   # 마커·공백 뺀 실질 문자
        if real < SCAN_MIN_CHARS or real / n_pages < SCAN_MIN_PER_PAGE:
            eprint(f"FAIL 텍스트 없음(스캔본) — {n_pages}쪽 실질 {real}자. OCR 없음: 텍스트 PDF나 hwpx로 다시"); return 3
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(body, encoding="utf-8")
        print(f"kb-extract pdf  {total}쪽 중 {len(parts) - 1}쪽 → {args.out}")
        _report_pii(Path(args.out))
        return 0
    eprint("kb-extract: mode(pdf|tables|hwpx|docx) 또는 --pii-scan 필요")
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
FIXTURE_PLAN = TEMPLATES_VISUAL / "_samples" / "_check-fixture-plan"
FIXTURE_NOBRIEF = TEMPLATES_VISUAL / "_samples" / "_check-fixture-nobrief"
EXPECTED_RULES = {"R1 PII(휴대전화)", "R1 PII(이메일)", "R2 deprecated", "R2 forbidden", "R3 credit_line",
                  "R4 금액", "R5 날짜", "R5 날짜(M.D)", "R6 단체명", "R7 빈 슬롯"}
# plan 픽스처: 기대 (수준, 규칙, 파일) · 금지 (규칙, 파일[:L줄]) — latest-only 와 정상 행 무발견
EXPECTED_PLAN = {("FAIL", "R4b 예산 검산", "draft-v2.md"), ("FAIL", "R4b 합계", "draft-v2.md"),
                 ("WARN", "R4b 산출근거 없음", "draft-v2.md"), ("FAIL", "R8 facts 경로", "draft-v2.md"),
                 ("WARN", "R8 id 표기", "draft-v2.md"), ("FAIL", "R9 필수 절", "draft-v2.md"),
                 ("FAIL", "R4 금액", "draft-v2.md"), ("FAIL", "R5 날짜", "draft-v2.md"), ("WARN", "R5 날짜", "draft-v2.md"),
                 ("WARN", "R8b 실적 인용", "draft-v2.md"), ("FAIL", "R1 PII(denylist)", "draft-v2.md"),
                 ("INFO", "R3 exempt", "brief.md"), ("WARN", "final 갱신 필요", "brief.md"),
                 ("FAIL", "R4 산출 불일치", "draft-v2.md"), ("WARN", "R7 빈 자리", "draft-v2.md"),
                 ("FAIL", "R1 PII(denylist)", "draft-v1.md")}
FORBIDDEN_PLAN = {("R4b 예산 검산", "draft-v1.md"), ("R9 필수 절", "draft-v1.md"), ("R8 facts 경로", "draft-v1.md"),
                  ("R4 금액", "draft-v1.md"), ("R5 날짜", "draft-v1.md"), ("R3 credit_line", "final/2027-계획.md"),
                  ("R4 금액", "draft-v2.md:L22"), ("R4 금액", "draft-v2.md:L23"), ("R4b 예산 검산", "draft-v2.md:L22"), ("R4b 예산 검산", "draft-v2.md:L23")}
# R4b 평가기 단위 케이스: (식, 금액, 기대) — 기대: 'PASS' | 'FAIL' | 사유(WARN)
EVAL_CASES = [("4회×300,000", 1200000, "PASS"), ("5인×20,000×3~4회", 400000, "범위"), ("클로드코드 Max 160,000×5", 800000, "PASS"),
              ("12,121원×209시간×12개월", 30400000, "PASS"), ("1천만원×2개교", 20000000, "배수"),
              ("<!-- facts: unit_costs.venue --> 4회×200,000", 800000, "PASS"), ("4회x300,000", 1200000, "PASS"),
              ("보고서 인쇄 300부×2,000 + 배포·발송 160,000", 760000, "PASS"), ("", 500000, "없음"),
              ("20,000,000/2개교", 10000000, "파싱"), ("20,000,000×1/2", 10000000, "파싱"),
              ("커피차 대여(300인분) 3×1,000,000", 3000000, "PASS"), ("(2개교) 2×10,000,000", 20000000, "PASS"),
              ("100,000×2 - (50,000)", 150000, "파싱"), ("-100,000 + 200,000", 100000, "파싱"),
              ("(1,700,000+500,000)×2", 4400000, "PASS"), ("(50,000)×2", 100000, "PASS"), ("1,000,000원×10%", 100000, "파싱")]
# R4b 표 케이스: (md 표, 기대 규칙 집합) — 소계·합계·총계 그룹 규칙 (G7·G8)
_T = "| 계정항목 | 금액 | 산출근거 |\n|---|---:|---|\n"
TABLE_CASES = [
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| **소계** | **1,200,000원** | |\n| 예비비 | 500,000원 | 500,000×1 |\n| **합계** | **1,700,000원** | |", set()),
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| **소계** | **1,200,000원** | |\n| 예비비 | 500,000원 | 500,000×1 |\n| **합계** | **1,700,001원** | |", {"R4b 합계"}),
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| **사업비 합계** | **1,200,000원** | |\n| 임차료 | 660,000원 | 55,000×12개월 |\n| **운영비 합계** | **660,000원** | |\n| **총계** | **1,860,000원** | |", set()),
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| **사업비 합계** | **1,200,000원** | |\n| 임차료 | 660,000원 | 55,000×12개월 |\n| **운영비 합계** | **660,000원** | |\n| **총계** | **1,900,000원** | |", {"R4b 합계"}),
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| 사업회의비 | 100,000원 | 5인×20,000 |", {"R4b 합계 없음"}),
    (_T + "| 사업인건비 | 1,300,000원 | 4회×300,000 |\n| **합계** | **1,300,000원** | |", {"R4b 예산 검산"}),
    ("| 계정항목 | 금액 | 산출근거 |\n| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| 사업회의비 | 100,000원 | 5인×20,000 |\n| 소계 | 1,300,000원 | |\n| 합계 | 1,300,000원 | |", set()),   # 추출 표 — 구분선 없음 (N2)
    (_T + "| 사업인건비 | 1,200,000원 | 4회×300,000 |\n| **사업비 합계** | **1,200,000원** | |\n| 임차료 | 660,000원 | 55,000×12개월 |\n| **소계** | **660,000원** | |\n| **총계** | **1,860,000원** | |", set()),   # 합계 뒤 소계 + 총계 (N4)
    (_T + "| 사업홍보비 | 250,000원 (신규 단가 — 확인 필요) | 250,000×1 |\n| **합계** | **250,000원** | |", set()),   # 금액 칸 표식
    (_T + "| 사업인건비 | 100,000원 | 1×100,000 |\n| **합계** | **100,000원** | |\n| 사업회의비 | 200,000원 | 2×100,000 |", {"R4b 합계 없음"}),   # 합계 뒤 항목
    (_T + "| A | 1,000,900원 | 1,000,000×1 |\n| **합계** | **1,000,900원** | |", set()),                # 0.09% — 허용오차 안
    (_T + "| A | 1,001,100원 | 1,000,000×1 |\n| **합계** | **1,001,100원** | |", {"R4b 예산 검산"}),     # 0.11%
    (_T + "| A | 미정 | 1×1 |\n| **합계** | **0원** | |", {"R4b 금액 셀"}),
    (_T + "| A | 400,000원 | 5인×20,000×3~4회 |\n| **합계** | **400,000원** | |", {"R4b 파싱"}),
    ("본문만\n", {"R4b 표 없음"}),
]


def _report_rows(report: str) -> list[tuple[str, str, str, int]]:
    rows = []
    for row in report.splitlines():
        if not row.startswith(("| FAIL", "| WARN", "| INFO")):
            continue
        c = [x.strip() for x in row.strip("|").split("|")]
        rows.append((c[0], c[1], c[2], int(c[3]) if c[3].isdigit() else 0))
    return rows


def cmd_selftest(args) -> int:
    """check 픽스처 3종 + R4b 평가기·예산표 케이스 + 리뷰 결함 회귀 + kb-index 재현성·신선도 + (--render) 렌더 재현성"""
    import contextlib
    import filecmp
    import io
    import os
    import shutil
    import tempfile

    ok = True

    def run_check(work: Path) -> list[tuple[str, str, str, int]]:
        ns = argparse.Namespace(out_dir=str(work), facts=str(FACTS), strict=False)
        with contextlib.redirect_stdout(io.StringIO()):
            cmd_check(ns)
        return _report_rows((work / "check-report.md").read_text(encoding="utf-8"))

    with contextlib.ExitStack() as stack, tempfile.TemporaryDirectory() as td:
        saved_env = {k: os.environ.get(k) for k in ("PROMO_DENYLIST", "PROMO_ALLOWLIST")}

        def _restore_env() -> None:
            for k, v in saved_env.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
        stack.callback(_restore_env)
        deny, allow = Path(td) / "deny.txt", Path(td) / "allow.txt"     # 기계의 실제 목록과 무관하게 — 가상 토큰만
        deny.write_text("가상테스트고\n", encoding="utf-8")
        allow.write_text("", encoding="utf-8")
        os.environ.update(PROMO_DENYLIST=str(deny), PROMO_ALLOWLIST=str(allow))
        # 1) /promo 회귀 픽스처 (README.md 는 기대 규칙 설명 문서라 빼고 복사 — 규칙이 README 로만 검출되면 안 됨)
        work = Path(td) / "fixture"
        shutil.copytree(FIXTURE, work, ignore=shutil.ignore_patterns("README.md"))
        rows = run_check(work)
        found = {r[1] for r in rows if r[0] in ("FAIL", "WARN")}
        missing = EXPECTED_RULES - found
        r3_files = {r[2] for r in rows if r[1] == "R3 credit_line"}
        if r3_files != {"final/no-credit.html"}:
            ok = False; print(f"FAIL R3 대상 파일 불일치: {sorted(r3_files)} (기대: final/no-credit.html 만)")
        if missing:
            ok = False; print(f"FAIL 미검출 규칙: {sorted(missing)}")
        else:
            print(f"check 민감도(promo)  {len(EXPECTED_RULES)}개 규칙 전부 검출 ✓")
        # 2) plan 픽스처 (가상 denylist)
        work = Path(td) / "fixture-plan"
        shutil.copytree(FIXTURE_PLAN, work)
        rows = run_check(work)
        got = {(r[0], r[1], r[2]) for r in rows}
        miss = EXPECTED_PLAN - got
        bad = set()
        for rule, spec in FORBIDDEN_PLAN:
            f, _, ln = spec.partition(":L")
            for r in rows:
                if r[1] == rule and r[2] == f and (not ln or r[3] == int(ln)):
                    bad.add((rule, spec))
        if miss or bad:
            ok = False
            if miss:
                print(f"FAIL plan 픽스처 미검출: {sorted(miss)}")
            if bad:
                print(f"FAIL plan 픽스처 금지 발견: {sorted(bad)}")
        else:
            print(f"check 민감도(plan)  {len(EXPECTED_PLAN)}개 기대 검출 · 금지 {len(FORBIDDEN_PLAN)}개 무발견 ✓")
        r9 = sorted(ln.split("|")[5].strip() for ln in (work / "check-report.md").read_text(encoding="utf-8").splitlines() if "| R9 필수 절 |" in ln)
        if r9 != ["위험과 대응"]:
            ok = False; print(f"FAIL R9 발췌: {r9} (기대: ['위험과 대응'])")
        # 3) brief 없음
        work = Path(td) / "fixture-nobrief"
        shutil.copytree(FIXTURE_NOBRIEF, work)
        rows = run_check(work)
        if not any(r[1] == "R0 brief 없음" for r in rows):
            ok = False; print("FAIL R0 brief 없음 미검출")
        else:
            print("check R0  ✓")
        # 4) R4b 평가기
        bad_eval = []
        for expr, amt, expect in EVAL_CASES:
            val, why = _eval_expr(expr)
            if expect == "PASS":
                res = val is not None and abs(val - amt) <= max(1, amt * DEFAULT_TOLERANCE)
            elif expect == "FAIL":
                res = val is not None and abs(val - amt) > max(1, amt * DEFAULT_TOLERANCE)
            else:
                res = val is None and why == expect
            if not res:
                bad_eval.append((expr, amt, expect, val, why))
        if bad_eval:
            ok = False; print(f"FAIL R4b 평가기: {bad_eval}")
        else:
            print(f"R4b 평가기  {len(EVAL_CASES)}케이스 ✓")
        mk = _R4_MARK_RE.match("(산출: (1,700,000+500,000)×2)")
        if not mk or mk.group(1) != "산출: (1,700,000+500,000)×2":
            ok = False; print("FAIL R4 표식 괄호 1단계")
        bad_tbl = []
        for i, (md, expect) in enumerate(TABLE_CASES, 1):
            got = {f[1] for f in _check_budget_tables(md, "t.md", DEFAULT_TOLERANCE)[0]}
            if got != expect:
                bad_tbl.append((i, sorted(got), sorted(expect)))
        if bad_tbl:
            ok = False; print(f"FAIL R4b 표 케이스: {bad_tbl}")
        else:
            print(f"R4b 표 케이스  {len(TABLE_CASES)}케이스 ✓")
        # 4') 회귀 — /ship 리뷰 결함·테스트 공백 (항목마다 이름 하나, 개수는 len)
        import zipfile
        reg: list[tuple[str, bool]] = []
        y = _yaml()

        def _docx(path: Path, body_xml: str, ns: str = _W) -> None:
            with zipfile.ZipFile(path, "w") as z:
                z.writestr("word/document.xml", f'<w:document xmlns:w="{ns}"><w:body>{body_xml}</w:body></w:document>')

        def _hwpx(path: Path, body_xml: str) -> None:
            with zipfile.ZipFile(path, "w") as z:
                z.writestr("Contents/section0.xml", f'<hs:sec xmlns:hs="{_HS}" xmlns:hp="{_HP}">{body_xml}</hs:sec>')

        def _cli(*argv: str) -> tuple[int, str, str]:
            out, err = io.StringIO(), io.StringIO()
            with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
                try:
                    rc = main(list(argv))
                except SystemExit as e:
                    rc = e.code if isinstance(e.code, int) else 2
            return rc, out.getvalue(), err.getvalue()

        def _plan_dir(name: str, draft: str, extra_fm: str = "", btype: str = "plan", src: bool = False) -> Path:
            w = Path(td) / name
            (w / "src").mkdir(parents=True)
            (w / "brief.md").write_text(f"---\nid: {name}\ntype: {btype}\naudience: 재단\ntemplates: [사업계획]\n"
                                        f"credit: exempt\ncredit_reason: t\n{extra_fm}---\n", encoding="utf-8")
            (w / ("src/대상.md" if src else "draft.md")).write_text(draft, encoding="utf-8")
            return w

        def _rows_x(w: Path) -> list[tuple[str, str, str, int, str]]:   # (수준, 규칙, 파일, 줄, 발췌)
            out = []
            for ln in (w / "check-report.md").read_text(encoding="utf-8").splitlines():
                if ln.startswith(("| FAIL", "| WARN", "| INFO")):
                    c = [x.strip() for x in ln.strip("|").split("|")]
                    out.append((c[0], c[1], c[2], int(c[3]) if c[3].isdigit() else 0, c[4] if len(c) > 4 else ""))
            return out

        req10 = ["사업 개요", "배경과 목적", "세부 사업목표", "세부 활동내용", "추진 일정", "사업예산",
                 "성과지표와 성과측정 계획", "평가 계획", "위험과 대응", "이전 계획과의 연결"]

        # ① exec-summary — 머리행 없는 파일은 값 없이 거부 · csv 합계 · 앱 형식 xlsx
        csv_p = Path(td) / "exp.csv"
        csv_p.write_text("2026-03-10,캠페인,여비,여비교통비,수취인테스트,설명테스트,1000,집행\n", encoding="utf-8")
        rc, _o, e = _cli("exec-summary", str(csv_p))
        reg.append(("exec-summary 머리행 없음 → 값 미출력", rc == 2 and "수취인테스트" not in e and "설명테스트" not in e))
        csv_p.write_text("집행일,소분류,항목,유형,수취인,설명,금액,상태\n"
                         "2026-03-10,캠페인,여비,여비교통비,수취인테스트,설명테스트,402821,집행\n"
                         "2026-06-30,캠페인,물품,물품구매비,문구점,환입,-50000,집행\n"
                         "2026-07-01,캠페인,인쇄,도서인쇄비,인쇄소,대기건,500000,대기\n"
                         "2026-07-05,없는소분류,기타,기타,누구,매핑없음,10000,집행\n", encoding="utf-8")
        yout = Path(td) / "exp.yaml"
        rc, _o, _e = _cli("exec-summary", str(csv_p), "--out", str(yout))
        ysum = (y.safe_load(yout.read_text(encoding="utf-8")) or {}) if rc == 0 else {}
        bu = {r["unit"]: r["executed"] for r in (ysum.get("by_unit") or [])}
        reg.append(("exec-summary csv 합계·대기·환입·unmapped", rc == 0 and bu.get("campaign") == 352821 and ysum.get("unmapped") == ["없는소분류"]
                    and ysum.get("status_counts") == {"집행": 3, "대기": 1} and "수취인테스트" not in yout.read_text(encoding="utf-8")))
        nsx = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

        def _xc(ref: str, v) -> str:
            return f'<c r="{ref}"><v>{v}</v></c>' if isinstance(v, int) else f'<c r="{ref}" t="inlineStr"><is><t>{v}</t></is></c>'

        def _xr(i: int, vals: list) -> str:
            return f'<row r="{i}">' + "".join(_xc(f"{chr(65 + j)}{i}", v) for j, v in enumerate(vals)) + "</row>"
        xp, xo = Path(td) / "exp.xlsx", Path(td) / "exp-x.yaml"
        with zipfile.ZipFile(xp, "w") as z:
            z.writestr("xl/worksheets/sheet1.xml", f'<worksheet xmlns="{nsx}"><sheetData>'
                       + _xr(1, ["집행일", "대분류", "소분류", "항목명", "유형", "금액(원)", "결제방법", "수급자", "상태"])
                       + _xr(2, ["2026-03-10", "사업비", "캠페인", "여비", "여비교통비", 402821, "이체", "수취인테스트", "집행"])
                       + _xr(3, ["2026-07-01", "사업비", "캠페인", "인쇄", "도서인쇄비", 500000, "카드", "인쇄소", "pending"])
                       + "</sheetData></worksheet>")
        rc, _o, _e = _cli("exec-summary", str(xp), "--out", str(xo))
        xs = (y.safe_load(xo.read_text(encoding="utf-8")) or {}) if rc == 0 else {}
        reg.append(("exec-summary xlsx(inlineStr·숫자 셀)", xs.get("by_unit") == [{"unit": "campaign", "executed": 402821}]
                    and xs.get("status_counts") == {"집행": 1, "pending": 1} and xs.get("as_of") == "2026-03-10"
                    and "수취인테스트" not in xo.read_text(encoding="utf-8")))

        # ② check — final 원본은 항상 검사(PII 보고까지), 추출 불가 경고, review src/ 는 .md 가 있을 때만 대체
        outd = Path(td) / "out-final"
        (outd / "final").mkdir(parents=True)
        (outd / "src").mkdir()
        _docx(outd / "final" / "x.docx", "<w:p><w:r><w:t>010-1234-5678</w:t></w:r></w:p>")
        (outd / "final" / "x.md").write_text("clean\n", encoding="utf-8")
        with zipfile.ZipFile(outd / "final" / "bad.docx", "w") as z:
            z.writestr("dummy.txt", "x")
        _docx(outd / "src" / "y.docx", "<w:p><w:r><w:t>원본</w:t></w:r></w:p>")
        (outd / "src" / "y.md").write_text("추출본\n", encoding="utf-8")
        _docx(outd / "src" / "z.docx", "<w:p><w:r><w:t>추출본 없음</w:t></w:r></w:p>")
        with contextlib.redirect_stderr(io.StringIO()):
            got = _collect_texts(outd)
            rows_f = {r[:3] for r in run_check(outd)}
        reg.append(("final 원본 검사·추출 불가 경고", "010-1234-5678" in got.get("final/x.docx", "") and "src/y.docx" not in got
                    and "src/z.docx" in got and ("FAIL", "R1 PII(휴대전화)", "final/x.docx") in rows_f
                    and ("WARN", "R1 추출 불가", "final/bad.docx") in rows_f))

        # ③ PII 정규식 경계 · contact_in_final 은 전화·이메일만 WARN
        pf = [(lb, ex) for lb, _, ex in _pii_findings("주민번호900101-1234567 / 계좌 3333010-1234-5678 / 연락처010-1234-5678", [])]
        cw = _plan_dir("contact", "## 1. 사업 개요\n연락처 010-1234-5678 · 900101-1234567\n", "contact_in_final: true\n")
        crows = {(r[0], r[1]) for r in run_check(cw)}
        reg.append(("PII 정규식 경계·contact_in_final", ("주민번호", "900101-1234567") in pf
                    and [x for x in pf if x[0] == "휴대전화"] == [("휴대전화", "010-1234-5678")]
                    and ("WARN", "R1 PII(휴대전화)") in crows and ("FAIL", "R1 PII(주민번호)") in crows))

        # ④ 추출 — docx 셀 문단·gridSpan 상한 · Strict docx · hwpx 병합 상한·탭 · 병합 정렬·vMerge·cellAddr 없는 표
        dx = Path(td) / "cell.docx"
        _docx(dx, "<w:tbl><w:tr>"
                  "<w:tc><w:p><w:r><w:t>100</w:t></w:r></w:p><w:p><w:r><w:t>200</w:t></w:r></w:p></w:tc>"
                  '<w:tc><w:tcPr><w:gridSpan w:val="999999"/></w:tcPr><w:p><w:r><w:t>a</w:t></w:r></w:p></w:tc>'
                  '<w:tc><w:tcPr><w:gridSpan w:val="abc"/></w:tcPr><w:p><w:r><w:t>b</w:t></w:r></w:p></w:tc>'
                  "</w:tr></w:tbl>")
        row = next((ln for ln in _docx_lines(dx) if ln.startswith("|")), "")
        dcells = [c.strip() for c in row.strip("|").split("|")]
        reg.append(("docx 셀 문단·gridSpan 상한", bool(dcells) and dcells[0] == "100 200" and len(dcells) == 2 + _MAX_SPAN))
        sx = Path(td) / "strict.docx"
        _docx(sx, "<w:p><w:r><w:t>엄격 형식 본문</w:t></w:r></w:p>", ns=_W_STRICT)
        reg.append(("Strict OOXML docx", _docx_lines(sx) == ["엄격 형식 본문"]))
        hx = Path(td) / "big.hwpx"
        _hwpx(hx, "<hp:p><hp:run><hp:tbl><hp:tr><hp:tc><hp:subList><hp:p><hp:run><hp:t>x</hp:t></hp:run></hp:p></hp:subList>"
                  '<hp:cellAddr colAddr="0" rowAddr="0"/><hp:cellSpan colSpan="100000" rowSpan="100000"/>'
                  "</hp:tc></hp:tr></hp:tbl></hp:run></hp:p>")
        hrows = [ln for ln in _hwpx_lines(hx) if ln.startswith("|")]
        reg.append(("hwpx 병합 범위 상한", len(hrows) == _MAX_SPAN and hrows[0].count("|") - 1 == _MAX_SPAN))
        tx = Path(td) / "tab.hwpx"
        _hwpx(tx, "<hp:p><hp:run><hp:t>010-1234-5678<hp:tab/>2026</hp:t></hp:run></hp:p>")
        tl = _hwpx_lines(tx)
        reg.append(("hwpx 탭 → 공백(전화 검출)", tl == ["010-1234-5678 2026"] and bool(PII_PATTERNS["휴대전화"].search(tl[0]))))

        def _tc(t: str, r=None, c=None, rs: int = 1) -> str:
            return ("<hp:tc><hp:subList><hp:p><hp:run><hp:t>" + t + "</hp:t></hp:run></hp:p></hp:subList>"
                    + (f'<hp:cellAddr colAddr="{c}" rowAddr="{r}"/><hp:cellSpan colSpan="1" rowSpan="{rs}"/>' if r is not None else "")
                    + "</hp:tc>")
        mx = Path(td) / "merge.hwpx"
        _hwpx(mx, f"<hp:p><hp:run><hp:tbl><hp:tr>{_tc('A', 0, 0, 2)}{_tc('B', 0, 1)}{_tc('C', 0, 2)}</hp:tr>"
                  f"<hp:tr>{_tc('D', 1, 1)}{_tc('E', 1, 2)}</hp:tr></hp:tbl></hp:run></hp:p>"
                  f"<hp:p><hp:run><hp:tbl><hp:tr>{_tc('x')}{_tc('y')}</hp:tr></hp:tbl></hp:run></hp:p>")
        vx = Path(td) / "vmerge.docx"
        _docx(vx, '<w:tbl><w:tr><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc>'
                  "<w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc></w:tr>"
                  "<w:tr><w:tc><w:tcPr><w:vMerge/></w:tcPr><w:p/></w:tc><w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc></w:tr></w:tbl>")
        bx = Path(td) / "bars.hwpx"
        _hwpx(bx, f"<hp:p><hp:run><hp:tbl><hp:tr>{_tc('Ⅴ')}{_tc('사업예산')}</hp:tr></hp:tbl></hp:run></hp:p>"
                  f"<hp:p><hp:run><hp:tbl><hp:tr>{_tc('계정항목')}{_tc('금액')}{_tc('산출근거')}</hp:tr>"
                  f"<hp:tr>{_tc('사업인건비')}{_tc('1,200,000원')}{_tc('4회×300,000')}</hp:tr>"
                  f"<hp:tr>{_tc('합계')}{_tc('1,200,000원')}{_tc('')}</hp:tr></hp:tbl></hp:run></hp:p>")
        bl = _mark_headings(_hwpx_lines(bx))
        reg.append(("hwpx 표 경계(번호바 + 예산표)", "## 사업예산" in bl and not _check_budget_tables("\n".join(bl), "t", DEFAULT_TOLERANCE)[0]))
        reg.append(("병합 정렬·vMerge·cellAddr 없는 표", [ln for ln in _hwpx_lines(mx) if ln.startswith("|")] == ["| A | B | C |", "| A | D | E |", "| x | y |"]
                    and [ln for ln in _docx_lines(vx) if ln.startswith("|")] == ["| A | B |", "| A | D |"]))

        # ⑤ kb-extract 종료코드·--headings · 내보내기 헤딩 인식 · kb-outline 조각 상한
        xo_md = Path(td) / "x.md"
        _docx(Path(td) / "s.docx", "<w:p><w:r><w:t>짧음</w:t></w:r></w:p>")
        _docx(Path(td) / "h.docx", "<w:p><w:r><w:t>1. 사업 개요</w:t></w:r></w:p>"
                                   "<w:p><w:r><w:t>본문 내용이 스무 자를 넘도록 충분히 길게 씁니다</w:t></w:r></w:p>")
        with zipfile.ZipFile(Path(td) / "broken.docx", "w") as z:
            z.writestr("dummy.txt", "x")
        rcs = (_cli("kb-extract", "hwpx", str(Path(td) / "a.hwp"), "--out", str(xo_md))[0],
               _cli("kb-extract", "docx", str(Path(td) / "s.docx"), "--out", str(xo_md))[0],
               _cli("kb-extract", "docx", str(Path(td) / "broken.docx"), "--out", str(xo_md))[0],
               _cli("kb-extract", "docx", str(Path(td) / "h.docx"), "--headings", "--out", str(xo_md))[0])
        reg.append(("kb-extract 종료코드 2·3·--headings", rcs == (2, 3, 2, 0) and "## 1. 사업 개요" in xo_md.read_text(encoding="utf-8")))
        hl = _mark_headings(["사업 개요", "본문 문장입니다.", "| Ⅱ | 배경과 목적 |", "", "| 1 | 인건비 | 1,000원 |"])
        reg.append(("내보내기 헤딩(번호 없음·번호바)", hl == ["## 사업 개요", "본문 문장입니다.", "## 배경과 목적", "", "| 1 | 인건비 | 1,000원 |"]))
        om = Path(td) / "outline.md"
        om.write_text("## 긴 절\n" + ("가" * 99 + "\n") * 200, encoding="utf-8")
        rc, o, _e = _cli("kb-outline", str(om), "--json", "--chunk", "5000")
        pieces = [r for r in json.loads(o or "[]") if "조각" in r["h"]] if rc == 0 else []
        reg.append(("kb-outline 조각 ≤ --chunk", len(pieces) >= 4 and all(r["chars"] <= 5000 + 100 for r in pieces)))

        # ⑥ doc-stamp — 블록 매핑 교체 · 픽스처 왕복(2회, check 경고 없음) · 머리말 없으면 종료 2·파일 그대로
        sd = Path(td) / "stamp"
        sd.mkdir()
        (sd / "brief.md").write_text("---\nid: t\ntype: plan\nfinal_from:\n  draft: draft.md\n  sha1: 000000000000\n  at: 2026-01-01\n"
                                     "status: draft\n---\n본문\n", encoding="utf-8")
        (sd / "draft.md").write_text("v0\n", encoding="utf-8")
        (sd / "draft-v2.md").write_text("v2\n", encoding="utf-8")
        rc, _o, _e = _cli("doc-stamp", str(sd))
        try:
            fm_s = y.safe_load((sd / "brief.md").read_text(encoding="utf-8").split("---")[1]) or {}
        except Exception:  # noqa: BLE001
            fm_s = {}
        ffs = fm_s.get("final_from") or {}
        reg.append(("doc-stamp 블록 매핑", rc == 0 and ffs.get("draft") == "draft-v2.md" and str(ffs.get("sha1")) == _sha12(b"v2\n")
                    and fm_s.get("status") == "draft"))
        rt = Path(td) / "stamp-rt"
        shutil.copytree(FIXTURE_PLAN, rt)
        rc = _cli("doc-stamp", str(rt))[0] + _cli("doc-stamp", str(rt))[0]
        bt = (rt / "brief.md").read_text(encoding="utf-8")
        reg.append(("doc-stamp → check 왕복", rc == 0 and bt.count("final_from:") == 1
                    and not any(r[1] in ("final 갱신 필요", "final_from 없음") for r in run_check(rt))))
        nf = Path(td) / "stamp-nofm"
        nf.mkdir()
        (nf / "brief.md").write_text("머리말 없음\n", encoding="utf-8")
        (nf / "draft.md").write_text("v0\n", encoding="utf-8")
        rc = _cli("doc-stamp", str(nf))[0]
        reg.append(("doc-stamp 머리말 없음 → 2·무변경", rc == 2 and (nf / "brief.md").read_text(encoding="utf-8") == "머리말 없음\n"))

        # ⑦ kb-select — 하위 절 제외 보고 · 합성 색인으로 예산 초과 drop·상하위 치환
        rc, o, _e = _cli("kb-select", "--cmd", "idea", "--exclude", "kb/09-성과실적.md#1/1.1", "--emit", "basis", "--strict")
        reg.append(("kb-select 하위 절 제외 보고", rc == 1 and "제외 불가" in o))
        ip, cp = Path(td) / "i.yaml", Path(td) / "c.yaml"
        ip.write_text(y.safe_dump({"sections": [{"a": "kb/01-a.md#1", "l": 3, "e": 20, "c": 500, "s": "캠페인 개요", "k": ["캠페인"]},
                                                {"a": "kb/01-a.md#1/1.1", "l": 5, "e": 10, "c": 200, "s": "", "k": []},
                                                {"a": "kb/01-a.md#2", "l": 21, "e": 40, "c": 900, "s": "", "k": []}]},
                                  allow_unicode=True), encoding="utf-8")
        cp.write_text(y.safe_dump({"defaults": {"t": ["01#1/1.1", "01#1", "01#2"]}}, allow_unicode=True), encoding="utf-8")
        rc, o, _e = _cli("kb-select", "--cmd", "t", "--budget", "1000", "--emit", "basis", "--strict", "--index", str(ip), "--config", str(cp))
        ks = (y.safe_load(o) or {}) if rc == 0 else {}
        reg.append(("kb-select 예산 drop·상하위 치환", ks.get("sections_read") == ["kb/01-a.md#1"] and ks.get("chars_read") == 500
                    and ks.get("dropped") == ["kb/01-a.md#2"]))

        # ⑧ R4 표식 경로 · R8 형제 약식·[id=]·인용값·R8b · review(src·review_as·internal) · section_map
        r4w = _plan_dir("r4", "## 1. 사업 개요\n교재비 123,457원 (추정)\n강사비 123,458원, 교재비 50,001원(추정)\n보조강사비 300,000원(산출: 100,000×3)\n")
        run_check(r4w)
        r4 = sorted((r[0], r[3], r[4].split()[0]) for r in _rows_x(r4w) if r[1].startswith("R4 "))
        reg.append(("R4 표식 경로(추정·뒤 금액·맞는 산출)", r4 == [("FAIL", 3, "123,458원"), ("WARN", 2, "123,457원"), ("WARN", 3, "50,001원")]))
        ff = Path(td) / "f.yaml"
        ff.write_text("program: {credit_line: c, period: {year1_start: 2026-01-01, year1_end: 2026-12-31}}\n"
                      "units: [{id: research, name: 기초연구}]\n"
                      "outcomes: {activity_counts: {forum_sessions_done: 2, coffee_truck_done: 1}}\n", encoding="utf-8")
        r8w = _plan_dir("r8", "## 1. 사업 개요\n기간 2026-01-01 ~ 2026-12-31 <!-- facts: program.period.year1_start, year1_end -->\n"
                              "토론회 2회, 커피차 1회 진행했다 <!-- facts: outcomes.activity_counts.forum_sessions_done, coffee_truck_done -->\n"
                              "연구 <!-- facts: units[id=research].name -->\n토론회 9회 <!-- facts: outcomes.activity_counts.forum_sessions_done -->\n")
        with contextlib.redirect_stdout(io.StringIO()):
            cmd_check(argparse.Namespace(out_dir=str(r8w), facts=str(ff), strict=False))
        reg.append(("R8 형제 약식·[id=]·인용값·R8b", {(r[1], r[3]) for r in _rows_x(r8w) if r[1].startswith("R8")} == {("R8 인용값", 5)}))
        rv = _plan_dir("rv", "## 1. 사업 개요\n기타 77,777원 소요. 캠페인 30회\n", "review_as: plan\n", btype="review", src=True)
        (rv / "brief.md").write_text((rv / "brief.md").read_text(encoding="utf-8").replace("audience: 재단", "audience: internal"), encoding="utf-8")
        need = {("FAIL", "R4 금액", "src/대상.md"), ("FAIL", "R2 deprecated", "src/대상.md"), ("FAIL", "R9 필수 절", "src/대상.md")}
        reg.append(("review(src·review_as·internal)", not (need - {r[:3] for r in run_check(rv)})))
        heads = "\n".join(f"## {i}. {'리스크 관리' if h == '위험과 대응' else h}" for i, h in enumerate(req10, 1)) + "\n"
        smw = _plan_dir("smap", heads, "section_map: {위험과 대응: 리스크 관리}\n")
        reg.append(("R9 section_map", not any(r[1] == "R9 필수 절" for r in run_check(smw))))

        # ⑨ kb-index — 앵커·범위·펜스·하위·overrides · 머리말 오류 종료 2
        kbd = Path(td) / "g" / "kb"
        kbd.mkdir(parents=True)
        (kbd / "01-t.md").write_text("---\nkb: t\n---\n# T\n서두\n## 1. 가\n본문\n```\n## 코드 안\n```\n### 1.1 나\n하위\n## 2. 다\n끝\n", encoding="utf-8")
        (kbd / "kb-index.overrides.yaml").write_text('"kb/01-t.md#1": {s: "요약 교체"}\n', encoding="utf-8")
        gi = Path(td) / "g.yaml"
        with contextlib.redirect_stdout(io.StringIO()):
            cmd_kb_index(argparse.Namespace(kb=str(kbd), out=str(gi), check=False, raw=False))
        gsecs = (_load_index(gi) or {}).get("sections") or []
        amap = {s_["a"]: (s_["l"], s_["e"]) for s_ in gsecs}
        reg.append(("kb-index 앵커·범위·펜스·overrides", amap.get("kb/01-t.md#1") == (6, 12) and amap.get("kb/01-t.md#1/1.1") == (11, 12)
                    and amap.get("kb/01-t.md#2") == (13, 15) and not any("코드" in a for a in amap)
                    and next((s_.get("s") for s_ in gsecs if s_["a"] == "kb/01-t.md#1"), None) == "요약 교체"))
        (kbd / "02-bad.md").write_text("---\nkb: t\ntitle: [a, b\n---\n", encoding="utf-8")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            rc = cmd_kb_index(argparse.Namespace(kb=str(kbd), out=str(gi), check=False, raw=False))
        reg.append(("kb-index 머리말 오류 → 2", rc == 2 and "02-bad.md" in buf.getvalue()))

        bad_reg = [n for n, good in reg if not good]
        if bad_reg:
            ok = False; print(f"FAIL 회귀: {bad_reg}")
        else:
            print(f"회귀(리뷰 결함·테스트 공백)  {len(reg)}건 ✓")
        # 5) kb-index 재현성
        kb_tmp = Path(td) / "kb"
        shutil.copytree(KB, kb_tmp, ignore=shutil.ignore_patterns("_raw", "kb-index.yaml", "_index.yaml"))
        outs = []
        for i in (1, 2):
            o = Path(td) / f"idx{i}.yaml"
            with contextlib.redirect_stdout(io.StringIO()):
                rc = cmd_kb_index(argparse.Namespace(kb=str(kb_tmp), out=str(o), check=False, raw=False))
            outs.append((rc, o))
        same = outs[0][0] == 0 and outs[1][0] == 0 and filecmp.cmp(outs[0][1], outs[1][1], shallow=False)
        with contextlib.redirect_stdout(io.StringIO()):
            fresh = cmd_kb_index(argparse.Namespace(kb=str(kb_tmp), out=str(outs[1][1]), check=True, raw=False)) == 0
        stale_p = kb_tmp / "05-일정.md"
        stale_p.write_text(stale_p.read_text(encoding="utf-8") + "\n<!-- stale -->\n", encoding="utf-8")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            stale = cmd_kb_index(argparse.Namespace(kb=str(kb_tmp), out=str(outs[1][1]), check=True, raw=False)) == 1 and "05-일정.md" in buf.getvalue()
        print(f"kb-index 재현성  {'동일 ✓' if same else '불일치 ✗'} · --check 최신 {'0 ✓' if fresh else '≠0 ✗'} · 오래됨 {'1 ✓' if stale else '≠1 ✗'}")
        ok = ok and same and fresh and stale
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


# ---------------------------------------------------------------- kb-index · kb-select · kb-outline (F-16)
# 설계: docs/02-design/features/사업기획-AI-도우미.design.md §3.3 · §6.1 ~ §6.3

KB_INDEX = KB / "kb-index.yaml"
KB_SELECT = KB / "kb-select.yaml"
KB_BUDGET = 60000          # 서브커맨드당 읽기 예산 (문자 수)
RAW_MAX_SECTION = 15000    # 이보다 긴 raw 구간은 RAW_CHUNK 단위로 재분할
RAW_CHUNK = 12000
DENYLIST = REPO / "data" / "pii-denylist.txt"
ALLOWLIST = REPO / "data" / "pii-allowlist.txt"

# 키워드 불용어 — 너무 흔해서 섹션을 구분하지 못하는 말
KB_STOPWORDS = frozenset("""그리고 그러나 또한 또는 대한 위한 위해 통해 통한 이후 이전 경우 관련 대상 내용 사항 방법 활동 사업 운영 진행 지원 참고 기준
필요 가능 사용 포함 제공 작성 확인 단체 재단 이상 이하 각각 모든 있는 없는 있다 없다 한다 하는 하고 하며 된다 되는 이다 것을 것이 것은
이를 이는 그것 우리 저희 해당 아래 위의 다음 기존 현재 현행 전체 일부 주요 세부 기타 항목 계획 예산 문서 자료 정리 표기 수치 근거 인용""".split())
# 조사 접미 (긴 것 먼저) — 토큰 끝에서 떼어 낸다. 남는 길이가 2자 미만이면 떼지 않는다
KB_JOSA = ("에서는", "으로는", "에서", "으로", "까지", "부터", "이며", "이고", "에게", "처럼", "보다",
           "은", "는", "이", "가", "을", "를", "의", "에", "로", "과", "와", "도", "만")
_TOKEN_RE = re.compile(r"[가-힣A-Za-z][가-힣A-Za-z0-9]{1,9}")
_HEADING_NUM_RE = re.compile(r"^(?:(\d+(?:\.\d+)+)[.)]?|(\d+)[.)])\s+(.*)$")   # 1.1 X · 1. X · 1) X (2027 X 는 번호 아님)
_RAW_HEAD_RES = [re.compile(r"^제\s*\d+\s*장"), re.compile(r"^\d+\.\s+\S"),
                 re.compile(r"^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.\s"), re.compile(r"^[가-힣]\.\s")]
_PAGE_MARK_RE = re.compile(r"^<!--\s*page:\s*(\d+)\s*-->")
_SHORTHAND_RE = re.compile(r"^(\d{2})#(.*)$")            # 01#1  → kb/01-*.md#1
_SHORTHAND02_RE = re.compile(r"^02/([^#]+)#(.*)$")       # 02/캠페인#*  → kb/02-단위사업/캠페인.md#*
_UNIT_RE = re.compile(r"^\{unit\}\.(kb|h09)(?:#(.*))?$")  # {unit}.kb#*  · {unit}.h09


def _sha12(data: bytes) -> str:
    import hashlib
    return hashlib.sha1(data).hexdigest()[:12]


def _kb_tokens(text: str) -> list[str]:
    out = []
    for m in _TOKEN_RE.finditer(text):
        t = m.group(0)
        if re.fullmatch(r"[A-Za-z0-9]+", t):
            t = t.lower()
        elif re.search(r"[가-힣]", t):
            for j in KB_JOSA:
                if t.endswith(j) and len(t) - len(j) >= 2:
                    t = t[: -len(j)]
                    break
        if len(t) < 2 or len(t) > 8 or t in KB_STOPWORDS:
            continue
        out.append(t)
    return out


def _kb_keywords(body: str, unit_shorts: list[str], limit: int = 8) -> list[str]:
    from collections import Counter
    cnt = Counter(_kb_tokens(body))
    ranked = [t for t, _ in sorted(cnt.items(), key=lambda x: (-x[1], x[0]))]
    ks = [u for u in unit_shorts if u and u in body]
    for t in ranked:
        if len(ks) >= limit:
            break
        if t not in ks:
            ks.append(t)
    return ks[:limit]


def _kb_summary(lines: list[str], l: int, e: int) -> str:
    """헤딩 다음 첫 문장 ≤120자. 표·인용·주석·펜스 제외, 목록은 기호만 뗀다. 문단이 없으면 첫 표 행의 셀."""
    body = lines[l:e]  # lines 는 0-based, 헤딩은 index l-1
    table_fallback = ""
    for line in body:
        s = line.strip()
        if not s or s.startswith(("```", "<!--", "---", "#")):
            continue
        if s.startswith("|"):
            if not table_fallback:
                cells = [c.strip() for c in s.strip("|").split("|") if c.strip() and not set(c.strip()) <= set("-:")]
                table_fallback = " · ".join(cells)
            continue
        if s.startswith(">"):
            continue
        s = re.sub(r"^(?:[-*]|\d+[.)])\s+", "", s)
        s = re.sub(r"\*\*|`|__", "", s)
        s = re.sub(r"\s+", " ", s).strip()
        if s:
            return s[:120]
    return table_fallback[:120]


def _anchor_token(title: str) -> str:
    m = _HEADING_NUM_RE.match(title)
    if m:
        return m.group(1) or m.group(2)
    t = re.sub(r"\([^)]*\)", "", title)
    t = re.sub(r"[*`]", "", t).strip()
    t = re.sub(r"\s+", "-", t)
    return t[:20]


def _kb_headings(lines: list[str]) -> list[tuple[int, str, int]]:
    fence = False
    heads = []
    for i, line in enumerate(lines, 1):
        if line.startswith("```"):
            fence = not fence
            continue
        if fence:
            continue
        if line.startswith("## "):
            heads.append((2, line[3:].strip(), i))
        elif line.startswith("### "):
            heads.append((3, line[4:].strip(), i))
    return heads


def _kb_file_sections(rel: str, text: str, unit_shorts: list[str]) -> list[dict]:
    lines = text.split("\n")
    n = len(lines)
    heads = _kb_headings(lines)
    secs = []
    first2 = next((l for lv, _, l in heads if lv == 2), n + 1)
    # #0 서두 (frontmatter 다음 ~ 첫 ## 이전, H1 포함)
    body_start = 1
    if lines and lines[0] == "---":
        for i in range(1, n):
            if lines[i] == "---":
                body_start = i + 2
                break
    e0 = first2 - 1 if first2 <= n else n
    chunk0 = "\n".join(lines[body_start - 1:e0])
    secs.append({"a": f"{rel}#0", "l": body_start, "e": e0, "c": len(chunk0), "s": _kb_summary(lines, body_start, e0), "k": _kb_keywords(chunk0, unit_shorts)})
    parent = None
    used: dict[str, int] = {}
    for idx, (lv, title, l) in enumerate(heads):
        e = n
        for lv2, _, l2 in heads[idx + 1:]:
            if lv2 <= lv:
                e = l2 - 1
                break
        tok = _anchor_token(title)
        if lv == 2:
            a = f"{rel}#{tok}"
            parent = a
        else:
            a = f"{parent or rel + '#0'}/{tok}"
        if a in used:
            used[a] += 1
            a = f"{a}-{used[a]}"
        else:
            used[a] = 1
        chunk = "\n".join(lines[l - 1:e])
        secs.append({"a": a, "l": l, "e": e, "c": len(chunk), "s": _kb_summary(lines, l, e), "k": _kb_keywords(chunk, unit_shorts)})
    return secs


def _dump_flow(d) -> str:
    return _yaml().safe_dump(d, default_flow_style=True, allow_unicode=True, width=100000, sort_keys=False).strip()


def _kb_scan_files(kb: Path) -> tuple[dict, list[str]]:
    """frontmatter 에 kb: 가 있는 md 를 모은다. 반환: ({rel: {path, fm, text}}, 파싱 실패 목록)"""
    files, failures = {}, []
    for p in sorted(list(kb.glob("*.md")) + list(kb.glob("02-단위사업/*.md"))):
        text = p.read_text(encoding="utf-8")
        m = re.match(r"^---\n(.*?)\n---\n?(.*)$", text, re.S)
        if not m:
            continue
        try:
            fm = _yaml().safe_load(m.group(1)) or {}
        except Exception as e:  # noqa: BLE001
            failures.append(f"{p.relative_to(kb.parent)}: {str(e).splitlines()[0][:80]}")
            continue
        if "kb" not in fm:
            continue
        files[str(p.relative_to(kb.parent))] = {"path": p, "fm": fm, "text": text}
    return files, failures


def _index_header_and_files(kb: Path, files: dict) -> tuple[dict, dict]:
    facts_p = kb / "facts.yaml"
    facts = load_facts(facts_p) if facts_p.exists() else {}
    meta = facts.get("meta") or {}
    hdr = {"schema": 1, "facts_as_of": meta.get("as_of"), "outcomes_as_of": meta.get("outcomes_as_of")}
    fmap: dict[str, dict] = {}
    if facts_p.exists():
        fmap[str(facts_p.relative_to(kb.parent))] = {"sha1": _sha12(facts_p.read_bytes())}
    ov = kb / "kb-index.overrides.yaml"
    if ov.exists():
        fmap[str(ov.relative_to(kb.parent))] = {"sha1": _sha12(ov.read_bytes())}
    for rel, f in files.items():
        fm = f["fm"]
        fmap[rel] = {"layer": fm.get("layer", ""), "as_of": str(fm.get("as_of", "")), "sha1": _sha12(f["text"].encode("utf-8")), "chars": len(f["text"])}
    return hdr, fmap


def _write_index(out: Path, hdr: dict, fmap: dict, sections: list[dict]) -> None:
    lines = [f"schema: {hdr['schema']}", f"facts_as_of: {hdr.get('facts_as_of') or 'null'}",
             f"outcomes_as_of: {hdr.get('outcomes_as_of') or 'null'}", "files:"]
    for rel, v in fmap.items():
        lines.append(f"  {rel}: {_dump_flow(v)}")
    lines.append("sections:")
    for s in sections:
        lines.append(f"  - {_dump_flow(s)}")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _load_index(path: Path) -> dict | None:
    if not path.exists():
        return None
    return _yaml().safe_load(path.read_text(encoding="utf-8")) or {}


def _apply_overrides(sections: list[dict], kb: Path = KB) -> int:
    ov_p = kb / "kb-index.overrides.yaml"
    if not ov_p.exists():
        return 0
    ov = _yaml().safe_load(ov_p.read_text(encoding="utf-8")) or {}
    by_a = {s["a"]: s for s in sections}
    miss = 0
    for a, patch in ov.items():
        if a in by_a and isinstance(patch, dict):
            for k in ("s", "k"):
                if k in patch:
                    by_a[a][k] = patch[k]
        else:
            miss += 1
            eprint(f"WARN override 미적용: {a}")
    return miss


def _raw_sections(rel: str, text: str, unit_shorts: list[str]) -> list[dict]:
    lines = text.split("\n")
    n = len(lines)
    cands = []  # (line_no, key)
    for i, line in enumerate(lines, 1):
        s = line.strip()
        if any(r.match(s) for r in _RAW_HEAD_RES):
            cands.append((i, re.sub(r"[\s.·…\d]+$", "", s)))
    # 목차 제외: 같은 텍스트가 뒤에 다시 나오면 앞 것을 버린다
    last = {}
    for i, key in cands:
        last[key] = i
    starts = sorted(set(last.values()))
    if len(starts) < 5:
        pages = [i for i, line in enumerate(lines, 1) if _PAGE_MARK_RE.match(line.strip())]
        starts = pages[::5] if pages else []
    ranges: list[tuple[int, int]] = []
    if starts:
        if starts[0] > 1:
            starts = [1] + starts
        for j, st in enumerate(starts):
            en = starts[j + 1] - 1 if j + 1 < len(starts) else n
            ranges.append((st, en))
    else:
        # 12,000자 청크
        st, acc = 1, 0
        for i, line in enumerate(lines, 1):
            acc += len(line) + 1
            if acc >= RAW_CHUNK:
                ranges.append((st, i)); st, acc = i + 1, 0
        if st <= n:
            ranges.append((st, n))
    # 15,000자 초과 구간 재분할
    final: list[tuple[int, int]] = []
    for st, en in ranges:
        if sum(len(x) + 1 for x in lines[st - 1:en]) <= RAW_MAX_SECTION:
            final.append((st, en)); continue
        cs, acc = st, 0
        for i in range(st, en + 1):
            acc += len(lines[i - 1]) + 1
            if acc >= RAW_CHUNK and i < en:
                final.append((cs, i)); cs, acc = i + 1, 0
        final.append((cs, en))
    secs = []
    for st, en in final:
        chunk = "\n".join(lines[st - 1:en])
        head = next((x.strip() for x in lines[st - 1:en] if x.strip() and not _PAGE_MARK_RE.match(x.strip())), "")
        secs.append({"a": f"{rel}#L{st}", "l": st, "e": en, "c": len(chunk), "s": re.sub(r"\s+", " ", head)[:120], "k": _kb_keywords(chunk, unit_shorts)})
    return secs


def _unit_shorts() -> list[str]:
    try:
        facts = load_facts()
    except Exception:  # noqa: BLE001
        return []
    return [str(u.get("short")) for u in (facts.get("units") or []) if u.get("short")]


def cmd_kb_index(args) -> int:
    kb = Path(args.kb).resolve()
    shorts = _unit_shorts()
    if args.raw:
        raw = kb / "_raw"
        if not raw.exists():
            print("kb-index --raw  _raw 없음 — 건너뜀"); return 0
        fmap, sections = {}, []
        for p in sorted(raw.glob("*.md")):
            text = p.read_text(encoding="utf-8", errors="ignore")
            rel = str(p.relative_to(kb.parent))
            fmap[rel] = {"sha1": _sha12(text.encode("utf-8")), "chars": len(text)}
            sections += _raw_sections(rel, text, shorts)
        hdr = {"schema": 1, "facts_as_of": None, "outcomes_as_of": None}
        out = raw / "_index.yaml"
        if args.check:
            old = _load_index(out)
            if not old or {k: v["sha1"] for k, v in (old.get("files") or {}).items()} != {k: v["sha1"] for k, v in fmap.items()}:
                print("kb-index --raw --check  오래됨"); return 1
            print("kb-index --raw --check  최신"); return 0
        _write_index(out, hdr, fmap, sections)
        print(f"kb-index --raw  {len(fmap)}파일 {len(sections)}구간 → {out}")
        return 0

    files, failures = _kb_scan_files(kb)
    if failures:
        for f in failures:
            print(f"FAIL {f}: frontmatter — 대괄호·#·콜론·쉼표가 든 값은 따옴표로 감싸세요")
        return 2
    hdr, fmap = _index_header_and_files(kb, files)
    out = Path(args.out) if args.out else kb / "kb-index.yaml"
    if args.check:
        old = _load_index(out)
        cur = {k: v["sha1"] for k, v in fmap.items()}
        prev = {k: v.get("sha1") for k, v in ((old or {}).get("files") or {}).items()}
        if old is None or cur != prev:
            changed = sorted(k for k in set(cur) | set(prev) if cur.get(k) != prev.get(k))
            print("kb-index --check  오래됨: " + (", ".join(changed) if changed else "색인 없음")); return 1
        print("kb-index --check  최신"); return 0
    sections = []
    for rel, f in files.items():
        sections += _kb_file_sections(rel, f["text"], shorts)
    _apply_overrides(sections, kb)
    _write_index(out, hdr, fmap, sections)
    print(f"kb-index  {len(files)}파일 {len(sections)}섹션 {sum(f['text'].__len__() for f in files.values()):,}자 → {out}")
    return 0


# ---------------------------------------------------------------- kb-select

def _expand_anchor(spec: str, index: dict, sel_cfg: dict, unit: str | None, kb_root_rel: str = "kb") -> tuple[list[str], str | None]:
    """약식 앵커 → 정규 앵커 목록. 반환 (앵커들, 실패 사유|None)"""
    secs = index.get("sections") or []
    by_a = {s["a"]: s for s in secs}
    paths = sorted({s["a"].split("#", 1)[0] for s in secs})

    def top_sections(path: str) -> list[str]:
        return [s["a"] for s in secs if s["a"].startswith(path + "#") and "/" not in s["a"][len(path) + 1:] and not s["a"].endswith("#0")]

    m = _UNIT_RE.match(spec)
    if m:
        if not unit:
            return [], "unit 없음"
        u = (sel_cfg.get("units") or {}).get(unit)
        if not u:
            return [], f"units.{unit} 정의 없음"
        if m.group(1) == "h09":
            a = u.get("h09")
            return ([a], None) if a in by_a else ([], f"{a} 없음")
        path = u.get("kb")
        if not path:
            fb = u.get("kb_fallback") or []
            out, errs = [], []
            for x in fb:
                r, err = _expand_anchor(x, index, sel_cfg, unit)
                out += r
                if err:
                    errs.append(err)
            return out, ("; ".join(errs) or None)
        rest = m.group(2) or "*"
        spec = f"{path}#{rest}"
    m2 = _SHORTHAND02_RE.match(spec)
    if m2:
        spec = f"{kb_root_rel}/02-단위사업/{m2.group(1)}.md#{m2.group(2)}"
    m1 = _SHORTHAND_RE.match(spec)
    if m1:
        cands = [p for p in paths if re.match(rf"^{kb_root_rel}/{m1.group(1)}-[^/]+\.md$", p)]
        if len(cands) != 1:
            return [], f"{spec}: 파일 {len(cands)}개 매칭"
        spec = f"{cands[0]}#{m1.group(2)}"
    if "#" not in spec:
        return [], f"{spec}: 앵커 형식 아님"
    path, rest = spec.split("#", 1)
    if rest == "*":
        r = top_sections(path)
        return (r, None) if r else ([], f"{spec}: 섹션 없음")
    a = f"{path}#{rest}"
    return ([a], None) if a in by_a else ([], f"{a} 없음")


def cmd_kb_select(args) -> int:
    index = _load_index(Path(args.index))
    if index is None:
        eprint("FAIL kb-index.yaml 없음 — promo.py kb-index 를 먼저 실행"); return 2
    cfg = _yaml().safe_load(Path(args.config).read_text(encoding="utf-8")) if Path(args.config).exists() else {}
    secs = list(index.get("sections") or [])
    raw_index = Path(args.index).parent / "_raw" / "_index.yaml"     # --index 를 바꾸면 raw 색인도 그 옆 것
    if args.raw and raw_index.exists():
        secs += list((_load_index(raw_index) or {}).get("sections") or [])
    order = {s["a"]: i for i, s in enumerate(secs)}
    by_a = {s["a"]: s for s in secs}
    missing: list[str] = []
    wanted: list[tuple[str, str]] = []  # (anchor, why)
    for spec in (cfg.get("defaults") or {}).get(args.cmd) or []:
        got, err = _expand_anchor(str(spec), {"sections": [s for s in secs if not s["a"].startswith("kb/_raw/")]}, cfg, args.unit)
        if err and not got:
            if "unit 없음" not in err:
                missing.append(f"{spec} ({err})")
            continue
        wanted += [(a, "default") for a in got]
    for spec in (args.include or "").split(","):
        spec = spec.strip()
        if not spec:
            continue
        got, err = _expand_anchor(spec, {"sections": secs}, cfg, args.unit)
        if got:
            wanted += [(a, "include") for a in got]
        else:
            missing.append(f"{spec} ({err})")
    excludes: set[str] = set()
    for spec in (args.exclude or "").split(","):
        spec = spec.strip()
        if not spec:
            continue
        got, err = _expand_anchor(spec, {"sections": secs}, cfg, args.unit)
        if got:
            excludes.update(got)
        else:
            missing.append(f"{spec} ({err}) [exclude]")
    # 질의 점수
    tokens = list(dict.fromkeys(_kb_tokens(args.query or "")))
    scored = []
    if tokens:
        for s in secs:
            score = 3 * len(set(s.get("k") or []) & set(tokens)) + sum(1 for t in tokens if t in (s.get("s") or ""))
            if score > 0:
                scored.append((-score, order[s["a"]], s["a"], score))
        scored.sort()
    wanted += [(a, f"query:{sc}") for _, _, a, sc in scored]

    selected: list[dict] = []
    dropped: list[str] = []
    total = 0

    def contains(outer: dict, inner: dict) -> bool:
        return outer["a"].split("#")[0] == inner["a"].split("#")[0] and outer["l"] <= inner["l"] and inner["e"] <= outer["e"] and outer["a"] != inner["a"]

    for a, why in wanted:
        if a in excludes or a not in by_a:
            continue
        s = by_a[a]
        if any(x["a"] == a or contains(x, s) for x in selected):
            continue  # 이미 담김 / 부모가 담김
        inner = [x for x in selected if contains(s, x)]
        new_total = total - sum(x["c"] for x in inner) + s["c"]
        if new_total > args.budget:
            if a not in dropped:
                dropped.append(a)
            continue
        for x in inner:
            selected.remove(x)
        selected.append({"a": a, "path": a.split("#")[0], "l": s["l"], "e": s["e"], "c": s["c"], "why": why})
        total = new_total
    for a in sorted(excludes):                    # 제외한 하위 절이 선택된 상위 절 안에 있으면 빼낼 수 없다 — 조용히 넘기지 않고 보고
        s_ex = by_a.get(a)
        par = next((x for x in selected if s_ex and contains(x, s_ex)), None)
        if par:
            missing.append(f"{a} (상위 {par['a']} 가 선택돼 제외 불가 — 상위를 --exclude) [exclude]")
    selected.sort(key=lambda x: order[x["a"]])
    sel_args = f"--cmd {args.cmd}" + (f" --unit {args.unit}" if args.unit else "") + (f" --query {args.query!r}" if args.query else "") \
        + (" --raw" if args.raw else "") + (f" --include {args.include}" if args.include else "") + (f" --exclude {args.exclude}" if args.exclude else "") \
        + (f" --budget {args.budget}" if args.budget != KB_BUDGET else "")
    if args.emit == "basis":
        out = {"facts_as_of": index.get("facts_as_of"), "outcomes_as_of": index.get("outcomes_as_of"), "select_args": sel_args,
               "sections_read": [x["a"] for x in selected], "chars_read": total, "dropped": dropped, "missing": missing}
    else:
        out = {"cmd": args.cmd, "unit": args.unit, "query": args.query, "budget": args.budget, "selected": selected,
               "chars_read": total, "dropped": dropped, "missing": missing}
    print(_yaml().safe_dump(out, allow_unicode=True, sort_keys=False, width=200), end="")
    return 1 if (args.strict and missing) else 0


# ---------------------------------------------------------------- kb-outline

def cmd_kb_outline(args) -> int:
    p = Path(args.md)
    text = p.read_text(encoding="utf-8", errors="ignore")
    lines = text.split("\n")
    n = len(lines)
    heads = _kb_headings(lines)
    rows = []
    if heads:
        first = heads[0][2]
        if first > 1:
            rows.append({"h": "(서두)", "level": 0, "l": 1, "e": first - 1})
        for i, (lv, title, l) in enumerate(heads):
            e = n
            for lv2, _, l2 in heads[i + 1:]:
                if lv2 <= lv:
                    e = l2 - 1; break
            rows.append({"h": title, "level": lv, "l": l, "e": e})
    else:
        rows.append({"h": "(헤딩 없음)", "level": 0, "l": 1, "e": n})
    out = []
    for r in rows:
        chars = sum(len(x) + 1 for x in lines[r["l"] - 1:r["e"]])
        r["chars"] = chars
        out.append(r)
        if args.chunk and chars > args.chunk:
            cs, acc = r["l"], 0
            for i in range(r["l"], r["e"] + 1):
                acc += len(lines[i - 1]) + 1
                if acc >= min(RAW_CHUNK, args.chunk) and i < r["e"]:     # 조각 ≤ --chunk (기본 15,000 → 12,000 단위)
                    out.append({"h": f"  ↳ 조각", "level": r["level"] + 1, "l": cs, "e": i, "chars": acc}); cs, acc = i + 1, 0
            out.append({"h": f"  ↳ 조각", "level": r["level"] + 1, "l": cs, "e": r["e"], "chars": acc})
    if args.json:
        print(json.dumps(out, ensure_ascii=False, indent=1)); return 0
    print(f"# {p}  ({n}줄 · {len(text):,}자)")
    print("| 헤딩 | l | e | chars |\n|---|---|---|---|")
    for r in out:
        print(f"| {'  ' * max(0, r['level'] - 1)}{r['h']} | {r['l']} | {r['e']} | {r['chars']:,} |")
    return 0


# ---------------------------------------------------------------- 문단 단위 추출 (hwpx · docx) — kb-extract 와 check 공용

_HP = "http://www.hancom.co.kr/hwpml/2011/paragraph"
_HS = "http://www.hancom.co.kr/hwpml/2011/section"
_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
_W_STRICT = "http://purl.oclc.org/ooxml/wordprocessingml/main"
_MAX_SPAN, _MAX_ADDR = 64, 300                    # 병합 셀 크기·주소 상한 — 사용자 파일의 속성값으로 메모리를 키우지 않게


def _bounded_int(v, default: int, lo: int, hi: int) -> int:
    try:
        n = int(str(v).strip())
    except (TypeError, ValueError):
        return default
    return max(lo, min(n, hi))


def _xml(data: bytes):
    """사용자 파일(hwpx·docx·xlsx)의 XML — 외부 엔티티·네트워크·거대 트리 불허"""
    from lxml import etree
    return etree.fromstring(data, etree.XMLParser(resolve_entities=False, no_network=True, huge_tree=False))


def _hwpx_lines(path: Path) -> list[str]:
    """hp:p 하나 = 줄 하나. 표는 hp:tr 마다 md 행. 병합 셀은 hp:cellAddr(행·열)+hp:cellSpan(colSpan·rowSpan)으로 그리드에
    놓고 값을 반복해 열이 밀리지 않게 한다 (G4). cellAddr 가 없는 표는 셀 순서대로. 중첩 표는 부모 셀 텍스트에 포함."""
    import zipfile
    P, T, TBL, TR, TC = f"{{{_HP}}}p", f"{{{_HP}}}t", f"{{{_HP}}}tbl", f"{{{_HP}}}tr", f"{{{_HP}}}tc"
    SPAN, ADDR = f"{{{_HP}}}cellSpan", f"{{{_HP}}}cellAddr"
    lines: list[str] = []

    def in_tbl(el) -> bool:
        return any(anc.tag == TBL for anc in el.iterancestors())

    def nearest_p(el):
        return next((anc for anc in el.iterancestors() if anc.tag == P), None)

    SEP_WS = {f"{{{_HP}}}{x}" for x in ("tab", "lineBreak", "nbSpace", "fwSpace")}
    HYPHEN = f"{{{_HP}}}hyphen"

    def t_text(t) -> str:                      # hp:t 안 탭·줄바꿈 요소는 공백 — "010-…<hp:tab/>2026" 이 숫자로 붙지 않게
        parts = [t.text or ""]
        for ch in t:
            parts.append(" " if ch.tag in SEP_WS else "-" if ch.tag == HYPHEN else "".join(ch.itertext()))
            parts.append(ch.tail or "")
        return "".join(parts)

    def cell_text(tc) -> str:                  # 한 문단의 run 은 붙이고, 문단 사이는 공백 — "100"·"200" 이 100200 이 되지 않게
        parts: dict = {}
        for t in tc.iter(T):
            parts.setdefault(nearest_p(t), []).append(t_text(t))
        return " ".join("".join(v) for v in parts.values()).strip()

    with zipfile.ZipFile(path) as z:
        secs = sorted((n for n in z.namelist() if re.fullmatch(r"Contents/section\d+\.xml", n)),
                      key=lambda n: int(re.search(r"(\d+)\.xml$", n).group(1)))       # section10 이 section2 앞에 오지 않게
        for n in secs:
            root = _xml(z.read(n))
            for p in root.iter(P):
                if in_tbl(p):
                    continue
                # 글상자(hp:rect/drawText) 안 문단은 자기 차례(root.iter)에 따로 나오므로 여기서는 직속 텍스트만 (N1)
                own = "".join(t_text(t) for t in p.iter(T) if nearest_p(t) is p).strip()
                if own:
                    lines.append(re.sub(r"\s+", " ", own))
                for tbl in p.iter(TBL):
                    if nearest_p(tbl) is not p:
                        continue
                    grid: dict[int, dict[int, str]] = {}
                    seq_rows: list[list[str]] = []
                    for tr in tbl.iter(TR):
                        if any(a.tag == TBL and a is not tbl for a in tr.iterancestors()):
                            continue
                        seq: list[str] = []
                        for tc in tr.iter(TC):
                            if any(a.tag == TBL and a is not tbl for a in tc.iterancestors()):
                                continue
                            txt = re.sub(r"\s+", " ", cell_text(tc)).replace("|", "¦")
                            span, addr = tc.find(SPAN), tc.find(ADDR)
                            cs = _bounded_int(span.get("colSpan"), 1, 1, _MAX_SPAN) if span is not None else 1
                            rs = _bounded_int(span.get("rowSpan"), 1, 1, _MAX_SPAN) if span is not None else 1
                            seq += [txt] * cs
                            if addr is not None:
                                r0 = _bounded_int(addr.get("rowAddr"), 0, 0, _MAX_ADDR)
                                c0 = _bounded_int(addr.get("colAddr"), 0, 0, _MAX_ADDR)
                                for r in range(r0, r0 + rs):
                                    for c in range(c0, c0 + cs):
                                        grid.setdefault(r, {}).setdefault(c, txt)
                        seq_rows.append(seq)
                    if grid:
                        ncol = max(c for row in grid.values() for c in row) + 1
                        for r in sorted(grid):
                            lines.append("| " + " | ".join(grid[r].get(c, "") for c in range(ncol)) + " |")
                    else:
                        lines += ["| " + " | ".join(cells) + " |" for cells in seq_rows]
                    lines.append("")                     # 표 경계 — 번호바 표와 예산표가 한 표로 붙지 않게
    return lines


def _docx_lines(path: Path) -> list[str]:
    """w:p = 줄, w:tbl 은 md 행. 병합 셀은 w:gridSpan 만큼 반복, w:vMerge(continue)는 윗줄 같은 열 값을 이어받는다 (G4)."""
    import zipfile
    lines: list[str] = []
    with zipfile.ZipFile(path) as z:
        root = _xml(z.read("word/document.xml"))
    ns = root.tag[1:].split("}", 1)[0] if root.tag.startswith("{") else _W     # Transitional·Strict(purl.oclc.org) 모두
    BODY, P, T, TBL, TR, TC = (f"{{{ns}}}{x}" for x in ("body", "p", "t", "tbl", "tr", "tc"))
    TCPR, GSPAN, VMERGE, VAL, BR, TAB = (f"{{{ns}}}{x}" for x in ("tcPr", "gridSpan", "vMerge", "val", "br", "tab"))
    body = root.find(BODY)
    if body is None:
        raise ValueError("w:body 없음 — 지원하지 않는 docx 형식")

    def in_tbl(el) -> bool:
        return any(anc.tag == TBL for anc in el.iterancestors())

    def nearest_p(el):
        return next((anc for anc in el.iterancestors() if anc.tag == P), None)

    def para_text(p) -> str:                     # run 은 붙이고 줄바꿈·탭은 공백. 글상자 속 문단은 자기 차례에 따로
        return re.sub(r"\s+", " ", "".join((t.text or "") if t.tag == T else " "
                                           for t in p.iter(T, BR, TAB) if nearest_p(t) is p)).strip()

    def cell_text(tc) -> str:                    # 문단 사이는 공백 — "100"·"200" 이 100200 이 되지 않게
        return " ".join(s for s in (para_text(p) for p in tc.iter(P)) if s)

    for el in body.iter(P, TBL):                 # w:sdt 등으로 감싼 문단·표도 포함, 표 안 문단·중첩 표는 셀 텍스트로 (N9)
        if in_tbl(el):
            continue
        if el.tag == P:
            s = para_text(el)
            if s:
                lines.append(s)
        elif el.tag == TBL:
            prev: list[str] = []
            for tr in el.iter(TR):
                if any(a.tag == TBL and a is not el for a in tr.iterancestors()):
                    continue
                cells: list[str] = []
                for tc in tr.findall(TC):
                    txt = cell_text(tc).replace("|", "¦")
                    pr = tc.find(TCPR)
                    gs = pr.find(GSPAN) if pr is not None else None
                    vm = pr.find(VMERGE) if pr is not None else None
                    n = _bounded_int(gs.get(VAL), 1, 1, _MAX_SPAN) if gs is not None else 1
                    if vm is not None and vm.get(VAL) != "restart" and not txt:
                        txt = prev[len(cells)] if len(cells) < len(prev) else ""
                    cells += [txt] * n
                lines.append("| " + " | ".join(cells) + " |")
                prev = cells
            lines.append("")                             # 표 경계
    return lines


_HEADING_LINE_RES = [re.compile(r"^\d+(?:\.\d+)*[.)]\s+\S"), re.compile(r"^제\s*\d+\s*장"), re.compile(r"^[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+\.\s")]


_BAR_NUM_RE = re.compile(r"^(?:[ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ]+|[IVX]+|\d{1,2})\.?$")


def _known_sections() -> set[str]:
    """골격(content/templates/docs/*.md)의 required_sections — 번호가 지워진 내보내기 헤딩을 알아보는 데 쓴다"""
    out: set[str] = set()
    for t in sorted(TEMPLATES_DOCS.glob("*.md")):
        try:
            fm, _ = read_frontmatter(t)
        except (Exception, SystemExit):  # noqa: BLE001
            continue
        out |= {n for n in (_norm_heading(str(r)) for r in (fm.get("required_sections") or [])) if n}
    return out


def _mark_headings(lines: list[str]) -> list[str]:
    """--headings: 번호·장 줄 → '## '. md2hwpx 내보내기처럼 번호가 없는 헤딩(골격 필수 절 이름의 짧은 줄)과
    proposal 번호바(앞뒤가 표가 아닌 1행 2칸 표 'Ⅰ | 제목'·'1 | 제목')도 헤딩으로 본다 — review 의 R9 오탐 방지"""
    known = _known_sections()
    out: list[str] = []
    for i, s in enumerate(lines):
        if s.startswith("|"):
            single = not (i > 0 and lines[i - 1].startswith("|")) and not (i + 1 < len(lines) and lines[i + 1].startswith("|"))
            cells = [c.strip() for c in s.strip().strip("|").split("|") if c.strip()]
            if single and len(cells) == 2 and _BAR_NUM_RE.match(cells[0]):
                out.append(("### " if cells[0][0].isdigit() else "## ") + cells[1])
            else:
                out.append(s)
        elif any(r.match(s) for r in _HEADING_LINE_RES):
            out.append("## " + s)
        else:
            n = _norm_heading(s)
            short = len(s.strip()) <= 30 and not re.search(r"[.。!?:다]$", s.strip())
            out.append("## " + s if n and short and any(n == k or n.startswith(k) for k in known) else s)
    return out


def _load_denylist() -> tuple[list[str] | None, set[str]]:
    """(denylist 항목|None(파일 없음), allowlist 집합)"""
    import os
    deny_p = Path(os.environ.get("PROMO_DENYLIST") or DENYLIST)
    allow_p = Path(os.environ.get("PROMO_ALLOWLIST") or ALLOWLIST)
    allow = set()
    if allow_p.exists():
        allow = {x.strip() for x in allow_p.read_text(encoding="utf-8").splitlines() if x.strip() and not x.startswith("#")}
    if not deny_p.exists():
        return None, allow
    deny = [x.strip() for x in deny_p.read_text(encoding="utf-8").splitlines() if x.strip() and not x.startswith("#")]
    return [d for d in deny if d not in allow], allow


def _pii_findings(text: str, deny: list[str] | None) -> list[tuple[str, int, str]]:
    out = []
    for label, rx in PII_PATTERNS.items():
        for m in rx.finditer(text):
            out.append((label, _line_of(text, m.start()), m.group(0)))
    for d in deny or []:
        for m in re.finditer(re.escape(d), text):
            out.append(("denylist", _line_of(text, m.start()), d))
    return sorted(out, key=lambda x: (x[1], x[0]))



# ---------------------------------------------------------------- exec-summary (F-16 §6.10) — 앱 집행내역 엑셀 → 단위사업·계정 합계만

_COL_PREFIX = {"date": "집행일", "sub": "소분류", "account": "유형", "amount": "금액", "status": "상태"}


def _xlsx_rows(path: Path) -> list[list[str]]:
    import zipfile
    from lxml import etree
    NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
    with zipfile.ZipFile(path) as z:
        shared: list[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            for si in _xml(z.read("xl/sharedStrings.xml")).iter(f"{{{NS}}}si"):
                shared.append("".join(si.itertext()))
        sheet = next((n for n in sorted(z.namelist()) if re.fullmatch(r"xl/worksheets/sheet\d+\.xml", n)), None)
        if not sheet:
            return []
        root = _xml(z.read(sheet))
    rows: list[dict[int, str]] = []
    for row in root.iter(f"{{{NS}}}row"):
        cells: dict[int, str] = {}
        for c in row.findall(f"{{{NS}}}c"):
            letters = re.match(r"[A-Z]+", c.get("r", "A")).group(0)
            idx = 0
            for ch in letters:
                idx = idx * 26 + ord(ch) - 64
            t = c.get("t")
            v = c.find(f"{{{NS}}}v")
            if t == "s":
                val = shared[int(v.text)] if v is not None and v.text is not None else ""
            elif t == "inlineStr":
                is_ = c.find(f"{{{NS}}}is")
                val = "".join(is_.itertext()) if is_ is not None else ""
            else:
                val = (v.text or "") if v is not None else ""
            cells[idx - 1] = val
        rows.append(cells)
    width = max((max(r) + 1 for r in rows if r), default=0)
    return [[r.get(i, "") for i in range(width)] for r in rows]


def _csv_rows(path: Path) -> list[list[str]]:
    import csv
    with open(path, encoding="utf-8-sig", newline="") as f:
        return [list(r) for r in csv.reader(f)]


def cmd_exec_summary(args) -> int:
    src = Path(args.src)
    rows = _xlsx_rows(src) if src.suffix.lower() == ".xlsx" else _csv_rows(src)
    hdr_i, col, best = None, {}, 0
    for i, r in enumerate(rows[:10]):             # 머리행 = 필수 열(접두 일치)이 모두 있는 첫 행
        header = [str(c).strip() for c in r]
        cand = {key: next((j for j, h in enumerate(header) if h.startswith(pre)), None) for key, pre in _COL_PREFIX.items()}
        n = sum(v is not None for v in cand.values())
        if n == len(_COL_PREFIX):
            hdr_i, col = i, cand
            break
        best = max(best, n)
    if hdr_i is None:                             # 행 값은 출력하지 않는다 — 수취인·설명 노출 방지
        eprint(f"FAIL 머리행을 찾지 못함 — 필요한 열: {'·'.join(_COL_PREFIX.values())} (앞 10행 중 최대 {best}개 일치). 앱 「Excel 내보내기」 파일을 그대로 쓰세요"); return 2
    umap = _yaml().safe_load(Path(args.map).read_text(encoding="utf-8")) or {} if args.map and Path(args.map).exists() else {}
    by_unit: dict[str, int] = {}
    by_account: dict[str, int] = {}
    status_counts: dict[str, int] = {}
    unmapped: set[str] = set()
    dates: list[str] = []
    used = 0
    for r in rows[hdr_i + 1:]:
        if not any(str(c).strip() for c in r):
            continue
        get = lambda k: str(r[col[k]]).strip() if col[k] < len(r) else ""
        status = get("status")
        status_counts[status or "(없음)"] = status_counts.get(status or "(없음)", 0) + 1
        if status.lower() in ("대기", "pending"):      # 앱 내보내기는 라벨 `대기`, 원시 status 값이면 `pending`
            continue
        amt_s = re.sub(r"[^\d.\-]", "", get("amount"))
        if not re.search(r"\d", amt_s):
            continue
        try:
            amt = int(round(float(amt_s)))
        except ValueError:                        # "1.2.3"·"--5" 같은 값 — 값은 출력하지 않고 건너뛴다
            continue
        sub = get("sub")
        unit = umap.get(sub) or next((u for k, u in umap.items() if sub.startswith(str(k))), None)
        if unit is None:
            unmapped.add(sub); unit = "(unmapped)"
        by_unit[unit] = by_unit.get(unit, 0) + amt
        acc = get("account") or "(없음)"
        by_account[acc] = by_account.get(acc, 0) + amt
        m = DATE_RE.search(get("date"))
        if m:
            dates.append(f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}")
        used += 1
    out = {"as_of": max(dates) if dates else None, "date_range": [min(dates), max(dates)] if dates else None,
           "source_file": src.name, "source_rows": used, "status_counts": status_counts,
           "by_unit": [{"unit": u, "executed": v} for u, v in sorted(by_unit.items())],
           "by_account": dict(sorted(by_account.items())), "unmapped": sorted(unmapped)}
    text = _yaml().safe_dump(out, allow_unicode=True, sort_keys=False)
    if args.out:
        Path(args.out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.out).write_text(text, encoding="utf-8")
        print(f"exec-summary  {used}행 → {args.out}" + (f"  ⚠ unmapped {len(unmapped)}" if unmapped else ""))
    else:
        print(text, end="")
    return 0


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
    k.add_argument("mode", nargs="?", choices=["pdf", "tables", "hwpx", "docx"])
    k.add_argument("--headings", action="store_true", help="번호·장 줄을 ## 헤딩으로 (hwpx/docx)")
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

    t = sub.add_parser("selftest", help="check 픽스처 · R4b 평가기·예산표 · 리뷰 결함 회귀 · kb-index 재현성 (+ --render)")
    t.add_argument("--render", action="store_true")
    t.set_defaults(fn=cmd_selftest)

    ki = sub.add_parser("kb-index", help="kb 섹션 색인 생성 / --check 신선도 / --raw")
    ki.add_argument("--kb", default=str(KB))
    ki.add_argument("--out")
    ki.add_argument("--check", action="store_true")
    ki.add_argument("--raw", action="store_true")
    ki.set_defaults(fn=cmd_kb_index)

    ks = sub.add_parser("kb-select", help="서브커맨드별 읽을 섹션 선택")
    ks.add_argument("--cmd", required=True)
    ks.add_argument("--unit")
    ks.add_argument("--query", default="")
    ks.add_argument("--budget", type=int, default=KB_BUDGET)
    ks.add_argument("--raw", action="store_true")
    ks.add_argument("--include")
    ks.add_argument("--exclude")
    ks.add_argument("--emit", choices=["plan", "basis"], default="plan")
    ks.add_argument("--strict", action="store_true")
    ks.add_argument("--index", default=str(KB_INDEX))
    ks.add_argument("--config", default=str(KB_SELECT))
    ks.set_defaults(fn=cmd_kb_select)

    es = sub.add_parser("exec-summary", help="앱 집행내역 xlsx/csv → 단위사업·계정 합계 (수급자·설명 미출력)")
    es.add_argument("src")
    es.add_argument("--map", default=str(KB / "unit-map.yaml"))
    es.add_argument("--out")
    es.set_defaults(fn=cmd_exec_summary)

    ds = sub.add_parser("doc-stamp", help="최신 draft 의 sha1 을 brief.final_from 에 기록 (doc 변환 직전)")
    ds.add_argument("out_dir")
    ds.set_defaults(fn=cmd_doc_stamp)

    ko = sub.add_parser("kb-outline", help="md 헤딩·줄 범위 표")
    ko.add_argument("md")
    ko.add_argument("--json", action="store_true")
    ko.add_argument("--chunk", type=int, default=RAW_MAX_SECTION)
    ko.set_defaults(fn=cmd_kb_outline)

    args = ap.parse_args(argv)
    if args.cmd == "kb-extract" and not args.pii_scan and not (args.mode and args.src and args.out):
        ap.error("kb-extract: <pdf|tables|hwpx|docx> <src> --out <file>  또는  --pii-scan <dir>")
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())

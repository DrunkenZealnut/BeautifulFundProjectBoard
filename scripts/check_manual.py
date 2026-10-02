#!/usr/bin/env python3
"""
F-17: 관리시스템 사용 매뉴얼 검사

docs/manual/관리시스템.md 를 index.html 과 대조한다. 매뉴얼이 화면 변경으로
모르는 사이에 낡지 않게 하는 장치다 (설계: docs/02-design/features/관리시스템-사용-매뉴얼.design.md §7).

  M1 라벨      「…」로 적은 화면 글자가 index.html 에 있는가 (… 는 바뀌는 값)
  M2 앵커      문서 안 링크와 HELP_ANCHORS 가 실제 헤딩을 가리키는가
  M3 맥락      HELP_ANCHORS 가 화면 맥락(메뉴·예산 탭·관리자 탭)을 빠짐없이 덮는가
  M4 개인정보  전화·이메일·주민번호·계좌번호형 숫자열
  M5 재단 표기 '아름다운 재단' 띄어쓰기, 재단 맥락의 '후원', 단체명 오기
  M6 링크      #앵커와 https:// 만 (앱 안에서는 상대 링크가 깨진다), 이미지 금지
  M7 헤딩      이모지·코드 표기 금지 (앵커 안정)
  M8 경로      HELP_MANUAL_URL 파일이 있고 NFC 이며 git 이 추적하는가
  M9 머리 블록 **기준일**: YYYY-MM-DD
  M10 근거     <!-- src: 함수#탭 --> 의 식별자가 index.html 에 있는가 (WARN)

Usage:
  python3 scripts/check_manual.py [--manual PATH] [--app PATH] [--strict]
  python3 scripts/check_manual.py --selftest
Exit: 0 PASS · 1 FAIL (--strict 이면 WARN 도) · 2 입력 파일 없음
"""
import argparse
import re
import subprocess
import sys
import unicodedata
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MANUAL = 'docs/manual/관리시스템.md'
SAMPLE_MANUAL = 'docs/manual/사업기획-AI-도우미.md'  # selftest 실문서 회귀용

FENCE_RE = re.compile(r'^\s*(```|~~~)')
HEADING_RE = re.compile(r'^(#{1,6})\s+(.*?)\s*#*\s*$')
LABEL_RE = re.compile(r'「([^」\n]*)」')
INLINE_CODE_RE = re.compile(r'`[^`\n]*`')
LINK_RE = re.compile(r'(!?)\[[^\]\n]*\]\(([^)\s]+)[^)]*\)')
SRC_RE = re.compile(r'<!--\s*src:\s*(.*?)\s*-->')
EMOJI_RE = re.compile('[\U0001F300-\U0001FAFF\u2600-\u27BF\u2B00-\u2BFF\uFE0F]')
DATE_RE = re.compile(r'\d{4}-\d{2}-\d{2}')
PII_PATTERNS = [
    ('휴대전화', re.compile(r'(?<!\d)01[016789][-. ]?\d{3,4}[-. ]?\d{4}(?!\d)')),
    ('유선전화', re.compile(r'(?<!\d)0\d{1,2}-\d{3,4}-\d{4}(?!\d)')),
    ('이메일', re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')),
    ('주민번호', re.compile(r'(?<!\d)\d{6}-[1-4]\d{6}(?!\d)')),
    ('계좌·사업자번호', re.compile(r'(?<!\d)\d{2,6}-\d{2,6}-\d{2,7}(?:-\d{1,3})?(?!\d)')),
]
FORBIDDEN = [
    ('아름다운재단 띄어쓰기', re.compile(r'아름다운\s+재단')),
    ('재단 지원을 후원으로 표기', re.compile(r'아름다운재단.{0,12}후원|후원.{0,6}아름다운재단')),
    ('단체명 띄어쓰기', re.compile(r'청년\s+노동자\s*인권\s*센터|청년노동자\s+인권\s*센터|청년노동자인권\s+센터')),
]


# ── slug: GitHub 헤딩 앵커와 같은 규칙 (index.html helpSlug 와 동일) ──
def heading_text(raw):
    t = re.sub(r'\[([^\]]*)\]\([^)]*\)', r'\1', raw)       # 링크 → 글자
    t = t.replace('`', '')                                  # 코드 표시
    t = re.sub(r'(\*\*|__|\*|_)(?=\S)(.+?)(?<=\S)\1', r'\2', t)  # 강조
    return t


def slug(text):
    t = text.strip().lower()
    t = ''.join(c for c in t if c in ' -' or unicodedata.category(c)[0] in 'LMN' or unicodedata.category(c) == 'Pc')
    return t.replace(' ', '-')


def heading_slugs(lines):
    """[(줄번호, 헤딩 원문, slug)] — 펜스 코드 안은 제외, 중복은 -1, -2."""
    out, seen, fence = [], {}, False
    for i, line in enumerate(lines, 1):
        if FENCE_RE.match(line):
            fence = not fence
            continue
        m = None if fence else HEADING_RE.match(line)
        if not m:
            continue
        s = slug(heading_text(m.group(2)))
        if s in seen:
            seen[s] += 1
            s = f'{s}-{seen[s]}'
        else:
            seen[s] = 0
        out.append((i, m.group(2), s))
    return out


def prose_lines(lines):
    """펜스 코드 밖의 (줄번호, 줄) — 인라인 코드는 지운다."""
    fence = False
    for i, line in enumerate(lines, 1):
        if FENCE_RE.match(line):
            fence = not fence
            continue
        if not fence:
            yield i, INLINE_CODE_RE.sub('', line)


def norm(text):
    return re.sub(r'\s+', ' ', text.replace('\ufe0f', ''))


def label_fragments(label):
    return [f for f in (norm(x).strip() for x in label.split('…')) if f]


def pii_hits(text):
    hits = []
    for name, rx in PII_PATTERNS:
        for m in rx.finditer(text):
            if name == '계좌·사업자번호' and DATE_RE.fullmatch(m.group()):
                continue
            hits.append((name, m.group()))
    return hits


def mask(value):
    return value[:3] + '…'


# ── index.html 에서 읽는 것 ──
def js_block(app, name, opener, closer):
    i = app.find(f'const {name} = {opener}')
    if i < 0:
        return None
    j = app.find(closer, i)
    return app[i:j] if j > 0 else None


def parse_help_anchors(app):
    block = js_block(app, 'HELP_ANCHORS', '{', '};')
    return dict(re.findall(r"'([^']+)'\s*:\s*'([^']+)'", block)) if block else None


def expected_contexts(app):
    modules = []
    for name in ('COMMON_MODULES', 'CUSTOM_MODULES'):
        block = js_block(app, name, '[', '];') or ''
        modules += re.findall(r"id:\s*'(\w+)'", block)
    budget_tabs = sorted(set(re.findall(r"setBudgetTab\('(\w+)'\)", app)))
    i, j = app.find('const renderAdmin = () =>'), app.find('const renderContent = () =>')
    admin_tabs = re.findall(r"\{\s*key:\s*'(\w+)',\s*label:", app[i:j]) if 0 <= i < j else []
    ctx = {m for m in modules if m != 'budget'}
    ctx |= {f'budget.{t}' for t in budget_tabs}
    ctx |= {f'admin.{t}' for t in admin_tabs}
    return ctx


# ── 검사 ──
def check(manual_path, app_path, strict=False):
    mp, ap = ROOT / manual_path, ROOT / app_path
    if not mp.exists() or not ap.exists():
        print(f'입력 파일 없음: {mp if not mp.exists() else ap}')
        return 2
    lines = mp.read_text(encoding='utf-8').split('\n')
    app = ap.read_text(encoding='utf-8')
    app_norm = norm(app)
    fails, warns = [], []
    stats = {'라벨': 0, '링크': 0, '개인정보': 0, '표기': 0}

    headings = heading_slugs(lines)
    slugs = {s for _, _, s in headings}

    for n, line in prose_lines(lines):
        if not line.lstrip().startswith('<!--'):
            for label in LABEL_RE.findall(line):          # M1
                frags = label_fragments(label)
                if not frags:
                    continue
                stats['라벨'] += 1
                missing = [f for f in frags if f not in app_norm]
                if missing:
                    fails.append(f'M1 라벨   L{n} 「{label}」 — index.html에 없음 (조각 "{missing[0]}")')
        for bang, target in LINK_RE.findall(line):        # M2·M6
            stats['링크'] += 1
            if bang:
                fails.append(f'M6 링크   L{n} 이미지 금지 ({target})')
            elif target.startswith('#'):
                if unquote(target[1:]) not in slugs:
                    fails.append(f'M2 앵커   L{n} {target} — 해당 헤딩 없음')
            elif not target.startswith('https://'):
                fails.append(f'M6 링크   L{n} {target} — #앵커나 https:// 만 허용')

    for n, raw, _ in headings:                             # M7
        if EMOJI_RE.search(raw) or '`' in raw:
            fails.append(f'M7 헤딩   L{n} "{raw}" — 이모지·코드 표기 금지')

    anchors = parse_help_anchors(app)                      # M2·M3
    if anchors is None:
        fails.append('M3 맥락   index.html에 HELP_ANCHORS 없음')
        anchors = {}
    for key, s in anchors.items():
        if s not in slugs:
            fails.append(f'M2 앵커   HELP_ANCHORS[{key}] = {s} — 해당 헤딩 없음')
    expected = expected_contexts(app)
    for key in sorted(expected - anchors.keys()):
        fails.append(f'M3 맥락   HELP_ANCHORS에 {key} 없음')
    for key in sorted(anchors.keys() - expected):
        warns.append(f'M3 맥락   HELP_ANCHORS의 {key}는 화면 맥락에 없음')

    for n, line in enumerate(lines, 1):                    # M4·M5
        for name, value in pii_hits(line):
            stats['개인정보'] += 1
            fails.append(f'M4 개인정보 L{n} {name} {mask(value)}')
        for name, rx in FORBIDDEN:
            if rx.search(line):
                stats['표기'] += 1
                fails.append(f'M5 표기   L{n} {name}')

    m = re.search(r"const HELP_MANUAL_URL = '([^']+)'", app)  # M8
    if not m:
        fails.append('M8 경로   index.html에 HELP_MANUAL_URL 없음')
    else:
        url = m.group(1)
        if not unicodedata.is_normalized('NFC', url):
            fails.append(f'M8 경로   HELP_MANUAL_URL이 NFC가 아님 ({url})')
        if not (ROOT / url).exists():
            fails.append(f'M8 경로   {url} 파일 없음')
        else:
            try:
                tracked = subprocess.run(['git', 'ls-files', '--error-unmatch', url], cwd=ROOT,
                                         capture_output=True).returncode == 0
            except OSError:
                tracked = None
                warns.append('M8 경로   git을 실행할 수 없어 추적 여부를 확인하지 못함')
            if tracked is False:
                warns.append(f'M8 경로   {url}을 git이 추적하지 않음 — 커밋 전에는 운영에서 404')

    if not any(re.search(r'\*\*기준일\*\*:\s*\d{4}-\d{2}-\d{2}', l) for l in lines[:10]):  # M9
        fails.append('M9 머리   처음 10줄에 **기준일**: YYYY-MM-DD 없음')

    for n, line in enumerate(lines, 1):                    # M10
        for body in SRC_RE.findall(line):
            for token in re.split(r'[,\s]+', body):
                if not token:
                    continue
                func, _, tab = token.partition('#')
                if func and not re.search(rf'\b{re.escape(func)}\b', app):
                    warns.append(f'M10 근거  L{n} {func} — index.html에 없음')
                if tab and not re.search(rf"\b(?:budgetTab|adminTab|guideTab) === '{re.escape(tab)}'", app):
                    warns.append(f'M10 근거  L{n} #{tab} — 탭 id 없음')

    print(f'check_manual: {manual_path}')
    for msg in fails:
        print('FAIL ' + msg)
    for msg in warns:
        print('WARN ' + msg)
    covered = len(expected & anchors.keys())
    print('---')
    print(f"라벨 {stats['라벨']} · 링크 {stats['링크']} · 헤딩 {len(headings)} · 맥락 {covered}/{len(expected)}"
          f" · 개인정보 {stats['개인정보']} · 표기 {stats['표기']}")
    failed = bool(fails) or (strict and bool(warns))
    print(f"RESULT: {'FAIL' if failed else 'PASS'} (FAIL {len(fails)} · WARN {len(warns)})")
    return 1 if failed else 0


# ── selftest ──
def selftest():
    results = []

    def case(name, ok):
        results.append((name, bool(ok)))

    for text, want in [
        ('1. 무엇을 하는 도구인가', '1-무엇을-하는-도구인가'),
        ('3. 빠른 시작 — 계획서 한 바퀴', '3-빠른-시작--계획서-한-바퀴'),
        ('6. 자동 검사(check) 읽는 법', '6-자동-검사check-읽는-법'),
        ('8. 산출물 폴더와 brief.md', '8-산출물-폴더와-briefmd'),
        ('부록 A. 파일 지도', '부록-a-파일-지도'),
        ('4.2.10 사업변경신청서', '4210-사업변경신청서'),
        ('6. 알림·표시 읽는 법', '6-알림표시-읽는-법'),
    ]:
        case(f'slug {text}', slug(heading_text(text)) == want)
    dup = [s for _, _, s in heading_slugs(['## 요약', '본문', '## 요약'])]
    case('slug 중복 -1', dup == ['요약', '요약-1'])

    sample = (ROOT / SAMPLE_MANUAL)
    if not sample.exists():
        case(f'견본 매뉴얼 없음 ({SAMPLE_MANUAL})', False)
    else:
        lines = sample.read_text(encoding='utf-8').split('\n')
        slugs = {s for _, _, s in heading_slugs(lines)}
        links = [unquote(t[1:]) for _, line in prose_lines(lines) for b, t in LINK_RE.findall(line) if t.startswith('#')]
        case(f'견본 목차 링크 {len(links)}개 해석', links and all(l in slugs for l in links))

    for value in ['010-1234-5678', '02-123-4567', 'a@b.co', '850101-1234567', '123-456789-01234', '123-45-67890']:
        case(f'개인정보 잡음 {value}', pii_hits(f'예 {value} 끝'))
    for value in ['2026-10-31', '1,200,000원', 'F-17', 'v0.1', 'p.21', '2026-07-01 ~ 2026-12-31']:
        case(f'개인정보 통과 {value}', not pii_hits(f'예 {value} 끝'))

    app = norm('<button>🖨 인쇄</button> `✅ ${n}건 일괄 등록`')
    case('라벨 FE0F 무시', all(f in app for f in label_fragments('🖨\ufe0f 인쇄')))
    case('라벨 조각 분해', label_fragments('✅ …건 일괄 등록') == ['✅', '건 일괄 등록'])
    case('라벨 조각 일치', all(f in app for f in label_fragments('✅ …건 일괄 등록')))
    fenced = list(prose_lines(['```', '「코드 안」', '```', '「밖」 `「인라인」`']))
    case('펜스·인라인 코드 무시', [LABEL_RE.findall(l) for _, l in fenced] == [['밖']])
    case('금지 표기 잡음', FORBIDDEN[0][1].search('아름다운 재단 지원') and FORBIDDEN[1][1].search('아름다운재단 후원'))
    case('금지 표기 통과', not any(rx.search(t) for t in ['아름다운재단의 지원으로 진행합니다', '센터 후원회원 모집', '청년노동자인권센터'] for _, rx in FORBIDDEN))

    for name, ok in results:
        if not ok:
            print(f'FAIL {name}')
    passed = sum(ok for _, ok in results)
    print(f"selftest {'PASS' if passed == len(results) else 'FAIL'} ({passed}/{len(results)})")
    return 0 if passed == len(results) else 1


def main():
    ap = argparse.ArgumentParser(description='관리시스템 사용 매뉴얼 검사 (F-17)')
    ap.add_argument('--manual', default=DEFAULT_MANUAL)
    ap.add_argument('--app', default='index.html')
    ap.add_argument('--strict', action='store_true', help='WARN도 실패로')
    ap.add_argument('--selftest', action='store_true')
    args = ap.parse_args()
    sys.exit(selftest() if args.selftest else check(args.manual, args.app, args.strict))


if __name__ == '__main__':
    main()

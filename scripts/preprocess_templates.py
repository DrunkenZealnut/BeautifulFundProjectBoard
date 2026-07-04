#!/usr/bin/env python3
"""
F-13: HWPX 서식 placeholder 전처리 스크립트 (일회성)

templates/*.hwpx 원본을 읽어 설계 문서(§3)의 셀 좌표에 {{placeholder}}를 삽입한
전개 디렉터리를 api/hwpxfill_templates/{salary,receipt,minutes}/ 에 생성한다.

원본은 수정하지 않는다. 산출물을 한글 편집기로 열어 재저장하지 말 것
(placeholder run이 분절되어 치환이 깨진다). 재실행 시 산출물을 덮어쓴다.

Usage: python3 scripts/preprocess_templates.py
"""
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_ROOT = ROOT / 'api' / 'hwpxfill_templates'

SOURCES = {
    'salary': ROOT / 'templates' / '[서식]_급여지급명세서.hwpx',
    'receipt': ROOT / 'templates' / '[서식]_영수증빙.hwpx',
    'minutes': ROOT / 'templates' / '[서식]_회의진행일지.hwpx',
}

TC_RE = re.compile(r'<hp:tc [^>]*>.*?</hp:tc>', re.S)
SELF_CLOSED_RUN_RE = re.compile(r'<hp:run([^>]*?)/>')


def insert_into_empty_cell(xml, row, col, key, start=0, end=None):
    """(row, col) 셀의 첫 자기닫힘 run에 <hp:t>{{key}}</hp:t>를 삽입한다."""
    end = len(xml) if end is None else end
    addr = f'<hp:cellAddr colAddr="{col}" rowAddr="{row}"/>'
    for m in TC_RE.finditer(xml, start, end):
        if addr not in m.group(0):
            continue
        block = m.group(0)
        rm = SELF_CLOSED_RUN_RE.search(block)
        if not rm:
            raise SystemExit(f'[ERROR] r{row}c{col}: 자기닫힘 run 없음 — 서식 구조 변경됨?')
        new_run = f'<hp:run{rm.group(1)}><hp:t>{{{{{key}}}}}</hp:t></hp:run>'
        new_block = block[:rm.start()] + new_run + block[rm.end():]
        return xml[:m.start()] + new_block + xml[m.end():]
    raise SystemExit(f'[ERROR] r{row}c{col}: 셀을 찾지 못함')


def replace_text_run(xml, pattern, key, keep_suffix=''):
    """정규식 pattern에 맞는 첫 <hp:t> 텍스트를 {{key}}로 교체한다."""
    m = re.search(pattern, xml)
    if not m:
        raise SystemExit(f'[ERROR] 텍스트 패턴 없음: {pattern}')
    return xml[:m.start()] + f'<hp:t>{{{{{key}}}}}{keep_suffix}</hp:t>' + xml[m.end():]


def preprocess_salary(xml):
    # 1. 지급받는사람 / 2. 지급자 (빈 셀)
    for row, col, key in [(2, 1, 'r_name'), (2, 5, 'r_birth'), (3, 1, 'r_addr'),
                          (5, 1, 'org_name'), (6, 1, 'org_rep'), (7, 1, 'org_addr')]:
        xml = insert_into_empty_cell(xml, row, col, key)
    # 안내문 클릭필드 셀 — 보이는 텍스트만 교체 (필드 구조 유지)
    xml = replace_text_run(xml, r'<hp:t>※ 고유번호가 없는 경우 생략</hp:t>', 'org_regno')
    xml = replace_text_run(xml, r'<hp:t>※ 고유번호가 있는 경우 생략</hp:t>', 'org_rep_birth')
    # 3. 지급내역 — r12~r17, 좌측(c0/c1/c2)=1~6건, 우측(c3/c5/c7)=7~12건
    for i in range(6):
        row = 12 + i
        xml = insert_into_empty_cell(xml, row, 0, f'pay{i + 1}_date')
        xml = insert_into_empty_cell(xml, row, 1, f'pay{i + 1}_fund')
        xml = insert_into_empty_cell(xml, row, 2, f'pay{i + 1}_self')
        xml = insert_into_empty_cell(xml, row, 3, f'pay{i + 7}_date')
        xml = insert_into_empty_cell(xml, row, 5, f'pay{i + 7}_fund')
        xml = insert_into_empty_cell(xml, row, 7, f'pay{i + 7}_self')
    # 합계
    xml = insert_into_empty_cell(xml, 19, 3, 'total_fund')
    xml = insert_into_empty_cell(xml, 19, 6, 'total_self')
    # 하단 증명 문단
    xml = replace_text_run(xml, r'<hp:t>년\s+월\s+일</hp:t>', 'issue_date')
    m = re.search(r'<hp:t>( ?)단체\(기관\)명(\s+)\(단체직인 또는 대표자 서명\)</hp:t>', xml)
    if not m:
        raise SystemExit('[ERROR] 하단 단체명 문단 없음')
    xml = (xml[:m.start()]
           + f'<hp:t>{m.group(1)}{{{{org_name_footer}}}}{m.group(2)}(단체직인 또는 대표자 서명)</hp:t>'
           + xml[m.end():])
    return xml


def preprocess_receipt(xml):
    tbls = list(re.finditer(r'<hp:tbl .*?</hp:tbl>', xml, re.S))
    if len(tbls) != 2:
        raise SystemExit(f'[ERROR] 영수증빙 표 수 {len(tbls)} != 2')
    # 뒤쪽 표부터 처리해 앞 표의 span 오프셋이 밀리지 않게 한다
    # 표2: 영수번호 " 2" → no2, 사유 셀 → reason2
    xml = insert_into_empty_cell(xml, 0, 3, 'reason2', tbls[1].start(), tbls[1].end())
    m = re.search(r'<hp:t> ?2</hp:t>', xml[tbls[1].start():])
    if not m:
        raise SystemExit('[ERROR] 영수번호 2 셀 없음')
    s = tbls[1].start() + m.start()
    xml = xml[:s] + '<hp:t>{{no2}}</hp:t>' + xml[s + len(m.group(0)):]
    # 표1: 영수번호 "1" → no1, 사유 셀 → reason1
    xml = insert_into_empty_cell(xml, 0, 3, 'reason1', tbls[0].start(), tbls[0].end())
    m = re.search(r'<hp:t>1</hp:t>', xml[tbls[0].start():tbls[0].end() + 200])
    if not m:
        raise SystemExit('[ERROR] 영수번호 1 셀 없음')
    s = tbls[0].start() + m.start()
    xml = xml[:s] + '<hp:t>{{no1}}</hp:t>' + xml[s + len(m.group(0)):]
    return xml


def preprocess_minutes(xml):
    for row, col, key in [(0, 1, 'm_title'), (1, 1, 'm_datetime'),
                          (2, 1, 'm_place'), (3, 1, 'm_content')]:
        xml = insert_into_empty_cell(xml, row, col, key)
    for i in range(6):
        xml = insert_into_empty_cell(xml, 5 + i, 1, f'att{i + 1}')
    # 표 밖 하단: 클릭필드 "단체명(클릭시 입력가능)" — 보이는 텍스트만 교체
    xml = replace_text_run(xml, r'<hp:t>단체명\(클릭시 입력가능\)</hp:t>', 'org_name_footer')
    return xml


PREPROCESSORS = {
    'salary': preprocess_salary,
    'receipt': preprocess_receipt,
    'minutes': preprocess_minutes,
}


def main():
    for name, src in SOURCES.items():
        if not src.exists():
            raise SystemExit(f'[ERROR] 원본 없음: {src}')
        out_dir = OUT_ROOT / name
        if out_dir.exists():
            shutil.rmtree(out_dir)
        with zipfile.ZipFile(src) as zf:
            zf.extractall(out_dir)
        section = out_dir / 'Contents' / 'section0.xml'
        xml = section.read_text(encoding='utf-8')
        xml = PREPROCESSORS[name](xml)
        section.write_text(xml, encoding='utf-8')
        keys = sorted(set(re.findall(r'\{\{([a-z0-9_]+)\}\}', xml)))
        print(f'[OK] {name}: {len(keys)} placeholders → {out_dir.relative_to(ROOT)}')
        print(f'     {", ".join(keys)}')


if __name__ == '__main__':
    main()

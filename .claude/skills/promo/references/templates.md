# templates — 비주얼 템플릿 카탈로그 (`content/templates/visual/`)

공통: `brand/tokens.css` 색·서체(Pretendard), `word-break: keep-all`. 로고 슬롯 `logo_org`/`logo_funder`는 파일 경로 — 없으면 워드마크 폴백. 재단 로고가 단체 로고보다 앞. 샘플 YAML은 `_samples/`.

슬롯 YAML 형식:
```yaml
template: card-square
page: 1                 # 카드뉴스 순번 (표시됨)
variant: cover          # 템플릿별 옵션 (card-square: cover)
slots:
  title: "…"
  items: [{ n: "1회", text: "…" }]
  logo_org: "../../brand/logo/org.svg"    # yaml 위치 기준 상대경로
raw: {}                 # HTML 그대로 넣을 슬롯 (예: qr)
```

| 템플릿 | 크기 | 출력 | 슬롯 (최대 글자) | 용도 |
|---|---|---|---|---|
| `card-square` | 1080×1080 | png | eyebrow 16 · title 18 · subtitle 48 · dates 34 · items ≤5 {n 6, text 22} · cta 16 · credit 40 · logo_* / `variant: cover` = 제목 확대, 리스트 숨김 | 카드뉴스, 후원 안내 |
| `card-portrait` | 1080×1350 | png | eyebrow 16 · title 20 · body 120 · cta 16 · date 30 · credit 40 · photo(선택) · logo_* | 인스타 모집·안내 |
| `og-banner` | 1200×630 | png | eyebrow 16 · title 24 · subtitle 40 · org 20 · credit 40 · logo_* | 링크 공유 미리보기 |
| `poster-a4` | A4 세로 | pdf + preview.png | eyebrow 16 · title 16 · subtitle 40 · when 30 · where 30 · items ≤6 {n 6, text 24} · body 220 · cta 28 · partners 60 · credit 40 · qr(raw) · logo_* | 학교·현장 게시 |
| `leaflet-3fold` | A4 가로 양면 | pdf(2쪽) + preview.png(1쪽) | cover{eyebrow, title 14, tagline 40} · intro{title, body 160, list ≤4} · back{title, body 200, links ≤3 {label,url}} · panels ×3 {title 14, body 160, list ≤4 {text 26}, links ≤3} · credit · logo_* | 교사용 컨텐츠 안내 |
| `notice-a4` | A4 세로 | pdf + preview.png | eyebrow 16 · title 24 · lead 80 · facts ≤4 {k 6, v 30} · sections ≤4 {h 14, body 200} · contact_note 40 · credit 40 · logo_* | 동아리 모집·프로그램 안내 |

리플릿 접지: 1쪽 = [안쪽날개(intro) | 뒤표지(back) | 앞표지(cover)], 2쪽 = [p1 | p2 | p3]. 뒤표지에 재단·지원사업 소개(재단 규정).

## 카드뉴스 다장 구성 예

```
card-square-01.yaml  variant: cover  — 제목·부제·날짜·CTA
card-square-02.yaml  page: 2         — 회차 목록 (items)
card-square-03.yaml  page: 3         — 왜 하는가 (subtitle에 본문)
card-square-04.yaml  page: 4         — 신청 방법 + credit
```

## 새 템플릿 추가

1. `content/templates/visual/<name>.html` — `<meta name="promo-size">`, 인쇄물이면 `<meta name="promo-print" content="A4">`, `<meta name="promo-slots" content='{…}'>` 선언
2. `<link rel="stylesheet" href="../../brand/tokens.css">` (fill이 절대경로로 치환)
3. 슬롯은 `{{key}}`, 반복 `{{#list}}…{{/list}}`, 비어 있을 때 `{{^key}}…{{/key}}`, raw `{{{key}}}`
4. 리스트 래퍼는 `:empty { display:none }`으로 처리 (같은 이름 섹션을 중첩하지 말 것)
5. `_samples/<name>-01.yaml` 추가 → fill → render → Read 검토
6. 이 표에 행 추가

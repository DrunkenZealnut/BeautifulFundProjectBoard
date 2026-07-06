# 뉴스레터 디자인 시스템 — Figma 연동 문서

> **Figma 파일**: [뉴스레터 디자인 시스템 — 아름다운재단 인큐베이팅](https://www.figma.com/design/iWOCFEikCSMpyBrDkAeQEa)
> **토큰 소스(SSOT)**: `index.html`의 `NL_THEMES` (~line 3474) · `NL_FONTS` (~line 3466)
> **작성**: 2026-07-05 · 브랜치 `feat/figma-newsletter-design-system`

## 개요

`index.html`의 뉴스레터 템플릿 시스템(6종)을 Figma 디자인 시스템으로 구축했다.
**코드가 원본(source of truth)** 이며, Figma는 디자인 탐색·시안 제작·커뮤니케이션용이다.
`NL_THEMES` 값을 바꾸면 이 문서의 매핑 표와 Figma 변수를 함께 갱신해야 한다.

## 구조

### 변수 컬렉션 (96개)

| 컬렉션 | 모드 | 내용 |
|--------|------|------|
| **Primitives** | Value | 원시 색상 50개 (teal/flame/navy/violet 등 액센트 + gray/slate/zinc 스케일). 스코프 없음(피커 숨김) |
| **Theme** | **Modern · Magazine · Classic · Bold** | 시맨틱 토큰 14개. 모드 전환 = 테마 전환 |
| **Spacing** | Value | spacing 9개(4~36px) + radius 6개(4~999px) |
| **Typography** | Value | 폰트 사이즈 15개(`size/{px}` 숫자 네이밍, 10~32px) + 패밀리 2개 |

컴포넌트 내 텍스트의 fontSize는 텍스트 스타일 적용 노드를 제외하고 전부 `size/{px}` 변수에 바인딩되어 있다.

**Email/Grid 템플릿**은 독립 생성기(`generateNewsletterEmail`/`generateNewsletterGrid`)라서 Theme 모드에 포함하지 않고 프리미티브로만 등록: `green/600 #27ae60`, `carrot/700 #d35400`, `midnight/800 #2c3e50`, `neutral/400 #95a5a6`(email grayColor), `neutral/200·300`.
(Figma Pro 플랜의 컬렉션당 4모드 제한과도 일치)

### Theme 시맨틱 토큰 ↔ NL_THEMES 매핑

| Figma 변수 | CSS 신택스 | Modern | Magazine | Classic | Bold |
|-----------|-----------|--------|----------|---------|------|
| `accent/default` | `var(--nl-accent)` | teal/600 `#0d9488` | flame/600 `#e85d3a` | navy/800 `#1e3a5f` | violet/600 `#7c3aed` |
| `accent/alt` | `var(--nl-accent-alt)` | cyan/500 `#06b6d4` | orange/400 `#fb923c` | gold/600 `#b8860b` | amber/400 `#fbbf24` |
| `bg/page` | `var(--nl-bg-page)` | neutral/100 | neutral/100 | neutral/100 | zinc/950 |
| `bg/canvas` | `var(--nl-bg-canvas)` | white | cream/50 | white | zinc/900 |
| `bg/surface` | `var(--nl-bg-surface)` | gray/50 | white | mist/100 | zinc/800 |
| `bg/tint` | `var(--nl-bg-tint)` | gray/50 | sand/50 | gray/50 | zinc/800 |
| `bg/header` | `var(--nl-bg-header)` | white | slate/800 | white | violet/600 |
| `text/heading` | `var(--nl-text-heading)` | gray/950 | slate/800 | gray/900 | white |
| `text/body` | `var(--nl-text-body)` | gray/700 | slate/600 | gray/700 | zinc/300 |
| `text/muted` | `var(--nl-text-muted)` | gray/500 | slate/500 | gray/500 | zinc/400 |
| `text/caption` | `var(--nl-text-caption)` | gray/400 | slate/400 | gray/400 | zinc/500 |
| `text/inverse` | `var(--nl-text-inverse)` | white | white | white | white |
| `border/default` | `var(--nl-border)` | gray/200 | gray/200 | gray/300 | zinc/800 |
| `border/subtle` | `var(--nl-border-subtle)` | gray/100 | gray/100 | gray/200 | zinc/800 |

`--nl-*` CSS 변수는 아직 코드에 없다 — Dev Mode 핸드오프용 명명 규약이며, 향후 `NL_THEMES`를 CSS 변수 기반으로 리팩터링할 때 이 이름을 그대로 쓰면 된다.

### 타이포그래피 (pt × 4/3 = px)

**Figma에는 Pretendard가 없어 Noto Sans KR로 대체 표현**한다 (웹 구현은 Pretendard 유지). 명조는 Noto Serif KR(코드의 `NL_FONTS` serif 옵션과 동일 계열). 코드의 800/900 웨이트는 Noto Sans KR **Black**, 600/700은 **Bold**로 매핑. `NL_FONTS`의 `system` 옵션(-apple-system 스택)은 OS 의존 폰트라 Figma에 표현하지 않는다(의도적 제외).

| 텍스트 스타일 | 크기/행간 | 코드 원본 |
|--------------|----------|----------|
| Title/Modern | 29/38 Black, ls -1 | modern title 22pt·800 |
| Title/Magazine | 27/36 Serif Bold | magazine title 20pt·명조 |
| Title/Classic | 24/32 Black, ls -0.5 | classic title 18pt·800 |
| Title/Bold | 32/40 Black, ls -1 | bold title 24pt·900 |
| Heading/Featured | 24/32 Serif Bold | magazine featured 18pt |
| Heading/Section · Card | 17/24 Bold | 13pt·700 |
| Heading/Card Sm | 15/21 Bold | 11.5pt |
| Display/Date | 21/24 Black | magazine 날짜 16pt·800 |
| Body/Default | 14/25 | 10.5pt·행간 1.8 |
| Body/Sm | 13/23 | 10pt |
| Caption/Default · Xs | 12/18 · 11/16 | 9pt · 8pt |
| Label/Overline | 11/16 Bold, ls 1 | modern 섹션 라벨 |
| Label/Badge | 12/16 Bold | 카테고리 뱃지 9pt·600 |

이펙트 스타일: `Shadow/Card` (0 2 12 rgba(0,0,0,.08)) · `Shadow/Card Sm` (0 2 8 rgba(0,0,0,.06)) — magazine 카드 그림자.

### 컴포넌트 ↔ 코드 함수 매핑 (8세트 · 37배리언트)

| Figma 컴포넌트 | 배리언트 | 코드 대응 | 주요 속성 |
|---------------|---------|----------|----------|
| `NL/Header` | Theme×4 | `theme.header(org, issue)` | Org Name, Issue |
| `NL/Title` | Theme×4 | `theme.title(t)` | Title |
| `NL/Text Block` | Theme×4 × Kind(Greeting/Closing) | `theme.greeting/closing(g)` | Content |
| `NL/Section Label` | Theme×4 | `theme.sectionLabel(label)` | Label |
| `NL/Schedule Item` | Theme×4 | `theme.scheduleItem(s)` / `scheduleTable` | Date, Title, Meta, Month, Day, Category |
| `NL/Schedule Header (Classic)` | 단일 | classic `scheduleTable` thead | — |
| `NL/Board Item` | Modern·Mag Featured·Mag Compact·Classic·Bold | `theme.boardItem(b, …, idx, total)` | Title, Body, Date, Badge, Show Image |
| `NL/Gallery Item` | Theme×4 × State(Default/Empty) | `theme.galleryItem(g, url)` — Empty는 url 없을 때 📷 placeholder 분기 | Caption |
| `NL/Footer` | Theme×4 | `theme.footer(org)` | Org Name |

각 배리언트에는 **Theme 컬렉션의 명시적 모드**가 걸려 있어 시맨틱 토큰이 해당 테마 값으로 해석된다. Templates 페이지에 4개 완성형 조립 예시(`Template/Modern·Magazine·Classic·Bold`)가 있다.

### 변수 바인딩 예외 (의도적 하드코딩)

- Modern 헤더 그라데이션 라인(teal/600→cyan/500), Bold 헤더 배경(violet/600→violet/900): Figma 그라데이션은 변수 바인딩 불가
- Classic 액자형 이미지 프레임의 흰색 배경
- 카테고리/뱃지 틴트: 해당 프리미티브(indigo/500 등)에 paint opacity 적용 — 일정 카테고리 필 0.08(코드 `${clr}15`), 게시판 뱃지 0.09(코드 `${clr}18`)

### 카테고리 색 (코드 그대로)

일정: 교육 `indigo/500` · 캠페인 `pink/500` · 회의 `amber/500` · 평가 `emerald/500` · 기타 `violet/500`
게시판: 공지 `red/500` · 자료 `blue/500` · 보고서 `violet/500` · 자유 `gray/500`

## 동기화 규칙

1. **테마 색 변경 시**: `NL_THEMES`의 hex 수정 → Figma Primitives의 해당 변수 값 갱신 (시맨틱은 앨리어스라 자동 반영)
2. **주의**: CLAUDE.md의 기존 규칙대로 테마의 `accent`/`accent2` 선언값과 렌더 함수 내 hex를 항상 일치시킬 것 (색 커스터마이징 문자열 치환이 깨짐)
3. **새 테마 추가 시**: Theme 컬렉션에 모드 추가(Pro 플랜 4모드 한도 주의) + 각 컴포넌트에 배리언트 추가
4. Figma에서 시안이 확정된 디자인 변경은 이 매핑 표를 역참조해 `NL_THEMES`에 반영

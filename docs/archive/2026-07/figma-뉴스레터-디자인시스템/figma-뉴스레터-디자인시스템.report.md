# Figma 뉴스레터 디자인 시스템 구축 — PDCA 완료 보고서

> **Feature**: figma-뉴스레터-디자인시스템
> **기간**: 2026-07-05 ~ 2026-07-06 (Design → Do → Check → Act → Report, 단일 세션 + 1회 반복)
> **Match Rate**: 100% ✅ (1차 90.5% → Act 1회 반복 후 100%)
> **작성자**: Claude Code
> **Status**: Completed

---

## Executive Summary

### 1.1 개요

| 항목 | 내용 |
|------|------|
| 기능명 | 뉴스레터 템플릿 시스템(`NL_THEMES`)의 Figma 디자인 시스템화 |
| 선행 작업 | 뉴스레터-생성모듈-업데이트 (PR #37) — 6종 템플릿·저장/불러오기·커스터마이징 |
| PDCA 사이클 | Design(코드 역추출) → Do(Figma 구축) → Check(gap-detector) → Act(1회 반복) → Report |
| Match Rate | **100%** (63항목 체크리스트, 1차 57/63 → Act 후 63/63) |

### 1.2 결과 요약

| 지표 | 값 |
|------|-----|
| Match Rate | 100% (1차 90.5%에서 Act 1회 반복으로 +9.5pp) |
| Figma 변수 | 96개 (Primitives 50 · Theme 시맨틱 14×4모드 · Spacing 15 · Typography 17) |
| 스타일 | 텍스트 15종 + 이펙트(그림자) 2종 |
| 컴포넌트 | 8세트 **37배리언트** + 독립 1개(Classic 테이블 헤더) |
| 완성형 템플릿 | 4종 (Modern·Magazine·Classic·Bold 전체 조립) |
| QA 결과 | 깨진 앨리어스 0 · 이름 없는 노드 0 · 하드코딩 non-white fill 0 |
| 신규 문서 | 설계 문서 1, 분석 문서 1 (`docs/02-design/`, `docs/03-analysis/`) |

### 1.3 Value Delivered

| 관점 | 내용 |
|------|------|
| **Problem** | 뉴스레터 6종 테마의 색상·타이포·컴포넌트 규칙이 `index.html` 인라인 스타일 문자열에만 존재해, 디자이너·재단 담당자가 시각적으로 검토하거나 신규 테마를 제안할 방법이 없었음. 코드와 디자인 산출물 간 동기화 지점도 부재 |
| **Solution** | 코드(`NL_THEMES`)를 SSOT로 삼아 Figma에 변수 96개(4모드 시맨틱 토큰 포함)·텍스트/이펙트 스타일 17종·컴포넌트 8세트 37배리언트·완성형 템플릿 4종을 역추출·구축. gap-detector로 코드-Figma 값 정확성을 63개 항목까지 검증하고 100%까지 반복 개선 |
| **Function/UX Effect** | Foundations 페이지에서 색상 스와치·타이포 스펙시멘·간격·그림자를 한눈에 열람 가능. 테마 컬렉션 모드 전환만으로 4개 테마 전체 미리보기 전환. 갤러리 빈 상태(📷) 등 코드의 조건부 분기까지 Figma 배리언트로 표현 |
| **Core Value** | 향후 테마 색상 변경 시 "코드 hex 수정 → Figma 프리미티브 값 갱신"이라는 단방향 동기화 경로가 문서로 확립됨. 신규 테마 추가나 재단 브랜드 가이드 검토를 디자인 툴에서 먼저 진행할 수 있는 기반 마련 |

---

## 2. PDCA 사이클 요약

| 단계 | 산출물 | 핵심 |
|------|--------|------|
| **Design** | `docs/02-design/figma-newsletter-design-system.md` | `index.html` NL_THEMES(~line 3466-3630)를 코드 그대로 역추출한 매핑 문서. 색상 4테마×2 액센트, 시맨틱 토큰 14개, 타이포 pt×4/3 변환표, 컴포넌트↔렌더함수 대응표 |
| **Do** | Figma 파일 `iWOCFEikCSMpyBrDkAeQEa` | figma-generate-library 스킬의 Phase 0~4 워크플로 준수: Discovery → Foundations(변수·스타일) → File Structure(12페이지) → Components(8세트) → 완성형 템플릿 4종 조립 |
| **Check** | `docs/03-analysis/figma-뉴스레터-디자인시스템.analysis.md` | gap-detector 1차 90.5% (57/63) — 값 정확성 100%, 커버리지·문서 완전성 갭 5건(G1~G5) |
| **Act (1회)** | 동일 분석 문서 갱신 | 타이포 스케일 보강(+4 사이즈, 62노드 바인딩), 틴트 알파 코드 정합, 프리미티브 1개 추가, 갤러리 State 축(Empty 배리언트) 도입, 문서 정정 → 재검증 100% (63/63) |
| **Report** | 본 문서 | — |

> 이번 사이클은 별도 Plan 문서 없이 사용자의 직접 요청("Figma와 연동하여 뉴스레터 디자인시스템을 구축")으로 시작되어, figma-generate-library 스킬의 Discovery 단계가 Plan 역할을 겸했다.

## 3. 주요 기술 결정

1. **코드를 SSOT로, Figma는 파생물로 고정** — `NL_THEMES`의 hex/pt 값을 그대로 옮기고, Figma에서 발견되는 불일치는 전부 "Figma를 코드에 맞춘다"는 방향으로 해소. 역방향 동기화(디자이너가 Figma에서 값 변경 → 코드 반영)는 이번 범위에 포함하지 않음.
2. **Theme 컬렉션을 4모드 단일 컬렉션으로 설계** — Modern/Magazine/Classic/Bold를 별도 컬렉션이 아닌 한 컬렉션의 4개 모드로 구성해, 컴포넌트 인스턴스의 모드 전환만으로 테마 전체가 바뀌도록 함. Figma Pro 플랜의 컬렉션당 4모드 한도와 정확히 일치해 확장 시 주의 필요(문서에 명시).
3. **Email/Grid 템플릿은 Theme 모드에서 제외** — 코드에서도 `generateNewsletterEmail`/`generateNewsletterGrid`가 테마 렌더러와 무관한 독립 생성기이므로, 이를 Figma 구조에도 그대로 반영(프리미티브만 등록, 시맨틱 미포함).
4. **의도적 하드코딩 2건은 수정하지 않고 문서화** — Modern 헤더 그라데이션(teal→cyan), Bold 헤더 그라데이션(violet 600→900)은 Figma 변수가 그라데이션 바인딩을 지원하지 않아 원시값 유지. Match Rate 계산에서도 "갭"이 아닌 "의도적 미커버"로 분리 채점.
5. **폰트 대체 전략** — Figma에 Pretendard가 없어 Noto Sans KR(고딕)/Noto Serif KR(명조)로 표현. 코드의 800/900 웨이트는 Black, 600/700은 Bold로 매핑. 웹 구현체는 Pretendard를 그대로 유지.

## 4. Check → Act 갭 해소 상세

1차 gap-detector가 발견한 5건을 전부 해소했다.

| ID | 심각도 | 갭 | 조치 |
|----|--------|----|------|
| G1 | 🟡 Medium | px-native 폰트 크기(16·18·20·10px)가 Typography 스케일에 미등록 | size 토큰을 `size/{px}` 숫자 네이밍으로 통일, 4종 추가(총 15개), 컴포넌트 텍스트 62노드 fontSize 변수 바인딩 |
| G2 | 🔵 Low | 카테고리 틴트 알파: 코드는 일정 `${clr}15`/게시판 `${clr}18` 혼용, Figma는 0.1 통일 | 일정 필 0.08, 게시판 뱃지 0.09로 분리 적용(메인 3곳+템플릿 6곳) |
| G3 | 🔵 Low | email 생성기의 `#95a5a6` 프리미티브 미등록 | `neutral/400` 추가 |
| G4 | 🔵 Low | `NL_FONTS` `system` 옵션 Figma 미표현 | 문서에 "OS 의존 폰트, 의도적 제외" 명시 |
| G5 | 🔵 Low | 갤러리 아이템의 빈 상태(📷) 분기 미표현 | `NL/Gallery Item`에 State 축(Default/Empty) 추가, 4배리언트 신설 |

재검증 과정에서 추가로 발견된 문서 표기 오류(컴포넌트 요약 "33배리언트" → 실제 "37배리언트") 1건도 함께 정정했다.

## 5. 학습 포인트

- **Figma 변수 스코프·모드 설계가 먼저, 컴포넌트는 그 다음** — figma-generate-library 스킬의 Phase 순서(Foundations → Components)를 지키자 나중 단계에서 재작업이 거의 발생하지 않았다. 특히 Theme 4모드를 먼저 확정한 덕분에 8개 컴포넌트셋 전부가 동일한 `setExplicitVariableModeForCollection` 패턴으로 일관되게 구현됨.
- **gap-detector가 "값은 맞는데 커버리지가 빈다"는 유형의 갭을 잘 잡아냄** — 색상·타이포 변환 같은 수치 정확성은 1차에서 이미 100%였고, 실제 감점 요인은 전부 스케일 완결성·문서 표기·엣지케이스(빈 상태) 같은 완성도 이슈였다. 정량 검증(hex 대조)과 정성 검증(커버리지 판단)을 한 에이전트가 함께 수행할 수 있음을 확인.
- **Figma MCP 작업은 pdca-iterator보다 메인 세션 직접 수행이 적합** — Act 단계를 표준대로 pdca-iterator에 위임하지 않고 메인 세션에서 Figma MCP를 직접 호출한 이유는, iterator 에이전트가 Figma MCP 도구에 접근하지 못하기 때문. 외부 도구(MCP) 의존적인 Do/Act 단계는 해당 도구를 가진 세션이 직접 수행하는 편이 안전함.
- **SendMessage로 동일 gap-detector 인스턴스에 재검증 위임** — 새 에이전트를 스폰하는 대신 1차 분석을 수행한 에이전트에 결과를 이어보내 재검증시켜, 컨텍스트(63개 체크리스트 정의)를 재설명할 필요 없이 일관된 채점 기준으로 재검증받음.

## 6. 잔여 작업 (사용자 액션)

- 없음 — Match Rate 100%로 즉시 사용 가능한 상태. Figma 파일은 코드와 별도 산출물이라 배포 파이프라인에 영향 없음.
- 권장(선택): 재단 실무자에게 Figma 파일 공유 후 Foundations 페이지 기준으로 브랜드 컬러 피드백 수렴 시, 본 보고서의 §3 기술 결정에 따라 코드 hex 우선 변경 → Figma 프리미티브 갱신 순서를 따를 것.

## 7. 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `docs/02-design/figma-newsletter-design-system.md` | 신규 — 코드↔Figma 매핑 문서 (변수/스타일/컴포넌트 대응표, 동기화 규칙) |
| `docs/03-analysis/figma-뉴스레터-디자인시스템.analysis.md` | 신규 — Check 1차(90.5%) + Act 1회 반복(100%) 기록 |
| `docs/04-report/figma-뉴스레터-디자인시스템.report.md` | 신규 — 본 문서 |
| `.bkit/state/pdca-status.json` | `figma-뉴스레터-디자인시스템` 피처 추가 (phase: check → matchRate 100, iterationCount 1) |
| Figma 파일 (`iWOCFEikCSMpyBrDkAeQEa`) | 신규 — 변수 96개, 스타일 17종, 컴포넌트 8세트 37배리언트, 완성형 템플릿 4종, Foundations/Cover 문서 페이지 |

> `index.html`은 이번 사이클에서 수정되지 않았다 — 본 작업은 기존 코드를 SSOT로 한 순수 디자인 산출물 구축이었다.

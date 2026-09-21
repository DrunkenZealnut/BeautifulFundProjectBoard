# 2026-07 아카이브 인덱스

완료된 PDCA 사이클 문서 보관소.

| Feature | 설명 | Match Rate | 완료일 | 문서 |
|---------|------|:----------:|--------|------|
| [F-13-hwpx-template-report](F-13-hwpx-template-report/) | HWPX 서식 템플릿 기반 정산 문서 일괄 생성 (급여명세서·영수증빙·회의진행일지) | 92% | 2026-07-04 | plan · design · analysis · report |
| [figma-뉴스레터-디자인시스템](figma-뉴스레터-디자인시스템/) | 뉴스레터 템플릿 시스템(`NL_THEMES`)의 Figma 디자인 시스템화 — 변수 96개·컴포넌트 8세트 37배리언트·완성형 템플릿 4종 | 100% | 2026-07-06 | design · analysis · report |

---

## F-13-hwpx-template-report

- **개요**: `templates/` 재단 서식 원본에 placeholder를 전처리하고, 서버리스 채우기 엔진(`api/hwpx-fill.py`)이 DB 데이터를 주입해 정산 서식을 일괄 생성
- **산출물**: `api/hwpx-fill.py`, `api/hwpxfill_templates/{salary,receipt,minutes}/`, `scripts/preprocess_templates.py`, `index.html`(빌더·모달·버튼), `vercel.json`
- **PDCA**: Plan(v0.2) → Design(v0.3) → Do → Check(92%) → Act → Report → Archived
- **후속**: 한글 실물 육안 확인, Vercel 배포 후 진입점 3곳 통합 테스트

## figma-뉴스레터-디자인시스템

- **개요**: `index.html`의 `NL_THEMES`(뉴스레터 6종 템플릿)를 SSOT로 삼아 Figma 파일(`iWOCFEikCSMpyBrDkAeQEa`)에 변수·스타일·컴포넌트·완성형 템플릿을 역추출 구축
- **산출물**: Figma 변수 96개(Theme 4모드 시맨틱 14 포함) · 텍스트/이펙트 스타일 17종 · 컴포넌트 8세트 37배리언트 · 완성형 템플릿 4종(Modern/Magazine/Classic/Bold) · Foundations/Cover 문서 페이지
- **PDCA**: Design(코드 역추출) → Do(Figma 구축) → Check(90.5%) → Act(1회 반복) → Report(100%) → Archived
  - Plan 문서는 생성하지 않음 — 사용자 직접 요청으로 시작해 figma-generate-library 스킬의 Discovery 단계가 Plan을 겸함
- **후속**: 없음(즉시 사용 가능). 테마 색상 변경 시 코드 hex 우선 수정 → Figma 프리미티브 갱신 순서 준수

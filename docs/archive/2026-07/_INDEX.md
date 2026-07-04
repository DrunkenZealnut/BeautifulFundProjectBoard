# 2026-07 아카이브 인덱스

완료된 PDCA 사이클 문서 보관소.

| Feature | 설명 | Match Rate | 완료일 | 문서 |
|---------|------|:----------:|--------|------|
| [F-13-hwpx-template-report](F-13-hwpx-template-report/) | HWPX 서식 템플릿 기반 정산 문서 일괄 생성 (급여명세서·영수증빙·회의진행일지) | 92% | 2026-07-04 | plan · design · analysis · report |

---

## F-13-hwpx-template-report

- **개요**: `templates/` 재단 서식 원본에 placeholder를 전처리하고, 서버리스 채우기 엔진(`api/hwpx-fill.py`)이 DB 데이터를 주입해 정산 서식을 일괄 생성
- **산출물**: `api/hwpx-fill.py`, `api/hwpxfill_templates/{salary,receipt,minutes}/`, `scripts/preprocess_templates.py`, `index.html`(빌더·모달·버튼), `vercel.json`
- **PDCA**: Plan(v0.2) → Design(v0.3) → Do → Check(92%) → Act → Report → Archived
- **후속**: 한글 실물 육안 확인, Vercel 배포 후 진입점 3곳 통합 테스트

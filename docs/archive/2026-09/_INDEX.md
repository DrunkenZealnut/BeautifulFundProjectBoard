# 2026-09 아카이브 인덱스

완료된 PDCA 사이클 문서 보관소.

| Feature | 설명 | Match Rate | 완료일 | 문서 |
|---------|------|:----------:|--------|------|
| [홍보콘텐츠-생성시스템](홍보콘텐츠-생성시스템/) | 사업 원천 문서(신청서·사업계획·예산·변경신청서·수행가이드) → `facts.yaml` 지식베이스 + `/promo` 스킬 + HTML→PNG/PDF 렌더 + HWPX 변환. 로컬 전용 홍보물·문서 생성 체계 | 95.6% | 2026-09-14 | plan · design · analysis · report |

---

## 홍보콘텐츠-생성시스템

- **개요**: `data/` 원천 문서 5건을 `content/kb/`(facts.yaml 단일 진실 원천 + 13개 md, 2026-08-23 변경 후 기준)로 정제하고, `/promo brief→draft→visual→render→check` 워크플로로 카드뉴스·포스터·리플릿(PNG/PDF)과 공문·보고서·제안서(HWPX/DOCX) 초안을 반복 생산. 서버·API 키 없음
- **산출물**: `content/tools/promo.py`(fill·render·check·index·kb-extract·selftest) · `content/tools/md2hwpx.py` · `content/kb/` · `content/brand/tokens.css`+Pretendard · 비주얼 템플릿 6종 · 문서 골격 6종 · `.claude/skills/promo/`(SKILL + references 4) · 시범 산출물 4건(열아홉 토론회 포스터+카드 4장+OG / 커피차 포스터 3종+인스타 / 교사용 리플릿 / 협력제안서 HWPX) · CLAUDE.md 절
- **PDCA**: Plan → Design → Do(11단계) → Check(92.0%) → Act-1(R3 파일별·credit_sentences, R5 M.D 날짜, 공문 크레딧, 07 supersedes, selftest+픽스처) → Report(95.6%) → Archived
- **후속**: 설계서 v0.2 갱신(11건), 캠페인·지역협력 kb 섹션 보강, 단체·재단 로고 배치, `06-메시지.md` 슬로건 검수, 카탈로그 잔여 8종 제작. 홍보물 배포 전 재단 담당자 문의(지원처 명기)·보도자료 재단 검수

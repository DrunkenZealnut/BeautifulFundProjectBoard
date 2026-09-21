---
name: f14-deposit-pdf-gap-analysis
description: F-14 입금확인증 PDF 집행등록 갭 분석 결과 (2026-09-20, iteration 1, 94%) — 남은 갭은 설계서 갱신 항목, 코드 결함은 수수료 행 날짜 1건
metadata:
  type: project
---

F-14 (입금확인증-PDF-집행등록) Check iteration 1 on 2026-09-20: Match Rate 94% (39 match / 5 partial / 0 missing of 44 items). All F-14 changes were uncommitted in the working tree at analysis time (branch feat/figma-newsletter-design-system). Parser (extractPdfTextLines / DEPOSIT_PDF_LABELS / parseDepositConfirmation / findDuplicateExecution) is byte-for-byte the design code.

Remaining partial items (all "design update recommended", no missing features):
- Fee row UI shows '수수료' pill + '본 행 항목 연동/항목 직접 지정' badge instead of design's '출금' + '└ 수수료'
- Parse progress text is inside the upload button, not a separate line
- Single-form autofill returns early on scanned PDF (charCount 0) without keeping the PDF as evidence — design had no charCount branch
- Bulk register handler has no RLS-specific alert (pre-existing behaviour)
- Design §11.1 says excel path unchanged, but the success alert was replaced by the done screen and the default source is 'pdf' (excel needs a toggle click)

Design doc inaccuracies to fix on next pass: §6.1 table — 교육훈련비/기자재구매관리비/일반관리비/홍보비 resolve to '이체내역서 (계좌이체시)' because getRequiredDocuments always appends conditional docs; only 여비교통비 and types absent from DOCUMENT_RULES (e.g. '일반지출') hit the '이체확인증' fallback. §2.4 vs §10 state count mismatch (4 useState + 1 ref, not 5).

Only code defect worth fixing (medium): fee row execution_date is a snapshot at parse time, not editable, and not propagated when the parent PDF row's date is edited — with '날짜 미인식' + fee > 0 the whole batch throws until the fee row is deselected.

**Why:** the next PDCA step is likely /pdca report or a small iterate; knowing the 90% gate passed and which gaps are doc-only avoids a full re-analysis.
**How to apply:** on re-analysis of F-14, check these specific points first; if asked to fix code, start with fee-row date propagation in updateRow.

# 사업기획 AI 도우미 (F-16) — Gap Analysis

> **Design**: `docs/02-design/features/사업기획-AI-도우미.design.md` v0.4
> **Scope**: 설계 §8 1~8단계 전체 (색인·facts v2·check 확장·`/kihoek` 스킬·learn 1판·골격·문서)
> **Date**: 2026-09-25 (Check 1차 → Act 1회차 → Check 2차)
> **Analyzer**: gap-detector (Read 전용 + 스크래치 프로브)
> **Match Rate**: **93%** (Check 2차; 1차 85%) — 구현 일치 97.8% · 검증 증거 65.6% (충족 1·부분 0.5·미실행 0), 가중치 94:16. 이월 3건(V7·V10·V12) 제외 시 95%

---

## 1. Act 1회차 — 무엇을 고쳤나

Check 1차 갭 G1~G13 + 🟢 전부를 한 회차에 반영했다. 코드는 `content/tools/promo.py` 한 파일, 나머지는 kb·스킬·설계·산출물.

| 갭 | 판정 | 반영 위치 |
|:-:|:-:|---|
| 🔴 G1 나눗셈·`(산출:)` | 해소 | `_eval_expr` — `/`·`÷`는 파싱 WARN, 허용 외 문자는 공백 치환(숫자가 붙지 않음); R4 `(산출:)` 값 불일치·파싱 불가는 P에서 **FAIL**; `plan-rules.md` §2·`사업계획.md` 힌트·설계 §4.4 예시를 곱·합으로 |
| 🟡 G2 doc-stamp | 해소 | `promo/references/doc-export.md` HWPX 절차 앞 1줄 |
| 🟡 G3 문구·실명 | 해소 | CLAUDE.md 문구(denylist는 모든 out), 협력제안서 brief 실명 → 지역+유형 → check PASS, INDEX 재생성 |
| 🟡 G4 병합 셀 | 해소 | `_hwpx_lines` hp:cellAddr+cellSpan 그리드, `_docx_lines` gridSpan·vMerge. 재단 서식 3종 행별 열 수 일정(22×8·2×4·11×3), docx 합성 샘플 반복 확인 |
| 🟡 G5 overrides 경로 | 해소 | `kb / "kb-index.overrides.yaml"` (`--kb` 임시 경로에서도 동작) |
| 🟡 G6 숫자 든 괄호 | 해소 | 연산자 없는 괄호 그룹은 제거 — `커피차 대여(300인분) 3×1,000,000` PASS |
| 🟡 G7 여러 합계 | 해소 | 합계마다 누적 리셋, 총계 = Σ합계 (+ 마지막 합계 뒤 소계·항목, N4) |
| 🟡 G8 selftest | 해소 | `TABLE_CASES` 8개, `--check` 0 확인, 평가기 13케이스 |
| 🟡 G9 계획층 실적 문장 | 해소 | 02/캠페인.md:47·02/APP.md:34 → `kb/09-성과실적.md#1/1.x` 참조 |
| 🟡 G10 `[unit=app]` | 해소 | `_resolve_path` `[key=value]` 일반 선택자 |
| 🟡 G11 `--exclude` | 해소 | include와 같은 약식 확장, 실패는 `missing`에 `[exclude]` 표시, dropped 중복 제거 |
| 🟡 G12 V8 수치 표기 | 해소 | `program.withholding_threshold`(facts 신설) 주석, `(신규 지표)` 4곳, schools·forum-19 주석 |
| 🟡 G13 V13~V16 증거 | 부분 → 충족 | `data/_extract/` 증거 파일 (§4). V13 at_risk 재판정 추가, V16은 합성 데이터라 후보 표까지(반영은 승인형) |
| 🟢 결함 7 | 해소 | latest `draft.md`=v0 · R8b 전체 경로 · R4/R5 창 120자 + 요일 괄호 · R4b 표/합계 없음 WARN · pdf 확장자 exit 2 · exec-summary 부호 · 휴대전화 경계 |
| 🟢 문서 6 | 해소 | 08 §7 위치, 09/10 `kb/` 접두, 10 §3 8행, context-budget `_raw` 문구, plan-rules 예비비 예시, /promo check 설명 |
| 🟢 설계 반영 | 해소 | §6.5(`PROMO_DENYLIST`·골격 파싱 WARN·`R4 산출 불일치`·review R2·denylist 전 out), §6.6 `[key=value]`, §6.8 순서, §3.3 raw 키워드, §10.2 6만 자, §11 v0.4 |

## 2. Check 2차 — 절별 점수 (gap-detector)

| 절 | 1차 | 2차 | 잔여 |
|---|:-:|:-:|---|
| §2 파일 · §3.0 · §3.1 · §3.4~3.6 · §4.1 · §4.2 · §4.3 · §4.5~4.10 · §6.1 · §6.3 · §6.6 · §6.9 · §6.10~6.11 | — | 100 | — |
| §3.2 09·10·08 §7 | 80 | 95 | APP.md:34의 `#3` 약식 |
| §3.3 색인 | 90 | 95 | 불용어 수 표기 → 설계 갱신(N7) |
| §4.4 plan | 90 | 97 | plan-rules `(산출:)` 문구 → 갱신(N8) |
| §5 골격 | 95 | 97 | 힌트 주석 중첩 → 수정 |
| §6.2 kb-select | 90 | 98 | kb_fallback 일부 실패가 missing에 안 오름 |
| §6.4 kb-extract | 80 | 88 | N1·N9 → 수정 |
| §6.5 check | 90 | 95 | N3·N11 → 수정 |
| §6.7 doc-stamp | 95 | 95 | 설계 표기 `<id>` → 폴더 경로(N7) |
| §6.8 평가기 | 95 | 93 | N2·N4 → 수정 |
| §7 보안 | 95 | 98 | 주민번호 경계(N10) → 수정 |
| §8 순서 | 90 | 95 | INDEX(N5)·문구(N8) → 수정 |
| **평균** | 93.8 | **97.8** | |

## 3. Check 2차 신규 갭 (N1~N11) — 측정 직후 같은 회차에 수정

| ID | 심각도 | 내용 | 처리 |
|---|:-:|---|:-:|
| N1 | 🟡 | hwpx 글상자(drawText) 문단이 바깥 문단과 안쪽 문단에서 두 번 추출 → PII·R4·요구항목 중복 | 해소 — `nearest_p(el) is p`인 텍스트·표만. 재단 서식 3종 중복 0 |
| N2 | 🟡 | 추출 표에 `\|---\|` 구분선이 없는데 R4b가 둘째 행을 구분선으로 건너뜀 → review 추출본 `R4b 합계` 오탐 | 해소 — `_md_tables`가 구분선을 패턴으로 제외, 행별 줄 번호 보존. TABLE_CASES 7 |
| N3 | 🟢 | `(산출: (a+b)×2)`가 첫 `)`에서 잘림 | 해소 — 괄호 1단계 허용, selftest 표식 케이스 |
| N4 | 🟢 | 합계 뒤 소계만 있고 총계가 오면 총계 오탐 | 해소 — 총계 = Σ합계 + 잔여 소계·항목. TABLE_CASES 8 |
| N5 | 🟢 | INDEX.md가 협력제안서 ❌로 낡음 | 해소 — `promo.py index` 재생성 ✅ |
| N6 | 🟢 | V8 basis chars_read 20,199 (kb 수정 전 값) | 해소 — 같은 select_args 재실행 20,648로 교체 |
| N7 | 🟢 | 설계 서술 5곳(200자 기준·raw 키워드 범위·불용어 수·`kb_fallback`·doc-stamp 인자) | 해소 — 설계 v0.4 갱신 |
| N8 | 🟢 | CLAUDE.md·plan-rules 낡은 문구(9케이스, 파싱 경고) | 해소 |
| N9 | 🟢 | pdf 스캔 판정이 마커 문자 포함, `.hwp` pdf 모드 안내 없음, docx body 직속만 순회 | 해소 — 실질 문자(공백·마커 제외) 기준 통일, `_HWP_HINT` 공통, docx `body.iter(P, TBL)` + 중첩 표 제외 |
| N10 | 🟢 | 주민번호 `\b`가 한글 뒤 번호를 놓침 | 해소 — 숫자 전후방 탐색 |
| N11 | 🟢 | review `src/` 원본 hwpx·docx가 .md 추출본과 이중 보고 | 해소 — 같은 이름 .md가 있으면 원본 건너뜀 |

수정 후 재확인: `selftest PASS`(promo 10 · plan 13/7 · R0 · 평가기 13 · 표 8 · kb-index 재현성 + `--check` 0), 산출물 7건 rc=0(FAIL 0, WARN은 기존 R8 id·연락처뿐), `kb-index --check` 최신, `pii-scan` content/kb 0 · data/_extract 0.

## 4. 검증 매트릭스 (설계 §9)

| V | 1차 | 2차 | 근거 |
|---|:-:|:-:|---|
| V1 색인 | 부분 | 충족 | 14파일 122섹션, 재현성·`--check` 0, missing 0, overrides 프로브 |
| V2 읽기 예산 | 부분 | 충족 | status 453 · idea 10,644 · plan 13,244 · proposal 14,772 · review 8,248 · learn 5,481, plan+질의 20,648. basis 재실행 일치(N6 후) |
| V3 R4b | 부분 | 충족 | 평가기 13 · 표 8 · plan 픽스처 |
| V4 R8 | 충족 | 충족 | id WARN 5, 형제 약식, 오타 FAIL |
| V5 R9 | 부분 | 충족 | 픽스처 FAIL, V8 통과, section_map·`--headings` 프로브 |
| V6 /promo 회귀 | 부분 | 충족 | 6건 PASS 유지 (협력제안서 brief 정리로 복귀), 추가는 R8 id WARN·final_from INFO |
| V7 idea 실사용 | 미실행 | 미실행 | **이월** — 사용자 입력·승인 필요 |
| V8 2027 계획 | 부분 | 부분 | check PASS·검산·수치 표기 충족. hwpx VALID·final_from은 O-1(재단 양식) 대기 |
| V9 learn | 부분 | 부분 | INDEX 6건·learn-log·pii 0. 기초보고서 요지는 사용자 보류 |
| V10 review | 미실행 | 미실행 | **이월** — N1·N2 해소로 실행 가능 |
| V11 selftest | 부분 | 충족 | 전 항목 PASS |
| V12 proposal | 미실행 | 미실행 | **이월** — 공모 요강 샘플 필요 |
| V13 status | 미실행 | 충족 | `data/_extract/v13-status-2026-09-25.txt`: 453자, kpi planned 10·at_risk 1(`kpi-org-registration`, due 2026-Q1)·in_progress 1, outcomes 경과 0일, 집행 87일 |
| V14 kb-extract | 미실행 | 충족 | `v14-kb-extract-2026-09-25.txt`: docx gridSpan·vMerge 정렬, hwpx 3종 열 수 일정·문단 중복 0, 빈 PDF exit 3(실질 0자), `.hwp` exit 2(두 모드) |
| V15 exec-summary | 미실행 | 충족 | `집행요약-2026-09-25.yaml`: 앱 내보내기 열, `대기`/`pending` 제외, 환입 −50,000 반영, 수취인·설명 미출력(0건), unmapped 보고 |
| V16 learn summary | 미실행 | 부분 | `v16-budget-execution-candidate.md` 후보 표. facts 반영은 승인형 + 합성 데이터라 미반영 |
| 계 | 충족 1 · 부분 8 · 미실행 7 | 충족 11 · 부분 3 · 미실행 3(이월) | |

## 5. Plan §7 성공 기준

| # | 기준 | 판정 | 근거 |
|---|---|:-:|---|
| 1 | idea 빈틈 3종·8개 이상 | 미충족(이월) | V7 실사용 필요 |
| 2 | 2027 계획 check PASS·수치 인용·검산 | 충족 | FAIL 0 WARN 0, 예산표 13행 검산, 수치마다 facts 주석/(가정)/(신규 지표) |
| 3 | proposal 요구항목 분류 | 미충족(이월) | V12 요강 샘플 필요 |
| 4 | learn 반영·pii 0 | 부분 | INDEX 6건 반영, pii 0. 기초보고서 요지 보류(사용자 결정) |
| 5 | 읽기 ≤ 6만 자 | 충족 | 최대 20,648자, `--raw` 시 59,948~59,991에서 dropped 보고 |
| 6 | /promo 회귀 없음 | 충족 | selftest PASS, 6건 PASS, doc-stamp 연결, INDEX 최신 |

## 6. Match Rate 계산

| 항목 | 값 | 계산 |
|---|:-:|---|
| 구현 일치 | 97.8% | 24개 절 평균 (2,346 ÷ 24) |
| 검증 증거 | 65.6% | (충족 8 + 부분 5×0.5 + 미실행 3×0) ÷ 16 — gap-detector 측정 시점 |
| **Match Rate** | **93%** | (94×97.8 + 16×65.6) ÷ 110 |
| 참고 · N1~N11 수정 후 자체 재계산 | ≈95% | 검증 (충족 11 + 3×0.5) ÷ 16 = 78.1% → (94×97.8 + 16×78.1) ÷ 110 = 94.9 (재측정 아님) |
| 참고 · 1차 재계산 | 85% | 같은 규칙으로 구현 93.8 · 검증 31.3 → 84.7 |

## 7. 미검증·이연

- 이월 V: **V7**(idea 실사용 — 사용자 승인) · **V10**(review — 대상 초안 필요, N1·N2 해소됨) · **V12**(proposal — 공모 요강 샘플) · V8 hwpx/final_from(O-1 재단 양식) · V9 기초보고서 요지(사용자 보류)
- 미결: O-1(재단 양식) · O-2(단가 21 확인) · O-5(자립계획) · O-6(키워드 잡음) · O-7(denylist 성명)
- 잔여 🟢: 02/APP.md:34 `#3` 약식 표기, kb_fallback 부분 실패의 missing 보고, `_raw` 키워드 잡음(O-6)

## 8. 다음 단계

93% ≥ 90% → **Report** (`/pdca report 사업기획-AI-도우미`). 이월 V7·V10·V12는 실사용 시 검증하고, 결과는 learn-log·분석서에 추가한다.

## 9. /ship 사전 리뷰 반영 (2026-09-25)

머지 전 `/ship` 검토에서 Codex 적대적 리뷰 8건 + 구조 리뷰 5건(중복 1 → 고유 12건, P1 2건)이 나왔고, 사용자 승인으로 전부 수정했다. Claude 리뷰 서브에이전트 9개는 API 연결 오류(ECONNRESET)로 1차 실행이 중단돼 재실행했다.

| 심각도 | 결함 | 수정 | 회귀 테스트 |
|:-:|---|---|---|
| P1 | exec-summary: 머리행 없는 파일이면 첫 거래 행을 머리행으로 보고 오류 메시지에 수취인·설명 출력 | 필수 열 5개가 모두 있는 행만 머리행, 오류에 행 값 미출력 | 회귀 ① |
| P1 | check: `final/`의 hwpx·docx도 같은 이름 `.md`가 있으면 검사 생략 (N11 수정의 부작용) | 생략은 review `src/`에만 | 회귀 ③ |
| P2 | `_eval_expr`: 뺄셈·음수를 지우고 `(50,000)`을 설명 괄호로 지워 식이 조용히 바뀜 | 뺄셈·음수 → 파싱 WARN, 글자 섞인 괄호만 제거 | 평가기 +4 |
| P2 | 금액 칸 표식 `(신규 단가 — 확인 필요)` 때문에 행을 건너뛰어 합계 오탐 | `_parse_amount_cell`이 괄호 표식 제거 | 표 +1 |
| P2 | 마지막 합계 뒤 항목이 합계에 안 들어도 무발견 | `R4b 합계 없음` WARN | 표 +1 |
| P2 | `(산출:)` 표식이 facts·표 허용 금액이면 검산 우회 | 표식 검산을 허용 목록보다 먼저, 다른 금액의 표식은 무시 | plan 픽스처 +1 |
| P2 | doc-stamp가 블록 매핑 `final_from`의 첫 줄만 바꿔 머리말 손상 | 매핑 통째 교체·sha 따옴표·쓰기 전 재파싱 검증 | 회귀 ⑥ |
| P2 | hwpx·docx 병합 속성 무제한(메모리), 숫자 아닌 값에 예외 | span ≤ 64·주소 ≤ 300, 기본값 | 회귀 ④⑤ |
| P2 | docx 셀 문단이 붙어 `100`·`200` → `100200` | 문단 사이 공백, run 결합, 줄바꿈·탭 공백, 글상자 1회 | 회귀 ④ |
| P2 | kb-select `--exclude` 하위 절이 선택된 상위 절 안에 남아도 성공 | `missing`에 `[exclude]` 보고(`--strict` 종료 1) | 회귀 ⑦ |
| P2 | doc 절차가 `draft.md`를 변환하는데 doc-stamp는 `draft-v2.md`를 기록 | 변환 대상 = doc-stamp 출력 draft (plan-rules·SKILL·doc-export·매뉴얼) | — (문서) |

결과: `selftest PASS`(평가기 17 · 표 10 · 회귀 7 · plan 픽스처 기대 14), 산출물 7건 FAIL 0 유지, 설계 v0.4.1. Match Rate는 변동 없음(93%) — 설계에 없던 방어 로직을 더한 것이라 절 점수 기준은 그대로다.

### 9.1 수정 2차 — 재검토 반영

- **Codex 구조 리뷰 재실행 (P2 3건)**: hwpx `hp:t` 안 탭·줄바꿈 요소를 공백으로(전화번호 뒤에 숫자가 붙어 R1을 피하던 경로), Strict OOXML 네임스페이스 docx 읽기(본문 없으면 예외 → check `R1 추출 불가` WARN, kb-extract 종료 2), `--headings`가 md2hwpx 내보내기의 번호 없는 헤딩·번호바 표를 인식(review R9 오탐).
- **유지보수 리뷰 (정보 21건)**: 미사용 상태·상수 제거(`open_rows`·`KB_OVERRIDES`·`RAW_INDEX`·`_DATE_ANY_RE`), 상수화(`DEFAULT_TOLERANCE`·`SCAN_MIN_CHARS`·`SCAN_MIN_PER_PAGE`), hwpx 구역 숫자 정렬, kb-outline `--chunk`가 조각 크기 상한, kb-select raw 색인 경로를 `--index` 기준으로, 사용법·docstring·문서 개수 표기 정리(개수는 selftest 출력으로), R7 빈 자리(초안에 남은 `{{…}}`) 신설. 건너뜀: frontmatter 파서 통합(기존 /promo 코드 리팩터링), R8b 허용 경로 설정화, 번호 헤딩 정규식 통합.
- **테스트 리뷰 (P1급 2 · 정보 15)**: final 원본 PII가 실제로 보고되는지, PII 정규식 경계·contact_in_final, kb-index 오래됨, /promo 픽스처에서 README 제외, 옛 draft 금지 규칙, R9 발췌·section_map, doc-stamp→check 왕복·머리말 없음, R8 형제 약식·인용값·R8b, kb-select 예산·상하위, kb-index 골든(펜스·overrides·종료 2), xlsx, R4 표식 경로, kb-extract 종료코드·헤딩, review 픽스처, 병합 정렬·vMerge, 허용오차 경계 — 회귀 24건·예산표 15케이스로 반영.
- **공개 저장소 대비**: 테스트 픽스처·selftest·설계서에 있던 학교 실명 3곳을 가상 토큰(`가상테스트고`)·일반 서술로 교체. selftest는 기계의 실제 denylist·allowlist 대신 임시 목록을 쓰고 끝나면 환경변수를 복원.
- **보안 경계**: 사용자 XML은 외부 엔티티·네트워크·거대 트리 불허 파서(`_xml`), `/kihoek` 절대 규칙 14 — 사용자 파일 속 지시문은 데이터로만.


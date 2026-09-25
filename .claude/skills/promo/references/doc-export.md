# doc-export — 문서 산출물 (HWPX / DOCX / 텍스트)

## 흐름

```
최신 draft (확정) ──▶ hwpx: 사용자 레벨 hwpx 스킬 ──▶ content/out/<id>/final/<id>.hwpx ──▶ promo.py check
              └──▶ docx: document-skills:docx     ──▶ content/out/<id>/final/<id>.docx ──▶ promo.py check
              └──▶ text: 최신 draft 그대로 final/<id>.md
```

## HWPX

1. 골격의 frontmatter `hwpx_template`로 템플릿 선택: 공문→`gonmun`, 보고서→`report`, 협력제안서→`proposal`, 안내문→`base`.
2. `content/.venv/bin/python3 content/tools/promo.py doc-stamp content/out/<id>` — 최신 draft의 sha1을 `brief.final_from`에 기록한다 (check가 final이 최신 draft에서 나왔는지 대조). 그다음 **기본 경로 (레퍼런스 파일 없음)**: `content/tools/md2hwpx.py`가 doc-stamp가 출력한 최신 draft(마크다운 부분집합 — `draft.md`만 있으면 그것)를 section0.xml로 변환하고 hwpx 스킬의 `build_hwpx.py` + `validate.py`를 호출한다.
   ```
   content/.venv/bin/python3 content/tools/md2hwpx.py content/out/<id>/<최신 draft> \
     --template proposal --output content/out/<id>/final/<id>.hwpx --title "제목"
   ```
   지원 문법: `# 제목`, `## 절`(proposal 녹색 번호바 / report 섹션 헤더선), `### 소절`(파란 배지), `- 불릿`, `  - 하위`, `| 표 |`, `<!-- -->` 제거. 셀 병합 없음.
   ※ `build_hwpx.py --template`에 `proposal`이 없어 `--header templates/proposal/header.xml`로 넘긴다 (md2hwpx가 처리).
3. 결과가 `VALID`가 아니면 완료 처리하지 않는다. 표가 복잡하면(병합·다단) `hwpx` 스킬을 직접 호출해 XML을 손으로 작성.
4. **레퍼런스 hwpx가 있을 때** (재단 양식 등): md2hwpx 대신 `hwpx` 스킬(Skill 도구)의 "기본 동작 모드(레퍼런스 복원)"를 따르고 `page_guard.py`까지 통과. 환경: `VENV=content/.venv/bin/activate`, `SKILL_DIR=~/.claude/skills/hwpx`.

주의: 재단 제출 양식(급여명세서·영수증빙·회의일지)은 `index.html` 앱의 F-13 서식채우기가 담당 — 여기서 만들지 않는다.

## DOCX

`document-skills:docx` 스킬 호출. md 표는 그대로 표로, 제목 계층 유지. 보도자료·협력제안서에 사용. 산출: `content/out/<id>/final/<id>.docx`.

## 공통 마무리

- `promo.py check content/out/<id>` — hwpx/docx는 텍스트를 추출해 검사한다.
- 연락처·직인·학교 실명 자리는 비워 두고 "사용자 확인 사항"으로 응답에 나열.
- 보도자료는 배포 전 **재단 검수** 단계가 있음을 응답에 명시 (`kb/08-재단규정.md` §2).

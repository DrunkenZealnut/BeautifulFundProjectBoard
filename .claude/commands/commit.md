# Commit Changes

변경사항을 커밋합니다.

## 절차

1. `git status`로 변경 파일 확인
2. `git diff`로 변경 내용 분석
3. `git log --oneline -5`로 최근 커밋 스타일 확인
4. 한국어 커밋 메시지 작성 (prefix: feat/fix/docs/style/refactor)
5. 변경된 파일만 선택적으로 `git add`
6. 커밋 실행

## 커밋 메시지 규칙

- prefix: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`
- 한국어로 간결하게 작성
- 예: `feat: 갤러리 카테고리 필터 추가`
- 예: `fix: 원천징수 계산 오류 수정`

## 주의사항

- .env 파일 절대 커밋 금지
- index.html 변경 시 영향 범위 확인
- SQL 마이그레이션 파일은 별도 커밋 권장

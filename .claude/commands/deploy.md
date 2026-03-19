# Deploy to Vercel

Vercel 배포를 위해 main 브랜치에 푸시합니다.

## 절차

1. `git status`로 커밋되지 않은 변경사항 확인
2. 미커밋 변경이 있으면 먼저 커밋 안내
3. `git log --oneline -3`으로 배포될 커밋 확인
4. 사용자 확인 후 `git push origin main` 실행
5. Vercel 자동 배포 트리거 안내

## 주의사항

- 반드시 사용자 확인 후 push
- Supabase 스키마 변경이 있으면 SQL 먼저 실행했는지 확인
- vercel.json의 CSP 헤더가 새 CDN 추가 시 업데이트 필요할 수 있음

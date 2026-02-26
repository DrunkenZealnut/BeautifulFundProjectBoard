# Supabase 설정 가이드

아름다운재단 2026 공익단체 인큐베이팅 지원사업 관리시스템을 위한 Supabase 데이터베이스 설정 가이드입니다.

## 📋 설정 정보

**프로젝트 정보:**
- Project URL: `https://exnloiyzmdzbhljwwxrs.supabase.co`
- Public API Key: `sb_publishable_6EjqM_6qP_wFQGD54P2M9Q_eULAJHnJ`

## 🚀 설정 단계

### 1단계: 데이터베이스 스키마 생성

1. Supabase Dashboard에 로그인합니다
2. 프로젝트 (`exnloiyzmdzbhljwwxrs`)에 접속합니다
3. SQL Editor로 이동합니다
4. `supabase-schema.sql` 파일의 내용을 복사하여 실행합니다

**주요 테이블:**
- `users` - 사용자 관리
- `budget_executions` - 예산 집행
- `documents` - 증빙서류
- `schedules` - 일정 관리
- `participants` - 참여자
- `galleries` - 갤러리
- `boards` - 게시판
- `attachments` - 첨부파일
- `comments` - 댓글
- `activity_logs` - 활동 로그
- `system_settings` - 시스템 설정

### 2단계: Row Level Security (RLS) 확인

스키마 실행 후 다음 RLS 정책이 적용되었는지 확인합니다:

```sql
-- 공개 읽기 정책
CREATE POLICY "Public read access for schedules" ON public.schedules
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public read access for galleries" ON public.galleries
    FOR SELECT USING (is_public = true);

CREATE POLICY "Public read access for boards" ON public.boards
    FOR SELECT USING (is_public = true AND status = 'published');
```

### 3단계: 샘플 데이터 확인

스키마 실행 후 다음 샘플 데이터가 생성되었는지 확인합니다:

**시스템 설정:**
- 사이트 이름, 조직명, 총 예산 등

**기본 사용자:**
- 관리자 계정 (username: admin)

**샘플 데이터:**
- 3개 일정 (노동안전보건 교육, 캠페인, 회의)
- 2개 갤러리 이미지
- 3개 게시글 (공지, 자료, FAQ)

### 4단계: 웹 애플리케이션 실행

1. `index-supabase.html` 파일을 브라우저에서 열기
2. 데이터가 정상적으로 로딩되는지 확인

## 📊 데이터 구조

### 예산 관리 (budget_executions)
```sql
- id: UUID (Primary Key)
- subcategory_id: 예산 소분류 ID
- amount: 집행 금액
- payment_method: 결제 방법 (카드/계좌이체)
- execution_date: 집행일
- status: 상태 (pending/approved/executed/completed)
```

### 일정 관리 (schedules)
```sql
- id: UUID (Primary Key)
- title: 일정 제목
- category: 분류 (교육/캠페인/회의/평가/기타)
- start_date, end_date: 시작일, 종료일
- location: 장소
- max_participants: 최대 참여자 수
```

### 갤러리 (galleries)
```sql
- id: UUID (Primary Key)
- title: 제목
- category: 분류 (현장사진/결과물/교육자료/캠페인/행사/기타)
- image_path: 이미지 경로
- taken_date: 촬영일
- photographer: 촬영자
```

### 게시판 (boards)
```sql
- id: UUID (Primary Key)
- board_type: 게시판 종류 (notice/materials/faq/qna/report)
- title: 제목
- content: 내용
- author_id: 작성자 ID
- is_pinned: 고정 여부
```

## 🔐 보안 설정

### Row Level Security (RLS)
모든 테이블에 RLS가 활성화되어 있습니다:

**공개 데이터:**
- 공개 설정된 일정, 갤러리, 게시글은 인증 없이 조회 가능

**제한된 데이터:**
- 예산 집행, 개인정보 등은 인증된 사용자만 접근 가능

### API 키 관리
- **Public Key**: 클라이언트에서 사용 (읽기 전용)
- **Service Key**: 서버에서 사용 (관리자 권한)

## 📱 사용 방법

### 1. 대시보드
- 전체 현황 요약
- 예산 집행률, 일정, 갤러리, 게시글 통계

### 2. 예산 관리
- 예산 집행 현황 및 내역
- 예산 집행률 시각화

### 3. 일정 관리
- 사업 일정 목록
- 일정별 상태 및 참여자 정보

### 4. 갤러리
- 사업 현장 사진 및 결과물
- 카테고리별 분류

### 5. 게시판
- 공지사항, 자료실, FAQ
- 게시글 종류별 필터링

## 🔧 개발자 정보

### API 엔드포인트
```javascript
const supabase = window.supabase.createClient(
    'https://exnloiyzmdzbhljwwxrs.supabase.co',
    'sb_publishable_6EjqM_6qP_wFQGD54P2M9Q_eULAJHnJ'
);
```

### 주요 쿼리 예시
```javascript
// 일정 조회
const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .order('start_date', { ascending: true });

// 게시글 조회 (작성자 정보 포함)
const { data: boards } = await supabase
    .from('boards')
    .select('*, author:users(name)')
    .eq('status', 'published');
```

## 🆘 문제 해결

### 연결 오류
1. Project URL과 API Key 확인
2. 네트워크 연결 상태 확인
3. Supabase 서비스 상태 확인

### 데이터 로딩 오류
1. RLS 정책 확인
2. 테이블 구조 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 권한 오류
1. 사용자 인증 상태 확인
2. RLS 정책 검토
3. API Key 권한 확인

## 📞 지원

**개발팀**: Claude Code 개발팀
**프로젝트 관리**: 청년노동자인권센터
**지원기관**: 아름다운재단

---

이 설정 가이드를 통해 Supabase 데이터베이스와 연동된 완전한 프로젝트 관리 시스템을 구축할 수 있습니다.
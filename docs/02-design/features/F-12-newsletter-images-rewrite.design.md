# F-12 뉴스레터 이미지 삽입 + 글 재가공 Design

> **Created**: 2026-03-20
> **Plan Reference**: `docs/01-plan/features/F-12-newsletter-images-rewrite.plan.md`
> **Level**: Starter → Dynamic 확장

---

## Goal

게시판 첨부 이미지를 뉴스레터에 자동 표시하고, 게시글 본문을 Claude API로 뉴스레터 톤으로 재가공한다.

---

## How It Works

```text
Part 1 — 이미지:
게시글 체크박스 선택
  → attachments 테이블에서 board_id로 이미지 조회
  → Supabase Storage publicUrl 생성
  → 미리보기 카드에 이미지 표시
  → 인쇄/SNS 복사 시 이미지 포함

Part 2 — AI 재가공:
게시글 카드의 "✨ AI 재가공" 버튼 클릭
  → POST /api/rewrite (원본 텍스트 전송)
  → Claude API가 뉴스레터 톤으로 변환
  → 결과를 state에 저장 (boardId → rewrittenText)
  → 미리보기에 재가공 텍스트 표시 (원본 토글 가능)
```

---

## Implementation Design

### Part 1: 이미지 삽입

#### 1-1. State 추가

`ProjectManagementSystem` 내 useState 영역에 추가:

```javascript
// boardId → [imageUrl, ...] 매핑
const [boardImageUrls, setBoardImageUrls] = useState({});
```

#### 1-2. 이미지 로드 로직

게시글 체크박스 `toggleBoard()` 호출 시 또는 `selectedBoardIds` 변경 시 이미지 조회:

```javascript
// useEffect — selectedBoardIds 변경 시 이미지 로드
useEffect(() => {
    const loadImages = async () => {
        const newUrls = { ...boardImageUrls };
        for (const boardId of selectedBoardIds) {
            if (newUrls[boardId]) continue; // already loaded
            const { data: atts } = await supabase
                .from('attachments')
                .select('file_path, file_type')
                .eq('board_id', boardId)
                .order('created_at', { ascending: true });
            const images = (atts || []).filter(a => a.file_type?.startsWith('image/'));
            newUrls[boardId] = images.map(img => {
                const { data } = supabase.storage.from('attachments').getPublicUrl(img.file_path);
                return data?.publicUrl || null;
            }).filter(Boolean);
        }
        setBoardImageUrls(newUrls);
    };
    if (selectedBoardIds.size > 0) loadImages();
}, [selectedBoardIds.size]);
```

#### 1-3. 미리보기 카드에 이미지 표시

게시글 미리보기 카드 (`selectedBoardsArr.map`) 내부, 제목 아래에 이미지 삽입:

```jsx
{/* 첨부 이미지 */}
{(boardImageUrls[b.id] || []).length > 0 && (
    <div style={{ margin: '8px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {boardImageUrls[b.id].map((url, i) => (
            <img key={i} src={url} alt=""
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10, objectFit: 'cover' }} />
        ))}
    </div>
)}
```

#### 1-4. 인쇄 HTML에 이미지 삽입

`generateNewsletterHTML` 내 `boardsSection`에서, 게시글 카드의 `<h3>` 다음에 이미지 `<img>` 삽입.

`generateNewsletterHTML` 시그니처에 `boardImageUrls` 파라미터 추가:

```javascript
const generateNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName, boardImageUrls = {}, rewrittenContents = {}) => {
```

boardsSection 내부에서:
```javascript
const imageHtml = (boardImageUrls[b.id] || []).map(url =>
    `<img src="${esc(url)}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;display:block;" />`
).join('');
// ... <h3> 다음에 ${imageHtml} 삽입
```

### Part 2: AI 글 재가공

#### 2-1. Vercel Serverless Function — `/api/rewrite.py`

```python
"""POST /api/rewrite — Rewrite text in newsletter tone using Claude API"""
import json
import os
from http.server import BaseHTTPRequestHandler
import urllib.request

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

SYSTEM_PROMPT = """당신은 공익단체 뉴스레터 편집자입니다.
주어진 게시글 본문을 다음 규칙에 따라 뉴스레터에 적합하게 재작성하세요:
- 2,30대가 읽기 편한 친근하고 따뜻한 톤
- 핵심 정보는 유지하되, 딱딱한 업무용 표현을 부드럽게 변환
- 200자 이내로 간결하게 요약
- 이모지 1-2개 자연스럽게 포함
- 마크다운 없이 순수 텍스트로 작성"""

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            body = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
            text = body.get('text', '')
            if not text.strip():
                self._json(400, {'error': '텍스트가 비어있습니다.'})
                return
            if not ANTHROPIC_API_KEY:
                self._json(500, {'error': 'API 키가 설정되지 않았습니다.'})
                return

            # Call Claude API
            req_data = json.dumps({
                'model': 'claude-sonnet-4-20250514',
                'max_tokens': 500,
                'system': SYSTEM_PROMPT,
                'messages': [{'role': 'user', 'content': f'다음 게시글을 뉴스레터용으로 재작성해주세요:\n\n{text}'}]
            }).encode()
            req = urllib.request.Request(
                'https://api.anthropic.com/v1/messages',
                data=req_data,
                headers={
                    'Content-Type': 'application/json',
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01'
                }
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                result = json.loads(resp.read())
                rewritten = result['content'][0]['text']
                self._json(200, {'rewritten': rewritten})

        except Exception as e:
            self._json(500, {'error': str(e)})

    def _json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
```

#### 2-2. State 추가

```javascript
// boardId → rewritten text
const [rewrittenContents, setRewrittenContents] = useState({});
const [rewritingBoardId, setRewritingBoardId] = useState(null); // loading state
```

#### 2-3. 재가공 호출 함수

```javascript
const handleRewriteBoard = async (boardId, originalText) => {
    setRewritingBoardId(boardId);
    try {
        const resp = await fetch('/api/rewrite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: originalText.replace(/<[^>]*>/g, '') })
        });
        const data = await resp.json();
        if (data.rewritten) {
            setRewrittenContents(prev => ({ ...prev, [boardId]: data.rewritten }));
        } else {
            alert(data.error || 'AI 재가공 실패');
        }
    } catch (e) {
        alert('AI 서버 연결 실패');
    } finally {
        setRewritingBoardId(null);
    }
};
```

#### 2-4. 미리보기 카드에 재가공 버튼 + 결과 표시

```jsx
{/* AI 재가공 버튼 */}
<div style={{ marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
    <button onClick={() => handleRewriteBoard(b.id, b.content)}
        disabled={rewritingBoardId === b.id}
        style={{ fontSize: 10, padding: '4px 10px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fafafa' }}>
        {rewritingBoardId === b.id ? '재가공 중...' : '✨ AI 재가공'}
    </button>
    {rewrittenContents[b.id] && (
        <button onClick={() => setRewrittenContents(prev => { const n = {...prev}; delete n[b.id]; return n; })}
            style={{ fontSize: 10, padding: '4px 10px', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', background: '#fff' }}>
            원본 복원
        </button>
    )}
</div>

{/* 본문: 재가공 결과 또는 원본 */}
<div style={{ color: '#777', fontSize: 11 }}>
    {rewrittenContents[b.id] || stripHtml(b.content).slice(0, 200)}
</div>
```

#### 2-5. 인쇄 HTML에 재가공 텍스트 반영

`generateNewsletterHTML` 호출 시 `rewrittenContents` 전달:

```javascript
// boardsSection 내부에서
const displayContent = rewrittenContents[b.id]
    ? esc(rewrittenContents[b.id])
    : sanitized;
```

---

## Implementation Order

| Step | Task | FR | Est. Lines |
|------|------|----|:----------:|
| 1 | `boardImageUrls` state + useEffect 이미지 로드 | FR-01, FR-02 | ~20 |
| 2 | 미리보기 카드에 이미지 표시 | FR-03 | ~8 |
| 3 | `generateNewsletterHTML` 시그니처 확장 + 이미지/재가공 반영 | FR-04, FR-05 | ~15 |
| 4 | `api/rewrite.py` Vercel Serverless Function | FR-06, FR-07 | ~60 |
| 5 | `rewrittenContents` state + `handleRewriteBoard` 함수 | FR-06 | ~20 |
| 6 | 미리보기 카드에 재가공 버튼 + 결과/원본 토글 | FR-08, FR-09 | ~15 |
| 7 | `handlePrintNewsletter` / `handleCopyNewsletter` 호출 시 인자 추가 | FR-04, FR-05 | ~5 |

**총 예상 추가**: ~145줄 (index.html) + ~60줄 (api/rewrite.py)

---

## Completion Checklist

- [ ] 이미지 있는 게시글 선택 시 미리보기에 이미지 표시
- [ ] 이미지 없는 게시글은 기존과 동일하게 표시
- [ ] 인쇄 HTML에 이미지 `<img>` 포함
- [ ] SNS 복사 시 이미지 포함
- [ ] "✨ AI 재가공" 버튼 클릭 시 로딩 표시 → 결과 표시
- [ ] "원본 복원" 버튼으로 원래 텍스트 복원
- [ ] 재가공 결과가 인쇄/SNS 복사에도 반영
- [ ] `/api/rewrite` API가 정상 동작 (200 + rewritten 텍스트)
- [ ] ANTHROPIC_API_KEY 미설정 시 에러 메시지
- [ ] 기존 기능(필터, 인쇄, PDF, 한글) 정상 동작

---

## Notes

- **ANTHROPIC_API_KEY**: Vercel 프로젝트 설정 → Environment Variables에 추가 필요
- **이미지 URL**: `supabase.storage.from('attachments').getPublicUrl()` — 기존 갤러리 패턴과 동일
- **이미지 캐싱**: `boardImageUrls` state로 한번 로드 후 재조회 방지
- **AI 비용**: claude-sonnet-4-20250514 기준, 200자 입출력 ≈ $0.005/건
- **CSP**: Supabase Storage URL(`*.supabase.co`)은 이미 CSP `img-src`에 허용됨

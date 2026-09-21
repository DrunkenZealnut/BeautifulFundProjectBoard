# check 민감도 픽스처

`promo.py selftest`가 이 폴더를 임시 복사해 `check`를 돌리고 아래 규칙이 **모두** 검출되는지 확인한다.
의도적으로 위반을 담고 있으므로 실제 산출물로 쓰지 말 것.

| 규칙 | 심어 둔 위반 |
|---|---|
| R1 PII(휴대전화) | draft.md `010-1234-5678` |
| R1 PII(이메일) | draft.md `someone@example.com` |
| R2 deprecated | draft.md `캠페인 30회`, `청소년참견위원회` |
| R2 forbidden | draft.md `아름다운재단 후원` |
| R3 credit_line | final/no-credit.html (크레딧 없음) |
| R4 금액 | draft.md `9,999,999원` |
| R5 날짜 | draft.md `2026.12.25` |
| R5 날짜(M.D) | draft.md `10.15` (facts 토론회는 10.14) |
| R6 단체명 | draft.md `청년노동자 인권센터` |
| R7 빈 슬롯 | visual/card-square-01.yaml `title: ""` |

# Find Component in index.html

index.html 내 특정 컴포넌트나 함수를 찾아 해당 위치를 보여줍니다.

## 인자

$ARGUMENTS = 찾을 컴포넌트/함수 이름 (예: "BudgetManagement", "calculateTax", "갤러리")

## 절차

1. index.html에서 `$ARGUMENTS` 관련 코드를 Grep으로 검색
2. 컴포넌트 정의 위치 (const ComponentName = ...) 찾기
3. 해당 라인 번호와 주변 코드 5줄 표시
4. 관련 state, useEffect, handler 함수도 함께 안내

## 참고

- index.html은 ~7800줄이므로 라인 번호가 중요
- 주요 컴포넌트: ProjectManagementSystem, Dashboard, BudgetManagement, ScheduleManagement, Gallery, Board, AdminPage
- 유틸리티: fmt(), pct(), Icon(), calculateWithholdingTax()

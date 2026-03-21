// config.js — Global configuration, constants, and utility functions
const { useState, useEffect, useCallback, useRef, useMemo } = React;

// Supabase 설정
        // ⚠️  보안 주의: anon key는 no-build SPA 특성상 클라이언트에 노출됩니다.
        //    완화 조치: Supabase Dashboard → Authentication → URL Configuration
        //              → Allowed Origins에 실제 배포 도메인만 등록하세요.
        //    자세한 설정 방법: SUPABASE_SETUP.md → 보안 설정 섹션 참고
        const supabaseUrl = 'https://exnloiyzmdzbhljwwxrs.supabase.co';
        const supabaseKey = 'sb_publishable_6EjqM_6qP_wFQGD54P2M9Q_eULAJHnJ';

        // Supabase 클라이언트 초기화
        const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// 프로젝트 전역 설정
        // ===== 프로젝트 전역 설정 상수 =====
        const CONFIG = {
            TOTAL_BUDGET: 70000000,           // 총 사업비 7천만원
            WITHHOLDING_THRESHOLD: 125000,    // 원천징수 기준액 (이하 면세)
            INCOME_TAX_RATE: 0.08,            // 기타소득세율 8%
            LOCAL_TAX_RATE: 0.1,              // 지방소득세율 (기타소득세의 10%)
            PERIODS: {
                h1: { start: '2026-01-01', end: '2026-06-30' },
                h2: { start: '2026-07-01', end: '2026-12-31' }
            }
        };

        const DEFAULT_ORG_NAME = '청년노동자인권센터';

        // 예산 집행 상태 정보 (레이블 + 배지 색상)
        const EXECUTION_STATUS = {
            pending:   { label: '대기',   bg: '#FFF3CD', color: '#856404' },
            approved:  { label: '승인',   bg: '#D1ECF1', color: '#0C5460' },
            executed:  { label: '집행',   bg: '#D4EDDA', color: '#155724' },
            completed: { label: '완료',   bg: '#E2E3E5', color: '#383D41' }
        };

        // Utility functions for consistent number/percentage formatting
        const fmt = (n) => Math.round(n).toLocaleString();
        const parseInput = (s) => String(s).replace(/[^0-9]/g, '');
        const fmtInput = (v) => { const s = parseInput(v); return s ? fmt(Number(s)) : ''; };
        const pct = (spent, budget) => budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;

        // 비밀번호 SHA-256 해시 유틸리티 (최상위 스코프 - LoginPage·ProjectManagementSystem 공유)
        const hashPassword = async (password) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        };

        // ────────────────────────────────────────────────────────────
        // 급여지급명세서 자동생성
        // HWP 서식(0[서식]_급여지급명세서.hwp)의 구조를 그대로 반영한
        // 인쇄 가능한 HTML 문서를 생성해 새 창에 출력합니다.
        // 수급자(recipient)가 동일한 '운영인건비' 집행 전체를 집계합니다.

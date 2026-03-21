// documents.jsx — Document & newsletter HTML generators
// Dependencies: CONFIG, DEFAULT_ORG_NAME, EXECUTION_STATUS, fmt, pct, hashPassword (from config.js)
// Also uses: DOMPurify (CDN global)

        const generateSalaryStatementHTML = (targetExecution, allExecutions, orgSettings = {}, recipientProfile = null) => {
            const recipientName = targetExecution.recipient || '';
            const orgName = orgSettings.org_name || DEFAULT_ORG_NAME;

            // Seal image — only accept data: URLs to prevent XSS
            const sealDataUrl = (orgSettings.org_seal || '').startsWith('data:image/') ? orgSettings.org_seal : '';
            const sealHTML = sealDataUrl
                ? `<img src="${sealDataUrl}" style="height:70px;vertical-align:middle;margin-left:12px;" alt="단체직인">`
                : '(단체직인 또는 대표자 서명)';

            // 같은 수급자의 운영인건비 집행 전체를 날짜순 정렬
            // ID 중복 및 동일 날짜+금액 중복 제거 (이중 등록 방어)
            const seenIds = new Set();
            const seenDateAmount = new Set();
            const recipientExecutions = allExecutions
                .filter(e => {
                    if (e.recipient !== recipientName || e.type !== '운영인건비') return false;
                    if (seenIds.has(e.id)) return false;
                    seenIds.add(e.id);
                    const key = `${e.execution_date}|${e.amount}`;
                    if (seenDateAmount.has(key)) return false;
                    seenDateAmount.add(key);
                    return true;
                })
                .sort((a, b) => a.execution_date.localeCompare(b.execution_date));

            const totalAmount = recipientExecutions.reduce((sum, e) => sum + (e.amount || 0), 0);

            // 2열 배치 행 생성 (좌·우), 최소 6행 보장
            const pairs = [];
            for (let i = 0; i < recipientExecutions.length; i += 2) {
                pairs.push({ left: recipientExecutions[i], right: recipientExecutions[i + 1] || null });
            }
            while (pairs.length < 6) pairs.push({ left: null, right: null });

            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');

            const rowsHTML = pairs.map(({ left, right }) => `
                <tr>
                    <td style="text-align:center">${left ? left.execution_date : ''}</td>
                    <td style="text-align:right">${left ? left.amount.toLocaleString() : ''}</td>
                    <td style="text-align:right">${left ? '0' : ''}</td>
                    <td style="text-align:center">${right ? right.execution_date : ''}</td>
                    <td style="text-align:right">${right ? right.amount.toLocaleString() : ''}</td>
                    <td style="text-align:right">${right ? '0' : ''}</td>
                </tr>`).join('');

            return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>급여지급명세서 - ${recipientName}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '맑은 고딕', '나눔고딕', Arial, sans-serif; font-size: 10pt; background: #fff; color: #000; }
        .container { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 15mm; }
        h2 { text-align: center; font-size: 18pt; letter-spacing: 6px; margin-bottom: 20px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #000; padding: 5px 7px; font-size: 10pt; vertical-align: middle; }
        th { background: #e8e8e8; font-weight: bold; text-align: center; }
        .section-title { background: #c8c8c8; font-weight: bold; text-align: left; font-size: 10pt; }
        .lbl { background: #f2f2f2; font-weight: bold; width: 110px; white-space: nowrap; }
        .total-row { background: #f2f2f2; font-weight: bold; }
        .sign-area { margin-top: 24px; text-align: center; line-height: 2; }
        .attach-note { margin-top: 14px; font-size: 9pt; border-top: 1px solid #000; padding-top: 8px; }
        .btn-print { display: inline-block; margin: 20px 6px 0; padding: 10px 28px; font-size: 13px; cursor: pointer; border: none; border-radius: 6px; }
        @media print {
            body { margin: 0; }
            .container { padding: 12mm 10mm; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
<div class="container">
    <h2>급 여 지 급 명 세 서</h2>

    <table>
        <tr><td colspan="4" class="section-title">1. 지급받는사람</td></tr>
        <tr>
            <td class="lbl">성&nbsp;&nbsp;&nbsp;&nbsp;명</td>
            <td>${recipientName}</td>
            <td class="lbl">생 년 월 일</td>
            <td>${recipientProfile?.birth_date || ''}</td>
        </tr>
        <tr>
            <td class="lbl">주&nbsp;&nbsp;&nbsp;&nbsp;소</td>
            <td colspan="3">${recipientProfile?.address || ''}</td>
        </tr>
    </table>

    <table>
        <tr><td colspan="4" class="section-title">2. 지급자</td></tr>
        <tr>
            <td class="lbl">기&nbsp;&nbsp;관&nbsp;&nbsp;명</td>
            <td>청년노동자인권센터</td>
            <td class="lbl">사업자등록번호</td>
            <td>${orgSettings.org_registration_number || '<span style="font-size:9pt;color:#555">(고유번호가 없는 경우 생략)</span>'}</td>
        </tr>
        <tr>
            <td class="lbl">대 표 자 명</td>
            <td>${orgSettings.org_representative || ''}</td>
            <td class="lbl">대표자생년월일</td>
            <td style="font-size:9pt;color:#555">(고유번호가 있는 경우 생략)</td>
        </tr>
        <tr>
            <td class="lbl">기 관 주 소</td>
            <td colspan="3">${orgSettings.org_address || ''}</td>
        </tr>
        <tr>
            <td class="lbl">사 용 목 적</td>
            <td colspan="3">아름다운재단 지원사업 인건비 지급 증명</td>
        </tr>
    </table>

    <table>
        <tr><td colspan="6" class="section-title">3. 지급내역</td></tr>
        <tr>
            <th rowspan="2" style="width:17%">지급일자</th>
            <th colspan="2">지급액(원)</th>
            <th rowspan="2" style="width:17%">지급일자</th>
            <th colspan="2">지급액(원)</th>
        </tr>
        <tr>
            <th style="width:16%">지원금</th>
            <th style="width:16%">자부담</th>
            <th style="width:16%">지원금</th>
            <th style="width:16%">자부담</th>
        </tr>
        ${rowsHTML}
        <tr class="total-row">
            <td colspan="3" style="text-align:center">지급 합계액(원)</td>
            <td colspan="2" style="text-align:right">지원금: ${totalAmount.toLocaleString()}원</td>
            <td style="text-align:right">자부담: 0원</td>
        </tr>
    </table>

    <div class="sign-area">
        <p>위 금액을 지급하였음을 증명합니다.</p>
        <p style="margin-top:10px">${y}년 &nbsp;&nbsp; ${m}월 &nbsp;&nbsp; ${d}일</p>
        <p style="margin-top:20px">단체(기관)명 &nbsp;&nbsp; ${orgName} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${sealHTML}</p>
    </div>

    <div class="attach-note">
        <strong>첨부서류</strong> : 이체확인증, 급여 수령자 계좌사본
    </div>

    <div class="no-print" style="text-align:center">
        <button class="btn-print" style="background:#1B6B5A;color:#fff" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
        <button class="btn-print" style="background:#888;color:#fff" onclick="window.close()">✕ 닫기</button>
    </div>
</div>
</body>
</html>`;
        };

        const openSalaryStatement = (execution, allExecutions, orgSettings, recipients) => {
            const recipientProfile =
                recipients?.find(r => r.name === (execution.recipient || '').trim()) || null;
            const html = generateSalaryStatementHTML(execution, allExecutions, orgSettings || {}, recipientProfile);
            const win = window.open('', '_blank', 'width=900,height=700');
            if (!win) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
            win.document.write(html);
            win.document.close();
        };

        // ────────────────────────────────────────────────────────────
        // Meeting minutes (회의진행일지) HTML generator
        // Reflects the structure of HWP template 0[서식]_회의진행일지.hwp
        // Applicable execution types: 사업인건비, 사업회의비, 교육훈련비
        // ────────────────────────────────────────────────────────────
        // formData: { title, date, location, content, participants: string[] }
        const generateMeetingMinutesHTML = (formData, orgSettings = {}) => {
            const today = new Date();
            const y = today.getFullYear();
            const m = String(today.getMonth() + 1).padStart(2, '0');
            const d = String(today.getDate()).padStart(2, '0');

            // Escape user-supplied values to prevent XSS via document.write
            const esc = (s) => String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            // Preserve line breaks in free-text content after escaping
            const escMultiline = (s) => esc(s).replace(/\n/g, '<br>');

            const orgName = esc(orgSettings.org_name || DEFAULT_ORG_NAME);
            const orgRep = esc(orgSettings.org_representative || '');

            // Seal image — only accept data: URLs to prevent XSS
            const sealDataUrl = (orgSettings.org_seal || '').startsWith('data:image/') ? orgSettings.org_seal : '';
            const sealHTML = sealDataUrl
                ? `<img src="${sealDataUrl}" style="height:70px;vertical-align:middle;margin-left:8px;" alt="단체직인">`
                : '<span style="font-size:10pt;color:#555;">(단체직인 또는 대표자서명)</span>';

            const meetingTitle = esc(formData.title || '');
            const meetingDate = esc(formData.date || '');
            const meetingLocation = esc(formData.location || '');
            const meetingContent = escMultiline(formData.content || '');

            // Generate attendee rows — only rows with names, center-aligned
            const names = (formData.participants || []).filter(n => n && String(n).trim());
            const participantRows = names.map(n => {
                const name = esc(n);
                return `<tr>
                    <td style="border:1px solid #000;padding:7px 10px;min-height:28px;text-align:center;">${name}</td>
                    <td style="border:1px solid #000;padding:7px 10px;"> </td>
                </tr>`;
            }).join('');

            return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>회의 진행 일지</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '맑은 고딕', '나눔고딕', Arial, sans-serif; font-size: 11pt; background: #fff; color: #000; }
        .container { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 20mm 15mm; }
        h2 { text-align: center; font-size: 20pt; letter-spacing: 8px; margin-bottom: 28px; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
        td { border: 1px solid #000; padding: 8px 12px; font-size: 11pt; vertical-align: middle; }
        .lbl { background: #f0f0f0; font-weight: bold; width: 90px; white-space: nowrap; text-align: center; }
        .content-cell { min-height: 80px; vertical-align: top; padding: 10px 12px; }
        .attendee-section { margin-top: 20px; }
        .attendee-title { background: #d8d8d8; font-weight: bold; text-align: center; padding: 7px; border: 1px solid #000; border-bottom: none; font-size: 11pt; }
        .attendee-header td { background: #ebebeb; font-weight: bold; text-align: center; }
        .sign-area { margin-top: 32px; text-align: center; font-size: 11pt; line-height: 2.2; }
        .sign-line { display: inline-block; min-width: 260px; border-bottom: 1px solid #000; margin-left: 8px; }
        .btn-print { display: inline-block; margin: 20px 6px 0; padding: 10px 28px; font-size: 13px; cursor: pointer; border: none; border-radius: 6px; }
        @media print {
            body { margin: 0; }
            .container { padding: 12mm 10mm; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
<div class="container">
    <h2>회 의 진 행 일 지</h2>

    <table>
        <tr>
            <td class="lbl">회 의 제 목</td>
            <td colspan="3" style="font-size:12pt;font-weight:500;">${meetingTitle}</td>
        </tr>
        <tr>
            <td class="lbl">일&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;시</td>
            <td style="width:35%">${meetingDate}</td>
            <td class="lbl" style="width:90px;">장&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;소</td>
            <td>${meetingLocation}</td>
        </tr>
        <tr>
            <td class="lbl">내&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;용</td>
            <td colspan="3" class="content-cell" style="min-height:100px;">${meetingContent}</td>
        </tr>
    </table>

    <div class="attendee-section">
        <div class="attendee-title">참 석 자 명 단</div>
        <table>
            <tr class="attendee-header">
                <td style="width:50%;text-align:center;">참 석 자 명</td>
                <td style="width:50%;text-align:center;">서&nbsp;&nbsp;&nbsp;명</td>
            </tr>
            ${participantRows}
        </table>
    </div>

    <p style="margin-top:24px;text-align:right;font-size:11pt;">
        ${orgName}&nbsp;&nbsp;${sealHTML}
    </p>

    <div class="no-print" style="text-align:center">
        <button class="btn-print" style="background:#1B6B5A;color:#fff" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
        <button class="btn-print" style="background:#888;color:#fff" onclick="window.close()">✕ 닫기</button>
    </div>
</div>
</body>
</html>`;
        };

        // formData: { title, date, location, content, participants: string[] }
        const openMeetingMinutes = (formData, orgSettings) => {
            const html = generateMeetingMinutesHTML(formData, orgSettings || {});
            const win = window.open('', '_blank', 'width=900,height=750');
            if (!win) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
            win.document.write(html);
            win.document.close();
        };

        // ────────────────────────────────────────────────────────────
        // Change Application (사업변경신청서) HTML generator
        // Reflects the structure of HWP template 0[서식]_사업변경신청서.hwp
        // ────────────────────────────────────────────────────────────
        const generateChangeApplicationHTML = (formData, orgSettings = {}) => {
            const esc = (s) => String(s || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
            const escMultiline = (s) => esc(s).replace(/\n/g, '<br>');

            const orgName = esc(orgSettings.org_name || DEFAULT_ORG_NAME);
            const sealDataUrl = (orgSettings.org_seal || '').startsWith('data:image/') ? orgSettings.org_seal : '';
            const sealHTML = sealDataUrl
                ? `<img src="${sealDataUrl}" style="height:70px;vertical-align:middle;margin-left:8px;" alt="단체직인">`
                : '<span style="font-size:10pt;color:#555;">(단체직인 또는 대표자서명)</span>';

            const appDate = formData.applicationDate || new Date().toISOString().slice(0, 10);
            const [ay, am, ad] = appDate.split('-');

            // Section 2: 사업변경내역 rows
            const changeDetailRows = (formData.changeDetails || []).map(row => `
                <tr>
                    <td>${esc(row.beforeUnit)}</td>
                    <td>${esc(row.beforeSchedule)}</td>
                    <td>${esc(row.beforeContent)}</td>
                    <td>${esc(row.afterUnit)}</td>
                    <td>${esc(row.afterSchedule)}</td>
                    <td>${esc(row.afterContent)}</td>
                </tr>`).join('');

            // Section 3: 예산변경내역 rows
            const budgetChanges = formData.budgetChanges || {};
            let budgetRowsHTML = '';
            let grandBeforeTotal = 0;
            let grandAfterTotal = 0;

            BUDGET_DATA.categories.forEach(cat => {
                let catBeforeTotal = 0;
                let catAfterTotal = 0;
                const subRows = cat.subcategories.map(sub => {
                    const bc = budgetChanges[sub.id] || { before: sub.budget, after: sub.budget };
                    const before = bc.before || 0;
                    const after = bc.after || 0;
                    catBeforeTotal += before;
                    catAfterTotal += after;
                    const diff = after - before;
                    const changed = diff !== 0;
                    const highlight = changed ? ' style="background:#FFFDE7;"' : '';
                    const diffStr = diff > 0 ? `<span style="color:#1B6B5A;font-size:9pt;">(+${Math.round(diff).toLocaleString()})</span>`
                                  : diff < 0 ? `<span style="color:#D32F2F;font-size:9pt;">(${Math.round(diff).toLocaleString()})</span>` : '';
                    return `<tr${highlight}>
                        <td>${esc(cat.name)}</td>
                        <td>${esc(sub.name)}</td>
                        <td style="text-align:right;">${Math.round(before).toLocaleString()}</td>
                        <td style="text-align:right;">${Math.round(after).toLocaleString()} ${diffStr}</td>
                    </tr>`;
                }).join('');
                grandBeforeTotal += catBeforeTotal;
                grandAfterTotal += catAfterTotal;
                budgetRowsHTML += subRows;
                budgetRowsHTML += `<tr style="background:#f5f5f5;font-weight:bold;">
                    <td colspan="2" style="text-align:center;">${esc(cat.name)} 소계</td>
                    <td style="text-align:right;">${Math.round(catBeforeTotal).toLocaleString()}</td>
                    <td style="text-align:right;">${Math.round(catAfterTotal).toLocaleString()}</td>
                </tr>`;
            });
            budgetRowsHTML += `<tr style="background:#e8e8e8;font-weight:bold;">
                <td colspan="2" style="text-align:center;">합 계</td>
                <td style="text-align:right;">${Math.round(grandBeforeTotal).toLocaleString()}</td>
                <td style="text-align:right;">${Math.round(grandAfterTotal).toLocaleString()}</td>
            </tr>`;

            // Section 4: 구체내역
            const specificRows = (formData.specificDetails || []).filter(d => d.unitName).map(d => {
                const before = d.beforeAmount || 0;
                const after = d.afterAmount || 0;
                const diff = after - before;
                const diffLabel = diff > 0 ? `+${Math.round(diff).toLocaleString()}` : Math.round(diff).toLocaleString();
                return `
                <div class="detail-item">
                    <table>
                        <tr>
                            <td class="lbl" style="width:120px;">단위사업명</td>
                            <td colspan="5">${esc(d.unitName)}</td>
                        </tr>
                        <tr>
                            <td class="lbl">예산변경</td>
                            <td style="width:25%;text-align:right;">변경전: ${Math.round(before).toLocaleString()}원</td>
                            <td style="width:5%;text-align:center;">→</td>
                            <td style="width:25%;text-align:right;">변경후: ${Math.round(after).toLocaleString()}원</td>
                            <td style="width:5%;text-align:center;"></td>
                            <td style="width:20%;text-align:right;">증감: ${diffLabel}원</td>
                        </tr>
                        <tr>
                            <td class="lbl">산출근거</td>
                            <td colspan="5">${escMultiline(d.basis)}</td>
                        </tr>
                        <tr>
                            <td class="lbl">사유</td>
                            <td colspan="5">${escMultiline(d.reason)}</td>
                        </tr>
                    </table>
                </div>`;
            }).join('');

            return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>사업변경신청서</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: '맑은 고딕', '나눔고딕', Arial, sans-serif; font-size: 11pt; background: #fff; color: #000; }
        .container { width: 210mm; margin: 0 auto; padding: 20mm 15mm; }
        h2 { text-align: center; font-size: 20pt; letter-spacing: 8px; margin-bottom: 28px; font-weight: bold; }
        h3 { font-size: 12pt; margin: 20px 0 10px; border-bottom: 2px solid #333; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th, td { border: 1px solid #000; padding: 6px 10px; font-size: 10pt; vertical-align: middle; }
        th { background: #f0f0f0; font-weight: bold; text-align: center; white-space: nowrap; }
        .lbl { background: #f0f0f0; font-weight: bold; text-align: center; white-space: nowrap; }
        .reason-cell { min-height: 60px; vertical-align: top; padding: 10px 12px; line-height: 1.7; }
        .detail-item { margin-bottom: 16px; }
        .detail-item table td { font-size: 10pt; }
        .sign-area { margin-top: 32px; text-align: center; font-size: 11pt; line-height: 2.2; }
        .btn-print { display: inline-block; margin: 20px 6px 0; padding: 10px 28px; font-size: 13px; cursor: pointer; border: none; border-radius: 6px; }
        @media print {
            body { margin: 0; }
            .container { padding: 12mm 10mm; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
<div class="container">
    <h2>사 업 변 경 신 청 서</h2>

    <h3>1. 사업변경취지 및 사유</h3>
    <div class="reason-cell" style="border:1px solid #000; padding:12px; min-height:80px; margin-bottom:16px;">
        ${escMultiline(formData.reason)}
    </div>

    <h3>2. 사업변경내역</h3>
    <table>
        <tr>
            <th colspan="3">변 경 전</th>
            <th colspan="3">변 경 후</th>
        </tr>
        <tr>
            <th style="width:16%">단위사업</th>
            <th style="width:16%">일정</th>
            <th style="width:18%">추진내용</th>
            <th style="width:16%">단위사업</th>
            <th style="width:16%">일정</th>
            <th style="width:18%">추진내용</th>
        </tr>
        ${changeDetailRows}
    </table>

    <h3>3. 예산변경내역</h3>
    <table>
        <tr>
            <th style="width:15%">관리그룹</th>
            <th style="width:25%">단위사업(계정항목)</th>
            <th style="width:25%">변경전 (원)</th>
            <th style="width:35%">변경후 (원)</th>
        </tr>
        ${budgetRowsHTML}
    </table>

    <h3>4. 구체내역</h3>
    ${specificRows || '<p style="color:#999;padding:12px;">구체내역이 없습니다.</p>'}

    <div class="sign-area">
        <p>${ay}년 &nbsp;&nbsp; ${am}월 &nbsp;&nbsp; ${ad}일</p>
        <p style="margin-top:20px;">단체(기관)명 &nbsp;&nbsp; ${orgName} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${sealHTML}</p>
    </div>

    <div class="no-print" style="text-align:center">
        <button class="btn-print" style="background:#1B6B5A;color:#fff" onclick="window.print()">🖨️ 인쇄 / PDF 저장</button>
        <button class="btn-print" style="background:#888;color:#fff" onclick="window.close()">✕ 닫기</button>
    </div>
</div>
</body>
</html>`;
        };

        const openChangeApplication = (formData, orgSettings) => {
            const html = generateChangeApplicationHTML(formData, orgSettings || {});
            const win = window.open('', '_blank', 'width=1000,height=800');
            if (!win) { alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
            win.document.write(html);
            win.document.close();
        };

        // Date ranges for budget period filtering (h1 = Jan-Jun, h2 = Jul-Dec)
        const PERIOD_DATE_RANGES = {
            h1: { start: '2026-01-01', end: '2026-06-30' },
            h2: { start: '2026-07-01', end: '2026-12-31' },
            total: null
        };
        const getPeriodUsed = (executions, periodKey) => {
            const range = PERIOD_DATE_RANGES[periodKey];
            if (!range) return executions.reduce((s, e) => s + (e.amount || 0), 0);
            return executions
                .filter(e => e.execution_date >= range.start && e.execution_date <= range.end)
                .reduce((s, e) => s + (e.amount || 0), 0);
        };

        // Budget structure data (actual budget allocation for 2026)
        // h1 = first half (Jan-Jun), h2 = second half (Jul-Dec), total = full year
        const BUDGET_DATA = {
            projectName: "2026 공익단체 인큐베이팅 지원사업",
            organization: "청년노동자인권센터",
            totalBudget: CONFIG.TOTAL_BUDGET,
            period: "2026.01 ~ 2026.12",
            periods: {
                total: { label: "1차년도 전체", budget: CONFIG.TOTAL_BUDGET },
                h1: { label: "상반기 (1~6월)", budget: 35410000 },
                h2: { label: "하반기 (7~12월)", budget: 34590000 }
            },
            categories: [
                {
                    id: "project-costs",
                    name: "사업비",
                    budget: 30300000, h1: 15750000, h2: 14550000,
                    description: "사업의 직접적 목적달성을 위한 비용",
                    subcategories: [
                        {
                            id: "labor-safety-textbook",
                            name: "노동안전보건 교과서 기초연구",
                            budget: 9100000, h1: 4150000, h2: 4950000,
                            description: "반도체고 학생들을 위한 노동안전보건 교과서 개발 연구",
                            items: [
                                { id: "seminar-fee", name: "세미나 진행비", type: "사업인건비", budget: 1000000, h1: 500000, h2: 500000, detail: "1인*4회*250,000", h1detail: "세미나 2회", h2detail: "세미나 2회" },
                                { id: "consultation-fee", name: "자문비", type: "사업인건비", budget: 1500000, h1: 750000, h2: 750000, detail: "10회 * 150,000", h1detail: "자문 5회", h2detail: "자문 5회" },
                                { id: "interview-fee", name: "인터뷰 진행비", type: "사업인건비", budget: 1000000, h1: 600000, h2: 400000, detail: "인터뷰 10회 * 100,000원", h1detail: "인터뷰 6회", h2detail: "인터뷰 4회" },
                                { id: "research-direction-fee", name: "방향설계 연구수당", type: "사업인건비", budget: 5000000, h1: 0, h2: 0, detail: "노동안전보건 교과서 방향설계 연구", h1detail: "", h2detail: "" },
                                { id: "manuscript-fee", name: "교과서 원고료", type: "사업인건비", budget: 0, h1: 2000000, h2: 3000000, detail: "연구팀 교과서 분석 및 방향설계 원고료", h1detail: "착수금", h2detail: "잔금" },
                                { id: "meeting-expense", name: "회의비", type: "사업회의비", budget: 600000, h1: 300000, h2: 300000, detail: "6회*5명*20,000원", h1detail: "3회*5명*20,000", h2detail: "3회*5명*20,000" }
                            ]
                        },
                        {
                            id: "labor-safety-app",
                            name: "노동안전보건 APP",
                            budget: 2000000, h1: 1200000, h2: 800000,
                            description: "APP을 통한 입체적인 교육과 최신 정보 업데이트",
                            items: [
                                { id: "app-consultation", name: "개발설계 자문", type: "사업인건비", budget: 1000000, h1: 600000, h2: 400000, detail: "개발설계, 자문", h1detail: "자문 3회", h2detail: "자문 2회" },
                                { id: "app-development", name: "서버/개발비", type: "지급수수료", budget: 1000000, h1: 600000, h2: 400000, detail: "서버비용, 애플개발자등록비용, RAG구축", h1detail: "DB구독, 개발자등록 등", h2detail: "시스템 추가비용" }
                            ]
                        },
                        {
                            id: "campaign",
                            name: "캠페인",
                            budget: 7600000, h1: 5000000, h2: 2600000,
                            description: "반도체고 청소년들과의 일상적인 관계형성을 위한 캠페인",
                            items: [
                                { id: "campaign-consultation", name: "캠페인 자문", type: "사업인건비", budget: 900000, h1: 600000, h2: 300000, detail: "6회 * 150,000원", h1detail: "자문 4회*150,000", h2detail: "자문 2회*150,000" },
                                { id: "campaign-travel", name: "캠페인 교통비", type: "여비교통비", budget: 3000000, h1: 2000000, h2: 1000000, detail: "30회 * 100,000원", h1detail: "5개월*4회*100,000", h2detail: "10회*100,000" },
                                { id: "campaign-supplies", name: "캠페인 물품", type: "물품구매비", budget: 2500000, h1: 2000000, h2: 500000, detail: "테이블, 배너, 의자, 문구류 등", h1detail: "커피차, 간식, 물품", h2detail: "간식, 물품" },
                                { id: "campaign-meeting", name: "캠페인 회의비", type: "사업회의비", budget: 1200000, h1: 400000, h2: 800000, detail: "15회*4인*20,000", h1detail: "20회*20,000", h2detail: "캠페인 회의" }
                            ]
                        },
                        {
                            id: "youth-committee",
                            name: "청소년 참견위원회",
                            budget: 11100000, h1: 5100000, h2: 6000000,
                            description: "청소년참견위원회를 모집하여 학내 노동안전보건인식 제고 활동 지원",
                            items: [
                                { id: "committee-consultation", name: "위원회 자문", type: "사업인건비", budget: 600000, h1: 300000, h2: 300000, detail: "자문 4회*150,000", h1detail: "자문 2회*150,000", h2detail: "자문 2회*150,000" },
                                { id: "committee-meeting", name: "위원회 운영비", type: "사업회의비", budget: 5000000, h1: 2000000, h2: 3000000, detail: "5개교*식비", h1detail: "2회*10명*20,000*5개교", h2detail: "3회*10명*20,000*5개교" },
                                { id: "committee-supplies", name: "위원회 학습지원", type: "물품구매비", budget: 5000000, h1: 2500000, h2: 2500000, detail: "5개교*1,000,000원", h1detail: "5개교*500,000", h2detail: "5개교*500,000" },
                                { id: "school-visit", name: "학교방문비", type: "여비교통비", budget: 500000, h1: 300000, h2: 200000, detail: "학교방문 5회 * 100,000원", h1detail: "3회*100,000", h2detail: "2회*100,000" }
                            ]
                        },
                        {
                            id: "reserve",
                            name: "예비비",
                            budget: 500000, h1: 300000, h2: 200000,
                            description: "예상 외 소요 비용",
                            items: [
                                { id: "reserve-fund", name: "예비비", type: "예비비", budget: 500000, h1: 300000, h2: 200000, detail: "예상 외 소요", h1detail: "여비교통비 예상", h2detail: "보고서 인쇄 예상" }
                            ]
                        }
                    ]
                },
                {
                    id: "operating-costs",
                    name: "운영비",
                    budget: 39700000, h1: 19660000, h2: 20040000,
                    description: "단체의 기관운영 및 관리를 위한 비용",
                    subcategories: [
                        {
                            id: "operating-personnel",
                            name: "운영인건비",
                            budget: 35250000, h1: 17620000, h2: 17630000,
                            description: "단체 활동가의 기본급여 및 관련 비용",
                            items: [
                                { id: "regular-salary", name: "상근활동가 인건비", type: "운영인건비", budget: 30400000, h1: 15200000, h2: 15200000, detail: "서울시생활임금(12,121원)*12개월*209시간", h1detail: "6개월 임금", h2detail: "6개월 임금" },
                                { id: "part-time-salary", name: "시간제 인건비", type: "운영인건비", budget: 4850000, h1: 2420000, h2: 2430000, detail: "년400시간 인건비", h1detail: "200시간 단순인건비", h2detail: "200시간 단순인건비" }
                            ]
                        },
                        {
                            id: "rent",
                            name: "임차료",
                            budget: 660000, h1: 330000, h2: 330000,
                            description: "사무실 임차비",
                            items: [
                                { id: "office-rent", name: "사무실 임대료", type: "임차료", budget: 660000, h1: 330000, h2: 330000, detail: "55,000*12", h1detail: "6개월", h2detail: "6개월" }
                            ]
                        },
                        {
                            id: "general-management",
                            name: "일반관리비",
                            budget: 2230000, h1: 1010000, h2: 1220000,
                            description: "소프트웨어 구독 등",
                            items: [
                                { id: "software-claude", name: "클로드코드", type: "일반관리비", budget: 1650000, h1: 750000, h2: 900000, detail: "150,000*11", h1detail: "5개월", h2detail: "6개월" },
                                { id: "google-workspace", name: "구글워크스페이스", type: "일반관리비", budget: 207900, h1: 94500, h2: 113400, detail: "18,900*11", h1detail: "5개월", h2detail: "6개월" },
                                { id: "n8n-subscription", name: "n8n 구독", type: "일반관리비", budget: 374000, h1: 170000, h2: 204000, detail: "34,000*11", h1detail: "5개월", h2detail: "6개월" }
                            ]
                        },
                        {
                            id: "education-training",
                            name: "교육훈련비",
                            budget: 1000000, h1: 400000, h2: 600000,
                            description: "운영위 운영비 및 워크샵",
                            items: [
                                { id: "workshop-expense", name: "운영위 운영비 및 워크샵", type: "교육훈련비", budget: 1000000, h1: 400000, h2: 600000, detail: "숙소예약, 식사", h1detail: "5인*4회*20,000", h2detail: "워크샵+5인*2회*20,000" }
                            ]
                        },
                        {
                            id: "organization-promotion",
                            name: "홍보비",
                            budget: 560000, h1: 300000, h2: 260000,
                            description: "단체 홍보물 제작",
                            items: [
                                { id: "promotional-materials", name: "단체 홍보물", type: "홍보비", budget: 560000, h1: 300000, h2: 260000, detail: "단체 팜플렛, 명함, 피켓 등", h1detail: "팜플렛, 피켓", h2detail: "팜플렛, 피켓" }
                            ]
                        }
                    ]
                }
            ]
        };

        // 증빙서류 규칙 엔진 (아름다운재단 2026 공익단체 인큐베이팅 지원사업 기준)
        const DOCUMENT_RULES = {
            "사업인건비": {
                description: "강사비, 원고비, 발제비, 토론비, 인터뷰 사례비, 자문비, 회의참석비, 단순인건비 등 (단체 내부인 지급불가)",
                paymentMethod: "계좌이체만 가능 (현금 지급 불가)",
                base: ["전용계좌 체크카드 매출전표 또는 이체내역서"],
                required: [
                    "수령확인증 (재단서식)",
                    "이체내역서 (일괄출력)",
                    "이력서 (강사비, 발제비, 토론비 등 지급 시)",
                    "회의진행일지 (재단서식) 또는 강의/토론 자료나 사진 등 비용지출 증명자료"
                ],
                conditional: [
                    "기타소득지급명세서 소득자별 연간집계표 (해당 시에만 제출)"
                ],
                withholding: true,
                withholdingThreshold: CONFIG.WITHHOLDING_THRESHOLD,
                withholdingRate: { income: CONFIG.INCOME_TAX_RATE * 100, local: 1 }, // 지방세: 기타소득세의 10% ≈ 0.8%를 1%로 표시
                notes: "단체 내부인에는 지급 불가. 계좌입금 원칙, 원천징수금액은 운영통장으로 이체 후 집행. 주민번호 취합 필요 (연말 기타소득지급명세서 제출용)."
            },
            "운영인건비": {
                description: "단체 활동가(사업담당자)의 기본급여, 법정수당, 퇴직급여적립금, 사회보험 사용자부담금 등 (지원단체 소속자만 지급가능)",
                paymentMethod: "사업전용계좌에서 단체 운영통장으로 일괄 이체 후 지급",
                base: ["급여지급명세서 (재단서식 제공)", "이체내역서 (일괄출력)"],
                required: [
                    "사업전용통장에서 기관운영계좌로의 이체확인증 (1건)",
                    "기관운영계좌에서 담당자 개인계좌로의 이체확인증 (월 이체 내역)"
                ],
                conditional: [],
                withholding: false,
                notes: "지원단체 소속자에게만 지급 가능. 사업전용계좌에서 바로 지급하지 않고 운영통장 경유."
            },
            "사업회의비": {
                description: "행사, 회의 등 진행을 위한 장소 대관비, 다과구입, 식비 등 (인건비성 경비 편성불가)",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서", "현금영수증(매출증빙)"],
                required: ["영수증", "이체내역서 (계좌이체시)"],
                conditional: [
                    "사업자등록증 사본 (세금계산서 발급시)",
                    "면세사업자등록증 (계산서 발급시)"
                ],
                withholding: false,
                notes: "인건비성 경비 지출 불가. 주류, 노래방 등 비용 지출 불가. 교통비는 여비교통비 계정으로 별도 지출."
            },
            "사업홍보비": {
                description: "단위사업 홍보, 사업참여자 모집을 목적으로 지출한 홍보 비용",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서", "현금영수증(매출증빙)"],
                required: ["영수증", "이체내역서 (계좌이체시)", "사업관련성 입증자료"],
                conditional: [
                    "사업자등록증 사본 (세금계산서 발급시)",
                    "면세사업자등록증 (계산서 발급시)"
                ],
                withholding: false,
                notes: "단위사업과의 직접적 연관성이 입증되어야 함."
            },
            "물품구매비": {
                description: "단위사업에 필요한 물품 구입비용",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서", "현금영수증(매출증빙)"],
                required: [
                    "구매내역 또는 거래명세서 사본",
                    "세금계산서(카드매출전표)",
                    "이체내역서 (계좌이체시)",
                    "업체 사업자등록증 사본"
                ],
                conditional: [
                    "비교견적서 및 업체 견적서 (100만원 미만의 경우 최종 계약업체의 상세견적서만 제출)"
                ],
                withholding: false,
                notes: "적격증빙이 불가능한 개인과의 중고거래물품 구입 등은 인정되지 않음."
            },
            "도서인쇄비": {
                description: "자료집, 교재제본, 리플렛 등 인쇄물 제작비",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서", "현금영수증(매출증빙)"],
                required: ["영수증", "이체내역서 (계좌이체시)", "제작물 샘플 또는 사진"],
                conditional: [
                    "사업자등록증 사본 (세금계산서 발급시)",
                    "면세사업자등록증 (계산서 발급시)"
                ],
                withholding: false,
                notes: "사업목적과 부합하는 인쇄물만 인정."
            },
            "지급수수료": {
                description: "전문서비스 수수료, 용역비 등",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "세금계산서(업체) 또는 수령확인증(개인)"],
                required: [
                    "계약서 사본",
                    "세금계산서(업체) 또는 수령확인증/기타소득지급명세서(개인)",
                    "이체내역서 (일괄출력)",
                    "사업자등록증(업체) 또는 신분증 사본(개인, 주민번호 뒷자리 마스킹)",
                    "비교견적서 및 업체 견적서 (100만원 미만의 경우 최종 계약업체의 상세견적서만)"
                ],
                conditional: [
                    "이력서, 포트폴리오, 사유서 (개인용역계약의 경우)"
                ],
                withholding: true,
                withholdingThreshold: CONFIG.WITHHOLDING_THRESHOLD,
                withholdingRate: { income: CONFIG.INCOME_TAX_RATE * 100, local: 1 }, // 지방세: 기타소득세의 10% ≈ 0.8%를 1%로 표시
                notes: "개인용역계약시 추가 서류 필요. 원천징수 대상인 경우 세무처리 필요."
            },
            "여비교통비": {
                description: "사업 관련 교통비 및 출장비 (실비지출, 영수증 필수)",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["교통비 영수증", "숙박비 영수증", "식비 영수증"],
                required: ["영수증 (실비지출 증빙)", "출장보고서 또는 회의참석 확인서"],
                conditional: [],
                withholding: false,
                notes: "실비지출에 한정. 영수증이 없는 경우 불인정. 사업인건비와 중복지출 불가."
            },
            "교육훈련비": {
                description: "단체 활동가의 역량강화를 위한 교육비, 대내외 인사 및 위원회 운영 회의비",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서"],
                required: ["영수증", "교육참석 확인서", "교육내용 관련 자료"],
                conditional: ["이체내역서 (계좌이체시)"],
                withholding: false,
                notes: "단체 활동가 역량강화 목적에 부합해야 함."
            },
            "기자재구매관리비": {
                description: "단체운영에 필요한 유무형자산 구입비 및 유지보수비 (취득단가 100만원 이상)",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서"],
                required: [
                    "구매내역 또는 거래명세서",
                    "세금계산서",
                    "사업자등록증 사본",
                    "비교견적서 (100만원 이상)"
                ],
                conditional: ["이체내역서 (계좌이체시)"],
                withholding: false,
                notes: "취득단가 100만원 이상 자산. 단체운영 목적에 부합해야 함."
            },
            "일반관리비": {
                description: "사무용품, 소모성물품, 수도광열비, 통신비, 제세공과금, 보험료, 금융기관수수료 등 (취득단가 100만원 미만)",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서", "현금영수증"],
                required: ["영수증", "사업관련성 입증자료"],
                conditional: ["이체내역서 (계좌이체시)"],
                withholding: false,
                notes: "취득단가 100만원 미만. 단체운영에 필요한 경비. 사회보험 사용자부담금 등은 운영인건비로 편성."
            },
            "홍보비": {
                description: "단체홍보, 회원모집, 회원활동지원, 모금활동을 목적으로 지출한 홍보비용",
                paymentMethod: "전용계좌 체크카드 또는 계좌이체",
                base: ["전용계좌 체크카드 매출전표", "(전자)세금계산서", "(전자)계산서"],
                required: ["영수증", "홍보활동 관련 자료 (결과물, 사진 등)"],
                conditional: ["이체내역서 (계좌이체시)"],
                withholding: false,
                notes: "단체홍보 목적에 부합해야 함. 사업홍보비와 구분하여 운영."
            }
        };

        // ────────────────────────────────────────────────────────────
        // PDF direct download utility
        // Uses html2pdf.js (jsPDF + html2canvas) to convert HTML to PDF.
        // Falls back to alert if CDN not loaded.
        // ────────────────────────────────────────────────────────────
        const generatePDF = (htmlContent, filename) => {
            if (typeof html2pdf === 'undefined') {
                alert('PDF 라이브러리가 로드되지 않았습니다. 인쇄 기능을 이용해주세요.');
                return;
            }
            const container = document.createElement('div');
            container.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent, { WHOLE_DOCUMENT: true }) : htmlContent;
            container.querySelectorAll('.no-print').forEach(el => el.remove());
            document.body.appendChild(container);
            html2pdf().set({
                margin: 10,
                filename: filename,
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save().then(() => {
                document.body.removeChild(container);
            }).catch(() => {
                if (container.parentNode) document.body.removeChild(container);
                alert('PDF 생성 중 오류가 발생했습니다. 인쇄 기능을 이용해주세요.');
            });
        };

        // ────────────────────────────────────────────────────────────
        // HWPX download via server API (/api/hwpx)
        // ────────────────────────────────────────────────────────────
        const downloadHWPX = async (title, sections, filename, template = 'base') => {
            try {
                const apiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'https://beautifulfundboard.vercel.app' : '';
                const resp = await fetch(apiBase + '/api/hwpx', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, template, sections })
                });
                if (!resp.ok) { const e = await resp.json().catch(() => ({})); alert(e.error || 'HWPX 생성 실패'); return; }
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = filename;
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (err) {
                alert('HWPX 서버 연결 실패. 잠시 후 다시 시도해주세요.');
            }
        };

        // ────────────────────────────────────────────────────────────
        // Newsletter HTML generator
        // Generates a printable newsletter from selected schedules and board posts.
        // ────────────────────────────────────────────────────────────
        const generateNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName, boardImageUrls = {}, rewrittenContents = {}, selectedGalleries = [], galleryThumbUrls = {}) => {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const catColors = { '교육': '#6366f1', '캠페인': '#ec4899', '회의': '#f59e0b', '평가': '#10b981', '기타': '#8b5cf6' };
            const typeColors = { notice: '#ef4444', materials: '#3b82f6', report: '#8b5cf6', free: '#6b7280' };
            const typeLabels = { notice: '공지', materials: '자료', report: '보고서', free: '자유' };

            const schedulesSection = selectedSchedules.length > 0 ? `
            <section style="margin-bottom:36px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:4px;height:28px;background:linear-gradient(180deg,#6366f1,#a855f7);border-radius:2px;"></div>
                    <h2 style="font-size:15pt;font-weight:700;color:#1e1e2e;letter-spacing:-0.5px;">주요 일정</h2>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">
                    ${selectedSchedules.map(s => {
                        const catColor = catColors[s.category] || '#6b7280';
                        return `
                    <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;background:#fafafa;border-radius:14px;border:1px solid #f0f0f0;transition:all .2s;">
                        <div style="min-width:56px;text-align:center;">
                            <div style="font-size:9pt;color:#999;font-weight:500;">${esc((s.start_date||'').slice(0,7))}</div>
                            <div style="font-size:18pt;font-weight:800;color:#1e1e2e;line-height:1.1;">${esc((s.start_date||'').slice(8))}</div>
                            ${s.end_date && s.end_date !== s.start_date ? `<div style="font-size:7.5pt;color:#aaa;margin-top:2px;">~ ${esc(s.end_date.slice(5))}</div>` : ''}
                        </div>
                        <div style="width:1px;height:36px;background:#e5e5e5;"></div>
                        <div style="flex:1;">
                            <div style="font-size:11pt;font-weight:600;color:#1e1e2e;margin-bottom:4px;">${esc(s.title)}</div>
                            <div style="font-size:9pt;color:#888;">${esc(s.location) || ''}</div>
                        </div>
                        <span style="padding:4px 12px;background:${catColor}15;color:${catColor};font-size:8.5pt;font-weight:600;border-radius:20px;">${esc(s.category)}</span>
                    </div>`;
                    }).join('')}
                </div>
            </section>` : '';

            const boardsSection = selectedBoards.length > 0 ? `
            <section style="margin-bottom:36px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:4px;height:28px;background:linear-gradient(180deg,#3b82f6,#06b6d4);border-radius:2px;"></div>
                    <h2 style="font-size:15pt;font-weight:700;color:#1e1e2e;letter-spacing:-0.5px;">주요 소식</h2>
                </div>
                <div style="display:flex;flex-direction:column;gap:16px;">
                    ${selectedBoards.map(b => {
                        const typeLabel = typeLabels[b.board_type] || b.board_type;
                        const typeColor = typeColors[b.board_type] || '#6b7280';
                        const dateStr = b.created_at ? b.created_at.split('T')[0] : '';
                        const sanitized = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(b.content || '') : esc(String(b.content || '').replace(/<[^>]*>/g, ''));
                        return `
                    <div style="padding:20px 24px;background:#fff;border-radius:16px;border:1px solid #eee;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                            <span style="display:inline-block;width:8px;height:8px;background:${typeColor};border-radius:50%;"></span>
                            <span style="font-size:8.5pt;font-weight:600;color:${typeColor};text-transform:uppercase;">${esc(typeLabel)}</span>
                            <span style="font-size:8.5pt;color:#bbb;margin-left:auto;">${esc(dateStr)}</span>
                        </div>
                        <h3 style="margin:0 0 8px;font-size:12.5pt;font-weight:700;color:#1e1e2e;line-height:1.4;">${esc(b.title)}</h3>
                        ${(boardImageUrls[b.id] || []).map(url => `<img src="${esc(url)}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;display:block;" />`).join('')}
                        <div style="font-size:10pt;line-height:1.8;color:#555;">${rewrittenContents[b.id] ? esc(rewrittenContents[b.id]) : sanitized}</div>
                    </div>`;
                    }).join('')}
                </div>
            </section>` : '';

            return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${esc(config.title || '뉴스레터')}</title>
<style>
    @import url('https://fonts.googleapis.com/css2?family=Pretendard:wght@400;500;600;700;800&display=swap');
    @page { size: A4; margin: 12mm; }
    @media print { .no-print { display: none !important; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10pt; background: #f5f5f5; color: #1e1e2e; }
    .nl-wrap { max-width: 600px; margin: 0 auto; background: #fff; }
    .btn-print { display: inline-block; margin: 16px 6px; padding: 10px 24px; font-size: 13px; cursor: pointer; border: none; border-radius: 10px; font-weight: 600; }
</style>
</head>
<body>
    <div class="no-print" style="text-align:center;padding:12px;background:#fff;">
        <button class="btn-print" style="background:#1e1e2e;color:#fff" onclick="window.print()">인쇄 / PDF 저장</button>
        <button class="btn-print" style="background:#f0f0f0;color:#666" onclick="window.close()">닫기</button>
    </div>

    <div class="nl-wrap">
        <!-- Hero Header -->
        <div style="background:linear-gradient(135deg,#134E42 0%,#0f766e 50%,#06b6d4 100%);padding:48px 32px 40px;text-align:center;border-radius:0 0 32px 32px;">
            <div style="display:inline-block;padding:6px 16px;background:rgba(255,255,255,0.15);border-radius:20px;font-size:8.5pt;color:rgba(255,255,255,0.9);font-weight:500;margin-bottom:16px;letter-spacing:0.5px;">
                ${config.issueNumber ? esc(config.issueNumber) + ' · ' : ''}${esc(config.publishDate)}
            </div>
            <h1 style="font-size:24pt;font-weight:800;color:#fff;margin-bottom:8px;letter-spacing:-1px;line-height:1.2;">${esc(config.title || '뉴스레터')}</h1>
            <p style="font-size:10pt;color:rgba(255,255,255,0.7);font-weight:400;">${esc(orgName)}</p>
        </div>

        <div style="padding:32px 28px;">

            ${config.greeting ? `
            <div style="margin-bottom:32px;padding:20px 24px;background:linear-gradient(135deg,#f0fdf4,#ecfdf5);border-radius:16px;border-left:4px solid #10b981;">
                <div style="font-size:10.5pt;line-height:1.9;color:#374151;white-space:pre-line;">${esc(config.greeting)}</div>
            </div>` : ''}

            ${schedulesSection}
            ${boardsSection}

            ${selectedGalleries.length > 0 ? `
            <section style="margin-bottom:36px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <div style="width:4px;height:28px;background:linear-gradient(180deg,#f59e0b,#ef4444);border-radius:2px;"></div>
                    <h2 style="font-size:15pt;font-weight:700;color:#1e1e2e;letter-spacing:-0.5px;">갤러리</h2>
                </div>
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
                    ${selectedGalleries.map(g => {
                        const thumbUrl = galleryThumbUrls[g.id];
                        return `
                    <div style="border-radius:14px;overflow:hidden;border:1px solid #eee;background:#fff;">
                        ${thumbUrl ? `<img src="${esc(thumbUrl)}" alt="" style="width:100%;height:160px;object-fit:cover;" />` : '<div style="width:100%;height:160px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:24pt;">📷</div>'}
                        <div style="padding:10px 14px;">
                            <div style="font-size:10pt;font-weight:600;color:#1e1e2e;">${esc(g.title)}</div>
                            ${g.description ? `<div style="font-size:9pt;color:#888;margin-top:4px;">${esc(g.description).slice(0,80)}</div>` : ''}
                        </div>
                    </div>`;
                    }).join('')}
                </div>
            </section>` : ''}

            ${config.closing ? `
            <div style="margin-top:32px;padding:20px 24px;background:#f8f9fa;border-radius:16px;">
                <div style="font-size:10.5pt;line-height:1.9;color:#374151;white-space:pre-line;">${esc(config.closing)}</div>
            </div>` : ''}

        </div>

        <!-- Footer -->
        <div style="padding:24px 28px;background:#f9fafb;border-top:1px solid #f0f0f0;text-align:center;border-radius:0 0 0 0;">
            <p style="font-size:8.5pt;color:#9ca3af;font-weight:500;">${esc(orgName)}</p>
            <p style="font-size:8pt;color:#d1d5db;margin-top:4px;">아름다운재단 2026 공익단체 인큐베이팅 지원사업</p>
        </div>
    </div>
</body>
</html>`;
        };

        // Generates full-styled newsletter page using newsletter-full.jsx visual template (Tailwind CSS)
        const generateFullNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName, boardImageUrls = {}, rewrittenContents = {}, selectedGalleries = [], galleryThumbUrls = {}) => {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const strip = (html) => String(html || '').replace(/<[^>]*>/g, '');
            const badgeStyles = {
                accent: 'bg-blue-50 text-blue-700 border-blue-200',
                green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                orange: 'bg-orange-50 text-orange-700 border-orange-200',
                red: 'bg-red-50 text-red-700 border-red-200',
                default: 'bg-slate-100 text-slate-600 border-slate-200',
            };
            const typeConfig = {
                notice: { label: '주요 이슈', badge: 'accent' },
                materials: { label: '자료 공유', badge: 'green' },
                report: { label: '보고서', badge: 'orange' },
                free: { label: '소식', badge: 'default' },
            };
            const catStyles = {
                '교육': 'bg-purple-50 text-purple-600 border-purple-200',
                '캠페인': 'bg-pink-50 text-pink-600 border-pink-200',
                '회의': 'bg-amber-50 text-amber-600 border-amber-200',
                '평가': 'bg-emerald-50 text-emerald-600 border-emerald-200',
                '기타': 'bg-violet-50 text-violet-600 border-violet-200',
            };
            const monthEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

            const mkBadge = (text, variant) =>
                `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${badgeStyles[variant] || badgeStyles.default}">${esc(text)}</span>`;
            const mkCard = (content, cls = '') =>
                `<div class="bg-white border border-slate-200 rounded-xl shadow-sm ${cls}">${content}</div>`;

            // Topic tags from selected items
            const topics = [...new Set(selectedBoards.map(b => (typeConfig[b.board_type] || typeConfig.free).label))];
            if (selectedSchedules.length > 0) topics.push('일정');
            if (selectedGalleries.length > 0) topics.push('갤러리');

            // Hero section
            const heroHtml = mkCard(`
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 px-7 pt-7 pb-5">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-white/70 text-xs font-medium tracking-wide flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            ${esc(config.issueNumber || '뉴스레터')}
                        </span>
                        <span class="text-white/50 text-xs">${esc(config.publishDate || '')}</span>
                    </div>
                    <h1 class="text-2xl font-bold text-white leading-snug mb-1.5">${esc(config.title || '뉴스레터')}</h1>
                    <p class="text-blue-200 text-xs">${esc(config.publishDate || '')} · ${esc(orgName)}</p>
                    ${topics.length > 0 ? `<div class="flex flex-wrap gap-2 mt-4">${topics.map(t =>
                        `<span class="px-2 py-1 rounded-md text-[11px] font-medium bg-white/15 text-white/80">${esc(t)}</span>`
                    ).join('')}</div>` : ''}
                </div>`, 'overflow-hidden mb-4');

            // Greeting
            const greetingHtml = config.greeting ? mkCard(`
                <div class="p-5">
                    <div class="rounded-lg bg-emerald-50 border-l-4 border-emerald-400 px-4 py-3">
                        <p class="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">${esc(config.greeting)}</p>
                    </div>
                </div>`, 'mb-4') : '';

            // Articles
            const articlesHtml = selectedBoards.map((b, i) => {
                const tc = typeConfig[b.board_type] || typeConfig.free;
                const rawText = rewrittenContents[b.id] || strip(b.content || '');
                const readTime = Math.max(1, Math.ceil(rawText.length / 500));
                const images = boardImageUrls[b.id] || [];
                const paras = rawText.split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean);

                if (i === 0) {
                    return mkCard(`
                        <div class="p-6">
                            <div class="flex items-center gap-2 mb-3">
                                ${mkBadge(tc.label, tc.badge)}
                                <span class="text-xs text-slate-400">${readTime}분 읽기</span>
                            </div>
                            <h2 class="text-lg font-bold text-slate-900 leading-snug mb-3">${esc(b.title)}</h2>
                            ${images.length > 0 ? `<div class="space-y-2 mb-4">${images.map(url =>
                                `<img src="${esc(url)}" alt="" class="w-full rounded-xl" />`).join('')}</div>` : ''}
                            ${paras.length > 0 ? `
                            <div class="rounded-lg bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-4">
                                <p class="text-sm text-blue-800 leading-relaxed font-medium">${esc(paras[0])}</p>
                            </div>` : ''}
                            <div class="space-y-3">
                                ${paras.slice(1).map(p => `<p class="text-sm text-slate-600 leading-relaxed">${esc(p)}</p>`).join('')}
                            </div>
                            <div class="flex gap-1.5 mt-5 pt-4 border-t border-slate-100">
                                <span class="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">#${esc(tc.label)}</span>
                                <span class="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">#${esc(orgName)}</span>
                            </div>
                        </div>`, 'overflow-hidden mb-4');
                }
                return mkCard(`
                    <div class="p-5">
                        <div class="flex items-center gap-2 mb-2">
                            ${mkBadge(tc.label, tc.badge)}
                            <span class="text-[11px] text-slate-400">${readTime}분 읽기</span>
                        </div>
                        <h3 class="text-[15px] font-bold text-slate-800 leading-snug mb-3">${esc(b.title)}</h3>
                        ${images.length > 0 ? `<div class="mb-3">${images.map(url =>
                            `<img src="${esc(url)}" alt="" class="w-full rounded-xl mb-2" style="max-height:240px;object-fit:cover;" />`).join('')}</div>` : ''}
                        <div class="space-y-2">
                            ${paras.map(p => `<p class="text-sm text-slate-500 leading-relaxed">${esc(p)}</p>`).join('')}
                        </div>
                    </div>`, 'mb-3');
            }).join('\n');

            // Stats
            const statsHtml = mkCard(`
                <div class="p-5">
                    <p class="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">이번 호 구성</p>
                    <div class="grid grid-cols-3 divide-x divide-slate-100">
                        <div class="text-center px-2">
                            <div class="text-2xl font-bold tabular-nums text-blue-600">${selectedBoards.length}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">소식·기사</div>
                        </div>
                        <div class="text-center px-2">
                            <div class="text-2xl font-bold tabular-nums text-orange-500">${selectedSchedules.length}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">주요 일정</div>
                        </div>
                        <div class="text-center px-2">
                            <div class="text-2xl font-bold tabular-nums text-emerald-600">${selectedGalleries.length}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">갤러리</div>
                        </div>
                    </div>
                </div>`, 'mb-4');

            // Events
            const eventsHtml = selectedSchedules.length > 0 ? mkCard(`
                <div class="p-5">
                    <p class="text-sm font-semibold text-slate-800 mb-3">📅 다가오는 일정</p>
                    <div class="divide-y divide-slate-100">
                        ${selectedSchedules.map(s => {
                            const d = s.start_date ? new Date(s.start_date + 'T00:00:00') : new Date();
                            const m = monthEn[d.getMonth()] || 'Jan';
                            const day = String(d.getDate()).padStart(2, '0');
                            const cs = catStyles[s.category] || catStyles['기타'];
                            return `
                            <div class="flex gap-4 items-start py-3">
                                <div class="text-center w-12 flex-shrink-0 bg-slate-50 border border-slate-100 rounded-lg py-2">
                                    <div class="text-[10px] text-blue-500 font-semibold uppercase tracking-widest">${esc(m)}</div>
                                    <div class="text-xl font-bold text-slate-800 leading-none">${esc(day)}</div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="text-sm font-medium text-slate-800">${esc(s.title)}</div>
                                    <div class="text-xs text-slate-400 mt-0.5">${esc(s.location || '')}${s.start_date ? ' · ' + esc(s.start_date) : ''}</div>
                                    ${s.description ? `<p class="text-xs text-slate-500 mt-1">${esc(s.description)}</p>` : ''}
                                </div>
                                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${cs} flex-shrink-0">${esc(s.category || '기타')}</span>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`, 'mb-4') : '';

            // Gallery
            const galleryHtml = selectedGalleries.length > 0 ? mkCard(`
                <div class="p-5">
                    <p class="text-sm font-semibold text-slate-800 mb-3">📸 갤러리</p>
                    <div class="grid grid-cols-2 gap-3">
                        ${selectedGalleries.map(g => {
                            const thumb = galleryThumbUrls[g.id];
                            return `
                            <div class="rounded-xl overflow-hidden border border-slate-100 bg-white">
                                ${thumb
                                    ? `<img src="${esc(thumb)}" alt="${esc(g.title)}" class="w-full h-36 object-cover" />`
                                    : `<div class="w-full h-36 bg-slate-50 flex items-center justify-center text-slate-300 text-3xl">📷</div>`}
                                <div class="p-3">
                                    <div class="text-xs font-semibold text-slate-800 line-clamp-1">${esc(g.title)}</div>
                                    ${g.category ? `<div class="text-[11px] text-slate-400 mt-0.5">${esc(g.category)}</div>` : ''}
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>`, 'mb-4') : '';

            // Closing
            const closingHtml = config.closing ? mkCard(`
                <div class="p-5">
                    <div class="rounded-lg bg-slate-50 px-4 py-3">
                        <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-line">${esc(config.closing)}</p>
                    </div>
                </div>`, 'mb-4') : '';

            return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(config.title || '뉴스레터')}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .line-clamp-1 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; }
  .line-clamp-2 { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .fade-in { animation: fadeIn 0.4s ease both; }
  @media print { .no-print{display:none!important} body{background:#fff} .shadow-sm{box-shadow:none} .border{border-color:transparent} }
</style>
</head>
<body class="min-h-screen bg-slate-50">
<div class="no-print sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
    <div class="max-w-[640px] mx-auto px-4 h-12 flex items-center justify-between">
        <span class="text-sm font-medium text-slate-800">${esc(config.title || '뉴스레터')}</span>
        <div class="flex gap-2">
            <button onclick="window.print()" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">🖨️ 인쇄 / PDF</button>
            <button onclick="window.close()" class="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">닫기</button>
        </div>
    </div>
</div>
<div class="max-w-[640px] mx-auto px-4 py-5 fade-in">
${heroHtml}
${greetingHtml}
${articlesHtml}
${statsHtml}
${eventsHtml}
${galleryHtml}
${closingHtml}
    <div class="text-center py-6">
        <p class="text-xs text-slate-400 font-medium">${esc(orgName)}</p>
        <p class="text-[11px] text-slate-300 mt-1">아름다운재단 2026 공익단체 인큐베이팅 지원사업</p>
    </div>
</div>
</body>
</html>`;
        };

        // Generates section-based newsletter (주요소식, 다가올일정, 우리의생각, 구독, 단체정보)
        const generateSectionNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName, boardImageUrls = {}, rewrittenContents = {}, selectedGalleries = [], galleryThumbUrls = {}, orgSettings = {}) => {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const strip = (html) => String(html || '').replace(/<[^>]*>/g, '');
            const typeLabels = { notice: '공지', materials: '자료', report: '보고서', free: '소식' };
            const catColors = { '교육': '#7c3aed', '캠페인': '#ec4899', '회의': '#f59e0b', '평가': '#10b981', '기타': '#6366f1' };

            // ── Section 1: 주요소식 ──
            const newsCards = selectedBoards.map((b, i) => {
                const label = typeLabels[b.board_type] || b.board_type;
                const rawText = rewrittenContents[b.id] || strip(b.content || '');
                const preview = rawText.length > 200 ? rawText.slice(0, 200) + '…' : rawText;
                const images = boardImageUrls[b.id] || [];
                const dateStr = b.created_at ? b.created_at.split('T')[0] : '';
                return `
                <div style="padding:24px;background:#fff;border-radius:16px;border:1px solid #e5e7eb;margin-bottom:16px;">
                    ${images.length > 0 ? `<img src="${esc(images[0])}" alt="" style="width:100%;height:200px;object-fit:cover;border-radius:12px;margin-bottom:16px;" />` : ''}
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                        <span style="display:inline-block;padding:3px 10px;background:#f0f5ff;color:#3b82f6;font-size:11px;font-weight:600;border-radius:20px;">${esc(label)}</span>
                        <span style="font-size:11px;color:#9ca3af;">${esc(dateStr)}</span>
                    </div>
                    <h3 style="margin:0 0 10px;font-size:17px;font-weight:700;color:#111827;line-height:1.4;">${esc(b.title)}</h3>
                    <p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">${esc(preview)}</p>
                </div>`;
            }).join('');

            const newsSection = selectedBoards.length > 0 ? `
            <div style="margin-bottom:40px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <span style="font-size:22px;">📰</span>
                    <h2 style="margin:0;font-size:20px;font-weight:800;color:#111827;">주요소식</h2>
                </div>
                ${newsCards}
            </div>` : '';

            // ── Section 2: 다가올 일정 ──
            const scheduleRows = selectedSchedules.map(s => {
                const d = s.start_date ? new Date(s.start_date + 'T00:00:00') : new Date();
                const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
                const mon = monthNames[d.getMonth()] || '';
                const day = d.getDate();
                const cc = catColors[s.category] || '#6b7280';
                return `
                <div style="display:flex;gap:16px;align-items:center;padding:16px 0;border-bottom:1px solid #f3f4f6;">
                    <div style="min-width:60px;text-align:center;background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:12px;padding:10px 8px;">
                        <div style="font-size:11px;color:#3b82f6;font-weight:600;">${esc(mon)}</div>
                        <div style="font-size:24px;font-weight:800;color:#1e40af;line-height:1;">${day}</div>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:3px;">${esc(s.title)}</div>
                        <div style="font-size:12px;color:#9ca3af;">${esc(s.location || '')}${s.start_date && s.end_date && s.start_date !== s.end_date ? ' · ' + esc(s.start_date) + ' ~ ' + esc(s.end_date) : ''}</div>
                        ${s.description ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;line-height:1.5;">${esc(s.description).slice(0,120)}</p>` : ''}
                    </div>
                    <span style="padding:4px 12px;background:${cc}18;color:${cc};font-size:11px;font-weight:600;border-radius:20px;white-space:nowrap;">${esc(s.category || '기타')}</span>
                </div>`;
            }).join('');

            const scheduleSection = selectedSchedules.length > 0 ? `
            <div style="margin-bottom:40px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <span style="font-size:22px;">📅</span>
                    <h2 style="margin:0;font-size:20px;font-weight:800;color:#111827;">다가올 일정</h2>
                </div>
                <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:8px 24px;">
                    ${scheduleRows}
                </div>
            </div>` : '';

            // ── Section 3: 우리의 생각 ──
            const galleryGrid = selectedGalleries.length > 0 ? `
                <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:20px;">
                    ${selectedGalleries.slice(0, 4).map(g => {
                        const thumb = galleryThumbUrls[g.id];
                        return `
                        <div style="border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                            ${thumb
                                ? `<img src="${esc(thumb)}" alt="${esc(g.title)}" style="width:100%;height:120px;object-fit:cover;" />`
                                : `<div style="width:100%;height:120px;background:#f9fafb;display:flex;align-items:center;justify-content:center;color:#d1d5db;font-size:28px;">📷</div>`}
                            <div style="padding:8px 12px;">
                                <div style="font-size:12px;font-weight:600;color:#374151;">${esc(g.title)}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>` : '';

            const thoughtSection = (config.greeting || config.closing || selectedGalleries.length > 0) ? `
            <div style="margin-bottom:40px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                    <span style="font-size:22px;">💭</span>
                    <h2 style="margin:0;font-size:20px;font-weight:800;color:#111827;">우리의 생각</h2>
                </div>
                <div style="background:#fff;border-radius:16px;border:1px solid #e5e7eb;padding:24px;">
                    ${config.greeting ? `
                    <div style="padding:20px;background:linear-gradient(135deg,#fefce8,#fef9c3);border-radius:12px;border-left:4px solid #eab308;margin-bottom:16px;">
                        <p style="margin:0;font-size:14px;line-height:1.8;color:#713f12;white-space:pre-line;">${esc(config.greeting)}</p>
                    </div>` : ''}
                    ${config.closing ? `
                    <div style="padding:20px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;border-left:4px solid #22c55e;">
                        <p style="margin:0;font-size:14px;line-height:1.8;color:#14532d;white-space:pre-line;">${esc(config.closing)}</p>
                    </div>` : ''}
                    ${galleryGrid}
                </div>
            </div>` : '';

            // ── Section 4: 구독 ──
            const subscribeSection = `
            <div style="margin-bottom:40px;">
                <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:16px;padding:36px 28px;text-align:center;">
                    <div style="font-size:32px;margin-bottom:12px;">💌</div>
                    <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#fff;">뉴스레터 구독하기</h2>
                    <p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">
                        ${esc(orgName)}의 활동 소식을 정기적으로 받아보세요.<br>
                        청년 노동자의 권리와 안전을 함께 지켜갑니다.
                    </p>
                    <div style="display:inline-flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                        <div style="display:inline-block;padding:12px 28px;background:#fff;color:#4f46e5;font-size:14px;font-weight:700;border-radius:12px;">
                            구독 문의: ${esc(orgSettings.org_phone || '센터 연락처')}
                        </div>
                    </div>
                </div>
            </div>`;

            // ── Section 5: 단체정보 ──
            const orgInfoSection = `
            <div style="margin-bottom:20px;">
                <div style="background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
                        <span style="font-size:20px;">🏢</span>
                        <h3 style="margin:0;font-size:16px;font-weight:700;color:#111827;">단체정보</h3>
                    </div>
                    <table style="width:100%;border-collapse:collapse;font-size:13px;">
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:10px 12px;color:#6b7280;font-weight:600;width:100px;">단체명</td>
                            <td style="padding:10px 12px;color:#111827;">${esc(orgSettings.org_name || orgName)}</td>
                        </tr>
                        ${orgSettings.org_representative ? `
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:10px 12px;color:#6b7280;font-weight:600;">대표자</td>
                            <td style="padding:10px 12px;color:#111827;">${esc(orgSettings.org_representative)}</td>
                        </tr>` : ''}
                        ${orgSettings.org_address ? `
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:10px 12px;color:#6b7280;font-weight:600;">주소</td>
                            <td style="padding:10px 12px;color:#111827;">${esc(orgSettings.org_address)}</td>
                        </tr>` : ''}
                        ${orgSettings.org_registration_number ? `
                        <tr style="border-bottom:1px solid #e5e7eb;">
                            <td style="padding:10px 12px;color:#6b7280;font-weight:600;">고유번호</td>
                            <td style="padding:10px 12px;color:#111827;">${esc(orgSettings.org_registration_number)}</td>
                        </tr>` : ''}
                        ${orgSettings.org_phone ? `
                        <tr>
                            <td style="padding:10px 12px;color:#6b7280;font-weight:600;">연락처</td>
                            <td style="padding:10px 12px;color:#111827;">${esc(orgSettings.org_phone)}</td>
                        </tr>` : ''}
                    </table>
                </div>
            </div>`;

            // ── 발행정보 & 이번 호 구성 ──
            const statsLine = [
                selectedBoards.length > 0 ? `소식 ${selectedBoards.length}건` : '',
                selectedSchedules.length > 0 ? `일정 ${selectedSchedules.length}건` : '',
                selectedGalleries.length > 0 ? `갤러리 ${selectedGalleries.length}건` : '',
            ].filter(Boolean).join(' · ');

            return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(config.title || '뉴스레터')}</title>
<style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css');
    @page { size: A4; margin: 12mm; }
    @media print { .no-print { display: none !important; } body { background: #fff; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; color: #111827; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.5s ease both; }
</style>
</head>
<body>
<div class="no-print" style="text-align:center;padding:12px;background:#fff;border-bottom:1px solid #e5e7eb;">
    <button onclick="window.print()" style="display:inline-block;margin:0 4px;padding:10px 24px;font-size:13px;cursor:pointer;border:none;border-radius:10px;font-weight:600;background:#111827;color:#fff;">🖨️ 인쇄 / PDF</button>
    <button onclick="window.close()" style="display:inline-block;margin:0 4px;padding:10px 24px;font-size:13px;cursor:pointer;border:none;border-radius:10px;font-weight:600;background:#f3f4f6;color:#6b7280;">닫기</button>
</div>

<div style="max-width:620px;margin:0 auto;padding:24px 16px;" class="fade-up">
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#134E42 0%,#065f46 40%,#047857 100%);border-radius:20px;padding:48px 32px;text-align:center;margin-bottom:32px;">
        <div style="display:inline-block;padding:5px 14px;background:rgba(255,255,255,0.15);border-radius:20px;font-size:12px;color:rgba(255,255,255,0.85);font-weight:500;margin-bottom:14px;">
            ${config.issueNumber ? esc(config.issueNumber) + ' · ' : ''}${esc(config.publishDate)}
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#fff;margin:0 0 8px;letter-spacing:-0.5px;line-height:1.3;">${esc(config.title || '뉴스레터')}</h1>
        <p style="font-size:13px;color:rgba(255,255,255,0.65);margin:0;">${esc(orgName)}</p>
        ${statsLine ? `<div style="margin-top:16px;display:inline-block;padding:6px 16px;background:rgba(255,255,255,0.12);border-radius:20px;font-size:12px;color:rgba(255,255,255,0.75);">${statsLine}</div>` : ''}
    </div>

    ${newsSection}
    ${scheduleSection}
    ${thoughtSection}
    ${subscribeSection}
    ${orgInfoSection}

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0 16px;">
        <p style="font-size:12px;color:#9ca3af;font-weight:500;">${esc(orgName)}</p>
        <p style="font-size:11px;color:#d1d5db;margin-top:4px;">아름다운재단 2026 공익단체 인큐베이팅 지원사업</p>
        <p style="font-size:10px;color:#e5e7eb;margin-top:8px;">본 뉴스레터는 발신전용입니다.</p>
    </div>
</div>
</body>
</html>`;
        };

        // Generates digest-style newsletter (히어로기사, 짧은소식 그리드, 통계, 공지, 일정, 구독, 푸터)
        const generateDigestNewsletterHTML = (config, selectedSchedules, selectedBoards, orgName, boardImageUrls = {}, rewrittenContents = {}, selectedGalleries = [], galleryThumbUrls = {}, orgSettings = {}) => {
            const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            const strip = (html) => String(html || '').replace(/<[^>]*>/g, '');
            const typeConfig = {
                notice: { label: '공지', badge: 'accent' },
                materials: { label: '자료', badge: 'green' },
                report: { label: '보고서', badge: 'orange' },
                free: { label: '소식', badge: 'default' },
            };
            const badgeCls = {
                accent: 'bg-blue-50 text-blue-700 border border-blue-200',
                green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                orange: 'bg-orange-50 text-orange-700 border border-orange-200',
                red: 'bg-red-50 text-red-700 border border-red-200',
                default: 'bg-slate-100 text-slate-700 border border-slate-200',
            };
            const mkBadge = (text, variant) =>
                `<span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${badgeCls[variant] || badgeCls.default}">${esc(text)}</span>`;
            const monthEn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

            // Nav topics
            const navItems = ['주요 소식'];
            if (selectedBoards.length > 1) navItems.push('짧은 소식');
            navItems.push('통계');
            if (selectedSchedules.length > 0) navItems.push('일정');
            navItems.push('구독');

            // Hero article (first board post)
            const heroBoard = selectedBoards[0];
            const heroHtml = heroBoard ? (() => {
                const tc = typeConfig[heroBoard.board_type] || typeConfig.free;
                const rawText = rewrittenContents[heroBoard.id] || strip(heroBoard.content || '');
                const paras = rawText.split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean);
                const readTime = Math.max(1, Math.ceil(rawText.length / 500));
                const images = boardImageUrls[heroBoard.id] || [];

                return `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div class="flex items-center gap-2 mb-4">
                    ${mkBadge(tc.label, tc.badge)}
                    <span class="text-xs text-slate-400">${readTime}분 읽기</span>
                </div>
                <h2 class="text-xl font-bold text-slate-900 leading-snug mb-3">${esc(heroBoard.title)}</h2>
                ${paras.length > 0 ? `
                <div class="rounded-lg bg-blue-50 border-l-4 border-blue-400 px-4 py-3 mb-4">
                    <p class="text-sm text-blue-800 leading-relaxed">${esc(paras[0])}</p>
                </div>` : ''}
                <div class="space-y-3 mb-4">
                    ${paras.slice(1).map(p => `<p class="text-sm text-slate-600 leading-relaxed">${esc(p)}</p>`).join('')}
                </div>
                ${images.length > 0 ? `
                <div class="grid grid-cols-${Math.min(images.length, 3)} gap-2 mb-4">
                    ${images.slice(0, 3).map(url => `
                    <div class="rounded-xl overflow-hidden border border-slate-100">
                        <img src="${esc(url)}" alt="" class="w-full h-24 object-cover" />
                    </div>`).join('')}
                </div>` : ''}
                ${selectedGalleries.length > 0 && images.length === 0 ? `
                <div class="grid grid-cols-${Math.min(selectedGalleries.length, 3)} gap-2 mb-4">
                    ${selectedGalleries.slice(0, 3).map(g => {
                        const thumb = galleryThumbUrls[g.id] || g.image_path;
                        return `
                    <div class="rounded-xl overflow-hidden border border-slate-100">
                        ${thumb ? `<img src="${esc(thumb)}" alt="${esc(g.title)}" class="w-full h-24 object-cover" />` : `<div class="w-full h-24 bg-slate-50 flex items-center justify-center text-slate-300 text-2xl">📷</div>`}
                        <div class="px-2 py-1.5"><span class="text-[10px] text-slate-500">${esc(g.title)}</span></div>
                    </div>`;
                    }).join('')}
                </div>` : ''}
                ${config.greeting ? `
                <div class="relative rounded-xl bg-slate-50 border border-slate-200 px-5 py-4">
                    <svg class="absolute top-3 left-4 text-slate-200 w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.748-9.57 9-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.995zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.999v10h-9.999z"/>
                    </svg>
                    <p class="text-sm text-slate-700 leading-relaxed pl-6 font-medium italic">${esc(config.greeting)}</p>
                </div>` : ''}
            </div>`;
            })() : '';

            // Digest cards (remaining boards as 2-col grid)
            const digestBoards = selectedBoards.slice(1);
            const digestVariants = ['accent', 'green', 'orange', 'red'];
            const digestHtml = digestBoards.length > 0 ? `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <span class="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                        </span>
                        짧은 소식
                    </h3>
                    <span class="text-xs text-slate-400">${digestBoards.length}건</span>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    ${digestBoards.map((b, i) => {
                        const tc = typeConfig[b.board_type] || typeConfig.free;
                        const rawText = rewrittenContents[b.id] || strip(b.content || '');
                        const preview = rawText.length > 80 ? rawText.slice(0, 80) + '…' : rawText;
                        const num = String(i + 1).padStart(2, '0');
                        const variant = digestVariants[i % digestVariants.length];
                        return `
                    <div class="p-4 rounded-lg border border-slate-100">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs font-mono font-semibold text-slate-300">${num}</span>
                            ${mkBadge(tc.label, variant)}
                        </div>
                        <div class="text-sm font-semibold text-slate-800 leading-snug mb-1">${esc(b.title)}</div>
                        <div class="text-xs text-slate-500 leading-relaxed">${esc(preview)}</div>
                    </div>`;
                    }).join('')}
                </div>
            </div>` : '';

            // Stats
            const statsHtml = `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <span class="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                        </svg>
                    </span>
                    주요 수치
                </h3>
                <div class="grid grid-cols-3 divide-x divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                    <div class="flex flex-col items-center justify-center py-5 px-4">
                        <span class="text-3xl font-bold tabular-nums text-blue-600">${selectedBoards.length}<span class="text-lg font-medium text-slate-400">건</span></span>
                        <span class="mt-1 text-xs text-slate-500 text-center leading-tight">소식·기사</span>
                    </div>
                    <div class="flex flex-col items-center justify-center py-5 px-4">
                        <span class="text-3xl font-bold tabular-nums text-orange-500">${selectedSchedules.length}<span class="text-lg font-medium text-slate-400">건</span></span>
                        <span class="mt-1 text-xs text-slate-500 text-center leading-tight">주요 일정</span>
                    </div>
                    <div class="flex flex-col items-center justify-center py-5 px-4">
                        <span class="text-3xl font-bold tabular-nums text-emerald-600">${selectedGalleries.length}<span class="text-lg font-medium text-slate-400">건</span></span>
                        <span class="mt-1 text-xs text-slate-500 text-center leading-tight">갤러리</span>
                    </div>
                </div>
            </div>`;

            // Notice banner
            const noticeHtml = config.closing ? `
            <div class="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex gap-3 items-start">
                <span class="flex-shrink-0 mt-0.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </span>
                <div>
                    <p class="text-sm font-semibold text-amber-800 mb-0.5">알려드립니다</p>
                    <p class="text-xs text-amber-700 leading-relaxed">${esc(config.closing)}</p>
                </div>
            </div>` : '';

            // Events
            const eventsHtml = selectedSchedules.length > 0 ? `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <span class="w-5 h-5 rounded bg-slate-100 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                    </span>
                    다가오는 일정
                </h3>
                <div class="divide-y divide-slate-100">
                    ${selectedSchedules.map(s => {
                        const d = s.start_date ? new Date(s.start_date + 'T00:00:00') : new Date();
                        const m = monthEn[d.getMonth()] || 'Jan';
                        const day = String(d.getDate()).padStart(2, '0');
                        const time = s.start_time ? s.start_time.slice(0,5) : '';
                        const endTime = s.end_time ? s.end_time.slice(0,5) : '';
                        const timeStr = time && endTime ? `${time}–${endTime}` : time;
                        return `
                    <div class="flex items-start gap-4 py-3">
                        <div class="flex-shrink-0 w-12 text-center">
                            <div class="text-[10px] uppercase tracking-widest text-blue-500 font-semibold">${esc(m)}</div>
                            <div class="text-2xl font-bold text-slate-800 leading-none">${esc(day)}</div>
                        </div>
                        <div class="flex-1 min-w-0 pt-0.5">
                            <div class="text-sm font-semibold text-slate-800 leading-snug">${esc(s.title)}</div>
                            <div class="text-xs text-slate-400 mt-1">${timeStr ? esc(timeStr) + ' · ' : ''}${esc(s.location || '')}${s.category ? ' · ' + esc(s.category) : ''}</div>
                            ${s.description ? `<p class="text-xs text-slate-500 mt-1">${esc(s.description)}</p>` : ''}
                        </div>
                    </div>`;
                    }).join('')}
                </div>
            </div>` : '';

            // Subscribe CTA
            const subscribeHtml = `
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm p-6 text-center">
                <div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                    </svg>
                </div>
                <h3 class="text-base font-semibold text-slate-800 mb-1">격주 뉴스레터 구독하기</h3>
                <p class="text-xs text-slate-500 mb-4">${esc(orgName)}의 활동 소식을 놓치지 마세요.</p>
                <div style="display:flex;gap:8px;max-width:320px;margin:0 auto;">
                    <div style="flex:1;padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;color:#94a3b8;">이메일 주소</div>
                    <div style="padding:8px 16px;background:#2563eb;color:#fff;font-size:13px;font-weight:600;border-radius:8px;">구독</div>
                </div>
            </div>`;

            // Footer
            const orgAddr = orgSettings.org_address || '';
            const orgRep = orgSettings.org_representative || '';
            const orgRegNum = orgSettings.org_registration_number || '';
            const footerParts = [esc(orgName)];
            if (orgAddr) footerParts.push(esc(orgAddr));
            if (orgRep) footerParts.push('대표 ' + esc(orgRep));
            if (orgRegNum) footerParts.push('고유번호 ' + esc(orgRegNum));

            return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(config.title || '뉴스레터')}</title>
<script src="https://cdn.tailwindcss.com"><\/script>
<link rel="preconnect" href="https://cdn.jsdelivr.net">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .fade-in { animation: fadeIn 0.4s ease both; }
  @media print { .no-print{display:none!important} body{background:#fff} .shadow-sm{box-shadow:none} }
</style>
</head>
<body class="min-h-screen bg-slate-50">
<div class="no-print sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
    <div class="max-w-[640px] mx-auto px-4 h-12 flex items-center justify-between">
        <span class="text-sm font-medium text-slate-800">${esc(config.title || '뉴스레터')}</span>
        <div class="flex gap-2">
            <button onclick="window.print()" class="px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer">🖨️ 인쇄 / PDF</button>
            <button onclick="window.close()" class="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">닫기</button>
        </div>
    </div>
</div>
<div class="max-w-[640px] mx-auto px-4 py-6 space-y-4 fade-in">

    <!-- Header -->
    <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div class="bg-gradient-to-br from-blue-600 to-blue-700 px-8 pt-8 pb-6">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                    </div>
                    <span class="text-white/80 text-xs font-medium tracking-wide">${esc(orgName)}</span>
                </div>
                <span class="text-white/60 text-xs font-mono">${esc(config.issueNumber || '')}</span>
            </div>
            <h1 class="text-2xl font-bold text-white leading-tight mb-1">${esc(config.title || '뉴스레터')}</h1>
            <p class="text-blue-200 text-sm mt-2">${esc(config.publishDate || '')} · ${esc(orgName)} 발행</p>
        </div>
        <div class="px-8 py-3 flex gap-2 border-b border-slate-100 bg-white overflow-x-auto">
            ${navItems.map((t, i) => `<span class="${i === 0 ? 'text-white bg-blue-600' : 'text-slate-500'} flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-md">${esc(t)}</span>`).join('')}
        </div>
    </div>

    ${heroHtml}
    ${digestHtml}
    ${statsHtml}
    ${noticeHtml}
    ${eventsHtml}
    ${subscribeHtml}

    <!-- Footer -->
    <div class="px-2 pb-4">
        <hr class="border-slate-100 my-1" />
        <div class="flex items-center justify-between py-3">
            <span class="text-xs font-semibold text-slate-700">${esc(orgName)}</span>
            <div class="flex gap-4">
                <span class="text-xs text-slate-400">아름다운재단 2026</span>
            </div>
        </div>
        <p class="text-[11px] text-slate-400 leading-relaxed">
            ${footerParts.join(' · ')}
        </p>
    </div>

</div>
</body>
</html>`;
        };

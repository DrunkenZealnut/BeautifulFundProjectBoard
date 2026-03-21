// pages/guide.jsx — Accounting guide page
// Defined inside ProjectManagementSystem scope

            const renderGuide = () => {
                // DOCUMENT_RULES에서 증빙서류를 파생하는 헬퍼
                const getDocsList = (ruleKey) => {
                    const rule = DOCUMENT_RULES[ruleKey];
                    if (!rule) return ['해당 항목의 증빙서류에 준함'];
                    return [...(rule.base || []), ...(rule.required || []), ...(rule.conditional || [])];
                };

                const accountItems = [
                    { group: '사업비', name: '사업회의비', color: '#2B6CB0', bg: '#EBF8FF',
                      desc: '행사, 회의 등 진행을 위해 지급되는 장소 대관비, 다과구입, 식비, 다과비 등',
                      restriction: '인건비성 경비 편성불가',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '주류, 노래방 등 비용 지출 불가. 교통비는 여비교통비 계정으로 별도 지출.',
                      withholding: false },
                    { group: '사업비', name: '사업인건비', color: '#C53030', bg: '#FFF5F5',
                      desc: '강사비, 원고비, 발제비, 토론비, 인터뷰 사례비, 자문비, 회의참석비, 단순인건비 등',
                      restriction: '단체 내부인에는 지급불가 (대표자, 정기급여 수급자, 사업담당자)',
                      payment: '계좌이체만 가능 (현금 지급 불가)',
                      warning: '원천징수금액은 운영통장으로 이체 후 집행. 주민번호 수집 필요.',
                      withholding: true },
                    { group: '사업비', name: '지급수수료', color: '#6B46C1', bg: '#FAF5FF',
                      desc: '영상제작, 행사중계, 디자인, 통/번역, 연구조사, 장비임대 등 외주용역 비용',
                      restriction: '100만원 이상 용역은 2개 이상 비교견적 필요, 용역계약서 작성 필수',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '개인용역계약 시 추가 서류 필요. 최저가 선택 불필수(품질 중요 시 재단 협의).',
                      withholding: true },
                    { group: '사업비', name: '여비교통비', color: '#C05621', bg: '#FFFAF0',
                      desc: '출장여비(숙박료, 식대) 및 교통비(대중교통, 통행료, 주차료, 자차 유류대), 여행자보험 등',
                      restriction: '실비지출에 한정, 영수증 필수',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '영수증 없으면 불인정. 사업인건비와 중복지출 불가.',
                      withholding: false },
                    { group: '사업비', name: '물품구매비', color: '#276749', bg: '#F0FFF4',
                      desc: '단위사업에 필요한 물품 구입비용',
                      restriction: '100만원 이상 구매 시 2개 이상 비교견적 필요',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '적격증빙 불가한 개인 중고거래물품 구입은 인정 불가.',
                      withholding: false },
                    { group: '사업비', name: '사업홍보비', color: '#D69E2E', bg: '#FFFFF0', ruleKey: '사업홍보비',
                      desc: '단위사업 홍보, 사업참여자 모집을 목적으로 지출한 홍보 비용',
                      restriction: '사업과의 직접적 연관성 입증 필요',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '단위사업과 직접 관련된 홍보만 인정.',
                      withholding: false },
                    { group: '사업비', name: '도서인쇄비', color: '#319795', bg: '#E6FFFA', ruleKey: '도서인쇄비',
                      desc: '자료집, 교재제본, 리플렛 등 인쇄물 제작비',
                      restriction: '사업목적 부합 인쇄물만 인정',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '사업목적과 부합하는 인쇄물만 인정.',
                      withholding: false },
                    { group: '사업비', name: '예비비', color: '#4A5568', bg: '#F7FAFC', ruleKey: null,
                      desc: '예상 외 소요 비용 (지원금의 1/100 이내 권고)',
                      restriction: '속한 단위사업 내 다른 항목에 포함시켜 사용 가능 (50만원 이상 시 변경신청 필요)',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '다른 단위사업에 포함시켜 사용 불가 (사업변경신청 필요).',
                      withholding: false },
                    { group: '운영비', name: '운영인건비', color: '#B83280', bg: '#FFF5F7',
                      desc: '단체 활동가(사업담당자)의 기본급여, 법정수당, 퇴직급여적립금, 사회보험 사용자부담금 등',
                      restriction: '지원단체에 소속된 사람에게만 지급 가능',
                      payment: '사업전용계좌 → 단체 운영통장으로 일괄 이체 후 지급',
                      warning: '사업전용계좌에서 바로 지급하지 않음. 운영통장 경유 필수. 1년 미만 퇴직 시 퇴직적립금 반환.',
                      withholding: false },
                    { group: '운영비', name: '교육훈련비', color: '#C2410C', bg: '#FFF8F1',
                      desc: '단체 활동가의 역량강화를 위한 교육비, 대내외 인사 및 위원회 운영 회의비',
                      restriction: '역량강화 목적에 부합해야 함',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '단체 활동가 역량강화 목적에 부합해야 함.',
                      withholding: false },
                    { group: '운영비', name: '임차료', color: '#0E7490', bg: '#F0FFFF',
                      desc: '사무실 임차비(임대보증금 설정불가), 관리비(집합건물 공용관리비, 장기수선충당금 등)',
                      restriction: '임대보증금 설정 불가',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '임대보증금은 설정할 수 없음.',
                      withholding: false },
                    { group: '운영비', name: '일반관리비', color: '#92400E', bg: '#FFFFF0',
                      desc: '사무용품, 소모성물품, 수도광열비, 통신비, 제세공과금, 보험료, 금융기관수수료 등 (취득단가 100만원 미만)',
                      restriction: '취득단가 100만원 미만 물품만',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '사회보험 사용자부담금 등은 운영인건비로 편성할 것.',
                      withholding: false },
                    { group: '운영비', name: '홍보비', color: '#553C9A', bg: '#F5F0FF',
                      desc: '단체홍보, 회원모집, 회원활동지원, 모금활동을 목적으로 지출한 홍보비용',
                      restriction: '단체홍보 목적에 부합해야 함',
                      payment: '전용계좌 체크카드 또는 계좌이체',
                      warning: '사업홍보비와 구분하여 운영.',
                      withholding: false }
                ];

                // 원천징수 계산
                const calcWithholding = () => {
                    const amount = parseInt(withholdingAmount) || 0;
                    if (amount <= 0) return null;
                    const expenseDeduction = Math.floor(amount * expenseRate / 100);
                    const taxableIncome = amount - expenseDeduction;
                    const isExempt = taxableIncome <= 50000;
                    const incomeTax = isExempt ? 0 : Math.floor(taxableIncome * 0.2);
                    const localTax = isExempt ? 0 : Math.floor(incomeTax * 0.1);
                    const totalTax = incomeTax + localTax;
                    const netPayment = amount - totalTax;
                    return { amount, expenseDeduction, taxableIncome, isExempt, incomeTax, localTax, totalTax, netPayment };
                };

                const withholdingResult = calcWithholding();

                return (
                    <div>
                        <h1 className="section-title">📖 회계처리 가이드</h1>
                        <p style={{ color: '#6B6560', marginBottom: '20px', fontSize: '14px' }}>
                            아름다운재단 2026 공익단체 인큐베이팅 지원사업 수행가이드 기반
                        </p>

                        {/* 탭 네비게이션 */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            {[
                                { id: 'principles', label: '📋 기본원칙' },
                                { id: 'accounts', label: '📂 계정항목별 안내' },
                                { id: 'receipts', label: '🧾 적격증빙 가이드' },
                                { id: 'withholding', label: '💰 원천징수 계산기' },
                                { id: 'faq', label: '❓ FAQ' }
                            ].map(tab => (
                                <button key={tab.id}
                                    className={`btn ${guideTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setGuideTab(tab.id)}
                                    style={{ fontSize: '13px', padding: '8px 16px' }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* 기본원칙 탭 */}
                        {guideTab === 'principles' && (
                            <div>
                                {/* 회계처리 기본원칙 */}
                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>회계처리 기본원칙</h3>
                                    <div style={{ display: 'grid', gap: '12px' }}>
                                        {[
                                            { icon: '🏦', title: '사업전용계좌 사용', desc: '단체 일반회계와 구분하여 사업전용계좌를 사용하고 회계장부를 별도로 관리해야 합니다.' },
                                            { icon: '💳', title: '체크카드 사용 원칙', desc: '사업전용계좌의 체크카드를 발급받아 사용함을 원칙으로 합니다. 복수 발급 가능합니다.' },
                                            { icon: '🚫', title: '현금인출 금지', desc: '현금인출 및 전용체크카드 외 지출은 불가능하며, 불가피한 경우 재단의 사전승인이 필요합니다.' },
                                            { icon: '📝', title: '적격증빙 필수', desc: '모든 지출에는 해당 지출에 대한 적격 영수증빙 서류가 있어야 합니다. 거래명세서·이체내역서만으로는 영수증빙이 되지 않습니다.' },
                                            { icon: '🔒', title: '용도 외 사용 금지', desc: '지급된 사업비는 지원사업 이외의 용도로 임의사용할 수 없습니다.' },
                                            { icon: '📊', title: '자부담 분리', desc: '자부담이 있는 경우 전용통장과 분리하여 사용해야 합니다.' }
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#FAFAF8', borderRadius: '8px', alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: '20px', flexShrink: 0 }}>{item.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{item.title}</div>
                                                    <div style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.5' }}>{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 지출처리 절차 */}
                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>지출처리 흐름</h3>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {[
                                            { step: '1', label: '지출 발생', desc: '체크카드 결제 또는 계좌이체' },
                                            { step: '→' },
                                            { step: '2', label: '영수증 수취', desc: '적격증빙 영수증 확보' },
                                            { step: '→' },
                                            { step: '3', label: '지출대장 기록', desc: '통장거래내역 순서대로' },
                                            { step: '→' },
                                            { step: '4', label: '증빙서류 편철', desc: '지출대장 순서대로 정리' },
                                            { step: '→' },
                                            { step: '5', label: '정산보고', desc: '중간/최종 결과보고' }
                                        ].map((item, i) => (
                                            item.step === '→' ?
                                                <span key={i} style={{ fontSize: '20px', color: '#A39E99' }}>→</span> :
                                                <div key={i} style={{ flex: '1', minWidth: '120px', padding: '14px', background: '#F0FFF4', borderRadius: '10px', textAlign: 'center', border: '1px solid #C6F6D5' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1B6B5A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '14px', fontWeight: '700' }}>{item.step}</div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>{item.label}</div>
                                                    <div style={{ fontSize: '11px', color: '#6B6560' }}>{item.desc}</div>
                                                </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 금지 사항 */}
                                <div className="card" style={{ marginBottom: '20px', border: '1px solid #FED7D7' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#C53030' }}>주의 및 금지 사항</h3>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {[
                                            '단체 내부거래 금지: 임직원 운영 업체, 계열사, 산하 단체와의 거래는 부적정 집행으로 환수 조치',
                                            '간편결제 예치금 충전 금지: 제로페이 지역상품권 등 예치금 충전 후 물품 구매 불가',
                                            '사업전용계좌 간편결제 등록 금지: 카카오페이머니, 네이버포인트 자동충전 등은 사업비 임의전용에 해당',
                                            '통합지출 지양: 항목이 다른 비용의 통합지출은 가급적 지양. 부득이한 경우 지출대장에 항목별 구분 기재',
                                            '사업비↔운영비 간 예산변경 불가: 단, 운영비→사업비 전용은 재단승인 시 가능 (역방향 불가)',
                                            '이체수수료: 해당 예산항목에 편성. 미편성 시 예비비 또는 일반관리비로 지출'
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', background: '#FFF5F5', borderRadius: '6px' }}>
                                                <span style={{ color: '#C53030', fontWeight: '700', flexShrink: 0 }}>⚠</span>
                                                <span style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.5' }}>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 사업변경 */}
                                <div className="card">
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>사업변경 안내</h3>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div style={{ padding: '12px', background: '#FAFAF8', borderRadius: '8px', fontSize: '13px', lineHeight: '1.6' }}>
                                            <strong>변경 신청 마감:</strong> 사업종료일 2개월 전까지 (2026.10.31)<br/>
                                            <strong>절차:</strong> 재단 담당자 이메일 문의 → 검토/변경신청서 제출 요청 → 직인 날인 후 제출 → 심사(약 1주) → 결과 회신<br/>
                                            <strong>예비비 사용:</strong> 속한 단위사업 내 다른 항목에 포함 가능 (50만원 이상 시 사업변경신청 필요)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 계정항목별 안내 탭 */}
                        {guideTab === 'accounts' && (
                            <div>
                                <div style={{ display: 'grid', gap: '8px', marginBottom: selectedAccount !== null ? '24px' : '0' }}>
                                    {['사업비', '운영비'].map(group => (
                                        <div key={group}>
                                            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '16px 0 10px', color: group === '사업비' ? '#1B6B5A' : '#2B6CB0' }}>
                                                {group === '사업비' ? '📦 사업비 계정항목' : '🏢 운영비 계정항목'}
                                            </h3>
                                            <div style={{ display: 'grid', gap: '6px' }}>
                                                {accountItems.filter(a => a.group === group).map((account, i) => (
                                                    <div key={i}
                                                        onClick={() => setSelectedAccount(selectedAccount?.name === account.name ? null : account)}
                                                        style={{
                                                            padding: '14px 16px', background: selectedAccount?.name === account.name ? account.bg : 'white',
                                                            borderRadius: '10px', cursor: 'pointer', border: `1px solid ${selectedAccount?.name === account.name ? account.color + '40' : '#E2E0DD'}`,
                                                            transition: 'all 0.2s'
                                                        }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', background: account.bg, color: account.color }}>{account.name}</span>
                                                                {account.withholding && <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>원천징수 대상</span>}
                                                            </div>
                                                            <span style={{ fontSize: '18px', color: '#A39E99', transform: selectedAccount?.name === account.name ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#6B6560', marginTop: '6px' }}>{account.desc}</div>

                                                        {selectedAccount?.name === account.name && (
                                                            <div style={{ marginTop: '16px', display: 'grid', gap: '12px' }}>
                                                                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #E2E0DD' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#C53030', marginBottom: '6px' }}>제한사항</div>
                                                                    <div style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.5' }}>{account.restriction}</div>
                                                                </div>
                                                                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #E2E0DD' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#2B6CB0', marginBottom: '6px' }}>결제 방법</div>
                                                                    <div style={{ fontSize: '13px', color: '#4A4540' }}>{account.payment}</div>
                                                                </div>
                                                                <div style={{ padding: '12px', background: 'white', borderRadius: '8px', border: '1px solid #E2E0DD' }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#276749', marginBottom: '6px' }}>필요 증빙서류</div>
                                                                    <ul style={{ margin: '0', paddingLeft: '18px', fontSize: '13px', color: '#4A4540', lineHeight: '1.7' }}>
                                                                        {getDocsList(account.ruleKey !== undefined ? account.ruleKey : account.name).map((doc, j) => <li key={j}>{doc}</li>)}
                                                                    </ul>
                                                                </div>
                                                                <div style={{ padding: '10px 12px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A', fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                                                                    💡 {account.warning}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 적격증빙 가이드 탭 */}
                        {guideTab === 'receipts' && (
                            <div>
                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>적격증빙 영수증 우선순위</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#134E42', color: 'white' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>우선순위</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>증빙유형</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>내용 및 주의사항</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {[
                                                    { rank: '①', type: '전용계좌 체크카드 매출전표', note: '전용계좌 체크카드 외 카드 사용불가', color: '#276749' },
                                                    { rank: '②', type: '(전자)세금계산서', note: '일반과세자 및 간이과세자 중 직전년도 공급대가 4,800만원 이상인 경우 발급의무. 이체내역서·사업자등록증 추가 필요', color: '#2B6CB0' },
                                                    { rank: '③', type: '(전자)계산서', note: '면세사업자에 한해 인정. 이체확인증·면세사업자등록증 추가 필요', color: '#6B46C1' },
                                                    { rank: '④', type: '현금영수증 (매출증빙)', note: '소득공제용 불가. 이체내역서 추가 필요', color: '#C05621' },
                                                    { rank: '✕', type: '간이영수증', note: '사용 불가', color: '#C53030' }
                                                ].map((item, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #E2E0DD', background: i === 4 ? '#FFF5F5' : 'white' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', color: item.color, fontSize: '16px' }}>{item.rank}</td>
                                                        <td style={{ padding: '12px', fontWeight: '600' }}>{item.type}</td>
                                                        <td style={{ padding: '12px', color: '#4A4540', lineHeight: '1.5' }}>{item.note}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>영수증 관리 원칙</h3>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        {[
                                            { title: '원본 제출', desc: '영수증은 항목·내역이 있는 원본을 제출합니다. 내용이 사라질 수 있으므로 반드시 복사 보관하세요.' },
                                            { title: '부착 방법', desc: 'A4 1장에 영수증 1장씩 겹침 없이 풀로 부착. 이면지 사용 시 "이면지 활용" 표기.' },
                                            { title: '출력용 영수증', desc: '별도 부착 없이 영수번호, 지출일자, 지출금액, 지출내역을 기재하여 제출합니다.' },
                                            { title: '편철 순서', desc: '통장거래내역 순서에 따라 지출대장을 작성하고, 영수증도 같은 순서로 편철합니다.' },
                                            { title: '이체내역서 필수 정보', desc: '① 예금주명 ② 수취인명 ③ 계좌번호(양쪽) ④ 이체금액 ⑤ 이체일시가 포함되어야 합니다.' }
                                        ].map((item, i) => (
                                            <div key={i} style={{ padding: '12px', background: '#FAFAF8', borderRadius: '8px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', color: '#1B6B5A' }}>{item.title}</div>
                                                <div style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.5' }}>{item.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card">
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>상품권·선물·수상금 증빙</h3>
                                    <div style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.7' }}>
                                        <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                            <li>구매 증빙: 구입 영수증 + 수령자 직접 수령 확인 수령증 필요</li>
                                            <li>체크카드로 구매 권고 (계좌이체 시 현금영수증·세금계산서 발급 불가 → 인보이스·사유서 필요)</li>
                                            <li>기타소득금액이 건별 5만원 초과 시 소득금액의 22% 원천징수 (상품권·기프티콘도 과세 대상)</li>
                                            <li>1인당 3만원 이하 상품권·온라인쿠폰: 수령확인증 대신 수령명세표(재단서식)로 대체 가능</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 원천징수 계산기 탭 */}
                        {guideTab === 'withholding' && (
                            <div>
                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>원천징수 계산기 (기타소득)</h3>
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>지급 금액 (원)</label>
                                            <input type="text" inputMode="numeric" value={fmtInput(withholdingAmount)} onChange={e => setWithholdingAmount(parseInput(e.target.value))}
                                                placeholder="예: 200,000" style={{ width: '100%', padding: '10px 12px', border: '1px solid #D5D3D0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>필요경비율</label>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {[
                                                    { rate: 60, label: '60% (인적용역: 강연료, 원고료 등)' },
                                                    { rate: 80, label: '80% (불특정 다수 경쟁 대회 상금)' },
                                                    { rate: 0, label: '0% (필요경비 없음: 기프티콘 등)' }
                                                ].map(opt => (
                                                    <button key={opt.rate}
                                                        className={`btn ${expenseRate === opt.rate ? 'btn-primary' : 'btn-secondary'}`}
                                                        onClick={() => setExpenseRate(opt.rate)}
                                                        style={{ fontSize: '12px', padding: '6px 12px', flex: 1 }}>
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {withholdingResult && withholdingResult.amount > 0 && (
                                            <div style={{ padding: '20px', background: '#F0FFF4', borderRadius: '12px', border: '1px solid #C6F6D5' }}>
                                                <div style={{ display: 'grid', gap: '10px', fontSize: '14px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#4A4540' }}>지급 금액</span>
                                                        <span style={{ fontWeight: '600' }}>{withholdingResult.amount.toLocaleString()}원</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#4A4540' }}>필요경비 ({expenseRate}%)</span>
                                                        <span>- {withholdingResult.expenseDeduction.toLocaleString()}원</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #C6F6D5', paddingTop: '8px' }}>
                                                        <span style={{ color: '#4A4540' }}>기타소득금액</span>
                                                        <span style={{ fontWeight: '600' }}>{withholdingResult.taxableIncome.toLocaleString()}원</span>
                                                    </div>

                                                    {withholdingResult.isExempt ? (
                                                        <div style={{ padding: '12px', background: '#EBF8FF', borderRadius: '8px', textAlign: 'center', fontWeight: '600', color: '#2B6CB0' }}>
                                                            과세최저한 적용: 기타소득금액 5만원 이하 → 원천징수 없음
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#4A4540' }}>소득세 (20%)</span>
                                                                <span style={{ color: '#C53030' }}>- {withholdingResult.incomeTax.toLocaleString()}원</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#4A4540' }}>지방소득세 (소득세의 10%)</span>
                                                                <span style={{ color: '#C53030' }}>- {withholdingResult.localTax.toLocaleString()}원</span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #C6F6D5', paddingTop: '8px' }}>
                                                                <span style={{ color: '#4A4540' }}>원천징수 합계</span>
                                                                <span style={{ fontWeight: '700', color: '#C53030' }}>{withholdingResult.totalTax.toLocaleString()}원</span>
                                                            </div>
                                                        </>
                                                    )}

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'white', borderRadius: '8px', border: '2px solid #1B6B5A', fontWeight: '700', fontSize: '16px' }}>
                                                        <span style={{ color: '#1B6B5A' }}>실수령액</span>
                                                        <span style={{ color: '#1B6B5A' }}>{withholdingResult.netPayment.toLocaleString()}원</span>
                                                    </div>
                                                </div>

                                                {!withholdingResult.isExempt && (
                                                    <div style={{ marginTop: '12px', padding: '10px', background: '#FFFBEB', borderRadius: '8px', fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                                                        💡 세율: 필요경비 {expenseRate}% 기준 수입금액의 {expenseRate === 60 ? '8.8' : expenseRate === 80 ? '4.4' : '22'}%
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="card" style={{ marginBottom: '20px' }}>
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>원천징수 처리 절차</h3>
                                    <div style={{ display: 'grid', gap: '8px' }}>
                                        {[
                                            { step: '1', title: '비용 지급 시', desc: '원천징수세액을 공제하고 실수령액을 수령인 계좌로 이체' },
                                            { step: '2', title: '세액 이체', desc: '원천징수금액을 사업전용계좌에서 단체 운영통장(예수금통장)으로 이체' },
                                            { step: '3', title: '신고·납부', desc: '지급일이 속하는 달의 다음달 10일까지 원천징수이행상황신고서 작성 및 납부 (반기납부자는 반기 마지막달 다음달 10일까지)' },
                                            { step: '4', title: '지급명세서', desc: '기타소득: 지급 차년도 2월 말까지 / 근로·퇴직·사업: 차년도 3.10까지 제출' }
                                        ].map((item, i) => (
                                            <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px', background: '#FAFAF8', borderRadius: '8px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1B6B5A', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{item.step}</div>
                                                <div>
                                                    <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '2px' }}>{item.title}</div>
                                                    <div style={{ fontSize: '12px', color: '#4A4540', lineHeight: '1.5' }}>{item.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card">
                                    <h3 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '16px', color: '#134E42' }}>소득구분 및 세율 요약</h3>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#134E42', color: 'white' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>구분</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>설명</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'center' }}>세율 (지방소득세 포함)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr style={{ borderBottom: '1px solid #E2E0DD' }}>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>기타소득</td>
                                                    <td style={{ padding: '12px', color: '#4A4540' }}>일시적 용역 제공 대가 (강연료, 자문비, 원고료 등)</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>필요경비 60%: 수입금액의 <strong>8.8%</strong><br/>필요경비 80%: 수입금액의 <strong>4.4%</strong></td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid #E2E0DD' }}>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>사업소득</td>
                                                    <td style={{ padding: '12px', color: '#4A4540' }}>독립된 자격으로 계속적 용역 제공 대가</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>수입금액의 <strong>3.3%</strong></td>
                                                </tr>
                                                <tr>
                                                    <td style={{ padding: '12px', fontWeight: '600' }}>근로소득</td>
                                                    <td style={{ padding: '12px', color: '#4A4540' }}>고용관계 또는 유사 계약에 의한 근로 대가</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>간이세액표 적용<br/>(일용근로자: <strong>6.6%</strong>)</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div style={{ marginTop: '12px', padding: '10px', background: '#FFFBEB', borderRadius: '8px', fontSize: '12px', color: '#92400E', lineHeight: '1.5' }}>
                                        💡 과세최저한: 기타소득금액(수입금액-필요경비)이 건별 5만원 이하이면 원천징수 없음. 단, 원천징수이행상황신고와 지급명세서 제출은 필요합니다.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FAQ 탭 */}
                        {guideTab === 'faq' && (
                            <div style={{ display: 'grid', gap: '12px' }}>
                                {[
                                    { q: '사업전용계좌에서 바로 원천징수세액을 납부해도 되나요?',
                                      a: '안 됩니다. 해당 월의 전체 원천징수세액을 합산신고해야 하므로, 사업전용계좌에서 단체 운영계좌(예수금통장)로 이체 후 한번에 신고·납부해야 합니다. 건별 따로 신고 시 마지막 건만 인정되어 누락 가산세가 발생할 수 있습니다.' },
                                    { q: '미등록단체(모임)인데 원천징수를 해야 하나요?',
                                      a: '네. 세무서 사업자등록·고유번호등록 여부와 관계없이 소득을 지급하는 자는 원천징수 의무가 있습니다. 단, 고유번호증이 없는 미등록단체가 사업소득을 지급하는 경우 원천징수 의무는 없으며, 수령자가 직접 신고·납부하도록 안내해주세요.' },
                                    { q: '원천징수가 면제되는 경우는?',
                                      a: '과세최저한(건별 기타소득금액 5만원 이하)이 적용되는 경우와 소액부징수(세액 1,000원 미만)인 경우 원천징수가 면제됩니다. 단, 원천징수이행상황신고서는 제출해야 하며, 지급명세서 제출이 필요한 경우도 있습니다.' },
                                    { q: '반기별 납부자인 경우 증빙은 어떻게?',
                                      a: '국세청 "원천징수세액 반기별 납부 지정 통지" 공문 또는 사유서를 제출하세요. 세액은 지급 시마다 운영계좌로 이체하고, 반기 마지막달 다음달 10일까지 신고·납부합니다.' },
                                    { q: '이자가 발생하면 어떻게 처리하나요?',
                                      a: '사업전용계좌 이자수입은 단체의 수입으로 처리합니다. 이자 발생 시마다 운영통장으로 이체하세요. 이자를 사업비로 쓰려면 잡수입 처리 후 자부담으로 집행해야 합니다. 캐시백도 동일하게 처리합니다.' },
                                    { q: '지출 오류가 발생했을 때는?',
                                      a: '오류금액을 재입금하여 처리합니다. 지출대장에 수입이 아닌 마이너스(-) 지출로 표기하고, 내역에 "OOO 지출오류 재입금"으로 기재합니다. 구분/단위사업명/항목은 기존과 동일하게 유지합니다.' },
                                    { q: '지원금 잔액은 언제까지 반납해야 하나요?',
                                      a: '원칙적으로 사업종료일(12월 31일)까지 환급합니다. 연속지원 선정 시 차년도 사업비 지급을 위해 0원 잔액 증명이 필요하므로 늦어도 2027년 1월 4일까지는 완료해주세요. 환급계좌: 하나은행 162-910010-64604 (아름다운재단).' },
                                    { q: '개인정보 문서는 어떻게 처리하나요?',
                                      a: '이력서, 수령확인증 등 수집 시 "개인정보 수집·이용 및 제3자 제공 동의서"를 받아야 합니다. 제공받는 자에 "아름다운재단"을 명시하고, 주민등록번호 뒷자리는 마스킹(숨김처리) 후 제출합니다. 동의서 자체는 재단에 제출하지 않습니다.' },
                                    { q: '오픈뱅킹으로 이체해도 되나요?',
                                      a: '권장하지 않습니다. 오픈뱅킹의 경우 서비스 제공 사업자에 따라 이체확인 증명이 원활하지 않은 경우가 있습니다.' }
                                ].map((item, i) => (
                                    <div key={i} className="card" style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#134E42', marginBottom: '10px', display: 'flex', gap: '8px' }}>
                                            <span style={{ color: '#1B6B5A', flexShrink: 0 }}>Q{i+1}.</span>
                                            {item.q}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#4A4540', lineHeight: '1.7', paddingLeft: '28px' }}>
                                            {item.a}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            };

            // ===== 뉴스레터 페이지 렌더링 =====

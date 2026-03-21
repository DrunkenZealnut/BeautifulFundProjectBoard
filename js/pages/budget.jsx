// pages/budget.jsx — Budget management page
// Defined inside ProjectManagementSystem scope

            const renderBudget = () => {
                const subcategories = getAllSubcategories();
                const selectedBudgetItems = getAllBudgetItems(formData.subcategory_id);

                return (
                    <div>
                        <h1 className="section-title">💰 예산 관리</h1>
                        <p className="section-subtitle">총 7천만원 예산의 고급 집행 관리 시스템</p>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button className="btn btn-secondary" onClick={() => {
                                const initialBudgetChanges = {};
                                BUDGET_DATA.categories.forEach(cat => {
                                    cat.subcategories.forEach(sub => {
                                        initialBudgetChanges[sub.id] = { before: sub.budget, after: sub.budget };
                                    });
                                });
                                setChangeApplicationForm({
                                    reason: '',
                                    changeDetails: [{ beforeUnit: '', beforeSchedule: '', beforeContent: '',
                                                      afterUnit: '', afterSchedule: '', afterContent: '' }],
                                    budgetChanges: initialBudgetChanges,
                                    specificDetails: [{ unitName: '', beforeAmount: 0, afterAmount: 0, basis: '', reason: '' }],
                                    applicationDate: new Date().toISOString().slice(0, 10)
                                });
                                setChangeApplicationModal(true);
                            }}>
                                📝 사업변경신청서
                            </button>
                        </div>

                        {/* 탭 네비게이션 */}
                        <div className="tab-navigation">
                            <button
                                className={`tab-btn ${budgetTab === 'dashboard' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('dashboard')}
                            >
                                📊 대시보드
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'breakdown' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('breakdown')}
                            >
                                📋 예산편성표
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'register' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('register')}
                            >
                                📝 집행등록
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'calculator' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('calculator')}
                            >
                                🧮 원천징수계산
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'history' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('history')}
                            >
                                📋 집행내역
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'ratio' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('ratio')}
                            >
                                📊 비용비율
                            </button>
                            <button
                                className={`tab-btn ${budgetTab === 'calendar' ? 'active' : ''}`}
                                onClick={() => setBudgetTab('calendar')}
                            >
                                📅 캘린더
                            </button>
                        </div>

                        {/* 탭 내용 */}
                        <div className="card">
                            {budgetTab === 'dashboard' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                                            📊 예산 현황 대시보드
                                        </h2>
                                        {/* 시기 필터 */}
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {Object.entries(BUDGET_DATA.periods).map(([key, p]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${budgetPeriod === key ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => setBudgetPeriod(key)}
                                                    style={{ fontSize: '12px', padding: '6px 14px' }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Period budget summary cards (3 items) - includes actual execution amounts */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                                        {Object.entries(BUDGET_DATA.periods).map(([key, p]) => {
                                            const periodUsed = getPeriodUsed(data.budgetExecutions, key);
                                            const periodExecRate = pct(periodUsed, p.budget);
                                            const isActive = budgetPeriod === key;
                                            return (
                                                <button type="button" key={key} style={{
                                                    padding: '16px',
                                                    borderRadius: '12px',
                                                    background: isActive ? 'linear-gradient(135deg, #1B6B5A, #134E42)' : '#F8F9FA',
                                                    color: isActive ? 'white' : '#2D2B29',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    border: isActive ? 'none' : '1px solid #E2E0DD',
                                                    textAlign: 'left',
                                                    width: '100%'
                                                }} onClick={() => setBudgetPeriod(key)}>
                                                    <div style={{ fontSize: '13px', opacity: 0.8, marginBottom: '4px' }}>{p.label}</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '700' }}>{fmt(p.budget / 10000)}만원</div>
                                                    <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                                                        집행률 {periodExecRate}%
                                                    </div>
                                                    <div style={{ height: '4px', background: isActive ? 'rgba(255,255,255,0.3)' : '#E2E0DD', borderRadius: '2px', marginTop: '8px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', background: isActive ? 'white' : '#1B6B5A', width: `${periodExecRate}%`, borderRadius: '2px' }} />
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Total execution rate for selected period */}
                                    {(() => {
                                        const selectedPeriod = BUDGET_DATA.periods[budgetPeriod];
                                        const selectedUsed = getPeriodUsed(data.budgetExecutions, budgetPeriod);
                                        const selectedRate = pct(selectedUsed, selectedPeriod.budget);
                                        return (
                                        <div style={{
                                            background: 'linear-gradient(135deg, #1B6B5A 0%, #134E42 100%)',
                                            color: 'white',
                                            padding: '24px',
                                            borderRadius: '12px',
                                            marginBottom: '24px'
                                        }}>
                                            <h3 style={{ margin: '0 0 16px 0' }}>
                                                {selectedPeriod.label} 예산 집행률
                                            </h3>
                                            <div style={{
                                                height: '32px',
                                                background: 'rgba(255,255,255,0.2)',
                                                borderRadius: '16px',
                                                overflow: 'hidden',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    background: 'white',
                                                    width: `${selectedRate}%`,
                                                    transition: 'width 0.3s'
                                                }} />
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                fontSize: '16px'
                                            }}>
                                                <span>집행: {fmt(selectedUsed / 10000)}만원</span>
                                                <span>예산: {fmt(selectedPeriod.budget / 10000)}만원</span>
                                            </div>
                                            <div style={{
                                                textAlign: 'center',
                                                fontSize: '32px',
                                                fontWeight: '700',
                                                marginTop: '16px'
                                            }}>
                                                {selectedRate}%
                                            </div>
                                        </div>
                                        );
                                    })()}

                                    {/* Execution rate by project - based on actual execution records */}
                                    <h3 style={{ marginBottom: '16px' }}>사업별 집행률</h3>
                                    {(() => {
                                        // Filter executions by selected period, then sum by subcategory_id
                                        const periodRange = PERIOD_DATE_RANGES[budgetPeriod];
                                        const periodExecutions = periodRange
                                            ? data.budgetExecutions.filter(ex =>
                                                ex.execution_date >= periodRange.start && ex.execution_date <= periodRange.end)
                                            : data.budgetExecutions;
                                        const execBySubcat = {};
                                        periodExecutions.forEach(ex => {
                                            const id = ex.subcategory_id;
                                            if (!id) return;
                                            execBySubcat[id] = (execBySubcat[id] || 0) + (ex.amount || 0);
                                        });

                                        return BUDGET_DATA.categories.map(category => {
                                            const catBudget = getBudgetByPeriod(category, budgetPeriod);

                                            // Actual category execution (sum of subcategories)
                                            const catExecuted = category.subcategories.reduce((sum, sub) =>
                                                sum + (execBySubcat[sub.id] || 0), 0);
                                            const catExecRate = pct(catExecuted, catBudget);
                                            const remaining = Math.max(0, catBudget - catExecuted);

                                            return (
                                                <div key={category.id} style={{ marginBottom: '24px', background: '#FAFAF9', border: '1px solid #EBE8E1', borderRadius: '12px', padding: '16px' }}>
                                                    {/* Category header */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#134E42' }}>{category.name}</h4>
                                                        <div style={{ textAlign: 'right', fontSize: '13px' }}>
                                                            <span style={{ fontWeight: '700', color: catExecRate >= 90 ? '#DC2626' : catExecRate >= 50 ? '#D97706' : '#3B82F6', fontSize: '18px' }}>
                                                                {catExecRate}%
                                                            </span>
                                                            <div style={{ color: '#9C9690', fontSize: '12px' }}>
                                                                {fmt(catExecuted / 10000)}만 / {fmt(catBudget / 10000)}만원
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Category overall progress bar */}
                                                    <div style={{ height: '10px', background: '#E2E0DD', borderRadius: '5px', overflow: 'hidden', marginBottom: '14px' }}>
                                                        <div style={{
                                                            height: '100%',
                                                            background: catExecRate >= 90 ? '#DC2626' : catExecRate >= 50 ? '#D97706' : '#3B82F6',
                                                            width: `${catExecRate}%`,
                                                            borderRadius: '5px',
                                                            transition: 'width 0.4s'
                                                        }} />
                                                    </div>
                                                    {/* Execution rate by subcategory */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {category.subcategories.map(sub => {
                                                            const subBudget = getBudgetByPeriod(sub, budgetPeriod);
                                                            if (subBudget === 0) return null;
                                                            const subExecuted = execBySubcat[sub.id] || 0;
                                                            const subRate = pct(subExecuted, subBudget);
                                                            const subRemaining = Math.max(0, subBudget - subExecuted);
                                                            const barColor = subRate >= 90 ? '#DC2626' : subRate >= 50 ? '#D97706' : '#3B82F6';

                                                            return (
                                                                <div key={sub.id} style={{ padding: '10px 12px', background: 'white', borderRadius: '8px', border: '1px solid #F0EDE8' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                                                                        <span style={{ fontWeight: '500', color: '#2D2D2D' }}>{sub.name}</span>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <span style={{ fontWeight: '700', color: barColor }}>{subRate}%</span>
                                                                            <span style={{ color: '#9C9690', marginLeft: '8px' }}>
                                                                                {fmt(subExecuted / 10000)}만 / {fmt(subBudget / 10000)}만원
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ height: '6px', background: '#E9ECEF', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{ height: '100%', background: barColor, width: `${subRate}%`, borderRadius: '3px', transition: 'width 0.4s' }} />
                                                                    </div>
                                                                    {subExecuted > 0 && (
                                                                        <div style={{ fontSize: '11px', color: '#9C9690', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                                                            <span>집행: {fmt(subExecuted)}원</span>
                                                                            <span>잔액: {fmt(subRemaining)}원</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {/* Category remaining budget summary */}
                                                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#9C9690', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
                                                        <span>집행액: <strong style={{ color: '#134E42' }}>{fmt(catExecuted)}원</strong></span>
                                                        <span>잔액: <strong style={{ color: remaining === 0 ? '#DC2626' : '#6B6560' }}>{fmt(remaining)}원</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}

                                    {/* 최근 집행 내역 */}
                                    <div style={{ marginTop: '32px' }}>
                                        <h3 style={{ marginBottom: '16px' }}>최근 집행 내역</h3>
                                        {data.budgetExecutions.slice(0, 5).map(execution => (
                                            <div key={execution.id} className="execution-item">
                                                <div className="execution-header">
                                                    <div>
                                                        <div className="execution-title">{execution.budget_item_name}</div>
                                                        <div style={{ fontSize: '14px', color: '#6B6560' }}>
                                                            {execution.description}
                                                        </div>
                                                    </div>
                                                    <div className="execution-amount">
                                                        {execution.amount?.toLocaleString()}원
                                                    </div>
                                                </div>
                                                <div className="execution-meta">
                                                    <span>📅 {execution.execution_date}</span>
                                                    <span>💳 {execution.payment_method}</span>
                                                    <span>🏷️ {execution.category_name}</span>
                                                </div>
                                            </div>
                                        ))}
                                        {data.budgetExecutions.length === 0 && (
                                            <div style={{ textAlign: 'center', color: '#9C9690', padding: '40px' }}>
                                                등록된 집행 내역이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* === 예산편성표 탭 === */}
                            {budgetTab === 'breakdown' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
                                            📋 예산편성표
                                        </h2>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {Object.entries(BUDGET_DATA.periods).map(([key, p]) => (
                                                <button
                                                    key={key}
                                                    className={`btn ${budgetPeriod === key ? 'btn-primary' : 'btn-secondary'}`}
                                                    onClick={() => setBudgetPeriod(key)}
                                                    style={{ fontSize: '12px', padding: '6px 14px' }}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 시기 비교 요약 */}
                                    <div style={{ overflowX: 'auto', marginBottom: '24px' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ background: '#134E42', color: 'white' }}>
                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>구분</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>전체 예산</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>상반기</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>하반기</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>상반기 비중</th>
                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>하반기 비중</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {BUDGET_DATA.categories.map(cat => (
                                                    <React.Fragment key={cat.id}>
                                                        <tr style={{ background: '#E8F5E9', fontWeight: '700' }}>
                                                            <td style={{ padding: '10px 12px' }}>{cat.name}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{cat.budget.toLocaleString()}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{cat.h1.toLocaleString()}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{cat.h2.toLocaleString()}</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Math.round(cat.h1 / cat.budget * 100)}%</td>
                                                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Math.round(cat.h2 / cat.budget * 100)}%</td>
                                                        </tr>
                                                        {cat.subcategories.map(sub => (
                                                            <tr key={sub.id} style={{ borderBottom: '1px solid #E2E0DD' }}>
                                                                <td style={{ padding: '8px 12px', paddingLeft: '28px', color: '#4A4540' }}>{sub.name}</td>
                                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{sub.budget.toLocaleString()}</td>
                                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{sub.h1.toLocaleString()}</td>
                                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{sub.h2.toLocaleString()}</td>
                                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{sub.budget > 0 ? Math.round(sub.h1 / sub.budget * 100) : 0}%</td>
                                                                <td style={{ padding: '8px 12px', textAlign: 'right' }}>{sub.budget > 0 ? Math.round(sub.h2 / sub.budget * 100) : 0}%</td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                ))}
                                                <tr style={{ background: '#134E42', color: 'white', fontWeight: '700' }}>
                                                    <td style={{ padding: '10px 12px' }}>합계</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{BUDGET_DATA.totalBudget.toLocaleString()}</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{BUDGET_DATA.periods.h1.budget.toLocaleString()}</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{BUDGET_DATA.periods.h2.budget.toLocaleString()}</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Math.round(BUDGET_DATA.periods.h1.budget / BUDGET_DATA.totalBudget * 100)}%</td>
                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{Math.round(BUDGET_DATA.periods.h2.budget / BUDGET_DATA.totalBudget * 100)}%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 선택 시기 상세 편성표 */}
                                    <h3 style={{ marginBottom: '16px' }}>
                                        {BUDGET_DATA.periods[budgetPeriod].label} 상세 편성표
                                        <span style={{ fontSize: '14px', fontWeight: '400', color: '#6B6560', marginLeft: '12px' }}>
                                            총 {BUDGET_DATA.periods[budgetPeriod].budget.toLocaleString()}원
                                        </span>
                                    </h3>

                                    {BUDGET_DATA.categories.map(category => {
                                        const catBudget = getBudgetByPeriod(category, budgetPeriod);
                                        return (
                                            <div key={category.id} style={{ marginBottom: '28px' }}>
                                                <div style={{
                                                    background: category.id === 'project-costs' ? '#1B6B5A' : '#2B6CB0',
                                                    color: 'white',
                                                    padding: '12px 16px',
                                                    borderRadius: '8px 8px 0 0',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: '600'
                                                }}>
                                                    <span>{category.name}</span>
                                                    <span>{catBudget.toLocaleString()}원</span>
                                                </div>

                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead>
                                                            <tr style={{ background: '#F8F9FA' }}>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #E2E0DD' }}>단위사업</th>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #E2E0DD' }}>항목명</th>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #E2E0DD' }}>계정</th>
                                                                <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '2px solid #E2E0DD' }}>예산액</th>
                                                                <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #E2E0DD' }}>산출근거</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {category.subcategories.map(sub => {
                                                                const subBudget = getBudgetByPeriod(sub, budgetPeriod);
                                                                if (subBudget === 0) return null;
                                                                const items = sub.items.filter(item => getBudgetByPeriod(item, budgetPeriod) > 0);
                                                                return (
                                                                    <React.Fragment key={sub.id}>
                                                                        {items.map((item, idx) => (
                                                                            <tr key={item.id} style={{ borderBottom: '1px solid #F0EFED' }}>
                                                                                {idx === 0 && (
                                                                                    <td rowSpan={items.length} style={{
                                                                                        padding: '8px 12px',
                                                                                        fontWeight: '600',
                                                                                        verticalAlign: 'top',
                                                                                        borderRight: '1px solid #E2E0DD',
                                                                                        background: '#FAFAF8'
                                                                                    }}>
                                                                                        {sub.name}
                                                                                    </td>
                                                                                )}
                                                                                <td style={{ padding: '8px 12px' }}>{item.name}</td>
                                                                                <td style={{ padding: '8px 12px' }}>
                                                                                    <span style={{
                                                                                        display: 'inline-block',
                                                                                        padding: '2px 8px',
                                                                                        borderRadius: '4px',
                                                                                        fontSize: '11px',
                                                                                        background: {
                                                                                            '사업인건비': '#FFF5F5', '사업회의비': '#EBF8FF', '지급수수료': '#FAF5FF',
                                                                                            '여비교통비': '#FFFAF0', '물품구매비': '#F0FFF4', '예비비': '#F7FAFC',
                                                                                            '운영인건비': '#FFF5F7', '임차료': '#F0FFFF', '일반관리비': '#FFFFF0',
                                                                                            '교육훈련비': '#FFF8F1', '홍보비': '#F5F0FF'
                                                                                        }[item.type] || '#F7FAFC',
                                                                                        color: {
                                                                                            '사업인건비': '#C53030', '사업회의비': '#2B6CB0', '지급수수료': '#6B46C1',
                                                                                            '여비교통비': '#C05621', '물품구매비': '#276749', '예비비': '#4A5568',
                                                                                            '운영인건비': '#B83280', '임차료': '#0E7490', '일반관리비': '#92400E',
                                                                                            '교육훈련비': '#C2410C', '홍보비': '#553C9A'
                                                                                        }[item.type] || '#4A5568'
                                                                                    }}>
                                                                                        {item.type}
                                                                                    </span>
                                                                                </td>
                                                                                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '600', fontVariantNumeric: 'tabular-nums' }}>
                                                                                    {getBudgetByPeriod(item, budgetPeriod).toLocaleString()}
                                                                                </td>
                                                                                <td style={{ padding: '8px 12px', fontSize: '12px', color: '#6B6560' }}>
                                                                                    {budgetPeriod === 'h1' ? (item.h1detail || item.detail) : budgetPeriod === 'h2' ? (item.h2detail || item.detail) : item.detail}
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                        <tr style={{ background: '#F8F9FA', fontWeight: '600', borderBottom: '2px solid #E2E0DD' }}>
                                                                            <td colSpan={3} style={{ padding: '6px 12px', textAlign: 'right', fontSize: '12px' }}>{sub.name} 소계</td>
                                                                            <td style={{ padding: '6px 12px', textAlign: 'right' }}>{subBudget.toLocaleString()}</td>
                                                                            <td></td>
                                                                        </tr>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                            <tr style={{ background: category.id === 'project-costs' ? '#E8F5E9' : '#EBF8FF', fontWeight: '700' }}>
                                                                <td colSpan={3} style={{ padding: '10px 12px', textAlign: 'right' }}>{category.name} 합계</td>
                                                                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: '15px' }}>{catBudget.toLocaleString()}</td>
                                                                <td></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* 총 합계 */}
                                    <div style={{
                                        background: 'linear-gradient(135deg, #1B6B5A 0%, #134E42 100%)',
                                        color: 'white',
                                        padding: '20px 24px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '18px',
                                        fontWeight: '700'
                                    }}>
                                        <span>{BUDGET_DATA.periods[budgetPeriod].label} 총계</span>
                                        <span style={{ fontSize: '24px' }}>{BUDGET_DATA.periods[budgetPeriod].budget.toLocaleString()}원</span>
                                    </div>
                                </div>
                            )}

                            {budgetTab === 'register' && (
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
                                        📝 예산 집행 등록
                                    </h2>

                                    <div className="form-grid">
                                        <div className="form-group">
                                            <label>예산 분류</label>
                                            <select
                                                value={formData.subcategory_id}
                                                onChange={(e) => {
                                                    const subcategory = subcategories.find(s => s.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        subcategory_id: e.target.value,
                                                        subcategory_name: subcategory?.name || '',
                                                        category_name: subcategory?.categoryName || '',
                                                        budget_item_id: '',
                                                        budget_item_name: '',
                                                        type: ''
                                                    });
                                                }}
                                            >
                                                <option value="">분류 선택</option>
                                                {subcategories.map(subcategory => (
                                                    <option key={subcategory.id} value={subcategory.id}>
                                                        {subcategory.categoryName} {'>'} {subcategory.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>예산 항목</label>
                                            <select
                                                value={formData.budget_item_id}
                                                onChange={(e) => {
                                                    const item = selectedBudgetItems.find(i => i.id === e.target.value);
                                                    setFormData({
                                                        ...formData,
                                                        budget_item_id: e.target.value,
                                                        budget_item_name: item?.name || '',
                                                        type: item?.type || ''
                                                    });
                                                }}
                                                disabled={!formData.subcategory_id}
                                            >
                                                <option value="">항목 선택</option>
                                                {selectedBudgetItems.map(item => (
                                                    <option key={item.id} value={item.id}>
                                                        {item.name} ({item.type})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>집행 금액</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="금액 입력"
                                                value={fmtInput(formData.amount)}
                                                onChange={(e) => setFormData({...formData, amount: parseInput(e.target.value)})}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>결제 방법</label>
                                            <select
                                                value={formData.payment_method}
                                                onChange={(e) => setFormData({...formData, payment_method: e.target.value})}
                                            >
                                                <option value="">결제 방법 선택</option>
                                                <option value="카드">카드</option>
                                                <option value="계좌이체">계좌이체</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>집행일</label>
                                            <input
                                                type="date"
                                                value={formData.execution_date}
                                                onChange={(e) => setFormData({...formData, execution_date: e.target.value})}
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>수취인</label>
                                            <input
                                                type="text"
                                                placeholder="수취인 입력 또는 목록에서 선택"
                                                value={formData.recipient}
                                                onChange={(e) => setFormData({...formData, recipient: e.target.value})}
                                                list="recipient-datalist"
                                            />
                                            <datalist id="recipient-datalist">
                                                {recipients.map(r => <option key={r.id} value={r.name} />)}
                                            </datalist>
                                            {recipients.length > 0 && (
                                                <span style={{ fontSize: '12px', color: '#9C9690' }}>
                                                    등록된 수급자 선택 시 급여지급명세서에 정보가 자동 채워집니다.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group" style={{ marginTop: '24px' }}>
                                        <label>집행 내용</label>
                                        <textarea
                                            rows="3"
                                            placeholder="집행 내용 상세 설명"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        />
                                    </div>

                                    {/* 필요 서류 첨부 */}
                                    {formData.type && formData.payment_method && (
                                        <div style={{
                                            background: '#F8F9FA',
                                            border: '1px solid #E2E8F0',
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginTop: '24px'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px' }}>
                                                📄 필요 증빙서류
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {getRequiredDocuments(formData.type, formData.payment_method).map((doc, index) => {
                                                    const attachedFile = formDocFiles[doc];
                                                    return (
                                                        <div key={index} style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '6px 10px',
                                                            background: '#fff',
                                                            border: '1px solid #E2E8F0',
                                                            borderRadius: '6px',
                                                            fontSize: '14px'
                                                        }}>
                                                            <span>📄 {doc}</span>
                                                            {attachedFile ? (
                                                                <span style={{ color: '#1B6B5A', fontSize: '12px', fontWeight: '500' }}>
                                                                    ✅ {attachedFile.name}
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-secondary"
                                                                    style={{ fontSize: '12px', padding: '3px 10px' }}
                                                                    onClick={() => {
                                                                        activeFormDocNameRef.current = doc;
                                                                        formDocFileInputRef.current?.click();
                                                                    }}
                                                                >
                                                                    📎 첨부하기
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {DOCUMENT_RULES[formData.type]?.notes && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    padding: '8px',
                                                    background: 'rgba(27, 107, 90, 0.1)',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    whiteSpace: 'pre-line'
                                                }}>
                                                    💡 {DOCUMENT_RULES[formData.type].notes}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 등록 폼 서류 첨부용 hidden file input */}
                                    <input
                                        ref={formDocFileInputRef}
                                        type="file"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            e.target.value = '';
                                            const docName = activeFormDocNameRef.current;
                                            activeFormDocNameRef.current = null;
                                            if (!file || !docName) return;
                                            setFormDocFiles(prev => ({ ...prev, [docName]: file }));
                                        }}
                                    />

                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginTop: '24px'
                                    }}>
                                        <button
                                            className="btn btn-primary"
                                            onClick={async () => {
                                                try {
                                                    console.log('📝 예산 집행 등록 시작...');

                                                    // 필수 필드 검증
                                                    if (!formData.subcategory_id || !formData.budget_item_id || !formData.description || !formData.amount || !formData.payment_method) {
                                                        alert('필수 필드를 모두 입력해주세요. (결제 방법 포함)');
                                                        return;
                                                    }

                                                    // 삽입할 데이터 준비
                                                    const insertData = {
                                                        subcategory_id: formData.subcategory_id,
                                                        subcategory_name: formData.subcategory_name,
                                                        category_name: formData.category_name,
                                                        budget_item_id: formData.budget_item_id,
                                                        budget_item_name: formData.budget_item_name,
                                                        type: formData.type,
                                                        description: formData.description,
                                                        amount: parseInt(formData.amount),
                                                        payment_method: formData.payment_method,
                                                        execution_date: formData.execution_date,
                                                        recipient: formData.recipient,
                                                        status: 'pending',
                                                        created_by: '00000000-0000-0000-0000-000000000001'
                                                    };

                                                    console.log('📊 삽입할 데이터:', insertData);

                                                    // 데이터베이스에 저장
                                                    const { data: inserted, error } = await supabase
                                                        .from('budget_executions')
                                                        .insert([insertData])
                                                        .select()
                                                        .single();

                                                    console.log('📊 Supabase INSERT 응답:', { data: inserted, error });

                                                    if (error) {
                                                        console.error('❌ 예산 집행 등록 오류:', error);
                                                        console.error('❌ 오류 상세:', error.message, error.details, error.hint);
                                                        console.error('❌ 전체 오류 객체:', JSON.stringify(error, null, 2));

                                                        if (error.message && error.message.includes('row-level security')) {
                                                            alert('예산 집행 등록 중 오류가 발생했습니다: RLS 정책 오류 - Supabase 대시보드에서 SQL 스키마를 다시 실행해주세요.');
                                                        } else {
                                                            alert('예산 집행 등록 중 오류가 발생했습니다: ' + error.message);
                                                        }
                                                        return;
                                                    }

                                                    // 서류 첨부파일 병렬 업로드
                                                    const docEntries = Object.entries(formDocFiles);
                                                    if (inserted?.id && docEntries.length > 0) {
                                                        const baseTs = Date.now();
                                                        const uploadResults = await Promise.allSettled(
                                                            docEntries.map(async ([docName, file], i) => {
                                                                const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
                                                                const filePath = `execution/${inserted.id}/${baseTs}_${i}_${safeName}`;
                                                                const { data: storageData, error: storageError } = await supabase.storage
                                                                    .from('attachments').upload(filePath, file);
                                                                if (storageError) throw storageError;
                                                                return {
                                                                    execution_id: inserted.id,
                                                                    document_name: docName,
                                                                    document_type: 'required',
                                                                    file_path: storageData?.path || filePath,
                                                                    file_name: file.name,
                                                                    file_size: file.size,
                                                                    uploaded_by: currentUser.id
                                                                };
                                                            })
                                                        );
                                                        const docsToInsert = uploadResults
                                                            .filter(r => r.status === 'fulfilled')
                                                            .map(r => r.value);
                                                        if (docsToInsert.length > 0) {
                                                            await supabase.from('documents').insert(docsToInsert);
                                                        }
                                                        const failed = uploadResults
                                                            .map((r, i) => r.status === 'rejected' ? docEntries[i][0] : null)
                                                            .filter(Boolean);
                                                        if (failed.length > 0) {
                                                            console.error('서류 첨부 실패:', failed);
                                                            alert(`⚠️ 일부 서류 첨부 실패:\n${failed.join('\n')}\n\n집행내역은 등록되었으니 나중에 다시 첨부해주세요.`);
                                                        }
                                                    }

                                                    alert('예산 집행이 성공적으로 등록되었습니다.');

                                                    // 폼 초기화
                                                    setFormData({
                                                        subcategory_id: '',
                                                        subcategory_name: '',
                                                        category_name: '',
                                                        budget_item_id: '',
                                                        budget_item_name: '',
                                                        type: '',
                                                        description: '',
                                                        amount: '',
                                                        payment_method: '',
                                                        execution_date: new Date().toISOString().split('T')[0],
                                                        recipient: ''
                                                    });
                                                    setFormDocFiles({});
                                                    activeFormDocNameRef.current = null;
                                                    // 데이터 새로고침
                                                    await refreshExecutions();

                                                } catch (error) {
                                                    console.error('예산 집행 등록 오류:', error);
                                                    alert('예산 집행 등록 중 오류가 발생했습니다.');
                                                }
                                            }}
                                        >
                                            💾 등록하기
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={() => {
                                                setFormData({
                                                    subcategory_id: '',
                                                    subcategory_name: '',
                                                    category_name: '',
                                                    budget_item_id: '',
                                                    budget_item_name: '',
                                                    type: '',
                                                    description: '',
                                                    amount: '',
                                                    payment_method: '',
                                                    execution_date: new Date().toISOString().split('T')[0],
                                                    recipient: ''
                                                });
                                                setFormDocFiles({});
                                                activeFormDocNameRef.current = null;
                                            }}
                                        >
                                            🔄 초기화
                                        </button>
                                    </div>
                                </div>
                            )}

                            {budgetTab === 'calculator' && (
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                                        🧮 원천징수세 계산기
                                    </h2>
                                    <p style={{ fontSize: '14px', color: '#6B6560', marginBottom: '20px' }}>
                                        기타소득(강사료, 단순인건비, 회의수당 등) 지급 시 원천징수 자동 계산
                                    </p>

                                    {/* 모드 전환 */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                        <button
                                            className={`btn ${calcMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setCalcMode('single')}
                                            style={{ fontSize: '13px', padding: '8px 16px' }}
                                        >
                                            1인 계산
                                        </button>
                                        <button
                                            className={`btn ${calcMode === 'multi' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => setCalcMode('multi')}
                                            style={{ fontSize: '13px', padding: '8px 16px' }}
                                        >
                                            다인 일괄계산
                                        </button>
                                    </div>

                                    {/* 소득유형 선택 */}
                                    <div className="form-group" style={{ marginBottom: '16px', maxWidth: '500px' }}>
                                        <label>소득 유형</label>
                                        <select
                                            value={calcIncomeType}
                                            onChange={(e) => setCalcIncomeType(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E0DD', fontSize: '14px' }}
                                        >
                                            {Object.entries(INCOME_TYPE_INFO).map(([key, info]) => (
                                                <option key={key} value={key}>{info.label}</option>
                                            ))}
                                        </select>
                                        <p style={{ fontSize: '13px', color: '#9C9690', marginTop: '4px' }}>
                                            {INCOME_TYPE_INFO[calcIncomeType].desc}
                                        </p>
                                    </div>

                                    {/* === 1인 계산 모드 === */}
                                    {calcMode === 'single' && (
                                        <div>
                                            <div className="form-grid" style={{ maxWidth: '500px' }}>
                                                <div className="form-group">
                                                    <label>지급 금액 (원)</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        placeholder="금액 입력 (예: 210,000)"
                                                        value={fmtInput(calculatorAmount)}
                                                        onChange={(e) => setCalculatorAmount(parseInput(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => {
                                                        if (calculatorAmount) {
                                                            const result = calculateWithholdingTax(parseInt(calculatorAmount));
                                                            setCalculationResult(result);
                                                        }
                                                    }}
                                                >
                                                    📊 계산하기
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setCalculatorAmount('');
                                                        setCalculationResult(null);
                                                    }}
                                                >
                                                    🔄 초기화
                                                </button>
                                            </div>

                                            {calculationResult && (
                                                <div className="calculation-result">
                                                    <h3 style={{ margin: '0 0 16px 0' }}>계산 결과</h3>
                                                    <div className="result-item">
                                                        <span>지급 금액:</span>
                                                        <span>{parseInt(calculatorAmount).toLocaleString()}원</span>
                                                    </div>
                                                    {!calculationResult.taxable ? (
                                                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.15)', borderRadius: '8px', marginTop: '8px', textAlign: 'center' }}>
                                                            ✅ 125,000원 이하 → <strong>원천징수 없음</strong> (전액 지급)
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="result-item">
                                                                <span>소득세 (국세 8%):</span>
                                                                <span>{calculationResult.income.toLocaleString()}원</span>
                                                            </div>
                                                            <div className="result-item" style={{ fontSize: '13px', opacity: 0.8, marginTop: '-4px', marginBottom: '12px' }}>
                                                                <span style={{ paddingLeft: '12px' }}>= {parseInt(calculatorAmount).toLocaleString()} × 0.08 → 원단위 절사</span>
                                                            </div>
                                                            <div className="result-item">
                                                                <span>지방소득세 (국세의 10%):</span>
                                                                <span>{calculationResult.local.toLocaleString()}원</span>
                                                            </div>
                                                            <div className="result-item" style={{ fontSize: '13px', opacity: 0.8, marginTop: '-4px', marginBottom: '12px' }}>
                                                                <span style={{ paddingLeft: '12px' }}>= {calculationResult.income.toLocaleString()} × 0.1 → 원단위 절사</span>
                                                            </div>
                                                            <div className="result-item">
                                                                <span>총 원천징수세:</span>
                                                                <span>{calculationResult.total.toLocaleString()}원</span>
                                                            </div>
                                                            <div className="result-item">
                                                                <span>실수령액:</span>
                                                                <span>{calculationResult.net.toLocaleString()}원</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* === 다인 일괄계산 모드 === */}
                                    {calcMode === 'multi' && (
                                        <div>
                                            <p style={{ fontSize: '13px', color: '#9C9690', marginBottom: '12px' }}>
                                                여러 명에게 지급할 때 개인별로 국세/지방세를 따로 계산해야 원단위 절사 차이가 발생하지 않습니다.
                                            </p>
                                            <div style={{ maxWidth: '600px' }}>
                                                {calcPersons.map((person, idx) => (
                                                    <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '13px', color: '#9C9690', minWidth: '24px' }}>{idx + 1}</span>
                                                        <input
                                                            type="text"
                                                            placeholder="이름"
                                                            value={person.name}
                                                            onChange={(e) => {
                                                                const updated = [...calcPersons];
                                                                updated[idx].name = e.target.value;
                                                                setCalcPersons(updated);
                                                            }}
                                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E0DD', fontSize: '14px' }}
                                                        />
                                                        <input
                                                            type="text"
                                                            inputMode="numeric"
                                                            placeholder="지급금액 (원)"
                                                            value={fmtInput(person.amount)}
                                                            onChange={(e) => {
                                                                const updated = [...calcPersons];
                                                                updated[idx].amount = parseInput(e.target.value);
                                                                setCalcPersons(updated);
                                                            }}
                                                            style={{ flex: 1.5, padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E0DD', fontSize: '14px' }}
                                                        />
                                                        {calcPersons.length > 1 && (
                                                            <button
                                                                onClick={() => setCalcPersons(calcPersons.filter((_, i) => i !== idx))}
                                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#E53E3E', padding: '4px' }}
                                                            >×</button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => setCalcPersons([...calcPersons, { name: '', amount: '' }])}
                                                    style={{ fontSize: '13px', padding: '6px 14px', marginTop: '4px' }}
                                                >
                                                    + 추가
                                                </button>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                                <button className="btn btn-primary" onClick={calculateMultiPersonTax}>
                                                    📊 일괄 계산
                                                </button>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setCalcPersons([{ name: '', amount: '' }]);
                                                        setCalcMultiResults(null);
                                                    }}
                                                >
                                                    🔄 초기화
                                                </button>
                                            </div>

                                            {calcMultiResults && (
                                                <div style={{ marginTop: '16px' }}>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                                            <thead>
                                                                <tr style={{ background: '#1B6B5A', color: 'white' }}>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>이름</th>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>지급액</th>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>소득세(국세)</th>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>지방세</th>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>공제합계</th>
                                                                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>실지급액</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {calcMultiResults.persons.map((p, i) => (
                                                                    <tr key={i} style={{ borderBottom: '1px solid #E2E0DD', background: p.taxable ? 'white' : '#F0FFF4' }}>
                                                                        <td style={{ padding: '10px 12px' }}>{p.name}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p.amount.toLocaleString()}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p.income.toLocaleString()}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>{p.local.toLocaleString()}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>{p.total.toLocaleString()}</td>
                                                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>{p.net.toLocaleString()}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr style={{ background: '#134E42', color: 'white', fontWeight: '700' }}>
                                                                    <td style={{ padding: '10px 12px' }}>합계</td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{calcMultiResults.summary.totalAmount.toLocaleString()}</td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{calcMultiResults.summary.totalIncome.toLocaleString()}</td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{calcMultiResults.summary.totalLocal.toLocaleString()}</td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{calcMultiResults.summary.totalTax.toLocaleString()}</td>
                                                                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>{calcMultiResults.summary.totalNet.toLocaleString()}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <p style={{ fontSize: '12px', color: '#9C9690', marginTop: '8px' }}>
                                                        * 국세와 지방세를 인원별로 따로 계산 후 원단위 절사 적용. 총액 일괄 계산(8.8%) 시 금액 차이가 발생할 수 있습니다.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 선택한 소득유형별 필요서류 */}
                                    <div style={{ marginTop: '28px', padding: '20px', background: '#FFFBF0', borderRadius: '12px', border: '1px solid #F0E6D0' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#8B6914' }}>
                                            📋 {INCOME_TYPE_INFO[calcIncomeType].label} - 필요 증빙서류
                                        </h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {INCOME_TYPE_INFO[calcIncomeType].docs.map((doc, i) => (
                                                <div key={i} style={{ fontSize: '13px', color: '#5C4A1E', paddingLeft: '8px' }}>
                                                    {i + 1}. {doc}
                                                </div>
                                            ))}
                                        </div>
                                        {INCOME_TYPE_INFO[calcIncomeType].rules && (
                                            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #F0E6D0' }}>
                                                <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#8B6914' }}>⚠️ 지급 시 주의사항</h4>
                                                {INCOME_TYPE_INFO[calcIncomeType].rules.map((rule, i) => (
                                                    <div key={i} style={{ fontSize: '13px', color: '#5C4A1E', paddingLeft: '8px', marginBottom: '4px' }}>
                                                        • {rule}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 원천징수 해설 */}
                                    <div style={{ marginTop: '20px', padding: '20px', background: '#F8F9FA', borderRadius: '12px' }}>
                                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>📖 원천징수란?</h4>

                                        <div style={{ fontSize: '14px', color: '#4A4540', lineHeight: '1.7' }}>
                                            <p style={{ marginBottom: '12px' }}>
                                                <strong>원천징수(源泉徵收)</strong>란 소득을 지급하는 자(원천징수의무자)가,
                                                소득을 받는 사람이 내야 할 세금을 <strong>미리 떼어서 대신 납부</strong>하는 제도입니다.
                                            </p>
                                            <p style={{ marginBottom: '12px' }}>
                                                <strong>원천세</strong> = 소득세(국세) + 지방소득세 특별징수분(지방세)
                                            </p>

                                            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E0DD' }}>
                                                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🔢 계산 방법</h5>
                                                <div style={{ fontSize: '13px' }}>
                                                    <p>① 과세 여부 판단: 건당 지급액이 <strong>125,000원 초과</strong>인지 확인</p>
                                                    <p>② 국세(소득세): 지급액 × <strong>8%</strong> → 원단위 절사(버림)</p>
                                                    <p>③ 지방세: 국세 × <strong>10%</strong> → 원단위 절사(버림)</p>
                                                    <p>④ 실지급액 = 지급액 - 국세 - 지방세</p>
                                                </div>
                                            </div>

                                            <div style={{ background: '#FFF5F5', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #FED7D7' }}>
                                                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#C53030' }}>⚠️ 실무 주의사항 (원단위 절사)</h5>
                                                <p style={{ fontSize: '13px', color: '#742A2A' }}>
                                                    세액 계산 시 1원 단위까지 나올 경우 <strong>원단위는 절사(버림)</strong>합니다.
                                                    인원이 많을 경우 총액 일괄계산(8.8%)은 피하고, <strong>반드시 개인별로 국세/지방세를 따로 계산</strong>한 뒤 합산하세요.
                                                    개별 계산 결과와 일괄 계산 결과가 달라질 수 있습니다.
                                                </p>
                                            </div>

                                            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E0DD' }}>
                                                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>💡 계산 예시: 강사료 210,000원</h5>
                                                <div style={{ fontSize: '13px', fontFamily: 'monospace', lineHeight: '2' }}>
                                                    <p>국세 = 210,000 × 0.08 = <strong>16,800원</strong></p>
                                                    <p>지방세 = 16,800 × 0.1 = <strong>1,680원</strong></p>
                                                    <p>원천징수액 = 16,800 + 1,680 = <strong>18,480원</strong></p>
                                                    <p>실지급액 = 210,000 - 18,480 = <strong>191,520원</strong></p>
                                                </div>
                                            </div>

                                            <div style={{ background: 'white', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #E2E0DD' }}>
                                                <h5 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>📌 기타소득이란?</h5>
                                                <p style={{ fontSize: '13px' }}>
                                                    이자·배당·사업·근로소득 등에 해당하지 않는, <strong>일시적·불규칙적으로 발생하는 소득</strong>을 말합니다.
                                                    보조사업에서는 <strong>강사료, 원고료, 단순인건비</strong> 등이 해당합니다.
                                                </p>
                                                <p style={{ fontSize: '13px', marginTop: '4px' }}>
                                                    사업자등록증이나 고유번호증이 없는 개인명의(주민번호)로도 신고할 수 있습니다.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 신고/납부 안내 */}
                                    <div style={{ marginTop: '20px', padding: '20px', background: '#EBF8FF', borderRadius: '12px', border: '1px solid #BEE3F8' }}>
                                        <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#2B6CB0' }}>🏛️ 신고 · 납부 안내</h4>
                                        <div style={{ fontSize: '13px', color: '#2A4365', lineHeight: '1.8' }}>

                                            <div style={{ marginBottom: '16px' }}>
                                                <strong>📅 신고/납부 기한</strong>
                                                <p>지급한 달의 <strong>다음 달 10일</strong>까지 관할 세무서에 신고·납부</p>
                                                <p style={{ paddingLeft: '12px', color: '#4A5568' }}>예) 7월 31일 지급 → 8월 10일까지 / 8월 1일 지급 → 9월 10일까지</p>
                                            </div>

                                            <div style={{ marginBottom: '16px' }}>
                                                <strong>🖥️ 신고 방법 (택1)</strong>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginTop: '8px', background: 'white' }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ padding: '8px', border: '1px solid #BEE3F8', textAlign: 'left' }}></th>
                                                            <th style={{ padding: '8px', border: '1px solid #BEE3F8', textAlign: 'left' }}>세무서 방문</th>
                                                            <th style={{ padding: '8px', border: '1px solid #BEE3F8', textAlign: 'left' }}>인터넷 (홈택스+위택스)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8', fontWeight: '600' }}>장점</td>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8' }}>1:1 상담 가능, 공인인증서 불필요, 국세 신고 시 지방세도 함께 처리</td>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8' }}>익숙해지면 간편, 신고~납부까지 한 번에 처리 가능</td>
                                                        </tr>
                                                        <tr>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8', fontWeight: '600' }}>단점</td>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8' }}>매월 방문 번거로움, 납부는 은행 창구에서 별도 처리</td>
                                                            <td style={{ padding: '8px', border: '1px solid #BEE3F8' }}>공인인증서 필수, 국세(홈택스)·지방세(위택스) 따로 신고</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div style={{ marginBottom: '16px' }}>
                                                <strong>💡 실무 팁</strong>
                                                <p>• 월말이나 다음 달 초에 <strong>한꺼번에 신고/납부</strong>하는 것이 효율적 (위택스는 최종 신고/납부만 인정)</p>
                                                <p>• 인터넷 납부 시 <strong>신고자와 결제 계좌 예금주가 동일</strong>해야 함</p>
                                                <p>• 카드 납부 시 수수료 추가 발생 (신용 0.8%, 체크 0.7%) → <strong>계좌이체 추천</strong></p>
                                                <p>• 신고확인서와 납부영수증은 <strong>증빙자료에 반드시 첨부</strong></p>
                                            </div>

                                            <div style={{ background: '#FFF5F5', padding: '12px', borderRadius: '8px', border: '1px solid #FED7D7' }}>
                                                <strong style={{ color: '#C53030' }}>📌 기타소득지급명세서 (연 1회)</strong>
                                                <p style={{ color: '#742A2A' }}>
                                                    기타소득을 지급한 자는 <strong>다음 연도 2월 말까지</strong> 1년간의 기타소득 지급명세서를 국세청에 제출해야 합니다.
                                                    미제출 시 <strong>미제출금액의 2% 가산세</strong> 부과 (3개월 내 지연제출 시 1%).
                                                </p>
                                                <p style={{ color: '#742A2A', marginTop: '4px' }}>
                                                    → 수령자의 <strong>주민등록번호가 필요</strong>하므로, 지급 시 확인서에 주민번호를 함께 기재하도록 합니다.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 원천징수 기본 기준 요약 */}
                                    <div style={{ marginTop: '20px', padding: '20px', background: '#F0FFF4', borderRadius: '12px', border: '1px solid #C6F6D5' }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#276749' }}>✅ 원천징수 기준 요약</h4>
                                        <div style={{ fontSize: '13px', color: '#22543D', lineHeight: '1.8' }}>
                                            <p>• <strong>과세 기준</strong>: 건당 기타소득 125,000원 초과 시 원천징수 (소득세법 제21조, 제84조, 제127조, 제129조)</p>
                                            <p>• <strong>세율</strong>: 소득세(국세) 8% + 지방소득세 국세의 10% = 실효세율 약 8.8%</p>
                                            <p>• <strong>적용 대상</strong>: 강사료, 원고료, 단순인건비, 회의참석수당, 심사비, 토론비, 발제비, 자문비 등</p>
                                            <p>• <strong>원천징수의무자</strong>: 기타소득을 지급하는 단체(대표자) 또는 사업진행자</p>
                                            <p>• <strong>지급 원칙</strong>: 금액 불문 계좌이체 원칙 (현금지급 불가)</p>
                                            <p>• <strong>내부자 지급 불가</strong>: 단체 대표, 상근직원, 사업담당자, 임직원에게는 인건비성 경비 지급 불가</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {budgetTab === 'history' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                                        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>
                                            📋 예산 집행 내역
                                        </h2>
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            {executionMsg && <span style={{ fontSize: '12px', color: executionMsg.includes('오류') ? '#dc3545' : '#28a745' }}>{executionMsg}</span>}
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={handleExportExcel}
                                            >📊 Excel 내보내기</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => { const pw = window.open('', '_blank'); pw.document.write(getSettlementReportHTML()); pw.document.close(); pw.print(); }}
                                            >📄 정산보고서</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => generatePDF(getSettlementReportHTML(), `정산보고서_${formatLocalDate()}.pdf`)}
                                            >📥 PDF</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => {
                                                    const execs = data?.budgetExecutions || [];
                                                    const totalSpent = execs.reduce((s, e) => s + (e.amount || 0), 0);
                                                    downloadHWPX('정산보고서', [
                                                        { type: 'paragraph', text: '아름다운재단 2026 공익단체 인큐베이팅 지원사업 정산보고서' },
                                                        { type: 'paragraph', text: `청년노동자인권센터 • ${new Date().toLocaleDateString('ko-KR')}` },
                                                        { type: 'paragraph', text: `총 예산: ${fmt(CONFIG.TOTAL_BUDGET)}원 | 총 집행: ${fmt(totalSpent)}원 | 집행률: ${pct(totalSpent, CONFIG.TOTAL_BUDGET)}% | 잔여: ${fmt(CONFIG.TOTAL_BUDGET - totalSpent)}원` },
                                                        { type: 'table', headers: ['집행일', '카테고리', '소분류', '항목', '금액', '결제방법', '수취인', '상태'],
                                                          rows: execs.map(e => [e.execution_date||'', e.category_name||'', e.subcategory_name||'', e.budget_item_name||'', fmt(e.amount||0)+'원', e.payment_method||'', e.recipient||'', EXECUTION_STATUS[e.status]?.label||e.status||'']) },
                                                        { type: 'paragraph', text: `합계: ${fmt(totalSpent)}원` }
                                                    ], `정산보고서_${formatLocalDate()}.hwpx`, 'report');
                                                }}
                                            >📄 한글</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => { const pw = window.open('', '_blank', 'width=900,height=700'); pw.document.write(getMonthlyReportHTML()); pw.document.close(); pw.print(); }}
                                            >📋 월별 명세서</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => generatePDF(getMonthlyReportHTML(), `월별명세서_${formatLocalDate()}.pdf`)}
                                            >📥 PDF</button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}
                                                onClick={() => {
                                                    const execs = data?.budgetExecutions || [];
                                                    const monthly = {};
                                                    execs.forEach(e => { const m = (e.execution_date || '').slice(0, 7) || '미기재'; if (!monthly[m]) monthly[m] = []; monthly[m].push(e); });
                                                    const secs = [{ type: 'paragraph', text: '월별 집행 명세서' }, { type: 'paragraph', text: `청년노동자인권센터 • ${new Date().toLocaleDateString('ko-KR')}` }];
                                                    Object.keys(monthly).sort().forEach(m => {
                                                        const items = monthly[m]; const sum = items.reduce((s, e) => s + (e.amount || 0), 0);
                                                        secs.push({ type: 'paragraph', text: `${m.replace('-', '년 ')}월 (${items.length}건, ${fmt(sum)}원)` });
                                                        secs.push({ type: 'table', headers: ['집행일', '카테고리', '항목', '금액', '결제방법', '수취인'],
                                                            rows: [...items.map(e => [e.execution_date||'', e.category_name||'', e.budget_item_name||'', fmt(e.amount||0)+'원', e.payment_method||'', e.recipient||'']),
                                                                   ['', '', '소계', fmt(sum)+'원', '', '']] });
                                                    });
                                                    downloadHWPX('월별명세서', secs, `월별명세서_${formatLocalDate()}.hwpx`, 'report');
                                                }}
                                            >📄 한글</button>
                                        </div>
                                    </div>

                                    {/* 검색 */}
                                    <div style={{ marginBottom: '10px' }}>
                                        <input className="form-input" type="text"
                                            placeholder="🔍 항목명, 설명, 수취인 검색..."
                                            value={execSearchQuery}
                                            onChange={e => setExecSearchQuery(e.target.value)}
                                            style={{ width: '100%' }} />
                                    </div>

                                    {/* 필터 */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <select className="form-input" style={{ flex: '1', minWidth: '110px' }}
                                            value={execFilterCategory}
                                            onChange={e => { setExecFilterCategory(e.target.value); setExecFilterSubcategory(''); }}>
                                            <option value="">카테고리 전체</option>
                                            {BUDGET_DATA.categories.map(c => (
                                                <option key={c.id} value={c.name}>{c.name}</option>
                                            ))}
                                        </select>
                                        <select className="form-input" style={{ flex: '1', minWidth: '110px' }}
                                            value={execFilterSubcategory}
                                            onChange={e => setExecFilterSubcategory(e.target.value)}
                                            disabled={!execFilterCategory}>
                                            <option value="">소분류 전체</option>
                                            {execFilterCategory && BUDGET_DATA.categories
                                                .find(c => c.name === execFilterCategory)
                                                ?.subcategories.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))
                                            }
                                        </select>
                                        <select className="form-input" style={{ flex: '1', minWidth: '90px' }}
                                            value={execFilterStatus}
                                            onChange={e => setExecFilterStatus(e.target.value)}>
                                            <option value="">상태 전체</option>
                                            {Object.entries(EXECUTION_STATUS).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                        <select className="form-input" style={{ flex: '1', minWidth: '90px' }}
                                            value={execFilterPayment}
                                            onChange={e => setExecFilterPayment(e.target.value)}>
                                            <option value="">결제 전체</option>
                                            <option value="카드">카드</option>
                                            <option value="계좌이체">계좌이체</option>
                                        </select>
                                    </div>

                                    {/* 기간 + 정렬 + 건수 + 초기화 */}
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <input className="form-input" type="date" style={{ width: '140px', fontSize: '13px' }}
                                                value={execFilterDateFrom}
                                                onChange={e => setExecFilterDateFrom(e.target.value)} />
                                            <span style={{ color: '#9C9690' }}>~</span>
                                            <input className="form-input" type="date" style={{ width: '140px', fontSize: '13px' }}
                                                value={execFilterDateTo}
                                                onChange={e => setExecFilterDateTo(e.target.value)} />
                                        </div>
                                        <select className="form-input" style={{ width: 'auto', fontSize: '13px' }}
                                            value={execSortBy}
                                            onChange={e => setExecSortBy(e.target.value)}>
                                            <option value="execution_date">집행일</option>
                                            <option value="amount">금액</option>
                                            <option value="created_at">등록일</option>
                                        </select>
                                        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }}
                                            onClick={() => setExecSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
                                            {execSortDir === 'desc' ? '↓ 내림차순' : '↑ 오름차순'}
                                        </button>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', color: '#6B6560' }}>
                                            <input type="checkbox" checked={selectedExecIds.size > 0 && selectedExecIds.size === filteredExecutions.length} onChange={toggleAllExecs} style={{ width: 14, height: 14 }} />
                                            전체
                                        </label>
                                        <span style={{ fontSize: '13px', color: '#6B6560', marginLeft: 'auto' }}>
                                            📊 {filteredExecutions.length}건 / {(data?.budgetExecutions || []).length}건
                                        </span>
                                        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 10px' }}
                                            onClick={resetExecFilters}>
                                            🔄 초기화
                                        </button>
                                    </div>

                                    {/* 대량 작업 바 */}
                                    {selectedExecIds.size > 0 && (
                                        <div className="bulk-action-bar">
                                            <span style={{ fontWeight: '600' }}>✅ {selectedExecIds.size}건 선택</span>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => bulkChangeStatus('approved')}>일괄 승인</button>
                                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => bulkChangeStatus('executed')}>일괄 집행</button>
                                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => bulkChangeStatus('completed')}>일괄 완료</button>
                                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => handleExportExcel(true)}>📥 선택 내보내기</button>
                                                <button className="btn" style={{ fontSize: '12px', padding: '4px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px' }} onClick={bulkDelete}>일괄 삭제</button>
                                                <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => setSelectedExecIds(new Set())}>선택 해제</button>
                                            </div>
                                        </div>
                                    )}

                                    {filteredExecutions.map(execution => {
                                            const si = EXECUTION_STATUS[execution.status] || EXECUTION_STATUS.pending;
                                            const isEditing = editingExecution?.id === execution.id;
                                            const isDeleteConfirm = executionDeleteId === execution.id;
                                            return (
                                        <div key={execution.id} className="execution-item" style={{ position: 'relative' }}>
                                            {/* 체크박스 */}
                                            {!isEditing && (
                                                <label style={{ position: 'absolute', top: '12px', left: '12px', cursor: 'pointer', zIndex: 1 }}>
                                                    <input type="checkbox" checked={selectedExecIds.has(execution.id)} onChange={() => toggleExecSelect(execution.id)} style={{ width: 16, height: 16 }} />
                                                </label>
                                            )}
                                            {isEditing ? (
                                                <div>
                                                    <div style={{ fontWeight: '600', marginBottom: '12px', color: '#134E42' }}>✏️ 집행내역 수정</div>
                                                    <div className="form-grid" style={{ marginBottom: '12px' }}>
                                                        <div className="form-group">
                                                            <label className="form-label">예산 분류</label>
                                                            <select className="form-input" value={executionEditForm.subcategory_id}
                                                                onChange={e => {
                                                                    const sc = subcategories.find(s => s.id === e.target.value);
                                                                    setExecutionEditForm(f => ({ ...f, subcategory_id: e.target.value, subcategory_name: sc?.name || '', category_name: sc?.categoryName || '', budget_item_id: '', budget_item_name: '', type: '' }));
                                                                }}>
                                                                <option value="">분류 선택</option>
                                                                {subcategories.map(sc => (
                                                                    <option key={sc.id} value={sc.id}>{sc.categoryName} &gt; {sc.name}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">예산 항목</label>
                                                            <select className="form-input" value={executionEditForm.budget_item_id}
                                                                onChange={e => {
                                                                    const items = getAllBudgetItems(executionEditForm.subcategory_id);
                                                                    const item = items.find(i => i.id === e.target.value);
                                                                    setExecutionEditForm(f => ({ ...f, budget_item_id: e.target.value, budget_item_name: item?.name || '', type: item?.type || '' }));
                                                                }}
                                                                disabled={!executionEditForm.subcategory_id}>
                                                                <option value="">항목 선택</option>
                                                                {getAllBudgetItems(executionEditForm.subcategory_id).map(item => (
                                                                    <option key={item.id} value={item.id}>{item.name} ({item.type})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">금액 (원)</label>
                                                            <input className="form-input" type="text" inputMode="numeric" value={fmtInput(executionEditForm.amount)}
                                                                onChange={e => setExecutionEditForm(f => ({ ...f, amount: parseInput(e.target.value) }))} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">결제방법</label>
                                                            <select className="form-input" value={executionEditForm.payment_method}
                                                                onChange={e => setExecutionEditForm(f => ({ ...f, payment_method: e.target.value }))}>
                                                                <option value="카드">카드</option>
                                                                <option value="계좌이체">계좌이체</option>
                                                            </select>
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">집행일</label>
                                                            <input className="form-input" type="date" value={executionEditForm.execution_date}
                                                                onChange={e => setExecutionEditForm(f => ({ ...f, execution_date: e.target.value }))} />
                                                        </div>
                                                        <div className="form-group">
                                                            <label className="form-label">수취인</label>
                                                            <input className="form-input" type="text" value={executionEditForm.recipient}
                                                                onChange={e => setExecutionEditForm(f => ({ ...f, recipient: e.target.value }))}
                                                                list="recipient-datalist-edit" />
                                                            <datalist id="recipient-datalist-edit">
                                                                {recipients.map(r => <option key={r.id} value={r.name} />)}
                                                            </datalist>
                                                        </div>
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                                        <label className="form-label">설명</label>
                                                        <input className="form-input" type="text" value={executionEditForm.description}
                                                            onChange={e => setExecutionEditForm(f => ({ ...f, description: e.target.value }))} />
                                                    </div>
                                                    <div className="form-group" style={{ marginBottom: '12px' }}>
                                                        <label className="form-label">비고</label>
                                                        <input className="form-input" type="text" value={executionEditForm.notes || ''}
                                                            onChange={e => setExecutionEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="비고 (선택사항)" />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn btn-primary" style={{ fontSize: '13px' }}
                                                            onClick={handleUpdateExecution} disabled={executionSaving}>
                                                            {executionSaving ? '저장 중...' : '저장'}
                                                        </button>
                                                        <button className="btn btn-secondary" style={{ fontSize: '13px' }}
                                                            onClick={() => setEditingExecution(null)} disabled={executionSaving}>
                                                            취소
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                <div className="execution-header" style={{ paddingLeft: 28 }}>
                                                    <div>
                                                        <div className="execution-title">{execution.budget_item_name}</div>
                                                        <div style={{ fontSize: '14px', color: '#6B6560' }}>
                                                            {execution.description}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                                        <span style={{ fontSize: '11px', fontWeight: '500', padding: '2px 8px', borderRadius: '10px', background: si.bg, color: si.color }}>{si.label}</span>
                                                        <div className="execution-amount">
                                                            {execution.amount?.toLocaleString()}원
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="execution-meta">
                                                    <span>📅 {execution.execution_date}</span>
                                                    <span>💳 {execution.payment_method}</span>
                                                    <span>🏷️ {execution.category_name} {'>'} {execution.subcategory_name}</span>
                                                    {execution.recipient && <span>👤 {execution.recipient}</span>}
                                                </div>
                                                {/* 수정/삭제/승인 버튼 */}
                                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px' }}
                                                        onClick={() => { setEditingExecution(execution); setExecutionEditForm({ subcategory_id: execution.subcategory_id || '', subcategory_name: execution.subcategory_name || '', category_name: execution.category_name || '', budget_item_id: execution.budget_item_id || '', budget_item_name: execution.budget_item_name || '', type: execution.type || '', amount: execution.amount, payment_method: execution.payment_method, execution_date: execution.execution_date, recipient: execution.recipient || '', description: execution.description || '', notes: execution.notes || '' }); }}>
                                                        ✏️ 수정
                                                    </button>
                                                    {currentUser?.role === 'admin' && (
                                                        isDeleteConfirm ? (
                                                            <>
                                                                <span style={{ fontSize: '12px', color: '#dc3545' }}>정말 삭제하시겠습니까?</span>
                                                                <button className="btn" style={{ fontSize: '11px', padding: '3px 10px', background: '#dc3545', color: 'white', border: 'none' }}
                                                                    onClick={() => handleDeleteExecution(execution.id)}>확인</button>
                                                                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px' }}
                                                                    onClick={() => setExecutionDeleteId(null)}>취소</button>
                                                            </>
                                                        ) : (
                                                            <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px', color: '#dc3545', borderColor: '#dc3545' }}
                                                                onClick={() => setExecutionDeleteId(execution.id)}>
                                                                🗑️ 삭제
                                                            </button>
                                                        )
                                                    )}
                                                    {currentUser?.role === 'admin' && (
                                                        <>
                                                            {execution.status === 'pending' && (
                                                                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px', color: '#0C5460', borderColor: '#0C5460' }}
                                                                    onClick={() => handleChangeExecutionStatus(execution.id, 'approved')}>✅ 승인</button>
                                                            )}
                                                            {execution.status === 'approved' && (
                                                                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px', color: '#155724', borderColor: '#155724' }}
                                                                    onClick={() => handleChangeExecutionStatus(execution.id, 'executed')}>💼 집행완료</button>
                                                            )}
                                                            {execution.status === 'executed' && (
                                                                <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 10px', color: '#383D41', borderColor: '#6C757D' }}
                                                                    onClick={() => handleChangeExecutionStatus(execution.id, 'completed')}>🏁 완료처리</button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                </>
                                            )}

                                            {!isEditing && execution.type === '운영인건비' && execution.recipient && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '12px', padding: '4px 12px', color: '#1B6B5A', borderColor: '#1B6B5A' }}
                                                        onClick={() => openSalaryStatement(execution, data.budgetExecutions, orgSettings, recipients)}
                                                    >
                                                        📄 급여지급명세서 생성
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '12px', padding: '4px 12px' }}
                                                        onClick={() => {
                                                            const html = generateSalaryStatementHTML(execution, data.budgetExecutions, orgSettings, recipients.find(r => r.name === (execution.recipient || '').trim()) || null);
                                                            generatePDF(html, `급여지급명세서_${execution.recipient || ''}_${execution.execution_date || ''}.pdf`);
                                                        }}
                                                    >📥 PDF</button>
                                                </div>
                                            )}
                                            {!isEditing && ['사업인건비', '사업회의비', '교육훈련비'].includes(execution.type) && (
                                                <div style={{ marginTop: '8px' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '12px', padding: '4px 12px', color: '#2B6CB0', borderColor: '#2B6CB0' }}
                                                        onClick={() => {
                                                            setMeetingMinutesForm({
                                                                title: execution.description || execution.subcategory_name || '',
                                                                date: execution.execution_date || '',
                                                                location: '',
                                                                content: '',
                                                                participants: ''
                                                            });
                                                            setMeetingMinutesModal({ execution });
                                                        }}
                                                    >
                                                        📋 회의진행일지 생성
                                                    </button>
                                                </div>
                                            )}
                                            {!isEditing && DOCUMENT_RULES[execution.type] && (
                                                <div className="documents-list">
                                                    <div style={{ fontWeight: '600', marginBottom: '8px' }}>필요 증빙서류:</div>
                                                    {getRequiredDocuments(execution.type, execution.payment_method).map((doc, index) => {
                                                        const docRecord = executionDocsMap[execution.id]?.[doc];
                                                        return (
                                                            <div key={index} className="document-item">
                                                                <span>📄 {doc}</span>
                                                                {docRecord?.file_name ? (
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        style={{
                                                                            fontSize: '12px',
                                                                            padding: '3px 10px',
                                                                            color: '#1B6B5A',
                                                                            borderColor: '#1B6B5A',
                                                                            maxWidth: '200px',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                            whiteSpace: 'nowrap'
                                                                        }}
                                                                        onClick={() => downloadFile(docRecord.file_path, docRecord.file_name)}
                                                                        title={docRecord.file_name}
                                                                    >
                                                                        ⬇️ {docRecord.file_name}
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        className="btn btn-secondary"
                                                                        style={{ fontSize: '12px', padding: '3px 10px', flexShrink: 0 }}
                                                                        onClick={() => {
                                                                            activeDocUploadRef.current = { execId: execution.id, docName: doc };
                                                                            docUploadFileInputRef.current?.click();
                                                                        }}
                                                                    >
                                                                        📎 첨부하기
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })}

                                    <input
                                        ref={docUploadFileInputRef}
                                        type="file"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            e.target.value = '';
                                            const { execId, docName } = activeDocUploadRef.current || {};
                                            activeDocUploadRef.current = null;
                                            if (!file || !execId || !docName) return;
                                            try {
                                                const timestamp = Date.now();
                                                const safeName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
                                                const filePath = `execution/${execId}/${timestamp}_${safeName}`;
                                                const { data: storageData, error: storageError } = await supabase.storage
                                                    .from('attachments')
                                                    .upload(filePath, file);
                                                if (storageError) throw storageError;
                                                const { error: dbError } = await supabase
                                                    .from('documents')
                                                    .insert([{
                                                        execution_id: execId,
                                                        document_name: docName,
                                                        document_type: 'required',
                                                        file_path: storageData?.path || filePath,
                                                        file_name: file.name,
                                                        file_size: file.size,
                                                        uploaded_by: currentUser.id
                                                    }]);
                                                if (dbError) throw dbError;
                                                setExecutionDocsMap(prev => ({
                                                    ...prev,
                                                    [execId]: {
                                                        ...(prev[execId] || {}),
                                                        [docName]: { file_path: storageData?.path || filePath, file_name: file.name, file_size: file.size }
                                                    }
                                                }));
                                            } catch (err) {
                                                console.error('문서 첨부 실패:', err);
                                                alert('파일 첨부 중 오류가 발생했습니다.');
                                            }
                                        }}
                                    />

                                    {filteredExecutions.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#9C9690', padding: '40px' }}>
                                            {(data?.budgetExecutions || []).length === 0
                                                ? '등록된 집행 내역이 없습니다.'
                                                : '조건에 맞는 집행 내역이 없습니다.'}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── 캘린더 탭 ──────────────────────────────── */}
                            {budgetTab === 'calendar' && (() => {
                                const [year, month] = execCalMonth.split('-').map(Number);
                                const firstDay = new Date(year, month - 1, 1).getDay();
                                const daysInMonth = new Date(year, month, 0).getDate();
                                const execsByDate = {};
                                (data?.budgetExecutions || []).forEach(ex => {
                                    if (ex.execution_date) {
                                        const d = ex.execution_date.slice(0, 10);
                                        if (d.startsWith(execCalMonth)) {
                                            if (!execsByDate[d]) execsByDate[d] = [];
                                            execsByDate[d].push(ex);
                                        }
                                    }
                                });
                                const prevMonth = () => {
                                    const d = new Date(year, month - 2, 1);
                                    setExecCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                                    setExecCalSelectedDate(null);
                                };
                                const nextMonth = () => {
                                    const d = new Date(year, month, 1);
                                    setExecCalMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
                                    setExecCalSelectedDate(null);
                                };
                                const selectedDateExecs = execCalSelectedDate ? (execsByDate[execCalSelectedDate] || []) : [];

                                return (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>📅 집행 캘린더</h2>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={prevMonth}>◀</button>
                                                <span style={{ fontSize: 16, fontWeight: 600 }}>{year}년 {month}월</span>
                                                <button className="btn btn-secondary" style={{ padding: '4px 12px' }} onClick={nextMonth}>▶</button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: '#E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                                            {['일','월','화','수','목','금','토'].map(d => (
                                                <div key={d} style={{ background: '#F7FAFC', padding: '8px 4px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: d === '일' ? '#E53E3E' : d === '토' ? '#3182CE' : '#4A5568' }}>{d}</div>
                                            ))}
                                            {Array.from({ length: firstDay }).map((_, i) => (
                                                <div key={`e-${i}`} style={{ background: '#FAFAFA', minHeight: 70 }} />
                                            ))}
                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                const day = i + 1;
                                                const dateStr = `${execCalMonth}-${String(day).padStart(2,'0')}`;
                                                const dayExecs = execsByDate[dateStr] || [];
                                                const total = dayExecs.reduce((s, e) => s + (e.amount || 0), 0);
                                                const isSelected = execCalSelectedDate === dateStr;
                                                const dayOfWeek = new Date(year, month - 1, day).getDay();
                                                return (
                                                    <div key={day}
                                                        onClick={() => setExecCalSelectedDate(isSelected ? null : dateStr)}
                                                        style={{
                                                            background: isSelected ? '#EBF8FF' : 'white', minHeight: 70, padding: '4px 6px',
                                                            cursor: dayExecs.length > 0 ? 'pointer' : 'default',
                                                            borderLeft: isSelected ? '3px solid #1B6B5A' : '3px solid transparent'
                                                        }}>
                                                        <div style={{ fontSize: 13, fontWeight: 500, color: dayOfWeek === 0 ? '#E53E3E' : dayOfWeek === 6 ? '#3182CE' : '#2D3748', marginBottom: 4 }}>{day}</div>
                                                        {dayExecs.length > 0 && (
                                                            <>
                                                                <div style={{ fontSize: 11, color: '#1B6B5A', fontWeight: 600 }}>{dayExecs.length}건</div>
                                                                <div style={{ fontSize: 10, color: '#6B6560' }}>{fmt(total)}</div>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {execCalSelectedDate && (
                                            <div style={{ marginTop: 16 }}>
                                                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1B6B5A' }}>
                                                    📋 {execCalSelectedDate} 집행내역 ({selectedDateExecs.length}건)
                                                </h3>
                                                {selectedDateExecs.length === 0 ? (
                                                    <div style={{ textAlign: 'center', color: '#9C9690', padding: 20 }}>이 날짜의 집행 내역이 없습니다.</div>
                                                ) : selectedDateExecs.map(ex => {
                                                    const esi = EXECUTION_STATUS[ex.status] || EXECUTION_STATUS.pending;
                                                    return (
                                                        <div key={ex.id} className="execution-item" style={{ marginBottom: 8 }}>
                                                            <div className="execution-header">
                                                                <div>
                                                                    <div className="execution-title">{ex.budget_item_name}</div>
                                                                    <div style={{ fontSize: 13, color: '#6B6560' }}>{ex.description}</div>
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10, background: esi.bg, color: esi.color }}>{esi.label}</span>
                                                                    <div className="execution-amount">{ex.amount?.toLocaleString()}원</div>
                                                                </div>
                                                            </div>
                                                            <div className="execution-meta">
                                                                <span>💳 {ex.payment_method}</span>
                                                                <span>🏷️ {ex.category_name} {'>'} {ex.subcategory_name}</span>
                                                                {ex.recipient && <span>👤 {ex.recipient}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* ── 비용비율 탭 ──────────────────────────────── */}
                            {budgetTab === 'ratio' && (() => {
                                const periodRange = PERIOD_DATE_RANGES[budgetPeriod];
                                const periodExecutions = periodRange
                                    ? data.budgetExecutions.filter(ex =>
                                        ex.execution_date >= periodRange.start && ex.execution_date <= periodRange.end)
                                    : data.budgetExecutions;
                                // 소분류별 집계
                                const execBySubcat = {};
                                // 세부항목별 집계
                                const execByItem = {};
                                periodExecutions.forEach(ex => {
                                    if (ex.subcategory_id) execBySubcat[ex.subcategory_id] = (execBySubcat[ex.subcategory_id] || 0) + (ex.amount || 0);
                                    if (ex.budget_item_id) execByItem[ex.budget_item_id] = (execByItem[ex.budget_item_id] || 0) + (ex.amount || 0);
                                });
                                const categoryName = ratioTab === 'project' ? '사업비' : '운영비';
                                const category = BUDGET_DATA.categories.find(c => c.name === categoryName);
                                const catBudget = category ? getBudgetByPeriod(category, budgetPeriod) : 0;
                                const catExecuted = category
                                    ? category.subcategories.reduce((sum, sub) => sum + (execBySubcat[sub.id] || 0), 0)
                                    : 0;
                                const catRate = pct(catExecuted, catBudget);
                                return (
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
                                            <h2 style={{ fontSize: '20px', fontWeight: '600' }}>📊 비용 사용비율</h2>
                                        </div>

                                        {/* 내부 탭: 사업비 / 운영비 */}
                                        <div className="tab-navigation" style={{ marginBottom: '20px' }}>
                                            <button
                                                className={`tab-btn ${ratioTab === 'project' ? 'active' : ''}`}
                                                onClick={() => setRatioTab('project')}
                                            >💼 사업비</button>
                                            <button
                                                className={`tab-btn ${ratioTab === 'operating' ? 'active' : ''}`}
                                                onClick={() => setRatioTab('operating')}
                                            >🏢 운영비</button>
                                        </div>

                                        {/* 카테고리 전체 요약 */}
                                        <div className="card" style={{ marginBottom: '16px' }}>
                                            <div className="card-header">
                                                <h2 className="card-title">{categoryName} 전체 집행현황</h2>
                                                <span style={{
                                                    fontSize: '13px', fontWeight: '600', padding: '3px 10px',
                                                    borderRadius: '10px',
                                                    background: catRate >= 90 ? '#FEE2E2' : catRate >= 70 ? '#FEF3C7' : '#DCFCE7',
                                                    color: catRate >= 90 ? '#DC2626' : catRate >= 70 ? '#D97706' : '#15803D'
                                                }}>{catRate}%</span>
                                            </div>
                                            <div style={{ padding: '6px 0 2px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B6560', marginBottom: '10px' }}>
                                                    <span>집행: <strong style={{ color: '#1A1814' }}>{fmt(catExecuted)}원</strong></span>
                                                    <span>예산: <strong style={{ color: '#1A1814' }}>{fmt(catBudget)}원</strong></span>
                                                </div>
                                                <div style={{ background: '#F0EFED', borderRadius: '8px', height: '14px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        background: catRate >= 90 ? '#DC2626' : catRate >= 70 ? '#D97706' : '#134E42',
                                                        width: `${Math.min(100, catRate)}%`,
                                                        height: '100%', borderRadius: '8px', transition: 'width 0.4s ease'
                                                    }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: '#6B6560' }}>
                                                    <span>잔액: {fmt(Math.max(0, catBudget - catExecuted))}원</span>
                                                    <span>{catExecuted > catBudget ? <span style={{ color: '#DC2626' }}>초과: {fmt(catExecuted - catBudget)}원</span> : '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 소분류별 + 세부항목 집행률 */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {(category?.subcategories || []).map(sub => {
                                                const subBudget = getBudgetByPeriod(sub, budgetPeriod);
                                                if (subBudget === 0) return null;
                                                const subExecuted = execBySubcat[sub.id] || 0;
                                                const subRate = pct(subExecuted, subBudget);
                                                const remaining = Math.max(0, subBudget - subExecuted);
                                                const barColor = subRate >= 90 ? '#DC2626' : subRate >= 70 ? '#D97706' : '#3B82F6';
                                                const itemsWithBudget = (sub.items || []).filter(item => getBudgetByPeriod(item, budgetPeriod) > 0);
                                                return (
                                                    <div key={sub.id} className="card">
                                                        {/* 소분류 헤더 */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontWeight: '600', marginBottom: '3px', color: '#1A1814', fontSize: '14px' }}>{sub.name}</div>
                                                                <div style={{ fontSize: '12px', color: '#6B6560' }}>예산 {fmt(subBudget)}원</div>
                                                            </div>
                                                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                                                                <div style={{ fontSize: '22px', fontWeight: '700', color: barColor, lineHeight: 1.1 }}>{subRate}%</div>
                                                                <div style={{ fontSize: '10px', color: '#9C9690', marginTop: '2px' }}>집행률</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ background: '#F0EFED', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                                            <div style={{
                                                                background: barColor,
                                                                width: `${Math.min(100, subRate)}%`,
                                                                height: '100%', borderRadius: '6px', transition: 'width 0.3s ease'
                                                            }} />
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6B6560', marginBottom: itemsWithBudget.length > 0 ? '14px' : '0' }}>
                                                            <span>집행 <strong style={{ color: '#1A1814' }}>{fmt(subExecuted)}원</strong></span>
                                                            <span>잔액 <strong style={{ color: remaining === 0 && subExecuted > 0 ? '#DC2626' : '#1A1814' }}>{fmt(remaining)}원</strong></span>
                                                        </div>

                                                        {/* 세부항목 테이블 */}
                                                        {itemsWithBudget.length > 0 && (
                                                            <div style={{ borderTop: '1px solid #EBE8E1', paddingTop: '12px' }}>
                                                                <div style={{ fontSize: '11px', color: '#9C9690', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>세부 항목</div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    {itemsWithBudget.map(item => {
                                                                        const itemBudget = getBudgetByPeriod(item, budgetPeriod);
                                                                        const itemExecuted = execByItem[item.id] || 0;
                                                                        const itemRate = pct(itemExecuted, itemBudget);
                                                                        const itemColor = itemRate >= 90 ? '#DC2626' : itemRate >= 70 ? '#D97706' : '#134E42';
                                                                        return (
                                                                            <div key={item.id} style={{ background: '#F9F8F6', borderRadius: '8px', padding: '10px 12px' }}>
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#1A1814', marginBottom: '1px' }}>{item.name}</div>
                                                                                        <div style={{ fontSize: '11px', color: '#9C9690' }}>{item.type} · 예산 {fmt(itemBudget)}원</div>
                                                                                    </div>
                                                                                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
                                                                                        <div style={{ fontSize: '15px', fontWeight: '700', color: itemColor }}>{itemRate}%</div>
                                                                                        <div style={{ fontSize: '10px', color: '#9C9690' }}>{fmt(itemExecuted)}원</div>
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ background: '#E5E3DF', borderRadius: '4px', height: '5px', overflow: 'hidden' }}>
                                                                                    <div style={{
                                                                                        background: itemColor,
                                                                                        width: `${Math.min(100, itemRate)}%`,
                                                                                        height: '100%', borderRadius: '4px', transition: 'width 0.3s ease'
                                                                                    }} />
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                );
            };

            // 로그아웃
            const handleLogout = () => {
                localStorage.removeItem('bf_user_session');
                setCurrentUser(null);
                setCurrentPage('dashboard');
            };

            // 관리자 페이지 상태
            const [adminUsers, setAdminUsers] = useState([]);
            const [adminLoading, setAdminLoading] = useState(false);
            const [adminError, setAdminError] = useState('');
            const [adminSuccess, setAdminSuccess] = useState('');
            const [showUserForm, setShowUserForm] = useState(false);
            const [editingUser, setEditingUser] = useState(null);
            const [userForm, setUserForm] = useState({
                username: '', name: '', email: '', password: '',
                role: 'staff', phone: '', organization: '청년노동자인권센터', position: ''
            });

            const resetUserForm = () => {
                setUserForm({
                    username: '', name: '', email: '', password: '',
                    role: 'staff', phone: '', organization: '청년노동자인권센터', position: ''
                });
                setEditingUser(null);
                setShowUserForm(false);
            };

            // ── 집행내역 수정/삭제/승인 ────────────────────────────────────
            const [editingExecution, setEditingExecution] = useState(null);
            const [executionEditForm, setExecutionEditForm] = useState({});
            const [executionDeleteId, setExecutionDeleteId] = useState(null);
            const [executionSaving, setExecutionSaving] = useState(false);
            const [executionMsg, setExecutionMsg] = useState('');
            // ── 갤러리 ZIP 다운로드 ───────────────────────────────────────
            const [galleryZipping, setGalleryZipping] = useState(false);

            // ── 성과지표 (system_settings) ────────────────────────────────
            const [perfIndicators, setPerfIndicators] = useState({
                perf_textbook_team: '0', perf_textbook_report: '0',
                perf_campaign_count: '0', perf_app_released: '0', perf_committee_count: '0'
            });
            const [perfEditing, setPerfEditing] = useState(false);
            const [perfDraft, setPerfDraft] = useState(null);
            const [perfSaving, setPerfSaving] = useState(false);
            const [perfMsg, setPerfMsg] = useState('');

            // ── 기관 정보 (system_settings) ──────────────────────────────
            const [orgSettings, setOrgSettings] = useState({
                org_name: '', org_phone: '',
                org_representative: '', org_address: '', org_registration_number: '', org_seal: ''
            });
            const [orgSettingsSaving, setOrgSettingsSaving] = useState(false);
            const [orgSettingsMsg, setOrgSettingsMsg] = useState({ type: '', text: '' });

            // ── 수급자 목록 ───────────────────────────────────────────────
            const [recipients, setRecipients] = useState([]);
            const [recipientsLoading, setRecipientsLoading] = useState(false);
            const [showRecipientForm, setShowRecipientForm] = useState(false);
            const [editingRecipient, setEditingRecipient] = useState(null);
            const [recipientForm, setRecipientForm] = useState({
                name: '', birth_date: '', address: '', phone: '', notes: ''
            });
            const [recipientMsg, setRecipientMsg] = useState({ type: '', text: '' });

            // ── 관리자 탭 ─────────────────────────────────────────────────
            const [adminTab, setAdminTab] = useState('users'); // 'users'|'recipients'|'orgSettings'|'logs'

            // ── 회의진행일지 입력 모달 ─────────────────────────────────────
            const [meetingMinutesModal, setMeetingMinutesModal] = useState(null); // null | { execution }
            const [meetingMinutesForm, setMeetingMinutesForm] = useState({
                title: '', date: '', location: '', content: '', participants: ''
            });

            // ── 사업변경신청서 입력 모달 ─────────────────────────────────────
            const [changeApplicationModal, setChangeApplicationModal] = useState(false);
            const [changeApplicationForm, setChangeApplicationForm] = useState({
                reason: '',
                changeDetails: [{ beforeUnit: '', beforeSchedule: '', beforeContent: '',
                                  afterUnit: '', afterSchedule: '', afterContent: '' }],
                budgetChanges: {},
                specificDetails: [{ unitName: '', beforeAmount: 0, afterAmount: 0, basis: '', reason: '' }],
                applicationDate: new Date().toISOString().slice(0, 10)
            });

            // ── 기관 정보 저장 ────────────────────────────────────────────
            const saveOrgSettings = async () => {
                setOrgSettingsSaving(true);
                setOrgSettingsMsg({ type: '', text: '' });
                try {
                    const rows = [
                        { setting_key: 'org_name',                setting_value: orgSettings.org_name },
                        { setting_key: 'org_phone',               setting_value: orgSettings.org_phone },
                        { setting_key: 'org_representative',      setting_value: orgSettings.org_representative },
                        { setting_key: 'org_address',             setting_value: orgSettings.org_address },
                        { setting_key: 'org_registration_number', setting_value: orgSettings.org_registration_number },
                        { setting_key: 'org_seal',                setting_value: orgSettings.org_seal }
                    ];
                    const { error } = await supabase
                        .from('system_settings')
                        .upsert(rows, { onConflict: 'setting_key' });
                    if (error) throw error;
                    setOrgSettingsMsg({ type: 'success', text: '기관 정보가 저장되었습니다.' });
                } catch (err) {
                    console.error('Error saving org settings:', err);
                    setOrgSettingsMsg({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
                } finally {
                    setOrgSettingsSaving(false);
                }
            };

            // ── 성과지표 저장 ─────────────────────────────────────────────
            const handleSavePerfIndicators = async () => {
                setPerfSaving(true);
                setPerfMsg('');
                try {
                    const rows = Object.entries(perfDraft).map(([k, v]) => ({ setting_key: k, setting_value: String(v) }));
                    const { error } = await supabase
                        .from('system_settings')
                        .upsert(rows, { onConflict: 'setting_key' });
                    if (error) throw error;
                    setPerfIndicators({ ...perfDraft });
                    setPerfEditing(false);
                    setPerfDraft(null);
                    setPerfMsg('저장되었습니다.');
                    setTimeout(() => setPerfMsg(''), 3000);
                } catch (err) {
                    console.error('성과지표 저장 오류:', err);
                    setPerfMsg('저장 중 오류가 발생했습니다.');
                } finally {
                    setPerfSaving(false);
                }
            };

            // ── 집행내역 수정/삭제/승인 핸들러 ───────────────────────────────
            const refreshExecutions = async () => {
                const fresh = await loadBudgetExecutions();
                setData(prev => ({ ...prev, budgetExecutions: fresh }));
            };

            const handleUpdateExecution = async () => {
                if (!editingExecution) return;
                setExecutionSaving(true);
                setExecutionMsg('');
                try {
                    const { error } = await supabase.from('budget_executions').update({
                        subcategory_id: executionEditForm.subcategory_id,
                        subcategory_name: executionEditForm.subcategory_name,
                        category_name: executionEditForm.category_name,
                        budget_item_id: executionEditForm.budget_item_id,
                        budget_item_name: executionEditForm.budget_item_name,
                        type: executionEditForm.type,
                        amount: parseInt(executionEditForm.amount) || 0,
                        payment_method: executionEditForm.payment_method,
                        execution_date: executionEditForm.execution_date,
                        recipient: executionEditForm.recipient || '',
                        description: executionEditForm.description || '',
                        notes: executionEditForm.notes || null
                    }).eq('id', editingExecution.id);
                    if (error) throw error;
                    setEditingExecution(null);
                    await refreshExecutions();
                    setExecutionMsg('수정되었습니다.');
                    setTimeout(() => setExecutionMsg(''), 3000);
                } catch (err) {
                    console.error('집행내역 수정 오류:', err);
                    setExecutionMsg('수정 중 오류가 발생했습니다.');
                } finally {
                    setExecutionSaving(false);
                }
            };

            const handleDeleteExecution = async (id) => {
                try {
                    await supabase.from('attachments').delete().eq('execution_id', id);
                    const { error } = await supabase.from('budget_executions').delete().eq('id', id);
                    if (error) throw error;
                    setExecutionDeleteId(null);
                    await refreshExecutions();
                } catch (err) {
                    console.error('집행내역 삭제 오류:', err);
                }
            };

            const handleChangeExecutionStatus = async (id, newStatus) => {
                try {
                    const { error } = await supabase.from('budget_executions')
                        .update({ status: newStatus }).eq('id', id);
                    if (error) throw error;
                    await refreshExecutions();
                } catch (err) {
                    console.error('상태 변경 오류:', err);
                }
            };

            const handleExportExcel = (selectedOnly = false) => {
                if (!window.XLSX) { alert('Excel 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
                const executions = selectedOnly ? filteredExecutions.filter(e => selectedExecIds.has(e.id)) : filteredExecutions;
                if (executions.length === 0) { alert('내보낼 데이터가 없습니다.'); return; }
                const rows = executions.map(e => ({
                    '집행일': e.execution_date || '',
                    '대분류': e.category_name || '',
                    '소분류': e.subcategory_name || '',
                    '항목명': e.budget_item_name || '',
                    '유형': e.type || '',
                    '금액(원)': e.amount || 0,
                    '결제방법': e.payment_method || '',
                    '수급자': e.recipient || '',
                    '상태': EXECUTION_STATUS[e.status]?.label || e.status || ''
                }));
                const ws = window.XLSX.utils.json_to_sheet(rows);
                const wb = window.XLSX.utils.book_new();
                window.XLSX.utils.book_append_sheet(wb, ws, '집행내역');
                window.XLSX.writeFile(wb, `집행내역_${new Date().toISOString().slice(0, 10)}.xlsx`);
            };

            const handleGalleryZipDownload = async (galleriesArg) => {
                if (!window.JSZip) { alert('JSZip 라이브러리 로딩 중입니다. 잠시 후 다시 시도해주세요.'); return; }
                setGalleryZipping(true);
                try {
                    const zip = new window.JSZip();
                    const galleries = galleriesArg || [];
                    // Fetch all attachment metadata in parallel
                    const attsByGallery = await Promise.all(
                        galleries.map(item =>
                            supabase.from('attachments')
                                .select('file_path, file_name')
                                .eq('gallery_id', item.id)
                                .not('file_type', 'eq', 'document')
                                .then(({ data }) => ({ item, atts: data || [] }))
                        )
                    );
                    for (const { item, atts } of attsByGallery) {
                        for (const att of atts) {
                            try {
                                const { data: blob } = await supabase.storage
                                    .from('attachments').download(att.file_path);
                                if (blob) {
                                    const safeTitle = (item.title || '기타').replace(/[/\\:*?"<>|]/g, '_');
                                    const safeFilename = (att.file_name || 'image').replace(/[/\\:*?"<>|]/g, '_');
                                    zip.file(`${safeTitle}/${safeFilename}`, blob);
                                }
                            } catch (e) {
                                console.warn('파일 다운로드 실패:', att.file_path, e);
                            }
                        }
                    }
                    const blob = await zip.generateAsync({ type: 'blob' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `갤러리_${new Date().toISOString().slice(0, 10)}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error('ZIP 생성 오류:', err);
                    alert('ZIP 생성 중 오류가 발생했습니다.');
                } finally {
                    setGalleryZipping(false);
                }
            };

            // ── 수급자 목록 로딩 ─────────────────────────────────────────
            const loadRecipients = async () => {
                setRecipientsLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('recipients')
                        .select('id, name, birth_date, address, phone, notes, is_active, created_at')
                        .eq('is_active', true)
                        .order('name');
                    if (error) throw error;
                    setRecipients(data || []);
                } catch (err) {
                    console.error('Error loading recipients:', err);
                    setRecipientMsg({ type: 'error', text: '수급자 목록을 불러오는 중 오류가 발생했습니다.' });
                } finally {
                    setRecipientsLoading(false);
                }
            };

            // ── 수급자 저장 (추가/수정) ──────────────────────────────────
            const handleSaveRecipient = async (e) => {
                e.preventDefault();
                setRecipientMsg({ type: '', text: '' });
                if (!recipientForm.name.trim()) {
                    setRecipientMsg({ type: 'error', text: '성명은 필수 입력 항목입니다.' });
                    return;
                }
                try {
                    if (editingRecipient) {
                        const { error } = await supabase
                            .from('recipients')
                            .update({ ...recipientForm, updated_at: new Date().toISOString() })
                            .eq('id', editingRecipient.id);
                        if (error) throw error;
                        setRecipientMsg({ type: 'success', text: `'${recipientForm.name}' 정보가 수정되었습니다.` });
                    } else {
                        const { error } = await supabase
                            .from('recipients')
                            .insert([{ ...recipientForm, is_active: true }]);
                        if (error) throw error;
                        setRecipientMsg({ type: 'success', text: `'${recipientForm.name}' 수급자가 등록되었습니다.` });
                    }
                    setRecipientForm({ name: '', birth_date: '', address: '', phone: '', notes: '' });
                    setEditingRecipient(null);
                    setShowRecipientForm(false);
                    await loadRecipients();
                } catch (err) {
                    console.error('Error saving recipient:', err);
                    setRecipientMsg({ type: 'error', text: '저장 중 오류가 발생했습니다.' });
                }
            };

            // ── 수급자 삭제 (소프트 삭제) ────────────────────────────────
            const handleDeleteRecipient = async (r) => {
                if (!window.confirm(`'${r.name}' 수급자를 삭제하시겠습니까?`)) return;
                setRecipientMsg({ type: '', text: '' });
                try {
                    const { error } = await supabase
                        .from('recipients')
                        .update({ is_active: false, updated_at: new Date().toISOString() })
                        .eq('id', r.id);
                    if (error) throw error;
                    setRecipientMsg({ type: 'success', text: `'${r.name}' 수급자가 삭제되었습니다.` });
                    await loadRecipients();
                } catch (err) {
                    console.error('Error deleting recipient:', err);
                    setRecipientMsg({ type: 'error', text: '삭제 중 오류가 발생했습니다.' });
                }
            };

            // 사용자 목록 로딩
            const loadAdminUsers = async () => {
                setAdminLoading(true);
                try {
                    const { data: users, error } = await supabase
                        .from('users')
                        .select('id, username, name, email, role, phone, organization, position, is_active, created_at, updated_at')
                        .order('created_at', { ascending: true });

                    if (error) throw error;
                    setAdminUsers(users || []);
                } catch (err) {
                    console.error('Error loading users:', err);
                    setAdminError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
                } finally {
                    setAdminLoading(false);
                }
            };

            // 사용자 추가
            const handleAddUser = async (e) => {
                e.preventDefault();
                setAdminError('');
                setAdminSuccess('');

                if (!userForm.username || !userForm.name || !userForm.password) {
                    setAdminError('아이디, 이름, 비밀번호는 필수 입력 항목입니다.');
                    return;
                }

                try {
                    const { data, error } = await supabase
                        .from('users')
                        .insert([{
                            username: userForm.username,
                            name: userForm.name,
                            email: userForm.email || `${userForm.username}@younglabor.org`,
                            password_hash: await hashPassword(userForm.password), // SHA-256 해시 후 저장
                            role: userForm.role,
                            phone: userForm.phone,
                            organization: userForm.organization,
                            position: userForm.position,
                            is_active: true
                        }])
                        .select();

                    if (error) {
                        if (error.message.includes('duplicate') || error.message.includes('unique')) {
                            setAdminError('이미 존재하는 아이디 또는 이메일입니다.');
                        } else {
                            throw error;
                        }
                        return;
                    }

                    setAdminSuccess(`'${userForm.name}' 사용자가 추가되었습니다.`);
                    resetUserForm();
                    await loadAdminUsers();
                } catch (err) {
                    console.error('Error adding user:', err);
                    setAdminError('사용자 추가 중 오류가 발생했습니다: ' + err.message);
                }
            };

            // 사용자 수정
            const handleUpdateUser = async (e) => {
                e.preventDefault();
                setAdminError('');
                setAdminSuccess('');

                if (!editingUser) return;

                try {
                    const updateData = {
                        name: userForm.name,
                        email: userForm.email,
                        role: userForm.role,
                        phone: userForm.phone,
                        organization: userForm.organization,
                        position: userForm.position,
                        updated_at: new Date().toISOString()
                    };

                    // 비밀번호가 입력된 경우에만 변경 (SHA-256 해시 후 저장)
                    if (userForm.password) {
                        updateData.password_hash = await hashPassword(userForm.password);
                    }

                    const { error } = await supabase
                        .from('users')
                        .update(updateData)
                        .eq('id', editingUser.id);

                    if (error) throw error;

                    setAdminSuccess(`'${userForm.name}' 사용자 정보가 수정되었습니다.`);

                    // 현재 로그인 사용자 정보가 변경된 경우 세션 업데이트
                    if (currentUser && currentUser.id === editingUser.id) {
                        const updatedSession = {
                            ...currentUser,
                            name: userForm.name,
                            email: userForm.email,
                            role: userForm.role,
                            organization: userForm.organization,
                            position: userForm.position
                        };
                        localStorage.setItem('bf_user_session', JSON.stringify(updatedSession));
                        setCurrentUser(updatedSession);
                    }

                    resetUserForm();
                    await loadAdminUsers();
                } catch (err) {
                    console.error('Error updating user:', err);
                    setAdminError('사용자 수정 중 오류가 발생했습니다: ' + err.message);
                }
            };

            // 사용자 삭제 (비활성화)
            const handleDeleteUser = async (user) => {
                if (user.id === currentUser?.id) {
                    setAdminError('현재 로그인된 계정은 삭제할 수 없습니다.');
                    return;
                }

                if (!confirm(`'${user.name}' (${user.username}) 사용자를 삭제하시겠습니까?\n삭제된 사용자는 로그인할 수 없습니다.`)) {
                    return;
                }

                try {
                    const { error } = await supabase
                        .from('users')
                        .update({ is_active: false, updated_at: new Date().toISOString() })
                        .eq('id', user.id);

                    if (error) throw error;

                    setAdminSuccess(`'${user.name}' 사용자가 삭제(비활성화)되었습니다.`);
                    await loadAdminUsers();
                } catch (err) {
                    console.error('Error deleting user:', err);
                    setAdminError('사용자 삭제 중 오류가 발생했습니다: ' + err.message);
                }
            };

            // 사용자 활성화 복원
            const handleRestoreUser = async (user) => {
                try {
                    const { error } = await supabase
                        .from('users')
                        .update({ is_active: true, updated_at: new Date().toISOString() })
                        .eq('id', user.id);

                    if (error) throw error;

                    setAdminSuccess(`'${user.name}' 사용자가 복원되었습니다.`);
                    await loadAdminUsers();
                } catch (err) {
                    console.error('Error restoring user:', err);
                    setAdminError('사용자 복원 중 오류가 발생했습니다: ' + err.message);
                }
            };

            // 수정 모드로 전환
            const startEditUser = (user) => {
                setEditingUser(user);
                setUserForm({
                    username: user.username,
                    name: user.name,
                    email: user.email || '',
                    password: '',
                    role: user.role,
                    phone: user.phone || '',
                    organization: user.organization || '',
                    position: user.position || ''
                });
                setShowUserForm(true);
                setAdminError('');
                setAdminSuccess('');
            };

            const roleLabels = {
                admin: '관리자',
                staff: '직원',
                participant: '참여자',
                viewer: '열람자'
            };

            // 관리자 페이지 진입 시 사용자 목록 로딩
            useEffect(() => {
                if (currentPage === 'admin' && adminUsers.length === 0 && !adminLoading) {
                    loadAdminUsers();
                }
            }, [currentPage]);

            // 회계가이드 페이지 렌더링

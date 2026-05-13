import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import AdminTools from './AdminTools';
import AppHeader from './AppHeader';

function FamilyDashboard({
  userGroup,
  userRole,
  expenses,
  personalExpenses,
  income,
  user,
  darkMode,
  setDarkMode,
  formatCurrency,
  formatDate,
  onSwitchToPersonal,
  onLogout,
  onSignIn,
  onOpenFamilyGroup
}) {
  const [categoryFilterMonth, setCategoryFilterMonth] = useState('current');
  const [transactionFilterMonth, setTransactionFilterMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [transactionType, setTransactionType] = useState('all');
  const [incomeDrawerOpen, setIncomeDrawerOpen] = useState(false);
  const [trendYear, setTrendYear] = useState(String(new Date().getFullYear()));
  const [expandedSections, setExpandedSections] = useState({
    monthlyContribution: false,
    allTimeContribution: false,
    personalSummary: false,
    categories: false
  });

  const COLORS = ['#2e7d32', '#1976d2', '#f57c00', '#7b1fa2', '#00897b', '#c62828', '#455a64'];

  if (!userGroup) {
    return (
      <div className={`family-dashboard loading ${darkMode ? 'dark-mode' : ''}`}>
        <p>Loading family data...</p>
      </div>
    );
  }

  const members = userGroup.members || [];
  const sharedExpenses = expenses || [];
  const personalExpenseList = personalExpenses || [];
  const incomeList = income || [];

  const parseISODate = (dateValue, endOfDay = false) => {
    if (!dateValue) return null;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      const date = dateValue.toDate();
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }
    if (dateValue instanceof Date) {
      const date = new Date(dateValue);
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }
    if (typeof dateValue !== 'string') return null;
    const [year, month, day] = dateValue.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  };

  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMemberName = (userId) => members.find((member) => member.userId === userId)?.name || 'Unknown';

  const getMonthKey = (dateValue) => {
    const date = parseISODate(dateValue);
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getMonthLabel = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    if (!year || !month) return 'Unknown';
    return new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  const getMonthRange = (monthKey) => {
    const [year, month] = monthKey.split('-').map(Number);
    return {
      startDate: new Date(year, month - 1, 1),
      endDate: new Date(year, month, 0, 23, 59, 59, 999)
    };
  };

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthRange = getMonthRange(currentMonthKey);
  const allTimeRange = {
    startDate: new Date(0),
    endDate: currentMonthRange.endDate
  };

  const expandExpensesForRange = (expenseList, startDate, endDate) => {
    const expanded = [];
    const seenKeys = new Set();

    expenseList.forEach((expense) => {
      const expenseStartDate = parseISODate(expense.date);
      if (!expenseStartDate) return;

      const addExpense = (date, isGenerated = false) => {
        if (date < startDate || date > endDate) return;
        const dateStr = formatDateToISO(date);
        const key = `${expense.id}-${dateStr}`;
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        expanded.push({
          ...expense,
          id: isGenerated ? key : expense.id,
          date: dateStr,
          isGenerated: expense.isGenerated || isGenerated
        });
      };

      if (!expense.isRecurring) {
        addExpense(expenseStartDate);
        return;
      }

      const expenseEndDate = expense.endDate ? parseISODate(expense.endDate, true) : null;
      if (expenseStartDate > endDate || (expenseEndDate && expenseEndDate < startDate)) return;

      const frequency = (expense.frequency || 'monthly').toLowerCase();
      let cursor = new Date(expenseStartDate);

      if (frequency === 'daily') {
        while (cursor <= endDate) {
          if (!expenseEndDate || cursor <= expenseEndDate) addExpense(new Date(cursor), true);
          cursor.setDate(cursor.getDate() + 1);
        }
        return;
      }

      if (frequency === 'weekly') {
        while (cursor <= endDate) {
          if (!expenseEndDate || cursor <= expenseEndDate) addExpense(new Date(cursor), true);
          cursor.setDate(cursor.getDate() + 7);
        }
        return;
      }

      if (frequency === 'yearly') {
        while (cursor <= endDate) {
          if (!expenseEndDate || cursor <= expenseEndDate) addExpense(new Date(cursor), true);
          cursor.setFullYear(cursor.getFullYear() + 1);
        }
        return;
      }

      const dayOfMonth = expenseStartDate.getDate();
      cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (cursor <= endDate) {
        const lastDayOfMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
        const occurrence = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(dayOfMonth, lastDayOfMonth));
        if (occurrence >= expenseStartDate && (!expenseEndDate || occurrence <= expenseEndDate)) {
          addExpense(occurrence, true);
        }
        cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      }
    });

    return expanded;
  };

  const allTimeSharedExpenses = expandExpensesForRange(sharedExpenses, allTimeRange.startDate, allTimeRange.endDate);
  const currentMonthSharedExpenses = expandExpensesForRange(sharedExpenses, currentMonthRange.startDate, currentMonthRange.endDate);
  const allTimePersonalExpenses = expandExpensesForRange(personalExpenseList, allTimeRange.startDate, allTimeRange.endDate);

  const isInvestmentExpense = (expense) => (
    expense.isSIPExpense ||
    expense.source === 'sip' ||
    expense.category === 'Investments'
  );

  const incomeThroughCurrentMonth = incomeList.filter((item) => {
    const date = parseISODate(item.date);
    return date && date <= allTimeRange.endDate;
  });
  const currentMonthIncome = incomeList.filter((item) => {
    const date = parseISODate(item.date);
    return date && date >= currentMonthRange.startDate && date <= currentMonthRange.endDate;
  });

  const sumAmount = (items) => items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const totalFamilyIncome = sumAmount(incomeThroughCurrentMonth);
  const monthlyFamilyIncome = sumAmount(currentMonthIncome);
  const totalSharedExpenses = sumAmount(allTimeSharedExpenses);
  const monthlySharedExpenses = sumAmount(currentMonthSharedExpenses);
  const totalFamilyBalance = totalFamilyIncome - totalSharedExpenses;
  const monthlyBalance = monthlyFamilyIncome - monthlySharedExpenses;
  const allTimeInvestmentTotal = sumAmount(allTimeSharedExpenses.filter(isInvestmentExpense));
  const monthlyInvestmentTotal = sumAmount(currentMonthSharedExpenses.filter(isInvestmentExpense));
  const monthlySharedExpenseExcludingInvestment = monthlySharedExpenses - monthlyInvestmentTotal;

  const buildMemberContribution = (expenseRows, incomeRows, denominator) => {
    const contributionMap = {};
    members.forEach((member) => {
      contributionMap[member.userId] = {
        id: member.userId,
        name: member.name,
        spent: 0,
        earned: 0,
        balance: 0,
        spendPercentage: 0
      };
    });

    expenseRows.forEach((expense) => {
      if (contributionMap[expense.createdBy]) {
        contributionMap[expense.createdBy].spent += parseFloat(expense.amount) || 0;
      }
    });

    incomeRows.forEach((item) => {
      if (contributionMap[item.userId]) {
        contributionMap[item.userId].earned += parseFloat(item.amount) || 0;
      }
    });

    return Object.values(contributionMap)
      .map((member) => ({
        ...member,
        balance: member.earned - member.spent,
        spendPercentage: denominator > 0 ? ((member.spent / denominator) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.spent - a.spent);
  };

  const memberMonthlyContributions = buildMemberContribution(currentMonthSharedExpenses, currentMonthIncome, monthlySharedExpenses);
  const memberAllTimeContributions = buildMemberContribution(allTimeSharedExpenses, incomeThroughCurrentMonth, totalSharedExpenses);

  const memberPersonalTotals = members.map((member) => {
    const memberExpenses = allTimePersonalExpenses.filter((expense) => expense.createdBy === member.userId);
    return {
      id: member.userId,
      name: member.name,
      personalTotal: sumAmount(memberExpenses),
      count: memberExpenses.length
    };
  }).filter((member) => member.personalTotal > 0).sort((a, b) => b.personalTotal - a.personalTotal);

  const monthOptions = (() => {
    const keys = new Set([currentMonthKey]);
    [...sharedExpenses, ...allTimeSharedExpenses, ...incomeThroughCurrentMonth].forEach((item) => {
      const key = getMonthKey(item.date);
      if (key) keys.add(key);
    });
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  })();

  const getCategoryRows = () => {
    const rows = categoryFilterMonth === 'all'
      ? allTimeSharedExpenses
      : categoryFilterMonth === 'current'
        ? currentMonthSharedExpenses
        : allTimeSharedExpenses.filter((expense) => getMonthKey(expense.date) === categoryFilterMonth);

    const categories = {};
    rows.forEach((expense) => {
      const category = expense.category || 'Other';
      categories[category] = (categories[category] || 0) + (parseFloat(expense.amount) || 0);
    });
    const total = Object.values(categories).reduce((sum, amount) => sum + amount, 0);
    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.value - a.value);
  };

  const categoryBreakdown = getCategoryRows();

  const selectedTransactionRange = getMonthRange(transactionFilterMonth);
  const transactionIncome = incomeList.filter((item) => {
    const date = parseISODate(item.date);
    return date && date >= selectedTransactionRange.startDate && date <= selectedTransactionRange.endDate;
  });
  const transactionSharedExpenses = expandExpensesForRange(sharedExpenses, selectedTransactionRange.startDate, selectedTransactionRange.endDate);

  const allMonthTransactions = [
    ...transactionSharedExpenses.map((expense) => ({
      ...expense,
      transactionType: isInvestmentExpense(expense) ? 'investment' : 'expense',
      memberName: getMemberName(expense.createdBy),
      title: expense.description || expense.category || 'Expense'
    })),
    ...transactionIncome.map((item) => ({
      ...item,
      transactionType: 'income',
      memberName: getMemberName(item.userId),
      title: item.source || 'Income'
    }))
  ];
  const recentTransactions = allMonthTransactions
    .filter((item) => transactionType === 'all' || item.transactionType === transactionType)
    .sort((a, b) => (parseISODate(b.date) || 0) - (parseISODate(a.date) || 0));
  const transactionSummary = {
    expense: sumAmount(allMonthTransactions.filter((item) => item.transactionType === 'expense')),
    investment: sumAmount(allMonthTransactions.filter((item) => item.transactionType === 'investment')),
    income: sumAmount(allMonthTransactions.filter((item) => item.transactionType === 'income'))
  };
  transactionSummary.all = transactionSummary.expense + transactionSummary.investment;
  const transactionBalanceLeft = transactionSummary.income - transactionSummary.all;
  const activeTransactionTotal = transactionSummary[transactionType] || 0;
  const activeTransactionLabel = transactionType === 'all'
    ? 'All'
    : transactionType === 'expense'
      ? 'Expenses'
      : transactionType === 'investment'
        ? 'Investment'
        : 'Income';

  const incomeByMember = members.map((member) => {
    const total = sumAmount(incomeThroughCurrentMonth.filter((item) => item.userId === member.userId));
    return { name: member.name, total };
  }).filter((item) => item.total > 0).sort((a, b) => b.total - a.total);

  const spendingComparison = memberAllTimeContributions.map((member) => ({
    name: member.name,
    spending: member.spent,
    percentage: totalSharedExpenses > 0 ? ((member.spent / totalSharedExpenses) * 100).toFixed(1) : '0.0'
  }));
  const yearOptions = (() => {
    const years = new Set([String(new Date().getFullYear())]);
    sharedExpenses.forEach((expense) => {
      const date = parseISODate(expense.date);
      if (date) years.add(String(date.getFullYear()));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  })();
  const monthlyTrendData = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthStart = new Date(parseInt(trendYear), monthIndex, 1);
    const monthEnd = new Date(parseInt(trendYear), monthIndex + 1, 0, 23, 59, 59, 999);
    const monthExpenses = expandExpensesForRange(sharedExpenses, monthStart, monthEnd);
    const investmentTotal = sumAmount(monthExpenses.filter(isInvestmentExpense));
    const expenseTotal = sumAmount(monthExpenses.filter((expense) => !isInvestmentExpense(expense)));

    return {
      month: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
      expense: expenseTotal,
      investment: investmentTotal
    };
  });

  const topSpender = memberAllTimeContributions[0] || { name: 'N/A', spent: 0 };
  const spendRate = monthlyFamilyIncome > 0 ? ((monthlySharedExpenses / monthlyFamilyIncome) * 100).toFixed(1) : '0.0';
  const investmentRate = monthlyFamilyIncome > 0 ? ((monthlyInvestmentTotal / monthlyFamilyIncome) * 100).toFixed(1) : '0.0';
  const investmentTarget = monthlyFamilyIncome * 0.4;
  const investmentGap = monthlyInvestmentTotal - investmentTarget;

  const renderContributionRows = (rows) => (
    <div className="table-wrapper">
      {rows.map((member, idx) => (
        <div key={member.id} className="contribution-row">
          <div className="row-member">
            <div className="member-avatar" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-stats">
                <span className="stat-income">Income {formatCurrency(member.earned)}</span>
                <span className="stat-expense">Shared {formatCurrency(member.spent)}</span>
              </div>
            </div>
          </div>
          <div className="member-contribution-details">
            <div className="spend-percentage">
              <div className="percentage-bar">
                <div className="percentage-fill" style={{ width: `${Math.min(parseFloat(member.spendPercentage), 100)}%` }}></div>
              </div>
              <span className="percentage-label">{member.spendPercentage}%</span>
            </div>
            <div className={`member-balance ${member.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(member.balance)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderCollapseHeader = (section, title, extraContent = null) => (
    <div className="collapsible-card-header">
      <button
        type="button"
        className="collapse-toggle-btn"
        onClick={() => toggleSection(section)}
        aria-expanded={expandedSections[section]}
      >
        <span className={`collapse-arrow ${expandedSections[section] ? 'expanded' : ''}`}>›</span>
        <span>{title}</span>
      </button>
      {extraContent}
    </div>
  );

  return (
    <div className={`family-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      <AppHeader
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onLogout={onLogout}
        onSignIn={onSignIn}
        userGroup={userGroup}
        onOpenFamilyGroup={onOpenFamilyGroup}
        onSwitchToPersonal={onSwitchToPersonal}
      />

      <div className="family-dashboard-title-row">
        <div>
          <h1 className="family-dashboard-title">{userGroup.name} Dashboard</h1>
          <p className="family-dashboard-subtitle">Shared family income, expenses, investments, and policies</p>
        </div>
      </div>

      <div className="family-summary-section">
        <button className="summary-card income-card clickable-summary-card" onClick={() => setIncomeDrawerOpen(true)}>
          <div className="card-content">
            <h3 className="card-title">Monthly Income</h3>
            <div className="card-amount">{formatCurrency(monthlyFamilyIncome)}</div>
            <p className="card-detail">{currentMonthIncome.length} income entries • Balance: {formatCurrency(monthlyBalance)}</p>
          </div>
        </button>

        <div className="summary-card expense-card">
          <div className="card-content">
            <h3 className="card-title">Monthly Shared Expense</h3>
            <div className="card-amount">{formatCurrency(monthlySharedExpenseExcludingInvestment)}</div>
            <p className="card-detail">Excludes investments</p>
          </div>
        </div>

        <div className="summary-card investment-card">
          <div className="card-content">
            <h3 className="card-title">Monthly Shared Investment</h3>
            <div className="card-amount">{formatCurrency(monthlyInvestmentTotal)}</div>
            <p className="card-detail">SIPs and investments</p>
          </div>
        </div>

        <div className={`summary-card balance-card family-all-time-summary ${totalFamilyBalance >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-content">
            <h3 className="card-title">All Time Summary</h3>
            <div className="summary-metric-row">
              <span>Income</span>
              <strong>{formatCurrency(totalFamilyIncome)}</strong>
            </div>
            <div className="summary-metric-row">
              <span>Balance</span>
              <strong>{formatCurrency(totalFamilyBalance)}</strong>
            </div>
            <div className="summary-metric-row">
              <span>Investment</span>
              <strong>{formatCurrency(allTimeInvestmentTotal)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="family-main-grid">
        <div className="family-card member-contributions-card">
          {renderCollapseHeader('monthlyContribution', 'Member Contribution - Current Month')}
          {expandedSections.monthlyContribution && renderContributionRows(memberMonthlyContributions)}
        </div>

        <div className="family-card member-contributions-card">
          {renderCollapseHeader('allTimeContribution', 'Member Contribution - All Time')}
          {expandedSections.allTimeContribution && renderContributionRows(memberAllTimeContributions)}
        </div>

        <div className="family-card personal-expense-summary-card">
          {renderCollapseHeader('personalSummary', 'Personal Expense Summary')}
          {expandedSections.personalSummary && (memberPersonalTotals.length > 0 ? (
            <>
              <div className="personal-totals-container">
                {memberPersonalTotals.map((member, idx) => (
                  <div key={member.id} className="personal-total-card">
                    <div className="member-avatar-small" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="personal-details">
                      <div className="member-name-small">{member.name}</div>
                      <div className="personal-amount">{formatCurrency(member.personalTotal)}</div>
                      <div className="personal-percentage">{member.count} expense{member.count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="personal-summary-footer">
                <div className="total-personal">
                  <span>Total Personal Expenses</span>
                  <span className="total-amount">{formatCurrency(sumAmount(allTimePersonalExpenses))}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="no-data">No personal expenses found</p>
          ))}
        </div>

        <div className="family-card category-breakdown-card">
          {renderCollapseHeader('categories', 'Shared Expense Categories', expandedSections.categories ? (
            <select
              className="category-month-filter"
              value={categoryFilterMonth}
              onChange={(event) => setCategoryFilterMonth(event.target.value)}
            >
              <option value="current">Current Month</option>
              <option value="all">All Time</option>
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>{getMonthLabel(monthKey)}</option>
              ))}
            </select>
          ) : null)}
          {expandedSections.categories && (categoryBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={82}
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data">No shared expense categories for this period</p>
          ))}
        </div>
      </div>

      <div className="family-insights-section">
        <h2 className="insights-title">Family Insights</h2>
        <div className="insights-grid">
          <div className="insight-card metric-card">
            <div className="insight-icon">%</div>
            <div className="insight-content">
              <h3 className="insight-label">Monthly Spend Rate</h3>
              <p className="insight-value">{spendRate}%</p>
              <p className="insight-detail">{formatCurrency(monthlySharedExpenses)} of {formatCurrency(monthlyFamilyIncome)}</p>
            </div>
          </div>
          <div className="insight-card metric-card">
            <div className="insight-icon">₹</div>
            <div className="insight-content">
              <h3 className="insight-label">Monthly Investment</h3>
              <p className="insight-value">{formatCurrency(monthlyInvestmentTotal)}</p>
              <p className="insight-detail">{investmentRate}% of monthly income • All time {formatCurrency(allTimeInvestmentTotal)}</p>
            </div>
          </div>
          <div className="insight-card metric-card">
            <div className="insight-icon">40</div>
            <div className="insight-content">
              <h3 className="insight-label">40% Investment Target</h3>
              <p className={`insight-value ${investmentGap >= 0 ? 'positive' : 'negative'}`}>
                {investmentGap >= 0 ? '+' : ''}{formatCurrency(investmentGap)}
              </p>
              <p className="insight-detail">Target: {formatCurrency(investmentTarget)}</p>
            </div>
          </div>
          <div className="insight-card metric-card">
            <div className="insight-icon">#1</div>
            <div className="insight-content">
              <h3 className="insight-label">Top Contributor</h3>
              <p className="insight-value">{topSpender.name}</p>
              <p className="insight-detail">{formatCurrency(topSpender.spent)} shared spend</p>
            </div>
          </div>
        </div>

        <div className="insights-detail-grid">
          <div className="insight-card spending-comparison-card">
            <h3 className="insight-card-title">Shared Spend Comparison</h3>
            <div className="comparison-list">
              {spendingComparison.map((item) => (
                <div key={item.name} className="comparison-item">
                  <div className="comparison-member">
                    <span className="comparison-name">{item.name}</span>
                    <span className="comparison-amount">{formatCurrency(item.spending)}</span>
                  </div>
                  <div className="comparison-bar-container">
                    <div className="comparison-bar" style={{ width: `${Math.min(parseFloat(item.percentage), 100)}%` }}></div>
                  </div>
                  <span className="comparison-percentage">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-card income-breakdown-card">
            <h3 className="insight-card-title">Income By Member</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={incomeByMember}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#1976d2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="family-card family-trend-card">
        <div className="chart-header">
          <h2 className="card-heading">Monthly Expense & Investment Trend</h2>
          <select
            className="category-month-filter"
            value={trendYear}
            onChange={(event) => setTrendYear(event.target.value)}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="expense" name="Expense" stroke="#FF9800" strokeWidth={3} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="investment" name="Investment" stroke="#7b1fa2" strokeWidth={3} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="family-card recent-transactions-card">
        <div className="transactions-header">
          <h2 className="card-heading">Recent Transactions</h2>
          <div className="family-transaction-controls">
            <select
              className="category-month-filter"
              value={transactionFilterMonth}
              onChange={(event) => setTransactionFilterMonth(event.target.value)}
            >
              {monthOptions.map((monthKey) => (
                <option key={monthKey} value={monthKey}>{getMonthLabel(monthKey)}</option>
              ))}
            </select>
            <div className="filter-buttons">
              {['all', 'expense', 'investment', 'income'].map((type) => (
                <button
                  key={type}
                  className={`filter-btn ${transactionType === type ? 'active' : ''}`}
                  onClick={() => setTransactionType(type)}
                >
                  {type === 'all' ? 'All' : type === 'expense' ? 'Expenses' : type === 'investment' ? 'Investment' : 'Income'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="transaction-summary-panel">
          <p className="transaction-summary-line">
            <span className="transaction-summary-label">Total {activeTransactionLabel}:</span>
            <strong className={`transaction-summary-amount ${transactionType}`}>
              {transactionType === 'income' ? '+' : transactionType === 'all' ? '' : '-'}{formatCurrency(activeTransactionTotal)}
            </strong>
          </p>
          <p className="transaction-summary-period">{getMonthLabel(transactionFilterMonth)}</p>
          {transactionType === 'all' && (
            <p className="transaction-summary-period">
              Balance left: {formatCurrency(transactionBalanceLeft)}
            </p>
          )}
        </div>

        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map((transaction) => (
              <div key={`${transaction.transactionType}-${transaction.id}`} className={`transaction-item ${transaction.transactionType}`}>
                <div className="transaction-content">
                  <div className="transaction-header">
                    <div className="transaction-title">{transaction.title}</div>
                    <div className={`transaction-amount ${transaction.transactionType}`}>
                      {transaction.transactionType === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-member">{transaction.memberName}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                  {transaction.description && <p className="transaction-description">{transaction.description}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No transactions found for this period</p>
        )}
      </div>

      {incomeDrawerOpen && (
        <>
          <div className="family-drawer-overlay" onClick={() => setIncomeDrawerOpen(false)}></div>
          <aside className="family-income-drawer">
            <div className="drawer-header">
              <h3 className="drawer-title">Family Income Details</h3>
              <button className="drawer-close-btn" onClick={() => setIncomeDrawerOpen(false)}>×</button>
            </div>
            <div className="drawer-content">
              <div className="drawer-summary">
                <strong>{formatCurrency(totalFamilyIncome)}</strong>
                <span>Total income through {getMonthLabel(currentMonthKey)}</span>
              </div>
              <div className="transactions-list">
                {incomeThroughCurrentMonth
                  .slice()
                  .sort((a, b) => (parseISODate(b.date) || 0) - (parseISODate(a.date) || 0))
                  .map((item) => (
                    <div key={item.id} className="transaction-item income">
                      <div className="transaction-content">
                        <div className="transaction-header">
                          <div className="transaction-title">{item.source || 'Income'}</div>
                          <div className="transaction-amount income">+{formatCurrency(item.amount)}</div>
                        </div>
                        <div className="transaction-footer">
                          <span className="transaction-member">{getMemberName(item.userId)}</span>
                          <span className="transaction-date">{formatDate(item.date)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </aside>
        </>
      )}

      <AdminTools
        currentUser={user}
        members={members}
        groupId={userGroup.id}
        isAdmin={userRole === 'admin'}
      />
    </div>
  );
}

export default FamilyDashboard;

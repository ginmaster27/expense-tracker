import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import logo from './assets/logo.png';
import FamilyGroupManager from './FamilyGroupManager';
import HamburgerMenu from './HamburgerMenu';

function Dashboard({
  expenses,
  amount,
  setAmount,
  category,
  setCategory,
  error,
  setError,
  expenseDate,
  setExpenseDate,
  expenseDescription,
  setExpenseDescription,
  isExpenseRecurring,
  setIsExpenseRecurring,
  expenseFrequency,
  setExpenseFrequency,
  expenseEndDate,
  setExpenseEndDate,
  expenseType,
  setExpenseType,
  darkMode,
  setDarkMode,
  onAddExpense,
  formatCurrency,
  totalAmount,
  getCategoryBreakdown,
  getCategoryBreakdownByFilter,
  user,
  authLoading,
  onSignInWithGoogle,
  onLogout,
  income,
  incomeAmount,
  setIncomeAmount,
  incomeSource,
  setIncomeSource,
  incomeDate,
  setIncomeDate,
  totalIncome,
  onAddIncome,
  onDeleteIncome,
  selectedMonth,
  selectedYear,
  getFilteredIncomeTotal,
  getFilteredTotal,
  getRemainingBalance,
  getExpensesByWeek,
  getMonthlyTrendData,
  getMonthlyInsight,
  getYearlyTotalIncome,
  getMonthlyIncomeBreakdown,
  getFilteredExpensesForChartsRange,
  showExpenseForm,
  setShowExpenseForm,
  showIncomeForm,
  setShowIncomeForm,
  onEditExpense,
  editingExpenseId,
  onEditIncome,
  editingIncomeId,
  onCancelEdit,
  formatDate,
  expensesLoading,
  isSubmittingExpense,
  isSubmittingIncome,
  userGroup,
  userRole,
  onCreateGroup,
  onJoinGroup,
  onLeaveGroup,
  onGenerateCode,
  groupLoading,
  showGroupManager,
  setShowGroupManager,
  viewingFamilyDashboard,
  setViewingFamilyDashboard,
  showRecurringEditScope,
  setShowRecurringEditScope,
  recurringEditInstance,
  onRecurringEditScopeSelect
}) {
  const navigate = useNavigate();
  const incomeFormRef = useRef(null);
  
  // Wrapper functions to close modals after form submission
  const handleAddExpenseWithClose = async (e) => {
    try {
      await onAddExpense(e);
      // Close modal after successful submission
      setShowExpenseForm(false);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleAddIncomeWithClose = async (e) => {
    try {
      await onAddIncome(e);
      // Close modal after successful submission
      setShowIncomeForm(false);
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };
  
  // State for drilldowns and filters
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [weeklyViewMode, setWeeklyViewMode] = useState('categories'); // 'categories' or 'all-expenses'
  const [showAllExpensesDrawer, setShowAllExpensesDrawer] = useState(false);
  const [chartFilter, setChartFilter] = useState('current'); // 'current', 'previous', '3months', '6months'

  // Get all expenses for chart filter (regular + recurring instances)
  const getChartFilteredExpenses = () => {
    if (!getFilteredExpensesForChartsRange) {
      return [];
    }
    return getFilteredExpensesForChartsRange(chartFilter);
  };

  const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea'];
  
  // Single source of truth for filtered expenses - calculated once per render
  const filteredExpenses = getChartFilteredExpenses();

  // Use filtered category breakdown based on selected date range
  const categoryBreakdown = getCategoryBreakdownByFilter(chartFilter);
  
  // Get month name from selected month number
  const getMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNum = parseInt(selectedMonth);
    return months[monthNum - 1] || 'Current';
  };

  // Get readable label for current filter
  const getFilterLabel = () => {
    switch (chartFilter) {
      case 'current':
        return 'Current Month';
      case 'previous':
        return 'Previous Month';
      case '3months':
        return 'Last 3 Months';
      case '6months':
        return 'Last 6 Months';
      default:
        return 'Current Month';
    }
  };
  
  // Get today's date in YYYY-MM-DD format for max date on input
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const maxDate = getMaxDate();

  // Get highest spending category from filtered data
  const getHighestSpendingCategoryByFilter = () => {
    if (categoryBreakdown.length === 0) return null;
    return categoryBreakdown[0]; // Already sorted by getCategoryBreakdownByFilter
  };

  // Get spending pattern from filtered data
  const getSpendingPatternByFilter = () => {
    let weekendTotal = 0;
    let weekdayTotal = 0;

    filteredExpenses.forEach((expense) => {
      const expenseDate = new Date(expense.date);
      const dayOfWeek = expenseDate.getDay();
      const amount = parseFloat(expense.amount) || 0;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotal += amount;
      } else {
        weekdayTotal += amount;
      }
    });

    return { weekendTotal, weekdayTotal };
  };

  // Get average daily spending from filtered data
  const getAverageDailySpendingByFilter = () => {
    if (filteredExpenses.length === 0) return 0;

    const totalSpending = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate unique days with expenses
    const uniqueDays = new Set();
    filteredExpenses.forEach((expense) => {
      uniqueDays.add(expense.date);
    });

    return totalSpending / uniqueDays.size;
  };

  // Get highest spending day from filtered data
  const getHighestSpendingDayByFilter = () => {
    if (filteredExpenses.length === 0) return null;

    const dayTotals = {};
    const dayDates = {};

    filteredExpenses.forEach((expense) => {
      const date = expense.date;
      if (!dayTotals[date]) {
        dayTotals[date] = 0;
        dayDates[date] = new Date(date);
      }
      dayTotals[date] += expense.amount;
    });

    let highestDay = null;
    let highestAmount = 0;

    Object.entries(dayTotals).forEach(([date, total]) => {
      if (total > highestAmount) {
        highestAmount = total;
        highestDay = {
          date,
          total,
          dayName: dayDates[date].toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
        };
      }
    });

    return highestDay;
  };

  // Calculate amount saved this month
  const getAmountSaved = () => {
    const filteredIncome = getFilteredIncomeTotal ? getFilteredIncomeTotal() : totalIncome;
    const filteredExpenses = getFilteredTotal ? getFilteredTotal() : totalAmount;
    return Math.max(filteredIncome - filteredExpenses, 0);
  };

  // Handle navigation to expenses page
  const handleExpenseCardClick = () => {
    navigate('/expenses');
  };

  // Handle smooth scroll to income section
  const handleIncomeCardClick = () => {
    setShowIncomeForm(true);
    setTimeout(() => {
      if (incomeFormRef.current) {
        incomeFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 0);
  };

  // Handle week bar click for drilldown
  const handleWeekClick = (data) => {
    const weekData = getExpensesByWeek().find(week => week.label === data.label);
    if (weekData) {
      setSelectedWeek(weekData);
    }
  };

  // Close the week drawer
  const closeWeekDrawer = () => {
    setSelectedWeek(null);
    setWeeklyViewMode('categories');
  };

  // Calculate category breakdown for a specific week
  const getCategoryBreakdownForWeek = (weekData) => {
    const categories = {};
    
    if (weekData && weekData.expenses) {
      weekData.expenses.forEach((expense) => {
        if (!categories[expense.category]) {
          categories[expense.category] = 0;
        }
        categories[expense.category] += expense.amount;
      });
    }

    return Object.entries(categories).map(([category, total]) => ({
      category,
      total
    }));
  };

  // Toggle between category view and all expenses view in weekly drawer
  const toggleWeeklyViewMode = (mode) => {
    setWeeklyViewMode(mode);
  };

  // Handlers for all expenses drawer
  const openAllExpensesDrawer = () => {
    setShowAllExpensesDrawer(true);
  };

  const closeAllExpensesDrawer = () => {
    setShowAllExpensesDrawer(false);
  };
  
  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container">
        <div className="header">
          <div className="header-top">
            <div className="header-top-right">
              <button
                className={`theme-toggle ${darkMode ? 'toggle-active' : ''}`}
                onClick={() => setDarkMode(!darkMode)}
                title="Toggle dark mode"
                aria-label="Toggle dark mode"
              >
                <span className="toggle-switch"></span>
              </button>

              {!authLoading && (
                <div className="auth-section">
                  {user ? (
                    <div className="user-profile-section">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="user-avatar-small" />
                      ) : (
                        <div className="user-avatar-fallback-small">👤</div>
                      )}
                      <span className="user-name-small">{user.displayName || user.email.split('@')[0]}</span>
                      {userGroup && (
                        <span className="group-badge-small">👨‍👩‍👧‍👦</span>
                      )}
                      {userGroup && (
                        <button
                          className="family-dashboard-btn"
                          onClick={() => setViewingFamilyDashboard(true)}
                          title="View family dashboard"
                          aria-label="View family dashboard"
                        >
                          📊
                        </button>
                      )}
                      <button
                        className="family-btn"
                        onClick={() => setShowGroupManager(true)}
                        title="Manage family group"
                        aria-label="Manage family group"
                      >
                        👨‍👩‍👧‍👦
                      </button>
                      <button
                        className="logout-btn"
                        onClick={onLogout}
                        title="Logout"
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </div>
                  ) : (
                    <button
                      className="google-login-btn"
                      onClick={onSignInWithGoogle}
                      title="Sign in with Google"
                      aria-label="Sign in with Google"
                    >
                      Sign in with Google
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="header-bottom">
            <div className="header-left">
              <img src={logo} alt="Raashi Logo" className="logo-image" />
              <h1 className="title">Expense Tracker</h1>
            </div>

            <div className="header-right">
              <HamburgerMenu 
                user={user} 
                onLogout={onLogout} 
                userGroup={userGroup} 
                darkMode={darkMode} 
              />
            </div>
          </div>
        </div>

        <div className="content-wrapper">
        {(totalIncome > 0 || totalAmount > 0 || expensesLoading) && (
          <>
            {expensesLoading && user ? (
              <div className="financial-cards-loading">
                <div className="skeleton-financial-card">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-amount"></div>
                  <div className="skeleton-line"></div>
                </div>
                <div className="skeleton-financial-card">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-amount"></div>
                  <div className="skeleton-line"></div>
                </div>
                <div className="skeleton-financial-card">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-amount"></div>
                  <div className="skeleton-line"></div>
                </div>
              </div>
            ) : (
              <>
                {(totalIncome > 0 || totalAmount > 0) && (
                  <div className="financial-cards">
                    {income.length > 0 && (
                      <div 
                        className="financial-card income-card interactive-card" 
                        onClick={handleIncomeCardClick}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleIncomeCardClick();
                          }
                        }}
                      >
                        <div className="card-header">
                          <h4 className="card-title">Monthly Income</h4>
                        </div>
                        <div className="card-amount income-amount">
                          {formatCurrency(getFilteredIncomeTotal())}
                        </div>
                        <p className="card-subtitle">{income.length} source{income.length !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                    <div 
                      className="financial-card expense-card interactive-card" 
                      onClick={handleExpenseCardClick}
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleExpenseCardClick();
                        }
                      }}
                    >
                      <div className="card-header">
                        <h4 className="card-title">Monthly Expenses</h4>
                      </div>
                      <div className="card-amount expense-amount">
                        {formatCurrency(getFilteredTotal())}
                      </div>
                      <p className="card-subtitle">{expenses.length} expenses (includes recurring)</p>
                    </div>
                    <div className={`financial-card balance-card ${getRemainingBalance() >= 0 ? 'balance-positive' : 'balance-negative'}`}>
                      <div className="card-header">
                        <h4 className="card-title">Remaining Balance</h4>
                      </div>
                      <div className={`card-amount balance-amount ${getRemainingBalance() >= 0 ? 'amount-positive' : 'amount-negative'}`}>
                        {getRemainingBalance() >= 0 ? '+' : '-'} {formatCurrency(Math.abs(getRemainingBalance()))}
                      </div>
                      <p className="card-subtitle">{getRemainingBalance() >= 0 ? 'Money left' : 'Over budget'}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="action-btn expense-action-btn"
            onClick={() => {
              onCancelEdit();
              setShowExpenseForm(true);
            }}
            title="Add a new expense"
            aria-label="Add a new expense"
          >
            <span className="btn-icon">➕</span>
            <span className="btn-text">Add Expense</span>
          </button>
          <button
            className="action-btn income-action-btn"
            onClick={() => {
              onCancelEdit();
              setShowIncomeForm(true);
            }}
            title="Add a new income"
            aria-label="Add a new income"
          >
            <span className="btn-icon">➕</span>
            <span className="btn-text">Add Income</span>
          </button>
        </div>

        {income.length > 0 && (
          <div className="income-section">
            <div className="yearly-income-summary">
              <h3 className="section-title">Total Income (Current Year)</h3>
              <div className="yearly-income-amount">{formatCurrency(getYearlyTotalIncome())}</div>
              <p className="section-subtitle">{income.length} income entries recorded</p>
            </div>

            {getMonthlyIncomeBreakdown().length > 0 && (
              <div className="monthly-income-breakdown">
                <h4 className="breakdown-title">Monthly Breakdown</h4>
                <div className="monthly-income-list">
                  {getMonthlyIncomeBreakdown().map((monthData) => (
                    <div key={monthData.monthNum} className="monthly-income-item">
                      <span className="month-name">{monthData.month}</span>
                      <span className="month-amount">{formatCurrency(monthData.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="income-list">
              {income.map((inc) => (
                <div key={inc.id} className="income-item">
                  <div className="income-info">
                    <div className="income-source">{inc.source || 'Other'}</div>
                    <div className="income-date">{inc.date}</div>
                  </div>
                  <div className="income-right">
                    <div className="income-amount-item">+ {formatCurrency(inc.amount)}</div>
                    <button
                      className="edit-btn"
                      onClick={() => onEditIncome(inc.id)}
                      title="Edit this income"
                      aria-label="Edit income"
                    >
                      ✏️
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => onDeleteIncome(inc.id)}
                      title="Delete this income"
                      aria-label="Delete income"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalAmount > 0 && (
          <div className="dashboard-summary">
            <h3 className="summary-title">Total Expenses</h3>
            <div className="summary-amount">{formatCurrency(totalAmount)}</div>
            <p className="summary-subtitle">{expenses.length} expenses recorded</p>
            {getMonthlyInsight() && (
              <p className={`summary-insight ${getMonthlyInsight().percentage > 0 ? 'insight-up' : 'insight-down'}`}>
                {getMonthlyInsight().message}
              </p>
            )}
          </div>
        )}

        {(totalAmount > 0 || expensesLoading) && (getMonthlyTrendData().length > 0 || (expensesLoading && user)) && (
          <div className="monthly-trend-chart">
            <h3 className="chart-title">Monthly Trend (Last 6 Months)</h3>
            
            {expensesLoading && user ? (
              <div className="chart-loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart
                    data={getMonthlyTrendData()}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis 
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={{ stroke: 'var(--border-color)' }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: `1px solid var(--border-color)`,
                        borderRadius: '8px',
                        color: 'var(--text-primary)'
                      }}
                      labelStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px', color: 'var(--text-secondary)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="var(--accent-primary)" 
                      name="Total Expenses"
                      strokeWidth={2}
                      dot={{ fill: 'var(--accent-primary)', r: 5 }}
                      activeDot={{ r: 7 }}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {((totalAmount > 0 || expensesLoading) && getExpensesByWeek().length > 0) || (expensesLoading && user) ? (
          <div className="weekly-expenses-chart">
            <h3 className="chart-title">Weekly Expenses - {getMonthName()}</h3>
            
            {expensesLoading && user ? (
              <div className="chart-loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={getExpensesByWeek()}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                      <XAxis 
                        dataKey="label" 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border-color)' }}
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor: 'var(--bg-secondary)',
                          border: `1px solid var(--border-color)`,
                          borderRadius: '8px',
                          color: 'var(--text-primary)'
                        }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px', color: 'var(--text-secondary)' }}
                      />
                      <Bar 
                        dataKey="total" 
                        fill="var(--accent-primary)" 
                        name="Expenses"
                        radius={[8, 8, 0, 0]}
                        onClick={(data) => handleWeekClick(data)}
                        style={{ cursor: 'pointer' }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="weekly-summary">
                  {getExpensesByWeek().map((week) => {
                    const startDateStr = week.startDate ? week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <div 
                        key={week.label} 
                        className="weekly-item interactive-weekly-item"
                        onClick={() => handleWeekClick({ label: week.label })}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            handleWeekClick({ label: week.label });
                          }
                        }}
                      >
                        <span className="weekly-label">{week.label} ({startDateStr})</span>
                        <span className="weekly-amount">{formatCurrency(week.total)}</span>
                        <span className="weekly-count">({week.count} expense{week.count !== 1 ? 's' : ''})</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Chart Filter */}
        {totalAmount > 0 && (
          <div className="chart-filter-section">
            <div className="filter-controls">
              <label htmlFor="chart-filter" className="filter-label">Filter Charts:</label>
              <select
                id="chart-filter"
                className="chart-filter-select"
                value={chartFilter}
                onChange={(e) => setChartFilter(e.target.value)}
              >
                <option value="current">Current Month</option>
                <option value="previous">Previous Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
              </select>
            </div>
            <div className="filter-status">
              <span className="status-label">Viewing:</span>
              <span className="status-value">{getFilterLabel()}</span>
            </div>
          </div>
        )}

        {categoryBreakdown.length > 0 && (
          <div className="category-breakdown">
            <h3 className="breakdown-title">Category Breakdown</h3>
            
            <div className="breakdown-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, total }) => `${category}: ${formatCurrency(total)}`}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="breakdown-list">
              {categoryBreakdown.map((item) => (
                <div key={item.category} className="breakdown-item">
                  <span className="breakdown-category">{item.category}</span>
                  <span className="breakdown-amount">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>

            <button 
              className="view-all-btn"
              onClick={openAllExpensesDrawer}
              title="View all expenses"
              aria-label="View all expenses"
            >
              📋 View All Expenses
            </button>
          </div>
        )}

        {totalAmount > 0 && (
          <div className="insights-section">
            <h3 className="insights-title">📊 Your Insights</h3>
            <div className="insights-grid">
              {getHighestSpendingCategoryByFilter() && (
                <div className="insight-card">
                  <div className="insight-icon">🎯</div>
                  <div className="insight-content">
                    <p className="insight-label">Highest Spending</p>
                    <p className="insight-value">
                      Your highest spending category is <strong>{getHighestSpendingCategoryByFilter().category}</strong>
                    </p>
                    <p className="insight-amount">{formatCurrency(getHighestSpendingCategoryByFilter().total)}</p>
                  </div>
                </div>
              )}

              {totalAmount > 0 && (
                <div className="insight-card">
                  <div className="insight-icon">📅</div>
                  <div className="insight-content">
                    <p className="insight-label">Spending Pattern</p>
                    <p className="insight-value">
                      {getSpendingPatternByFilter().weekendTotal > getSpendingPatternByFilter().weekdayTotal
                        ? '💸 You spent more on weekends'
                        : '📌 You spent more on weekdays'}
                    </p>
                    <p className="insight-breakdown">
                      Weekends: {formatCurrency(getSpendingPatternByFilter().weekendTotal)} | 
                      Weekdays: {formatCurrency(getSpendingPatternByFilter().weekdayTotal)}
                    </p>
                  </div>
                </div>
              )}

              {getAverageDailySpendingByFilter() > 0 && (
                <div className="insight-card">
                  <div className="insight-icon">💰</div>
                  <div className="insight-content">
                    <p className="insight-label">Daily Average</p>
                    <p className="insight-value">
                      You spend an average of <strong>{formatCurrency(getAverageDailySpendingByFilter())}</strong> per day
                    </p>
                  </div>
                </div>
              )}

              {getHighestSpendingDayByFilter() && (
                <div className="insight-card">
                  <div className="insight-icon">📈</div>
                  <div className="insight-content">
                    <p className="insight-label">Highest Spending Day</p>
                    <p className="insight-value">
                      Your biggest spending was on <strong>{getHighestSpendingDayByFilter().dayName}</strong>
                    </p>
                    <p className="insight-breakdown">
                      {getHighestSpendingDayByFilter().date} • {formatCurrency(getHighestSpendingDayByFilter().total)}
                    </p>
                  </div>
                </div>
              )}

              {totalIncome > 0 && (
                <div className="insight-card">
                  <div className="insight-icon">🎁</div>
                  <div className="insight-content">
                    <p className="insight-label">Amount Saved</p>
                    <p className="insight-value">
                      You saved <strong>{formatCurrency(getAmountSaved())}</strong> this month
                    </p>
                    <p className="insight-breakdown">
                      Income: {formatCurrency(totalIncome)} - Expenses: {formatCurrency(totalAmount)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {expenses.length === 0 && (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">💰</div>
              <h3 className="empty-title">No expenses yet</h3>
              <p className="empty-message">Start tracking your finances to see insights and analytics!</p>
              <button className="empty-cta" onClick={() => setShowExpenseForm(true)}>
                ➕ Add Your First Expense
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Week Drilldown Drawer */}
      {selectedWeek && (
        <>
          <div className="drawer-overlay" onClick={closeWeekDrawer}></div>
          <div className="week-drawer">
            <div className="drawer-header">
              <h3 className="drawer-title">{selectedWeek.label} Expenses</h3>
              <button 
                className="drawer-close-btn" 
                onClick={closeWeekDrawer}
                title="Close"
                aria-label="Close week details"
              >
                ✕
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="drawer-mode-toggle">
              <button
                className={`mode-btn ${weeklyViewMode === 'categories' ? 'active' : ''}`}
                onClick={() => toggleWeeklyViewMode('categories')}
              >
                📊 By Category
              </button>
              <button
                className={`mode-btn ${weeklyViewMode === 'all-expenses' ? 'active' : ''}`}
                onClick={() => toggleWeeklyViewMode('all-expenses')}
              >
                📋 All Expenses
              </button>
            </div>

            <div className="drawer-content">
              {selectedWeek.expenses && selectedWeek.expenses.length > 0 ? (
                <>
                  <div className="drawer-summary">
                    <div className="summary-row">
                      <span className="summary-label">Total Expenses:</span>
                      <span className="summary-value">{formatCurrency(selectedWeek.total)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Number of Expenses:</span>
                      <span className="summary-value">{selectedWeek.count}</span>
                    </div>
                    {selectedWeek.startDate && (
                      <div className="summary-row">
                        <span className="summary-label">Period:</span>
                        <span className="summary-value">
                          {selectedWeek.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedWeek.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {weeklyViewMode === 'categories' ? (
                    // Category Breakdown View
                    <div className="drawer-categories-list">
                      <h4 className="list-subtitle">Spending by Category</h4>
                      {getCategoryBreakdownForWeek(selectedWeek).map((item) => (
                        <div key={item.category} className="drawer-category-item">
                          <span className="category-name">{item.category}</span>
                          <span className="category-amount">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // All Expenses View
                    <div className="drawer-expenses-list">
                      {selectedWeek.expenses.map((expense) => (
                        <div key={expense.id} className="drawer-expense-item">
                          <div className="item-header">
                            <div className="item-category">
                              {expense.category}
                              {expense.type === 'shared' && (
                                <span className="expense-type-badge shared">👥 Shared</span>
                              )}
                              {expense.type === 'personal' && (
                                <span className="expense-type-badge personal">🔒 Personal</span>
                              )}
                            </div>
                            <div className="item-amount">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                          {expense.description && (
                            <div className="item-description">
                              {expense.description}
                            </div>
                          )}
                          <div className="item-date">
                            {formatDate(expense.date)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="drawer-empty">
                  <p>No expenses for this week</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* All Expenses Drawer */}
      {showAllExpensesDrawer && (
        <>
          <div className="drawer-overlay" onClick={closeAllExpensesDrawer}></div>
          <div className="week-drawer all-expenses-drawer">
            <div className="drawer-header">
              <h3 className="drawer-title">All Expenses - {getFilterLabel()}</h3>
              <button 
                className="drawer-close-btn" 
                onClick={closeAllExpensesDrawer}
                title="Close"
                aria-label="Close all expenses"
              >
                ✕
              </button>
            </div>

            <div className="drawer-content">
              {getChartFilteredExpenses().length > 0 ? (
                <>
                  {(() => {
                    const filteredExpenses = getChartFilteredExpenses();
                    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                    const avgAmount = filteredExpenses.length > 0 ? totalAmount / filteredExpenses.length : 0;
                    
                    return (
                      <>
                        <div className="drawer-summary">
                          <div className="summary-row">
                            <span className="summary-label">Total Expenses:</span>
                            <span className="summary-value">{formatCurrency(totalAmount)}</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">Number of Expenses:</span>
                            <span className="summary-value">{filteredExpenses.length}</span>
                          </div>
                          <div className="summary-row">
                            <span className="summary-label">Average per Expense:</span>
                            <span className="summary-value">{formatCurrency(avgAmount)}</span>
                          </div>
                        </div>

                        <div className="drawer-expenses-list">
                          {filteredExpenses.map((expense) => (
                            <div key={expense.id} className="drawer-expense-item">
                              <div className="item-header">
                                <div className="item-category">
                                  {expense.category}
                                  {expense.type === 'shared' && (
                                    <span className="expense-type-badge shared">👥 Shared</span>
                                  )}
                                  {expense.type === 'personal' && (
                                    <span className="expense-type-badge personal">🔒 Personal</span>
                                  )}
                                  {expense.isGenerated && (
                                    <span className="expense-type-badge recurring">🔄 Recurring</span>
                                  )}
                                </div>
                                <div className="item-amount">
                                  {formatCurrency(expense.amount)}
                                </div>
                              </div>
                              {expense.description && (
                                <div className="item-description">
                                  {expense.description}
                                </div>
                              )}
                              <div className="item-date">
                                {formatDate(expense.date)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="drawer-empty">
                  <p>No expenses to display</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

        {/* Form Modal Overlay */}
        {(showExpenseForm || showIncomeForm) && (
          <>
            <div 
              className="form-modal-backdrop"
              onClick={() => {
                onCancelEdit();
                setShowExpenseForm(false);
                setShowIncomeForm(false);
              }}
              aria-hidden="true"
            />
            <div className="form-modal-wrapper">
              {showExpenseForm && (
                <form className="form-modal-content expense-form" onSubmit={handleAddExpenseWithClose}>
                  <div className="form-header">
                    <div className="form-title-section">
                      <h2 className="form-title">
                        {editingExpenseId ? '✏️ Edit Expense' : '➕ Add Expense'}
                      </h2>
                      {editingExpenseId && (
                        <p className="form-subtitle">
                          {editingExpenseId.startsWith('override-')
                            ? '📅 Editing only this occurrence (The recurring series continues)'
                            : editingExpenseId.startsWith('split-')
                            ? '🔜 Editing this and all future occurrences (A new recurring rule will be created)'
                            : isExpenseRecurring
                            ? '🔄 Updates will apply to all occurrences in this recurring series'
                            : '✓ This expense will be updated'}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="form-close-btn"
                      onClick={() => {
                        onCancelEdit();
                        setShowExpenseForm(false);
                      }}
                      title="Close expense form"
                      aria-label="Close expense form"
                    >
                      ✕
                    </button>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="amount">Amount (₹)</label>
                    <input
                      id="amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                          setAmount(val);
                          if (error) setError('');
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          onAddExpense({ preventDefault: () => {} });
                        }
                      }}
                      min="0"
                      max="9999999.99"
                      step="0.01"
                      autoFocus
                      className={error && (!amount || parseFloat(amount) <= 0) ? 'input-error' : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="expense-date">Select Expense Date *</label>
                    <input
                      id="expense-date"
                      type="date"
                      value={expenseDate}
                      max={maxDate}
                      required
                      onChange={(e) => {
                        setExpenseDate(e.target.value);
                        if (error) setError('');
                      }}
                      className={error && !expenseDate ? 'input-error' : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <div className="quick-select-buttons">
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Food' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Food');
                          if (error) setError('');
                        }}
                      >
                        🍔 Food
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Groceries' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Groceries');
                          if (error) setError('');
                        }}
                      >
                        🛒 Groceries
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Medical' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Medical');
                          if (error) setError('');
                        }}
                      >
                        ⚕️ Medical
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'EMI' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('EMI');
                          if (error) setError('');
                        }}
                      >
                        💳 EMI
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Education' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Education');
                          if (error) setError('');
                        }}
                      >
                        📚 Education
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Investments' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Investments');
                          if (error) setError('');
                        }}
                      >
                        📈 Investments
                      </button>
                      <button
                        type="button"
                        className={`quick-btn ${category === 'Househelp' ? 'active' : ''}`}
                        onClick={() => {
                          setCategory('Househelp');
                          if (error) setError('');
                        }}
                      >
                        🏠 Househelp
                      </button>
                    </div>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => {
                        setCategory(e.target.value);
                        if (error) setError('');
                      }}
                      className={error && !category ? 'input-error' : ''}
                    >
                      <option value="">Select a category</option>
                      <option value="Food">Food</option>
                      <option value="Travel">Travel</option>
                      <option value="Rent">Rent</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Vehicle">Vehicle</option>
                      <option value="Medical">Medical</option>
                      <option value="EMI">EMI</option>
                      <option value="Education">Education</option>
                      <option value="Investments">Investments</option>
                      <option value="Househelp">Househelp</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="expense-description">Description (Optional)</label>
                    <textarea
                      id="expense-description"
                      placeholder="Add a description for this expense"
                      value={expenseDescription}
                      onChange={(e) => setExpenseDescription(e.target.value)}
                      rows="3"
                      className="expense-textarea"
                    />
                  </div>

                  {userGroup && (
                    <div className="form-group">
                      <label htmlFor="expense-type">Expense Type</label>
                      <select
                        id="expense-type"
                        value={expenseType}
                        onChange={(e) => setExpenseType(e.target.value)}
                      >
                        <option value="personal">🔒 Personal (Only you can see)</option>
                        <option value="shared">👥 Shared (Family can see)</option>
                      </select>
                      <small className="field-hint">Shared expenses appear in the family dashboard</small>
                    </div>
                  )}

                  <div className="form-group toggle-group">
                    <label htmlFor="expense-recurring-toggle">
                      <input
                        id="expense-recurring-toggle"
                        type="checkbox"
                        checked={isExpenseRecurring}
                        onChange={(e) => setIsExpenseRecurring(e.target.checked)}
                      />
                      <span className="toggle-label">Make this recurring</span>
                    </label>
                  </div>

                  {isExpenseRecurring && (
                    <>
                      <div className="form-group">
                        <label htmlFor="expense-frequency">Frequency</label>
                        <select
                          id="expense-frequency"
                          value={expenseFrequency}
                          onChange={(e) => setExpenseFrequency(e.target.value)}
                        >
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="expense-end-date">End Date (Optional)</label>
                        <input
                          id="expense-end-date"
                          type="date"
                          value={expenseEndDate}
                          onChange={(e) => setExpenseEndDate(e.target.value)}
                          min={expenseDate}
                        />
                        <small className="field-hint">Leave empty for ongoing recurring expenses</small>
                      </div>
                    </>
                  )}

                  <div className="button-group">
                    <button type="submit" className="add-btn" disabled={isSubmittingExpense}>
                      {isSubmittingExpense ? (
                        <>
                          <span className="btn-spinner"></span>
                          <span className="btn-text">Saving...</span>
                        </>
                      ) : (
                        editingExpenseId ? '✓ Update Expense' : 'Add Expense'
                      )}
                    </button>
                    {editingExpenseId && (
                      <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={() => {
                          onCancelEdit();
                          setShowExpenseForm(false);
                        }}
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}

              {showIncomeForm && (
                <form className="form-modal-content income-form" ref={incomeFormRef} onSubmit={handleAddIncomeWithClose}>
                  <div className="form-header">
                    <h2 className="form-title">Add Income</h2>
                    <button
                      type="button"
                      className="form-close-btn"
                      onClick={() => {
                        onCancelEdit();
                        setShowIncomeForm(false);
                      }}
                      title="Close income form"
                      aria-label="Close income form"
                    >
                      ✕
                    </button>
                  </div>
                  {error && <div className="form-error">{error}</div>}
                  
                  <div className="form-group">
                    <label htmlFor="income-amount">Amount (₹)</label>
                    <input
                      id="income-amount"
                      type="number"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={incomeAmount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                          setIncomeAmount(val);
                          if (error) setError('');
                        }
                      }}
                      min="0"
                      max="9999999.99"
                      step="0.01"
                      className={error && (!incomeAmount || parseFloat(incomeAmount) <= 0) ? 'input-error' : ''}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="income-source">Source (Optional)</label>
                    <input
                      id="income-source"
                      type="text"
                      placeholder="e.g., Salary, Freelance, Investment"
                      value={incomeSource}
                      onChange={(e) => {
                        setIncomeSource(e.target.value);
                        if (error) setError('');
                      }}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="income-date">Select Income Date *</label>
                    <input
                      id="income-date"
                      type="date"
                      value={incomeDate}
                      max={maxDate}
                      required
                      onChange={(e) => {
                        setIncomeDate(e.target.value);
                        if (error) setError('');
                      }}
                      className={error && !incomeDate ? 'input-error' : ''}
                    />
                  </div>

                  <div className="button-group">
                    <button type="submit" className="add-btn" disabled={isSubmittingIncome}>
                      {isSubmittingIncome ? (
                        <>
                          <span className="btn-spinner"></span>
                          <span className="btn-text">Saving...</span>
                        </>
                      ) : (
                        editingIncomeId ? '✓ Update Income' : 'Add Income'
                      )}
                    </button>
                    {editingIncomeId && (
                      <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={() => {
                          onCancelEdit();
                          setShowIncomeForm(false);
                        }}
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Recurring Edit Scope Modal */}
        {showRecurringEditScope && recurringEditInstance && (
          <>
            <div 
              className="form-modal-backdrop"
              onClick={() => setShowRecurringEditScope(false)}
              aria-hidden="true"
            />
            <div className="form-modal-wrapper">
              <div className="form-modal-content recurring-scope-modal">
                <div className="form-header">
                  <h2 className="form-title">Edit Recurring Expense</h2>
                  <button
                    type="button"
                    className="form-close-btn"
                    onClick={() => setShowRecurringEditScope(false)}
                    title="Close dialog"
                    aria-label="Close dialog"
                  >
                    ✕
                  </button>
                </div>
                
                <p className="scope-modal-message">
                  Which occurrences would you like to edit?
                </p>
                
                <div className="scope-options-list">
                  <button
                    type="button"
                    className="scope-option-btn"
                    onClick={() => onRecurringEditScopeSelect('this')}
                  >
                    <div className="scope-option-icon">📅</div>
                    <div className="scope-option-content">
                      <div className="scope-option-title">Edit Only This Occurrence</div>
                      <div className="scope-option-desc">
                        Modify only this instance ({recurringEditInstance.date})
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="scope-option-btn"
                    onClick={() => onRecurringEditScopeSelect('future')}
                  >
                    <div className="scope-option-icon">🔜</div>
                    <div className="scope-option-content">
                      <div className="scope-option-title">Edit This & Future Occurrences</div>
                      <div className="scope-option-desc">
                        Create a new recurring rule from {recurringEditInstance.date} onwards
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="scope-option-btn"
                    onClick={() => onRecurringEditScopeSelect('all')}
                  >
                    <div className="scope-option-icon">🔄</div>
                    <div className="scope-option-content">
                      <div className="scope-option-title">Edit Entire Series</div>
                      <div className="scope-option-desc">
                        Update all past and future occurrences
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Family Group Manager Modal */}
        <FamilyGroupManager
          user={user}
          userGroup={userGroup}
          userRole={userRole}
          onCreateGroup={onCreateGroup}
          onJoinGroup={onJoinGroup}
          onLeaveGroup={onLeaveGroup}
          onGenerateCode={onGenerateCode}
          groupLoading={groupLoading}
          showManager={showGroupManager}
          setShowManager={setShowGroupManager}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
}

export default Dashboard;

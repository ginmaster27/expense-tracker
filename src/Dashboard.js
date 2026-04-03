import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import logo from './assets/logo.png';

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
  darkMode,
  setDarkMode,
  onAddExpense,
  formatCurrency,
  totalAmount,
  getCategoryBreakdown,
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
  showIncomeForm,
  setShowIncomeForm,
  onEditExpense,
  editingExpenseId,
  onEditIncome,
  editingIncomeId,
  onCancelEdit,
  formatDate,
  expensesLoading
}) {
  const CHART_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#a8edea'];
  const categoryBreakdown = getCategoryBreakdown();
  
  // Get month name from selected month number
  const getMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNum = parseInt(selectedMonth);
    return months[monthNum - 1] || 'Current';
  };
  
  // Get today's date in YYYY-MM-DD format for max date on input
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };
  
  const maxDate = getMaxDate();

  // Calculate highest spending category
  const getHighestSpendingCategory = () => {
    if (categoryBreakdown.length === 0) return null;
    const highest = categoryBreakdown.reduce((max, item) => 
      item.total > max.total ? item : max
    );
    return highest;
  };

  // Calculate weekend vs weekday spending
  const getWeekendVsWeekdaySpending = () => {
    let weekendTotal = 0;
    let weekdayTotal = 0;
    
    expenses.forEach(expense => {
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

  // Calculate amount saved this month
  const getAmountSaved = () => {
    const filteredIncome = getFilteredIncomeTotal ? getFilteredIncomeTotal() : totalIncome;
    const filteredExpenses = getFilteredTotal ? getFilteredTotal() : totalAmount;
    return Math.max(filteredIncome - filteredExpenses, 0);
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
              {expenses.length > 0 && (
                <Link to="/expenses" className="nav-link">
                  View Expenses
                </Link>
              )}
            </div>
          </div>
        </div>

        {(income.length > 0 || expenses.length > 0 || expensesLoading) && (
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
                {(income.length > 0 || expenses.length > 0) && (
                  <div className="financial-cards">
                    {income.length > 0 && (
                      <div className="financial-card income-card">
                        <div className="card-header">
                          <h4 className="card-title">Monthly Income</h4>
                        </div>
                        <div className="card-amount income-amount">
                          {formatCurrency(getFilteredIncomeTotal())}
                        </div>
                        <p className="card-subtitle">{income.length} source{income.length !== 1 ? 's' : ''}</p>
                      </div>
                    )}
                    <div className="financial-card expense-card">
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

        <form className="expense-form" onSubmit={onAddExpense}>
          <h2 className="form-title">Add Expense</h2>
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (error) setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddExpense({ preventDefault: () => {} });
                }
              }}
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
                className={`quick-btn ${category === 'Travel' ? 'active' : ''}`}
                onClick={() => {
                  setCategory('Travel');
                  if (error) setError('');
                }}
              >
                ✈️ Travel
              </button>
              <button
                type="button"
                className={`quick-btn ${category === 'Rent' ? 'active' : ''}`}
                onClick={() => {
                  setCategory('Rent');
                  if (error) setError('');
                }}
              >
                🏠 Rent
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
            <button type="submit" className="add-btn">
              {editingExpenseId ? '✓ Update Expense' : 'Add Expense'}
            </button>
            {editingExpenseId && (
              <button type="button" className="cancel-btn" onClick={onCancelEdit}>
                ✕ Cancel
              </button>
            )}
          </div>
        </form>

        <div className="income-form-toggle">
          <button
            className="toggle-btn"
            onClick={() => setShowIncomeForm(!showIncomeForm)}
            title={showIncomeForm ? "Hide income form" : "Show income form"}
            aria-label={showIncomeForm ? "Hide income form" : "Show income form"}
          >
            {showIncomeForm ? '▼ Hide Income Form' : '▶ Add Income'}
          </button>
        </div>

        {showIncomeForm && (
          <form className="income-form" onSubmit={onAddIncome}>
            <h2 className="form-title">Add Income</h2>
            {error && <div className="form-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="income-amount">Amount</label>
              <input
                id="income-amount"
                type="number"
                placeholder="Enter income amount"
                value={incomeAmount}
                onChange={(e) => {
                  setIncomeAmount(e.target.value);
                  if (error) setError('');
                }}
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
              <button type="submit" className="add-btn">
                {editingIncomeId ? '✓ Update Income' : 'Add Income'}
              </button>
              {editingIncomeId && (
                <button type="button" className="cancel-btn" onClick={onCancelEdit}>
                  ✕ Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {income.length > 0 && (
          <div className="income-section">
            <h3 className="section-title">Total Income</h3>
            <div className="income-amount">{formatCurrency(totalIncome)}</div>
            <p className="section-subtitle">{income.length} income entries recorded</p>

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

        {expenses.length > 0 && (
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

        {((expenses.length > 0 || expensesLoading) && getExpensesByWeek().length > 0) || (expensesLoading && user) ? (
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
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="weekly-summary">
                  {getExpensesByWeek().map((week) => {
                    const startDateStr = week.startDate ? week.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <div key={week.label} className="weekly-item">
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

        {(expenses.length > 0 || expensesLoading) && (getMonthlyTrendData().length > 0 || (expensesLoading && user)) && (
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

        {expenses.length > 0 && categoryBreakdown.length > 0 && (
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
          </div>
        )}

        {expenses.length > 0 && (
          <div className="insights-section">
            <h3 className="insights-title">📊 Your Insights</h3>
            <div className="insights-grid">
              {getHighestSpendingCategory() && (
                <div className="insight-card">
                  <div className="insight-icon">🎯</div>
                  <div className="insight-content">
                    <p className="insight-label">Highest Spending</p>
                    <p className="insight-value">
                      Your highest spending category is <strong>{getHighestSpendingCategory().category}</strong>
                    </p>
                    <p className="insight-amount">{formatCurrency(getHighestSpendingCategory().total)}</p>
                  </div>
                </div>
              )}

              {expenses.length > 0 && (
                <div className="insight-card">
                  <div className="insight-icon">📅</div>
                  <div className="insight-content">
                    <p className="insight-label">Spending Pattern</p>
                    <p className="insight-value">
                      {getWeekendVsWeekdaySpending().weekendTotal > getWeekendVsWeekdaySpending().weekdayTotal
                        ? '💸 You spent more on weekends'
                        : '📌 You spent more on weekdays'}
                    </p>
                    <p className="insight-breakdown">
                      Weekends: {formatCurrency(getWeekendVsWeekdaySpending().weekendTotal)} | 
                      Weekdays: {formatCurrency(getWeekendVsWeekdaySpending().weekdayTotal)}
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
              <button className="empty-cta" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                ➕ Add Your First Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

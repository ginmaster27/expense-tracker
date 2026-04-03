import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';

function ExpensesPage({
  expenses,
  darkMode,
  setDarkMode,
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  onDeleteExpense,
  onEditExpense,
  editingExpenseId,
  formatCurrency,
  formatDate,
  getFilteredExpenses,
  getFilteredTotal,
  getExpensesByWeek,
  exportToCSV,
  user,
  authLoading,
  onSignInWithGoogle,
  onLogout,
  income,
  totalIncome,
  onDeleteIncome,
  onEditIncome,
  editingIncomeId,
  onCancelEdit
}) {
  const getCategoryIcon = (category) => {
    const icons = {
      'Food': '🍔',
      'Travel': '✈️',
      'Rent': '🏠',
      'Groceries': '🛒',
      'Utilities': '⚡',
      'Entertainment': '🎬',
      'Vehicle': '🚗',
      'Medical': '⚕️',
      'Others': '📦'
    };
    return icons[category] || '📌';
  };
  const [visibleCount, setVisibleCount] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debounceTimer = useRef(null);
  const navigate = useNavigate();
  const today = new Date();
  
  const filteredExpenses = getFilteredExpenses();
  const filteredTotal = getFilteredTotal();
  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const sortedExpenses = [...filteredExpenses].sort((a, b) => b.id - a.id);
  const visibleExpenses = sortedExpenses.slice(0, visibleCount);
  const hasMore = visibleCount < sortedExpenses.length;

  // Reset visible count and loading when filtered expenses change
  useEffect(() => {
    setVisibleCount(20);
    setIsLoading(false);
  }, [filteredExpenses.length, searchQuery, selectedMonth, selectedYear]);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setSearchQuery(localSearchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [localSearchQuery, setSearchQuery]);

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setLocalSearchQuery('');
    setSearchQuery('');
  };

  // Infinite scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500 && !isLoading && hasMore) {
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
          setVisibleCount(prev => Math.min(prev + 10, sortedExpenses.length));
          setIsLoading(false);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sortedExpenses.length, isLoading, hasMore]);

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
              <Link to="/" className="nav-link">
                Add Expense
              </Link>
            </div>
          </div>
        </div>

        <div className="month-selector">
          <label htmlFor="month-select">Select Month:</label>
          <div className="month-selector-controls">
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="all">All Years</option>
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="total-section">
          <div className="total-item">
            <span className="total-label">Selected Period Total:</span>
            <span className="total-amount">{formatCurrency(filteredTotal)}</span>
          </div>
          <div className="total-item">
            <span className="total-label">All-time Total:</span>
            <span className="total-amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        <div className="search-section">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by category..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="search-input"
            aria-label="Search expenses by category"
          />
          {localSearchQuery && (
            <button
              className="clear-search-btn"
              onClick={handleClearSearch}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
          <button
            className="export-csv-btn"
            onClick={exportToCSV}
            title="Export all expenses to CSV"
            aria-label="Export expenses to CSV"
          >
            📥 Download CSV
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">🔍</div>
              <h3 className="empty-title">No expenses found</h3>
              <p className="empty-message">Try adjusting your search or filters to find what you're looking for.</p>
              <button className="empty-cta" onClick={() => navigate('/')}>
                ➕ Add New Expense
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="expenses-list">
              {visibleExpenses.map((expense) => (
                <div key={expense.id} className={`expense-item ${expense.isProjected ? 'projected' : ''}`}>
                  <div className="expense-main">
                    <div className="expense-icon">{getCategoryIcon(expense.category)}</div>
                    <div className="expense-info">
                      <div className="expense-header">
                        <div className="expense-category">{expense.category}</div>
                        {expense.isRecurring && (
                          <span className="recurring-flag-badge">
                            🔁 Recurring
                            {expense.isProjected && <span className="projected-marker"> (Projected)</span>}
                          </span>
                        )}
                        {expense.recurringExpenseId && (
                          <span className="recurring-badge">♻️ {expense.isProjected ? 'Scheduled' : 'Recurring'}</span>
                        )}
                        {expense.isProjected && (
                          <span className="projected-badge">📋 Projected</span>
                        )}
                      </div>
                      <div className="expense-date">{formatDate(expense.date)}</div>
                      {expense.description && <div className="expense-description">{expense.description}</div>}
                    </div>
                  </div>
                  <div className="expense-right">
                    <div className="expense-amount">{formatCurrency(expense.amount)}</div>
                    {!expense.isProjected && (
                      <>
                        <button
                          className="edit-btn"
                          onClick={() => {
                            onEditExpense(expense.id);
                            navigate('/');
                          }}
                          title="Edit this expense"
                          aria-label="Edit expense"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => onDeleteExpense(expense.id)}
                          title="Delete this expense"
                          aria-label="Delete expense"
                        >
                          🗑
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isLoading && (
              <div className="load-indicator loading">
                <div className="spinner"></div>
                <p className="load-text">Loading more...</p>
              </div>
            )}
            {hasMore && !isLoading && (
              <div className="load-indicator">
                <p className="load-text">Showing {visibleCount} of {sortedExpenses.length} expenses</p>
                <p className="load-hint">Scroll down to load more...</p>
              </div>
            )}
            {!hasMore && sortedExpenses.length > 20 && (
              <div className="load-indicator">
                <p className="load-text">All {sortedExpenses.length} expenses loaded</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ExpensesPage;

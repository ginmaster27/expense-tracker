import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from './AppHeader';

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
  getAllTimeExpensesTotal,
  getExpensesByWeek,
  exportToCSV,
  user,
  authLoading,
  onSignInWithGoogle,
  onLogout,
  userGroup,
  onOpenFamilyGroup,
  onOpenFamilyDashboard,
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
      'EMI': '💳',
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
  const totalAmount = getAllTimeExpensesTotal ? getAllTimeExpensesTotal() : 0;
  
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const dateComparison = new Date(b.date) - new Date(a.date);
    if (dateComparison !== 0) {
      return dateComparison;
    }
    return String(b.id).localeCompare(String(a.id));
  });
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
        <AppHeader
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          user={user}
          authLoading={authLoading}
          onLogout={onLogout}
          onSignIn={onSignInWithGoogle}
          userGroup={userGroup}
          onOpenFamilyGroup={onOpenFamilyGroup}
          onOpenFamilyDashboard={onOpenFamilyDashboard}
        />

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

import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import AdminTools from './AdminTools';

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
  onEditExpense,
  onDeleteExpense,
  onEditIncome,
  onDeleteIncome,
  onAddExpense,
  onAddIncome
}) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, expenses, income
  const [categoryFilterMonth, setCategoryFilterMonth] = useState('current'); // 'current' or number 1-12 for all-time month selection

  if (!userGroup) {
    return (
      <div className={`family-dashboard loading ${darkMode ? 'dark-mode' : ''}`}>
        <p>Loading family data...</p>
      </div>
    );
  }

  // Filter to only shared expenses for family dashboard
  // expenses prop (familySharedExpenses) already contains only shared expenses
  const sharedExpenses = expenses || [];

  // Calculate total expenses from shared and personal
  const totalSharedExpenses = sharedExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalPersonalExpenses = (personalExpenses || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalFamilyExpenses = totalSharedExpenses + totalPersonalExpenses;
  const totalFamilyIncome = income.reduce((sum, inc) => sum + (inc.amount || 0), 0);
  
  // Calculate monthly family income
  const getMonthlyIncome = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return income.reduce((sum, inc) => {
      if (inc.date) {
        const incomeDate = new Date(inc.date);
        if (incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear) {
          return sum + (inc.amount || 0);
        }
      }
      return sum;
    }, 0);
  };
  
  // Calculate monthly family expenses
  const getMonthlyExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let monthlyTotal = 0;
    
    // Add shared expenses for this month
    sharedExpenses.forEach(exp => {
      if (exp.date) {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
          monthlyTotal += exp.amount || 0;
        }
      }
    });
    
    // Add personal expenses for this month
    (personalExpenses || []).forEach(exp => {
      if (exp.date) {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
          monthlyTotal += exp.amount || 0;
        }
      }
    });
    
    return monthlyTotal;
  };
  
  const monthlyFamilyIncome = getMonthlyIncome();
  const monthlyFamilyExpenses = getMonthlyExpenses();
  const monthlyBalance = monthlyFamilyIncome - monthlyFamilyExpenses;
  const familyBalance = totalFamilyIncome - totalFamilyExpenses;

  // Get member list from userGroup
  const members = userGroup.members || [];

  // Calculate member contributions (expenses per member)
  const getMemberContributions = () => {
    const contributions = {};
    members.forEach(member => {
      contributions[member.userId] = {
        id: member.userId,
        name: member.name,
        spent: 0,
        earned: 0,
        balance: 0,
        spendPercentage: 0
      };
    });

    // Add shared expenses
    sharedExpenses.forEach(exp => {
      if (contributions[exp.createdBy]) {
        contributions[exp.createdBy].spent += exp.amount || 0;
      }
    });

    // Add income
    income.forEach(inc => {
      if (contributions[inc.userId]) {
        contributions[inc.userId].earned += inc.amount || 0;
      }
    });

    // Calculate balance and percentage
    const sortedBySpending = Object.values(contributions).sort((a, b) => b.spent - a.spent);
    sortedBySpending.forEach(member => {
      member.balance = member.earned - member.spent;
      member.spendPercentage = totalFamilyExpenses > 0 ? ((member.spent / totalFamilyExpenses) * 100).toFixed(1) : 0;
    });

    return sortedBySpending;
  };

  // Calculate member monthly contributions (expenses per member for current month)
  const getMemberMonthlyContributions = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const contributions = {};
    members.forEach(member => {
      contributions[member.userId] = {
        id: member.userId,
        name: member.name,
        spent: 0,
        earned: 0,
        balance: 0,
        spendPercentage: 0
      };
    });

    // Add shared expenses for this month
    sharedExpenses.forEach(exp => {
      if (exp.date && contributions[exp.createdBy]) {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
          contributions[exp.createdBy].spent += exp.amount || 0;
        }
      }
    });

    // Add income for this month
    income.forEach(inc => {
      if (inc.date && contributions[inc.userId]) {
        const incDate = new Date(inc.date);
        if (incDate.getMonth() === currentMonth && incDate.getFullYear() === currentYear) {
          contributions[inc.userId].earned += inc.amount || 0;
        }
      }
    });

    // Calculate balance and percentage
    const sortedBySpending = Object.values(contributions).sort((a, b) => b.spent - a.spent);
    sortedBySpending.forEach(member => {
      member.balance = member.earned - member.spent;
      member.spendPercentage = monthlyFamilyExpenses > 0 ? ((member.spent / monthlyFamilyExpenses) * 100).toFixed(1) : 0;
    });

    return sortedBySpending;
  };

  const getMemberPersonalTotals = () => {
    const personalTotals = {};
    members.forEach(member => {
      personalTotals[member.userId] = {
        id: member.userId,
        name: member.name,
        personalTotal: 0,
        count: 0,
        percentage: 0
      };
    });

    // Add personal expenses
    (personalExpenses || []).forEach(exp => {
      if (personalTotals[exp.createdBy]) {
        personalTotals[exp.createdBy].personalTotal += exp.amount || 0;
        personalTotals[exp.createdBy].count += 1;
      }
    });

    // Calculate percentage
    const totalPersonal = Object.values(personalTotals).reduce((sum, member) => sum + member.personalTotal, 0);
    const sortedByPersonal = Object.values(personalTotals)
      .filter(member => member.personalTotal > 0)
      .sort((a, b) => b.personalTotal - a.personalTotal);
    
    sortedByPersonal.forEach(member => {
      member.percentage = totalPersonal > 0 ? ((member.personalTotal / totalPersonal) * 100).toFixed(1) : 0;
    });

    return sortedByPersonal;
  };

  // Get category breakdown
  const getCategoryBreakdown = (monthFilter = 'current') => {
    const categories = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    sharedExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      let includeExpense = false;

      if (monthFilter === 'current') {
        // Current month only
        if (exp.date) {
          const expDate = new Date(exp.date);
          includeExpense = expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
        }
      } else if (monthFilter === 'all-time') {
        // All time
        includeExpense = true;
      } else {
        // Specific month across all years (for all-time view by month)
        if (exp.date) {
          const expDate = new Date(exp.date);
          includeExpense = expDate.getMonth() === parseInt(monthFilter);
        }
      }

      if (includeExpense) {
        categories[cat] = (categories[cat] || 0) + (exp.amount || 0);
      }
    });

    const totalForChart = Object.values(categories).reduce((sum, val) => sum + val, 0);

    return Object.entries(categories)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalForChart > 0 ? ((value / totalForChart) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get member income sources breakdown
  const getIncomeSourceBreakdown = () => {
    const sources = {};
    income.forEach(inc => {
      const src = inc.source || 'Other';
      sources[src] = (sources[src] || 0) + (inc.amount || 0);
    });
    return Object.entries(sources)
      .map(([name, value]) => ({
        name,
        value,
        percentage: totalFamilyIncome > 0 ? ((value / totalFamilyIncome) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.value - a.value);
  };

  // Get filtered transactions
  // Get all family activity for the activity feed
  const getAllFamilyActivity = () => {
    let activity = [];

    // Add all shared expenses
    sharedExpenses.forEach(exp => {
      activity.push({
        id: `exp-${exp.id}`,
        type: 'expense',
        category: exp.category,
        amount: exp.amount,
        memberName: members.find(m => m.userId === exp.createdBy)?.name || 'Unknown',
        date: exp.date,
        description: exp.description,
        userId: exp.createdBy
      });
    });

    // Add all income
    income.forEach(inc => {
      activity.push({
        id: `inc-${inc.id}`,
        type: 'income',
        source: inc.source,
        amount: inc.amount,
        memberName: members.find(m => m.userId === inc.userId)?.name || 'Unknown',
        date: inc.date,
        description: inc.description,
        userId: inc.userId
      });
    });

    // Sort by date (newest first)
    return activity.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get activity summary by date
  const getActivityByDate = () => {
    const allActivity = getAllFamilyActivity();
    const grouped = {};

    allActivity.forEach(activity => {
      const dateStr = new Date(activity.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(activity);
    });

    // Return as array of {date, activities}
    return Object.entries(grouped).map(([date, activities]) => ({
      date,
      activities
    }));
  };

  const getFilteredTransactions = () => {
    let transactions = [];

    if (filterType === 'all' || filterType === 'expenses') {
      transactions.push(...sharedExpenses.map(exp => ({
        ...exp,
        type: 'expense',
        memberName: members.find(m => m.userId === exp.createdBy)?.name || 'Unknown'
      })));
    }

    if (filterType === 'all' || filterType === 'income') {
      transactions.push(...income.map(inc => ({
        ...inc,
        type: 'income',
        memberName: members.find(m => m.userId === inc.userId)?.name || 'Unknown'
      })));
    }

    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
  };

  // Get top spender
  const getTopSpender = () => {
    const topSpenders = [];
    sharedExpenses.forEach(exp => {
      const creatorName = members.find(m => m.userId === exp.createdBy)?.name || 'Unknown';
      const category = exp.category || 'Other';
      topSpenders.push({
        name: creatorName,
        category,
        amount: exp.amount || 0,
        id: exp.createdBy
      });
    });

    const topSpender = topSpenders.sort((a, b) => b.amount - a.amount)[0];
    return topSpender || { amount: 0, name: 'N/A' };
  };

  // Get most used category
  const getMostUsedCategory = () => {
    const categories = {};
    sharedExpenses.forEach(exp => {
      const cat = exp.category || 'Other';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { category: sorted[0][0], count: sorted[0][1] } : { category: 'N/A', count: 0 };
  };

  // Calculate average spending per member
  const getAverageSpendingPerMember = () => {
    if (members.length === 0) return 0;
    return (totalFamilyExpenses / members.length).toFixed(2);
  };

  // Identify unusual spending patterns
  const getUnusualPatterns = () => {
    const memberStats = {};
    
    // Calculate stats for each member
    sharedExpenses.forEach(exp => {
      if (!memberStats[exp.createdBy]) {
        memberStats[exp.createdBy] = {
          name: members.find(m => m.userId === exp.createdBy)?.name || 'Unknown',
          total: 0,
          count: 0,
          amounts: []
        };
      }
      memberStats[exp.createdBy].total += exp.amount || 0;
      memberStats[exp.createdBy].count += 1;
      memberStats[exp.createdBy].amounts.push(exp.amount || 0);
    });

    // Calculate average and identify unusual patterns
    const patterns = [];
    Object.entries(memberStats).forEach(([userId, stats]) => {
      if (stats.count === 0) return;
      
      const avg = stats.total / stats.count;
      const avgFamilyExpense = totalFamilyExpenses / sharedExpenses.length;
      
      // Identify patterns
      if (avg > avgFamilyExpense * 1.5) {
        patterns.push({
          type: 'highSpender',
          member: stats.name,
          avgExpense: avg,
          message: `${stats.name} has notably higher average transaction amounts`
        });
      }
      
      // Check for recent spike
      const last3 = stats.amounts.slice(-3);
      if (last3.length > 0) {
        const last3Avg = last3.reduce((a, b) => a + b, 0) / last3.length;
        if (last3Avg > avg * 1.3) {
          patterns.push({
            type: 'spendingSpike',
            member: stats.name,
            recentAvg: last3Avg,
            message: `${stats.name} has recent spending increase`
          });
        }
      }
    });

    return patterns.slice(0, 3); // Return top 3 patterns
  };

  // Get spending comparison data
  const getSpendingComparison = () => {
    const comparison = members.map(member => {
      const memberSpending = sharedExpenses
        .filter(exp => exp.createdBy === member.userId)
        .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      
      return {
        name: member.name,
        spending: parseFloat(memberSpending.toFixed(2)),
        percentage: totalSharedExpenses > 0 ? ((memberSpending / totalSharedExpenses) * 100).toFixed(1) : 0
      };
    }).sort((a, b) => b.spending - a.spending);

    return comparison;
  };

  // Calculate expense settlements (who owes whom)
  const calculateSettlements = () => {
    const balances = {}; // userId -> balance (positive = owed to them, negative = they owe)
    
    // Initialize balances
    members.forEach(member => {
      balances[member.userId] = 0;
    });

    // Process split expenses
    sharedExpenses.forEach(exp => {
      if (exp.isSplit && exp.splitMembers && exp.splitMembers.length > 0) {
        const payer = exp.createdBy;
        const splitCount = exp.splitMembers.length + 1; // Includes payer
        const amountPerPerson = (exp.amount / splitCount).toFixed(2);

        // Payer paid the full amount
        balances[payer] = (parseFloat(balances[payer]) + parseFloat(exp.amount)).toFixed(2);

        // Each splitter owes their share
        exp.splitMembers.forEach(memberUserId => {
          balances[memberUserId] = (parseFloat(balances[memberUserId]) - parseFloat(amountPerPerson)).toFixed(2);
        });

        // Payer owes their share back to themselves (net out)
        balances[payer] = (parseFloat(balances[payer]) - parseFloat(amountPerPerson)).toFixed(2);
      }
    });

    // Generate settlement list
    const settlements = [];
    const memberIds = Object.keys(balances);
    
    for (let i = 0; i < memberIds.length; i++) {
      for (let j = i + 1; j < memberIds.length; j++) {
        const debtor = memberIds[i];
        const creditor = memberIds[j];
        const debtorBalance = parseFloat(balances[debtor]);
        const creditorBalance = parseFloat(balances[creditor]);

        let amount = 0;
        let payer = '';
        let payee = '';

        if (debtorBalance < 0 && creditorBalance > 0) {
          amount = Math.min(Math.abs(debtorBalance), creditorBalance);
          payer = debtor;
          payee = creditor;
        } else if (debtorBalance > 0 && creditorBalance < 0) {
          amount = Math.min(debtorBalance, Math.abs(creditorBalance));
          payer = creditor;
          payee = debtor;
        }

        if (amount > 0.01) {
          settlements.push({
            payer: members.find(m => m.userId === payer)?.name || 'Unknown',
            payee: members.find(m => m.userId === payee)?.name || 'Unknown',
            amount: parseFloat(amount.toFixed(2)),
            payerId: payer,
            payeeId: payee
          });
        }
      }
    }

    return settlements;
  };

  const memberContributions = getMemberContributions();
  const memberMonthlyContributions = getMemberMonthlyContributions();
  const memberPersonalTotals = getMemberPersonalTotals();
  const categoryBreakdown = getCategoryBreakdown(categoryFilterMonth);
  const incomeSourceBreakdown = getIncomeSourceBreakdown();
  const recentTransactions = getFilteredTransactions();
  const topSpender = getTopSpender();
  const mostUsedCategory = getMostUsedCategory();
  const averageSpendingPerMember = getAverageSpendingPerMember();
  const unusualPatterns = getUnusualPatterns();
  const spendingComparison = getSpendingComparison();
  const settlements = calculateSettlements();

  const COLORS = ['#5bb450', '#4a9940', '#3a8330', '#2a7320', '#1a6310', '#0a5300'];

  return (
    <div className={`family-dashboard ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
      <div className="family-dashboard-header">
        <div className="family-header-content">
          <h1 className="family-dashboard-title">👨‍👩‍👧‍👦 {userGroup.name} Dashboard</h1>
          <p className="family-dashboard-subtitle">Family Financial Summary</p>
        </div>

        <div className="family-dashboard-controls">
          <button
            className="dark-mode-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button
            className="back-to-personal-btn"
            onClick={onSwitchToPersonal}
            title="Back to personal dashboard"
          >
            ← Personal Mode
          </button>
        </div>
      </div>

      {/* Privacy Notice */}
      {userGroup && (
        <div className="family-privacy-notice">
          <span>ℹ️</span>
          <p>This dashboard shows only <strong>shared expenses</strong>. Personal expenses are kept private and visible only to you.</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="family-summary-section">
        <div className="summary-card income-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3 className="card-title">Total Family Income</h3>
            <div className="card-amount">{formatCurrency(totalFamilyIncome)}</div>
            <p className="card-detail">{income.length} entries</p>
          </div>
        </div>

        <div className="summary-card income-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <h3 className="card-title">Monthly Income</h3>
            <div className="card-amount">{formatCurrency(monthlyFamilyIncome)}</div>
            <p className="card-detail">This month • Balance: {formatCurrency(monthlyBalance)}</p>
          </div>
        </div>

        <div className="summary-card expense-card">
          <div className="card-icon">💸</div>
          <div className="card-content">
            <h3 className="card-title">Total Shared Expenses</h3>
            <div className="card-amount">{formatCurrency(totalSharedExpenses)}</div>
            <p className="card-detail">{sharedExpenses.length} shared entries</p>
          </div>
        </div>

        <div className={`summary-card balance-card ${familyBalance >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-icon">{familyBalance >= 0 ? '✓' : '⚠'}</div>
          <div className="card-content">
            <h3 className="card-title">Family Balance</h3>
            <div className="card-amount">{formatCurrency(familyBalance)}</div>
            <p className="card-detail">{familyBalance >= 0 ? 'Surplus' : 'Deficit'}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="family-main-grid">
        {/* Member Contributions */}
        <div className="family-card member-contributions-card">
          <h2 className="card-heading">👥 Member Contributions</h2>
          <div className="contributions-table">
            {memberContributions.length > 0 ? (
              <>
                {/* Current Month Contributions */}
                <div className="contributions-section">
                  <h3 className="contributions-section-title">📅 This Month</h3>
                  <div className="table-wrapper">
                    {memberMonthlyContributions.map((member, idx) => (
                      <div
                        key={`monthly-${member.id}`}
                        className={`contribution-row ${selectedMember === `monthly-${member.id}` ? 'active' : ''}`}
                        onClick={() => setSelectedMember(selectedMember === `monthly-${member.id}` ? null : `monthly-${member.id}`)}
                      >
                        <div className="row-member">
                          <div className="member-avatar" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-info">
                            <div className="member-name">{member.name}</div>
                            <div className="member-stats">
                              <span className="stat-income">📈 {formatCurrency(member.earned)}</span>
                              <span className="stat-expense">📉 {formatCurrency(member.spent)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="member-contribution-details">
                          <div className="spend-percentage">
                            <div className="percentage-bar">
                              <div 
                                className="percentage-fill"
                                style={{ width: `${member.spendPercentage}%` }}
                              ></div>
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
                </div>

                {/* Total Contributions */}
                <div className="contributions-section">
                  <h3 className="contributions-section-title">📊 Total (All Time)</h3>
                  <div className="table-wrapper">
                    {memberContributions.map((member, idx) => (
                      <div
                        key={`total-${member.id}`}
                        className={`contribution-row ${selectedMember === `total-${member.id}` ? 'active' : ''}`}
                        onClick={() => setSelectedMember(selectedMember === `total-${member.id}` ? null : `total-${member.id}`)}
                      >
                        <div className="row-member">
                          <div className="member-avatar" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-info">
                            <div className="member-name">{member.name}</div>
                            <div className="member-stats">
                              <span className="stat-income">📈 {formatCurrency(member.earned)}</span>
                              <span className="stat-expense">📉 {formatCurrency(member.spent)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="member-contribution-details">
                          <div className="spend-percentage">
                            <div className="percentage-bar">
                              <div 
                                className="percentage-fill"
                                style={{ width: `${member.spendPercentage}%` }}
                              ></div>
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
                </div>
              </>
            ) : (
              <p className="no-data">No member data available</p>
            )}
          </div>
        </div>

        {/* Personal Expense Summary */}
        {memberPersonalTotals.length > 0 && (
          <div className="family-card personal-expense-summary-card">
            <h2 className="card-heading">💳 Personal Expense Summary</h2>
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
                <span>Total Personal Expenses:</span>
                <span className="total-amount">{formatCurrency(totalPersonalExpenses)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="family-card category-breakdown-card">
            <div className="chart-header">
              <h2 className="card-heading">📊 Expense Categories</h2>
              <select
                className="category-month-filter"
                value={categoryFilterMonth}
                onChange={(e) => setCategoryFilterMonth(e.target.value)}
                title="Filter expenses by month"
              >
                <option value="current">Current Month</option>
                <option value="all-time">All Time</option>
                <optgroup label="Specific Month (All Years)">
                  <option value="0">January</option>
                  <option value="1">February</option>
                  <option value="2">March</option>
                  <option value="3">April</option>
                  <option value="4">May</option>
                  <option value="5">June</option>
                  <option value="6">July</option>
                  <option value="7">August</option>
                  <option value="8">September</option>
                  <option value="9">October</option>
                  <option value="10">November</option>
                  <option value="11">December</option>
                </optgroup>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#5bb450"
                  dataKey="value"
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Income Source Breakdown */}
        {incomeSourceBreakdown.length > 0 && (
          <div className="family-card income-breakdown-card">
            <h2 className="card-heading">💵 Income Sources</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incomeSourceBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="value" fill="#5bb450" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Family Insights */}
      <div className="family-insights-section">
        <h2 className="insights-title">💡 Family Insights</h2>
        
        {/* Key Metrics */}
        <div className="insights-grid">
          <div className="insight-card metric-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h3 className="insight-label">Top Spender</h3>
              <p className="insight-value">{topSpender.name}</p>
              <p className="insight-detail">{formatCurrency(topSpender.amount)}</p>
            </div>
          </div>

          <div className="insight-card metric-card">
            <div className="insight-icon">🏷️</div>
            <div className="insight-content">
              <h3 className="insight-label">Most Used Category</h3>
              <p className="insight-value">{mostUsedCategory.category}</p>
              <p className="insight-detail">{mostUsedCategory.count} transaction{mostUsedCategory.count !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="insight-card metric-card">
            <div className="insight-icon">📊</div>
            <div className="insight-content">
              <h3 className="insight-label">Avg per Member</h3>
              <p className="insight-value">{formatCurrency(averageSpendingPerMember)}</p>
              <p className="insight-detail">{members.length} members</p>
            </div>
          </div>
        </div>

        {/* Spending Comparison */}
        <div className="insight-card spending-comparison-card">
          <h3 className="insight-card-title">📈 Spending Comparison</h3>
          <div className="comparison-list">
            {spendingComparison.map((item, idx) => (
              <div key={idx} className="comparison-item">
                <div className="comparison-member">
                  <span className="comparison-name">{item.name}</span>
                  <span className="comparison-amount">{formatCurrency(item.spending)}</span>
                </div>
                <div className="comparison-bar-container">
                  <div
                    className="comparison-bar"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: `hsl(${120 - (item.percentage / 2)}, 70%, 50%)`
                    }}
                  ></div>
                </div>
                <span className="comparison-percentage">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Unusual Patterns */}
        {unusualPatterns.length > 0 && (
          <div className="insight-card patterns-card">
            <h3 className="insight-card-title">⚠️ Notable Patterns</h3>
            <div className="patterns-list">
              {unusualPatterns.map((pattern, idx) => (
                <div key={idx} className={`pattern-item pattern-${pattern.type}`}>
                  <span className="pattern-icon">
                    {pattern.type === 'highSpender' ? '💰' : '📈'}
                  </span>
                  <div className="pattern-content">
                    <p className="pattern-message">{pattern.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="family-card recent-transactions-card">
        <div className="transactions-header">
          <h2 className="card-heading">📝 Recent Transactions</h2>
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filterType === 'expenses' ? 'active' : ''}`}
              onClick={() => setFilterType('expenses')}
            >
              Expenses
            </button>
            <button
              className={`filter-btn ${filterType === 'income' ? 'active' : ''}`}
              onClick={() => setFilterType('income')}
            >
              Income
            </button>
          </div>
        </div>

        {recentTransactions.length > 0 ? (
          <div className="transactions-list">
            {recentTransactions.map((transaction, idx) => (
              <div key={idx} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-icon">
                  {transaction.type === 'expense' ? '💸' : '💰'}
                </div>
                <div className="transaction-content">
                  <div className="transaction-header">
                    <div className="transaction-title">
                      {transaction.memberName && transaction.type === 'expense' 
                        ? `${transaction.memberName} spent ₹${transaction.amount.toFixed(2)} on ${transaction.category || 'Transaction'}`
                        : transaction.category || transaction.source || 'Transaction'
                      }
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'expense' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </div>
                  </div>
                  <div className="transaction-footer">
                    <span className="transaction-member">{transaction.memberName}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                  </div>
                  {transaction.description && (
                    <p className="transaction-description">{transaction.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No transactions found</p>
        )}
      </div>

      {/* Settlement Summary */}
      {settlements.length > 0 && (
        <div className="family-card settlement-card">
          <h2 className="card-heading">💳 Settlement Summary</h2>
          <p className="feed-subtitle">Who owes whom for split expenses</p>
          
          <div className="settlement-list">
            {settlements.map((settlement, idx) => (
              <div key={idx} className="settlement-item">
                <div className="settlement-arrow">
                  <span className="settlement-payer">{settlement.payer}</span>
                  <div className="arrow-container">
                    <span className="arrow">→</span>
                  </div>
                  <span className="settlement-payee">{settlement.payee}</span>
                </div>
                <div className="settlement-amount">{formatCurrency(settlement.amount)}</div>
              </div>
            ))}
          </div>

          {settlements.length > 0 && (
            <div className="settlement-note">
              <p>✓ Mark payments as complete in your transaction history</p>
            </div>
          )}
        </div>
      )}

      {/* Family Activity Feed */}
      <div className="family-card activity-feed-card">
        <h2 className="card-heading">📋 Family Activity Feed</h2>
        <p className="feed-subtitle">All recent transactions from family members</p>
        
        {getAllFamilyActivity().length > 0 ? (
          <div className="activity-feed">
            {getActivityByDate().map((group, groupIdx) => (
              <div key={groupIdx} className="activity-date-group">
                <div className="activity-date-header">
                  <h3 className="activity-date">{group.date}</h3>
                  <span className="activity-count">{group.activities.length} transaction{group.activities.length !== 1 ? 's' : ''}</span>
                </div>
                
                <div className="activity-items">
                  {group.activities.map((activity, idx) => (
                    <div key={activity.id} className={`activity-item ${activity.type}`}>
                      <div className="activity-timeline-dot"></div>
                      
                      <div className="activity-icon">
                        {activity.type === 'expense' ? '💸' : '💰'}
                      </div>
                      
                      <div className="activity-content">
                        <div className="activity-header">
                          <div className="activity-title">
                            <span className="activity-member">{activity.memberName}</span>
                            <span className="activity-category">
                              {activity.type === 'expense' ? activity.category : activity.source}
                            </span>
                          </div>
                          <div className={`activity-amount ${activity.type}`}>
                            {activity.type === 'expense' ? '−' : '+'}
                            {formatCurrency(activity.amount)}
                          </div>
                        </div>
                        
                        {activity.description && (
                          <p className="activity-description">{activity.description}</p>
                        )}
                        
                        <div className="activity-time">
                          {new Date(activity.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      
                      {idx < group.activities.length - 1 && (
                        <div className="activity-timeline-connector"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No activity yet</p>
        )}
      </div>

      {/* Family Stats Footer */}
      <div className="family-stats-footer">
        <div className="stat-box">
          <h4>Total Members</h4>
          <p className="stat-value">{members.length}</p>
        </div>
        <div className="stat-box">
          <h4>Admin</h4>
          <p className="stat-value">{userGroup.adminName}</p>
        </div>
        <div className="stat-box">
          <h4>Your Role</h4>
          <p className="stat-value">
            <span className={`role-badge ${userRole}`}>{userRole}</span>
          </p>
        </div>
      </div>

      {/* Admin Tools - Only visible to group admins */}
      <AdminTools
        currentUser={user}
        members={userGroup.members || []}
        groupId={userGroup.id}
        isAdmin={userRole === 'admin'}
      />
    </div>
  );
}

export default FamilyDashboard;

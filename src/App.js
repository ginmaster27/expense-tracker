import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, expensesAPI, incomeAPI } from './firebase';
import Dashboard from './Dashboard';
import ExpensesPage from './ExpenseList';
import './App.css';

function App() {
  // Initialize expenses as empty - they will be loaded from Firestore (if logged in) or localStorage (if logged out) in the auth effect
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [expenseDescription, setExpenseDescription] = useState('');
  const [isExpenseRecurring, setIsExpenseRecurring] = useState(false);
  const [expenseFrequency, setExpenseFrequency] = useState('monthly');
  const [expenseEndDate, setExpenseEndDate] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      return false;
    }
  });

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expensesLoading, setExpensesLoading] = useState(false);

  // Income state
  const [income, setIncome] = useState([]);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeDate, setIncomeDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  
  // Toggle states
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatDate = (isoDate) => {
    // Convert ISO format (YYYY-MM-DD) to DD/MM/YYYY
    if (!isoDate || typeof isoDate !== 'string') {
      return 'Invalid date';
    }
    
    const parts = isoDate.split('-');
    if (parts.length !== 3) {
      return 'Invalid date';
    }
    
    const [year, month, day] = parts;
    if (!year || !month || !day) {
      return 'Invalid date';
    }
    
    return `${day}/${month}/${year}`;
  };

  // Export expenses to CSV format
  const exportToCSV = () => {
    if (expenses.length === 0) {
      alert('No expenses to export');
      return;
    }

    // CSV header
    const headers = ['Date', 'Category', 'Amount', 'Description'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(expense => {
        // Format the date from ISO to DD/MM/YYYY
        const formattedDate = formatDate(expense.date);
        // Escape quotes in description for CSV
        const description = (expense.description || '').replace(/"/g, '""');
        // Return CSV row
        return [
          formattedDate,
          `"${expense.category}"`,
          expense.amount.toFixed(2),
          `"${description}"`
        ].join(',');
      })
    ].join('\n');

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a temporary download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Set the download filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${currentDate}.csv`);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedCategory = category.trim();
    const numAmount = parseFloat(amount);
    
    // Validate amount
    if (!amount || amount.trim() === '') {
      setError('Please enter an amount');
      return;
    }

    if (isNaN(numAmount)) {
      setError('Amount must be a valid number');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Validate category
    if (!trimmedCategory) {
      setError('Please select a category');
      return;
    }

    // Validate date - ensure it's selected
    if (!expenseDate) {
      setError('Please select a date');
      return;
    }

    // Validate date - ensure it's not in the future
    const selectedDate = new Date(expenseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate > today) {
      setError('Date cannot be in the future');
      return;
    }

    try {
      const newExpenseData = {
        amount: numAmount,
        category: trimmedCategory,
        date: expenseDate,
        description: expenseDescription.trim(),
        isRecurring: isExpenseRecurring
      };

      // Add recurring-specific fields if marking as recurring
      if (isExpenseRecurring) {
        newExpenseData.frequency = expenseFrequency;
        newExpenseData.endDate = expenseEndDate;
      }

      if (editingExpenseId) {
        // Update existing expense
        if (user) {
          await expensesAPI.updateExpense(user.uid, editingExpenseId, newExpenseData);
        } else {
          const updated = expenses.map(exp => 
            exp.id === editingExpenseId ? { ...exp, ...newExpenseData } : exp
          );
          setExpenses(updated);
          localStorage.setItem('expenses', JSON.stringify(updated));
        }
        
        setExpenses(expenses.map(exp => 
          exp.id === editingExpenseId ? { id: editingExpenseId, ...newExpenseData } : exp
        ));
        setEditingExpenseId(null);
      } else {
        // Add new expense
        if (user) {
          // Save to Firestore if user is logged in
          const savedExpense = await expensesAPI.addExpense(user.uid, newExpenseData);
          setExpenses([...expenses, savedExpense]);
        } else {
          // Save to localStorage if user is not logged in
          const newExpense = {
            id: Date.now().toString(),
            ...newExpenseData
          };
          setExpenses([...expenses, newExpense]);
          localStorage.setItem('expenses', JSON.stringify([...expenses, newExpense]));
        }
      }

      setAmount('');
      setCategory('');
      setExpenseDescription('');
      setIsExpenseRecurring(false);
      setExpenseFrequency('monthly');
      setExpenseEndDate('');
      const currentDate = new Date();
      setExpenseDate(currentDate.toISOString().split('T')[0]);
      setError('');
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense: ' + error.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?');
    if (confirmed) {
      try {
        if (user) {
          // Delete from Firestore if user is logged in
          await expensesAPI.deleteExpense(user.uid, id);
        } else {
          // Delete from localStorage if user is not logged in
          const updated = expenses.filter(expense => expense.id !== id);
          localStorage.setItem('expenses', JSON.stringify(updated));
        }
        
        setExpenses(expenses.filter(expense => expense.id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError('Failed to delete expense: ' + error.message);
      }
    }
  };

  const handleEditExpense = (id) => {
    const expense = expenses.find(exp => exp.id === id);
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setExpenseDate(expense.date);
      setExpenseDescription(expense.description || '');
      setIsExpenseRecurring(expense.isRecurring || false);
      setExpenseFrequency(expense.frequency || 'monthly');
      setExpenseEndDate(expense.endDate || '');
      setEditingExpenseId(id);
      setError('');
    }
  };

  // Add income handler
  const handleAddIncome = async (e) => {
    e.preventDefault();
    setError('');
    
    const numAmount = parseFloat(incomeAmount);
    
    // Validate amount
    if (!incomeAmount || incomeAmount.trim() === '') {
      setError('Please enter an income amount');
      return;
    }

    if (isNaN(numAmount)) {
      setError('Amount must be a valid number');
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    // Validate date
    if (!incomeDate) {
      setError('Please select a date');
      return;
    }

    // Validate date - ensure it's not in the future
    const selectedDate = new Date(incomeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('Date cannot be in the future');
      return;
    }

    try {
      const newIncomeData = {
        amount: numAmount,
        source: incomeSource.trim() || 'Other', // Default source if empty
        date: incomeDate
      };

      if (editingIncomeId) {
        // Update existing income
        if (user) {
          await incomeAPI.updateIncome(user.uid, editingIncomeId, newIncomeData);
        } else {
          const updated = income.map(inc => 
            inc.id === editingIncomeId ? { ...inc, ...newIncomeData } : inc
          );
          setIncome(updated);
          localStorage.setItem('income', JSON.stringify(updated));
        }
        
        setIncome(income.map(inc => 
          inc.id === editingIncomeId ? { id: editingIncomeId, ...newIncomeData } : inc
        ));
        setEditingIncomeId(null);
      } else {
        // Add new income
        if (user) {
          // Save to Firestore if user is logged in
          const savedIncome = await incomeAPI.addIncome(user.uid, newIncomeData);
          setIncome([...income, savedIncome]);
        } else {
          // Save to localStorage if user is not logged in
          const newIncome = {
            id: Date.now().toString(),
            ...newIncomeData
          };
          setIncome([...income, newIncome]);
          localStorage.setItem('income', JSON.stringify([...income, newIncome]));
        }
      }

      setIncomeAmount('');
      setIncomeSource('');
      const currentDate = new Date();
      setIncomeDate(currentDate.toISOString().split('T')[0]);
      setError('');
    } catch (error) {
      console.error('Error saving income:', error);
      setError('Failed to save income: ' + error.message);
    }
  };

  // Delete income handler
  const handleDeleteIncome = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this income entry?');
    if (confirmed) {
      try {
        if (user) {
          // Delete from Firestore if user is logged in
          await incomeAPI.deleteIncome(user.uid, id);
        } else {
          // Delete from localStorage if user is not logged in
          const updated = income.filter(inc => inc.id !== id);
          localStorage.setItem('income', JSON.stringify(updated));
        }
        
        setIncome(income.filter(inc => inc.id !== id));
      } catch (error) {
        console.error('Error deleting income:', error);
        setError('Failed to delete income: ' + error.message);
      }
    }
  };

  const handleEditIncome = (id) => {
    const inc = income.find(i => i.id === id);
    if (inc) {
      setIncomeAmount(inc.amount.toString());
      setIncomeSource(inc.source || '');
      setIncomeDate(inc.date);
      setEditingIncomeId(id);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setEditingIncomeId(null);
    setAmount('');
    setCategory('');
    setExpenseDescription('');
    setIsExpenseRecurring(false);
    setExpenseFrequency('monthly');
    setExpenseEndDate('');
    setIncomeAmount('');
    setIncomeSource('');
    const today = new Date();
    setExpenseDate(today.toISOString().split('T')[0]);
    setIncomeDate(today.toISOString().split('T')[0]);
    setError('');
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = income.reduce((sum, inc) => sum + inc.amount, 0);

  // Generate recurring expense instances based on isRecurring flag on individual expenses
  const getGeneratedRecurringInstances = () => {
    const generatedExpenses = [];
    const seenKeys = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for comparison
    
    // Determine the date range to generate instances for
    let startDate, endDate;
    
    if (selectedMonth === 'all' && selectedYear === 'all') {
      // For "all" filter, generate for past 12 months and next 12 months
      const todayDate = new Date();
      startDate = new Date(todayDate.getFullYear() - 1, todayDate.getMonth(), 1);
      endDate = new Date(todayDate.getFullYear() + 1, todayDate.getMonth() + 1, 0);
    } else {
      // Generate only for the selected month/year
      const year = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
      const month = selectedMonth === 'all' ? new Date().getMonth() : parseInt(selectedMonth) - 1;
      
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0);
    }

    // Process each recurring expense
    expenses.forEach((expense) => {
      if (!expense.isRecurring) {
        return; // Skip non-recurring expenses
      }

      const expenseStartDate = new Date(expense.date);
      const expenseEndDate = expense.endDate ? new Date(expense.endDate) : null;

      // Check if this recurring expense is active during the selected period
      if (expenseStartDate > endDate) {
        return; // Recurring expense hasn't started yet
      }

      if (expenseEndDate && expenseEndDate < startDate) {
        return; // Recurring expense has already ended
      }

      const frequency = expense.frequency || 'monthly';

      if (frequency === 'monthly') {
        // Generate monthly instances
        const dayOfMonth = expenseStartDate.getDate();
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          // Create a date with the same day of month as the original expense
          const instanceDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);

          // Check if this instance is within valid range
          if (instanceDate >= expenseStartDate && (!expenseEndDate || instanceDate <= expenseEndDate) &&
              instanceDate >= startDate && instanceDate <= endDate) {
            const dateStr = instanceDate.toISOString().split('T')[0];
            const uniqueKey = `${expense.id}-${dateStr}`;

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const instanceDateForComparison = new Date(dateStr);
              instanceDateForComparison.setHours(0, 0, 0, 0);
              const isProjected = instanceDateForComparison > today;
              
              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }

          // Move to next month
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      } else if (frequency === 'weekly') {
        // Generate weekly instances
        let currentDate = new Date(expenseStartDate);

        while (currentDate <= endDate && (!expenseEndDate || currentDate <= expenseEndDate)) {
          if (currentDate >= startDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const uniqueKey = `${expense.id}-${dateStr}`;

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const instanceDateForComparison = new Date(dateStr);
              instanceDateForComparison.setHours(0, 0, 0, 0);
              const isProjected = instanceDateForComparison > today;
              
              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }

          // Move to next week
          currentDate.setDate(currentDate.getDate() + 7);
        }
      }
    });

    return generatedExpenses;
  };

  const getFilteredExpenses = () => {
    const filtered = expenses.filter((expense) => {
      // Parse ISO date format (YYYY-MM-DD)
      const [year, month, day] = expense.date.split('-').map(Number);
      
      // Check month filter
      const monthMatch = selectedMonth === 'all' || month === parseInt(selectedMonth);
      
      // Check year filter
      const yearMatch = selectedYear === 'all' || year === parseInt(selectedYear);
      
      // If no search query, return month/year filtered
      if (!searchQuery.trim()) {
        return monthMatch && yearMatch;
      }
      
      // Apply month/year and search filters
      const searchLower = searchQuery.toLowerCase();
      const categoryMatch = expense.category.toLowerCase().includes(searchLower);
      
      return monthMatch && yearMatch && categoryMatch;
    });

    // Add generated recurring expense instances based on isRecurring flag
    const generatedExpenses = getGeneratedRecurringInstances();
    
    return [...filtered, ...generatedExpenses];
  };

  const filteredExpenses = getFilteredExpenses();

  const getFilteredTotal = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getFilteredIncome = () => {
    return income.filter((inc) => {
      // Parse ISO date format (YYYY-MM-DD)
      const [year, month, day] = inc.date.split('-').map(Number);
      
      // Check month filter
      const monthMatch = selectedMonth === 'all' || month === parseInt(selectedMonth);
      
      // Check year filter
      const yearMatch = selectedYear === 'all' || year === parseInt(selectedYear);
      
      return monthMatch && yearMatch;
    });
  };

  const getFilteredIncomeTotal = () => {
    return getFilteredIncome().reduce((sum, inc) => sum + inc.amount, 0);
  };

  const getRemainingBalance = () => {
    return getFilteredIncomeTotal() - getFilteredTotal();
  };

  // Group expenses by week within the current month
  const getExpensesByWeek = () => {
    const weeks = {
      1: { label: 'Week 1', startDate: null, endDate: null, expenses: [], total: 0, count: 0 },
      2: { label: 'Week 2', startDate: null, endDate: null, expenses: [], total: 0, count: 0 },
      3: { label: 'Week 3', startDate: null, endDate: null, expenses: [], total: 0, count: 0 },
      4: { label: 'Week 4', startDate: null, endDate: null, expenses: [], total: 0, count: 0 },
      5: { label: 'Week 5', startDate: null, endDate: null, expenses: [], total: 0, count: 0 }
    };

    // Get the current selected month and year
    const year = selectedYear === 'all' ? new Date().getFullYear() : parseInt(selectedYear);
    const month = selectedMonth === 'all' ? new Date().getMonth() : parseInt(selectedMonth) - 1;

    // Set up week date ranges within the month
    const lastDay = new Date(year, month + 1, 0);

    // Helper function to find the Sunday of the week containing a given day
    const getSundayOfWeek = (dayOfMonth) => {
      const date = new Date(year, month, dayOfMonth);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
      const sunday = new Date(date);
      sunday.setDate(sunday.getDate() - daysToSubtract);
      return sunday;
    };

    for (let weekNum = 1; weekNum <= 5; weekNum++) {
      const weekStart = Math.max(1, (weekNum - 1) * 7 + 1);
      const weekEnd = Math.min(lastDay.getDate(), weekNum * 7);

      if (weekStart <= lastDay.getDate()) {
        // Get the Sunday of the week that contains the first day of this date range
        weeks[weekNum].startDate = getSundayOfWeek(weekStart);
        weeks[weekNum].endDate = new Date(year, month, weekEnd);
      }
    }

    // Group filtered expenses into weeks
    filteredExpenses.forEach((expense) => {
      const [expYear, expMonth, expDay] = expense.date.split('-').map(Number);

      // Only include expenses from the selected month/year
      if (expYear === year && expMonth === month + 1) {
        const dayOfMonth = parseInt(expDay);
        let weekNum = Math.ceil(dayOfMonth / 7);
        weekNum = Math.max(1, Math.min(weekNum, 5)); // Clamp to 1-5

        if (weeks[weekNum]) {
          weeks[weekNum].expenses.push(expense);
          weeks[weekNum].total += expense.amount;
          weeks[weekNum].count += 1;
        }
      }
    });

    // Return only weeks that have a valid date range (exist in this month)
    return Object.values(weeks).filter(week => week.startDate !== null);
  };

  // Get expense trend data for the last 6 months
  const getMonthlyTrendData = () => {
    const trendData = [];
    const today = new Date();
    
    // Generate data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth() + 1;
      
      // Format month label (e.g., "Jan 2026", "Feb 2026")
      const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      
      // Calculate total expenses for this month
      let monthTotal = 0;
      expenses.forEach((expense) => {
        const [expYear, expMonth, expDay] = expense.date.split('-').map(Number);
        if (expYear === year && expMonth === month) {
          monthTotal += expense.amount;
        }
      });
      
      trendData.push({
        month: monthLabel,
        total: monthTotal,
        year: year,
        monthNum: month
      });
    }
    
    return trendData;
  };

  // Get monthly insight comparing current month vs last month
  const getMonthlyInsight = () => {
    // Current month/year
    const currentMonth = parseInt(selectedMonth);
    const currentYear = parseInt(selectedYear);
    
    // Skip if "all" is selected or months less than 1
    if (currentMonth < 1 || currentMonth > 12) {
      return null;
    }
    
    // Calculate last month/year
    let lastMonth = currentMonth - 1;
    let lastYear = currentYear;
    if (lastMonth < 1) {
      lastMonth = 12;
      lastYear = currentYear - 1;
    }
    
    // Calculate current month total
    let currentMonthTotal = 0;
    expenses.forEach((expense) => {
      const [expYear, expMonth] = expense.date.split('-').map(Number);
      if (expYear === currentYear && expMonth === currentMonth) {
        currentMonthTotal += expense.amount;
      }
    });
    
    // Calculate last month total
    let lastMonthTotal = 0;
    expenses.forEach((expense) => {
      const [expYear, expMonth] = expense.date.split('-').map(Number);
      if (expYear === lastYear && expMonth === lastMonth) {
        lastMonthTotal += expense.amount;
      }
    });
    
    // If no data for last month, return null
    if (lastMonthTotal === 0) {
      return null;
    }
    
    // Calculate percentage difference
    const percentageDifference = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    
    let message = '';
    if (percentageDifference > 0) {
      message = `You spent ${Math.round(percentageDifference)}% more than last month`;
    } else if (percentageDifference < 0) {
      message = `You saved ${Math.round(Math.abs(percentageDifference))}% compared to last month`;
    } else {
      message = `You spent the same as last month`;
    }
    
    return {
      message,
      percentage: percentageDifference,
      currentMonthTotal,
      lastMonthTotal
    };
  };

  const getFilteredCategoryBreakdown = () => {
    const breakdown = {};
    
    filteredExpenses.forEach((expense) => {
      if (breakdown[expense.category]) {
        breakdown[expense.category] += expense.amount;
      } else {
        breakdown[expense.category] = expense.amount;
      }
    });

    return Object.entries(breakdown)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  };

  const getCategoryBreakdown = () => {
    const breakdown = {};
    
    expenses.forEach((expense) => {
      if (breakdown[expense.category]) {
        breakdown[expense.category] += expense.amount;
      } else {
        breakdown[expense.category] = expense.amount;
      }
    });

    return Object.entries(breakdown)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  };

  // Generate expenses from recurring expenses
  // Save expenses to localStorage only for non-authenticated users
  // For authenticated users, expenses are saved to Firestore via handleAddExpense
  useEffect(() => {
    // Only save to localStorage if user is not logged in
    if (!user) {
      try {
        localStorage.setItem('expenses', JSON.stringify(expenses));
      } catch (error) {
        console.error('Error saving expenses to localStorage:', error);
      }
    }
  }, [expenses, user]);
  // Save income to localStorage only for non-authenticated users
  // For authenticated users, income is saved to Firestore via handleAddIncome
  useEffect(() => {
    // Only save to localStorage if user is not logged in
    if (!user) {
      try {
        localStorage.setItem('income', JSON.stringify(income));
      } catch (error) {
        console.error('Error saving income to localStorage:', error);
      }
    }
  }, [income, user]);
  useEffect(() => {
    try {
      localStorage.setItem('darkMode', JSON.stringify(darkMode));
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  }, [darkMode]);

  // Helper function to validate and clean expense data
  const validateExpenseData = (expenses) => {
    if (!Array.isArray(expenses)) return [];
    
    return expenses.filter(expense => {
      // Check if date exists and is in valid ISO format (YYYY-MM-DD)
      if (!expense.date || typeof expense.date !== 'string') return false;
      const dateParts = expense.date.split('-');
      return dateParts.length === 3 && dateParts.every(part => part && /^\d+$/.test(part));
    });
  };

  // Listen for Firebase auth state changes and load expenses and income
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      try {
        if (currentUser) {
          // Load expenses and income from Firestore for logged-in user
          setExpensesLoading(true);
          const firestoreExpenses = await expensesAPI.getExpenses(currentUser.uid);
          const validatedExpenses = validateExpenseData(firestoreExpenses);

          const firestoreIncome = await incomeAPI.getIncome(currentUser.uid);
          const validatedIncome = validateExpenseData(firestoreIncome);
          
          setExpenses(validatedExpenses);
          setIncome(validatedIncome);
        } else {
          // Load from localStorage for logged-out users
          let expenses = [];
          const savedExpenses = localStorage.getItem('expenses');
          if (savedExpenses) {
            const parsed = JSON.parse(savedExpenses);
            expenses = validateExpenseData(parsed);
          }

          const savedIncome = localStorage.getItem('income');
          let income = [];
          if (savedIncome) {
            const parsed = JSON.parse(savedIncome);
            income = validateExpenseData(parsed);
          }

          setExpenses(expenses);
          setIncome(income);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data. Please try again.');
        setExpenses([]);
        setIncome([]);
      } finally {
        setExpensesLoading(false);
        setAuthLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in error:', error);
      setError('Failed to sign in: ' + error.message);
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout: ' + error.message);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              expenses={expenses}
              amount={amount}
              setAmount={setAmount}
              category={category}
              setCategory={setCategory}
              error={error}
              setError={setError}
              expenseDate={expenseDate}
              setExpenseDate={setExpenseDate}
              expenseDescription={expenseDescription}
              setExpenseDescription={setExpenseDescription}
              isExpenseRecurring={isExpenseRecurring}
              setIsExpenseRecurring={setIsExpenseRecurring}
              expenseFrequency={expenseFrequency}
              setExpenseFrequency={setExpenseFrequency}
              expenseEndDate={expenseEndDate}
              setExpenseEndDate={setExpenseEndDate}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
              editingExpenseId={editingExpenseId}
              formatCurrency={formatCurrency}
              totalAmount={totalAmount}
              getCategoryBreakdown={getCategoryBreakdown}
              user={user}
              authLoading={authLoading}
              onSignInWithGoogle={handleSignInWithGoogle}
              onLogout={handleLogout}
              income={income}
              incomeAmount={incomeAmount}
              setIncomeAmount={setIncomeAmount}
              incomeSource={incomeSource}
              setIncomeSource={setIncomeSource}
              incomeDate={incomeDate}
              setIncomeDate={setIncomeDate}
              totalIncome={totalIncome}
              onAddIncome={handleAddIncome}
              onDeleteIncome={handleDeleteIncome}
              onEditIncome={handleEditIncome}
              editingIncomeId={editingIncomeId}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              getFilteredIncomeTotal={getFilteredIncomeTotal}
              getFilteredTotal={getFilteredTotal}
              getRemainingBalance={getRemainingBalance}
              getExpensesByWeek={getExpensesByWeek}
              getMonthlyTrendData={getMonthlyTrendData}
              getMonthlyInsight={getMonthlyInsight}
              showIncomeForm={showIncomeForm}
              setShowIncomeForm={setShowIncomeForm}
              onCancelEdit={handleCancelEdit}
              formatDate={formatDate}
              expensesLoading={expensesLoading}
            />
          }
        />
        <Route
          path="/expenses"
          element={
            <ExpensesPage
              expenses={expenses}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              onDeleteExpense={handleDeleteExpense}
              onEditExpense={handleEditExpense}
              editingExpenseId={editingExpenseId}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getFilteredExpenses={getFilteredExpenses}
              getFilteredTotal={getFilteredTotal}
              getExpensesByWeek={getExpensesByWeek}
              exportToCSV={exportToCSV}
              user={user}
              authLoading={authLoading}
              onSignInWithGoogle={handleSignInWithGoogle}
              onLogout={handleLogout}
              income={income}
              totalIncome={totalIncome}
              onDeleteIncome={handleDeleteIncome}
              onEditIncome={handleEditIncome}
              editingIncomeId={editingIncomeId}
              onCancelEdit={handleCancelEdit}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

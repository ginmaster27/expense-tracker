import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  googleProvider,
  expensesAPI,
  incomeAPI,
  familyGroupsAPI,
  usersAPI,
  sipsAPI,
  sipTopUpsAPI,
  insurancePoliciesAPI,
  vehicleInsurancePoliciesAPI,
  vehiclePollutionRecordsAPI
} from './firebase';
import Dashboard from './Dashboard';
import FamilyDashboard from './FamilyDashboard';
import ExpensesPage from './ExpenseList';
import InvestmentsModule from './InvestmentsModule';
import Toast from './Toast';
import './App.css';
import './HamburgerMenu.css';

function App() {
  // Initialize expenses as empty - they will be loaded from Firestore (if logged in) or localStorage (if logged out) in the auth effect
  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [expenseDescription, setExpenseDescription] = useState('');
  const [isExpenseRecurring, setIsExpenseRecurring] = useState(false);
  const [expenseFrequency, setExpenseFrequency] = useState('monthly');
  const [expenseEndDate, setExpenseEndDate] = useState('');
  const [expenseType, setExpenseType] = useState('shared'); // 'personal' | 'shared' (defaults to shared)

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
  const [sips, setSips] = useState([]);
  const [insurancePolicies, setInsurancePolicies] = useState([]);
  const [vehicleInsurancePolicies, setVehicleInsurancePolicies] = useState([]);
  const [pollutionRecords, setPollutionRecords] = useState([]);
  const [familySips, setFamilySips] = useState([]);
  const [familySipTopUps, setFamilySipTopUps] = useState([]);
  const [familyInsurancePolicies, setFamilyInsurancePolicies] = useState([]);
  const [familyVehicleInsurancePolicies, setFamilyVehicleInsurancePolicies] = useState([]);
  const [familyPollutionRecords, setFamilyPollutionRecords] = useState([]);
  const [familyIncome, setFamilyIncome] = useState([]);
  const [incomeAmount, setIncomeAmount] = useState('');
  
  // Family shared expenses state
  const [familySharedExpenses, setFamilySharedExpenses] = useState([]);
  // Family personal expenses (all members) - for family total calculation
  const [familyPersonalExpenses, setFamilyPersonalExpenses] = useState([]);
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeDate, setIncomeDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editingIncomeId, setEditingIncomeId] = useState(null);
  
  // Recurring edit scope state
  const [showRecurringEditScope, setShowRecurringEditScope] = useState(false);
  const [recurringEditInstance, setRecurringEditInstance] = useState(null);
  const [recurringEditScope, setRecurringEditScope] = useState(null); // 'this', 'future', or 'all'
  
  // Toggle states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  
  // Loading states for form submissions
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);
  
  // Family group state
  const [userGroup, setUserGroup] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);
  const [viewingFamilyDashboard, setViewingFamilyDashboard] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = 'success', duration = 3000) => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, duration);
  };
  
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
    
    const [year, month] = isoDate.split('-');
    if (!year || !month) {
      return 'Invalid date';
    }
    
    const day = isoDate.split('-')[2];
    if (!day) {
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
    setIsSubmittingExpense(true);
    
    const trimmedCategory = category.trim();
    const numAmount = parseFloat(amount);
    
    // Validate amount
    if (!amount || amount.trim() === '') {
      setError('Please enter an amount');
      setIsSubmittingExpense(false);
      return;
    }

    if (isNaN(numAmount)) {
      setError('Amount must be a valid number');
      setIsSubmittingExpense(false);
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      setIsSubmittingExpense(false);
      return;
    }

    // Validate category
    if (!trimmedCategory) {
      setError('Please select a category');
      setIsSubmittingExpense(false);
      return;
    }

    // Validate date - ensure it's selected
    if (!expenseDate) {
      setError('Please select a date');
      setIsSubmittingExpense(false);
      return;
    }

    // Validate date - ensure it's not in the future
    const selectedDate = new Date(expenseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day

    if (selectedDate > today) {
      setError('Date cannot be in the future');
      setIsSubmittingExpense(false);
      return;
    }

    try {
      const newExpenseData = {
        amount: numAmount,
        category: trimmedCategory,
        date: expenseDate,
        description: expenseDescription.trim(),
        isRecurring: isExpenseRecurring,
        type: expenseType // 'personal' | 'shared'
      };

      // Add recurring-specific fields if marking as recurring
      if (isExpenseRecurring) {
        newExpenseData.frequency = expenseFrequency;
        newExpenseData.endDate = expenseEndDate;
      }

      if (editingExpenseId) {
        // Handle different edit scenarios
        
        // Check if this is a recurring edit with scope
        const isOverride = editingExpenseId.startsWith('override-');
        const isSplit = editingExpenseId.startsWith('split-');
        const actualEditingId = editingExpenseId.replace('override-', '').replace('split-', '');
        
        if (isOverride && recurringEditScope === 'this') {
          // EDIT ONLY THIS OCCURRENCE
          // Extract the date and base ID from the special ID format
          // actualEditingId format: YYYY-MM-DD-baseId or similar
          const parts = actualEditingId.split('-');
          const dateStr = parts.slice(0, 3).join('-'); // YYYY-MM-DD
          const baseId = parts.slice(3).join('-'); // remaining is baseId
          
          // Find the master recurring record
          const masterId = baseId;
          const masterRecord = expenses.find(exp => exp.id === masterId && exp.isRecurring);
          
          if (masterRecord) {
            // Create a one-time override expense for this specific date
            const overrideData = {
              ...newExpenseData,
              isRecurring: false, // Make it a one-time expense
              overriddenDate: dateStr, // Mark which date it overrides
              createdBy: masterRecord.createdBy || user.uid
            };
            
            // Only add groupId for shared expenses
            if (newExpenseData.type === 'shared') {
              overrideData.groupId = masterRecord.groupId || userGroup?.id;
            }
            
            // Generate a unique ID for this override
            const overrideId = `${masterId}-override-${dateStr}`;
            const overrideExpense = { id: overrideId, ...overrideData };
            
            // Add the override expense
            const updatedExpenses = [...expenses, overrideExpense];
            
            // Update master record to exclude this date
            const updatedMaster = {
              ...masterRecord,
              excludedDates: [...(masterRecord.excludedDates || []), dateStr]
            };
            
            // Replace master and add override
            const finalExpenses = updatedExpenses.map(exp => 
              exp.id === masterId ? updatedMaster : exp
            );
            
            // Update state and cache immediately (optimistic update)
            updateExpenseCacheOptimistically(finalExpenses);
            
            // Sync to Firestore in background (don't await)
            if (user) {
              expensesAPI.updateExpense(user.uid, masterId, {
                ...updatedMaster,
                excludedDates: updatedMaster.excludedDates
              }).catch(error => {
                console.error('Error syncing override master to Firestore:', error);
              });
              expensesAPI.addExpense(user.uid, overrideData).catch(error => {
                console.error('Error syncing override to Firestore:', error);
              });
            }
            showToast('This occurrence has been modified independently', 'success');
          }
        } else if (isSplit && recurringEditScope === 'future') {
          // EDIT THIS AND FUTURE OCCURRENCES
          // Split the recurring rule:
          // 1. Shorten the original recurring rule to end before this date
          // 2. Create a new recurring rule starting from this date
          
          const parts = actualEditingId.split('-');
          const dateStr = parts.slice(0, 3).join('-'); // YYYY-MM-DD
          const baseId = parts.slice(3).join('-'); // remaining is baseId
          
          const masterRecord = expenses.find(exp => exp.id === baseId && exp.isRecurring);
          
          if (masterRecord) {
            // Get the day before this date for the original rule's end date
            const splitDate = new Date(dateStr);
            splitDate.setDate(splitDate.getDate() - 1);
            const originalEndDate = splitDate.toISOString().split('T')[0];
            
            // Update the original rule to end before this date
            const updatedMaster = {
              ...masterRecord,
              endDate: originalEndDate
            };
            
            // Create a new recurring rule starting from this date
            const newRecurringId = `${Date.now()}-${baseId}-split`;
            const newRecurringRule = {
              id: newRecurringId,
              amount: newExpenseData.amount,
              category: newExpenseData.category,
              date: dateStr, // Start from this date
              description: newExpenseData.description,
              isRecurring: true,
              frequency: newExpenseData.frequency || masterRecord.frequency,
              endDate: newExpenseData.endDate || masterRecord.endDate,
              type: newExpenseData.type,
              createdBy: masterRecord.createdBy || user.uid
            };
            
            // Only add groupId for shared expenses
            if (newExpenseData.type === 'shared') {
              newRecurringRule.groupId = masterRecord.groupId || userGroup?.id;
            }
            
            // Update in all member collections if shared
            const updatedExpenses = expenses.map(exp => 
              exp.id === baseId ? updatedMaster : exp
            );
            updatedExpenses.push(newRecurringRule);
            
            // Update state and cache immediately (optimistic update)
            updateExpenseCacheOptimistically(updatedExpenses);
            
            // Sync to Firestore in background (don't await)
            if (user) {
              expensesAPI.updateExpense(user.uid, baseId, updatedMaster)
                .catch(error => {
                  console.error('Error syncing split master to Firestore:', error);
                });
              expensesAPI.addExpense(user.uid, newRecurringRule)
                .catch(error => {
                  console.error('Error syncing split new rule to Firestore:', error);
                });
            }
            showToast('Recurring rule split. New rule created from this date forward.', 'success');
          }
        } else {
          // EDIT ENTIRE SERIES or regular expense
          // Update existing expense as normal
          const expenseToUpdate = expenses.find(exp => exp.id === editingExpenseId);
          const isRecurringUpdate = expenseToUpdate?.isRecurring;
          
          // Prepare complete expense data with metadata preserved
          const expenseDataToSave = {
            ...newExpenseData,
            createdBy: expenseToUpdate?.createdBy || user?.uid
          };
          
          // Only add groupId for shared expenses
          if (newExpenseData.type === 'shared') {
            expenseDataToSave.groupId = expenseToUpdate?.groupId || userGroup?.id;
          }
          
          // Update state and cache immediately (optimistic update)
          const updated = expenses.map(exp => 
            exp.id === editingExpenseId ? { id: editingExpenseId, ...expenseDataToSave } : exp
          );
          updateExpenseCacheOptimistically(updated);
          
          // Sync to Firestore in background (don't await)
          if (user) {
            expensesAPI.updateExpense(user.uid, editingExpenseId, expenseDataToSave)
              .catch(error => {
                console.error('Error syncing update to Firestore (using local cache):', error);
                // Data is already in local cache, so don't show error to user
              });
          }
          
          const updateType = isRecurringUpdate ? 'Recurring expense' : 'Expense';
          showToast(`${updateType} updated successfully. All instances updated.`, 'success');
        }
        
        setEditingExpenseId(null);
        setRecurringEditScope(null);
      } else {
        // Add new expense
        // Generate expense with ID immediately for optimistic update
        const expenseId = Date.now().toString();
        const expenseDataToSave = {
          ...newExpenseData,
          createdBy: user?.uid
        };
        
        // Only add groupId for shared expenses
        if (newExpenseData.type === 'shared') {
          expenseDataToSave.groupId = userGroup?.id;
        }
        
        const newExpense = { id: expenseId, ...expenseDataToSave };
        const updatedExpenses = [...expenses, newExpense];
        
        // Update state and cache immediately (optimistic update)
        updateExpenseCacheOptimistically(updatedExpenses);
        
        // Sync to Firestore in background (don't await)
        if (user) {
          expensesAPI.addExpense(user.uid, expenseDataToSave)
            .catch(error => {
              console.error('Error syncing expense to Firestore (using local cache):', error);
              // Data is already in local cache, so don't show error to user
            });
        }
        
        showToast('Expense added successfully', 'success');
      }

      setAmount('');
      setCategory('');
      setExpenseDescription('');
      setIsExpenseRecurring(false);
      setExpenseFrequency('monthly');
      setExpenseEndDate('');
      setExpenseType('shared');
      const currentDate = new Date();
      setExpenseDate(currentDate.toISOString().split('T')[0]);
      setError('');
    } catch (error) {
      console.error('Error saving expense:', error);
      setError('Failed to save expense: ' + error.message);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    // Check if deleting a recurring expense instance or a regular expense
    const expenseToDelete = expenses.find(exp => exp.id === id);
    
    // Detect if this is a generated recurring expense instance
    // Generated instances have ids like "base-id-YYYY-MM-DD" and isGenerated: true
    const isGeneratedInstance = expenseToDelete?.isGenerated;
    const isRecurringInstance = isGeneratedInstance && id.includes('-') && /^\d{4}-\d{2}-\d{2}$/.test(id.split('-').slice(-3).join('-'));
    
    let deleteTitle = 'Delete Expense?';
    let deleteMessage = 'Are you sure you want to delete this expense?\n\nThis action cannot be undone.';
    
    if (isRecurringInstance) {
      deleteTitle = 'Delete This Occurrence?';
      deleteMessage = '⚠️ Delete only this single occurrence?\n\nThe recurring series will continue, and this date will be excluded.\n\nThis action cannot be undone.';
    } else if (expenseToDelete?.isRecurring) {
      deleteTitle = 'Delete Entire Recurring Series?';
      deleteMessage = '⚠️ Delete the entire recurring series?\n\nAll current and future occurrences will be deleted.\nYou can delete individual occurrences instead.\n\nThis action cannot be undone.';
    }
    
    const confirmed = window.confirm(deleteTitle + '\n\n' + deleteMessage);
    if (confirmed) {
      try {
        if (isRecurringInstance) {
          // This is an instance of a recurring expense
          // Extract the date from the instance id (format: baseId-YYYY-MM-DD)
          const dateParts = id.split('-').slice(-3);
          const excludedDate = dateParts.join('-');
          
          // Find the master recurring record
          // The base id is everything except the last date part
          const baseId = id.substring(0, id.lastIndexOf('-' + excludedDate));
          const masterRecord = expenses.find(exp => exp.id === baseId && exp.isRecurring);
          
          if (masterRecord && user) {
            // Update master record to exclude this date
            const excludedDates = [...(masterRecord.excludedDates || []), excludedDate];
            const updatedMaster = { 
              ...masterRecord, 
              excludedDates,
              createdBy: masterRecord.createdBy || user.uid,
              groupId: masterRecord.groupId || (masterRecord.type === 'shared' ? userGroup?.id : undefined)
            };
            
            // Update state and cache immediately (optimistic update)
            const updated = expenses.map(exp => 
              exp.id === baseId ? updatedMaster : exp
            );
            updateExpenseCacheOptimistically(updated);
            
            // Sync to Firestore in background (don't await)
            expensesAPI.updateExpense(user.uid, baseId, updatedMaster)
              .catch(error => {
                console.error('Error syncing exclusion to Firestore (using local cache):', error);
              });
            
            showToast('This occurrence removed from recurring series', 'success');
          } else if (isRecurringInstance) {
            // For all users, handle recurring instance deletion optimistically
            const dateParts = id.split('-').slice(-3);
            const excludedDate = dateParts.join('-');
            const baseId = id.substring(0, id.lastIndexOf('-' + excludedDate));
            const masterRecord = expenses.find(exp => exp.id === baseId && exp.isRecurring);
            
            if (masterRecord) {
              const excludedDates = [...(masterRecord.excludedDates || []), excludedDate];
              const updatedMaster = { ...masterRecord, excludedDates };
              const updated = expenses.map(exp => exp.id === baseId ? updatedMaster : exp);
              
              // Update state and cache immediately (optimistic update)
              updateExpenseCacheOptimistically(updated);
              
              // Sync to Firestore in background if user is logged in
              if (user) {
                expensesAPI.updateExpense(user.uid, baseId, updatedMaster)
                  .catch(error => {
                    console.error('Error syncing instance exclusion to Firestore:', error);
                  });
              }
              
              showToast('This occurrence removed from recurring series', 'success');
            }
          }
        } else {
          // Regular expense deletion (not a recurring instance)
          // Update state and cache immediately (optimistic update)
          const updated = expenses.filter(expense => expense.id !== id);
          updateExpenseCacheOptimistically(updated);
          
          // Sync deletion to Firestore in background (don't await)
          if (user) {
            expensesAPI.deleteExpense(user.uid, id)
              .catch(error => {
                console.error('Error syncing deletion to Firestore (using local cache):', error);
                // Data is already removed from local cache
              });
          }
          showToast('Expense deleted successfully', 'success');
        }
      } catch (error) {
        console.error('Error deleting expense:', error);
        setError('Failed to delete expense: ' + error.message);
        showToast('Failed to delete expense', 'error');
      }
    }
  };

  const handleEditExpense = (id) => {
    // Load expense data for editing - works with both regular and recurring expenses
    // For recurring instances: shows a scope selector dialog
    
    // First, try to find the expense directly in the array
    let expense = expenses.find(exp => exp.id === id);
    
    // If not found, check if this is a generated recurring instance (pattern: baseId-YYYY-MM-DD)
    if (!expense && id.includes('-') && /^\d{4}-\d{2}-\d{2}$/.test(id.split('-').slice(-3).join('-'))) {
      // Extract the base ID and date from the instance ID
      const dateParts = id.split('-').slice(-3).join('-'); // YYYY-MM-DD
      const baseId = id.substring(0, id.lastIndexOf('-' + dateParts));
      
      // Find the master recurring record
      const masterRecord = expenses.find(exp => exp.id === baseId && exp.isRecurring);
      
      if (masterRecord) {
        // Create a mock instance object that includes master data
        expense = {
          ...masterRecord,
          id: id, // Use the instance ID
          date: dateParts, // Use the instance date
          isGenerated: true
        };
      }
    }
    
    if (expense) {
      // Check if this is a generated recurring instance (e.g., id includes date suffix)
      // Generated instances have format: baseId-YYYY-MM-DD and isGenerated: true
      if (expense.isGenerated && expense.isRecurring) {
        // This is a generated recurring instance - show scope selector
        setRecurringEditInstance(expense);
        setShowRecurringEditScope(true);
        return;
      }

      // Regular or master recurring expense - load form directly
      setAmount(expense.amount.toString());
      setCategory(expense.category);
      setExpenseDate(expense.date);
      setExpenseDescription(expense.description || '');
      setIsExpenseRecurring(expense.isRecurring || false);
      setExpenseFrequency(expense.frequency || 'monthly');
      setExpenseEndDate(expense.endDate || '');
      setExpenseType(expense.type || 'personal');
      setEditingExpenseId(id);
      setError('');
      setShowExpenseForm(true);
    }
  };

  // Handle recurring edit scope selection
  const handleRecurringEditScopeSelect = (scope) => {
    // scope: 'this' (only this occurrence), 'future' (this and future), 'all' (entire series)
    
    if (!recurringEditInstance) return;

    const instance = recurringEditInstance;
    
    // Extract instance date and base ID
    const instanceDate = instance.date; // YYYY-MM-DD
    const baseId = instance.id.replace(`-${instanceDate}`, '');
    const masterRecord = expenses.find(exp => exp.id === baseId && exp.isRecurring);

    if (scope === 'all') {
      // Edit entire series - edit the master record
      if (masterRecord) {
        setAmount(masterRecord.amount.toString());
        setCategory(masterRecord.category);
        setExpenseDate(masterRecord.date);
        setExpenseDescription(masterRecord.description || '');
        setIsExpenseRecurring(masterRecord.isRecurring);
        setExpenseFrequency(masterRecord.frequency);
        setExpenseEndDate(masterRecord.endDate || '');
        setExpenseType(masterRecord.type || 'personal');
        setEditingExpenseId(baseId);
        setRecurringEditScope('all');
      }
    } else if (scope === 'this') {
      // Edit only this occurrence - create a one-off override
      // Load the instance values but mark as non-recurring
      setAmount(instance.amount.toString());
      setCategory(instance.category);
      setExpenseDate(instance.date);
      setExpenseDescription(instance.description || '');
      setIsExpenseRecurring(false); // Will be a one-time expense
      setExpenseFrequency('monthly');
      setExpenseEndDate('');
      setExpenseType(instance.type || 'personal');
      setEditingExpenseId(`override-${instanceDate}-${baseId}`); // Special ID for override
      setRecurringEditScope('this');
    } else if (scope === 'future') {
      // Edit this and future occurrences - will split the recurring rule
      // Load the instance values as the new recurrence
      setAmount(instance.amount.toString());
      setCategory(instance.category);
      setExpenseDate(instance.date);
      setExpenseDescription(instance.description || '');
      setIsExpenseRecurring(true); // Will create new recurring from this date
      setExpenseFrequency(masterRecord?.frequency || 'monthly');
      setExpenseEndDate(masterRecord?.endDate || '');
      setExpenseType(instance.type || 'personal');
      setEditingExpenseId(`split-${instanceDate}-${baseId}`); // Special ID for split
      setRecurringEditScope('future');
    }

    setRecurringEditInstance(null);
    setShowRecurringEditScope(false);
    setError('');
    setShowExpenseForm(true);
  };

  // Add income handler
  const handleAddIncome = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmittingIncome(true);
    
    const numAmount = parseFloat(incomeAmount);
    
    // Validate amount
    if (!incomeAmount || incomeAmount.trim() === '') {
      setError('Please enter an income amount');
      setIsSubmittingIncome(false);
      return;
    }

    if (isNaN(numAmount)) {
      setError('Amount must be a valid number');
      setIsSubmittingIncome(false);
      return;
    }

    if (numAmount <= 0) {
      setError('Amount must be greater than 0');
      setIsSubmittingIncome(false);
      return;
    }

    // Validate date
    if (!incomeDate) {
      setError('Please select a date');
      setIsSubmittingIncome(false);
      return;
    }

    // Validate date - ensure it's not in the future
    const selectedDate = new Date(incomeDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      setError('Date cannot be in the future');
      setIsSubmittingIncome(false);
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
        showToast('Income updated successfully', 'success');
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
        showToast('Income added successfully', 'success');
      }

      setIncomeAmount('');
      setIncomeSource('');
      const currentDate = new Date();
      setIncomeDate(currentDate.toISOString().split('T')[0]);
      setError('');
    } catch (error) {
      console.error('Error saving income:', error);
      setError('Failed to save income: ' + error.message);
    } finally {
      setIsSubmittingIncome(false);
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
        showToast('Income deleted successfully', 'success');
      } catch (error) {
        console.error('Error deleting income:', error);
        setError('Failed to delete income: ' + error.message);
        showToast('Failed to delete income', 'error');
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
      setShowIncomeForm(true);
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

  // Helper function to expand recurring expense into all occurrences
  // Note: We don't include recurring master records directly (they're generated as instances)

  // DYNAMIC GENERATION OF RECURRING EXPENSE INSTANCES
  // This function is called on every render and generates instances dynamically from master records
  // 
  // How it works:
  // 1. Only master recurring records (isRecurring: true) are stored in Firestore/localStorage
  // 2. Instances are generated on-demand based on the date filter (month/year selection)
  // 3. When a recurring expense is edited, the master record updates
  // 4. On next render, this function regenerates ALL instances with the new values
  // 5. No duplicate storage needed - scales efficiently
  //
  // This approach ensures:
  // Format a Date object to ISO date string (YYYY-MM-DD) without timezone conversion
  const formatDateToISO = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseISODate = (dateString, endOfDay = false) => {
    if (!dateString) {
      return null;
    }

    if (dateString.toDate && typeof dateString.toDate === 'function') {
      const date = dateString.toDate();
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }

    if (dateString instanceof Date) {
      const date = new Date(dateString);
      date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
      return date;
    }

    if (typeof dateString !== 'string') {
      return null;
    }

    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) {
      return null;
    }

    return new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
  };

  const getSIPStatus = (sip) => (sip.status || 'Active').trim().toLowerCase();

  const getSIPStopDate = (sip) => {
    const status = getSIPStatus(sip);
    if (status !== 'paused' && status !== 'stopped') {
      return null;
    }

    return parseISODate(sip.statusDate, true) || parseISODate(formatDateToISO(new Date()), true);
  };

  const getGeneratedSIPExpenseInstancesForDateRange = (startDate, endDate, sipItems = sips) => {
    const generatedExpenses = [];

    sipItems.forEach((sip) => {
      const frequency = (sip.frequency || 'Monthly').trim().toLowerCase();
      const isMonthly = frequency.includes('month') || frequency === 'monthy';
      const isYearly = frequency.includes('year');
      const isOneTime = frequency === 'one-time' || frequency === 'one time' || frequency === 'onetime';
      if (!isMonthly && !isYearly && !isOneTime) {
        return;
      }

      const sipStartDate = parseISODate(sip.startDate);
      const renewalDate = parseISODate(sip.renewalDate);
      const firstKnownDate = sipStartDate || renewalDate;
      if (!firstKnownDate) {
        return;
      }

      const explicitEndDate = sip.endDate ? parseISODate(sip.endDate, true) : null;
      const stopDate = getSIPStopDate(sip);
      const effectiveEndDate = [explicitEndDate, stopDate].filter(Boolean).sort((a, b) => a - b)[0] || null;

      if (firstKnownDate > endDate || (effectiveEndDate && effectiveEndDate < startDate)) {
        return;
      }

      const addSIPExpense = (expenseDate, idSuffix, generatedFrequency, isRecurringExpense) => {
        if (!expenseDate || expenseDate < startDate || expenseDate > endDate || (effectiveEndDate && expenseDate > effectiveEndDate)) {
          return;
        }

        const dateStr = formatDateToISO(expenseDate);
        generatedExpenses.push({
          id: `sip-${sip.id}-${idSuffix || dateStr}`,
          amount: parseFloat(sip.amount) || 0,
          category: 'Investments',
          date: dateStr,
          description: `SIP: ${sip.sipName}`,
          type: 'personal',
          source: 'sip',
          sourceId: sip.id,
          isGenerated: true,
          isSIPExpense: true,
          isRecurring: isRecurringExpense,
          frequency: generatedFrequency,
          createdBy: sip.createdBy || user?.uid
        });
      };

      if (isOneTime) {
        addSIPExpense(firstKnownDate, `one-time-${formatDateToISO(firstKnownDate)}`, 'one-time', false);
        return;
      }

      if (sipStartDate) {
        addSIPExpense(sipStartDate, `start-${formatDateToISO(sipStartDate)}`, 'one-time', false);
      }

      if (isMonthly) {
        const anchorDate = renewalDate || sipStartDate;
        const recurrenceDay = anchorDate.getDate();
        const firstMonth = new Date(firstKnownDate.getFullYear(), firstKnownDate.getMonth(), 1);
        const rangeStartMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        let currentMonth = firstMonth > rangeStartMonth ? firstMonth : rangeStartMonth;

        while (currentMonth <= endDate) {
          const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
          const occurrenceDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            Math.min(recurrenceDay, lastDayOfMonth)
          );

          const isAfterInitialPayment = sipStartDate ? occurrenceDate > sipStartDate : occurrenceDate >= firstKnownDate;
          if (isAfterInitialPayment) {
            addSIPExpense(occurrenceDate, formatDateToISO(occurrenceDate), 'monthly', true);
          }

          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }

        return;
      }

      if (isYearly) {
        const anchorDate = renewalDate || sipStartDate;
        const recurrenceMonth = anchorDate.getMonth();
        const recurrenceDay = anchorDate.getDate();
        const firstYear = Math.max(firstKnownDate.getFullYear(), startDate.getFullYear());

        for (let year = firstYear; year <= endDate.getFullYear(); year += 1) {
          const lastDayOfMonth = new Date(year, recurrenceMonth + 1, 0).getDate();
          const occurrenceDate = new Date(year, recurrenceMonth, Math.min(recurrenceDay, lastDayOfMonth));
          const isAfterInitialPayment = sipStartDate ? occurrenceDate > sipStartDate : occurrenceDate >= firstKnownDate;
          if (isAfterInitialPayment) {
            addSIPExpense(occurrenceDate, formatDateToISO(occurrenceDate), 'yearly', true);
          }
        }
      }
    });

    return generatedExpenses;
  };

  const getGeneratedInvestmentExpenseInstancesForDateRange = (startDate, endDate, investmentItems = {}) => {
    const generatedExpenses = [];
    const {
      insurancePolicyItems = insurancePolicies,
      vehicleInsurancePolicyItems = vehicleInsurancePolicies,
      pollutionRecordItems = pollutionRecords
    } = investmentItems;

    const addRecurringPolicyExpenses = ({
      items,
      source,
      category,
      nameField,
      amountField = 'amount',
      dateFields,
      frequencyField = 'frequency',
      defaultFrequency = 'One-time',
      endDateFields = [],
      descriptionPrefix
    }) => {
      items.forEach((item) => {
        const frequency = (item[frequencyField] || defaultFrequency).trim().toLowerCase();
        const isOneTime = frequency === 'one-time' || frequency === 'one time' || frequency === 'onetime';
        if (frequency !== 'monthly' && frequency !== 'yearly' && !isOneTime) {
          return;
        }

        const recurrenceDateValue = dateFields.map((field) => item[field]).find(Boolean);
        const recurrenceStart = parseISODate(recurrenceDateValue);
        if (!recurrenceStart) {
          return;
        }

        const explicitEndValue = endDateFields.map((field) => item[field]).find(Boolean);
        const effectiveEndDate = explicitEndValue ? parseISODate(explicitEndValue, true) : null;

        if (recurrenceStart > endDate || (effectiveEndDate && effectiveEndDate < startDate)) {
          return;
        }

        let currentDate = new Date(recurrenceStart);
        while (currentDate <= endDate) {
          if (currentDate >= startDate && (!effectiveEndDate || currentDate <= effectiveEndDate)) {
            const dateStr = formatDateToISO(currentDate);
            generatedExpenses.push({
              id: `${source}-${item.id}-${dateStr}`,
              amount: parseFloat(item[amountField]) || 0,
              category,
              date: dateStr,
              description: `${descriptionPrefix}: ${item[nameField] || item.vehicleNumber || 'Policy'}`,
              type: 'personal',
              source,
              sourceId: item.id,
              isGenerated: true,
              isPolicyExpense: true,
              isRecurring: !isOneTime,
              frequency,
              createdBy: item.createdBy || user?.uid
            });
          }

          if (isOneTime) {
            break;
          }

          if (frequency === 'yearly') {
            currentDate.setFullYear(currentDate.getFullYear() + 1);
          } else {
            const recurrenceDay = recurrenceStart.getDate();
            const nextMonth = currentDate.getMonth() + 1;
            const nextYear = currentDate.getFullYear() + Math.floor(nextMonth / 12);
            const normalizedNextMonth = nextMonth % 12;
            const lastDayOfMonth = new Date(nextYear, normalizedNextMonth + 1, 0).getDate();
            currentDate = new Date(nextYear, normalizedNextMonth, Math.min(recurrenceDay, lastDayOfMonth));
          }
        }
      });
    };

    addRecurringPolicyExpenses({
      items: insurancePolicyItems,
      source: 'insurance',
      category: 'Insurance',
      nameField: 'policyName',
      dateFields: ['startDate', 'renewalDate', 'maturityDate', 'createdAt'],
      frequencyField: 'frequency',
      defaultFrequency: 'Yearly',
      endDateFields: ['maturityDate'],
      descriptionPrefix: 'Insurance'
    });

    addRecurringPolicyExpenses({
      items: vehicleInsurancePolicyItems,
      source: 'vehicle-insurance',
      category: 'Vehicle',
      nameField: 'vehicleNumber',
      dateFields: ['startDate', 'renewalDate', 'expiryDate', 'createdAt'],
      defaultFrequency: 'One-time',
      descriptionPrefix: 'Vehicle insurance'
    });

    addRecurringPolicyExpenses({
      items: pollutionRecordItems,
      source: 'pollution',
      category: 'Vehicle',
      nameField: 'vehicleNumber',
      dateFields: ['startDate', 'expiryDate', 'createdAt'],
      defaultFrequency: 'One-time',
      descriptionPrefix: 'Pollution certificate'
    });

    return generatedExpenses;
  };

  const getSelectedFilterDateRange = () => {
    const now = new Date();

    if (selectedMonth === 'all' && selectedYear === 'all') {
      return {
        startDate: new Date(0),
        endDate: new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59, 999)
      };
    }

    if (selectedMonth === 'all') {
      const year = parseInt(selectedYear);
      return {
        startDate: new Date(year, 0, 1),
        endDate: new Date(year, 11, 31, 23, 59, 59, 999)
      };
    }

    if (selectedYear === 'all') {
      return {
        startDate: new Date(0),
        endDate: new Date(now.getFullYear() + 1, parseInt(selectedMonth), 0, 23, 59, 59, 999)
      };
    }

    const year = parseInt(selectedYear);
    const month = parseInt(selectedMonth) - 1;
    return {
      startDate: new Date(year, month, 1),
      endDate: new Date(year, month + 1, 0, 23, 59, 59, 999)
    };
  };

  // - Editing a recurring expense updates all instances (past and future) automatically
  // - Minimal data storage (1 record instead of N occurrences)
  // - Consistent state with no sync issues
  const getGeneratedRecurringInstances = () => {
    // Generate recurring expense instances dynamically from recurrence rules
    const generatedExpenses = [];
    const seenKeys = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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

    // Process each expense and generate recurring instances
    expenses.forEach((expense) => {
      if (!expense.isRecurring) {
        return; // Skip non-recurring expenses
      }

      // Parse expense date safely without timezone conversion
      // expense.date is in ISO format: YYYY-MM-DD
      const [expenseYear, expenseMonth, expenseDay] = expense.date.split('-').map(Number);
      const expenseStartDate = new Date(expenseYear, expenseMonth - 1, expenseDay, 0, 0, 0, 0);
      
      // Parse end date safely if it exists
      const expenseEndDate = expense.endDate 
        ? (() => {
            const [endYear, endMonth, endDay] = expense.endDate.split('-').map(Number);
            return new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
          })()
        : null;
      
      const frequency = expense.frequency || 'monthly';

      // Check if this recurring expense is active during the selected period
      if (expenseStartDate > endDate) {
        return; // Recurring expense hasn't started yet
      }

      if (expenseEndDate && expenseEndDate < startDate) {
        return; // Recurring expense has already ended
      }

      // Generate instances for this recurrence rule
      let currentDate = new Date(expenseStartDate);

      if (frequency === 'daily') {
        while (currentDate <= endDate) {
          if (currentDate >= startDate && (!expenseEndDate || currentDate <= expenseEndDate)) {
            const dateStr = formatDateToISO(currentDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            // Skip if this date has been excluded from the recurring series
            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              // Use currentDate directly (already properly constructed)
              const isProjected = currentDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (frequency === 'weekly') {
        while (currentDate <= endDate) {
          if (currentDate >= startDate && (!expenseEndDate || currentDate <= expenseEndDate)) {
            const dateStr = formatDateToISO(currentDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            // Skip if this date has been excluded from the recurring series
            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setDate(currentDate.getDate() + 7);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              // Use currentDate directly (already properly constructed)
              const isProjected = currentDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (frequency === 'monthly') {
        const dayOfMonth = expenseStartDate.getDate();
        currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          // Try to create a date with the original day of month
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const dayToUse = Math.min(dayOfMonth, lastDayOfMonth);

          const instanceDate = new Date(year, month, dayToUse);

          if (
            instanceDate >= expenseStartDate &&
            (!expenseEndDate || instanceDate <= expenseEndDate) &&
            instanceDate >= startDate &&
            instanceDate <= endDate
          ) {
            const dateStr = formatDateToISO(instanceDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            // Skip if this date has been excluded from the recurring series
            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setMonth(currentDate.getMonth() + 1);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const isProjected = instanceDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
    });

    return generatedExpenses;
  };

  const getFilteredExpenses = () => {
    // Filter base expenses, but exclude recurring rules (show only instances)
    const filtered = expenses.filter((expense) => {
      // Skip the recurring rule itself if it matches date filter
      if (expense.isRecurring) {
        return false; // Don't show recurring rules, only their generated instances
      }

      // Parse ISO date format (YYYY-MM-DD)
      const [year, month] = expense.date.split('-').map(Number);

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
    const { startDate, endDate } = getSelectedFilterDateRange();
    let generatedSIPExpenses = getGeneratedSIPExpenseInstancesForDateRange(startDate, endDate);
    let generatedInvestmentExpenses = getGeneratedInvestmentExpenseInstancesForDateRange(startDate, endDate);
    generatedSIPExpenses = generatedSIPExpenses.filter((expense) => {
      const [year, month] = expense.date.split('-').map(Number);
      const monthMatch = selectedMonth === 'all' || month === parseInt(selectedMonth);
      const yearMatch = selectedYear === 'all' || year === parseInt(selectedYear);
      return monthMatch && yearMatch;
    });
    generatedInvestmentExpenses = generatedInvestmentExpenses.filter((expense) => {
      const [year, month] = expense.date.split('-').map(Number);
      const monthMatch = selectedMonth === 'all' || month === parseInt(selectedMonth);
      const yearMatch = selectedYear === 'all' || year === parseInt(selectedYear);
      return monthMatch && yearMatch;
    });

    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      generatedSIPExpenses = generatedSIPExpenses.filter((expense) =>
        expense.category.toLowerCase().includes(searchLower) ||
        (expense.description || '').toLowerCase().includes(searchLower)
      );
      generatedInvestmentExpenses = generatedInvestmentExpenses.filter((expense) =>
        expense.category.toLowerCase().includes(searchLower) ||
        (expense.description || '').toLowerCase().includes(searchLower)
      );
    }

    return [...filtered, ...generatedExpenses, ...generatedSIPExpenses, ...generatedInvestmentExpenses];
  };

  const filteredExpenses = getFilteredExpenses();

  const getFilteredTotal = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate totalAmount based on filtered expenses (includes recurring instances)
  const totalAmount = getFilteredTotal();

  const getFilteredIncome = () => {
    return income.filter((inc) => {
      // Parse ISO date format (YYYY-MM-DD)
      const [year, month] = inc.date.split('-').map(Number);
      
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

  // Calculate totalIncome based on filtered income (for selected month/year)
  const totalIncome = getFilteredIncomeTotal();

  const getRemainingBalance = () => {
    return getFilteredIncomeTotal() - getFilteredTotal();
  };

  // Get all-time expenses total (regular + recurring instances until end of current month)
  const getAllTimeExpensesTotal = () => {
    const today = new Date();
    const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfCurrentMonth.setHours(23, 59, 59, 999);

    // Sum all regular expenses (exclude master recurring records)
    let regularTotal = 0;
    expenses.forEach((expense) => {
      if (!expense.isRecurring) {
        regularTotal += expense.amount;
      }
    });

    // Add generated recurring instances up to end of current month
    const allGeneratedInstances = getGeneratedRecurringInstancesForDateRange(
      new Date(0), // From beginning of time
      endOfCurrentMonth
    );
    const recurringTotal = allGeneratedInstances.reduce((sum, expense) => sum + expense.amount, 0);
    const sipTotal = getGeneratedSIPExpenseInstancesForDateRange(new Date(0), endOfCurrentMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const investmentPolicyTotal = getGeneratedInvestmentExpenseInstancesForDateRange(new Date(0), endOfCurrentMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);

    return regularTotal + recurringTotal + sipTotal + investmentPolicyTotal;
  };

  // Get total income for the current year
  const getYearlyTotalIncome = () => {
    const currentYear = new Date().getFullYear();
    return income.reduce((sum, inc) => {
      const [year] = inc.date.split('-').map(Number);
      return year === currentYear ? sum + inc.amount : sum;
    }, 0);
  };

  // Get monthly income breakdown for the current year
  const getMonthlyIncomeBreakdown = () => {
    const currentYear = new Date().getFullYear();
    const monthlyBreakdown = Array(12).fill(0);

    income.forEach((inc) => {
      const [year, month] = inc.date.split('-').map(Number);
      if (year === currentYear) {
        monthlyBreakdown[month - 1] += inc.amount;
      }
    });

    // Return only months with income
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthlyBreakdown
      .map((total, index) => ({
        month: monthNames[index],
        monthNum: index + 1,
        total
      }))
      .filter((item) => item.total > 0)
      .sort((a, b) => a.monthNum - b.monthNum);
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
      
      // Set date range for this month
      const monthStartDate = new Date(year, monthDate.getMonth(), 1);
      monthStartDate.setHours(0, 0, 0, 0);
      const monthEndDate = new Date(year, monthDate.getMonth() + 1, 0);
      monthEndDate.setHours(23, 59, 59, 999);
      
      // Calculate total expenses for this month from regular expenses (skip master recurring records)
      let monthTotal = 0;
      expenses.forEach((expense) => {
        // Skip master recurring records - we'll add generated instances instead
        if (expense.isRecurring) {
          return;
        }
        const [expYear, expMonth] = expense.date.split('-').map(Number);
        if (expYear === year && expMonth === month) {
          monthTotal += expense.amount;
        }
      });
      
      // Add generated recurring expense instances for this month
      const generatedExpenses = getGeneratedRecurringInstancesForDateRange(monthStartDate, monthEndDate);
      generatedExpenses.forEach((expense) => {
        monthTotal += expense.amount;
      });

      const generatedSIPExpenses = getGeneratedSIPExpenseInstancesForDateRange(monthStartDate, monthEndDate);
      generatedSIPExpenses.forEach((expense) => {
        monthTotal += expense.amount;
      });

      const generatedInvestmentExpenses = getGeneratedInvestmentExpenseInstancesForDateRange(monthStartDate, monthEndDate);
      generatedInvestmentExpenses.forEach((expense) => {
        monthTotal += expense.amount;
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
      if (expense.isRecurring) {
        return;
      }
      const [expYear, expMonth] = expense.date.split('-').map(Number);
      if (expYear === currentYear && expMonth === currentMonth) {
        currentMonthTotal += expense.amount;
      }
    });
    currentMonthTotal += getGeneratedRecurringInstancesForDateRange(
      new Date(currentYear, currentMonth - 1, 1),
      new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    currentMonthTotal += getGeneratedSIPExpenseInstancesForDateRange(
      new Date(currentYear, currentMonth - 1, 1),
      new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    currentMonthTotal += getGeneratedInvestmentExpenseInstancesForDateRange(
      new Date(currentYear, currentMonth - 1, 1),
      new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate last month total
    let lastMonthTotal = 0;
    expenses.forEach((expense) => {
      if (expense.isRecurring) {
        return;
      }
      const [expYear, expMonth] = expense.date.split('-').map(Number);
      if (expYear === lastYear && expMonth === lastMonth) {
        lastMonthTotal += expense.amount;
      }
    });
    lastMonthTotal += getGeneratedRecurringInstancesForDateRange(
      new Date(lastYear, lastMonth - 1, 1),
      new Date(lastYear, lastMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    lastMonthTotal += getGeneratedSIPExpenseInstancesForDateRange(
      new Date(lastYear, lastMonth - 1, 1),
      new Date(lastYear, lastMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    lastMonthTotal += getGeneratedInvestmentExpenseInstancesForDateRange(
      new Date(lastYear, lastMonth - 1, 1),
      new Date(lastYear, lastMonth, 0, 23, 59, 59, 999)
    ).reduce((sum, expense) => sum + expense.amount, 0);
    
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

  // Filter expenses by selected date range
  const getFilteredExpensesByDateRange = (filterType) => {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);

    if (filterType === 'current') {
      // Current month - entire month
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      // Include entire current month, not just up to today
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (filterType === 'previous') {
      // Previous month - entire previous month
      const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      startDate = new Date(prevYear, prevMonth, 1);
      // End date is the last day of previous month
      endDate = new Date(prevYear, prevMonth + 1, 0);
    } else if (filterType === '3months') {
      // Last 3 months
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      // Include entire current month, not just up to today
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (filterType === '6months') {
      // Last 6 months
      startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      // Include entire current month, not just up to today
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    // Reset time to start/end of day for accurate date comparisons
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return expenses.filter((expense) => {
      // Skip recurring master records - only include generated instances and regular expenses
      if (expense.isRecurring) {
        return false;
      }
      
      // Parse ISO date format (YYYY-MM-DD) safely without timezone conversion
      const [year, month, day] = expense.date.split('-').map(Number);
      // Create date at start of day to avoid timezone issues
      const expenseDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  // Helper function to generate recurring instances for a specific date range
  const getGeneratedRecurringInstancesForDateRange = (startDate, endDate) => {
    const generatedExpenses = [];
    const seenKeys = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    expenses.forEach((expense) => {
      if (!expense.isRecurring) {
        return; // Skip non-recurring expenses
      }

      // Parse expense date safely without timezone conversion
      const [expenseYear, expenseMonth, expenseDay] = expense.date.split('-').map(Number);
      const expenseStartDate = new Date(expenseYear, expenseMonth - 1, expenseDay, 0, 0, 0, 0);
      
      // Parse end date safely if it exists
      const expenseEndDate = expense.endDate 
        ? (() => {
            const [endYear, endMonth, endDay] = expense.endDate.split('-').map(Number);
            return new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
          })()
        : null;
      
      const frequency = expense.frequency || 'monthly';

      // Check if this recurring expense is active during the requested period
      if (expenseStartDate > endDate) {
        return; // Recurring expense hasn't started yet
      }

      if (expenseEndDate && expenseEndDate < startDate) {
        return; // Recurring expense has already ended
      }

      // Generate instances for this recurrence rule
      let currentDate = new Date(expenseStartDate);

      if (frequency === 'daily') {
        while (currentDate <= endDate) {
          if (currentDate >= startDate && (!expenseEndDate || currentDate <= expenseEndDate)) {
            const dateStr = formatDateToISO(currentDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setDate(currentDate.getDate() + 1);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const isProjected = currentDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else if (frequency === 'weekly') {
        while (currentDate <= endDate) {
          if (currentDate >= startDate && (!expenseEndDate || currentDate <= expenseEndDate)) {
            const dateStr = formatDateToISO(currentDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setDate(currentDate.getDate() + 7);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const isProjected = currentDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }
          currentDate.setDate(currentDate.getDate() + 7);
        }
      } else if (frequency === 'monthly') {
        const dayOfMonth = expenseStartDate.getDate();
        currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const year = currentDate.getFullYear();
          const month = currentDate.getMonth();
          const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
          const dayToUse = Math.min(dayOfMonth, lastDayOfMonth);

          const instanceDate = new Date(year, month, dayToUse);

          if (
            instanceDate >= expenseStartDate &&
            (!expenseEndDate || instanceDate <= expenseEndDate) &&
            instanceDate >= startDate &&
            instanceDate <= endDate
          ) {
            const dateStr = formatDateToISO(instanceDate);
            const uniqueKey = `${expense.id}-${dateStr}`;

            if (expense.excludedDates && expense.excludedDates.includes(dateStr)) {
              currentDate.setMonth(currentDate.getMonth() + 1);
              continue;
            }

            if (!seenKeys.has(uniqueKey)) {
              seenKeys.add(uniqueKey);
              const isProjected = instanceDate > today;

              generatedExpenses.push({
                ...expense,
                id: uniqueKey,
                date: dateStr,
                isGenerated: true,
                isProjected: isProjected
              });
            }
          }

          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }
    });

    return generatedExpenses;
  };

  // Get all filtered expenses (regular + recurring instances) for a specific chart filter range
  const getFilteredExpensesForChartsRange = (filterType) => {
    const filteredExpenses = getFilteredExpensesByDateRange(filterType);
    
    // Generate recurring instances for this date range
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date(today);

    if (filterType === 'current') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (filterType === 'previous') {
      const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const prevYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      startDate = new Date(prevYear, prevMonth, 1);
      endDate = new Date(prevYear, prevMonth + 1, 0);
    } else if (filterType === '3months') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (filterType === '6months') {
      startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get generated recurring instances for this specific date range
    const generatedExpenses = getGeneratedRecurringInstancesForDateRange(startDate, endDate);
    const generatedSIPExpenses = getGeneratedSIPExpenseInstancesForDateRange(startDate, endDate);
    const generatedInvestmentExpenses = getGeneratedInvestmentExpenseInstancesForDateRange(startDate, endDate);

    // Combine both filtered and generated expenses, sorted by date (newest first)
    const allExpenses = [...filteredExpenses, ...generatedExpenses, ...generatedSIPExpenses, ...generatedInvestmentExpenses];
    return allExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Get category breakdown for filtered expenses
  const getCategoryBreakdownByFilter = (filterType) => {
    const allExpenses = getFilteredExpensesForChartsRange(filterType);
    const breakdown = {};

    allExpenses.forEach((expense) => {
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
    
    // Use the already-filtered expenses (excludes recurring master records, includes generated instances)
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

  // Helper functions for cache management with timestamps
  // Cache stores both data and timestamp in localStorage
  // Timestamps are updated whenever listeners receive new data from Firestore
  
  const getCachedWithTimestamp = (key) => {
    try {
      const cached = localStorage.getItem(`${key}_cache`);
      const timestamp = localStorage.getItem(`${key}_timestamp`);
      if (cached && timestamp) {
        return {
          data: JSON.parse(cached),
          timestamp: parseInt(timestamp),
          age: Date.now() - parseInt(timestamp)
        };
      }
      return null;
    } catch (error) {
      console.warn(`Error reading cache for ${key}:`, error);
      return null;
    }
  };
  
  const setCacheWithTimestamp = (key, data) => {
    try {
      localStorage.setItem(`${key}_cache`, JSON.stringify(data));
      localStorage.setItem(`${key}_timestamp`, Date.now().toString());
    } catch (error) {
      console.warn(`Error writing cache for ${key}:`, error);
    }
  };

  // Helper function for optimistic cache updates
  // Updates state and localStorage immediately, then syncs to Firestore in background
  const updateExpenseCacheOptimistically = (updatedExpenses) => {
    // Update React state immediately
    setExpenses(updatedExpenses);
    
    // Update localStorage cache immediately
    setCacheWithTimestamp('expenses', updatedExpenses);
    
    // Invalidate the 5-minute cache to force fresh sync on next load
    // (Firestore will be the source of truth)
    return updatedExpenses;
  };

  // Listen for Firebase auth state changes and load expenses and income
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      try {
        if (currentUser) {
          // Ensure user profile exists in Firestore
          try {
            await usersAPI.createOrUpdateProfile(currentUser.uid, {
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL
            });
          } catch (profileError) {
            console.error('Error creating/updating user profile:', profileError);
          }
          
          // Load expenses and income from Firestore for logged-in user
          // Using real-time listeners (onSnapshot) for automatic sync
          // - Listen for changes in Firestore
          // - Update state and localStorage immediately when data changes
          // - Reduces unnecessary reads by only syncing when changes occur
          
          // Step 1: Load cached data immediately for instant UI
          const cachedExpensesInfo = getCachedWithTimestamp('expenses');
          const cachedIncomeInfo = getCachedWithTimestamp('income');
          
          let cachedExpenses = cachedExpensesInfo ? validateExpenseData(cachedExpensesInfo.data) : [];
          let cachedIncome = cachedIncomeInfo ? validateExpenseData(cachedIncomeInfo.data) : [];
          
          // Step 2: Set cached data immediately (if available) for smooth UI
          if (cachedExpenses.length > 0) {
            setExpenses(cachedExpenses);
          }
          if (cachedIncome.length > 0) {
            setIncome(cachedIncome);
          }

          // Load existing SIPs immediately so generated SIP expenses are available
          // before the investments module is opened.
          const investmentLoads = await Promise.allSettled([
            sipsAPI.getSIPs(currentUser.uid),
            insurancePoliciesAPI.getPolicies(currentUser.uid),
            vehicleInsurancePoliciesAPI.getVehiclePolicies(currentUser.uid),
            vehiclePollutionRecordsAPI.getRecords(currentUser.uid)
          ]);

          const getSettledArray = (index, label) => {
            const result = investmentLoads[index];
            if (result.status === 'fulfilled') {
              return Array.isArray(result.value) ? result.value : [];
            }
            console.warn(`Could not load ${label} for expense generation:`, result.reason?.message || result.reason);
            return [];
          };

          setSips(getSettledArray(0, 'SIPs'));
          setInsurancePolicies(getSettledArray(1, 'insurance policies'));
          setVehicleInsurancePolicies(getSettledArray(2, 'vehicle insurance policies'));
          setPollutionRecords(getSettledArray(3, 'pollution records'));
          
          // Step 3: Set up real-time listeners
          // These will fire once immediately with current data, then again on every change
          setExpensesLoading(true);
          
          // Listen to expenses in real-time
          const unsubscribeExpenses = expensesAPI.listenToExpenses(
            currentUser.uid,
            (updatedExpenses) => {
              const validatedExpenses = validateExpenseData(updatedExpenses);
              // Update state
              setExpenses(validatedExpenses);
              // Update localStorage cache with fresh timestamp
              setCacheWithTimestamp('expenses', validatedExpenses);
              setExpensesLoading(false);
            }
          );
          
          // Listen to income in real-time
          const unsubscribeIncome = incomeAPI.listenToIncome(
            currentUser.uid,
            (updatedIncome) => {
              const validatedIncome = validateExpenseData(updatedIncome);
              // Update state
              setIncome(validatedIncome);
              // Update localStorage cache with fresh timestamp
              setCacheWithTimestamp('income', validatedIncome);
            }
          );

          const unsubscribeSIPs = sipsAPI.listenToSIPs(
            currentUser.uid,
            (updatedSIPs) => {
              setSips(Array.isArray(updatedSIPs) ? updatedSIPs : []);
            }
          );

          const unsubscribeInsurancePolicies = insurancePoliciesAPI.listenToPolicies(
            currentUser.uid,
            (updatedPolicies) => {
              setInsurancePolicies(Array.isArray(updatedPolicies) ? updatedPolicies : []);
            }
          );

          const unsubscribeVehicleInsurancePolicies = vehicleInsurancePoliciesAPI.listenToVehiclePolicies(
            currentUser.uid,
            (updatedPolicies) => {
              setVehicleInsurancePolicies(Array.isArray(updatedPolicies) ? updatedPolicies : []);
            }
          );

          const unsubscribePollutionRecords = vehiclePollutionRecordsAPI.listenToRecords(
            currentUser.uid,
            (updatedRecords) => {
              setPollutionRecords(Array.isArray(updatedRecords) ? updatedRecords : []);
            }
          );
          
          // Store unsubscribe functions to clean up on logout
          window.__expensesUnsubscribe = unsubscribeExpenses;
          window.__incomeUnsubscribe = unsubscribeIncome;
          window.__sipsUnsubscribe = unsubscribeSIPs;
          window.__insurancePoliciesUnsubscribe = unsubscribeInsurancePolicies;
          window.__vehicleInsurancePoliciesUnsubscribe = unsubscribeVehicleInsurancePolicies;
          window.__pollutionRecordsUnsubscribe = unsubscribePollutionRecords;
          
          // Load user's family group if they belong to one
          try {
            // Get user profile to check if they have a groupId
            const userDoc = await import('firebase/firestore').then(({ getDoc, doc, getFirestore }) => 
              getDoc(doc(getFirestore(), 'users', currentUser.uid))
            );
            
            if (userDoc.exists() && userDoc.data().groupId) {
              const groupId = userDoc.data().groupId;
              const userRole = userDoc.data().role || 'member';
              const group = await familyGroupsAPI.getGroup(groupId);
              setUserGroup(group);
              setUserRole(userRole);
            }
          } catch (groupError) {
            console.log('No family group found for user');
          }
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
          setSips([]);
          setInsurancePolicies([]);
          setVehicleInsurancePolicies([]);
          setPollutionRecords([]);
          setUserGroup(null);
          setUserRole(null);
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
    return () => {
      unsubscribe();
      // Also clean up any existing listeners on unmount
      if (window.__expensesUnsubscribe) {
        window.__expensesUnsubscribe();
        window.__expensesUnsubscribe = null;
      }
      if (window.__incomeUnsubscribe) {
        window.__incomeUnsubscribe();
        window.__incomeUnsubscribe = null;
      }
      if (window.__sipsUnsubscribe) {
        window.__sipsUnsubscribe();
        window.__sipsUnsubscribe = null;
      }
      if (window.__insurancePoliciesUnsubscribe) {
        window.__insurancePoliciesUnsubscribe();
        window.__insurancePoliciesUnsubscribe = null;
      }
      if (window.__vehicleInsurancePoliciesUnsubscribe) {
        window.__vehicleInsurancePoliciesUnsubscribe();
        window.__vehicleInsurancePoliciesUnsubscribe = null;
      }
      if (window.__pollutionRecordsUnsubscribe) {
        window.__pollutionRecordsUnsubscribe();
        window.__pollutionRecordsUnsubscribe = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force refresh function - bypasses cache freshness check
  const forceRefreshData = async () => {
    if (!user) {
      console.warn('Cannot force refresh - user not authenticated');
      return;
    }
    
    try {
      setExpensesLoading(true);
      
      // Fetch fresh data from Firestore (bypass cache entirely)
      const firestoreExpenses = await expensesAPI.getExpenses(user.uid);
      const validatedExpenses = validateExpenseData(firestoreExpenses);
      
      const firestoreIncome = await incomeAPI.getIncome(user.uid);
      const validatedIncome = validateExpenseData(firestoreIncome);

      const investmentLoads = await Promise.allSettled([
        sipsAPI.getSIPs(user.uid),
        insurancePoliciesAPI.getPolicies(user.uid),
        vehicleInsurancePoliciesAPI.getVehiclePolicies(user.uid),
        vehiclePollutionRecordsAPI.getRecords(user.uid)
      ]);

      const getSettledArray = (index) => {
        const result = investmentLoads[index];
        return result.status === 'fulfilled' && Array.isArray(result.value) ? result.value : [];
      };
      
      // Update state
      setExpenses(validatedExpenses);
      setIncome(validatedIncome);
      setSips(getSettledArray(0));
      setInsurancePolicies(getSettledArray(1));
      setVehicleInsurancePolicies(getSettledArray(2));
      setPollutionRecords(getSettledArray(3));
      
      // Update cache with fresh timestamps
      setCacheWithTimestamp('expenses', validatedExpenses);
      setCacheWithTimestamp('income', validatedIncome);
      
      setError(''); // Clear any previous errors
      return { success: true, message: 'Data refreshed successfully' };
    } catch (error) {
      console.error('Error force refreshing data:', error);
      setError('Failed to refresh data. Please try again.');
      return { success: false, message: error.message };
    } finally {
      setExpensesLoading(false);
    }
  };

  // Load family income/expenses when the group changes or the family dashboard is opened.
  useEffect(() => {
    if (userGroup && user) {
      loadFamilyIncome();
      loadFamilySharedExpenses();
    }
    // eslint-disable-next-line
  }, [userGroup?.id, user?.uid, viewingFamilyDashboard]);

  // Sign in with Google
  const handleSignInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const currentUser = result.user;
      
      // Create or update user profile in Firestore
      await usersAPI.createOrUpdateProfile(currentUser.uid, {
        email: currentUser.email,
        displayName: currentUser.displayName,
        photoURL: currentUser.photoURL
      });
    } catch (error) {
      console.error('Sign-in error:', error);
      setError('Failed to sign in: ' + error.message);
    }
  };

  // Logout user
  const handleLogout = async () => {
    try {
      // Clean up real-time listeners
      if (window.__expensesUnsubscribe) {
        window.__expensesUnsubscribe();
        window.__expensesUnsubscribe = null;
      }
      if (window.__incomeUnsubscribe) {
        window.__incomeUnsubscribe();
        window.__incomeUnsubscribe = null;
      }
      if (window.__sipsUnsubscribe) {
        window.__sipsUnsubscribe();
        window.__sipsUnsubscribe = null;
      }
      if (window.__insurancePoliciesUnsubscribe) {
        window.__insurancePoliciesUnsubscribe();
        window.__insurancePoliciesUnsubscribe = null;
      }
      if (window.__vehicleInsurancePoliciesUnsubscribe) {
        window.__vehicleInsurancePoliciesUnsubscribe();
        window.__vehicleInsurancePoliciesUnsubscribe = null;
      }
      if (window.__pollutionRecordsUnsubscribe) {
        window.__pollutionRecordsUnsubscribe();
        window.__pollutionRecordsUnsubscribe = null;
      }
      
      await signOut(auth);
      setUser(null);
      setUserGroup(null);
      setUserRole(null);
      setFamilyIncome([]);
      setFamilySharedExpenses([]);
      setFamilyPersonalExpenses([]);
      setFamilySips([]);
      setFamilySipTopUps([]);
      setFamilyInsurancePolicies([]);
      setFamilyVehicleInsurancePolicies([]);
      setFamilyPollutionRecords([]);
      setSips([]);
      setInsurancePolicies([]);
      setVehicleInsurancePolicies([]);
      setPollutionRecords([]);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout: ' + error.message);
    }
  };

  // Load family income from all group members
  const loadFamilyIncome = async () => {
    if (!userGroup || !userGroup.members) {
      setFamilyIncome([]);
      return;
    }

    try {
      const allFamilyIncome = [];
      
      // Fetch income from eachmember
      for (const member of userGroup.members) {
        try {
          const memberIncome = await incomeAPI.getIncome(member.userId);
          // Include userId to track who earned this income
          const incomeWithUserId = memberIncome.map(inc => ({
            ...inc,
            userId: member.userId
          }));
          allFamilyIncome.push(...incomeWithUserId);
        } catch (error) {
          console.log(`Could not load income for member ${member.name}:`, error.message);
          // Continue with other members if one fails
        }
      }
      
      setFamilyIncome(allFamilyIncome);
    } catch (error) {
      console.error('Error loading family income:', error);
      setFamilyIncome([]);
    }
  };

  // Load family shared expenses when userGroup changes
  // Uses new data model: fetches shared expenses (stored only in creator's collection)
  const loadFamilySharedExpenses = async () => {
    if (!userGroup || !userGroup.members) {
      setFamilySharedExpenses([]);
      setFamilyPersonalExpenses([]);
      setFamilySips([]);
      setFamilySipTopUps([]);
      setFamilyInsurancePolicies([]);
      setFamilyVehicleInsurancePolicies([]);
      setFamilyPollutionRecords([]);
      return;
    }

    try {
      // Use new API to fetch both shared and personal expenses across the group
      const [familyExpenses, familyInvestmentResults] = await Promise.all([
        expensesAPI.getAllFamilyExpenses(userGroup.members, userGroup.id),
        Promise.all(userGroup.members.map(async (member) => {
          const [memberSips, memberTopUps, memberInsurancePolicies, memberVehiclePolicies, memberPollutionRecords] = await Promise.all([
            sipsAPI.getSIPs(member.userId),
            sipTopUpsAPI.getTopUps(member.userId),
            insurancePoliciesAPI.getPolicies(member.userId),
            vehicleInsurancePoliciesAPI.getVehiclePolicies(member.userId),
            vehiclePollutionRecordsAPI.getRecords(member.userId)
          ]);

          const withMember = (items) => items.map((item) => ({
            ...item,
            id: `${member.userId}-${item.id}`,
            sourceId: item.id,
            createdBy: member.userId,
            memberName: member.name
          }));

          return {
            sips: withMember(memberSips),
            sipTopUps: withMember(memberTopUps),
            insurancePolicies: withMember(memberInsurancePolicies),
            vehicleInsurancePolicies: withMember(memberVehiclePolicies),
            pollutionRecords: withMember(memberPollutionRecords)
          };
        }))
      ]);

      setFamilySharedExpenses(familyExpenses.shared);
      setFamilyPersonalExpenses(familyExpenses.personal);
      setFamilySips(familyInvestmentResults.flatMap((result) => result.sips));
      setFamilySipTopUps(familyInvestmentResults.flatMap((result) => result.sipTopUps));
      setFamilyInsurancePolicies(familyInvestmentResults.flatMap((result) => result.insurancePolicies));
      setFamilyVehicleInsurancePolicies(familyInvestmentResults.flatMap((result) => result.vehicleInsurancePolicies));
      setFamilyPollutionRecords(familyInvestmentResults.flatMap((result) => result.pollutionRecords));
    } catch (error) {
      console.error('Error loading family expenses:', error);
      setFamilySharedExpenses([]);
      setFamilyPersonalExpenses([]);
      setFamilySips([]);
      setFamilySipTopUps([]);
      setFamilyInsurancePolicies([]);
      setFamilyVehicleInsurancePolicies([]);
      setFamilyPollutionRecords([]);
    }
  };

  // Create a new family group
  const handleCreateGroup = async (groupName) => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    try {
      console.log('Creating group:', groupName, 'for user:', user.uid);
      setGroupLoading(true);
      const result = await familyGroupsAPI.createGroup(user.uid, user.displayName || 'User', groupName);
      console.log('Group created successfully:', result);
      setUserGroup(result);
      setUserRole('admin');
      console.log('Showing success toast...');
      showToast(`Family group "${groupName}" created successfully!`, 'success');
      // Keep modal open so user can see group details immediately
    } catch (error) {
      console.error('Error creating group:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      showToast('Failed to create group: ' + error.message, 'error');
    } finally {
      setGroupLoading(false);
    }
  };

  // Join a family group
  const handleJoinGroup = async (inviteCode) => {
    if (!user) {
      setError('Please log in first');
      return;
    }

    try {
      console.log('Joining group with code:', inviteCode, 'for user:', user.uid);
      setGroupLoading(true);
      const result = await familyGroupsAPI.joinGroup(user.uid, user.displayName || 'User', inviteCode);
      console.log('Group joined successfully:', result);
      setUserGroup(result);
      setUserRole('member');
      console.log('Showing success toast...');
      showToast(`Joined family group "${result.name}"!`, 'success');
      // Keep modal open so user can see group details immediately
    } catch (error) {
      console.error('Error joining group:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      showToast('Failed to join group: ' + error.message, 'error');
    } finally {
      setGroupLoading(false);
    }
  };

  // Leave family group
  const handleLeaveGroup = async () => {
    if (!user || !userGroup) return;

    const confirmed = window.confirm('Are you sure you want to leave this family group?');
    if (!confirmed) return;

    try {
      setGroupLoading(true);
      await familyGroupsAPI.leaveGroup(user.uid, userGroup.id);
      setUserGroup(null);
      setUserRole(null);
      showToast('Left family group successfully', 'success');
    } catch (error) {
      console.error('Error leaving group:', error);
      showToast('Failed to leave group: ' + error.message, 'error');
    } finally {
      setGroupLoading(false);
    }
  };

  // Generate new invite code
  const handleGenerateCode = async () => {
    if (!user || !userGroup || userRole !== 'admin') {
      showToast('Only admin can generate new codes', 'error');
      return;
    }

    try {
      setGroupLoading(true);
      const newCode = await familyGroupsAPI.generateNewCode(userGroup.id, user.uid);
      // Reload group to get updated codes
      const updatedGroup = await familyGroupsAPI.getGroup(userGroup.id);
      setUserGroup(updatedGroup);
      showToast(`New invite code generated: ${newCode}`, 'success');
    } catch (error) {
      console.error('Error generating code:', error);
      showToast('Failed to generate code: ' + error.message, 'error');
    } finally {
      setGroupLoading(false);
    }
  };

  const getFamilyDashboardSharedExpenses = () => {
    const now = new Date();
    const startDate = new Date(0);
    const endDate = new Date(now.getFullYear() + 1, now.getMonth() + 1, 0, 23, 59, 59, 999);
    const generatedTopUpExpenses = familySipTopUps
      .filter((topUp) => {
        const topUpDate = parseISODate(topUp.date);
        return topUpDate && topUpDate >= startDate && topUpDate <= endDate;
      })
      .map((topUp) => ({
        id: `family-sip-topup-${topUp.id}`,
        amount: parseFloat(topUp.topUpAmount) || 0,
        category: 'Investments',
        date: topUp.date,
        description: `SIP top-up${topUp.sipName ? `: ${topUp.sipName}` : ''}`,
        type: 'shared',
        source: 'sip-topup',
        sourceId: topUp.sourceId || topUp.id,
        isGenerated: true,
        isSIPExpense: true,
        isRecurring: false,
        createdBy: topUp.createdBy || user?.uid
      }));
    const generatedInvestmentExpenses = [
      ...getGeneratedSIPExpenseInstancesForDateRange(startDate, endDate, familySips),
      ...getGeneratedInvestmentExpenseInstancesForDateRange(startDate, endDate, {
        insurancePolicyItems: familyInsurancePolicies,
        vehicleInsurancePolicyItems: familyVehicleInsurancePolicies,
        pollutionRecordItems: familyPollutionRecords
      }),
      ...generatedTopUpExpenses
    ].map((expense) => ({
      ...expense,
      id: `family-${expense.id}`,
      type: 'shared',
      isRecurring: false
    }));

    return [...familySharedExpenses, ...generatedInvestmentExpenses];
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            viewingFamilyDashboard && userGroup ? (
              <FamilyDashboard
                userGroup={userGroup}
                userRole={userRole}
                expenses={getFamilyDashboardSharedExpenses()}
                personalExpenses={familyPersonalExpenses}
                income={familyIncome}
                user={user}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onSwitchToPersonal={() => setViewingFamilyDashboard(false)}
                onLogout={handleLogout}
                onSignIn={handleSignInWithGoogle}
                onOpenFamilyGroup={() => setShowGroupManager(true)}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                onEditIncome={handleEditIncome}
                onDeleteIncome={handleDeleteIncome}
                onAddExpense={handleAddExpense}
                onAddIncome={handleAddIncome}
                onForceRefresh={forceRefreshData}
              />
            ) : (
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
                expenseType={expenseType}
                setExpenseType={setExpenseType}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                onAddExpense={handleAddExpense}
                onDeleteExpense={handleDeleteExpense}
                onEditExpense={handleEditExpense}
                editingExpenseId={editingExpenseId}
                formatCurrency={formatCurrency}
                totalAmount={totalAmount}
                getCategoryBreakdown={getCategoryBreakdown}
                getCategoryBreakdownByFilter={getCategoryBreakdownByFilter}
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
                getYearlyTotalIncome={getYearlyTotalIncome}
                getMonthlyIncomeBreakdown={getMonthlyIncomeBreakdown}
                getFilteredExpensesForChartsRange={getFilteredExpensesForChartsRange}
                showExpenseForm={showExpenseForm}
                setShowExpenseForm={setShowExpenseForm}
                showIncomeForm={showIncomeForm}
                setShowIncomeForm={setShowIncomeForm}
                onCancelEdit={handleCancelEdit}
                formatDate={formatDate}
                expensesLoading={expensesLoading}
                isSubmittingExpense={isSubmittingExpense}
                isSubmittingIncome={isSubmittingIncome}
                userGroup={userGroup}
                userRole={userRole}
                onCreateGroup={handleCreateGroup}
                onJoinGroup={handleJoinGroup}
                onLeaveGroup={handleLeaveGroup}
                onGenerateCode={handleGenerateCode}
                groupLoading={groupLoading}
                showGroupManager={showGroupManager}
                setShowGroupManager={setShowGroupManager}
                viewingFamilyDashboard={viewingFamilyDashboard}
                setViewingFamilyDashboard={setViewingFamilyDashboard}
                showRecurringEditScope={showRecurringEditScope}
                setShowRecurringEditScope={setShowRecurringEditScope}
                recurringEditInstance={recurringEditInstance}
                onRecurringEditScopeSelect={handleRecurringEditScopeSelect}
                onForceRefresh={forceRefreshData}
              />
            )
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
              getAllTimeExpensesTotal={getAllTimeExpensesTotal}
              getExpensesByWeek={getExpensesByWeek}
              exportToCSV={exportToCSV}
              user={user}
              authLoading={authLoading}
              onSignInWithGoogle={handleSignInWithGoogle}
              onLogout={handleLogout}
              userGroup={userGroup}
              onOpenFamilyGroup={() => setShowGroupManager(true)}
              onOpenFamilyDashboard={userGroup ? () => setViewingFamilyDashboard(true) : null}
              income={income}
              totalIncome={totalIncome}
              onDeleteIncome={handleDeleteIncome}
              onEditIncome={handleEditIncome}
              editingIncomeId={editingIncomeId}
              onCancelEdit={handleCancelEdit}
              onForceRefresh={forceRefreshData}
            />
          }
        />
        <Route
          path="/investments"
          element={
            <InvestmentsModule
              user={user}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              showToast={showToast}
              onLogout={handleLogout}
              onSignIn={handleSignInWithGoogle}
              userGroup={userGroup}
              onOpenFamilyGroup={() => setShowGroupManager(true)}
              onOpenFamilyDashboard={userGroup ? () => setViewingFamilyDashboard(true) : null}
            />
          }
        />
      </Routes>

      {/* Toast Notification */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </BrowserRouter>
  );
}

export default App;

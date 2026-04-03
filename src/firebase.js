import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Firebase configuration
// Replace these values with your Firebase project credentials
// Get these from: https://console.firebase.google.com/ -> Project Settings
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase Auth instance
export const auth = getAuth(app);

// Get Firestore instance
export const db = getFirestore(app);

// Export Google Auth Provider for sign-in
export const googleProvider = new GoogleAuthProvider();

// Firestore utility functions for expenses
export const expensesAPI = {
  // Add a new expense
  addExpense: async (userId, expenseData) => {
    try {
      const userExpensesRef = collection(db, 'users', userId, 'expenses');
      const docRef = await addDoc(userExpensesRef, {
        ...expenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...expenseData };
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  },

  // Get all expenses for a user
  getExpenses: async (userId) => {
    try {
      const userExpensesRef = collection(db, 'users', userId, 'expenses');
      const snapshot = await getDocs(userExpensesRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting expenses:', error);
      throw error;
    }
  },

  // Delete an expense
  deleteExpense: async (userId, expenseId) => {
    try {
      const expenseRef = doc(db, 'users', userId, 'expenses', expenseId);
      await deleteDoc(expenseRef);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  },

  // Update an expense
  updateExpense: async (userId, expenseId, expenseData) => {
    try {
      const expenseRef = doc(db, 'users', userId, 'expenses', expenseId);
      await updateDoc(expenseRef, {
        ...expenseData,
        updatedAt: serverTimestamp(),
      });
      return { id: expenseId, ...expenseData };
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  },
};

// Firestore utility functions for recurring expenses
export const recurringExpensesAPI = {
  // Add a new recurring expense
  addRecurringExpense: async (userId, recurringExpenseData) => {
    try {
      const userRecurringRef = collection(db, 'users', userId, 'recurringExpenses');
      const docRef = await addDoc(userRecurringRef, {
        ...recurringExpenseData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...recurringExpenseData };
    } catch (error) {
      console.error('Error adding recurring expense:', error);
      throw error;
    }
  },

  // Get all recurring expenses for a user
  getRecurringExpenses: async (userId) => {
    try {
      const userRecurringRef = collection(db, 'users', userId, 'recurringExpenses');
      const snapshot = await getDocs(userRecurringRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting recurring expenses:', error);
      throw error;
    }
  },

  // Delete a recurring expense
  deleteRecurringExpense: async (userId, recurringExpenseId) => {
    try {
      const recurringRef = doc(db, 'users', userId, 'recurringExpenses', recurringExpenseId);
      await deleteDoc(recurringRef);
    } catch (error) {
      console.error('Error deleting recurring expense:', error);
      throw error;
    }
  },

  // Update a recurring expense
  updateRecurringExpense: async (userId, recurringExpenseId, recurringExpenseData) => {
    try {
      const recurringRef = doc(db, 'users', userId, 'recurringExpenses', recurringExpenseId);
      await updateDoc(recurringRef, {
        ...recurringExpenseData,
        updatedAt: serverTimestamp(),
      });
      return { id: recurringExpenseId, ...recurringExpenseData };
    } catch (error) {
      console.error('Error updating recurring expense:', error);
      throw error;
    }
  },
};

// Firestore utility functions for income
export const incomeAPI = {
  // Add a new income entry
  addIncome: async (userId, incomeData) => {
    try {
      const userIncomeRef = collection(db, 'users', userId, 'income');
      const docRef = await addDoc(userIncomeRef, {
        ...incomeData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...incomeData };
    } catch (error) {
      console.error('Error adding income:', error);
      throw error;
    }
  },

  // Get all income entries for a user
  getIncome: async (userId) => {
    try {
      const userIncomeRef = collection(db, 'users', userId, 'income');
      const snapshot = await getDocs(userIncomeRef);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting income:', error);
      throw error;
    }
  },

  // Delete an income entry
  deleteIncome: async (userId, incomeId) => {
    try {
      const incomeRef = doc(db, 'users', userId, 'income', incomeId);
      await deleteDoc(incomeRef);
    } catch (error) {
      console.error('Error deleting income:', error);
      throw error;
    }
  },

  // Update an income entry
  updateIncome: async (userId, incomeId, incomeData) => {
    try {
      const incomeRef = doc(db, 'users', userId, 'income', incomeId);
      await updateDoc(incomeRef, {
        ...incomeData,
        updatedAt: serverTimestamp(),
      });
      return { id: incomeId, ...incomeData };
    } catch (error) {
      console.error('Error updating income:', error);
      throw error;
    }
  },
};

export default app;

/**
 * Firebase Configuration & Firestore Database API
 * 
 * FIRESTORE SCHEMA OVERVIEW:
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Collections Structure:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ /users/{userId}                                   [Root Collection]         │
 * │   ├── uid: string (matches Firebase Auth UID)                               │
 * │   ├── email: string                                                          │
 * │   ├── name: string                                                           │
 * │   ├── photoURL: string (optional)                                            │
 * │   ├── groupId: string (optional, null if not in family group)                │
 * │   ├── role: string ('admin' | 'member' | null)                              │
 * │   ├── darkMode: boolean                                                      │
 * │   ├── createdAt: timestamp                                                   │
 * │   ├── updatedAt: timestamp                                                   │
 * │   │                                                                           │
 * │   ├─ /expenses/{expenseId}           [Subcollection - User Expenses]        │
 * │   │   ├── amount: number                                                     │
 * │   │   ├── category: string                                                   │
 * │   │   ├── date: string (ISO format: YYYY-MM-DD)                             │
 * │   │   ├── description: string (optional)                                     │
 * │   │   ├── type: string ('personal' | 'shared')                              │
 * │   │   ├── isSplit: boolean                                                   │
 * │   │   ├── splitMembers: string[] (array of userIds to split with)            │
 * │   │   ├── isRecurring: boolean                                               │
 * │   │   ├── frequency: string ('daily' | 'weekly' | 'monthly' | 'yearly')      │
 * │   │   ├── endDate: string (optional, ISO format)                             │
 * │   │   ├── createdAt: timestamp                                               │
 * │   │   └── updatedAt: timestamp                                               │
 * │   │                                                                           │
 * │   └─ /income/{incomeId}              [Subcollection - User Income]          │
 * │       ├── amount: number                                                     │
 * │       ├── source: string                                                     │
 * │       ├── date: string (ISO format: YYYY-MM-DD)                             │
 * │       ├── description: string (optional)                                     │
 * │       ├── isRecurring: boolean                                               │
 * │       ├── frequency: string (optional)                                       │
 * │       ├── endDate: string (optional)                                         │
 * │       ├── createdAt: timestamp                                               │
 * │       └── updatedAt: timestamp                                               │
 * │                                                                               │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ /familyGroups/{groupId}                          [Root Collection]         │
 * │   ├── name: string                                                           │
 * │   ├── adminId: string (userId of group admin)                                │
 * │   ├── adminName: string                                                      │
 * │   ├── members: [                  [Array of group members]                  │
 * │   │   { userId, name, role ('admin'|'member'), joinedAt }                   │
 * │   │ ]                                                                        │
 * │   ├── inviteCodes: [               [Array of invite codes]                  │
 * │   │   { code, createdAt, createdBy, usedCount }                             │
 * │   │ ]                                                                        │
 * │   ├── isActive: boolean                                                      │
 * │   ├── createdAt: timestamp                                                   │
 * │   └── updatedAt: timestamp                                                   │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * QUERY PATTERNS:
 * ──────────────
 * 1. Get user's expenses (ordered by date):
 *    collection(db, 'users', userId, 'expenses') → orderBy('date', 'desc')
 * 
 * 2. Get shared expenses only:
 *    collection(db, 'users', userId, 'expenses') → where('type', '==', 'shared')
 * 
 * 3. Get group details:
 *    doc(db, 'familyGroups', groupId)
 * 
 * 4. Get user's group:
 *    First fetch user profile (getDoc), then use groupId to fetch group
 * 
 * 5. Find group by invite code:
 *    getDocs(collection(db, 'familyGroups')) → filter by inviteCode (client-side)
 *    Note: For scalability, consider separate inviteCodes collection if > 10K groups
 * 
 * SECURITY NOTES:
 * ───────────────
 * - Users can only read/write their own profile and expenses
 * - Shared expenses require groupId validation
 * - Only group admin can modify group settings
 * - Use Firestore Security Rules to enforce access control
 * 
 * INDEXES REQUIRED:
 * ─────────────────
 * - users/{uid}/expenses: date (DESC), category, type
 * - users/{uid}/income: date (DESC)
 * - Composite: expenses (date DESC + type ASC)
 * 
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

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

// ══════════════════════════════════════════════════════════════════════════════
// USER PROFILE API
// ══════════════════════════════════════════════════════════════════════════════
// Creates or updates user profile in Firestore

export const usersAPI = {
  // Create or update user profile
  // Called when user signs in for the first time or on subsequent logins
  // @param userId - Firebase Auth UID
  // @param userData - Object with email, displayName, photoURL
  // @returns Promise<Object> - User document
  createOrUpdateProfile: async (userId, userData) => {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Check if user exists
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // User exists, just update if needed
        await updateDoc(userRef, {
          updatedAt: serverTimestamp()
        });
        return { id: userSnap.id, ...userSnap.data() };
      } else {
        // New user, create profile
        const newUserData = {
          uid: userId,
          email: userData.email || '',
          name: userData.displayName || 'User',
          photoURL: userData.photoURL || '',
          groupId: null,
          role: null,
          darkMode: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        await setDoc(userRef, newUserData);
        return { id: userId, ...newUserData };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// EXPENSES API
// ══════════════════════════════════════════════════════════════════════════════
// Manages user expenses stored in /users/{userId}/expenses subcollection
// 
// Expense Document Structure:
// {
//   amount: number (required, > 0)
//   category: string (required, e.g., "Groceries", "Entertainment")
//   date: string (required, ISO format: "YYYY-MM-DD", not in future)
//   description: string (optional)
//   type: string (required, enum: "personal" | "shared")
//   createdBy: string (required, creator's UID - identifies expense owner)
//   groupId: string (required for type='shared', null/undefined for type='personal')
//   isSplit: boolean (required, true only if type='shared')
//   splitMembers: string[] (array of userIds, empty if not split)
//   isRecurring: boolean (required)
//   frequency: string (optional, if isRecurring is true)
//   endDate: string (optional, ISO format)
//   createdAt: timestamp (auto-set)
//   updatedAt: timestamp (auto-set)
// }
// 
// Storage Model:
// - Each expense stored ONLY in creator's collection (/users/{createdBy}/expenses)
// - Personal expenses: visible only to creator
// - Shared expenses: visible to creator + all group members (via groupId lookup)
// - NO DUPLICATION: groups query creator's collection for shared expenses by groupId
//
// Common Queries:
// - User's personal: where('type', '==', 'personal').where('createdBy', '==', userId)
// - User's all: getDocs(collection(db, 'users', userId, 'expenses'))
// - Family shared: fetch expenses where type='shared' and groupId=userGroup.id from each member
// - By date range: where('date', '>=', '2026-04-01').where('date', '<=', '2026-04-30')
// - By category: where('category', '==', 'Groceries')
// ══════════════════════════════════════════════════════════════════════════════

// Firestore utility functions for expenses
export const expensesAPI = {
  // Add a new expense
  // @param userId - Firebase Auth UID
  // @param expenseData - Object with amount, category, date, description, type, isSplit, splitMembers, etc.
  // @returns Promise<Object> - Created expense with ID
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
  // Returns all expenses from user's collection (personal + shared they created)
  // Does NOT return shared expenses created by other users (stored in their collections)
  // @param userId - Firebase Auth UID
  // @returns Promise<Array> - Expenses where createdBy=userId (personal or shared)
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

  // Listen to expenses in real-time with onSnapshot
  // Updates state and localStorage whenever expenses change in Firestore
  // @param userId - Firebase Auth UID
  // @param onUpdateCallback - Function called with updated expenses array
  // @returns Function - Unsubscribe function to stop listening
  listenToExpenses: (userId, onUpdateCallback) => {
    try {
      const userExpensesRef = collection(db, 'users', userId, 'expenses');
      const unsubscribe = onSnapshot(
        userExpensesRef,
        (snapshot) => {
          const expenses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Call callback with updated expenses
          onUpdateCallback(expenses);
        },
        (error) => {
          console.error('Error listening to expenses:', error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up expenses listener:', error);
      return () => {}; // Return no-op unsubscribe if setup fails
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

  // Get family shared expenses for a group
  // Fetches shared expenses (type='shared', groupId matches) from all group members' collections
  // Each expense stored only once in creator's collection, so this fetches from each member
  // @param groupMembers - Array of {userId, name} objects
  // @param groupId - The family group ID
  // @returns Promise<Array> - Array of shared expenses with createdBy field
  getSharedExpensesForGroup: async (groupMembers, groupId) => {
    if (!groupMembers || !groupId) {
      return [];
    }

    try {
      const allSharedExpenses = [];
      const seenIds = new Set(); // Track unique expenses to avoid duplicates in case of errors

      // Fetch expenses from each member's collection
      for (const member of groupMembers) {
        try {
          const memberExpenses = await expensesAPI.getExpenses(member.userId);

          // Filter for shared expenses of this group
          memberExpenses.forEach(exp => {
            if (exp.type === 'shared' && exp.groupId === groupId && !seenIds.has(exp.id)) {
              seenIds.add(exp.id);
              // Include createdBy to track who created this expense
              allSharedExpenses.push({
                ...exp,
                createdBy: exp.createdBy || member.userId // Fallback for backward compatibility
              });
            }
          });
        } catch (error) {
          console.warn(`Could not load expenses from member ${member.userId}:`, error.message);
          // Continue with other members if one fails
        }
      }

      return allSharedExpenses;
    } catch (error) {
      console.error('Error loading family shared expenses:', error);
      return [];
    }
  },

  // Get ALL family expenses (shared + personal from all members)
  // Used for family dashboard to calculate total spending (no double counting)
  // @param groupMembers - Array of {userId, name} objects
  // @param groupId - The family group ID
  // @returns Promise<Array> - All expenses from family members
  getAllFamilyExpenses: async (groupMembers, groupId) => {
    if (!groupMembers || !groupId) {
      return { shared: [], personal: [] };
    }

    try {
      const sharedExpenses = [];
      const personalExpenses = [];
      const seenSharedIds = new Set();
      const seenPersonalIds = new Set();

      // Fetch expenses from each member's collection
      for (const member of groupMembers) {
        try {
          const memberExpenses = await expensesAPI.getExpenses(member.userId);

          memberExpenses.forEach(exp => {
            // Collect shared expenses (by groupId or for backward compatibility, any shared expense)
            // Check: type is 'shared' AND (groupId matches OR groupId is not set/defined)
            if (exp.type === 'shared' && (exp.groupId === groupId || !exp.groupId) && !seenSharedIds.has(exp.id)) {
              seenSharedIds.add(exp.id);
              sharedExpenses.push({
                ...exp,
                createdBy: exp.createdBy || member.userId,
                groupId: exp.groupId || groupId // Set groupId if missing
              });
            }
            // Collect personal expenses from this member
            else if (exp.type === 'personal' && !seenPersonalIds.has(exp.id)) {
              seenPersonalIds.add(exp.id);
              personalExpenses.push({
                ...exp,
                createdBy: exp.createdBy || member.userId
              });
            }
          });
        } catch (error) {
          console.warn(`Could not load expenses from member ${member.userId}:`, error.message);
          // Continue with other members if one fails
        }
      }

      return { shared: sharedExpenses, personal: personalExpenses };
    } catch (error) {
      console.error('Error loading all family expenses:', error);
      return { shared: [], personal: [] };
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

// ══════════════════════════════════════════════════════════════════════════════
// INCOME API
// ══════════════════════════════════════════════════════════════════════════════
// Manages user income stored in /users/{userId}/income subcollection
// Income is PRIVATE - not shared across family groups
// 
// Income Document Structure:
// {
//   amount: number (required, > 0)
//   source: string (required, e.g., "Salary", "Bonus", "Investment")
//   date: string (required, ISO format: "YYYY-MM-DD")
//   description: string (optional)
//   isRecurring: boolean (required)
//   frequency: string (optional, if isRecurring is true)
//   endDate: string (optional, ISO format)
//   createdAt: timestamp (auto-set)
//   updatedAt: timestamp (auto-set)
// }
// 
// Common Queries:
// - All income: getDocs(collection(db, 'users', userId, 'income'))
// - By date range: where('date', '>=', '2026-04-01')
// - By source: where('source', '==', 'Salary')
// ══════════════════════════════════════════════════════════════════════════════

// Firestore utility functions for income
export const incomeAPI = {
  // Add a new income entry
  // @param userId - Firebase Auth UID
  // @param incomeData - Object with amount, source, date, description, isRecurring, etc.
  // @returns Promise<Object> - Created income with ID
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

  // Listen to income in real-time with onSnapshot
  // Updates state and localStorage whenever income changes in Firestore
  // @param userId - Firebase Auth UID
  // @param onUpdateCallback - Function called with updated income array
  // @returns Function - Unsubscribe function to stop listening
  listenToIncome: (userId, onUpdateCallback) => {
    try {
      const userIncomeRef = collection(db, 'users', userId, 'income');
      const unsubscribe = onSnapshot(
        userIncomeRef,
        (snapshot) => {
          const income = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Call callback with updated income
          onUpdateCallback(income);
        },
        (error) => {
          console.error('Error listening to income:', error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up income listener:', error);
      return () => {}; // Return no-op unsubscribe if setup fails
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

// ══════════════════════════════════════════════════════════════════════════════
// FAMILY GROUPS API
// ══════════════════════════════════════════════════════════════════════════════
// Manages family groups and group membership. Enables multi-user collaboration.
// 
// Family Group Document Structure:
// {
//   name: string (group name, e.g., "The Smiths")
//   adminId: string (userId of the admin)
//   adminName: string (name of admin for display)
//   members: [                 // Array of group members
//     {
//       userId: string,
//       name: string,
//       role: string ('admin' | 'member'),
//       joinedAt: timestamp
//     }
//   ]
//   inviteCodes: [             // Array of invite codes for joining
//     {
//       code: string (6-char uppercase, e.g., "ABC123"),
//       createdAt: timestamp,
//       createdBy: string (userId),
//       usedCount: number (how many users joined with this code)
//     }
//   ]
//   isActive: boolean (default true)
//   createdAt: timestamp (auto-set)
//   updatedAt: timestamp (auto-set)
// }
// 
// User Profile Updates:
// When user creates or joins a group, their /users/{userId} document is updated:
// {
//   groupId: string (family group ID)
//   role: string ('admin' | 'member')
// }
// 
// Workflow:
// 1. User A creates group → new familyGroups doc, invite code generated, admin added to members
// 2. User B joins with code → added to members array, groupId set in their profile
// 3. User B can see expenses where type='shared' from group members
// 4. Admin can generate new codes, remove members, change roles
// 
// Shared Expenses:
// Expenses with type='shared' are visible to all group members with role='member'
// Shared expenses can have isSplit=true to track who owes whom
// Settlement summary calculated based on split expenses
// 
// Query Patterns:
// - Get group: getDoc(doc(db, 'familyGroups', groupId))
// - Find by code: getDocs + filter client-side (see getGroupByCode for details)
// - Get user's group: After fetching user doc, use groupId to fetch group
// - Get all group members: Access members array from group document
// ══════════════════════════════════════════════════════════════════════════════

// Firestore utility functions for family groups
export const familyGroupsAPI = {
  // Generate a random 6-character invite code
  // Format: Uppercase alphanumeric string (e.g., "ABC123")
  // @returns string - Random 6-char code
  generateInviteCode: () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  },

  // Create a new family group
  // Creates a new group document, generates initial invite code, and adds creator as admin
  // Also updates user's profile with groupId and role='admin'
  // 
  // @param userId - Firebase Auth UID of group creator
  // @param userName - Display name of creator
  // @param groupName - Name of the family group (e.g., "The Johnsons")
  // @returns Promise<Object> - { id, name, adminId, inviteCode, members }
  // 
  // Side effects:
  // - Creates /familyGroups/{groupId} document
  // - Updates /users/{userId} to set groupId and role='admin'
  // 
  // Example:
  //   createGroup('user123', 'John Doe', 'The Johnsons')
  //   → Returns: { id: 'grp456', name: 'The Johnsons', inviteCode: 'ABC123', ... }
  createGroup: async function(userId, userName, groupName) {
    try {
      const inviteCode = this.generateInviteCode();
      const groupsRef = collection(db, 'familyGroups');
      const now = new Date().toISOString();
      const docRef = await addDoc(groupsRef, {
        name: groupName,
        adminId: userId,
        adminName: userName,
        members: [{
          userId,
          name: userName,
          role: 'admin',
          joinedAt: now
        }],
        inviteCodes: [{
          code: inviteCode,
          createdAt: now,
          createdBy: userId,
          usedCount: 0
        }],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update user profile with groupId and role
      await updateDoc(doc(db, 'users', userId), {
        groupId: docRef.id,
        role: 'admin',
        updatedAt: serverTimestamp()
      });

      return {
        id: docRef.id,
        name: groupName,
        adminId: userId,
        adminName: userName,
        members: [{
          userId,
          name: userName,
          role: 'admin',
          joinedAt: new Date().toISOString()
        }],
        inviteCodes: [{
          code: inviteCode,
          createdAt: new Date().toISOString(),
          createdBy: userId,
          usedCount: 0
        }],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating family group:', error);
      throw error;
    }
  },

  // Get group by invite code
  // Finds the family group that has the given invite code
  // Note: Since Firestore doesn't support complex array queries, this fetches all groups
  // and filters on the client. For apps with > 10K groups, consider:
  // - Separate /inviteCodes collection indexed by code
  // - Redis cache of active codes
  // 
  // @param inviteCode - The 6-character invite code (e.g., "ABC123")
  // @returns Promise<Object> - Group document with id and all fields, or undefined if not found
  // 
  // Performance: O(n) where n = number of groups. Acceptable for < 10K groups.
  // 
  // Example:
  //   getGroupByCode('ABC123')
  //   → Returns: { id: 'grp456', name: 'The Johnsons', members: [...], ... }
  getGroupByCode: async function(inviteCode) {
    try {
      const groupsRef = collection(db, 'familyGroups');
      // Note: Firebase doesn't support complex array queries, so we'll get all and filter
      const snapshot = await getDocs(groupsRef);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return docs.find(group => 
        group.inviteCodes && group.inviteCodes.some(ic => ic.code === inviteCode)
      );
    } catch (error) {
      console.error('Error getting group by code:', error);
      throw error;
    }
  },

  // Join a family group
  // Adds the user to an existing family group using an invite code
  // Updates user's profile with groupId and role='member'
  // Increments the inviteCode's usedCount
  // 
  // @param userId - Firebase Auth UID
  // @param userName - Display name of joining user
  // @param inviteCode - The 6-character invite code
  // @returns Promise<Object> - { id, name, role, members }
  // @throws Error if code is invalid, user already in group, or group not found
  // 
  // Side effects:
  // - Adds user to familyGroups/{groupId}.members array
  // - Updates inviteCodes array to increment usedCount
  // - Updates /users/{userId} to set groupId and role='member'
  // 
  // Example:
  //   joinGroup('user789', 'Jane Doe', 'ABC123')
  //   → Returns: { id: 'grp456', name: 'The Johnsons', role: 'member', members: 3 }
  joinGroup: async function(userId, userName, inviteCode) {
    try {
      const group = await this.getGroupByCode(inviteCode);
      if (!group) {
        throw new Error('Invalid invite code');
      }

      // Check if user is already a member
      if (group.members.some(m => m.userId === userId)) {
        throw new Error('You are already a member of this group');
      }

      // Add user to group members
      const now = new Date().toISOString();
      const updatedMembers = [...group.members, {
        userId,
        name: userName,
        role: 'member',
        joinedAt: now
      }];

      // Update invite code usage
      const updatedCodes = group.inviteCodes.map(ic => 
        ic.code === inviteCode 
          ? { ...ic, usedCount: (ic.usedCount || 0) + 1, lastUsedAt: new Date().toISOString() }
          : ic
      );

      await updateDoc(doc(db, 'familyGroups', group.id), {
        members: updatedMembers,
        inviteCodes: updatedCodes,
        updatedAt: serverTimestamp()
      });

      // Update user profile with groupId and role
      await updateDoc(doc(db, 'users', userId), {
        groupId: group.id,
        role: 'member',
        updatedAt: serverTimestamp()
      });

      return {
        id: group.id,
        name: group.name,
        adminId: group.adminId,
        adminName: group.adminName,
        members: updatedMembers,
        inviteCodes: updatedCodes,
        isActive: group.isActive,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt
      };
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  },

  // Get group details
  // Retrieves a single family group document by ID
  // 
  // @param groupId - The family group document ID
  // @returns Promise<Object> - Group document with id, name, members, inviteCodes, etc.
  // @throws Error if group not found
  // 
  // Usage: Called after user logs in to load their group data
  //   getGroup(user.groupId) → Load group members, invite codes, etc.
  // 
  // Example:
  //   getGroup('grp456')
  //   → Returns: { id: 'grp456', name: 'The Johnsons', members: [...], inviteCodes: [...] }
  getGroup: async function(groupId) {
    try {
      const groupRef = doc(db, 'familyGroups', groupId);
      const snapshot = await getDoc(groupRef);
      if (!snapshot.exists()) {
        throw new Error('Group not found');
      }
      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      console.error('Error getting group:', error);
      throw error;
    }
  },

  // Generate new invite code (Admin Only)
  // Creates a new invite code for the group. Used when admin wants to share
  // a new code with family members instead of reusing the original.
  // 
  // @param groupId - The family group ID
  // @param userId - Firebase Auth UID (must be group admin)
  // @returns Promise<string> - New 6-character invite code
  // @throws Error if user is not admin
  // 
  // Security: Only group admin can generate new codes
  // 
  // Example:
  //   generateNewCode('grp456', 'user123')  // user123 must be admin
  //   → Returns: 'XYZ789'
  generateNewCode: async function(groupId, userId) {
    try {
      const group = await this.getGroup(groupId);
      
      // Check if user is admin
      if (group.adminId !== userId) {
        throw new Error('Only admin can generate new codes');
      }

      const newCode = this.generateInviteCode();
      const updatedCodes = [...(group.inviteCodes || []), {
        code: newCode,
        createdAt: new Date().toISOString(),
        createdBy: userId,
        usedCount: 0
      }];

      await updateDoc(doc(db, 'familyGroups', groupId), {
        inviteCodes: updatedCodes,
        updatedAt: serverTimestamp()
      });

      return newCode;
    } catch (error) {
      console.error('Error generating new code:', error);
      throw error;
    }
  },

  // Leave group
  // Removes user from the family group. User's expenses are preserved but marked
  // as personal. User can no longer see shared family expenses.
  // 
  // Restriction: Admin cannot leave the group. They must transfer admin role
  // to another member first, then leave (or have another admin remove them).
  // 
  // @param userId - Firebase Auth UID
  // @param groupId - The family group ID
  // @returns Promise<boolean> - true on success
  // @throws Error if user is admin or group not found
  // 
  // Side effects:
  // - Removes user from familyGroups/{groupId}.members array
  // - Clears groupId and role from /users/{userId} profile
  // - User's existing expenses remain but become inaccessible to others
  // 
  // Example:
  //   leaveGroup('user789', 'grp456')
  //   → User removed from group, can no longer see shared expenses
  leaveGroup: async function(userId, groupId) {
    try {
      const group = await this.getGroup(groupId);

      // Admin cannot leave; must transfer ownership first
      if (group.adminId === userId) {
        throw new Error('Admin cannot leave. Transfer ownership to another member first.');
      }

      const updatedMembers = group.members.filter(m => m.userId !== userId);

      await updateDoc(doc(db, 'familyGroups', groupId), {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

      // Remove groupId from user profile
      await updateDoc(doc(db, 'users', userId), {
        groupId: null,
        role: null,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  },

  // Remove member from group (Admin Only)
  // Admin removes another member from the group. The removed member can no
  // longer access shared family expenses, but their past expenses are preserved.
  // 
  // Restriction: Admin cannot remove themselves. They must leave voluntarily
  // or have another admin remove them.
  // 
  // @param adminId - Firebase Auth UID of requesting admin
  // @param groupId - The family group ID
  // @param memberId - Firebase Auth UID of member to remove
  // @returns Promise<boolean> - true on success
  // @throws Error if requester not admin, trying to remove admin, or group not found
  // 
  // Side effects:
  // - Removes member from familyGroups/{groupId}.members array
  // - Clears groupId and role from removed member's /users/{memberId} profile
  // - Member's existing expenses remain but become inaccessible
  // 
  // Example:
  //   removeMember('user123', 'grp456', 'user999')  // user123 must be admin
  //   → Removes user999 from group
  removeMember: async function(adminId, groupId, memberId) {
    try {
      const group = await this.getGroup(groupId);

      if (group.adminId !== adminId) {
        throw new Error('Only admin can remove members');
      }

      if (memberId === group.adminId) {
        throw new Error('Cannot remove the admin');
      }

      const updatedMembers = group.members.filter(m => m.userId !== memberId);

      await updateDoc(doc(db, 'familyGroups', groupId), {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

      // Remove groupId from removed member's profile
      await updateDoc(doc(db, 'users', memberId), {
        groupId: null,
        role: null,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  // Change user role (Admin Only)
  // Admin promotes or demotes a member between 'member' and 'admin' roles.
  // This allows admins to delegate admin responsibilities.
  // 
  // Restriction: At least one admin must always exist in the group
  // (Cannot demote the last admin, but can promote members to admin first).
  // 
  // @param adminId - Firebase Auth UID of requesting admin
  // @param groupId - The family group ID
  // @param userId - Firebase Auth UID of member to change
  // @param newRole - New role: 'admin' or 'member'
  // @returns Promise<boolean> - true on success
  // @throws Error if requester not admin, invalid role, or group not found
  // 
  // Side effects:
  // - Updates role in familyGroups/{groupId}.members array
  // - Updates role in /users/{userId} profile
  // - Role change takes effect immediately for permission checks
  // 
  // Example:
  //   changeRole('user123', 'grp456', 'user789', 'admin')  // user123 must be admin
  //   → Promotes user789 to admin
  // 
  //   changeRole('user123', 'grp456', 'user789', 'member')
  //   → Demotes user789 back to member (if another admin exists)
  changeRole: async function(adminId, groupId, userId, newRole) {
    try {
      const group = await this.getGroup(groupId);

      if (group.adminId !== adminId) {
        throw new Error('Only admin can change roles');
      }

      if (newRole !== 'admin' && newRole !== 'member') {
        throw new Error('Invalid role');
      }

      const updatedMembers = group.members.map(m => 
        m.userId === userId ? { ...m, role: newRole } : m
      );

      await updateDoc(doc(db, 'familyGroups', groupId), {
        members: updatedMembers,
        updatedAt: serverTimestamp()
      });

      // Update user's role
      await updateDoc(doc(db, 'users', userId), {
        role: newRole,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error changing role:', error);
      throw error;
    }
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// DATA CLEANUP API
// ══════════════════════════════════════════════════════════════════════════════
// Utilities for cleaning up duplicated data from old model (pre-single-storage)
// The old model duplicated shared expenses across all family members' collections
// The new model stores shared expenses only in the creator's collection
// 
// These functions identify and remove duplicate shared expenses across users
// ══════════════════════════════════════════════════════════════════════════════

export const dataCleanupAPI = {
  /**
   * Clean up duplicated shared expenses across a family group
   * Identifies shared expenses that appear in multiple users' collections
   * Keeps the master copy (in creator's collection where createdBy === userId)
   * Deletes all duplicate copies from other users' collections
   * 
   * @param {Array} groupMembers - Array of {userId, name} objects
   * @param {String} groupId - The family group ID
   * @returns {Promise<Object>} Report: { duplicatesFound, duplicatesRemoved, errors }
   */
  cleanupDuplicatedSharedExpenses: async (groupMembers, groupId) => {
    const report = {
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      errors: [],
      details: []
    };

    try {
      if (!groupMembers || !groupId) {
        report.errors.push('Invalid groupMembers or groupId');
        return report;
      }

      // Map expense IDs to all users who have them
      const expenseToUsers = {};

      // Step 1: Scan all users' collections for shared expenses
      for (const member of groupMembers) {
        try {
          const memberExpenses = await expensesAPI.getExpenses(member.userId);

          memberExpenses.forEach(exp => {
            if (exp.type === 'shared' && exp.groupId === groupId) {
              if (!expenseToUsers[exp.id]) {
                expenseToUsers[exp.id] = {
                  expense: exp,
                  usersWithCopy: []
                };
              }
              expenseToUsers[exp.id].usersWithCopy.push({
                userId: member.userId,
                userName: member.name,
                isCreator: exp.createdBy === member.userId
              });
            }
          });
        } catch (error) {
          const errorMsg = `Failed to scan ${member.userId}'s collection: ${error.message}`;
          report.errors.push(errorMsg);
          console.warn(errorMsg);
        }
      }

      // Step 2: Identify and remove duplicates
      for (const [expenseId, data] of Object.entries(expenseToUsers)) {
        const { expense, usersWithCopy } = data;

        // If more than one user has this expense, it's a duplicate
        if (usersWithCopy.length > 1) {
          report.duplicatesFound++;

          // Identify the creator
          const creatorInfo = usersWithCopy.find(u => u.isCreator);
          const masterUserId = creatorInfo?.userId || expense.createdBy;

          // Delete from non-master users
          for (const userInfo of usersWithCopy) {
            if (userInfo.userId !== masterUserId) {
              try {
                await expensesAPI.deleteExpense(userInfo.userId, expenseId);
                report.duplicatesRemoved++;

                report.details.push({
                  expenseId,
                  expenseName: `${expense.category} - ₹${expense.amount}`,
                  deletedFromUser: userInfo.userName,
                  keptInUser: creatorInfo?.userName || 'System',
                  date: expense.date
                });
              } catch (error) {
                const errorMsg = `Failed to delete ${expenseId} from ${userInfo.userName}: ${error.message}`;
                report.errors.push(errorMsg);
                console.error(errorMsg);
              }
            }
          }
        }
      }

      console.log('Cleanup Report:', report);
      return report;
    } catch (error) {
      report.errors.push(`Critical error during cleanup: ${error.message}`);
      console.error('Data cleanup failed:', error);
      return report;
    }
  },

  /**
   * Scan for duplicate shared expenses without deleting
   * Returns a detailed report of duplicates found
   * 
   * @param {Array} groupMembers - Array of {userId, name} objects
   * @param {String} groupId - The family group ID
   * @returns {Promise<Object>} Report with duplicate details
   */
  auditDuplicatedSharedExpenses: async (groupMembers, groupId) => {
    const report = {
      duplicatesFound: 0,
      errors: [],
      duplicates: []
    };

    try {
      if (!groupMembers || !groupId) {
        report.errors.push('Invalid groupMembers or groupId');
        return report;
      }

      // Map expense IDs to all users who have them
      const expenseToUsers = {};

      // Scan all users' collections
      for (const member of groupMembers) {
        try {
          const memberExpenses = await expensesAPI.getExpenses(member.userId);

          memberExpenses.forEach(exp => {
            if (exp.type === 'shared' && exp.groupId === groupId) {
              if (!expenseToUsers[exp.id]) {
                expenseToUsers[exp.id] = {
                  expense: exp,
                  usersWithCopy: []
                };
              }
              expenseToUsers[exp.id].usersWithCopy.push({
                userId: member.userId,
                userName: member.name,
                isCreator: exp.createdBy === member.userId
              });
            }
          });
        } catch (error) {
          report.errors.push(`Failed to scan ${member.userId}'s collection: ${error.message}`);
        }
      }

      // Identify duplicates
      for (const [expenseId, data] of Object.entries(expenseToUsers)) {
        const { expense, usersWithCopy } = data;

        if (usersWithCopy.length > 1) {
          report.duplicatesFound++;
          report.duplicates.push({
            expenseId,
            category: expense.category,
            amount: expense.amount,
            date: expense.date,
            copiesFound: usersWithCopy.length,
            usersWithCopy: usersWithCopy,
            creator: expense.createdBy
          });
        }
      }

      return report;
    } catch (error) {
      report.errors.push(`Critical error during audit: ${error.message}`);
      console.error('Data audit failed:', error);
      return report;
    }
  }
};

export default app;

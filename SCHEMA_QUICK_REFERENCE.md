# Firestore Schema - Quick Reference Guide

## Collections Overview

```
📁 firestore/
├── 📄 users/{userId}
│   ├── uid: string (Auth UID)
│   ├── email: string
│   ├── name: string
│   ├── photoURL: string
│   ├── groupId: string (nullable)
│   ├── role: string ('admin' | 'member' | null)
│   ├── darkMode: boolean
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   │
│   ├── 📁 expenses/{expenseId}
│   │   ├── amount: number
│   │   ├── category: string
│   │   ├── date: string (YYYY-MM-DD)
│   │   ├── description: string
│   │   ├── type: string ('personal' | 'shared')
│   │   ├── isSplit: boolean
│   │   ├── splitMembers: string[]
│   │   ├── isRecurring: boolean
│   │   ├── frequency: string
│   │   ├── endDate: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   ├── 📁 income/{incomeId}
│   │   ├── amount: number
│   │   ├── source: string
│   │   ├── date: string (YYYY-MM-DD)
│   │   ├── description: string
│   │   ├── isRecurring: boolean
│   │   ├── frequency: string
│   │   ├── endDate: string
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│   │
│   └── 📁 recurringExpenses/{id}
│       └── [Similar to expenses]
│
└── 📄 familyGroups/{groupId}
    ├── name: string
    ├── adminId: string (userId)
    ├── adminName: string
    ├── members: object[]
    │   ├── userId: string
    │   ├── name: string
    │   ├── role: string ('admin' | 'member')
    │   └── joinedAt: timestamp
    ├── inviteCodes: object[]
    │   ├── code: string (ABC123)
    │   ├── createdAt: timestamp
    │   ├── createdBy: string (userId)
    │   └── usedCount: number
    ├── isActive: boolean
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

---

## Document Examples

### ✅ User Profile Example
```json
{
  "uid": "user_123abc",
  "email": "john@example.com",
  "name": "John Doe",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "groupId": "group_456def",
  "role": "admin",
  "darkMode": false,
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-04-05T14:30:00.000Z"
}
```

### ✅ Expense (Personal) Example
```json
{
  "amount": 25.50,
  "category": "Groceries",
  "date": "2026-04-05",
  "description": "Weekly shopping",
  "type": "personal",
  "isSplit": false,
  "splitMembers": [],
  "isRecurring": false,
  "frequency": null,
  "endDate": null,
  "createdAt": "2026-04-05T10:30:00.000Z",
  "updatedAt": "2026-04-05T10:30:00.000Z"
}
```

### ✅ Expense (Shared) Example
```json
{
  "amount": 120.00,
  "category": "Dining",
  "date": "2026-04-05",
  "description": "Dinner at restaurant with family",
  "type": "shared",
  "isSplit": true,
  "splitMembers": ["user_789ghi", "user_999jkl"],
  "isRecurring": false,
  "frequency": null,
  "endDate": null,
  "createdAt": "2026-04-05T19:00:00.000Z",
  "updatedAt": "2026-04-05T19:00:00.000Z"
}
```

**Split Calculation**:
- Payer (John): 120 ÷ 3 = $40
- User789: owes $40
- User999: owes $40
- Each person's share = amount ÷ (1 + splitMembers.length)

### ✅ Income Example
```json
{
  "amount": 2500.00,
  "source": "Salary",
  "date": "2026-04-01",
  "description": "Monthly salary",
  "isRecurring": true,
  "frequency": "monthly",
  "endDate": null,
  "createdAt": "2026-04-01T09:00:00.000Z",
  "updatedAt": "2026-04-01T09:00:00.000Z"
}
```

### ✅ Family Group Example
```json
{
  "name": "The Johnsons",
  "adminId": "user_123abc",
  "adminName": "John Doe",
  "members": [
    {
      "userId": "user_123abc",
      "name": "John Doe",
      "role": "admin",
      "joinedAt": "2026-03-15T10:00:00.000Z"
    },
    {
      "userId": "user_789ghi",
      "name": "Jane Doe",
      "role": "member",
      "joinedAt": "2026-03-20T14:30:00.000Z"
    },
    {
      "userId": "user_999jkl",
      "name": "Mike Smith",
      "role": "member",
      "joinedAt": "2026-04-01T08:00:00.000Z"
    }
  ],
  "inviteCodes": [
    {
      "code": "ABC123",
      "createdAt": "2026-03-15T10:00:00.000Z",
      "createdBy": "user_123abc",
      "usedCount": 2
    },
    {
      "code": "XYZ789",
      "createdAt": "2026-04-01T08:00:00.000Z",
      "createdBy": "user_123abc",
      "usedCount": 0
    }
  ],
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00.000Z",
  "updatedAt": "2026-04-05T14:30:00.000Z"
}
```

---

## Quick Query Guide

### Read Operations

| Operation | Code | Cost |
|-----------|------|------|
| Get user profile | `getDoc(doc(db, 'users', userId))` | 1 read |
| Get user expenses | `getDocs(collection(db, 'users', userId, 'expenses'))` | 1 read |
| Get user income | `getDocs(collection(db, 'users', userId, 'income'))` | 1 read |
| Get family group | `getDoc(doc(db, 'familyGroups', groupId))` | 1 read |
| Get shared expenses | `getDocs(query(..., where('type', '==', 'shared')))` | 1 read |

### Write Operations

| Operation | Code | Cost |
|-----------|------|------|
| Add expense | `addDoc(collection(...))` | 1 write |
| Update expense | `updateDoc(doc(...))` | 1 write |
| Delete expense | `deleteDoc(doc(...))` | 1 delete |
| Create group | `addDoc(collection('familyGroups'), ...)` | 1 write + 1 write (update user) |
| Join group | `updateDoc(...)` × 2 (group + user) | 2 writes |
| Leave group | `updateDoc(...)` × 2 (group + user) | 2 writes |
| Remove member | `updateDoc(...)` × 2 (group + user) | 2 writes |

---

## Common Field Validations

### amount
```javascript
// ✅ Valid
amount > 0
typeof amount === 'number'

// ❌ Invalid
amount <= 0
amount === null
amount === undefined
```

### date
```javascript
// ✅ Valid
/^\d{4}-\d{2}-\d{2}$/.test(date)  // Format: YYYY-MM-DD
new Date(date) <= new Date()        // Not in future

// ❌ Invalid
date = ''
date = '2026-13-01'  // Invalid month
date = '2026-04-06'  // Future date
```

### type (for expenses)
```javascript
// ✅ Valid
type === 'personal' || type === 'shared'

// ❌ Invalid
type === 'mixed'
type === 'private'
```

### role (in family group)
```javascript
// ✅ Valid
role === 'admin' || role === 'member'

// ❌ Invalid
role === 'owner'
role === 'superadmin'
```

---

## Expense Type Flows

### 📌 Personal Expense Flow
```
User creates expense
  ↓
Set type: 'personal'
  ↓
isSplit: false, splitMembers: []
  ↓
Stored in /users/{userId}/expenses
  ↓
❌ NOT visible to family members
```

### 📌 Shared Expense (Not Split) Flow
```
User creates expense
  ↓
Set type: 'shared'
  ↓
isSplit: false, splitMembers: []
  ↓
Stored in /users/{userId}/expenses
  ↓
✅ Visible to all family members
(User paid full amount, tracking only)
```

### 📌 Shared Expense (Split) Flow
```
User creates expense
  ↓
Set type: 'shared', isSplit: true
  ↓
Select splitMembers: [uid1, uid2, ...]
  ↓
Stored in /users/{userId}/expenses
  ↓
✅ Visible to all family members
  ↓
Calculating settlements:
  - Amount ÷ (splitMembers.length + 1)
  - Each splitter owes this amount
  - Payer also owes this amount (NOT the full amount)
```

---

## Settlement Algorithm

```
Input: All shared expenses with isSplit=true

// Initialize balances
balances = {}
for each member in group:
  balances[member] = 0

// Process splits
for each split expense:
  payer = expense.userId
  amount = expense.amount
  splitCount = splitMembers.length + 1
  perPersonShare = amount / splitCount

  // Payer paid full amount
  balances[payer] += amount

  // Each splitter owes their share
  for each memberId in splitMembers:
    balances[memberId] -= perPersonShare

  // Payer also owes their share (not the full amount!)
  balances[payer] -= perPersonShare

// Generate settlements
// Only need to settle negative balances
settlements = []
for each (memberId, balance) in balances:
  if balance > 0:
    // This person is owed money
    // Match with someone who owes money

Output: List of { payer, payee, amount }
```

**Example**:
```
Group: John ($), Jane (?), Mike (?)
Expense: $30 restaurant bill
Payer: John, Split with: Jane, Mike

Calculation:
- Per-person share = $30 / 3 = $10
- John's balance: +$30 (paid) -$10 (owes own share) = +$20
- Jane's balance: -$10 (owes share)
- Mike's balance: -$10 (owes share)

Settlement: Jane pays John $10, Mike pays John $10
```

---

## Security Model

### 🔒 Access Rules

| Who | Can Do | Cannot Do |
|-----|--------|-----------|
| **User (any)** | Read own profile | Read other's profile |
| **User (any)** | Read own expenses/income | Read other's personal expenses |
| **Family Member** | Read shared expenses from group | Read personal expenses of group members |
| **Family Admin** | Modify group settings | Create expenses for others |
| **Group Admin** | Generate invite codes | Remove themselves (must leave) |
| **Non-Admin** | Can't modify group | Can't manage members |

### 🔓 Public Access
- ❌ No public access to any user data
- ❌ No guest viewing of expenses
- ✅ Only authenticated users can access their own data

---

## Indexes Required

### Single-Field Indexes (Auto-created by Firestore)
```
Collection: users/{uid}/expenses
┌─────────────────┬───────┐
│ Field | Direction │
├─────────────────┼───────┤
│ date  │ Descending│
│ category│ Ascending│
│ type  │ Ascending│
└─────────────────┴───────┘

Collection: users/{uid}/income
┌──────┬───────────┐
│ date │ Descending│
└──────┴───────────┘
```

### Composite Indexes (Manual creation in Firebase)
```
Collection: users/{uid}/expenses
┌─────────┬──────────┬───────────┐
│ Field 1 │ Field 2  │ Direction │
├─────────┼──────────┼───────────┤
│ type    │ date     │ ASC, DESC │
│ category│ date     │ ASC, DESC │
└─────────┴──────────┴───────────┘
```

---

## Performance Notes

| Query | Time | Notes |
|-------|------|-------|
| Get user profile | < 10ms | Direct read, 1 doc |
| Get all expenses | < 100ms | Usually 10-100 docs |
| Get expenses by date | < 100ms | Uses index |
| Get expenses by category | < 100ms | Uses index |
| Get shared expenses | < 100ms | Composite index |
| Get family group | < 10ms | Direct read, 1 doc |
| Find group by code | 500-5000ms | O(n) scan, all groups |

**Optimization Tips**:
1. Paginate: Load 25 items at a time, not all
2. Cache: Store user profile locally
3. Batch: Combine multiple queries
4. Index: Create required indexes before production
5. Archive: Move old data (2+ years) to archive collection

---

## Testing Quick Checklist

### Create Operations
- [ ] Add personal expense
- [ ] Add shared expense
- [ ] Add expense split
- [ ] Add income entry
- [ ] Create family group
- [ ] Add existing user to group

### Read Operations
- [ ] Load user profile
- [ ] Load all expenses
- [ ] Filter by type (personal/shared)
- [ ] Filter by category
- [ ] Load family group
- [ ] Load group members list
- [ ] Load shared expenses
- [ ] Load settlements

### Update Operations
- [ ] Edit expense details
- [ ] Change expense category
- [ ] Toggle expense privacy (personal ↔ shared)
- [ ] Edit group name
- [ ] Change member role (admin ↔ member)
- [ ] Generate new invite code

### Delete Operations
- [ ] Delete expense
- [ ] Delete income entry
- [ ] Remove member from group
- [ ] Leave group (as member)
- [ ] Delete entire group (as admin)

### Validations
- [ ] Prevent negative amounts
- [ ] Prevent future dates
- [ ] Require category for expenses
- [ ] Require source for income
- [ ] Ensure admin exists in group
- [ ] Validate invite code format

---

## Useful Firebase Console Commands

### Export Data
```bash
gcloud firestore export gs://your-bucket/export-$(date +%Y%m%d)
```

### Delete Collection
```bash
gcloud firestore databases delete-collection users --quiet
```

### Import Data
```bash
gcloud firestore import gs://your-bucket/export-date/
```

### View Indexes
```
Firebase Console → Firestore → Indexes tab
```

---

## Files Reference

| File | Contains |
|------|----------|
| [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) | Complete schema specification |
| [SCHEMA_DOCUMENTATION_INDEX.md](./SCHEMA_DOCUMENTATION_INDEX.md) | Detailed documentation index |
| [SCHEMA_QUICK_REFERENCE.md](./SCHEMA_QUICK_REFERENCE.md) | This file - quick lookups |
| [src/firebase.js](./src/firebase.js) | Implementation with inline docs |

---

**Last Updated**: April 2026  
**Schema Version**: 1.0  
**Stability**: Production Ready ✅

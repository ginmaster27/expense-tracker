# Firestore Schema Design - Family Expense Tracker

## Overview
This document defines the complete Firestore database schema for the Family Expense Tracker application. The schema is optimized for efficient querying, security, and scalability.

---

## Collections Structure

### 1. **users** Collection
Root-level collection containing user profile data.

```
/users/{userId}
├── uid: string (matches Auth UID)
├── email: string
├── name: string
├── photoURL: string (optional)
├── groupId: string (optional, null if not in a family group)
├── role: string (enum: 'admin', 'member', null)
├── darkMode: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes Required:**
- `groupId` (ASC) - for querying users in a specific family group

**Security Rules:**
- Users can only read/write their own document
- Only authenticated users can create their profile

**Example Document:**
```json
{
  "uid": "user_123",
  "email": "john@example.com",
  "name": "John Doe",
  "photoURL": "https://...",
  "groupId": "group_456",
  "role": "admin",
  "darkMode": false,
  "createdAt": "2026-04-05T10:00:00Z",
  "updatedAt": "2026-04-05T10:00:00Z"
}
```

---

### 2. **users/{userId}/expenses** Subcollection
Contains all expenses created by a specific user.

```
/users/{userId}/expenses/{expenseId}
├── amount: number
├── category: string
├── date: string (ISO format: YYYY-MM-DD)
├── description: string (optional)
├── type: string (enum: 'personal', 'shared')
├── isSplit: boolean
├── splitMembers: string[] (array of userIds)
├── isRecurring: boolean
├── frequency: string (optional, enum: 'daily', 'weekly', 'monthly', 'yearly')
├── endDate: string (optional, ISO format)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes Required:**
- `date` (DESC) - for chronological queries
- `category` (ASC) - for category filtering
- `type` (ASC) - for personal/shared filtering
- Composite: `date` (DESC) + `type` (ASC)

**Security Rules:**
- Users can only read/write their own expenses
- Must have `type` field (personal or shared)
- Shared expenses require `groupId` validation via rules

**Example Document:**
```json
{
  "amount": 45.50,
  "category": "Groceries",
  "date": "2026-04-05",
  "description": "Weekly shopping at supermarket",
  "type": "shared",
  "isSplit": true,
  "splitMembers": ["user_789", "user_999"],
  "isRecurring": false,
  "frequency": null,
  "endDate": null,
  "createdAt": "2026-04-05T10:30:00Z",
  "updatedAt": "2026-04-05T10:30:00Z"
}
```

---

### 3. **users/{userId}/income** Subcollection
Contains all income entries for a specific user.

```
/users/{userId}/income/{incomeId}
├── amount: number
├── source: string
├── date: string (ISO format: YYYY-MM-DD)
├── description: string (optional)
├── isRecurring: boolean
├── frequency: string (optional, enum: 'daily', 'weekly', 'monthly', 'yearly')
├── endDate: string (optional, ISO format)
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes Required:**
- `date` (DESC) - for chronological queries
- `source` (ASC) - for income source filtering

**Security Rules:**
- Users can only read/write their own income entries
- Private (not shared across family)

**Example Document:**
```json
{
  "amount": 2500.00,
  "source": "Salary",
  "date": "2026-04-01",
  "description": "Monthly salary from employer",
  "isRecurring": true,
  "frequency": "monthly",
  "endDate": null,
  "createdAt": "2026-04-01T09:00:00Z",
  "updatedAt": "2026-04-01T09:00:00Z"
}
```

---

### 4. **familyGroups** Collection
Root-level collection for family group definitions.

```
/familyGroups/{groupId}
├── name: string
├── adminId: string (userId of group admin)
├── adminName: string
├── members: array[object]
│   └── [{ userId, name, role ('admin'|'member'), joinedAt }]
├── inviteCodes: array[object]
│   └── [{ code, createdAt, createdBy, usedCount }]
├── isActive: boolean
├── createdAt: timestamp
└── updatedAt: timestamp
```

**Indexes Required:**
- Collection is small; typically < 1000 groups per app
- No indexes needed for this collection

**Security Rules:**
- Any authenticated user can read the group they belong to
- Only admin can modify group data
- Can only join with valid invite code

**Example Document:**
```json
{
  "name": "The Johnsons",
  "adminId": "user_123",
  "adminName": "John Doe",
  "members": [
    {
      "userId": "user_123",
      "name": "John Doe",
      "role": "admin",
      "joinedAt": "2026-03-15T10:00:00Z"
    },
    {
      "userId": "user_789",
      "name": "Jane Doe",
      "role": "member",
      "joinedAt": "2026-03-20T14:30:00Z"
    },
    {
      "userId": "user_999",
      "name": "Mike Smith",
      "role": "member",
      "joinedAt": "2026-04-01T08:00:00Z"
    }
  ],
  "inviteCodes": [
    {
      "code": "ABC123",
      "createdAt": "2026-03-15T10:00:00Z",
      "createdBy": "user_123",
      "usedCount": 2
    },
    {
      "code": "XYZ789",
      "createdAt": "2026-04-01T08:00:00Z",
      "createdBy": "user_123",
      "usedCount": 0
    }
  ],
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-04-05T14:30:00Z"
}
```

---

## Data Flow & Relationships

### User Creates Personal Expense
```
users/{userId}
  ├── expenses/{expenseId} [type: 'personal']
  └── (not visible to family members)
```

### User Creates Shared Expense
```
users/{userId}
  ├── profile: groupId = 'group_456'
  └── expenses/{expenseId} [type: 'shared', splitMembers: [...]]

familyGroups/group_456
  └── members: [all members who can see this expense]
```

### Settlement Calculation
```
For each user in group:
  1. Query all shared expenses where type='shared'
  2. For each split expense:
     balance += (amount / splitCount) for splitters
     balance -= (amount / splitCount) for splitters
  3. Generate settlements showing who owes whom
```

---

## Query Patterns

### 1. Get All User Expenses (Ordered by Date)
```javascript
collection(db, 'users', userId, 'expenses')
  .where('date', '<=', today)
  .orderBy('date', 'desc')
```
**Indexes:** `date` (DESC)

### 2. Get Expenses by Category
```javascript
collection(db, 'users', userId, 'expenses')
  .where('category', '==', 'Groceries')
  .orderBy('date', 'desc')
```
**Indexes:** `category` (ASC), `date` (DESC)

### 3. Get Shared Expenses Only
```javascript
collection(db, 'users', userId, 'expenses')
  .where('type', '==', 'shared')
  .orderBy('date', 'desc')
```
**Indexes:** `type` (ASC), `date` (DESC)

### 4. Get All Family Group Members
```javascript
getDoc(doc(db, 'familyGroups', groupId))
// members array directly from document
```
**No index needed** - Direct document read

### 5. Get Group by Invite Code
```javascript
// Current implementation: fetch all groups, filter client-side
// Alternative: Create a separate inviteCodes collection (future optimization)
getDocs(collection(db, 'familyGroups'))
  .then(docs => docs.find(doc => 
    doc.data().inviteCodes.some(ic => ic.code === code)
  ))
```
**Note:** If group count exceeds 10,000, consider extracting inviteCodes to separate collection

### 6. Get User Profile with Group
```javascript
getDoc(doc(db, 'users', userId))
// Returns: { uid, email, name, groupId, role, ... }
// Then fetch group details if groupId exists
```

### 7. Get Monthly Spending by Category
```javascript
collection(db, 'users', userId, 'expenses')
  .where('date', '>=', '2026-04-01')
  .where('date', '<=', '2026-04-30')
  .where('type', '==', 'shared')
  .orderBy('date', 'desc')
// Group and aggregate on client
```

---

## Indexing Strategy

### Composite Indexes Required

| Collection | Fields | Direction |
|-----------|--------|-----------|
| users/*/expenses | date, type | DESC, ASC |
| users/*/expenses | category, date | ASC, DESC |
| users/*/income | date | DESC |

### Search Firestore Console
Firestore will automatically suggest these indexes when queries need them.

---

## Security Rules

### Recommended Firestore Security Rules

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection: users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      // Subcollections: expenses and income
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Family groups: members can read their group, admin can modify
    match /familyGroups/{groupId} {
      allow read: if request.auth.uid != null && 
                     groupId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.groupId;
      allow write: if request.auth.uid != null &&
                      request.resource.data.adminId == request.auth.uid;
      allow create: if request.auth.uid != null;
    }
  }
}
```

---

## Data Validation Rules

### Expense Document
- `amount`: Required, number > 0
- `category`: Required, string, non-empty
- `date`: Required, ISO string, not in future
- `type`: Required, enum: ['personal', 'shared']
- `description`: Optional, string
- `isSplit`: Required (boolean), only true if type='shared'
- `splitMembers`: Default to [], only valid if isSplit=true

### Income Document
- `amount`: Required, number > 0
- `source`: Required, string, non-empty
- `date`: Required, ISO string, not in future
- `description`: Optional, string

### Family Group Document
- `name`: Required, string, non-empty, max 100 chars
- `adminId`: Required, must be valid userId
- `members`: Array of objects with userId, name, role
- `inviteCodes`: Array of objects with code (6 chars), createdAt, createdBy, usedCount
- `isActive`: Boolean, default true

---

## Scalability Considerations

### Current Limits (Acceptable)
- **Users per App**: 10,000+ users
- **Groups per User**: 1 group (enforced by app logic)
- **Members per Group**: Up to 500 members (Firestore document size limit)
- **Expenses per User**: 100,000+ expenses (subcollection)
- **Documents Read/Month**: 1 million free quota

### Future Optimizations (If Needed)

1. **Separate Invite Codes Collection**
   ```
   /inviteCodes/{codeId}
   ├── code: string (indexed)
   ├── groupId: string (indexed)
   ├── createdAt: timestamp
   ├── createdBy: string
   └── usedCount: number
   ```
   **Benefit**: Faster lookups for valid codes, no full collection scan

2. **Expense Statistics Cache**
   ```
   /familyGroups/{groupId}/statistics/{month}
   ├── totalExpenses: number
   ├── totalIncome: number
   ├── balance: number
   └── lastUpdated: timestamp
   ```
   **Benefit**: Faster dashboard loading

3. **Settlement Ledger**
   ```
   /settlements/{settlementId}
   ├── groupId: string
   ├── payer: string
   ├── payee: string
   ├── amount: number
   ├── expenseId: string
   └── status: enum ('pending', 'completed')
   ```
   **Benefit**: Track settlement history

---

## Backup & Recovery

### Recommended Backup Strategy
- **Frequency**: Daily automated backups
- **Retention**: 30-day retention
- **Method**: Firestore export to Cloud Storage
- **Recovery Time**: < 1 hour for full restoration

### Export Collections (Manual Backup)
```bash
gcloud firestore export gs://your-bucket/firestore-backup
```

---

## Cost Estimation (as of Apr 2026)

### Monthly Costs for 1,000 Active Users
- **Reads**: 10M documents × $0.06 per 100K = $60
- **Writes**: 2M documents × $0.18 per 100K = $36
- **Deletes**: 0.5M documents × $0.02 per 100K = $10
- **Storage**: 50GB × $0.18 per GB = $9
- **Total**: ~$115/month

### Cost Optimization Tips
1. Batch read operations on client
2. Paginate long queries (25 items per page)
3. Use local caching for user profiles
4. Archive old expenses (> 2 years) monthly
5. Denormalize frequently accessed data (e.g., member names in expenses)

---

## Migration Path (If Upgrading)

### From Previous Schema (If Applicable)
1. Backup current Firestore database
2. Script to migrate data:
   - Users collection stays same
   - Expenses/Income subcollections remain
   - Create new familyGroups collection
   - Update user documents with groupId
3. Test thoroughly in staging
4. Deploy with dual-write for verification
5. Cutover when verified

---

## Testing Checklist

- [ ] Create user profile
- [ ] Add personal expense
- [ ] Add shared expense
- [ ] Create family group
- [ ] Invite user with code
- [ ] Verify shared expense visibility
- [ ] Calculate settlements correctly
- [ ] Edit/delete operations work
- [ ] Security rules enforced
- [ ] Indexes exist and being used
- [ ] Performance < 1 second for queries

---

## Related Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Security Rules Guide](https://firebase.google.com/docs/rules)

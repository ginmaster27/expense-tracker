# Firestore Schema Documentation Index

## Overview
This project includes comprehensive documentation of the Firestore database schema used by the Family Expense Tracker application. The documentation is split across multiple files for ease of understanding and quick reference.

---

## Documentation Files

### 1. **FIRESTORE_SCHEMA.md** (Primary Reference)
**Purpose**: Complete schema design specification  
**Location**: `/FIRESTORE_SCHEMA.md`

**Contents**:
- ✅ Collections structure with hierarchy
- ✅ Field specifications with types and validation
- ✅ Example JSON documents for each collection
- ✅ Data relationships and flows
- ✅ 7 Common query patterns with code examples
- ✅ Index requirements for production
- ✅ Security rules recommendations
- ✅ Data validation rules
- ✅ Scalability considerations & future optimizations
- ✅ Backup and recovery strategy
- ✅ Cost estimation (for 1,000 active users)
- ✅ Migration path guidance
- ✅ Testing checklist

**When to Use**:
- Setting up a new Firestore project
- Designing indexes in Firebase Console
- Implementing Firestore Security Rules
- Cost planning and capacity planning
- Understanding overall architecture

---

### 2. **src/firebase.js** (Implementation Reference)
**Purpose**: Annotated source code with detailed documentation  
**Location**: `/src/firebase.js`

**Documentation Sections**:

#### 2a. Schema Overview Header (Lines 1-87)
- ASCII diagram of complete collection structure
- Field specifications for all documents
- Query patterns with examples
- Security notes
- Index requirements

#### 2b. Expenses API Documentation (Lines 115-130)
- Expense document structure
- All field specifications
- Common query patterns
- Requirements for split expenses

#### 2c. Income API Documentation (Lines 281-304)
- Income document structure
- Privacy notes
- Common query patterns
- Field specifications

#### 2d. Family Groups API Documentation (Lines 357-405)
- Complete family group workflow
- Member lifecycle (create → join → leave)
- Invite code system explanation
- Shared expense visibility rules
- Settlement calculation overview

#### 2e. Method-Level Documentation (Lines 406-530+)
Each API method includes:
- Purpose and use cases
- Parameter specifications (@param with types)
- Return value documentation (@returns)
- Error cases and exceptions (@throws)
- Side effects and data changes
- Real-world usage examples
- Security and permission notes

**When to Use**:
- Implementing database operations in code
- Understanding method signatures and parameters
- Debugging database operations
- Learning by example (see actual implementations)
- Quick reference while coding

---

## Collections Reference

### Collection: `/users`
**Type**: Root Collection  
**Purpose**: User profiles and authentication data  
**Scope**: One document per authenticated user

**Fields**:
| Field | Type | Notes |
|-------|------|-------|
| uid | string | Matches Firebase Auth UID (primary key) |
| email | string | User's email address |
| name | string | Display name |
| photoURL | string | Optional profile picture |
| groupId | string | Family group ID (null if not in group) |
| role | string | 'admin' \| 'member' \| null |
| darkMode | boolean | User's theme preference |
| createdAt | timestamp | Account creation time |
| updatedAt | timestamp | Last profile update |

**Subcollections**:
- `expenses/{expenseId}` - Individual user expenses
- `income/{incomeId}` - Individual user income entries
- `recurringExpenses/{id}` - Recurring expense definitions

---

### Collection: `/familyGroups`
**Type**: Root Collection  
**Purpose**: Family group definitions and member management  
**Scope**: One document per family group

**Fields**:
| Field | Type | Notes |
|-------|------|-------|
| name | string | Human-readable group name |
| adminId | string | userId of group administrator |
| adminName | string | Admin's display name |
| members | array | Array of {userId, name, role, joinedAt} |
| inviteCodes | array | Array of {code, createdAt, createdBy, usedCount} |
| isActive | boolean | Group status (default: true) |
| createdAt | timestamp | Group creation time |
| updatedAt | timestamp | Last modification time |

**Important Notes**:
- No direct subcollections
- Member data is **denormalized** inside the array
- Invite codes tracked with usage count
- Admin is the **only** user who can modify group

---

### Subcollection: `users/{userId}/expenses`
**Type**: Subcollection under users  
**Purpose**: Record all expenses for a user  
**Scope**: Many documents per user

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | Yes | Must be > 0 |
| category | string | Yes | e.g., "Groceries", "Entertainment" |
| date | string | Yes | ISO format: "YYYY-MM-DD" |
| description | string | No | Optional notes |
| type | string | Yes | 'personal' \| 'shared' |
| isSplit | boolean | Yes | true if split with others |
| splitMembers | array | Conditional | Only if isSplit=true, array of userIds |
| isRecurring | boolean | Yes | true if recurring |
| frequency | string | Conditional | 'daily', 'weekly', 'monthly', 'yearly' |
| endDate | string | No | When recurring expense ends |
| createdAt | timestamp | Yes | Auto-set by server |
| updatedAt | timestamp | Yes | Auto-set by server |

**Split Expense Logic**:
- `isSplit: false` → expense created by one person, not shared
- `isSplit: true` → expense creator splits with specified members
- `splitMembers: [uid1, uid2]` → these users owe their share
- Settlement algorithm: amount ÷ (splitMembers.length + 1) per person

---

### Subcollection: `users/{userId}/income`
**Type**: Subcollection under users  
**Purpose**: Record all income for a user  
**Scope**: Many documents per user

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| amount | number | Yes | Must be > 0 |
| source | string | Yes | e.g., "Salary", "Bonus" |
| date | string | Yes | ISO format: "YYYY-MM-DD" |
| description | string | No | Optional notes |
| isRecurring | boolean | Yes | true if recurring |
| frequency | string | Conditional | 'daily', 'weekly', 'monthly', 'yearly' |
| endDate | string | No | When recurring income ends |
| createdAt | timestamp | Yes | Auto-set by server |
| updatedAt | timestamp | Yes | Auto-set by server |

**Privacy**: Income is **private** to the user, never shared with family members.

---

## Query Patterns

### Querying Individual User Data

**Get all expenses (ordered by date)**:
```javascript
getDocs(
  query(
    collection(db, 'users', userId, 'expenses'),
    orderBy('date', 'desc')
  )
)
```
**Requirement**: Index on `date` (DESC)

**Get shared expenses only**:
```javascript
getDocs(
  query(
    collection(db, 'users', userId, 'expenses'),
    where('type', '==', 'shared'),
    orderBy('date', 'desc')
  )
)
```
**Requirement**: Composite index (type ASC, date DESC)

**Get expenses by date range**:
```javascript
getDocs(
  query(
    collection(db, 'users', userId, 'expenses'),
    where('date', '>=', '2026-04-01'),
    where('date', '<=', '2026-04-30'),
    orderBy('date', 'desc')
  )
)
```
**Requirement**: Index on `date`

**Get expenses by category**:
```javascript
getDocs(
  query(
    collection(db, 'users', userId, 'expenses'),
    where('category', '==', 'Groceries')
  )
)
```
**Requirement**: Index on `category`

---

### Querying Family Group Data

**Get group details**:
```javascript
getDoc(doc(db, 'familyGroups', groupId))
// Returns: { id, name, members, inviteCodes, ... }
```
**Performance**: O(1) - direct read, no index needed

**Get user's group**:
```javascript
// Step 1: Get user profile
const userDoc = await getDoc(doc(db, 'users', userId));
const groupId = userDoc.data().groupId;

// Step 2: Get group details
const groupDoc = await getDoc(doc(db, 'familyGroups', groupId));
```
**Performance**: 2 reads, both O(1)

**Find group by invite code**:
```javascript
// Note: No direct query possible due to Firestore limitations
// Current implementation: Full scan + client-side filter
const groupsSnapshot = await getDocs(collection(db, 'familyGroups'));
const group = groupsSnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .find(g => g.inviteCodes.some(ic => ic.code === 'ABC123'));
```
**Performance**: O(n) where n = number of groups
**Optimization**: For > 10K groups, create separate inviteCodes collection

---

### Aggregating Family Data

**Get all family's shared expenses** (for family dashboard):
```javascript
// For each group member:
const memberExpenses = await getDocs(
  query(
    collection(db, 'users', memberId, 'expenses'),
    where('type', '==', 'shared'),
    orderBy('date', 'desc')
  )
);
// Combine all member expenses in app

// Calculate settlements from split expenses:
const settlements = calculateSettlements(allSharedExpenses);
```
**Performance**: 1 read per group member + application logic

---

## Indexes Required for Production

### Primary Indexes (Auto-created by Firestore)

| Collection | Field | Direction | Purpose |
|-----------|-------|-----------|---------|
| users/{uid}/expenses | date | DESC | Chronological queries |
| users/{uid}/expenses | category | ASC | Category filtering |
| users/{uid}/expenses | type | ASC | Personal vs shared |
| users/{uid}/income | date | DESC | Income history |

### Composite Indexes (Manual Creation)

| Collection | Fields | Directions | Query Type |
|-----------|--------|-----------|-----------|
| users/{uid}/expenses | type, date | ASC, DESC | Shared expenses by date |
| users/{uid}/expenses | category, date | ASC, DESC | Category expenses by date |

**How to Create in Firebase Console**:
1. Go to Firestore Database → Indexes
2. Click "Create Index"
3. Select collection: `users/{uid}/expenses`
4. Add fields with directions as shown above
5. Wait for index to build (usually < 5 minutes)

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
      
      // All subcollections: same ownership rule
      match /{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Family groups: members can read their group
    match /familyGroups/{groupId} {
      allow read: if request.auth.uid != null && 
                     request.auth.uid in resource.data.members[*].userId;
      
      allow write: if request.auth.uid != null &&
                      resource.data.adminId == request.auth.uid;
      
      allow create: if request.auth.uid != null;
    }
  }
}
```

### Key Security Principles
1. **User Isolation**: Users can only access their own profiles and subcollections
2. **Shared Expense Safety**: Only family group members can see group's shared expenses
3. **Admin-Only Operations**: Only group admin can modify group settings
4. **Immature Timestamps**: No direct timestamp allows for audit trails

---

## Data Validation Rules

### User Profile
- ✅ `uid` must match Firebase Auth UID
- ✅ `email` must be valid email format
- ✅ `name` must be non-empty string
- ✅ `groupId` must reference valid familyGroups document (if set)
- ✅ `role` must be 'admin' or 'member' (if groupId set)

### Expense
- ✅ `amount` must be number > 0
- ✅ `category` must be non-empty string
- ✅ `date` must be ISO string, not in future
- ✅ `type` must be 'personal' or 'shared'
- ✅ `isSplit` must be boolean, true only if type='shared'
- ✅ `splitMembers` only populated if isSplit=true
- ✅ Each splitMember must exist in family group

### Income
- ✅ `amount` must be number > 0
- ✅ `source` must be non-empty string
- ✅ `date` must be ISO string, not in future

### Family Group
- ✅ `name` must be non-empty string, max 100 chars
- ✅ `adminId` must be valid userId
- ✅ `members` array must contain only valid member objects
- ✅ `inviteCodes` array must contain only valid code objects
- ✅ `code` must be 6-character uppercase alphanumeric
- ✅ At least one admin must always exist

---

## Cost Estimation

### For 1,000 Active Users

**Assumptions**:
- Average 10 expenses per user per month
- Average 2 income entries per user per month
- 20 family groups with avg 50 members each
- Average 2 shared expenses per group per month

**Monthly Costs**:
| Operation | Volume | Cost |
|-----------|--------|------|
| Reads | 15M | $90 |
| Writes | 3M | $54 |
| Deletes | 0.5M | $10 |
| Storage | 50GB | $9 |
| **Total** | | **~$163/month** |

**Optimization Tips**:
1. **Batch reads**: Combine 10 user queries into 1 batch read
2. **Pagination**: Load 25 expenses per page, not all at once
3. **Caching**: Store user profile in browser localStorage
4. **Archive**: Move expenses > 2 years old to Archive collection
5. **Denormalize**: Keep member names in group instead of looking up per user

---

## Migration Guide

### From Previous Data Structure

**Step 1**: Backup current Firestore database
```bash
gcloud firestore export gs://your-bucket/backup-$(date +%Y%m%d)
```

**Step 2**: Prepare migration script
- Map old expense fields to new schema
- Ensure all documents have required fields
- Set default values for new fields (isSplit: false, etc.)

**Step 3**: Run migration safely
- Test in staging environment first
- Enable dual-write during transition (write to both old & new)
- Verify data integrity
- Set cutover date

**Step 4**: Cleanup
- Archive old collection
- Update application to only use new schema
- Monitor Firestore console for errors

---

## Testing Checklist

- [ ] Create user profile successfully
- [ ] Add personal expense and verify not shared
- [ ] Create family group as admin
- [ ] Generate and share invite code
- [ ] Join group with different user account
- [ ] Add shared expense visible to all members
- [ ] Calculate bill splits correctly
- [ ] Verify settlements summary is accurate
- [ ] Edit/delete operations work properly
- [ ] Security rules prevent unauthorized access
- [ ] Firestore indexes exist and are being used
- [ ] Queries complete in < 1 second
- [ ] No data anomalies or inconsistencies
- [ ] Family members can only see appropriate expenses
- [ ] Admin-only operations blocked for non-admins

---

## Related Files

| File | Purpose |
|------|---------|
| [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md) | Complete schema specification |
| [src/firebase.js](./src/firebase.js) | Implementation with inline documentation |
| [src/App.js](./src/App.js) | App state management & routing |
| [src/components/FamilyDashboard.js](./src/components/FamilyDashboard.js) | Family group interface |
| [.env.example](./.env.example) | Firebase configuration template |

---

## Quick Start for Developers

### 1. Understanding the Schema
1. Start with this file (SCHEMA_DOCUMENTATION_INDEX.md)
2. Read the collections overview
3. Review example documents in FIRESTORE_SCHEMA.md

### 2. Implementing Database Operations
1. Open [src/firebase.js](./src/firebase.js)
2. Find relevant API (expensesAPI, familyGroupsAPI, incomeAPI)
3. Use method with documented parameters
4. Follow the pattern for error handling

### 3. Debugging Issues
1. Check Security Rulesnin [FIRESTORE_SCHEMA.md](./FIRESTORE_SCHEMA.md)
2. Verify data matches validation rules
3. Check that required indexes exist
4. Review query patterns for efficiency

### 4. Adding New Features
1. Update schema in FIRESTORE_SCHEMA.md
2. Add/modify fields in JSON examples
3. Update firebase.js API methods
4. Create composites indexes if needed
5. Test thoroughly before deploying

---

## Support & References

- **Firebase Documentation**: https://firebase.google.com/docs
- **Firestore Best Practices**: https://firebase.google.com/docs/firestore/best-practices
- **Security Rules Guide**: https://firebase.google.com/docs/rules
- **Pricing Calculator**: https://firebase.google.com/pricing/calculator
- **Status Page**: https://firebase.google.status.io/

---

*Last Updated: April 2026*  
*Schema Version: 1.0*  
*Application: Family Expense Tracker*

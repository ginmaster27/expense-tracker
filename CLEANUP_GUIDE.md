# Shared Expense Duplicate Cleanup Guide

## Overview

This guide explains how to identify and remove duplicated shared expenses from your Firestore database. In the old data model, shared expenses were duplicated across all family members' collections. The new model stores each shared expense only in the creator's collection with proper metadata (`type`, `createdBy`, `groupId`).

This cleanup utility normalizes your data to match the single-source model.

---

## Understanding the Problem

### Old Data Model (Duplicated)
```
/users/alice/expenses/exp123 → { amount: 500, category: "Food", type: "shared" }
/users/bob/expenses/exp123   → { amount: 500, category: "Food", type: "shared" }  [DUPLICATE]
/users/charlie/expenses/exp123 → { amount: 500, category: "Food", type: "shared" } [DUPLICATE]
```

Same expense appears in all family members' collections (3 copies of 1 expense).

### New Data Model (Single Source)
```
/users/alice/expenses/exp123 → { amount: 500, category: "Food", type: "shared", createdBy: "alice", groupId: "family123" }
/users/bob/expenses/ → [not stored here]
/users/charlie/expenses/ → [not stored here]
```

Same expense stored only once in creator's collection. Query fetches from creator's collection when needed.

---

## How Duplicates Occur

1. **Legacy Data**: Expenses created under the old model remain duplicated in all collections
2. **Data Migration**: If expenses were migrated without deduplication
3. **Sync Issues**: If synchronization happened before the model was updated

The cleanup utility safely identifies and removes these duplicates.

---

## Methods to Cleanup

### Method 1: Web UI (Recommended for most users)

**For Family Group Admins:**

1. Go to **Family Dashboard**
2. Look for **⚙️ Admin Tools** button (bottom-right corner)
3. Click to expand the admin panel
4. Click **🔍 Audit for Duplicates**
   - This scans your data and shows what duplicates exist
   - **No data is deleted during audit**
5. Review the duplicate details
6. If satisfied, click **🧹 Remove [N] Duplicates**
7. Confirm in the popup
8. Wait for cleanup to complete (progress shown in panel)

**Safety:**
- Audit first, always
- Review what will be deleted before confirming cleanup
- Completion report shows exactly what was removed

---

### Method 2: JavaScript Console (For Developers)

**Quick Audit (Read-Only):**

```javascript
import { auditDuplicates } from './cleanupDuplicates';

// Get your family members and groupId from your app state
const members = [
  { userId: 'user1', name: 'Alice' },
  { userId: 'user2', name: 'Bob' },
  { userId: 'user3', name: 'Charlie' }
];
const groupId = 'family123';

// Run audit
const report = await auditDuplicates(members, groupId);
console.log(report);
```

**Sample Output:**
```
✅ AUDIT REPORT
================
Duplicates Found: 3

📋 Duplicate Details:

  1. Food - ₹500 (2026-04-05)
     Expense ID: exp789
     Copies found in 2 users' collections:
       • Alice [MASTER]
       • Bob [DUPLICATE]

  2. Groceries - ₹1200 (2026-04-06)
     Expense ID: exp790
     Copies found in 3 users' collections:
       • Charlie [MASTER]
       • Alice [DUPLICATE]
       • Bob [DUPLICATE]

  3. Utilities - ₹2000 (2026-04-01)
     Expense ID: exp791
     Copies found in 2 users' collections:
       • Alice [MASTER]
       • Charlie [DUPLICATE]
```

**Run Cleanup:**

```javascript
import { cleanupDuplicates } from './cleanupDuplicates';

const members = [
  { userId: 'user1', name: 'Alice' },
  { userId: 'user2', name: 'Bob' },
  { userId: 'user3', name: 'Charlie' }
];
const groupId = 'family123';

// Run cleanup
const report = await cleanupDuplicates(members, groupId);
console.log(report);
```

**Sample Output:**
```
✅ CLEANUP REPORT
=================
Duplicates Found: 3
Duplicates Removed: 3

🗑️ Deleted Duplicates:

  1. Food - ₹500 (2026-04-05)
     Deleted from: Bob
     Kept in: Alice

  2. Groceries - ₹1200 (2026-04-06)
     Deleted from: Charlie, Alice
     Kept in: Charlie

  3. Utilities - ₹2000 (2026-04-01)
     Deleted from: Charlie
     Kept in: Alice

✨ Successfully removed 3 duplicate expense records
```

---

### Method 3: Interactive Cleanup (With Confirmation)

```javascript
import { interactiveCleanup } from './cleanupDuplicates';

const members = [
  { userId: 'user1', name: 'Alice' },
  { userId: 'user2', name: 'Bob' },
  { userId: 'user3', name: 'Charlie' }
];
const groupId = 'family123';

// Runs audit first, shows results, asks for confirmation, then cleans up
const report = await interactiveCleanup(members, groupId);
```

**Flow:**
1. Audits your data
2. Shows list of duplicates found
3. Displays warning message
4. Asks for browser confirmation popup
5. Only proceeds with cleanup if you confirm
6. Returns detailed report

---

## What Gets Deleted

The cleanup utility:

✅ **Deletes duplicate copies of:**
- Shared expenses stored in multiple users' collections
- Copies that are not in the creator's collection

✅ **Keeps:**
- The master copy (stored in creator's collection)
- All personal expenses (untouched)
- All income records (untouched)
- Proper metadata (createdBy, groupId, type)

❌ **Never deletes:**
- Personal expenses
- Income
- Recurring expense rules
- Any data with type='personal'

---

## The Cleanup Logic

For each shared expense found in multiple collections:

1. **Identify the master**: The copy where `createdBy === userId`
2. **Find duplicates**: All other copies of the same expense
3. **Delete duplicates**: Remove all non-master copies
4. **Keep master**: The one in the creator's collection stays

Example:
```
Expense: Food - ₹500 (createdBy: "alice", groupId: "family123")

Found in:
  /users/alice/expenses/exp123 ← Master (createdBy === alice)
  /users/bob/expenses/exp123 ← DELETE
  /users/charlie/expenses/exp123 ← DELETE

After cleanup:
  /users/alice/expenses/exp123 ← Remains
```

---

## Safety & Backup

**Before Running Cleanup:**

1. **Export your data** (recommended):
   - Go to Firebase Console
   - Firestore → Backup & Restore
   - Create a backup of your database

2. **Run audit first** (always):
   - Never run cleanup without reviewing audit results
   - Confirm the duplicates will be removed correctly

3. **Have admin access**:
   - Only group admins can run cleanup
   - Use a device where you're logged in as admin

**If Something Goes Wrong:**

- If you have a backup: Restore from backup in Firebase Console
- Reports show exactly what was deleted
- Contact support with the cleanup report

---

## Troubleshooting

### Issue: "No duplicates found"
**This is good!** It means your data is already clean and normalized.

### Issue: "Cleanup failed for user X"
This usually means:
- The user's collection couldn't be accessed
- Permission issues with Firestore Security Rules
- Network error during deletion

**Solution**: Try running cleanup again. If it persists, check Firestore logs.

### Issue: "createdBy field is missing"
Older expenses may not have the `createdBy` field. The cleanup utility:
- Uses the collection owner (user ID) as fallback
- Still correctly identifies and removes duplicates
- Adds `createdBy` if needed during cleanup

### Issue: Cleanup shows X duplicates removed, but data still looks fuzzy
The UI may be showing cached data. Try:
1. Refresh the browser
2. Clear browser cache
3. Force reload (Ctrl+Shift+R or Cmd+Shift+R)

---

## Technical Details

### Files Involved

- **`firebase.js`**: `dataCleanupAPI` with cleanup functions
- **`cleanupDuplicates.js`**: High-level utility functions with reporting
- **`AdminTools.js`**: React UI component for web-based cleanup
- **`AdminTools.css`**: Styling for admin tools panel

### API Functions

**`dataCleanupAPI.cleanupDuplicatedSharedExpenses(members, groupId)`**
- Scans all member collections
- Identifies duplicates using ID matching
- Determines master based on `createdBy` field
- Deletes non-master copies
- Returns detailed report

**`dataCleanupAPI.auditDuplicatedSharedExpenses(members, groupId)`**
- Same scan as cleanup but read-only
- No deletions occur
- Returns list of all duplicates found

---

## Performance Notes

- **Time**: Depends on number of expenses
  - 100 expenses: ~1-2 seconds
  - 1000 expenses: ~10-20 seconds
  - 10000 expenses: ~2-5 minutes

- **Storage savings**:
  - Removes duplicate Firestore document copies
  - Reduces storage by ~50% if all expenses were duplicated
  - Lowers read/write costs

---

## Best Practices

1. **Run audit regularly** - Monthly or quarterly health check
2. **Keep backups** - Before any cleanup operation
3. **Document results** - Save the cleanup report
4. **Notify members** - Let family members know you're running cleanup
5. **Run during low-activity time** - Reduces conflicts with active operations

---

## FAQ

**Q: Will cleanup affect my expense history?**
A: No. Cleanup removes duplicate records only. Your actual expense data stays the same.

**Q: Can I undo a cleanup?**
A: Not directly. This is why we recommend:
1. Running audit first
2. Creating a backup
3. Reviewing what will be deleted

**Q: Do I need to cleanup?**
A: If your data was created with the new code, probably not. Cleanup is mainly for data that existed under the old model.

**Q: Will other users be affected?**
A: No. Each user's expenses remain their own. Cleanup just removes duplicates across collections.

**Q: What if two users created the same expense?**
A: The one with the `createdBy` field matching the user's collection is kept. This is the master.

**Q: Can I cleanup only specific expenses?**
A: The current utility cleans all duplicated shared expenses for a group. Target cleanup for specific expenses isn't supported yet.

---

## Getting Help

If you encounter issues:

1. **Check the cleanup report** - It lists all errors encountered
2. **Run audit again** - To see current state after any issues
3. **Check Firestore logs** - Firebase Console → Firestore → Logs
4. **Review this guide** - Troubleshooting section above

---

## Summary

| Action | Speed | Deletions | When to Use |
|--------|-------|-----------|----------- |
| **Audit** | Fast | None | Always first - review results |
| **Cleanup** | Medium | Duplicates | After reviewing audit results |
| **Interactive Cleanup** | Medium | Duplicates | Best for manual control with confirmation |

**Recommended Flow:**
1. Run audit → Review results
2. Create backup → (Optional but recommended)
3. Run cleanup → Confirm operation
4. Check report → Verify results

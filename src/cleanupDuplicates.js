/**
 * Expense Duplicate Cleanup Utility
 * 
 * This script identifies and removes duplicate shared expenses from Firestore.
 * 
 * In the old data model, shared expenses were duplicated across all family members' collections.
 * In the new model, shared expenses should only exist in the creator's collection.
 * 
 * USAGE:
 * ------
 * 1. Audit only (no deletion):
 *    import { auditDuplicates } from './cleanupDuplicates';
 *    const report = await auditDuplicates(groupMembers, groupId);
 *    console.log(report);
 * 
 * 2. Run cleanup (with deletion):
 *    import { cleanupDuplicates } from './cleanupDuplicates';
 *    const report = await cleanupDuplicates(groupMembers, groupId);
 *    console.log(report);
 * 
 * SAFETY:
 * -------
 * - Always run audit first to see what will be deleted
 * - Backup your Firestore data before running cleanup
 * - Only admins should run this cleanup
 * - Review the audit report before confirming cleanup
 */

import { dataCleanupAPI } from './firebase';

/**
 * Audit duplicated shared expenses without deleting
 * @param {Array} groupMembers - Array of {userId, name} objects from family group
 * @param {String} groupId - The family group ID
 * @returns {Promise<Object>} Audit report with duplicates found
 */
export const auditDuplicates = async (groupMembers, groupId) => {
  console.log('🔍 Auditing duplicated shared expenses...');
  console.log(`   Group ID: ${groupId}`);
  console.log(`   Members: ${groupMembers.map(m => m.name).join(', ')}`);

  const report = await dataCleanupAPI.auditDuplicatedSharedExpenses(groupMembers, groupId);

  console.log('\n📊 AUDIT REPORT');
  console.log('================');
  console.log(`Duplicates Found: ${report.duplicatesFound}`);

  if (report.duplicates.length > 0) {
    console.log('\n📋 Duplicate Details:');
    report.duplicates.forEach((dup, idx) => {
      console.log(`\n  ${idx + 1}. ${dup.category} - ₹${dup.amount} (${dup.date})`);
      console.log(`     Expense ID: ${dup.expenseId}`);
      console.log(`     Copies found in ${dup.copiesFound} users' collections:`);
      dup.usersWithCopy.forEach(user => {
        const badge = user.isCreator ? ' [MASTER]' : ' [DUPLICATE]';
        console.log(`       • ${user.userName}${badge}`);
      });
    });
  }

  if (report.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    report.errors.forEach(err => console.log(`   - ${err}`));
  }

  return report;
};

/**
 * Cleanup duplicated shared expenses (removes duplicates, keeps master)
 * WARNING: This deletes documents from Firestore!
 * 
 * @param {Array} groupMembers - Array of {userId, name} objects from family group
 * @param {String} groupId - The family group ID
 * @returns {Promise<Object>} Cleanup report with results
 */
export const cleanupDuplicates = async (groupMembers, groupId) => {
  console.log('\n🧹 Starting cleanup of duplicated shared expenses...');
  console.log(`   Group ID: ${groupId}`);
  console.log(`   Members: ${groupMembers.map(m => m.name).join(', ')}`);

  const report = await dataCleanupAPI.cleanupDuplicatedSharedExpenses(groupMembers, groupId);

  console.log('\n✅ CLEANUP REPORT');
  console.log('=================');
  console.log(`Duplicates Found: ${report.duplicatesFound}`);
  console.log(`Duplicates Removed: ${report.duplicatesRemoved}`);

  if (report.details.length > 0) {
    console.log('\n🗑️  Deleted Duplicates:');
    report.details.forEach((detail, idx) => {
      console.log(`\n  ${idx + 1}. ${detail.expenseName} (${detail.date})`);
      console.log(`     Deleted from: ${detail.deletedFromUser}`);
      console.log(`     Kept in: ${detail.keptInUser}`);
    });
  }

  if (report.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    report.errors.forEach(err => console.log(`   - ${err}`));
  }

  if (report.duplicatesRemoved > 0) {
    console.log(`\n✨ Successfully removed ${report.duplicatesRemoved} duplicate expense records`);
  } else {
    console.log('\n✨ No duplicates to remove - data is clean!');
  }

  return report;
};

/**
 * Interactive cleanup with confirmation
 * Runs audit first, shows results, asks for confirmation before cleanup
 * 
 * @param {Array} groupMembers - Array of {userId, name} objects
 * @param {String} groupId - The family group ID
 * @returns {Promise<Object>} Cleanup report
 */
export const interactiveCleanup = async (groupMembers, groupId) => {
  // Run audit first
  const auditReport = await auditDuplicates(groupMembers, groupId);

  if (auditReport.duplicatesFound === 0) {
    console.log('\n✅ No duplicates found! Your data is clean.');
    return auditReport;
  }

  // Show what will be deleted
  console.log('\n⚠️  WARNING: The following duplicates will be deleted:');
  auditReport.duplicates.forEach(dup => {
    console.log(`   - ${dup.category} (${dup.copiesFound} copies, keeping 1)`);
  });

  // In browser environment, ask for confirmation
  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(
      `Remove ${auditReport.duplicatesFound} duplicate ${auditReport.duplicatesFound === 1 ? 'expense' : 'expenses'}? This cannot be undone!`
    );

    if (!confirmed) {
      console.log('❌ Cleanup cancelled by user');
      return { cancelled: true };
    }
  }

  // Run cleanup
  return await cleanupDuplicates(groupMembers, groupId);
};

const cleanupDuplicatesUtils = {
  auditDuplicates,
  cleanupDuplicates,
  interactiveCleanup
};

export default cleanupDuplicatesUtils;

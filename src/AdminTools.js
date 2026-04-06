/**
 * Admin Tools Component
 * 
 * Provides tools for family group admins to manage and cleanup data
 * Only visible to administrators
 */

import React, { useState } from 'react';
import { cleanupDuplicates, auditDuplicates } from './cleanupDuplicates';
import './AdminTools.css';

function AdminTools({ currentUser, members, groupId, isAdmin, onCleanupComplete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [showAuditDetail, setShowAuditDetail] = useState(false);

  if (!isAdmin) {
    return null; // Only show to admins
  }

  const handleAuditDuplicates = async () => {
    setAuditLoading(true);
    try {
      const report = await auditDuplicates(
        members.map(m => ({ userId: m.userId, name: m.name })),
        groupId
      );
      setAuditResult(report);
      setShowAuditDetail(true);
    } catch (error) {
      console.error('Audit failed:', error);
      setAuditResult({ error: error.message });
    } finally {
      setAuditLoading(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!window.confirm(
      `This will remove ${auditResult?.duplicatesFound || 0} duplicate expense records. This cannot be undone! Are you sure?`
    )) {
      return;
    }

    setCleanupLoading(true);
    try {
      const report = await cleanupDuplicates(
        members.map(m => ({ userId: m.userId, name: m.name })),
        groupId
      );
      setCleanupResult(report);

      // Notify parent component of cleanup completion
      if (onCleanupComplete) {
        onCleanupComplete(report);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      setCleanupResult({ error: error.message });
    } finally {
      setCleanupLoading(false);
    }
  };

  return (
    <div className="admin-tools-container">
      {/* Toggle Button */}
      <button
        className="admin-tools-toggle"
        onClick={() => {
          setIsExpanded(!isExpanded);
          setShowAuditDetail(false);
        }}
        title="Admin utilities for data management"
      >
        ⚙️ Admin Tools
      </button>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="admin-tools-panel">
          <h3>🛠️ Admin Utilities</h3>

          <div className="admin-section">
            <h4>Data Cleanup</h4>
            <p className="section-description">
              Identify and remove duplicate shared expenses from the database
            </p>

            {/* Audit Section */}
            <div className="cleanup-action">
              <button
                className="audit-btn"
                onClick={handleAuditDuplicates}
                disabled={auditLoading || cleanupLoading}
              >
                {auditLoading ? '🔍 Scanning...' : '🔍 Audit for Duplicates'}
              </button>
              <p className="action-help">
                Review what duplicates exist before running cleanup
              </p>
            </div>

            {/* Audit Results */}
            {auditResult && (
              <div className={`audit-result ${auditResult.error ? 'error' : 'success'}`}>
                {auditResult.error ? (
                  <div>
                    <p className="error-message">❌ {auditResult.error}</p>
                  </div>
                ) : (
                  <div>
                    <p className="result-summary">
                      Found <strong>{auditResult.duplicatesFound}</strong> duplicate{auditResult.duplicatesFound !== 1 ? 's' : ''}
                    </p>

                    {auditResult.duplicatesFound > 0 && (
                      <>
                        <button
                          className="details-toggle"
                          onClick={() => setShowAuditDetail(!showAuditDetail)}
                        >
                          {showAuditDetail ? '▼ Hide Details' : '▶ Show Details'}
                        </button>

                        {showAuditDetail && auditResult.duplicates && (
                          <div className="duplicate-list">
                            {auditResult.duplicates.map((dup, idx) => (
                              <div key={idx} className="duplicate-item">
                                <div className="dup-header">
                                  <strong>{dup.category}</strong> - ₹{dup.amount}
                                </div>
                                <div className="dup-meta">Date: {dup.date}</div>
                                <div className="dup-users">
                                  <span className="copy-count">{dup.copiesFound} copies in:</span>
                                  <ul>
                                    {dup.usersWithCopy.map((user, idx) => (
                                      <li key={idx}>
                                        {user.userName}
                                        {user.isCreator && ' [Master]'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Cleanup Button */}
                        {auditResult.duplicatesFound > 0 && !cleanupResult && (
                          <div className="cleanup-action">
                            <button
                              className="cleanup-btn"
                              onClick={handleCleanupDuplicates}
                              disabled={cleanupLoading}
                            >
                              {cleanupLoading ? '🧹 Cleaning...' : `🧹 Remove ${auditResult.duplicatesFound} Duplicate${auditResult.duplicatesFound !== 1 ? 's' : ''}`}
                            </button>
                            <p className="action-warning">
                              ⚠️ This will permanently delete duplicate records
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Cleanup Results */}
            {cleanupResult && (
              <div className={`cleanup-result ${cleanupResult.error ? 'error' : 'success'}`}>
                {cleanupResult.error ? (
                  <p className="error-message">❌ {cleanupResult.error}</p>
                ) : (
                  <div>
                    <p className="result-summary">
                      ✅ Successfully removed <strong>{cleanupResult.duplicatesRemoved}</strong> duplicate{cleanupResult.duplicatesRemoved !== 1 ? 's' : ''}
                    </p>
                    {cleanupResult.duplicatesRemoved > 0 && (
                      <p className="result-detail">
                        Your expense data is now normalized to the single-storage model
                      </p>
                    )}
                    {cleanupResult.errors && cleanupResult.errors.length > 0 && (
                      <div className="errors">
                        <p className="error-count">⚠️  {cleanupResult.errors.length} error(s):</p>
                        <ul>
                          {cleanupResult.errors.map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            className="close-btn"
            onClick={() => {
              setIsExpanded(false);
              setShowAuditDetail(false);
            }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminTools;

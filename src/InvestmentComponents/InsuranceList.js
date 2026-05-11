import { useState } from 'react';

function InsuranceList({ policies, onEdit, onDelete, loading, darkMode }) {
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const isExpired = (renewalDate, maturityDate) => {
    const today = new Date();
    const checkDate = renewalDate || maturityDate;
    if (!checkDate) return false;
    return new Date(checkDate) < today;
  };

  const isUpcomingRenewal = (renewalDate) => {
    if (!renewalDate) return false;
    const today = new Date();
    const renewal = new Date(renewalDate);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return renewal <= thirtyDaysFromNow && renewal >= today;
  };

  const activePolicies = policies.filter((p) => !isExpired(p.renewalDate, p.maturityDate));
  const expiredPolicies = policies.filter((p) => isExpired(p.renewalDate, p.maturityDate));
  const orderedPolicies = [...activePolicies, ...expiredPolicies];
  const formatAmount = (amount) => `₹${(parseFloat(amount) || 0).toFixed(2)}`;
  const getRenewalDate = (policy) => policy.renewalDate || policy.maturityDate || '-';
  const getPolicyStatus = (policy) => {
    if (isExpired(policy.renewalDate, policy.maturityDate)) {
      return { label: 'Expired', className: 'expired-status' };
    }
    if (isUpcomingRenewal(policy.renewalDate)) {
      return { label: 'Renewing', className: 'renewal-soon' };
    }
    return { label: 'Active', className: 'active' };
  };

  if (loading) {
    return <div className="loading-state">Loading insurance policies...</div>;
  }

  return (
    <div className="sip-list-container insurance-list">
      {orderedPolicies.length > 0 && (
        <div className="sip-cards-list">
          {orderedPolicies.map((policy) => {
            const expired = isExpired(policy.renewalDate, policy.maturityDate);
            const isSelected = selectedPolicy && selectedPolicy.id === policy.id;
            const status = getPolicyStatus(policy);

            return (
              <div
                key={policy.id}
                className={`sip-card insurance-card ${expired ? 'expired' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPolicy(policy)}
              >
                <div className="sip-card-content">
                  <div className="sip-card-details">
                    <h3 className="sip-card-name">{policy.policyName}</h3>
                    <div className="sip-card-amount-frequency">
                      {formatAmount(policy.amount)} • {policy.frequency || '-'}
                    </div>
                    <div className="sip-card-start-date">
                      Renewal: {getRenewalDate(policy)}
                      <span className={`status-badge ${status.className}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="sip-card-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(policy);
                    }}
                    title="Edit policy"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(policy.id);
                    }}
                    title="Delete policy"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {orderedPolicies.length === 0 && (
        <div className="empty-state">
          <p>🛡️ No insurance policies yet. Add your first policy to get started!</p>
        </div>
      )}

      {/* Side Panel */}
      {selectedPolicy && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setSelectedPolicy(null)}
          />
          <div className="insurance-details-panel">
            <div className="panel-header">
              <h2>{selectedPolicy.policyName}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedPolicy(null)}
              >
                ✕
              </button>
            </div>

            <div className="panel-content">
              <div className="detail-row">
                <span className="detail-label">Vendor:</span>
                <span className="detail-value">{selectedPolicy.vendor}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  ₹{selectedPolicy.amount.toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedPolicy.policyType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Policy Number:</span>
                <span className="detail-value">
                  {selectedPolicy.policyNumber || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-badge ${getPolicyStatus(selectedPolicy).className}`}>
                    {getPolicyStatus(selectedPolicy).label}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">
                  {selectedPolicy.startDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Renewal Date:</span>
                <span className="detail-value">
                  {selectedPolicy.renewalDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Maturity Date:</span>
                <span className="detail-value">
                  {selectedPolicy.maturityDate || '-'}
                </span>
              </div>
              {selectedPolicy.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{selectedPolicy.notes}</span>
                </div>
              )}
            </div>

            <div className="panel-actions">
              <button
                className="action-btn edit-btn"
                onClick={() => {
                  onEdit(selectedPolicy);
                  setSelectedPolicy(null);
                }}
              >
                Edit Policy
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => {
                  onDelete(selectedPolicy.id);
                  setSelectedPolicy(null);
                }}
              >
                Delete Policy
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default InsuranceList;

function InsuranceList({ policies, onEdit, onDelete, loading, darkMode }) {
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

  if (loading) {
    return <div className="loading-state">Loading insurance policies...</div>;
  }

  return (
    <div className="insurance-list">
      {/* Table Header */}
      <div className="insurance-list-header">
        <div className="header-col policy-name">Policy Name</div>
        <div className="header-col policy-vendor">Vendor</div>
        <div className="header-col policy-amount">Amount</div>
        <div className="header-col policy-type">Type</div>
        <div className="header-col policy-status">Status</div>
        <div className="header-col policy-date">Renewal Date</div>
        <div className="header-col policy-actions">Actions</div>
      </div>

      {/* Active Policies */}
      {activePolicies.length > 0 && (
        <>
          {activePolicies.map((policy) => (
            <div key={policy.id} className="insurance-list-row">
              <div className="row-main">
                <div className="row-col policy-name">
                  <strong>{policy.policyName}</strong>
                </div>
                <div className="row-col policy-vendor">
                  {policy.vendor}
                </div>
                <div className="row-col policy-amount highlight">
                  <strong>₹{policy.amount.toFixed(2)}</strong>
                </div>
                <div className="row-col policy-type">
                  <span className="badge">{policy.policyType}</span>
                </div>
                <div className="row-col policy-status">
                  {isUpcomingRenewal(policy.renewalDate) ? (
                    <span className="status-badge renewal-soon">⚠️ Renewing</span>
                  ) : (
                    <span className="status-badge active">✅ Active</span>
                  )}
                </div>
                <div className="row-col policy-date">
                  {policy.renewalDate || policy.maturityDate || '-'}
                </div>
                <div className="row-col policy-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(policy)}
                    title="Edit policy"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(policy.id)}
                    title="Delete policy"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {policy.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {policy.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Expired Policies */}
      {expiredPolicies.length > 0 && (
        <>
          {expiredPolicies.map((policy) => (
            <div key={policy.id} className="insurance-list-row expired">
              <div className="row-main">
                <div className="row-col policy-name">
                  <strong>{policy.policyName}</strong>
                </div>
                <div className="row-col policy-vendor">
                  {policy.vendor}
                </div>
                <div className="row-col policy-amount">
                  ₹{policy.amount.toFixed(2)}
                </div>
                <div className="row-col policy-type">
                  <span className="badge">{policy.policyType}</span>
                </div>
                <div className="row-col policy-status">
                  <span className="status-badge expired-status">❌ Expired</span>
                </div>
                <div className="row-col policy-date">
                  {policy.renewalDate || policy.maturityDate || '-'}
                </div>
                <div className="row-col policy-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(policy)}
                    title="Edit policy"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(policy.id)}
                    title="Delete policy"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {policy.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {policy.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {activePolicies.length === 0 && expiredPolicies.length === 0 && (
        <div className="empty-state">
          <p>🛡️ No insurance policies yet. Add your first policy to get started!</p>
        </div>
      )}
    </div>
  );
}

export default InsuranceList;

function PollutionList({ records, onEdit, onDelete, loading, darkMode }) {
  const isExpired = (expiryDate) => {
    const today = new Date();
    return new Date(expiryDate) < today;
  };

  const isUpcomingExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= today;
  };

  const activeRecords = records.filter((r) => !isExpired(r.expiryDate));
  const expiredRecords = records.filter((r) => isExpired(r.expiryDate));

  if (loading) {
    return <div className="loading-state">Loading pollution certificates...</div>;
  }

  return (
    <div className="pollution-list">
      {/* Table Header */}
      <div className="pollution-list-header">
        <div className="header-col pollution-vehicle">Vehicle #</div>
        <div className="header-col pollution-amount">Amount</div>
        <div className="header-col pollution-start">Start Date</div>
        <div className="header-col pollution-expiry">Expiry Date</div>
        <div className="header-col pollution-status">Status</div>
        <div className="header-col pollution-paid">Who Paid</div>
        <div className="header-col pollution-actions">Actions</div>
      </div>

      {/* Active Certificates */}
      {activeRecords.length > 0 && (
        <>
          {activeRecords.map((record) => (
            <div key={record.id} className="pollution-list-row">
              <div className="row-main">
                <div className="row-col pollution-vehicle">
                  <strong>{record.vehicleNumber}</strong>
                </div>
                <div className="row-col pollution-amount highlight">
                  <strong>₹{record.amount.toFixed(2)}</strong>
                </div>
                <div className="row-col pollution-start">
                  {record.startDate}
                </div>
                <div className="row-col pollution-expiry">
                  {record.expiryDate}
                </div>
                <div className="row-col pollution-status">
                  {isUpcomingExpiry(record.expiryDate) ? (
                    <span className="status-badge renewal-soon">⚠️ Expiring</span>
                  ) : (
                    <span className="status-badge active">✅ Active</span>
                  )}
                </div>
                <div className="row-col pollution-paid">
                  {record.whoPaid}
                </div>
                <div className="row-col pollution-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(record)}
                    title="Edit pollution certificate"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(record.id)}
                    title="Delete pollution certificate"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {record.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {record.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Expired Certificates */}
      {expiredRecords.length > 0 && (
        <>
          {expiredRecords.map((record) => (
            <div key={record.id} className="pollution-list-row expired">
              <div className="row-main">
                <div className="row-col pollution-vehicle">
                  <strong>{record.vehicleNumber}</strong>
                </div>
                <div className="row-col pollution-amount">
                  ₹{record.amount.toFixed(2)}
                </div>
                <div className="row-col pollution-start">
                  {record.startDate}
                </div>
                <div className="row-col pollution-expiry">
                  {record.expiryDate}
                </div>
                <div className="row-col pollution-status">
                  <span className="status-badge expired-status">❌ Expired</span>
                </div>
                <div className="row-col pollution-paid">
                  {record.whoPaid}
                </div>
                <div className="row-col pollution-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(record)}
                    title="Edit pollution certificate"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(record.id)}
                    title="Delete pollution certificate"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {record.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {record.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {activeRecords.length === 0 && expiredRecords.length === 0 && (
        <div className="empty-state">
          <p>🌱 No pollution certificates yet. Add your first certificate to get started!</p>
        </div>
      )}
    </div>
  );
}

export default PollutionList;

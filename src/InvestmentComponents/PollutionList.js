import { useState } from 'react';

function PollutionList({ records, onEdit, onDelete, loading, darkMode }) {
  const [selectedRecord, setSelectedRecord] = useState(null);

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
            <div
              key={record.id}
              className="pollution-list-row"
              onClick={() => setSelectedRecord(record)}
            >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                    title="Edit pollution certificate"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.id);
                    }}
                    title="Delete pollution certificate"
                  >
                    Delete
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
            <div
              key={record.id}
              className="pollution-list-row expired"
              onClick={() => setSelectedRecord(record)}
            >
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
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(record);
                    }}
                    title="Edit pollution certificate"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(record.id);
                    }}
                    title="Delete pollution certificate"
                  >
                    Delete
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

      {/* Side Panel */}
      {selectedRecord && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setSelectedRecord(null)}
          />
          <div className="pollution-details-panel">
            <div className="panel-header">
              <h2>{selectedRecord.vehicleNumber}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedRecord(null)}
              >
                ✕
              </button>
            </div>

            <div className="panel-content">
              <div className="detail-row">
                <span className="detail-label">Vehicle Number:</span>
                <span className="detail-value">{selectedRecord.vehicleNumber}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  ₹{selectedRecord.amount.toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">
                  {selectedRecord.startDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry Date:</span>
                <span className="detail-value">
                  {selectedRecord.expiryDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Who Paid:</span>
                <span className="detail-value">
                  {selectedRecord.whoPaid || '-'}
                </span>
              </div>
              {selectedRecord.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{selectedRecord.notes}</span>
                </div>
              )}
            </div>

            <div className="panel-actions">
              <button
                className="action-btn edit-btn"
                onClick={() => {
                  onEdit(selectedRecord);
                  setSelectedRecord(null);
                }}
              >
                Edit Certificate
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => {
                  onDelete(selectedRecord.id);
                  setSelectedRecord(null);
                }}
              >
                Delete Certificate
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PollutionList;

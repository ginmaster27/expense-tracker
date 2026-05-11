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
  const orderedRecords = [...activeRecords, ...expiredRecords];
  const formatAmount = (amount) => `₹${(parseFloat(amount) || 0).toFixed(2)}`;
  const getPollutionStatus = (record) => {
    if (isExpired(record.expiryDate)) {
      return { label: 'Expired', className: 'expired-status' };
    }
    if (isUpcomingExpiry(record.expiryDate)) {
      return { label: 'Expiring', className: 'renewal-soon' };
    }
    return { label: 'Active', className: 'active' };
  };

  if (loading) {
    return <div className="loading-state">Loading pollution certificates...</div>;
  }

  return (
    <div className="sip-list-container pollution-list">
      {orderedRecords.length > 0 && (
        <div className="sip-cards-list">
          {orderedRecords.map((record) => {
            const expired = isExpired(record.expiryDate);
            const isSelected = selectedRecord && selectedRecord.id === record.id;
            const status = getPollutionStatus(record);

            return (
              <div
                key={record.id}
                className={`sip-card pollution-card ${expired ? 'expired' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedRecord(record)}
              >
                <div className="sip-card-content">
                  <div className="sip-card-details">
                    <h3 className="sip-card-name">{record.vehicleNumber}</h3>
                    <div className="sip-card-amount-frequency">
                      {formatAmount(record.amount)} • {record.whoPaid || '-'}
                    </div>
                    <div className="sip-card-start-date">
                      Expiry: {record.expiryDate || '-'}
                      <span className={`status-badge ${status.className}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="sip-card-actions">
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
            </div>
            );
          })}
        </div>
      )}

      {orderedRecords.length === 0 && (
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
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-badge ${getPollutionStatus(selectedRecord).className}`}>
                    {getPollutionStatus(selectedRecord).label}
                  </span>
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

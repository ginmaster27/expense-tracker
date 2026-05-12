import { useState } from 'react';

function SIPList({ sips, topUps, onEdit, onDelete, onAddTopUp, onDeleteTopUp, loading, darkMode }) {
  const [selectedSIP, setSelectedSIP] = useState(null);

  const getUpcomingMonthSameDate = (dateString) => {
    if (!dateString) return '';

    const [, , day] = dateString.split('-').map(Number);
    if (!day) return '';

    const today = new Date();
    const nextMonth = today.getMonth() + 1;
    const nextYear = today.getFullYear() + Math.floor(nextMonth / 12);
    const normalizedNextMonth = nextMonth % 12;
    const lastDayOfUpcomingMonth = new Date(nextYear, normalizedNextMonth + 1, 0).getDate();
    const nextDate = new Date(nextYear, normalizedNextMonth, Math.min(day, lastDayOfUpcomingMonth));

    return [
      nextDate.getFullYear(),
      String(nextDate.getMonth() + 1).padStart(2, '0'),
      String(nextDate.getDate()).padStart(2, '0')
    ].join('-');
  };

  const getDisplayRenewalDate = (sip) => {
    if (sip.renewalDate) return sip.renewalDate;
    if ((sip.frequency || 'Monthly') === 'Monthly') return getUpcomingMonthSameDate(sip.startDate);
    return sip.startDate || '-';
  };

  const sortedSIPs = [...sips].sort((a, b) => {
    const dateA = new Date(getDisplayRenewalDate(a));
    const dateB = new Date(getDisplayRenewalDate(b));
    return dateA - dateB;
  });

  const calculateTotalInvested = (sip) => {
    // Parse dates - handle both string (YYYY-MM-DD) and Date objects
    const parseDate = (dateInput) => {
      if (typeof dateInput === 'string') {
        // If it's YYYY-MM-DD format, parse it as UTC to avoid timezone issues
        const [year, month, day] = dateInput.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      return new Date(dateInput);
    };

    const startDate = parseDate(sip.startDate);
    const endDate = sip.endDate ? parseDate(sip.endDate) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const actualEndDate = endDate < today ? endDate : today;

    let contributionCount = 0;
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day

    // Count contributions from startDate to actualEndDate (inclusive)
    while (currentDate <= actualEndDate) {
      contributionCount++;
      if (sip.frequency === 'Monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (sip.frequency === 'Yearly') {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
      } else {
        break; // Unknown frequency, stop counting
      }
    }

    const regularContribution = sip.amount * contributionCount;

    const sipTopUpsAmount = topUps
      .filter((tu) => tu.sipReference === sip.id)
      .reduce((sum, tu) => sum + (tu.topUpAmount || 0), 0);

    return regularContribution + sipTopUpsAmount;
  };

  const getTopUpsForSIP = (sipId) => {
    return topUps.filter((tu) => tu.sipReference === sipId);
  };

  const getStatusClass = (status) => {
    const normalizedStatus = status || 'Active';
    if (normalizedStatus === 'Paused') return 'renewal-soon';
    if (normalizedStatus === 'Stopped') return 'expired-status';
    return 'active';
  };

  if (loading) {
    return <div className="loading-state">Loading SIPs...</div>;
  }

  if (!sips || sips.length === 0) {
    return (
      <div className="empty-state">
        <p>📈 No SIPs yet. Create your first SIP to get started!</p>
      </div>
    );
  }

  return (
    <div className="sip-list-container">
      {/* SIP Cards List */}
      <div className="sip-cards-list">
        {sortedSIPs.map((sip) => {
          const isSelected = selectedSIP && selectedSIP.id === sip.id;

          return (
            <div
              key={sip.id}
              className={`sip-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedSIP(sip)}
            >
              <div className="sip-card-content">
                {/* SIP Details Section */}
                <div className="sip-card-details">
                  <div className="sip-card-title-row">
                    <h3 className="sip-card-name">{sip.sipName}</h3>
                    <span className="sip-type-badge">{sip.sipType || 'Stock'}</span>
                  </div>
                  <div className="sip-card-amount-frequency">
                    ₹{sip.amount.toFixed(2)} • {sip.frequency}
                  </div>
                  <div className="sip-card-start-date">
                    📅 {getDisplayRenewalDate(sip)}
                    <span className={`status-badge ${getStatusClass(sip.status)}`}>
                      {sip.status || 'Active'}
                    </span>
                  </div>
                </div>

                {/* Edit and Delete Buttons */}
                <div className="sip-card-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(sip);
                    }}
                    title="Edit SIP"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(sip.id);
                    }}
                    title="Delete SIP"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side Panel with Details */}
      {selectedSIP && (
        <>
          {/* Overlay */}
          <div 
            className="sip-panel-overlay"
            onClick={() => setSelectedSIP(null)}
          ></div>

          {/* Side Panel */}
          <div className="sip-details-panel">
            <div className="panel-header">
              <h2>{selectedSIP.sipName}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedSIP(null)}
                title="Close panel"
              >
                ✕
              </button>
            </div>

            <div className="panel-content">
              {/* SIP Type */}
              <div className="detail-row">
                <label>Type:</label>
                <span className="detail-badge">{selectedSIP.sipType}</span>
              </div>

              {/* Amount */}
              <div className="detail-row">
                <label>Amount:</label>
                <strong className="detail-value">₹{selectedSIP.amount.toFixed(2)}</strong>
              </div>

              {/* Frequency */}
              <div className="detail-row">
                <label>Frequency:</label>
                <span className="detail-value">{selectedSIP.frequency}</span>
              </div>

              {/* Start Date */}
              <div className="detail-row">
                <label>Start Date:</label>
                <span className="detail-value">{selectedSIP.startDate}</span>
              </div>

              <div className="detail-row">
                <label>Renewal Date:</label>
                <span className="detail-value">{getDisplayRenewalDate(selectedSIP)}</span>
              </div>

              <div className="detail-row">
                <label>Status:</label>
                <span className="detail-value">
                  <span className={`status-badge ${getStatusClass(selectedSIP.status)}`}>
                    {selectedSIP.status || 'Active'}
                  </span>
                </span>
              </div>

              {/* End Date */}
              {selectedSIP.endDate && (
                <div className="detail-row">
                  <label>End Date:</label>
                  <span className="detail-value">{selectedSIP.endDate}</span>
                </div>
              )}

              {/* Total Invested */}
              <div className="detail-row highlight">
                <label>Total Invested:</label>
                <strong className="detail-value">₹{calculateTotalInvested(selectedSIP).toFixed(2)}</strong>
              </div>

              {/* Notes */}
              {selectedSIP.notes && (
                <div className="detail-row">
                  <label>Notes:</label>
                  <span className="detail-value">{selectedSIP.notes}</span>
                </div>
              )}

              {/* Top-ups Section */}
              {getTopUpsForSIP(selectedSIP.id).length > 0 && (
                <div className="topups-section">
                  <h3 className="section-title">Top-ups</h3>
                  <div className="topups-list">
                    {getTopUpsForSIP(selectedSIP.id).map((topUp) => (
                      <div key={topUp.id} className="topup-item">
                        <div className="topup-info">
                          <span className="topup-amount">₹{topUp.topUpAmount.toFixed(2)}</span>
                          <span className="topup-date">{topUp.date}</span>
                        </div>
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => {
                            onDeleteTopUp(topUp.id);
                            setSelectedSIP(null);
                          }}
                          title="Delete top-up"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel Actions */}
              <div className="panel-actions">
                <button
                  className="action-btn edit-btn"
                  onClick={() => {
                    onEdit(selectedSIP);
                    setSelectedSIP(null);
                  }}
                >
                  Edit SIP
                </button>
                <button
                  className="action-btn topup-btn"
                  onClick={() => {
                    onAddTopUp(selectedSIP.id);
                    setSelectedSIP(null);
                  }}
                >
                  Add Top-up
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={() => {
                    // eslint-disable-next-line no-restricted-globals
                    if (confirm('Are you sure you want to delete this SIP?')) {
                      onDelete(selectedSIP.id);
                      setSelectedSIP(null);
                    }
                  }}
                >
                  Delete SIP
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SIPList;

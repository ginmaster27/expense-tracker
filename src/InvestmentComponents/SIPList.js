function SIPList({ sips, topUps, onEdit, onDelete, onAddTopUp, onDeleteTopUp, loading, darkMode }) {
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
    <div className="sip-list">
      {/* Table Header */}
      <div className="sip-list-header">
        <div className="header-col sip-name">Name</div>
        <div className="header-col sip-type">Type</div>
        <div className="header-col sip-amount">Amount</div>
        <div className="header-col sip-frequency">Frequency</div>
        <div className="header-col sip-start">Start Date</div>
        <div className="header-col sip-total">Total Invested</div>
        <div className="header-col sip-actions">Actions</div>
      </div>

      {/* Table Rows */}
      {sips.map((sip) => {
        const sipTopUpsForThisSIP = getTopUpsForSIP(sip.id);
        const totalInvested = calculateTotalInvested(sip);

        return (
          <div key={sip.id} className="sip-list-row">
            <div className="row-main">
              <div className="row-col sip-name">
                <strong>{sip.sipName}</strong>
              </div>
              <div className="row-col sip-type">
                <span className="badge">{sip.sipType}</span>
              </div>
              <div className="row-col sip-amount">
                ₹{sip.amount.toFixed(2)}
              </div>
              <div className="row-col sip-frequency">
                {sip.frequency}
              </div>
              <div className="row-col sip-start">
                {sip.startDate}
              </div>
              <div className="row-col sip-total highlight">
                <strong>₹{totalInvested.toFixed(2)}</strong>
              </div>
              <div className="row-col sip-actions">
                <button
                  className="icon-btn edit-btn"
                  onClick={() => onEdit(sip)}
                  title="Edit SIP"
                >
                  ✏️
                </button>
                <button
                  className="icon-btn delete-btn"
                  onClick={() => onDelete(sip.id)}
                  title="Delete SIP"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Notes row (if exists) */}
            {sip.notes && (
              <div className="row-details">
                <span className="detail-label">Notes:</span> {sip.notes}
              </div>
            )}

            {/* Top-ups row (if exists) */}
            {sipTopUpsForThisSIP.length > 0 && (
              <div className="row-details">
                <span className="detail-label">Top-ups:</span>
                <div className="topups-inline">
                  {sipTopUpsForThisSIP.map((topUp) => (
                    <div key={topUp.id} className="topup-inline-item">
                      <span className="topup-amount">₹{topUp.topUpAmount.toFixed(2)}</span>
                      <span className="topup-date">({topUp.date})</span>
                      <button
                        className="icon-btn delete-btn"
                        onClick={() => onDeleteTopUp(topUp.id)}
                        title="Delete top-up"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add top-up button */}
            <div className="row-actions">
              <button
                className="add-topup-btn"
                onClick={() => onAddTopUp(sip.id)}
                title="Add top-up or lumpsum"
              >
                + Top-up
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SIPList;

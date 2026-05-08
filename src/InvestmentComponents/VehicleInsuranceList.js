function VehicleInsuranceList({ vehicleInsurances, onEdit, onDelete, loading, darkMode }) {
  const isExpired = (expiryDate) => {
    const today = new Date();
    return new Date(expiryDate) < today;
  };

  const isUpcomingRenewal = (renewalDate) => {
    if (!renewalDate) return false;
    const today = new Date();
    const renewal = new Date(renewalDate);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return renewal <= thirtyDaysFromNow && renewal >= today;
  };

  const activeInsurances = vehicleInsurances.filter((v) => !isExpired(v.expiryDate));
  const expiredInsurances = vehicleInsurances.filter((v) => isExpired(v.expiryDate));

  if (loading) {
    return <div className="loading-state">Loading vehicle insurance policies...</div>;
  }

  return (
    <div className="vehicle-insurance-list">
      {/* Table Header */}
      <div className="vehicle-list-header">
        <div className="header-col vehicle-number">Vehicle #</div>
        <div className="header-col vehicle-vendor">Vendor</div>
        <div className="header-col vehicle-amount">Amount</div>
        <div className="header-col vehicle-type">Type</div>
        <div className="header-col vehicle-status">Status</div>
        <div className="header-col vehicle-expiry">Expiry Date</div>
        <div className="header-col vehicle-actions">Actions</div>
      </div>

      {/* Active Insurance */}
      {activeInsurances.length > 0 && (
        <>
          {activeInsurances.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-list-row">
              <div className="row-main">
                <div className="row-col vehicle-number">
                  <strong>{vehicle.vehicleNumber}</strong>
                </div>
                <div className="row-col vehicle-vendor">
                  {vehicle.vendor}
                </div>
                <div className="row-col vehicle-amount highlight">
                  <strong>₹{vehicle.amount.toFixed(2)}</strong>
                </div>
                <div className="row-col vehicle-type">
                  <span className="badge">{vehicle.policyType}</span>
                </div>
                <div className="row-col vehicle-status">
                  {isUpcomingRenewal(vehicle.renewalDate) ? (
                    <span className="status-badge renewal-soon">⚠️ Renewing</span>
                  ) : (
                    <span className="status-badge active">✅ Active</span>
                  )}
                </div>
                <div className="row-col vehicle-expiry">
                  {vehicle.expiryDate}
                </div>
                <div className="row-col vehicle-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(vehicle)}
                    title="Edit vehicle insurance"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(vehicle.id)}
                    title="Delete vehicle insurance"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {vehicle.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {vehicle.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Expired Insurance */}
      {expiredInsurances.length > 0 && (
        <>
          {expiredInsurances.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-list-row expired">
              <div className="row-main">
                <div className="row-col vehicle-number">
                  <strong>{vehicle.vehicleNumber}</strong>
                </div>
                <div className="row-col vehicle-vendor">
                  {vehicle.vendor}
                </div>
                <div className="row-col vehicle-amount">
                  ₹{vehicle.amount.toFixed(2)}
                </div>
                <div className="row-col vehicle-type">
                  <span className="badge">{vehicle.policyType}</span>
                </div>
                <div className="row-col vehicle-status">
                  <span className="status-badge expired-status">❌ Expired</span>
                </div>
                <div className="row-col vehicle-expiry">
                  {vehicle.expiryDate}
                </div>
                <div className="row-col vehicle-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => onEdit(vehicle)}
                    title="Edit vehicle insurance"
                  >
                    ✏️
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={() => onDelete(vehicle.id)}
                    title="Delete vehicle insurance"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {vehicle.notes && (
                <div className="row-details">
                  <span className="detail-label">Notes:</span> {vehicle.notes}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {activeInsurances.length === 0 && expiredInsurances.length === 0 && (
        <div className="empty-state">
          <p>🚗 No vehicle insurance policies yet. Add your first policy to get started!</p>
        </div>
      )}
    </div>
  );
}

export default VehicleInsuranceList;

import { useState } from 'react';

function VehicleInsuranceList({ vehicleInsurances, onEdit, onDelete, loading, darkMode }) {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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
  const orderedInsurances = [...activeInsurances, ...expiredInsurances];
  const formatAmount = (amount) => `₹${(parseFloat(amount) || 0).toFixed(2)}`;
  const getFrequency = (vehicle) => vehicle.frequency || 'Yearly';
  const getRenewalDate = (vehicle) => vehicle.renewalDate || '-';
  const getVehicleStatus = (vehicle) => {
    if (isExpired(vehicle.expiryDate)) {
      return { label: 'Expired', className: 'expired-status' };
    }
    if (isUpcomingRenewal(vehicle.renewalDate)) {
      return { label: 'Renewing', className: 'renewal-soon' };
    }
    return { label: 'Active', className: 'active' };
  };

  if (loading) {
    return <div className="loading-state">Loading vehicle insurance policies...</div>;
  }

  return (
    <div className="sip-list-container vehicle-insurance-list">
      {orderedInsurances.length > 0 && (
        <div className="sip-cards-list">
          {orderedInsurances.map((vehicle) => {
            const expired = isExpired(vehicle.expiryDate);
            const isSelected = selectedVehicle && selectedVehicle.id === vehicle.id;
            const status = getVehicleStatus(vehicle);

            return (
              <div
                key={vehicle.id}
                className={`sip-card vehicle-insurance-card ${expired ? 'expired' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                <div className="sip-card-content">
                  <div className="sip-card-details">
                    <h3 className="sip-card-name">{vehicle.vehicleNumber}</h3>
                    <div className="sip-card-amount-frequency">
                      {formatAmount(vehicle.amount)} • {getFrequency(vehicle)}
                    </div>
                    <div className="sip-card-start-date">
                      Renewal: {getRenewalDate(vehicle)}
                      <span className={`status-badge ${status.className}`}>{status.label}</span>
                    </div>
                  </div>

                  <div className="sip-card-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(vehicle);
                    }}
                    title="Edit vehicle insurance"
                  >
                    Edit
                  </button>
                  <button
                    className="icon-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(vehicle.id);
                    }}
                    title="Delete vehicle insurance"
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

      {orderedInsurances.length === 0 && (
        <div className="empty-state">
          <p>🚗 No vehicle insurance policies yet. Add your first policy to get started!</p>
        </div>
      )}

      {/* Side Panel */}
      {selectedVehicle && (
        <>
          <div
            className="panel-overlay"
            onClick={() => setSelectedVehicle(null)}
          />
          <div className="vehicle-details-panel">
            <div className="panel-header">
              <h2>{selectedVehicle.vehicleNumber}</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedVehicle(null)}
              >
                ✕
              </button>
            </div>

            <div className="panel-content">
              <div className="detail-row">
                <span className="detail-label">Vendor:</span>
                <span className="detail-value">{selectedVehicle.vendor}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  ₹{selectedVehicle.amount.toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Type:</span>
                <span className="detail-value">{selectedVehicle.policyType}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Policy Number:</span>
                <span className="detail-value">
                  {selectedVehicle.policyNumber || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  <span className={`status-badge ${getVehicleStatus(selectedVehicle).className}`}>
                    {getVehicleStatus(selectedVehicle).label}
                  </span>
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Start Date:</span>
                <span className="detail-value">
                  {selectedVehicle.startDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Expiry Date:</span>
                <span className="detail-value">
                  {selectedVehicle.expiryDate || '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Renewal Date:</span>
                <span className="detail-value">
                  {selectedVehicle.renewalDate || '-'}
                </span>
              </div>
              {selectedVehicle.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span>
                  <span className="detail-value">{selectedVehicle.notes}</span>
                </div>
              )}
            </div>

            <div className="panel-actions">
              <button
                className="action-btn edit-btn"
                onClick={() => {
                  onEdit(selectedVehicle);
                  setSelectedVehicle(null);
                }}
              >
                Edit Insurance
              </button>
              <button
                className="action-btn delete-btn"
                onClick={() => {
                  onDelete(selectedVehicle.id);
                  setSelectedVehicle(null);
                }}
              >
                Delete Insurance
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default VehicleInsuranceList;

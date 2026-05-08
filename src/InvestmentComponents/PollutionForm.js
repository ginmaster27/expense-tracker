import { useState, useEffect } from 'react';

function PollutionForm({ editingId, existingRecord, onSubmit, onCancel, isSubmitting, darkMode }) {
  const [formData, setFormData] = useState({
    vehicleNumber: '',
    startDate: '',
    expiryDate: '',
    amount: '',
    whoPaid: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingRecord) {
      setFormData({
        vehicleNumber: existingRecord.vehicleNumber || '',
        startDate: existingRecord.startDate || '',
        expiryDate: existingRecord.expiryDate || '',
        amount: existingRecord.amount || '',
        whoPaid: existingRecord.whoPaid || '',
        notes: existingRecord.notes || '',
      });
    }
  }, [existingRecord]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vehicleNumber.trim()) newErrors.vehicleNumber = 'Vehicle number is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.whoPaid.trim()) newErrors.whoPaid = 'Who paid is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
    });
  };

  return (
    <div className={`form-container pollution-form ${darkMode ? 'dark-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vehicleNumber">Vehicle Number *</label>
            <input
              id="vehicleNumber"
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="e.g., KA-05-AB-1234"
            />
            {errors.vehicleNumber && <span className="error-message">{errors.vehicleNumber}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date *</label>
            <input
              id="startDate"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
            />
            {errors.startDate && <span className="error-message">{errors.startDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date *</label>
            <input
              id="expiryDate"
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
            />
            {errors.expiryDate && <span className="error-message">{errors.expiryDate}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹) *</label>
            <input
              id="amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              step="0.01"
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="whoPaid">Who Paid *</label>
            <input
              id="whoPaid"
              type="text"
              name="whoPaid"
              value={formData.whoPaid}
              onChange={handleChange}
              placeholder="e.g., John Doe"
            />
            {errors.whoPaid && <span className="error-message">{errors.whoPaid}</span>}
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="3"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingId ? 'Update Certificate' : 'Add Certificate'}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default PollutionForm;

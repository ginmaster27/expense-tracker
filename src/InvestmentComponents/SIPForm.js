import { useState, useEffect } from 'react';

function SIPForm({ editingId, existingSIP, onSubmit, onCancel, isSubmitting, darkMode }) {
  const [formData, setFormData] = useState({
    sipType: 'Stock',
    sipName: '',
    amount: '',
    startDate: '',
    renewalDate: '',
    endDate: '',
    frequency: 'Monthly',
    status: 'Active',
    whoPaid: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingSIP) {
      setFormData({
        sipType: existingSIP.sipType || 'Stock',
        sipName: existingSIP.sipName || '',
        amount: existingSIP.amount || '',
        startDate: existingSIP.startDate || '',
        renewalDate: existingSIP.renewalDate || '',
        endDate: existingSIP.endDate || '',
        frequency: existingSIP.frequency || 'Monthly',
        status: existingSIP.status || 'Active',
        whoPaid: existingSIP.whoPaid || '',
        notes: existingSIP.notes || '',
      });
    }
  }, [existingSIP]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.sipName.trim()) newErrors.sipName = 'SIP name is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
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
    <div className={`form-container sip-form ${darkMode ? 'dark-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="sipType">SIP Type *</label>
            <select
              id="sipType"
              name="sipType"
              value={formData.sipType}
              onChange={handleChange}
            >
              <option value="Stock">Stock</option>
              <option value="Mutual Fund">Mutual Fund</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="sipName">SIP Name *</label>
            <input
              id="sipName"
              type="text"
              name="sipName"
              value={formData.sipName}
              onChange={handleChange}
              placeholder="e.g., Axis Blue Chip"
            />
            {errors.sipName && <span className="error-message">{errors.sipName}</span>}
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
            <label htmlFor="frequency">Frequency *</label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
            >
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="One-time">One-time</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="status">Status *</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Stopped">Stopped</option>
            </select>
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
            <label htmlFor="renewalDate">Renewal Date</label>
            <input
              id="renewalDate"
              type="date"
              name="renewalDate"
              value={formData.renewalDate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
            />
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
            {isSubmitting ? 'Saving...' : editingId ? 'Update SIP' : 'Add SIP'}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SIPForm;

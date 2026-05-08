import { useState, useEffect } from 'react';

function InsuranceForm({ editingId, existingPolicy, onSubmit, onCancel, isSubmitting, darkMode }) {
  const [formData, setFormData] = useState({
    vendor: '',
    policyName: '',
    amount: '',
    policyType: 'Life Insurance',
    startDate: '',
    frequency: 'Yearly',
    maturityDate: '',
    renewalDate: '',
    whoPaid: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingPolicy) {
      setFormData({
        vendor: existingPolicy.vendor || '',
        policyName: existingPolicy.policyName || '',
        amount: existingPolicy.amount || '',
        policyType: existingPolicy.policyType || 'Life Insurance',
        startDate: existingPolicy.startDate || '',
        frequency: existingPolicy.frequency || 'Yearly',
        maturityDate: existingPolicy.maturityDate || '',
        renewalDate: existingPolicy.renewalDate || '',
        whoPaid: existingPolicy.whoPaid || '',
        notes: existingPolicy.notes || '',
      });
    }
  }, [existingPolicy]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor.trim()) newErrors.vendor = 'Vendor is required';
    if (!formData.policyName.trim()) newErrors.policyName = 'Policy name is required';
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
    <div className={`form-container insurance-form ${darkMode ? 'dark-mode' : ''}`}>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="vendor">Vendor *</label>
            <input
              id="vendor"
              type="text"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="e.g., LIC, HDFC"
            />
            {errors.vendor && <span className="error-message">{errors.vendor}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="policyName">Policy Name *</label>
            <input
              id="policyName"
              type="text"
              name="policyName"
              value={formData.policyName}
              onChange={handleChange}
              placeholder="e.g., Jeevan Bima"
            />
            {errors.policyName && <span className="error-message">{errors.policyName}</span>}
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
            <label htmlFor="policyType">Policy Type *</label>
            <select
              id="policyType"
              name="policyType"
              value={formData.policyType}
              onChange={handleChange}
            >
              <option value="Life Insurance">Life Insurance</option>
              <option value="Medical Insurance">Medical Insurance</option>
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
            <label htmlFor="maturityDate">Maturity Date</label>
            <input
              id="maturityDate"
              type="date"
              name="maturityDate"
              value={formData.maturityDate}
              onChange={handleChange}
            />
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
            {isSubmitting ? 'Saving...' : editingId ? 'Update Policy' : 'Add Policy'}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default InsuranceForm;

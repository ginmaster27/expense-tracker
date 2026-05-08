import { useState } from 'react';

function SIPTopUpForm({ sipId, sip, onSubmit, onCancel, isSubmitting, darkMode }) {
  const [formData, setFormData] = useState({
    sipReference: sipId,
    topUpAmount: '',
    date: new Date().toISOString().split('T')[0],
    whoPaid: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.topUpAmount || parseFloat(formData.topUpAmount) <= 0) {
      newErrors.topUpAmount = 'Valid top-up amount is required';
    }
    if (!formData.date) newErrors.date = 'Date is required';
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
      topUpAmount: parseFloat(formData.topUpAmount),
    });
  };

  return (
    <div className={`form-container topup-form ${darkMode ? 'dark-mode' : ''}`}>
      <h4 className="form-title">Add Top-up/Lumpsum for: {sip?.sipName}</h4>

      <form onSubmit={handleSubmit} className="form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="topUpAmount">Top-up Amount (₹) *</label>
            <input
              id="topUpAmount"
              type="number"
              name="topUpAmount"
              value={formData.topUpAmount}
              onChange={handleChange}
              placeholder="Enter top-up amount"
              step="0.01"
            />
            {errors.topUpAmount && <span className="error-message">{errors.topUpAmount}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              id="date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
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
              rows="2"
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Top-up'}
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SIPTopUpForm;

import React from 'react';
import './Toast.css';

function Toast({ message, type = 'success' }) {
  if (!message) return null;

  return (
    <div 
      className={`toast toast-${type}`} 
      role="alert" 
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="toast-message">{message}</span>
    </div>
  );
}

export default Toast;

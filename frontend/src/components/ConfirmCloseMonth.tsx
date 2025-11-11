import React from 'react';
import './ConfirmCloseMonth.css';

interface ConfirmCloseMonth {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmCloseMonth: React.FC<ConfirmCloseMonth> = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="custom-confirm-overlay" onClick={onCancel}>
      <div className="custom-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title}</h3>
        <div className="confirm-message">{message}</div>
        <div className="confirm-buttons">
          <button className="confirm-btn cancel-btn" onClick={onCancel}>
            إلغاء
          </button>
          <button className="confirm-btn confirm-yes-btn" onClick={onConfirm}>
            نعم، متأكد
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCloseMonth;
import React from 'react';
import './ConfirmCloseMonth.css';

interface ConfirmCloseMonth {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmCloseMonth: React.FC<ConfirmCloseMonth> = ({ title, message, onConfirm, onCancel, loading = false }) => {
  return (
    <div className="custom-confirm-overlay" onClick={loading ? undefined : onCancel}>
      <div className="custom-confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠️</div>
        <h3 className="confirm-title">{title}</h3>
        <div className="confirm-message">{message}</div>
        <div className="confirm-buttons">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>
            إلغاء
          </button>
          <button className="btn-save" onClick={onConfirm} disabled={loading}>
            {loading ? 'جاري المعالجة...' : 'متأكد'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmCloseMonth;
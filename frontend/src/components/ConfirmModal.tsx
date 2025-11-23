import React from 'react';
import './Modal.css';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel, loading = false }) => {
  return (
    <div className="modal-overlay" onClick={loading ? undefined : onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{message}</h3>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn-danger" disabled={loading}>
            {loading ? 'جاري المعالجة...' : 'تأكيد'}
          </button>
          <button onClick={onCancel} className="btn-cancel" disabled={loading}>إلغاء</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
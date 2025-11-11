import React from 'react';
import './Modal.css';

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{message}</h3>
        <div className="modal-actions">
          <button onClick={onConfirm} className="btn-danger">تأكيد الحذف</button>
          <button onClick={onCancel} className="btn-cancel">إلغاء</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
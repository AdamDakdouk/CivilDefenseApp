import React from 'react';
import './CustomAlert.css';

interface CustomAlertProps {
  message: string;
  onClose: () => void;
  type: 'error' | 'success' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, onClose, type }) => {
  const alertConfig = {
    success: { icon: '✓', showButton: false },
    error: { icon: '⚠️', showButton: true },
    warning: { icon: '⚠', showButton: true },
    info: { icon: 'ℹ', showButton: true },
  };

  const config = alertConfig[type];
  const overlayClass = type === 'success' 
    ? 'custom-alert-overlay-success' 
    : 'custom-alert-overlay';

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-icon ${type}`}>
          {config.icon}
        </div>
        <div className="alert-message">{message}</div>
        {config.showButton && (
          <button className="alert-btn" onClick={onClose}>
            حسناً
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomAlert;
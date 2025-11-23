import React, { useEffect } from 'react';
import './CustomAlert.css';

interface CustomAlertProps {
  message: string;
  onClose: () => void;
  type: 'error' | 'success' | 'warning' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, onClose, type }) => {
  const alertConfig = {
    success: { icon: '✓', showButton: false, autoDismiss: true },
    error: { icon: '⚠️', showButton: true, autoDismiss: false },
    warning: { icon: '⚠', showButton: true, autoDismiss: false },
    info: { icon: 'spinner', showButton: false, autoDismiss: false }, // Use spinner for loading
  };

  const config = alertConfig[type];
  const overlayClass = type === 'success' 
    ? 'custom-alert-overlay-success' 
    : 'custom-alert-overlay';

  // ✅ Auto-dismiss success alerts after 2 seconds
  useEffect(() => {
    if (config.autoDismiss) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); 

      return () => clearTimeout(timer); // Cleanup timer on unmount
    }
  }, [config.autoDismiss, onClose]);

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className="custom-alert-box" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-icon ${type}`}>
          {config.icon === 'spinner' ? (
            <div className="spinner-icon"></div>
          ) : (
            config.icon
          )}
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
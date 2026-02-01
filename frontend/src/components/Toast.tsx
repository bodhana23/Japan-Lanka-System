import React, { useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

/**
 * Toast notification component
 *
 * Usage:
 * <Toast
 *   message="Operation successful!"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 * />
 */
const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  // Use ref to store onClose to avoid it being a dependency
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'error':
        return <XCircle size={16} />;
      case 'warning':
        return <AlertTriangle size={16} />;
      case 'info':
        return <Info size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
};

export default Toast;

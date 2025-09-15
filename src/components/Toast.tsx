import React, { useState, useEffect } from 'react';
import { FaCheck, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  
  const handleClose = () => {
    setIsVisible(false);
    // Small delay to allow exit animation
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  useEffect(() => {
    // Handle auto-close after duration
    if (!isPaused && isVisible) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      
      // Progress bar animation
      const interval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [duration, isPaused, isVisible]);

  const bgColor = {
    success: 'bg-green-100 border-green-500',
    error: 'bg-red-100 border-red-500',
    info: 'bg-blue-100 border-blue-500',
    warning: 'bg-yellow-100 border-yellow-500',
  };

  const iconColor = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
    warning: 'text-yellow-500',
  };

  const progressColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  };

  const Icon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className={iconColor[type]} />;
      case 'error':
        return <FaExclamationTriangle className={iconColor[type]} />;
      case 'warning':
        return <FaExclamationTriangle className={iconColor[type]} />;
      case 'info':
      default:
        return <FaInfoCircle className={iconColor[type]} />;
    }
  };

  return (
    <div 
      className={`
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'} 
        transform transition-all duration-300 ease-in-out
        max-w-md w-full rounded-lg shadow-lg border-l-4 ${bgColor[type]}
        flex flex-col overflow-hidden
      `}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="px-4 py-3 flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          <Icon />
        </div>
        <div className="flex-1 mr-2">
          <p className="text-sm text-gray-800">{message}</p>
        </div>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
          <FaTimes />
        </button>
      </div>
      <div className="h-1 w-full bg-gray-200">
        <div 
          className={`h-full ${progressColor[type]} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;
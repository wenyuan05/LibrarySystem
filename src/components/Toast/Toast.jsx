import React, { useEffect, useState, useRef } from 'react';
import './Toast.css';

const Toast = ({ id, message, type = 'info', duration = 3000, onClose }) => {
  const [progress, setProgress] = useState(100);
  const [isClosing, setIsClosing] = useState(false);
  const toastRef = useRef(null);
  const animationEndTimerRef = useRef(null);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      // 等待动画结束后再调用onClose
      animationEndTimerRef.current = setTimeout(() => {
        onClose(id);
      }, 300); // 与CSS动画持续时间一致
    }, duration);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      if (animationEndTimerRef.current) {
        clearTimeout(animationEndTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [duration, onClose, id]);

  // 处理手动关闭
  const handleClose = () => {
    setIsClosing(true);
    // 等待动画结束后再调用onClose
    closeTimerRef.current = setTimeout(() => {
      onClose(id);
    }, 300); // 与CSS动画持续时间一致
  };

  // 图标映射
  const icons = {
    success: '✓',
    error: '×',
    warning: '!',
    info: 'i'
  };

  return (
    <div 
      ref={toastRef}
      className={`toast toast-${type} ${isClosing ? 'closing' : ''}`}
    >
      <div className="toast-icon">{icons[type]}</div>
      <div className="toast-content">
        <div className="toast-message">{message}</div>
        <div className="toast-progress-container">
          <div 
            className="toast-progress" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
      <button className="toast-close" onClick={handleClose} aria-label="Close toast">×</button>
    </div>
  );
};

export default Toast;
import React from 'react';

const SkeletonLoader = ({ count = 5 }) => {
  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-item">
          <div className="skeleton" style={{ width: '80px', height: '120px', borderRadius: 'var(--border-radius)' }}></div>
          <div className="skeleton-content">
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-author"></div>
            <div className="skeleton skeleton-meta"></div>
            <div className="skeleton-actions">
              <div className="skeleton skeleton-button"></div>
              <div className="skeleton skeleton-button"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
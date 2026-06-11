import React from 'react';
import './CourseCoverFallback.css';

export function CourseCoverFallback({ className = '' }) {
  return (
    <div className={`course-cover-fallback ${className}`} aria-label="课程地图封面">
      <div className="ccf-kitchen-wall">
        <span className="ccf-cabinet left" />
        <span className="ccf-hood" />
        <span className="ccf-cabinet right" />
        <span className="ccf-stove" />
        <span className="ccf-counter" />
      </div>
      <div className="ccf-character pear"><span className="ccf-eye one" /><span className="ccf-eye two" /><span className="ccf-mouth" /></div>
      <div className="ccf-character brain"><span className="ccf-eye one" /><span className="ccf-eye two" /><span className="ccf-mouth" /></div>
      <div className="ccf-character orange"><span className="ccf-eye one" /><span className="ccf-eye two" /><span className="ccf-mouth" /></div>
      <div className="ccf-floor" />
    </div>
  );
}

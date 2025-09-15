'use client';

import React, { useState } from 'react';
import { FaInfoCircle } from 'react-icons/fa';

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  icon?: boolean;
  className?: string;
}

export default function Tooltip({ 
  content, 
  position = 'top', 
  children,
  icon = false,
  className = '' 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'bottom-[-6px] left-1/2 transform -translate-x-1/2 border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent',
    bottom: 'top-[-6px] left-1/2 transform -translate-x-1/2 border-b-gray-800 border-r-transparent border-t-transparent border-l-transparent',
    left: 'right-[-6px] top-1/2 transform -translate-y-1/2 border-l-gray-800 border-t-transparent border-r-transparent border-b-transparent',
    right: 'left-[-6px] top-1/2 transform -translate-y-1/2 border-r-gray-800 border-t-transparent border-l-transparent border-b-transparent',
  };
  
  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {/* Tooltip trigger element */}
      {icon ? (
        <span className="inline-flex items-center text-blue-500 hover:text-blue-700 transition-colors cursor-help">
          <FaInfoCircle size={16} />
        </span>
      ) : (
        children
      )}
      
      {/* Tooltip content */}
      {isVisible && (
        <div 
          className={`absolute z-50 ${positionClasses[position]} min-w-[200px] max-w-xs p-3 bg-gray-800 text-white text-sm rounded-md shadow-lg transform transition-opacity duration-300 pointer-events-none`}
        >
          {content}
          <div 
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
            style={{ borderStyle: 'solid' }}
          ></div>
        </div>
      )}
    </div>
  );
}
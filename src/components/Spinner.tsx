// src/components/Spinner.tsx

import React from 'react';

const Spinner: React.FC<{ size?: string; borderWidth?: string }> = ({
  size = 'h-32 w-32',
  borderWidth = 'border-t-8 border-b-8',
}) => (
  <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
    <div className={`animate-spin rounded-full ${size} ${borderWidth} border-white`}></div>
  </div>
);

export default Spinner;

// src/components/Spinner.tsx

import React from 'react';

interface SpinnerProps {
  isRed?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ isRed = false }) => (
  <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isRed ? 'border-red-500' : 'border-white'} mx-auto`}></div>
);

export default Spinner;
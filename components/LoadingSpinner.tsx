
import React from 'react';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = "Crafting your eBook..."}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xl text-slate-300 font-semibold">{message}</p>
      <p className="text-slate-400">This might take a moment.</p>
    </div>
  );
};

export default LoadingSpinner;
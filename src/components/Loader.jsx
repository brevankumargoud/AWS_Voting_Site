import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ text = 'Loading...', size = 'md', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-3 p-6 animate-fade-in">
      <div className="relative">
        <div className="absolute -inset-1 rounded-full bg-indigo-500/30 blur-md animate-pulse"></div>
        <Loader2 className={`${sizeClasses[size]} text-indigo-400 animate-spin relative`} />
      </div>
      {text && <p className="text-sm font-medium text-slate-300 tracking-wide">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};

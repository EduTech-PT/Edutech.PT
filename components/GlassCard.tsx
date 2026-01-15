import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`glass-panel rounded-2xl p-6 ${className}`}>
      {title && (
        <h3 className="text-xl font-semibold text-slate-800 mb-4 border-b border-white/40 pb-2">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

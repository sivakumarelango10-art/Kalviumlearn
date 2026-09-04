import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'red' | 'black' | 'gray' | 'green' | 'blue' | 'yellow' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className
}) => {
  const variantStyles = {
    red: 'bg-red-50 text-[#EE3124] border border-red-200',
    black: 'bg-black text-white',
    gray: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
    green: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200',
    yellow: 'bg-amber-50 text-amber-700 border border-amber-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium rounded',
    md: 'text-xs px-2.5 py-1 font-semibold rounded-md',
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 uppercase tracking-wider', variantStyles[variant], sizeStyles[size], className)}>
      {children}
    </span>
  );
};

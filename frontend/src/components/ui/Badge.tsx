import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blood' | 'neutral' | 'success' | 'warning' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium select-none rounded-[2px] transition-colors';

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 tracking-tight',
    md: 'text-xs px-2.5 py-1 tracking-tight',
  };

  const variantStyles = {
    blood: 'bg-[#fff1f2] text-[#991b1b] border border-[#fecdd3]',
    neutral: 'bg-[#f5f5f5] text-[#404040] border border-[#e5e5e5]',
    success: 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]',
    warning: 'bg-[#fffbeb] text-[#92400e] border border-[#fde68a]',
    outline: 'bg-transparent text-[#525252] border border-[#d4d4d4]',
  };

  return (
    <span
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};

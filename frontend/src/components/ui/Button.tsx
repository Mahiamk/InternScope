import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'blood' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[2px]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-4 py-2 gap-2 h-10',
    lg: 'text-base px-6 py-2.5 gap-2.5 h-12',
  };

  const variantStyles = {
    primary: 'bg-[#0a0a0a] text-white hover:bg-[#262626] active:bg-black',
    blood: 'bg-[#991b1b] text-white hover:bg-[#7f1d1d] active:bg-[#4c0519]',
    secondary: 'bg-[#f5f5f5] text-[#171717] hover:bg-[#e5e5e5] active:bg-[#d4d4d4]',
    outline: 'border border-[#e5e5e5] bg-white text-[#171717] hover:border-[#a3a3a3] hover:bg-[#fafafa]',
    ghost: 'text-[#171717] hover:bg-[#f5f5f5] active:bg-[#e5e5e5]',
    danger: 'bg-red-50 text-[#991b1b] border border-red-200 hover:bg-red-100',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
};

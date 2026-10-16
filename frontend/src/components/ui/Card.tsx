import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-white border border-[#e5e5e5] rounded-[2px] transition-all duration-150',
          hoverable && 'hover:border-[#a3a3a3] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};

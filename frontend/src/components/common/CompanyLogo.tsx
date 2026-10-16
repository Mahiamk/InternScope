import React, { useState } from 'react';
import { Buildings } from '@phosphor-icons/react';

interface CompanyLogoProps {
  name?: string;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-lg',
};

const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 28,
  xl: 36,
};

export const CompanyLogo: React.FC<CompanyLogoProps> = ({
  name = 'Company',
  logoUrl,
  size = 'md',
  className = '',
  alt
}) => {
  const [hasError, setHasError] = useState(false);
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || 20;

  // Extract initials if available (e.g. "Grab Malaysia" -> "GM")
  const initials = (name || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

  const displayAlt = alt || `${name} logo`;

  if (logoUrl && !hasError) {
    return (
      <div
        className={`bg-white border border-[#e5e5e5] rounded-[2px] flex items-center justify-center overflow-hidden shrink-0 transition-opacity duration-150 company-logo-container ${sizeClass} ${className}`}
        title={name}
      >
        <img
          src={logoUrl}
          alt={displayAlt}
          onError={() => setHasError(true)}
          loading="lazy"
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  // Graceful fallback with company initials or Buildings icon
  return (
    <div
      className={`bg-[#f5f5f5] border border-[#e5e5e5] rounded-[2px] flex items-center justify-center shrink-0 font-bold text-[#525252] select-none ${sizeClass} ${className}`}
      title={name}
      aria-label={displayAlt}
    >
      {initials ? (
        <span className="leading-none">{initials}</span>
      ) : (
        <Buildings size={iconSize} weight="duotone" className="text-[#991b1b]" />
      )}
    </div>
  );
};

import React from 'react';
import { Sun, Moon, Desktop } from '@phosphor-icons/react';
import { useTheme, Theme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  variant?: 'icon' | 'segmented' | 'dropdown';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'icon', className = '' }) => {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  if (variant === 'segmented') {
    const options: { value: Theme; label: string; icon: typeof Sun }[] = [
      { value: 'light', label: 'Light', icon: Sun },
      { value: 'dark', label: 'Dark', icon: Moon },
      { value: 'system', label: 'System', icon: Desktop },
    ];

    return (
      <div className={`inline-flex items-center p-1 bg-[#f5f5f5] dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#262626] rounded-[2px] ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[2px] transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#262626] text-[#0a0a0a] dark:text-white shadow-2xs'
                  : 'text-[#737373] hover:text-[#0a0a0a] dark:hover:text-white'
              }`}
              title={`Use ${opt.label} color scheme`}
            >
              <Icon size={14} weight={isActive ? 'fill' : 'regular'} className={isActive ? 'text-[#991b1b] dark:text-[#f87171]' : ''} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Compact Icon button
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#262626] rounded-[2px] border border-transparent hover:border-[#e5e5e5] dark:hover:border-[#333333] transition-all flex items-center justify-center relative group ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {isDark ? (
        <Sun size={18} weight="duotone" className="text-amber-400 group-hover:rotate-45 transition-transform duration-200" />
      ) : (
        <Moon size={18} weight="duotone" className="text-[#525252] group-hover:-rotate-12 transition-transform duration-200" />
      )}
    </button>
  );
};

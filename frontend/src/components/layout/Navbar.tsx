import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  Buildings,
  Briefcase,
  PlusCircle,
  UserCircle,
  SignOut,
  ShieldCheck,
  List,
  X,
  Gauge
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ThemeToggle } from '../common/ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Companies', path: '/companies', icon: Buildings },
    { name: 'Opportunities', path: '/opportunities', icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur border-b border-[#e5e5e5] dark:border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
              <span className="w-3.5 h-3.5 bg-[#991b1b] dark:bg-[#ef4444] transition-transform duration-200 group-hover:scale-110" />
              <span className="font-bold text-lg tracking-tight">
                <span className="text-[#0a0a0a] dark:text-[#ef4444]">Intern</span>
                <span className="text-[#991b1b] dark:text-white">Scope</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-[2px] transition-colors ${
                    active
                      ? 'text-[#0a0a0a] bg-[#f5f5f5] border-b-2 border-[#991b1b] dark:text-white dark:bg-[#171717] dark:border-[#ef4444]'
                      : 'text-[#525252] hover:text-[#0a0a0a] hover:bg-[#fafafa] dark:text-[#a3a3a3] dark:hover:text-white dark:hover:bg-[#141414]'
                  }`}
                >
                  <Icon size={18} weight="duotone" className={active ? 'text-[#991b1b] dark:text-[#ef4444]' : 'text-[#737373] dark:text-[#888888]'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />

            <Link to="/share">
              <Button
                variant="outline"
                size="sm"
                className="border-[#991b1b]/30 text-[#991b1b] hover:bg-[#fff1f2] dark:bg-white dark:text-[#dc2626] dark:border-white dark:hover:bg-[#ef4444] dark:hover:text-white dark:hover:border-[#ef4444] font-semibold transition-all shadow-xs"
              >
                <PlusCircle size={16} weight="duotone" className="transition-colors" />
                Share Experience
              </Button>
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#e5e5e5] dark:border-[#262626]">
                <Link to="/dashboard">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#262626] dark:border dark:border-[#262626]"
                  >
                    <Gauge size={16} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
                    Dashboard
                  </Button>
                </Link>

                {user.role in { moderator: 1, admin: 1 } && (
                  <Link to="/admin">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-[#991b1b] dark:text-[#ef4444] dark:bg-[#1a1a1a] dark:hover:bg-[#262626] dark:border dark:border-[#262626]"
                    >
                      <ShieldCheck size={16} weight="duotone" />
                      Admin
                    </Button>
                  </Link>
                )}

                <button
                  onClick={logout}
                  className="p-2 text-[#737373] dark:text-[#a3a3a3] hover:text-[#991b1b] dark:hover:text-[#ef4444] hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] rounded-[2px] transition-colors"
                  title="Sign out"
                >
                  <SignOut size={18} weight="duotone" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="dark:text-[#ef4444] dark:hover:text-[#f87171] dark:hover:bg-red-950/30 font-semibold"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    variant="primary"
                    size="sm"
                    className="dark:bg-[#dc2626] dark:text-white dark:border-[#dc2626] dark:hover:bg-white dark:hover:text-[#dc2626] dark:hover:border-white font-semibold transition-all shadow-xs"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Link to="/share">
              <Button
                variant="blood"
                size="sm"
                className="px-2.5 dark:bg-white dark:text-[#dc2626] dark:border-white dark:hover:bg-[#ef4444] dark:hover:text-white shadow-xs"
              >
                <PlusCircle size={16} weight="bold" />
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#525252] dark:text-[#a3a3a3] hover:text-[#0a0a0a] dark:hover:text-white hover:bg-[#f5f5f5] dark:hover:bg-[#1a1a1a] rounded-[2px]"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e5e5e5] dark:border-[#262626] bg-white dark:bg-[#0a0a0a] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-[2px] ${
                  active
                    ? 'bg-[#f5f5f5] text-[#991b1b] dark:bg-[#1a1a1a] dark:text-[#ef4444]'
                    : 'text-[#525252] dark:text-[#a3a3a3] dark:hover:text-white dark:hover:bg-[#141414]'
                }`}
              >
                <Icon size={18} weight="duotone" />
                {item.name}
              </Link>
            );
          })}

          <div className="pt-3 border-t border-[#e5e5e5] dark:border-[#262626] space-y-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#171717] bg-[#f5f5f5] dark:bg-[#1a1a1a] dark:text-white"
                >
                  <Gauge size={18} weight="duotone" className="text-[#991b1b] dark:text-[#ef4444]" />
                  Student Dashboard
                </Link>
                {user.role in { moderator: 1, admin: 1 } && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-[#991b1b] dark:text-[#ef4444] dark:bg-[#1a1a1a]"
                  >
                    <ShieldCheck size={18} weight="duotone" />
                    Admin Moderation
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-[#737373] dark:text-[#a3a3a3] hover:text-[#991b1b] dark:hover:text-[#ef4444]"
                >
                  <SignOut size={18} weight="duotone" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full dark:text-[#ef4444] dark:border-[#ef4444]/40 dark:hover:bg-red-950/30 font-semibold"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full dark:bg-[#dc2626] dark:text-white dark:border-[#dc2626] dark:hover:bg-white dark:hover:text-[#dc2626] font-semibold"
                  >
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

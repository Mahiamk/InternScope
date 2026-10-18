import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  Sparkle,
  MagnifyingGlass,
  Buildings,
  BookmarkSimple,
  PaperPlaneTilt,
  User,
  Target,
  BookOpen,
  ChartLineUp,
  Users,
  ChatsTeardrop,
  SlidersHorizontal,
  Question,
  SignOut,
  PlusCircle,
  ShieldCheck,
  Gauge,
  List,
  Article,
  X,
  CaretRight,
  FileText,
  ChartBar,
  Gear
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../common/ThemeToggle';
import { api } from '../../services/api';

export const DashboardLayout: React.FC = () => {
  const { user, profile, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [adminMetrics, setAdminMetrics] = useState<{ active_users?: number } | null>(null);

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  useEffect(() => {
    if (user && isModerator) {
      api.admin.getMetrics()
        .then(setAdminMetrics)
        .catch(() => {});
    }
  }, [user, isModerator]);

  // Keep admin/moderator strictly in their console workspace with community monitoring
  useEffect(() => {
    if (!loading && user && isModerator) {
      const allowedPaths = ['/admin', '/ask-a-senior', '/community', '/settings', '/profile', '/help'];
      const currentPath = location.pathname;
      if (!allowedPaths.some(p => currentPath.startsWith(p))) {
        navigate('/admin', { replace: true });
      }
    }
  }, [user, loading, isModerator, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const isActive = (path: string) => {
    if (path.includes('?')) {
      const [base, query] = path.split('?');
      if (location.pathname !== base) return false;
      const searchParams = new URLSearchParams(location.search);
      const queryParams = new URLSearchParams(query);
      for (const [key, val] of queryParams.entries()) {
        const currentVal = searchParams.get(key);
        if (key === 'tab' && val === 'overview' && !currentVal) {
          continue;
        }
        if (currentVal !== val) return false;
      }
      return true;
    }
    if (path === '/admin') {
      return location.pathname === '/admin' && (!location.search || location.search.includes('tab=overview'));
    }
    if (path === '/dashboard') {
      return (
        location.pathname === '/dashboard' &&
        (!location.search ||
          location.search === '' ||
          (!location.search.includes('tab=bookmarks') &&
            !location.search.includes('tab=tracker') &&
            !location.search.includes('tab=experiences') &&
            !location.search.includes('tab=my_reports')))
      );
    }
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-6 h-6 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#737373]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-[#e5e5e5] p-8 rounded-[2px] text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-[#991b1b] mx-auto rounded-[2px] flex items-center justify-center">
            <Gauge size={24} weight="duotone" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#0a0a0a]">Workspace Authentication</h2>
            <p className="text-xs text-[#525252]">
              Please sign in to access your private workspace and platform tools.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link to={`/login?redirect=${redirectUrl}`}>
              <Button variant="blood" size="md" className="w-full sm:w-auto">
                Sign In to Continue
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" size="md" className="w-full sm:w-auto">
                Return to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  interface NavItem {
    name: string;
    path: string;
    icon: any;
    badge?: string;
    badgeStyle?: 'ai' | 'standard';
    adminOnly?: boolean;
  }

  interface NavGroup {
    group: string;
    items: NavItem[];
  }

  // Dual-role sidebar structure: Admin/Moderator Console (Image 2) vs Student Workspace (Image 1)
  const navItems: NavGroup[] = isModerator
    ? [
        {
          group: 'MAIN SECTIONS',
          items: [
            { name: 'Overview', path: '/admin?tab=overview', icon: Gauge },
            { name: 'Content Moderation', path: '/admin?tab=moderation', icon: ShieldCheck },
          ],
        },
        ...(isAdmin
          ? [
              {
                group: 'PLATFORM GOVERNANCE (ADMIN)',
                items: [
                  { name: 'Company & Data Quality', path: '/admin?tab=companies', icon: Buildings },
                  { name: 'Users & Access Control', path: '/admin?tab=users', icon: Users },
                  { name: 'Analytics & Insights', path: '/admin?tab=analytics', icon: ChartBar },
                  { name: 'Settings & Audit Trail', path: '/admin?tab=settings', icon: Gear },
                ],
              },
            ]
          : []),
        {
          group: 'COMMUNITY MONITORING',
          items: [
            { name: 'Ask a Senior', path: '/ask-a-senior', icon: ChatsTeardrop },
            { name: 'Student Community', path: '/community', icon: Users },
            { name: 'Settings', path: '/settings', icon: SlidersHorizontal },
          ],
        },
      ]
    : [
        {
          group: 'WORKSPACE',
          items: [
            { name: 'Overview', path: '/dashboard', icon: SquaresFour },
            { name: 'For You', path: '/recommendations', icon: Sparkle, badge: 'AI', badgeStyle: 'ai' },
            { name: 'Explore Internships', path: '/opportunities', icon: MagnifyingGlass },
            { name: 'Company Explorer', path: '/companies', icon: Buildings },
            { name: 'Saved Opportunities', path: '/dashboard?tab=bookmarks', icon: BookmarkSimple },
            { name: 'Application Tracker', path: '/dashboard?tab=tracker', icon: PaperPlaneTilt },
            { name: 'My Experiences', path: '/dashboard?tab=experiences', icon: Article },
          ],
        },
        {
          group: 'CAREER GROWTH',
          items: [
            { name: 'My Career Profile', path: '/profile', icon: User },
            { name: 'AI CV Analyser', path: '/cv-analyser', icon: FileText, badge: 'AI', badgeStyle: 'ai' },
            { name: 'Skill Gap Analyzer', path: '/skill-gap', icon: Target },
            { name: 'Ask a Senior', path: '/ask-a-senior', icon: ChatsTeardrop },
            { name: 'Interview Prep', path: '/interview-prep', icon: BookOpen },
            { name: 'Career Insights', path: '/career-insights', icon: ChartLineUp },
            { name: 'Student Community', path: '/community', icon: Users },
          ],
        },
        {
          group: 'ACCOUNT',
          items: [
            { name: 'Settings and Privacy', path: '/settings', icon: SlidersHorizontal },
            { name: 'Help and Feedback', path: '/help', icon: Question },
          ],
        },
      ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between bg-white select-none border-r border-[#e5e5e5]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#e5e5e5] shrink-0">
        <Link to={isModerator ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group">
          <span className="w-4 h-4 bg-[#991b1b] transition-transform duration-200 group-hover:scale-110 shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-lg tracking-tight text-[#0a0a0a]">
              Intern<span className="text-[#991b1b]">Scope</span>
            </span>
            <div className="text-[10px] uppercase tracking-wider text-[#991b1b] font-bold">
              {isAdmin ? 'Admin Console' : isModerator ? 'Moderator Console' : 'Student Workspace'}
            </div>
          </div>
        </Link>
      </div>

      {/* Scrollable Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3">
        {navItems.map((group, groupIdx) => (
          <div key={group.group}>
            {groupIdx > 0 && <div className="border-t border-[#e5e5e5] my-3" />}
            <div className="px-3 space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#737373]">
                {group.group}
              </div>
              <div className="space-y-0.5 pt-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileSidebarOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-[2px] transition-colors ${
                        active
                          ? 'bg-[#0a0a0a] text-white font-semibold shadow-xs'
                          : 'text-[#374151] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          size={18}
                          weight={active ? 'fill' : 'regular'}
                          className={
                            active
                              ? 'text-white'
                              : item.badgeStyle === 'ai'
                              ? 'text-[#7c3aed]'
                              : 'text-[#4b5563]'
                          }
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              item.badgeStyle === 'ai'
                                ? active
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#ede9fe] text-[#7c3aed]'
                                : active
                                ? 'bg-white/20 text-white'
                                : 'bg-red-50 text-[#991b1b]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {active && <CaretRight size={12} weight="bold" className="text-white/70" />}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Status Box for Admin/Moderator (Exact match to Image 2) */}
      {isModerator && (
        <div className="pt-3 pb-2 px-4 border-t border-[#f5f5f5] text-[11px] text-[#737373] space-y-1.5 shrink-0">
          <div className="flex justify-between items-center">
            <span>Database Status:</span>
            <span className="text-[#16a34a] font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" /> Online
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>Active Users:</span>
            <span className="font-semibold text-[#0a0a0a]">{adminMetrics?.active_users ?? 12}</span>
          </div>
        </div>
      )}

      {/* Bottom User Profile Section with Circular Initials */}
      <div className="p-3 border-t border-[#e5e5e5] bg-white shrink-0">
        <div className="flex items-center justify-between gap-2.5 p-1.5 rounded-[2px] hover:bg-[#f5f5f5] transition-colors group">
          <Link
            to="/profile"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-2.5 min-w-0 flex-1"
            title="My Career Profile"
          >
            <div className="w-8 h-8 rounded-full bg-[#0a0a0a] text-white flex items-center justify-center text-xs font-bold shrink-0 ring-1 ring-[#e5e5e5] shadow-2xs">
              {getInitials(user.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-xs text-[#0a0a0a] truncate group-hover:text-[#991b1b] transition-colors">
                {user.full_name || 'User'}
              </div>
              <div className="text-[10px] text-[#737373] truncate">
                {user.role ? user.role.toUpperCase() : user.email}
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-[#737373] hover:text-[#991b1b] hover:bg-red-50 rounded-[2px] transition-colors shrink-0"
          >
            <SignOut size={16} weight="bold" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#fafafa] text-[#0a0a0a]">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-[#e5e5e5] z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Right Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#e5e5e5] h-14 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-[2px]"
            >
              <List size={20} weight="bold" />
            </button>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#737373]">
              <span>{isModerator ? 'Admin Console' : 'Workspace'}</span>
              <span>/</span>
              <span className="text-[#0a0a0a] uppercase tracking-wider font-bold">
                {(() => {
                  if (location.pathname.startsWith('/admin')) {
                    if (location.search.includes('tab=moderation')) return 'Content Moderation';
                    if (location.search.includes('tab=companies')) return 'Company & Data Quality';
                    if (location.search.includes('tab=users')) return 'Users & Access Control';
                    if (location.search.includes('tab=analytics')) return 'Analytics & Insights';
                    if (location.search.includes('tab=settings')) return 'Settings & Audit Trail';
                    return 'Overview';
                  }
                  if (location.pathname.startsWith('/ask-a-senior')) return 'Ask a Senior';
                  if (location.pathname.startsWith('/community')) return 'Student Community';
                  if (location.pathname.startsWith('/settings')) return 'Settings and Privacy';
                  if (location.pathname.startsWith('/help')) return 'Help and Feedback';
                  if (location.pathname.startsWith('/profile')) return 'My Profile';
                  if (location.pathname.startsWith('/share')) return 'Share Experience';
                  if (location.pathname.includes('/edit')) return 'Edit Experience';
                  if (location.pathname.startsWith('/recommendations')) return 'For You';
                  if (location.pathname.startsWith('/cv-analyser')) return 'AI CV Analyser';
                  if (location.pathname.startsWith('/interview-prep')) return 'Interview Prep';
                  if (location.pathname.startsWith('/career-insights')) return 'Career Insights';
                  if (location.pathname.startsWith('/skill-gap')) return 'Skill Gap Analyzer';
                  if (location.search.includes('tab=experiences') || location.search.includes('tab=my_reports')) return 'My Experiences';
                  if (location.search.includes('tab=bookmarks')) return 'Saved Bookmarks';
                  if (location.search.includes('tab=tracker')) return 'Application Tracker';
                  return 'Overview';
                })()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isModerator ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-[#991b1b] bg-red-50 border border-red-200 rounded-[2px] uppercase tracking-wider">
                <ShieldCheck size={14} weight="fill" />
                {user.role}
              </span>
            ) : (
              !location.pathname.startsWith('/share') && !location.pathname.includes('/edit') && (
                <Link to="/share">
                  <Button variant="blood" size="sm" className="text-xs">
                    <PlusCircle size={15} weight="bold" />
                    <span className="hidden sm:inline">Share Experience</span>
                    <span className="sm:hidden">Share</span>
                  </Button>
                </Link>
              )
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Minimalist Swiss App Status Bar */}
        <footer className="bg-white border-t border-[#e5e5e5] py-3 px-4 sm:px-6 text-[11px] text-[#737373] flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]" />
            <span>{isModerator ? 'InternScope Institutional Governance Node' : 'InternScope Student Workspace • Inter-University Network'}</span>
          </div>
          <div>{isModerator ? 'Encrypted Platform Audit & Supervision' : 'Private & Encrypted Industrial Training Tracker'}</div>
        </footer>
      </div>
    </div>
  );
};

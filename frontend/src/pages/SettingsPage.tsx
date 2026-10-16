import React, { useState } from 'react';
import {
  SlidersHorizontal,
  Lock,
  Eye,
  Bell,
  CheckCircle,
  User,
  ShieldCheck,
  Envelope,
  PaintBrush
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { ThemeToggle } from '../components/common/ThemeToggle';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [savedNotice, setSavedNotice] = useState(false);

  // Settings State
  const [anonymousExperience, setAnonymousExperience] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [recommendationDigest, setRecommendationDigest] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#e5e5e5]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#991b1b] rounded-full" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
            Student Account
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] mt-1">
          Settings and Privacy
        </h1>
        <p className="text-sm text-[#737373] mt-1">
          Manage your student privacy preferences, application notifications, and account credentials.
        </p>
      </div>

      {savedNotice && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-[2px] text-xs text-[#16a34a] font-semibold flex items-center gap-2">
          <CheckCircle size={16} weight="bold" />
          Preferences successfully saved to your workspace session.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Appearance & Theme Section */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5]">
            <div className="flex items-center gap-2">
              <PaintBrush size={18} weight="duotone" className="text-[#991b1b]" />
              <h2 className="text-sm font-bold text-[#0a0a0a]">Appearance & Theme</h2>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-semibold text-[#0a0a0a]">Interface Color Scheme</div>
              <div className="text-[11px] text-[#737373]">
                Choose between Swiss high-contrast Light mode, sleek Obsidian Dark mode, or follow your operating system settings.
              </div>
            </div>
            <ThemeToggle variant="segmented" />
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5]">
            <Lock size={18} weight="duotone" className="text-[#991b1b]" />
            <h2 className="text-sm font-bold text-[#0a0a0a]">Privacy & Review Attribution</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#0a0a0a]">
                  Default to Anonymous Reviews
                </div>
                <div className="text-[11px] text-[#737373]">
                  When sharing an internship experience, your name and student ID remain confidential. Only your academic department and degree program will appear as verified.
                </div>
              </div>
              <input
                type="checkbox"
                checked={anonymousExperience}
                onChange={(e) => setAnonymousExperience(e.target.checked)}
                className="w-4 h-4 text-[#991b1b] rounded accent-[#991b1b] cursor-pointer mt-0.5"
              />
            </label>

            <label className="flex items-start justify-between gap-4 cursor-pointer pt-2 border-t border-[#f5f5f5]">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#0a0a0a]">
                  Allow Peer Students to View Career Profile Skills
                </div>
                <div className="text-[11px] text-[#737373]">
                  Enables peers to discover your technical skills and project highlights for study groups and collaborative projects.
                </div>
              </div>
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="w-4 h-4 text-[#991b1b] rounded accent-[#991b1b] cursor-pointer mt-0.5"
              />
            </label>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5]">
            <Bell size={18} weight="duotone" className="text-[#991b1b]" />
            <h2 className="text-sm font-bold text-[#0a0a0a]">Workspace Notifications</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-start justify-between gap-4 cursor-pointer">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#0a0a0a]">
                  Application Tracker Deadline Reminders
                </div>
                <div className="text-[11px] text-[#737373]">
                  Receive notification alerts when an opportunity deadline in your tracker is within 3 days.
                </div>
              </div>
              <input
                type="checkbox"
                checked={deadlineAlerts}
                onChange={(e) => setDeadlineAlerts(e.target.checked)}
                className="w-4 h-4 text-[#991b1b] rounded accent-[#991b1b] cursor-pointer mt-0.5"
              />
            </label>

            <label className="flex items-start justify-between gap-4 cursor-pointer pt-2 border-t border-[#f5f5f5]">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-[#0a0a0a]">
                  Weekly 'For You' AI Internship Digest
                </div>
                <div className="text-[11px] text-[#737373]">
                  Receive personalized recommendations matching your target roles and technical skills.
                </div>
              </div>
              <input
                type="checkbox"
                checked={recommendationDigest}
                onChange={(e) => setRecommendationDigest(e.target.checked)}
                className="w-4 h-4 text-[#991b1b] rounded accent-[#991b1b] cursor-pointer mt-0.5"
              />
            </label>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#f5f5f5]">
            <User size={18} weight="duotone" className="text-[#991b1b]" />
            <h2 className="text-sm font-bold text-[#0a0a0a]">Authenticated Student Details</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#737373]">Full Name:</span>
              <div className="font-semibold text-[#0a0a0a] mt-0.5">{user?.full_name || 'Student'}</div>
            </div>
            <div>
              <span className="text-[#737373]">Institutional Email:</span>
              <div className="font-semibold text-[#0a0a0a] mt-0.5">{user?.email || 'N/A'}</div>
            </div>
            <div>
              <span className="text-[#737373]">Degree Program:</span>
              <div className="font-semibold text-[#0a0a0a] mt-0.5">{user?.program || 'Computer Science'}</div>
            </div>
            <div>
              <span className="text-[#737373]">Account Role:</span>
              <div className="font-semibold text-[#991b1b] uppercase mt-0.5">{user?.role || 'STUDENT'}</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="blood" size="md">
            Save Preferences
          </Button>
        </div>
      </form>
    </div>
  );
};

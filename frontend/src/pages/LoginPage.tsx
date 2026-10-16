import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { WarningCircle, UserCircle, ShieldCheck } from '@phosphor-icons/react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="w-3.5 h-3.5 bg-[#991b1b]" />
          <span className="font-bold text-xl tracking-tight text-[#0a0a0a]">
            Intern<span className="text-[#991b1b]">Scope</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Sign in to your account</h1>
        <p className="text-xs text-[#525252]">Access senior reports, manage your tracker, and bookmark companies.</p>
      </div>

      <div className="bg-white border border-[#e5e5e5] p-6 sm:p-8 rounded-[2px] space-y-6 shadow-xs">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-[#991b1b] flex items-center gap-2 rounded-[2px]">
            <WarningCircle size={16} weight="fill" className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              University Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@aiu.edu.my"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Password
              </label>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <Button type="submit" variant="blood" size="md" className="w-full font-semibold" isLoading={loading}>
            Sign In
          </Button>
        </form>

        {/* Quick Demo Logins for Instant Testing */}
        <div className="pt-4 border-t border-[#f5f5f5] space-y-2">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block text-center">
            Instant Demo Test Accounts (All Schools)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillDemoAccount('student@aiu.edu.my', 'StudentPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#0a0a0a]">Computing</div>
              <div className="text-[10px] text-[#737373] truncate">student@aiu.edu.my</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('nurul@aiu.edu.my', 'StudentPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#0a0a0a]">Business (BBA)</div>
              <div className="text-[10px] text-[#737373] truncate">nurul@aiu.edu.my</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('kevin@aiu.edu.my', 'StudentPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#0a0a0a]">Media / Comm</div>
              <div className="text-[10px] text-[#737373] truncate">kevin@aiu.edu.my</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('maryam@aiu.edu.my', 'StudentPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#0a0a0a]">Education (TESL)</div>
              <div className="text-[10px] text-[#737373] truncate">maryam@aiu.edu.my</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('zulkifli@aiu.edu.my', 'StudentPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#0a0a0a]">Finance / Audit</div>
              <div className="text-[10px] text-[#737373] truncate">zulkifli@aiu.edu.my</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('moderator@aiu.edu.my', 'ModPass123!')}
              className="p-2 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-left text-[#525252]"
            >
              <div className="font-semibold text-[#991b1b]">Career Moderator</div>
              <div className="text-[10px] text-[#737373] truncate">moderator@aiu.edu.my</div>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-[#525252] pt-2">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-[#991b1b] font-medium hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

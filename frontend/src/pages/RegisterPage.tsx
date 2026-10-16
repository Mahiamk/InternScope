import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { WarningCircle } from '@phosphor-icons/react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    program: 'Bachelor of Computer Science (Hons)',
    grad_year: 2026,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        ...formData,
        grad_year: Number(formData.grad_year),
      });
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Create your student account</h1>
        <p className="text-xs text-[#525252]">Join verified university seniors and discover industrial training experiences.</p>
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
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Nurul Huda"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              University Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. huda@aiu.edu.my"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Password *
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Study Program / Faculty
              </label>
              <input
                type="text"
                value={formData.program}
                onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                placeholder="e.g. Business (BBA), Media, TESL, Finance, Politics..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Grad Year
              </label>
              <input
                type="number"
                min="2020"
                max="2035"
                value={formData.grad_year}
                onChange={(e) => setFormData({ ...formData, grad_year: parseInt(e.target.value) || 2026 })}
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>
          </div>

          <Button type="submit" variant="blood" size="md" className="w-full font-semibold" isLoading={loading}>
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-[#525252] pt-2">
          Already registered?{' '}
          <Link to="/login" className="text-[#991b1b] font-medium hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};

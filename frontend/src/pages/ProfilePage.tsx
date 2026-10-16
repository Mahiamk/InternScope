import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircle,
  GraduationCap,
  Sparkle,
  Target,
  MapPin,
  CheckCircle,
  WarningCircle,
  Plus,
  Trash,
  FloppyDisk,
  ArrowSquareOut,
  CurrencyDollar,
  Briefcase,
  Lightbulb
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import type { SkillItem } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, profileLoading } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    preferred_name: '',
    university_name: '',
    degree_level: "Bachelor's Degree",
    field_of_study: '',
    year_of_study: 3,
    grad_year: 2027,
    skills: [] as SkillItem[],
    preferred_roles: [] as string[],
    preferred_industries: [] as string[],
    preferred_locations: ['Kuala Lumpur'],
    work_arrangements: ['hybrid'],
    min_allowance: 1000,
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    bio: '',
    availability_status: 'AVAILABLE' as 'AVAILABLE' | 'LOOKING' | 'PLACED'
  });

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Tech & Engineering');
  const [newSkillProf, setNewSkillProf] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [newRoleInput, setNewRoleInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        preferred_name: profile.preferred_name || user?.full_name || '',
        university_name: profile.university_name || (user as any)?.university_name || '',
        degree_level: profile.degree_level || "Bachelor's Degree",
        field_of_study: profile.field_of_study || user?.program || '',
        year_of_study: profile.year_of_study || 3,
        grad_year: profile.grad_year || user?.grad_year || 2027,
        skills: profile.skills || [],
        preferred_roles: profile.preferred_roles || [],
        preferred_industries: profile.preferred_industries || [],
        preferred_locations: profile.preferred_locations || ['Kuala Lumpur'],
        work_arrangements: profile.work_arrangements || ['hybrid'],
        min_allowance: profile.min_allowance || 1000,
        portfolio_url: profile.portfolio_url || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        bio: profile.bio || '',
        availability_status: (profile.availability_status as any) || 'AVAILABLE'
      });
    }
  }, [profile, user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        ...formData,
        is_completed: true
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    if (formData.skills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) return;

    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, { name: newSkillName.trim(), category: newSkillCategory, proficiency: newSkillProf }]
    }));
    setNewSkillName('');
  };

  const handleRemoveSkill = (name: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name.toLowerCase() !== name.toLowerCase())
    }));
  };

  const toggleArrayItem = (key: 'preferred_roles' | 'preferred_industries' | 'preferred_locations' | 'work_arrangements', item: string) => {
    setFormData(prev => {
      const arr = prev[key];
      const exists = arr.includes(item);
      return {
        ...prev,
        [key]: exists ? arr.filter(x => x !== item) : [...arr, item]
      };
    });
  };

  const completion = profile?.completion;

  return (
    <div className="max-w-5xl mx-auto space-y-8 select-text">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
              Student Career Profile
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Career Profile & Intelligence Setup
          </h1>
          <p className="text-xs text-[#525252]">
            Keep your skills, interests, and preferences current to fuel deterministic internship recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/recommendations">
            <Button variant="outline" size="sm" className="text-xs">
              <Sparkle size={14} weight="duotone" className="text-[#991b1b]" />
              View Recommendations
            </Button>
          </Link>
          <Button
            type="button"
            variant="blood"
            size="sm"
            onClick={() => handleSave()}
            disabled={saving}
            className="text-xs"
          >
            <FloppyDisk size={14} weight="bold" />
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} weight="fill" className="text-green-600" />
            <span className="font-semibold">Career profile saved successfully! Recommendation engine updated.</span>
          </div>
          <Link to="/recommendations" className="underline font-bold text-green-900">
            Check Matches →
          </Link>
        </div>
      )}

      {/* Completion Meter Card */}
      {completion && (
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-50 text-[#991b1b] flex items-center justify-center font-bold text-sm rounded-[2px]">
                {completion.percentage}%
              </div>
              <div>
                <div className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                  Profile Completeness
                </div>
                <div className="text-xs text-[#525252]">
                  {completion.is_completed ? 'Fully optimized for matching' : completion.next_step || 'Incomplete profile'}
                </div>
              </div>
            </div>

            <Badge variant={completion.is_completed ? 'success' : 'neutral'}>
              {completion.is_completed ? 'Profile Active' : 'Setup In Progress'}
            </Badge>
          </div>

          <div className="w-full h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                completion.percentage >= 80 ? 'bg-[#16a34a]' : 'bg-[#991b1b]'
              }`}
              style={{ width: `${completion.percentage}%` }}
            />
          </div>

          {completion.missing_fields && completion.missing_fields.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-[#991b1b] bg-red-50/60 p-2.5 rounded-[2px]">
              <WarningCircle size={16} weight="bold" className="shrink-0" />
              <span>Recommended to add: {completion.missing_fields.join(', ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Form Sections Grid */}
      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Academic Background */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-5">
          <div className="border-b border-[#f0f0f0] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
              <GraduationCap size={18} weight="duotone" className="text-[#991b1b]" />
              Academic Credentials
            </h2>
            <p className="text-xs text-[#737373]">Your university faculty, program, and internship intake timeline.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0a0a0a]">Preferred Name</label>
              <input
                type="text"
                value={formData.preferred_name}
                onChange={e => setFormData({ ...formData, preferred_name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0a0a0a]">University</label>
              <input
                type="text"
                value={formData.university_name}
                onChange={e => setFormData({ ...formData, university_name: e.target.value })}
                placeholder="e.g. Albukhary International University, UM, UTM..."
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0a0a0a]">Field of Study / Major</label>
              <input
                type="text"
                value={formData.field_of_study}
                onChange={e => setFormData({ ...formData, field_of_study: e.target.value })}
                placeholder="e.g. Computer Science, Business Analytics, Finance, Media"
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0a0a0a]">Year of Study</label>
                <select
                  value={formData.year_of_study}
                  onChange={e => setFormData({ ...formData, year_of_study: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                >
                  <option value={1}>Year 1</option>
                  <option value={2}>Year 2</option>
                  <option value={3}>Year 3</option>
                  <option value={4}>Year 4</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#0a0a0a]">Graduation Year</label>
                <input
                  type="number"
                  value={formData.grad_year}
                  onChange={e => setFormData({ ...formData, grad_year: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                />
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-[#0a0a0a]">Short Bio / Objective</label>
              <textarea
                rows={2}
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="e.g. Final-year Computer Science student passionate about fullstack web architecture and high-scale systems."
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Skills & Competencies */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-5">
          <div className="border-b border-[#f0f0f0] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
                <Sparkle size={18} weight="duotone" className="text-[#991b1b]" />
                Technical & Domain Skills ({formData.skills.length})
              </h2>
              <p className="text-xs text-[#737373]">Evaluated with 35% weight in the career matching algorithm.</p>
            </div>
            <Link to="/skill-gap" className="text-xs text-[#991b1b] font-bold hover:underline flex items-center gap-1">
              <span>Skill Gap Analyzer</span>
              <ArrowSquareOut size={13} weight="bold" />
            </Link>
          </div>

          {/* Current Skills List */}
          <div className="flex flex-wrap gap-2">
            {formData.skills.map(s => (
              <span
                key={s.name}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#fafafa] border border-[#0a0a0a] text-xs font-semibold rounded-[2px]"
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-[#737373] uppercase font-normal">({s.proficiency || 'intermediate'})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(s.name)}
                  className="text-[#991b1b] hover:text-black ml-1"
                >
                  <Trash size={13} weight="bold" />
                </button>
              </span>
            ))}
          </div>

          {/* Add Skill Bar */}
          <div className="flex flex-col sm:flex-row gap-2 items-center pt-2">
            <input
              type="text"
              value={newSkillName}
              onChange={e => setNewSkillName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              placeholder="Add skill (e.g. Python, SQL, Financial Modeling, SEO)..."
              className="flex-1 w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
            />
            <select
              value={newSkillCategory}
              onChange={e => setNewSkillCategory(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px] w-full sm:w-auto"
            >
              <option value="Tech & Engineering">Tech & Engineering</option>
              <option value="Business & Finance">Business & Finance</option>
              <option value="Marketing & Media">Marketing & Media</option>
              <option value="Education & Policy">Education & Policy</option>
              <option value="General">General</option>
            </select>
            <select
              value={newSkillProf}
              onChange={(e: any) => setNewSkillProf(e.target.value)}
              className="px-2.5 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px] w-full sm:w-auto"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
            <Button
              type="button"
              variant="blood"
              size="sm"
              onClick={handleAddSkill}
              className="w-full sm:w-auto text-xs"
            >
              <Plus size={14} weight="bold" />
              Add Skill
            </Button>
          </div>
        </div>

        {/* Section 3: Target Roles & Industries */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-5">
          <div className="border-b border-[#f0f0f0] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
              <Target size={18} weight="duotone" className="text-[#991b1b]" />
              Career Targets & Industries
            </h2>
            <p className="text-xs text-[#737373]">Priority job titles and market sectors.</p>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[#0a0a0a]">
              Target Internship Roles ({formData.preferred_roles.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.preferred_roles.map(r => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0a0a0a] text-white text-xs font-semibold rounded-[2px]"
                >
                  <span>{r}</span>
                  <button
                    type="button"
                    onClick={() => toggleArrayItem('preferred_roles', r)}
                    className="text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRoleInput}
                onChange={e => setNewRoleInput(e.target.value)}
                placeholder="Add role title (e.g. Data Engineer, Tax Intern)..."
                className="flex-1 px-3 py-1.5 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (newRoleInput.trim()) {
                    toggleArrayItem('preferred_roles', newRoleInput.trim());
                    setNewRoleInput('');
                  }
                }}
                className="text-xs"
              >
                Add Role
              </Button>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-[#0a0a0a]">
              Preferred Industries ({formData.preferred_industries.length} selected)
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                'Technology & Software',
                'Fintech & Banking',
                'Consulting & Professional Services',
                'E-Commerce & Retail',
                'Media & Creative',
                'Education & Non-Profit',
                'Government & Public Policy',
                'Telecommunications'
              ].map(ind => {
                const isSelected = formData.preferred_industries.includes(ind);
                return (
                  <button
                    key={ind}
                    type="button"
                    onClick={() => toggleArrayItem('preferred_industries', ind)}
                    className={`text-xs px-3 py-1.5 rounded-[2px] border transition-colors ${
                      isSelected
                        ? 'bg-[#0a0a0a] text-white border-[#0a0a0a] font-semibold'
                        : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                    }`}
                  >
                    {isSelected ? `✓ ${ind}` : ind}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Work Mode & Compensation Target */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-5">
          <div className="border-b border-[#f0f0f0] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
              <MapPin size={18} weight="duotone" className="text-[#991b1b]" />
              Work Arrangements & Location
            </h2>
            <p className="text-xs text-[#737373]">Geographic preferences and minimum monthly compensation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#0a0a0a]">Target Locations</label>
              <div className="flex flex-wrap gap-2">
                {['Kuala Lumpur', 'Cyberjaya', 'Petaling Jaya', 'Penang', 'Johor Bahru', 'Remote'].map(loc => {
                  const isSelected = formData.preferred_locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => toggleArrayItem('preferred_locations', loc)}
                      className={`text-xs px-3 py-1.5 rounded-[2px] border transition-colors ${
                        isSelected
                          ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                          : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                      }`}
                    >
                      {isSelected ? `✓ ${loc}` : loc}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 space-y-1.5">
                <label className="text-xs font-bold text-[#0a0a0a]">Work Modes</label>
                <div className="flex gap-2">
                  {['hybrid', 'remote', 'onsite'].map(mode => {
                    const isSelected = formData.work_arrangements.includes(mode);
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleArrayItem('work_arrangements', mode)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-[2px] border capitalize transition-colors ${
                          isSelected
                            ? 'bg-[#991b1b] text-white border-[#991b1b]'
                            : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-[#0a0a0a]">Minimum Allowance Goal</span>
                <span className="font-mono font-bold text-[#991b1b] text-sm">
                  RM {formData.min_allowance.toLocaleString()} / mo
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2500"
                step="100"
                value={formData.min_allowance}
                onChange={e => setFormData({ ...formData, min_allowance: Number(e.target.value) })}
                className="w-full accent-[#991b1b]"
              />
              <p className="text-[11px] text-[#737373]">
                Opportunities offering below this threshold will receive lower allowance scores in your recommendation feed.
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: External Links & Verification */}
        <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-5">
          <div className="border-b border-[#f0f0f0] pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
              <UserCircle size={18} weight="duotone" className="text-[#991b1b]" />
              Digital Portfolio & Links
            </h2>
            <p className="text-xs text-[#737373]">Share proof of work with recruiters.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0a0a0a]">LinkedIn Profile</label>
              <input
                type="url"
                value={formData.linkedin_url}
                onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#0a0a0a]">GitHub Profile</label>
              <input
                type="url"
                value={formData.github_url}
                onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-[#0a0a0a]">Personal Portfolio / Website</label>
              <input
                type="url"
                value={formData.portfolio_url}
                onChange={e => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://yourdomain.com"
                className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
              />
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between p-4 bg-white border border-[#e5e5e5] rounded-[2px]">
          <span className="text-xs text-[#737373]">
            Changes take effect immediately across all recommendation engines.
          </span>
          <Button
            type="submit"
            variant="blood"
            size="md"
            disabled={saving}
            className="text-xs font-bold"
          >
            <FloppyDisk size={16} weight="bold" />
            {saving ? 'Updating...' : 'Save All Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkle,
  Target,
  MapPin,
  CheckCircle,
  X,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash,
  Buildings,
  CurrencyDollar,
  Link as LinkIcon
} from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import type { SkillItem } from '../../types';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleted?: () => void;
}

const COMMON_SKILLS_BY_CATEGORY: Record<string, string[]> = {
  'Tech & Engineering': [
    'Python', 'React', 'TypeScript', 'JavaScript', 'FastAPI', 'Node.js',
    'SQL', 'PostgreSQL', 'Docker', 'AWS', 'Tailwind CSS', 'Git', 'Machine Learning'
  ],
  'Business & Finance': [
    'Advanced Excel', 'Financial Modeling', 'Financial Analysis', 'Power BI',
    'Tableau', 'Accounting', 'Auditing', 'SAP ERP', 'Business Strategy'
  ],
  'Marketing & Media': [
    'SEO', 'Content Strategy', 'Social Media Marketing', 'Copywriting',
    'Photoshop', 'Canva', 'Premiere Pro', 'Public Relations (PR)', 'Google Analytics'
  ],
  'Education & Policy': [
    'Curriculum Design', 'Lesson Planning', 'Public Policy Analysis',
    'Community Advocacy', 'Qualitative Research', 'Project Management'
  ],
};

const POPULAR_ROLES = [
  'Software Engineer Intern',
  'Frontend Developer Intern',
  'Backend Developer Intern',
  'Data Analyst Intern',
  'Financial Analyst Intern',
  'Audit & Assurance Intern',
  'Digital Marketing Intern',
  'Content Creator Intern',
  'Public Relations Intern',
  'Policy & Research Intern',
  'Education & Curriculum Intern',
  'Business Development Intern'
];

const POPULAR_INDUSTRIES = [
  'Technology & Software',
  'Fintech & Banking',
  'Consulting & Professional Services',
  'E-Commerce & Retail',
  'Media, PR & Creative Agencies',
  'Education & Non-Profit',
  'Government & Public Policy',
  'Telecommunications',
  'Healthcare & Biotech'
];

const LOCATIONS = [
  'Kuala Lumpur',
  'Cyberjaya & Putrajaya',
  'Petaling Jaya / Selangor',
  'Penang',
  'Johor Bahru',
  'Remote (Malaysia)'
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleted
}) => {
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State initialized with profile or draft
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
    work_arrangements: ['hybrid', 'remote'],
    min_allowance: 1000,
    portfolio_url: '',
    github_url: '',
    linkedin_url: '',
    bio: ''
  });

  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Tech & Engineering');
  const [newSkillProficiency, setNewSkillProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [customRoleInput, setCustomRoleInput] = useState('');

  // Load existing profile or localStorage draft
  useEffect(() => {
    if (profile) {
      const draft = localStorage.getItem('internscope_onboarding_draft');
      const parsedDraft = draft ? JSON.parse(draft) : {};

      setFormData(prev => ({
        ...prev,
        preferred_name: parsedDraft.preferred_name || profile.preferred_name || user?.full_name || '',
        university_name: parsedDraft.university_name || profile.university_name || (user as any)?.university_name || '',
        degree_level: parsedDraft.degree_level || profile.degree_level || "Bachelor's Degree",
        field_of_study: parsedDraft.field_of_study || profile.field_of_study || user?.program || '',
        year_of_study: parsedDraft.year_of_study || profile.year_of_study || 3,
        grad_year: parsedDraft.grad_year || profile.grad_year || user?.grad_year || 2027,
        skills: (parsedDraft.skills && parsedDraft.skills.length > 0) ? parsedDraft.skills : (profile.skills || []),
        preferred_roles: (parsedDraft.preferred_roles && parsedDraft.preferred_roles.length > 0) ? parsedDraft.preferred_roles : (profile.preferred_roles || []),
        preferred_industries: (parsedDraft.preferred_industries && parsedDraft.preferred_industries.length > 0) ? parsedDraft.preferred_industries : (profile.preferred_industries || []),
        preferred_locations: (parsedDraft.preferred_locations && parsedDraft.preferred_locations.length > 0) ? parsedDraft.preferred_locations : (profile.preferred_locations || ['Kuala Lumpur']),
        work_arrangements: (parsedDraft.work_arrangements && parsedDraft.work_arrangements.length > 0) ? parsedDraft.work_arrangements : (profile.work_arrangements || ['hybrid']),
        min_allowance: parsedDraft.min_allowance || profile.min_allowance || 1000,
        portfolio_url: parsedDraft.portfolio_url || profile.portfolio_url || '',
        github_url: parsedDraft.github_url || profile.github_url || '',
        linkedin_url: parsedDraft.linkedin_url || profile.linkedin_url || '',
        bio: parsedDraft.bio || profile.bio || ''
      }));
    }
  }, [profile, user]);

  // Save drafts locally
  const saveDraft = (data: typeof formData) => {
    setFormData(data);
    localStorage.setItem('internscope_onboarding_draft', JSON.stringify(data));
  };

  const handleAddSkill = (name: string, category = newSkillCategory, proficiency = newSkillProficiency) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (formData.skills.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) return;

    const updated = [...formData.skills, { name: trimmed, category, proficiency }];
    saveDraft({ ...formData, skills: updated });
    setNewSkillName('');
  };

  const handleRemoveSkill = (name: string) => {
    const updated = formData.skills.filter(s => s.name.toLowerCase() !== name.toLowerCase());
    saveDraft({ ...formData, skills: updated });
  };

  const toggleArrayItem = (key: 'preferred_roles' | 'preferred_industries' | 'preferred_locations' | 'work_arrangements', item: string) => {
    const arr = formData[key];
    const exists = arr.includes(item);
    const updated = exists ? arr.filter(x => x !== item) : [...arr, item];
    saveDraft({ ...formData, [key]: updated });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await updateProfile({
        ...formData,
        is_completed: true
      });
      localStorage.removeItem('internscope_onboarding_draft');
      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save career profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border border-[#0a0a0a] rounded-[2px] shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-[#e5e5e5] flex items-center justify-between shrink-0 bg-white">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#991b1b]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
                Student Career Setup
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#0a0a0a]">
              Personalize Your Career Intelligence
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-[2px] transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Progress Bar & Steps Tabs */}
        <div className="px-6 py-3 bg-[#fafafa] border-b border-[#e5e5e5] shrink-0">
          <div className="flex items-center justify-between text-xs font-semibold text-[#737373] mb-2">
            <span>Step {step} of 4</span>
            <span className="text-[#0a0a0a]">
              {step === 1 && 'Academic Profile'}
              {step === 2 && 'Skills & Competencies'}
              {step === 3 && 'Career Interests'}
              {step === 4 && 'Preferences & Links'}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#991b1b] transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-[#0a0a0a]">
          {/* STEP 1: ACADEMIC */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Academic Background
                </h3>
                <p className="text-xs text-[#525252]">
                  Used to match internships requiring specific faculties and academic years.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0a0a0a]">Preferred Name</label>
                  <input
                    type="text"
                    value={formData.preferred_name}
                    onChange={(e) => saveDraft({ ...formData, preferred_name: e.target.value })}
                    placeholder="e.g. Nurul Izzati"
                    className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0a0a0a]">University</label>
                  <input
                    type="text"
                    value={formData.university_name}
                    onChange={(e) => saveDraft({ ...formData, university_name: e.target.value })}
                    placeholder="e.g. Albukhary International University, UM, UTM..."
                    className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-[#0a0a0a]">Degree / Field of Study</label>
                  <input
                    type="text"
                    value={formData.field_of_study}
                    onChange={(e) => saveDraft({ ...formData, field_of_study: e.target.value })}
                    placeholder="e.g. Computer Science / Business Administration / Finance / Media"
                    className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Computer Science', 'Business Analytics', 'Finance & Accounting', 'Media & Communications', 'Public Policy', 'Education'].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => saveDraft({ ...formData, field_of_study: s })}
                        className="text-[10px] px-2 py-0.5 border border-[#e5e5e5] hover:border-[#0a0a0a] rounded-[2px] text-[#525252]"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0a0a0a]">Current Year of Study</label>
                  <select
                    value={formData.year_of_study}
                    onChange={(e) => saveDraft({ ...formData, year_of_study: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  >
                    <option value={1}>Year 1 (Freshman)</option>
                    <option value={2}>Year 2 (Sophomore)</option>
                    <option value={3}>Year 3 (Pre-Final Year / Internship Year)</option>
                    <option value={4}>Year 4 (Final Year)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#0a0a0a]">Expected Graduation Year</label>
                  <input
                    type="number"
                    value={formData.grad_year}
                    onChange={(e) => saveDraft({ ...formData, grad_year: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SKILLS */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Technical & Domain Skills
                </h3>
                <p className="text-xs text-[#525252]">
                  The recommendation engine computes a 35% weighted match based on skills you add here.
                </p>
              </div>

              {/* Added Skills Tags */}
              <div className="p-3 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] min-h-[60px]">
                <div className="text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
                  Your Current Skills ({formData.skills.length})
                </div>
                {formData.skills.length === 0 ? (
                  <p className="text-xs text-[#a3a3a3] italic">No skills added yet. Select suggestions below or type your own.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#0a0a0a] text-xs font-semibold rounded-[2px]"
                      >
                        <span>{s.name}</span>
                        <span className="text-[10px] text-[#737373] uppercase font-normal">({s.proficiency || 'med'})</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s.name)}
                          className="text-[#991b1b] hover:text-black ml-1"
                        >
                          <X size={12} weight="bold" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Custom Skill Input */}
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillName);
                    }
                  }}
                  placeholder="Type a skill (e.g. FastAPI, Financial Modeling, SEO)..."
                  className="flex-1 w-full px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                />
                <select
                  value={newSkillProficiency}
                  onChange={(e: any) => setNewSkillProficiency(e.target.value)}
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
                  onClick={() => handleAddSkill(newSkillName)}
                  className="w-full sm:w-auto text-xs"
                >
                  <Plus size={14} weight="bold" />
                  Add
                </Button>
              </div>

              {/* Category Quick Picks */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                  Quick Add Suggestions by Faculty:
                </div>
                {Object.entries(COMMON_SKILLS_BY_CATEGORY).map(([category, skills]) => (
                  <div key={category} className="space-y-1.5">
                    <span className="text-[11px] font-semibold text-[#737373]">{category}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((skill) => {
                        const isAdded = formData.skills.some(s => s.name.toLowerCase() === skill.toLowerCase());
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => {
                              if (isAdded) handleRemoveSkill(skill);
                              else handleAddSkill(skill, category);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-[2px] border transition-colors ${
                              isAdded
                                ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                                : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                            }`}
                          >
                            {isAdded ? `✓ ${skill}` : `+ ${skill}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CAREER TARGETS */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Target Roles & Industries
                </h3>
                <p className="text-xs text-[#525252]">
                  Select the titles and business sectors you want InternScope to prioritize.
                </p>
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0a0a0a]">
                  Preferred Internship Roles ({formData.preferred_roles.length} selected)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = formData.preferred_roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleArrayItem('preferred_roles', role)}
                        className={`text-xs px-3 py-1.5 rounded-[2px] border font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                            : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                        }`}
                      >
                        {isSelected ? `✓ ${role}` : role}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Role Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    placeholder="Add other role title..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (customRoleInput.trim()) {
                        toggleArrayItem('preferred_roles', customRoleInput.trim());
                        setCustomRoleInput('');
                      }
                    }}
                    className="text-xs"
                  >
                    Add Role
                  </Button>
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-[#0a0a0a]">
                  Target Industries ({formData.preferred_industries.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POPULAR_INDUSTRIES.map((ind) => {
                    const isSelected = formData.preferred_industries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleArrayItem('preferred_industries', ind)}
                        className={`text-left px-3 py-2 text-xs rounded-[2px] border transition-colors flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#0a0a0a] text-white border-[#0a0a0a] font-semibold'
                            : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                        }`}
                      >
                        <span>{ind}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREFERENCES & SOCIAL LINKS */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Work Preferences & Links
                </h3>
                <p className="text-xs text-[#525252]">
                  Set your location filters, minimum compensation threshold, and portfolio links.
                </p>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0a0a0a]">Target Locations</label>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => {
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
              </div>

              {/* Work Arrangement */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#0a0a0a]">Work Arrangement</label>
                <div className="flex gap-3">
                  {[
                    { id: 'hybrid', label: 'Hybrid' },
                    { id: 'remote', label: 'Remote' },
                    { id: 'onsite', label: 'Onsite' }
                  ].map((mode) => {
                    const isSelected = formData.work_arrangements.includes(mode.id);
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => toggleArrayItem('work_arrangements', mode.id)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-[2px] border text-center transition-colors ${
                          isSelected
                            ? 'bg-[#991b1b] text-white border-[#991b1b]'
                            : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Allowance */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#0a0a0a]">Minimum Monthly Allowance Target</span>
                  <span className="font-mono font-bold text-[#991b1b]">
                    RM {formData.min_allowance.toLocaleString()} / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2500"
                  step="100"
                  value={formData.min_allowance}
                  onChange={(e) => saveDraft({ ...formData, min_allowance: Number(e.target.value) })}
                  className="w-full accent-[#991b1b]"
                />
                <div className="flex justify-between text-[10px] text-[#737373]">
                  <span>RM 0 (Any)</span>
                  <span>RM 1,000 (Avg)</span>
                  <span>RM 2,500+ (High)</span>
                </div>
              </div>

              {/* Portfolio Links */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-[#0a0a0a]">Portfolio & Socials (Optional)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => saveDraft({ ...formData, linkedin_url: e.target.value })}
                    placeholder="LinkedIn Profile URL"
                    className="px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => saveDraft({ ...formData, github_url: e.target.value })}
                    placeholder="GitHub Profile URL"
                    className="px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                  <input
                    type="url"
                    value={formData.portfolio_url}
                    onChange={(e) => saveDraft({ ...formData, portfolio_url: e.target.value })}
                    placeholder="Personal Portfolio / Website URL"
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 sm:p-6 border-t border-[#e5e5e5] bg-white flex items-center justify-between shrink-0">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(step - 1)}
              className="text-xs"
            >
              <ArrowLeft size={14} weight="bold" />
              Previous
            </Button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#737373] hover:text-[#0a0a0a] px-3 py-2 font-medium"
            >
              Skip for now
            </button>
          )}

          <div className="flex gap-2">
            {step < 4 ? (
              <Button
                type="button"
                variant="blood"
                size="md"
                onClick={() => setStep(step + 1)}
                className="text-xs"
              >
                Continue
                <ArrowRight size={14} weight="bold" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="blood"
                size="md"
                onClick={handleSubmit}
                disabled={submitting}
                className="text-xs"
              >
                {submitting ? 'Generating Recommendations...' : 'Save & View Recommendations'}
                <Sparkle size={14} weight="fill" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

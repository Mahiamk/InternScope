import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Check,
  Buildings,
  CalendarBlank,
  CurrencyCircleDollar,
  Lightbulb,
  UploadSimple,
  ShieldCheck,
  Eye,
  FloppyDisk,
  WarningCircle,
  Plus,
  Trash,
  ArrowRight,
  ArrowLeft
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompanyLogoInput } from '../components/companies/CompanyLogoInput';

export const ShareExperiencePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { id: paramId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const editId = paramId || searchParams.get('edit');

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    company_id: '',
    company_name: '',
    company_website: '',
    company_logo_url: null as string | null,
    position: '',
    department: '',
    // Step 2
    location: 'Kuala Lumpur',
    work_type: 'hybrid',
    start_date: '',
    end_date: '',
    duration_weeks: 24,
    // Step 3
    responsibilities: '',
    projects: '',
    technology_names: [] as string[],
    is_allowance_disclosed: true,
    allowance: 1500,
    currency: 'MYR',
    allowance_period: 'monthly',
    // Step 4
    overall_rating: 4,
    mentorship_rating: 4,
    culture_rating: 4,
    interview_process: '',
    interview_tips: '',
    interview_difficulty: 3,
    pros: '',
    challenges: '',
    advice: '',
    // Step 5
    anonymous_display: false,
    media: [] as { media_url: string; caption?: string }[],
    terms_agreed: false,
  });

  const [newTechInput, setNewTechInput] = useState('');
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [photoCaptionInput, setPhotoCaptionInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load existing experience if in edit mode
  const { data: existingExperience } = useQuery({
    queryKey: ['experience-edit', editId],
    queryFn: () => (editId ? api.experiences.getById(editId) : null),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existingExperience) {
      setFormData({
        company_id: existingExperience.company_id || existingExperience.company?.id || '',
        company_name: existingExperience.company?.name || '',
        company_website: existingExperience.company?.website || '',
        company_logo_url: existingExperience.company?.logo_url || null,
        position: existingExperience.position || '',
        department: existingExperience.department || '',
        location: existingExperience.location || 'Kuala Lumpur',
        work_type: existingExperience.work_type || 'hybrid',
        start_date: existingExperience.start_date || '',
        end_date: existingExperience.end_date || '',
        duration_weeks: existingExperience.duration_weeks || 24,
        responsibilities: existingExperience.responsibilities || '',
        projects: existingExperience.projects || '',
        technology_names: existingExperience.technologies?.map((t) => t.name) || [],
        is_allowance_disclosed: existingExperience.is_allowance_disclosed,
        allowance: existingExperience.allowance || 1500,
        currency: existingExperience.currency || 'MYR',
        allowance_period: existingExperience.allowance_period || 'monthly',
        overall_rating: existingExperience.overall_rating || 4,
        mentorship_rating: existingExperience.mentorship_rating || 4,
        culture_rating: existingExperience.culture_rating || 4,
        interview_process: existingExperience.interview_process || '',
        interview_tips: existingExperience.interview_tips || '',
        interview_difficulty: existingExperience.interview_difficulty || 3,
        pros: existingExperience.pros || '',
        challenges: existingExperience.challenges || '',
        advice: existingExperience.advice || '',
        anonymous_display: existingExperience.anonymous_display || false,
        media: existingExperience.media?.map((m) => ({ media_url: m.media_url, caption: m.caption })) || [],
        terms_agreed: true,
      });
    }
  }, [existingExperience]);

  // Restore draft from localStorage if available (only in create mode)
  useEffect(() => {
    if (!editId) {
      const saved = localStorage.getItem('internscope_experience_draft');
      if (saved) {
        try {
          setFormData(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, [editId]);

  const saveDraft = () => {
    localStorage.setItem('internscope_experience_draft', JSON.stringify(formData));
    alert('Draft saved locally! You can return and continue anytime.');
  };

  const { data: companies } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => api.companies.list({ limit: 100 }),
  });

  const submitMutation = useMutation({
    mutationFn: (status: 'PUBLISHED' | 'DRAFT') => {
      if (!user) {
        throw new Error('Please sign in with your student account before publishing.');
      }
      const { terms_agreed, ...rest } = formData;
      const payload = {
        ...rest,
        status,
        start_date: rest.start_date ? rest.start_date : null,
        end_date: rest.end_date ? rest.end_date : null,
        duration_weeks: rest.duration_weeks ? Number(rest.duration_weeks) : null,
        allowance: rest.is_allowance_disclosed && rest.allowance ? Number(rest.allowance) : null,
      };

      if (editId) {
        return api.experiences.update(editId, payload);
      }
      return api.experiences.create(payload);
    },
    onSuccess: (data) => {
      if (!editId) {
        localStorage.removeItem('internscope_experience_draft');
      }
      navigate(`/experiences/${data.id}`);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Submission failed');
    },
  });

  const validateStep = (step: number) => {
    setFormError(null);
    if (step === 1) {
      if (!formData.company_name.trim() || !formData.position.trim()) {
        setFormError('Please enter both Company Name and Position.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.location.trim()) {
        setFormError('Please specify the internship location.');
        return false;
      }
    } else if (step === 3) {
      if (!formData.responsibilities.trim() || formData.responsibilities.length < 20) {
        setFormError('Please write at least 20 characters describing your core responsibilities.');
        return false;
      }
    } else if (step === 5) {
      if (!user) {
        setFormError('Please sign in to your student account before submitting.');
        return false;
      }
      if (!formData.terms_agreed) {
        setFormError('You must agree to the publishing guidelines and confirm you are not sharing confidential company secrets.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setFormError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addTech = () => {
    const trimmed = newTechInput.trim();
    if (trimmed && !formData.technology_names.includes(trimmed)) {
      setFormData({
        ...formData,
        technology_names: [...formData.technology_names, trimmed],
      });
      setNewTechInput('');
    }
  };

  const removeTech = (index: number) => {
    const updated = [...formData.technology_names];
    updated.splice(index, 1);
    setFormData({ ...formData, technology_names: updated });
  };

  const addPhoto = () => {
    if (photoUrlInput.trim()) {
      setFormData({
        ...formData,
        media: [...formData.media, { media_url: photoUrlInput.trim(), caption: photoCaptionInput.trim() }],
      });
      setPhotoUrlInput('');
      setPhotoCaptionInput('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      setFormError('Please sign in with your student account to upload images.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormError(null);
    try {
      const res = await api.uploads.uploadImage(file);
      setFormData({
        ...formData,
        media: [...formData.media, { media_url: res.url, caption: photoCaptionInput.trim() || file.name }],
      });
      setPhotoCaptionInput('');
    } catch (err: any) {
      setFormError(err.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const stepTitles = [
    'Role & Company',
    'Location & Dates',
    'Work & Allowance',
    'Culture & Interview',
    'Privacy & Submit',
  ];

  return (
    <div className="max-w-3xl mx-auto py-2 pb-10 space-y-8">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] pb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#991b1b]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
              {editId ? 'Edit Internship Experience' : 'Share Internship Experience'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#525252]">
            {editId ? 'Update your review, company details, or verified logo.' : 'Help fellow university juniors prepare for industrial training.'}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={saveDraft} title="Save draft to continue later">
          <FloppyDisk size={16} weight="duotone" />
          <span className="hidden sm:inline">Save Draft</span>
        </Button>
      </div>

      {/* Auth warning banner if not logged in */}
      {!user && (
        <div className="p-4 bg-[#fff1f2] border border-[#fecdd3] rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#991b1b]">
            <WarningCircle size={18} weight="fill" className="shrink-0" />
            <span>You are not signed in. You can draft the form, but need to sign in to upload photos or publish.</span>
          </div>
          <Link to="/login">
            <Button variant="blood" size="sm">
              Sign In Now
            </Button>
          </Link>
        </div>
      )}

      {/* 5-Step Visual Progress Indicator (Swiss minimal bar) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#737373] font-medium">
          <span>Step {currentStep} of {totalSteps}: <strong className="text-[#0a0a0a]">{stepTitles[currentStep - 1]}</strong></span>
          <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-[#f5f5f5] h-1.5 rounded-[2px] overflow-hidden">
          <div
            className="bg-[#991b1b] h-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Error alert */}
      {formError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-xs text-[#991b1b] flex items-center gap-2 rounded-[2px]">
          <WarningCircle size={18} weight="fill" className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Multi-step Form Body */}
      <div className="bg-white border border-[#e5e5e5] p-6 sm:p-8 rounded-[2px] space-y-6">
        {/* STEP 1: Company & Role */}
        {currentStep === 1 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Company Name *
              </label>
              <input
                type="text"
                list="companies-list"
                value={formData.company_name}
                onChange={(e) => {
                  const val = e.target.value;
                  const match = companies?.find((c) => c.name.toLowerCase() === val.toLowerCase());
                  if (match) {
                    setFormData((prev) => ({
                      ...prev,
                      company_name: val,
                      company_id: match.id,
                      company_website: prev.company_website || match.website || '',
                      company_logo_url: prev.company_logo_url || match.logo_url || null,
                    }));
                  } else {
                    setFormData((prev) => ({ ...prev, company_name: val }));
                  }
                }}
                placeholder="e.g. Grab Malaysia, PETRONAS, Intel..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
              <datalist id="companies-list">
                {companies?.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Company Website URL & Automatic Logo Resolution */}
            <CompanyLogoInput
              websiteUrl={formData.company_website}
              onWebsiteUrlChange={(url) => setFormData((prev) => ({ ...prev, company_website: url }))}
              logoUrl={formData.company_logo_url}
              onLogoUrlChange={(logo) => setFormData((prev) => ({ ...prev, company_logo_url: logo }))}
              companyName={formData.company_name}
              onCompanyMatched={(matched) => {
                setFormData((prev) => ({
                  ...prev,
                  company_id: matched.id,
                  company_name: prev.company_name || matched.name,
                  company_website: prev.company_website || matched.website || '',
                  company_logo_url: prev.company_logo_url || matched.logo_url || null,
                }));
              }}
            />

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Internship Position Title *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Software Engineer Intern, Data Analyst Intern..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Department / Faculty / Team (Optional)
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="e.g. Business Strategy, Newsroom, Brand Marketing, Public Policy, TESL, Audit..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="text-[10px] text-[#737373] self-center mr-1">Quick Select:</span>
                {[
                  'Business & Management',
                  'Media & Communications',
                  'Marketing & PR',
                  'Politics & Public Policy',
                  'Education & Teaching',
                  'Finance & Accounting',
                  'Technology & Engineering',
                ].map((depName) => (
                  <button
                    key={depName}
                    type="button"
                    onClick={() => setFormData({ ...formData, department: depName })}
                    className="text-[11px] px-2 py-0.5 bg-[#f5f5f5] hover:bg-[#e5e5e5] hover:text-[#0a0a0a] border border-[#e5e5e5] rounded-[2px] text-[#525252] transition-colors"
                  >
                    + {depName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location & Dates */}
        {currentStep === 2 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Work Location / City *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Kuala Lumpur, Petaling Jaya, Penang..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Work Arrangement *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['onsite', 'hybrid', 'remote'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, work_type: type })}
                    className={`py-2 text-xs font-medium uppercase tracking-wider border rounded-[2px] capitalize transition-colors ${
                      formData.work_type === type
                        ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                        : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#a3a3a3]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                  Internship Duration (Weeks)
                </label>
                <input
                  type="number"
                  min="4"
                  max="52"
                  value={formData.duration_weeks}
                  onChange={(e) => setFormData({ ...formData, duration_weeks: parseInt(e.target.value) || 24 })}
                  className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Work & Allowance */}
        {currentStep === 3 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Core Responsibilities *
              </label>
              <textarea
                rows={4}
                value={formData.responsibilities}
                onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                placeholder="What did your daily work look like? What tasks and pipelines did you handle?"
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Projects Completed (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.projects}
                onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                placeholder="Describe a notable feature or project you shipped..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            {/* Skills & Tools */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Skills, Methodologies & Tools Used
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTechInput}
                  onChange={(e) => setNewTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTech(); } }}
                  placeholder="e.g. Financial Modeling, Adobe Premiere, Policy Analysis, Python, SEO, Lesson Planning..."
                  className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
                />
                <Button type="button" variant="secondary" size="md" onClick={addTech}>
                  Add
                </Button>
              </div>

              {/* Quick Suggestion Pills Across Faculties */}
              <div className="p-3 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#737373] block">
                  Click to add relevant skills by discipline:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    // Business
                    'Business Strategy', 'Supply Chain', 'ERP (SAP)', 'Excel Modeling',
                    // Media
                    'Adobe Premiere Pro', 'Broadcast Journalism', 'Media Relations', 'News Writing',
                    // Marketing
                    'Digital Marketing', 'Google Analytics 4', 'Meta Ads', 'Brand Strategy', 'Canva',
                    // Politics
                    'Policy Analysis', 'Legislative Research', 'Qualitative Research', 'SPSS',
                    // Education
                    'Lesson Planning', 'Classroom Management', 'TESL Pedagogy', 'Curriculum Design',
                    // Finance
                    'Financial Modeling', 'Audit & Assurance', 'IFRS Standards', 'Bloomberg Terminal',
                    // Tech
                    'Python', 'React', 'Docker', 'Power BI', 'SQL', 'Figma'
                  ].map((skillTag) => {
                    const alreadyAdded = formData.technology_names.includes(skillTag);
                    return (
                      <button
                        key={skillTag}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => {
                          if (!alreadyAdded) {
                            setFormData({
                              ...formData,
                              technology_names: [...formData.technology_names, skillTag]
                            });
                          }
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-[2px] border transition-colors ${
                          alreadyAdded
                            ? 'bg-[#e5e5e5] text-[#a3a3a3] border-[#d4d4d4] cursor-default'
                            : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a] hover:text-[#0a0a0a]'
                        }`}
                      >
                        {alreadyAdded ? '✓' : '+'} {skillTag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.technology_names.map((t, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-[#f5f5f5] border border-[#e5e5e5] text-[#171717] rounded-[2px]"
                  >
                    {t}
                    <button type="button" onClick={() => removeTech(idx)} className="hover:text-[#991b1b]">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Allowance Disclosure */}
            <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-[2px] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_allowance_disclosed}
                  onChange={(e) => setFormData({ ...formData, is_allowance_disclosed: e.target.checked })}
                  className="accent-[#991b1b]"
                />
                <span className="text-xs font-semibold text-[#0a0a0a]">
                  Disclose Monthly Allowance (Optional but helps peers)
                </span>
              </label>

              {formData.is_allowance_disclosed && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#737373]">Amount (MYR)</label>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={formData.allowance}
                      onChange={(e) => setFormData({ ...formData, allowance: parseFloat(e.target.value) || 0 })}
                      className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 focus:border-[#0a0a0a] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-[#737373]">Payment Period</label>
                    <select
                      value={formData.allowance_period}
                      onChange={(e) => setFormData({ ...formData, allowance_period: e.target.value })}
                      className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="hourly">Hourly</option>
                      <option value="total">Lump Sum Total</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: Culture & Interview */}
        {currentStep === 4 && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Ratings */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-[2px]">
              <div className="space-y-1 text-center">
                <label className="block text-[11px] font-semibold text-[#0a0a0a]">Overall Experience</label>
                <select
                  value={formData.overall_rating}
                  onChange={(e) => setFormData({ ...formData, overall_rating: parseInt(e.target.value) })}
                  className="w-full text-xs bg-white border border-[#e5e5e5] p-2 rounded-[2px] text-center"
                >
                  <option value={5}>5 / 5 - Exceptional</option>
                  <option value={4}>4 / 5 - Good</option>
                  <option value={3}>3 / 5 - Average</option>
                  <option value={2}>2 / 5 - Poor</option>
                  <option value={1}>1 / 5 - Disappointing</option>
                </select>
              </div>

              <div className="space-y-1 text-center">
                <label className="block text-[11px] font-semibold text-[#0a0a0a]">Senior Mentorship</label>
                <select
                  value={formData.mentorship_rating}
                  onChange={(e) => setFormData({ ...formData, mentorship_rating: parseInt(e.target.value) })}
                  className="w-full text-xs bg-white border border-[#e5e5e5] p-2 rounded-[2px] text-center"
                >
                  <option value={5}>5 / 5 - High Guidance</option>
                  <option value={4}>4 / 5 - Helpful</option>
                  <option value={3}>3 / 5 - Minimal</option>
                  <option value={2}>2 / 5 - Absent</option>
                  <option value={1}>1 / 5 - Neglected</option>
                </select>
              </div>

              <div className="space-y-1 text-center">
                <label className="block text-[11px] font-semibold text-[#0a0a0a]">Workplace Culture</label>
                <select
                  value={formData.culture_rating}
                  onChange={(e) => setFormData({ ...formData, culture_rating: parseInt(e.target.value) })}
                  className="w-full text-xs bg-white border border-[#e5e5e5] p-2 rounded-[2px] text-center"
                >
                  <option value={5}>5 / 5 - Welcoming & Fair</option>
                  <option value={4}>4 / 5 - Positive</option>
                  <option value={3}>3 / 5 - Neutral</option>
                  <option value={2}>2 / 5 - High Stress</option>
                  <option value={1}>1 / 5 - Toxic</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Interview Process & Questions
              </label>
              <textarea
                rows={3}
                value={formData.interview_process}
                onChange={(e) => setFormData({ ...formData, interview_process: e.target.value })}
                placeholder="How many rounds? What coding or technical questions were asked?"
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Interview Preparation Tips
              </label>
              <textarea
                rows={3}
                value={formData.interview_tips}
                onChange={(e) => setFormData({ ...formData, interview_tips: e.target.value })}
                placeholder="What topics should applicants study? Any specific tools or resources?"
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#166534] uppercase tracking-wider">
                  Pros & Highlights
                </label>
                <textarea
                  rows={3}
                  value={formData.pros}
                  onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
                  placeholder="e.g. Free coffee, learning curve, supportive manager..."
                  className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-[#991b1b] uppercase tracking-wider">
                  Challenges
                </label>
                <textarea
                  rows={3}
                  value={formData.challenges}
                  onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                  placeholder="e.g. Tight deadlines, bureaucracy..."
                  className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Advice for Future Interns
              </label>
              <textarea
                rows={2}
                value={formData.advice}
                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                placeholder="Key lessons learned or recommendations for juniors..."
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 5: Photos & Privacy & Submission */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Photo Uploads */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Showcase Photos (Optional)
              </label>
              <p className="text-xs text-[#737373]">
                Upload team or demo photos. Do NOT upload confidential source code, customer records, or credentials.
              </p>

              <div className="p-4 border-2 border-dashed border-[#d4d4d4] text-center space-y-2 rounded-[2px]">
                <input
                  type="file"
                  id="media-file-input"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="media-file-input"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#f5f5f5] hover:bg-[#e5e5e5] text-xs font-medium text-[#0a0a0a] rounded-[2px]"
                >
                  <UploadSimple size={16} weight="duotone" />
                  {uploadingImage ? 'Sanitizing & Uploading...' : 'Upload Image File'}
                </label>
              </div>

              {/* Photos List */}
              {formData.media.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {formData.media.map((m, idx) => (
                    <div key={idx} className="relative border border-[#e5e5e5] p-2 rounded-[2px]">
                      <img src={m.media_url} alt="Uploaded" className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.media];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, media: updated });
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-[2px]"
                      >
                        <Trash size={12} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Privacy settings */}
            <div className="p-4 bg-[#f5f5f5] border border-[#e5e5e5] rounded-[2px] space-y-3">
              <h3 className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Privacy & Anonymity
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.anonymous_display}
                  onChange={(e) => setFormData({ ...formData, anonymous_display: e.target.checked })}
                  className="accent-[#991b1b]"
                />
                <span className="text-xs text-[#171717]">
                  Publish anonymously as "Anonymous Senior" (your name will not be publicly displayed)
                </span>
              </label>
            </div>

            {/* Terms Consent */}
            <div className="p-4 border border-[#e5e5e5] rounded-[2px] space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terms_agreed}
                  onChange={(e) => setFormData({ ...formData, terms_agreed: e.target.checked })}
                  className="accent-[#991b1b] mt-0.5"
                />
                <span className="text-xs text-[#525252] leading-relaxed">
                  I confirm that this experience report is authentic, based on my actual training period, and does not disclose proprietary commercial trade secrets, confidential client personal information, or proprietary IP.
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-[#e5e5e5]">
          {currentStep > 1 ? (
            <Button type="button" variant="outline" size="md" onClick={prevStep}>
              <ArrowLeft size={16} weight="bold" />
              Previous
            </Button>
          ) : (
            <div />
          )}

          {currentStep < totalSteps ? (
            <Button type="button" variant="primary" size="md" onClick={nextStep}>
              Next Step
              <ArrowRight size={16} weight="bold" />
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => submitMutation.mutate('DRAFT')}
                isLoading={submitMutation.isPending}
              >
                Save as Draft
              </Button>
              <Button
                type="button"
                variant="blood"
                size="md"
                onClick={() => {
                  if (validateStep(5)) {
                    submitMutation.mutate('PUBLISHED');
                  }
                }}
                isLoading={submitMutation.isPending}
              >
                Publish Experience
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

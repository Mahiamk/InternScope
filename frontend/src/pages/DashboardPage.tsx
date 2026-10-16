import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCircle,
  Kanban,
  BookmarkSimple,
  Article,
  Plus,
  Trash,
  PencilSimple,
  CheckCircle,
  Clock,
  Briefcase,
  Buildings,
  WarningCircle,
  Sparkle,
  TrendUp,
  MapPin,
  ArrowRight,
  ArrowSquareOut,
  Compass,
  Lightbulb,
  Bookmark,
  CalendarCheck,
  FileText
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { Modal } from '../components/ui/Modal';
import { OnboardingModal } from '../components/profile/OnboardingModal';
import type {
  ApplicationTrackerItem,
  RecommendedOpportunityItem,
  RecommendedExperienceItem,
  SkillGapAnalysisResponse
} from '../types';

export const DashboardPage: React.FC = () => {
  const { user, profile, updateProfile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = (tabParam === 'bookmarks' || tabParam === 'my_reports' || tabParam === 'experiences' || tabParam === 'tracker')
    ? (tabParam === 'my_reports' ? 'experiences' : tabParam)
    : 'tracker';

  const setActiveTab = (tab: 'tracker' | 'bookmarks' | 'experiences') => {
    setSearchParams({ tab });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationTrackerItem | null>(null);
  const [onboardingModalOpen, setOnboardingModalOpen] = useState(false);

  // Recommendations state
  const [topRecs, setTopRecs] = useState<RecommendedOpportunityItem[]>([]);
  const [topExperiences, setTopExperiences] = useState<RecommendedExperienceItem[]>([]);
  const [skillGap, setSkillGap] = useState<SkillGapAnalysisResponse | null>(null);
  const [recsLoading, setRecsLoading] = useState(true);

  // Instant action feedback
  const [bookmarkedOppIds, setBookmarkedOppIds] = useState<Set<string>>(new Set());
  const [trackedOppIds, setTrackedOppIds] = useState<Set<string>>(new Set());
  const [addingSkillName, setAddingSkillName] = useState<string | null>(null);
  const [addedSkillsSet, setAddedSkillsSet] = useState<Set<string>>(new Set());

  // Form State for Application Tracker
  const [appForm, setAppForm] = useState({
    company_name: '',
    position: '',
    status: 'INTERESTED',
    applied_date: '',
    deadline: '',
    notes: '',
  });

  // Queries
  const { data: applications, refetch: refetchApps } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => api.applications.list(),
  });

  const { data: bookmarks, refetch: refetchBookmarks } = useQuery({
    queryKey: ['my-bookmarks'],
    queryFn: () => api.bookmarks.list(),
  });

  const {
    data: myExperiences,
    isLoading: myExperiencesLoading,
    refetch: refetchMyExperiences
  } = useQuery({
    queryKey: ['my-shared-experiences'],
    queryFn: () => api.experiences.getMyExperiences(),
  });

  // Load recommendations, skill gap, and peer experiences
  useEffect(() => {
    let isMounted = true;
    const loadCareerIntel = async () => {
      setRecsLoading(true);
      try {
        const [recsRes, gapRes, expRes] = await Promise.all([
          api.recommendations.getOpportunities({ limit: 3 }),
          api.recommendations.getSkillGap(),
          api.recommendations.getExperiences(3)
        ]);
        if (isMounted) {
          setTopRecs(recsRes.items);
          setSkillGap(gapRes);
          setTopExperiences(expRes);
        }
      } catch (err) {
        console.error('Failed to fetch recommendations preview', err);
      } finally {
        if (isMounted) setRecsLoading(false);
      }
    };

    loadCareerIntel();
    return () => { isMounted = false; };
  }, [profile?.skills, profile?.preferred_roles]);

  // Handle bookmarking an opportunity
  const handleToggleBookmark = async (oppId: string) => {
    try {
      const res = await api.bookmarks.toggle('OPPORTUNITY', oppId);
      setBookmarkedOppIds(prev => {
        const next = new Set(prev);
        if (res.bookmarked) next.add(oppId);
        else next.delete(oppId);
        return next;
      });
      refetchBookmarks();
    } catch (err: any) {
      alert(err.message || 'Bookmark action failed');
    }
  };

  // Handle quick tracking
  const handleQuickTrack = async (opp: RecommendedOpportunityItem['opportunity']) => {
    try {
      await api.applications.create({
        company_name: opp.company?.name || 'Company',
        company_id: opp.company_id,
        position: opp.title,
        status: 'INTERESTED',
        notes: `Recommended vacancy from InternScope. Direct apply: ${opp.apply_url}`
      });
      setTrackedOppIds(prev => new Set(prev).add(opp.id));
      refetchApps();
    } catch (err: any) {
      alert(err.message || 'Application tracking failed');
    }
  };

  // Handle 1-click skill addition from skill gap widget
  const handleAddGapSkill = async (skillName: string) => {
    if (!profile) return;
    setAddingSkillName(skillName);
    try {
      const currentSkills = profile.skills || [];
      const updated = [
        ...currentSkills,
        { name: skillName, category: 'General', proficiency: 'intermediate' as const }
      ];
      await updateProfile({ skills: updated });
      setAddedSkillsSet(prev => new Set(prev).add(skillName));
      await refreshProfile();
    } catch (err: any) {
      alert(err.message || 'Failed to add skill');
    } finally {
      setAddingSkillName(null);
    }
  };

  // Mutations for tracker modal
  const createAppMutation = useMutation({
    mutationFn: (data: any) => api.applications.create(data),
    onSuccess: () => {
      refetchApps();
      closeModal();
    },
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.applications.update(id, data),
    onSuccess: () => {
      refetchApps();
      closeModal();
    },
  });

  const deleteAppMutation = useMutation({
    mutationFn: (id: string) => api.applications.delete(id),
    onSuccess: () => {
      refetchApps();
    },
  });

  const deleteExperienceMutation = useMutation({
    mutationFn: (id: string) => api.experiences.delete(id),
    onSuccess: () => {
      refetchMyExperiences();
      queryClient.invalidateQueries({ queryKey: ['my-shared-experiences'] });
    },
  });

  const openCreateModal = () => {
    setEditingApp(null);
    setAppForm({
      company_name: '',
      position: '',
      status: 'INTERESTED',
      applied_date: '',
      deadline: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (app: ApplicationTrackerItem) => {
    setEditingApp(app);
    setAppForm({
      company_name: app.company_name,
      position: app.position,
      status: app.status,
      applied_date: app.applied_date || '',
      deadline: app.deadline || '',
      notes: app.notes || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingApp(null);
  };

  const handleAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.company_name.trim() || !appForm.position.trim()) return;

    if (editingApp) {
      updateAppMutation.mutate({
        id: editingApp.id,
        data: {
          ...appForm,
          applied_date: appForm.applied_date || null,
          deadline: appForm.deadline || null,
        },
      });
    } else {
      createAppMutation.mutate({
        ...appForm,
        applied_date: appForm.applied_date || null,
        deadline: appForm.deadline || null,
      });
    }
  };

  const stages: { key: ApplicationTrackerItem['status']; label: string; color: string }[] = [
    { key: 'INTERESTED', label: 'Interested', color: 'border-neutral-300' },
    { key: 'APPLIED', label: 'Applied', color: 'border-blue-400' },
    { key: 'INTERVIEWING', label: 'Interviewing', color: 'border-amber-400' },
    { key: 'OFFERED', label: 'Offered', color: 'border-emerald-500' },
    { key: 'REJECTED', label: 'Rejected', color: 'border-red-400' },
  ];

  const completionPct = profile?.completion?.percentage ?? (profile?.is_completed ? 100 : 30);
  const isProfileComplete = profile?.is_completed || completionPct >= 80;
  const [dismissWelcomeBanner, setDismissWelcomeBanner] = useState(
    () => localStorage.getItem('internscope_onboarding_dismissed') === 'true'
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 select-text">
      {/* 1. ONBOARDING WELCOME BANNER FOR INCOMPLETE PROFILES */}
      {!isProfileComplete && !dismissWelcomeBanner && (
        <div className="bg-red-50/70 border border-red-200 p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#991b1b] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[2px] bg-[#991b1b] text-white flex items-center justify-center shrink-0">
              <Sparkle size={18} weight="fill" />
            </div>
            <div>
              <strong className="font-bold text-[#0a0a0a] block">Set Up Your Career Profile</strong>
              <span className="text-[#525252]">
                Personalize your internship feed, target roles, and unlock explainable recommendation scores.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="blood"
              size="sm"
              onClick={() => setOnboardingModalOpen(true)}
              className="text-xs"
            >
              Start 2-Min Setup
            </Button>
            <button
              onClick={() => {
                localStorage.setItem('internscope_onboarding_dismissed', 'true');
                setDismissWelcomeBanner(true);
              }}
              className="text-xs text-[#737373] hover:text-[#0a0a0a] px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. STUDENT WELCOME & READINESS HEADER CARD */}
      <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-14 h-14 bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-xl rounded-[2px] shrink-0">
            {profile?.preferred_name?.charAt(0) || user?.full_name?.charAt(0) || 'S'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-[#0a0a0a]">
                Welcome back, {profile?.preferred_name || user?.full_name}
              </h1>
              <Badge variant={isProfileComplete ? 'success' : 'blood'} size="sm">
                {isProfileComplete ? 'Profile Active' : 'Setup In Progress'}
              </Badge>
            </div>
            <p className="text-xs text-[#525252]">
              {profile?.field_of_study || user?.program || 'Student'} • Year {profile?.year_of_study || 3} • Class of {profile?.grad_year || user?.grad_year || 2026}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#737373]">
              <span>{user?.email}</span>
              {profile?.skills && profile.skills.length > 0 && (
                <>
                  <span>•</span>
                  <span>{profile.skills.length} Skills Listed</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completeness Action Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="p-3 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] min-w-[210px] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0a0a0a]">Profile Readiness</span>
              <span className="font-mono font-bold text-[#991b1b]">{completionPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#e5e5e5] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isProfileComplete ? 'bg-[#16a34a]' : 'bg-[#991b1b]'
                }`}
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="text-[10px] text-[#737373] truncate">
              {isProfileComplete ? '✓ Recommendations calibrated' : 'Complete profile to boost score'}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {!isProfileComplete ? (
              <Button
                variant="blood"
                size="sm"
                onClick={() => setOnboardingModalOpen(true)}
                className="text-xs"
              >
                <Sparkle size={14} weight="bold" />
                Complete Profile
              </Button>
            ) : (
              <Link to="/profile">
                <Button variant="outline" size="sm" className="text-xs w-full">
                  Edit Profile
                </Button>
              </Link>
            )}

            <Button variant="outline" size="sm" onClick={openCreateModal} className="text-xs">
              <Plus size={14} weight="bold" />
              Track Application
            </Button>
          </div>
        </div>
      </div>

      {/* 3. RECOMMENDED INTERNSHIPS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#991b1b]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                Top Recommendations For You
              </h2>
            </div>
            <p className="text-xs text-[#737373]">
              Active vacancies matched using deterministic scoring across your skills, role target, and faculty.
            </p>
          </div>

          <Link
            to="/recommendations"
            className="text-xs font-bold text-[#991b1b] hover:underline flex items-center gap-1"
          >
            <span>View All Recommendations</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>

        {recsLoading ? (
          <div className="py-12 text-center text-xs text-[#737373] space-y-2">
            <div className="w-5 h-5 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Evaluating recommendation scoring models...</p>
          </div>
        ) : topRecs.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] p-8 text-center rounded-[2px] space-y-2">
            <Briefcase size={28} weight="duotone" className="mx-auto text-[#737373]" />
            <h3 className="text-sm font-bold text-[#0a0a0a]">No Exact Matches Yet</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Add your target roles and technical skills in your career profile to activate matching.
            </p>
            <Button
              variant="blood"
              size="sm"
              onClick={() => setOnboardingModalOpen(true)}
              className="text-xs mt-2"
            >
              Set Up Career Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecs.map((item) => {
              const { opportunity: opp, match_score, reasons, matched_skills } = item;
              const isBookmarked = bookmarkedOppIds.has(opp.id);
              const isTracked = trackedOppIds.has(opp.id);

              return (
                <div
                  key={opp.id}
                  className="bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all duration-200 rounded-[2px] p-4 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <CompanyLogo
                          name={opp.company?.name}
                          logoUrl={opp.company?.logo_url}
                          size="xs"
                        />
                        <span className="text-xs font-bold text-[#737373] truncate">
                          {opp.company?.name}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-[2px] shrink-0 ${
                          match_score >= 80
                            ? 'bg-red-50 text-[#991b1b] border border-red-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {match_score}% Match
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#0a0a0a] tracking-tight line-clamp-1 hover:text-[#991b1b]">
                      {opp.title}
                    </h3>

                    <div className="text-xs text-[#525252] flex items-center gap-2">
                      <span className="truncate">{opp.location}</span>
                      <span>•</span>
                      <span className="capitalize">{opp.work_type}</span>
                    </div>

                    {/* Matched Skills pills */}
                    {matched_skills && matched_skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {matched_skills.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-800 border border-green-200 rounded-[2px]"
                          >
                            ✓ {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {reasons && reasons.length > 0 && (
                      <p className="text-[11px] text-[#525252] bg-[#fafafa] p-2 rounded-[2px] line-clamp-2">
                        {reasons[0]}
                      </p>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-[#f5f5f5] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#0a0a0a]">
                        {opp.allowance ? `RM ${opp.allowance.toLocaleString()}/mo` : 'Allowance Disclosed'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(opp.id)}
                          className={`p-1.5 rounded-[2px] border transition-colors ${
                            isBookmarked
                              ? 'bg-red-50 text-[#991b1b] border-red-200'
                              : 'text-[#737373] hover:text-[#0a0a0a] border-[#e5e5e5]'
                          }`}
                          title="Bookmark Opportunity"
                        >
                          <Bookmark size={13} weight={isBookmarked ? 'fill' : 'regular'} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickTrack(opp)}
                          className={`p-1.5 rounded-[2px] border transition-colors ${
                            isTracked
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'text-[#737373] hover:text-[#0a0a0a] border-[#e5e5e5]'
                          }`}
                          title="Track in Applications"
                        >
                          <CalendarCheck size={13} weight={isTracked ? 'fill' : 'regular'} />
                        </button>
                      </div>
                    </div>

                    <a
                      href={opp.apply_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full"
                    >
                      <Button variant="blood" size="sm" className="w-full text-xs justify-center">
                        <span>Apply on Company Site</span>
                        <ArrowSquareOut size={13} weight="bold" />
                      </Button>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI CV Analyser Banner */}
      <div className="bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] p-5 rounded-[2px] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[2px] bg-red-50 dark:bg-red-950/30 text-[#991b1b] dark:text-[#ef4444] flex items-center justify-center shrink-0">
            <FileText size={22} weight="duotone" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#0a0a0a] dark:text-white">
                AI CV Analyser & Recruiter Scoring
              </h3>
              <Badge variant="blood" size="sm" className="gap-1 font-mono">
                <Sparkle size={10} weight="fill" />
                Gemini Powered
              </Badge>
            </div>
            <p className="text-xs text-[#737373] dark:text-[#888888] max-w-xl">
              Upload your PDF resume or paste text to evaluate ATS compatibility, benchmark quantifiable impact metrics, and receive intelligent line-by-line rewrite suggestions.
            </p>
          </div>
        </div>
        <Link to="/cv-analyser" className="shrink-0 w-full sm:w-auto">
          <Button variant="blood" size="sm" className="w-full sm:w-auto gap-1.5 font-semibold text-xs shadow-xs">
            <span>Launch CV Analyser</span>
            <ArrowRight size={13} weight="bold" />
          </Button>
        </Link>
      </div>

      {/* 4. SKILL GAP SUMMARY & 1-CLICK ADOPTION WIDGET */}
      {skillGap && skillGap.in_demand_missing_skills && skillGap.in_demand_missing_skills.length > 0 && (
        <div className="bg-[#fafafa] border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e5e5e5] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-[2px] bg-red-50 text-[#991b1b] flex items-center justify-center">
                <TrendUp size={16} weight="bold" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Skill Gap Summary: High-Demand Competencies
                </h3>
                <p className="text-[11px] text-[#525252]">
                  Skills requested by active vacancies across your target roles that you haven't listed yet.
                </p>
              </div>
            </div>

            <Link to="/skill-gap" className="text-xs text-[#991b1b] font-bold hover:underline whitespace-nowrap">
              Full Analyzer →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {skillGap.in_demand_missing_skills.slice(0, 3).map((item) => {
              const isAdded = addedSkillsSet.has(item.skill);
              const isAdding = addingSkillName === item.skill;

              return (
                <div
                  key={item.skill}
                  className="bg-white border border-[#e5e5e5] p-3 rounded-[2px] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <strong className="text-[#0a0a0a] block">{item.skill}</strong>
                    <span className="text-[10px] text-[#737373]">
                      Demanded in {item.demand_count} open postings
                    </span>
                  </div>

                  {isAdded ? (
                    <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-[2px] border border-green-200">
                      Added!
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAddGapSkill(item.skill)}
                      disabled={isAdding}
                      className="text-[11px] font-semibold text-[#991b1b] hover:bg-red-50 px-2 py-1 rounded-[2px] border border-[#e5e5e5] hover:border-[#991b1b] transition-colors"
                    >
                      {isAdding ? 'Adding...' : '+ Add'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. PEER LEARNING: RELEVANT ALUMNI REVIEWS */}
      {topExperiences.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#991b1b]" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                  Peer Insights from University Seniors
                </h2>
              </div>
              <p className="text-xs text-[#737373]">
                Historical experience reviews and interview guidance from alumni in your target disciplines.
              </p>
            </div>

            <Link
              to="/explore"
              className="text-xs font-bold text-[#991b1b] hover:underline flex items-center gap-1"
            >
              <span>Explore All Reviews</span>
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topExperiences.map(({ experience: exp, relevance_score, highlights }) => (
              <div
                key={exp.id}
                className="bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all duration-200 rounded-[2px] p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#737373] truncate">
                      {exp.company?.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#991b1b] bg-red-50 px-2 py-0.5 rounded-[2px] border border-red-200">
                      ★ {exp.overall_rating}/5
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#0a0a0a] tracking-tight line-clamp-1">
                    {exp.position}
                  </h3>

                  <p className="text-[11px] text-[#525252] line-clamp-2 leading-relaxed italic">
                    "{exp.responsibilities}"
                  </p>

                  {exp.advice && (
                    <div className="text-[11px] bg-[#fafafa] p-2 rounded-[2px] text-[#404040] line-clamp-2">
                      <strong className="text-[#0a0a0a]">Alumni Advice:</strong> {exp.advice}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#f5f5f5] flex items-center justify-between">
                  <span className="text-[10px] text-[#737373]">
                    {exp.location} • {exp.work_type}
                  </span>
                  <Link
                    to={`/experiences/${exp.id}`}
                    className="text-xs font-bold text-[#991b1b] hover:underline"
                  >
                    Read Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MY SHARED EXPERIENCES OVERVIEW SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#991b1b]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a]">
                My Shared Experiences ({myExperiences?.length || 0})
              </h2>
            </div>
            <p className="text-xs text-[#737373]">
              Internship experiences and interview guidance you have contributed to fellow students.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link to="/share">
              <Button variant="blood" size="sm" className="text-xs">
                <Plus size={14} weight="bold" />
                Share Experience
              </Button>
            </Link>
            {myExperiences && myExperiences.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('experiences')}
                className="text-xs font-bold text-[#991b1b] hover:underline"
              >
                Manage All →
              </button>
            )}
          </div>
        </div>

        {myExperiencesLoading ? (
          <div className="py-8 text-center text-xs text-[#737373]">
            <div className="w-5 h-5 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading your shared experiences...
          </div>
        ) : !myExperiences || myExperiences.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-red-50 text-[#991b1b] flex items-center justify-center mx-auto">
              <Article size={20} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#0a0a0a]">No Experiences Shared Yet</h3>
              <p className="text-xs text-[#737373] max-w-md mx-auto">
                Have you completed an internship or industrial training? Share your daily responsibilities, interview questions, and stipend to guide juniors and build your student portfolio.
              </p>
            </div>
            <Link to="/share">
              <Button variant="blood" size="sm" className="text-xs">
                <Plus size={14} weight="bold" />
                Share Your Internship Experience
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myExperiences.map((exp) => (
              <div
                key={exp.id}
                className="bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all rounded-[2px] p-4 flex flex-col justify-between space-y-3 shadow-2xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CompanyLogo
                        name={exp.company?.name}
                        logoUrl={exp.company?.logo_url}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#0a0a0a] block truncate">
                          {exp.company?.name || 'Company'}
                        </span>
                        <span className="text-[11px] text-[#737373] truncate block">
                          {exp.location} • {exp.work_type}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={
                        exp.status === 'PUBLISHED'
                          ? 'success'
                          : exp.status === 'PENDING'
                          ? 'warning'
                          : 'neutral'
                      }
                      size="sm"
                    >
                      {exp.status === 'PUBLISHED'
                        ? 'Published'
                        : exp.status === 'PENDING'
                        ? 'Pending Review'
                        : exp.status}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#0a0a0a] line-clamp-1">
                      {exp.position}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#525252] mt-0.5">
                      <span className="text-[#991b1b] font-bold">★ {exp.overall_rating}/5</span>
                      {exp.duration_weeks && <span>• {exp.duration_weeks} wks</span>}
                      {exp.allowance ? (
                        <span>• {exp.currency || 'MYR'} {exp.allowance.toLocaleString()}/mo</span>
                      ) : null}
                    </div>
                  </div>

                  {exp.responsibilities && (
                    <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed italic">
                      "{exp.responsibilities}"
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-[#f5f5f5] flex items-center justify-between text-xs">
                  <Link
                    to={`/experiences/${exp.id}`}
                    className="font-semibold text-[#0a0a0a] hover:text-[#991b1b] transition-colors"
                  >
                    View Report →
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/experiences/${exp.id}/edit`}
                      className="p-1.5 text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] rounded-[2px] transition-colors"
                      title="Edit Experience"
                    >
                      <PencilSimple size={14} weight="bold" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this shared experience?')) {
                          deleteExperienceMutation.mutate(exp.id);
                        }
                      }}
                      className="p-1.5 text-[#737373] hover:text-[#991b1b] hover:bg-red-50 rounded-[2px] transition-colors"
                      title="Delete Experience"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. TABS: PRIVATE APPLICATION TRACKER / BOOKMARKS / MY EXPERIENCES */}
      <div className="flex border-b border-[#e5e5e5] gap-8 text-sm font-semibold pt-4">
        <button
          onClick={() => setActiveTab('tracker')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'tracker'
              ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
              : 'text-[#737373] hover:text-[#0a0a0a]'
          }`}
        >
          <Kanban size={18} weight="duotone" className="text-[#991b1b]" />
          Private Application Tracker ({applications?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'bookmarks'
              ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
              : 'text-[#737373] hover:text-[#0a0a0a]'
          }`}
        >
          <BookmarkSimple size={18} weight="duotone" className="text-[#991b1b]" />
          Saved Bookmarks ({bookmarks?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('experiences')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'experiences'
              ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
              : 'text-[#737373] hover:text-[#0a0a0a]'
          }`}
        >
          <Article size={18} weight="duotone" className="text-[#991b1b]" />
          My Experiences ({myExperiences?.length || 0})
        </button>
      </div>

      {/* TAB 1: Application Tracker Board */}
      {activeTab === 'tracker' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Private application board. Notes and statuses are visible only to you.</span>
            <Button variant="outline" size="sm" onClick={openCreateModal} className="text-xs">
              <Plus size={14} weight="bold" />
              Add Job
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {stages.map((stage) => {
              const stageApps = applications?.filter((a) => a.status === stage.key) || [];
              return (
                <div key={stage.key} className="bg-white border border-[#e5e5e5] rounded-[2px] flex flex-col">
                  {/* Stage Header */}
                  <div className={`p-3 border-b-2 ${stage.color} bg-[#fafafa] flex items-center justify-between`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
                      {stage.label}
                    </span>
                    <span className="text-xs text-[#737373] font-semibold">{stageApps.length}</span>
                  </div>

                  {/* Stage Cards */}
                  <div className="p-2 space-y-2 flex-1 min-h-[300px]">
                    {stageApps.length === 0 ? (
                      <div className="text-center py-8 text-[11px] text-[#a3a3a3]">
                        No applications
                      </div>
                    ) : (
                      stageApps.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-[#e5e5e5] hover:border-[#a3a3a3] rounded-[2px] space-y-2 text-xs shadow-2xs group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-bold text-[#0a0a0a]">{item.company_name}</div>
                              <div className="text-[#525252] text-[11px]">{item.position}</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 text-[#737373] hover:text-[#0a0a0a]"
                              >
                                <PencilSimple size={14} weight="bold" />
                              </button>
                              <button
                                onClick={() => deleteAppMutation.mutate(item.id)}
                                className="p-1 text-[#737373] hover:text-[#991b1b]"
                              >
                                <Trash size={14} weight="bold" />
                              </button>
                            </div>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-[#737373] line-clamp-2 italic bg-[#fafafa] p-1.5 rounded-[2px]">
                              "{item.notes}"
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-[#a3a3a3] pt-1 border-t border-[#f5f5f5]">
                            {item.deadline ? (
                              <span>Due: {item.deadline}</span>
                            ) : (
                              <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Saved Bookmarks */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          {bookmarks?.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-[2px]">
              <BookmarkSimple size={32} weight="duotone" className="text-[#991b1b] mx-auto mb-2" />
              <h3 className="font-semibold text-base text-[#0a0a0a]">No bookmarks saved yet</h3>
              <p className="text-xs text-[#525252]">Click the bookmark icon on any experience or opportunity to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks?.map((bm) => (
                <div key={bm.id} className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="neutral" size="sm">{bm.target_type}</Badge>
                    <button
                      onClick={() => api.bookmarks.toggle(bm.target_type, bm.target_id).then(() => refetchBookmarks())}
                      className="text-[#991b1b] text-xs hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                  <h4 className="font-semibold text-sm text-[#0a0a0a]">
                    {bm.details?.title || bm.details?.name || 'Saved Item'}
                  </h4>
                  {bm.details?.location && (
                    <span className="text-xs text-[#737373] block">{bm.details.location}</span>
                  )}
                  {bm.target_type === 'EXPERIENCE' && (
                    <Link to={`/experiences/${bm.target_id}`} className="text-xs text-[#991b1b] font-medium block hover:underline pt-1">
                      View Experience Report →
                    </Link>
                  )}
                  {bm.target_type === 'OPPORTUNITY' && (
                    <Link to={`/opportunities`} className="text-xs text-[#991b1b] font-medium block hover:underline pt-1">
                      View Vacancy →
                    </Link>
                  )}
                  {bm.target_type === 'COMPANY' && (
                    <Link to={`/companies/${bm.details?.slug || bm.target_id}`} className="text-xs text-[#991b1b] font-medium block hover:underline pt-1">
                      View Company Profile →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My Experiences Management View */}
      {activeTab === 'experiences' && (
        <div className="space-y-4">
          <div className="p-6 bg-white border border-[#e5e5e5] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-[#0a0a0a]">Internship Experiences Shared ({myExperiences?.length || 0})</h3>
              <p className="text-xs text-[#525252] mt-0.5">
                Manage your published experience reports, interview advice, and submissions awaiting moderation.
              </p>
            </div>
            <Link to="/share">
              <Button variant="blood" size="sm">
                <Plus size={16} weight="bold" />
                Share New Experience
              </Button>
            </Link>
          </div>

          {myExperiencesLoading ? (
            <div className="py-12 text-center text-xs text-[#737373]">
              <div className="w-5 h-5 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading your shared experiences...
            </div>
          ) : !myExperiences || myExperiences.length === 0 ? (
            <div className="p-10 bg-white border border-[#e5e5e5] rounded-[2px] text-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[#991b1b] rounded-full flex items-center justify-center mx-auto">
                <Article size={24} weight="duotone" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#0a0a0a]">No Shared Experiences Found</h4>
                <p className="text-xs text-[#737373] max-w-md mx-auto">
                  You haven't contributed an internship experience yet. Help fellow university students learn about company work culture, allowances, and interview processes.
                </p>
              </div>
              <Link to="/share">
                <Button variant="blood" size="sm">
                  <Plus size={15} weight="bold" />
                  Share Your Experience Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myExperiences.map((exp) => (
                <div
                  key={exp.id}
                  className="p-5 bg-white border border-[#e5e5e5] hover:border-[#a3a3a3] rounded-[2px] space-y-3 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          name={exp.company?.name}
                          logoUrl={exp.company?.logo_url}
                          size="md"
                        />
                        <div>
                          <div className="font-bold text-sm text-[#0a0a0a]">{exp.position}</div>
                          <div className="text-xs text-[#525252]">
                            {exp.company?.name} • {exp.location} ({exp.work_type})
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={
                          exp.status === 'PUBLISHED'
                            ? 'success'
                            : exp.status === 'PENDING'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {exp.status === 'PUBLISHED'
                          ? 'Published'
                          : exp.status === 'PENDING'
                          ? 'Pending Review'
                          : exp.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 border-y border-[#f5f5f5] text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-[#737373] block font-semibold">Rating</span>
                        <span className="font-bold text-[#991b1b]">★ {exp.overall_rating}/5</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#737373] block font-semibold">Duration</span>
                        <span className="font-semibold text-[#0a0a0a]">{exp.duration_weeks || 12} Weeks</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-[#737373] block font-semibold">Allowance</span>
                        <span className="font-semibold text-[#0a0a0a]">
                          {exp.allowance ? `${exp.currency || 'MYR'} ${exp.allowance.toLocaleString()}` : 'Undisclosed'}
                        </span>
                      </div>
                    </div>

                    {exp.responsibilities && (
                      <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed">
                        <strong className="text-[#0a0a0a]">Tasks: </strong>
                        {exp.responsibilities}
                      </p>
                    )}

                    {exp.interview_tips && (
                      <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed">
                        <strong className="text-[#0a0a0a]">Interview Tips: </strong>
                        {exp.interview_tips}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#f5f5f5] flex items-center justify-between text-xs">
                    <Link
                      to={`/experiences/${exp.id}`}
                      className="font-semibold text-[#991b1b] hover:underline"
                    >
                      View Published Page →
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/experiences/${exp.id}/edit`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-[#e5e5e5] rounded-[2px] text-[#0a0a0a] hover:bg-[#fafafa] transition-colors"
                      >
                        <PencilSimple size={13} weight="bold" />
                        <span>Edit</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this shared experience?')) {
                            deleteExperienceMutation.mutate(exp.id);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-red-200 text-[#991b1b] hover:bg-red-50 rounded-[2px] transition-colors"
                      >
                        <Trash size={13} weight="bold" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Application Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingApp ? 'Edit Application' : 'Track New Application'}
        maxWidth="md"
      >
        <form onSubmit={handleAppSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Company Name *
            </label>
            <input
              type="text"
              required
              value={appForm.company_name}
              onChange={(e) => setAppForm({ ...appForm, company_name: e.target.value })}
              placeholder="e.g. Grab, Petronas, Shopee..."
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Position Title *
            </label>
            <input
              type="text"
              required
              value={appForm.position}
              onChange={(e) => setAppForm({ ...appForm, position: e.target.value })}
              placeholder="e.g. Backend Software Engineer Intern"
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 focus:border-[#0a0a0a] outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Application Stage
            </label>
            <select
              value={appForm.status}
              onChange={(e) => setAppForm({ ...appForm, status: e.target.value })}
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 outline-none"
            >
              <option value="INTERESTED">Interested</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEWING">Interviewing</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Applied Date
              </label>
              <input
                type="date"
                value={appForm.applied_date}
                onChange={(e) => setAppForm({ ...appForm, applied_date: e.target.value })}
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Deadline
              </label>
              <input
                type="date"
                value={appForm.deadline}
                onChange={(e) => setAppForm({ ...appForm, deadline: e.target.value })}
                className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Private Notes (Interview rounds, recruiter contacts, etc.)
            </label>
            <textarea
              rows={3}
              value={appForm.notes}
              onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
              placeholder="e.g. Sent referral message to alumni on LinkedIn. Screening scheduled for next Tuesday."
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button type="button" variant="outline" size="sm" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="blood"
              size="sm"
              isLoading={createAppMutation.isPending || updateAppMutation.isPending}
            >
              {editingApp ? 'Save Changes' : 'Add to Board'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Onboarding Wizard Modal */}
      <OnboardingModal
        isOpen={onboardingModalOpen}
        onClose={() => setOnboardingModalOpen(false)}
        onCompleted={() => {
          refreshProfile();
        }}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkle,
  Briefcase,
  Compass,
  Buildings,
  MapPin,
  CurrencyDollar,
  ArrowSquareOut,
  PlusCircle,
  CheckCircle,
  Funnel,
  Info,
  Clock,
  GraduationCap,
  CaretDown,
  CaretUp,
  ChartPieSlice,
  Lightbulb
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompanyLogo } from '../components/common/CompanyLogo';
import type {
  RecommendedOpportunityItem,
  RecommendedExperienceItem
} from '../types';

export const RecommendationsPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'vacancies' | 'experiences'>('vacancies');
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<RecommendedOpportunityItem[]>([]);
  const [experiences, setExperiences] = useState<RecommendedExperienceItem[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('All');
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [expandedBreakdownId, setExpandedBreakdownId] = useState<string | null>(null);
  const [trackingSuccessId, setTrackingSuccessId] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const oppParams: any = { limit: 20 };
      if (workTypeFilter !== 'All') oppParams.work_type = workTypeFilter.toLowerCase();
      if (locationSearch.trim()) oppParams.location = locationSearch.trim();

      const [oppRes, expRes] = await Promise.all([
        api.recommendations.getOpportunities(oppParams),
        api.recommendations.getExperiences(12)
      ]);
      setOpportunities(oppRes.items);
      setExperiences(expRes);
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [workTypeFilter]);

  const handleTrackApplication = async (opp: RecommendedOpportunityItem['opportunity']) => {
    try {
      await api.applications.create({
        company_name: opp.company?.name || 'Company',
        company_id: opp.company_id,
        position: opp.title,
        status: 'INTERESTED',
        notes: `Recommended by InternScope (${opp.location}, ${opp.work_type}). Direct URL: ${opp.apply_url}`
      });
      setTrackingSuccessId(opp.id);
      setTimeout(() => setTrackingSuccessId(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add application');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-text">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
              Personalized Career Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Recommended For You
          </h1>
          <p className="text-xs text-[#525252]">
            Deterministic matching evaluating skills (35%), role alignment (25%), industry (15%), location (15%), and compensation (10%).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/profile">
            <Button variant="outline" size="sm" className="text-xs">
              Refine My Career Profile
            </Button>
          </Link>
          <Link to="/skill-gap">
            <Button variant="blood" size="sm" className="text-xs">
              Analyze Skill Gaps
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Incomplete Advisory */}
      {profile && !profile.is_completed && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Info size={18} weight="fill" className="text-amber-700 shrink-0" />
            <span>
              Your career profile is currently at <strong>{profile.completion?.percentage || 0}%</strong>.
              Add more skills and target roles to unlock higher recommendation accuracy.
            </span>
          </div>
          <Link to="/profile">
            <Button variant="blood" size="sm" className="text-xs whitespace-nowrap">
              Complete Profile
            </Button>
          </Link>
        </div>
      )}

      {/* Tabs & Filters Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
        {/* Tab Toggle */}
        <div className="flex border border-[#e5e5e5] rounded-[2px] p-0.5 bg-[#fafafa]">
          <button
            type="button"
            onClick={() => setActiveTab('vacancies')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
              activeTab === 'vacancies'
                ? 'bg-[#0a0a0a] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            <Briefcase size={15} weight={activeTab === 'vacancies' ? 'fill' : 'duotone'} />
            <span>Active Vacancies ({opportunities.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experiences')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[2px] transition-colors ${
              activeTab === 'experiences'
                ? 'bg-[#0a0a0a] text-white shadow-xs'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            <Compass size={15} weight={activeTab === 'experiences' ? 'fill' : 'duotone'} />
            <span>Alumni Experience Insights ({experiences.length})</span>
          </button>
        </div>

        {/* Filters if in Vacancies tab */}
        {activeTab === 'vacancies' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#737373]">
              <Funnel size={14} weight="bold" />
              <span>Work Mode:</span>
            </div>
            {['All', 'Hybrid', 'Remote', 'Onsite'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setWorkTypeFilter(mode)}
                className={`text-xs px-2.5 py-1 rounded-[2px] border transition-colors ${
                  workTypeFilter === mode
                    ? 'bg-[#991b1b] text-white border-[#991b1b] font-bold'
                    : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#737373]">Evaluating scoring vectors across vacancies & profiles...</p>
        </div>
      ) : activeTab === 'vacancies' ? (
        /* VACANCIES TAB */
        opportunities.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] p-12 text-center rounded-[2px] space-y-3">
            <div className="w-12 h-12 bg-gray-50 text-[#737373] mx-auto rounded-[2px] flex items-center justify-center">
              <Briefcase size={24} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold text-[#0a0a0a]">No Matching Vacancies Found</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Try adjusting your work arrangement filter or adding more general skills to your profile.
            </p>
            <Button variant="outline" size="sm" onClick={() => setWorkTypeFilter('All')}>
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {opportunities.map((item) => {
              const { opportunity: opp, match_score, score_breakdown, matched_skills, missing_skills, reasons } = item;
              const isExpanded = expandedBreakdownId === opp.id;
              const isTracked = trackingSuccessId === opp.id;

              return (
                <div
                  key={opp.id}
                  className="bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all duration-200 rounded-[2px] p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  {/* Top Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <CompanyLogo
                        name={opp.company?.name}
                        logoUrl={opp.company?.logo_url}
                        size="lg"
                        className="bg-white shadow-xs"
                      />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/companies/${opp.company?.slug || opp.company_id}`}
                            className="text-xs font-bold text-[#737373] hover:text-[#0a0a0a]"
                          >
                            {opp.company?.name}
                          </Link>
                          <span className="text-[10px] text-[#a3a3a3]">•</span>
                          <span className="text-xs text-[#737373]">{opp.company?.industry}</span>
                        </div>
                        <h2 className="text-base font-bold text-[#0a0a0a] tracking-tight hover:text-[#991b1b] transition-colors">
                          {opp.title}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#525252]">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} weight="bold" />
                            {opp.location}
                          </span>
                          <span className="text-[#d4d4d4]">•</span>
                          <span className="capitalize font-medium">{opp.work_type}</span>
                          {opp.allowance && (
                            <>
                              <span className="text-[#d4d4d4]">•</span>
                              <span className="font-mono font-bold text-[#0a0a0a]">
                                RM {opp.allowance.toLocaleString()} / mo
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex flex-col sm:items-end gap-1.5 shrink-0">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-bold text-xs ${
                          match_score >= 80
                            ? 'bg-red-50 text-[#991b1b] border border-red-200'
                            : match_score >= 60
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        <Sparkle size={13} weight="fill" />
                        <span>{match_score}% Match</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedBreakdownId(isExpanded ? null : opp.id)}
                        className="text-[11px] text-[#737373] hover:text-[#0a0a0a] flex items-center gap-1 font-medium"
                      >
                        <span>{isExpanded ? 'Hide Score Breakdown' : 'View Score Breakdown'}</span>
                        {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Explainable Reasons Summary */}
                  {reasons && reasons.length > 0 && (
                    <div className="p-3 bg-[#fafafa] border border-[#f0f0f0] rounded-[2px] space-y-1.5 text-xs text-[#404040]">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#a3a3a3]">
                        Why this matches you:
                      </div>
                      <ul className="space-y-1">
                        {reasons.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-[#991b1b] font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Skills Match Overview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {matched_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-green-50 text-green-800 border border-green-200 rounded-[2px] font-medium"
                      >
                        <CheckCircle size={12} weight="fill" className="text-green-600" />
                        {s}
                      </span>
                    ))}
                    {missing_skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 bg-gray-50 text-[#737373] border border-dashed border-[#d4d4d4] rounded-[2px]"
                      >
                        <span>to learn:</span>
                        <strong className="text-[#0a0a0a]">{s}</strong>
                      </span>
                    ))}
                  </div>

                  {/* Growth Suggestion */}
                  {item.learning_suggestion && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50/60 border border-amber-200/70 rounded-[2px] text-xs text-amber-900">
                      <Lightbulb size={15} weight="fill" className="text-amber-600 shrink-0 mt-0.5" />
                      <span>{item.learning_suggestion}</span>
                    </div>
                  )}

                  {/* Expanded Breakdown Drawer */}
                  {isExpanded && (
                    <div className="p-4 bg-white border border-[#0a0a0a] rounded-[2px] space-y-3 animate-in fade-in duration-150">
                      <div className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
                        Detailed Scoring Factor Breakdown
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#737373] uppercase font-bold">Skills (35%)</span>
                          <div className="font-bold text-[#0a0a0a]">{score_breakdown.skills_score} / 35</div>
                          <div className="w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#991b1b] h-full" style={{ width: `${(score_breakdown.skills_score / 35) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#737373] uppercase font-bold">Role Fit (25%)</span>
                          <div className="font-bold text-[#0a0a0a]">{score_breakdown.role_score} / 25</div>
                          <div className="w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#991b1b] h-full" style={{ width: `${(score_breakdown.role_score / 25) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#737373] uppercase font-bold">Industry (15%)</span>
                          <div className="font-bold text-[#0a0a0a]">{score_breakdown.industry_score} / 15</div>
                          <div className="w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#991b1b] h-full" style={{ width: `${(score_breakdown.industry_score / 15) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#737373] uppercase font-bold">Location (15%)</span>
                          <div className="font-bold text-[#0a0a0a]">{score_breakdown.location_score} / 15</div>
                          <div className="w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#991b1b] h-full" style={{ width: `${(score_breakdown.location_score / 15) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-[#737373] uppercase font-bold">Allowance (10%)</span>
                          <div className="font-bold text-[#0a0a0a]">{score_breakdown.allowance_score} / 10</div>
                          <div className="w-full bg-[#f0f0f0] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#991b1b] h-full" style={{ width: `${(score_breakdown.allowance_score / 10) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#f0f0f0]">
                    <div className="text-[11px] text-[#737373]">
                      Period: <strong className="text-[#0a0a0a]">{opp.period}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isTracked ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleTrackApplication(opp)}
                        className="text-xs"
                      >
                        {isTracked ? (
                          <>
                            <CheckCircle size={14} weight="fill" className="text-green-600" />
                            Added to Tracker!
                          </>
                        ) : (
                          <>
                            <PlusCircle size={14} weight="bold" />
                            Track Application
                          </>
                        )}
                      </Button>

                      <a
                        href={opp.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="blood" size="sm" className="text-xs">
                          <span>Apply on Official Site</span>
                          <ArrowSquareOut size={14} weight="bold" />
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* EXPERIENCES TAB */
        experiences.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] p-12 text-center rounded-[2px] space-y-3">
            <div className="w-12 h-12 bg-gray-50 text-[#737373] mx-auto rounded-[2px] flex items-center justify-center">
              <Compass size={24} weight="duotone" />
            </div>
            <h3 className="text-sm font-bold text-[#0a0a0a]">No Peer Reports Available</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto">
              Be the first to share an internship experience report from your faculty!
            </p>
            <Link to="/share">
              <Button variant="blood" size="sm">
                Share Experience
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiences.map(({ experience: exp, relevance_score, highlights }) => (
              <div
                key={exp.id}
                className="bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all duration-200 rounded-[2px] p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[#737373] font-semibold">{exp.company?.name}</div>
                      <h3 className="text-sm font-bold text-[#0a0a0a]">{exp.position}</h3>
                      <div className="text-xs text-[#525252] flex items-center gap-2 pt-0.5">
                        <span>{exp.location}</span>
                        <span>•</span>
                        <span className="capitalize">{exp.work_type}</span>
                        {exp.allowance && (
                          <>
                            <span>•</span>
                            <span className="font-mono font-bold text-[#0a0a0a]">
                              RM {exp.allowance.toLocaleString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="bg-red-50 text-[#991b1b] border border-red-200 text-xs font-bold px-2.5 py-1 rounded-[2px] shrink-0">
                      {relevance_score}% Relevant
                    </div>
                  </div>

                  {/* Alumni Highlights */}
                  {highlights && highlights.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {highlights.map((h, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 bg-[#fafafa] border border-[#e5e5e5] text-[#525252] rounded-[2px]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-[#525252] line-clamp-3 leading-relaxed">
                    "{exp.responsibilities}"
                  </p>

                  {exp.advice && (
                    <div className="text-xs bg-[#fef2f2]/60 border-l-2 border-[#991b1b] p-2 text-[#404040]">
                      <strong>Advice to Juniors:</strong> {exp.advice}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between">
                  <div className="text-xs font-bold text-[#0a0a0a]">
                    ★ {exp.overall_rating} / 5 Rating
                  </div>
                  <Link to={`/experiences/${exp.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      Read Full Review
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

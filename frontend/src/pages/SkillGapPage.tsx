import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkle,
  TrendUp,
  Target,
  CheckCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Lightbulb,
  Books,
  Funnel,
  MagnifyingGlass,
  X,
  Buildings,
  ArrowSquareOut
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { SkillGapAnalysisResponse, MarketGapSkill, RecommendedOpportunityItem } from '../types';

export const SkillGapPage: React.FC = () => {
  const { user, profile, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [gapData, setGapData] = useState<SkillGapAnalysisResponse | null>(null);
  const [addingSkill, setAddingSkill] = useState<string | null>(null);
  const [addedSkills, setAddedSkills] = useState<string[]>([]);

  // Filtering states
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Opportunity-specific Skill Gap Modal
  const [oppModalOpen, setOppModalOpen] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(searchParams.get('opportunity_id'));
  const [oppAnalysis, setOppAnalysis] = useState<SkillGapAnalysisResponse | null>(null);
  const [oppAnalysisLoading, setOppAnalysisLoading] = useState(false);
  const [availableOpps, setAvailableOpps] = useState<RecommendedOpportunityItem[]>([]);

  // Self-assessed proficiency picker state
  const [proficiencyModalOpen, setProficiencyModalOpen] = useState(false);
  const [skillToAdopt, setSkillToAdopt] = useState<string | null>(null);
  const [selectedProficiency, setSelectedProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');

  const fetchSkillGap = async () => {
    setLoading(true);
    try {
      const [res, oppsRes] = await Promise.all([
        api.recommendations.getSkillGap(),
        api.recommendations.getOpportunities({ limit: 15 })
      ]);
      setGapData(res);
      setAvailableOpps(oppsRes.items);
    } catch (err) {
      console.error('Failed to load skill gap data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkillGap();
  }, [profile?.skills]);

  // Handle URL opportunity_id if provided
  useEffect(() => {
    const oppId = searchParams.get('opportunity_id');
    if (oppId) {
      handleInspectOpportunity(oppId);
    }
  }, [searchParams]);

  const handleInspectOpportunity = async (oppId: string) => {
    setSelectedOppId(oppId);
    setOppModalOpen(true);
    setOppAnalysisLoading(true);
    try {
      const res = await api.recommendations.getSkillGap(oppId);
      setOppAnalysis(res);
    } catch (err) {
      console.error('Failed to analyze opportunity', err);
    } finally {
      setOppAnalysisLoading(false);
    }
  };

  const openAdoptModal = (skillName: string) => {
    setSkillToAdopt(skillName);
    setSelectedProficiency('intermediate');
    setProficiencyModalOpen(true);
  };

  const confirmAdoptSkill = async () => {
    if (!profile || !skillToAdopt) return;
    setAddingSkill(skillToAdopt);
    setProficiencyModalOpen(false);
    try {
      const existing = profile.skills || [];
      const updated = [
        ...existing,
        { name: skillToAdopt, category: 'General', proficiency: selectedProficiency }
      ];
      await updateProfile({ skills: updated });
      setAddedSkills(prev => [...prev, skillToAdopt]);
      await fetchSkillGap();
    } catch (err: any) {
      alert(err.message || 'Failed to add skill');
    } finally {
      setAddingSkill(null);
      setSkillToAdopt(null);
    }
  };

  const missingSkills = gapData?.in_demand_missing_skills || [];

  // Extract unique roles hiring across missing skills
  const allHiringRoles = Array.from(
    new Set(
      missingSkills.flatMap(s => s.relevant_roles || [])
    )
  );

  // Filter skills
  const filteredSkills = missingSkills.filter(item => {
    if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
    if (roleFilter !== 'All' && !(item.relevant_roles || []).includes(roleFilter)) return false;
    if (searchQuery.trim() && !item.skill.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-text">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#991b1b]">
              Market Career Intelligence
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
            Skill Gap Analyzer
          </h1>
          <p className="text-xs text-[#525252]">
            Discover in-demand competencies required by active Malaysian internship vacancies to maximize your candidate competitiveness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/profile">
            <Button variant="outline" size="sm" className="text-xs">
              Edit Career Profile
            </Button>
          </Link>
          <Link to="/recommendations">
            <Button variant="blood" size="sm" className="text-xs">
              <Sparkle size={14} weight="fill" />
              View Matches
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
            Analyzed Vacancies
          </div>
          <div className="text-2xl font-bold text-[#0a0a0a] mt-1 font-mono">
            {gapData?.total_evaluated_vacancies || 0}
          </div>
          <div className="text-xs text-[#525252] mt-0.5">Active Malaysian opportunities examined</div>
        </div>

        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
            Your Verified Skills
          </div>
          <div className="text-2xl font-bold text-[#0a0a0a] mt-1 font-mono">
            {profile?.skills?.length || 0}
          </div>
          <div className="text-xs text-[#525252] mt-0.5">Active competencies in your profile</div>
        </div>

        <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#737373]">
            Market Growth Opportunities
          </div>
          <div className="text-2xl font-bold text-[#991b1b] mt-1 font-mono">
            {missingSkills.length}
          </div>
          <div className="text-xs text-[#525252] mt-0.5">High-demand skills you can learn next</div>
        </div>
      </div>

      {/* Opportunity Inspector Selector */}
      {availableOpps.length > 0 && (
        <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Briefcase size={18} weight="duotone" className="text-[#991b1b] shrink-0" />
            <div>
              <span className="text-xs font-bold text-[#0a0a0a] block">Opportunity-Specific Gap Inspection</span>
              <span className="text-[11px] text-[#737373]">Select any open vacancy to evaluate your exact matching and missing skills.</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedOppId || ''}
              onChange={(e) => {
                if (e.target.value) handleInspectOpportunity(e.target.value);
              }}
              className="text-xs border border-[#e5e5e5] rounded-[2px] px-3 py-1.5 bg-white outline-hidden max-w-xs truncate"
            >
              <option value="">Inspect a specific job...</option>
              {availableOpps.map(({ opportunity: opp }) => (
                <option key={opp.id} value={opp.id}>
                  {opp.title} ({opp.company?.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlass size={14} className="absolute left-3 top-3 text-[#737373]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter missing skills by keyword..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-[#0a0a0a] border border-[#e5e5e5] focus:border-[#0a0a0a] outline-hidden rounded-[2px]"
          />
        </div>

        {/* Priority & Role Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#737373] font-semibold">Priority:</span>
            {['All', 'CRITICAL', 'RECOMMENDED'].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`text-xs px-2.5 py-1 rounded-[2px] border transition-colors ${
                  priorityFilter === p
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a] font-bold'
                    : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Roles */}
          {allHiringRoles.length > 0 && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs border border-[#e5e5e5] rounded-[2px] px-2.5 py-1 bg-white outline-hidden max-w-[180px] truncate"
            >
              <option value="All">All Target Roles</option>
              {allHiringRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* In-Demand Missing Skills Grid */}
      <div className="bg-white border border-[#e5e5e5] rounded-[2px] p-6 space-y-6">
        <div className="border-b border-[#f0f0f0] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
              <TrendUp size={18} weight="duotone" className="text-[#991b1b]" />
              In-Demand Skills Missing from Your Profile ({filteredSkills.length})
            </h2>
            <p className="text-xs text-[#737373]">
              Acquiring these skills will directly boost your match scores and eligibility across verified company openings.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-6 h-6 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-[#737373]">Analyzing skill frequencies across active postings...</p>
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="p-8 text-center space-y-2 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px]">
            <CheckCircle size={32} weight="fill" className="text-green-600 mx-auto" />
            <h3 className="text-sm font-bold text-[#0a0a0a]">No Gaps Matching Your Filters!</h3>
            <p className="text-xs text-[#525252] max-w-sm mx-auto">
              Your profile covers the key competencies demanded by open vacancies under this filter.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPriorityFilter('All');
                setRoleFilter('All');
                setSearchQuery('');
              }}
              className="mt-2 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSkills.map((item) => {
              const isAdded = addedSkills.includes(item.skill);
              const isAdding = addingSkill === item.skill;

              return (
                <div
                  key={item.skill}
                  className="p-4 border border-[#e5e5e5] hover:border-[#0a0a0a] transition-all duration-200 rounded-[2px] bg-white flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#0a0a0a]">{item.skill}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-[2px] uppercase ${
                          item.priority === 'CRITICAL'
                            ? 'bg-red-50 text-[#991b1b] border border-red-200'
                            : item.priority === 'RECOMMENDED'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>

                    <div className="text-xs text-[#525252]">
                      Required in <strong className="text-[#0a0a0a]">{item.demand_count}</strong> active listings
                    </div>

                    {item.relevant_roles && item.relevant_roles.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-[#a3a3a3] uppercase font-bold">Target Roles Hiring:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.relevant_roles.map((r, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-[#f5f5f5] text-[#525252] px-1.5 py-0.5 rounded-[2px] truncate max-w-full"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#f5f5f5]">
                    {isAdded ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-700 font-semibold py-1">
                        <CheckCircle size={14} weight="fill" className="text-green-600" />
                        <span>Added to your profile!</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openAdoptModal(item.skill)}
                        disabled={isAdding}
                        className="w-full text-xs justify-center"
                      >
                        <Plus size={13} weight="bold" />
                        <span>{isAdding ? 'Adding...' : 'I Know This Skill (+ Add)'}</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Existing Student Skills Card */}
      <div className="bg-white border border-[#e5e5e5] rounded-[2px] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-2">
            <Books size={18} weight="duotone" className="text-[#991b1b]" />
            Your Current Skills Inventory ({profile?.skills?.length || 0})
          </h2>
          <Link to="/profile" className="text-xs text-[#991b1b] font-bold hover:underline">
            Manage All in Profile →
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {profile?.skills && profile.skills.length > 0 ? (
            profile.skills.map((s) => (
              <span
                key={s.name}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fafafa] border border-[#0a0a0a] text-xs font-semibold rounded-[2px]"
              >
                <span>{s.name}</span>
                <span className="text-[10px] text-[#737373] uppercase font-normal">
                  ({s.proficiency || 'intermediate'})
                </span>
              </span>
            ))
          ) : (
            <p className="text-xs text-[#a3a3a3] italic">No skills listed yet.</p>
          )}
        </div>
      </div>

      {/* Self-Assessed Proficiency Modal */}
      <Modal
        isOpen={proficiencyModalOpen}
        onClose={() => setProficiencyModalOpen(false)}
        title={`Add "${skillToAdopt}" to Profile`}
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#525252]">
            Select your self-assessed proficiency level. Higher proficiencies contribute positive multipliers to your recommendation scores.
          </p>

          <div className="space-y-2">
            {[
              { id: 'beginner', label: 'Beginner', desc: 'Basic conceptual understanding / starter projects' },
              { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable building features independently' },
              { id: 'advanced', label: 'Advanced', desc: 'Extensive coursework or production experience' },
              { id: 'expert', label: 'Expert', desc: 'Deep mastery, architecture & optimization' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProficiency(p.id as any)}
                className={`w-full text-left p-2.5 rounded-[2px] border transition-colors flex items-center justify-between ${
                  selectedProficiency === p.id
                    ? 'border-[#0a0a0a] bg-[#fafafa] font-bold text-[#0a0a0a]'
                    : 'border-[#e5e5e5] hover:border-[#a3a3a3] text-[#525252]'
                }`}
              >
                <div>
                  <span className="block capitalize">{p.label}</span>
                  <span className="text-[10px] text-[#737373] font-normal">{p.desc}</span>
                </div>
                {selectedProficiency === p.id && <span className="text-[#991b1b]">✓</span>}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setProficiencyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="blood" size="sm" onClick={confirmAdoptSkill}>
              Save to Profile
            </Button>
          </div>
        </div>
      </Modal>

      {/* Opportunity-Specific Breakdown Modal */}
      <Modal
        isOpen={oppModalOpen}
        onClose={() => {
          setOppModalOpen(false);
          setSelectedOppId(null);
          setSearchParams({});
        }}
        title={oppAnalysis?.opportunity_title ? `Gap Analysis: ${oppAnalysis.opportunity_title}` : 'Analyzing Opportunity...'}
        maxWidth="md"
      >
        {oppAnalysisLoading ? (
          <div className="py-8 text-center text-xs text-[#737373]">
            Calculating requirement intersections...
          </div>
        ) : oppAnalysis ? (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-[#fafafa] p-3 rounded-[2px] border border-[#e5e5e5]">
              <div>
                <span className="text-[11px] text-[#737373] font-semibold">{oppAnalysis.company_name}</span>
                <h4 className="font-bold text-sm text-[#0a0a0a]">{oppAnalysis.opportunity_title}</h4>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-1 bg-red-50 text-[#991b1b] border border-red-200 rounded-[2px]">
                {oppAnalysis.match_score}% Match
              </span>
            </div>

            {/* Matched Skills */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#0a0a0a] uppercase tracking-wider text-[10px]">
                Skills You Have That Match ({oppAnalysis.matched_skills?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {oppAnalysis.matched_skills && oppAnalysis.matched_skills.length > 0 ? (
                  oppAnalysis.matched_skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-green-50 text-green-800 border border-green-200 rounded-[2px] text-xs">
                      ✓ {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[#a3a3a3] italic text-xs">No direct skill matches yet.</span>
                )}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-1.5">
              <span className="font-bold text-[#991b1b] uppercase tracking-wider text-[10px]">
                Skills You Should Learn ({oppAnalysis.missing_skills?.length || 0}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {oppAnalysis.missing_skills && oppAnalysis.missing_skills.length > 0 ? (
                  oppAnalysis.missing_skills.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => openAdoptModal(s)}
                      className="px-2 py-0.5 bg-red-50 text-[#991b1b] border border-dashed border-red-300 rounded-[2px] text-xs hover:bg-red-100 flex items-center gap-1"
                    >
                      <span>+ Learn & Add: {s}</span>
                    </button>
                  ))
                ) : (
                  <span className="text-green-700 text-xs font-semibold">You have all required skills for this job!</span>
                )}
              </div>
            </div>

            {/* Reasons */}
            {oppAnalysis.reasons && (
              <div className="p-3 bg-[#fafafa] rounded-[2px] border border-[#f0f0f0] space-y-1">
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wider">Evaluation Reasons:</span>
                <ul className="space-y-0.5 text-[#525252]">
                  {oppAnalysis.reasons.map((r, i) => (
                    <li key={i}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOppModalOpen(false);
                  setSelectedOppId(null);
                  setSearchParams({});
                }}
              >
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

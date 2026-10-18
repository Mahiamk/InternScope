import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Gauge,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Flag,
  Users,
  Article,
  Buildings,
  ChartBar,
  Gear,
  ClockCounterClockwise,
  ArrowsMerge,
  ArrowsClockwise,
  Plus,
  Prohibit,
  TrendUp
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type {
  InternshipExperience,
  GroupedReport,
  AdminCompany,
  AdminUser,
  SystemSettings
} from '../types';

type NavSection = 'overview' | 'moderation' | 'companies' | 'users' | 'analytics' | 'settings';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === 'admin';
  const isModerator = user?.role === 'moderator' || isAdmin;

  // Active navigation state synchronized with URL search params
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = (searchParams.get('tab') as NavSection) || 'overview';
  const setActiveSection = (section: NavSection) => {
    setSearchParams({ tab: section });
  };
  const [moderationTab, setModerationTab] = useState<'pending' | 'experiences' | 'reports' | 'qa' | 'opportunities'>('pending');
  const [companyTab, setCompanyTab] = useState<'directory' | 'merge' | 'quality' | 'taxonomies'>('directory');
  const [userTab, setUserTab] = useState<'all' | 'moderators' | 'suspended'>('all');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'ALL'>('PENDING');
  const [experienceStatusFilter, setExperienceStatusFilter] = useState('ALL');

  // Interactive Modals State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<InternshipExperience | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isCorrectionsAction, setIsCorrectionsAction] = useState(false);

  const [relinkModalOpen, setRelinkModalOpen] = useState(false);
  const [relinkTargetCompanyId, setRelinkTargetCompanyId] = useState('');

  const [reportActionModalOpen, setReportActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<GroupedReport | null>(null);
  const [reportNewStatus, setReportNewStatus] = useState<'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED'>('RESOLVED');
  const [reportResolutionNotes, setReportResolutionNotes] = useState('');
  const [reportActionTaken, setReportActionTaken] = useState<'NONE' | 'CONTENT_HIDDEN' | 'CONTENT_EDITED' | 'USER_WARNED' | 'USER_SUSPENDED'>('NONE');

  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<AdminCompany | null>(null);
  const [companyFormData, setCompanyFormData] = useState({
    name: '',
    industry: '',
    headquarters: '',
    website: '',
    careers_url: '',
    domain: '',
    logo_url: '',
    description: '',
    is_verified: false,
    is_archived: false,
  });

  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userRoleUpdate, setUserRoleUpdate] = useState<'student' | 'moderator' | 'admin'>('student');
  const [userSuspensionReason, setUserSuspensionReason] = useState('');

  // -------------------------------------------------------------
  // Data Queries
  // -------------------------------------------------------------
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.admin.getMetrics(),
    enabled: isModerator,
  });

  const { data: pendingExperiences, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => api.admin.listPending(),
    enabled: isModerator && (activeSection === 'overview' || (activeSection === 'moderation' && moderationTab === 'pending')),
  });

  const { data: allExperiences, refetch: refetchExperiences } = useQuery({
    queryKey: ['admin-experiences', experienceStatusFilter, searchQuery],
    queryFn: () => api.admin.listExperiences({ status_filter: experienceStatusFilter, search: searchQuery }),
    enabled: isModerator && activeSection === 'moderation' && moderationTab === 'experiences',
  });

  const { data: reports, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports', reportStatusFilter],
    queryFn: () => api.admin.listReports(reportStatusFilter),
    enabled: isModerator && (activeSection === 'overview' || (activeSection === 'moderation' && moderationTab === 'reports')),
  });

  const { data: qaItems, refetch: refetchQA } = useQuery({
    queryKey: ['admin-qa'],
    queryFn: () => api.admin.listQA(),
    enabled: isModerator && activeSection === 'moderation' && moderationTab === 'qa',
  });

  const { data: opportunities, refetch: refetchOpportunities } = useQuery({
    queryKey: ['admin-opportunities', searchQuery],
    queryFn: () => api.admin.listOpportunities({ search: searchQuery }),
    enabled: isModerator && activeSection === 'moderation' && moderationTab === 'opportunities',
  });

  // Admin-only queries
  const { data: companiesList, refetch: refetchCompanies } = useQuery({
    queryKey: ['admin-companies', searchQuery],
    queryFn: () => api.admin.listCompanies({ search: searchQuery, include_archived: true }),
    enabled: isAdmin && activeSection === 'companies',
  });

  const { data: dataQuality, refetch: refetchDataQuality } = useQuery({
    queryKey: ['admin-data-quality'],
    queryFn: () => api.admin.getDataQuality(),
    enabled: isAdmin && activeSection === 'companies' && companyTab === 'quality',
  });

  const { data: taxonomies, refetch: refetchTaxonomies } = useQuery({
    queryKey: ['admin-taxonomies'],
    queryFn: () => api.admin.listTaxonomies(),
    enabled: isAdmin && activeSection === 'companies' && companyTab === 'taxonomies',
  });

  const { data: usersList, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', searchQuery, userTab],
    queryFn: () => api.admin.listUsers({ search: searchQuery, role_filter: userTab === 'moderators' ? 'moderator' : undefined }),
    enabled: isAdmin && activeSection === 'users',
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => api.admin.getAnalytics(),
    enabled: isAdmin && activeSection === 'analytics',
  });

  const { data: auditLogs, refetch: refetchAuditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.admin.listAuditLogs(),
    enabled: isAdmin && activeSection === 'settings',
  });

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.admin.getSettings(),
    enabled: isAdmin && activeSection === 'settings',
  });

  // -------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------
  const moderateExperienceMutation = useMutation({
    mutationFn: ({ id, action, notes, rejection_reason }: any) =>
      api.admin.moderate(id, { action, notes, rejection_reason }),
    onSuccess: () => {
      refetchPending();
      refetchExperiences();
      setRejectModalOpen(false);
      setSelectedExp(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const relinkExperienceMutation = useMutation({
    mutationFn: ({ id, companyId }: { id: string; companyId: string }) =>
      api.admin.relinkExperience(id, companyId),
    onSuccess: () => {
      refetchPending();
      refetchExperiences();
      setRelinkModalOpen(false);
    },
  });

  const reportLifecycleMutation = useMutation({
    mutationFn: ({ targetType, targetId, data }: any) =>
      api.admin.updateReportLifecycle(targetType, targetId, data),
    onSuccess: () => {
      refetchReports();
      setReportActionModalOpen(false);
      setSelectedReport(null);
      setReportResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const updateQAStatusMutation = useMutation({
    mutationFn: ({ itemType, id, status }: { itemType: string; id: string; status: string }) =>
      api.admin.updateQAStatus(itemType, id, status),
    onSuccess: () => refetchQA(),
  });

  const updateOpportunityStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.admin.updateOpportunityStatus(id, status),
    onSuccess: () => refetchOpportunities(),
  });

  const saveCompanyMutation = useMutation({
    mutationFn: (data: Partial<AdminCompany>) => {
      if (editingCompany) {
        return api.admin.updateCompany(editingCompany.id, data);
      }
      return api.admin.createCompany(data);
    },
    onSuccess: () => {
      refetchCompanies();
      setCompanyModalOpen(false);
      setEditingCompany(null);
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const mergeCompaniesMutation = useMutation({
    mutationFn: (data: { source_company_id: string; target_company_id: string }) =>
      api.admin.mergeCompanies(data),
    onSuccess: (res) => {
      refetchCompanies();
      setMergeModalOpen(false);
      setMergeSourceId('');
      setMergeTargetId('');
      alert(res.message);
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.admin.updateUserRole(id, role),
    onSuccess: () => {
      refetchUsers();
      setUserModalOpen(false);
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: ({ id, is_active, suspension_reason }: { id: string; is_active: boolean; suspension_reason?: string }) =>
      api.admin.updateUserStatus(id, { is_active, suspension_reason }),
    onSuccess: () => {
      refetchUsers();
      setUserModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const toggleVerifyMutation = useMutation({
    mutationFn: (id: string) => api.admin.toggleUserVerification(id),
    onSuccess: () => refetchUsers(),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: Partial<SystemSettings>) => api.admin.updateSettings(data),
    onSuccess: () => {
      refetchSettings();
      alert('Platform settings successfully updated.');
    },
  });

  if (!isModerator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck size={48} weight="duotone" className="text-[#991b1b] mx-auto" />
        <h2 className="text-xl font-bold text-[#0a0a0a]">Restricted Area</h2>
        <p className="text-xs text-[#525252]">Only verified moderators and platform administrators can access this control center.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Center Hero Banner & Section Tabs */}
      <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#991b1b]" />
              <h1 className="text-xl font-extrabold tracking-tight text-[#0a0a0a]">
                InternScope Control Center
              </h1>
              <Badge variant="blood" size="sm">
                {user.role.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-[#737373] mt-1">
              Platform supervisory console, trust & safety enforcement, and data governance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-[#16a34a] bg-emerald-50 border border-emerald-200 rounded-[2px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              Live Governance Node
            </span>
          </div>
        </div>

        {/* Section Quick Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 border-t border-[#f5f5f5]">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'overview'
                ? 'bg-[#0a0a0a] text-white font-semibold'
                : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
            }`}
          >
            <Gauge size={14} weight={activeSection === 'overview' ? 'fill' : 'bold'} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveSection('moderation')}
            className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'moderation'
                ? 'bg-[#0a0a0a] text-white font-semibold'
                : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
            }`}
          >
            <ShieldCheck size={14} weight={activeSection === 'moderation' ? 'fill' : 'bold'} />
            <span>Content Moderation</span>
            {(metrics?.pending_experiences || 0) + (metrics?.open_reports || 0) > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                activeSection === 'moderation' ? 'bg-[#991b1b] text-white' : 'bg-[#fee2e2] text-[#991b1b]'
              }`}>
                {(metrics?.pending_experiences || 0) + (metrics?.open_reports || 0)}
              </span>
            )}
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveSection('companies')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'companies'
                    ? 'bg-[#0a0a0a] text-white font-semibold'
                    : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
                }`}
              >
                <Buildings size={14} weight={activeSection === 'companies' ? 'fill' : 'bold'} />
                <span>Company & Data Quality</span>
              </button>

              <button
                onClick={() => setActiveSection('users')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'users'
                    ? 'bg-[#0a0a0a] text-white font-semibold'
                    : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
                }`}
              >
                <Users size={14} weight={activeSection === 'users' ? 'fill' : 'bold'} />
                <span>Users & Access Control</span>
              </button>

              <button
                onClick={() => setActiveSection('analytics')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'analytics'
                    ? 'bg-[#0a0a0a] text-white font-semibold'
                    : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
                }`}
              >
                <ChartBar size={14} weight={activeSection === 'analytics' ? 'fill' : 'bold'} />
                <span>Analytics & Insights</span>
              </button>

              <button
                onClick={() => setActiveSection('settings')}
                className={`px-3 py-1.5 text-xs font-medium rounded-[2px] transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'settings'
                    ? 'bg-[#0a0a0a] text-white font-semibold'
                    : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#f5f5f5] hover:text-[#0a0a0a]'
                }`}
              >
                <Gear size={14} weight={activeSection === 'settings' ? 'fill' : 'bold'} />
                <span>Settings & Audit Trail</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Area (Full Width) */}
      <main className="w-full space-y-6">

            {/* ------------------------------------------------------- */}
            {/* 1. OVERVIEW SECTION */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-1">
                    <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
                      Pending Reviews
                    </span>
                    <div className="text-2xl font-black text-[#991b1b]">{metrics?.pending_experiences || 0}</div>
                    <span className="text-[10px] text-[#737373] flex items-center gap-1">
                      <ClockCounterClockwise size={12} /> {metrics?.open_reports || 0} open user reports
                    </span>
                  </div>

                  <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-1">
                    <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
                      Published Reports
                    </span>
                    <div className="text-2xl font-black text-[#0a0a0a]">{metrics?.published_experiences || 0}</div>
                    <span className="text-[10px] text-[#16a34a] font-medium flex items-center gap-0.5">
                      <TrendUp size={12} /> +{metrics?.new_experiences_7d || 0} this week
                    </span>
                  </div>

                  <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-1">
                    <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
                      Active Opportunities
                    </span>
                    <div className="text-2xl font-black text-[#0a0a0a]">{metrics?.active_opportunities || 0}</div>
                    <span className="text-[10px] text-[#b45309] font-medium">
                      {metrics?.expiring_soon_opportunities || 0} expiring soon
                    </span>
                  </div>

                  <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-1">
                    <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
                      Registered Students
                    </span>
                    <div className="text-2xl font-black text-[#0a0a0a]">{metrics?.total_users || 0}</div>
                    <span className="text-[10px] text-[#16a34a] font-medium flex items-center gap-0.5">
                      <TrendUp size={12} /> +{metrics?.new_users_7d || 0} this week
                    </span>
                  </div>
                </div>

                {/* Urgent Queue Teasers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pending Experiences Teaser */}
                  <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f5f5f5] pb-2">
                      <div className="flex items-center gap-2">
                        <Article size={18} weight="bold" className="text-[#991b1b]" />
                        <h3 className="font-bold text-sm text-[#0a0a0a]">Pending Submissions Queue</h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveSection('moderation');
                          setModerationTab('pending');
                        }}
                        className="text-xs font-semibold text-[#991b1b] hover:underline"
                      >
                        View All ({pendingExperiences?.length || 0})
                      </button>
                    </div>

                    {pendingExperiences?.length === 0 ? (
                      <p className="text-xs text-[#737373] py-4 text-center">Queue is cleared. No submissions awaiting review.</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingExperiences?.slice(0, 3).map((exp) => (
                          <div key={exp.id} className="p-2.5 bg-[#f5f5f5] rounded-[2px] flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-xs text-[#0a0a0a]">{exp.position}</div>
                              <div className="text-[11px] text-[#737373]">{exp.company?.name} • {exp.author?.full_name}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveSection('moderation');
                                setModerationTab('pending');
                              }}
                            >
                              Review
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Open Reports Teaser */}
                  <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#f5f5f5] pb-2">
                      <div className="flex items-center gap-2">
                        <Flag size={18} weight="bold" className="text-[#991b1b]" />
                        <h3 className="font-bold text-sm text-[#0a0a0a]">Flagged Reports Requiring Action</h3>
                      </div>
                      <button
                        onClick={() => {
                          setActiveSection('moderation');
                          setModerationTab('reports');
                        }}
                        className="text-xs font-semibold text-[#991b1b] hover:underline"
                      >
                        View All ({reports?.length || 0})
                      </button>
                    </div>

                    {reports?.length === 0 ? (
                      <p className="text-xs text-[#737373] py-4 text-center">No open user flags or misleading claims.</p>
                    ) : (
                      <div className="space-y-2">
                        {reports?.slice(0, 3).map((rep) => (
                          <div key={`${rep.target_type}-${rep.target_id}`} className="p-2.5 bg-[#f5f5f5] rounded-[2px] flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-xs text-[#0a0a0a]">{rep.target_title || rep.target_id}</div>
                              <div className="text-[11px] text-[#737373]">{rep.report_count} flag(s): {rep.reasons.join(', ')}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(rep);
                                setReportActionModalOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Moderation Actions Log */}
                <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                  <div className="flex items-center gap-2 border-b border-[#f5f5f5] pb-2">
                    <ClockCounterClockwise size={18} weight="bold" className="text-[#0a0a0a]" />
                    <h3 className="font-bold text-sm text-[#0a0a0a]">Recent Moderation & Governance Actions</h3>
                  </div>

                  <div className="divide-y divide-[#f5f5f5]">
                    {metrics?.recent_actions?.length === 0 ? (
                      <p className="text-xs text-[#737373] py-4 text-center">No recent logged actions recorded.</p>
                    ) : (
                      metrics?.recent_actions?.map((act) => (
                        <div key={act.id} className="py-2.5 flex items-center justify-between text-xs">
                          <div className="space-y-0.5">
                            <span className="font-mono font-semibold text-[#0a0a0a]">{act.action}</span>
                            <span className="text-[#737373] block">
                              By {act.actor_name} on {act.entity_type} {act.entity_id ? `(#${act.entity_id.slice(0, 8)})` : ''}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#a3a3a3]">
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 2. CONTENT MODERATION SECTION */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'moderation' && (
              <div className="space-y-4">
                {/* Moderation Sub-Tabs */}
                <div className="flex border-b border-[#e5e5e5] gap-6 text-xs font-semibold bg-white px-4 pt-3 rounded-t-[2px]">
                  <button
                    onClick={() => setModerationTab('pending')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                      moderationTab === 'pending'
                        ? 'border-[#991b1b] text-[#0a0a0a]'
                        : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>Pending Submissions</span>
                    <Badge variant="blood" size="sm">{pendingExperiences?.length || 0}</Badge>
                  </button>

                  <button
                    onClick={() => setModerationTab('reports')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                      moderationTab === 'reports'
                        ? 'border-[#991b1b] text-[#0a0a0a]'
                        : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>Grouped Reports</span>
                    <Badge variant="blood" size="sm">{reports?.length || 0}</Badge>
                  </button>

                  <button
                    onClick={() => setModerationTab('experiences')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                      moderationTab === 'experiences'
                        ? 'border-[#991b1b] text-[#0a0a0a]'
                        : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>All Experiences</span>
                  </button>

                  <button
                    onClick={() => setModerationTab('qa')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                      moderationTab === 'qa'
                        ? 'border-[#991b1b] text-[#0a0a0a]'
                        : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>Q&A & Discussions</span>
                  </button>

                  <button
                    onClick={() => setModerationTab('opportunities')}
                    className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                      moderationTab === 'opportunities'
                        ? 'border-[#991b1b] text-[#0a0a0a]'
                        : 'border-transparent text-[#737373] hover:text-[#0a0a0a]'
                    }`}
                  >
                    <span>Opportunities</span>
                  </button>
                </div>

                {/* Subtab 1: Pending Queue */}
                {moderationTab === 'pending' && (
                  <div className="space-y-4">
                    {pendingExperiences?.length === 0 ? (
                      <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
                        <CheckCircle size={36} weight="fill" className="text-[#16a34a] mx-auto" />
                        <h3 className="font-bold text-base text-[#0a0a0a]">Pending Queue Cleared</h3>
                        <p className="text-xs text-[#525252]">All submitted student experiences have been reviewed.</p>
                      </div>
                    ) : (
                      pendingExperiences?.map((exp) => (
                        <div key={exp.id} className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 text-xs text-[#737373]">
                                <span className="font-bold text-[#0a0a0a]">{exp.company?.name}</span>
                                <span>•</span>
                                <span>{exp.location} ({exp.work_type})</span>
                                <span>•</span>
                                <span>Author: {exp.author?.full_name} ({exp.author?.program})</span>
                              </div>
                              <h3 className="font-bold text-lg text-[#0a0a0a] mt-0.5">{exp.position}</h3>
                              {exp.status === 'CORRECTIONS_NEEDED' && (
                                <span className="inline-block mt-1 text-[11px] font-semibold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded">
                                  Corrections Requested: {exp.rejection_reason}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => moderateExperienceMutation.mutate({ id: exp.id, action: 'APPROVE' })}
                                isLoading={moderateExperienceMutation.isPending}
                              >
                                <CheckCircle size={16} weight="bold" /> Approve & Publish
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedExp(exp);
                                  setIsCorrectionsAction(true);
                                  setRejectModalOpen(true);
                                }}
                              >
                                Request Corrections
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  setSelectedExp(exp);
                                  setIsCorrectionsAction(false);
                                  setRejectModalOpen(true);
                                }}
                              >
                                <XCircle size={16} weight="bold" /> Reject
                              </Button>
                            </div>
                          </div>

                          <div className="p-4 bg-[#f5f5f5] rounded-[2px] text-xs text-[#404040] space-y-2">
                            <div>
                              <strong className="text-[#0a0a0a] block">Core Responsibilities:</strong>
                              <p className="whitespace-pre-line mt-0.5">{exp.responsibilities}</p>
                            </div>
                            {exp.projects && (
                              <div>
                                <strong className="text-[#0a0a0a] block">Projects & Deliverables:</strong>
                                <p className="whitespace-pre-line mt-0.5">{exp.projects}</p>
                              </div>
                            )}
                            {exp.is_allowance_disclosed && (
                              <div>
                                <strong className="text-[#0a0a0a]">Disclosed Allowance: </strong>
                                <span>{exp.currency} {exp.allowance} / {exp.allowance_period}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Subtab 2: Grouped Reports with Lifecycle */}
                {moderationTab === 'reports' && (
                  <div className="space-y-4">
                    {/* Status Filter Bar */}
                    <div className="flex items-center gap-2 bg-white border border-[#e5e5e5] p-2.5 rounded-[2px]">
                      <span className="text-xs font-semibold text-[#737373] uppercase pl-1">Status:</span>
                      {(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'ALL'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setReportStatusFilter(s)}
                          className={`text-xs px-2.5 py-1 rounded-[2px] font-medium transition-colors ${
                            reportStatusFilter === s
                              ? 'bg-[#0a0a0a] text-white'
                              : 'text-[#404040] hover:bg-[#f5f5f5]'
                          }`}
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>

                    {reports?.length === 0 ? (
                      <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
                        <CheckCircle size={36} weight="fill" className="text-[#16a34a] mx-auto" />
                        <h3 className="font-bold text-base text-[#0a0a0a]">No Reports in this State</h3>
                        <p className="text-xs text-[#525252]">All reports for this category have been processed.</p>
                      </div>
                    ) : (
                      reports?.map((rep) => (
                        <div
                          key={`${rep.target_type}-${rep.target_id}`}
                          className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  rep.status === 'PENDING'
                                    ? 'bg-[#fee2e2] text-[#991b1b]'
                                    : rep.status === 'UNDER_REVIEW'
                                    ? 'bg-[#fef3c7] text-[#b45309]'
                                    : 'bg-[#dcfce7] text-[#16a34a]'
                                }`}>
                                  {rep.status}
                                </span>
                                <span className="text-xs font-semibold text-[#737373]">
                                  Target: {rep.target_type}
                                </span>
                                <span className="text-xs text-[#a3a3a3]">•</span>
                                <span className="text-xs text-[#737373]">
                                  {rep.report_count} Report(s)
                                </span>
                              </div>
                              <h4 className="font-bold text-base text-[#0a0a0a] mt-1">
                                {rep.target_title || `ID: ${rep.target_id}`}
                              </h4>
                              {rep.target_subtitle && (
                                <p className="text-xs text-[#525252]">{rep.target_subtitle}</p>
                              )}
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                setSelectedReport(rep);
                                setReportNewStatus(rep.status === 'PENDING' ? 'UNDER_REVIEW' : 'RESOLVED');
                                setReportActionModalOpen(true);
                              }}
                            >
                              Manage Case Lifecycle
                            </Button>
                          </div>

                          {/* Individual report reasons and details */}
                          <div className="bg-[#f5f5f5] p-3 rounded-[2px] space-y-2 text-xs">
                            <span className="font-semibold text-[#0a0a0a] block">
                              Report Reasons: {rep.reasons.join(', ')}
                            </span>
                            {rep.reports.map((item, idx) => (
                              <div key={item.id} className="text-[#525252] pl-2 border-l-2 border-[#d4d4d4]">
                                <span>"{item.details || 'No additional note provided'}"</span>
                                <span className="text-[10px] text-[#737373] block mt-0.5">
                                  — {item.reporter_name} on {new Date(item.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>

                          {rep.resolution_notes && (
                            <div className="text-xs text-[#16a34a] bg-[#f0fdf4] p-2.5 rounded-[2px] border border-[#bbf7d0]">
                              <strong>Resolution Note:</strong> {rep.resolution_notes}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Subtab 3: All Experiences with Relink */}
                {moderationTab === 'experiences' && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Search experiences by role or duties..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-white border border-[#e5e5e5] px-3 py-1.5 text-xs rounded-[2px] outline-none"
                      />
                    </div>

                    <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f5f5f5] font-semibold border-b border-[#e5e5e5]">
                          <tr>
                            <th className="p-3">Role & Organization</th>
                            <th className="p-3">Author</th>
                            <th className="p-3">Allowance</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e5e5]">
                          {allExperiences?.map((e) => (
                            <tr key={e.id} className="hover:bg-[#fafafa]">
                              <td className="p-3">
                                <div className="font-semibold text-[#0a0a0a]">{e.position}</div>
                                <div className="text-[11px] text-[#737373]">{e.company?.name}</div>
                              </td>
                              <td className="p-3 text-[#525252]">{e.author?.full_name}</td>
                              <td className="p-3">{e.currency} {e.allowance || 'N/A'}</td>
                              <td className="p-3">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  e.status === 'PUBLISHED' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#991b1b]'
                                }`}>
                                  {e.status}
                                </span>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedExp(e);
                                    setRelinkModalOpen(true);
                                  }}
                                  className="text-xs text-[#991b1b] font-medium hover:underline"
                                >
                                  Re-link Company
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Subtab 4: QA & Community Discussions */}
                {moderationTab === 'qa' && (
                  <div className="space-y-3">
                    {qaItems?.length === 0 ? (
                      <p className="text-xs text-[#737373] p-8 text-center bg-white border border-[#e5e5e5]">No Q&A discussion items found.</p>
                    ) : (
                      qaItems?.map((q) => (
                        <div key={q.id} className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] flex items-center justify-between gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" size="sm">{q.type.replace('_', ' ')}</Badge>
                              <span className="font-semibold text-[#0a0a0a]">{q.author}</span>
                              <span className="text-[#a3a3a3]">•</span>
                              <span className="text-[#737373]">{new Date(q.created_at).toLocaleDateString()}</span>
                            </div>
                            <h5 className="font-bold text-[#0a0a0a]">{q.title}</h5>
                            <p className="text-[#525252]">{q.content}</p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {q.status !== 'PUBLISHED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQAStatusMutation.mutate({ itemType: q.type, id: q.id, status: 'PUBLISHED' })}
                              >
                                Publish
                              </Button>
                            )}
                            {q.status !== 'HIDDEN' && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => updateQAStatusMutation.mutate({ itemType: q.type, id: q.id, status: 'HIDDEN' })}
                              >
                                Hide
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Subtab 5: Opportunities Review */}
                {moderationTab === 'opportunities' && (
                  <div className="space-y-4">
                    <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f5f5f5] font-semibold border-b border-[#e5e5e5]">
                          <tr>
                            <th className="p-3">Title & Organization</th>
                            <th className="p-3">Deadline</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e5e5]">
                          {opportunities?.map((opp) => (
                            <tr key={opp.id} className="hover:bg-[#fafafa]">
                              <td className="p-3">
                                <div className="font-semibold text-[#0a0a0a]">{opp.title}</div>
                                <div className="text-[11px] text-[#737373]">{opp.company_name}</div>
                              </td>
                              <td className="p-3">
                                {opp.deadline || 'No deadline'}
                                {opp.is_expired && (
                                  <span className="ml-2 text-[10px] text-[#991b1b] font-bold">EXPIRED</span>
                                )}
                              </td>
                              <td className="p-3">
                                <Badge variant={opp.status === 'OPEN' ? 'success' : 'outline'} size="sm">
                                  {opp.status}
                                </Badge>
                              </td>
                              <td className="p-3 text-right space-x-2">
                                {opp.status === 'OPEN' ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateOpportunityStatusMutation.mutate({ id: opp.id, status: 'CLOSED' })}
                                  >
                                    Mark Closed
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => updateOpportunityStatusMutation.mutate({ id: opp.id, status: 'OPEN' })}
                                  >
                                    Re-Open
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 3. COMPANY & DATA QUALITY SECTION (ADMIN ONLY) */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'companies' && isAdmin && (
              <div className="space-y-4">
                {/* Sub-tabs */}
                <div className="flex border-b border-[#e5e5e5] gap-6 text-xs font-semibold bg-white px-4 pt-3 rounded-t-[2px]">
                  <button
                    onClick={() => setCompanyTab('directory')}
                    className={`pb-3 border-b-2 transition-colors ${
                      companyTab === 'directory' ? 'border-[#991b1b] text-[#0a0a0a]' : 'border-transparent text-[#737373]'
                    }`}
                  >
                    Organizations Directory
                  </button>
                  <button
                    onClick={() => setCompanyTab('quality')}
                    className={`pb-3 border-b-2 transition-colors ${
                      companyTab === 'quality' ? 'border-[#991b1b] text-[#0a0a0a]' : 'border-transparent text-[#737373]'
                    }`}
                  >
                    Data Quality Scanner ({dataQuality?.items?.length || 0})
                  </button>
                  <button
                    onClick={() => setCompanyTab('merge')}
                    className={`pb-3 border-b-2 transition-colors ${
                      companyTab === 'merge' ? 'border-[#991b1b] text-[#0a0a0a]' : 'border-transparent text-[#737373]'
                    }`}
                  >
                    Merge Duplicate Companies
                  </button>
                  <button
                    onClick={() => setCompanyTab('taxonomies')}
                    className={`pb-3 border-b-2 transition-colors ${
                      companyTab === 'taxonomies' ? 'border-[#991b1b] text-[#0a0a0a]' : 'border-transparent text-[#737373]'
                    }`}
                  >
                    Skills & Taxonomies
                  </button>
                </div>

                {/* Directory Subtab */}
                {companyTab === 'directory' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <input
                        type="text"
                        placeholder="Search organizations by name, domain, or industry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-white border border-[#e5e5e5] px-3 py-1.5 text-xs rounded-[2px] outline-none flex-1"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setEditingCompany(null);
                          setCompanyFormData({
                            name: '',
                            industry: '',
                            headquarters: '',
                            website: '',
                            careers_url: '',
                            domain: '',
                            logo_url: '',
                            description: '',
                            is_verified: false,
                            is_archived: false,
                          });
                          setCompanyModalOpen(true);
                        }}
                      >
                        <Plus size={14} weight="bold" /> Add Organization
                      </Button>
                    </div>

                    <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#f5f5f5] font-semibold border-b border-[#e5e5e5]">
                          <tr>
                            <th className="p-3">Organization</th>
                            <th className="p-3">Industry & HQ</th>
                            <th className="p-3">Verified</th>
                            <th className="p-3">Experiences</th>
                            <th className="p-3">Archived</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e5e5e5]">
                          {companiesList?.map((comp) => (
                            <tr key={comp.id} className="hover:bg-[#fafafa]">
                              <td className="p-3 font-semibold text-[#0a0a0a]">
                                {comp.name}
                                {comp.website && (
                                  <a href={comp.website} target="_blank" rel="noreferrer" className="block text-[11px] text-[#991b1b] hover:underline">
                                    {comp.website}
                                  </a>
                                )}
                              </td>
                              <td className="p-3 text-[#525252]">{comp.industry} • {comp.headquarters}</td>
                              <td className="p-3">
                                {comp.is_verified ? (
                                  <span className="text-[#16a34a] font-bold">Yes</span>
                                ) : (
                                  <span className="text-[#737373]">No</span>
                                )}
                              </td>
                              <td className="p-3 font-mono">{comp.experiences_count}</td>
                              <td className="p-3">
                                {comp.is_archived ? (
                                  <span className="text-[#991b1b] font-bold">Archived</span>
                                ) : (
                                  <span className="text-[#16a34a]">Active</span>
                                )}
                              </td>
                              <td className="p-3 text-right space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCompany(comp);
                                    setCompanyFormData({
                                      name: comp.name,
                                      industry: comp.industry,
                                      headquarters: comp.headquarters,
                                      website: comp.website || '',
                                      careers_url: comp.careers_url || '',
                                      domain: comp.domain || '',
                                      logo_url: comp.logo_url || '',
                                      description: comp.description || '',
                                      is_verified: comp.is_verified,
                                      is_archived: comp.is_archived,
                                    });
                                    setCompanyModalOpen(true);
                                  }}
                                >
                                  Edit
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Data Quality Scanner */}
                {companyTab === 'quality' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
                        <span className="text-[11px] text-[#737373] block">Missing Website</span>
                        <span className="text-xl font-bold text-[#b45309]">{dataQuality?.missing_websites_count}</span>
                      </div>
                      <div className="bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
                        <span className="text-[11px] text-[#737373] block">Missing Logos</span>
                        <span className="text-xl font-bold text-[#b45309]">{dataQuality?.missing_logos_count}</span>
                      </div>
                      <div className="bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
                        <span className="text-[11px] text-[#737373] block">Expired Open Listings</span>
                        <span className="text-xl font-bold text-[#991b1b]">{dataQuality?.expired_open_opportunities_count}</span>
                      </div>
                      <div className="bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
                        <span className="text-[11px] text-[#737373] block">Potential Duplicates</span>
                        <span className="text-xl font-bold text-[#991b1b]">{dataQuality?.possible_duplicates_count}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-[#e5e5e5] rounded-[2px] divide-y divide-[#f5f5f5]">
                      {dataQuality?.items.map((item) => (
                        <div key={`${item.id}-${item.issue_type}`} className="p-3.5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-[#0a0a0a]">{item.name}</span>
                            <span className="text-[#991b1b] font-medium ml-2">[{item.issue}]</span>
                            <p className="text-[11px] text-[#737373]">{item.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Company Merge Tool */}
                {companyTab === 'merge' && (
                  <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-[#0a0a0a]">Safe Organization Merge Tool</h4>
                      <p className="text-xs text-[#525252]">
                        Merge duplicate company profiles without losing reviews. All experience reports, active opportunities, and student bookmarks will be transferred to the target organization.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0a0a0a] block">
                          Source Company (Will be archived/merged)
                        </label>
                        <select
                          value={mergeSourceId}
                          onChange={(e) => setMergeSourceId(e.target.value)}
                          className="w-full bg-white border border-[#e5e5e5] p-2 text-xs rounded-[2px]"
                        >
                          <option value="">Select source company...</option>
                          {companiesList?.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#0a0a0a] block">
                          Target Master Company (Receives all records)
                        </label>
                        <select
                          value={mergeTargetId}
                          onChange={(e) => setMergeTargetId(e.target.value)}
                          className="w-full bg-white border border-[#e5e5e5] p-2 text-xs rounded-[2px]"
                        >
                          <option value="">Select master target company...</option>
                          {companiesList?.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={!mergeSourceId || !mergeTargetId || mergeSourceId === mergeTargetId}
                        onClick={() => mergeCompaniesMutation.mutate({ source_company_id: mergeSourceId, target_company_id: mergeTargetId })}
                        isLoading={mergeCompaniesMutation.isPending}
                      >
                        <ArrowsMerge size={14} weight="bold" /> Execute Safe Merge
                      </Button>
                    </div>
                  </div>
                )}

                {/* Taxonomies Subtab */}
                {companyTab === 'taxonomies' && (
                  <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-4">
                    <h4 className="font-bold text-sm text-[#0a0a0a]">Standardized Skill & Technology Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {taxonomies?.map((t: any) => (
                        <div key={t.id} className="bg-[#f5f5f5] px-2.5 py-1 rounded-[2px] flex items-center gap-2 text-xs">
                          <span>{t.name}</span>
                          <span className="text-[10px] text-[#737373]">({t.usage_count} uses)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 4. USERS & ACCESS CONTROL SECTION (ADMIN ONLY) */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'users' && isAdmin && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <input
                    type="text"
                    placeholder="Search users by name, university email, or program..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-[#e5e5e5] px-3 py-1.5 text-xs rounded-[2px] outline-none flex-1"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserTab('all')}
                      className={`text-xs px-2.5 py-1 rounded-[2px] font-medium ${
                        userTab === 'all' ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e5e5e5]'
                      }`}
                    >
                      All Users
                    </button>
                    <button
                      onClick={() => setUserTab('moderators')}
                      className={`text-xs px-2.5 py-1 rounded-[2px] font-medium ${
                        userTab === 'moderators' ? 'bg-[#0a0a0a] text-white' : 'bg-white border border-[#e5e5e5]'
                      }`}
                    >
                      Moderators & Admins
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f5f5f5] font-semibold border-b border-[#e5e5e5]">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Program</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Contributions</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                      {usersList?.map((u) => (
                        <tr key={u.id} className="hover:bg-[#fafafa]">
                          <td className="p-3 font-semibold text-[#0a0a0a]">
                            {u.full_name}
                            <span className="block text-[11px] text-[#737373] font-normal">{u.email}</span>
                          </td>
                          <td className="p-3 text-[#525252]">{u.program || 'N/A'}</td>
                          <td className="p-3">
                            <span className="capitalize font-bold text-[#0a0a0a]">{u.role}</span>
                          </td>
                          <td className="p-3">
                            {u.is_active ? (
                              <span className="text-[#16a34a] font-semibold">Active</span>
                            ) : (
                              <span className="text-[#991b1b] font-semibold">Suspended</span>
                            )}
                          </td>
                          <td className="p-3 text-[#737373]">
                            {u.experiences_count} reviews • {u.questions_count} Qs
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserRoleUpdate(u.role);
                                setUserSuspensionReason(u.suspension_reason || '');
                                setUserModalOpen(true);
                              }}
                            >
                              Manage Access
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 5. ANALYTICS & INSIGHTS (ADMIN ONLY) */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'analytics' && isAdmin && (
              <div className="space-y-6">
                {/* Allowance Transparency Benchmark */}
                <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#f5f5f5] pb-2">
                    <div>
                      <h4 className="font-bold text-sm text-[#0a0a0a]">Monthly Allowance Distribution (Industrial Benchmark)</h4>
                      <span className="text-xs text-[#737373]">Sample size: {analytics?.allowance_distribution.sample_size} published disclosures</span>
                    </div>
                    <Badge variant="outline" size="sm">{analytics?.allowance_distribution.currency}</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                    <div className="bg-[#f5f5f5] p-3 rounded-[2px]">
                      <span className="text-[10px] text-[#737373] block uppercase">Minimum</span>
                      <span className="text-lg font-black text-[#0a0a0a]">{analytics?.allowance_distribution.min || 'N/A'}</span>
                    </div>
                    <div className="bg-[#f5f5f5] p-3 rounded-[2px]">
                      <span className="text-[10px] text-[#737373] block uppercase">25th Percentile</span>
                      <span className="text-lg font-black text-[#0a0a0a]">{analytics?.allowance_distribution.p25 || 'N/A'}</span>
                    </div>
                    <div className="bg-[#fef2f2] p-3 rounded-[2px] border border-[#fecaca]">
                      <span className="text-[10px] text-[#991b1b] block uppercase font-bold">Median Benchmark</span>
                      <span className="text-lg font-black text-[#991b1b]">{analytics?.allowance_distribution.median || 'N/A'}</span>
                    </div>
                    <div className="bg-[#f5f5f5] p-3 rounded-[2px]">
                      <span className="text-[10px] text-[#737373] block uppercase">75th Percentile</span>
                      <span className="text-lg font-black text-[#0a0a0a]">{analytics?.allowance_distribution.p75 || 'N/A'}</span>
                    </div>
                    <div className="bg-[#f5f5f5] p-3 rounded-[2px]">
                      <span className="text-[10px] text-[#737373] block uppercase">Maximum</span>
                      <span className="text-lg font-black text-[#0a0a0a]">{analytics?.allowance_distribution.max || 'N/A'}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#737373] italic pt-1">
                    *{analytics?.allowance_distribution.disclaimer}
                  </p>
                </div>

                {/* Reports Breakdown by Industry & Top Companies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                    <h4 className="font-bold text-sm text-[#0a0a0a] border-b border-[#f5f5f5] pb-2">
                      Experience Reports by Industry
                    </h4>
                    <div className="space-y-2 text-xs">
                      {Object.entries(analytics?.reports_by_industry || {}).map(([ind, count]) => (
                        <div key={ind} className="flex justify-between items-center py-1">
                          <span className="text-[#404040]">{ind}</span>
                          <span className="font-bold text-[#0a0a0a]">{count} reports</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-3">
                    <h4 className="font-bold text-sm text-[#0a0a0a] border-b border-[#f5f5f5] pb-2">
                      Top Organizations by Submissions
                    </h4>
                    <div className="space-y-2 text-xs">
                      {analytics?.top_companies_by_reports.map((comp) => (
                        <div key={comp.slug} className="flex justify-between items-center py-1">
                          <span className="font-medium text-[#0a0a0a]">{comp.name}</span>
                          <span className="font-bold text-[#991b1b]">{comp.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------- */}
            {/* 6. SETTINGS & AUDIT TRAIL (ADMIN ONLY) */}
            {/* ------------------------------------------------------- */}
            {activeSection === 'settings' && isAdmin && (
              <div className="space-y-6">
                {/* Platform Governance Settings */}
                <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-4">
                  <h4 className="font-bold text-sm text-[#0a0a0a] border-b border-[#f5f5f5] pb-2">
                    System Moderation & Registration Toggles
                  </h4>

                  <div className="space-y-3 text-xs">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings?.require_experience_approval}
                        onChange={(e) => updateSettingsMutation.mutate({ require_experience_approval: e.target.checked })}
                      />
                      <span><strong>Require Moderator Approval for Experiences:</strong> Submissions must be approved before public indexing.</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings?.allow_student_registrations}
                        onChange={(e) => updateSettingsMutation.mutate({ allow_student_registrations: e.target.checked })}
                      />
                      <span><strong>Open University Registration:</strong> Allow new student signups using institutional domains.</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={settings?.maintenance_mode}
                        onChange={(e) => updateSettingsMutation.mutate({ maintenance_mode: e.target.checked })}
                      />
                      <span><strong>Maintenance Mode:</strong> Restrict student mutations during database upgrades.</span>
                    </label>
                  </div>
                </div>

                {/* Audit Logs Explorer */}
                <div className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#f5f5f5] pb-2">
                    <h4 className="font-bold text-sm text-[#0a0a0a]">Immutable Audit Trail Explorer</h4>
                    <Button variant="outline" size="sm" onClick={() => refetchAuditLogs()}>
                      <ArrowsClockwise size={14} /> Refresh
                    </Button>
                  </div>

                  <div className="divide-y divide-[#f5f5f5] text-xs">
                    {auditLogs?.map((log) => (
                      <div key={log.id} className="py-2.5 flex items-start justify-between gap-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-[#0a0a0a]">{log.action}</span>
                          <span className="text-[#525252] block">
                            By <strong>{log.actor_name}</strong> on entity {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
                          </span>
                          {log.meta_data && (
                            <pre className="text-[10px] text-[#737373] bg-[#f5f5f5] p-1.5 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(log.meta_data)}
                            </pre>
                          )}
                        </div>
                        <span className="text-[11px] text-[#a3a3a3] shrink-0">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

      </main>

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* 1. Rejection / Corrections Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title={isCorrectionsAction ? "Request Corrections from Student" : "Reject Experience Submission"}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#525252]">
            {isCorrectionsAction
              ? "Specify what details the student should clarify or redact before this experience can be verified."
              : "Provide clear feedback explaining why this submission does not meet community standards."}
          </p>

          <textarea
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g. Please redact internal project names or clarify the duration..."
            className="w-full bg-white border border-[#e5e5e5] p-2.5 rounded-[2px] outline-none"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isCorrectionsAction ? "primary" : "danger"}
              size="sm"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                if (selectedExp) {
                  moderateExperienceMutation.mutate({
                    id: selectedExp.id,
                    action: isCorrectionsAction ? 'REQUEST_CORRECTIONS' : 'REJECT',
                    rejection_reason: rejectionReason.trim(),
                  });
                }
              }}
              isLoading={moderateExperienceMutation.isPending}
            >
              {isCorrectionsAction ? "Send Correction Request" : "Confirm Rejection"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2. Re-link Company Modal */}
      <Modal
        isOpen={relinkModalOpen}
        onClose={() => setRelinkModalOpen(false)}
        title="Re-link Experience to Correct Organization"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#525252]">
            If the contributor accidentally selected an incorrect company, select the correct master organization below.
          </p>

          <select
            value={relinkTargetCompanyId}
            onChange={(e) => setRelinkTargetCompanyId(e.target.value)}
            className="w-full bg-white border border-[#e5e5e5] p-2 text-xs rounded-[2px]"
          >
            <option value="">Select correct organization...</option>
            {companiesList?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setRelinkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!relinkTargetCompanyId}
              onClick={() => {
                if (selectedExp) {
                  relinkExperienceMutation.mutate({ id: selectedExp.id, companyId: relinkTargetCompanyId });
                }
              }}
              isLoading={relinkExperienceMutation.isPending}
            >
              Update Organization
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Report Lifecycle Resolution Modal */}
      <Modal
        isOpen={reportActionModalOpen}
        onClose={() => setReportActionModalOpen(false)}
        title={`Report Case: ${selectedReport?.target_type} #${selectedReport?.target_id.slice(0, 8)}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <h5 className="font-bold text-[#0a0a0a]">{selectedReport?.target_title}</h5>
            <span className="text-[#737373]">Reasons flagged: {selectedReport?.reasons.join(', ')}</span>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0a0a0a] block">Update Case Status:</label>
            <select
              value={reportNewStatus}
              onChange={(e) => setReportNewStatus(e.target.value as any)}
              className="w-full bg-white border border-[#e5e5e5] p-2 rounded-[2px]"
            >
              <option value="UNDER_REVIEW">Under Review (Investigating claims)</option>
              <option value="RESOLVED">Resolved (Action taken / Issue fixed)</option>
              <option value="DISMISSED">Dismissed (False positive / Unfounded)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0a0a0a] block">Direct Content Action:</label>
            <select
              value={reportActionTaken}
              onChange={(e) => setReportActionTaken(e.target.value as any)}
              className="w-full bg-white border border-[#e5e5e5] p-2 rounded-[2px]"
            >
              <option value="NONE">None (Keep content as is)</option>
              <option value="CONTENT_HIDDEN">Hide / Unpublish Target Content Immediately</option>
              <option value="USER_WARNED">Record Warning Against User</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#0a0a0a] block">Resolution Notes:</label>
            <textarea
              rows={3}
              value={reportResolutionNotes}
              onChange={(e) => setReportResolutionNotes(e.target.value)}
              placeholder="Document the resolution and rationale..."
              className="w-full bg-white border border-[#e5e5e5] p-2 rounded-[2px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setReportActionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (selectedReport) {
                  reportLifecycleMutation.mutate({
                    targetType: selectedReport.target_type,
                    targetId: selectedReport.target_id,
                    data: {
                      status: reportNewStatus,
                      resolution_notes: reportResolutionNotes.trim() || undefined,
                      action_taken: reportActionTaken !== 'NONE' ? reportActionTaken : undefined,
                    },
                  });
                }
              }}
              isLoading={reportLifecycleMutation.isPending}
            >
              Save Resolution
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Company Edit / Create Modal */}
      <Modal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title={editingCompany ? `Edit Organization: ${editingCompany.name}` : "Create New Organization"}
        maxWidth="lg"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Name</label>
              <input
                type="text"
                value={companyFormData.name}
                onChange={(e) => setCompanyFormData({ ...companyFormData, name: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Industry</label>
              <input
                type="text"
                value={companyFormData.industry}
                onChange={(e) => setCompanyFormData({ ...companyFormData, industry: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Headquarters</label>
              <input
                type="text"
                value={companyFormData.headquarters}
                onChange={(e) => setCompanyFormData({ ...companyFormData, headquarters: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Website</label>
              <input
                type="text"
                value={companyFormData.website}
                onChange={(e) => setCompanyFormData({ ...companyFormData, website: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Careers URL</label>
              <input
                type="text"
                value={companyFormData.careers_url}
                onChange={(e) => setCompanyFormData({ ...companyFormData, careers_url: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
            <div>
              <label className="font-semibold block text-[#0a0a0a]">Logo URL</label>
              <input
                type="text"
                value={companyFormData.logo_url}
                onChange={(e) => setCompanyFormData({ ...companyFormData, logo_url: e.target.value })}
                className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={companyFormData.is_verified}
                onChange={(e) => setCompanyFormData({ ...companyFormData, is_verified: e.target.checked })}
              />
              <span>Verified Employer</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={companyFormData.is_archived}
                onChange={(e) => setCompanyFormData({ ...companyFormData, is_archived: e.target.checked })}
              />
              <span>Archived (Safe Deactivation)</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => saveCompanyMutation.mutate(companyFormData)}
              isLoading={saveCompanyMutation.isPending}
            >
              Save Organization
            </Button>
          </div>
        </div>
      </Modal>

      {/* 5. User Role & Suspension Modal */}
      <Modal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title={`Manage User: ${selectedUser?.full_name}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#0a0a0a] block">System Role:</label>
            <select
              value={userRoleUpdate}
              onChange={(e) => setUserRoleUpdate(e.target.value as any)}
              className="w-full bg-white border border-[#e5e5e5] p-2 rounded-[2px]"
            >
              <option value="student">Student (Standard user)</option>
              <option value="moderator">Moderator (Review queue & reports)</option>
              <option value="admin">Administrator (Full governance)</option>
            </select>
          </div>

          <div className="pt-2 border-t border-[#f5f5f5] space-y-2">
            <label className="font-semibold text-[#0a0a0a] block">Account Status:</label>
            {selectedUser?.is_active ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Reason for suspension..."
                  value={userSuspensionReason}
                  onChange={(e) => setUserSuspensionReason(e.target.value)}
                  className="w-full border border-[#e5e5e5] p-2 rounded-[2px]"
                />
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (selectedUser) {
                      updateUserStatusMutation.mutate({
                        id: selectedUser.id,
                        is_active: false,
                        suspension_reason: userSuspensionReason,
                      });
                    }
                  }}
                  isLoading={updateUserStatusMutation.isPending}
                >
                  <Prohibit size={14} /> Suspend Account
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedUser) {
                    updateUserStatusMutation.mutate({ id: selectedUser.id, is_active: true });
                  }
                }}
                isLoading={updateUserStatusMutation.isPending}
              >
                Reactivate Account
              </Button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setUserModalOpen(false)}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (selectedUser) {
                  updateUserRoleMutation.mutate({ id: selectedUser.id, role: userRoleUpdate });
                }
              }}
              isLoading={updateUserRoleMutation.isPending}
            >
              Save Role Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  WarningCircle,
  Flag,
  Users,
  Article,
  Buildings,
  Briefcase
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import type { InternshipExperience, ContentReport } from '../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'pending' | 'reports' | 'users'>('pending');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedExp, setSelectedExp] = useState<InternshipExperience | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch metrics
  const { data: metrics } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.admin.getMetrics(),
    enabled: user?.role === 'moderator' || user?.role === 'admin',
  });

  // Fetch pending submissions
  const { data: pendingExperiences, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending'],
    queryFn: () => api.admin.listPending(),
    enabled: user?.role === 'moderator' || user?.role === 'admin',
  });

  // Fetch reports
  const { data: reports, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => api.admin.listReports('PENDING'),
    enabled: user?.role === 'moderator' || user?.role === 'admin',
  });

  // Fetch users (if admin)
  const { data: usersList } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.admin.listUsers(),
    enabled: user?.role === 'admin',
  });

  // Moderation Mutations
  const moderateMutation = useMutation({
    mutationFn: ({ id, action, notes, rejection_reason }: any) =>
      api.admin.moderate(id, { action, notes, rejection_reason }),
    onSuccess: () => {
      refetchPending();
      setRejectModalOpen(false);
      setSelectedExp(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const resolveReportMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'RESOLVED' | 'DISMISSED' }) =>
      api.admin.resolveReport(id, status),
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  if (user?.role !== 'moderator' && user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <ShieldCheck size={48} weight="duotone" className="text-[#991b1b] mx-auto" />
        <h2 className="text-xl font-bold text-[#0a0a0a]">Access Restricted</h2>
        <p className="text-xs text-[#525252]">Only authorized moderators and platform administrators can view this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] pb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 bg-[#991b1b]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
              Moderation & Administration
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#525252]">
            Review student submissions, handle flagged content, and maintain community trust.
          </p>
        </div>
        <Badge variant="blood" size="md">
          {user.role.toUpperCase()} PRIVILEGES
        </Badge>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border border-[#e5e5e5] bg-white divide-y lg:divide-y-0 divide-x divide-[#e5e5e5]">
        <div className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Pending Queue
          </span>
          <div className="text-2xl font-extrabold text-[#991b1b]">{metrics?.pending_experiences || 0}</div>
        </div>
        <div className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Published Reports
          </span>
          <div className="text-2xl font-extrabold text-[#0a0a0a]">{metrics?.published_experiences || 0}</div>
        </div>
        <div className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Open Reports
          </span>
          <div className="text-2xl font-extrabold text-[#991b1b]">{metrics?.open_reports || 0}</div>
        </div>
        <div className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Companies
          </span>
          <div className="text-2xl font-extrabold text-[#0a0a0a]">{metrics?.total_companies || 0}</div>
        </div>
        <div className="p-5 space-y-1">
          <span className="text-[11px] font-semibold text-[#737373] uppercase tracking-wider block">
            Registered Users
          </span>
          <div className="text-2xl font-extrabold text-[#0a0a0a]">{metrics?.total_users || 0}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e5] gap-8 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
              : 'text-[#737373] hover:text-[#0a0a0a]'
          }`}
        >
          Pending Submissions ({pendingExperiences?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 transition-colors ${
            activeTab === 'reports'
              ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
              : 'text-[#737373] hover:text-[#0a0a0a]'
          }`}
        >
          Flagged Content Reports ({reports?.length || 0})
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 flex items-center gap-2 transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            User Management ({usersList?.length || 0})
          </button>
        )}
      </div>

      {/* TAB 1: Pending Submissions Queue */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingExperiences?.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
              <CheckCircle size={32} weight="fill" className="text-[#16a34a] mx-auto" />
              <h3 className="font-semibold text-base text-[#0a0a0a]">Pending Queue Cleared</h3>
              <p className="text-xs text-[#525252]">All submitted student experiences have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingExperiences?.map((exp) => (
                <div key={exp.id} className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#737373]">
                        <span>{exp.company?.name}</span>
                        <span>•</span>
                        <span>{exp.location}</span>
                        <span>•</span>
                        <span>{exp.author?.full_name} ({exp.author?.program})</span>
                      </div>
                      <h3 className="font-bold text-lg text-[#0a0a0a] mt-0.5">{exp.position}</h3>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => moderateMutation.mutate({ id: exp.id, action: 'APPROVE' })}
                        isLoading={moderateMutation.isPending}
                      >
                        <CheckCircle size={16} weight="bold" />
                        Approve & Publish
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedExp(exp);
                          setRejectModalOpen(true);
                        }}
                      >
                        <XCircle size={16} weight="bold" />
                        Reject
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
                        <strong className="text-[#0a0a0a] block">Projects:</strong>
                        <p className="whitespace-pre-line mt-0.5">{exp.projects}</p>
                      </div>
                    )}
                    {exp.is_allowance_disclosed && (
                      <div>
                        <strong className="text-[#0a0a0a]">Reported Allowance: </strong>
                        <span>{exp.currency} {exp.allowance} / {exp.allowance_period}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Flagged Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports?.length === 0 ? (
            <div className="p-12 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
              <CheckCircle size={32} weight="fill" className="text-[#16a34a] mx-auto" />
              <h3 className="font-semibold text-base text-[#0a0a0a]">No Pending Reports</h3>
              <p className="text-xs text-[#525252]">There are currently no active user flags or takedown requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports?.map((rep) => (
                <div key={rep.id} className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="blood" size="sm">{rep.reason}</Badge>
                      <span className="text-xs text-[#737373]">Target: {rep.target_type} ({rep.target_id.slice(0, 8)}...)</span>
                    </div>
                    {rep.details && (
                      <p className="text-xs text-[#525252] italic">"{rep.details}"</p>
                    )}
                    <span className="text-[11px] text-[#a3a3a3] block">
                      Reported on {new Date(rep.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveReportMutation.mutate({ id: rep.id, status: 'DISMISSED' })}
                    >
                      Dismiss
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => resolveReportMutation.mutate({ id: rep.id, status: 'RESOLVED' })}
                    >
                      Resolve & Action
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Users Directory (Admin Only) */}
      {activeTab === 'users' && user.role === 'admin' && (
        <div className="bg-white border border-[#e5e5e5] rounded-[2px] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f5f5] text-[#0a0a0a] uppercase tracking-wider font-semibold border-b border-[#e5e5e5]">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Program</th>
                <th className="p-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5]">
              {usersList?.map((u) => (
                <tr key={u.id} className="hover:bg-[#fafafa]">
                  <td className="p-3.5 font-medium text-[#0a0a0a]">{u.full_name}</td>
                  <td className="p-3.5 text-[#525252]">{u.email}</td>
                  <td className="p-3.5">
                    <span className="capitalize">{u.role}</span>
                  </td>
                  <td className="p-3.5 text-[#737373]">{u.program || 'N/A'}</td>
                  <td className="p-3.5">
                    <span className="text-green-700 font-medium">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Rejection Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Experience Submission"
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#525252]">
            Provide feedback explaining why this submission is being rejected so the student can rectify it.
          </p>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
              Rejection Reason
            </label>
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please redact company internal project codenames; describe duties generically..."
              className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2.5 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#f5f5f5]">
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={!rejectionReason.trim()}
              onClick={() => {
                if (selectedExp) {
                  moderateMutation.mutate({
                    id: selectedExp.id,
                    action: 'REJECT',
                    rejection_reason: rejectionReason.trim(),
                  });
                }
              }}
              isLoading={moderateMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

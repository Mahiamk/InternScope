import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlass, Briefcase, Funnel } from '@phosphor-icons/react';
import { api } from '../services/api';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { ReportModal } from '../components/common/ReportModal';
import { Button } from '../components/ui/Button';
import type { Opportunity } from '../types';

export const OpportunitiesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [workType, setWorkType] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'ALL'>('OPEN');
  const [reportedOpp, setReportedOpp] = useState<Opportunity | null>(null);

  const departmentsList = [
    { label: 'All Schools', value: 'All' },
    { label: 'Business & Management', value: 'Business' },
    { label: 'Media & Journalism', value: 'Media' },
    { label: 'Marketing & PR', value: 'Marketing' },
    { label: 'Politics & Policy', value: 'Politics' },
    { label: 'Education & Teaching', value: 'Education' },
    { label: 'Finance & Accounting', value: 'Finance' },
    { label: 'Technology & IT', value: 'Technology' },
  ];

  const { data: opportunitiesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['opportunities-list', { search, department, workType, statusFilter }],
    queryFn: () =>
      api.opportunities.list({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        work_type: workType !== 'All' ? workType : undefined,
        status_filter: statusFilter,
        size: 20,
      }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-[#991b1b]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
            Active Internship Opportunities
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#525252]">
          Verified vacancy listings across all university faculties with direct links to official employer application forms.
        </p>
      </div>

      {/* Toolbar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
              <MagnifyingGlass size={18} weight="bold" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, department, skills, or company..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#e5e5e5] focus:border-[#0a0a0a] rounded-[2px] outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="text-xs sm:text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 focus:border-[#0a0a0a] outline-none"
            >
              <option value="All">All Arrangements</option>
              <option value="onsite">On-site</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs sm:text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 focus:border-[#0a0a0a] outline-none"
            >
              <option value="OPEN">Open Only</option>
              <option value="CLOSED">Closed / Expired</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>
        </div>

        {/* Faculty / School Filter Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#f5f5f5] text-xs">
          <span className="text-[11px] font-bold text-[#0a0a0a] uppercase tracking-wider shrink-0 mr-2">
            Faculty:
          </span>
          {departmentsList.map((dep) => {
            const isActive =
              (department === 'All' && dep.value === 'All') ||
              department.toLowerCase() === dep.value.toLowerCase();
            return (
              <button
                key={dep.value}
                type="button"
                onClick={() => setDepartment(dep.value)}
                className={`px-3 py-1.5 rounded-[2px] whitespace-nowrap transition-colors font-medium border ${
                  isActive
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a] hover:text-[#0a0a0a]'
                }`}
              >
                {dep.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] animate-pulse space-y-3">
              <div className="h-5 bg-neutral-200 w-1/2 rounded-[2px]" />
              <div className="h-4 bg-neutral-200 w-1/3 rounded-[2px]" />
              <div className="h-16 bg-neutral-100 w-full rounded-[2px]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-50 border border-red-200 text-center rounded-[2px]">
          <p className="text-sm text-[#991b1b]">Failed to load opportunities.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : opportunitiesData?.items.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] p-12 text-center rounded-[2px] space-y-3">
          <Briefcase size={32} weight="duotone" className="text-[#991b1b] mx-auto" />
          <h3 className="font-semibold text-base text-[#0a0a0a]">No vacancies found</h3>
          <p className="text-xs text-[#525252]">Try adjusting your search query or arrangement filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {opportunitiesData?.items.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onReportClick={(o) => setReportedOpp(o)}
              onBookmarkChanged={refetch}
            />
          ))}
        </div>
      )}

      {reportedOpp && (
        <ReportModal
          isOpen={!!reportedOpp}
          onClose={() => setReportedOpp(null)}
          targetType="OPPORTUNITY"
          targetId={reportedOpp.id}
          targetTitle={reportedOpp.title}
        />
      )}
    </div>
  );
};

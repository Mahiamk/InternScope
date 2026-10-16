import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MagnifyingGlass, Buildings, Funnel } from '@phosphor-icons/react';
import { api } from '../services/api';
import { CompanyCard } from '../components/companies/CompanyCard';
import { Button } from '../components/ui/Button';

export const CompaniesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');

  const { data: companies, isLoading, isError, refetch } = useQuery({
    queryKey: ['companies', { search, industry: selectedIndustry }],
    queryFn: () =>
      api.companies.list({
        search: search || undefined,
        industry: selectedIndustry !== 'All' ? selectedIndustry : undefined,
      }),
  });

  const industries = [
    { label: 'All Industries', value: 'All' },
    { label: 'Business & Conglomerates', value: 'Conglomerate' },
    { label: 'FMCG & Consumer Goods', value: 'FMCG' },
    { label: 'Media & Broadcasting', value: 'Media' },
    { label: 'Marketing & PR', value: 'Marketing' },
    { label: 'Public Policy & Think Tanks', value: 'Policy' },
    { label: 'Education & Schools', value: 'Education' },
    { label: 'Finance & Banking', value: 'Finance' },
    { label: 'Technology & Hardware', value: 'Technology' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#e5e5e5] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-[#991b1b]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
            Organization Directory
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#525252]">
          Discover top organizations evaluated by Malaysian university interns across all academic schools, compare compensation, and view active roles.
        </p>
      </div>

      {/* Toolbar & Filter Ribbon */}
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
              placeholder="Search organization by name..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#e5e5e5] focus:border-[#0a0a0a] rounded-[2px] outline-none"
            />
          </div>

          {/* Industry Filter Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Funnel size={16} weight="duotone" className="text-[#737373] hidden sm:inline" />
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 focus:border-[#0a0a0a] outline-none"
            >
              {industries.map((ind) => (
                <option key={ind.value} value={ind.value}>
                  {ind.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Industry Ribbon */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#f5f5f5] text-xs">
          <span className="text-[11px] font-bold text-[#0a0a0a] uppercase tracking-wider shrink-0 mr-2">
            Industry:
          </span>
          {industries.map((ind) => {
            const isActive =
              (selectedIndustry === 'All' && ind.value === 'All') ||
              selectedIndustry.toLowerCase() === ind.value.toLowerCase();
            return (
              <button
                key={ind.value}
                type="button"
                onClick={() => setSelectedIndustry(ind.value)}
                className={`px-3 py-1.5 rounded-[2px] whitespace-nowrap transition-colors font-medium border ${
                  isActive
                    ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                    : 'bg-white text-[#525252] border-[#e5e5e5] hover:border-[#0a0a0a] hover:text-[#0a0a0a]'
                }`}
              >
                {ind.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] animate-pulse space-y-3">
              <div className="h-10 bg-neutral-200 w-1/3 rounded-[2px]" />
              <div className="h-4 bg-neutral-200 w-2/3 rounded-[2px]" />
              <div className="h-16 bg-neutral-100 w-full rounded-[2px]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 bg-red-50 border border-red-200 text-center rounded-[2px]">
          <p className="text-sm text-[#991b1b]">Failed to load company directory.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : companies?.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] p-12 text-center rounded-[2px] space-y-3">
          <Buildings size={32} weight="duotone" className="text-[#991b1b] mx-auto" />
          <h3 className="font-semibold text-base text-[#0a0a0a]">No companies found</h3>
          <p className="text-xs text-[#525252]">Try adjusting your search criteria or industry filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies?.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
};

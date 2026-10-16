import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlass,
  Funnel,
  Faders,
  ArrowsDownUp,
  MapPin,
  X,
  Buildings,
  CurrencyCircleDollar
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { ExperienceCard } from '../components/experiences/ExperienceCard';
import { Button } from '../components/ui/Button';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || 'All';
  const location = searchParams.get('location') || 'All';
  const workType = searchParams.get('work_type') || 'All';
  const technologyId = searchParams.get('technology_id') || 'All';
  const minAllowance = searchParams.get('min_allowance') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [localSearch, setLocalSearch] = useState(search);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync input when url changes
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Query technologies
  const { data: technologies } = useQuery({
    queryKey: ['technologies-list'],
    queryFn: () => api.technologies.list(),
  });

  // Query experiences
  const { data: experiencesData, isLoading, isError, refetch } = useQuery({
    queryKey: ['experiences', { search, department, location, workType, technologyId, minAllowance, sortBy, page }],
    queryFn: () =>
      api.experiences.list({
        search: search || undefined,
        department: department !== 'All' ? department : undefined,
        location: location !== 'All' ? location : undefined,
        work_type: workType !== 'All' ? workType : undefined,
        technology_id: technologyId !== 'All' ? technologyId : undefined,
        min_allowance: minAllowance ? parseFloat(minAllowance) : undefined,
        sort_by: sortBy,
        page,
        size: 10,
      }),
  });

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // reset to page 1 on filter change
    setSearchParams(newParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', localSearch.trim());
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalSearch('');
  };

  const locationsList = ['All', 'Kuala Lumpur', 'Petaling Jaya', 'Penang', 'Cyberjaya', 'Alor Setar'];
  const workTypesList = ['All', 'Onsite', 'Hybrid', 'Remote'];
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#e5e5e5] pb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 bg-[#991b1b]" />
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0a0a0a]">
            Discover Internship Experiences
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-[#525252]">
          Search student reports by faculty, company, skills, allowance expectations, and workplace cultures.
        </p>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <MagnifyingGlass size={18} weight="bold" />
                </div>
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  placeholder="Search position, company name, tasks, or keywords..."
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-[#e5e5e5] focus:border-[#0a0a0a] rounded-[2px] outline-none"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      updateParam('search', '');
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a3a3a3] hover:text-[#0a0a0a]"
                  >
                    <X size={16} weight="bold" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="md">
                Search
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                className="lg:hidden"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              >
                <Faders size={18} weight="duotone" />
              </Button>
            </form>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-2 justify-end">
            <ArrowsDownUp size={16} weight="duotone" className="text-[#737373] hidden sm:inline" />
            <select
              value={sortBy}
              onChange={(e) => updateParam('sort_by', e.target.value)}
              className="w-full lg:w-auto text-xs sm:text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-2 focus:border-[#0a0a0a] outline-none"
            >
              <option value="newest">Sort: Most Recent</option>
              <option value="allowance_desc">Sort: Highest Allowance</option>
              <option value="rating_desc">Sort: Highest Rating</option>
              <option value="views_desc">Sort: Most Viewed</option>
            </select>
          </div>
        </div>

        {/* Department / School Filter Ribbon */}
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
                onClick={() => updateParam('department', dep.value)}
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

      {/* Main Content Layout: Sidebar Filters + Cards Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'} space-y-6`}>
          <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#f5f5f5]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a] flex items-center gap-1.5">
                <Funnel size={14} weight="duotone" className="text-[#991b1b]" />
                Filters
              </span>
              <button
                onClick={clearFilters}
                className="text-[11px] text-[#991b1b] hover:underline font-medium"
              >
                Reset All
              </button>
            </div>

            {/* Department / Faculty filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Faculty / School
              </label>
              <select
                value={department}
                onChange={(e) => updateParam('department', e.target.value)}
                className="w-full text-xs bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
              >
                {departmentsList.map((dep) => (
                  <option key={dep.value} value={dep.value}>
                    {dep.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Location filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Location
              </label>
              <select
                value={location}
                onChange={(e) => updateParam('location', e.target.value)}
                className="w-full text-xs bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
              >
                {locationsList.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Work arrangement */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Work Arrangement
              </label>
              <div className="space-y-1.5">
                {workTypesList.map((type) => (
                  <label key={type} className="flex items-center gap-2 text-xs text-[#525252] cursor-pointer">
                    <input
                      type="radio"
                      name="work_type"
                      checked={workType.toLowerCase() === type.toLowerCase()}
                      onChange={() => updateParam('work_type', type)}
                      className="accent-[#991b1b]"
                    />
                    <span>{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Min Allowance filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Min Monthly Allowance
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#737373]">RM</span>
                <input
                  type="number"
                  step="100"
                  min="0"
                  placeholder="e.g. 1200"
                  value={minAllowance}
                  onChange={(e) => updateParam('min_allowance', e.target.value)}
                  className="w-full text-xs bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
                />
              </div>
            </div>

            {/* Technologies filter */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider">
                Technology / Skill
              </label>
              <select
                value={technologyId}
                onChange={(e) => updateParam('technology_id', e.target.value)}
                className="w-full text-xs bg-white border border-[#e5e5e5] rounded-[2px] p-2 outline-none"
              >
                <option value="All">All Technologies</option>
                {technologies?.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.name} {tech.count ? `(${tech.count})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* Experiences Feed */}
        <main className="lg:col-span-3 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-[#e5e5e5] p-6 rounded-[2px] animate-pulse space-y-3">
                  <div className="h-4 bg-neutral-200 w-1/3 rounded-[2px]" />
                  <div className="h-5 bg-neutral-200 w-2/3 rounded-[2px]" />
                  <div className="h-3 bg-neutral-100 w-1/2 rounded-[2px]" />
                  <div className="h-10 bg-neutral-100 w-full rounded-[2px]" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="bg-red-50 border border-red-200 p-8 text-center space-y-3 rounded-[2px]">
              <p className="text-sm text-[#991b1b] font-medium">Failed to load experiences feed.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : experiencesData?.items.length === 0 ? (
            <div className="bg-white border border-[#e5e5e5] p-12 text-center space-y-4 rounded-[2px]">
              <div className="w-12 h-12 bg-[#f5f5f5] text-[#991b1b] flex items-center justify-center mx-auto rounded-[2px]">
                <MagnifyingGlass size={24} weight="duotone" />
              </div>
              <h3 className="font-semibold text-lg text-[#0a0a0a]">No experiences match your criteria</h3>
              <p className="text-xs text-[#525252] max-w-md mx-auto">
                Try widening your search filters, adjusting allowance thresholds, or clearing keyword queries.
              </p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-[#737373]">
                <span>Showing {experiencesData?.items.length} of {experiencesData?.total} reports</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiencesData?.items.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} onBookmarkChanged={refetch} />
                ))}
              </div>

              {/* Pagination */}
              {experiencesData && experiencesData.total_pages > 1 && (
                <div className="pt-6 border-t border-[#e5e5e5] flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => updateParam('page', String(page - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-[#525252]">
                    Page {page} of {experiencesData.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= experiencesData.total_pages}
                    onClick={() => updateParam('page', String(page + 1))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

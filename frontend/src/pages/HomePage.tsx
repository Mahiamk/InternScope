import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MagnifyingGlass,
  ArrowRight,
  ShieldCheck,
  TrendUp,
  Buildings,
  Article,
  Briefcase,
  CurrencyCircleDollar,
  Sparkle,
  Megaphone,
  Scales,
  GraduationCap,
  Desktop,
  Gauge
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ExperienceCard } from '../components/experiences/ExperienceCard';
import { CompanyCard } from '../components/companies/CompanyCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // When a user has an active session / opened dashboard, hide the landing page by redirecting to /dashboard
  // (unless explicitly previewing the public landing page with ?public=true)
  useEffect(() => {
    if (!loading && user && searchParams.get('public') !== 'true') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, searchParams, navigate]);

  // Fetch summary stats
  const { data: stats } = useQuery({
    queryKey: ['stats-summary'],
    queryFn: () => api.stats.summary(),
  });

  // Fetch recent experiences
  const { data: experiencesData } = useQuery({
    queryKey: ['recent-experiences'],
    queryFn: () => api.experiences.list({ size: 4, sort_by: 'newest' }),
  });

  // Fetch featured companies
  const { data: companiesData } = useQuery({
    queryKey: ['featured-companies'],
    queryFn: () => api.companies.list({ limit: 4 }),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const sampleTags = [
    'Business Strategy',
    'Media & Journalism',
    'Brand Marketing',
    'Public Policy',
    'TESL Teaching',
    'Audit & Accounting',
    'Software Engineering',
    'Grab',
    'PwC',
    'Media Prima',
    'IDEAS',
    'Teach For Malaysia',
  ];

  const facultyCategories = [
    {
      title: 'Business & Management',
      desc: 'Operations, supply chain, market analysis & strategy consulting.',
      department: 'Business',
      icon: Briefcase,
      count: 'Sime Darby, Nestlé, AirAsia',
    },
    {
      title: 'Media & Communications',
      desc: 'Broadcast journalism, newsroom operations, PR & podcasting.',
      department: 'Media',
      icon: Article,
      count: 'Media Prima, BFM 89.9, Astro',
    },
    {
      title: 'Marketing & Brand Strategy',
      desc: 'Performance marketing, social campaigns, SEO & ad analytics.',
      department: 'Marketing',
      icon: Megaphone,
      count: 'Ogilvy, Shopee, Dentsu',
    },
    {
      title: 'Politics & Public Policy',
      desc: 'Legislative research, think tanks, governance & advocacy.',
      department: 'Politics',
      icon: Scales,
      count: 'IDEAS, ISIS Malaysia, SUHAKAM',
    },
    {
      title: 'Education & Pedagogy',
      desc: 'K-12 classroom teaching, TESL, curriculum design & edtech.',
      department: 'Education',
      icon: GraduationCap,
      count: 'Teach For Malaysia, Cempaka IB',
    },
    {
      title: 'Finance, Banking & Audit',
      desc: 'Big 4 assurance, investment banking, IFRS & corporate treasury.',
      department: 'Finance',
      icon: CurrencyCircleDollar,
      count: 'PwC, CIMB, Maybank, BNM',
    },
    {
      title: 'Technology & Computing',
      desc: 'Full-stack software engineering, cloud, AI/ML & semiconductors.',
      department: 'Technology',
      icon: Desktop,
      count: 'Grab, Intel, PETRONAS, MoneyLion',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Session Active Indicator Banner when viewing landing page in public mode */}
      {user && (
        <div className="bg-[#0a0a0a] text-white text-xs py-2.5 px-4 border-b border-neutral-800">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
              <span>Active Workspace Session: <strong>{user.full_name}</strong> ({user.program || 'Student'})</span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#991b1b] hover:bg-[#b91c1c] text-white font-semibold rounded-[2px] transition-colors"
            >
              <Gauge size={14} weight="bold" />
              Open Dashboard Workspace
            </Link>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 pb-10 border-b border-[#e5e5e5] swiss-grid-pattern">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-8">


          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0a0a0a] max-w-4xl mx-auto leading-[1.08]">
              Your next internship starts with someone else’s <span className="text-[#991b1b] underline decoration-[#991b1b]/30 underline-offset-8">experience</span>.
            </h1>
            <p className="text-base sm:text-lg text-[#525252] max-w-2xl mx-auto font-normal leading-relaxed">
              Discover verified industrial training reports, benchmark allowances, and access official application channels across Business, Media, Marketing, Politics, Education, Finance & Tech.
            </p>
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="max-w-2xl mx-auto bg-white border border-[#0a0a0a] p-1.5 flex items-center shadow-[4px_4px_0px_0px_rgba(10,10,10,1)] transition-transform duration-100"
          >
            <div className="pl-3 pr-2 text-[#737373]">
              <MagnifyingGlass size={20} weight="bold" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by position, company, department (e.g. Media, Finance), or skills..."
              className="w-full text-sm sm:text-base text-[#0a0a0a] bg-transparent outline-none placeholder:text-[#a3a3a3]"
            />
            <Button type="submit" variant="blood" size="md" className="shrink-0">
              Explore
            </Button>
          </form>

          {/* Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#737373]">
            <span className="font-medium text-[#0a0a0a]">Explore Disciplines:</span>
            {sampleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/explore?search=${encodeURIComponent(tag)}`)}
                className="px-2.5 py-1 bg-white border border-[#e5e5e5] hover:border-[#0a0a0a] hover:text-[#0a0a0a] text-[#525252] rounded-[2px] transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Swiss Metrics Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#e5e5e5] bg-white divide-y lg:divide-y-0 divide-x divide-[#e5e5e5]">
          <div className="p-6 sm:p-8 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
              <Article size={16} weight="duotone" className="text-[#991b1b]" />
              Experience Reports
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a]">
              {stats?.total_experiences || 0}
            </div>
            <p className="text-[11px] text-[#737373]">Across all 7 university schools</p>
          </div>

          <div className="p-6 sm:p-8 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
              <Buildings size={16} weight="duotone" className="text-[#991b1b]" />
              Organizations Reviewed
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a]">
              {stats?.total_companies || 0}
            </div>
            <p className="text-[11px] text-[#737373]">Corporations, newsrooms, schools & NGOs</p>
          </div>

          <div className="p-6 sm:p-8 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
              <CurrencyCircleDollar size={16} weight="duotone" className="text-[#991b1b]" />
              Reported Allowance Avg
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#991b1b]">
              RM {stats?.average_allowance ? Math.round(stats.average_allowance).toLocaleString() : '1,380'}
            </div>
            <p className="text-[11px] text-[#737373]">Monthly self-reported baseline</p>
          </div>

          <div className="p-6 sm:p-8 space-y-1">
            <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
              <Briefcase size={16} weight="duotone" className="text-[#991b1b]" />
              Active Opportunities
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0a0a0a]">
              {stats?.total_opportunities || 0}
            </div>
            <p className="text-[11px] text-[#737373]">Direct official careers links</p>
          </div>
        </div>

        <div className="mt-2 text-right">
          <span className="text-[11px] text-[#737373] italic">
            * Self-reported figures from university students across all degree programs; independently disclosed.
          </span>
        </div>
      </section>

      {/* Explore by School / Department Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[#991b1b]" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">
                Explore By School & Faculty
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#525252]">
              InternScope caters to all academic faculties. Select your field of study to discover tailored reports and vacancies.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {facultyCategories.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.department}
                onClick={() => navigate(`/explore?department=${encodeURIComponent(f.department)}`)}
                className="text-left bg-white border border-[#e5e5e5] p-5 rounded-[2px] hover:border-[#0a0a0a] transition-all hover:shadow-[2px_2px_0px_0px_rgba(10,10,10,1)] group flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-[2px] bg-[#f5f5f5] flex items-center justify-center text-[#991b1b] group-hover:bg-[#991b1b] group-hover:text-white transition-colors">
                    <Icon size={18} weight="duotone" />
                  </div>
                  <h3 className="font-bold text-sm text-[#0a0a0a] group-hover:text-[#991b1b] transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    {f.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#f5f5f5] text-[11px] text-[#737373] flex items-center justify-between">
                  <span className="truncate">{f.count}</span>
                  <ArrowRight size={12} weight="bold" className="shrink-0 text-[#a3a3a3] group-hover:text-[#0a0a0a] transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recently Shared Experiences */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[#991b1b]" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Recent Experiences</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#525252]">
              Honest workplace reflections, interview questions, and tech stacks used by seniors.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              View All <ArrowRight size={14} weight="bold" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiencesData?.items.map((exp) => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))}
        </div>

        <div className="sm:hidden text-center pt-2">
          <Link to="/explore">
            <Button variant="outline" size="sm" className="w-full">
              View All Experiences <ArrowRight size={14} weight="bold" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-end justify-between border-b border-[#e5e5e5] pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-[#0a0a0a]" />
              <h2 className="text-2xl font-bold tracking-tight text-[#0a0a0a]">Featured Companies</h2>
            </div>
            <p className="text-xs sm:text-sm text-[#525252]">
              Top organizations hiring interns in Kuala Lumpur, Penang, and Selangor.
            </p>
          </div>
          <Link to="/companies">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
              Browse Directory <ArrowRight size={14} weight="bold" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companiesData?.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      </section>

      {/* How It Works (Swiss Triad) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border border-[#e5e5e5] bg-white p-8 sm:p-12">
          <div className="max-w-2xl mb-8">
            <span className="text-xs font-semibold text-[#991b1b] uppercase tracking-wider">The Platform</span>
            <h3 className="text-2xl font-bold text-[#0a0a0a] mt-1">Built to empower every university student</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="w-8 h-8 bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h4 className="font-semibold text-base text-[#0a0a0a]">Real Peer Experience</h4>
              <p className="text-xs text-[#525252] leading-relaxed">
                Read what seniors did daily, which tools they used, how mentorship was handled, and what interview questions were asked.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 bg-[#991b1b] text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h4 className="font-semibold text-base text-[#0a0a0a]">Allowance Transparency</h4>
              <p className="text-xs text-[#525252] leading-relaxed">
                Know what compensation to expect before applying. We calculate averages, minimums, and payment periods per position.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-8 h-8 bg-[#0a0a0a] text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h4 className="font-semibold text-base text-[#0a0a0a]">Direct Application Links</h4>
              <p className="text-xs text-[#525252] leading-relaxed">
                No middleman or outdated job boards. Direct links take you straight to the verified company portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA: Invite Seniors to Share */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0a0a0a] text-white p-8 sm:p-12 rounded-[2px] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#991b1b]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#a3a3a3]">Pay it forward</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Finished your industrial training? Help the next junior.
            </h3>
            <p className="text-sm text-[#a3a3a3] leading-relaxed">
              Your 5-minute review gives junior students the guidance they need to make smart career decisions. You can choose to remain anonymous.
            </p>
          </div>

          <Link to="/share" className="shrink-0">
            <Button variant="blood" size="lg" className="w-full sm:w-auto font-semibold">
              Share Your Experience <ArrowRight size={18} weight="bold" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

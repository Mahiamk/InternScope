import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Buildings,
  CheckCircle,
  MapPin,
  Globe,
  ArrowSquareOut,
  Article,
  Briefcase,
  Flag,
  CurrencyCircleDollar,
  Star,
  ChatsTeardrop,
  PlusCircle,
  ThumbsUp
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { ExperienceCard } from '../components/experiences/ExperienceCard';
import { OpportunityCard } from '../components/opportunities/OpportunityCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ReportModal } from '../components/common/ReportModal';
import type { Opportunity } from '../types';

export const CompanyDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'experiences' | 'opportunities' | 'senior_qa'>('experiences');
  const [reportedOpp, setReportedOpp] = useState<Opportunity | null>(null);

  const { data: company, isLoading, isError } = useQuery({
    queryKey: ['company-detail', slug],
    queryFn: () => api.companies.getBySlugOrId(slug!),
    enabled: !!slug,
  });

  const { data: experiencesData } = useQuery({
    queryKey: ['company-experiences', company?.id],
    queryFn: () => api.experiences.list({ company_id: company!.id, size: 20 }),
    enabled: !!company?.id,
  });

  const { data: opportunitiesData } = useQuery({
    queryKey: ['company-opportunities', company?.id],
    queryFn: () => api.opportunities.list({ company_id: company!.id, size: 20 }),
    enabled: !!company?.id,
  });

  const { data: seniorQuestionsData } = useQuery({
    queryKey: ['company-senior-questions', company?.id],
    queryFn: () => api.seniorQa.listQuestions({ company_id: company!.id }),
    enabled: !!company?.id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-12 bg-neutral-200 w-1/3 rounded-[2px]" />
        <div className="h-32 bg-neutral-100 w-full rounded-[2px]" />
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0a0a0a]">Company Not Found</h2>
        <Link to="/companies">
          <Button variant="primary" size="md">Return to Directory</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header Profile */}
      <div className="bg-white border border-[#e5e5e5] p-6 sm:p-8 rounded-[2px] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <CompanyLogo
              name={company.name}
              logoUrl={company.logo_url}
              size="xl"
              className="bg-white shadow-xs"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a] tracking-tight">
                  {company.name}
                </h1>
                {company.is_verified && (
                  <span title="Verified Company">
                    <CheckCircle size={20} weight="fill" className="text-[#16a34a]" />
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[#737373] font-medium">
                {company.industry} • {company.headquarters}
              </p>
            </div>
          </div>

          {/* Links and report */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Globe size={15} weight="duotone" />
                  Website
                </Button>
              </a>
            )}
            {company.careers_url && (
              <a href={company.careers_url} target="_blank" rel="noopener noreferrer">
                <Button variant="blood" size="sm">
                  <span>Careers Portal</span>
                  <ArrowSquareOut size={14} weight="bold" />
                </Button>
              </a>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-[#a3a3a3] hover:text-[#991b1b]"
              onClick={() => setReportModalOpen(true)}
              title="Report inaccurate information"
            >
              <Flag size={16} weight="duotone" />
            </Button>
          </div>
        </div>

        {company.description && (
          <div className="pt-2 border-t border-[#f5f5f5]">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#737373] block mb-1">
              Official Company Profile
            </span>
            <p className="text-xs sm:text-sm text-[#525252] leading-relaxed max-w-3xl">
              {company.description}
            </p>
          </div>
        )}
      </div>

      {/* Aggregate Statistics Block (Swiss Grid) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border border-[#e5e5e5] bg-white divide-y lg:divide-y-0 divide-x divide-[#e5e5e5]">
        <div className="p-6 space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
            <Article size={16} weight="duotone" className="text-[#991b1b]" />
            Student Reports
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a]">
            {company.experiences_count || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Self-reported reviews</p>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
            <CurrencyCircleDollar size={16} weight="duotone" className="text-[#991b1b]" />
            Reported Allowance Avg
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#991b1b]">
            {company.avg_allowance ? `RM ${Math.round(company.avg_allowance).toLocaleString()}` : 'Unreported'}
          </div>
          <p className="text-[11px] text-[#737373]">
            {company.min_allowance && company.max_allowance ? `Range: RM ${company.min_allowance} - ${company.max_allowance}` : 'Monthly base'}
          </p>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
            <Star size={16} weight="duotone" className="text-[#eab308]" />
            Intern Rating
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a]">
            {company.avg_rating ? `${company.avg_rating} / 5` : 'N/A'}
          </div>
          <p className="text-[11px] text-[#737373]">Culture and mentorship</p>
        </div>

        <div className="p-6 space-y-1">
          <span className="text-xs uppercase tracking-wider text-[#737373] font-semibold flex items-center gap-1.5">
            <Briefcase size={16} weight="duotone" className="text-[#991b1b]" />
            Open Vacancies
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0a0a0a]">
            {company.opportunities_count || 0}
          </div>
          <p className="text-[11px] text-[#737373]">Active listings</p>
        </div>
      </section>

      {/* Tabs: Experience Reports vs Opportunities */}
      <div className="space-y-6">
        <div className="flex border-b border-[#e5e5e5] gap-6 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('experiences')}
            className={`pb-3 transition-colors ${
              activeTab === 'experiences'
                ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            Student Experience Reports ({experiencesData?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('opportunities')}
            className={`pb-3 transition-colors ${
              activeTab === 'opportunities'
                ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            Internship Vacancies ({opportunitiesData?.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('senior_qa')}
            className={`pb-3 transition-colors flex items-center gap-1.5 ${
              activeTab === 'senior_qa'
                ? 'border-b-2 border-[#991b1b] text-[#0a0a0a]'
                : 'text-[#737373] hover:text-[#0a0a0a]'
            }`}
          >
            <ChatsTeardrop size={16} weight="bold" className="text-[#991b1b]" />
            Ask a Senior ({seniorQuestionsData?.total || 0})
          </button>
        </div>

        {activeTab === 'experiences' ? (
          <div>
            {experiencesData?.items.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-3">
                <p className="text-sm text-[#525252]">No experiences reported for this company yet.</p>
                <Link to="/share">
                  <Button variant="blood" size="sm">Be the first to review</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {experiencesData?.items.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'opportunities' ? (
          <div>
            {opportunitiesData?.items.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-3">
                <p className="text-sm text-[#525252]">No active vacancies posted for this company currently.</p>
                {company.careers_url && (
                  <a href={company.careers_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">Visit Official Careers Page</Button>
                  </a>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunitiesData?.items.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    onReportClick={(o) => setReportedOpp(o)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="text-sm font-bold text-[#0a0a0a]">
                  Student Q&A with Previous {company.name} Interns
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Interviews, daily tasks, and company culture answered by verified seniors.
                </p>
              </div>
              <Link to={`/ask-a-senior`}>
                <Button variant="blood" size="sm">
                  <PlusCircle size={15} weight="bold" />
                  Ask a Question
                </Button>
              </Link>
            </div>

            {seniorQuestionsData?.items.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#e5e5e5] rounded-[2px] space-y-3">
                <ChatsTeardrop size={32} weight="duotone" className="text-[#991b1b] mx-auto" />
                <p className="text-sm text-[#525252]">No questions asked about {company.name} yet.</p>
                <Link to="/ask-a-senior">
                  <Button variant="blood" size="sm">Ask the First Question</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {seniorQuestionsData?.items.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 bg-white border border-[#e5e5e5] rounded-[2px] hover:border-[#a3a3a3] transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f5] text-[#525252] rounded-[2px]">
                        {q.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold text-[#991b1b]">
                        {q.answers_count} {q.answers_count === 1 ? 'Answer' : 'Answers'}
                      </span>
                    </div>
                    <Link
                      to="/ask-a-senior"
                      className="block font-bold text-sm text-[#0a0a0a] hover:text-[#991b1b] transition-colors"
                    >
                      {q.title}
                    </Link>
                    <p className="text-xs text-[#525252] line-clamp-2">
                      {q.content}
                    </p>
                    <div className="text-[11px] text-[#737373] pt-1">
                      Asked by {q.author_name} • {new Date(q.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="COMPANY"
        targetId={company.id}
        targetTitle={company.name}
      />

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

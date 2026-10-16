import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChatCircleDots,
  Sparkle,
  PlusCircle,
  ThumbsUp,
  Buildings,
  CheckCircle,
  Lock,
  Eye,
  MagnifyingGlass,
  ArrowRight,
  GraduationCap,
  ShieldCheck,
  Funnel,
  PaperPlaneTilt,
  ChatTeardropText,
  User,
  Clock,
  X
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { CompanyLogo } from '../components/common/CompanyLogo';
import type { SeniorQuestionItem, SeniorAnswerItem } from '../types';

export const AskSeniorPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ANSWERED' | 'OPEN'>('ALL');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewTab, setViewTab] = useState<'all' | 'my_questions' | 'can_answer'>('all');

  // Modals & Expansion
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // New Question Form State
  const [newQuestion, setNewQuestion] = useState({
    company_id: '',
    title: '',
    content: '',
    category: 'INTERVIEWS',
    is_anonymous: false,
    is_private: false
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Answering State
  const [answerInputs, setAnswerInputs] = useState<Record<string, { content: string; is_anonymous: boolean }>>({});
  // Follow-up State
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, { content: string; is_anonymous: boolean }>>({});

  // Query Companies for dropdown
  const { data: companiesData } = useQuery({
    queryKey: ['companies-all'],
    queryFn: () => api.companies.list({ size: 100 })
  });

  // Query Questions
  const { data: questionsData, isLoading, refetch } = useQuery({
    queryKey: ['senior-questions', categoryFilter, statusFilter, selectedCompanyId, searchQuery, viewTab],
    queryFn: () =>
      api.seniorQa.listQuestions({
        category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        company_id: selectedCompanyId || undefined,
        search: searchQuery || undefined,
        my_questions: viewTab === 'my_questions',
        can_answer: viewTab === 'can_answer'
      })
  });

  // Query single active question details when opened
  const { data: activeQuestion, refetch: refetchActiveQuestion } = useQuery({
    queryKey: ['senior-question-detail', activeQuestionId],
    queryFn: () => (activeQuestionId ? api.seniorQa.getQuestion(activeQuestionId) : null),
    enabled: !!activeQuestionId
  });

  // Create Question Mutation
  const createQuestionMutation = useMutation({
    mutationFn: (data: typeof newQuestion) => api.seniorQa.createQuestion(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['senior-questions'] });
      setAskModalOpen(false);
      setNewQuestion({
        company_id: '',
        title: '',
        content: '',
        category: 'INTERVIEWS',
        is_anonymous: false,
        is_private: false
      });
      setActiveQuestionId(created.id);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to submit question');
    }
  });

  // Create Answer Mutation
  const createAnswerMutation = useMutation({
    mutationFn: ({ qId, data }: { qId: string; data: { content: string; is_anonymous: boolean } }) =>
      api.seniorQa.createAnswer(qId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['senior-questions'] });
      if (activeQuestionId) {
        refetchActiveQuestion();
      }
    }
  });

  // Toggle Helpful Mutation
  const toggleHelpfulMutation = useMutation({
    mutationFn: (answerId: string) => api.seniorQa.toggleHelpful(answerId),
    onSuccess: () => {
      if (activeQuestionId) {
        refetchActiveQuestion();
      }
    }
  });

  // Create Follow-up Mutation
  const createFollowUpMutation = useMutation({
    mutationFn: ({ answerId, data }: { answerId: string; data: { content: string; is_anonymous: boolean } }) =>
      api.seniorQa.createFollowUp(answerId, data),
    onSuccess: () => {
      if (activeQuestionId) {
        refetchActiveQuestion();
      }
    }
  });

  const handlePostAnswer = (questionId: string) => {
    const input = answerInputs[questionId];
    if (!input || !input.content.trim()) return;
    createAnswerMutation.mutate({
      qId: questionId,
      data: { content: input.content, is_anonymous: input.is_anonymous }
    });
    setAnswerInputs((prev) => ({
      ...prev,
      [questionId]: { content: '', is_anonymous: false }
    }));
  };

  const handlePostFollowUp = (answerId: string) => {
    const input = followUpInputs[answerId];
    if (!input || !input.content.trim()) return;
    createFollowUpMutation.mutate({
      answerId,
      data: { content: input.content, is_anonymous: input.is_anonymous }
    });
    setFollowUpInputs((prev) => ({
      ...prev,
      [answerId]: { content: '', is_anonymous: false }
    }));
  };

  const categories = [
    { id: 'ALL', label: 'All Topics' },
    { id: 'INTERVIEWS', label: 'Interviews' },
    { id: 'DAILY_TASKS', label: 'Daily Tasks' },
    { id: 'APPLICATION_PROCESS', label: 'Application Process' },
    { id: 'CULTURE_BENEFITS', label: 'Culture & Benefits' },
    { id: 'GENERAL', label: 'General' }
  ];

  const canAnswerCount = questionsData?.can_answer_company_ids?.length || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[#e5e5e5]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#991b1b] rounded-full" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
              Senior Advice & Mentorship
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] mt-1">
            Ask a Senior
          </h1>
          <p className="text-sm text-[#737373] mt-1 max-w-2xl">
            Ask questions directly to alumni and seniors who previously interned at your target companies about interview rounds, daily workflows, and insider tips.
          </p>
        </div>
        <Button variant="blood" size="sm" onClick={() => setAskModalOpen(true)} className="shrink-0">
          <PlusCircle size={16} weight="bold" />
          Ask a Question
        </Button>
      </div>

      {/* Senior Contributor Callout if user interned */}
      {canAnswerCount > 0 && (
        <div className="bg-[#fafafa] border border-[#e5e5e5] p-4 rounded-[2px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#991b1b] flex items-center justify-center shrink-0">
              <GraduationCap size={18} weight="bold" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0a0a0a]">
                You have verified internship experience!
              </div>
              <div className="text-[11px] text-[#525252]">
                Your advice helps junior students land training placements. Check questions you are qualified to answer.
              </div>
            </div>
          </div>
          <button
            onClick={() => setViewTab('can_answer')}
            className={`text-xs px-3 py-1.5 font-semibold rounded-[2px] border transition-colors shrink-0 ${
              viewTab === 'can_answer'
                ? 'bg-[#0a0a0a] text-white border-[#0a0a0a]'
                : 'bg-white text-[#991b1b] border-red-200 hover:bg-red-50'
            }`}
          >
            Questions I Can Answer
          </button>
        </div>
      )}

      {/* Filter and Navigation Tabs */}
      <div className="flex flex-col gap-3">
        {/* Main View Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e5e5e5] pb-2 text-xs">
          <button
            onClick={() => setViewTab('all')}
            className={`px-3 py-1.5 font-semibold rounded-[2px] transition-colors ${
              viewTab === 'all'
                ? 'bg-[#0a0a0a] text-white'
                : 'text-[#525252] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'
            }`}
          >
            All Questions ({questionsData?.total || 0})
          </button>
          {user && (
            <button
              onClick={() => setViewTab('my_questions')}
              className={`px-3 py-1.5 font-semibold rounded-[2px] transition-colors ${
                viewTab === 'my_questions'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#525252] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'
              }`}
            >
              My Questions
            </button>
          )}
          {canAnswerCount > 0 && (
            <button
              onClick={() => setViewTab('can_answer')}
              className={`px-3 py-1.5 font-semibold rounded-[2px] transition-colors ${
                viewTab === 'can_answer'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'text-[#525252] hover:text-[#0a0a0a] hover:bg-[#f5f5f5]'
              }`}
            >
              I Can Answer
            </button>
          )}
        </div>

        {/* Categories Bar & Search */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-white border border-[#e5e5e5] p-3 rounded-[2px]">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition-colors ${
                  categoryFilter === cat.id
                    ? 'bg-[#991b1b] text-white font-semibold'
                    : 'bg-[#fafafa] text-[#525252] hover:bg-[#f0f0f0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Company Select */}
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="text-xs p-1.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            >
              <option value="">All Companies</option>
              {companiesData?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Questions Listing */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#737373] space-y-2">
          <div className="w-5 h-5 border-2 border-[#991b1b] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading questions from seniors...</p>
        </div>
      ) : !questionsData?.items || questionsData.items.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] p-12 text-center rounded-[2px] space-y-3">
          <ChatCircleDots size={36} weight="duotone" className="text-[#991b1b] mx-auto" />
          <h2 className="text-sm font-bold text-[#0a0a0a]">No questions found</h2>
          <p className="text-xs text-[#737373] max-w-md mx-auto">
            {viewTab === 'can_answer'
              ? "There are currently no open questions for the companies where you interned."
              : "Be the first to ask a senior about interviews, daily tasks, or application advice!"}
          </p>
          <Button variant="blood" size="sm" onClick={() => setAskModalOpen(true)}>
            Ask the First Question
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {questionsData.items.map((q) => {
            const isExpanded = activeQuestionId === q.id;
            const currentDetail = isExpanded ? activeQuestion || q : q;

            return (
              <div
                key={q.id}
                className={`bg-white border transition-colors rounded-[2px] overflow-hidden ${
                  isExpanded ? 'border-[#0a0a0a] shadow-sm' : 'border-[#e5e5e5] hover:border-[#a3a3a3]'
                }`}
              >
                {/* Question Summary Header */}
                <div
                  onClick={() => setActiveQuestionId(isExpanded ? null : q.id)}
                  className="p-5 cursor-pointer flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <CompanyLogo
                      name={q.company.name}
                      logoUrl={q.company.logo_url}
                      size="md"
                      className="shrink-0 mt-0.5"
                    />
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-[#0a0a0a]">{q.company.name}</span>
                        <span className="text-xs text-[#737373]">•</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f5] text-[#525252] rounded-[2px]">
                          {q.category.replace('_', ' ')}
                        </span>
                        {q.is_private && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 rounded-[2px] flex items-center gap-1">
                            <Lock size={10} weight="bold" />
                            Private Question
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-[2px] ${
                            q.status === 'ANSWERED'
                              ? 'bg-green-50 text-[#16a34a]'
                              : 'bg-red-50 text-[#991b1b]'
                          }`}
                        >
                          {q.status}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-[#0a0a0a] hover:text-[#991b1b] transition-colors">
                        {q.title}
                      </h2>

                      <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed">
                        {q.content}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#737373] pt-1">
                        <span>Asked by {q.author_name}</span>
                        <span>•</span>
                        <span>{q.author_program || 'Student'}</span>
                        <span>•</span>
                        <span>{new Date(q.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                    <div className="px-2.5 py-1 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] text-xs font-semibold text-[#0a0a0a] flex items-center gap-1.5">
                      <ChatCircleDots size={14} weight="bold" className="text-[#991b1b]" />
                      <span>{q.answers_count} {q.answers_count === 1 ? 'Answer' : 'Answers'}</span>
                    </div>
                    <span className="text-[11px] text-[#737373] hover:underline">
                      {isExpanded ? 'Collapse' : 'View Thread'}
                    </span>
                  </div>
                </div>

                {/* Expanded Thread View */}
                {isExpanded && (
                  <div className="border-t border-[#f0f0f0] bg-[#fafafa] p-5 space-y-6">
                    {/* Full Question Context */}
                    <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                        Detailed Question
                      </div>
                      <p className="text-xs text-[#0a0a0a] leading-relaxed whitespace-pre-line">
                        {currentDetail.content}
                      </p>
                    </div>

                    {/* Answers Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
                          <GraduationCap size={16} weight="bold" className="text-[#991b1b]" />
                          Answers from Seniors & Alumni ({currentDetail.answers?.length || 0})
                        </div>
                      </div>

                      {/* Answer Cards */}
                      {currentDetail.answers && currentDetail.answers.length > 0 ? (
                        <div className="space-y-4">
                          {currentDetail.answers.map((ans) => (
                            <div
                              key={ans.id}
                              className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-3"
                            >
                              {/* Answer Author Header */}
                              <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#f5f5f5]">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-[#0a0a0a]">
                                      {ans.author_name}
                                    </span>
                                    {ans.is_verified_intern && (
                                      <span className="px-2 py-0.5 bg-green-50 text-[#16a34a] text-[10px] font-bold rounded-[2px] flex items-center gap-1">
                                        <ShieldCheck size={12} weight="bold" />
                                        {ans.internship_role || 'Verified Alumni Intern'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-[#737373] mt-0.5">
                                    {new Date(ans.created_at).toLocaleDateString()}
                                  </div>
                                </div>

                                {/* Helpful Button */}
                                <button
                                  onClick={() => toggleHelpfulMutation.mutate(ans.id)}
                                  className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-colors ${
                                    ans.has_voted_helpful
                                      ? 'bg-red-50 text-[#991b1b] border-red-200'
                                      : 'bg-white text-[#525252] border-[#e5e5e5] hover:bg-[#fafafa]'
                                  }`}
                                  title="Mark as helpful advice"
                                >
                                  <ThumbsUp size={13} weight={ans.has_voted_helpful ? 'fill' : 'regular'} />
                                  <span>Helpful</span>
                                  <span className="font-mono text-[11px] ml-0.5">({ans.helpful_count})</span>
                                </button>
                              </div>

                              {/* Answer Body */}
                              <p className="text-xs text-[#0a0a0a] leading-relaxed whitespace-pre-line">
                                {ans.content}
                              </p>

                              {/* Threaded Follow-up Responses */}
                              <div className="pt-2 space-y-2 border-t border-[#f5f5f5]">
                                {ans.follow_ups && ans.follow_ups.length > 0 && (
                                  <div className="space-y-2 pl-3 border-l-2 border-[#e5e5e5] my-2">
                                    {ans.follow_ups.map((fu) => (
                                      <div key={fu.id} className="text-xs space-y-0.5">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-semibold text-[11px] text-[#0a0a0a]">
                                            {fu.author_name}
                                          </span>
                                          <span className="text-[10px] text-[#737373]">
                                            • {new Date(fu.created_at).toLocaleDateString()}
                                          </span>
                                        </div>
                                        <p className="text-[#525252]">{fu.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Follow-up Input */}
                                <div className="flex items-center gap-2 pt-1">
                                  <input
                                    type="text"
                                    placeholder="Ask a follow-up or clarification..."
                                    value={followUpInputs[ans.id]?.content || ''}
                                    onChange={(e) =>
                                      setFollowUpInputs((prev) => ({
                                        ...prev,
                                        [ans.id]: {
                                          content: e.target.value,
                                          is_anonymous: prev[ans.id]?.is_anonymous || false
                                        }
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handlePostFollowUp(ans.id);
                                      }
                                    }}
                                    className="flex-1 text-xs px-3 py-1.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePostFollowUp(ans.id)}
                                    disabled={!followUpInputs[ans.id]?.content?.trim()}
                                  >
                                    Reply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-white border border-[#e5e5e5] rounded-[2px] text-xs text-[#737373] text-center">
                          No answers yet. If you have experience with {q.company.name}, share your advice below!
                        </div>
                      )}
                    </div>

                    {/* Submit an Answer Form */}
                    <div className="bg-white border border-[#e5e5e5] p-4 rounded-[2px] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-wider text-[#0a0a0a]">
                          Add Your Advice as a Senior
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-[#737373] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={answerInputs[q.id]?.is_anonymous || false}
                            onChange={(e) =>
                              setAnswerInputs((prev) => ({
                                ...prev,
                                [q.id]: {
                                  content: prev[q.id]?.content || '',
                                  is_anonymous: e.target.checked
                                }
                              }))
                            }
                            className="accent-[#991b1b]"
                          />
                          <span>Answer anonymously</span>
                        </label>
                      </div>

                      <textarea
                        rows={3}
                        placeholder={`Share your experience with interviews, responsibilities, or company culture at ${q.company.name}...`}
                        value={answerInputs[q.id]?.content || ''}
                        onChange={(e) =>
                          setAnswerInputs((prev) => ({
                            ...prev,
                            [q.id]: {
                              content: e.target.value,
                              is_anonymous: prev[q.id]?.is_anonymous || false
                            }
                          }))
                        }
                        className="w-full text-xs p-3 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
                      />

                      <div className="flex justify-end">
                        <Button
                          variant="blood"
                          size="sm"
                          onClick={() => handlePostAnswer(q.id)}
                          disabled={!answerInputs[q.id]?.content?.trim() || createAnswerMutation.isPending}
                          isLoading={createAnswerMutation.isPending}
                        >
                          Submit Answer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ask a Senior Modal */}
      <Modal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        title="Ask a Senior Intern"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newQuestion.company_id || !newQuestion.title || !newQuestion.content) {
              setFormError('Please select a company, title, and detailed question.');
              return;
            }
            createQuestionMutation.mutate(newQuestion);
          }}
          className="space-y-4"
        >
          {formError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-[#991b1b] text-xs rounded-[2px]">
              {formError}
            </div>
          )}

          {/* Company Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Target Company *
            </label>
            <select
              required
              value={newQuestion.company_id}
              onChange={(e) => setNewQuestion({ ...newQuestion, company_id: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            >
              <option value="">Select a company you have questions about...</option>
              {companiesData?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry})
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Topic Category *
            </label>
            <select
              value={newQuestion.category}
              onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            >
              <option value="INTERVIEWS">Interviews (Technical rounds, HR screening, questions asked)</option>
              <option value="DAILY_TASKS">Daily Tasks (Workload, tech stack, responsibilities)</option>
              <option value="APPLICATION_PROCESS">Application Process (Timeline, resume screening, recruiters)</option>
              <option value="CULTURE_BENEFITS">Culture & Benefits (Mentorship, allowance, return offers)</option>
              <option value="GENERAL">General Inquiries</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Question Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. What should I prepare for the backend engineering live coding round?"
              value={newQuestion.title}
              onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Detailed Question *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide specific details so seniors can give actionable, accurate advice..."
              value={newQuestion.content}
              onChange={(e) => setNewQuestion({ ...newQuestion, content: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#f5f5f5]">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newQuestion.is_anonymous}
                onChange={(e) => setNewQuestion({ ...newQuestion, is_anonymous: e.target.checked })}
                className="accent-[#991b1b] mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#0a0a0a]">Post anonymously</span>
                <p className="text-[11px] text-[#737373]">
                  Your name will be hidden. Only your academic degree program will appear as verified.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newQuestion.is_private}
                onChange={(e) => setNewQuestion({ ...newQuestion, is_private: e.target.checked })}
                className="accent-[#991b1b] mt-0.5"
              />
              <div className="text-xs">
                <span className="font-semibold text-[#0a0a0a]">Private Question</span>
                <p className="text-[11px] text-[#737373]">
                  Only visible to verified alumni and past interns of this specific company.
                </p>
              </div>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e5]">
            <Button type="button" variant="outline" size="sm" onClick={() => setAskModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="blood"
              size="sm"
              isLoading={createQuestionMutation.isPending}
            >
              Submit Question
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

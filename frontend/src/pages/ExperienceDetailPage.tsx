import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Buildings,
  MapPin,
  CalendarBlank,
  Star,
  BookmarkSimple,
  ShareNetwork,
  Flag,
  CurrencyCircleDollar,
  CheckCircle,
  Lightbulb,
  ChatText,
  UserCircle,
  Clock,
  ArrowSquareOut,
  PencilSimple
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ReportModal } from '../components/common/ReportModal';

export const ExperienceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [commentText, setCommentText] = useState('');

  const { data: experience, isLoading, isError } = useQuery({
    queryKey: ['experience-detail', id],
    queryFn: () => api.experiences.getById(id!),
    enabled: !!id,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ['experience-comments', id],
    queryFn: () => api.comments.listForExperience(id!),
    enabled: !!id,
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => api.comments.create({ experience_id: id!, content }),
    onSuccess: () => {
      setCommentText('');
      refetchComments();
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: () => api.bookmarks.toggle('EXPERIENCE', id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experience-detail', id] });
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      window.location.href = '/login';
      return;
    }
    commentMutation.mutate(commentText.trim());
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-neutral-200 w-1/4 rounded-[2px]" />
        <div className="h-10 bg-neutral-200 w-3/4 rounded-[2px]" />
        <div className="h-32 bg-neutral-100 w-full rounded-[2px]" />
      </div>
    );
  }

  if (isError || !experience) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-[#0a0a0a]">Report Not Found</h2>
        <p className="text-sm text-[#525252]">The requested internship experience could not be located or has been archived.</p>
        <Link to="/explore">
          <Button variant="primary" size="md">Return to Explore</Button>
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Editorial Header */}
      <header className="border-b border-[#e5e5e5] pb-8 space-y-4">
        {/* Breadcrumb & University Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#737373]">
          <div className="flex items-center gap-1.5">
            <Link to="/explore" className="hover:text-[#991b1b]">Experiences</Link>
            <span>/</span>
            <Link to={`/companies/${experience.company?.slug}`} className="hover:text-[#991b1b]">
              {experience.company?.name}
            </Link>
          </div>
          <Badge variant="neutral" size="sm">
            Verified Contributor
          </Badge>
        </div>

        {/* Position Title & Company */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <CompanyLogo
              name={experience.company?.name}
              logoUrl={experience.company?.logo_url}
              size="xl"
              className="bg-white shadow-xs border-[#e5e5e5]"
            />
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[#0a0a0a]">
                {experience.position}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-[#525252]">
                <Link
                  to={`/companies/${experience.company?.slug}`}
                  className="font-semibold text-[#0a0a0a] hover:text-[#991b1b] transition-colors"
                >
                  {experience.company?.name}
                </Link>
                {experience.department && (
                  <>
                    <span>•</span>
                    <span>{experience.department}</span>
                  </>
                )}
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={14} weight="duotone" />
                  {experience.location}
                </span>
                <span>•</span>
                <span className="capitalize">{experience.work_type}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3 text-xs text-[#737373]">
            <span>Published {new Date(experience.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>{experience.views_count} views</span>
          </div>

          <div className="flex items-center gap-2">
            {user && (user.id === experience.user_id || user.role === 'moderator' || user.role === 'admin') && (
              <Link to={`/share?edit=${experience.id}`}>
                <Button variant="outline" size="sm">
                  <PencilSimple size={15} weight="duotone" />
                  <span>Edit Review</span>
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => bookmarkMutation.mutate()}
              isLoading={bookmarkMutation.isPending}
            >
              <BookmarkSimple
                size={16}
                weight={experience.is_bookmarked ? 'fill' : 'duotone'}
                className={experience.is_bookmarked ? 'text-[#991b1b]' : ''}
              />
              {experience.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ShareNetwork size={16} weight="duotone" />
              {copiedLink ? 'Copied Link!' : 'Share'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#a3a3a3] hover:text-[#991b1b]"
              onClick={() => setReportModalOpen(true)}
            >
              <Flag size={16} weight="duotone" />
            </Button>
          </div>
        </div>
      </header>

      {/* Compensation & Scorecard (Swiss Grid Box) */}
      <section className="grid grid-cols-1 md:grid-cols-3 border border-[#e5e5e5] bg-white divide-y md:divide-y-0 md:divide-x divide-[#e5e5e5]">
        {/* Allowance */}
        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
            Reported Allowance
          </span>
          {experience.is_allowance_disclosed && experience.allowance ? (
            <div>
              <div className="text-2xl font-extrabold text-[#991b1b]">
                {experience.currency} {experience.allowance.toLocaleString()}
                <span className="text-xs font-normal text-[#525252] ml-1">
                  /{experience.allowance_period}
                </span>
              </div>
              <p className="text-[11px] text-[#737373]">Self-reported figure</p>
            </div>
          ) : (
            <p className="text-sm text-[#737373] italic">Undisclosed by contributor</p>
          )}
        </div>

        {/* Overall Ratings */}
        <div className="p-6 space-y-2">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
            Ratings
          </span>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-[#737373] block text-[11px]">Overall</span>
              <span className="font-bold text-[#0a0a0a] text-base">{experience.overall_rating} / 5</span>
            </div>
            <div>
              <span className="text-[#737373] block text-[11px]">Mentorship</span>
              <span className="font-bold text-[#0a0a0a] text-base">{experience.mentorship_rating || 4} / 5</span>
            </div>
            <div>
              <span className="text-[#737373] block text-[11px]">Culture</span>
              <span className="font-bold text-[#0a0a0a] text-base">{experience.culture_rating || 4} / 5</span>
            </div>
          </div>
        </div>

        {/* Contributor Profile */}
        <div className="p-6 space-y-1">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
            Reviewed By
          </span>
          <div className="flex items-center gap-2 pt-1">
            <UserCircle size={24} weight="duotone" className="text-[#991b1b]" />
            <div>
              <span className="font-medium text-xs text-[#0a0a0a] block">
                {experience.anonymous_display ? 'Anonymous Senior' : experience.author?.full_name}
              </span>
              <span className="text-[11px] text-[#737373] block">
                {experience.author?.program || 'Computer Science'} • {experience.author?.grad_year || '2025'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Narrative Sections */}
      <div className="space-y-8 text-sm leading-relaxed text-[#171717]">
        {/* Responsibilities */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[#991b1b]" />
            Core Responsibilities & Daily Work
          </h2>
          <div className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] whitespace-pre-line text-[#404040]">
            {experience.responsibilities}
          </div>
        </section>

        {/* Projects Completed */}
        {experience.projects && (
          <section className="space-y-2">
            <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#991b1b]" />
              Key Projects Delivered
            </h2>
            <div className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] whitespace-pre-line text-[#404040]">
              {experience.projects}
            </div>
          </section>
        )}

        {/* Technologies Used */}
        {experience.technologies && experience.technologies.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#991b1b]" />
              Technologies, Tools & Stacks
            </h2>
            <div className="flex flex-wrap gap-2">
              {experience.technologies.map((tech) => (
                <div
                  key={tech.id}
                  className="px-3 py-1.5 bg-white border border-[#e5e5e5] text-xs font-medium text-[#0a0a0a] rounded-[2px]"
                >
                  {tech.name}
                  <span className="text-[10px] text-[#737373] ml-1.5">({tech.category})</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Interview Preparation & Tips */}
        {(experience.interview_process || experience.interview_tips) && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#991b1b]" />
              Interview Process & Preparation Tips
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experience.interview_process && (
                <div className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] space-y-2">
                  <h3 className="font-semibold text-xs text-[#0a0a0a] uppercase tracking-wider">
                    Interview Rounds
                  </h3>
                  <p className="text-xs text-[#525252] whitespace-pre-line leading-relaxed">
                    {experience.interview_process}
                  </p>
                  <div className="pt-2 text-xs text-[#737373]">
                    Difficulty: <strong className="text-[#0a0a0a]">{experience.interview_difficulty || 3} / 5</strong>
                  </div>
                </div>
              )}

              {experience.interview_tips && (
                <div className="p-5 bg-[#fff1f2]/30 border border-[#fecdd3] rounded-[2px] space-y-2">
                  <h3 className="font-semibold text-xs text-[#991b1b] uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb size={16} weight="duotone" />
                    Preparation Advice
                  </h3>
                  <p className="text-xs text-[#525252] whitespace-pre-line leading-relaxed">
                    {experience.interview_tips}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Pros & Challenges */}
        {(experience.pros || experience.challenges) && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#991b1b]" />
              Workplace Reflections
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {experience.pros && (
                <div className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] space-y-1">
                  <span className="text-xs font-semibold text-[#166534] uppercase tracking-wider block">
                    Highlights & Culture Pros
                  </span>
                  <p className="text-xs text-[#525252] leading-relaxed whitespace-pre-line">{experience.pros}</p>
                </div>
              )}
              {experience.challenges && (
                <div className="p-5 bg-white border border-[#e5e5e5] rounded-[2px] space-y-1">
                  <span className="text-xs font-semibold text-[#991b1b] uppercase tracking-wider block">
                    Challenges & Growth Areas
                  </span>
                  <p className="text-xs text-[#525252] leading-relaxed whitespace-pre-line">{experience.challenges}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Advice for Future Interns */}
        {experience.advice && (
          <section className="p-5 bg-[#f5f5f5] border border-[#e5e5e5] rounded-[2px] space-y-1">
            <span className="text-xs font-semibold text-[#0a0a0a] uppercase tracking-wider block">
              Advice for Future Interns
            </span>
            <p className="text-xs text-[#404040] leading-relaxed whitespace-pre-line">{experience.advice}</p>
          </section>
        )}

        {/* Photos & Project Showcase */}
        {experience.media && experience.media.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#991b1b]" />
              Workplace & Project Gallery
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {experience.media.map((m, idx) => (
                <div key={idx} className="bg-white border border-[#e5e5e5] overflow-hidden rounded-[2px]">
                  <img
                    src={m.media_url}
                    alt={m.caption || 'Internship media'}
                    className="w-full h-48 object-cover"
                  />
                  {m.caption && (
                    <div className="p-2.5 text-xs text-[#525252] italic border-t border-[#f5f5f5]">
                      {m.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Discussion & Questions Section */}
      <section className="pt-8 border-t border-[#e5e5e5] space-y-6">
        <div className="flex items-center gap-2">
          <ChatText size={20} weight="duotone" className="text-[#991b1b]" />
          <h3 className="font-bold text-lg text-[#0a0a0a]">Discussion & Questions ({comments?.length || 0})</h3>
        </div>

        {/* Comment Input */}
        <form onSubmit={handleCommentSubmit} className="space-y-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? "Ask a question about this internship experience..." : "Sign in to join the discussion..."}
            rows={3}
            disabled={!user}
            className="w-full text-sm bg-white border border-[#e5e5e5] rounded-[2px] p-3 focus:border-[#0a0a0a] outline-none placeholder:text-[#a3a3a3]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="blood"
              size="sm"
              disabled={!user || !commentText.trim()}
              isLoading={commentMutation.isPending}
            >
              Post Question
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="p-4 bg-white border border-[#e5e5e5] rounded-[2px] space-y-1.5">
              <div className="flex items-center justify-between text-xs text-[#737373]">
                <span className="font-semibold text-[#0a0a0a]">{comment.user_name || 'Student'}</span>
                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#404040] leading-relaxed">{comment.content}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        targetType="EXPERIENCE"
        targetId={experience.id}
        targetTitle={`${experience.position} at ${experience.company?.name}`}
      />
    </article>
  );
};

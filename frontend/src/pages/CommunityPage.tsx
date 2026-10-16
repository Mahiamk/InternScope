import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  PaperPlaneTilt,
  ChatCircleDots,
  ThumbsUp,
  ArrowSquareOut,
  MagnifyingGlass,
  ChatTeardropText,
  PushPin,
  PencilSimple,
  Trash,
  Check
} from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import type { CommunityPost } from '../types';

export const CommunityPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Links State for Telegram & WhatsApp
  const defaultTelegram = 'https://t.me/internscope_official';
  const defaultWhatsapp = 'https://chat.whatsapp.com/invite/internscope_community';

  const [telegramUrl, setTelegramUrl] = useState<string>(
    () => localStorage.getItem('internscope_telegram_url') || defaultTelegram
  );
  const [whatsappUrl, setWhatsappUrl] = useState<string>(
    () => localStorage.getItem('internscope_whatsapp_url') || defaultWhatsapp
  );

  // Edit Links Modal State
  const [editLinksModalOpen, setEditLinksModalOpen] = useState(false);
  const [tempTelegramUrl, setTempTelegramUrl] = useState(telegramUrl);
  const [tempWhatsappUrl, setTempWhatsappUrl] = useState(whatsappUrl);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);

  // Filters for Discussions
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [newPostModalOpen, setNewPostModalOpen] = useState(false);

  // Active Discussion Expanded
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  // New Post Form State
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL'
  });
  const [postFormError, setPostFormError] = useState<string | null>(null);

  // Fetch Community Groups from backend if available
  const { data: groups } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => api.community.listGroups()
  });

  // Sync with backend groups if user hasn't overridden via localStorage
  React.useEffect(() => {
    if (groups && groups.length > 0) {
      const tg = groups.find((g) => g.platform === 'TELEGRAM');
      const wa = groups.find((g) => g.platform === 'WHATSAPP');
      if (tg && !localStorage.getItem('internscope_telegram_url')) {
        setTelegramUrl(tg.invite_url);
        setTempTelegramUrl(tg.invite_url);
      }
      if (wa && !localStorage.getItem('internscope_whatsapp_url')) {
        setWhatsappUrl(wa.invite_url);
        setTempWhatsappUrl(wa.invite_url);
      }
    }
  }, [groups]);

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', postCategoryFilter, searchQuery],
    queryFn: () =>
      api.community.listPosts({
        category: postCategoryFilter !== 'ALL' ? postCategoryFilter : undefined,
        search: searchQuery || undefined
      })
  });

  const { data: activePostDetail, refetch: refetchActivePost } = useQuery({
    queryKey: ['community-post-detail', expandedPostId],
    queryFn: () => (expandedPostId ? api.community.getPost(expandedPostId) : null),
    enabled: !!expandedPostId
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: (data: typeof postForm) => api.community.createPost(data),
    onSuccess: (newPost) => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setNewPostModalOpen(false);
      setPostForm({ title: '', content: '', category: 'GENERAL' });
      setExpandedPostId(newPost.id);
    },
    onError: (err: any) => setPostFormError(err.message || 'Failed to submit post')
  });

  const upvoteMutation = useMutation({
    mutationFn: (postId: string) => api.community.toggleUpvote(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      if (expandedPostId) {
        refetchActivePost();
      }
    }
  });

  const replyMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      api.community.createReply(postId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      if (expandedPostId) {
        refetchActivePost();
      }
    }
  });

  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => api.community.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      if (expandedPostId) setExpandedPostId(null);
    }
  });

  const handleSendReply = (postId: string) => {
    const text = replyInputs[postId]?.trim();
    if (!text) return;
    replyMutation.mutate({ postId, content: text });
    setReplyInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleSaveLinks = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTg = tempTelegramUrl.trim() || defaultTelegram;
    const cleanWa = tempWhatsappUrl.trim() || defaultWhatsapp;
    localStorage.setItem('internscope_telegram_url', cleanTg);
    localStorage.setItem('internscope_whatsapp_url', cleanWa);
    setTelegramUrl(cleanTg);
    setWhatsappUrl(cleanWa);
    setSavedSuccessMsg(true);
    setTimeout(() => {
      setSavedSuccessMsg(false);
      setEditLinksModalOpen(false);
    }, 700);
  };

  const postCategories = [
    { id: 'ALL', label: 'All Discussions' },
    { id: 'JOB_LEADS', label: 'Job Leads & Referrals' },
    { id: 'ACCOMMODATION', label: 'Accommodation & Roommates' },
    { id: 'INTERVIEW_PREP', label: 'Interview Prep' },
    { id: 'ACADEMIC_LOGBOOK', label: 'Logbook & Guidelines' },
    { id: 'GENERAL', label: 'General' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Small Boxes for Telegram & WhatsApp */}
      <div className="bg-white border border-[#e5e5e5] p-5 rounded-[2px] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#991b1b] rounded-full" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373]">
                Student Community
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0a0a0a] mt-0.5">
              Community Channels & Noticeboard
            </h1>
            <p className="text-xs text-[#737373] mt-0.5 max-w-xl">
              Connect with fellow interns, ask questions, share accommodation tips, and join official student groups.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="blood" size="sm" onClick={() => setNewPostModalOpen(true)}>
              <ChatCircleDots size={15} weight="bold" />
              Start a Discussion
            </Button>
          </div>
        </div>

        {/* Small box for Telegram & small box for WhatsApp (1 for each, matching the pill box format) */}
        <div className="pt-3 border-t border-[#f0f0f0] flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#737373] mr-1">
            Join Channels:
          </span>

          {/* Telegram Small Box */}
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[2px] bg-white border border-[#e5e5e5] text-[#0a0a0a] hover:border-[#229ED9] hover:text-[#229ED9] transition-all shadow-2xs group"
            title="Join Telegram Channel"
          >
            <PaperPlaneTilt size={14} weight="fill" className="text-[#229ED9]" />
            <span>Telegram Channel</span>
            <ArrowSquareOut size={12} className="text-[#737373] group-hover:text-[#229ED9]" />
          </a>

          {/* WhatsApp Small Box */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-[2px] bg-white border border-[#e5e5e5] text-[#0a0a0a] hover:border-[#25D366] hover:text-[#25D366] transition-all shadow-2xs group"
            title="Join WhatsApp Group"
          >
            <ChatCircleDots size={14} weight="fill" className="text-[#25D366]" />
            <span>WhatsApp Group</span>
            <ArrowSquareOut size={12} className="text-[#737373] group-hover:text-[#25D366]" />
          </a>

          {/* Small button to edit the channel links */}
          <button
            type="button"
            onClick={() => {
              setTempTelegramUrl(telegramUrl);
              setTempWhatsappUrl(whatsappUrl);
              setEditLinksModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-[2px] text-[#737373] hover:text-[#0a0a0a] hover:bg-[#f5f5f5] transition-colors ml-auto sm:ml-0"
            title="Update Telegram & WhatsApp links"
          >
            <PencilSimple size={13} />
            <span>Edit Links</span>
          </button>
        </div>
      </div>

      {/* Student Discussion Noticeboard */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0a0a0a] flex items-center gap-2">
              <ChatTeardropText size={18} weight="duotone" className="text-[#991b1b]" />
              Peer Discussions & Noticeboard
            </h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Discuss internship leads, ask about housing & relocation, or get advice on logbook requirements.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlass size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            />
          </div>
        </div>

        {/* Discussion Topic Tabs (Pill boxes matching the design) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {postCategories.map((c) => (
            <button
              key={c.id}
              onClick={() => setPostCategoryFilter(c.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[2px] transition-colors ${
                postCategoryFilter === c.id
                  ? 'bg-[#0a0a0a] text-white font-semibold'
                  : 'bg-white border border-[#e5e5e5] text-[#525252] hover:bg-[#fafafa]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        {postsLoading ? (
          <div className="py-8 text-center text-xs text-[#737373]">Loading discussions...</div>
        ) : !posts || posts.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] p-8 text-center rounded-[2px] space-y-2">
            <p className="text-xs text-[#525252]">No discussion threads found in this category.</p>
            <Button variant="blood" size="sm" onClick={() => setNewPostModalOpen(true)}>
              Start a New Discussion
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isExpanded = expandedPostId === post.id;
              const detail = isExpanded && activePostDetail ? activePostDetail : post;

              return (
                <div
                  key={post.id}
                  className={`bg-white border transition-colors rounded-[2px] ${
                    isExpanded ? 'border-[#0a0a0a] shadow-xs' : 'border-[#e5e5e5] hover:border-[#a3a3a3]'
                  }`}
                >
                  <div className="p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {post.is_pinned && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-700 rounded-[2px] flex items-center gap-1">
                            <PushPin size={11} weight="fill" />
                            Pinned
                          </span>
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#f5f5f5] text-[#525252] rounded-[2px]">
                          {post.category.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-[#737373]">•</span>
                        <span className="text-xs font-semibold text-[#0a0a0a]">{post.author_name}</span>
                        <span className="text-[11px] text-[#737373]">({post.author_program || 'Student'})</span>
                      </div>
                      <span className="text-[11px] text-[#737373]">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3
                      onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                      className="text-sm font-bold text-[#0a0a0a] hover:text-[#991b1b] cursor-pointer transition-colors"
                    >
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#525252] leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    <div className="pt-2 flex items-center justify-between gap-3 border-t border-[#f5f5f5]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => upvoteMutation.mutate(post.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[2px] border transition-colors ${
                            post.has_upvoted
                              ? 'bg-red-50 text-[#991b1b] border-red-200'
                              : 'bg-white text-[#525252] border-[#e5e5e5] hover:bg-[#fafafa]'
                          }`}
                        >
                          <ThumbsUp size={13} weight={post.has_upvoted ? 'fill' : 'regular'} />
                          <span>Upvote</span>
                          <span className="font-mono text-[11px] ml-0.5">({post.upvotes_count})</span>
                        </button>

                        <button
                          onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-[2px] bg-[#fafafa] text-[#525252] hover:bg-[#f0f0f0] transition-colors"
                        >
                          <ChatCircleDots size={14} weight="bold" />
                          <span>{post.replies_count} {post.replies_count === 1 ? 'Reply' : 'Replies'}</span>
                        </button>
                      </div>

                      {user && (post.is_author || user.id === post.user_id || user.role === 'admin') && (
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this discussion post?')) {
                              deletePostMutation.mutate(post.id);
                            }
                          }}
                          className="text-[#737373] hover:text-[#991b1b] p-1 transition-colors"
                          title="Delete Post"
                        >
                          <Trash size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Threaded Replies */}
                  {isExpanded && (
                    <div className="border-t border-[#e5e5e5] bg-[#fafafa] p-4 space-y-4">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                          Replies ({detail.replies?.length || 0})
                        </h4>

                        {!detail.replies || detail.replies.length === 0 ? (
                          <p className="text-xs text-[#737373] italic">
                            No replies yet. Be the first to join the conversation!
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {detail.replies.map((reply) => (
                              <div
                                key={reply.id}
                                className="bg-white border border-[#e5e5e5] p-3 rounded-[2px] space-y-1.5 text-xs"
                              >
                                <div className="flex items-center justify-between text-[11px] text-[#737373]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-[#0a0a0a]">{reply.author_name}</span>
                                    <span>({reply.author_program || 'Student'})</span>
                                  </div>
                                  <span>{new Date(reply.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-[#374151] leading-relaxed whitespace-pre-line">
                                  {reply.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Reply Input Box */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a helpful response..."
                          value={replyInputs[post.id] || ''}
                          onChange={(e) =>
                            setReplyInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendReply(post.id);
                          }}
                          className="flex-1 text-xs px-3 py-2 bg-white border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
                        />
                        <Button
                          variant="blood"
                          size="sm"
                          onClick={() => handleSendReply(post.id)}
                          isLoading={replyMutation.isPending}
                        >
                          Reply
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL 1: Edit Telegram & WhatsApp Channel Links */}
      <Modal
        isOpen={editLinksModalOpen}
        onClose={() => setEditLinksModalOpen(false)}
        title="Configure Community Channel Links"
      >
        <form onSubmit={handleSaveLinks} className="space-y-4">
          <p className="text-xs text-[#737373]">
            Update your official Telegram and WhatsApp group links. These links will be directly opened when students click the small channel boxes.
          </p>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Telegram Channel / Group Link
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://t.me/your_channel"
                value={tempTelegramUrl}
                onChange={(e) => setTempTelegramUrl(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#229ED9]"
              />
            </div>
            <span className="text-[10px] text-[#737373] mt-0.5 block">
              Default: {defaultTelegram}
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              WhatsApp Group Link
            </label>
            <div className="relative">
              <input
                type="url"
                required
                placeholder="https://chat.whatsapp.com/invite/..."
                value={tempWhatsappUrl}
                onChange={(e) => setTempWhatsappUrl(e.target.value)}
                className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#25D366]"
              />
            </div>
            <span className="text-[10px] text-[#737373] mt-0.5 block">
              Default: {defaultWhatsapp}
            </span>
          </div>

          {savedSuccessMsg && (
            <div className="p-2 bg-green-50 border border-green-200 text-green-800 text-xs rounded-[2px] flex items-center gap-1.5">
              <Check size={14} weight="bold" />
              <span>Channel links saved successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e5]">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditLinksModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="blood" size="sm">
              Save Links
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Create Discussion Post */}
      <Modal
        isOpen={newPostModalOpen}
        onClose={() => setNewPostModalOpen(false)}
        title="Start a Community Discussion"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!postForm.title.trim() || !postForm.content.trim()) {
              setPostFormError('Please enter a title and content.');
              return;
            }
            createPostMutation.mutate(postForm);
          }}
          className="space-y-4"
        >
          {postFormError && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-[#991b1b] text-xs rounded-[2px]">
              {postFormError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Category
            </label>
            <select
              value={postForm.category}
              onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            >
              <option value="JOB_LEADS">Job Leads & Referrals</option>
              <option value="ACCOMMODATION">Accommodation & Roommates</option>
              <option value="INTERVIEW_PREP">Interview Prep</option>
              <option value="ACADEMIC_LOGBOOK">Logbook & Faculty Guidelines</option>
              <option value="GENERAL">General Cohort</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Discussion Topic / Question *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Anyone looking for a flatmate near Cyberjaya for July internship?"
              value={postForm.title}
              onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#737373] mb-1">
              Details & Context *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Provide more context so fellow interns can answer effectively..."
              value={postForm.content}
              onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
              className="w-full text-xs p-2.5 bg-[#fafafa] border border-[#e5e5e5] rounded-[2px] focus:outline-none focus:border-[#0a0a0a]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#e5e5e5]">
            <Button type="button" variant="outline" size="sm" onClick={() => setNewPostModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="blood" size="sm" isLoading={createPostMutation.isPending}>
              Publish Post
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

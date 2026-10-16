import type {
  User, Company, InternshipExperience, ExperienceListResponse,
  Opportunity, OpportunityListResponse, ApplicationTrackerItem,
  Comment, PlatformStats, AdminMetrics, ContentReport, Technology, University,
  StudentProfile, ProfileCompletion, RecommendedOpportunityResponse,
  RecommendedExperienceItem, SkillGapAnalysisResponse, CompanyLogoResolveResponse,
  SeniorQuestionItem, SeniorAnswerItem, SeniorFollowUpItem, SeniorQuestionListResponse,
  CommunityGroup, CommunityPost, CommunityReply,
  CVAnalysisResponse, CVStatusResponse
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).replace(/\/$/, '') : '') + '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('internscope_token');
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    try {
      const errorJson = await response.json();
      if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail
          .map((err: any) => `${err.loc?.slice(1)?.join('.') || 'field'}: ${err.msg}`)
          .join('; ');
      } else if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    if (response.status === 401) {
      errorDetail = 'Please sign in to perform this action.';
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: any) =>
      request<{ access_token: string; token_type: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<User>('/auth/me'),
  },

  // Universities
  universities: {
    list: () => request<University[]>('/universities'),
  },

  // Experiences
  experiences: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'All') {
          searchParams.append(k, String(v));
        }
      });
      const q = searchParams.toString();
      return request<ExperienceListResponse>(`/experiences${q ? `?${q}` : ''}`);
    },
    getMyExperiences: () => request<InternshipExperience[]>('/experiences/me'),
    getById: (id: string) => request<InternshipExperience>(`/experiences/${id}`),
    create: (data: any) =>
      request<InternshipExperience>('/experiences', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<InternshipExperience>(`/experiences/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/experiences/${id}`, {
        method: 'DELETE',
      }),
  },

  // Companies
  companies: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'All') {
          searchParams.append(k, String(v));
        }
      });
      const q = searchParams.toString();
      return request<Company[]>(`/companies${q ? `?${q}` : ''}`);
    },
    getBySlugOrId: (slugOrId: string) => request<Company>(`/companies/${slugOrId}`),
    create: (data: any) =>
      request<Company>('/companies', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resolveLogo: (websiteUrl: string) =>
      request<CompanyLogoResolveResponse>('/companies/resolve-logo', {
        method: 'POST',
        body: JSON.stringify({ website_url: websiteUrl }),
      }),
  },

  // Opportunities
  opportunities: {
    list: (params: Record<string, string | number | undefined> = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== '' && v !== 'All') {
          searchParams.append(k, String(v));
        }
      });
      const q = searchParams.toString();
      return request<OpportunityListResponse>(`/opportunities${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => request<Opportunity>(`/opportunities/${id}`),
    create: (data: any) =>
      request<Opportunity>('/opportunities', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reportClosed: (id: string) =>
      request<{ message: string }>(`/opportunities/${id}/report-closed`, {
        method: 'POST',
      }),
  },

  // Technologies
  technologies: {
    list: () => request<Technology[]>('/technologies'),
  },

  // Bookmarks
  bookmarks: {
    list: () => request<any[]>('/bookmarks'),
    toggle: (targetType: string, targetId: string) =>
      request<{ bookmarked: boolean; message: string }>('/bookmarks/toggle', {
        method: 'POST',
        body: JSON.stringify({ target_type: targetType, target_id: targetId }),
      }),
  },

  // Applications (Private Tracker)
  applications: {
    list: () => request<ApplicationTrackerItem[]>('/applications'),
    create: (data: any) =>
      request<ApplicationTrackerItem>('/applications', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<ApplicationTrackerItem>(`/applications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/applications/${id}`, {
        method: 'DELETE',
      }),
  },

  // Comments
  comments: {
    listForExperience: (experienceId: string) =>
      request<Comment[]>(`/comments/experience/${experienceId}`),
    create: (data: { experience_id: string; content: string; parent_id?: string }) =>
      request<Comment>('/comments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Reports
  reports: {
    submit: (data: { target_type: string; target_id: string; reason: string; details?: string }) =>
      request<ContentReport>('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Statistics
  stats: {
    summary: () => request<PlatformStats>('/stats/summary'),
  },

  // Admin
  admin: {
    getMetrics: () => request<AdminMetrics>('/admin/metrics'),
    listPending: () => request<InternshipExperience[]>('/admin/pending-experiences'),
    moderate: (id: string, data: { action: 'APPROVE' | 'REJECT'; notes?: string; rejection_reason?: string }) =>
      request<InternshipExperience>(`/admin/experiences/${id}/moderate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listReports: (statusFilter?: string) =>
      request<ContentReport[]>(`/admin/reports${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
    resolveReport: (id: string, statusUpdate: 'RESOLVED' | 'DISMISSED') =>
      request<{ message: string }>(`/admin/reports/${id}/resolve?status_update=${statusUpdate}`, {
        method: 'POST',
      }),
    listUsers: () => request<User[]>('/admin/users'),
  },

  // Uploads
  uploads: {
    uploadImage: async (file: File) => {
      const token = localStorage.getItem('internscope_token');
      if (!token) {
        throw new Error('Please sign in to upload images.');
      }
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.detail || 'Image upload failed');
      }

      return res.json() as Promise<{ url: string; filename: string; storage?: string }>;
    },
    uploadDocument: async (file: File) => {
      const token = localStorage.getItem('internscope_token');
      const formData = new FormData();
      formData.append('file', file);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE}/uploads/document`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const errorJson = await res.json();
        throw new Error(errorJson.detail || 'Document upload failed');
      }

      return res.json() as Promise<{ url: string; filename: string; storage?: string }>;
    },
    getStatus: () => request<{ s3_enabled: boolean; bucket_name: string; endpoint_url: string; region: string }>('/uploads/status'),
  },

  // Student Profile
  profile: {
    get: () => request<StudentProfile>('/profile'),
    update: (data: Partial<StudentProfile>) =>
      request<StudentProfile>('/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getCompletion: () => request<ProfileCompletion>('/profile/completion'),
  },

  // Career Recommendations & Intelligence
  recommendations: {
    getOpportunities: (params: { limit?: number; offset?: number; work_type?: string; location?: string } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.offset) searchParams.append('offset', String(params.offset));
      if (params.work_type) searchParams.append('work_type', params.work_type);
      if (params.location) searchParams.append('location', params.location);
      const q = searchParams.toString();
      return request<RecommendedOpportunityResponse>(`/recommendations${q ? `?${q}` : ''}`);
    },
    getExperiences: (limit: number = 6) =>
      request<RecommendedExperienceItem[]>(`/recommendations/experiences?limit=${limit}`),
    getSkillGap: (opportunityId?: string) => {
      const q = opportunityId ? `?opportunity_id=${encodeURIComponent(opportunityId)}` : '';
      return request<SkillGapAnalysisResponse>(`/recommendations/skills-gap${q}`);
    },
  },

  // Ask a Senior Q&A
  seniorQa: {
    listQuestions: (params: {
      company_id?: string;
      category?: string;
      status?: string;
      search?: string;
      my_questions?: boolean;
      can_answer?: boolean;
      limit?: number;
      offset?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.company_id) searchParams.append('company_id', params.company_id);
      if (params.category && params.category !== 'ALL') searchParams.append('category', params.category);
      if (params.status && params.status !== 'ALL') searchParams.append('status', params.status);
      if (params.search) searchParams.append('search', params.search);
      if (params.my_questions) searchParams.append('my_questions', 'true');
      if (params.can_answer) searchParams.append('can_answer', 'true');
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.offset) searchParams.append('offset', String(params.offset));
      const q = searchParams.toString();
      return request<SeniorQuestionListResponse>(`/senior-qa/questions${q ? `?${q}` : ''}`);
    },
    getQuestion: (id: string) => request<SeniorQuestionItem>(`/senior-qa/questions/${id}`),
    createQuestion: (data: {
      company_id: string;
      title: string;
      content: string;
      category: string;
      is_anonymous?: boolean;
      is_private?: boolean;
    }) =>
      request<SeniorQuestionItem>('/senior-qa/questions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    createAnswer: (questionId: string, data: { content: string; is_anonymous?: boolean }) =>
      request<SeniorAnswerItem>(`/senior-qa/questions/${questionId}/answers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleHelpful: (answerId: string) =>
      request<{ status: string; helpful_count: number; has_voted_helpful: boolean }>(
        `/senior-qa/answers/${answerId}/helpful`,
        { method: 'POST' }
      ),
    createFollowUp: (answerId: string, data: { content: string; is_anonymous?: boolean }) =>
      request<SeniorFollowUpItem>(`/senior-qa/answers/${answerId}/follow-ups`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteQuestion: (id: string) =>
      request<void>(`/senior-qa/questions/${id}`, { method: 'DELETE' }),
  },

  // Student Community
  community: {
    listGroups: (params: { platform?: string; category?: string; is_official?: boolean } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.platform && params.platform !== 'ALL') searchParams.append('platform', params.platform);
      if (params.category && params.category !== 'ALL') searchParams.append('category', params.category);
      if (params.is_official !== undefined) searchParams.append('is_official', String(params.is_official));
      const q = searchParams.toString();
      return request<CommunityGroup[]>(`/community/groups${q ? `?${q}` : ''}`);
    },
    createGroup: (data: {
      name: string;
      platform: 'TELEGRAM' | 'WHATSAPP';
      category: string;
      description: string;
      invite_url: string;
      member_count?: number;
      is_official?: boolean;
      icon_type?: string;
    }) =>
      request<CommunityGroup>('/community/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    listPosts: (params: { category?: string; search?: string } = {}) => {
      const searchParams = new URLSearchParams();
      if (params.category && params.category !== 'ALL') searchParams.append('category', params.category);
      if (params.search) searchParams.append('search', params.search);
      const q = searchParams.toString();
      return request<CommunityPost[]>(`/community/posts${q ? `?${q}` : ''}`);
    },
    getPost: (id: string) => request<CommunityPost>(`/community/posts/${id}`),
    createPost: (data: { title: string; content: string; category: string }) =>
      request<CommunityPost>('/community/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    toggleUpvote: (postId: string) =>
      request<{ status: string; upvotes_count: number; has_upvoted: boolean }>(
        `/community/posts/${postId}/upvote`,
        { method: 'POST' }
      ),
    createReply: (postId: string, data: { content: string }) =>
      request<CommunityReply>(`/community/posts/${postId}/replies`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deletePost: (id: string) =>
      request<void>(`/community/posts/${id}`, { method: 'DELETE' }),
  },

  cv: {
    getStatus: () => request<CVStatusResponse>('/cv/status'),
    testKey: (apiKey: string) =>
      request<{ valid: boolean; message: string }>('/cv/test-key', {
        method: 'POST',
        body: JSON.stringify({ api_key: apiKey }),
      }),
    analyzeText: (data: { resume_text: string; target_role?: string; target_industry?: string; api_key?: string }) =>
      request<CVAnalysisResponse>('/cv/analyze', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    analyzeFile: (formData: FormData) =>
      request<CVAnalysisResponse>('/cv/analyze-file', {
        method: 'POST',
        body: formData,
      }),
  },
};


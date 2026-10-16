export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'moderator' | 'admin';
  is_verified: boolean;
  university_id?: string;
  university_name?: string;
  program?: string;
  grad_year?: number;
  avatar_url?: string;
  created_at: string;
}

export interface University {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  domain?: string;
  is_active: boolean;
}

export interface Technology {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon?: string;
  count?: number;
}

export interface MediaItem {
  id?: string;
  media_url: string;
  caption?: string;
  order_idx?: number;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  headquarters: string;
  domain?: string;
  website?: string;
  careers_url?: string;
  logo_url?: string;
  description?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  // stats
  experiences_count?: number;
  opportunities_count?: number;
  avg_allowance?: number;
  min_allowance?: number;
  max_allowance?: number;
  currency?: string;
  avg_rating?: number;
  top_technologies?: string[];
  top_roles?: string[];
}

export interface MatchedCompanyBrief {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  website?: string;
  domain?: string;
  industry?: string;
  headquarters?: string;
}

export interface CompanyLogoResolveResponse {
  normalized_domain: string;
  normalized_url: string;
  status: 'resolved' | 'fallback' | 'not_found' | 'invalid_url';
  source: 'existing_company' | 'provider_logo' | 'fallback_favicon' | 'none';
  logo_url?: string;
  matched_company?: MatchedCompanyBrief;
  message?: string;
}

export interface ExperienceAuthor {
  full_name: string;
  program?: string;
  grad_year?: number;
  university_name?: string;
  avatar_url?: string;
}

export interface InternshipExperience {
  id: string;
  user_id: string;
  company_id: string;
  company_name?: string;
  company_website?: string;
  company_logo_url?: string;
  position: string;
  department?: string;
  location: string;
  work_type: 'onsite' | 'hybrid' | 'remote';
  start_date?: string;
  end_date?: string;
  duration_weeks?: number;
  allowance?: number;
  currency: string;
  allowance_period: string;
  is_allowance_disclosed: boolean;
  responsibilities: string;
  projects?: string;
  interview_process?: string;
  interview_tips?: string;
  interview_difficulty?: number;
  mentorship_rating?: number;
  culture_rating?: number;
  overall_rating: number;
  pros?: string;
  challenges?: string;
  advice?: string;
  anonymous_display: boolean;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';
  rejection_reason?: string;
  views_count: number;
  created_at: string;
  updated_at: string;
  company?: Company;
  author?: ExperienceAuthor;
  technologies: Technology[];
  media: MediaItem[];
  is_bookmarked?: boolean;
}

export interface ExperienceListResponse {
  items: InternshipExperience[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface Opportunity {
  id: string;
  company_id: string;
  posted_by_id?: string;
  title: string;
  department?: string;
  location: string;
  work_type: 'onsite' | 'hybrid' | 'remote';
  period: string;
  allowance?: number;
  currency: string;
  period_type: string;
  skills?: string;
  requirements?: string;
  deadline?: string;
  source_url?: string;
  apply_url: string;
  status: 'OPEN' | 'CLOSED' | 'EXPIRED';
  is_verified: boolean;
  is_expired?: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
  is_bookmarked?: boolean;
}

export interface OpportunityListResponse {
  items: Opportunity[];
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface ApplicationTrackerItem {
  id: string;
  user_id: string;
  company_name: string;
  company_id?: string;
  position: string;
  status: 'INTERESTED' | 'APPLIED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
  applied_date?: string;
  deadline?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  experience_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  status: string;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface ContentReport {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details?: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
}

export interface PlatformStats {
  total_experiences: number;
  total_companies: number;
  total_opportunities: number;
  average_allowance?: number;
  min_allowance?: number;
  max_allowance?: number;
  currency: string;
  popular_technologies: { name: string; count: number }[];
  top_locations: { location: string; count: number }[];
  top_industries: { industry: string; count: number }[];
}

export interface AdminMetrics {
  total_users: number;
  pending_experiences: number;
  published_experiences: number;
  total_companies: number;
  total_opportunities: number;
  open_reports: number;
}

export interface SkillItem {
  name: string;
  category?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface ProfileCompletion {
  is_completed: boolean;
  percentage: number;
  missing_fields: string[];
  completed_fields: string[];
  next_step?: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  preferred_name?: string;
  university_name?: string;
  degree_level?: string;
  field_of_study?: string;
  year_of_study?: number;
  grad_year?: number;
  training_start_date?: string;
  preferred_training_period?: string;
  skills: SkillItem[];
  preferred_roles: string[];
  preferred_industries: string[];
  preferred_technologies: string[];
  career_goals?: string;
  preferred_locations: string[];
  work_arrangements: string[];
  preferred_duration_weeks?: number;
  min_allowance?: number;
  availability_status: 'AVAILABLE' | 'LOOKING' | 'PLACED';
  bio?: string;
  portfolio_url?: string;
  github_url?: string;
  linkedin_url?: string;
  resume_url?: string;
  is_completed: boolean;
  completion?: ProfileCompletion;
  created_at: string;
  updated_at: string;
}

export interface RecommendedOpportunityItem {
  opportunity: Opportunity;
  match_score: number;
  score_breakdown: {
    skills_score: number;
    role_score: number;
    industry_score: number;
    location_score: number;
    allowance_score: number;
  };
  matched_skills: string[];
  missing_skills: string[];
  learning_suggestion?: string;
  reasons: string[];
}

export interface RecommendedOpportunityResponse {
  total: number;
  limit: number;
  offset: number;
  items: RecommendedOpportunityItem[];
}

export interface RecommendedExperienceItem {
  experience: InternshipExperience;
  relevance_score: number;
  highlights: string[];
}

export interface MarketGapSkill {
  skill: string;
  demand_count: number;
  priority: 'CRITICAL' | 'RECOMMENDED' | 'GOOD_TO_HAVE';
  relevant_roles: string[];
}

export interface SkillGapAnalysisResponse {
  total_evaluated_vacancies?: number;
  student_skills_count?: number;
  in_demand_missing_skills?: MarketGapSkill[];
  opportunity_id?: string;
  opportunity_title?: string;
  company_name?: string;
  match_score?: number;
  matched_skills?: string[];
  missing_skills?: string[];
  score_breakdown?: Record<string, number>;
  reasons?: string[];
}

export interface SeniorFollowUpItem {
  id: string;
  answer_id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  is_author: boolean;
  content: string;
  is_anonymous: boolean;
  created_at: string;
}

export interface SeniorAnswerItem {
  id: string;
  question_id: string;
  user_id: string;
  author_name: string;
  author_role: string;
  author_program?: string;
  is_author: boolean;
  content: string;
  is_anonymous: boolean;
  is_verified_intern: boolean;
  internship_role?: string;
  helpful_count: number;
  has_voted_helpful: boolean;
  follow_ups: SeniorFollowUpItem[];
  created_at: string;
}

export interface SeniorQuestionItem {
  id: string;
  company_id: string;
  company: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
    industry?: string;
  };
  user_id: string;
  author_name: string;
  author_program?: string;
  is_author: boolean;
  title: string;
  content: string;
  category: 'INTERVIEWS' | 'DAILY_TASKS' | 'APPLICATION_PROCESS' | 'CULTURE_BENEFITS' | 'GENERAL';
  is_anonymous: boolean;
  is_private: boolean;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  answers_count: number;
  created_at: string;
  answers?: SeniorAnswerItem[];
}

export interface SeniorQuestionListResponse {
  items: SeniorQuestionItem[];
  total: number;
  can_answer_company_ids: string[];
}

export interface CommunityGroup {
  id: string;
  name: string;
  platform: 'TELEGRAM' | 'WHATSAPP';
  category: 'OFFICIAL' | 'FACULTY_TECH' | 'FACULTY_BUSINESS' | 'REGIONAL_KL_PENANG' | 'PEER_STUDY' | 'GENERAL';
  description: string;
  invite_url: string;
  member_count: number;
  is_official: boolean;
  icon_type: string;
  created_at: string;
}

export interface CommunityReply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_program?: string;
  author_role: string;
  is_author: boolean;
  content: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_program?: string;
  author_role: string;
  is_author: boolean;
  title: string;
  content: string;
  category: 'GENERAL' | 'JOB_LEADS' | 'ACCOMMODATION' | 'INTERVIEW_PREP' | 'ACADEMIC_LOGBOOK';
  is_pinned: boolean;
  upvotes_count: number;
  has_upvoted: boolean;
  replies_count: number;
  created_at: string;
  replies?: CommunityReply[];
}

export interface CVBreakdown {
  impact_metrics: number;
  ats_readability: number;
  structure_conciseness: number;
  keywords_alignment: number;
}

export interface CVRecommendation {
  title: string;
  description: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
}

export interface CVBulletRewrite {
  original: string;
  improved: string;
  rationale: string;
}

export interface CVKeywords {
  detected: string[];
  recommended: string[];
}

export interface CVAnalysisResponse {
  overall_score: number;
  score_tier: string;
  target_role: string;
  summary: string;
  breakdown: CVBreakdown;
  strengths: string[];
  improvements: string[];
  recommendations: CVRecommendation[];
  bullet_rewrites: CVBulletRewrite[];
  keywords: CVKeywords;
  model_used?: string;
}

export interface CVStatusResponse {
  has_server_key: boolean;
  model: string;
}


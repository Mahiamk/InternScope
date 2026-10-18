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
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'CORRECTIONS_NEEDED';
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
  active_users: number;
  pending_experiences: number;
  published_experiences: number;
  rejected_experiences: number;
  corrections_needed_experiences: number;
  total_companies: number;
  verified_companies: number;
  archived_companies: number;
  total_opportunities: number;
  active_opportunities: number;
  expiring_soon_opportunities: number;
  open_reports: number;
  under_review_reports: number;
  resolved_reports: number;
  total_applications_tracked: number;
  total_bookmarks: number;
  new_users_7d: number;
  new_experiences_7d: number;
  new_reports_7d: number;
  recent_actions: {
    id: string;
    action: string;
    actor_name: string;
    entity_type: string;
    entity_id?: string;
    created_at: string;
    meta_data?: any;
  }[];
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

export interface GroupedReport {
  target_type: string;
  target_id: string;
  target_title?: string;
  target_subtitle?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  severity: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  report_count: number;
  reasons: string[];
  first_reported_at: string;
  latest_reported_at: string;
  assigned_moderator_id?: string;
  assigned_moderator_name?: string;
  resolution_notes?: string;
  resolved_at?: string;
  reports: {
    id: string;
    reporter_id?: string;
    reporter_name?: string;
    reason: string;
    details?: string;
    created_at: string;
  }[];
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  industry: string;
  headquarters: string;
  website?: string;
  careers_url?: string;
  domain?: string;
  logo_url?: string;
  description?: string;
  is_verified: boolean;
  is_archived: boolean;
  created_at: string;
  experiences_count: number;
  opportunities_count: number;
}

export interface DataQualityReport {
  missing_websites_count: number;
  missing_logos_count: number;
  expired_open_opportunities_count: number;
  possible_duplicates_count: number;
  unverified_companies_count: number;
  items: {
    id: string;
    name: string;
    issue: string;
    issue_type: string;
    details?: string;
  }[];
}

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'student' | 'moderator' | 'admin';
  program?: string;
  grad_year?: number;
  is_verified: boolean;
  is_active: boolean;
  avatar_url?: string;
  suspension_reason?: string;
  created_at: string;
  experiences_count: number;
  questions_count: number;
  answers_count: number;
  applications_count: number;
  reports_received_count: number;
}

export interface AllowanceDistribution {
  sample_size: number;
  currency: string;
  min?: number;
  max?: number;
  median?: number;
  p25?: number;
  p75?: number;
  disclaimer: string;
}

export interface AdminAnalytics {
  reports_by_industry: Record<string, number>;
  top_companies_by_reports: { name: string; slug: string; count: number }[];
  top_roles_by_reports: { position: string; count: number }[];
  application_status_breakdown: Record<string, number>;
  total_saved_bookmarks: number;
  allowance_distribution: AllowanceDistribution;
  moderation_stats: {
    total_moderation_actions: number;
    resolved_reports: number;
    pending_backlog: number;
    resolution_rate_percent: number;
    avg_review_turnaround: string;
  };
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  meta_data?: any;
  created_at: string;
}

export interface QAModerationItem {
  id: string;
  type: 'SENIOR_QUESTION' | 'SENIOR_ANSWER' | 'EXPERIENCE_COMMENT';
  title: string;
  content: string;
  author: string;
  company?: string;
  role?: string;
  status: string;
  created_at: string;
}

export interface SystemSettings {
  require_experience_approval: boolean;
  allow_student_registrations: boolean;
  allow_anonymous_reports: boolean;
  maintenance_mode: boolean;
  announcement_banner?: string;
  primary_university: string;
  version: string;
}



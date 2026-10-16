from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CVAnalysisRequest(BaseModel):
    resume_text: Optional[str] = Field(None, description="Raw plain text or markdown of the CV / resume")
    target_role: Optional[str] = Field("Software Engineering Intern", description="Target internship role or domain")
    target_industry: Optional[str] = Field("Technology", description="Target industry")
    api_key: Optional[str] = Field(None, description="User-provided Google Gemini API key")

class CVBreakdown(BaseModel):
    impact_metrics: int = Field(..., ge=0, le=100, description="Use of metrics, numbers, and business impact")
    ats_readability: int = Field(..., ge=0, le=100, description="ATS scan friendliness, clear headers, standard formatting")
    structure_conciseness: int = Field(..., ge=0, le=100, description="Chronology, brevity, layout efficiency")
    keywords_alignment: int = Field(..., ge=0, le=100, description="Alignment with expected industry terms and tech stack")

class CVRecommendation(BaseModel):
    title: str
    description: str
    priority: str = Field("HIGH", description="HIGH, MEDIUM, or LOW")
    category: Optional[str] = None

class CVBulletRewrite(BaseModel):
    original: str
    improved: str
    rationale: str

class CVKeywords(BaseModel):
    detected: List[str] = Field(default_factory=list)
    recommended: List[str] = Field(default_factory=list)

class CVAnalysisResponse(BaseModel):
    overall_score: int = Field(..., ge=0, le=100)
    score_tier: str = Field(..., description="Exceptional (90+), Competitive (75-89), Needs Polish (60-74), Critical Revisions (<60)")
    target_role: str
    summary: str
    breakdown: CVBreakdown
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    recommendations: List[CVRecommendation] = Field(default_factory=list)
    bullet_rewrites: List[CVBulletRewrite] = Field(default_factory=list)
    keywords: CVKeywords
    model_used: Optional[str] = "gemini-1.5-flash"

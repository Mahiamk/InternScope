from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth, universities, companies, experiences, opportunities,
    technologies, bookmarks, applications, comments, reports,
    admin, uploads, stats, profile, recommendations, senior_qa, community, cv
)

api_router = APIRouter()

api_router.include_router(cv.router, prefix="/cv", tags=["AI CV Analyser"])

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(profile.router, prefix="/profile", tags=["Student Profile"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["Career Recommendations"])
api_router.include_router(senior_qa.router, prefix="/senior-qa", tags=["Ask a Senior Q&A"])
api_router.include_router(community.router, prefix="/community", tags=["Student Community"])
api_router.include_router(universities.router, prefix="/universities", tags=["Universities"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(experiences.router, prefix="/experiences", tags=["Experiences"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities"])
api_router.include_router(technologies.router, prefix="/technologies", tags=["Technologies"])
api_router.include_router(bookmarks.router, prefix="/bookmarks", tags=["Bookmarks"])
api_router.include_router(applications.router, prefix="/applications", tags=["Application Tracker"])
api_router.include_router(comments.router, prefix="/comments", tags=["Comments"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin & Moderation"])
api_router.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
api_router.include_router(stats.router, prefix="/stats", tags=["Statistics & Insights"])


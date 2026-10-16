import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import async_engine, Base
from app.api.v1.api import api_router
from app.db.seed_data import seed_database
from app.db.seed_senior_qa import seed_senior_qa
from app.db.seed_community import seed_community

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Auto-seed initial demonstration data if empty
    await seed_database()
    await seed_senior_qa()
    await seed_community()
    
    yield
    
    # Cleanup
    await async_engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Student Internship Experience & Discovery Platform for Universities in Malaysia",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount static files
upload_dir = "/tmp/uploads" if os.environ.get("VERCEL") else settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "name": "InternScope API",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "operational"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc) if os.getenv("DEBUG") else "An internal server error occurred."}
    )

import pytest
import os
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.models.university import University
from app.models.user import User
from app.core.security import get_password_hash

TEST_DB_FILE = "./test_internscope.db"
TEST_DB_URL = f"sqlite+aiosqlite:///{TEST_DB_FILE}"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as db:
        aiu = University(name="AIU Test", code="AIU_T", city="Alor Setar", country="Malaysia")
        db.add(aiu)
        await db.flush()
        u = User(
            email="teststudent@aiu.edu.my",
            hashed_password=get_password_hash("Password123!"),
            full_name="Test Student",
            role="student",
            university_id=aiu.id,
            is_verified=True,
            is_active=True
        )
        mod = User(
            email="testmod@aiu.edu.my",
            hashed_password=get_password_hash("ModPassword123!"),
            full_name="Test Mod",
            role="moderator",
            university_id=aiu.id,
            is_verified=True,
            is_active=True
        )
        db.add_all([u, mod])
        await db.commit()

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

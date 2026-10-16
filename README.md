# InternScope — Student Internship Experience Platform

> **"Your next internship starts with someone else's experience."**

InternScope is a production-ready, student-powered industrial training knowledge base and discovery platform. Designed specifically for university students in Malaysia (piloting at **Albukhary International University — AIU**), it empowers students to discover internship opportunities, read candid peer experience reports, benchmark self-reported monthly allowances, and privately track internship applications.

---

## 1. Design Direction & Aesthetic

- **Design Philosophy**: Swiss Design & International Typographic Style.
- **Color Palette**: High-contrast Monochrome base (Black `#0a0a0a`, White `#ffffff`, Cool Grays `#f5f5f5` / `#e5e5e5` / `#737373`) with Blood Red (`#991b1b` / `#881337`) signature accents.
- **Typography**: [Lexend](https://fonts.google.com/specimen/Lexend) font family for optimal reading ergonomics and clean geometry.
- **Icons**: Phosphor Duotone icons (`@phosphor-icons/react` weight="duotone").
- **Layout Architecture**: Strict grid alignment, hairline borders, zero arbitrary gradients, and authentic content-first editorial presentation.

---

## 2. Technology Stack

### Frontend
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS + Custom Swiss Design System tokens
- **Routing**: React Router v7
- **State & Caching**: TanStack Query (React Query)
- **Icons**: Phosphor Icons (`@phosphor-icons/react`)
- **Forms & Validation**: Controlled states + type-safe schemas

### Backend
- **Framework**: Python 3.12+ / 3.14 + FastAPI
- **Data Validation & Schemas**: Pydantic v2 & Pydantic Settings
- **ORM & Database**: SQLAlchemy 2.0 (Async) + PostgreSQL (with SQLite async fallback for effortless local testing)
- **Migrations**: Alembic async migrations
- **Authentication**: JWT (JSON Web Tokens) + Password hashing with native `bcrypt`
- **Testing**: Pytest + `pytest-asyncio` + `httpx`

---

## 3. Core Capabilities & User Journeys

1. **Multi-Faculty & School Coverage**:
   - **Business & Management**: Supply chain operations, corporate strategy, ERP (Sime Darby, Nestlé).
   - **Media & Communications**: Broadcast journalism, newsrooms, PR, podcasting (Media Prima, BFM 89.9).
   - **Marketing & Brand Strategy**: Performance marketing, SEO, social campaigns (Ogilvy, Shopee).
   - **Politics & Public Policy**: Policy research, legislative tracking, think tanks (IDEAS, ISIS Malaysia).
   - **Education & Pedagogy**: Classroom teaching, TESL, curriculum design (Teach For Malaysia, Cempaka IB).
   - **Finance & Accounting**: Audit & assurance, investment banking, IFRS (PwC Malaysia, CIMB Group).
   - **Technology & Computing**: Software engineering, AI/ML, cloud, semiconductors (Grab, Intel, PETRONAS).

2. **Searchable Organization Directory & Profile Pages**:
   - Organization profiles across conglomerates, media houses, agencies, think tanks, schools, and tech giants.
   - Separation of official employer details from student-submitted claims.
   - Real-time aggregated statistics (average monthly allowance, reported range, intern ratings).
   - Direct links to official careers portals.

3. **Editorial Experience Reports**:
   - Structured 5-pillar reports: Responsibilities, Projects Delivered, Skills/Tools Used, Interview Process & Difficulty, and Workplace Reflections.
   - Monthly allowance disclosure with clear self-reported transparency labeling.
   - Peer discussion and questions section.
   - Contributor privacy options (Verified AIU Student vs Anonymous Senior).

4. **5-Step Experience Publishing Flow**:
   - Step 1: Company & Role with quick-select Faculty/Department badges
   - Step 2: Location, Arrangement (On-site / Hybrid / Remote), Dates & Duration
   - Step 3: Responsibilities, Projects, Discipline-Specific Skill Tags, Optional Allowance
   - Step 4: Workplace Culture, Mentorship Rating, Interview Questions & Advice
   - Step 5: Photo uploads, Privacy anonymity toggles, and Consent terms
   - Local draft persistence to resume anytime.

4. **Active Internship Opportunities**:
   - Verified vacancy listings with direct apply links to official application portals.
   - Automatic expiry calculations based on deadlines.
   - Community reporting button to flag closed vacancies.

5. **Student Dashboard & Private Application Tracker**:
   - Kanban board with statuses: `Interested`, `Applied`, `Interviewing`, `Offered`, `Rejected`.
   - Private application notes, deadlines, and dates (strictly user-isolated; never publicly exposed).
   - Personal bookmark management for companies, vacancies, and experience reports.

6. **Admin & Moderation System**:
   - Role-Based Access Control (`student`, `moderator`, `admin`).
   - Pending experience submissions queue with Approve and Reject (with feedback notes) workflows.
   - Content flagging and takedown report resolution queue.
   - Audit logging for moderation actions.

---

## 4. Getting Started Locally

### Prerequisites
- Node.js v20+ and npm v10+
- Python 3.11+

### A. Run Backend
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Backend API will be accessible at: `http://localhost:8000`*
*Interactive OpenAPI documentation: `http://localhost:8000/docs`*

### B. Run Frontend
```bash
cd frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```
*Frontend will be accessible at: `http://localhost:5173`*

---

## 5. Instant Test Accounts (Demonstration Data)

The platform comes pre-seeded with realistic Malaysian industry internship data and test accounts:

| Role | Email | Password | Faculty / Purpose |
| :--- | :--- | :--- | :--- |
| **Computing Student** | `student@aiu.edu.my` | `StudentPass123!` | Bachelor of Computer Science (Grab review) |
| **Business Student** | `nurul@aiu.edu.my` | `StudentPass123!` | Bachelor of Business Administration (Sime Darby review) |
| **Media Student** | `kevin@aiu.edu.my` | `StudentPass123!` | Bachelor of Media & Communication (Media Prima review) |
| **Marketing Student** | `siti@aiu.edu.my` | `StudentPass123!` | Bachelor of Marketing & PR (Ogilvy review) |
| **Politics Student** | `hassan@aiu.edu.my` | `StudentPass123!` | Bachelor of Politics & IR (IDEAS review) |
| **Education Student** | `maryam@aiu.edu.my` | `StudentPass123!` | Bachelor of Education TESL (Teach For Malaysia review) |
| **Finance Student** | `zulkifli@aiu.edu.my` | `StudentPass123!` | Bachelor of Finance & Accounting (PwC review) |
| **AIU Moderator** | `moderator@aiu.edu.my` | `ModPass123!` | Access `/admin` moderation queue, approve/reject |
| **Administrator** | `admin@internscope.my` | `AdminPass123!` | Full admin privileges, user management, audit logs |

---

## 6. Automated Testing

Run the backend test suite:
```bash
cd backend
./venv/bin/pytest -v
```
All integration tests cover:
- Authentication & JWT issuance
- Experience creation, filtering, and permissions
- Private application tracker isolation
- Bookmark toggling and statistical aggregates

---

## 7. Deployment Guide

### Environment Variables
Configure `.env` in `backend/`:
```env
PROJECT_NAME="InternScope API"
VERSION="1.0.0"
DATABASE_URL="postgresql+asyncpg://postgres:yourpassword@db:5432/internscope"
SECRET_KEY="replace-with-a-64-character-random-hex-key"
ACCESS_TOKEN_EXPIRE_MINUTES=10080
UPLOAD_DIR="uploads"
MAX_IMAGE_SIZE_BYTES=5242880
PRIMARY_UNIVERSITY="Albukhary International University (AIU)"
```

### Production Docker Deployment
Run using `docker-compose.yml`:
```bash
docker compose up -d --build
```

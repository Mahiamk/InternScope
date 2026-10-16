import uuid
from datetime import date
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.university import University
from app.models.user import User
from app.models.company import Company
from app.models.technology import Technology, ExperienceTechnology
from app.models.experience import InternshipExperience, ExperienceMedia
from app.models.interactions import Application

async def seed_database():
    async with AsyncSessionLocal() as db:
        print("--> Verifying and enriching InternScope database with all university schools (Business, Media, Marketing, Politics, Education, Finance, Tech)...")

        # 1. Universities
        aiu_res = await db.execute(select(University).where(University.code == "AIU"))
        aiu = aiu_res.scalar_one_or_none()
        if not aiu:
            aiu = University(
                name="Albukhary International University",
                code="AIU",
                city="Alor Setar, Kedah",
                country="Malaysia",
                domain="aiu.edu.my",
                is_active=True
            )
            um = University(
                name="Universiti Malaya",
                code="UM",
                city="Kuala Lumpur",
                country="Malaysia",
                domain="um.edu.my",
                is_active=True
            )
            utm = University(
                name="Universiti Teknologi Malaysia",
                code="UTM",
                city="Johor Bahru",
                country="Malaysia",
                domain="utm.my",
                is_active=True
            )
            ukm = University(
                name="Universiti Kebangsaan Malaysia",
                code="UKM",
                city="Bangi, Selangor",
                country="Malaysia",
                domain="ukm.edu.my",
                is_active=True
            )
            db.add_all([aiu, um, utm, ukm])
            await db.flush()

        # 2. Users across all Schools
        users_to_ensure = [
            ("admin@internscope.my", "AdminPass123!", "Admin Supervisor", "admin", "Institutional Administration", 2024),
            ("moderator@aiu.edu.my", "ModPass123!", "AIU Career & Industrial Training Officer", "moderator", "Career Development Centre", 2024),
            # Computing & IT
            ("tariq@aiu.edu.my", "StudentPass123!", "Tariq Mansoor", "student", "Bachelor of Computer Science (Hons)", 2026),
            ("student@aiu.edu.my", "StudentPass123!", "Tariq Mansoor", "student", "Bachelor of Computer Science (Hons)", 2026),
            ("farhan@aiu.edu.my", "StudentPass123!", "Farhan Zainal", "student", "Software Engineering", 2025),
            # Business & Management
            ("nurul@aiu.edu.my", "StudentPass123!", "Nurul Izzati", "student", "Bachelor of Business Administration (BBA)", 2025),
            # Media & Communications
            ("kevin@aiu.edu.my", "StudentPass123!", "Kevin Tan", "student", "Bachelor of Media & Communication", 2025),
            # Marketing & Brand Strategy
            ("siti@aiu.edu.my", "StudentPass123!", "Siti Aminah", "student", "Bachelor of Marketing & Public Relations", 2025),
            # Politics & Public Policy
            ("hassan@aiu.edu.my", "StudentPass123!", "Hassan Al-Baqir", "student", "Bachelor of Politics & International Relations", 2025),
            # Education & Teaching
            ("maryam@aiu.edu.my", "StudentPass123!", "Maryam Yusof", "student", "Bachelor of Education (TESL)", 2025),
            # Finance & Accounting
            ("zulkifli@aiu.edu.my", "StudentPass123!", "Zulkifli Ahmad", "student", "Bachelor of Finance & Accounting", 2025),
        ]

        user_map = {}
        for email, pwd, name, role, prog, grad in users_to_ensure:
            u_res = await db.execute(select(User).where(User.email == email))
            u = u_res.scalar_one_or_none()
            if not u:
                u = User(
                    email=email,
                    hashed_password=get_password_hash(pwd),
                    full_name=name,
                    role=role,
                    university_id=aiu.id,
                    program=prog,
                    grad_year=grad,
                    is_verified=True,
                    is_active=True
                )
                db.add(u)
                await db.flush()
            user_map[email] = u

        # 3. Companies across all Industries
        companies_data = [
            # Tech & Engineering
            {
                "name": "Grab Malaysia",
                "slug": "grab-malaysia",
                "industry": "Technology & Mobility",
                "headquarters": "Petaling Jaya, Selangor",
                "website": "https://grab.careers",
                "careers_url": "https://grab.careers/jobs",
                "description": "Southeast Asia's leading superapp offering ride-hailing, food delivery, and digital financial services."
            },
            {
                "name": "PETRONAS Digital",
                "slug": "petronas-digital",
                "industry": "Energy & Digital Transformation",
                "headquarters": "Kuala Lumpur (KLCC)",
                "website": "https://www.petronas.com",
                "careers_url": "https://www.petronas.com/careers/internship",
                "description": "Malaysia's Fortune Global 500 energy company driving AI and cloud enterprise solutions."
            },
            {
                "name": "Intel Malaysia",
                "slug": "intel-malaysia",
                "industry": "Semiconductor & Hardware",
                "headquarters": "Bayan Lepas, Penang",
                "website": "https://intel.com",
                "careers_url": "https://jobs.intel.com",
                "description": "Major chip assembly, test, and design facilities in Penang and Kulim Hi-Tech Park."
            },
            {
                "name": "MoneyLion Malaysia",
                "slug": "moneylion-malaysia",
                "industry": "Fintech & Engineering",
                "headquarters": "KL Sentral, Kuala Lumpur",
                "website": "https://www.moneylion.com",
                "careers_url": "https://www.moneylion.com/careers",
                "description": "US-based mobile banking and financial wellness platform with core engineering hub in KL."
            },
            # Business & Conglomerates
            {
                "name": "Sime Darby Berhad",
                "slug": "sime-darby",
                "industry": "Conglomerate & Industrial Business",
                "headquarters": "Petaling Jaya, Selangor",
                "website": "https://www.simedarby.com",
                "careers_url": "https://www.simedarby.com/careers",
                "description": "A leading multinational conglomerate in the Asia Pacific region operating in industrial equipment, automotive, and logistics operations."
            },
            {
                "name": "Nestlé Malaysia",
                "slug": "nestle-malaysia",
                "industry": "FMCG & Consumer Goods",
                "headquarters": "Mutiara Damansara, Selangor",
                "website": "https://www.nestle.com.my",
                "careers_url": "https://www.nestle.com.my/careers",
                "description": "The world's largest food and beverage manufacturer in Malaysia, offering premier commercial and supply chain training."
            },
            # Media & Communications
            {
                "name": "Media Prima Berhad",
                "slug": "media-prima",
                "industry": "Media, Broadcasting & Journalism",
                "headquarters": "Sri Pentas, Bandar Utama, Selangor",
                "website": "https://www.mediaprima.com.my",
                "careers_url": "https://www.mediaprima.com.my/careers",
                "description": "Malaysia's leading integrated media conglomerate encompassing TV3, New Straits Times Press, Big Tree, and REV Media."
            },
            {
                "name": "BFM 89.9 (The Business Station)",
                "slug": "bfm-899",
                "industry": "Media, Broadcasting & Podcasting",
                "headquarters": "Damansara Heights, Kuala Lumpur",
                "website": "https://www.bfm.my",
                "careers_url": "https://www.bfm.my/careers",
                "description": "Malaysia's premier independent business and current affairs radio station, renowned for in-depth policy, business, and cultural dialogues."
            },
            # Marketing & Advertising
            {
                "name": "Ogilvy Malaysia",
                "slug": "ogilvy-malaysia",
                "industry": "Marketing, Advertising & PR",
                "headquarters": "Bangsar South, Kuala Lumpur",
                "website": "https://www.ogilvy.com/my",
                "careers_url": "https://www.ogilvy.com/careers",
                "description": "Award-winning global creative agency providing integrated brand strategy, digital consumer experience, and public relations."
            },
            {
                "name": "Shopee Malaysia",
                "slug": "shopee-malaysia",
                "industry": "E-Commerce & Digital Marketing",
                "headquarters": "Mid Valley City, Kuala Lumpur",
                "website": "https://shopee.com.my",
                "careers_url": "https://careers.shopee.com.my",
                "description": "Southeast Asia's leading e-commerce platform with dynamic marketing, campaign analytics, and merchant growth hubs in KL."
            },
            # Politics, Governance & Public Policy
            {
                "name": "IDEAS (Institute for Democracy and Economic Affairs)",
                "slug": "ideas-malaysia",
                "industry": "Public Policy, Politics & Think Tank",
                "headquarters": "Bukit Tunku, Kuala Lumpur",
                "website": "https://www.ideas.org.my",
                "careers_url": "https://www.ideas.org.my/careers",
                "description": "Top independent Malaysian policy research think tank focusing on public governance, economic freedom, and rule of law."
            },
            {
                "name": "ISIS Malaysia",
                "slug": "isis-malaysia",
                "industry": "Public Policy, International Relations & Politics",
                "headquarters": "Persiaran Sultan Salahuddin, Kuala Lumpur",
                "website": "https://www.isis.org.my",
                "careers_url": "https://www.isis.org.my/careers",
                "description": "Malaysia's foremost foreign policy, ASEAN regional security, and socio-economic strategy think tank."
            },
            # Education & Teaching
            {
                "name": "Teach For Malaysia",
                "slug": "teach-for-malaysia",
                "industry": "Education & Non-Profit",
                "headquarters": "Brickfields, Kuala Lumpur",
                "website": "https://teachformalaysia.org",
                "careers_url": "https://teachformalaysia.org/join-us",
                "description": "Nationwide education equity movement placing and supporting educational leaders in high-need schools across Malaysia."
            },
            {
                "name": "Cempaka International School",
                "slug": "cempaka-international",
                "industry": "Education & Teaching",
                "headquarters": "Damansara Heights & Cheras, Kuala Lumpur",
                "website": "https://cempaka.edu.my",
                "careers_url": "https://cempaka.edu.my/careers",
                "description": "Premier private international IB World School pioneering holistic arts, bilingual speech, and student-centered pedagogy."
            },
            # Finance, Banking & Accounting
            {
                "name": "PwC Malaysia",
                "slug": "pwc-malaysia",
                "industry": "Finance, Accounting & Advisory",
                "headquarters": "1 Sentral, KL Sentral, Kuala Lumpur",
                "website": "https://www.pwc.com/my",
                "careers_url": "https://www.pwc.com/my/careers",
                "description": "World's leading professional services firm providing audit, assurance, tax, and strategy consulting to Malaysia's top corporations."
            },
            {
                "name": "CIMB Group",
                "slug": "cimb-group",
                "industry": "Banking, Finance & Investment",
                "headquarters": "Menara CIMB, KL Sentral, Kuala Lumpur",
                "website": "https://www.cimb.com",
                "careers_url": "https://www.cimb.com/careers",
                "description": "Leading ASEAN universal bank operating across consumer banking, commercial treasury, and investment banking."
            },
            {
                "name": "Maybank Digital",
                "slug": "maybank-digital",
                "industry": "Banking & Fintech",
                "headquarters": "Menara Maybank, Kuala Lumpur",
                "website": "https://www.maybank.com",
                "careers_url": "https://www.maybank.com/careers",
                "description": "Largest financial services group in Malaysia pioneering digital banking innovations."
            },
            {
                "name": "Carsome",
                "slug": "carsome",
                "industry": "E-Commerce & Automotive",
                "headquarters": "Petaling Jaya, Selangor",
                "website": "https://www.carsome.my",
                "careers_url": "https://careers.carsome.com",
                "description": "Southeast Asia's largest integrated car e-commerce platform and Malaysia's first tech unicorn."
            }
        ]

        comp_map = {}
        for cdata in companies_data:
            c_res = await db.execute(select(Company).where(Company.slug == cdata["slug"]))
            comp = c_res.scalar_one_or_none()
            if not comp:
                comp = Company(
                    name=cdata["name"],
                    slug=cdata["slug"],
                    industry=cdata["industry"],
                    headquarters=cdata["headquarters"],
                    website=cdata["website"],
                    careers_url=cdata["careers_url"],
                    description=cdata["description"],
                    is_verified=True
                )
                db.add(comp)
                await db.flush()
            comp_map[cdata["slug"]] = comp

        # 4. Technologies & Interdisciplinary Skills
        skills_data = [
            # Tech
            ("Python", "python", "Technology"),
            ("FastAPI", "fastapi", "Technology"),
            ("React", "react", "Technology"),
            ("TypeScript", "typescript", "Technology"),
            ("PostgreSQL", "postgresql", "Technology"),
            ("Go (Golang)", "go", "Technology"),
            ("Docker", "docker", "Technology"),
            ("Power BI", "power-bi", "Data/Analytics"),
            ("Figma", "figma", "Design"),
            # Business
            ("Business Strategy", "business-strategy", "Business"),
            ("Supply Chain Management", "supply-chain", "Business"),
            ("ERP (SAP)", "sap-erp", "Business"),
            ("Project Management", "project-management", "Business"),
            ("Excel Modeling", "excel-modeling", "Business"),
            # Media
            ("Adobe Premiere Pro", "adobe-premiere", "Media"),
            ("Broadcast Journalism", "broadcast-journalism", "Media"),
            ("Media Relations", "media-relations", "Media"),
            ("Video Production", "video-production", "Media"),
            ("Podcasting", "podcasting", "Media"),
            ("News Writing", "news-writing", "Media"),
            # Marketing
            ("Digital Marketing", "digital-marketing", "Marketing"),
            ("Google Analytics 4", "google-analytics", "Marketing"),
            ("Meta Ads Manager", "meta-ads", "Marketing"),
            ("SEO & Content Strategy", "seo-content", "Marketing"),
            ("Brand Strategy", "brand-strategy", "Marketing"),
            ("Canva", "canva", "Marketing"),
            # Politics & Public Policy
            ("Policy Analysis", "policy-analysis", "Politics"),
            ("Legislative Research", "legislative-research", "Politics"),
            ("Qualitative Research", "qualitative-research", "Politics"),
            ("SPSS Data Analysis", "spss-analysis", "Politics"),
            ("Stakeholder Advocacy", "stakeholder-advocacy", "Politics"),
            ("Bilateral Diplomacy", "bilateral-diplomacy", "Politics"),
            # Education
            ("Lesson Planning", "lesson-planning", "Education"),
            ("Classroom Management", "classroom-management", "Education"),
            ("TESL / ESL Pedagogy", "tesl-pedagogy", "Education"),
            ("Curriculum Design", "curriculum-design", "Education"),
            ("Differentiated Instruction", "differentiated-instruction", "Education"),
            ("Educational Technology", "edtech", "Education"),
            # Finance & Accounting
            ("Financial Modeling", "financial-modeling", "Finance"),
            ("Audit & Assurance", "audit-assurance", "Finance"),
            ("IFRS / MFRS Standards", "ifrs-standards", "Finance"),
            ("Corporate Valuation", "corporate-valuation", "Finance"),
            ("Bloomberg Terminal", "bloomberg-terminal", "Finance"),
            ("Tax Compliance", "tax-compliance", "Finance"),
        ]

        skill_map = {}
        for sname, sslug, scat in skills_data:
            s_res = await db.execute(select(Technology).where(Technology.slug == sslug))
            s = s_res.scalar_one_or_none()
            if not s:
                s = Technology(
                    id=str(uuid.uuid4()),
                    name=sname,
                    slug=sslug,
                    category=scat
                )
                db.add(s)
                await db.flush()
            skill_map[sslug] = s

        # 5. Internship Experiences for All Schools
        experiences_to_add = [
            # 1. Tech (Grab)
            {
                "user": user_map["student@aiu.edu.my"],
                "comp": comp_map["grab-malaysia"],
                "position": "Software Engineer Intern (Backend)",
                "department": "Engineering & Technology",
                "location": "Petaling Jaya, Selangor",
                "work_type": "hybrid",
                "start_date": date(2025, 3, 1),
                "end_date": date(2025, 8, 31),
                "duration_weeks": 24,
                "allowance": 1800.0,
                "responsibilities": "Developed high-throughput microservices using Go and Kafka for merchant onboarding notifications. Wrote unit and integration tests with 85%+ coverage.",
                "projects": "Built an automated dead-letter queue re-processing pipeline that saved ~3 engineering hours weekly during merchant sync spikes.",
                "interview_process": "2 rounds: 1st was a 45-minute technical screen (LeetCode medium on HashMaps and Trees), 2nd was a 1-hour system design & behavioral round with the Engineering Manager.",
                "interview_tips": "Focus on clean Go idioms, concurrency primitives (goroutines/channels), and understand REST vs gRPC trade-offs.",
                "interview_difficulty": 4,
                "mentorship_rating": 5,
                "culture_rating": 5,
                "overall_rating": 5,
                "pros": "Incredible senior mentorship, daily coffee allowance, high impact on live production systems, top-tier engineering culture.",
                "challenges": "Steep learning curve in the first 3 weeks navigating a large monorepo with strict deployment pipelines.",
                "advice": "Ask questions early rather than getting stuck for days. Keep a daily work journal to document what you learn.",
                "skills": ["go", "docker", "postgresql"],
                "media_url": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
                "caption": "Merchant engineering team demo day at Grab PJ."
            }
        ]

        for exp_data in experiences_to_add:
            # Check if experience already exists
            check_exp = await db.execute(
                select(InternshipExperience).where(
                    InternshipExperience.user_id == exp_data["user"].id,
                    InternshipExperience.company_id == exp_data["comp"].id
                )
            )
            existing_exp = check_exp.scalar_one_or_none()
            if not existing_exp:
                new_exp = InternshipExperience(
                    user_id=exp_data["user"].id,
                    company_id=exp_data["comp"].id,
                    position=exp_data["position"],
                    department=exp_data["department"],
                    location=exp_data["location"],
                    work_type=exp_data["work_type"],
                    start_date=exp_data["start_date"],
                    end_date=exp_data["end_date"],
                    duration_weeks=exp_data["duration_weeks"],
                    allowance=exp_data["allowance"],
                    currency="MYR",
                    allowance_period="monthly",
                    is_allowance_disclosed=True,
                    responsibilities=exp_data["responsibilities"],
                    projects=exp_data["projects"],
                    interview_process=exp_data["interview_process"],
                    interview_tips=exp_data["interview_tips"],
                    interview_difficulty=exp_data["interview_difficulty"],
                    mentorship_rating=exp_data["mentorship_rating"],
                    culture_rating=exp_data["culture_rating"],
                    overall_rating=exp_data["overall_rating"],
                    pros=exp_data["pros"],
                    challenges=exp_data["challenges"],
                    advice=exp_data["advice"],
                    anonymous_display=False,
                    status="PUBLISHED",
                    views_count=180
                )
                db.add(new_exp)
                await db.flush()

                # Add skills
                for sk_slug in exp_data["skills"]:
                    if sk_slug in skill_map:
                        db.add(ExperienceTechnology(
                            id=str(uuid.uuid4()),
                            experience_id=new_exp.id,
                            technology_id=skill_map[sk_slug].id
                        ))

                # Add media
                if exp_data.get("media_url"):
                    db.add(ExperienceMedia(
                        experience_id=new_exp.id,
                        media_url=exp_data["media_url"],
                        caption=exp_data.get("caption", ""),
                        order_idx=0
                    ))

        await db.commit()
        print("--> Database successfully enriched with comprehensive data across ALL schools!")


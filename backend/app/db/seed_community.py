from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.community import (
    CommunityGroup,
    CommunityPost,
    CommunityReply,
    CommunityPostVote
)

async def seed_community():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_group = await db.scalar(select(CommunityGroup).limit(1))
        if existing_group:
            return

        print("--> Seeding Student Community Telegram & WhatsApp channels and discussions...")

        admin = await db.scalar(select(User).where(User.email == "admin@internscope.my"))
        student_tariq = await db.scalar(select(User).where(User.email == "student@aiu.edu.my"))
        farhan = await db.scalar(select(User).where(User.email == "farhan@aiu.edu.my"))

        admin_id = admin.id if admin else None
        student_id = student_tariq.id if student_tariq else None
        farhan_id = farhan.id if farhan else None

        # 1. Telegram & WhatsApp Groups
        groups_data = [
            {
                "name": "AIU Official Industrial Training & Career Channel",
                "platform": "TELEGRAM",
                "category": "OFFICIAL",
                "description": "Verified university channel for industrial training announcement circulars, logbook submission deadlines, and faculty coordinator briefings.",
                "invite_url": "https://t.me/aiu_internships_official",
                "member_count": 485,
                "is_official": True,
                "icon_type": "broadcast"
            },
            {
                "name": "AIU School of Computing & Tech Internship Hub",
                "platform": "WHATSAPP",
                "category": "FACULTY_TECH",
                "description": "Active WhatsApp group for Computer Science & Software Engineering students. Share live technical test tips, leetcode questions, and employee referrals.",
                "invite_url": "https://chat.whatsapp.com/invite/AIU-Tech-Interns-2026",
                "member_count": 220,
                "is_official": False,
                "icon_type": "code"
            },
            {
                "name": "Malaysian Tech Interns Network (KL, Cyberjaya & Penang)",
                "platform": "TELEGRAM",
                "category": "REGIONAL_KL_PENANG",
                "description": "Nationwide inter-university Telegram community. Network with students interning across MNCs and startups in Klang Valley and Penang.",
                "invite_url": "https://t.me/malaysia_intern_network",
                "member_count": 1450,
                "is_official": False,
                "icon_type": "network"
            },
            {
                "name": "AIU Business, Marketing & Finance Placement Circle",
                "platform": "WHATSAPP",
                "category": "FACULTY_BUSINESS",
                "description": "Dedicated community for BBA, Marketing, and Accounting undergraduates preparing CVs, bank assessment centers, and HR interviews.",
                "invite_url": "https://chat.whatsapp.com/invite/AIU-Business-Placements",
                "member_count": 175,
                "is_official": False,
                "icon_type": "briefcase"
            },
            {
                "name": "AIU Peer Mock Interview & Resume Swap",
                "platform": "TELEGRAM",
                "category": "PEER_STUDY",
                "description": "Practice mock behavioral (STAR method) and technical interviews with peer students. Get fast peer CV critiques before submitting applications.",
                "invite_url": "https://t.me/aiu_interview_prep_circle",
                "member_count": 310,
                "is_official": False,
                "icon_type": "users"
            },
            {
                "name": "Kuala Lumpur Intern Roommate & Rental Finder",
                "platform": "WHATSAPP",
                "category": "REGIONAL_KL_PENANG",
                "description": "Connecting AIU and northern university students seeking flatmates and rooms near LRT/MRT lines in Bangsar South, KL Sentral, and Petaling Jaya.",
                "invite_url": "https://chat.whatsapp.com/invite/KL-Intern-Roommates",
                "member_count": 280,
                "is_official": False,
                "icon_type": "house"
            }
        ]

        for g in groups_data:
            new_g = CommunityGroup(
                name=g["name"],
                platform=g["platform"],
                category=g["category"],
                description=g["description"],
                invite_url=g["invite_url"],
                member_count=g["member_count"],
                is_official=g["is_official"],
                icon_type=g["icon_type"],
                created_by_id=admin_id
            )
            db.add(new_g)

        await db.flush()

        # 2. Seed Discussion Posts if users exist
        if student_id and farhan_id:
            p1 = CommunityPost(
                user_id=student_id,
                title="Finding short-term rental near Bangsar South / Mid Valley for 6-month placement?",
                content="Hey everyone! I just accepted an internship offer in Mid Valley starting July. Does anyone have recommendations for student-friendly rooms or apartments near the Kelana Jaya LRT line? Looking to share with fellow AIU students if anyone is also relocating!",
                category="ACCOMMODATION",
                is_pinned=True,
                upvotes_count=8
            )
            db.add(p1)
            await db.flush()

            r1 = CommunityReply(
                post_id=p1.id,
                user_id=farhan_id,
                content="Congrats on the offer! Check out South View Serviced Apartments or Vista Angkasa right next to Universiti LRT. Several interns from previous cohorts stayed there and it's super convenient to commute."
            )
            db.add(r1)

            p2 = CommunityPost(
                user_id=farhan_id,
                title="Companies actively hiring for Q3/Q4 2026 intake (Software, Cloud & Analytics)",
                content="Compiling a list of tech employers with open applications for the upcoming industrial training window: Grab Malaysia, PETRONAS Digital, Intel Penang, and Shopee. Remember to tailor your resume project section with live GitHub demo links!",
                category="JOB_LEADS",
                is_pinned=False,
                upvotes_count=12
            )
            db.add(p2)
            await db.flush()

            r2 = CommunityReply(
                post_id=p2.id,
                user_id=student_id,
                content="Super helpful compilation Farhan! Bookmarked."
            )
            db.add(r2)

            p3 = CommunityPost(
                user_id=student_id,
                title="Format tips for weekly logbook entries to satisfy SCI faculty evaluation",
                content="For seniors who completed their training: how detailed should the weekly technical reflections be? Do lecturers prefer bullet points of tasks completed or full paragraphs explaining problems solved?",
                category="ACADEMIC_LOGBOOK",
                is_pinned=False,
                upvotes_count=5
            )
            db.add(p3)

        await db.commit()
        print("--> Successfully seeded Student Community channels and discussions!")

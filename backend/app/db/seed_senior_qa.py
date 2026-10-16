from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.company import Company
from app.models.user import User
from app.models.senior_qa import SeniorQuestion, SeniorAnswer, SeniorFollowUp, SeniorAnswerVote

async def seed_senior_qa():
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        existing_q = await db.scalar(select(SeniorQuestion).limit(1))
        if existing_q:
            return

        print("--> Seeding Ask a Senior initial Q&A discussions...")

        # Find companies
        grab = await db.scalar(select(Company).where(Company.slug == "grab"))
        petronas = await db.scalar(select(Company).where(Company.slug == "petronas"))
        intel = await db.scalar(select(Company).where(Company.slug == "intel"))

        if not grab or not petronas:
            return

        # Find users
        student_tariq = await db.scalar(select(User).where(User.email == "student@aiu.edu.my"))
        farhan = await db.scalar(select(User).where(User.email == "farhan@aiu.edu.my"))
        admin = await db.scalar(select(User).where(User.email == "admin@internscope.my"))

        if not student_tariq or not farhan:
            return

        # 1. Grab Interview Question
        q1 = SeniorQuestion(
            user_id=student_tariq.id,
            company_id=grab.id,
            title="What should I expect in the Grab Software Engineering technical screening?",
            content="I received an invitation for the 45-minute live technical interview with Grab Malaysia next week for the backend team. Do they focus mainly on LeetCode DS/Algo, or do they ask practical questions about REST APIs and database queries? Any tips on what to review?",
            category="INTERVIEWS",
            is_anonymous=False,
            is_private=False,
            status="ANSWERED"
        )
        db.add(q1)
        await db.flush()

        ans1 = SeniorAnswer(
            question_id=q1.id,
            user_id=farhan.id,
            content="Congrats on getting the interview! Grab's screening is very practical and engineering-focused. In my interview, they asked 1 medium-level problem (string manipulation with hash maps) followed by a short discussion on how you would design a REST endpoint that handles high-concurrency driver location updates. They care a lot about clean code and how you talk through edge cases. Definitely review basic database indexing and know your HTTP status codes.",
            is_anonymous=False,
            is_verified_intern=True,
            internship_role="Verified Software Engineering Intern • Class of 2024",
            helpful_count=5,
            status="PUBLISHED"
        )
        db.add(ans1)
        await db.flush()

        # Follow-ups for ans1
        fu1 = SeniorFollowUp(
            answer_id=ans1.id,
            user_id=student_tariq.id,
            content="Thanks a lot Farhan! Did they ask any live SQL queries during the screen or was it mostly pseudo-code?",
            is_anonymous=False
        )
        fu2 = SeniorFollowUp(
            answer_id=ans1.id,
            user_id=farhan.id,
            content="It was mostly discussing the query structure and indexing strategy (e.g. read-heavy vs write-heavy tables) rather than testing syntax trivia. Good luck!",
            is_anonymous=False
        )
        db.add_all([fu1, fu2])

        # Vote for ans1
        vote1 = SeniorAnswerVote(
            answer_id=ans1.id,
            user_id=student_tariq.id
        )
        db.add(vote1)

        # 2. PETRONAS Daily Tasks Question
        q2 = SeniorQuestion(
            user_id=student_tariq.id,
            company_id=petronas.id,
            title="What are the day-to-day responsibilities for a Data Analyst intern at PETRONAS Digital?",
            content="I got an offer for the 6-month industrial placement at PETRONAS Twin Towers in KL. Can any previous interns share what a typical week looks like? How much autonomy do interns get with real production pipelines vs just creating dashboard slides?",
            category="DAILY_TASKS",
            is_anonymous=False,
            is_private=False,
            status="ANSWERED"
        )
        db.add(q2)
        await db.flush()

        ans2 = SeniorAnswer(
            question_id=q2.id,
            user_id=farhan.id,
            content="You will spend the first 2 weeks onboarding with their enterprise Azure Data Factory and Databricks stack. After that, you are assigned directly to an agile squad. In my 6 months, I built automated PySpark ingestion pipelines for oil field telemetry data. You will definitely present findings to senior project managers, but you do real engineering and data pipeline work every single day.",
            is_anonymous=False,
            is_verified_intern=True,
            internship_role="Verified Data Engineering Intern • Class of 2024",
            helpful_count=4,
            status="PUBLISHED"
        )
        db.add(ans2)

        # 3. Intel Application Process (Anonymous)
        if intel:
            q3 = SeniorQuestion(
                user_id=student_tariq.id,
                company_id=intel.id,
                title="How long does Intel Penang usually take between HR screening and the technical panel?",
                content="I completed my introductory phone screening with an Intel recruiter 10 days ago for the Embedded Systems team in Bayan Lepas, but haven't received the technical panel scheduling email yet. Is this normal turnaround time or should I send a polite follow-up?",
                category="APPLICATION_PROCESS",
                is_anonymous=True,
                is_private=False,
                status="ANSWERED"
            )
            db.add(q3)
            await db.flush()

            ans3 = SeniorAnswer(
                question_id=q3.id,
                user_id=admin.id,
                content="Intel's campus hiring operates in seasonal batches, so waiting 2 to 3 weeks between HR and hiring manager rounds is completely normal, especially around university semester breaks. A polite follow-up after 14 days to express your continued enthusiasm is standard practice and well-received.",
                is_anonymous=False,
                is_verified_intern=True,
                internship_role="Verified Firmware Engineering Alumni • Class of 2023",
                helpful_count=3,
                status="PUBLISHED"
            )
            db.add(ans3)

        await db.commit()
        print("--> Successfully seeded Ask a Senior questions & verified answers!")

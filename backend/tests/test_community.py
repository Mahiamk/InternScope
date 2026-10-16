import pytest

@pytest.mark.asyncio
async def test_student_community_lifecycle(client):
    # 1. Login
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "teststudent@aiu.edu.my", "password": "Password123!"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Telegram Community Group
    tg_payload = {
        "name": "AIU Computing Telegram Channel",
        "platform": "TELEGRAM",
        "category": "FACULTY_TECH",
        "description": "Channel for Software Engineering internships",
        "invite_url": "https://t.me/aiu_computing_interns",
        "member_count": 150,
        "is_official": False,
        "icon_type": "code"
    }
    create_tg = await client.post("/api/v1/community/groups", json=tg_payload, headers=headers)
    assert create_tg.status_code == 201
    tg_id = create_tg.json()["id"]

    # 3. Create WhatsApp Community Group
    wa_payload = {
        "name": "AIU Penang Interns WhatsApp Group",
        "platform": "WHATSAPP",
        "category": "REGIONAL_KL_PENANG",
        "description": "WhatsApp group for students placed in Bayan Lepas & George Town",
        "invite_url": "https://chat.whatsapp.com/invite/AIU-Penang-Interns",
        "member_count": 80,
        "is_official": False,
        "icon_type": "map"
    }
    create_wa = await client.post("/api/v1/community/groups", json=wa_payload, headers=headers)
    assert create_wa.status_code == 201

    # 4. List Groups with Platform filter
    list_tg = await client.get("/api/v1/community/groups?platform=TELEGRAM")
    assert list_tg.status_code == 200
    tg_groups = list_tg.json()
    assert any(g["id"] == tg_id for g in tg_groups)
    assert all(g["platform"] == "TELEGRAM" for g in tg_groups)

    list_wa = await client.get("/api/v1/community/groups?platform=WHATSAPP")
    assert list_wa.status_code == 200
    wa_groups = list_wa.json()
    assert all(g["platform"] == "WHATSAPP" for g in wa_groups)

    # 5. Create Community Discussion Post
    post_payload = {
        "title": "Looking for Penang flatmates starting August intake",
        "content": "I accepted an offer at Intel Bayan Lepas and am searching for 1-2 students to share an apartment near Queensbay.",
        "category": "ACCOMMODATION"
    }
    create_post = await client.post("/api/v1/community/posts", json=post_payload, headers=headers)
    assert create_post.status_code == 201
    post_id = create_post.json()["id"]

    # 6. Upvote Post
    upvote_resp = await client.post(f"/api/v1/community/posts/{post_id}/upvote", headers=headers)
    assert upvote_resp.status_code == 200
    assert upvote_resp.json()["upvotes_count"] == 1
    assert upvote_resp.json()["has_upvoted"] is True

    # 7. Reply to Discussion Post
    reply_payload = {
        "content": "Hey! I also got placed at Keysight nearby. Let's connect on WhatsApp to view units together!"
    }
    reply_resp = await client.post(f"/api/v1/community/posts/{post_id}/replies", json=reply_payload, headers=headers)
    assert reply_resp.status_code == 201
    assert reply_resp.json()["content"] == reply_payload["content"]

    # 8. Get Post Detail
    detail_resp = await client.get(f"/api/v1/community/posts/{post_id}", headers=headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["upvotes_count"] == 1
    assert detail["has_upvoted"] is True
    assert len(detail["replies"]) == 1
    assert detail["replies"][0]["content"] == reply_payload["content"]

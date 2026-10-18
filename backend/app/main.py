from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import date
import json

from app.config import settings
from app.database import engine, Base, get_db
from app import models, schemas
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.executor import evaluate_test_cases, execute_code_single_run
from app.ai_tutor import ask_ai_tutor, ask_communication_coach
from app.question_service import format_question, list_questions
from app.seed_data import seed_if_empty
from app.badge_engine import check_and_award_badges, award_points_for_submission, award_points_for_quiz
from app.recommendation_engine import compute_readiness_score, recommend_next_topic

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ── Admin dependency ──────────────────────────────────────────────────────────
def get_current_admin(current: models.User = Depends(get_current_user)):
    if not current.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current


@app.on_event("startup")
def _startup():
    db = next(get_db())
    try:
        seed_if_empty(db)
        # ── Auto-create admin account if not exists ───────────────────────────
        admin = db.query(models.User).filter_by(email=settings.ADMIN_EMAIL).first()
        if not admin:
            admin = models.User(
                email=settings.ADMIN_EMAIL,
                hashed_password=hash_password(settings.ADMIN_PASSWORD),
                name="Admin",
                is_admin=True
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()


# ---------- AUTH ----------
@app.post("/api/auth/register", response_model=schemas.AuthResponse)
def register(data: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter_by(email=data.email).first():
        raise HTTPException(400, "Email already registered")
    u = models.User(email=data.email, hashed_password=hash_password(data.password), name=data.name)
    db.add(u)
    db.commit()
    db.refresh(u)
    token = create_access_token({"sub": str(u.id), "ver": u.token_version or 0})
    return {"access_token": token, "token_type": "bearer", "user": u}


@app.post("/api/auth/login", response_model=schemas.AuthResponse)
def login(data: schemas.UserLogin, db: Session = Depends(get_db)):
    u = db.query(models.User).filter_by(email=data.email).first()
    if not u or u.is_admin or not verify_password(data.password, u.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    token = create_access_token({"sub": str(u.id), "ver": u.token_version or 0})
    return {"access_token": token, "token_type": "bearer", "user": u}


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(current: models.User = Depends(get_current_user)):
    return current


@app.put("/api/auth/profile", response_model=schemas.UserOut)
def update_profile(data: schemas.UserProfileUpdate, db: Session = Depends(get_db),
                   current: models.User = Depends(get_current_user)):
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(current, k, v)
    db.commit()
    db.refresh(current)
    return current


# ---------- PATHS / TOPICS ----------
@app.get("/api/paths")
def get_paths(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    paths = db.query(models.LearningPath).order_by(models.LearningPath.order).all()
    progress_map = {p.topic_id: p for p in
                    db.query(models.UserTopicProgress).filter_by(user_id=current.id).all()}
    out = []
    for p in paths:
        topics = []
        for t in sorted(p.topics, key=lambda x: x.order):
            prog = progress_map.get(t.id)
            topics.append({
                "id": t.id, "path_key": t.path_key, "topic_key": t.topic_key,
                "title": t.title, "category": t.category, "difficulty": t.difficulty,
                "order": t.order, "estimated_minutes": t.estimated_minutes,
                "verified_question_count": t.verified_question_count,
                "target_question_count": t.target_question_count, "icon": t.icon,
                "status": prog.status if prog else "not_started",
                "score": prog.score if prog else 0.0
            })
        out.append({
            "id": p.id, "path_key": p.path_key, "title": p.title, "tagline": p.tagline,
            "description": p.description, "icon": p.icon, "color": p.color,
            "order": p.order, "topics": topics,
            "resource_links": json.loads(p.resource_links or "[]")
        })
    return out


@app.get("/api/topics/{topic_key}")
def get_topic(topic_key: str, db: Session = Depends(get_db),
              current: models.User = Depends(get_current_user)):
    t = db.query(models.Topic).filter_by(topic_key=topic_key).first()
    if not t:
        raise HTTPException(404, "Topic not found")

    content = None
    if t.content:
        def parse(f, d):
            try:
                return json.loads(f) if f else d
            except Exception:
                return d
        content = {
            "intro_what": t.content.intro_what, "intro_why": t.content.intro_why,
            "real_world_apps": parse(t.content.real_world_apps, []),
            "placement_importance": t.content.placement_importance,
            "learning_objectives": parse(t.content.learning_objectives, []),
            "prerequisites": parse(t.content.prerequisites, []),
            "concept_explanation": t.content.concept_explanation,
            "dry_run_guide": t.content.dry_run_guide,
            "code_examples": parse(t.content.code_examples, {}),
            "time_space_complexity": parse(t.content.time_space_complexity, {})
        }

    prog = db.query(models.UserTopicProgress).filter_by(user_id=current.id, topic_id=t.id).first()
    return {
        "id": t.id, "path_key": t.path_key, "topic_key": t.topic_key, "title": t.title,
        "category": t.category, "difficulty": t.difficulty, "order": t.order,
        "estimated_minutes": t.estimated_minutes, "icon": t.icon,
        "verified_question_count": t.verified_question_count,
        "target_question_count": t.target_question_count,
        "status": prog.status if prog else "not_started",
        "score": prog.score if prog else 0.0, "content": content
    }


@app.get("/api/topics/{topic_id}/questions")
def get_questions(topic_id: int, q_type: str = None, difficulty: str = None, search: str = None,
                  db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    return list_questions(db, topic_id, q_type, difficulty, search)


@app.get("/api/questions/{qid}")
def get_question(qid: int, db: Session = Depends(get_db),
                 current: models.User = Depends(get_current_user)):
    q = db.query(models.Question).filter_by(id=qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    return format_question(q)


@app.post("/api/questions/{qid}/run")
def run_code(qid: int, data: schemas.CodeRunRequest, db: Session = Depends(get_db),
             current: models.User = Depends(get_current_user)):
    return execute_code_single_run(data.language, data.code, data.custom_input or "")


@app.post("/api/questions/{qid}/submit")
def submit_code(qid: int, data: schemas.CodeSubmitRequest, db: Session = Depends(get_db),
                current: models.User = Depends(get_current_user)):
    q = db.query(models.Question).filter_by(id=qid).first()
    if not q:
        raise HTTPException(404, "Question not found")

    try:
        tcs = json.loads(q.test_cases) if q.test_cases else []
    except Exception:
        tcs = []

    result = evaluate_test_cases(data.language, data.code, tcs)
    all_passed = result["passed_count"] == result["total_count"] and result["total_count"] > 0

    pts = award_points_for_submission(db, current, q.difficulty, all_passed)

    sub = models.Submission(
        user_id=current.id, question_id=qid, language=data.language, code=data.code,
        status=result["status"], passed_test_cases=result["passed_count"],
        total_test_cases=result["total_count"], execution_time_ms=result["execution_time_ms"],
        feedback=result["feedback"], points_awarded=pts
    )
    db.add(sub)

    today = date.today().isoformat()
    act = db.query(models.StudyActivity).filter_by(user_id=current.id, date=today).first()
    if not act:
        act = models.StudyActivity(user_id=current.id, date=today)
        db.add(act)
    if all_passed:
        act.questions_solved = (act.questions_solved or 0) + 1
    act.points_earned = (act.points_earned or 0) + pts

    new_badges = check_and_award_badges(db, current)
    db.commit()

    result["points_awarded"] = pts
    result["total_points"] = current.points
    result["new_badges"] = [{"title": b.title, "icon": b.icon, "tier": b.tier} for b in new_badges]
    return result


# ---------- QUIZZES ----------
@app.get("/api/quizzes/{topic_id}")
def get_quiz(topic_id: int, db: Session = Depends(get_db),
             current: models.User = Depends(get_current_user)):
    qs = db.query(models.Question).filter_by(topic_id=topic_id, type="mcq").all()
    return [{
        "id": q.id, "question_uid": q.question_uid, "title": q.title,
        "description": q.description,
        "options": json.loads(q.options) if q.options else []
    } for q in qs]


@app.post("/api/quizzes/{topic_id}/submit")
def submit_quiz(topic_id: int, data: schemas.QuizSubmitRequest, db: Session = Depends(get_db),
                current: models.User = Depends(get_current_user)):
    qs = db.query(models.Question).filter_by(topic_id=topic_id, type="mcq").all()
    correct = 0
    results = []
    for q in qs:
        ans = data.answers.get(q.question_uid, "")
        ok = ans.strip().lower() == (q.correct_answer or "").strip().lower()
        if ok:
            correct += 1
        results.append({
            "question_uid": q.question_uid, "is_correct": ok,
            "user_answer": ans, "correct_answer": q.correct_answer,
            "explanation": q.explanation
        })

    total = len(qs)
    pct = (correct / total * 100) if total else 0

    pts = award_points_for_quiz(db, current, pct)
    attempt = models.QuizAttempt(
        user_id=current.id, topic_id=topic_id, score=pct,
        total_questions=total, correct_answers=correct,
        answers_json=json.dumps(data.answers), points_awarded=pts
    )
    db.add(attempt)

    prog = db.query(models.UserTopicProgress).filter_by(user_id=current.id, topic_id=topic_id).first()
    if not prog:
        prog = models.UserTopicProgress(user_id=current.id, topic_id=topic_id)
        db.add(prog)
    prog.score = max(prog.score or 0, pct)
    prog.status = ("completed" if pct >= settings.THRESHOLD_MASTERY
                    else ("needs_revision" if pct < settings.THRESHOLD_REVISION else "in_progress"))

    new_badges = check_and_award_badges(db, current)
    db.commit()

    return {
        "score_percentage": round(pct, 2), "correct_count": correct, "total_count": total,
        "status": prog.status, "feedback": f"You scored {correct}/{total}",
        "results": results, "weak_concepts": [], "points_awarded": pts,
        "new_badges": [{"title": b.title, "icon": b.icon, "tier": b.tier} for b in new_badges]
    }


# ---------- BADGES ----------
@app.get("/api/badges", response_model=schemas.BadgesResponse)
def get_badges(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    badges = db.query(models.UserBadge).filter_by(user_id=current.id)\
        .order_by(models.UserBadge.awarded_at.desc()).all()

    next_ms, days_left = None, None
    for ms in settings.STREAK_BADGE_MILESTONES:
        if current.streak_count < ms:
            next_ms, days_left = ms, ms - current.streak_count
            break

    return {
        "total_points": current.points or 0,
        "streak_days": current.streak_count,
        "badges": badges,
        "next_streak_milestone": next_ms,
        "days_to_next_badge": days_left,
        "total_badges_available": len(settings.STREAK_BADGE_MILESTONES)
                                  + len(settings.QUESTION_BADGE_MILESTONES) + 5
    }


@app.get("/api/leaderboard")
def leaderboard(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    users = db.query(models.User).order_by(models.User.points.desc()).limit(20).all()
    return [{"rank": i + 1, "name": u.name, "points": u.points,
             "streak": u.streak_count, "is_me": u.id == current.id}
            for i, u in enumerate(users)]


# ---------- DASHBOARD ----------
@app.get("/api/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db), current: models.User = Depends(get_current_user)):
    subs = db.query(models.Submission).filter_by(user_id=current.id).all()
    passed_subs = [s for s in subs if s.status == "Passed"]
    quizzes = db.query(models.QuizAttempt).filter_by(user_id=current.id).all()
    avg_quiz = sum(q.score for q in quizzes) / len(quizzes) if quizzes else 0.0
    coding_acc = (len(passed_subs) / len(subs) * 100) if subs else 0.0

    recent = db.query(models.StudyActivity).filter_by(user_id=current.id)\
        .order_by(models.StudyActivity.date.desc()).limit(7).all()

    all_topics = db.query(models.Topic).all()
    rec = recommend_next_topic(current, db, all_topics)
    readiness = compute_readiness_score(current, db)

    return {
        "welcome_message": f"Welcome back, {current.name}!",
        "user_name": current.name,
        "streak_days": current.streak_count,
        "readiness_score": readiness,
        "total_questions_solved": len(passed_subs),
        "total_lessons_completed": db.query(models.UserTopicProgress)
            .filter_by(user_id=current.id, status="completed").count(),
        "quiz_average_accuracy": round(avg_quiz, 2),
        "coding_accuracy": round(coding_acc, 2),
        "category_progress": [],
        "weak_topics": [],
        "recent_activity": [{"date": a.date, "minutes": a.minutes,
                              "questions_solved": a.questions_solved} for a in recent],
        "recommended_topic": rec,
        "daily_plan": ["Solve 2 array problems", "Review linked lists", "Take one quiz"],
        "total_points": current.points or 0,
        "badges_earned": db.query(models.UserBadge).filter_by(user_id=current.id).count()
    }


# ---------- AI TUTOR ----------
@app.post("/api/ai/tutor")
async def ai_tutor_endpoint(data: schemas.AITutorRequest, db: Session = Depends(get_db),
                             current: models.User = Depends(get_current_user)):
    topic_title, question_title = "DSA", "Problem"
    if data.topic_id:
        t = db.query(models.Topic).filter_by(id=data.topic_id).first()
        if t:
            topic_title = t.title
    if data.question_id:
        q = db.query(models.Question).filter_by(id=data.question_id).first()
        if q:
            question_title = q.title

    return await ask_ai_tutor(
        action=data.action, topic_title=topic_title, question_title=question_title,
        code_context=data.code_context, error_context=data.error_context,
        language=data.language, preferred_language_mode=data.preferred_language_mode,
        hint_level=data.hint_level, custom_prompt=data.prompt or ""
    )


# ---------- COMMUNICATION COACH ----------
@app.post("/api/ai/coach")
async def communication_coach_endpoint(data: schemas.CommunicationCoachRequest,
                                        current: models.User = Depends(get_current_user)):
    return await ask_communication_coach(
        mode=data.mode,
        topic=data.topic,
        user_message=data.user_message,
        history=data.history,
        role=data.role,
        preferred_language=data.preferred_language
    )


# ---------- ADMIN ----------
@app.post("/api/admin/login", response_model=schemas.AuthResponse)
def admin_login(data: schemas.AdminLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(email=data.email).first()
    if not user or not user.is_admin:
        raise HTTPException(401, "Invalid admin credentials")
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(401, "Invalid admin credentials")
    token = create_access_token({"sub": str(user.id), "ver": user.token_version or 0})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/api/admin/change-password")
def admin_change_password(data: schemas.AdminChangePassword, db: Session = Depends(get_db),
                           current: models.User = Depends(get_current_admin)):
    # Verify current password
    if not verify_password(data.current_password, current.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if len(data.new_password) < 8:
        raise HTTPException(400, "New password must be at least 8 characters")
    if data.new_password == data.current_password:
        raise HTTPException(400, "New password must be different from current password")

    # Change password and bump token_version → invalidates ALL existing tokens
    current.hashed_password = hash_password(data.new_password)
    current.token_version = (current.token_version or 0) + 1
    db.commit()

    # Issue a fresh token for the current session so admin isn't locked out
    new_token = create_access_token({"sub": str(current.id), "ver": current.token_version})
    return {
        "detail": "Password changed. All other sessions have been logged out.",
        "new_token": new_token
    }


@app.get("/api/admin/topics", response_model=list[schemas.TopicOut])
def admin_list_topics(db: Session = Depends(get_db),
                      _: models.User = Depends(get_current_admin)):
    return db.query(models.Topic).order_by(models.Topic.path_key, models.Topic.order).all()


@app.get("/api/admin/questions")
def admin_list_questions(topic_id: int = None, db: Session = Depends(get_db),
                         _: models.User = Depends(get_current_admin)):
    q = db.query(models.Question)
    if topic_id:
        q = q.filter_by(topic_id=topic_id)
    return q.order_by(models.Question.topic_id, models.Question.id).all()


@app.post("/api/admin/questions", response_model=schemas.QuestionOut)
def admin_create_question(data: schemas.QuestionCreate, db: Session = Depends(get_db),
                           _: models.User = Depends(get_current_admin)):
    if not data.topic_id or data.topic_id <= 0:
        raise HTTPException(400, "Please select a valid topic")
    topic = db.query(models.Topic).filter_by(id=data.topic_id).first()
    if not topic:
        raise HTTPException(404, "Selected topic not found")

    import time, re
    q_uid = (data.question_uid or "").strip()
    if not q_uid:
        slug = re.sub(r'[^a-zA-Z0-9]+', '_', data.title.lower()).strip('_')[:20]
        q_uid = f"{slug or 'q'}_{int(time.time()*1000)}"
    if db.query(models.Question).filter_by(question_uid=q_uid).first():
        q_uid = f"{q_uid}_{int(time.time()*1000)}"

    data_dict = data.model_dump()
    data_dict["question_uid"] = q_uid

    q = models.Question(**data_dict)
    db.add(q)
    # bump topic verified count
    topic.verified_question_count = (topic.verified_question_count or 0) + 1
    db.commit()
    db.refresh(q)
    return q


@app.put("/api/admin/questions/{qid}", response_model=schemas.QuestionOut)
def admin_update_question(qid: int, data: schemas.QuestionUpdate, db: Session = Depends(get_db),
                           _: models.User = Depends(get_current_admin)):
    q = db.query(models.Question).filter_by(id=qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(q, k, v)
    db.commit()
    db.refresh(q)
    return q


@app.delete("/api/admin/questions/{qid}")
def admin_delete_question(qid: int, db: Session = Depends(get_db),
                           _: models.User = Depends(get_current_admin)):
    q = db.query(models.Question).filter_by(id=qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    topic = db.query(models.Topic).filter_by(id=q.topic_id).first()
    if topic and topic.verified_question_count > 0:
        topic.verified_question_count -= 1
    db.delete(q)
    db.commit()
    return {"detail": "deleted"}


@app.get("/api/admin/users")
def admin_list_users(db: Session = Depends(get_db),
                     _: models.User = Depends(get_current_admin)):
    users = db.query(models.User).filter_by(is_admin=False).all()
    return [{"id": u.id, "name": u.name, "email": u.email,
             "points": u.points, "streak": u.streak_count,
             "created_at": u.created_at} for u in users]


@app.get("/api/admin/analytics")
def admin_analytics(db: Session = Depends(get_db),
                    _: models.User = Depends(get_current_admin)):
    total_users = db.query(models.User).filter_by(is_admin=False).count()
    total_questions = db.query(models.Question).count()
    total_submissions = db.query(models.Submission).count()
    total_quizzes = db.query(models.QuizAttempt).count()
    passed = db.query(models.Submission).filter_by(status="Passed").count()
    paths = db.query(models.LearningPath).count()
    topics = db.query(models.Topic).count()

    # Top active users
    top_users = db.query(models.User).filter_by(is_admin=False)\
        .order_by(models.User.points.desc()).limit(5).all()

    # Most attempted questions
    from sqlalchemy import func
    hot_qs = db.query(models.Question.title,
                      func.count(models.Submission.id).label("attempts"))\
        .join(models.Submission, models.Submission.question_id == models.Question.id)\
        .group_by(models.Question.id).order_by(func.count(models.Submission.id).desc()).limit(5).all()

    # Topic progress overview
    topic_stats = []
    for t in db.query(models.Topic).all():
        completed = db.query(models.UserTopicProgress)\
            .filter_by(topic_id=t.id, status="completed").count()
        topic_stats.append({"topic": t.title, "completed": completed,
                             "questions": t.verified_question_count})

    return {
        "totals": {
            "users": total_users, "questions": total_questions,
            "submissions": total_submissions, "quizzes": total_quizzes,
            "pass_rate": round(passed / total_submissions * 100, 1) if total_submissions else 0,
            "learning_paths": paths, "topics": topics
        },
        "top_users": [{"name": u.name, "email": u.email, "points": u.points,
                       "streak": u.streak_count} for u in top_users],
        "hot_questions": [{"title": q.title, "attempts": q.attempts} for q in hot_qs],
        "topic_stats": topic_stats
    }


@app.get("/api/admin/paths")
def admin_list_paths(db: Session = Depends(get_db),
                     _: models.User = Depends(get_current_admin)):
    paths = db.query(models.LearningPath).order_by(models.LearningPath.order).all()
    result = []
    for p in paths:
        topics = db.query(models.Topic).filter_by(path_key=p.path_key)\
            .order_by(models.Topic.order).all()
        result.append({
            "id": p.id, "path_key": p.path_key, "title": p.title,
            "tagline": p.tagline, "icon": p.icon, "color": p.color,
            "order": p.order, "topic_count": len(topics),
            "resource_links": p.resource_links or "[]",
            "topics": [{"id": t.id, "title": t.title, "topic_key": t.topic_key,
                        "difficulty": t.difficulty, "order": t.order,
                        "description": t.description or "",
                        "verified_question_count": t.verified_question_count} for t in topics]
        })
    return result


@app.put("/api/admin/paths/{pid}/resources")
def admin_update_path_resources(pid: int, data: dict, db: Session = Depends(get_db),
                                 _: models.User = Depends(get_current_admin)):
    """Update resource_links JSON for a learning path."""
    import json as _json
    p = db.query(models.LearningPath).filter_by(id=pid).first()
    if not p:
        raise HTTPException(404, "Path not found")
    p.resource_links = _json.dumps(data.get("resource_links", []))
    db.commit()
    return {"detail": "updated", "resource_links": p.resource_links}


@app.post("/api/admin/paths")
def admin_create_path(data: dict, db: Session = Depends(get_db),
                      _: models.User = Depends(get_current_admin)):
    import time, re
    title = (data.get("title") or "Untitled Learning Path").strip()
    path_key = (data.get("path_key") or "").strip()
    if not path_key:
        path_key = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')[:40] or "path"
    if db.query(models.LearningPath).filter_by(path_key=path_key).first():
        path_key = f"{path_key}-{int(time.time()*1000)}"

    p = models.LearningPath(
        path_key=path_key, title=title,
        tagline=data.get("tagline", ""), description=data.get("description", ""),
        icon=data.get("icon", "book"), color=data.get("color", "blue"),
        order=data.get("order", 99),
        resource_links=data.get("resource_links", "[]")
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "path_key": p.path_key, "title": p.title}


@app.post("/api/admin/topics")
def admin_create_topic(data: dict, db: Session = Depends(get_db),
                       _: models.User = Depends(get_current_admin)):
    import time, re
    title = (data.get("title") or "Untitled Topic").strip()
    path_key = (data.get("path_key") or "").strip()
    if not path_key:
        first_path = db.query(models.LearningPath).first()
        path_key = first_path.path_key if first_path else "dsa"
    topic_key = (data.get("topic_key") or "").strip()
    if not topic_key:
        topic_key = re.sub(r'[^a-zA-Z0-9]+', '-', title.lower()).strip('-')[:50] or "topic"
    if db.query(models.Topic).filter_by(topic_key=topic_key).first():
        topic_key = f"{topic_key}-{int(time.time()*1000)}"

    t = models.Topic(
        path_key=path_key, topic_key=topic_key,
        title=title, category=data.get("category", "Core"),
        difficulty=data.get("difficulty", "Medium"),
        order=data.get("order", 99),
        estimated_minutes=data.get("estimated_minutes", 60),
        icon=data.get("icon", "book"),
        description=data.get("description", "")
    )
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "topic_key": t.topic_key, "title": t.title}


@app.put("/api/admin/paths/{pid}")
def admin_update_path(pid: int, data: dict, db: Session = Depends(get_db),
                      _: models.User = Depends(get_current_admin)):
    p = db.query(models.LearningPath).filter_by(id=pid).first()
    if not p:
        raise HTTPException(404, "Path not found")
    for k in ["title", "tagline", "description", "icon", "color", "order"]:
        if k in data and data[k] is not None:
            setattr(p, k, data[k])
    db.commit()
    db.refresh(p)
    return {"id": p.id, "path_key": p.path_key, "title": p.title}


@app.delete("/api/admin/paths/{pid}")
def admin_delete_path(pid: int, db: Session = Depends(get_db),
                      _: models.User = Depends(get_current_admin)):
    p = db.query(models.LearningPath).filter_by(id=pid).first()
    if not p:
        raise HTTPException(404, "Path not found")
    db.delete(p)
    db.commit()
    return {"detail": "deleted"}


@app.put("/api/admin/topics/{tid}")
def admin_update_topic(tid: int, data: dict, db: Session = Depends(get_db),
                       _: models.User = Depends(get_current_admin)):
    t = db.query(models.Topic).filter_by(id=tid).first()
    if not t:
        raise HTTPException(404, "Topic not found")
    for k in ["title", "category", "difficulty", "order", "estimated_minutes", "icon", "description"]:
        if k in data and data[k] is not None:
            setattr(t, k, data[k])
    db.commit()
    db.refresh(t)
    return {"id": t.id, "topic_key": t.topic_key, "title": t.title}


@app.delete("/api/admin/topics/{tid}")
def admin_delete_topic(tid: int, db: Session = Depends(get_db),
                       _: models.User = Depends(get_current_admin)):
    t = db.query(models.Topic).filter_by(id=tid).first()
    if not t:
        raise HTTPException(404, "Topic not found")
    db.delete(t)
    db.commit()
    return {"detail": "deleted"}


# ---------- ASSIGNMENTS (user) ----------
@app.get("/api/assignments/{topic_id}")
def get_assignment(topic_id: int, db: Session = Depends(get_db),
                   current: models.User = Depends(get_current_user)):
    """Return the assignment questions for a topic (20 MCQ + 5 coding)."""
    mcqs = db.query(models.AssignmentQuestion).filter_by(
        topic_id=topic_id, type="mcq").order_by(models.AssignmentQuestion.order).limit(20).all()
    coding = db.query(models.AssignmentQuestion).filter_by(
        topic_id=topic_id, type="coding").order_by(models.AssignmentQuestion.order).limit(5).all()

    def fmt(q):
        try:
            opts = json.loads(q.options) if q.options else []
        except Exception:
            opts = []
        try:
            hnts = json.loads(q.hints) if q.hints else []
        except Exception:
            hnts = []
        return {
            "id": q.id, "type": q.type, "title": q.title,
            "description": q.description, "difficulty": q.difficulty,
            "options": opts,
            "hints": hnts,
            "starter_code_python": q.starter_code_python,
            "starter_code_java": q.starter_code_java,
            "starter_code_js": q.starter_code_js,
            "order": q.order
        }

    # Previous submission if any
    prev = db.query(models.AssignmentSubmission).filter_by(
        user_id=current.id, topic_id=topic_id).order_by(
        models.AssignmentSubmission.submitted_at.desc()).first()

    return {
        "topic_id": topic_id,
        "mcq_questions": [fmt(q) for q in mcqs],
        "coding_questions": [fmt(q) for q in coding],
        "mcq_target": 20, "coding_target": 5,
        "mcq_available": len(mcqs), "coding_available": len(coding),
        "previous_submission": {
            "overall_score": prev.overall_score,
            "mcq_score": prev.mcq_score,
            "coding_passed": prev.coding_passed,
            "status": prev.status,
            "submitted_at": str(prev.submitted_at)
        } if prev else None
    }


@app.post("/api/assignments/{qid}/run")
def run_assignment_code(qid: int, data: schemas.CodeRunRequest, db: Session = Depends(get_db),
                        current: models.User = Depends(get_current_user)):
    """Run/evaluate an assignment coding question against its test cases."""
    q = db.query(models.AssignmentQuestion).filter_by(id=qid).first()
    if not q:
        return execute_code_single_run(data.language, data.code, data.custom_input or "")
    try:
        tcs = json.loads(q.test_cases) if q.test_cases else []
    except Exception:
        tcs = []
    if tcs:
        return evaluate_test_cases(data.language, data.code, tcs)
    return execute_code_single_run(data.language, data.code, data.custom_input or "")


@app.post("/api/assignments/submit")
def submit_assignment(data: schemas.AssignmentSubmitRequest, db: Session = Depends(get_db),
                      current: models.User = Depends(get_current_user)):
    """Score MCQ answers and record coding results."""
    mcqs = db.query(models.AssignmentQuestion).filter_by(
        topic_id=data.topic_id, type="mcq").all()
    coding_qs = db.query(models.AssignmentQuestion).filter_by(
        topic_id=data.topic_id, type="coding").all()

    # Score MCQs
    correct = 0
    for q in mcqs:
        user_ans = data.mcq_answers.get(str(q.id), "").strip().lower()
        if user_ans == (q.correct_answer or "").strip().lower():
            correct += 1
    mcq_total = len(mcqs)
    mcq_pct = (correct / mcq_total * 100) if mcq_total else 0

    # Coding results (passed/failed sent from frontend after execution)
    coding_passed = sum(
        1 for q in coding_qs
        if data.coding_results.get(str(q.id), "") == "passed"
    )
    coding_total = len(coding_qs)

    # Overall score (MCQ 60% weight, coding 40%)
    coding_pct = (coding_passed / coding_total * 100) if coding_total else 0
    overall = (mcq_pct * 0.6 + coding_pct * 0.4) if coding_total else mcq_pct
    status = "passed" if overall >= 60 else "failed"

    sub = models.AssignmentSubmission(
        user_id=current.id, topic_id=data.topic_id,
        mcq_answers=json.dumps(data.mcq_answers),
        mcq_score=round(mcq_pct, 2), mcq_correct=correct, mcq_total=mcq_total,
        coding_submissions=json.dumps(data.coding_results),
        coding_passed=coding_passed, coding_total=coding_total,
        overall_score=round(overall, 2), status=status
    )
    db.add(sub)
    db.commit()

    return {
        "status": status, "overall_score": round(overall, 2),
        "mcq_score": round(mcq_pct, 2), "mcq_correct": correct, "mcq_total": mcq_total,
        "coding_passed": coding_passed, "coding_total": coding_total,
        "passed": status == "passed"
    }


# ---------- ASSIGNMENTS (admin) ----------
@app.get("/api/admin/assignments/{topic_id}")
def admin_get_assignment_questions(topic_id: int, db: Session = Depends(get_db),
                                    _: models.User = Depends(get_current_admin)):
    qs = db.query(models.AssignmentQuestion).filter_by(topic_id=topic_id)\
        .order_by(models.AssignmentQuestion.type, models.AssignmentQuestion.order).all()
    return [{
        "id": q.id, "type": q.type, "title": q.title, "description": q.description,
        "difficulty": q.difficulty, "options": q.options, "correct_answer": q.correct_answer,
        "explanation": q.explanation, "starter_code_python": q.starter_code_python,
        "test_cases": q.test_cases, "hints": q.hints, "order": q.order
    } for q in qs]


@app.post("/api/admin/assignments")
def admin_create_assignment_question(data: schemas.AssignmentQuestionCreate,
                                      db: Session = Depends(get_db),
                                      _: models.User = Depends(get_current_admin)):
    if not data.topic_id or data.topic_id <= 0:
        raise HTTPException(400, "Please select a valid topic")
    topic = db.query(models.Topic).filter_by(id=data.topic_id).first()
    if not topic:
        raise HTTPException(404, "Selected topic not found")

    # Enforce limits: 20 MCQ, 5 coding per topic
    count = db.query(models.AssignmentQuestion).filter_by(
        topic_id=data.topic_id, type=data.type).count()
    limit = 20 if data.type == "mcq" else 5
    if count >= limit:
        raise HTTPException(400, f"Assignment already has {limit} {data.type} questions (limit reached)")

    q = models.AssignmentQuestion(**data.model_dump())
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"id": q.id, "title": q.title, "type": q.type}


@app.delete("/api/admin/assignments/{qid}")
def admin_delete_assignment_question(qid: int, db: Session = Depends(get_db),
                                      _: models.User = Depends(get_current_admin)):
    q = db.query(models.AssignmentQuestion).filter_by(id=qid).first()
    if not q:
        raise HTTPException(404, "Question not found")
    db.delete(q)
    db.commit()
    return {"detail": "deleted"}


@app.get("/api/admin/assignments/stats/overview")
def admin_assignment_stats(db: Session = Depends(get_db),
                            _: models.User = Depends(get_current_admin)):
    """How many topics have complete assignments."""
    from sqlalchemy import func
    topics = db.query(models.Topic).all()
    result = []
    for t in topics:
        mcq_count = db.query(models.AssignmentQuestion).filter_by(topic_id=t.id, type="mcq").count()
        coding_count = db.query(models.AssignmentQuestion).filter_by(topic_id=t.id, type="coding").count()
        subs = db.query(models.AssignmentSubmission).filter_by(topic_id=t.id).count()
        result.append({
            "topic_id": t.id, "topic": t.title,
            "mcq": mcq_count, "coding": coding_count,
            "complete": mcq_count >= 20 and coding_count >= 5,
            "submissions": subs
        })
    return result


# ---------- MISC ----------
@app.get("/api/company-tracks")
def company_tracks(current: models.User = Depends(get_current_user)):
    return [
        {"company": "Amazon", "icon": "shopping-cart", "difficulty": "Hard",
         "focus": ["Arrays", "Trees", "DP"], "rounds": ["Online", "DSA", "LP", "HR"]},
        {"company": "Google", "icon": "search", "difficulty": "Hard",
         "focus": ["Graphs", "DP", "System Design"], "rounds": ["Online", "DSA x3", "Design"]},
        {"company": "TCS Digital", "icon": "building", "difficulty": "Medium",
         "focus": ["Aptitude", "Basic DSA", "SQL"], "rounds": ["Aptitude", "Coding", "HR"]},
    ]


@app.get("/api/interview/simulate")
def mock_interview(role: str = "SDE-1", round_type: str = "dsa",
                   current: models.User = Depends(get_current_user)):
    return {"role": role, "round_type": round_type,
            "questions": ["Explain time complexity of hashmap lookup.",
                          "How would you detect a cycle in a linked list?",
                          "Design a URL shortener."]}
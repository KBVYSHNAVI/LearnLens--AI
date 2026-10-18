from sqlalchemy.orm import Session
from app.models import User, UserTopicProgress


def compute_readiness_score(user: User, db: Session) -> float:
    total = db.query(UserTopicProgress).filter(UserTopicProgress.user_id == user.id).all()
    if not total:
        return 45.0
    completed = sum(1 for p in total if p.status == "completed")
    avg_score = sum(p.score for p in total) / len(total)
    return round(min(100.0, (completed / max(len(total), 1) * 50) + avg_score * 0.5), 2)


def recommend_next_topic(user: User, db: Session, all_topics: list) -> dict:
    progress_map = {p.topic_id: p for p in
                    db.query(UserTopicProgress).filter(UserTopicProgress.user_id == user.id).all()}

    needs_revision = [t for t in all_topics
                      if progress_map.get(t.id) and progress_map[t.id].status == "needs_revision"]
    if needs_revision:
        t = needs_revision[0]
        return {"topic_id": t.id, "topic_key": t.topic_key, "title": t.title,
                "reason": "Needs revision - score below threshold"}

    not_started = [t for t in all_topics if t.id not in progress_map]
    if not_started:
        t = not_started[0]
        return {"topic_id": t.id, "topic_key": t.topic_key, "title": t.title,
                "reason": "Next unstarted topic in your path"}
    return None
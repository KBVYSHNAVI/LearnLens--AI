from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import User, UserBadge, Submission
from app.config import settings


def _award_if_new(db: Session, user: User, badge_key: str, title: str, description: str,
                   icon: str = "award", tier: str = "bronze"):
    existing = db.query(UserBadge).filter(
        UserBadge.user_id == user.id,
        UserBadge.badge_key == badge_key
    ).first()
    if existing:
        return None
    badge = UserBadge(user_id=user.id, badge_key=badge_key, title=title,
                       description=description, icon=icon, tier=tier)
    db.add(badge)
    return badge


def _tier_for(milestone: int, milestones: list) -> str:
    idx = milestones.index(milestone) if milestone in milestones else 0
    tiers = ["bronze", "silver", "gold", "platinum", "diamond", "legend", "mythic"]
    return tiers[min(idx, len(tiers) - 1)]


def award_points_for_submission(db: Session, user: User, difficulty: str, all_passed: bool) -> int:
    if not all_passed:
        return 0
    pts = settings.POINTS_BY_DIFFICULTY.get(difficulty, 10)
    user.points = (user.points or 0) + pts
    return pts


def award_points_for_quiz(db: Session, user: User, score_pct: float) -> int:
    pts = int(10 + (score_pct / 10))
    user.points = (user.points or 0) + pts
    return pts


def check_and_award_badges(db: Session, user: User) -> list:
    new_badges = []

    # Streak badges (every 50 days)
    for ms in settings.STREAK_BADGE_MILESTONES:
        if user.streak_count >= ms:
            b = _award_if_new(db, user,
                               badge_key=f"streak_{ms}",
                               title=f"{ms}-Day Streak",
                               description=f"Maintained a {ms}-day learning streak!",
                               icon="flame",
                               tier=_tier_for(ms, settings.STREAK_BADGE_MILESTONES))
            if b:
                new_badges.append(b)

    # Question count badges
    total_solved = (
        db.query(func.count(Submission.id))
        .filter(Submission.user_id == user.id, Submission.status == "Passed")
        .scalar() or 0
    )
    for ms in settings.QUESTION_BADGE_MILESTONES:
        if total_solved >= ms:
            b = _award_if_new(db, user,
                               badge_key=f"questions_{ms}",
                               title=f"{ms} Questions Solved",
                               description=f"Successfully solved {ms} coding questions.",
                               icon="check",
                               tier=_tier_for(ms, settings.QUESTION_BADGE_MILESTONES))
            if b:
                new_badges.append(b)

    # Points badges
    for ms in [100, 500, 1000, 2500, 5000]:
        if (user.points or 0) >= ms:
            b = _award_if_new(db, user,
                               badge_key=f"points_{ms}",
                               title=f"{ms} Point Milestone",
                               description=f"Earned a total of {ms} points.",
                               icon="star",
                               tier="silver" if ms >= 500 else "bronze")
            if b:
                new_badges.append(b)

    # First question
    if total_solved >= 1:
        b = _award_if_new(db, user, "first_steps", "First Steps",
                           "Solved your very first question!", icon="rocket", tier="bronze")
        if b:
            new_badges.append(b)

    if new_badges:
        db.commit()
        for nb in new_badges:
            db.refresh(nb)
    return new_badges
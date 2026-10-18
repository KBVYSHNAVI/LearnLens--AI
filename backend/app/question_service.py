from sqlalchemy.orm import Session
from app.models import Question
import json


def format_question(q: Question) -> dict:
    def parse(field, default):
        try:
            return json.loads(field) if field else default
        except Exception:
            return default

    return {
        "id": q.id, "topic_id": q.topic_id, "question_uid": q.question_uid,
        "title": q.title, "difficulty": q.difficulty, "type": q.type,
        "description": q.description,
        "options": parse(q.options, []),
        "correct_answer": q.correct_answer,
        "explanation": q.explanation,
        "hints": parse(q.hints, []),
        "starter_code_python": q.starter_code_python,
        "starter_code_java": q.starter_code_java,
        "starter_code_js": q.starter_code_js,
        "reference_solution_python": q.reference_solution_python,
        "reference_solution_java": q.reference_solution_java,
        "test_cases": parse(q.test_cases, []),
        "verified": q.verified,
        "tags": parse(q.tags, []),
        "company_tags": parse(q.company_tags, []),
    }


def list_questions(db: Session, topic_id: int, q_type=None, difficulty=None, search=None):
    q = db.query(Question).filter(Question.topic_id == topic_id)
    if q_type:
        q = q.filter(Question.type == q_type)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)
    if search:
        q = q.filter(Question.title.ilike(f"%{search}%"))
    return [format_question(x) for x in q.all()]
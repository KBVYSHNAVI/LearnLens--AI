from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    degree: Optional[str] = "B.Tech"
    branch: Optional[str] = "Computer Science & Engineering"
    graduation_year: Optional[int] = 2026
    target_companies: Optional[str] = ""
    preferred_language: Optional[str] = "python"
    learning_goals: Optional[str] = ""
    streak_count: Optional[int] = 0
    readiness_score: Optional[float] = 0.0
    points: Optional[int] = 0
    created_at: datetime
    class Config:
        from_attributes = True


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    degree: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    target_companies: Optional[str] = None
    preferred_language: Optional[str] = None
    learning_goals: Optional[str] = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class CodeRunRequest(BaseModel):
    language: str
    code: str
    custom_input: Optional[str] = ""


class CodeSubmitRequest(BaseModel):
    question_id: int
    language: str
    code: str


class QuizSubmitRequest(BaseModel):
    topic_id: int
    answers: Dict[str, str]


class AITutorRequest(BaseModel):
    action: str = "explain_concept"
    topic_id: Optional[int] = None
    question_id: Optional[int] = None
    prompt: Optional[str] = ""
    code_context: Optional[str] = ""
    language: Optional[str] = "python"
    error_context: Optional[str] = ""
    preferred_language_mode: Optional[str] = "english"
    hint_level: Optional[int] = 1


class CommunicationCoachRequest(BaseModel):
    mode: str = "interview"          # interview | debate | group_discussion
    topic: str = "Data Structures"
    user_message: str
    history: List[Dict[str, str]] = []   # [{"role": "user"|"assistant", "content": "..."}]
    role: Optional[str] = "SDE-1"
    preferred_language: Optional[str] = "english"


class BadgeOut(BaseModel):
    id: int
    badge_key: str
    title: str
    description: str
    icon: str
    tier: str
    awarded_at: datetime
    class Config:
        from_attributes = True


class BadgesResponse(BaseModel):
    total_points: int
    streak_days: int
    badges: List[BadgeOut]
    next_streak_milestone: Optional[int] = None
    days_to_next_badge: Optional[int] = None
    total_badges_available: int


# ── Admin schemas ─────────────────────────────────────────────────────────────
class AdminLogin(BaseModel):
    email: str
    password: str


class AdminChangePassword(BaseModel):
    current_password: str
    new_password: str


class QuestionCreate(BaseModel):
    topic_id: int
    question_uid: str
    title: str
    difficulty: str = "Easy"          # Easy | Medium | Hard
    type: str = "mcq"                 # mcq | coding
    description: str
    options: Optional[str] = "[]"     # JSON string for MCQ
    correct_answer: Optional[str] = ""
    explanation: Optional[str] = ""
    hints: Optional[str] = "[]"
    starter_code_python: Optional[str] = ""
    starter_code_java: Optional[str] = ""
    starter_code_js: Optional[str] = ""
    reference_solution_python: Optional[str] = ""
    test_cases: Optional[str] = "[]"  # JSON string
    tags: Optional[str] = "[]"
    company_tags: Optional[str] = "[]"


class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[str] = None
    description: Optional[str] = None
    options: Optional[str] = None
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    hints: Optional[str] = None
    starter_code_python: Optional[str] = None
    starter_code_java: Optional[str] = None
    starter_code_js: Optional[str] = None
    reference_solution_python: Optional[str] = None
    test_cases: Optional[str] = None
    tags: Optional[str] = None
    company_tags: Optional[str] = None
    verified: Optional[bool] = None


class QuestionOut(BaseModel):
    id: int
    topic_id: int
    question_uid: str
    title: str
    difficulty: str
    type: str
    description: str
    options: str
    correct_answer: str
    explanation: str
    hints: str
    starter_code_python: str
    starter_code_java: str
    starter_code_js: str
    reference_solution_python: str
    test_cases: str
    tags: str
    company_tags: str
    verified: bool
    class Config:
        from_attributes = True


class TopicOut(BaseModel):
    id: int
    path_key: str
    topic_key: str
    title: str
    class Config:
        from_attributes = True


# ── Assignment schemas ────────────────────────────────────────────────────────
class AssignmentQuestionCreate(BaseModel):
    topic_id: int
    type: str = "mcq"                    # mcq | coding
    title: str
    description: str
    difficulty: str = "Easy"
    options: Optional[str] = "[]"
    correct_answer: Optional[str] = ""
    explanation: Optional[str] = ""
    starter_code_python: Optional[str] = ""
    starter_code_java: Optional[str] = ""
    starter_code_js: Optional[str] = ""
    reference_solution_python: Optional[str] = ""
    test_cases: Optional[str] = "[]"
    hints: Optional[str] = "[]"
    order: Optional[int] = 1


class AssignmentSubmitRequest(BaseModel):
    topic_id: int
    mcq_answers: Dict[str, str] = {}     # {str(question_id): answer}
    coding_results: Dict[str, str] = {}  # {str(question_id): "passed"|"failed"}

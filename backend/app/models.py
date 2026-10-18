from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    degree = Column(String(50), default="B.Tech")
    branch = Column(String(100), default="Computer Science & Engineering")
    graduation_year = Column(Integer, default=2026)
    target_companies = Column(String(255), default="Amazon, Google, Microsoft, TCS Digital")
    preferred_language = Column(String(50), default="python")
    learning_goals = Column(Text, default="Crack Top Tier Tech Company SDE-1 placement")
    streak_count = Column(Integer, default=1)
    readiness_score = Column(Float, default=45.0)
    points = Column(Integer, default=0)
    is_admin = Column(Boolean, default=False)
    token_version = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    submissions = relationship("Submission", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    topic_progress = relationship("UserTopicProgress", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("StudyActivity", back_populates="user", cascade="all, delete-orphan")
    badges = relationship("UserBadge", back_populates="user", cascade="all, delete-orphan")


class LearningPath(Base):
    __tablename__ = "learning_paths"
    id = Column(Integer, primary_key=True, index=True)
    path_key = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    tagline = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(50), default="code")
    color = Column(String(50), default="blue")
    order = Column(Integer, default=1)
    resource_links = Column(Text, default="[]")  # JSON: [{label, url}]
    topics = relationship("Topic", back_populates="learning_path", cascade="all, delete-orphan")


class Topic(Base):
    __tablename__ = "topics"
    id = Column(Integer, primary_key=True, index=True)
    path_key = Column(String(50), ForeignKey("learning_paths.path_key"), nullable=False)
    topic_key = Column(String(80), unique=True, index=True, nullable=False)
    title = Column(String(100), nullable=False)
    category = Column(String(100), default="Core")
    difficulty = Column(String(20), default="Medium")
    order = Column(Integer, default=1)
    verified_question_count = Column(Integer, default=0)
    target_question_count = Column(Integer, default=500)
    estimated_minutes = Column(Integer, default=60)
    icon = Column(String(50), default="book")
    description = Column(Text, default="")
    learning_path = relationship("LearningPath", back_populates="topics")
    content = relationship("TopicContent", back_populates="topic", uselist=False, cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="topic", cascade="all, delete-orphan")
    user_progress = relationship("UserTopicProgress", back_populates="topic", cascade="all, delete-orphan")


class TopicContent(Base):
    __tablename__ = "topic_contents"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), unique=True, nullable=False)
    intro_what = Column(Text, nullable=False)
    intro_why = Column(Text, nullable=False)
    real_world_apps = Column(Text, default="[]")
    placement_importance = Column(Text, nullable=False)
    learning_objectives = Column(Text, default="[]")
    prerequisites = Column(Text, default="[]")
    concept_explanation = Column(Text, nullable=False)
    dry_run_guide = Column(Text, default="")
    code_examples = Column(Text, default="{}")
    time_space_complexity = Column(Text, default="{}")
    topic = relationship("Topic", back_populates="content")


class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    question_uid = Column(String(80), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    difficulty = Column(String(20), default="Easy")
    type = Column(String(40), default="mcq")
    description = Column(Text, nullable=False)
    options = Column(Text, default="[]")
    correct_answer = Column(Text, default="")
    explanation = Column(Text, default="")
    hints = Column(Text, default="[]")
    starter_code_python = Column(Text, default="")
    starter_code_java = Column(Text, default="")
    starter_code_js = Column(Text, default="")
    reference_solution_python = Column(Text, default="")
    reference_solution_java = Column(Text, default="")
    test_cases = Column(Text, default="[]")
    verified = Column(Boolean, default=True)
    tags = Column(Text, default="[]")
    company_tags = Column(Text, default="[]")
    topic = relationship("Topic", back_populates="questions")
    submissions = relationship("Submission", back_populates="question")


class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    language = Column(String(30), default="python")
    code = Column(Text, nullable=False)
    status = Column(String(30), default="Passed")
    passed_test_cases = Column(Integer, default=0)
    total_test_cases = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    feedback = Column(Text, default="")
    points_awarded = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="submissions")
    question = relationship("Question", back_populates="submissions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    score = Column(Float, default=0.0)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    answers_json = Column(Text, default="{}")
    points_awarded = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="quiz_attempts")


class UserTopicProgress(Base):
    __tablename__ = "user_topic_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    status = Column(String(30), default="not_started")
    score = Column(Float, default=0.0)
    questions_solved = Column(Integer, default=0)
    time_spent_mins = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="topic_progress")
    topic = relationship("Topic", back_populates="user_progress")


class StudyActivity(Base):
    __tablename__ = "study_activities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String(20), nullable=False)
    minutes = Column(Integer, default=0)
    questions_solved = Column(Integer, default=0)
    quizzes_taken = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    user = relationship("User", back_populates="activities")


class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_key = Column(String(50), nullable=False)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    icon = Column(String(50), default="award")
    tier = Column(String(20), default="bronze")
    awarded_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="badges")


# ── Assignments ───────────────────────────────────────────────────────────────
class AssignmentQuestion(Base):
    """A question that is part of a topic's assignment (20 MCQ + 5 coding)."""
    __tablename__ = "assignment_questions"
    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    type = Column(String(20), default="mcq")          # mcq | coding
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    difficulty = Column(String(20), default="Easy")
    options = Column(Text, default="[]")              # JSON array for MCQ
    correct_answer = Column(Text, default="")
    explanation = Column(Text, default="")
    starter_code_python = Column(Text, default="")
    starter_code_java = Column(Text, default="")
    starter_code_js = Column(Text, default="")
    reference_solution_python = Column(Text, default="")
    test_cases = Column(Text, default="[]")           # JSON for coding
    hints = Column(Text, default="[]")
    order = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)


class AssignmentSubmission(Base):
    """User's submission for an assignment."""
    __tablename__ = "assignment_submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    mcq_answers = Column(Text, default="{}")          # JSON {question_id: answer}
    mcq_score = Column(Float, default=0.0)            # percentage
    mcq_correct = Column(Integer, default=0)
    mcq_total = Column(Integer, default=0)
    coding_submissions = Column(Text, default="{}")   # JSON {question_id: {code, status}}
    coding_passed = Column(Integer, default=0)
    coding_total = Column(Integer, default=0)
    overall_score = Column(Float, default=0.0)        # percentage
    status = Column(String(30), default="pending")    # pending | submitted | passed | failed
    submitted_at = Column(DateTime, default=datetime.utcnow)
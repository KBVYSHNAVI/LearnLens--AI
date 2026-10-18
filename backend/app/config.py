import os

class Settings:
    PROJECT_NAME: str = "LearnLens AI"
    VERSION: str = "1.1.0"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "learnlens-ai-jwt-secret-key-production-grade-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./learnlens.db")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    EXECUTION_TIMEOUT_SECONDS: int = 6
    MAX_CODE_SIZE_BYTES: int = 64 * 1024
    THRESHOLD_REVISION: float = 60.0
    THRESHOLD_MASTERY: float = 85.0
    # Admin credentials (override via env vars in production)
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@learnlens.ai")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "LearnLens@Admin2026")
    POINTS_BY_DIFFICULTY = {"Easy": 10, "Medium": 20, "Hard": 30}
    STREAK_BADGE_MILESTONES = [50, 100, 150, 200, 250, 300, 365]
    QUESTION_BADGE_MILESTONES = [10, 25, 50, 100, 200]

settings = Settings()
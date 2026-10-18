export interface User {
  id: number; email: string; name: string; degree: string; branch: string;
  graduation_year: number; target_companies: string; preferred_language: string;
  learning_goals: string; streak_count: number; readiness_score: number;
  points: number; created_at: string;
}

export interface AuthResponse { access_token: string; token_type: string; user: User; }

export interface Badge {
  id: number; badge_key: string; title: string; description: string;
  icon: string; tier: string; awarded_at: string;
}

export interface BadgesResponse {
  total_points: number; streak_days: number; badges: Badge[];
  next_streak_milestone: number | null; days_to_next_badge: number | null;
  total_badges_available: number;
}

export interface TopicContent {
  intro_what: string; intro_why: string; real_world_apps: string[];
  placement_importance: string; learning_objectives: string[]; prerequisites: string[];
  concept_explanation: string; dry_run_guide?: string;
  code_examples: Record<string, string>; time_space_complexity: Record<string, any>;
}

export interface Topic {
  id: number; path_key: string; topic_key: string; title: string;
  category: string; difficulty: string; order: number;
  verified_question_count: number; target_question_count: number;
  estimated_minutes: number; icon: string;
  status: 'not_started' | 'in_progress' | 'needs_revision' | 'completed';
  score?: number; content?: TopicContent;
}

export interface LearningPath {
  id: number; path_key: string; title: string; tagline: string; description: string;
  icon: string; color: string; order: number; topics: Topic[];
}

export interface TestCase { input: string; expected: string; hidden?: boolean; }

export interface Question {
  id: number; topic_id: number; question_uid: string; title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'mcq' | 'output_prediction' | 'debugging' | 'easy_coding' | 'medium_coding' | 'hard_coding' | 'placement_challenge';
  description: string; options?: string[]; correct_answer?: string; explanation?: string;
  hints?: string[]; starter_code_python?: string; starter_code_java?: string;
  starter_code_js?: string; reference_solution_python?: string;
  reference_solution_java?: string; test_cases?: TestCase[]; verified: boolean;
  tags?: string[]; company_tags?: string[];
}

export interface TestResult {
  test_case_number: number; passed: boolean; input: string; expected_output: string;
  actual_output: string; error?: string; execution_time_ms: number; is_hidden: boolean;
}

export interface CodeSubmitResult {
  status: string; passed_count: number; total_count: number; execution_time_ms: number;
  test_results: TestResult[]; feedback: string;
  points_awarded?: number; total_points?: number;
  new_badges?: { title: string; icon: string; tier: string }[];
}

export interface QuizResultOut {
  score_percentage: number; correct_count: number; total_count: number; status: string;
  feedback: string; results: any[]; weak_concepts: string[];
  points_awarded?: number; new_badges?: { title: string; icon: string; tier: string }[];
}

export interface DashboardStats {
  welcome_message: string; user_name: string; streak_days: number;
  readiness_score: number; total_questions_solved: number;
  total_lessons_completed: number; quiz_average_accuracy: number;
  coding_accuracy: number;
  category_progress: { category: string; completed_topics: number; total_topics: number; percentage: number; }[];
  weak_topics: string[];
  recent_activity: { date: string; minutes: number; questions_solved: number; }[];
  recommended_topic: (Topic & { reason?: string }) | null;
  daily_plan: string[];
  total_points: number; badges_earned: number;
}
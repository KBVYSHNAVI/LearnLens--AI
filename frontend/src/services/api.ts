import {
  AuthResponse, User, LearningPath, Topic, Question,
  CodeSubmitResult, QuizResultOut, DashboardStats, BadgesResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('learnlens_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };
  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) {
    let msg = 'Error';
    try {
      const d = await response.json();
      msg = d.detail || JSON.stringify(d);
    } catch {
      msg = `Status ${response.status}`;
    }
    throw new Error(msg);
  }
  return response.json();
}

export const api = {
  register: (d: any) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
  login: (d: any) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(d) }),
  getMe: () => request<User>('/auth/me'),
  updateProfile: (u: Partial<User>) =>
    request<User>('/auth/profile', { method: 'PUT', body: JSON.stringify(u) }),

  getPaths: () => request<LearningPath[]>('/paths'),
  getTopicDetail: (k: string) => request<Topic>(`/topics/${k}`),
  getTopicQuestions: (tid: number, f?: any) => {
    const p = new URLSearchParams();
    if (f?.q_type) p.append('q_type', f.q_type);
    if (f?.difficulty) p.append('difficulty', f.difficulty);
    if (f?.search) p.append('search', f.search);
    return request<Question[]>(`/topics/${tid}/questions${p.toString() ? '?' + p : ''}`);
  },
  getQuestionDetail: (id: number) => request<Question>(`/questions/${id}`),
  runCode: (id: number, lang: string, code: string, inp?: string) =>
    request(`/questions/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ language: lang, code, custom_input: inp || '' })
    }),
  submitCode: (id: number, lang: string, code: string) =>
    request<CodeSubmitResult>(`/questions/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ question_id: id, language: lang, code })
    }),

  getTopicQuiz: (id: number) => request<any[]>(`/quizzes/${id}`),
  submitQuiz: (id: number, answers: Record<string, string>) =>
    request<QuizResultOut>(`/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ topic_id: id, answers })
    }),

  askAITutor: (payload: any) =>
    request<any>('/ai/tutor', { method: 'POST', body: JSON.stringify(payload) }),
  askCommunicationCoach: (payload: any) =>
    request<any>('/ai/coach', { method: 'POST', body: JSON.stringify(payload) }),
  getDashboardStats: () => request<DashboardStats>('/dashboard/stats'),
  getBadges: () => request<BadgesResponse>('/badges'),
  getLeaderboard: () => request<any[]>('/leaderboard'),

  getMockInterview: (role?: string, rt?: string) => {
    const p = new URLSearchParams();
    if (role) p.append('role', role);
    if (rt) p.append('round_type', rt);
    return request<any>(`/interview/simulate?${p}`);
  },
  getCompanyTracks: () => request<any[]>('/company-tracks'),

  // ── Admin ────────────────────────────────────────────────────────────────
  adminLogin: (email: string, password: string) =>
    request<any>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  adminChangePassword: (current_password: string, new_password: string) =>
    request<any>('/admin/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),
  adminGetTopics: () => request<any[]>('/admin/topics'),
  adminGetQuestions: (topicId?: number) =>
    request<any[]>(`/admin/questions${topicId ? '?topic_id=' + topicId : ''}`),
  adminCreateQuestion: (data: any) =>
    request<any>('/admin/questions', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateQuestion: (id: number, data: any) =>
    request<any>(`/admin/questions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteQuestion: (id: number) =>
    request<any>(`/admin/questions/${id}`, { method: 'DELETE' }),
  adminGetUsers: () => request<any[]>('/admin/users'),
  adminGetAnalytics: () => request<any>('/admin/analytics'),
  adminGetPaths: () => request<any[]>('/admin/paths'),
  adminCreatePath: (data: any) =>
    request<any>('/admin/paths', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdatePathResources: (id: number, resource_links: any[]) =>
    request<any>(`/admin/paths/${id}/resources`, { method: 'PUT', body: JSON.stringify({ resource_links }) }),
  adminCreateTopic: (data: any) =>
    request<any>('/admin/topics', { method: 'POST', body: JSON.stringify(data) }),
  adminDeleteTopic: (id: number) =>
    request<any>(`/admin/topics/${id}`, { method: 'DELETE' }),

  // ── Assignments (user) ───────────────────────────────────────────────────
  getAssignment: (topicId: number) => request<any>(`/assignments/${topicId}`),
  runAssignmentCode: (qid: number, lang: string, code: string, inp?: string) =>
    request<any>(`/assignments/${qid}/run`, {
      method: 'POST',
      body: JSON.stringify({ language: lang, code, custom_input: inp || '' })
    }),
  submitAssignment: (data: any) =>
    request<any>('/assignments/submit', { method: 'POST', body: JSON.stringify(data) }),

  // ── Assignments (admin) ──────────────────────────────────────────────────
  adminGetAssignment: (topicId: number) => request<any[]>(`/admin/assignments/${topicId}`),
  adminCreateAssignmentQ: (data: any) =>
    request<any>('/admin/assignments', { method: 'POST', body: JSON.stringify(data) }),
  adminDeleteAssignmentQ: (id: number) =>
    request<any>(`/admin/assignments/${id}`, { method: 'DELETE' }),
  adminGetAssignmentStats: () => request<any[]>('/admin/assignments/stats/overview'),};
import {
  AuthResponse, User, LearningPath, Topic, Question,
  CodeSubmitResult, QuizResultOut, DashboardStats, BadgesResponse
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8001/api';

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('learnlens_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

import { mockPaths, mockTopicDetail, mockQuestions, mockDashboard, mockBadges } from './mockData';

function handleOfflineFallback(endpoint: string, options: RequestInit = {}): any {
  console.info(`[LearnLens Demo Mode] Falling back to offline data for: ${endpoint}`);

  if (endpoint.startsWith('/admin/login')) {
    let body: any = {};
    try { body = JSON.parse((options.body as string) || '{}'); } catch {}
    if ((body.email || '').trim().toLowerCase() !== 'admin@learnlens.ai') {
      throw new Error('Invalid admin credentials');
    }
    const adminUser: User = {
      id: 999,
      email: 'admin@learnlens.ai',
      name: 'Admin',
      degree: 'N/A',
      branch: 'Administration',
      graduation_year: 2026,
      target_companies: 'LearnLens Admin',
      preferred_language: 'python',
      learning_goals: 'Administer LearnLens platform',
      streak_count: 0,
      readiness_score: 100,
      points: 9999,
      created_at: new Date().toISOString()
    };
    return {
      access_token: 'demo-admin-token',
      token_type: 'bearer',
      user: adminUser
    };
  }

  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    let body: any = {};
    try { body = JSON.parse((options.body as string) || '{}'); } catch {}
    const email = body.email || 'learner@learnlens.ai';
    const name = body.name || email.split('@')[0] || 'Learner';
    const user: User = {
      id: 1,
      email,
      name,
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduation_year: 2026,
      target_companies: 'Amazon, Google, Microsoft, TCS Digital',
      preferred_language: 'python',
      learning_goals: 'Crack Top Tier Tech Company SDE-1 placement',
      streak_count: 5,
      readiness_score: 72.5,
      points: 180,
      created_at: new Date().toISOString()
    };
    localStorage.setItem('learnlens_offline_user', JSON.stringify(user));
    return {
      access_token: 'demo-offline-jwt-token',
      token_type: 'bearer',
      user
    };
  }

  if (endpoint === '/auth/me') {
    const saved = localStorage.getItem('learnlens_offline_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: 1,
      email: 'demo@learnlens.ai',
      name: 'Placement Aspirant',
      degree: 'B.Tech',
      branch: 'Computer Science & Engineering',
      graduation_year: 2026,
      target_companies: 'Amazon, Google, TCS',
      preferred_language: 'python',
      learning_goals: 'Crack SDE placement',
      streak_count: 5,
      readiness_score: 72.5,
      points: 180,
      created_at: new Date().toISOString()
    };
  }

  if (endpoint.startsWith('/paths')) {
    return mockPaths;
  }

  if (endpoint.startsWith('/topics/')) {
    if (endpoint.includes('/questions')) {
      return mockQuestions;
    }
    return mockTopicDetail;
  }

  if (endpoint.startsWith('/questions/')) {
    if (endpoint.endsWith('/run')) {
      return {
        success: true,
        stdout: 'Program output (Demo Mode):\nCode executed successfully!\nResult: 9\n',
        stderr: '',
        error_type: null,
        execution_time_ms: 38.5,
        timed_out: false
      };
    }
    if (endpoint.endsWith('/submit')) {
      return {
        status: 'Passed',
        passed_count: 2,
        total_count: 2,
        execution_time_ms: 42.1,
        test_results: [
          { test_case_number: 1, passed: true, input: '3 7 2 9 5', expected_output: '9', actual_output: '9', is_hidden: false, execution_time_ms: 38 },
          { test_case_number: 2, passed: true, input: '[Hidden]', expected_output: '[Hidden]', actual_output: '-2', is_hidden: true, execution_time_ms: 46 }
        ],
        feedback: 'All 2 passed! (Demo Mode)',
        points_awarded: 10,
        total_points: 190,
        new_badges: []
      };
    }
    return mockQuestions[1];
  }

  if (endpoint.startsWith('/dashboard/stats')) {
    return mockDashboard;
  }

  if (endpoint.startsWith('/badges')) {
    return mockBadges;
  }

  if (endpoint.startsWith('/company-tracks')) {
    return [
      { company: 'Amazon', difficulty: 'Hard', focus: ['Arrays', 'Trees', 'DP'], rounds: ['Online Assessment', 'DSA Technical', 'Leadership Principles'] },
      { company: 'Google', difficulty: 'Hard', focus: ['Graphs', 'DP', 'System Design'], rounds: ['Online Coding', 'DSA x3', 'Googlyness'] },
      { company: 'TCS Digital', difficulty: 'Medium', focus: ['Aptitude', 'Basic DSA', 'SQL'], rounds: ['Aptitude', 'Advanced Coding', 'Technical HR'] }
    ];
  }

  if (endpoint.startsWith('/interview/simulate')) {
    return {
      role: 'SDE-1',
      round_type: 'dsa',
      questions: [
        'Explain the difference between an Array and a Linked List in terms of memory layout and access time.',
        'How would you detect a cycle in a singly linked list with O(1) space complexity?',
        'Describe how a Hash Table handles hash collisions.'
      ]
    };
  }

  if (endpoint.startsWith('/ai/tutor')) {
    return {
      reply: 'Hello! I am your LearnLens AI Placement Mentor (Demo Mode). Arrays use contiguous memory for O(1) access. Practice two pointers to solve subarray problems efficiently!',
      action_type: 'explain_concept',
      hint_level: 1,
      suggested_follow_ups: ['Explain Two Pointers', 'Show dry run for max element', 'What are common edge cases?'],
      is_offline_mode: true
    };
  }

  if (endpoint.startsWith('/ai/coach')) {
    return {
      reply: 'Thanks for sharing your answer! In an interview, it helps to state the time and space complexity upfront before writing the solution. Overall strong explanation!',
      mode: 'interview',
      is_offline: true
    };
  }

  if (endpoint.startsWith('/assignments/')) {
    if (endpoint.endsWith('/run')) {
      return {
        status: 'Passed',
        passed_count: 2,
        total_count: 2,
        feedback: 'All test cases passed! (Demo Mode)',
        execution_time_ms: 32
      };
    }
    if (endpoint.endsWith('/submit')) {
      return {
        status: 'passed',
        overall_score: 90,
        mcq_score: 100,
        mcq_correct: 1,
        mcq_total: 1,
        coding_passed: 1,
        coding_total: 1,
        passed: true
      };
    }
    return {
      topic_id: 1,
      mcq_questions: [mockQuestions[0]],
      coding_questions: [mockQuestions[1]],
      mcq_target: 20,
      coding_target: 5,
      mcq_available: 1,
      coding_available: 1,
      previous_submission: null
    };
  }

  if (endpoint.startsWith('/admin/analytics')) {
    return {
      totals: { users: 24, questions: 18, submissions: 85, quizzes: 32, pass_rate: 88.5, learning_paths: 2, topics: 4 },
      top_users: [
        { name: 'Aditya Rao', email: 'aditya@example.com', points: 340, streak: 12 },
        { name: 'Priya Sharma', email: 'priya@example.com', points: 290, streak: 9 },
        { name: 'Rahul Varma', email: 'rahul@example.com', points: 210, streak: 6 }
      ],
      hot_questions: [
        { title: 'Find Maximum Element', attempts: 45 },
        { title: 'Array Index Access Time Complexity', attempts: 38 }
      ],
      topic_stats: [
        { topic: 'Arrays & Two Pointers', completed: 15, questions: 2 },
        { topic: 'Linked Lists', completed: 8, questions: 0 },
        { topic: 'Trees & Traversals', completed: 4, questions: 0 }
      ]
    };
  }

  if (endpoint.startsWith('/admin/topics')) {
    return mockPaths.flatMap(p => p.topics);
  }

  if (endpoint.startsWith('/admin/questions')) {
    return mockQuestions;
  }

  if (endpoint.startsWith('/admin/paths')) {
    return mockPaths;
  }

  if (endpoint.startsWith('/admin/users')) {
    return [
      { id: 1, name: 'Placement Aspirant', email: 'demo@learnlens.ai', points: 180, streak: 5, created_at: new Date().toISOString() },
      { id: 2, name: 'Jyoshna', email: 'jyo@gmail.com', points: 90, streak: 3, created_at: new Date().toISOString() }
    ];
  }

  if (endpoint.startsWith('/admin/assignments')) {
    return [
      { topic_id: 1, topic: 'Arrays & Two Pointers', mcq: 1, coding: 1, complete: false, submissions: 1 }
    ];
  }

  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };
  try {
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
  } catch (err: any) {
    // If backend is unreachable (Failed to fetch, Mixed Content, Network Error, etc.)
    if (
      err.name === 'TypeError' ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.message?.includes('Load failed')
    ) {
      const fallback = handleOfflineFallback(endpoint, options);
      if (fallback !== undefined) {
        return fallback as T;
      }
    }
    throw err;
  }
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
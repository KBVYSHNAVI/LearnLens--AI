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

// ── Offline / Demo Persistence Layer ───────────────────────────────────────
const STORAGE_QUESTIONS_KEY = 'learnlens_stored_questions';
const STORAGE_ASSIGNMENTS_KEY = 'learnlens_stored_assignments';

function getStoredQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(STORAGE_QUESTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(mockQuestions));
  } catch {}
  return [...mockQuestions];
}

function saveStoredQuestions(qs: Question[]) {
  try {
    localStorage.setItem(STORAGE_QUESTIONS_KEY, JSON.stringify(qs));
  } catch {}
}

const defaultAssignmentQuestions = [
  {
    id: 101,
    topic_id: 1,
    type: 'mcq',
    title: 'Array Index Memory Offset',
    description: 'How is the memory address of an array element calculated from base address B, element size S, and index i?',
    difficulty: 'Easy',
    options: JSON.stringify(['B + (i * S)', 'B + i + S', 'B * (i + S)', 'B + (i / S)']),
    correct_answer: 'B + (i * S)',
    explanation: 'Memory address calculation uses constant offset multiplication B + (i * S).',
    hints: JSON.stringify(['Think about byte offsets']),
    order: 1
  },
  {
    id: 102,
    topic_id: 1,
    type: 'coding',
    title: 'Two Sum Problem',
    description: 'Given an array of integers and a target sum, output the indices of the two numbers that add up to target.',
    difficulty: 'Easy',
    starter_code_python: '# Two Sum\ndef two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n',
    starter_code_java: 'import java.util.*;\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println("0 1");\n    }\n}',
    starter_code_js: 'function twoSum(nums, target) { return [0, 1]; }',
    test_cases: JSON.stringify([{ input: '2 7 11 15\\n9', expected_output: '0 1' }]),
    hints: JSON.stringify(['Use a dictionary/hashmap to store indices of visited numbers']),
    order: 1
  }
];

function getStoredAssignmentQuestions(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  try {
    localStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(defaultAssignmentQuestions));
  } catch {}
  return [...defaultAssignmentQuestions];
}

function saveStoredAssignmentQuestions(qs: any[]) {
  try {
    localStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(qs));
  } catch {}
}

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
      const parts = endpoint.split('?')[0].split('/');
      const tid = Number(parts[2]);
      const qs = getStoredQuestions();
      return tid ? qs.filter(q => q.topic_id === tid) : qs;
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
    const qid = Number(endpoint.split('/')[2]);
    const found = getStoredQuestions().find(q => q.id === qid);
    return found || mockQuestions[1];
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

  // ── Student Assignments ──
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
    const cleanEndpoint = endpoint.split('?')[0];
    const tid = Number(cleanEndpoint.split('/').pop()) || 1;
    const aqs = getStoredAssignmentQuestions().filter(q => q.topic_id === tid);
    const mcqs = aqs.filter(q => q.type === 'mcq').map(q => {
      let opts = [];
      try { opts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options; } catch { opts = [q.options]; }
      let hints = [];
      try { hints = typeof q.hints === 'string' ? JSON.parse(q.hints) : q.hints; } catch {}
      return { ...q, options: opts, hints };
    });
    const codings = aqs.filter(q => q.type === 'coding').map(q => {
      let hints = [];
      try { hints = typeof q.hints === 'string' ? JSON.parse(q.hints) : q.hints; } catch {}
      return { ...q, hints };
    });
    return {
      topic_id: tid,
      mcq_questions: mcqs.length > 0 ? mcqs : [mockQuestions[0]],
      coding_questions: codings.length > 0 ? codings : [mockQuestions[1]],
      mcq_target: 20,
      coding_target: 5,
      mcq_available: mcqs.length || 1,
      coding_available: codings.length || 1,
      previous_submission: null
    };
  }

  // ── Admin Analytics ──
  if (endpoint.startsWith('/admin/analytics')) {
    const totalQs = getStoredQuestions().length;
    const totalAQs = getStoredAssignmentQuestions().length;
    return {
      totals: {
        users: 24,
        questions: totalQs + totalAQs,
        submissions: 85,
        quizzes: 32,
        pass_rate: 88.5,
        learning_paths: mockPaths.length,
        topics: mockPaths.flatMap(p => p.topics).length
      },
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
        { topic: 'Arrays & Two Pointers', completed: 15, questions: totalQs },
        { topic: 'Linked Lists', completed: 8, questions: 0 },
        { topic: 'Trees & Traversals', completed: 4, questions: 0 }
      ]
    };
  }

  if (endpoint.startsWith('/admin/topics')) {
    return mockPaths.flatMap(p => p.topics);
  }

  // ── Admin Questions CRUD ──
  if (endpoint.startsWith('/admin/questions')) {
    const method = (options.method || 'GET').toUpperCase();
    let qs = getStoredQuestions();

    if (method === 'POST') {
      let body: any = {};
      try { body = JSON.parse((options.body as string) || '{}'); } catch {}
      const id = Date.now();
      const uid = (body.question_uid || '').trim() || `q_${body.topic_id || 1}_${Date.now()}`;
      const newQ: Question = {
        id,
        topic_id: Number(body.topic_id) || 1,
        question_uid: uid,
        title: body.title || 'Untitled Question',
        difficulty: body.difficulty || 'Easy',
        type: body.type || 'mcq',
        description: body.description || '',
        options: typeof body.options === 'string' ? body.options : JSON.stringify(body.options || []),
        correct_answer: body.correct_answer || '',
        explanation: body.explanation || '',
        hints: typeof body.hints === 'string' ? body.hints : JSON.stringify(body.hints || []),
        starter_code_python: body.starter_code_python || '',
        starter_code_java: body.starter_code_java || '',
        starter_code_js: body.starter_code_js || '',
        reference_solution_python: body.reference_solution_python || '',
        test_cases: typeof body.test_cases === 'string' ? body.test_cases : JSON.stringify(body.test_cases || []),
        tags: typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags || []),
        company_tags: typeof body.company_tags === 'string' ? body.company_tags : JSON.stringify(body.company_tags || []),
        verified: true
      };
      qs.unshift(newQ);
      saveStoredQuestions(qs);
      return newQ;
    }

    if (method === 'PUT') {
      const qid = Number(endpoint.split('/').pop());
      let body: any = {};
      try { body = JSON.parse((options.body as string) || '{}'); } catch {}
      qs = qs.map(q => q.id === qid ? { ...q, ...body } : q);
      saveStoredQuestions(qs);
      return qs.find(q => q.id === qid) || body;
    }

    if (method === 'DELETE') {
      const qid = Number(endpoint.split('/').pop());
      qs = qs.filter(q => q.id !== qid);
      saveStoredQuestions(qs);
      return { detail: 'deleted' };
    }

    // GET
    const url = new URL(`http://dummy${endpoint}`);
    const topicIdParam = url.searchParams.get('topic_id');
    if (topicIdParam) {
      const tid = Number(topicIdParam);
      return qs.filter(q => q.topic_id === tid);
    }
    return qs;
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

  // ── Admin Assignments CRUD & Stats ──
  if (endpoint.startsWith('/admin/assignments/stats/overview')) {
    const allAQs = getStoredAssignmentQuestions();
    const allTopics = mockPaths.flatMap(p => p.topics);
    return allTopics.map(t => {
      const mcq = allAQs.filter(q => q.topic_id === t.id && q.type === 'mcq').length;
      const coding = allAQs.filter(q => q.topic_id === t.id && q.type === 'coding').length;
      return {
        topic_id: t.id,
        topic: t.title,
        mcq,
        coding,
        complete: mcq >= 20 && coding >= 5,
        submissions: 1
      };
    });
  }

  if (endpoint.startsWith('/admin/assignments')) {
    const method = (options.method || 'GET').toUpperCase();
    let aqs = getStoredAssignmentQuestions();

    if (method === 'POST') {
      let body: any = {};
      try { body = JSON.parse((options.body as string) || '{}'); } catch {}
      const id = Date.now();
      const newAQ = {
        id,
        topic_id: Number(body.topic_id) || 1,
        type: body.type || 'mcq',
        title: body.title || 'Untitled Assignment Question',
        description: body.description || '',
        difficulty: body.difficulty || 'Easy',
        options: typeof body.options === 'string' ? body.options : JSON.stringify(body.options || []),
        correct_answer: body.correct_answer || '',
        explanation: body.explanation || '',
        starter_code_python: body.starter_code_python || '',
        starter_code_java: body.starter_code_java || '',
        starter_code_js: body.starter_code_js || '',
        reference_solution_python: body.reference_solution_python || '',
        test_cases: typeof body.test_cases === 'string' ? body.test_cases : JSON.stringify(body.test_cases || []),
        hints: typeof body.hints === 'string' ? body.hints : JSON.stringify(body.hints || []),
        order: Number(body.order) || (aqs.length + 1)
      };
      aqs.push(newAQ);
      saveStoredAssignmentQuestions(aqs);
      return { id: newAQ.id, title: newAQ.title, type: newAQ.type };
    }

    if (method === 'DELETE') {
      const id = Number(endpoint.split('/').pop());
      aqs = aqs.filter(q => q.id !== id);
      saveStoredAssignmentQuestions(aqs);
      return { detail: 'deleted' };
    }

    // GET /admin/assignments/:topic_id
    const parts = endpoint.split('?')[0].split('/');
    const tid = Number(parts[parts.length - 1]);
    if (tid) {
      return aqs.filter(q => q.topic_id === tid);
    }
    return aqs;
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
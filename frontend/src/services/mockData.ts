import { LearningPath, Topic, Question, DashboardStats, BadgesResponse } from '../types';

export const mockPaths: LearningPath[] = [
  {
    id: 1,
    path_key: 'dsa',
    title: 'DSA Mastery',
    tagline: 'Crack coding rounds with ease',
    description: 'Arrays, Linked Lists, Trees, Dynamic Programming, and Graphs.',
    icon: 'code',
    color: 'blue',
    order: 1,
    topics: [
      {
        id: 1,
        path_key: 'dsa',
        topic_key: 'arrays',
        title: 'Arrays & Two Pointers',
        category: 'Linear Data Structures',
        difficulty: 'Easy',
        order: 1,
        estimated_minutes: 90,
        verified_question_count: 15,
        target_question_count: 50,
        icon: 'list',
        status: 'completed',
        score: 95
      },
      {
        id: 2,
        path_key: 'dsa',
        topic_key: 'linked-lists',
        title: 'Linked Lists',
        category: 'Linear Data Structures',
        difficulty: 'Medium',
        order: 2,
        estimated_minutes: 120,
        verified_question_count: 12,
        target_question_count: 40,
        icon: 'link',
        status: 'in_progress',
        score: 60
      },
      {
        id: 3,
        path_key: 'dsa',
        topic_key: 'trees',
        title: 'Trees & Traversals',
        category: 'Non-Linear',
        difficulty: 'Hard',
        order: 3,
        estimated_minutes: 180,
        verified_question_count: 20,
        target_question_count: 60,
        icon: 'git-branch',
        status: 'not_started',
        score: 0
      }
    ]
  },
  {
    id: 2,
    path_key: 'core',
    title: 'CS Core Subjects',
    tagline: 'OS, DBMS, Computer Networks & OOP',
    description: 'Core concepts tested in technical interview rounds.',
    icon: 'server',
    color: 'emerald',
    order: 2,
    topics: [
      {
        id: 4,
        path_key: 'core',
        topic_key: 'os',
        title: 'Operating Systems',
        category: 'CS Core',
        difficulty: 'Medium',
        order: 1,
        estimated_minutes: 150,
        verified_question_count: 18,
        target_question_count: 45,
        icon: 'cpu',
        status: 'not_started',
        score: 0
      }
    ]
  }
];

export const mockTopicDetail: Topic = {
  id: 1,
  path_key: 'dsa',
  topic_key: 'arrays',
  title: 'Arrays & Two Pointers',
  category: 'Linear Data Structures',
  difficulty: 'Easy',
  order: 1,
  estimated_minutes: 90,
  verified_question_count: 15,
  target_question_count: 50,
  icon: 'list',
  status: 'completed',
  score: 95,
  content: {
    intro_what: 'An array is a linear collection of elements stored at contiguous memory locations, enabling instant O(1) random access using numerical indices.',
    intro_why: 'Arrays are the backbone of virtually every software application, from operating system memory buffers to AI tensors and database caches.',
    real_world_apps: ['Image pixel representation', 'Audio waveform buffering', 'Database row retrieval'],
    placement_importance: 'Over 65% of technical interview questions at Amazon, Google, Microsoft, and TCS Digital require strong array manipulation and two-pointer techniques.',
    learning_objectives: [
      'Master O(1) access vs O(N) search and insert',
      'Implement Two-Pointer and Sliding Window techniques',
      'Handle edge cases like empty arrays and integer overflow'
    ],
    prerequisites: ['Basic variables and loops', 'Functions and parameters'],
    concept_explanation: 'Elements in an array are stored in consecutive memory slots. Because each element has a fixed size, memory address is calculated instantly: Address = Base_Address + (Index * Element_Size).',
    dry_run_guide: 'Given arr = [3, 7, 2, 9, 5]. Trace finding maximum: max_so_far = 3 -> 7 -> 7 -> 9 -> 9. Result = 9.',
    code_examples: {
      python: '# Find max element\ndef find_max(arr):\n    res = arr[0]\n    for x in arr[1:]:\n        if x > res:\n            res = x\n    return res\n\nprint(find_max([3, 7, 2, 9, 5])) # 9',
      java: 'public class Solution {\n  public static int findMax(int[] arr) {\n    int max = arr[0];\n    for (int x : arr) if (x > max) max = x;\n    return max;\n  }\n}'
    },
    time_space_complexity: {
      access: 'O(1)',
      search: 'O(N)',
      insert: 'O(N)',
      delete: 'O(N)'
    }
  }
};

export const mockQuestions: Question[] = [
  {
    id: 1,
    topic_id: 1,
    question_uid: 'arrays-mcq-1',
    title: 'Array Index Access Time Complexity',
    difficulty: 'Easy',
    type: 'mcq',
    description: 'What is the time complexity to access an element at index i in a contiguous array?',
    options: ['O(1)', 'O(N)', 'O(log N)', 'O(N^2)'],
    correct_answer: 'O(1)',
    explanation: 'Address computation base + (i * size) happens in constant O(1) time without any traversal.',
    hints: ['Think of direct memory indexing', 'No loop is required'],
    verified: true,
    tags: ['complexity', 'basics'],
    company_tags: ['Amazon', 'Google']
  },
  {
    id: 2,
    topic_id: 1,
    question_uid: 'arrays-code-1',
    title: 'Find Maximum Element',
    difficulty: 'Easy',
    type: 'easy_coding',
    description: 'Read space-separated integers from standard input and print the maximum element.',
    starter_code_python: 'nums = list(map(int, input().split()))\n# Write your solution here\nprint(max(nums))\n',
    starter_code_java: 'import java.util.*;\npublic class Solution {\n  public static void main(String[] args) {\n    Scanner s = new Scanner(System.in);\n    int max = Integer.MIN_VALUE;\n    while (s.hasNextInt()) max = Math.max(max, s.nextInt());\n    System.out.println(max);\n  }\n}',
    starter_code_js: 'const fs = require("fs");\nconst nums = fs.readFileSync(0, "utf-8").trim().split(/\\s+/).map(Number);\nconsole.log(Math.max(...nums));\n',
    test_cases: [
      { input: '3 7 2 9 5\n', expected: '9', hidden: false },
      { input: '-5 -2 -10\n', expected: '-2', hidden: true }
    ],
    verified: true,
    hints: ['Initialize max with first element', 'Iterate through the array and update max'],
    tags: ['array', 'traversal'],
    company_tags: ['Amazon', 'TCS']
  }
];

export const mockDashboard: DashboardStats = {
  welcome_message: 'Welcome to LearnLens AI (Demo Mode)',
  user_name: 'Placement Aspirant',
  streak_days: 5,
  readiness_score: 72.5,
  total_questions_solved: 18,
  total_lessons_completed: 4,
  quiz_average_accuracy: 85.0,
  coding_accuracy: 90.0,
  category_progress: [
    { category: 'Data Structures', completed_topics: 3, total_topics: 6, percentage: 50 },
    { category: 'Algorithms', completed_topics: 2, total_topics: 5, percentage: 40 },
    { category: 'Core CS', completed_topics: 1, total_topics: 4, percentage: 25 }
  ],
  weak_topics: ['Dynamic Programming', 'Graph Cycle Detection'],
  recent_activity: [
    { date: 'Today', minutes: 45, questions_solved: 3 },
    { date: 'Yesterday', minutes: 60, questions_solved: 4 },
    { date: '2 days ago', minutes: 30, questions_solved: 2 }
  ],
  recommended_topic: {
    ...mockTopicDetail,
    reason: 'Top priority for upcoming tech placement drive'
  },
  daily_plan: [
    'Solve 2 Two-Pointer array questions',
    'Review Linked List cycle detection',
    'Complete Operating Systems quiz'
  ],
  total_points: 180,
  badges_earned: 4
};

export const mockBadges: BadgesResponse = {
  total_points: 180,
  streak_days: 5,
  next_streak_milestone: 10,
  days_to_next_badge: 5,
  total_badges_available: 15,
  badges: [
    {
      id: 1,
      badge_key: 'first_steps',
      title: 'First Steps',
      description: 'Solved your very first question!',
      icon: 'rocket',
      tier: 'bronze',
      awarded_at: new Date().toISOString()
    },
    {
      id: 2,
      badge_key: 'streak_5',
      title: '5-Day Streak',
      description: 'Maintained a 5-day daily learning streak!',
      icon: 'flame',
      tier: 'bronze',
      awarded_at: new Date().toISOString()
    },
    {
      id: 3,
      badge_key: 'questions_10',
      title: '10 Questions Solved',
      description: 'Mastered 10 verified placement problems.',
      icon: 'check',
      tier: 'silver',
      awarded_at: new Date().toISOString()
    }
  ]
};

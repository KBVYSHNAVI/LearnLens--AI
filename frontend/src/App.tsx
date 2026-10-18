import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { LearningPaths } from './pages/LearningPaths';
import { TopicView } from './pages/TopicView';
import { CodingArena } from './pages/CodingArena';
import { MockInterview } from './pages/MockInterview';
import { AICoach } from './pages/AICoach';
import { CompanyTracks } from './pages/CompanyTracks';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { AITutorModal } from './components/AITutorModal';
import { AuthModal } from './components/AuthModal';
import { Sparkles, BookOpen, Code2, MessageSquare, Trophy } from 'lucide-react';

// ── Error boundary ────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: any) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: any) { return { error: e?.message || 'Unknown error' }; }
  render() {
    if (this.state.error) return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <div className="text-red-400 text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="text-slate-400 text-sm font-mono bg-navy-800 p-3 rounded-lg">{this.state.error}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }}
            className="px-5 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-semibold transition">
            Clear session & reload
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ── Landing page shown to guests ──────────────────────────────────────────
const LandingPage = ({ onOpenAuth }: { onOpenAuth: (mode?: 'login' | 'register') => void }) => (
  <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
    {/* Navbar */}
    <nav className="px-6 py-4 flex items-center justify-between border-b border-navy-800">
      <div className="flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-brand-400" />
        <span className="font-bold text-xl tracking-tight">LearnLens AI</span>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onOpenAuth('login')}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white border border-navy-700 hover:border-brand-500 transition">
          Sign In
        </button>
        <button onClick={() => onOpenAuth('register')}
          className="px-4 py-2 rounded-lg text-sm font-bold bg-brand-600 hover:bg-brand-500 transition">
          Create Account
        </button>
      </div>
    </nav>

    {/* Hero */}
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 gap-8">
      <div className="space-y-4 max-w-2xl">
        {/* Main quote */}
        <div className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
          DREAM&nbsp;·&nbsp;BELIEVE&nbsp;·&nbsp;ACHIEVE
        </div>
        <p className="text-slate-400 text-base italic">
          "failure is the main key to success — stay consistent and achieve your goals"
        </p>

        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-600/15 border border-brand-600/30 text-brand-400 text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> AI-Powered Placement Preparation
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-200">
          Crack Your Dream Tech Placement
        </h2>
        <p className="text-slate-400 text-base leading-relaxed">
          Master DSA, practice mock interviews with AI, debate, and group discussions.
          Track your progress and get personalised recommendations.
        </p>

        <div className="flex gap-4 justify-center pt-2">
          <button onClick={() => onOpenAuth('register')}
            className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-brand-600 to-cyan-500 hover:opacity-90 transition shadow-xl text-base">
            Create Account
          </button>
          <button onClick={() => onOpenAuth('login')}
            className="px-8 py-3 rounded-xl font-bold border border-navy-600 hover:border-brand-500 text-slate-300 hover:text-white transition">
            Sign In
          </button>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full mt-2">
        {[
          { icon: BookOpen, label: 'DSA Learning Paths', color: 'text-brand-400' },
          { icon: Code2, label: 'Coding Arena', color: 'text-cyan-400' },
          { icon: MessageSquare, label: 'AI Interview Coach', color: 'text-purple-400' },
          { icon: Trophy, label: 'Badges & Leaderboard', color: 'text-amber-400' },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="bg-navy-800 border border-navy-700 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-brand-500/50 transition">
            <Icon className={`w-6 h-6 ${color}`} />
            <span className="text-xs font-semibold text-slate-300 text-center">{label}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedTopicKey, setSelectedTopicKey] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [aiTutorOpen, setAiTutorOpen] = useState(false);
  const [tutorContext, setTutorContext] = useState<any>({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [codingQuestionId, setCodingQuestionId] = useState<number | undefined>(undefined);

  const handleSolveQuestion = (qid: number) => {
    setCodingQuestionId(qid);
    setSelectedTopicKey(null);
    setCurrentTab('coding');
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const openTutor = (ctx?: any) => {
    if (ctx) setTutorContext(ctx);
    setAiTutorOpen(true);
  };

  const selectTab = (t: string) => {
    setSelectedTopicKey(null);
    setCurrentTab(t);
  };

  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-400">
        <Sparkles className="w-6 h-6 text-brand-400 animate-pulse" />
        <span>Loading LearnLens...</span>
      </div>
    </div>
  );

  // Show landing page if not logged in
  if (!user) return (
    <>
      <LandingPage onOpenAuth={openAuth} />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultMode={authMode} />
    </>
  );

  // If admin token is stored, show admin panel
  if (localStorage.getItem('learnlens_admin_token')) {
    return <AdminPanel />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-navy-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col`}>
      <Navbar
        onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        onOpenAITutor={() => openTutor()}
        onOpenAuth={() => openAuth('login')}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />
      <div className="flex flex-1">
        <Sidebar
          currentTab={selectedTopicKey ? 'paths' : currentTab}
          onSelectTab={selectTab}
          collapsed={false}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          {selectedTopicKey ? (
            <TopicView
              topicKey={selectedTopicKey}
              onBack={() => setSelectedTopicKey(null)}
              onOpenAITutor={openTutor}
              onSolveQuestion={handleSolveQuestion}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <Dashboard
                  onNavigateToTopic={setSelectedTopicKey}
                  onNavigateToTab={selectTab}
                  onOpenAITutor={() => openTutor()}
                />
              )}
              {currentTab === 'paths' && <LearningPaths onSelectTopic={setSelectedTopicKey} />}
              {currentTab === 'coding' && (
                <CodingArena
                  onOpenAITutor={openTutor}
                  questionId={codingQuestionId}
                  onSelectQuestion={setCodingQuestionId}
                />
              )}
              {currentTab === 'ai-coach' && <AICoach />}
              {currentTab === 'mock-interview' && <MockInterview />}
              {currentTab === 'company-tracks' && (
                <CompanyTracks onNavigateToCoding={() => selectTab('coding')} />
              )}
              {currentTab === 'profile' && <Profile />}
            </>
          )}
        </main>
      </div>
      <button
        onClick={() => openTutor()}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-2xl hover:scale-105 flex items-center gap-2"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-xs font-bold hidden sm:inline pr-1">AI Mentor</span>
      </button>
      <AITutorModal
        isOpen={aiTutorOpen}
        onClose={() => setAiTutorOpen(false)}
        topicTitle={tutorContext.topicTitle}
        questionTitle={tutorContext.questionTitle}
        currentCode={tutorContext.code}
        currentLanguage={tutorContext.language}
        errorContext={tutorContext.error}
      />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} defaultMode={authMode} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
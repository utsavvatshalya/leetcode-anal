/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Compass, 
  Bell, 
  Settings, 
  LogOut, 
  Terminal, 
  User, 
  CornerDownRight, 
  Trophy, 
  Cpu, 
  PlayCircle,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  ShieldAlert,
  Zap,
  Star
} from 'lucide-react';
import AuthPanel from './components/AuthPanel';
import Dashboard from './components/Dashboard';
import Recommendations from './components/Recommendations';
import Roadmap from './components/Roadmap';
import NotificationCenter from './components/NotificationCenter';
import DailyQuiz from './components/DailyQuiz';
import { LeetCodeStats, LeetCodeAnalysis, DailyAlert } from './types';

export default function App() {
  const [user, setUser] = useState<{ email: string; leetcodeUsername: string; targetRole: string } | null>(null);
  
  // Dashboard states
  const [stats, setStats] = useState<LeetCodeStats | null>(null);
  const [analysis, setAnalysis] = useState<LeetCodeAnalysis | null>(null);
  const [notifications, setNotifications] = useState<DailyAlert[]>([]);
  const [completedRoadmapIds, setCompletedRoadmapIds] = useState<string[]>([]);
  
  // UI States
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'roadmap' | 'alerts' | 'settings' | 'quiz'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isMockedStats, setIsMockedStats] = useState(false);

  // Loading stepper copy for AI evaluation
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Establishing secure socket with LeetCode API proxies...",
    "Retrieving algorithmic solve difficulty weights...",
    "Querying Google Gemini-3.5 cognitive auditing model...",
    "Analyzing binary search and pointer layout structures...",
    "Identifying SDE role baseline benchmark alignments...",
    "Formulating bespoke phase-by-phase gap roadmap..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingMessages.length - 1 ? prev + 1 : prev));
      }, 2000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Handle Auth payload synchronization
  const handleAuthSuccess = async (session: { email: string; leetcodeUsername: string; targetRole: string }) => {
    setUser(session);
    await fetchUserProfile(session.email);
  };

  const fetchUserProfile = async (email: string) => {
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}`);
      const data = await response.json();
      if (response.ok) {
        setNotificationsEnabled(data.notificationsEnabled);
        setCompletedRoadmapIds(data.completedRoadmapIds || []);
        setNotifications(data.notifications || []);
        
        if (data.analysis) {
          setAnalysis(data.analysis);
          // Reverse-engineer stats representation
          setStats({
            username: data.leetcodeUsername,
            totalSolved: data.analysis.jobReadiness.industryBenchmarkEasy + data.analysis.jobReadiness.industryBenchmarkMedium, // approximation fallback
            easySolved: Math.floor(data.analysis.jobReadiness.industryBenchmarkEasy * (data.analysis.jobReadiness.readinessPercentage / 100)),
            mediumSolved: Math.floor(data.analysis.jobReadiness.industryBenchmarkMedium * (data.analysis.jobReadiness.readinessPercentage / 100)),
            hardSolved: Math.floor(data.analysis.jobReadiness.industryBenchmarkHard * (data.analysis.jobReadiness.readinessPercentage / 100)),
            ranking: 185002,
            contributionPoints: 240,
            reputation: 25,
            topicBreakdown: {}
          });
          // Perform hot re-sync to fetch real stats if needed
          triggerAnalysis(data.leetcodeUsername, data.targetRole, email, true);
        }
      }
    } catch (e) {
      console.error('Failed to load user profile.', e);
    }
  };

  // Run AI auditing
  const triggerAnalysis = async (username: string, role: string, emailStr: string, isSilentRef = false) => {
    if (!isSilentRef) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const response = await fetch('/api/leetcode/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, targetRole: role, email: emailStr })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Deep AI analysis failed. Verify your server tokens.');
      }

      setStats(data.stats);
      setAnalysis(data.analysis);
      setIsMockedStats(data.isMockedStats);
      
      // Refresh notifications locally
      if (emailStr) {
        const userResp = await fetch(`/api/user/${encodeURIComponent(emailStr)}`);
        const userData = await userResp.json();
        setNotifications(userData.notifications || []);
      }
    } catch (e: any) {
      if (!isSilentRef) {
        alert(e.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toggle checklist node completion
  const handleToggleRoadmapItem = async (itemId: string) => {
    if (!user) return;
    setTogglingIds((prev) => [...prev, itemId]);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(user.email)}/roadmap/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roadmapId: itemId })
      });
      const data = await response.json();
      if (response.ok) {
        setCompletedRoadmapIds(data.completedRoadmapIds);
      }
    } catch (e) {
      console.error('Failed to toggle milestone state.');
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  // Simulation step
  const handleSimulateDaily = async () => {
    if (!user) return;
    setRefreshing(true);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(user.email)}/simulate-daily`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications((prev) => [data.newAlert, ...prev]);
        setActiveTab('alerts');
      }
    } catch (e) {
      console.error('Failed to run daily schedule simulation.');
    } finally {
      setRefreshing(false);
    }
  };

  // Notify settings updates
  const handleToggleNotifications = async (enabled: boolean) => {
    if (!user) return;
    setNotificationsEnabled(enabled);
    try {
      await fetch(`/api/user/${encodeURIComponent(user.email)}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationsEnabled: enabled })
      });
    } catch (e) {
      console.error('Failed to store notification rules.');
    }
  };

  const handleUpdateSettings = async (role: string, handleName: string) => {
    if (!user) return;
    setRefreshing(true);
    try {
      const settingsResp = await fetch(`/api/user/${encodeURIComponent(user.email)}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role, leetcodeUsername: handleName })
      });
      if (settingsResp.ok) {
        setUser((prev: any) => ({ ...prev, targetRole: role, leetcodeUsername: handleName }));
        await triggerAnalysis(handleName, role, user.email, false);
      }
    } catch (e) {
      console.error('Settings upgrade failed.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkNotificationRead = async (alertId: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(user.email)}/notifications/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId })
      });
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
      }
    } catch (e) {
      console.warn('Failed to update notifications read status.');
    }
  };

  const handleClearNotifications = async () => {
    if (!user) return;
    try {
      await fetch(`/api/user/${encodeURIComponent(user.email)}/notifications/clear`, {
        method: 'POST'
      });
      setNotifications([]);
    } catch (e) {
      console.error('Failed to clear alert list.');
    }
  };

  // Sign out
  const handleLogout = () => {
    setUser(null);
    setStats(null);
    setAnalysis(null);
    setNotifications([]);
    setCompletedRoadmapIds([]);
    setActiveTab('dashboard');
  };

  // Render Onboarding state
  if (!user) {
    return <AuthPanel onAuthSuccess={handleAuthSuccess} />;
  }

  // Render dynamic AI report generation loading stage
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 font-sans flex flex-col justify-center items-center text-zinc-100 p-6 relative">
        <div className="w-full max-w-sm space-y-6 text-center relative z-10">
          <div className="flex justify-center">
            <div className="h-6 w-6 rounded-full border-2 border-zinc-800 border-t-emerald-500 animate-spin"></div>
          </div>

          <div className="space-y-2">
            <h1 className="text-sm font-medium text-white tracking-tight">
              Analyzing LeetCode Patterns
            </h1>
            <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
              Formulating bespoke roadmap checkpoints & calculating alignment index with Google Gemini...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display initial "Trigger Assessment" if analysis database payload is empty
  const hasProfileReport = analysis !== null && stats !== null;

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col">
      
      {/* Top Application Header bar */}
      <header className="bg-zinc-900 border-b border-zinc-850/80 py-3.5 px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold text-xs select-none tracking-wider">
            LC
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white tracking-wide">LeetCode Pattern Analyzer</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5 bg-zinc-950 px-3 py-1.5 border border-zinc-850 rounded-lg text-xs font-mono">
            <User size={12} className="text-zinc-500" />
            <span className="text-zinc-400">{user.email}</span>
            <span className="text-zinc-700">|</span>
            <span className="text-zinc-300 font-semibold">{user.leetcodeUsername}</span>
          </div>

          <button
            id="header_logout_btn"
            onClick={handleLogout}
            className="text-zinc-500 hover:text-white hover:bg-zinc-800 p-2 rounded-lg transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Core Shell layout */}
      <div className="flex-1 flex flex-col md:flex-row items-stretch">
        
        {/* Responsive Sidebar menu */}
        <aside className="w-full md:w-64 bg-zinc-900/40 border-r border-zinc-900 flex flex-row md:flex-col justify-start md:justify-between p-3 md:p-4 gap-1.5 overflow-x-auto md:overflow-x-visible sticky top-[57px] md:h-[calc(100vh-57px)] z-40">
          
          <div className="flex flex-row md:flex-col gap-1.5 w-full">
            <h4 className="hidden md:block text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 px-3 py-1 mb-1">
              Navigation Menu
            </h4>
            
            <button
              id="tab_dashboard_btn"
              onClick={() => setActiveTab('dashboard')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <BarChart2 size={16} />
              Skill Overview
            </button>
 
            <button
              id="tab_roadmap_btn"
              onClick={() => setActiveTab('roadmap')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'roadmap' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <Compass size={16} />
              Custom Roadmap
            </button>
 
            <button
              id="tab_queue_btn"
              onClick={() => setActiveTab('queue')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'queue' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <Zap size={16} />
              Practice Queue
            </button>
 
            <button
              id="tab_alerts_btn"
              onClick={() => setActiveTab('alerts')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs relative font-medium transition-colors flex items-center justify-between w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'alerts' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <div className="flex items-center gap-2.5">
                <Bell size={16} />
                <span>Daily Alerts</span>
              </div>
              {hasProfileReport && notifications.filter(n => !n.isRead).length > 0 && (
                <span className="bg-emerald-500 text-zinc-950 text-[10px] font-mono leading-none py-0.5 px-2 font-bold rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
 
            <button
              id="tab_quiz_btn"
              onClick={() => setActiveTab('quiz')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'quiz' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <HelpCircle size={16} />
              Daily Revision Quiz
            </button>
 
            <button
              id="tab_settings_btn"
              onClick={() => setActiveTab('settings')}
              disabled={!hasProfileReport}
              className={`px-3 py-2.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-2.5 w-full cursor-pointer whitespace-nowrap ${
                activeTab === 'settings' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 font-semibold' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900 bg-zinc-950/20 border border-transparent'
              } disabled:opacity-30`}
            >
              <Settings size={16} />
              Profile Settings
            </button>
          </div>
 
          {/* Quick status card footer in sidebar */}
          <div className="hidden md:block bg-zinc-950/40 border border-zinc-900 p-3 rounded-lg space-y-2.5 text-xs text-zinc-500 font-mono">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-400">
              <Trophy size={11} className="text-amber-500" />
              Role Benchmark
            </div>
            <div className="leading-tight">
              Target: <span className="text-zinc-300 font-semibold">{user.targetRole}</span>
            </div>
          </div>
 
        </aside>

        {/* Core view body scroll panel */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {refreshing && (
            <div id="reloading_bar" className="w-full bg-emerald-900/40 border border-emerald-530 p-2 text-center text-xs text-slate-100 font-mono rounded-lg mb-6 animate-pulse select-none">
              📡 Syncing details with LeetCode database proxies and recalculating metrics...
            </div>
          )}

          {!hasProfileReport ? (
            
            /* SDE Newly Registered Onboarding Invitation */
            <div id="assessment_onboarding_jumbotron" className="text-center py-16 px-4 space-y-6 bg-zinc-900/30 border border-zinc-900 rounded-2xl mt-6 relative overflow-hidden">
              <div className="max-w-xl mx-auto space-y-4 relative z-10">
                <div className="inline-flex p-4 bg-zinc-900 border border-zinc-850 text-emerald-450 rounded-2xl">
                  <Cpu size={28} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Initialize Algorithmic Audit</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We detected that you haven't calculated a study plan for your LeetCode username: <span className="font-mono text-emerald-400 font-medium">{user.leetcodeUsername}</span> targetting role: <span className="text-white font-medium">{user.targetRole}</span>.
                </p>
                <p className="text-[11px] text-zinc-500 leading-relaxed max-w-md mx-auto">
                  Click below to dispatch the diagnostics engine. We will fetch coding metrics, cross-examine with industry role benchmarks, compile skip parameters, and build a custom Roadmap automatically.
                </p>

                <div className="pt-4">
                  <button
                    id="trigger_audit_btn"
                    onClick={() => triggerAnalysis(user.leetcodeUsername, user.targetRole, user.email, false)}
                    className="bg-zinc-100 hover:bg-white active:bg-zinc-200 text-zinc-950 font-medium px-6 py-2.5 rounded-lg text-xs transition-colors cursor-pointer inline-flex items-center gap-2"
                  >
                    <span>Generate AI Diagnostic Report</span>
                    <ArrowRight size={12} stopColor='currentColor' />
                  </button>
                </div>
              </div>
            </div>

          ) : (
            
            /* Switch Tab Panels */
            <div id="tabs_view_holder" className="space-y-6">
              
              {activeTab === 'dashboard' && (
                <Dashboard 
                  stats={stats} 
                  analysis={analysis} 
                  isMockedStats={isMockedStats}
                  onRefresh={() => triggerAnalysis(user.leetcodeUsername, user.targetRole, user.email, true)}
                  refreshing={refreshing}
                />
              )}

              {activeTab === 'roadmap' && (
                <Roadmap 
                  analysis={analysis}
                  completedRoadmapIds={completedRoadmapIds}
                  onToggleItem={handleToggleRoadmapItem}
                  togglingIds={togglingIds}
                />
              )}

              {activeTab === 'queue' && (
                <Recommendations 
                  suggestedProblems={analysis.suggestedProblems}
                  skippedProblems={analysis.skippedProblems}
                />
              )}

              {activeTab === 'alerts' && (
                <NotificationCenter 
                  email={user.email}
                  notifications={notifications}
                  notificationsEnabled={notificationsEnabled}
                  onSimulateDaily={handleSimulateDaily}
                  onToggleEnabled={handleToggleNotifications}
                  onMarkRead={handleMarkNotificationRead}
                  onClearAll={handleClearNotifications}
                  simulating={refreshing}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPanel 
                  targetRole={user.targetRole}
                  leetcodeUsername={user.leetcodeUsername}
                  onSave={handleUpdateSettings}
                />
              )}

              {activeTab === 'quiz' && (
                <DailyQuiz 
                  email={user.email}
                />
              )}

            </div>
          )}
        </main>

      </div>
    </div>
  );
}

/* Local Settings Drawer Helper */
interface SettingsPanelProps {
  targetRole: string;
  leetcodeUsername: string;
  onSave: (role: string, handleName: string) => void;
}

function SettingsPanel({ targetRole, leetcodeUsername, onSave }: SettingsPanelProps) {
  const [role, setRole] = useState(targetRole);
  const [handle, setHandle] = useState(leetcodeUsername);

  const roles = [
    'FAANG SDE-1',
    'Senior Frontend Engineer',
    'Backend Engineer (Distributed Systems)',
    'Full-Stack Generalist SDE',
    'Data Structures & Algorithms Intern',
    'Machine Learning Engineer'
  ];

  return (
    <div id="settings_sub_panel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl space-y-6">
      
      <div>
        <h3 className="text-sm font-bold font-display text-white">⚙️ Personal Credentials Configuration</h3>
        <p className="text-xs text-slate-400 mt-1">Configuring target job matrices dynamically recreates diagnostic learning roadmaps.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-450 mb-1.5 font-mono text-slate-400">SDE TARGET JOB ROLE</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer"
          >
            {roles.map((r, i) => (
              <option key={i} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-450 mb-1.5 font-mono text-slate-400">LEETCODE ID HANDLE</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="e.g. neetcode_fan"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs placeholder:text-slate-600 text-white focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="pt-2">
          <button
            id="save_settings_btn"
            onClick={() => onSave(role, handle)}
            className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs font-mono cursor-pointer"
          >
            Update Configuration & Re-Analyze
          </button>
        </div>
      </div>

    </div>
  );
}

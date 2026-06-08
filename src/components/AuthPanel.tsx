/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, User, Target, Terminal, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface AuthPanelProps {
  onAuthSuccess: (session: { email: string; leetcodeUsername: string; targetRole: string }) => void;
}

export default function AuthPanel({ onAuthSuccess }: AuthPanelProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leetcodeUsername, setLeetcodeUsername] = useState('');
  const [targetRole, setTargetRole] = useState('FAANG SDE-1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // List of standard roles
  const roles = [
    'FAANG SDE-1',
    'Senior Frontend Engineer',
    'Backend Engineer (Distributed Systems)',
    'Full-Stack Generalist SDE',
    'Data Structures & Algorithms Intern',
    'Machine Learning Engineer'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in default credentials.');
      setLoading(false);
      return;
    }

    if (isRegister && (!leetcodeUsername || !targetRole)) {
      setError('Please provide your LeetCode ID and target role.');
      setLoading(false);
      return;
    }

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { email, password, leetcodeUsername, targetRole }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      onAuthSuccess({
        email: data.user.email,
        leetcodeUsername: data.user.leetcodeUsername,
        targetRole: data.user.targetRole
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async (selectedRole: string) => {
    setLoading(true);
    setError('');
    
    // Auto-generate customized demo usernames
    const randId = Math.floor(Math.random() * 900) + 100;
    const demoEmail = `recruiter_${randId}@company.com`;
    const demoUsername = `codemaster_${randId}`;
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: demoEmail,
          password: 'demo',
          leetcodeUsername: demoUsername,
          targetRole: selectedRole
        })
      });

      const data = await response.json();
      if (response.ok) {
        onAuthSuccess({
          email: demoEmail,
          leetcodeUsername: demoUsername,
          targetRole: selectedRole
        });
      } else {
        // Fallback login if registered
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: demoEmail, password: 'demo' })
        });
        const loginData = await loginResponse.json();
        onAuthSuccess({
          email: loginData.user.email,
          leetcodeUsername: loginData.user.leetcodeUsername,
          targetRole: loginData.user.targetRole
        });
      }
    } catch (e: any) {
      setError('Demo onboarding failed. Please register manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth_container" className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 font-sans text-zinc-100 px-4 py-12 relative overflow-hidden">
      
      {/* Subtle soft backdrop radial accent - no extreme neon glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full pointer-events-none blur-3xl"></div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        
        {/* Sleek Minimalist Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded-md text-[11px] font-mono text-zinc-400 select-none">
            <Terminal size={12} className="text-emerald-500" />
            LeetCode Portfolio Diagnostic
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mt-1">
            LeetCode Pattern Analyzer
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Diagnose code patterns, map algorithmic structural gaps, and establish customized tracking roadmaps.
          </p>
        </div>

        {/* Central Auth Container Card */}
        <div className="bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl space-y-6 backdrop-blur-sm shadow-xl">
          <div className="border-b border-zinc-805/40 border-zinc-900 pb-4">
            <h2 className="text-sm font-medium text-white">
              {isRegister ? 'New Student Registration' : 'Sign in to Dashboard'}
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Input metrics to customize your preparation schedule, or use quick bypass below.
            </p>
          </div>

          <form id="auth_form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs placeholder:text-zinc-600 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all pl-9"
                />
                <Mail className="absolute left-3 top-2.5 text-zinc-600" size={14} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs placeholder:text-zinc-600 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all pl-9"
                />
                <Lock className="absolute left-3 top-2.5 text-zinc-600" size={14} />
              </div>
            </div>

            {isRegister && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                <div id="reg_leetcode_id" className="space-y-1.5">
                  <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">LeetCode ID (Username)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={leetcodeUsername}
                      onChange={(e) => setLeetcodeUsername(e.target.value)}
                      placeholder="e.g. neet_coder"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs placeholder:text-zinc-600 text-white focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/30 transition-all pl-9"
                    />
                    <User className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                  </div>
                </div>

                <div id="reg_target_role" className="space-y-1.5">
                  <label className="block text-[10px] font-mono tracking-wider font-semibold text-zinc-400 uppercase">Target Job Role</label>
                  <div className="relative">
                    <select
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500/30 transition-all pl-9 appearance-none cursor-pointer"
                    >
                      {roles.map((r, i) => (
                        <option key={i} value={r} className="bg-zinc-950">{r}</option>
                      ))}
                    </select>
                    <Target className="absolute left-3 top-2.5 text-zinc-600" size={14} />
                  </div>
                </div>
              </div>
            )}

            <button
              id="submit_auth_btn"
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-100 hover:bg-white active:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-medium py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {loading ? (
                <div className="h-3.5 w-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isRegister ? 'Register Account' : 'Authenticate Credentials'}</span>
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="text-center pt-1">
            <button
              id="toggle_auth_btn"
              onClick={() => setIsRegister(!isRegister)}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer hover:underline"
            >
              {isRegister ? 'Already registered? Sign in instead' : 'Need to audit a new account? Register here'}
            </button>
          </div>

          {/* Recruiter / Quick Demo Bypass */}
          <div id="quick_demo_bypass" className="pt-4 border-t border-zinc-900 space-y-3">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">
              <Sparkles size={11} className="text-emerald-400" />
              <span>Instant Recruiter Bypass</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Directly evaluation verification. Select a role below to auto-provision a simulated student profile and load pre-cached analysis reports:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="preset-faang"
                onClick={() => handleDemoBypass('FAANG SDE-1')}
                disabled={loading}
                className="bg-zinc-950 hover:bg-zinc-900 text-left p-3 border border-zinc-850 rounded-xl text-xs hover:border-emerald-500/20 transition-all flex flex-col justify-between cursor-pointer"
              >
                <span className="font-medium text-white text-[11px]">FAANG SDE-1</span>
                <span className="text-zinc-500 text-[9px] mt-1 font-mono">Dynamic Graphs & DP Focus</span>
              </button>
              <button
                id="preset-frontend"
                onClick={() => handleDemoBypass('Senior Frontend Engineer')}
                disabled={loading}
                className="bg-zinc-950 hover:bg-zinc-900 text-left p-3 border border-zinc-850 rounded-xl text-xs hover:border-emerald-500/20 transition-all flex flex-col justify-between cursor-pointer"
              >
                <span className="font-medium text-white text-[11px]">Senior Frontend</span>
                <span className="text-zinc-500 text-[9px] mt-1 font-mono">Strings & Iterators Focus</span>
              </button>
            </div>
          </div>

        </div>

        <div className="text-center text-[10px] text-zinc-650 text-zinc-600 font-mono">
          Powered by Gemini 3.5 &bull; Isolated Sanboxes Protocol
        </div>

      </div>
    </div>
  );
}

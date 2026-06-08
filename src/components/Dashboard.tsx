/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { Target, Trophy, Award, Cpu, Star, ExternalLink, RefreshCw, BarChart2, Info } from 'lucide-react';
import { LeetCodeStats, LeetCodeAnalysis } from '../types';

interface DashboardProps {
  stats: LeetCodeStats;
  analysis: LeetCodeAnalysis;
  isMockedStats: boolean;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Dashboard({ stats, analysis, isMockedStats, onRefresh, refreshing }: DashboardProps) {
  // Chart 1 data: Radar of cognitive skill dimensions from AI analysis
  const radarData = [
    { subject: 'Algorithmic Grip', score: analysis.visualMetrics.algorithmicThinking, fullMark: 100 },
    { subject: 'Code Velocity', score: analysis.visualMetrics.implementationSpeed, fullMark: 100 },
    { subject: 'Mathematical Base', score: analysis.visualMetrics.mathAndTheory, fullMark: 100 },
    { subject: 'Memory & Pointer', score: analysis.visualMetrics.systemFocus, fullMark: 100 },
    { subject: 'Edge Cases Debug', score: analysis.visualMetrics.debuggingSkills, fullMark: 100 },
  ];

  // Chart 2 data: Solved status compared vs Industry benchmarks for Target Job Role
  const benchmarkData = [
    {
      difficulty: 'Easy',
      Solved: stats.easySolved,
      Benchmark: analysis.jobReadiness.industryBenchmarkEasy,
    },
    {
      difficulty: 'Medium',
      Solved: stats.mediumSolved,
      Benchmark: analysis.jobReadiness.industryBenchmarkMedium,
    },
    {
      difficulty: 'Hard',
      Solved: stats.hardSolved,
      Benchmark: analysis.jobReadiness.industryBenchmarkHard,
    },
  ];

  // Calculate difficulty ratios
  const easyRatio = stats.totalSolved > 0 ? Math.round((stats.easySolved / stats.totalSolved) * 100) : 0;
  const mediumRatio = stats.totalSolved > 0 ? Math.round((stats.mediumSolved / stats.totalSolved) * 100) : 0;
  const hardRatio = stats.totalSolved > 0 ? Math.round((stats.hardSolved / stats.totalSolved) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Dynamic Profile Cover Banner */}
      <div className="relative bg-zinc-900/40 rounded-2xl p-6 border border-zinc-850/60 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400 font-medium">
              LeetCode Account
            </span>
            <span className="text-[10px] uppercase tracking-wider font-mono text-zinc-500">
              • {isMockedStats ? 'Demo Mode' : 'Live Sync'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            {stats.username}
            <a 
              href={`https://leetcode.com/${stats.username}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <ExternalLink size={14} />
            </a>
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-xl animate-fadeIn">
            Targeting <span className="text-zinc-300 font-medium">{analysis.targetRole}</span> — roadmap updated {new Date(analysis.updatedAt).toLocaleDateString()}.
          </p>
        </div>

        <button
          id="refresh_data_btn"
          onClick={onRefresh}
          disabled={refreshing}
          className="bg-zinc-950 hover:bg-zinc-900 text-zinc-300 border border-zinc-850 px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Re-analyzing...' : 'Sync LeetCode'}
        </button>
      </div>

      {/* LeetCode Basic Statistics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-zinc-900/40 border border-zinc-850/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 rounded-lg">
            <Trophy size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Total Solved</div>
            <div className="text-lg font-semibold text-white mt-0.5">{stats.totalSolved}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-850/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-teal-950/20 border border-teal-500/10 text-teal-400 rounded-lg">
            <BarChart2 size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Ranking</div>
            <div className="text-lg font-semibold text-white mt-0.5">#{stats.ranking.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-850/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-zinc-950 border border-zinc-850 text-zinc-400 rounded-lg">
            <Award size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Reputation</div>
            <div className="text-lg font-semibold text-white mt-0.5">{stats.reputation}</div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-850/60 p-4 rounded-xl flex items-center gap-3.5 shadow-sm">
          <div className="p-2.5 bg-amber-950/20 border border-amber-500/10 text-amber-400 rounded-lg">
            <Star size={18} />
          </div>
          <div>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Rep Score</div>
            <div className="text-lg font-semibold text-white mt-0.5">{stats.contributionPoints} pts</div>
          </div>
        </div>

      </div>

      {/* Main Double Chart Visualization Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Al Cognitive Profile Radar */}
        <div className="bg-zinc-900/30 border border-zinc-850/60 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Evaluation Vectors
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Estimated assessment dimensions based on category ratios and complexity profiles.
            </p>
          </div>

          <div className="h-68 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#a1a1aa', fontSize: 9, fontFamily: 'monospace' }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: '#52525b', fontSize: 8 }}
                  axisLine={false}
                />
                <Radar 
                  name="Solver Trait" 
                  dataKey="score" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.15} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-zinc-850/40 pt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-500">
            <span>🟢 Algorithmic Thinking: {analysis.visualMetrics.algorithmicThinking}%</span>
            <span>🟢 Velocity: {analysis.visualMetrics.implementationSpeed}%</span>
            <span>🟢 Debugging: {analysis.visualMetrics.debuggingSkills}%</span>
          </div>
        </div>

        {/* Right Card: Solved Counts vs Industry Benchmarks for Role */}
        <div id="benchmark_visualizer" className="bg-zinc-900/30 border border-zinc-850/60 p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              Industry Benchmarks
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Your solved question metrics compared against median profiles for <b>{analysis.targetRole}</b>.
            </p>
          </div>

          <div className="h-68 my-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={benchmarkData}
                margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                className="font-mono text-[9px]"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                <XAxis dataKey="difficulty" tick={{ fill: '#a1a1aa' }} />
                <YAxis tick={{ fill: '#a1a1aa' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 'semibold' }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 9 }} />
                <Bar dataKey="Solved" fill="#10b981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Benchmark" fill="#3f3f46" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-zinc-850/40 pt-3 text-[10px] font-mono text-zinc-550 text-zinc-500 flex items-center gap-1.5 leading-normal">
            <Info size={11} className="text-zinc-400 flex-shrink-0" />
            <span>Benchmark represents median counts compiled dynamically for standard validation.</span>
          </div>
        </div>

      </div>

      {/* Topics Solved Breakdown Tag Layout */}
      <div className="bg-zinc-900/30 border border-zinc-850/60 p-5 rounded-2xl">
        <h3 className="text-sm font-semibold text-white mb-4">
          Algorithmic Topics Breakdown
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.topicBreakdown || {}).map(([topic, count], i) => (
            <div 
              key={i} 
              className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg flex items-center justify-between gap-3 text-xs"
            >
              <span className="font-mono text-zinc-350 font-medium">{topic}</span>
              <span className="bg-emerald-950/30 border border-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {count} Solved
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Target Job Role Alignment details banner */}
      <div id="readiness_card" className="bg-zinc-900/20 border border-zinc-850/65 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* Card 1: Gauge */}
        <div className="flex flex-col justify-between space-y-4 border-b md:border-b-0 md:border-r border-zinc-800/40 pb-4 md:pb-0 md:pr-6">
          <div>
            <h4 className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">Target Readiness Match</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold text-emerald-450 text-emerald-400">{analysis.jobReadiness.readinessPercentage}%</span>
              <span className="text-xs text-zinc-500 font-mono">aligned</span>
            </div>
          </div>
          
          {/* Mock custom progress ring */}
          <div className="relative w-full h-1 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
              style={{ width: `${analysis.jobReadiness.readinessPercentage}%` }}
            ></div>
          </div>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Requires approximately 40 to 60 dedicated hours of gap concept practice to meet benchmark standard.
          </p>
        </div>

        {/* Card 2: Knowledge Gaps */}
        <div className="flex flex-col justify-between space-y-3 pb-4 md:pb-0 border-b md:border-b-0 md:border-r border-zinc-800/40 md:pr-6">
          <div>
            <h4 className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">Key Focus Areas</h4>
            <ul className="text-xs text-zinc-350 mt-2.5 space-y-1.5">
              {analysis.jobReadiness.gaps.slice(0, 3).map((gap, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-semibold font-mono">▸</span>
                  <span className="leading-snug text-zinc-300">{gap}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {analysis.jobReadiness.missingConcepts.slice(0, 3).map((concept, idx) => (
              <span key={idx} className="bg-zinc-950 text-zinc-400 text-[10px] font-mono px-2 py-0.5 border border-zinc-850 rounded">
                {concept}
              </span>
            ))}
          </div>
        </div>

        {/* Card 3: Structural Language / Framework Recommendations */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-mono font-semibold tracking-wider text-zinc-400 uppercase">Core Languages</h4>
            <div className="flex flex-wrap gap-2 mt-3">
              {analysis.jobReadiness.requiredFocusLanguages.map((lang, idx) => (
                <span key={idx} className="bg-emerald-950/20 border border-emerald-500/10 text-emerald-400 font-mono text-xs px-2.5 py-0.5 rounded-md">
                  {lang}
                </span>
              ))}
            </div>
          </div>
          <div className="pt-4 text-[11px] text-zinc-500 leading-normal">
            Technical assessments focus heavily on modular logical correctness. Avoid language-specific hacks during raw referential loops.
          </div>
        </div>

      </div>

    </div>
  );
}

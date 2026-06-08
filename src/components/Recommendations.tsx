/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SuggestedProblem, SkippedProblem, Difficulty } from '../types';
import { ArrowUpRight, Ban, Zap, Info, Play, Check, Star, ExternalLink } from 'lucide-react';

interface RecommendationsProps {
  suggestedProblems: SuggestedProblem[];
  skippedProblems: SkippedProblem[];
}

export default function Recommendations({ suggestedProblems, skippedProblems }: RecommendationsProps) {
  return (
    <div className="space-y-8">
      
      {/* SECTION 1: Dynamic Algorithmic Next Steps (Next Solves) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Practice Queue
          </h3>
          <p className="text-xs text-slate-450 text-slate-400 mt-1">
            Prioritized questions recommended to address specific topic focus areas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestedProblems.map((problem, i) => (
            <div 
              key={i} 
              className="bg-slate-900 border border-slate-800 p-5 rounded-xl hover:border-slate-700 hover:bg-slate-900 shadow hover:shadow-emerald-500/2 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-baseline gap-4">
                  <h4 className="text-xs font-bold text-white leading-normal flex-1">
                    {problem.title}
                  </h4>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    problem.difficulty === 'Easy' 
                      ? 'bg-emerald-950 border-emerald-500/10 text-emerald-400' 
                      : problem.difficulty === 'Medium'
                      ? 'bg-amber-952 bg-amber-950 border-amber-500/10 text-amber-400'
                      : 'bg-red-952 bg-red-950 border-red-500/10 text-red-400'
                  }`}>
                    {problem.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                  <span>Topic: {problem.topic}</span>
                  <span>•</span>
                  <span>Est: {problem.estimatedMinutes} mins</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  {problem.reason}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-950/20 mt-4 flex items-center justify-between gap-4">
                <a 
                  href={problem.leetcodeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold font-mono text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  Solve on LeetCode 
                  <ArrowUpRight size={12} />
                </a>
                <span className="text-[10px] text-slate-600 font-mono italic">Recommended next</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Dynamic Skip Lists (Do Not Need to Solve) */}
      <div className="space-y-4 pt-4 border-t border-slate-900">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            Suggested Skips
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Questions matching patterns you have already demonstrated consistent mastery in, representing lower incremental practice value.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-850">
          {skippedProblems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 font-mono">
              No skip suggestions synthesized. Expand your profile metrics index to see skipped modules.
            </div>
          ) : (
            skippedProblems.map((problem, i) => (
              <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/20 hover:bg-slate-900/10 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-400 leading-normal line-through">
                      {problem.title}
                    </h4>
                    <span className="bg-slate-900 text-slate-500 text-[9px] font-mono border border-slate-800 px-1 rounded">
                      {problem.difficulty}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">• Topic: {problem.topic}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-normal">
                    {problem.reason}
                  </p>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2 bg-rose-950/25 border border-rose-500/10 text-rose-400 px-3 py-1.5 rounded-lg text-[10px] font-mono leading-none">
                  <Check size={12} className="text-rose-500" />
                  Mastered (Skip)
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex gap-2 text-xs text-slate-500 leading-relaxed font-mono">
          <Info size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
          <span><b>A Note on Plateauing:</b> Solving too many "Comfortable" problems is the #1 mistake candidates make during DS&A preparation. By skipping Mastered concepts, you free up cognitive bandwidth to focus on higher dimensional dynamic grids and distributed layouts.</span>
        </div>
      </div>

    </div>
  );
}

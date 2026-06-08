/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckSquare, Square, Award, Compass, ArrowRight, Bookmark, Trophy, ExternalLink } from 'lucide-react';
import { LeetCodeAnalysis, RoadmapPhase, RoadmapItem } from '../types';

interface RoadmapProps {
  analysis: LeetCodeAnalysis;
  completedRoadmapIds: string[];
  onToggleItem: (itemId: string) => void;
  togglingIds: string[];
}

export default function Roadmap({ analysis, completedRoadmapIds, onToggleItem, togglingIds }: RoadmapProps) {
  const [activePhase, setActivePhase] = useState<number>(1);

  // Flatten items to compute master metrics
  const allRoadmapItems = analysis.roadmap.flatMap(phase => phase.items);
  const completedCount = allRoadmapItems.filter(item => completedRoadmapIds.includes(item.id)).length;
  const totalCount = allRoadmapItems.length;
  const overallPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Master Progress Showcase Jumbotron */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative">
        <div className="space-y-2 text-center md:text-left">
          <div className="text-xs text-emerald-400 font-medium">
            Preparation Guide
          </div>
          <h2 className="text-xl font-bold text-white">Bespoke Preparation Roadmap</h2>
          <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
            Constructed training path targeting focus deficiencies for <b>{analysis.targetRole}</b> interviews. Achieve master checkpoints step-by-step.
          </p>
        </div>

        {/* Master Progress Circle/Bar card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-col items-center justify-center gap-1 min-w-[150px]">
          <div className="text-[10px] font-mono text-slate-500 uppercase">Overall progress</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{overallPercentage}%</div>
          <div className="text-[10px] font-mono text-slate-500 mt-1">{completedCount} / {totalCount} done</div>
        </div>
      </div>

      {/* Grid: Phase Selector Map & Item Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Phase Select Rails Column */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">ROADMAPPING PHASES</h4>
          <div className="space-y-2">
            {analysis.roadmap.map((phase, i) => {
              const phaseCompletedCount = phase.items.filter(item => completedRoadmapIds.includes(item.id)).length;
              const phaseTotalCount = phase.items.length;
              const isSelected = activePhase === phase.phaseNumber;

              return (
                <button
                  id={`phase_btn_${phase.phaseNumber}`}
                  key={i}
                  onClick={() => setActivePhase(phase.phaseNumber)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900/60 border-emerald-500/40 shadow shadow-emerald-500/5' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-900/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-500">PHASE 0{phase.phaseNumber}</span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {phaseCompletedCount}/{phaseTotalCount} Solved
                    </span>
                  </div>
                  <h3 className={`text-xs font-bold font-display ${isSelected ? 'text-white' : 'text-slate-300'}`}>{phase.phaseTitle}</h3>
                  <p className="text-[10px] text-slate-500 line-clamp-1">{phase.theme}</p>
                </button>
              );
            })}
          </div>

          <div id="resource_banner" className="bg-gradient-to-br from-emerald-950/20 to-slate-950 border border-emerald-500/10 p-4 rounded-xl space-y-2">
            <h5 className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
              <Bookmark size={12} /> Resource Reference
            </h5>
            <p className="text-[11px] text-slate-400 leading-normal">
              Hover or click on individual checklists to read specific textbook references, templates, or suggested online courses corresponding to the subject.
            </p>
          </div>
        </div>

        {/* Dynamic Checklist Content Column */}
        <div id="phase_items_container" className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl min-h-[350px] flex flex-col justify-between">
          <div>
            {analysis.roadmap.map((phase) => {
              if (phase.phaseNumber !== activePhase) return null;

              return (
                <div key={phase.phaseNumber} className="space-y-4">
                  
                  {/* Detailed Active Phase stats */}
                  <div className="border-b border-slate-800/80 pb-4 flex justify-between items-baseline">
                    <div>
                      <h3 className="text-sm font-bold font-display text-white">{phase.phaseTitle}</h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-1">Theme Focus: <span className="text-emerald-400">{phase.theme}</span></p>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-950 border border-slate-800 font-mono px-2 py-0.5 rounded-full">
                      🌿 Est. Time: {phase.estimatedWeeks} Weeks
                    </span>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3.5">
                    {phase.items.map((item) => {
                      const isDone = completedRoadmapIds.includes(item.id);
                      const isToggling = togglingIds.includes(item.id);

                      return (
                        <div 
                          key={item.id}
                          className={`p-4 border rounded-xl transition-all ${
                            isDone 
                              ? 'bg-emerald-950/10 border-emerald-500/20 shadow-inner' 
                              : 'bg-slate-950/50 border-slate-800 hover:border-slate-800 hover:bg-slate-950/80'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <button
                              id={`checkbox_${item.id}`}
                              onClick={() => onToggleItem(item.id)}
                              disabled={isToggling}
                              className="text-slate-500 hover:text-emerald-400 mt-0.5 transition-colors cursor-pointer flex-shrink-0"
                            >
                              {isToggling ? (
                                <div className="h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              ) : isDone ? (
                                <CheckSquare size={18} className="text-emerald-400" />
                              ) : (
                                <Square size={18} />
                              )}
                            </button>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <h4 className={`text-xs font-bold leading-none ${isDone ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                  {item.title}
                                </h4>
                                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                                  item.difficulty === 'Easy' 
                                    ? 'bg-emerald-950 border border-emerald-500/10 text-emerald-400' 
                                    : item.difficulty === 'Medium'
                                    ? 'bg-amber-955 bg-amber-950/50 border border-amber-500/10 text-amber-400'
                                    : 'bg-red-950/50 border border-red-500/10 text-red-400'
                                }`}>
                                  {item.difficulty}
                                </span>
                              </div>
                              
                              <p className={`text-xs ${isDone ? 'text-slate-550' : 'text-slate-400'} leading-relaxed`}>
                                {item.description}
                              </p>

                              {/* Material Suggestion */}
                              {item.resourceSuggestion && (
                                <div className="text-[10px] font-mono text-slate-500 mt-2 flex items-center gap-1">
                                  <span className="text-emerald-400/80">Recommended Study:</span>
                                  <span className="text-slate-400 italic font-mono">{item.resourceSuggestion}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6 text-[10px] font-mono text-slate-500 flex justify-between items-center">
            <span>🟢 Completing items dynamically updates user credentials in CV memory</span>
            <div className="flex items-center gap-1 select-none">
              <span>Next Phase</span>
              <ArrowRight size={10} />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

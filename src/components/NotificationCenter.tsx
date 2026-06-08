/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Bell, Settings, Calendar, PlayCircle, Star, Terminal, Trash2, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { DailyAlert } from '../types';

interface NotificationCenterProps {
  email: string;
  notifications: DailyAlert[];
  notificationsEnabled: boolean;
  onSimulateDaily: () => void;
  onToggleEnabled: (enabled: boolean) => void;
  onMarkRead: (alertId: string) => void;
  onClearAll: () => void;
  simulating: boolean;
}

export default function NotificationCenter({
  email,
  notifications,
  notificationsEnabled,
  onSimulateDaily,
  onToggleEnabled,
  onMarkRead,
  onClearAll,
  simulating
}: NotificationCenterProps) {
  const [selectedAlert, setSelectedAlert] = useState<DailyAlert | null>(null);

  // Play custom low-latency browser audio chime on simulation receipt
  const playAlertChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5

      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.65);
      osc2.stop(audioCtx.currentTime + 0.65);
    } catch (e) {
      console.warn('Web Audio Context blocked or not supported yet.');
    }
  };

  const handleSimulateClick = () => {
    onSimulateDaily();
    // Tiny delay to play chime on event sync block
    setTimeout(() => {
      playAlertChime();
    }, 1500);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      
      {/* Simulation Master Controller Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full"></div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-md text-[10px] uppercase font-mono tracking-wider font-semibold">
              <Terminal size={12} />
              Demonstration Simulator Dashboard
            </div>
            <h2 className="text-xl font-bold font-display text-white">Daily Solver Notification Sub-System</h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Experience the core automated workflow. In production, a server cron triggers the Gemini recommendation engine to send study guides. In this sandbox, you can manually fast-forward time to simulate subsequent days!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            
            {/* Enabled / Disabled Master Toggle */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-[9px] font-mono text-slate-500 uppercase">Alert Delivery</div>
                <div className="text-xs font-bold text-slate-300">
                  {notificationsEnabled ? '📡 ACTIVE' : '🔇 OFF'}
                </div>
              </div>
              <button
                id="toggle_notifications_rule"
                onClick={() => onToggleEnabled(!notificationsEnabled)}
                className={`w-10 h-5 rounded-full p-0.5 cursor-pointer transition-colors relative ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 bg-slate-950 border border-slate-700 rounded-full transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Simulation button */}
            <button
              id="simulate_new_day_btn"
              onClick={handleSimulateClick}
              disabled={simulating || !notificationsEnabled}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 text-slate-950 font-extrabold px-5 py-3 rounded-xl text-xs font-mono transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow hover:shadow-emerald-500/10"
            >
              <PlayCircle size={16} />
              {simulating ? 'Synthesizing...' : 'Simulate Day Change'}
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Inbox Column (Left) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
              <Bell size={16} className="text-emerald-400" />
              In-App Notification Alerts ({unreadCount} new)
            </h3>
            {notifications.length > 0 && (
              <button
                id="clear_notifications_btn"
                onClick={onClearAll}
                className="text-[10px] font-mono text-rose-500 hover:text-rose-450 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Trash2 size={11} /> Clear Log
              </button>
            )}
          </div>

          <div id="notifications_logs_list" className="space-y-2.5">
            {notifications.length === 0 ? (
              <div className="bg-slate-900 border border-slate-850 p-12 rounded-2xl text-center space-y-3">
                <Bell size={32} className="text-slate-700 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-300">No Notifications Yet</h4>
                <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                  Activate notifications and click "Simulate Day Change" above to trigger study рекомендации.
                </p>
              </div>
            ) : (
              notifications.map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => {
                    onMarkRead(alert.id);
                    setSelectedAlert(alert);
                  }}
                  className={`p-4 border rounded-xl transition-all cursor-pointer flex items-start gap-3.5 relative ${
                    alert.id === selectedAlert?.id 
                      ? 'border-emerald-500/50 bg-slate-900 shadow shadow-emerald-500/5' 
                      : alert.isRead 
                      ? 'bg-slate-950/20 border-slate-850 hover:bg-slate-900/10' 
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  {/* Status dot indicator */}
                  {!alert.isRead && (
                    <div className="absolute top-4.5 right-4 h-2 w-2 bg-emerald-500 rounded-full"></div>
                  )}

                  <div className={`p-2 rounded-lg ${alert.isRead ? 'bg-slate-900 text-slate-500' : 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/10'}`}>
                    <Calendar size={16} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                      <span>{alert.date}</span>
                      <span>•</span>
                      <span>{alert.simulatedTime}</span>
                    </div>
                    <h4 className={`text-xs font-bold leading-normal ${alert.isRead ? 'text-slate-400' : 'text-slate-200'}`}>
                      {alert.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">
                      Problem: <span className="text-emerald-400">{alert.problemName}</span> ({alert.difficulty})
                    </p>
                    <p className="text-xs text-slate-500/80 italic mt-1 font-mono line-clamp-1">
                      {alert.whyRecommended}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Email Simulation Drawer (Right) */}
        <div id="email_simulator_rail" className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold font-display text-white">
            ✉️ Simulated Email Delivery Drawer
          </h3>
          
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg h-[450px] flex flex-col">
            {/* Simulated Email Browser Header */}
            <div className="bg-slate-950 border-b border-slate-800 p-3.5 space-y-1 text-xs">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>SMTP STACK: DEV_SANDBOX</span>
                <span className="text-emerald-500 font-bold uppercase">● SECURE ROUTED</span>
              </div>
              <div className="mt-2 text-slate-300 font-mono">
                <span className="text-slate-500 font-semibold uppercase">From:</span> auto-bot@leetcode-analyzer.tech
              </div>
              <div className="text-slate-300 font-mono">
                <span className="text-slate-500 font-semibold uppercase">To:</span> {email}
              </div>
            </div>

            {/* Email Body */}
            <div className="p-4 flex-1 overflow-y-auto text-slate-300 leading-relaxed font-sans text-xs space-y-4">
              {selectedAlert ? (
                <div className="space-y-4 font-sans leading-relaxed text-slate-300">
                  <div className="pb-3 border-b border-slate-800">
                    <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider text-emerald-400">
                      Subject: {selectedAlert.title}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500">Delivered dynamically {selectedAlert.date} at {selectedAlert.simulatedTime}</span>
                  </div>

                  <p className="leading-relaxed">
                    Hello user, <br />
                    Here is your tailored DS&A problem targeted precisely to bridge your target metrics gaps:
                  </p>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-extrabold text-white font-display block">
                        {selectedAlert.problemName}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        selectedAlert.difficulty === 'Easy' 
                          ? 'bg-emerald-950 border-emerald-500/10 text-emerald-400' 
                          : selectedAlert.difficulty === 'Medium'
                          ? 'bg-amber-951 bg-amber-950 border-amber-500/10 text-amber-400'
                          : 'bg-red-951 bg-red-950 border-red-500/10 text-red-400'
                      }`}>
                        {selectedAlert.difficulty}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Topic Domain: {selectedAlert.topic}</span>
                    <p className="text-slate-400 mt-1 italic text-[11px] leading-normal font-mono">
                      "{selectedAlert.whyRecommended}"
                    </p>
                  </div>

                  <p>
                    Double down on this concept today for 30-40 minutes and update your progress roadmap when completed.
                  </p>

                  <div className="pt-2">
                    <a 
                      id="solve_today_action"
                      href={selectedAlert.leetcodeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-emerald-500 text-slate-950 py-2 px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer max-w-sm"
                    >
                      Solve Problem on LeetCode
                      <ChevronRight size={14} />
                    </a>
                  </div>

                  <p className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                    You received this email because you registered for automated gap roadmap recommendations. If you want to unsubscribe, toggle alert delivery in our dashboard settings.
                  </p>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 text-slate-500 py-10">
                  <Mail size={32} className="text-slate-800" />
                  <p className="text-[11px] max-w-[200px] leading-relaxed">
                    Select any notification card from the log (left panel) to render the rendered responsive email HTML content block.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}

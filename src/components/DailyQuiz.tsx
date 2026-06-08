/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  HelpCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  BookOpen, 
  Calendar,
  AlertCircle,
  PlayCircle,
  Award,
  Clock,
  Timer,
  Pause,
  Play
} from 'lucide-react';
import { QuizQuestion, QuizSession, UserQuizHistory } from '../types';

interface DailyQuizProps {
  email: string;
}

export default function DailyQuiz({ email }: DailyQuizProps) {
  const [activeQuiz, setActiveQuiz] = useState<QuizSession | null>(null);
  const [quizHistory, setQuizHistory] = useState<UserQuizHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: number }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Optional Countdown Timer State
  const [timerEnabled, setTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('quiz_timer_enabled');
    return saved === 'true';
  });
  const [timerMode, setTimerMode] = useState<'question' | 'global'>(() => {
    const saved = localStorage.getItem('quiz_timer_mode');
    return (saved === 'global' ? 'global' : 'question') as 'question' | 'global';
  });
  const [timerValue, setTimerValue] = useState<number>(() => {
    const saved = localStorage.getItem('quiz_timer_value');
    if (saved) {
      return parseInt(saved, 10);
    }
    return 45; // default 45 seconds per question
  });

  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

  // Keep a stable ref for answers to safely use in timer countdown trigger without causing stale closures
  const selectedAnswersRef = React.useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  // Fetch the quiz logs and active quiz on mount
  useEffect(() => {
    fetchQuizData();
  }, [email]);

  const fetchQuizData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}/quiz`);
      const data = await response.json();
      if (response.ok) {
        setActiveQuiz(data.activeQuiz);
        setQuizHistory(data.quizHistory || []);
        if (data.activeQuiz) {
          setSelectedAnswers(data.activeQuiz.userAnswers || {});
          // If already completed, render first question review
          setCurrentQuestionIndex(0);
        }
      } else {
        setErrorMessage(data.error || 'Failed to load quiz metadata.');
      }
    } catch (e) {
      console.error('Failed to load quiz state:', e);
      setErrorMessage('Network connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}/quiz/generate`, {
        method: 'POST'
      });
      const data = await response.json();
      if (response.ok) {
        setActiveQuiz(data.activeQuiz);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
        setIsAiGenerated(data.isAiGenerated);
      } else {
        setErrorMessage(data.error || 'Cognitive models failed quiz generation.');
      }
    } catch (err) {
      console.error('Error generating quiz:', err);
      setErrorMessage('Failed to trigger daily quiz dispatcher.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    if (activeQuiz?.completed) return; // Locked once submitted
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (!activeQuiz) return;
    
    // Choose latest ref answers if auto-submitted, otherwise standard selectedAnswers state
    const answersToSend = isAutoSubmit ? selectedAnswersRef.current : selectedAnswers;

    if (!isAutoSubmit) {
      // Check if they answered all questions
      const unansweredCount = activeQuiz.questions.filter(q => selectedAnswers[q.id] === undefined).length;
      if (unansweredCount > 0) {
        const confirmSubmit = window.confirm(
          `You have ${unansweredCount} unanswered questions left. Are you sure you want to submit?`
        );
        if (!confirmSubmit) return;
      }
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAnswers: answersToSend })
      });
      const data = await response.json();
      if (response.ok) {
        setActiveQuiz(data.activeQuiz);
        setQuizHistory(data.quizHistory || []);
        setCurrentQuestionIndex(0); // review answers starting at Q1
      } else {
        setErrorMessage(data.error || 'Submission failed.');
      }
    } catch (err) {
      console.error('Error submitting answers:', err);
      setErrorMessage('Failed to submit revision answers.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to format countdown timer seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Active Timer countdown effect
  useEffect(() => {
    if (!activeQuiz || activeQuiz.completed || !timerEnabled || isTimerPaused) {
      return;
    }

    if (timeLeft <= 0) {
      if (timerMode === 'question') {
        // Auto-advance to the next question or auto-submit if it's the final question
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setTimeLeft(timerValue);
        } else {
          handleSubmitQuiz(true);
        }
      } else {
        // Global countdown hit 0 -> Auto-submit entire quiz
        handleSubmitQuiz(true);
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, activeQuiz, timerEnabled, isTimerPaused, currentQuestionIndex, timerMode, timerValue]);

  // Reset per-question countdown when the active index changes
  useEffect(() => {
    if (activeQuiz && !activeQuiz.completed && timerEnabled) {
      if (timerMode === 'question') {
        setTimeLeft(timerValue);
        setIsTimerPaused(false);
      }
    }
  }, [currentQuestionIndex, timerMode, timerValue, timerEnabled, activeQuiz?.quizId]);

  // Set initial countdown when a fresh quiz starts or is toggled on on-the-fly
  useEffect(() => {
    if (activeQuiz && !activeQuiz.completed && timerEnabled) {
      setTimeLeft(timerValue);
      setIsTimerPaused(false);
    }
  }, [activeQuiz?.quizId, timerEnabled, timerMode, timerValue]);

  const handleResetQuiz = async () => {
    const confirmReset = window.confirm('Are you sure you want to clear your current progress and generate a new quiz?');
    if (!confirmReset) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await fetch(`/api/user/${encodeURIComponent(email)}/quiz/reset`, {
        method: 'POST'
      });
      if (response.ok) {
        setActiveQuiz(null);
        setSelectedAnswers({});
        setCurrentQuestionIndex(0);
      } else {
        setErrorMessage('Failed to clear current session.');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setErrorMessage('Failed to reset active state.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">Syncing active quiz credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Intro Header */}
      <div id="quiz_section_intro" className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="text-base font-bold font-display text-white flex items-center gap-2">
            <Trophy className="text-amber-500 h-5 w-5" />
            LeetCode Daily Revision Quiz
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Revise critical data structures and algorithmic layouts. Once daily, take a custom 10 MCQ sequence 
            derived from your mastered categories to reinforce complexity bounds and edge cases.
          </p>
        </div>
        {!activeQuiz && (
          <button
            id="start_quiz_btn"
            disabled={generating}
            onClick={handleGenerateQuiz}
            className="neon-button shrink-0 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs font-mono transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Querying Gemini Core...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Initialize 10-MCQ Quiz
              </>
            )}
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="bg-rose-950/40 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-rose-450 h-5 w-5 shrink-0" />
          <div className="text-xs font-sans text-rose-300">
            <p className="font-semibold">Operation Failure</p>
            <p className="opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Active Quiz Panel */}
      {activeQuiz ? (
        <div id="quiz_workspace_container" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Question Sheet and Option Controls (Left & Center) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              
              {/* Question progress and category tag header */}
              <div className="bg-slate-950/80 px-6 py-4 border-b border-slate-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono text-slate-400 text-[11px]">
                  <span className="font-bold text-emerald-450 text-emerald-400">
                    QUESTION {currentQuestionIndex + 1}
                  </span>
                  <span>/</span>
                  <span>{activeQuiz.questions.length}</span>
                </div>
                
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider uppercase font-semibold">
                  {activeQuiz.questions[currentQuestionIndex].topic}
                </span>
              </div>

              {/* Optional Countdown Timer Deck */}
              {timerEnabled && !activeQuiz.completed && (
                <div className="bg-slate-950/40 border-b border-slate-800/50 px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-4 w-4 ${timeLeft < (timerMode === 'question' ? timerValue * 0.2 : timerValue * 0.15) ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`} />
                    <span className="text-slate-400 font-semibold">
                      Time Remaining:
                    </span>
                    <span className={`text-[12px] font-bold tracking-wider font-mono px-2 py-0.5 rounded ${
                      timeLeft < (timerMode === 'question' ? timerValue * 0.2 : timerValue * 0.15)
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                        : timeLeft < (timerMode === 'question' ? timerValue * 0.5 : timerValue * 0.4)
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {formatTime(timeLeft)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({timerMode === 'question' ? 'per question' : 'global limit'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Pause / Resume Trigger */}
                    <button
                      onClick={() => setIsTimerPaused(!isTimerPaused)}
                      className={`px-2 py-0.5 rounded border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        isTimerPaused
                          ? 'bg-amber-500/10 text-amber-450 border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {isTimerPaused ? (
                        <>
                          <Play size={10} fill="currentColor" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause size={10} fill="currentColor" />
                          Pause
                        </>
                      )}
                    </button>

                    {/* Disable Timer dynamically */}
                    <button
                      onClick={() => {
                        const confirmDisable = window.confirm('Are you sure you want to disable the countdown timer for this revision run?');
                        if (confirmDisable) {
                          setTimerEnabled(false);
                          localStorage.setItem('quiz_timer_enabled', 'false');
                        }
                      }}
                      className="text-[10px] text-slate-500 hover:text-slate-300 hover:underline cursor-pointer font-sans"
                    >
                      Disable timer
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz interactive form container */}
              <div className="relative">
                {/* Timer Paused Overlay */}
                {timerEnabled && !activeQuiz.completed && isTimerPaused && (
                  <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 space-y-4">
                    <div className="p-3 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">
                      <Pause size={24} fill="currentColor" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">OA Timer Suspended</h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed mx-auto">
                        Your assessment countdown is currently suspended. Question sheet remains hidden under standard examination guidelines.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsTimerPaused(false)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-transform active:scale-95 cursor-pointer"
                    >
                      Resume Countdown
                    </button>
                  </div>
                )}

                <div className={`p-6 md:p-8 space-y-6 ${timerEnabled && !activeQuiz.completed && isTimerPaused ? 'select-none pointer-events-none opacity-10' : ''}`}>
                
                {/* Question Text */}
                <h3 className="text-sm font-semibold tracking-wide leading-relaxed text-slate-100 font-sans">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h3>

                {/* Options List */}
                <div className="space-y-3 pt-2">
                  {activeQuiz.questions[currentQuestionIndex].options.map((option, idx) => {
                    const qId = activeQuiz.questions[currentQuestionIndex].id;
                    const isSelected = selectedAnswers[qId] === idx;
                    const isCorrect = activeQuiz.questions[currentQuestionIndex].correctOptionIndex === idx;
                    const completed = activeQuiz.completed;
                    
                    // Style indicators based on quiz state
                    let optionStyle = "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-350";
                    if (isSelected) {
                      optionStyle = "border-emerald-550 border-emerald-500/40 bg-emerald-500/5 text-emerald-300 font-medium";
                    }

                    if (completed) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold";
                      } else if (isSelected) {
                        optionStyle = "border-rose-500 bg-rose-500/10 text-rose-300";
                      } else {
                        optionStyle = "border-slate-900 bg-slate-950/10 text-slate-500 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={completed}
                        onClick={() => handleSelectOption(qId, idx)}
                        className={`w-full text-left p-4 rounded-xl border text-xs leading-relaxed transition-all duration-150 flex items-start gap-3.5 hover:scale-[1.005] select-none ${
                          !completed ? 'cursor-pointer active:scale-[0.995]' : 'cursor-default'
                        } ${optionStyle}`}
                      >
                        <span className={`h-5 w-5 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 border ${
                          isSelected 
                            ? 'bg-emerald-500 text-slate-950 border-emerald-500' 
                            : completed && isCorrect
                              ? 'bg-emerald-500/20 text-emerald-450 border-emerald-500/20'
                              : 'bg-slate-900 border-slate-700/80 text-slate-400'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 mt-0.5">{option}</span>
                        
                        {completed && isCorrect && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-450 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {completed && isSelected && !isCorrect && (
                          <XCircle className="h-4 w-4 text-rose-450 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Block (Renders if submitted) */}
                {activeQuiz.completed && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-2 mt-4">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <BookOpen size={12} />
                      Concept Revision Explanation
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeQuiz.questions[currentQuestionIndex].explanation}
                    </p>
                  </div>
                )}

              </div>
            </div>

            {/* Navigation controls footer */}
              <div className="bg-slate-950/80 px-6 py-4 border-t border-slate-805 border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                    className="p-2 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-20"
                    title="Previous Question"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <button
                    disabled={currentQuestionIndex === activeQuiz.questions.length - 1}
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="p-2 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 rounded-lg transition-colors cursor-pointer disabled:opacity-20"
                    title="Next Question"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {activeQuiz.completed ? (
                    <button
                      onClick={handleResetQuiz}
                      className="bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-650 px-4 py-2 rounded-xl text-xs font-mono transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} className="animate-pulse" />
                      Discard & Retake Another
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleResetQuiz}
                        className="text-slate-500 hover:text-slate-350 px-3.5 py-2 rounded-lg text-xs font-mono cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        id="submit_quiz_btn"
                        onClick={handleSubmitQuiz}
                        disabled={submitting}
                        className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs font-mono cursor-pointer transition-transform duration-75 active:scale-95 flex items-center gap-1.5"
                      >
                        {submitting ? 'Submitting...' : 'Submit Answers'}
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Pagination helper grid */}
            <div className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl">
              <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 px-1">
                Quiz Progress Matrix
              </span>
              <div className="flex flex-wrap gap-2.5">
                {activeQuiz.questions.map((q, idx) => {
                  const hasAnswered = selectedAnswers[q.id] !== undefined;
                  const isCurrent = currentQuestionIndex === idx;
                  const isCorrect = activeQuiz.completed && selectedAnswers[q.id] === q.correctOptionIndex;
                  const isIncorrect = activeQuiz.completed && selectedAnswers[q.id] !== q.correctOptionIndex;

                  let stepColor = "bg-slate-950 hover:bg-slate-900 text-slate-400 border-slate-800";
                  if (hasAnswered && !activeQuiz.completed) {
                    stepColor = "bg-emerald-900/10 text-emerald-300 border-emerald-500/20";
                  }
                  if (isCurrent) {
                    stepColor += " ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-slate-950";
                  }
                  if (activeQuiz.completed) {
                    if (isCorrect) {
                      stepColor = "bg-emerald-500 text-slate-950 border-emerald-500";
                    } else if (isIncorrect) {
                      stepColor = "bg-rose-500 text-white border-rose-500";
                    } else {
                      stepColor = "bg-slate-950 border-slate-900 text-slate-650 opacity-40";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 w-9 rounded-lg border flex items-center justify-center font-mono text-[11px] font-bold cursor-pointer transition-all ${stepColor}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Results Summary and History sidebar panel (Right) */}
          <div className="space-y-6">
            
            {/* Scorecard Widget */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800/80 rounded-2xl p-6 text-center space-y-4 shadow-lg relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>

              <div className="mx-auto h-12 w-12 bg-slate-905 bg-slate-800/30 border border-slate-700/50 flex items-center justify-center rounded-2xl text-amber-500">
                <Award size={24} className={activeQuiz.completed ? 'animate-bounce' : ''} />
              </div>

              <div className="space-y-1 relative z-10">
                <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase">
                  ACTIVE REVISION RUN
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  {activeQuiz.completed ? 'Evaluation Finished' : 'Work in Progress'}
                </h4>
              </div>

              {activeQuiz.completed ? (
                <div className="space-y-3 pt-2 relative z-10">
                  <div className="bg-slate-950/60 border border-slate-800/40 p-5 rounded-2xl">
                    <span className="block text-4xl font-extrabold font-display text-white">
                      {activeQuiz.score}
                      <span className="text-xl font-normal text-slate-500">/{activeQuiz.questions.length}</span>
                    </span>
                    <span className="block text-[10px] font-mono text-emerald-450 mt-1 uppercase font-semibold text-emerald-400">
                      {activeQuiz.score >= 8 ? '🎖️ Pattern Master' : activeQuiz.score >= 5 ? '👍 Competent' : '💪 Gap revision suggested'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    Answers compiled. We factored your score ({Math.floor((activeQuiz.score / activeQuiz.questions.length) * 100)}%) to update optimization priority parameters and solidify cognitive checkpoints.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2 relative z-10">
                  <div className="bg-slate-955 bg-slate-950/40 border border-slate-850 border-slate-800/40 p-4 rounded-xl font-mono text-xs text-slate-400 space-y-2">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="text-emerald-400">Answering...</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="text-slate-200">
                        {Object.keys(selectedAnswers).length} / {activeQuiz.questions.length}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                    Take your time. This revision run does not penalize speed; we analyze accuracy of conceptual details.
                  </p>
                </div>
              )}
            </div>

            {/* Realtime Timing Panel (when quiz is active) */}
            {!activeQuiz.completed && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 uppercase flex items-center gap-2">
                  <Timer size={14} className="text-emerald-400" />
                  Pacing Mode
                </span>

                {!timerEnabled ? (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      Track your solution speed to simulate real-world assessment constraints and measure conceptual agility.
                    </p>
                    <button
                      onClick={() => {
                        setTimerEnabled(true);
                        localStorage.setItem('quiz_timer_enabled', 'true');
                        // set default state for timeLeft
                        if (timerMode === 'question') {
                          setTimeLeft(timerValue);
                        } else {
                          setTimeLeft(timerValue);
                        }
                      }}
                      className="w-full bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 text-xs py-2 rounded-xl text-center cursor-pointer transition-colors"
                    >
                      Enable Timer
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Styled Digital Timer Panel */}
                    <div className="bg-slate-950/60 border border-slate-800/40 p-4 rounded-xl text-center space-y-1.5 relative overflow-hidden">
                      <span className="block text-[9px] font-mono font-semibold text-slate-500 tracking-wider uppercase">
                        {timerMode === 'question' ? 'Remaining time this question' : 'Remaining quiz session time'}
                      </span>
                      <div className={`text-2xl font-bold font-mono tracking-widest ${
                        timeLeft < (timerMode === 'question' ? timerValue * 0.2 : timerValue * 0.15)
                          ? 'text-rose-500 animate-pulse'
                          : timeLeft < (timerMode === 'question' ? timerValue * 0.5 : timerValue * 0.4)
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}>
                        {formatTime(timeLeft)}
                      </div>
                      
                      {/* Interactive Visual Bar */}
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            timeLeft < (timerMode === 'question' ? timerValue * 0.2 : timerValue * 0.15)
                              ? 'bg-rose-500'
                              : timeLeft < (timerMode === 'question' ? timerValue * 0.5 : timerValue * 0.4)
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(0, Math.min(100, (timeLeft / timerValue) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <button
                        onClick={() => setIsTimerPaused(!isTimerPaused)}
                        className={`py-1.5 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                          isTimerPaused
                            ? 'bg-amber-500/10 text-amber-450 border-amber-500/20 hover:bg-amber-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:text-white'
                        }`}
                      >
                        {isTimerPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={() => {
                          const confirmDisable = window.confirm('Are you sure you want to disable the countdown timer?');
                          if (confirmDisable) {
                            setTimerEnabled(false);
                            localStorage.setItem('quiz_timer_enabled', 'false');
                          }
                        }}
                        className="py-1.5 bg-slate-950 text-slate-500 border border-slate-900 hover:text-rose-450 hover:border-rose-550/10 rounded-lg text-center cursor-pointer transition-colors"
                      >
                        Disable Timer
                      </button>
                    </div>

                    {/* Switch Mode configuration when in run */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Mode: {timerMode === 'question' ? 'Question-wide' : 'Quiz-wide'}</span>
                      <button 
                        onClick={() => {
                          if (window.confirm('Restart timer with alternative mode? (This resets current question time)')) {
                            const newMode = timerMode === 'question' ? 'global' : 'question';
                            setTimerMode(newMode);
                            localStorage.setItem('quiz_timer_mode', newMode);
                            const newValue = newMode === 'question' ? 45 : 300;
                            setTimerValue(newValue);
                            localStorage.setItem('quiz_timer_value', String(newValue));
                            setTimeLeft(newValue);
                          }
                        }}
                        className="text-emerald-450 hover:underline cursor-pointer"
                      >
                        Switch Mode
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mini Tips badge */}
            <div className="bg-slate-900/50 border border-slate-900 p-4 rounded-xl space-y-1.5">
              <span className="font-mono text-[9px] text-emerald-400 font-extrabold tracking-widest uppercase flex items-center gap-1.5">
                <Sparkles size={10} />
                STUDY TIP
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Reviewing skipped coding questions helps solidify theoretical concepts without having to waste time writing trivial loops.
              </p>
            </div>

          </div>

        </div>
      ) : (
        /* Empty screen: User ready to generate first quiz */
        <div id="quiz_jumbotron_onboard" className="bg-slate-900/30 border border-slate-900 rounded-3xl py-14 px-6 text-center space-y-5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-80 w-80 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="max-w-md mx-auto space-y-4 relative z-10">
            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl">
              <BookOpen size={30} />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">No active quiz available</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unlock your daily cognitive test sequence to evaluate algorithmic complexities, data structures selection, and SDE knowledge.
              </p>
            </div>

            {/* Pre-configuration Timer Card */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-left space-y-4 max-w-sm mx-auto shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-emerald-400 animate-pulse" />
                  OA Simulation Mode (Optional)
                </span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={timerEnabled} 
                    onChange={(e) => {
                      setTimerEnabled(e.target.checked);
                      localStorage.setItem('quiz_timer_enabled', String(e.target.checked));
                    }}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-slate-950 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {timerEnabled ? (
                <div className="space-y-3.5 pt-3 border-t border-slate-900">
                  <div className="space-y-1.5 animate-fadeIn">
                    <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Timer Range Mode
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setTimerMode('question');
                          localStorage.setItem('quiz_timer_mode', 'question');
                          setTimerValue(45);
                          localStorage.setItem('quiz_timer_value', '45');
                        }}
                        className={`py-1.5 px-3 rounded-lg text-center text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          timerMode === 'question'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 border-slate-805/85 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Per Question
                      </button>
                      <button
                        onClick={() => {
                          setTimerMode('global');
                          localStorage.setItem('quiz_timer_mode', 'global');
                          setTimerValue(300);
                          localStorage.setItem('quiz_timer_value', '300');
                        }}
                        className={`py-1.5 px-3 rounded-lg text-center text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                          timerMode === 'global'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-900 border-slate-805/85 border-slate-805 border-slate-850/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        Global Board
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Time Constraints
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {timerMode === 'question' ? (
                        [30, 45, 60, 90].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTimerValue(t);
                              localStorage.setItem('quiz_timer_value', String(t));
                            }}
                            className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                              timerValue === t
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-slate-905 bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t}s
                          </button>
                        ))
                      ) : (
                        [180, 300, 600, 900].map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setTimerValue(t);
                              localStorage.setItem('quiz_timer_value', String(t));
                            }}
                            className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                              timerValue === t
                                ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                : 'bg-slate-905 bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            {t / 60}m
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-sans leading-relaxed pt-1.5 border-t border-slate-900">
                  Enable this to answer MCQ questions under pressure. Simulates actual LeetCode OA conditions.
                </p>
              )}
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={generating}
              className="bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs font-mono transition-transform hover:scale-102 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              {generating ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  Generating via Gemini...
                </>
              ) : (
                'Generate Revision Quiz'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Historic Quiz Attempts */}
      <div id="quiz_historic_grid" className="space-y-3.5 pt-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono px-1">
          Historic Revision Performance Logs
        </h3>

        {quizHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {quizHistory.map((historyItem, index) => {
              const dateStr = new Date(historyItem.takenAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              
              const scorePercent = Math.floor((historyItem.score / historyItem.totalQuestions) * 100);

              let badgeColor = "bg-rose-500/15 text-rose-450 text-rose-350 border-rose-500/20";
              if (scorePercent >= 80) {
                badgeColor = "bg-emerald-500/15 text-emerald-450 text-emerald-405 border-emerald-500/20";
              } else if (scorePercent >= 50) {
                badgeColor = "bg-amber-500/15 text-amber-450 text-amber-400 border-amber-500/20";
              }

              return (
                <div 
                  key={historyItem.quizId || index} 
                  className="bg-slate-900 border border-slate-800 p-4.5 rounded-xl space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-slate-400 font-medium flex items-center gap-1.5">
                      <Calendar size={13} />
                      {dateStr}
                    </span>
                    <span className={`px-2 py-0.5 border rounded-md text-[10px] font-mono font-bold ${badgeColor}`}>
                      {scorePercent}%
                    </span>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <span className="block text-[11px] font-semibold text-slate-100">
                      Score: {historyItem.score} / {historyItem.totalQuestions} Correct
                    </span>
                    
                    {/* Topics covered chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {historyItem.topicsCovered.map((topic, tIdx) => (
                        <span 
                          key={tIdx} 
                          className="bg-slate-950 text-slate-400 border border-slate-850 px-1.5 py-0.5 rounded text-[9px] font-mono"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-900/10 border border-slate-900/60 p-6 rounded-xl text-center text-xs text-slate-500 font-mono">
            No completed revision runs logged on this device yet. Complete a quiz to log analytics!
          </div>
        )}
      </div>

    </div>
  );
}

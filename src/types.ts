/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface LeetCodeStats {
  username: string;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  ranking: number;
  contributionPoints: number;
  reputation: number;
  topicBreakdown: { [topic: string]: number };
}

export interface SuggestedProblem {
  title: string;
  difficulty: Difficulty;
  topic: string;
  reason: string;
  estimatedMinutes: number;
  leetcodeUrl: string;
}

export interface SkippedProblem {
  title: string;
  difficulty: Difficulty;
  topic: string;
  reason: string;
}

export interface JobReadiness {
  targetRole: string;
  readinessPercentage: number;
  gaps: string[];
  missingConcepts: string[];
  requiredFocusLanguages: string[];
  industryBenchmarkEasy: number;
  industryBenchmarkMedium: number;
  industryBenchmarkHard: number;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  topic: string;
  difficulty: Difficulty;
  isCompleted: boolean;
  resourceSuggestion: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  phaseTitle: string;
  theme: string;
  estimatedWeeks: number;
  items: RoadmapItem[];
}

export interface LeetCodeAnalysis {
  analyzedUsername: string;
  targetRole: string;
  summary: string;
  visualMetrics: {
    algorithmicThinking: number; // 0-100
    implementationSpeed: number; // 0-100
    mathAndTheory: number; // 0-100
    systemFocus: number; // 0-100
    debuggingSkills: number; // 0-100
  };
  suggestedProblems: SuggestedProblem[];
  skippedProblems: SkippedProblem[];
  jobReadiness: JobReadiness;
  roadmap: RoadmapPhase[];
  updatedAt: string;
}

export interface DailyAlert {
  id: string;
  date: string; // ISO string or simple date
  title: string;
  problemName: string;
  difficulty: Difficulty;
  topic: string;
  leetcodeUrl: string;
  whyRecommended: string;
  isRead: boolean;
  simulatedTime: string;
}

export interface UserSession {
  userId: string;
  email: string;
  leetcodeUsername: string;
  targetRole: string;
  notificationsEnabled: boolean;
  dailyNotificationCount: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topic: string;
}

export interface QuizSession {
  quizId: string;
  questions: QuizQuestion[];
  userAnswers: { [questionId: string]: number };
  score: number;
  completed: boolean;
  takenAt: string;
}

export interface UserQuizHistory {
  quizId: string;
  takenAt: string;
  score: number;
  totalQuestions: number;
  topicsCovered: string[];
}

export interface DatabaseState {
  users: {
    [email: string]: {
      id: string;
      email: string;
      passwordHash: string; // Stored securely for mockup
      leetcodeUsername: string;
      targetRole: string;
      notificationsEnabled: boolean;
      createdAt: string;
      analysis: LeetCodeAnalysis | null;
      notifications: DailyAlert[];
      completedRoadmapIds: string[]; // List of roadmapItem.id completed
      quizHistory: UserQuizHistory[];
      activeQuiz: QuizSession | null;
    };
  };
}

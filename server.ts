/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
export default app;
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'database.json');

// Ensure database file exists with dummy state if empty or missing
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));
}

// Helper to read and write local database
function getDb() {
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return { users: {} };
  }
}

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

app.use(express.json());

// API: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper: Fetch LeetCode statistics with public GraphQL endpoint or vercel proxy.
// Fallback to beautiful, styled realistic profile statistics so recruiters can test any username
async function fetchLeetCodeStats(username: string): Promise<{ stats: any; isMocked: boolean }> {
  try {
    // Attempt standard verified public proxy API first for real statistics
    const response = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.totalSolved === 'number') {
        const stats = {
          username: username,
          totalSolved: data.totalSolved || 0,
          easySolved: data.easySolved || 0,
          mediumSolved: data.mediumSolved || 0,
          hardSolved: data.hardSolved || 0,
          ranking: data.ranking || 450000,
          contributionPoints: data.contributionPoints || 120,
          reputation: data.reputation || 15,
          topicBreakdown: data.topicBreakdown || {
            "Arrays": Math.floor((data.totalSolved || 150) * 0.35),
            "Strings": Math.floor((data.totalSolved || 150) * 0.20),
            "Hash Table": Math.floor((data.totalSolved || 150) * 0.15),
            "Dynamic Programming": Math.floor((data.totalSolved || 150) * 0.10)
          }
        };
        return { stats, isMocked: false };
      }
    }
  } catch (e) {
    console.warn(`Real leetcode count failed for: ${username}, using fallback generator.`);
  }

  // Graceful fallback for any profile or missing user so recruiters have an interactive experience
  const usernameHash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const total = Math.abs((usernameHash % 350) + 75); // Realistic count between 75 and 425
  const easy = Math.floor(total * 0.45);
  const medium = Math.floor(total * 0.42);
  const hard = total - (easy + medium);

  // Derive dynamic topics based on username seed
  const topics: { [key: string]: number } = {
    "Arrays": Math.floor(total * 0.35),
    "Two Pointers": Math.floor(total * 0.15),
    "Hash Table": Math.floor(total * 0.18),
    "Binary Search": Math.floor(total * 0.12),
    "Dynamic Programming": Math.floor(total * 0.08),
    "Graphs & DFS": Math.floor(total * 0.07),
    "Trees": Math.floor(total * 0.05)
  };

  const defaultStats = {
    username: username,
    totalSolved: total,
    easySolved: easy,
    mediumSolved: medium,
    hardSolved: hard,
    ranking: Math.floor(500000 - (total * 850) + (usernameHash % 10000)),
    contributionPoints: Math.floor(total * 1.5 + 40),
    reputation: Math.floor(total / 12 + 2),
    topicBreakdown: topics
  };

  return { stats: defaultStats, isMocked: true };
}

// Lazy load Gemini API
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      console.warn("GEMINI_API_KEY is not configured yet or has developer placeholder value.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// API: Register User
app.post('/api/auth/register', (req, res) => {
  const { email, password, leetcodeUsername, targetRole } = req.body;
  if (!email || !password || !leetcodeUsername || !targetRole) {
    return res.status(400).json({ error: 'All fields are strictly required.' });
  }

  const db = getDb();
  if (db.users[email.toLowerCase()]) {
    return res.status(400).json({ error: 'User is already registered with this email.' });
  }

  const id = 'usr_' + Math.random().toString(36).substring(2, 11);
  db.users[email.toLowerCase()] = {
    id,
    email: email.toLowerCase(),
    passwordHash: password, // Simplified secure placeholder for CV portfolio
    leetcodeUsername,
    targetRole,
    notificationsEnabled: true,
    createdAt: new Date().toISOString(),
    analysis: null,
    notifications: [],
    completedRoadmapIds: []
  };

  saveDb(db);
  res.json({
    success: true,
    user: {
      userId: id,
      email: email.toLowerCase(),
      leetcodeUsername,
      targetRole,
      notificationsEnabled: true,
      createdAt: new Date().toISOString()
    }
  });
});

// API: Login User
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  res.json({
    success: true,
    user: {
      userId: user.id,
      email: user.email,
      leetcodeUsername: user.leetcodeUsername,
      targetRole: user.targetRole,
      notificationsEnabled: user.notificationsEnabled,
      createdAt: user.createdAt,
      notificationCount: user.notifications.length,
      hasAnalysis: user.analysis !== null
    }
  });
});

// API: Get User Full Profile & Notifications
app.get('/api/user/:email', (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  res.json({
    id: user.id,
    email: user.email,
    leetcodeUsername: user.leetcodeUsername,
    targetRole: user.targetRole,
    notificationsEnabled: user.notificationsEnabled,
    createdAt: user.createdAt,
    analysis: user.analysis,
    notifications: user.notifications,
    completedRoadmapIds: user.completedRoadmapIds || []
  });
});

// API: Update User Profile Settings (Target Role / Notification Enable)
app.post('/api/user/:email/settings', (req, res) => {
  const { email } = req.params;
  const { targetRole, notificationsEnabled, leetcodeUsername } = req.body;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (targetRole) user.targetRole = targetRole;
  if (typeof notificationsEnabled === 'boolean') user.notificationsEnabled = notificationsEnabled;
  if (leetcodeUsername) user.leetcodeUsername = leetcodeUsername;

  saveDb(db);
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      targetRole: user.targetRole,
      notificationsEnabled: user.notificationsEnabled,
      leetcodeUsername: user.leetcodeUsername
    }
  });
});

// API: Check Roadmap Checkbox Step
app.post('/api/user/:email/roadmap/toggle', (req, res) => {
  const { email } = req.params;
  const { roadmapId } = req.body;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.completedRoadmapIds) {
    user.completedRoadmapIds = [];
  }

  const index = user.completedRoadmapIds.indexOf(roadmapId);
  if (index > -1) {
    user.completedRoadmapIds.splice(index, 1);
  } else {
    user.completedRoadmapIds.push(roadmapId);
  }

  saveDb(db);
  res.json({ success: true, completedRoadmapIds: user.completedRoadmapIds });
});

// API: Analyze LeetCode Username
app.post('/api/leetcode/analyze', async (req, res) => {
  const { username, targetRole, email } = req.body;
  if (!username || !targetRole) {
    return res.status(404).json({ error: 'Username and target role are required.' });
  }

  // 1. Fetch statistics
  const { stats, isMocked } = await fetchLeetCodeStats(username);

  // 2. Query Gemini to perform strategic study roadmap design
  const prompt = `Analyze a developer's LeetCode performance and readiness for a target job role.
  
  LeetCode statistics:
  - Username: ${stats.username}
  - Total Solved: ${stats.totalSolved} (Easy: ${stats.easySolved}, Medium: ${stats.mediumSolved}, Hard: ${stats.hardSolved})
  - Ranking: ${stats.ranking}
  - Dynamic Solver Profile (Topic distribution): ${JSON.stringify(stats.topicBreakdown)}
  
  Target Job Role: ${targetRole}
  
  Perform a deep knowledge auditing evaluation. Generate a fully-formatted response conforming to the strict LeetCodeAnalysis schema:
  
  1. A detailed high-level summary overview assessing their LeetCode patterns. Identify their strengths (e.g. strong on Arrays, but lagging on Graph / DP state transitions) and how it compares to target role expectations.
  
  2. Five visual metrics rating from 0 to 100 on:
     - algorithmicThinking (DFS, BFS, recursion, abstract model)
     - implementationSpeed (how fast they write standard patterns)
     - mathAndTheory (combinatorics, modulo math, prime factors)
     - systemFocus (how they model pointers, linked states, storage optimization)
     - debuggingSkills (covering Edge cases, duplicate arrays, negative index, overflow)
     
  3. Suggested NEXT 4 algorithmic questions they MUST solve to fill knowledge gaps. Specify realistic LeetCode titles, appropriate difficulty levels (Easy, Medium, or Hard), coordinate specific Leetcode URLs (e.g., https://leetcode.com/problems/climbing-stairs or other related real problem links), dynamic reasoning context, and estimated minutes to solve.
  
  4. Suggested 3 questions they DO NOT NEED TO SOLVE because their current statistics suggest they could easily tackle them in under 10 minutes. This saves them from repetitive simple solving.
  
  5. Job readiness alignment card, estimating how close they are to passing technical interviews for ${targetRole} as a percentage. Specify 3 key structural knowledge gaps, missing concepts (e.g., Trie, Segment Tree, Dijkstra, Monotonic Queue), required focal languages (e.g., C++, TypeScript, Java), and industry-standard baseline solved counts for this job role (benchmark numbers: e.g. FAANG expects 30+ Easy, 150+ Medium, 40+ Hard, Frontend SDE expects less Hard but heavy string/array/promise manipulation).
  
  6. A bespoke gap-filling roadmap structured in 3 sequential phases (Phase 1, Phase 2, Phase 3), including weeks estimated and 3 distinct actionable roadmap items inside each phase. Each roadmap item should contain a unique string id (e.g. rd_1, rd_2, ...), title, topic, difficulty, resourceSuggestion, and isCompleted set to false.`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["analyzedUsername", "targetRole", "summary", "visualMetrics", "suggestedProblems", "skippedProblems", "jobReadiness", "roadmap", "updatedAt"],
          properties: {
            analyzedUsername: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            summary: { type: Type.STRING },
            visualMetrics: {
              type: Type.OBJECT,
              required: ["algorithmicThinking", "implementationSpeed", "mathAndTheory", "systemFocus", "debuggingSkills"],
              properties: {
                algorithmicThinking: { type: Type.INTEGER },
                implementationSpeed: { type: Type.INTEGER },
                mathAndTheory: { type: Type.INTEGER },
                systemFocus: { type: Type.INTEGER },
                debuggingSkills: { type: Type.INTEGER }
              }
            },
            suggestedProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "difficulty", "topic", "reason", "estimatedMinutes", "leetcodeUrl"],
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  leetcodeUrl: { type: Type.STRING }
                }
              }
            },
            skippedProblems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "difficulty", "topic", "reason"],
                properties: {
                  title: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            jobReadiness: {
              type: Type.OBJECT,
              required: ["targetRole", "readinessPercentage", "gaps", "missingConcepts", "requiredFocusLanguages", "industryBenchmarkEasy", "industryBenchmarkMedium", "industryBenchmarkHard"],
              properties: {
                targetRole: { type: Type.STRING },
                readinessPercentage: { type: Type.INTEGER },
                gaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                requiredFocusLanguages: { type: Type.ARRAY, items: { type: Type.STRING } },
                industryBenchmarkEasy: { type: Type.INTEGER },
                industryBenchmarkMedium: { type: Type.INTEGER },
                industryBenchmarkHard: { type: Type.INTEGER }
              }
            },
            roadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["phaseNumber", "phaseTitle", "theme", "estimatedWeeks", "items"],
                properties: {
                  phaseNumber: { type: Type.INTEGER },
                  phaseTitle: { type: Type.STRING },
                  theme: { type: Type.STRING },
                  estimatedWeeks: { type: Type.INTEGER },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["id", "title", "description", "topic", "difficulty", "isCompleted", "resourceSuggestion"],
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        difficulty: { type: Type.STRING },
                        isCompleted: { type: Type.BOOLEAN },
                        resourceSuggestion: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            updatedAt: { type: Type.STRING }
          }
        }
      }
    });

    const parsedAnalysis = JSON.parse(response.text.trim());

    // If an email is supplied, persist this analysis directly to their local user database folder.
    if (email) {
      const db = getDb();
      const user = db.users[email.toLowerCase()];
      if (user) {
        user.analysis = parsedAnalysis;
        // Seed first alert if none exists
        if (user.notifications.length === 0 && parsedAnalysis.suggestedProblems.length > 0) {
          const firstProb = parsedAnalysis.suggestedProblems[0];
          user.notifications.push({
            id: 'nt_' + Math.random().toString(36).substring(2, 9),
            date: new Date().toLocaleDateString(),
            title: '🎯 Daily Solves Recommendation Activated',
            problemName: firstProb.title,
            difficulty: firstProb.difficulty,
            topic: firstProb.topic,
            leetcodeUrl: firstProb.leetcodeUrl,
            whyRecommended: `Your daily sync recommended ${firstProb.title} today based on your custom ${targetRole} roadmap gaps.`,
            isRead: false,
            simulatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
        saveDb(db);
      }
    }

    res.json({
      success: true,
      stats,
      analysis: parsedAnalysis,
      isMockedStats: isMocked
    });

  } catch (error) {
    console.error('Gemini LeetCode Analysis error:', error);
    res.status(500).json({
      error: 'Failed to perform AI analysis. Please verify your GEMINI_API_KEY in secrets.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// API: Simulate a Daily Alert (Triggers a new problem recommendation alert)
app.post('/api/user/:email/simulate-daily', async (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'Registered user not found.' });
  }

  const targetRole = user.targetRole;
  const analysis = user.analysis;

  // Let's dynamically synthesize a new recommended problem targeting their knowledge gaps!
  let title = 'Rotate Image';
  let difficulty = 'Medium';
  let topic = 'Matrices & Grid';
  let leetcodeUrl = 'https://leetcode.com/problems/rotate-image';
  let why = 'Recommended to hone multi-dimensional array indices manipulation & in-place space optimization.';

  if (analysis) {
    // Rely on actual topics in our gap roadmap
    const uncompleted = analysis.roadmap
      .flatMap((phase: any) => phase.items)
      .filter((i: any) => !user.completedRoadmapIds?.includes(i.id));

    if (uncompleted.length > 0) {
      // Pick next uncompleted roadmap item dynamically!
      const nextMock = uncompleted[Math.floor(Math.random() * uncompleted.length)];
      title = nextMock.title;
      difficulty = nextMock.difficulty;
      topic = nextMock.topic;
      leetcodeUrl = `https://leetcode.com/problems/${nextMock.title.toLowerCase().replace(/\s+/g, '-')}`;
      why = `Selected dynamically from Phase gaps list: ${nextMock.description}. Focusing on ${nextMock.topic}.`;
    } else if (analysis.suggestedProblems.length > 0) {
      const fallbackSuggestion = analysis.suggestedProblems[Math.floor(Math.random() * analysis.suggestedProblems.length)];
      title = fallbackSuggestion.title;
      difficulty = fallbackSuggestion.difficulty;
      topic = fallbackSuggestion.topic;
      leetcodeUrl = fallbackSuggestion.leetcodeUrl;
      why = fallbackSuggestion.reason;
    }
  }

  const alertId = 'nt_' + Math.random().toString(36).substring(2, 9);
  const newAlert = {
    id: alertId,
    date: new Date().toLocaleDateString(),
    title: '⏰ Daily Goal Recommendation',
    problemName: title,
    difficulty,
    topic,
    leetcodeUrl,
    whyRecommended: why,
    isRead: false,
    simulatedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  user.notifications.unshift(newAlert);
  saveDb(db);

  res.json({
    success: true,
    newAlert,
    isNotificationEnabled: user.notificationsEnabled,
    totalNotifications: user.notifications.length
  });
});

// API: Mark Notification as Read
app.post('/api/user/:email/notifications/read', (req, res) => {
  const { email } = req.params;
  const { alertId } = req.body;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.notifications = user.notifications.map((notif: any) => {
    if (notif.id === alertId) {
      return { ...notif, isRead: true };
    }
    return notif;
  });

  saveDb(db);
  res.json({ success: true, notifications: user.notifications });
});

// API: Clear notifications
app.post('/api/user/:email/notifications/clear', (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.notifications = [];
  saveDb(db);
  res.json({ success: true, notifications: [] });
});

// API: Get active quiz and history
app.get('/api/user/:email/quiz', (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.quizHistory) user.quizHistory = [];
  if (!user.activeQuiz) user.activeQuiz = null;

  res.json({
    activeQuiz: user.activeQuiz,
    quizHistory: user.quizHistory
  });
});

// API: Generate daily quiz
app.post('/api/user/:email/quiz/generate', async (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.quizHistory) user.quizHistory = [];

  // Determine mastered topics
  const masteredTopics: string[] = [];
  if (user.analysis) {
    if (user.analysis.skippedProblems && user.analysis.skippedProblems.length > 0) {
      user.analysis.skippedProblems.forEach((p: any) => {
        if (p.topic && !masteredTopics.includes(p.topic)) {
          masteredTopics.push(p.topic);
        }
      });
    }
    if (user.analysis.roadmap) {
       user.analysis.roadmap.forEach((phase: any) => {
         phase.items.forEach((item: any) => {
           if (item.topic && !masteredTopics.includes(item.topic)) {
             masteredTopics.push(item.topic);
           }
         });
       });
    }
  }

  if (masteredTopics.length === 0) {
    masteredTopics.push('Arrays', 'Hash Table', 'Two Pointers', 'Binary Search', 'Strings', 'Dynamic Programming');
  }

  const uniqueTopics = Array.from(new Set(masteredTopics)).slice(0, 5);
  const masteredTopicsStr = uniqueTopics.join(', ');

  const quizId = 'qz_' + Math.random().toString(36).substring(2, 9);
  let questions: any[] = [];
  let isAiGenerated = false;

  try {
    const ai = getGeminiClient();
    const prompt = `Generate a high-quality daily revision quiz for a Software Development Engineer. 
The quiz must consist of EXACTLY 10 multiple-choice questions (MCQs) designed to test deep concept mastery, algorithmic trade-offs, optimization techniques, and complexity analysis.
The questions must be based on these mastered/practiced topics: ${masteredTopicsStr}.

Conform strictly to this JSON format (array of 10 objects):
[
  {
    "id": "q_1",
    "topic": "Topic Name",
    "question": "Clear and rigorous question assessing deep understanding of the topic?",
    "options": [
      "Option A value",
      "Option B value",
      "Option C value",
      "Option D value"
    ],
    "correctOptionIndex": 0,
    "explanation": "High-quality detailed explanation on why this is the correct choice and revision takeaway."
  },
  ...
]`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            required: ["id", "topic", "question", "options", "correctOptionIndex", "explanation"],
            properties: {
              id: { type: Type.STRING },
              topic: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctOptionIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response && response.text) {
      questions = JSON.parse(response.text.trim());
      questions = questions.map((q: any, idx: number) => ({ ...q, id: `q_${idx + 1}` }));
      isAiGenerated = true;
    }
  } catch (err) {
    console.warn("Quiz generation with Gemini failed or is rate-limited. Serving fallback revision dataset.");
  }

  // Fallback if not generated successfully or empty
  if (!questions || questions.length < 10) {
    questions = [
      {
        id: "q_1",
        topic: "Hash Table",
        question: "What is the average-case time complexity of look-ups in a Hash Table, and what is the worst-case complexity if many key collisions occur under separate chaining?",
        options: [
          "Average O(1), Worst O(N)",
          "Average O(log N), Worst O(1)",
          "Average O(1), Worst O(log N)",
          "Average O(N), Worst O(N^2)"
        ],
        correctOptionIndex: 0,
        explanation: "On average, hash tables offer constant O(1) lookup. However, if collisions map items to the same bucket (forming linked lists), lookup degrades to O(N)."
      },
      {
        id: "q_2",
        topic: "Arrays",
        question: "Which of the following operations on a dynamic array has a worst-case time complexity of O(N)?",
        options: [
          "Appending an element at the end (amortized)",
          "Accessing an element at a specific index",
          "Inserting an element at the beginning of the array",
          "Updating the value of an existing element"
        ],
        correctOptionIndex: 2,
        explanation: "Inserting at the beginning requires shifting all existing N elements one position to the right, which takes linear O(N) time."
      },
      {
        id: "q_3",
        topic: "Two Pointers",
        question: "When using the two-pointer technique to solve the 'Two Sum II' problem on an ascending-sorted array, what pointer adjustment should be made if the current sum is LESS than the target?",
        options: [
          "Decrement the right pointer",
          "Increment the left pointer",
          "Increment both pointers simultaneously",
          "Decrement both pointers simultaneously"
        ],
        correctOptionIndex: 1,
        explanation: "Since the array is sorted, standard two-pointer sliding tells us that incrementing the left pointer will result in a larger sum, moving us closer to the target."
      },
      {
        id: "q_4",
        topic: "Binary Search",
        question: "What is the key prerequisite for applying classical binary search to an array, and what is its worst-case space complexity when implemented iteratively?",
        options: [
          "The array must be sorted; space complexity is O(1)",
          "The array must be unsorted; space complexity is O(log N)",
          "The array must contain unique values; space complexity is O(1)",
          "The array must be sorted; space complexity is O(log N)"
        ],
        correctOptionIndex: 0,
        explanation: "Binary search strictly requires a sorted array to draw logical elimination bounds. Iterative implementations only track boundary variables, yielding O(1) space."
      },
      {
        id: "q_5",
        topic: "Strings",
        question: "In JavaScript/TypeScript, strings are immutable. What is the time complexity of repeatedly appending a single character N times to a string in a naive loop?",
        options: [
          "O(N)",
          "O(N log N)",
          "O(1)",
          "O(N^2)"
        ],
        correctOptionIndex: 3,
        explanation: "Since strings are immutable, concatenation copy-recreates strings. Appending N times creates strings of size 1, 2, ..., N which takes quadratic O(N^2) time overall."
      },
      {
        id: "q_6",
        topic: "Dynamic Programming",
        question: "What is the core conceptual difference between Memoization (Top-Down) and Tabulation (Bottom-Up)?",
        options: [
          "Memoization is iterative, Tabulation is recursive",
          "Memoization is recursive and avoids call stack overhead, Tabulation uses recursive memo buffers",
          "Memoization is recursion-based caching, while Tabulation solves smaller subproblems iteratively in a table",
          "Memoization has O(N^2) memory constraints, while Tabulation requires O(1) space always"
        ],
        correctOptionIndex: 2,
        explanation: "Memoization starts from the goal state and recursively retrieves cached subproblem results. Tabulation solves simple subproblems first and iteratively populates a state grid."
      },
      {
        id: "q_7",
        topic: "Arrays",
        question: "In an array representation of a binary tree (zero-based index), for a parent node located at index i, what is the array index of its left child?",
        options: [
          "2 * i + 1",
          "2 * i + 2",
          "floor((i - 1) / 2)",
          "i * 2"
        ],
        correctOptionIndex: 0,
        explanation: "Standard binary heap array index mapping locates the left child of node i at 2 * i + 1, and the right child at 2 * i + 2."
      },
      {
        id: "q_8",
        topic: "Two Pointers",
        question: "Which algorithm uses two pointers moving at different speeds ('fast' and 'slow') to detect a cycle inside a singly linked list?",
        options: [
          "Dijkstra's Shortest Path Algorithm",
          "Floyd's Cycle-Finding (Hare and Tortoise)",
          "Kadane's Sliding Window Array Sum",
          "Kruskal's Minimal Spanning Pointer"
        ],
        correctOptionIndex: 1,
        explanation: "Floyd's Tortoise and Hare algorithm runs two pointers inside a list. If a cycle exists, the fast pointer will loop and overlap with the slow pointer."
      },
      {
        id: "q_9",
        topic: "Hash Table",
        question: "When using linear probing in open-addressed hash tables, what is the term used to describe clusters of adjacent occupied slots that increase lookup costs?",
        options: [
          "Primary clustering",
          "Secondary hashing block",
          "Separate chain chaining",
          "Exponential overflow degrade"
        ],
        correctOptionIndex: 0,
        explanation: "Primary clustering occurs when keys collide in close proximity, creating block groups. New keys hashing into any area of this cluster lengthen probing trails."
      },
      {
        id: "q_10",
        topic: "Binary Search",
        question: "When applying binary search over a rotated sorted array to find a target value, what logic adjustment lets you decide which direction to jump?",
        options: [
          "Un-rotate the array first in O(N)",
          "Determine which half of the array bounds is sorted, and check if the target lies within its sorted boundaries",
          "Perform a linear search on odd indices only",
          "Just check if the target is larger than standard middle key"
        ],
        correctOptionIndex: 1,
        explanation: "In any rotated sorted array split, at least one half is guaranteed to be perfectly sorted. Checking bounds alignment lets you narrow search boundaries in O(log N)."
      }
    ];
  }

  const newQuiz = {
    quizId,
    questions,
    userAnswers: {},
    score: 0,
    completed: false,
    takenAt: new Date().toISOString()
  };

  user.activeQuiz = newQuiz;
  saveDb(db);

  res.json({
    success: true,
    activeQuiz: newQuiz,
    isAiGenerated
  });
});

// API: Submit active quiz
app.post('/api/user/:email/quiz/submit', (req, res) => {
  const { email } = req.params;
  const { userAnswers } = req.body;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.activeQuiz) {
    return res.status(400).json({ error: 'No active quiz session found' });
  }

  const quiz = user.activeQuiz;
  let correctCount = 0;
  quiz.questions.forEach((q: any) => {
    const userAnswer = userAnswers[q.id];
    if (userAnswer === q.correctOptionIndex) {
      correctCount++;
    }
  });

  quiz.userAnswers = userAnswers;
  quiz.score = correctCount;
  quiz.completed = true;

  const topics: string[] = Array.from(new Set(quiz.questions.map((q: any) => q.topic)));

  if (!user.quizHistory) user.quizHistory = [];
  user.quizHistory.unshift({
    quizId: quiz.quizId,
    takenAt: quiz.takenAt,
    score: correctCount,
    totalQuestions: quiz.questions.length,
    topicsCovered: topics
  });

  user.activeQuiz = quiz;
  saveDb(db);

  res.json({
    success: true,
    activeQuiz: quiz,
    quizHistory: user.quizHistory
  });
});

// API: Reset active quiz
app.post('/api/user/:email/quiz/reset', (req, res) => {
  const { email } = req.params;
  const db = getDb();
  const user = db.users[email?.toLowerCase()];

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.activeQuiz = null;
  saveDb(db);

  res.json({
    success: true,
    activeQuiz: null
  });
});

// Vite middleware flow or Production Static delivery
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LeetCode Analysis Server running on port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

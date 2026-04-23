import { GoogleGenerativeAI } from '@google/generative-ai';
import MockInterview from '../models/MockInterview.js';

// Start a new mock interview session
export const startInterview = async (req, res) => {
  try {
    const { company, role, interviewType, difficulty } = req.body;

    if (!company || !role || !interviewType) {
      return res.status(400).json({ message: 'Company, role, and interview type are required' });
    }

    // Generate the first AI question
    const apiKey = process.env.GEMINI_API_KEY;
    let firstQuestion = '';

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a ${interviewType} interviewer at ${company} for the role of ${role}. 
Difficulty level: ${difficulty || 'medium'}.

Start the interview with a brief, welcoming introduction (1-2 sentences) and then ask your FIRST interview question.

Guidelines:
- For "technical": Ask a coding, DSA, or system concept question appropriate for the role.
- For "behavioral": Ask a STAR-format behavioral question (e.g., "Tell me about a time when...").
- For "system-design": Ask a system design question (e.g., "How would you design...").
- For "hr": Ask an HR/culture-fit question (e.g., "Why do you want to join...").

IMPORTANT: Be creative and pick a unique, interesting question. Do NOT use generic textbook questions.
Keep it natural and conversational. Do NOT provide any answer hints.`;

        const result = await model.generateContent(prompt);
        firstQuestion = result.response.text();
      } catch (aiError) {
        console.error('Gemini error in mock interview start:', aiError.message);
        firstQuestion = getFallbackQuestion(interviewType, company, role);
      }
    } else {
      firstQuestion = getFallbackQuestion(interviewType, company, role);
    }

    // Create the interview session
    const interview = new MockInterview({
      userId: req.userId,
      company,
      role,
      interviewType,
      difficulty: difficulty || 'medium',
      messages: [{ role: 'ai', content: firstQuestion }],
      questionsAsked: 1,
    });

    await interview.save();

    res.status(201).json({
      interviewId: interview._id,
      message: firstQuestion,
      status: 'active',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Send a response and get AI follow-up
export const respondToInterview = async (req, res) => {
  try {
    const { interviewId, response } = req.body;

    if (!interviewId || !response) {
      return res.status(400).json({ message: 'Interview ID and response are required' });
    }

    const interview = await MockInterview.findOne({
      _id: interviewId,
      userId: req.userId,
      status: 'active',
    });

    if (!interview) {
      return res.status(404).json({ message: 'Active interview session not found' });
    }

    // Add user's response
    interview.messages.push({ role: 'user', content: response });

    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponse = '';
    let feedbackForAnswer = null;

    // Check if we should end the interview (after 5-6 questions)
    const shouldEnd = interview.questionsAsked >= 5;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build conversation history for context
        const conversationHistory = interview.messages.map(m =>
          `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`
        ).join('\n\n');

        if (shouldEnd) {
          // Generate final feedback
          const prompt = `You are a ${interview.interviewType} interviewer at ${interview.company} for the role of ${interview.role}.

Here is the full interview conversation:
${conversationHistory}

The interview is now over. Do these things:
1. EVALUATE the candidate's LAST answer for correctness — point out any factual errors or wrong concepts. If the answer is wrong, explain what the correct answer should be.
2. Give a brief closing remark thanking the candidate.
3. Then provide a JSON block (wrapped in \`\`\`json\`\`\` fences) with these fields:
   - "totalScore": number 0-100 (be strict — if answers were incorrect, score should reflect that)
   - "summary": string (2-3 sentences overall feedback mentioning how many answers were correct vs incorrect)
   - "strongAreas": array of strings
   - "improvementAreas": array of strings
   - "recommendation": string ("Strong Hire", "Hire", "Lean Hire", "No Hire", "Strong No Hire")
   - "answerFeedback": object with "score" (0-10), "isCorrect" (boolean), "correctAnswer" (string, only if wrong), "strengths" (array), "improvements" (array) — for this last answer specifically

First write your feedback and closing message, then add the JSON block.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();

          // Extract closing message and JSON
          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            aiResponse = text.replace(/```json[\s\S]*?```/, '').trim();
            try {
              const parsed = JSON.parse(jsonMatch[1]);
              interview.overallFeedback = {
                totalScore: parsed.totalScore || 0,
                summary: parsed.summary || '',
                strongAreas: parsed.strongAreas || [],
                improvementAreas: parsed.improvementAreas || [],
                recommendation: parsed.recommendation || 'N/A',
              };
              feedbackForAnswer = parsed.answerFeedback || null;
            } catch (e) {
              console.error('Failed to parse interview feedback JSON:', e.message);
            }
          } else {
            aiResponse = text;
          }

          interview.status = 'completed';
          interview.completedAt = new Date();
        } else {
          // Extract all AI questions asked so far to prevent repetition
          const previousQuestions = interview.messages
            .filter(m => m.role === 'ai')
            .map(m => m.content)
            .join('\n---\n');

          // Evaluate the answer and ask the next question
          const prompt = `You are a ${interview.interviewType} interviewer at ${interview.company} for the role of ${interview.role}.
This is question #${interview.questionsAsked + 1} out of 5.

Here is the conversation so far:
${conversationHistory}

=== QUESTIONS YOU HAVE ALREADY ASKED (DO NOT REPEAT ANY OF THESE) ===
${previousQuestions}
=== END OF PREVIOUS QUESTIONS ===

Do these things:
1. CAREFULLY EVALUATE the candidate's last answer for CORRECTNESS:
   - Check if the answer is factually accurate and technically correct.
   - If the answer contains mistakes, wrong concepts, or incorrect information, clearly point out what is WRONG and explain the correct answer.
   - If the answer is correct but incomplete, mention what is missing.
   - If the answer is fully correct, acknowledge that specifically.
   - Give 2-3 sentences of constructive feedback.
2. Then ask the NEXT interview question. It MUST be a completely NEW and DIFFERENT question — never repeat or rephrase a question you already asked above. Make it progressively harder and cover a DIFFERENT topic/concept than all previous questions.

Also, at the very end, add a JSON block (wrapped in \`\`\`json\`\`\` fences) with this structure for the candidate's last answer:
{
  "score": <number 0-10>,
  "isCorrect": <boolean — true if the core answer is factually correct, false if it contains errors>,
  "correctAnswer": <string — only include if isCorrect is false, briefly state the correct answer>,
  "strengths": [<array of strings>],
  "improvements": [<array of strings>]
}

Write your conversational response first, then add the JSON block.`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();

          const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            aiResponse = text.replace(/```json[\s\S]*?```/, '').trim();
            try {
              feedbackForAnswer = JSON.parse(jsonMatch[1]);
            } catch (e) {
              console.error('Failed to parse answer feedback JSON:', e.message);
            }
          } else {
            aiResponse = text;
          }

          interview.questionsAsked += 1;
        }
      } catch (aiError) {
        console.error('Gemini error in mock interview respond:', aiError.message);
        aiResponse = shouldEnd
          ? 'Thank you for your time. The interview is now complete.'
          : getFallbackFollowUp(interview.interviewType, interview.questionsAsked, interview._id);
        if (shouldEnd) {
          interview.status = 'completed';
          interview.completedAt = new Date();
          // Generate fallback feedback from per-answer scores collected so far
          interview.overallFeedback = generateFallbackFeedback(interview);
        } else {
          interview.questionsAsked += 1;
        }
      }
    } else {
      aiResponse = shouldEnd
        ? 'Thank you for completing this mock interview session! (AI feedback unavailable — configure GEMINI_API_KEY for detailed analysis.)'
        : getFallbackFollowUp(interview.interviewType, interview.questionsAsked, interview._id);
      if (shouldEnd) {
        interview.status = 'completed';
        interview.completedAt = new Date();
        // Generate fallback feedback from per-answer scores collected so far
        interview.overallFeedback = generateFallbackFeedback(interview);
      } else {
        interview.questionsAsked += 1;
      }
    }

    // Update the last user message with feedback if available
    if (feedbackForAnswer) {
      const lastUserMsg = interview.messages[interview.messages.length - 1];
      lastUserMsg.feedback = feedbackForAnswer;
    }

    // Add AI response
    interview.messages.push({ role: 'ai', content: aiResponse });

    await interview.save();

    res.json({
      interviewId: interview._id,
      message: aiResponse,
      feedback: feedbackForAnswer,
      status: interview.status,
      questionsAsked: interview.questionsAsked,
      overallFeedback: interview.status === 'completed' ? interview.overallFeedback : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// End an interview early
export const endInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await MockInterview.findOne({
      _id: interviewId,
      userId: req.userId,
      status: 'active',
    });

    if (!interview) {
      return res.status(404).json({ message: 'Active interview session not found' });
    }

    interview.status = 'completed';
    interview.completedAt = new Date();

    // Try to generate overall feedback from Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && interview.messages.length > 2) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const conversationHistory = interview.messages.map(m =>
          `${m.role === 'ai' ? 'Interviewer' : 'Candidate'}: ${m.content}`
        ).join('\n\n');

        const prompt = `Based on this partial ${interview.interviewType} interview at ${interview.company} for ${interview.role}:

${conversationHistory}

Provide a JSON response (no markdown fences, just pure JSON) with:
- "totalScore": number 0-100
- "summary": string (2-3 sentences)
- "strongAreas": array of strings
- "improvementAreas": array of strings
- "recommendation": string ("Strong Hire", "Hire", "Lean Hire", "No Hire", "Strong No Hire")

Note: The interview was ended early, so provide feedback only on what was discussed.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        if (text.startsWith('```')) {
          text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        const parsed = JSON.parse(text);
        interview.overallFeedback = {
          totalScore: parsed.totalScore || 0,
          summary: parsed.summary || '',
          strongAreas: parsed.strongAreas || [],
          improvementAreas: parsed.improvementAreas || [],
          recommendation: parsed.recommendation || 'N/A',
        };
      } catch (e) {
        console.error('Failed to generate end-interview feedback:', e.message);
        interview.overallFeedback = generateFallbackFeedback(interview);
      }
    } else {
      interview.overallFeedback = generateFallbackFeedback(interview);
    }

    await interview.save();

    res.json({
      message: 'Interview ended',
      status: 'completed',
      overallFeedback: interview.overallFeedback || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get interview history
export const getInterviewHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await MockInterview.countDocuments({ userId: req.userId });

    const interviews = await MockInterview.find({ userId: req.userId })
      .select('company role interviewType difficulty status questionsAsked overallFeedback startedAt completedAt')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      interviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single interview session with full messages
export const getInterviewById = async (req, res) => {
  try {
    const interview = await MockInterview.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Generate fallback feedback when Gemini is unavailable
// Computes overall score from any per-answer feedback scores
function generateFallbackFeedback(interview) {
  const userMessages = interview.messages.filter(m => m.role === 'user');
  const answeredCount = userMessages.length;

  // Collect per-answer scores if any were given
  const scores = userMessages
    .filter(m => m.feedback && m.feedback.score != null)
    .map(m => m.feedback.score);

  let totalScore = 0;
  if (scores.length > 0) {
    // Average of per-answer scores (out of 10), scaled to 100
    totalScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10);
  } else {
    // No per-answer scores available, give a base score based on participation
    totalScore = Math.min(answeredCount * 12, 60); // Up to 60 for just participating
  }

  const correctCount = userMessages.filter(m => m.feedback?.isCorrect === true).length;
  const incorrectCount = userMessages.filter(m => m.feedback?.isCorrect === false).length;

  let recommendation = 'N/A';
  if (totalScore >= 80) recommendation = 'Hire';
  else if (totalScore >= 60) recommendation = 'Lean Hire';
  else if (totalScore >= 40) recommendation = 'No Hire';
  else recommendation = 'Strong No Hire';

  return {
    totalScore,
    summary: `You answered ${answeredCount} questions. ${correctCount > 0 ? `${correctCount} were correct` : ''}${incorrectCount > 0 ? `${correctCount > 0 ? ' and ' : ''}${incorrectCount} had errors` : ''}. AI-powered detailed analysis was unavailable for this session.`,
    strongAreas: scores.length > 0
      ? scores.filter(s => s >= 7).length > 0 ? ['Good participation', 'Attempted all questions'] : ['Completed the interview']
      : ['Completed the interview'],
    improvementAreas: ['Try again with AI enabled for detailed feedback'],
    recommendation,
  };
}

// Fallback questions when Gemini is unavailable
function getFallbackQuestion(type, company, role) {
  // Multiple opener questions per type — pick one randomly
  const openers = {
    technical: [
      `Welcome to this mock technical interview at ${company} for the ${role} position! Let's begin.\n\nCan you explain the difference between a stack and a queue? When would you use one over the other?`,
      `Welcome to this mock technical interview at ${company} for the ${role} position!\n\nWhat is a hash map and how does it handle collisions? Can you describe at least two collision resolution strategies?`,
      `Welcome to this mock technical interview at ${company} for the ${role} position!\n\nExplain the concept of recursion. Can you walk me through how you'd solve the Fibonacci sequence both recursively and iteratively?`,
      `Welcome to this mock technical interview at ${company} for the ${role} position!\n\nWhat are the differences between BFS and DFS? In what scenarios would you prefer one over the other?`,
    ],
    behavioral: [
      `Welcome to this behavioral interview at ${company} for the ${role} position!\n\nTell me about a time when you faced a significant challenge in a project. How did you handle it and what was the outcome?`,
      `Welcome to this behavioral interview at ${company} for the ${role} position!\n\nDescribe a situation where you had to convince your team to adopt a different approach. What was your strategy?`,
      `Welcome to this behavioral interview at ${company} for the ${role} position!\n\nTell me about a time you took ownership of something beyond your assigned responsibilities.`,
      `Welcome to this behavioral interview at ${company} for the ${role} position!\n\nCan you share an experience where you received critical feedback? How did you respond?`,
    ],
    'system-design': [
      `Welcome to the system design round at ${company} for the ${role} position!\n\nHow would you design a URL shortening service like bit.ly? Walk me through the high-level architecture.`,
      `Welcome to the system design round at ${company} for the ${role} position!\n\nHow would you design a real-time collaborative document editor like Google Docs?`,
      `Welcome to the system design round at ${company} for the ${role} position!\n\nDesign a scalable news feed system like Instagram or Twitter. What are the key components?`,
      `Welcome to the system design round at ${company} for the ${role} position!\n\nHow would you design an online code judge like LeetCode? Walk me through your approach.`,
    ],
    hr: [
      `Welcome to the HR round at ${company} for the ${role} position!\n\nTell me about yourself and why you're interested in working at ${company}.`,
      `Welcome to the HR round at ${company} for the ${role} position!\n\nWhat motivates you in your career and how does this role align with your goals?`,
      `Welcome to the HR round at ${company} for the ${role} position!\n\nHow do you define success in a professional setting? Give me an example from your experience.`,
      `Welcome to the HR round at ${company} for the ${role} position!\n\nWhat do you know about ${company}'s culture and values? How do they resonate with you?`,
    ],
  };
  const pool = openers[type] || openers.technical;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Large pool of unique follow-up questions per type — randomly picked without repeats
const FOLLOW_UP_POOLS = {
  technical: [
    'Can you explain what time complexity is and analyze the complexity of a binary search?',
    'How would you implement a LRU Cache? What data structures would you use?',
    'Can you explain the difference between SQL and NoSQL databases? When would you choose one over the other?',
    'Tell me about REST APIs. How would you design an API for a social media application?',
    'What is the CAP theorem and how does it apply to distributed systems?',
    'Explain the concept of dynamic programming. Can you solve the 0/1 Knapsack problem?',
    'What is the difference between a process and a thread? How does multithreading work?',
    'Explain how a B-Tree works and why databases use it for indexing.',
    'How does garbage collection work in languages like Java or JavaScript?',
    'What is event-driven architecture? How does Node.js use it?',
    'Explain the difference between TCP and UDP. When would you use each?',
    'How would you detect a cycle in a linked list? Explain multiple approaches.',
    'What are design patterns? Explain the Singleton and Observer patterns with examples.',
    'How does HTTPS work? Walk me through the TLS handshake.',
    'Explain the difference between horizontal and vertical scaling. When would you use each?',
    'What is memoization and how is it different from tabulation in dynamic programming?',
    'Explain how a heap data structure works. What are its common use cases?',
    'What is the difference between optimistic and pessimistic locking in databases?',
    'Explain the concept of consistent hashing. Where is it used?',
    'What is a trie data structure? When would you prefer it over a hash map?',
  ],
  behavioral: [
    'Tell me about a time you had to work with a difficult team member.',
    'Can you describe a situation where you had to learn a new technology quickly?',
    'Tell me about a time you failed at something. What did you learn?',
    'Describe a situation where you had to make a tough decision with limited information.',
    'Where do you see yourself in 5 years?',
    'Tell me about a time you went above and beyond for a project.',
    'Describe a conflict you had with a manager or senior. How did you resolve it?',
    'Have you ever had to prioritize between multiple urgent tasks? How did you decide?',
    'Tell me about a time you mentored or helped a teammate grow.',
    'Describe a situation where you had to adapt to a major change at work.',
    'Tell me about your most impactful project. What made it special?',
    'Have you ever disagreed with a technical decision? What did you do?',
    'Describe a time you had to communicate a complex idea to a non-technical person.',
    'Tell me about a time you identified and fixed a problem before it became critical.',
    'How do you handle feedback that you disagree with?',
  ],
  'system-design': [
    'How would you design a real-time chat application like Slack?',
    'How would you design a notification system that can handle millions of users?',
    'Design a rate limiter. What algorithms would you consider?',
    'How would you design a distributed file storage system like Dropbox?',
    'How would you design a search autocomplete system?',
    'Design a ride-sharing system like Uber. Focus on matching and geolocation.',
    'How would you design a video streaming service like YouTube?',
    'Design a web crawler. How would you handle billions of pages?',
    'How would you design a payment processing system like Stripe?',
    'Design a CDN (Content Delivery Network). What are the key components?',
    'How would you design a recommendation engine like Netflix uses?',
    'Design an API gateway. What features would it need?',
    'How would you design a distributed message queue like Kafka?',
    'Design a social media platform\'s friend/connection system at scale.',
    'How would you design a logging and monitoring system for microservices?',
  ],
  hr: [
    'What are your greatest strengths and weaknesses?',
    'How do you handle pressure and tight deadlines?',
    'What kind of work environment do you thrive in?',
    'Tell me about your long-term career goals.',
    'Do you have any questions for us?',
    'Why are you leaving your current position?',
    'What makes you a good fit for this specific role?',
    'How do you continue to grow and learn professionally?',
    'What is the most constructive criticism you\'ve received?',
    'Describe your ideal manager and work style.',
    'How do you handle ambiguity in projects?',
    'What are your salary expectations and why?',
    'How do you maintain work-life balance?',
    'What achievement are you most proud of?',
    'If you could change one thing about your career path, what would it be?',
  ],
};

// Track used question indices per interview to avoid repeats in fallback mode
const usedFallbackIndices = new Map(); // interviewId -> Set of used indices

function getFallbackFollowUp(type, questionNumber, interviewId) {
  const pool = FOLLOW_UP_POOLS[type] || FOLLOW_UP_POOLS.technical;

  // Get or create the set of used indices for this interview
  const key = interviewId ? interviewId.toString() : 'default';
  if (!usedFallbackIndices.has(key)) {
    usedFallbackIndices.set(key, new Set());
  }
  const used = usedFallbackIndices.get(key);

  // Find an unused question
  const available = pool
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => !used.has(i));

  if (available.length === 0) {
    // All used, reset and pick randomly
    used.clear();
    const idx = Math.floor(Math.random() * pool.length);
    used.add(idx);
    return pool[idx];
  }

  // Pick a random unused question
  const pick = available[Math.floor(Math.random() * available.length)];
  used.add(pick.i);

  // Clean up old entries to prevent memory leaks (keep max 500)
  if (usedFallbackIndices.size > 500) {
    const firstKey = usedFallbackIndices.keys().next().value;
    usedFallbackIndices.delete(firstKey);
  }

  return pick.q;
}

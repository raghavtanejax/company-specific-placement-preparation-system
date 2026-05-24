import { GoogleGenerativeAI } from '@google/generative-ai';
import MockInterview from '../models/MockInterview.js';

/**
 * Extracts consecutive ai/user message pairs from the messages array.
 * Returns an array of { question, answer, feedback } objects.
 */
function extractQAPairs(messages) {
  const pairs = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === 'ai' && messages[i + 1].role === 'user') {
      pairs.push({
        question: messages[i].content,
        answer:   messages[i + 1].content,
        feedback: messages[i + 1].feedback || null,
      });
      i++; // skip the user message we just consumed
    }
  }
  return pairs;
}

/**
 * Derives a recommendation string from a 0–100 total score.
 */
function deriveRecommendation(totalScore) {
  if (totalScore >= 85) return 'Strong Hire';
  if (totalScore >= 70) return 'Hire';
  if (totalScore >= 55) return 'Lean Hire';
  if (totalScore >= 40) return 'No Hire';
  return 'Strong No Hire';
}

/**
 * Builds a post-interview report entirely from interview.messages[].feedback
 * data already stored in MongoDB — no external API calls.
 *
 * @param {object} interview - Mongoose MockInterview document
 * @returns {object} report object ready to assign to interview.report
 */
export function buildFallbackReport(interview) {
  const qaPairs = extractQAPairs(interview.messages);

  // Build per-question breakdown from existing feedback (use defaults if missing)
  const perQuestionBreakdown = qaPairs.map(({ question, answer, feedback }) => ({
    questionText:  question,
    answerText:    answer,
    score:         feedback?.score         ?? 0,
    isCorrect:     feedback?.isCorrect     ?? null,
    correctAnswer: feedback?.correctAnswer ?? null,
    strengths:     Array.isArray(feedback?.strengths)    ? feedback.strengths    : [],
    improvements:  Array.isArray(feedback?.improvements) ? feedback.improvements : [],
  }));

  // Compute arithmetic mean of all scores (0–10 scale), rounded to 1 decimal
  const allScores = perQuestionBreakdown.map(q => q.score);
  const averageScore = allScores.length > 0
    ? Math.round((allScores.reduce((sum, s) => sum + s, 0) / allScores.length) * 10) / 10
    : 0;

  // Topic performance: single "General" entry (no Gemini for topic labels in fallback)
  const topicPerformance = [{
    topic:         'General',
    averageScore,
    questionCount: perQuestionBreakdown.length,
  }];

  // Weak areas: if any answers have score < 6, create one "General" entry
  const weakScores = perQuestionBreakdown
    .filter(q => q.score < 6)
    .map(q => q.score);

  let weakAreas = [];
  if (weakScores.length > 0) {
    const weakAvg = Math.round(
      (weakScores.reduce((sum, s) => sum + s, 0) / weakScores.length) * 10
    ) / 10;
    weakAreas = [{
      topic:           'General',
      averageScore:    weakAvg,
      recommendations: [
        'Review incorrect answers above',
        'Practice similar questions',
        'Revisit core concepts for this interview type',
      ],
    }];
  }

  // Scale 0–10 average → 0–100 total score
  const totalScore = Math.round(averageScore * 10);

  const recommendation = deriveRecommendation(totalScore);

  const summary = `Interview completed. Overall score: ${totalScore}/100.`;

  return {
    totalScore,
    recommendation,
    summary,
    perQuestionBreakdown,
    topicPerformance,
    weakAreas,
    generatedAt: new Date(),
  };
}

/**
 * GET /api/mock-interview/:id/report
 * Returns the post-interview report for a completed interview.
 * Ownership is enforced: the interview must belong to the requesting user.
 */
export const getInterviewReport = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // 1. Find interview by :id AND userId (ownership check)
    const interview = await MockInterview.findOne({ _id: id, userId });

    // 2. Not found or wrong owner → 404
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // 3. Interview not yet completed → 400
    if (interview.status !== 'completed') {
      return res.status(400).json({ message: 'Interview is not yet completed' });
    }

    // 4. Cache hit: report already generated → return it immediately
    if (interview.report && interview.report.generatedAt) {
      return res.status(200).json({ report: interview.report });
    }

    // 5. Try Gemini report generation
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = interview.aiModel || 'gemini-2.5-flash';
      const model = genAI.getGenerativeModel({ model: modelName });

      // Build formatted transcript with per-answer feedback
      const qaPairs = extractQAPairs(interview.messages);
      const formattedTranscript = qaPairs.map((pair, idx) => {
        const fb = pair.feedback;
        const scoreStr = fb?.score != null ? `Score: ${fb.score}/10` : 'Score: N/A';
        const correctStr = fb?.isCorrect != null ? `Correct: ${fb.isCorrect}` : '';
        return [
          `Q${idx + 1}: ${pair.question}`,
          `A${idx + 1}: ${pair.answer}`,
          `[${scoreStr}${correctStr ? ', ' + correctStr : ''}]`,
        ].join('\n');
      }).join('\n\n');

      const prompt = `You are evaluating a completed ${interview.interviewType} interview at ${interview.company} for the role of ${interview.role}.

Here is the full interview transcript with per-answer scores:
${formattedTranscript}

Generate a comprehensive post-interview report as a JSON object (wrapped in \`\`\`json fences) with this exact structure:
{
  "totalScore": <number 0-100>,
  "recommendation": <"Strong Hire"|"Hire"|"Lean Hire"|"No Hire"|"Strong No Hire">,
  "summary": <string, 2-4 sentences>,
  "perQuestionBreakdown": [
    {
      "questionText": <string>,
      "answerText": <string>,
      "score": <number 0-10>,
      "isCorrect": <boolean>,
      "correctAnswer": <string or null>,
      "strengths": [<1-3 strings>],
      "improvements": [<1-3 strings>]
    }
  ],
  "topicPerformance": [
    { "topic": <string>, "averageScore": <number>, "questionCount": <number> }
  ],
  "weakAreas": [
    {
      "topic": <string>,
      "averageScore": <number>,
      "recommendations": [<1-3 strings>]
    }
  ]
}

Rules:
- weakAreas must only include topics where averageScore < 6
- topicPerformance must cover all questions grouped by concept
- recommendations must be specific and actionable (e.g., "Practice Leetcode DP problems", not "Study more")
- If no weak areas exist, return weakAreas as an empty array []`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Parse JSON from ```json fences
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) throw new Error('Gemini response did not contain a JSON block');

      const parsed = JSON.parse(jsonMatch[1]);

      // Validate required fields; fill defaults for missing optional fields
      const report = {
        totalScore:          typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
        recommendation:      typeof parsed.recommendation === 'string' ? parsed.recommendation : deriveRecommendation(parsed.totalScore || 0),
        summary:             typeof parsed.summary === 'string' && parsed.summary ? parsed.summary : `Interview completed. Overall score: ${parsed.totalScore || 0}/100.`,
        perQuestionBreakdown: Array.isArray(parsed.perQuestionBreakdown)
          ? parsed.perQuestionBreakdown.map(q => ({
              questionText:  q.questionText  || '',
              answerText:    q.answerText    || '',
              score:         typeof q.score === 'number' ? q.score : 0,
              isCorrect:     q.isCorrect     ?? null,
              correctAnswer: q.correctAnswer ?? null,
              strengths:     Array.isArray(q.strengths)    ? q.strengths    : [],
              improvements:  Array.isArray(q.improvements) ? q.improvements : [],
            }))
          : [],
        topicPerformance: Array.isArray(parsed.topicPerformance)
          ? parsed.topicPerformance.map(t => ({
              topic:         t.topic         || 'General',
              averageScore:  typeof t.averageScore === 'number' ? t.averageScore : 0,
              questionCount: typeof t.questionCount === 'number' ? t.questionCount : 0,
            }))
          : [],
        weakAreas: Array.isArray(parsed.weakAreas)
          ? parsed.weakAreas.map(w => ({
              topic:           w.topic           || 'General',
              averageScore:    typeof w.averageScore === 'number' ? w.averageScore : 0,
              recommendations: Array.isArray(w.recommendations) ? w.recommendations : [],
            }))
          : [],
        generatedAt: new Date(),
      };

      interview.report = report;
      await interview.save();
      return res.status(200).json({ report: interview.report });

    } catch (geminiError) {
      // 6. Gemini failed — try fallback generation
      console.error('Gemini report generation failed, using fallback:', geminiError.message);

      try {
        const fallbackReport = buildFallbackReport(interview);
        interview.report = fallbackReport;
        await interview.save();
        return res.status(200).json({ report: interview.report });
      } catch (fallbackError) {
        // 7. Both Gemini and fallback failed → 503
        console.error('Fallback report generation also failed:', fallbackError.message);
        return res.status(503).json({
          message: 'Report generation temporarily unavailable. Please try again later.',
        });
      }
    }

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

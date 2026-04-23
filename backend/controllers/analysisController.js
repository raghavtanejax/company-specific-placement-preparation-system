import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';

// Fallback dictionary for when AI is unavailable
const SKILLS_DICTIONARY = [
  'java', 'python', 'javascript', 'c++', 'c#', 'ruby', 'go', 'rust', 'typescript',
  'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring', 'spring boot',
  'mongodb', 'mysql', 'postgresql', 'sql', 'nosql', 'redis', 'elasticsearch', 'cassandra',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins',
  'dsa', 'data structures', 'algorithms', 'system design', 'machine learning', 'ai',
  'html', 'css', 'tailwind', 'rest api', 'graphql', 'microservices', 'git',
  'linux', 'agile', 'scrum', 'jira', 'kafka', 'rabbitmq', 'nginx'
];

// Keyword-based fallback analysis
const fallbackAnalysis = (jobDescription) => {
  const text = jobDescription.toLowerCase();
  const extractedSkills = SKILLS_DICTIONARY.filter(skill => text.includes(skill));

  return {
    success: true,
    extractedSkills: extractedSkills.map(s => ({
      name: s,
      confidence: 'high',
    })),
    roleLevel: 'Not determined',
    studyPlan: extractedSkills.map((skill, i) => ({
      week: i + 1,
      topic: skill,
      hours: 10,
      description: `Deep dive into ${skill} concepts and practice problems.`,
    })),
    gapAnalysis: null,
    aiPowered: false,
    message: 'Analysis completed using keyword matching (AI unavailable).',
  };
};

export const analyzeJobDescription = async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription) {
      return res.status(400).json({ message: 'Job description is required' });
    }

    // Try AI-powered analysis first
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fallback to keyword matching
      return res.json(fallbackAnalysis(jobDescription));
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      // Get user's current skills for gap analysis
      let userSkills = {};
      try {
        const user = await User.findById(req.userId);
        if (user && user.performance && user.performance.skillStrengths) {
          userSkills = Object.fromEntries(user.performance.skillStrengths);
        }
      } catch (e) {
        // Continue without user skills
      }

      const prompt = `Analyze the following job description and return a JSON response with these exact fields:
      
1. "extractedSkills": array of objects with "name" (string) and "confidence" (one of: "high", "medium", "low")
2. "roleLevel": string — the seniority level (e.g., "Junior", "Mid-Level", "Senior", "Lead")
3. "studyPlan": array of objects with "week" (number), "topic" (string), "hours" (number), "description" (string) — a 4-8 week preparation plan
4. "companySuggestions": array of strings — companies that typically hire for this kind of role

Here are the user's current skill proficiency levels (0-100 scale): ${JSON.stringify(userSkills)}

5. "gapAnalysis": array of objects with "skill" (string), "required" (number 0-100, how important for this JD), "current" (number 0-100, from user's profile or 0 if unknown), "gap" (string: "strong", "moderate", "weak", "no_data")

IMPORTANT: Return ONLY valid JSON, no markdown, no code blocks, no explanation.

Job Description:
${jobDescription}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Parse the AI response — strip any markdown code fences if present
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleaned);

      return res.json({
        success: true,
        extractedSkills: parsed.extractedSkills || [],
        roleLevel: parsed.roleLevel || 'Not determined',
        studyPlan: parsed.studyPlan || [],
        gapAnalysis: parsed.gapAnalysis || null,
        companySuggestions: parsed.companySuggestions || [],
        aiPowered: true,
        message: 'Job description analyzed successfully using AI.',
      });
    } catch (aiError) {
      console.error('Gemini API error, falling back to keyword matching:', aiError.message);
      return res.json(fallbackAnalysis(jobDescription));
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

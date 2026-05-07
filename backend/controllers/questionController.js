import Question from '../models/Question.js';

// Get recommended questions based on extracted skills — randomized every time
export const getRecommendedQuestions = async (req, res) => {
  try {
    const { skills, difficulty, company, limit = 10 } = req.query;

    let matchStage = {};

    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      matchStage.skills = { $in: skillsArray };
    }

    if (difficulty) {
      matchStage.difficulty = difficulty;
    }

    if (company) {
      matchStage.company = company;
    }

    const sampleSize = Math.min(parseInt(limit) || 10, 20);

    // Use aggregation with $match + $sample for true randomization
    let pipeline = [];
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }
    pipeline.push({ $sample: { size: sampleSize } });

    let questions = await Question.aggregate(pipeline);

    // If filtered query returned too few questions, supplement with general random questions
    if (questions.length < 5) {
      const fallbackPipeline = [{ $sample: { size: sampleSize } }];
      questions = await Question.aggregate(fallbackPipeline);
    }

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Seed some basic questions (utility route)
export const seedQuestions = async (req, res) => {
  try {
    const defaultQuestions = [
      {
        title: 'What is the virtual DOM in React?',
        description: 'Explain the concept of virtual DOM and how it improves performance.',
        difficulty: 'medium',
        skills: ['react', 'javascript'],
        type: 'mcq',
        options: [
          { text: 'A direct copy of the actual DOM that syncs in real-time', isCorrect: false },
          { text: 'A lightweight in-memory representation of the DOM used for diffing', isCorrect: true },
          { text: 'A new HTML5 tag introduced for single-page apps', isCorrect: false },
          { text: 'A database that stores DOM changes on the server', isCorrect: false },
        ]
      },
      {
        title: 'What does JSON stand for?',
        description: 'Basic web knowledge about data interchange formats.',
        difficulty: 'easy',
        skills: ['javascript', 'web'],
        type: 'mcq',
        options: [
          { text: 'JavaScript Object Notation', isCorrect: true },
          { text: 'Java Source Open Network', isCorrect: false },
          { text: 'JavaScript Operational Node', isCorrect: false },
          { text: 'Joint Syntax Object Naming', isCorrect: false },
        ]
      }
    ];

    await Question.insertMany(defaultQuestions);
    res.json({ message: 'Questions seeded successfully', count: defaultQuestions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

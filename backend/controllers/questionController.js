import Question from '../models/Question.js';

// Get recommended questions based on extracted skills
export const getRecommendedQuestions = async (req, res) => {
  try {
    const { skills, difficulty } = req.query; // skills is a comma-separated string
    
    let query = {};
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim().toLowerCase());
      query.skills = { $in: skillsArray };
    }
    
    if (difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await Question.find(query).limit(20);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Seed some basic questions
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
          { text: 'It is a direct copy of the actual DOM', isCorrect: false },
          { text: 'It is a lightweight copy of the DOM kept in memory', isCorrect: true },
          { text: 'It is a new HTML tag', isCorrect: false },
        ]
      },
      {
        title: 'Reverse a Linked List',
        description: 'Write a function to reverse a singly linked list.',
        difficulty: 'hard',
        skills: ['dsa', 'data structures'],
        type: 'coding',
        testCases: [
          { input: '1->2->3->NULL', expectedOutput: '3->2->1->NULL' }
        ]
      },
      {
        title: 'What does JSON stand for?',
        description: 'Basic web knowledge.',
        difficulty: 'easy',
        skills: ['javascript', 'web'],
        type: 'mcq',
        options: [
          { text: 'JavaScript Object Notation', isCorrect: true },
          { text: 'Java Source Open Network', isCorrect: false }
        ]
      }
    ];

    await Question.insertMany(defaultQuestions);
    res.json({ message: 'Questions seeded successfully', count: defaultQuestions.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

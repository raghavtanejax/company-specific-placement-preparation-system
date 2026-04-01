import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';

dotenv.config();

const SKILLS = [
  'java', 'python', 'javascript', 'c++', 'c#', 'ruby', 'go', 'rust',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
  'mongodb', 'mysql', 'postgresql', 'sql', 'nosql', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes',
  'dsa', 'data structures', 'algorithms', 'system design', 'machine learning', 'ai'
];

const TEMPLATES = {
  easy: [
    { title: "What is the primary use of TARGET?", desc: "Identify the core purpose." },
    { title: "Which of the following describes TARGET best?", desc: "Basic definition question." },
    { title: "How do you start a basic project with TARGET?", desc: "Fundamental project setup." },
    { title: "What is the standard file extension used in TARGET?", desc: "Basic syntax/file structure knowledge." },
    { title: "Which command installs TARGET dependencies?", desc: "Basic package management." }
  ],
  medium: [
    { title: "How does TARGET handle memory and state management?", desc: "Explain internal mechanics." },
    { title: "What are the core lifecycle methods in TARGET?", desc: "Understand execution flow." },
    { title: "How do you handle error boundaries in TARGET?", desc: "Implementation of safety checks." },
    { title: "Explain the difference between synchronous and asynchronous operations in TARGET.", desc: "Concurrency." },
    { title: "How do you optimize rendering/execution in TARGET?", desc: "Performance basics." }
  ],
  hard: [
    { title: "Explain the internal architectural engine of TARGET.", desc: "Deep dive into the source/engine." },
    { title: "How would you scale a TARGET application to 1 million users?", desc: "System design and scaling." },
    { title: "Describe customizing the AST or compilation pipeline for TARGET.", desc: "Advanced internal mechanisms." },
    { title: "How to resolve race conditions in complex TARGET states?", desc: "Advanced debugging." }
  ]
};

const generateQuestionsForSkill = (skill) => {
  const questions = [];
  
  // Create 50 questions for this skill
  // 20 Easy, 20 Medium, 10 Hard
  
  const addQuestions = (level, count) => {
    for(let i=1; i<=count; i++) {
      const template = TEMPLATES[level][i % TEMPLATES[level].length];
      const isCoding = (level === 'hard' && i % 3 === 0); // Make some hard questions coding
      
      let q = {
        title: template.title.replace(/TARGET/g, skill.toUpperCase()) + ` ([${level.toUpperCase()}] Q${i})`,
        description: template.desc,
        difficulty: level,
        skills: [skill],
        type: isCoding ? 'coding' : 'mcq',
      };

      if (isCoding) {
        q.testCases = [
          { input: 'Sample Input', expectedOutput: 'Expected Output for ' + skill }
        ];
      } else {
        q.options = [
          { text: `Correct assertion regarding ${skill}`, isCorrect: true },
          { text: `Incorrect claim about ${skill}`, isCorrect: false },
          { text: `Outdated feature of ${skill}`, isCorrect: false },
          { text: `Concept from a different technology`, isCorrect: false }
        ];
      }
      
      questions.push(q);
    }
  };

  addQuestions('easy', 20);
  addQuestions('medium', 20);
  addQuestions('hard', 10);
  
  return questions;
};

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-prep');
    console.log('Connected to DB');

    // Optional: Clear existing questions to prevent duplicates during testing
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    let allQuestions = [];
    
    for(const skill of SKILLS) {
        const generated = generateQuestionsForSkill(skill);
        allQuestions = allQuestions.concat(generated);
    }

    console.log(`Prepared ${allQuestions.length} questions. Inserting into DB...`);
    
    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < allQuestions.length; i += batchSize) {
      const batch = allQuestions.slice(i, i + batchSize);
      await Question.insertMany(batch);
      console.log(`Inserted batch ${i / batchSize + 1}`);
    }

    console.log(`Successfully seeded ${allQuestions.length} questions into the database!`);
    mongoose.disconnect();
  } catch(e) {
    console.error('Seeding error:', e);
    mongoose.disconnect();
  }
};

seedDatabase();

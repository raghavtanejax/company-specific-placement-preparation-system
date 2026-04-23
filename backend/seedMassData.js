import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
import Question from './models/Question.js';
import Company from './models/Company.js';

dotenv.config();

// Use Google's public DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

// ===== COMPANIES DATA =====
const COMPANIES = [
  {
    name: 'Google',
    slug: 'google',
    description: 'Known for algorithm-heavy interviews with a focus on problem-solving, system design, and behavioral rounds (Googleyness & Leadership).',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Online Assessment', 'Phone Screen', 'Onsite (4-5 rounds)', 'Hiring Committee Review'],
      focusAreas: ['dsa', 'algorithms', 'system design', 'javascript', 'python'],
      avgCTC: '₹25-45 LPA',
    },
    logo: '🔵',
    color: '#4285F4',
  },
  {
    name: 'Amazon',
    slug: 'amazon',
    description: 'Leadership Principles-driven interviews with heavy emphasis on DSA, system design, and behavioral questions.',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Online Assessment', 'Phone Screen', 'Onsite (4-5 rounds)', 'Bar Raiser Round'],
      focusAreas: ['dsa', 'system design', 'java', 'aws', 'algorithms'],
      avgCTC: '₹20-40 LPA',
    },
    logo: '📦',
    color: '#FF9900',
  },
  {
    name: 'Microsoft',
    slug: 'microsoft',
    description: 'Balanced interviews covering DSA, system design, and coding. Known for a collaborative interview style.',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Online Assessment', 'Phone Screen', 'Onsite (3-4 rounds)', 'As-Appropriate Round'],
      focusAreas: ['dsa', 'system design', 'c++', 'c#', 'algorithms'],
      avgCTC: '₹22-42 LPA',
    },
    logo: '🪟',
    color: '#00A4EF',
  },
  {
    name: 'Meta',
    slug: 'meta',
    description: 'Fast-paced interviews focused on coding efficiency, system design at scale, and behavioral assessment.',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Online Assessment', 'Phone Screen', 'Onsite (3-4 rounds)'],
      focusAreas: ['dsa', 'algorithms', 'system design', 'react', 'javascript'],
      avgCTC: '₹30-50 LPA',
    },
    logo: '♾️',
    color: '#0668E1',
  },
  {
    name: 'Apple',
    slug: 'apple',
    description: 'Team-specific interviews with deep technical focus on the role and strong emphasis on domain expertise.',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Recruiter Screen', 'Technical Phone Screen', 'Onsite (5-6 rounds)'],
      focusAreas: ['dsa', 'system design', 'c++', 'algorithms', 'javascript'],
      avgCTC: '₹25-45 LPA',
    },
    logo: '🍎',
    color: '#555555',
  },
  {
    name: 'Flipkart',
    slug: 'flipkart',
    description: 'India\'s leading e-commerce platform. Interviews focus on DSA, machine coding rounds, and system design.',
    difficulty: 'medium',
    hiringPattern: {
      rounds: ['Online Assessment', 'Machine Coding Round', 'Problem Solving', 'System Design', 'Hiring Manager'],
      focusAreas: ['dsa', 'java', 'system design', 'algorithms', 'machine learning'],
      avgCTC: '₹18-35 LPA',
    },
    logo: '🛒',
    color: '#F7D032',
  },
  {
    name: 'Goldman Sachs',
    slug: 'goldman-sachs',
    description: 'Technology division interviews are heavily math and DSA-oriented with strong focus on Java and financial concepts.',
    difficulty: 'hard',
    hiringPattern: {
      rounds: ['Online Assessment (HackerRank)', 'Technical Interviews (2-3)', 'Hiring Manager Round'],
      focusAreas: ['dsa', 'java', 'sql', 'algorithms', 'system design'],
      avgCTC: '₹20-38 LPA',
    },
    logo: '🏦',
    color: '#6B9BD2',
  },
  {
    name: 'Infosys',
    slug: 'infosys',
    description: 'Largest Indian IT services company. Campus placements focus on aptitude, programming, and communication.',
    difficulty: 'easy',
    hiringPattern: {
      rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
      focusAreas: ['java', 'python', 'sql', 'dsa', 'javascript'],
      avgCTC: '₹3.6-8 LPA',
    },
    logo: '💎',
    color: '#007CC3',
  },
  {
    name: 'TCS',
    slug: 'tcs',
    description: 'India\'s largest IT company by market cap. Interviews focus on fundamentals, aptitude, and coding basics.',
    difficulty: 'easy',
    hiringPattern: {
      rounds: ['TCS NQT (Aptitude + Coding)', 'Technical Interview', 'HR Round'],
      focusAreas: ['java', 'python', 'c++', 'sql', 'dsa'],
      avgCTC: '₹3.5-7 LPA',
    },
    logo: '🏢',
    color: '#0072C6',
  },
  {
    name: 'Wipro',
    slug: 'wipro',
    description: 'Major Indian IT services company. Campus hiring includes aptitude, technical, and communication assessment.',
    difficulty: 'easy',
    hiringPattern: {
      rounds: ['Online Assessment', 'Technical Interview', 'HR Round'],
      focusAreas: ['java', 'python', 'sql', 'javascript', 'dsa'],
      avgCTC: '₹3.5-6.5 LPA',
    },
    logo: '🌸',
    color: '#441D81',
  },
];

// Skills per company focus
const COMPANY_SKILL_MAP = {
  'google': ['dsa', 'algorithms', 'system design', 'javascript', 'python'],
  'amazon': ['dsa', 'system design', 'java', 'aws', 'algorithms'],
  'microsoft': ['dsa', 'system design', 'c++', 'algorithms', 'javascript'],
  'meta': ['dsa', 'algorithms', 'system design', 'react', 'javascript'],
  'apple': ['dsa', 'system design', 'c++', 'algorithms', 'javascript'],
  'flipkart': ['dsa', 'java', 'system design', 'algorithms', 'machine learning'],
  'goldman-sachs': ['dsa', 'java', 'sql', 'algorithms', 'system design'],
  'infosys': ['java', 'python', 'sql', 'dsa', 'javascript'],
  'tcs': ['java', 'python', 'c++', 'sql', 'dsa'],
  'wipro': ['java', 'python', 'sql', 'javascript', 'dsa'],
};

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

const generateQuestionsForSkill = (skill, companySlug = null) => {
  const questions = [];
  
  // Create fewer questions per company-skill combo to keep DB manageable
  const easyCnt = companySlug ? 5 : 20;
  const medCnt = companySlug ? 5 : 20;
  const hardCnt = companySlug ? 3 : 10;
  
  const addQuestions = (level, count) => {
    for(let i=1; i<=count; i++) {
      const template = TEMPLATES[level][i % TEMPLATES[level].length];
      const isCoding = (level === 'hard' && i % 3 === 0);
      
      let q = {
        title: template.title.replace(/TARGET/g, skill.toUpperCase()) + ` ([${level.toUpperCase()}] Q${i})`,
        description: template.desc,
        difficulty: level,
        skills: [skill],
        company: companySlug ? [companySlug] : [],
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

  addQuestions('easy', easyCnt);
  addQuestions('medium', medCnt);
  addQuestions('hard', hardCnt);
  
  return questions;
};

// ===== REAL CODING QUESTIONS with actual test cases =====
const CODING_QUESTIONS = [
  // ========== EASY ==========
  {
    title: 'Two Sum',
    description: 'Given an array of integers and a target, return indices of the two numbers that add up to the target.\n\nInput: first line is the array (comma-separated), second line is the target.\nOutput: two indices (comma-separated).\n\nExample: nums = [2,7,11,15], target = 9 → Output: 0,1',
    difficulty: 'easy',
    skills: ['dsa', 'algorithms', 'javascript'],
    company: ['google', 'amazon', 'meta', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: '2,7,11,15\n9', expectedOutput: '0,1' },
      { input: '3,2,4\n6', expectedOutput: '1,2' },
      { input: '3,3\n6', expectedOutput: '0,1' },
    ],
  },
  {
    title: 'Reverse a String',
    description: 'Write a function that reverses a string.\n\nInput: a string.\nOutput: the reversed string.\n\nExample: "hello" → "olleh"',
    difficulty: 'easy',
    skills: ['javascript', 'dsa'],
    company: ['infosys', 'tcs', 'wipro'],
    type: 'coding',
    testCases: [
      { input: 'hello', expectedOutput: 'olleh' },
      { input: 'JavaScript', expectedOutput: 'tpircSavaJ' },
      { input: 'racecar', expectedOutput: 'racecar' },
    ],
  },
  {
    title: 'Palindrome Check',
    description: 'Check if a given string is a palindrome (reads the same forwards and backwards). Ignore case.\n\nInput: a string.\nOutput: "true" or "false".\n\nExample: "racecar" → "true"',
    difficulty: 'easy',
    skills: ['javascript', 'dsa', 'algorithms'],
    company: ['infosys', 'tcs', 'wipro', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: 'racecar', expectedOutput: 'true' },
      { input: 'hello', expectedOutput: 'false' },
      { input: 'Madam', expectedOutput: 'true' },
      { input: 'a', expectedOutput: 'true' },
    ],
  },
  {
    title: 'FizzBuzz',
    description: 'Print numbers from 1 to n. For multiples of 3 print "Fizz", for multiples of 5 print "Buzz", for multiples of both print "FizzBuzz".\n\nInput: a number n.\nOutput: each result on a new line.\n\nExample: n=5 → "1\\n2\\nFizz\\n4\\nBuzz"',
    difficulty: 'easy',
    skills: ['javascript', 'algorithms'],
    company: ['infosys', 'tcs', 'wipro'],
    type: 'coding',
    testCases: [
      { input: '5', expectedOutput: '1\n2\nFizz\n4\nBuzz' },
      { input: '15', expectedOutput: '1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz' },
    ],
  },
  {
    title: 'Find Maximum in Array',
    description: 'Find the maximum element in an array of integers.\n\nInput: comma-separated integers.\nOutput: the maximum value.\n\nExample: [1, 5, 3, 9, 2] → 9',
    difficulty: 'easy',
    skills: ['dsa', 'javascript'],
    company: ['tcs', 'wipro', 'infosys'],
    type: 'coding',
    testCases: [
      { input: '1,5,3,9,2', expectedOutput: '9' },
      { input: '-1,-5,-3', expectedOutput: '-1' },
      { input: '42', expectedOutput: '42' },
    ],
  },
  {
    title: 'Count Vowels',
    description: 'Count the number of vowels (a, e, i, o, u) in a string. Case-insensitive.\n\nInput: a string.\nOutput: vowel count.\n\nExample: "Hello World" → 3',
    difficulty: 'easy',
    skills: ['javascript'],
    company: ['infosys', 'wipro'],
    type: 'coding',
    testCases: [
      { input: 'Hello World', expectedOutput: '3' },
      { input: 'aeiou', expectedOutput: '5' },
      { input: 'bcdfg', expectedOutput: '0' },
      { input: 'JAVASCRIPT', expectedOutput: '3' },
    ],
  },
  {
    title: 'Factorial',
    description: 'Calculate the factorial of a non-negative integer n.\n\nInput: a number n.\nOutput: n!\n\nExample: 5 → 120',
    difficulty: 'easy',
    skills: ['algorithms', 'javascript'],
    company: ['tcs', 'infosys'],
    type: 'coding',
    testCases: [
      { input: '5', expectedOutput: '120' },
      { input: '0', expectedOutput: '1' },
      { input: '10', expectedOutput: '3628800' },
    ],
  },
  {
    title: 'Fibonacci Number',
    description: 'Return the nth Fibonacci number (0-indexed). F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).\n\nInput: n.\nOutput: F(n).\n\nExample: 6 → 8',
    difficulty: 'easy',
    skills: ['dsa', 'algorithms', 'javascript'],
    company: ['google', 'amazon', 'infosys', 'tcs'],
    type: 'coding',
    testCases: [
      { input: '6', expectedOutput: '8' },
      { input: '0', expectedOutput: '0' },
      { input: '1', expectedOutput: '1' },
      { input: '10', expectedOutput: '55' },
    ],
  },
  {
    title: 'Remove Duplicates from Array',
    description: 'Remove duplicate elements from an array and return the unique elements in original order.\n\nInput: comma-separated integers.\nOutput: unique elements comma-separated.\n\nExample: 1,2,2,3,4,4,5 → 1,2,3,4,5',
    difficulty: 'easy',
    skills: ['dsa', 'javascript'],
    company: ['flipkart', 'infosys'],
    type: 'coding',
    testCases: [
      { input: '1,2,2,3,4,4,5', expectedOutput: '1,2,3,4,5' },
      { input: '1,1,1,1', expectedOutput: '1' },
      { input: '5,3,1', expectedOutput: '5,3,1' },
    ],
  },
  {
    title: 'Sum of Array',
    description: 'Calculate the sum of all elements in an array.\n\nInput: comma-separated integers.\nOutput: the sum.\n\nExample: 1,2,3,4,5 → 15',
    difficulty: 'easy',
    skills: ['javascript'],
    company: ['tcs', 'wipro'],
    type: 'coding',
    testCases: [
      { input: '1,2,3,4,5', expectedOutput: '15' },
      { input: '-1,1', expectedOutput: '0' },
      { input: '100', expectedOutput: '100' },
    ],
  },

  // ========== MEDIUM ==========
  {
    title: 'Valid Parentheses',
    description: 'Given a string containing just the characters \'(\', \')\', \'{\', \'}\', \'[\', \']\', determine if the input string is valid. A string is valid if open brackets are closed by the same type and in the correct order.\n\nInput: a string of brackets.\nOutput: "true" or "false".\n\nExample: "()[]{}" → "true"',
    difficulty: 'medium',
    skills: ['dsa', 'data structures', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: '()[]{}', expectedOutput: 'true' },
      { input: '(]', expectedOutput: 'false' },
      { input: '([)]', expectedOutput: 'false' },
      { input: '{[]}', expectedOutput: 'true' },
      { input: '', expectedOutput: 'true' },
    ],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    description: 'Given a string, find the length of the longest substring without repeating characters.\n\nInput: a string.\nOutput: length of longest unique substring.\n\nExample: "abcabcbb" → 3 (the answer is "abc")',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms', 'javascript'],
    company: ['google', 'amazon', 'meta', 'microsoft', 'apple'],
    type: 'coding',
    testCases: [
      { input: 'abcabcbb', expectedOutput: '3' },
      { input: 'bbbbb', expectedOutput: '1' },
      { input: 'pwwkew', expectedOutput: '3' },
      { input: '', expectedOutput: '0' },
    ],
  },
  {
    title: 'Binary Search',
    description: 'Implement binary search. Given a sorted array and a target value, return the index of the target. Return -1 if not found.\n\nInput: first line is comma-separated sorted array, second line is the target.\nOutput: index or -1.\n\nExample: [1,3,5,7,9], target=5 → 2',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '1,3,5,7,9\n5', expectedOutput: '2' },
      { input: '1,3,5,7,9\n6', expectedOutput: '-1' },
      { input: '2,4,6,8,10\n10', expectedOutput: '4' },
      { input: '1\n1', expectedOutput: '0' },
    ],
  },
  {
    title: 'Merge Two Sorted Arrays',
    description: 'Merge two sorted arrays into one sorted array.\n\nInput: first line is array1 (comma-separated), second line is array2.\nOutput: merged sorted array (comma-separated).\n\nExample: [1,3,5] and [2,4,6] → 1,2,3,4,5,6',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['amazon', 'microsoft', 'flipkart', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: '1,3,5\n2,4,6', expectedOutput: '1,2,3,4,5,6' },
      { input: '1,2,3\n4,5,6', expectedOutput: '1,2,3,4,5,6' },
      { input: '1\n2', expectedOutput: '1,2' },
    ],
  },
  {
    title: 'Anagram Check',
    description: 'Check if two strings are anagrams of each other (same characters, different order). Case-insensitive.\n\nInput: first line is string1, second line is string2.\nOutput: "true" or "false".\n\nExample: "listen" and "silent" → "true"',
    difficulty: 'medium',
    skills: ['dsa', 'javascript', 'algorithms'],
    company: ['amazon', 'flipkart', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: 'listen\nsilent', expectedOutput: 'true' },
      { input: 'hello\nworld', expectedOutput: 'false' },
      { input: 'Astronomer\nMoon starer', expectedOutput: 'true' },
    ],
  },
  {
    title: 'Maximum Subarray Sum (Kadane\'s Algorithm)',
    description: 'Find the contiguous subarray with the largest sum.\n\nInput: comma-separated integers.\nOutput: maximum subarray sum.\n\nExample: [-2,1,-3,4,-1,2,1,-5,4] → 6 (subarray [4,-1,2,1])',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'meta', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '-2,1,-3,4,-1,2,1,-5,4', expectedOutput: '6' },
      { input: '1', expectedOutput: '1' },
      { input: '-1,-2,-3', expectedOutput: '-1' },
      { input: '5,4,-1,7,8', expectedOutput: '23' },
    ],
  },
  {
    title: 'Rotate Array',
    description: 'Rotate an array to the right by k steps.\n\nInput: first line is comma-separated array, second line is k.\nOutput: rotated array comma-separated.\n\nExample: [1,2,3,4,5,6,7], k=3 → 5,6,7,1,2,3,4',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['amazon', 'microsoft', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '1,2,3,4,5,6,7\n3', expectedOutput: '5,6,7,1,2,3,4' },
      { input: '-1,-100,3,99\n2', expectedOutput: '3,99,-1,-100' },
      { input: '1,2\n1', expectedOutput: '2,1' },
    ],
  },
  {
    title: 'Flatten Nested Array',
    description: 'Flatten a nested array into a single-level array.\n\nInput: a JSON array (may be nested).\nOutput: flattened comma-separated values.\n\nExample: [1,[2,[3,4],5]] → 1,2,3,4,5',
    difficulty: 'medium',
    skills: ['javascript'],
    company: ['google', 'meta'],
    type: 'coding',
    testCases: [
      { input: '[1,[2,[3,4],5]]', expectedOutput: '1,2,3,4,5' },
      { input: '[[1,2],[3,[4,5]]]', expectedOutput: '1,2,3,4,5' },
      { input: '[1,2,3]', expectedOutput: '1,2,3' },
    ],
  },
  {
    title: 'String Compression',
    description: 'Compress a string using counts of repeated characters. If compressed string is not smaller, return original.\n\nInput: a string.\nOutput: compressed string.\n\nExample: "aabcccccaaa" → "a2b1c5a3"',
    difficulty: 'medium',
    skills: ['dsa', 'javascript', 'algorithms'],
    company: ['amazon', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: 'aabcccccaaa', expectedOutput: 'a2b1c5a3' },
      { input: 'abc', expectedOutput: 'abc' },
      { input: 'aaa', expectedOutput: 'a3' },
    ],
  },
  {
    title: 'First Non-Repeating Character',
    description: 'Find the first non-repeating character in a string and return its index. Return -1 if none exists.\n\nInput: a string.\nOutput: index of first unique character.\n\nExample: "leetcode" → 0 (l is first unique)',
    difficulty: 'medium',
    skills: ['dsa', 'javascript'],
    company: ['amazon', 'goldman-sachs', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: 'leetcode', expectedOutput: '0' },
      { input: 'loveleetcode', expectedOutput: '2' },
      { input: 'aabb', expectedOutput: '-1' },
    ],
  },
  {
    title: 'Matrix Spiral Order',
    description: 'Given an m×n matrix, return all elements in spiral order.\n\nInput: JSON 2D array.\nOutput: comma-separated elements in spiral order.\n\nExample: [[1,2,3],[4,5,6],[7,8,9]] → 1,2,3,6,9,8,7,4,5',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'apple'],
    type: 'coding',
    testCases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', expectedOutput: '1,2,3,6,9,8,7,4,5' },
      { input: '[[1,2],[3,4]]', expectedOutput: '1,2,4,3' },
    ],
  },
  {
    title: 'Product of Array Except Self',
    description: 'Given an integer array nums, return an array where answer[i] is the product of all elements except nums[i]. Do NOT use division.\n\nInput: comma-separated integers.\nOutput: comma-separated products.\n\nExample: 1,2,3,4 → 24,12,8,6',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'apple'],
    type: 'coding',
    testCases: [
      { input: '1,2,3,4', expectedOutput: '24,12,8,6' },
      { input: '-1,1,0,-3,3', expectedOutput: '0,0,9,0,0' },
    ],
  },
  {
    title: 'Move Zeroes to End',
    description: 'Move all zeroes in an array to the end while maintaining the order of non-zero elements.\n\nInput: comma-separated integers.\nOutput: comma-separated result.\n\nExample: 0,1,0,3,12 → 1,3,12,0,0',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['meta', 'amazon', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '0,1,0,3,12', expectedOutput: '1,3,12,0,0' },
      { input: '0', expectedOutput: '0' },
      { input: '1,2,3', expectedOutput: '1,2,3' },
    ],
  },
  {
    title: 'Group Anagrams',
    description: 'Given an array of strings, group the anagrams together. Output each group sorted alphabetically, groups separated by |.\n\nInput: comma-separated strings.\nOutput: groups separated by | (each group sorted, groups sorted by first element).\n\nExample: eat,tea,tan,ate,nat,bat → ate,eat,tea|bat|nat,tan',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms', 'javascript'],
    company: ['google', 'amazon', 'meta'],
    type: 'coding',
    testCases: [
      { input: 'eat,tea,tan,ate,nat,bat', expectedOutput: 'ate,eat,tea|bat|nat,tan' },
      { input: 'a', expectedOutput: 'a' },
    ],
  },
  {
    title: 'Climbing Stairs (Dynamic Programming)',
    description: 'You can climb 1 or 2 steps at a time. How many distinct ways can you climb to the top (n steps)?\n\nInput: n.\nOutput: number of ways.\n\nExample: 4 → 5',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: '2', expectedOutput: '2' },
      { input: '3', expectedOutput: '3' },
      { input: '4', expectedOutput: '5' },
      { input: '10', expectedOutput: '89' },
    ],
  },
  {
    title: 'Power of Two',
    description: 'Determine if a given integer is a power of two.\n\nInput: an integer.\nOutput: "true" or "false".\n\nExample: 16 → "true"',
    difficulty: 'medium',
    skills: ['algorithms', 'javascript'],
    company: ['amazon', 'google'],
    type: 'coding',
    testCases: [
      { input: '1', expectedOutput: 'true' },
      { input: '16', expectedOutput: 'true' },
      { input: '3', expectedOutput: 'false' },
      { input: '0', expectedOutput: 'false' },
    ],
  },
  {
    title: 'Roman to Integer',
    description: 'Convert a Roman numeral string to an integer.\n\nInput: a Roman numeral string.\nOutput: integer value.\n\nExample: "MCMXCIV" → 1994',
    difficulty: 'medium',
    skills: ['algorithms', 'javascript'],
    company: ['amazon', 'microsoft', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: 'III', expectedOutput: '3' },
      { input: 'LVIII', expectedOutput: '58' },
      { input: 'MCMXCIV', expectedOutput: '1994' },
      { input: 'IX', expectedOutput: '9' },
    ],
  },
  {
    title: 'Container With Most Water',
    description: 'Given n non-negative integers (heights of lines), find two lines that together with the x-axis form a container holding the most water.\n\nInput: comma-separated heights.\nOutput: maximum water area.\n\nExample: 1,8,6,2,5,4,8,3,7 → 49',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'apple'],
    type: 'coding',
    testCases: [
      { input: '1,8,6,2,5,4,8,3,7', expectedOutput: '49' },
      { input: '1,1', expectedOutput: '1' },
    ],
  },

  // ========== HARD ==========
  {
    title: 'Longest Palindromic Substring',
    description: 'Find the longest palindromic substring in a string.\n\nInput: a string.\nOutput: the longest palindrome substring (if multiple, return the first one found).\n\nExample: "babad" → "bab" or "aba"',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: 'babad', expectedOutput: 'bab' },
      { input: 'cbbd', expectedOutput: 'bb' },
      { input: 'a', expectedOutput: 'a' },
    ],
  },
  {
    title: 'Trapping Rain Water',
    description: 'Given n non-negative integers representing an elevation map, compute how much water it can trap after raining.\n\nInput: comma-separated heights.\nOutput: total trapped water.\n\nExample: 0,1,0,2,1,0,1,3,2,1,2,1 → 6',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft', 'apple', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: '0,1,0,2,1,0,1,3,2,1,2,1', expectedOutput: '6' },
      { input: '4,2,0,3,2,5', expectedOutput: '9' },
    ],
  },
  {
    title: 'Longest Increasing Subsequence',
    description: 'Find the length of the longest strictly increasing subsequence.\n\nInput: comma-separated integers.\nOutput: length of LIS.\n\nExample: 10,9,2,5,3,7,101,18 → 4 ([2,3,7,101])',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '10,9,2,5,3,7,101,18', expectedOutput: '4' },
      { input: '0,1,0,3,2,3', expectedOutput: '4' },
      { input: '7,7,7,7,7,7,7', expectedOutput: '1' },
    ],
  },
  {
    title: 'Minimum Window Substring',
    description: 'Given strings s and t, find the minimum window substring of s that contains all characters of t.\n\nInput: first line is s, second line is t.\nOutput: the minimum window substring, or empty string if none.\n\nExample: "ADOBECODEBANC", "ABC" → "BANC"',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'meta', 'amazon', 'apple'],
    type: 'coding',
    testCases: [
      { input: 'ADOBECODEBANC\nABC', expectedOutput: 'BANC' },
      { input: 'a\na', expectedOutput: 'a' },
      { input: 'a\naa', expectedOutput: '' },
    ],
  },
  {
    title: 'Coin Change (Dynamic Programming)',
    description: 'Given coin denominations and a total amount, find the fewest number of coins needed. Return -1 if not possible.\n\nInput: first line is comma-separated coin denominations, second line is the amount.\nOutput: minimum number of coins, or -1.\n\nExample: coins=[1,5,10,25], amount=30 → 2 (25+5)',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: '1,5,10,25\n30', expectedOutput: '2' },
      { input: '2\n3', expectedOutput: '-1' },
      { input: '1\n0', expectedOutput: '0' },
      { input: '1,2,5\n11', expectedOutput: '3' },
    ],
  },
  {
    title: 'N-Queens Count',
    description: 'Find how many distinct solutions exist for placing n queens on an n×n chessboard so that no two queens threaten each other.\n\nInput: n.\nOutput: number of solutions.\n\nExample: 4 → 2',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'apple'],
    type: 'coding',
    testCases: [
      { input: '4', expectedOutput: '2' },
      { input: '1', expectedOutput: '1' },
      { input: '8', expectedOutput: '92' },
    ],
  },
  {
    title: 'Word Break',
    description: 'Given a string s and a dictionary of words, determine if s can be segmented into space-separated dictionary words.\n\nInput: first line is the string, second line is comma-separated dictionary words.\nOutput: "true" or "false".\n\nExample: "leetcode", ["leet","code"] → "true"',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: 'leetcode\nleet,code', expectedOutput: 'true' },
      { input: 'applepenapple\napple,pen', expectedOutput: 'true' },
      { input: 'catsandog\ncats,dog,sand,and,cat', expectedOutput: 'false' },
    ],
  },
  {
    title: 'Median of Two Sorted Arrays',
    description: 'Find the median of two sorted arrays. The overall run time complexity should be O(log(m+n)).\n\nInput: first line is array1, second line is array2 (comma-separated).\nOutput: the median (as a number, use .5 if needed).\n\nExample: [1,3] and [2] → 2',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'apple', 'goldman-sachs'],
    type: 'coding',
    testCases: [
      { input: '1,3\n2', expectedOutput: '2' },
      { input: '1,2\n3,4', expectedOutput: '2.5' },
    ],
  },
  {
    title: 'Maximum Product Subarray',
    description: 'Find the contiguous subarray within an array that has the largest product.\n\nInput: comma-separated integers.\nOutput: maximum product.\n\nExample: 2,3,-2,4 → 6',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: '2,3,-2,4', expectedOutput: '6' },
      { input: '-2,0,-1', expectedOutput: '0' },
      { input: '-2,3,-4', expectedOutput: '24' },
    ],
  },
  {
    title: 'Edit Distance (Levenshtein)',
    description: 'Find the minimum number of operations (insert, delete, replace) to convert word1 to word2.\n\nInput: first line is word1, second line is word2.\nOutput: minimum edit distance.\n\nExample: "horse", "ros" → 3',
    difficulty: 'hard',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: 'horse\nros', expectedOutput: '3' },
      { input: 'intention\nexecution', expectedOutput: '5' },
      { input: '\na', expectedOutput: '1' },
    ],
  },
  {
    title: 'Merge Intervals',
    description: 'Given an array of intervals [start, end], merge all overlapping intervals.\n\nInput: JSON array of intervals.\nOutput: merged intervals as JSON array.\n\nExample: [[1,3],[2,6],[8,10],[15,18]] → [[1,6],[8,10],[15,18]]',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expectedOutput: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expectedOutput: '[[1,5]]' },
    ],
  },
  {
    title: 'Three Sum',
    description: 'Find all unique triplets in the array that give the sum of zero. Output sorted triplets.\n\nInput: comma-separated integers.\nOutput: triplets separated by | (each sorted, overall sorted).\n\nExample: -1,0,1,2,-1,-4 → -1,-1,2|-1,0,1',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'meta', 'microsoft', 'apple'],
    type: 'coding',
    testCases: [
      { input: '-1,0,1,2,-1,-4', expectedOutput: '-1,-1,2|-1,0,1' },
      { input: '0,0,0', expectedOutput: '0,0,0' },
    ],
  },
  {
    title: 'Sort Colors (Dutch National Flag)',
    description: 'Sort an array of 0s, 1s, and 2s in-place.\n\nInput: comma-separated integers (0, 1, or 2).\nOutput: sorted comma-separated integers.\n\nExample: 2,0,2,1,1,0 → 0,0,1,1,2,2',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: '2,0,2,1,1,0', expectedOutput: '0,0,1,1,2,2' },
      { input: '2,0,1', expectedOutput: '0,1,2' },
      { input: '0', expectedOutput: '0' },
    ],
  },
  {
    title: 'Implement a Stack using Array',
    description: 'Implement push, pop, peek, and isEmpty operations for a stack. Process a series of operations.\n\nInput: commands separated by newline (push X, pop, peek, isEmpty).\nOutput: results of peek/pop/isEmpty operations, one per line.\n\nExample:\npush 5\npush 10\npeek\npop\npeek\n→\n10\n10\n5',
    difficulty: 'medium',
    skills: ['dsa', 'data structures'],
    company: ['infosys', 'tcs', 'flipkart'],
    type: 'coding',
    testCases: [
      { input: 'push 5\npush 10\npeek\npop\npeek', expectedOutput: '10\n10\n5' },
      { input: 'push 1\nisEmpty\npop\nisEmpty', expectedOutput: 'false\n1\ntrue' },
    ],
  },
  {
    title: 'Generate All Permutations',
    description: 'Generate all permutations of a given string. Output sorted, separated by commas.\n\nInput: a string (all unique characters).\nOutput: all permutations sorted, comma-separated.\n\nExample: "abc" → abc,acb,bac,bca,cab,cba',
    difficulty: 'medium',
    skills: ['dsa', 'algorithms'],
    company: ['google', 'amazon', 'microsoft'],
    type: 'coding',
    testCases: [
      { input: 'abc', expectedOutput: 'abc,acb,bac,bca,cab,cba' },
      { input: 'ab', expectedOutput: 'ab,ba' },
      { input: 'a', expectedOutput: 'a' },
    ],
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-prep');
    console.log('Connected to DB');

    // Clear existing data
    await Question.deleteMany({});
    await Company.deleteMany({});
    console.log('Cleared existing questions and companies');

    // Seed companies
    await Company.insertMany(COMPANIES);
    console.log(`Seeded ${COMPANIES.length} companies`);

    let allQuestions = [];
    
    // Generate general questions (not tagged with any company)
    for(const skill of SKILLS) {
      const generated = generateQuestionsForSkill(skill);
      allQuestions = allQuestions.concat(generated);
    }
    console.log(`Generated ${allQuestions.length} general questions`);

    // Generate company-specific questions
    for (const [companySlug, skills] of Object.entries(COMPANY_SKILL_MAP)) {
      for (const skill of skills) {
        const generated = generateQuestionsForSkill(skill, companySlug);
        allQuestions = allQuestions.concat(generated);
      }
    }
    console.log(`Total questions (including company-specific): ${allQuestions.length}`);

    // Add real coding questions with proper test cases
    allQuestions = allQuestions.concat(CODING_QUESTIONS);
    console.log(`Added ${CODING_QUESTIONS.length} real coding problems. Grand total: ${allQuestions.length}`);

    // Insert in batches
    const batchSize = 500;
    for (let i = 0; i < allQuestions.length; i += batchSize) {
      const batch = allQuestions.slice(i, i + batchSize);
      await Question.insertMany(batch);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log(`Successfully seeded ${allQuestions.length} questions and ${COMPANIES.length} companies!`);
    mongoose.disconnect();
  } catch(e) {
    console.error('Seeding error:', e);
    mongoose.disconnect();
  }
};

seedDatabase();

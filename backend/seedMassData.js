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

// Skills with proper MCQ questions available
const SKILLS_WITH_MCQS = ['java', 'python', 'javascript', 'dsa', 'sql', 'system design'];

// Additional skills without specific MCQs (will only use coding questions if any)
const OTHER_SKILLS = [
  'c++', 'c#', 'ruby', 'go', 'rust',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
  'mongodb', 'mysql', 'postgresql', 'nosql', 'redis',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes',
  'data structures', 'algorithms', 'machine learning', 'ai'
];

// MCQ Question database by skill/category with realistic options
const MCQ_QUESTIONS_BY_CATEGORY = {
  'java': [
    // Easy
    {
      title: 'What is the entry point of a Java program?',
      description: 'Identify the method that serves as the entry point.',
      difficulty: 'easy',
      options: [
        { text: 'public static void main(String[] args)', isCorrect: true },
        { text: 'public void start()', isCorrect: false },
        { text: 'public static void init()', isCorrect: false },
        { text: 'public void run()', isCorrect: false }
      ]
    },
    {
      title: 'Which keyword is used to create a variable that cannot be changed?',
      description: 'Find the keyword for immutable variables.',
      difficulty: 'easy',
      options: [
        { text: 'final', isCorrect: true },
        { text: 'static', isCorrect: false },
        { text: 'const', isCorrect: false },
        { text: 'immutable', isCorrect: false }
      ]
    },
    {
      title: 'What is the default value of an integer variable in Java?',
      description: 'Choose the default value for int variables.',
      difficulty: 'easy',
      options: [
        { text: '0', isCorrect: true },
        { text: 'null', isCorrect: false },
        { text: '-1', isCorrect: false },
        { text: 'undefined', isCorrect: false }
      ]
    },
    {
      title: 'Which of these is NOT a primitive data type in Java?',
      description: 'Identify the non-primitive type.',
      difficulty: 'easy',
      options: [
        { text: 'String', isCorrect: true },
        { text: 'int', isCorrect: false },
        { text: 'boolean', isCorrect: false },
        { text: 'double', isCorrect: false }
      ]
    },
    {
      title: 'What does JVM stand for?',
      description: 'Expand the JVM acronym.',
      difficulty: 'easy',
      options: [
        { text: 'Java Virtual Machine', isCorrect: true },
        { text: 'Java Variable Manager', isCorrect: false },
        { text: 'Java Version Module', isCorrect: false },
        { text: 'Java Vector Machine', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is the difference between ArrayList and LinkedList?',
      description: 'Compare ArrayList and LinkedList data structures.',
      difficulty: 'medium',
      options: [
        { text: 'ArrayList uses array internally, LinkedList uses doubly-linked list', isCorrect: true },
        { text: 'LinkedList is faster for all operations', isCorrect: false },
        { text: 'ArrayList cannot store duplicates', isCorrect: false },
        { text: 'LinkedList is thread-safe by default', isCorrect: false }
      ]
    },
    {
      title: 'Which collection is best for frequent insertions and deletions in the middle?',
      description: 'Choose the optimal collection type.',
      difficulty: 'medium',
      options: [
        { text: 'LinkedList', isCorrect: true },
        { text: 'ArrayList', isCorrect: false },
        { text: 'Array', isCorrect: false },
        { text: 'TreeMap', isCorrect: false }
      ]
    },
    {
      title: 'What is the purpose of the throws keyword in Java?',
      description: 'Understand exception declaration.',
      difficulty: 'medium',
      options: [
        { text: 'Declares that a method may throw checked exceptions', isCorrect: true },
        { text: 'Throws an exception immediately', isCorrect: false },
        { text: 'Catches exceptions from methods', isCorrect: false },
        { text: 'Prevents exceptions from occurring', isCorrect: false }
      ]
    },
    {
      title: 'What is method overloading?',
      description: 'Define method overloading concept.',
      difficulty: 'medium',
      options: [
        { text: 'Having multiple methods with same name but different parameters', isCorrect: true },
        { text: 'Calling a method multiple times', isCorrect: false },
        { text: 'Extending a method from parent class', isCorrect: false },
        { text: 'Creating static methods with same name', isCorrect: false }
      ]
    },
    {
      title: 'What is method overriding?',
      description: 'Define method overriding concept.',
      difficulty: 'medium',
      options: [
        { text: 'Redefining parent class method in child class with same signature', isCorrect: true },
        { text: 'Creating multiple versions of a method', isCorrect: false },
        { text: 'Hiding parent class methods', isCorrect: false },
        { text: 'Calling parent method from child method', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'Explain the difference between shallow and deep copy.',
      description: 'Understand shallow and deep copying mechanisms.',
      difficulty: 'hard',
      options: [
        { text: 'Shallow copy copies references only, deep copy creates new independent objects', isCorrect: true },
        { text: 'Shallow copy is faster and always preferred', isCorrect: false },
        { text: 'Deep copy is only for primitives', isCorrect: false },
        { text: 'They are the same in Java', isCorrect: false }
      ]
    },
    {
      title: 'What is the significance of the transient keyword?',
      description: 'Understand the transient keyword in Java.',
      difficulty: 'hard',
      options: [
        { text: 'It marks variables that should not be serialized', isCorrect: true },
        { text: 'It makes variables thread-safe', isCorrect: false },
        { text: 'It prevents garbage collection', isCorrect: false },
        { text: 'It automatically initializes variables', isCorrect: false }
      ]
    }
  ],
  'python': [
    // Easy
    {
      title: 'What is the correct way to create a list in Python?',
      description: 'Identify the correct list syntax.',
      difficulty: 'easy',
      options: [
        { text: 'my_list = [1, 2, 3]', isCorrect: true },
        { text: 'my_list = (1, 2, 3)', isCorrect: false },
        { text: 'my_list = {1, 2, 3}', isCorrect: false },
        { text: 'my_list = <1, 2, 3>', isCorrect: false }
      ]
    },
    {
      title: 'Which keyword is used to create a function in Python?',
      description: 'Identify the function declaration keyword.',
      difficulty: 'easy',
      options: [
        { text: 'def', isCorrect: true },
        { text: 'function', isCorrect: false },
        { text: 'define', isCorrect: false },
        { text: 'func', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between a tuple and a list?',
      description: 'Compare tuples and lists.',
      difficulty: 'easy',
      options: [
        { text: 'Tuples are immutable, lists are mutable', isCorrect: true },
        { text: 'They are the same thing', isCorrect: false },
        { text: 'Lists cannot contain duplicates', isCorrect: false },
        { text: 'Tuples are faster than lists', isCorrect: false }
      ]
    },
    {
      title: 'What does the len() function return for a string?',
      description: 'Understand the len() function.',
      difficulty: 'easy',
      options: [
        { text: 'The number of characters in the string', isCorrect: true },
        { text: 'The first character of the string', isCorrect: false },
        { text: 'The ASCII value of the string', isCorrect: false },
        { text: 'A list of characters', isCorrect: false }
      ]
    },
    {
      title: 'Which data type is used to store key-value pairs?',
      description: 'Identify the correct data structure.',
      difficulty: 'easy',
      options: [
        { text: 'Dictionary', isCorrect: true },
        { text: 'List', isCorrect: false },
        { text: 'Set', isCorrect: false },
        { text: 'Tuple', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is a list comprehension?',
      description: 'Define list comprehension.',
      difficulty: 'medium',
      options: [
        { text: 'A concise way to create lists by applying an expression to each element of an iterable', isCorrect: true },
        { text: 'A method to compress lists', isCorrect: false },
        { text: 'A way to understand lists better', isCorrect: false },
        { text: 'A loop that cannot be broken', isCorrect: false }
      ]
    },
    {
      title: 'What is a lambda function?',
      description: 'Understand lambda functions.',
      difficulty: 'medium',
      options: [
        { text: 'An anonymous function defined with lambda keyword', isCorrect: true },
        { text: 'A function that processes lists', isCorrect: false },
        { text: 'A function that never returns', isCorrect: false },
        { text: 'A recursive function', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between == and is?',
      description: 'Compare equality operators.',
      difficulty: 'medium',
      options: [
        { text: '== checks value equality, is checks object identity', isCorrect: true },
        { text: 'They are identical in Python', isCorrect: false },
        { text: 'is is for numbers, == is for strings', isCorrect: false },
        { text: 'is is more efficient than ==', isCorrect: false }
      ]
    },
    {
      title: 'What does the *args parameter allow?',
      description: 'Understand *args in functions.',
      difficulty: 'medium',
      options: [
        { text: 'Passing variable number of non-keyword arguments', isCorrect: true },
        { text: 'Passing multiple keyword arguments', isCorrect: false },
        { text: 'Multiplying arguments together', isCorrect: false },
        { text: 'Accessing default arguments', isCorrect: false }
      ]
    },
    {
      title: 'What is the Global Interpreter Lock (GIL)?',
      description: 'Understand GIL in Python.',
      difficulty: 'medium',
      options: [
        { text: 'A lock that allows only one thread to execute Python bytecode at a time', isCorrect: true },
        { text: 'A protection mechanism for global variables', isCorrect: false },
        { text: 'A requirement for parallel programming', isCorrect: false },
        { text: 'A feature of Python 3 only', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'Explain decorators in Python.',
      description: 'Understand how decorators work in Python.',
      difficulty: 'hard',
      options: [
        { text: 'Functions that modify other functions or classes without permanently changing them', isCorrect: true },
        { text: 'Functions that add visual decorations to code', isCorrect: false },
        { text: 'A type of error handling mechanism', isCorrect: false },
        { text: 'Methods for string formatting', isCorrect: false }
      ]
    },
    {
      title: 'What are metaclasses?',
      description: 'Understand metaclasses as classes of classes.',
      difficulty: 'hard',
      options: [
        { text: 'Classes whose instances are classes', isCorrect: true },
        { text: 'Abstract base classes', isCorrect: false },
        { text: 'Classes that inherit from multiple parents', isCorrect: false },
        { text: 'Built-in classes in Python', isCorrect: false }
      ]
    }
  ],
  'javascript': [
    // Easy
    {
      title: 'How do you declare a variable in JavaScript?',
      description: 'Identify the ways to declare variables.',
      difficulty: 'easy',
      options: [
        { text: 'var, let, or const', isCorrect: true },
        { text: 'Only var', isCorrect: false },
        { text: 'int or string', isCorrect: false },
        { text: 'variable or var', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between undefined and null?',
      description: 'Compare undefined and null.',
      difficulty: 'easy',
      options: [
        { text: 'undefined is unintentionally missing, null is intentionally empty', isCorrect: true },
        { text: 'They are the same', isCorrect: false },
        { text: 'null is for objects, undefined is for primitives', isCorrect: false },
        { text: 'undefined is for variables, null is for functions', isCorrect: false }
      ]
    },
    {
      title: 'What will console.log(typeof []) return?',
      description: 'Understand the typeof operator.',
      difficulty: 'easy',
      options: [
        { text: '"object"', isCorrect: true },
        { text: '"array"', isCorrect: false },
        { text: '"list"', isCorrect: false },
        { text: '"undefined"', isCorrect: false }
      ]
    },
    {
      title: 'How do you add an element to the end of an array?',
      description: 'Know array methods.',
      difficulty: 'easy',
      options: [
        { text: 'array.push(element)', isCorrect: true },
        { text: 'array.add(element)', isCorrect: false },
        { text: 'array.append(element)', isCorrect: false },
        { text: 'array.insert(element)', isCorrect: false }
      ]
    },
    {
      title: 'What is the purpose of the === operator?',
      description: 'Understand strict equality.',
      difficulty: 'easy',
      options: [
        { text: 'Strict equality comparison (value and type)', isCorrect: true },
        { text: 'Loose equality comparison', isCorrect: false },
        { text: 'Assignment operator', isCorrect: false },
        { text: 'Comparison operator for strings only', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is closure in JavaScript?',
      description: 'Understand closures.',
      difficulty: 'medium',
      options: [
        { text: 'A function that has access to variables from another function scope', isCorrect: true },
        { text: 'A way to close a function', isCorrect: false },
        { text: 'An error that stops code execution', isCorrect: false },
        { text: 'A deprecated JavaScript feature', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between var, let, and const?',
      description: 'Compare variable declarations.',
      difficulty: 'medium',
      options: [
        { text: 'var is function-scoped, let and const are block-scoped; const cannot be reassigned', isCorrect: true },
        { text: 'They are all identical', isCorrect: false },
        { text: 'const is for numbers only', isCorrect: false },
        { text: 'let is deprecated', isCorrect: false }
      ]
    },
    {
      title: 'What does the spread operator (...) do?',
      description: 'Understand the spread operator.',
      difficulty: 'medium',
      options: [
        { text: 'Expands an array or object into individual elements', isCorrect: true },
        { text: 'Repeats an element multiple times', isCorrect: false },
        { text: 'Creates a new variable scope', isCorrect: false },
        { text: 'Concatenates strings', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between map and forEach?',
      description: 'Compare array methods.',
      difficulty: 'medium',
      options: [
        { text: 'map returns a new array, forEach does not', isCorrect: true },
        { text: 'They are identical', isCorrect: false },
        { text: 'forEach is faster than map', isCorrect: false },
        { text: 'map only works with numbers', isCorrect: false }
      ]
    },
    {
      title: 'What is a Promise?',
      description: 'Understand Promises.',
      difficulty: 'medium',
      options: [
        { text: 'An object representing the eventual completion of an async operation', isCorrect: true },
        { text: 'A guarantee that code will work', isCorrect: false },
        { text: 'A way to break code execution', isCorrect: false },
        { text: 'An error handling mechanism', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'Explain Event Delegation.',
      description: 'Understand event delegation pattern in JavaScript.',
      difficulty: 'hard',
      options: [
        { text: 'Attaching event listener to parent to handle events of child elements', isCorrect: true },
        { text: 'Creating multiple event listeners for each element', isCorrect: false },
        { text: 'Removing event listeners from elements', isCorrect: false },
        { text: 'A method to prioritize event execution', isCorrect: false }
      ]
    },
    {
      title: 'What is the Event Loop?',
      description: 'Understand the event loop in JavaScript runtime.',
      difficulty: 'hard',
      options: [
        { text: 'Mechanism that handles async code execution by checking callback queue', isCorrect: true },
        { text: 'A loop that never ends', isCorrect: false },
        { text: 'A way to repeat events', isCorrect: false },
        { text: 'An error in JavaScript engines', isCorrect: false }
      ]
    }
  ],
  'dsa': [
    // Easy
    {
      title: 'What is Time Complexity?',
      description: 'Define time complexity concept.',
      difficulty: 'easy',
      options: [
        { text: 'A measure of how long an algorithm takes to run as input size grows', isCorrect: true },
        { text: 'The total time an algorithm executes', isCorrect: false },
        { text: 'How complex an algorithm is to understand', isCorrect: false },
        { text: 'The number of variables used', isCorrect: false }
      ]
    },
    {
      title: 'What is Space Complexity?',
      description: 'Define space complexity concept.',
      difficulty: 'easy',
      options: [
        { text: 'The amount of memory an algorithm uses as input size grows', isCorrect: true },
        { text: 'The physical space a computer occupies', isCorrect: false },
        { text: 'The number of lines of code', isCorrect: false },
        { text: 'The amount of disk storage needed', isCorrect: false }
      ]
    },
    {
      title: 'Which sorting algorithm has the best average-case time complexity?',
      description: 'Identify the optimal sorting algorithm.',
      difficulty: 'easy',
      options: [
        { text: 'Merge Sort or Quick Sort (O(n log n))', isCorrect: true },
        { text: 'Bubble Sort (O(n²))', isCorrect: false },
        { text: 'Insertion Sort (O(n²))', isCorrect: false },
        { text: 'Selection Sort (O(n²))', isCorrect: false }
      ]
    },
    {
      title: 'What is a Hash Table?',
      description: 'Define hash table data structure.',
      difficulty: 'easy',
      options: [
        { text: 'A data structure that uses hash function to map keys to indices', isCorrect: true },
        { text: 'A table of hashed passwords', isCorrect: false },
        { text: 'A type of sorting algorithm', isCorrect: false },
        { text: 'A deprecated data structure', isCorrect: false }
      ]
    },
    {
      title: 'What is a Stack?',
      description: 'Define stack data structure.',
      difficulty: 'easy',
      options: [
        { text: 'LIFO data structure (Last In First Out)', isCorrect: true },
        { text: 'FIFO data structure (First In First Out)', isCorrect: false },
        { text: 'A pile of papers in order', isCorrect: false },
        { text: 'A memory management technique', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is Binary Search and what is its time complexity?',
      description: 'Understand binary search.',
      difficulty: 'medium',
      options: [
        { text: 'Search algorithm that divides sorted array in half, O(log n) time', isCorrect: true },
        { text: 'Linear search through all elements, O(n) time', isCorrect: false },
        { text: 'Searching for binary numbers, O(1) time', isCorrect: false },
        { text: 'Searching two arrays, O(n²) time', isCorrect: false }
      ]
    },
    {
      title: 'What is a Linked List advantage over Array?',
      description: 'Compare linked list and array.',
      difficulty: 'medium',
      options: [
        { text: 'Dynamic size and efficient insertion/deletion in middle', isCorrect: true },
        { text: 'Faster random access', isCorrect: false },
        { text: 'Uses less memory', isCorrect: false },
        { text: 'Easier to implement', isCorrect: false }
      ]
    },
    {
      title: 'What is a Binary Search Tree (BST)?',
      description: 'Define BST properties.',
      difficulty: 'medium',
      options: [
        { text: 'Tree where left child < parent < right child', isCorrect: true },
        { text: 'A tree with only two levels', isCorrect: false },
        { text: 'A tree used only for searching strings', isCorrect: false },
        { text: 'A tree that is always perfectly balanced', isCorrect: false }
      ]
    },
    {
      title: 'What is Dynamic Programming?',
      description: 'Understand dynamic programming.',
      difficulty: 'medium',
      options: [
        { text: 'Technique to solve problems by breaking into subproblems and storing results', isCorrect: true },
        { text: 'Programming that runs during runtime only', isCorrect: false },
        { text: 'A type of sorting algorithm', isCorrect: false },
        { text: 'Programming with dynamic variables', isCorrect: false }
      ]
    },
    {
      title: 'What is a Graph?',
      description: 'Define graph data structure.',
      difficulty: 'medium',
      options: [
        { text: 'Collection of vertices/nodes connected by edges', isCorrect: true },
        { text: 'A visual representation of data', isCorrect: false },
        { text: 'An array of arrays', isCorrect: false },
        { text: 'A type of sorting algorithm', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'Explain NP-Complete problems.',
      description: 'Understand NP-Complete problem complexity.',
      difficulty: 'hard',
      options: [
        { text: 'Problems whose solutions can be verified quickly but solved slowly, like TSP', isCorrect: true },
        { text: 'Problems with no solution', isCorrect: false },
        { text: 'Problems that only computers cannot solve', isCorrect: false },
        { text: 'Problems related to network protocols', isCorrect: false }
      ]
    },
    {
      title: 'What is the significance of Big O notation?',
      description: 'Understand Big O notation and algorithm complexity.',
      difficulty: 'hard',
      options: [
        { text: 'It describes the upper bound of algorithm complexity in worst case', isCorrect: true },
        { text: 'It describes the exact time an algorithm takes', isCorrect: false },
        { text: 'It is used for optimization only', isCorrect: false },
        { text: 'It has no practical application', isCorrect: false }
      ]
    }
  ],
  'sql': [
    // Easy
    {
      title: 'What is SQL?',
      description: 'Define SQL.',
      difficulty: 'easy',
      options: [
        { text: 'Structured Query Language for managing databases', isCorrect: true },
        { text: 'Simple Query Library', isCorrect: false },
        { text: 'Standard Question Language', isCorrect: false },
        { text: 'Secure Query Logic', isCorrect: false }
      ]
    },
    {
      title: 'What is a PRIMARY KEY?',
      description: 'Understand PRIMARY KEY constraint.',
      difficulty: 'easy',
      options: [
        { text: 'A column that uniquely identifies each row in a table', isCorrect: true },
        { text: 'The first column in a table', isCorrect: false },
        { text: 'A password for the database', isCorrect: false },
        { text: 'The most important column', isCorrect: false }
      ]
    },
    {
      title: 'What is a FOREIGN KEY?',
      description: 'Understand FOREIGN KEY constraint.',
      difficulty: 'easy',
      options: [
        { text: 'A column that references PRIMARY KEY in another table', isCorrect: true },
        { text: 'A key imported from outside', isCorrect: false },
        { text: 'A key used for security', isCorrect: false },
        { text: 'A backup key', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between SELECT and UPDATE?',
      description: 'Compare SQL commands.',
      difficulty: 'easy',
      options: [
        { text: 'SELECT retrieves data, UPDATE modifies existing data', isCorrect: true },
        { text: 'They do the same thing', isCorrect: false },
        { text: 'UPDATE creates new records', isCorrect: false },
        { text: 'SELECT is faster than UPDATE', isCorrect: false }
      ]
    },
    {
      title: 'What is a NULL value in SQL?',
      description: 'Understand NULL in SQL.',
      difficulty: 'easy',
      options: [
        { text: 'A value representing the absence of data or unknown value', isCorrect: true },
        { text: 'The number zero', isCorrect: false },
        { text: 'An empty string', isCorrect: false },
        { text: 'A false boolean value', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is a JOIN in SQL?',
      description: 'Understand SQL JOIN.',
      difficulty: 'medium',
      options: [
        { text: 'Combining rows from multiple tables based on a related column', isCorrect: true },
        { text: 'Combining all data from two tables', isCorrect: false },
        { text: 'Creating a new table', isCorrect: false },
        { text: 'Deleting rows from a table', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between INNER JOIN and LEFT JOIN?',
      description: 'Compare JOIN types.',
      difficulty: 'medium',
      options: [
        { text: 'INNER returns matching rows; LEFT returns all left table rows', isCorrect: true },
        { text: 'They are the same', isCorrect: false },
        { text: 'LEFT JOIN is faster', isCorrect: false },
        { text: 'INNER JOIN includes all columns', isCorrect: false }
      ]
    },
    {
      title: 'What is a GROUP BY clause used for?',
      description: 'Understand GROUP BY.',
      difficulty: 'medium',
      options: [
        { text: 'Grouping rows sharing the same values for aggregate functions', isCorrect: true },
        { text: 'Sorting data in groups', isCorrect: false },
        { text: 'Creating multiple tables', isCorrect: false },
        { text: 'Filtering rows before displaying', isCorrect: false }
      ]
    },
    {
      title: 'What is the difference between WHERE and HAVING?',
      description: 'Compare WHERE and HAVING.',
      difficulty: 'medium',
      options: [
        { text: 'WHERE filters rows, HAVING filters groups', isCorrect: true },
        { text: 'They are identical', isCorrect: false },
        { text: 'HAVING comes before WHERE', isCorrect: false },
        { text: 'WHERE is for numbers, HAVING is for strings', isCorrect: false }
      ]
    },
    {
      title: 'What is a subquery?',
      description: 'Understand subqueries.',
      difficulty: 'medium',
      options: [
        { text: 'A query within another query', isCorrect: true },
        { text: 'A query that fails', isCorrect: false },
        { text: 'A query that returns no results', isCorrect: false },
        { text: 'An incomplete query', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'What is Database Normalization?',
      description: 'Understand database normalization and normal forms.',
      difficulty: 'hard',
      options: [
        { text: 'Process of organizing data to reduce redundancy and improve integrity', isCorrect: true },
        { text: 'Making all data the same', isCorrect: false },
        { text: 'Deleting unnecessary tables', isCorrect: false },
        { text: 'Creating more indexes', isCorrect: false }
      ]
    },
    {
      title: 'What are the benefits of using indexes?',
      description: 'Understand database indexing benefits.',
      difficulty: 'hard',
      options: [
        { text: 'Faster data retrieval by reducing full table scans', isCorrect: true },
        { text: 'Increased storage space', isCorrect: false },
        { text: 'Automatic data backup', isCorrect: false },
        { text: 'No benefits, just overhead', isCorrect: false }
      ]
    }
  ],
  'system design': [
    // Easy
    {
      title: 'What is Scalability?',
      description: 'Define scalability.',
      difficulty: 'easy',
      options: [
        { text: 'Ability of a system to handle increasing load efficiently', isCorrect: true },
        { text: 'The size of the system', isCorrect: false },
        { text: 'How many users are currently using it', isCorrect: false },
        { text: 'The cost of the system', isCorrect: false }
      ]
    },
    {
      title: 'What is Availability?',
      description: 'Define availability.',
      difficulty: 'easy',
      options: [
        { text: 'The percentage of time a system is operational', isCorrect: true },
        { text: 'How many servers are available', isCorrect: false },
        { text: 'Whether the system is online', isCorrect: false },
        { text: 'The speed of the system', isCorrect: false }
      ]
    },
    {
      title: 'What is Consistency?',
      description: 'Define consistency in distributed systems.',
      difficulty: 'easy',
      options: [
        { text: 'All nodes have the same data at the same time', isCorrect: true },
        { text: 'Data never changes', isCorrect: false },
        { text: 'All users see the same interface', isCorrect: false },
        { text: 'The system follows the same protocols', isCorrect: false }
      ]
    },
    {
      title: 'What is Load Balancing?',
      description: 'Define load balancing.',
      difficulty: 'easy',
      options: [
        { text: 'Distributing network traffic across multiple servers', isCorrect: true },
        { text: 'Balancing the weight of physical servers', isCorrect: false },
        { text: 'Equalizing server costs', isCorrect: false },
        { text: 'Checking server health', isCorrect: false }
      ]
    },
    {
      title: 'What is a Cache?',
      description: 'Define caching.',
      difficulty: 'easy',
      options: [
        { text: 'Fast temporary storage for frequently accessed data', isCorrect: true },
        { text: 'A backup storage', isCorrect: false },
        { text: 'A security mechanism', isCorrect: false },
        { text: 'A type of database', isCorrect: false }
      ]
    },
    // Medium
    {
      title: 'What is the CAP Theorem?',
      description: 'Understand CAP theorem.',
      difficulty: 'medium',
      options: [
        { text: 'Consistency, Availability, Partition tolerance - pick 2 in distributed systems', isCorrect: true },
        { text: 'A theorem for data compression', isCorrect: false },
        { text: 'A rule for database design', isCorrect: false },
        { text: 'A security framework', isCorrect: false }
      ]
    },
    {
      title: 'What is Database Replication?',
      description: 'Understand database replication.',
      difficulty: 'medium',
      options: [
        { text: 'Copying data from one database to another for redundancy', isCorrect: true },
        { text: 'Creating a backup file', isCorrect: false },
        { text: 'Duplicating database schema', isCorrect: false },
        { text: 'Splitting data across databases', isCorrect: false }
      ]
    },
    {
      title: 'What is Database Sharding?',
      description: 'Understand sharding.',
      difficulty: 'medium',
      options: [
        { text: 'Horizontally partitioning data across multiple databases', isCorrect: true },
        { text: 'Vertical partitioning of data', isCorrect: false },
        { text: 'Compressing database size', isCorrect: false },
        { text: 'Creating backup shards', isCorrect: false }
      ]
    },
    {
      title: 'What is Message Queue?',
      description: 'Understand message queues.',
      difficulty: 'medium',
      options: [
        { text: 'System for asynchronous communication between services', isCorrect: true },
        { text: 'A queue of pending messages', isCorrect: false },
        { text: 'A way to send emails', isCorrect: false },
        { text: 'A backup messaging system', isCorrect: false }
      ]
    },
    {
      title: 'What is a CDN?',
      description: 'Understand CDN.',
      difficulty: 'medium',
      options: [
        { text: 'Content Delivery Network - serves content from servers near users', isCorrect: true },
        { text: 'A database for content', isCorrect: false },
        { text: 'A video streaming service', isCorrect: false },
        { text: 'A messaging protocol', isCorrect: false }
      ]
    },
    // Hard
    {
      title: 'What is Microservices Architecture?',
      description: 'Understand microservices architecture and design patterns.',
      difficulty: 'hard',
      options: [
        { text: 'Building application as collection of loosely coupled independent services', isCorrect: true },
        { text: 'Making services very small', isCorrect: false },
        { text: 'Breaking a monolith randomly', isCorrect: false },
        { text: 'A type of database architecture', isCorrect: false }
      ]
    },
    {
      title: 'What is ACID in databases?',
      description: 'Understand ACID properties in database transactions.',
      difficulty: 'hard',
      options: [
        { text: 'Atomicity, Consistency, Isolation, Durability - transaction properties', isCorrect: true },
        { text: 'A chemical compound', isCorrect: false },
        { text: 'A corruption pattern', isCorrect: false },
        { text: 'A network protocol', isCorrect: false }
      ]
    }
  ]
};

const generateQuestionsForSkill = (skill, companySlug = null) => {
  const questions = [];
  
  // Get category-specific MCQs if available
  const categoryQuestions = MCQ_QUESTIONS_BY_CATEGORY[skill] || [];
  
  if (categoryQuestions.length > 0) {
    // Use real category-specific questions
    categoryQuestions.forEach((q, idx) => {
      questions.push({
        title: q.title,
        description: q.description || '',
        difficulty: q.difficulty,
        skills: [skill],
        company: companySlug ? [companySlug] : [],
        type: 'mcq',
        options: q.options
      });
    });
  }
  
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
    
    // Generate MCQ questions for skills with proper question banks
    for(const skill of SKILLS_WITH_MCQS) {
      const generated = generateQuestionsForSkill(skill);
      allQuestions = allQuestions.concat(generated);
    }
    console.log(`Generated ${allQuestions.length} MCQ questions from category-specific banks`);

    // Generate company-specific MCQ questions
    for (const [companySlug, skills] of Object.entries(COMPANY_SKILL_MAP)) {
      for (const skill of skills) {
        if (SKILLS_WITH_MCQS.includes(skill)) {
          const generated = generateQuestionsForSkill(skill, companySlug);
          allQuestions = allQuestions.concat(generated);
        }
      }
    }
    console.log(`Added company-specific questions. Total MCQs: ${allQuestions.length}`);

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

    console.log(`✅ Successfully seeded ${allQuestions.length} questions and ${COMPANIES.length} companies!`);
    mongoose.disconnect();
  } catch(e) {
    console.error('Seeding error:', e);
    mongoose.disconnect();
  }
};

seedDatabase();

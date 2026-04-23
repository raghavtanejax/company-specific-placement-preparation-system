# 🎯 PrepAI — Company-Specific Placement Preparation System

A full-stack MERN platform that helps students prepare for company-specific placement interviews with AI-powered analysis, curated question banks, real coding challenges, and community-driven interview experiences.

![Tech Stack](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Gemini](https://img.shields.io/badge/Google-Gemini_AI-4285F4?logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

---

## ✨ Features

### 🏢 Company-Specific Question Banks
- Browse **10 top companies** (Google, Amazon, Microsoft, Meta, Apple, Flipkart, Goldman Sachs, TCS, Infosys, Wipro)
- Each company has a **hiring roadmap** (rounds, focus areas, CTC range)
- **2300+ questions** tagged by company, skill, and difficulty
- Practice questions tailored to your target company

### 🤖 AI-Powered JD Analysis (Google Gemini)
- Paste any **Job Description** and get intelligent analysis
- Extracts skills with **confidence levels** (High/Medium/Low)
- Detects **role seniority** (Junior/Mid/Senior)
- Generates a **personalized study plan** with weekly schedule
- Shows **gap analysis** — your skills vs. what the JD requires
- Falls back to keyword matching if API key is not configured

### 💻 Interactive Code Editor
- **Monaco Editor** (VS Code engine) for coding questions
- **Cloud code execution** via Piston API
- **43 real coding problems** — Two Sum, Trapping Rain Water, N-Queens, Coin Change, and more
- Multiple test cases with expected outputs per problem
- Covers Easy → Medium → Hard across all major DSA topics

### 📊 Quiz History & Analytics
- Tracks every quiz attempt with per-question details
- **Accuracy trend** line chart over time
- **Topic-wise accuracy** breakdown bar chart
- Time analysis per question
- Dashboard shows recent quizzes widget

### 🔖 Bookmarks
- Bookmark any question during a quiz for later revision
- Dedicated **Bookmarks page** with skill/difficulty filters
- One-click "Practice Bookmarked" mode

### 💬 Interview Experiences
- Community-driven interview stories
- **Round-by-round breakdown** with questions asked and tips
- Filter by company, result (Selected/Rejected/Pending)
- **Upvote** helpful experiences
- Submit your own experiences with a dynamic multi-round form

### 🎮 Gamification
- **XP system** — earn points for every quiz
- **Daily streaks** with longest streak tracking
- **Skill radar chart** on dashboard
- Weak area identification

### 🔐 Authentication
- JWT-based auth with secure password hashing (bcrypt)
- Protected routes with auth middleware
- Persistent login with localStorage

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, React Router 7, Framer Motion, Recharts, Monaco Editor, Lucide Icons, Tailwind CSS |
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB Atlas |
| **AI** | Google Gemini 1.5 Flash |
| **Code Execution** | Piston API (cloud-based) |
| **Auth** | JWT + bcryptjs |

---

## 📁 Project Structure

```
company-specific-placement-preparation-system/
├── backend/
│   ├── controllers/
│   │   ├── analysisController.js    # AI-powered JD analysis (Gemini)
│   │   ├── authController.js        # Login/Register
│   │   ├── companyController.js     # Company CRUD + question counts
│   │   ├── experienceController.js  # Interview experiences CRUD
│   │   ├── historyController.js     # Quiz history + analytics
│   │   ├── questionController.js    # Question recommendation engine
│   │   └── userController.js        # Dashboard, performance, bookmarks
│   ├── middleware/
│   │   └── auth.js                  # JWT auth middleware
│   ├── models/
│   │   ├── Company.js               # Company schema
│   │   ├── InterviewExperience.js   # Interview experience schema
│   │   ├── Question.js              # Question schema (MCQ + Coding)
│   │   ├── QuizAttempt.js           # Quiz history schema
│   │   └── User.js                  # User schema with bookmarks
│   ├── routes/
│   │   └── api.js                   # All API routes
│   ├── seedMassData.js              # Database seeder (companies + questions)
│   ├── server.js                    # Express server entry point
│   ├── package.json
│   └── .env                         # Environment variables
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   └── Navbar.css
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Main dashboard with stats
│   │   │   ├── Companies.jsx        # Company explorer grid
│   │   │   ├── CompanyDetail.jsx    # Company roadmap + details
│   │   │   ├── JDAnalysis.jsx       # AI job description analyzer
│   │   │   ├── Quiz.jsx             # Quiz engine with code editor
│   │   │   ├── History.jsx          # Quiz history + analytics charts
│   │   │   ├── Bookmarks.jsx        # Saved questions
│   │   │   ├── Experiences.jsx      # Interview experiences list
│   │   │   ├── ExperienceDetail.jsx # Single experience view
│   │   │   ├── NewExperience.jsx    # Submit experience form
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   └── api.js               # Axios instance with auth interceptor
│   │   ├── App.jsx                  # Router + routes
│   │   ├── index.css                # Global styles + design system
│   │   └── main.jsx                 # App entry point
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB Atlas** account (or local MongoDB)
- **Google Gemini API key** (optional — for AI-powered JD analysis)

### 1. Clone the Repository

```bash
git clone https://github.com/raghavtanejax/company-specific-placement-preparation-system.git
cd company-specific-placement-preparation-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_here    # Optional - get from https://aistudio.google.com/apikey
```

Seed the database with companies and questions:

```bash
node seedMassData.js
```

Start the backend server:

```bash
node server.js
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to **http://localhost:5173/** in your browser.

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Companies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies` | List all companies with question counts |
| GET | `/api/companies/:slug` | Get company details |
| GET | `/api/companies/:slug/questions` | Get company-specific questions |

### Questions & Quiz
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/questions/recommend` | Get recommended questions (filter by skills, company, difficulty) |
| POST | `/api/quiz/save` | Save a completed quiz attempt |
| GET | `/api/quiz/history` | Get user's quiz history (paginated) |
| GET | `/api/quiz/analytics` | Get analytics (accuracy trends, topic breakdown) |

### JD Analysis
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analysis/analyze-jd` | Analyze a job description with AI |

### Bookmarks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/user/bookmarks/:questionId` | Toggle bookmark on a question |
| GET | `/api/user/bookmarks` | Get all bookmarked questions |

### Interview Experiences
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/experiences` | Share an interview experience |
| GET | `/api/experiences` | List experiences (filter by company, result) |
| GET | `/api/experiences/:id` | View a single experience |
| POST | `/api/experiences/:id/upvote` | Toggle upvote |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user/dashboard` | Get user profile + recent quizzes |
| PUT | `/api/user/performance` | Update performance after quiz |

---

## 📊 Database Schema

```
Users          Companies        Questions         QuizAttempts       InterviewExperiences
├─ name        ├─ name          ├─ title           ├─ userId          ├─ author
├─ email       ├─ slug          ├─ description     ├─ company         ├─ company
├─ password    ├─ description   ├─ difficulty      ├─ skills[]        ├─ role
├─ performance ├─ difficulty    ├─ skills[]        ├─ questions[]     ├─ difficulty
│  ├─ xp       ├─ hiringPattern├─ company[]       │  ├─ questionId   ├─ result
│  ├─ streak   │  ├─ rounds[]  ├─ type (mcq/code) │  ├─ isCorrect    ├─ rounds[]
│  ├─ skills   │  ├─ focusAreas├─ options[]       │  └─ timeTaken    │  ├─ name
│  └─ weakness │  └─ avgCTC    └─ testCases[]     ├─ score           │  ├─ description
├─ bookmarks[] ├─ logo                             ├─ accuracy        │  ├─ questionsAsked
└─ createdAt   └─ color                            └─ completedAt     │  └─ tips
                                                                      ├─ overallTips
                                                                      ├─ upvotes[]
                                                                      └─ createdAt
```

---

## 🎨 Design System

- **Font**: Outfit (Google Fonts)
- **Theme**: Dark mode with glassmorphism
- **Colors**: Purple (#8B5CF6), Blue (#3B82F6), Pink (#EC4899) neon accents
- **Animations**: Framer Motion page transitions and micro-interactions
- **Charts**: Recharts (Radar, Line, Bar)

---

## 📝 Coding Problems Included

| Difficulty | Count | Examples |
|---|---|---|
| **Easy** | 10 | Two Sum, FizzBuzz, Fibonacci, Palindrome Check, Reverse String |
| **Medium** | 23 | Valid Parentheses, Kadane's Algorithm, Binary Search, Group Anagrams, Climbing Stairs, Three Sum |
| **Hard** | 10 | Trapping Rain Water, N-Queens, Coin Change, Edit Distance, LIS, Minimum Window Substring |

All problems have **multiple test cases** and work with the in-browser **Monaco Editor + cloud execution**.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Raghav Taneja**

---

> Built with ❤️ for placement preparation

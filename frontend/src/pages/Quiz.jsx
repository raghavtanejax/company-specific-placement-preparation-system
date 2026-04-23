import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, ArrowRight, Play, Bookmark, BookmarkCheck } from 'lucide-react';
import Editor from '@monaco-editor/react';
import './Quiz.css';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const skills = searchParams.get('skills') || '';
  const company = searchParams.get('company') || '';
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerTested, setIsAnswerTested] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quizFinished, setQuizFinished] = useState(false);
  const [executionResult, setExecutionResult] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  
  // Tracking for quiz history
  const [questionResults, setQuestionResults] = useState([]); // per-question results
  const questionStartTime = useRef(Date.now());
  const quizStartTime = useRef(Date.now());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Build query params
        const params = new URLSearchParams();
        if (skills) params.set('skills', skills);
        if (company) params.set('company', company);

        const { data } = await api.get(`/questions/recommend?${params.toString()}`);
        if (data.length === 0) {
          // If no specific results, fetch generic
          const genericData = await api.get('/questions/recommend');
          setQuestions(genericData.data);
        } else {
          setQuestions(data);
        }

        // Fetch user bookmarks
        try {
          const bmRes = await api.get('/user/bookmarks');
          setBookmarkedIds(new Set(bmRes.data.map((b) => b._id)));
        } catch (e) {
          // ignore bookmark fetch errors
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
        quizStartTime.current = Date.now();
        questionStartTime.current = Date.now();
      }
    };
    fetchData();
  }, [skills, company]);

  useEffect(() => {
    if (loading || quizFinished || isAnswerTested) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion(true); // auto fail on timeout
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentIndex, loading, quizFinished, isAnswerTested]);

  const handleSelectOption = (optionId) => {
    if (isAnswerTested) return;
    setSelectedOption(optionId);
  };

  const toggleBookmark = async (questionId) => {
    try {
      const { data } = await api.post(`/user/bookmarks/${questionId}`);
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (data.isBookmarked) {
          next.add(questionId);
        } else {
          next.delete(questionId);
        }
        return next;
      });
    } catch (e) {
      console.error('Failed to toggle bookmark', e);
    }
  };

  const checkAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerTested(true);
    const currentQ = questions[currentIndex];
    const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
    
    let isCorrect = false;
    if (currentQ.type === 'mcq') {
      isCorrect = currentQ.options[selectedOption].isCorrect;
      if (isCorrect) setScore(s => s + 1);
    } else {
      // For coding, consider it correct if they submitted (simplified)
      isCorrect = true;
      setScore(s => s + 1);
    }

    // Track this question's result
    setQuestionResults((prev) => [
      ...prev,
      {
        questionId: currentQ._id,
        selectedAnswer: selectedOption,
        isCorrect,
        timeTaken,
      },
    ]);
  };

  const runCode = async () => {
    if (!selectedOption) return;
    setIsExecuting(true);
    setExecutionResult('Executing in cloud environment...');
    try {
      const response = await fetch('https://emacsx.com/api/v2/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'javascript',
          version: '18.15.0',
          files: [{ content: selectedOption }],
          stdin: questions[currentIndex]?.testCases?.[0]?.input || ''
        })
      });
      const data = await response.json();
      setExecutionResult(data.run?.stderr ? data.run?.stderr : data.run?.output || 'No output generated');
    } catch (err) {
      setExecutionResult('Error: ' + err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleNextQuestion = async (isTimeout = false) => {
    // If timeout, record a failed result for this question
    if (isTimeout && !isAnswerTested) {
      const currentQ = questions[currentIndex];
      const timeTaken = 60;
      setQuestionResults((prev) => [
        ...prev,
        {
          questionId: currentQ._id,
          selectedAnswer: null,
          isCorrect: false,
          timeTaken,
        },
      ]);
    }

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswerTested(false);
      setExecutionResult('');
      setTimeLeft(60);
      questionStartTime.current = Date.now();
    } else {
      // Quiz finished — save to history
      setQuizFinished(true);
      const finalScore = score + (!isTimeout && selectedOption !== null && !isAnswerTested ? 0 : 0);
      const totalDuration = Math.round((Date.now() - quizStartTime.current) / 1000);
      const accuracy = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

      // Compute skill-level accuracy for updating user profile
      const skillAccuracy = {};
      questionResults.forEach((qr) => {
        const q = questions.find((qq) => qq._id === qr.questionId);
        if (q && q.skills) {
          q.skills.forEach((skill) => {
            if (!skillAccuracy[skill]) skillAccuracy[skill] = { correct: 0, total: 0 };
            skillAccuracy[skill].total += 1;
            if (qr.isCorrect) skillAccuracy[skill].correct += 1;
          });
        }
      });

      const updateSkills = {};
      Object.entries(skillAccuracy).forEach(([skill, data]) => {
        updateSkills[skill] = Math.round((data.correct / data.total) * 100);
      });

      try {
        // Save quiz attempt to history
        await api.post('/quiz/save', {
          company: company || null,
          skills: [...new Set(questions.flatMap((q) => q.skills || []))],
          questions: questionResults,
          score,
          totalQuestions: questions.length,
          accuracy,
          duration: totalDuration,
        });

        // Update user performance
        await api.put('/user/performance', {
          questionsAttempted: questions.length,
          correctAnswers: score,
          updateSkills,
        });
      } catch (e) {
        console.error('Failed to save performance', e);
      }
    }
  };

  if (loading) return <div className="loading">Generating personalized questions...</div>;
  if (questions.length === 0) return <div className="loading">No questions found. Try adding more questions to DB.</div>;

  if (quizFinished) {
    const accuracy = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-container">
        <motion.div 
          className="quiz-results glass-panel text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Trophy size={64} color="var(--neon-purple)" className="mx-auto mb-4" />
          <h2 className="text-gradient mb-2">Quiz Completed!</h2>
          <p className="result-score mb-2">You scored {score} out of {questions.length}</p>
          <p className="result-accuracy" style={{ fontSize: '2rem', fontWeight: 700, color: accuracy >= 70 ? '#34d399' : accuracy >= 40 ? '#fcd34d' : '#f87171' }}>
            {accuracy}%
          </p>
          {company && (
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Company: <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{company}</span>
            </p>
          )}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Dashboard
            </button>
            <button onClick={() => navigate('/history')} className="btn btn-primary">
              View History
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="question-counter">Question {currentIndex + 1} of {questions.length}</span>
          {company && <span className="company-tag" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{company}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => toggleBookmark(question._id)}
            className="bookmark-toggle"
            title={bookmarkedIds.has(question._id) ? 'Remove bookmark' : 'Bookmark this question'}
          >
            {bookmarkedIds.has(question._id) ? (
              <BookmarkCheck size={20} color="var(--neon-purple)" />
            ) : (
              <Bookmark size={20} />
            )}
          </button>
          <div className={`timer ${timeLeft <= 10 ? 'timer-danger' : ''}`}>
            <Clock size={16} /> 00:{timeLeft.toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      <div className="progress-bar-container full-width mb-6">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%`, background: 'var(--gradient-primary)' }}
        ></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="question-card glass-panel"
        >
          <div className="question-meta">
            <span className="tag">{question.difficulty}</span>
            {question.skills.map(s => <span key={s} className="tag">{s}</span>)}
          </div>
          
          <h2 className="question-title">{question.title}</h2>
          {question.description && question.description !== question.title && (
            <p className="question-desc">{question.description}</p>
          )}

          {question.type === 'mcq' ? (
            <div className="options-grid">
              {question.options.map((option, idx) => {
                let btnClass = "option-btn";
                if (selectedOption === idx) btnClass += " selected";
                if (isAnswerTested) {
                  if (option.isCorrect) btnClass += " correct";
                  else if (selectedOption === idx && !option.isCorrect) btnClass += " wrong";
                }

                return (
                  <button 
                    key={idx} 
                    className={btnClass}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswerTested}
                  >
                    <span className="option-text">{option.text}</span>
                    {isAnswerTested && option.isCorrect && <CheckCircle className="status-icon" color="#10b981" />}
                    {isAnswerTested && !option.isCorrect && selectedOption === idx && <XCircle className="status-icon" color="#ef4444" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="coding-area flex flex-col gap-4">
              <div className="editor-wrapper rounded-xl overflow-hidden border border-[rgba(255,255,255,0.1)]">
                <Editor
                  height="300px"
                  defaultLanguage="javascript"
                  theme="vs-dark"
                  value={selectedOption || `// Write your optimized JavaScript solution here\nfunction solve() {\n  \n}\n`}
                  onChange={(value) => handleSelectOption(value)}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    readOnly: isAnswerTested
                  }}
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={runCode} 
                  disabled={isExecuting || !selectedOption}
                  className="btn btn-secondary flex-1 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                >
                  <Play size={18} className={isExecuting ? 'animate-pulse text-emerald-400' : 'text-emerald-400'} />
                  {isExecuting ? 'Running...' : 'Run Code against Testcases'}
                </button>
              </div>

              {(executionResult || isAnswerTested) && (
                <div className="mt-2 p-4 rounded-xl bg-black/40 border border-gray-700/50">
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Console Output:</p>
                  <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">{executionResult || 'No output yet'}</pre>
                  
                  {isAnswerTested && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                      <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Expected Test Cases:</p>
                      {question.testCases && question.testCases.map((tc, i) => (
                        <div key={i} className="text-sm font-mono text-gray-300 mb-1">
                          <span className="text-blue-400">In:</span> {tc.input} | <span className="text-emerald-400">Out:</span> {tc.expectedOutput}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="quiz-actions mt-6">
            {!isAnswerTested ? (
              <button 
                className="btn btn-primary w-full shadow-lg shadow-purple-500/20" 
                onClick={checkAnswer} 
                disabled={selectedOption === null}
              >
                Submit Final Answer
              </button>
            ) : (
              <button 
                className="btn btn-primary w-full pulse-btn" 
                onClick={() => handleNextQuestion(false)}
              >
                {currentIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'} <ArrowRight size={18} />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Quiz;

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, ArrowRight, Play } from 'lucide-react';
import Editor from '@monaco-editor/react';
import './Quiz.css';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const skills = searchParams.get('skills') || '';
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
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get(`/questions/recommend?skills=${skills}`);
        if(data.length === 0) {
          // If no specific skills found, fetch generic
          const genericData = await api.get('/questions/recommend');
          setQuestions(genericData.data);
        } else {
          setQuestions(data);
        }
      } catch (err) {
        console.error('Failed to load questions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [skills]);

  useEffect(() => {
    if (loading || quizFinished || isAnswerTested) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion(false); // auto fail
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

  const checkAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerTested(true);
    const currentQ = questions[currentIndex];
    if (currentQ.type === 'mcq') {
      const isCorrect = currentQ.options[selectedOption].isCorrect;
      if (isCorrect) setScore(s => s + 1);
    } else {
      setScore(s => s + 1);
    }
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

  const handleNextQuestion = async (auto = false) => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswerTested(false);
      setTimeLeft(60);
    } else {
      // Quiz finished, save performance
      setQuizFinished(true);
      try {
        await api.put('/user/performance', {
          questionsAttempted: questions.length,
          correctAnswers: score + (auto ? 0 : (selectedOption !== null && questions[currentIndex].options[selectedOption].isCorrect ? 1 : 0)),
          updateSkills: {} // Simplified for now
        });
      } catch (e) {
        console.error("Failed to save performance");
      }
    }
  };

  if (loading) return <div className="loading">Generating personalized questions...</div>;
  if (questions.length === 0) return <div className="loading">No questions found. Try adding more questions to DB.</div>;

  if (quizFinished) {
    return (
      <div className="quiz-container">
        <motion.div 
          className="quiz-results glass-panel text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Trophy size={64} color="var(--neon-purple)" className="mx-auto mb-4" />
          <h2 className="text-gradient mb-2">Quiz Completed!</h2>
          <p className="result-score mb-6">You scored {score} out of {questions.length}</p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const question = questions[currentIndex];

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <span className="question-counter">Question {currentIndex + 1} of {questions.length}</span>
        <div className={`timer ${timeLeft <= 10 ? 'timer-danger' : ''}`}>
          <Clock size={16} /> 00:{timeLeft.toString().padStart(2, '0')}
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

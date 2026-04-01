import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Trophy, ArrowRight } from 'lucide-react';
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
    const isCorrect = currentQ.options[selectedOption].isCorrect;
    if (isCorrect) setScore(s => s + 1);
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
            <div className="coding-area">
              <textarea 
                className="form-input code-editor" 
                placeholder="Write your code here..."
                onChange={(e) => handleSelectOption(e.target.value)}
                disabled={isAnswerTested}
                rows={10}
                style={{ fontFamily: 'monospace', width: '100%', padding: '15px' }}
              ></textarea>
              {isAnswerTested && (
                <div className="mt-4 p-4 rounded bg-gray-800 border border-gray-600">
                  <p className="text-sm text-gray-400 mb-2">Expected Output / Test Cases:</p>
                  <pre className="text-sm">
                    {question.testCases && question.testCases.map((tc, i) => (
                      <div key={i}>Input: {tc.input} | Output: {tc.expectedOutput}</div>
                    ))}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="quiz-actions mt-6">
            {!isAnswerTested ? (
              <button 
                className="btn btn-primary w-full" 
                onClick={checkAnswer} 
                disabled={selectedOption === null}
              >
                Submit Answer
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
